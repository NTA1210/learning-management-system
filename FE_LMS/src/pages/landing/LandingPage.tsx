import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  Layers3,
  MessageSquareText,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import LandingFooter from "../../components/landing/LandingFooter.tsx";
import LandingHeader from "../../components/landing/LandingHeader.tsx";
import BookViewer from "../../components/materials/BookViewer.tsx";
import ModelViewer from "../../components/materials/ModelViewer.tsx";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";

type StatKey = "courses" | "mentors" | "cohorts";

type FeatureItem = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const statTargets: Record<StatKey, number> = {
  courses: 150,
  mentors: 250,
  cohorts: 35,
};

const valueCards: FeatureItem[] = [
  {
    icon: GraduationCap,
    title: "Context-aware learning",
    description:
      "Resources, assignments, mock tests, and progress are organized in one clear workspace for FPT students.",
  },
  {
    icon: CalendarDays,
    title: "Schedules that stay visible",
    description:
      "Learners can quickly see what comes next, which deadlines are close, and which classes need attention.",
  },
  {
    icon: BarChart3,
    title: "Progress backed by data",
    description:
      "Dashboards help teachers and students understand completion, activity, and learning momentum at a glance.",
  },
];

const courseTracks = [
  "Software Engineering",
  "Artificial Intelligence",
  "Business Analytics",
  "Japanese Bridge",
  "Academic English",
  "Mock Test Practice",
];

const features: FeatureItem[] = [
  {
    icon: BookOpenCheck,
    title: "Course workspace",
    description: "Manage lessons, materials, and submissions inside each course.",
  },
  {
    icon: MessageSquareText,
    title: "Learning discussion",
    description: "Keep conversations between students, teachers, and study groups close to the work.",
  },
  {
    icon: ShieldCheck,
    title: "Role based access",
    description: "Give every role the right tools without crowding the interface.",
  },
  {
    icon: Layers3,
    title: "3D material preview",
    description: "Combine interactive models and learning materials for visual topics.",
  },
];

const audience = [
  {
    title: "Students",
    text: "Track classes, mock tests, deadlines, and resources from one dashboard.",
  },
  {
    title: "Teachers",
    text: "Manage courses, assign work, and understand class activity faster.",
  },
  {
    title: "Academic teams",
    text: "Get a clear overview of learning activity without stitching reports together manually.",
  },
];

const LandingPage = () => {
  const { darkMode: isDarkMode } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [counts, setCounts] = useState<Record<StatKey, number>>({
    courses: 0,
    mentors: 0,
    cohorts: 0,
  });
  const [showBookModal, setShowBookModal] = useState(false);

  useEffect(() => {
    if (!user) return;

    if (user.role === "admin") {
      navigate("/dashboard", { replace: true });
    } else if (user.role === "teacher") {
      navigate("/teacher-dashboard", { replace: true });
    } else if (user.role === "student") {
      navigate("/student-dashboard", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const duration = 1600;
    const start = performance.now();
    let frameId = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setCounts({
        courses: Math.round(statTargets.courses * eased),
        mentors: Math.round(statTargets.mentors * eased),
        cohorts: Math.round(statTargets.cohorts * eased),
      });

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -60px 0px" }
    );

    document
      .querySelectorAll("[data-landing-reveal]")
      .forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const openBook = () => setShowBookModal(true);
    window.addEventListener("openBookModal", openBook);
    return () => window.removeEventListener("openBookModal", openBook);
  }, []);

  useEffect(() => {
    if (!location.hash) return;

    const timeoutId = window.setTimeout(() => {
      document
        .querySelector(location.hash)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);

    return () => window.clearTimeout(timeoutId);
  }, [location.hash]);

  const stats = useMemo(
    () => [
      { value: counts.courses, suffix: "+", label: "learning resources" },
      { value: counts.mentors, suffix: "+", label: "instructors and mentors" },
      { value: counts.cohorts, suffix: "+", label: "active cohorts" },
    ],
    [counts]
  );

  const scrollToPreview = () => {
    document
      .getElementById("preview")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className={`landing-page ${isDarkMode ? "landing-page-dark" : ""}`}>
      <LandingHeader />

      <main>
        <section id="home" className="landing-hero">
          <div className="landing-shell landing-hero-grid">
            <div className="landing-hero-copy landing-reveal is-visible">
              <span className="landing-eyebrow">
                <Sparkles size={16} />
                LMS for focused learning
              </span>
              <h1>FStudyMate</h1>
              <p className="landing-hero-lead">
                A modern learning management space for FPT University where
                classes, resources, mock tests, discussions, and progress stay
                in one clean workflow.
              </p>

              <div className="landing-hero-actions">
                <Link to="/register" className="landing-primary-button">
                  Start learning <ArrowRight size={18} />
                </Link>
                <button
                  type="button"
                  className="landing-secondary-button"
                  onClick={scrollToPreview}
                >
                  <PlayCircle size={18} />
                  View preview
                </button>
              </div>

              <div className="landing-stat-row" aria-label="Platform stats">
                {stats.map((stat) => (
                  <div key={stat.label} className="landing-stat-item">
                    <strong>
                      {stat.value}
                      {stat.suffix}
                    </strong>
                    <span>{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="landing-hero-visual landing-reveal is-visible">
              <div className="landing-model-stage">
                <div className="landing-model-topbar">
                  <span>FPT campus learning model</span>
                  <span>Live preview</span>
                </div>
                <div className="landing-model-canvas">
                  <ModelViewer
                    url="/textures/fpt.glb"
                    width="100%"
                    height="100%"
                    autoRotate
                    autoRotateSpeed={0.28}
                    enableHoverRotation
                    enableManualRotation
                    enableManualZoom={false}
                    ambientIntensity={1.1}
                    keyLightIntensity={1.8}
                    fillLightIntensity={1}
                    rimLightIntensity={1.4}
                    environmentPreset="city"
                    fadeIn
                    showScreenshotButton={false}
                  />
                </div>
                <div className="landing-model-footer">
                  <CheckCircle2 size={18} />
                  Visual materials, lessons, and progress can live together.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="why" className="landing-section landing-section-white">
          <div className="landing-shell">
            <div className="landing-section-heading landing-reveal" data-landing-reveal>
              <span className="landing-eyebrow">Why it feels better</span>
              <h2>Built for the way students actually move through a course.</h2>
              <p>
                The interface gives the user a clear next step, keeps academic
                context visible, and avoids the heavy dashboard feeling that
                makes learning tools tiring.
              </p>
            </div>

            <div className="landing-value-grid">
              {valueCards.map((card) => (
                <article
                  key={card.title}
                  className="landing-value-card landing-reveal"
                  data-landing-reveal
                >
                  <span>
                    <card.icon size={22} />
                  </span>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="courses" className="landing-section landing-section-soft">
          <div className="landing-shell landing-course-layout">
            <div className="landing-section-heading landing-reveal" data-landing-reveal>
              <span className="landing-eyebrow">Learning paths</span>
              <h2>Organized around subjects, practice, and academic rhythm.</h2>
              <p>
                Course discovery should feel direct: scan the track, enter the
                workspace, continue learning.
              </p>
            </div>

            <div className="landing-track-board landing-reveal" data-landing-reveal>
              {courseTracks.map((track, index) => (
                <div key={track} className="landing-track-chip">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {track}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="landing-section landing-section-white">
          <div className="landing-shell">
            <div className="landing-section-heading landing-reveal" data-landing-reveal>
              <span className="landing-eyebrow">Core features</span>
              <h2>Modern controls without visual noise.</h2>
              <p>
                Every feature is presented as a work surface: clear labels,
                short copy, and enough contrast to help users act quickly.
              </p>
            </div>

            <div className="landing-feature-grid">
              {features.map((feature) => (
                <article
                  key={feature.title}
                  className="landing-feature-card landing-reveal"
                  data-landing-reveal
                >
                  <feature.icon size={24} />
                  <div>
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="who" className="landing-section landing-section-ink">
          <div className="landing-shell">
            <div className="landing-section-heading landing-reveal" data-landing-reveal>
              <span className="landing-eyebrow">For the whole class</span>
              <h2>One system, different views for different responsibilities.</h2>
            </div>

            <div className="landing-audience-grid">
              {audience.map((item) => (
                <article
                  key={item.title}
                  className="landing-audience-card landing-reveal"
                  data-landing-reveal
                >
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="preview" className="landing-section landing-section-preview">
          <div className="landing-shell landing-preview-layout">
            <div className="landing-section-heading landing-reveal" data-landing-reveal>
              <span className="landing-eyebrow">Platform preview</span>
              <h2>A calm command center for learning work.</h2>
              <p>
                The visual direction uses clean surfaces, purposeful color, and
                smoother reveal motion so the landing page feels connected to
                the product behind it.
              </p>
              <Link to="/register" className="landing-primary-button">
                Create account <ArrowRight size={18} />
              </Link>
            </div>

            <div className="landing-dashboard-preview landing-reveal" data-landing-reveal>
              <div className="landing-preview-sidebar">
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className="landing-preview-main">
                <div className="landing-preview-header">
                  <span>Today overview</span>
                  <strong>82%</strong>
                </div>
                <div className="landing-preview-progress">
                  <span style={{ width: "82%" }} />
                </div>
                <div className="landing-preview-grid">
                  <div>
                    <strong>3</strong>
                    <span>Due tasks</span>
                  </div>
                  <div>
                    <strong>12</strong>
                    <span>Resources</span>
                  </div>
                  <div>
                    <strong>5</strong>
                    <span>Discussions</span>
                  </div>
                </div>
                <div className="landing-preview-list">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />

      {showBookModal &&
        createPortal(
          <div
            className="landing-book-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Interactive learning book"
          >
            <button
              type="button"
              className="landing-book-close"
              onClick={() => setShowBookModal(false)}
              aria-label="Close book preview"
            >
              <X size={22} />
            </button>
            <BookViewer />
          </div>,
          document.body
        )}
    </div>
  );
};

export default LandingPage;
