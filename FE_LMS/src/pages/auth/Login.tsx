import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { authService, saveCurrentUserFromApi } from "../../services";
import { type LoginRequest } from "../../types/auth";

type ErrorType = string | { path?: string[]; code?: string; message?: string };
type UserRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UserRecord =>
  typeof value === "object" && value !== null;

const toUserRecord = (value: unknown): UserRecord =>
  isRecord(value) ? value : {};

const unwrapApiData = (value: unknown): UserRecord => {
  if (isRecord(value) && "data" in value && value.data !== null) {
    return toUserRecord(value.data);
  }

  return toUserRecord(value);
};

const getStringField = (record: UserRecord, key: string): string | undefined => {
  const value = record[key];
  return typeof value === "string" && value.trim().length > 0
    ? value
    : undefined;
};

const getNestedString = (
  source: unknown,
  path: string[]
): string | undefined => {
  let current: unknown = source;

  for (const key of path) {
    if (!isRecord(current)) return undefined;
    current = current[key];
  }

  return typeof current === "string" ? current : undefined;
};

const getErrorListMessage = (source: unknown): string | undefined => {
  if (!isRecord(source) || !Array.isArray(source.errors)) return undefined;

  return source.errors
    .map((entry) => {
      if (isRecord(entry) && typeof entry.message === "string") {
        return entry.message;
      }
      return String(entry);
    })
    .join(", ");
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  return (
    getNestedString(error, ["response", "data", "message"]) ||
    getNestedString(error, ["message"]) ||
    getErrorListMessage(error) ||
    fallback
  );
};

const LoginPage: React.FC = () => {
  const { darkMode } = useTheme();
  const { saveAccountForQuickSwitch } = useAuth();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState<LoginRequest>({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorType | ErrorType[]>("");
  const [rememberPassword, setRememberPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const redirectAfterLogin = (
    resolvedUser: UserRecord,
    currentUser: UserRecord | null
  ) => {
    const redirectPath = searchParams.get("redirect");
    const effectiveUser = {
      ...resolvedUser,
      ...(currentUser ?? {}),
    };
    const role = getStringField(effectiveUser, "role");
    const specialistIds = effectiveUser.specialistIds;
    const hasSpecialists =
      Array.isArray(specialistIds) && specialistIds.length > 0;

    if (redirectPath) {
      window.location.href = redirectPath;
    } else if (role === "student" && !hasSpecialists) {
      window.location.href = "/onboarding";
    } else {
      switch (role) {
        case "admin":
          window.location.href = "/dashboard";
          break;
        case "teacher":
          window.location.href = "/teacher-dashboard";
          break;
        case "student":
          window.location.href = "/student-dashboard";
          break;
        default:
          window.location.href = "/";
      }
    }
  };

  const handleGoogleLoginSuccess = async (codeResponse: { code?: string }) => {
    setLoading(true);
    setError("");

    try {
      const code = codeResponse.code;
      if (!code) {
        throw new Error("Missing Google authorization code");
      }
      const loginResponse = await authService.googleLogin(code);
      const resolvedUser = unwrapApiData(loginResponse);

      let currentUser: UserRecord | null = null;
      try {
        const me = await saveCurrentUserFromApi();
        currentUser = unwrapApiData(me);
      } catch (e) {
        setLoading(false);
        console.warn("[auth] failed to load current user after login", e);
      }

      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userData", JSON.stringify(resolvedUser));

      saveAccountForQuickSwitch({
        userId:
          getStringField(resolvedUser, "_id") ||
          getStringField(resolvedUser, "id") ||
          getStringField(resolvedUser, "email") ||
          "",
        email: getStringField(resolvedUser, "email") || "",
        displayName:
          getStringField(resolvedUser, "fullname") ||
          getStringField(resolvedUser, "fullName") ||
          getStringField(resolvedUser, "username") ||
          getStringField(resolvedUser, "email") ||
          "FStudyMate user",
        avatarUrl:
          getStringField(resolvedUser, "avatar_url") ||
          getStringField(resolvedUser, "profileImageUrl"),
        role: getStringField(resolvedUser, "role"),
      });

      redirectAfterLogin(resolvedUser, currentUser);
    } catch (err: unknown) {
      console.error("Google login error:", err);
      setError(getErrorMessage(err, "Google login failed"));
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleLoginSuccess,
    onError: () => {
      setError("Failed to authenticate with Google");
    },
    flow: "auth-code",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await authService.login(formData);
      const resolvedUser = unwrapApiData(response);

      let currentUser: UserRecord | null = null;
      try {
        const me = await saveCurrentUserFromApi();
        currentUser = unwrapApiData(me);
      } catch (e) {
        setLoading(false);
        console.warn("[auth] failed to load current user after login", e);
      }

      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userData", JSON.stringify(resolvedUser));

      saveAccountForQuickSwitch({
        userId:
          getStringField(resolvedUser, "_id") ||
          getStringField(resolvedUser, "id") ||
          formData.email,
        email: formData.email,
        password: rememberPassword ? formData.password : undefined,
        displayName:
          getStringField(resolvedUser, "fullname") ||
          getStringField(resolvedUser, "fullName") ||
          getStringField(resolvedUser, "username") ||
          formData.email,
        avatarUrl:
          getStringField(resolvedUser, "avatar_url") ||
          getStringField(resolvedUser, "profileImageUrl"),
        role: getStringField(resolvedUser, "role"),
      });

      redirectAfterLogin(resolvedUser, currentUser);
    } catch (err: unknown) {
      console.error("Login error:", err);

      let finalError: string | ErrorType[] = "Login failed";
      const backendMessage = getNestedString(err, ["response", "data", "message"]);

      if (backendMessage) {
        finalError = backendMessage;
      } else {
        const maybeMessage = getErrorMessage(err, "Login failed");
        const errorMessage = getNestedString(err, ["message"]);

        if (errorMessage) {
          try {
            const parsed = JSON.parse(errorMessage) as unknown;
            finalError = Array.isArray(parsed) ? parsed : maybeMessage;
          } catch {
            finalError = maybeMessage;
          }
        } else {
          finalError = maybeMessage;
        }
      }

      setError(finalError);
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
                      ? err.path?.[0] === "password" && err.code === "too_small"
                        ? "Password must contain at least 8 characters"
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
      <section className="auth-learning-shell">
        <div className="auth-form-panel">
          <div className="mb-8 flex items-center justify-between gap-4">
            <Link to="/" className="flex min-w-0 items-center gap-3">
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

            <div className="shrink-0 text-right text-sm text-slate-500 dark:text-slate-400">
              <span className="hidden sm:inline">New here? </span>
              <Link
                to="/register"
                className="whitespace-nowrap font-bold text-[#525fe1] transition-colors hover:text-[#3f49c7] dark:text-indigo-300 dark:hover:text-indigo-200"
              >
                Sign up
              </Link>
            </div>
          </div>

          <div className="mb-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-bold uppercase text-[#525fe1] dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-200">
              <Sparkles className="h-3.5 w-3.5" />
              Smart LMS Portal
            </div>
            <h1 className="text-3xl font-bold leading-tight text-slate-950 dark:text-white sm:text-4xl">
              Welcome back to your learning space
            </h1>
            <p className="mt-3 max-w-md text-base leading-7 text-slate-600 dark:text-slate-300">
              Continue your courses, mock tests, schedules, and learning
              progress in one focused FStudyMate workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
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
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </span>
            </label>

            <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <label
                className="inline-flex items-center gap-3 font-medium text-slate-600 dark:text-slate-300"
                htmlFor="remember-password"
              >
                <input
                  id="remember-password"
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-[#525fe1] focus:ring-[#525fe1]"
                  checked={rememberPassword}
                  onChange={(event) =>
                    setRememberPassword(event.target.checked)
                  }
                />
                <span className="inline-flex items-center gap-2">
                  <KeyRound className="h-4 w-4" />
                  Save password
                </span>
              </label>
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                {rememberPassword ? "Stored for quick switch" : "Prompt every login"}
              </span>
            </div>

            {renderError()}

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm font-bold text-[#525fe1] transition-colors hover:text-[#3f49c7] dark:text-indigo-300 dark:hover:text-indigo-200"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="auth-learning-submit"
            >
              {loading ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Signing in
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>

            <div className="relative py-2 text-center">
              <div className="absolute inset-x-0 top-1/2 h-px bg-slate-200 dark:bg-white/10" />
              <span className="relative bg-white px-4 text-sm font-semibold text-slate-500 dark:bg-[#111827] dark:text-slate-400">
                Or continue with
              </span>
            </div>

            <button
              type="button"
              onClick={() => googleLogin()}
              disabled={loading}
              className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:border-indigo-300/40"
            >
              <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>
          </form>
        </div>

        <aside className="auth-showcase-panel">
          <div className="auth-showcase-glow" />
          <div className="relative z-10">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold uppercase text-[#ffcf59]">
                  Learning dashboard
                </p>
                <h2 className="mt-2 text-3xl font-bold leading-tight text-white">
                  Keep every class, quiz, and deadline in rhythm.
                </h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12 text-white ring-1 ring-white/15">
                <BookOpenCheck className="h-6 w-6" />
              </div>
            </div>

            <div className="auth-course-preview">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase text-slate-300">
                    Current course
                  </p>
                  <h3 className="mt-2 text-xl font-bold text-white">
                    Software Engineering
                  </h3>
                  <p className="mt-1 text-sm text-slate-300">
                    Sprint review and mock exam practice
                  </p>
                </div>
                <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-200 ring-1 ring-emerald-300/20">
                  Active
                </span>
              </div>

              <div className="mt-7">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-200">
                    Weekly progress
                  </span>
                  <span className="font-bold text-[#ffcf59]">78%</span>
                </div>
                <div className="h-3 rounded-full bg-white/10">
                  <div className="h-3 w-[78%] rounded-full bg-gradient-to-r from-[#ffcf59] via-emerald-300 to-cyan-300" />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                {[
                  { label: "Lessons", value: "12", icon: BookOpenCheck },
                  { label: "Quizzes", value: "08", icon: BarChart3 },
                  { label: "Peers", value: "36", icon: UsersRound },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="rounded-2xl bg-white/8 p-3 ring-1 ring-white/10"
                    >
                      <Icon className="mb-3 h-4 w-4 text-cyan-200" />
                      <p className="text-lg font-bold text-white">
                        {item.value}
                      </p>
                      <p className="text-xs font-medium text-slate-300">
                        {item.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="auth-mini-panel">
                <CalendarDays className="h-5 w-5 text-[#ffcf59]" />
                <div>
                  <p className="text-sm font-bold text-white">
                    Next class
                  </p>
                  <p className="mt-1 text-xs text-slate-300">
                    Slot 2, Room BE-203
                  </p>
                </div>
              </div>
              <div className="auth-mini-panel">
                <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                <div>
                  <p className="text-sm font-bold text-white">
                    Assignment
                  </p>
                  <p className="mt-1 text-xs text-slate-300">
                    Submitted on time
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

export default LoginPage;
