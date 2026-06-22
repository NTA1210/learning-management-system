import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import { authService } from "../../services";
import { type RegisterRequest } from "../../types/auth";

type ErrorType = string | { path?: string[]; code?: string; message?: string };
type ErrorRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is ErrorRecord =>
  typeof value === "object" && value !== null;

const getNestedString = (
  source: unknown,
  path: string[]
): string | undefined => {
  let current: unknown = source;

  for (const key of path) {
    if (!isRecord(current)) return undefined;
    current = current[key];
  }

  return typeof current === "string" && current.trim().length > 0
    ? current
    : undefined;
};

const parseErrorMessage = (error: unknown): ErrorType | ErrorType[] => {
  const apiMessage =
    getNestedString(error, ["response", "data", "message"]) ||
    getNestedString(error, ["response", "data", "error", "message"]);

  if (apiMessage) return apiMessage;

  const maybeMessage = getNestedString(error, ["message"]);
  if (!maybeMessage) return "Registration failed";

  try {
    const parsed = JSON.parse(maybeMessage) as unknown;
    return Array.isArray(parsed) ? (parsed as ErrorType[]) : maybeMessage;
  } catch {
    return maybeMessage;
  }
};

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [formData, setFormData] = useState<RegisterRequest>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    fullname: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorType | ErrorType[]>("");
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validatePassword = (password: string) => {
    const hasMinLength = password.length >= 8;
    const hasNumberOrSymbol = /[0-9!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasUpperAndLower = /[a-z]/.test(password) && /[A-Z]/.test(password);

    return { hasMinLength, hasNumberOrSymbol, hasUpperAndLower };
  };

  const passwordValidation = validatePassword(formData.password);
  const isPasswordValid =
    passwordValidation.hasMinLength &&
    passwordValidation.hasNumberOrSymbol &&
    passwordValidation.hasUpperAndLower;
  const passwordsMatch =
    formData.confirmPassword.length > 0 &&
    formData.password === formData.confirmPassword;
  const isFormValid =
    formData.fullname &&
    formData.username &&
    formData.email &&
    isPasswordValid &&
    passwordsMatch;

  const requirements = [
    {
      label: "At least 8 characters",
      passed: passwordValidation.hasMinLength,
    },
    {
      label: "One number or symbol",
      passed: passwordValidation.hasNumberOrSymbol,
    },
    {
      label: "Lowercase and uppercase letters",
      passed: passwordValidation.hasUpperAndLower,
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await authService.register(formData);
      setSuccess(true);
    } catch (err: unknown) {
      console.error("Registration error:", err);
      setError(parseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const renderError = () => {
    if (!error) return null;

    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div>
            {Array.isArray(error) ? (
              <ul className="space-y-1">
                {error.map((err, index) => (
                  <li key={index}>
                    {typeof err === "object" &&
                    err !== null &&
                    "path" in err &&
                    "code" in err &&
                    "message" in err
                      ? err.path?.[0] === "username" && err.code === "too_small"
                        ? "Username must contain at least 3 characters"
                        : err.message
                      : String(err)}
                  </li>
                ))}
              </ul>
            ) : (
              String(error)
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <main
      className={`auth-container auth-learning-page px-4 py-6 sm:px-6 lg:px-8 ${
        darkMode ? "auth-learning-page-dark" : ""
      }`}
    >
      <section className="auth-learning-shell auth-register-shell">
        <div className="auth-form-panel">
          <div className="mb-7 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:text-[#525fe1] dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:text-white"
              aria-label="Back to login"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="shrink-0 text-right text-sm text-slate-500 dark:text-slate-400">
              <span className="hidden sm:inline">Already member? </span>
              <Link
                to="/login"
                className="whitespace-nowrap font-bold text-[#525fe1] transition-colors hover:text-[#3f49c7] dark:text-indigo-300 dark:hover:text-indigo-200"
              >
                Sign in
              </Link>
            </div>
          </div>

          <div className="mb-7">
            <Link to="/" className="mb-5 flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[#525fe1] text-white shadow-lg shadow-indigo-500/25">
                <GraduationCap className="h-6 w-6" />
              </span>
              <span className="min-w-0">
                <span className="block whitespace-nowrap text-lg font-bold text-slate-950 dark:text-white">
                  FStudyMate
                </span>
                <span className="block whitespace-nowrap text-xs font-medium text-slate-500 dark:text-slate-400">
                  FPT learning companion
                </span>
              </span>
            </Link>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-bold uppercase text-[#525fe1] dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-200">
              <Sparkles className="h-3.5 w-3.5" />
              Start learning smarter
            </div>
            <h1 className="text-3xl font-bold leading-tight text-slate-950 dark:text-white sm:text-4xl">
              Create your learning account
            </h1>
            <p className="mt-3 max-w-md text-base leading-7 text-slate-600 dark:text-slate-300">
              Join your courses, track progress, practice quizzes, and stay in
              sync with your FPT learning schedule.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Full name
                </span>
                <span className="relative block">
                  <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="fullname"
                    value={formData.fullname}
                    onChange={handleInputChange}
                    className="auth-learning-input"
                    placeholder="Nguyen Van A"
                    autoComplete="name"
                    required
                  />
                </span>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Username
                </span>
                <span className="relative block">
                  <UsersRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="auth-learning-input"
                    placeholder="student01"
                    autoComplete="username"
                    required
                  />
                </span>
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Email address
              </span>
              <span className="relative block">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="auth-learning-input"
                  placeholder="student@fpt.edu.vn"
                  autoComplete="email"
                  required
                />
              </span>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Password
                </span>
                <span className="relative block">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="auth-learning-input pr-12"
                    placeholder="Create password"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </span>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Confirm password
                </span>
                <span className="relative block">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="auth-learning-input pr-12"
                    placeholder="Repeat password"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </span>
              </label>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="grid gap-2 text-sm sm:grid-cols-3">
                {requirements.map((requirement) => (
                  <div
                    key={requirement.label}
                    className={`flex items-center gap-2 font-medium transition-colors ${
                      requirement.passed
                        ? "text-emerald-600 dark:text-emerald-300"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    <CheckCircle2
                      className={`h-4 w-4 flex-shrink-0 ${
                        requirement.passed
                          ? "fill-emerald-100"
                          : "opacity-60"
                      }`}
                    />
                    <span>{requirement.label}</span>
                  </div>
                ))}
              </div>
              {formData.confirmPassword.length > 0 && !passwordsMatch && (
                <p className="mt-3 text-sm font-medium text-red-600 dark:text-red-300">
                  Passwords do not match.
                </p>
              )}
            </div>

            {renderError()}

            {success && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-200">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <div>
                    <div className="font-bold">Registration successful</div>
                    <div className="mt-1">
                      Please check your email ({formData.email}) and verify your
                      account before signing in.
                    </div>
                    <Link
                      to="/login"
                      className="mt-2 inline-flex font-bold text-[#525fe1] hover:text-[#3f49c7] dark:text-indigo-300 dark:hover:text-indigo-200"
                    >
                      Go to login
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="auth-learning-submit"
            >
              {loading ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Creating account
                </>
              ) : (
                <>
                  Sign up
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
        </div>

        <aside className="auth-showcase-panel">
          <div className="auth-showcase-glow" />
          <div className="relative z-10">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold uppercase text-[#ffcf59]">
                  New student workspace
                </p>
                <h2 className="mt-2 text-3xl font-bold leading-tight text-white">
                  Build a study profile that follows every course.
                </h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12 text-white ring-1 ring-white/15">
                <GraduationCap className="h-6 w-6" />
              </div>
            </div>

            <div className="auth-course-preview">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase text-slate-300">
                    First semester setup
                  </p>
                  <h3 className="mt-2 text-xl font-bold text-white">
                    Choose your major path
                  </h3>
                  <p className="mt-1 text-sm text-slate-300">
                    Courses, quizzes, discussions, and reminders connect after
                    onboarding.
                  </p>
                </div>
                <span className="rounded-full bg-[#ffcf59]/20 px-3 py-1 text-xs font-bold text-[#ffcf59] ring-1 ring-[#ffcf59]/20">
                  Ready
                </span>
              </div>

              <div className="mt-7 space-y-4">
                {[
                  { label: "Profile", value: "Account details", done: true },
                  { label: "Major", value: "Specialist selection", done: false },
                  { label: "Courses", value: "Learning dashboard", done: false },
                ].map((item, index) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-4 rounded-2xl bg-white/8 p-3 ring-1 ring-white/10"
                  >
                    <div
                      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                        item.done
                          ? "bg-emerald-400/20 text-emerald-200"
                          : "bg-white/10 text-slate-200"
                      }`}
                    >
                      {item.done ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">
                        {item.label}
                      </p>
                      <p className="text-xs text-slate-300">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="auth-mini-panel">
                <BookOpenCheck className="h-5 w-5 text-cyan-200" />
                <div>
                  <p className="text-sm font-bold text-white">Materials</p>
                  <p className="mt-1 text-xs text-slate-300">
                    Lectures, files, and videos
                  </p>
                </div>
              </div>
              <div className="auth-mini-panel">
                <CalendarDays className="h-5 w-5 text-[#ffcf59]" />
                <div>
                  <p className="text-sm font-bold text-white">Schedule</p>
                  <p className="mt-1 text-xs text-slate-300">
                    Slots and deadlines
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
};

export default RegisterPage;
