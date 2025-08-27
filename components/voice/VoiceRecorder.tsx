"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { IconMicrophone, IconPlayerStop } from "@tabler/icons-react";

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
  onSubmit: (transcribedText: string) => Promise<void>;
}

export default function VoiceRecorder({ onSubmit }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  // const [finalTranscript, setFinalTranscript] = useState("");
  // const [interimTranscript, setInterimTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingPunctuation, setIsProcessingPunctuation] = useState(false);
  // const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef("");

  // const addDebugLog = (message: string) => {
  //   const timestamp = new Date().toLocaleTimeString();
  //   const logEntry = `[${timestamp}] ${message}`;
  //   setDebugLogs((prev) => [...prev.slice(-20), logEntry]); // Keep last 20 logs
  //   console.log(message);
  // };

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
        console.warn("Punctuation API failed, using original text");
        return text;
      }

      const data = await response.json();
      return data.punctuatedText || text;
    } catch {
      console.warn("Punctuation processing failed");
      return text; // Fallback to original text
    } finally {
      setIsProcessingPunctuation(false);
    }
  };

  const processFinalTranscript = useCallback(
    async (text: string) => {
      const punctuatedText = await addPunctuation(text.trim());
      await onSubmit(punctuatedText);

      // Clear transcripts after sending
      // setFinalTranscript("");
      // setInterimTranscript("");
      finalTranscriptRef.current = "";
    },
    [onSubmit]
  );

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
      // addDebugLog("🎤 Recording started");
      setIsLoading(false);
      setIsRecording(true);
      // setInterimTranscript("");
    };

    const handleEnd = () => {
      // addDebugLog("🛑 Recording ended naturally");
      // addDebugLog(`📝 Final transcript accumulated: "${finalTranscriptRef.current}"`);
      // addDebugLog(`📝 Final transcript length: ${finalTranscriptRef.current.length}`);

      setIsRecording(false);
      // setInterimTranscript("");

      // Process any remaining final transcript when recording ends naturally
      if (finalTranscriptRef.current.trim()) {
        // addDebugLog("✅ Processing final transcript on natural end");
        processFinalTranscript(finalTranscriptRef.current.trim());
      } else {
        // addDebugLog("❌ No final transcript to process");
      }
    };

    const handleError = () => {
      // addDebugLog(`❌ Speech recognition error: ${event.error}`);
      // addDebugLog(`📝 Final transcript at error: "${finalTranscriptRef.current}"`);
      setIsRecording(false);
      setIsLoading(false);
      // setInterimTranscript("");
    };

    const handleResult = (event: SpeechRecognitionEvent) => {
      // addDebugLog(`🎯 Speech result received, resultIndex: ${event.resultIndex}`);
      // addDebugLog(`📊 Total results: ${event.results.length}`);

      let newFinalTranscript = "";

      // Process results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcriptText = result[0].transcript;

        // addDebugLog(`  Result ${i}: "${transcriptText}" (isFinal: ${result.isFinal})`);

        if (result.isFinal) {
          newFinalTranscript += transcriptText + " ";
        } else {
          // currentInterimTranscript += transcriptText;
        }
      }

      // Update final transcript if we have new final results
      if (newFinalTranscript) {
        // addDebugLog(`✅ Adding to final transcript: "${newFinalTranscript}"`);
        finalTranscriptRef.current += newFinalTranscript;
        // addDebugLog(`📝 Total accumulated transcript: "${finalTranscriptRef.current}"`);
        // setFinalTranscript(finalTranscriptRef.current);
      }

      // Update interim transcript
      // if (currentInterimTranscript) {
      //   addDebugLog(`🔄 Interim transcript: "${currentInterimTranscript}"`);
      // }
      // setInterimTranscript(currentInterimTranscript);
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
        } catch {
          // Silent cleanup
        }
      }
    };
  }, [processFinalTranscript]);

  const startRecording = async () => {
    if (!isSupported) {
      return;
    }

    try {
      setIsLoading(true);
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      // Always clear transcripts when starting a new recording session
      // addDebugLog("🧹 Clearing transcripts for new session");
      // setFinalTranscript("");
      // setInterimTranscript("");
      finalTranscriptRef.current = "";
      // addDebugLog("🚀 Starting speech recognition");
      recognitionRef.current?.start();
    } catch {
      // addDebugLog(`❌ Failed to start recording: ${error}`);
      setIsLoading(false);
    }
  };

  const stopRecording = async () => {
    // addDebugLog("🛑 Manual stop clicked");
    // addDebugLog(`📝 Final transcript at manual stop: "${finalTranscriptRef.current}"`);

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);

    // Process final transcript with punctuation
    if (finalTranscriptRef.current.trim()) {
      // addDebugLog("✅ Processing final transcript on manual stop");
      await processFinalTranscript(finalTranscriptRef.current.trim());
    } else {
      // addDebugLog("❌ No final transcript to process on manual stop");
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
          Web Speech API speech recognition is not supported in this browser.
          Safari does not support speech recognition. Please use Chrome or Edge
          for voice recording.
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
                className="absolute inset-0 w-8 h-8 rounded-full border-3 animate-ping"
                style={{ borderColor: "var(--primary)" }}
              />
              <div
                className="absolute inset-0 w-8 h-8 rounded-full border-3 animate-ping"
                style={{
                  borderColor: "var(--primary)",
                  animationDelay: "1s",
                }}
              />
            </>
          )}
          {/* Core ring - always visible */}
          <div
            className={`w-8 h-8 rounded-full border-3 bg-transparent ${
              isRecording ? "border-primary" : "border-foreground/30"
            }`}
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

        {/* DEBUG: Real-time Transcript Display */}
        {/* {(finalTranscript || interimTranscript) && (
          <div className="w-full max-w-md mt-4 p-4 bg-white border border-gray-300 rounded-lg shadow-sm">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Live Transcript:
            </h4>
            {finalTranscript && (
              <div className="mb-3">
                <div className="text-xs text-gray-500 mb-1">Final:</div>
                <div className="text-sm text-gray-800 bg-green-50 p-2 rounded border-l-4 border-green-400">
                  {finalTranscript}
                </div>
              </div>
            )}
            {interimTranscript && (
              <div>
                <div className="text-xs text-gray-500 mb-1">Interim:</div>
                <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded border-l-4 border-blue-400 italic">
                  {interimTranscript}
                </div>
              </div>
            )}
          </div>
        )} */}

        {/* Cancel Button - Only show when recording */}
        {isRecording && (
          <button
            onClick={() => {
              // Remove event listeners first to prevent handleEnd from firing
              if (recognitionRef.current) {
                recognitionRef.current.onend = null;
                recognitionRef.current.onresult = null;
                recognitionRef.current.stop();
              }
              setIsRecording(false);
              // setInterimTranscript("");
              // setFinalTranscript("");
              finalTranscriptRef.current = "";
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Cancel Recording
          </button>
        )}

        {/* DEBUG: Debug Logs Display */}
        {/* {debugLogs.length > 0 && (
          <div className="w-full max-w-md mt-4 p-3 bg-gray-100 border border-gray-300 rounded-lg max-h-60 overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-semibold text-gray-700">
                Debug Logs:
              </h4>
              <button
                onClick={() => setDebugLogs([])}
                className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Clear Logs
              </button>
            </div>
            <div className="space-y-1">
              {debugLogs.map((log, index) => (
                <div key={index} className="text-xs text-gray-600 font-mono">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
}
