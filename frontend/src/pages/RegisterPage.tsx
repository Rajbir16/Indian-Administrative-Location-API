import { FormEvent, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const SERVICE_URL = import.meta.env.VITE_API_URL || "";
const AUTH_URL = `${SERVICE_URL}/api/auth`;

const FREE_EMAIL_PROVIDERS = [
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "aol.com",
  "protonmail.com",
  "yandex.com",
];

export function RegisterPage() {
  const navigate = useNavigate();

  const [businessEmail, setBusinessEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const email = businessEmail.trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return "Please enter a valid business email.";
    }

    const domain = email.split("@")[1];

    if (FREE_EMAIL_PROVIDERS.includes(domain)) {
      return "Please use a business email address. Free email providers are not allowed.";
    }

    if (!businessName.trim()) {
      return "Business name is required.";
    }

    if (!phoneNumber.trim()) {
      return "Phone number is required.";
    }

    if (password.length < 8) {
      return "Password must be at least 8 characters.";
    }

    if (password !== confirmPassword) {
      return "Passwords do not match.";
    }

    return "";
  };

  const register = async (event: FormEvent) => {
    event.preventDefault();

    setError("");
    setMessage("");

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      await axios.post(`${AUTH_URL}/register`, {
        businessEmail: businessEmail.trim().toLowerCase(),
        businessName: businessName.trim(),
        gstNumber: gstNumber.trim() || undefined,
        phoneNumber: phoneNumber.trim(),
        password,
        confirmPassword,
      });

      setSuccess(true);
      setMessage(
        "Registration submitted successfully. Your account is pending admin approval."
      );

      setBusinessEmail("");
      setBusinessName("");
      setGstNumber("");
      setPhoneNumber("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);

      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Registration failed. Please check your details and try again."
        );
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="app">
        <main>
          <section className="content-section">
            <div className="section-header">
              <div>
                <h3>Registration Submitted</h3>
                <p>Your B2B account has been submitted for review.</p>
              </div>
            </div>

            <div className="info-message">
              ✅ {message}
            </div>

            <div style={{ marginTop: "20px" }}>
              <button
                className="secondary-button"
                onClick={() => navigate("/")}
              >
                Back to Login
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <div className="brand-icon">🇮🇳</div>

          <div>
            <h1>
              Indian Administrative
              <span> Location API</span>
            </h1>

            <p>B2B Developer Registration</p>
          </div>
        </div>

        <div className="status">
          <span className="status-dot"></span>
          API Online
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <div className="badge">🇮🇳 B2B DEVELOPER PORTAL</div>

            <h2>Create your developer account</h2>

            <p>
              Register your business to access the Indian Administrative
              Location API.
            </p>
          </div>
        </section>

        <section className="content-section">
          <div className="section-header">
            <div>
              <h3>Business Registration</h3>
              <p>
                Submit your business details for administrator approval.
              </p>
            </div>
          </div>

          <form onSubmit={register}>
            <div className="explorer">
              <div className="form-group">
                <label>Business Email *</label>

                <input
                  type="email"
                  placeholder="you@company.com"
                  value={businessEmail}
                  onChange={(event) =>
                    setBusinessEmail(event.target.value)
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Business Name *</label>

                <input
                  type="text"
                  placeholder="Registered company name"
                  value={businessName}
                  onChange={(event) =>
                    setBusinessName(event.target.value)
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>GST Number</label>

                <input
                  type="text"
                  placeholder="Optional"
                  value={gstNumber}
                  onChange={(event) =>
                    setGstNumber(event.target.value)
                  }
                />
              </div>

              <div className="form-group">
                <label>Phone Number *</label>

                <input
                  type="tel"
                  placeholder="+91 9876543210"
                  value={phoneNumber}
                  onChange={(event) =>
                    setPhoneNumber(event.target.value)
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Password *</label>

                <input
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  required
                  minLength={8}
                />
              </div>

              <div className="form-group">
                <label>Confirm Password *</label>

                <input
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  required
                  minLength={8}
                />
              </div>
            </div>

            {error && <div className="error">{error}</div>}

            {message && <div className="info-message">{message}</div>}

            <div style={{ marginTop: "24px" }}>
              <button type="submit" disabled={loading}>
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </div>
          </form>

          <div style={{ marginTop: "24px" }}>
            <p>
              Already have an account?{" "}
              <Link to="/">
                Back to Login
              </Link>
            </p>
          </div>
        </section>

        <section className="content-section">
          <div className="section-header">
            <div>
              <h3>What happens next?</h3>
              <p>
                Your account will remain pending until an administrator
                approves it.
              </p>
            </div>
          </div>

          <div className="info-message">
            🔐 API keys can be generated only after your account is approved.
          </div>
        </section>
      </main>

      <footer>
        <div>
          <strong>Indian Administrative Location API</strong>

          <p>
            REST API for structured Indian administrative location data.
          </p>
        </div>

        <div className="footer-tech">
          <span>React</span>
          <span>Express</span>
          <span>PostgreSQL</span>
          <span>Prisma</span>
          <span>Redis</span>
          <span>JWT</span>
        </div>
      </footer>
    </div>
  );
}