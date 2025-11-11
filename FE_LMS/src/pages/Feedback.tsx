import { useState, useMemo } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useTheme } from "../hooks/useTheme";

type FeedbackCategory = "bug" | "feature" | "content" | "uiux" | "other";

interface FeedbackFormState {
	category: FeedbackCategory;
	rating: number;
	title: string;
	message: string;
	email: string;
	screenshot?: File | null;
}

const categories: { value: FeedbackCategory; label: string }[] = [
	{ value: "bug", label: "Bug report" },
	{ value: "feature", label: "Feature request" },
	{ value: "content", label: "Content feedback" },
	{ value: "uiux", label: "UI/UX" },
	{ value: "other", label: "Other" }
];

export default function Feedback() {
	const { darkMode } = useTheme();
	const [submitting, setSubmitting] = useState(false);
	const [success, setSuccess] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [form, setForm] = useState<FeedbackFormState>({
		category: "bug",
		rating: 5,
		title: "",
		message: "",
		email: "",
		screenshot: null
	});

	const isValid = useMemo(() => {
		return form.title.trim().length >= 6 && form.message.trim().length >= 10 && form.rating > 0;
	}, [form.title, form.message, form.rating]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!isValid) return;
		setSubmitting(true);
		setSuccess(null);
		setError(null);

		try {
			// In a real app, send to backend API. Here we simulate.
			await new Promise((r) => setTimeout(r, 900));
			// eslint-disable-next-line no-console
			console.log("Feedback submitted", form);
			setSuccess("Thank you! Your feedback has been recorded.");
			setForm((prev) => ({
				...prev,
				title: "",
				message: "",
				screenshot: null,
				rating: 5,
				category: "bug"
			}));
		} catch {
			setError("Failed to send feedback. Please try again.");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div
			className="flex h-screen overflow-hidden relative"
			style={{
				backgroundColor: darkMode ? "#0b1220" : "#f5f7fb",
				color: darkMode ? "#e5e7eb" : "#1f2937"
			}}
		>
			<Navbar />
			<Sidebar role="student" />

			<main className="flex-1 overflow-y-auto pt-24 px-6 sm:px-10">
				<style>
					{`
					@keyframes fadeInUp {
						from { opacity: 0; transform: translateY(8px); }
						to { opacity: 1; transform: translateY(0); }
					}
					@keyframes slideIn {
						from { opacity: 0; transform: translateX(6px); }
						to { opacity: 1; transform: translateX(0); }
					}
					@keyframes gentleFloat {
						0% { transform: translateY(0); }
						50% { transform: translateY(-2px); }
						100% { transform: translateY(0); }
					}
					@keyframes shimmer {
						0% { background-position: -200% 0; }
						100% { background-position: 200% 0; }
					}
					@keyframes popIn {
						0% { opacity: 0; transform: scale(0.9); }
						60% { opacity: 1; transform: scale(1.04); }
						100% { transform: scale(1); }
					}
					@keyframes progress {
						0% { transform: translateX(-100%); }
						100% { transform: translateX(0%); }
					}
					.fade-in-up { animation: fadeInUp 420ms ease both; }
					.slide-in { animation: slideIn 300ms ease both; }
					.gentle-float { animation: gentleFloat 4s ease-in-out infinite; }
					.pop-in { animation: popIn 280ms ease-out both; }
					.progress-bar { transform-origin: left center; animation: progress 900ms ease forwards; }
					`}
				</style>
				<div className="max-w-4xl mx-auto">
					<div
						className="h-1.5 w-28 rounded-full mb-2"
						style={{
							backgroundImage: "linear-gradient(90deg, #525fe1, #7c3aed, #22d3ee)",
							animation: "shimmer 2.4s linear infinite",
							backgroundSize: "200% 100%"
						}}
					/>
					<header className="mb-6 fade-in-up" style={{ animationDelay: "40ms" }}>
						<h1
							className="text-2xl sm:text-3xl font-bold tracking-tight"
							style={{ color: darkMode ? "#ffffff" : "#111827" }}
						>
							Feedback
						</h1>
						<p className="mt-2 text-sm" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
							Tell us about your experience so we can improve the platform.
						</p>
					</header>
					{submitting && (
						<div className="w-full h-1 overflow-hidden rounded-full mb-3" style={{ background: darkMode ? "#111827" : "#e5e7eb" }}>
							<div
								className="h-full progress-bar"
								style={{
									width: "100%",
									backgroundImage: "linear-gradient(90deg, #525fe1, #7c3aed)",
									boxShadow: "0 0 12px rgba(124,58,237,0.35)",
									transform: "translateX(-100%)"
								}}
							/>
						</div>
					)}

					<div
						className="rounded-2xl shadow-lg p-6 sm:p-8 fade-in-up"
						style={{
							background: darkMode ? "rgba(17, 24, 39, 0.8)" : "rgba(255,255,255,0.95)",
							border: "1px solid rgba(148, 163, 184, 0.15)",
							backdropFilter: "blur(8px)"
						}}
					>
						<form onSubmit={handleSubmit} className="space-y-6">
							{/* Category & Rating */}
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="fade-in-up" style={{ animationDelay: "80ms" }}>
									<label className="block text-sm font-medium mb-1">Category</label>
									<select
										value={form.category}
										onChange={(e) =>
											setForm((f) => ({ ...f, category: e.target.value as FeedbackCategory }))
										}
										className="w-full rounded-xl px-3 py-2 outline-none transition-colors"
										style={{
											backgroundColor: darkMode ? "#0f172a" : "#f9fafb",
											border: "1px solid rgba(148,163,184,0.25)"
										}}
									>
										{categories.map((c) => (
											<option key={c.value} value={c.value}>
												{c.label}
											</option>
										))}
									</select>
								</div>
								<div className="fade-in-up" style={{ animationDelay: "120ms" }}>
									<label className="block text-sm font-medium mb-1">Rating</label>
									<div className="flex items-center gap-1 gentle-float">
										{Array.from({ length: 5 }).map((_, i) => {
											const active = i < form.rating;
											return (
												<button
													type="button"
													key={i}
													onClick={() => setForm((f) => ({ ...f, rating: i + 1 }))}
													className="p-2 rounded-lg transition-transform hover:scale-110 hover:rotate-3"
													aria-label={`Rate ${i + 1} star${i === 0 ? "" : "s"}`}
													style={{
														backgroundColor: "transparent"
													}}
												>
													<svg
														xmlns="http://www.w3.org/2000/svg"
														viewBox="0 0 24 24"
														fill={active ? "#fbbf24" : "none"}
														stroke={active ? "#f59e0b" : darkMode ? "#64748b" : "#94a3b8"}
														className="w-7 h-7 transition-colors"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth="1.5"
															d="M11.48 3.499a.562.562 0 011.04 0l2.012 5.111a.563.563 0 00.475.354l5.518.403c.499.036.701.663.322.988l-4.204 3.57a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0l-4.725 2.885a.562.562 0 01-.84-.61l1.285-5.386a.563.563 0 00-.182-.557l-4.204-3.57a.563.563 0 01.322-.988l5.518-.403a.563.563 0 00.475-.354l2.012-5.11z"
														/>
													</svg>
												</button>
											);
										})}
										<span className="ml-2 text-sm" style={{ color: darkMode ? "#cbd5e1" : "#475569" }}>
											{form.rating}/5
										</span>
									</div>
								</div>
							</div>

							{/* Title */}
							<div className="fade-in-up" style={{ animationDelay: "160ms" }}>
								<label className="block text-sm font-medium mb-1">Title</label>
								<input
									type="text"
									value={form.title}
									onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
									placeholder="A short summary of your feedback"
									className="w-full rounded-xl px-3 py-2 outline-none placeholder-gray-400 transition-shadow focus:shadow-lg"
									style={{
										backgroundColor: darkMode ? "#0f172a" : "#f9fafb",
										border: "1px solid rgba(148,163,184,0.25)"
									}}
								/>
							</div>

							{/* Message */}
							<div className="fade-in-up" style={{ animationDelay: "200ms" }}>
								<label className="block text-sm font-medium mb-1">Detailed description</label>
								<textarea
									value={form.message}
									onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
									placeholder="Describe the issue or proposal with steps, expected vs actual, etc."
									rows={6}
									className="w-full rounded-xl px-3 py-2 outline-none resize-y placeholder-gray-400 transition-shadow focus:shadow-lg"
									style={{
										backgroundColor: darkMode ? "#0f172a" : "#f9fafb",
										border: "1px solid rgba(148,163,184,0.25)"
									}}
								/>
								<p className="mt-1 text-xs" style={{ color: darkMode ? "#94a3b8" : "#6b7280" }}>
									Add context, reproduction steps (if any), and screenshots if possible.
								</p>
							</div>

							{/* Contact & Screenshot */}
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="fade-in-up" style={{ animationDelay: "240ms" }}>
									<label className="block text-sm font-medium mb-1">Contact email (optional)</label>
									<input
										type="email"
										value={form.email}
										onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
										placeholder="your@email.com"
										className="w-full rounded-xl px-3 py-2 outline-none placeholder-gray-400 transition-shadow focus:shadow-lg"
										style={{
											backgroundColor: darkMode ? "#0f172a" : "#f9fafb",
											border: "1px solid rgba(148,163,184,0.25)"
										}}
									/>
								</div>
								<div className="fade-in-up" style={{ animationDelay: "280ms" }}>
									<label className="block text-sm font-medium mb-1">Attach screenshot (optional)</label>
									<input
										type="file"
										accept="image/*"
										onChange={(e) => setForm((f) => ({ ...f, screenshot: e.target.files?.[0] || null }))}
										className="block w-full text-sm file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border file:border-gray-300 file:bg-transparent"
									/>
									{form.screenshot && (
										<p className="mt-1 text-xs" style={{ color: darkMode ? "#94a3b8" : "#6b7280" }}>
											Selected: {form.screenshot.name}
										</p>
									)}
								</div>
							</div>

							{/* Submit */}
							<div className="flex items-center gap-3 fade-in-up" style={{ animationDelay: "320ms" }}>
								<button
									type="submit"
									disabled={!isValid || submitting}
									className={`px-5 py-2.5 rounded-xl font-semibold transition-all active:scale-[0.98] relative overflow-hidden ${
										submitting || !isValid
											? "opacity-60 cursor-not-allowed"
											: "hover:shadow-lg hover:-translate-y-0.5"
									}`}
									style={{
										background: "linear-gradient(135deg, #525fe1 0%, #7c3aed 100%)",
										color: "#fff"
									}}
								>
									{submitting ? "Sending..." : "Submit feedback"}
									{!submitting && isValid && (
										<span
											aria-hidden
											className="absolute inset-0"
											style={{
												background:
													"linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.25) 20%, transparent 40%)",
												backgroundSize: "200% 100%",
												animation: "shimmer 1800ms linear infinite"
											}}
										/>
									)}
								</button>
								{success && <span className="text-sm slide-in pop-in px-3 py-1 rounded-lg" style={{ color: "#10b981", background: darkMode ? "rgba(16,185,129,0.08)" : "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)" }}>{success}</span>}
								{error && <span className="text-sm slide-in" style={{ color: "#ef4444" }}>{error}</span>}
							</div>
						</form>
					</div>

					<section className="mt-8">
						<h2 className="text-lg font-semibold mb-3" style={{ color: darkMode ? "#e5e7eb" : "#111827" }}>
							How to write effective feedback
						</h2>
						<ul className="list-disc pl-5 space-y-1 text-sm" style={{ color: darkMode ? "#cbd5e1" : "#374151" }}>
							<li>State clearly the goal you want to achieve.</li>
							<li>For bugs, include steps to reproduce, expected vs actual result.</li>
							<li>Attach screenshots if possible to speed up triage.</li>
						</ul>
					</section>
				</div>
			</main>
		</div>
	);
}


