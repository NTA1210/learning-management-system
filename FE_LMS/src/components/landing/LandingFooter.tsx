import { Link } from "react-router-dom";
import { BookOpenCheck, Mail, MapPin, Phone } from "lucide-react";

const LandingFooter = () => {
  return (
    <footer className="landing-footer">
      <div className="landing-footer-shell">
        <div className="landing-footer-brand">
          <Link to="/" className="landing-footer-logo">
            <span>
              <BookOpenCheck size={20} strokeWidth={2.4} />
            </span>
            <strong>FStudyMate</strong>
          </Link>
          <p>
            Smart learning workspace for FPT students, teachers, and academic
            teams.
          </p>
        </div>

        <div className="landing-footer-column">
          <h3>Explore</h3>
          <a href="#why">Why FStudyMate</a>
          <a href="#courses">Learning paths</a>
          <a href="#features">Features</a>
          <a href="#preview">Platform preview</a>
        </div>

        <div className="landing-footer-column">
          <h3>Contact</h3>
          <span>
            <Mail size={16} /> nguyenvanquang16102004@gmail.com
          </span>
          <span>
            <Phone size={16} /> +84 788 317 325
          </span>
          <span>
            <MapPin size={16} /> FPT University Campuses
          </span>
        </div>
      </div>

      <div className="landing-footer-bottom">
        <span>© {new Date().getFullYear()} FStudyMate. All rights reserved.</span>
        <div>
          <Link to="/login">Sign in</Link>
          <Link to="/register">Create account</Link>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
