import React, { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";

interface AudioPlayerProps {
  src: string;
  duration?: number;
  isSender?: boolean;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, duration: initialDuration, isSender = false }) => {
  const { darkMode } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      // Pause any other playing audio
      document.querySelectorAll("audio").forEach((a) => {
        if (a !== audio) a.pause();
      });
      audio.play().catch(console.error);
    }
  }, [isPlaying]);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const progressBar = progressRef.current;
    if (!audio || !progressBar || !duration) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;

    audio.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration]);

  const cyclePlaybackRate = useCallback(() => {
    const rates = [1, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoaded(true);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    // If already loaded
    if (audio.readyState >= 2) {
      handleLoadedMetadata();
    }

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Generate waveform bars (simulated static waveform)
  const waveformBars = Array.from({ length: 30 }, (_, i) => {
    // Create a pseudo-random but consistent pattern based on index
    const seed = (i * 7 + 3) % 10;
    const height = 20 + seed * 6 + Math.sin(i * 0.5) * 15;
    return Math.min(100, Math.max(20, height));
  });

  return (
    <div
      className="flex items-center gap-2 p-2 rounded-xl min-w-[200px] max-w-[280px]"
      style={{
        backgroundColor: isSender
          ? "rgba(255, 255, 255, 0.1)"
          : darkMode
          ? "rgba(71, 85, 105, 0.3)"
          : "rgba(0, 0, 0, 0.05)",
      }}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Play/Pause Button */}
      <button
        onClick={togglePlayPause}
        className="p-2 rounded-full flex-shrink-0 transition-colors"
        style={{
          backgroundColor: isSender
            ? "rgba(255, 255, 255, 0.2)"
            : darkMode
            ? "rgba(99, 102, 241, 0.3)"
            : "rgba(99, 102, 241, 0.15)",
        }}
        disabled={!isLoaded}
      >
        {isPlaying ? (
          <Pause
            className="size-4"
            style={{ color: isSender ? "#fff" : darkMode ? "#a5b4fc" : "#4f46e5" }}
          />
        ) : (
          <Play
            className="size-4"
            style={{ color: isSender ? "#fff" : darkMode ? "#a5b4fc" : "#4f46e5" }}
            fill={isSender ? "#fff" : darkMode ? "#a5b4fc" : "#4f46e5"}
          />
        )}
      </button>

      {/* Waveform Progress */}
      <div className="flex-1 flex flex-col gap-1">
        <div
          ref={progressRef}
          className="flex items-center gap-[2px] h-6 cursor-pointer"
          onClick={handleProgressClick}
        >
          {waveformBars.map((height, index) => {
            const barProgress = (index / waveformBars.length) * 100;
            const isActive = barProgress <= progress;

            return (
              <div
                key={index}
                className="w-[3px] rounded-full transition-colors"
                style={{
                  height: `${height}%`,
                  backgroundColor: isActive
                    ? isSender
                      ? "#fff"
                      : darkMode
                      ? "#a5b4fc"
                      : "#4f46e5"
                    : isSender
                    ? "rgba(255, 255, 255, 0.3)"
                    : darkMode
                    ? "rgba(148, 163, 184, 0.4)"
                    : "rgba(0, 0, 0, 0.15)",
                }}
              />
            );
          })}
        </div>

        {/* Time display */}
        <div className="flex items-center justify-between">
          <span
            className="text-[10px] font-mono"
            style={{
              color: isSender
                ? "rgba(255, 255, 255, 0.8)"
                : darkMode
                ? "#94a3b8"
                : "#64748b",
            }}
          >
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          {/* Playback speed */}
          <button
            onClick={cyclePlaybackRate}
            className="text-[10px] font-medium px-1.5 py-0.5 rounded transition-colors"
            style={{
              backgroundColor: isSender
                ? "rgba(255, 255, 255, 0.15)"
                : darkMode
                ? "rgba(71, 85, 105, 0.5)"
                : "rgba(0, 0, 0, 0.08)",
              color: isSender
                ? "rgba(255, 255, 255, 0.9)"
                : darkMode
                ? "#94a3b8"
                : "#64748b",
            }}
            title="Playback speed"
          >
            {playbackRate}x
          </button>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
