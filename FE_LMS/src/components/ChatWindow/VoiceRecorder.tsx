import React, { useState, useRef, useCallback, useEffect } from "react";
import { Send, X, Pause, Play, Loader2, Mic } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";

// Convert audio blob to WAV format (widely supported)
const convertToWav = async (audioBlob: Blob): Promise<Blob> => {
  const audioContext = new AudioContext();
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
  // Create WAV file
  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length;
  
  // Interleave channels
  const interleaved = new Float32Array(length * numberOfChannels);
  for (let channel = 0; channel < numberOfChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      interleaved[i * numberOfChannels + channel] = channelData[i];
    }
  }
  
  // Convert to 16-bit PCM
  const pcmData = new Int16Array(interleaved.length);
  for (let i = 0; i < interleaved.length; i++) {
    const s = Math.max(-1, Math.min(1, interleaved[i]));
    pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  
  // Create WAV header
  const wavBuffer = new ArrayBuffer(44 + pcmData.length * 2);
  const view = new DataView(wavBuffer);
  
  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + pcmData.length * 2, true);
  writeString(view, 8, 'WAVE');
  
  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true); // audio format (PCM)
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numberOfChannels * 2, true); // byte rate
  view.setUint16(32, numberOfChannels * 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  
  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, pcmData.length * 2, true);
  
  // Write PCM data
  const pcmOffset = 44;
  for (let i = 0; i < pcmData.length; i++) {
    view.setInt16(pcmOffset + i * 2, pcmData[i], true);
  }
  
  await audioContext.close();
  
  // Return as mp3 mime type for backend compatibility
  return new Blob([wavBuffer], { type: 'audio/mpeg' });
};

const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

interface VoiceRecorderProps {
  onSend: (audioBlob: Blob, duration: number) => void;
  onCancel: () => void;
  isRecording: boolean;
  setIsRecording: (value: boolean) => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onSend,
  onCancel,
  isRecording,
  setIsRecording,
}) => {
  const { darkMode } = useTheme();
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [visualizerData, setVisualizerData] = useState<number[]>(new Array(20).fill(0));
  const [hasStarted, setHasStarted] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const hasStartedRef = useRef(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const startVisualization = useCallback((stream: MediaStream) => {
    audioContextRef.current = new AudioContext();
    analyserRef.current = audioContextRef.current.createAnalyser();
    const source = audioContextRef.current.createMediaStreamSource(stream);
    source.connect(analyserRef.current);
    analyserRef.current.fftSize = 64;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateVisualizer = () => {
      if (!analyserRef.current || isPaused) {
        animationFrameRef.current = requestAnimationFrame(updateVisualizer);
        return;
      }

      analyserRef.current.getByteFrequencyData(dataArray);
      const normalized = Array.from(dataArray.slice(0, 20)).map((v) => v / 255);
      setVisualizerData(normalized);
      animationFrameRef.current = requestAnimationFrame(updateVisualizer);
    };

    updateVisualizer();
  }, [isPaused]);

  const startRecording = useCallback(async () => {
    if (hasStartedRef.current) return; // Prevent double start
    hasStartedRef.current = true;
    setIsInitializing(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4",
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType,
        });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };

      mediaRecorder.start(100);
      setIsInitializing(false);
      setHasStarted(true);
      setDuration(0);

      startVisualization(stream);

      // Use window.setInterval for browser compatibility
      timerRef.current = window.setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      hasStartedRef.current = false;
      setIsInitializing(false);
      toast.error("Could not access microphone. Please check permissions.");
      onCancel();
    }
  }, [startVisualization, onCancel]);

  // Auto-start recording when component mounts with isRecording=true
  useEffect(() => {
    if (isRecording && !hasStartedRef.current && !audioBlob) {
      startRecording();
    }
  }, [isRecording, audioBlob, startRecording]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    hasStartedRef.current = false;
    setHasStarted(false);
    setIsRecording(false);
    setIsPaused(false);
  }, [setIsRecording]);

  const handlePauseResume = useCallback(() => {
    if (!mediaRecorderRef.current) return;

    if (isPaused) {
      mediaRecorderRef.current.resume();
      timerRef.current = window.setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      mediaRecorderRef.current.pause();
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    setIsPaused(!isPaused);
  }, [isPaused]);

  const handleCancel = useCallback(() => {
    stopRecording();
    setAudioBlob(null);
    hasStartedRef.current = false;
    setHasStarted(false);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setDuration(0);
    setVisualizerData(new Array(20).fill(0));
    onCancel();
  }, [stopRecording, audioUrl, onCancel]);

  const handleSend = useCallback(async () => {
    // Stop recording first if still recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    const currentDuration = duration;

    // Wait for onstop to set the blob, then convert and send
    setTimeout(async () => {
      const originalBlob = new Blob(audioChunksRef.current, {
        type: mediaRecorderRef.current?.mimeType || "audio/webm",
      });
      
      if (originalBlob.size > 0) {
        try {
          // Convert to MP3-compatible format
          const mp3Blob = await convertToWav(originalBlob);
          onSend(mp3Blob, currentDuration);
        } catch (error) {
          console.error("Error converting audio:", error);
          // Fallback: send original blob
          onSend(originalBlob, currentDuration);
        }
      }
      
      // Clean up
      hasStartedRef.current = false;
      setHasStarted(false);
      setIsRecording(false);
      setIsPaused(false);
      setAudioBlob(null);
      setAudioUrl(null);
      setDuration(0);
      setVisualizerData(new Array(20).fill(0));
      onCancel();
    }, 100);
  }, [duration, onSend, onCancel, setIsRecording]);

  const togglePlayback = useCallback(() => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, audioUrl]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [audioUrl]);

  // Initializing state - show loading spinner
  if (isInitializing) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{
          backgroundColor: darkMode ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.05)",
          border: `1px solid ${darkMode ? "rgba(239, 68, 68, 0.3)" : "rgba(239, 68, 68, 0.2)"}`,
        }}
      >
        <Loader2 className="size-4 text-red-500 animate-spin" />
        <span className="text-sm" style={{ color: darkMode ? "#fca5a5" : "#dc2626" }}>
          Requesting microphone access...
        </span>
        <button
          onClick={handleCancel}
          className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors ml-auto"
          title="Cancel"
        >
          <X className="size-3 text-red-500" />
        </button>
      </div>
    );
  }

  // Recording state - show visualizer and controls
  if (isRecording && hasStarted) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{
          backgroundColor: darkMode ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.05)",
          border: `1px solid ${darkMode ? "rgba(239, 68, 68, 0.3)" : "rgba(239, 68, 68, 0.2)"}`,
        }}
      >
        {/* Cancel button (X) */}
        <button
          onClick={handleCancel}
          className="p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          title="Cancel recording"
        >
          <X className="size-5 text-red-500" />
        </button>

        {/* Duration */}
        <span
          className="text-sm font-mono min-w-[40px]"
          style={{ color: darkMode ? "#fca5a5" : "#dc2626" }}
        >
          {formatTime(duration)}
        </span>

        {/* Visualizer */}
        <div className="flex items-center gap-0.5 flex-1 h-6 px-2">
          {visualizerData.map((value, index) => (
            <div
              key={index}
              className="w-1 rounded-full transition-all duration-75"
              style={{
                height: `${Math.max(4, value * 24)}px`,
                backgroundColor: isPaused
                  ? darkMode ? "#64748b" : "#94a3b8"
                  : darkMode ? "#f87171" : "#ef4444",
              }}
            />
          ))}
        </div>

        {/* Pause/Resume button */}
        <button
          onClick={handlePauseResume}
          className="p-1.5 rounded-full transition-colors"
          style={{
            backgroundColor: darkMode ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.1)",
          }}
          title={isPaused ? "Resume" : "Pause"}
        >
          {isPaused ? (
            <Play className="size-4 text-red-500" />
          ) : (
            <Pause className="size-4 text-red-500" />
          )}
        </button>

        {/* Send button (>) */}
        <button
          onClick={handleSend}
          className="p-2 rounded-full bg-indigo-500 hover:bg-indigo-600 transition-colors"
          title="Send voice message"
        >
          <Send className="size-4 text-white" />
        </button>
      </div>
    );
  }

  // Preview state - show recorded audio with playback
  if (audioBlob && audioUrl) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{
          backgroundColor: darkMode ? "rgba(99, 102, 241, 0.1)" : "rgba(99, 102, 241, 0.05)",
          border: `1px solid ${darkMode ? "rgba(99, 102, 241, 0.3)" : "rgba(99, 102, 241, 0.2)"}`,
        }}
      >
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />

        {/* Cancel button */}
        <button
          onClick={handleCancel}
          className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          title="Discard"
        >
          <X className="size-4" style={{ color: darkMode ? "#94a3b8" : "#64748b" }} />
        </button>

        {/* Play/Pause button */}
        <button
          onClick={togglePlayback}
          className="p-1.5 rounded-full transition-colors"
          style={{
            backgroundColor: darkMode ? "rgba(99, 102, 241, 0.2)" : "rgba(99, 102, 241, 0.1)",
          }}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="size-4 text-indigo-500" />
          ) : (
            <Play className="size-4 text-indigo-500" />
          )}
        </button>

        {/* Duration */}
        <span
          className="text-sm font-mono flex-1"
          style={{ color: darkMode ? "#a5b4fc" : "#4f46e5" }}
        >
          Voice message • {formatTime(duration)}
        </span>

        {/* Send button */}
        <button
          onClick={handleSend}
          className="p-2 rounded-full bg-indigo-500 hover:bg-indigo-600 transition-colors"
          title="Send voice message"
        >
          <Send className="size-4 text-white" />
        </button>
      </div>
    );
  }

  // Default state - show mic button
  return (
    <button
      onClick={startRecording}
      className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
      title="Record voice message"
    >
      <Mic className="size-4" style={{ color: darkMode ? "#94a3b8" : "#64748b" }} />
    </button>
  );
};

export default VoiceRecorder;
