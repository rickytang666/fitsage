"use client";

import React, { useState, useRef, useEffect } from "react";
import logger from "@/utils/logger";

import {
  IconMicrophone,
  IconPlayerStop,
  IconCircle,
} from "@tabler/icons-react";

// Type declarations for Web Speech API
type SpeechRecognitionErrorEvent = Event & {
  error: string;
};

type SpeechRecognitionResult = {
  isFinal: boolean;
  [index: number]: {
    transcript: string;
  };
};

type SpeechRecognitionEvent = Event & {
  resultIndex: number;
  results: {
    [index: number]: SpeechRecognitionResult;
    length: number;
  };
};

type SpeechRecognition = EventTarget & {
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onerror:
    | ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void)
    | null;
  onresult:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void)
    | null;
};

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface VoiceRecorderProps {
  onTextChange: (text: string) => void;
  currentText: string;
  onSubmit: (transcribedText: string) => Promise<void>;
}

export default function VoiceRecorder({
  onTextChange,
  currentText,
  onSubmit,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingPunctuation, setIsProcessingPunctuation] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef("");

  // Check if Web Speech API is supported
  useEffect(() => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      setIsSupported(false);
      return;
    }

    // Initialize SpeechRecognition
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;

    const handleStart = () => {
      setIsLoading(false);
      setIsRecording(true);
      setInterimTranscript("");
    };

    const handleEnd = () => {
      setIsRecording(false);
      setInterimTranscript("");
    };

    const handleError = (event: SpeechRecognitionErrorEvent) => {
      setIsRecording(false);
      setIsLoading(false);
      setInterimTranscript("");
    };

    const handleResult = (event: SpeechRecognitionEvent) => {
      let currentInterimTranscript = "";
      let newFinalTranscript = "";

      // Process results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcriptText = result[0].transcript;

        if (result.isFinal) {
          newFinalTranscript += transcriptText + " ";
        } else {
          currentInterimTranscript += transcriptText;
        }
      }

      // Update final transcript if we have new final results
      if (newFinalTranscript) {
        finalTranscriptRef.current += newFinalTranscript;
        setFinalTranscript(finalTranscriptRef.current);
      }

      // Update interim transcript
      setInterimTranscript(currentInterimTranscript);
    };

    // Attach event listeners
    recognitionRef.current.onstart = handleStart;
    recognitionRef.current.onend = handleEnd;
    recognitionRef.current.onerror = handleError;
    recognitionRef.current.onresult = handleResult;

    setIsSupported(true);

    // Cleanup function
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          recognitionRef.current.onstart = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onresult = null;
        } catch (error) {
          // Silent cleanup
        }
      }
    };
  }, []);

  const startRecording = async () => {
    if (!isSupported) {
      return;
    }

    try {
      setIsLoading(true);
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      // Always clear transcripts when starting a new recording session
      setFinalTranscript("");
      setInterimTranscript("");
      finalTranscriptRef.current = "";
      recognitionRef.current?.start();
    } catch (error) {
      setIsLoading(false);
    }
  };

  const addPunctuation = async (text: string): Promise<string> => {
    try {
      setIsProcessingPunctuation(true);

      const response = await fetch("/api/punctuation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: text.trim() }),
      });

      if (!response.ok) {
        logger.warn("Punctuation API failed, using original text");
        return text;
      }

      const data = await response.json();
      logger.debug("Punctuation processing completed successfully");
      return data.punctuatedText || text;
    } catch (error) {
      logger.warn("Punctuation processing failed:", error);
      return text; // Fallback to original text
    } finally {
      setIsProcessingPunctuation(false);
    }
  };

  const stopRecording = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);

    // Process final transcript with punctuation
    if (finalTranscript.trim()) {
      const punctuatedText = await addPunctuation(finalTranscript.trim());
      onSubmit(punctuatedText);
      // Clear transcripts after sending
      setFinalTranscript("");
      setInterimTranscript("");
      finalTranscriptRef.current = "";
    }
  };

  const handleRecordClick = () => {
    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  };

  if (!isSupported) {
    return (
      <div className="w-full mb-4 p-4 bg-yellow-100 border border-yellow-400 rounded-lg">
        <p className="text-yellow-800 text-center">
          Web Speech API is not supported in your browser. Please use Chrome,
          Edge, or Safari for voice recording.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full mb-4">
      {/* Voice Recording UI */}
      <div className="flex flex-col items-center justify-center space-y-4">
        {/* Recording Indicator with Wave Animation */}
        <div className="relative">
          {isRecording && (
            <>
              {/* Wave rings */}
              <div
                className="absolute inset-0 w-8 h-8 rounded-full border-2 animate-ping"
                style={{ borderColor: "var(--primary)" }}
              />
              <div
                className="absolute inset-0 w-8 h-8 rounded-full border-2 animate-ping"
                style={{
                  borderColor: "var(--primary)",
                  animationDelay: "0.5s",
                }}
              />
              <div
                className="absolute inset-0 w-8 h-8 rounded-full border-2 animate-ping"
                style={{
                  borderColor: "var(--primary)",
                  animationDelay: "1s",
                }}
              />
            </>
          )}
          <IconCircle
            size={32}
            style={{
              color: isRecording ? "var(--primary)" : "var(--muted-foreground)",
            }}
          />
        </div>

        {/* Main Button */}
        <button
          onClick={handleRecordClick}
          disabled={isLoading || isProcessingPunctuation}
          className="w-20 h-20 rounded-full transition-all duration-200 flex items-center justify-center text-white shadow-lg disabled:opacity-50"
          style={{
            backgroundColor: "var(--primary)",
          }}
          onMouseEnter={(e) => {
            if (!isLoading && !isProcessingPunctuation) {
              e.currentTarget.style.backgroundColor = "var(--sidebar-primary)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading && !isProcessingPunctuation) {
              e.currentTarget.style.backgroundColor = "var(--primary)";
            }
          }}
        >
          {isLoading || isProcessingPunctuation ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          ) : !isRecording ? (
            <IconMicrophone size={32} />
          ) : (
            <IconPlayerStop size={32} />
          )}
        </button>

        {/* Status Text */}
        <p
          className="text-sm text-center"
          style={{ color: "var(--muted-foreground)" }}
        >
          {isLoading
            ? "Requesting microphone access..."
            : isProcessingPunctuation
            ? "Adding punctuation..."
            : !isRecording
            ? "Click to start recording"
            : "Click to stop and send to AI"}
        </p>
      </div>
    </div>
  );
}
