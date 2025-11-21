import { ArrowLeft } from "lucide-react";

interface QuizPageHeaderProps {
  title: string;
  onBack: () => void;
  darkMode: boolean;
  textColor: string;
}

export function QuizPageHeader({ title, onBack, darkMode, textColor }: QuizPageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between md:ml-[50px]">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center justify-center rounded-xl shadow-lg transition-colors w-10 h-10 sm:w-12 sm:h-12 -ml-1 sm:-ml-3 md:-ml-6"
          style={{
            backgroundColor: darkMode ? "rgba(99,102,241,0.25)" : "#6366f1",
            color: darkMode ? "#a5b4fc" : "#ffffff",
          }}
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="sr-only">Back to subjects</span>
        </button>
        <h1 className="text-3xl font-bold" style={{ color: textColor }}>
          {title}
        </h1>
      </div>
    </div>
  );
}

