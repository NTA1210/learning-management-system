import { ArrowLeft } from "lucide-react";

interface QuizPageHeaderProps {
  title: string;
  onBack: () => void;
  darkMode: boolean;
  textColor: string;
}

export function QuizPageHeader({ title, onBack, darkMode, textColor }: QuizPageHeaderProps) {
  const handleBackClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onBack();
  };

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between md:ml-[50px]">
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleBackClick}
          className="flex items-center gap-2 text-sm hover:underline w-fit"
          style={{
            color: darkMode ? "#94a3b8" : "#64748b",
            zIndex: 9999,
            pointerEvents: "auto",
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h1 className="text-3xl font-bold" style={{ color: textColor }}>
          {title}
        </h1>
      </div>
    </div>
  );
}

