"use client";

import React, { useState } from "react";

import {
  IconMicrophone,
  IconPlayerStop,
  IconCircle,
} from "@tabler/icons-react";

interface VoiceRecorderProps {
  onTextChange: (text: string) => void;
  currentText: string;
}

export default function VoiceRecorder({
  onTextChange,
  currentText,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);

  const handleRecordClick = () => {
    if (!isRecording) {
      // Start recording
      setIsRecording(true);
      console.log("Started recording");
    } else {
      // Stop recording
      setIsRecording(false);
      console.log("Stopped recording");
    }
  };

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
          className="w-20 h-20 rounded-full transition-all duration-200 flex items-center justify-center text-white shadow-lg"
          style={{
            backgroundColor: "var(--primary)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--sidebar-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--primary)";
          }}
        >
          {!isRecording ? (
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
          {!isRecording
            ? "Click to start recording"
            : "Click to terminate and send to AI"}
        </p>
      </div>
    </div>
  );
}
