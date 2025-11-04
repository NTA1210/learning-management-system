import React from "react";

interface FAQPopupProps {
  isOpen: boolean;
  onClose?: () => void;
  closable?: boolean;
}

const FAQPopup: React.FC<FAQPopupProps> = ({ isOpen, onClose, closable = true }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[1000] p-4" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[88vh] overflow-y-auto border border-slate-200/50 dark:border-slate-700/50">
        <div className="relative">
          <div className="h-28 bg-gradient-to-r from-indigo-600 via-violet-500 to-fuchsia-500 rounded-t-2xl" />
          <div className="absolute top-4 left-6 bg-white dark:bg-slate-800 ring-2 ring-white/60 dark:ring-slate-900/60 rounded-2xl px-4 py-3 shadow-lg flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-indigo-600 text-white shadow-md">❓</div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">FAQ / Usage Guide</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">Quick answers and tips to use FStudyMate effectively</p>
            </div>
          </div>
          {closable && onClose && (
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-white/90 hover:text-white transition-colors"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="p-6 pt-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
            <div>
                <h3 className="text-base font-semibold text-indigo-600 dark:text-indigo-400">What is FStudyMate?</h3>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">Online learning platform tailored for FPT students and educators.</p>
            </div>

            <div>
                <h3 className="text-base font-semibold text-indigo-600 dark:text-indigo-400">What do users get?</h3>
                <ul className="mt-2 text-sm text-slate-700 dark:text-slate-300 list-disc pl-5 space-y-1">
                  <li>Students: timetables, materials, mock tests, results tracking</li>
                  <li>Lecturers: classes, forums, materials, assessments</li>
                  <li>Admins: manage users, courses, and platform settings</li>
                </ul>
            </div>

              <div>
                <h3 className="text-base font-semibold text-indigo-600 dark:text-indigo-400">External students?</h3>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">Supported with restricted privileges.</p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-indigo-600 dark:text-indigo-400">Platforms</h3>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">Optimized for desktop/laptop, available on mobile.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl p-4 border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60">
                <h4 className="font-semibold text-slate-900 dark:text-white">Quick Start</h4>
                <ol className="mt-2 list-decimal pl-5 text-sm text-slate-700 dark:text-slate-300 space-y-1">
                  <li>Register/Log in with your account</li>
                  <li>Open Courses → Enroll a course</li>
                  <li>Study Materials → Take Mock Tests</li>
                  <li>Track progress in Profile</li>
                </ol>
              </div>
              <div className="rounded-xl p-4 border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60">
                <h4 className="font-semibold text-slate-900 dark:text-white">Tips</h4>
                <ul className="mt-2 list-disc pl-5 text-sm text-slate-700 dark:text-slate-300 space-y-1">
                  <li>Use dark mode for night study</li>
                  <li>Bookmark frequent courses</li>
                  <li>Enable notifications for deadlines</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQPopup;


