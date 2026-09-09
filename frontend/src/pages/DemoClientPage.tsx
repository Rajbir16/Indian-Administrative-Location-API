import { useEffect, useState } from "react";
import { api, getApiMessage } from "../services/api";

interface DemoResult {
  value: string;
  label: string;
  fullAddress: string;
  hierarchy: {
    village: {
      id: number;
      code: string;
      name: string;
    };
    subDistrict: {
      id: number;
      code: string;
      name: string;
    };
    district: {
      id: number;
      code: string;
      name: string;
    };
    state: {
      id: number;
      code: string;
      name: string;
    };
    country: {
      name: string;
    };
  };
}

interface DemoResponse {
  success: boolean;
  count: number;
  data: DemoResult[];
}

export function DemoClientPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DemoResult[]>([]);
  const [selected, setSelected] = useState<DemoResult | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [remainingRequests, setRemainingRequests] = useState<number | null>(
    null
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // ============================================================
  // VILLAGE AUTOCOMPLETE
  // ============================================================

  useEffect(() => {
    const searchVillage = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await api.get<DemoResponse>(
          `/demo/autocomplete?q=${encodeURIComponent(query.trim())}`
        );

        setResults(response.data.data ?? []);

        const remaining = response.headers["x-demo-ratelimit-remaining"];

        if (remaining !== undefined) {
          setRemainingRequests(Number(remaining));
        }
      } catch (err) {
        setResults([]);
        setError(
          getApiMessage(err, "Unable to search villages right now.")
        );
      } finally {
        setLoading(false);
      }
    };

    const timer = window.setTimeout(searchVillage, 350);

    return () => {
      window.clearTimeout(timer);
    };
  }, [query]);

  // ============================================================
  // SELECT VILLAGE
  // ============================================================

  const selectVillage = (village: DemoResult) => {
    setSelected(village);
    setQuery(village.label);
    setResults([]);
    setError("");
  };

  // ============================================================
  // CONTACT FORM
  // ============================================================

  const submitContact = async (event: React.FormEvent) => {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Please complete all required contact fields.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await api.post("/demo/contact", {
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
        villageCode: selected?.value || "",
      });

      setSuccessMessage(
        response.data.message ||
          "Thank you. Your request has been received."
      );

      setName("");
      setEmail("");
      setMessage("");

      const remaining = response.headers["x-demo-ratelimit-remaining"];

      if (remaining !== undefined) {
        setRemainingRequests(Number(remaining));
      }
    } catch (err) {
      setError(
        getApiMessage(err, "Unable to submit your request.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "32px 20px 60px",
      }}
    >
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div
        style={{
          marginBottom: 30,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 1.2,
            opacity: 0.65,
          }}
        >
          PUBLIC DEMO CLIENT
        </p>

        <h1
          style={{
            margin: "8px 0 10px",
            fontSize: 34,
          }}
        >
          Indian Administrative Location API
        </h1>

        <p
          style={{
            margin: 0,
            maxWidth: 750,
            lineHeight: 1.6,
            opacity: 0.75,
          }}
        >
          Explore Maharashtra village data using the public demo.
          No API key or account is required.
        </p>
      </div>

      {/* ======================================================
          RATE LIMIT CARD
      ====================================================== */}

      <div
        style={{
          background: "#f5f7fb",
          border: "1px solid #e1e6ef",
          borderRadius: 14,
          padding: 16,
          marginBottom: 24,
        }}
      >
        <strong>Demo usage limit</strong>

        <p
          style={{
            margin: "6px 0 0",
            opacity: 0.7,
          }}
        >
          This public demo allows up to{" "}
          <strong>100 requests per day</strong>.
          {remainingRequests !== null
            ? ` ${remainingRequests} requests remaining.`
            : ""}
        </p>
      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div
          style={{
            marginBottom: 20,
            padding: 14,
            borderRadius: 10,
            background: "#fff1f1",
            border: "1px solid #f0c2c2",
            color: "#a52222",
          }}
        >
          {error}
        </div>
      )}

      {/* ======================================================
          SEARCH
      ====================================================== */}

      <div
        style={{
          background: "white",
          border: "1px solid #e1e6ef",
          borderRadius: 16,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h2 style={{ marginTop: 0 }}>
          Search Maharashtra Villages
        </h2>

        <p
          style={{
            opacity: 0.7,
            marginBottom: 16,
          }}
        >
          Start typing a village name to see matching locations.
        </p>

        <div style={{ position: "relative" }}>
          <input
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelected(null);
            }}
            placeholder="e.g. Manibeli"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "14px 16px",
              borderRadius: 10,
              border: "1px solid #cfd6e2",
              fontSize: 16,
            }}
          />

          {loading && (
            <div
              style={{
                marginTop: 10,
                opacity: 0.65,
              }}
            >
              Searching...
            </div>
          )}

          {results.length > 0 && (
            <div
              style={{
                position: "absolute",
                zIndex: 10,
                left: 0,
                right: 0,
                top: "100%",
                background: "white",
                border: "1px solid #d9dfe8",
                borderRadius: 10,
                marginTop: 5,
                boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                overflow: "hidden",
              }}
            >
              {results.map((result) => (
                <button
                  key={result.value}
                  type="button"
                  onClick={() => selectVillage(result)}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "14px 16px",
                    textAlign: "left",
                    border: 0,
                    borderBottom: "1px solid #edf0f5",
                    background: "white",
                    cursor: "pointer",
                  }}
                >
                  <strong>{result.label}</strong>

                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 13,
                      opacity: 0.65,
                    }}
                  >
                    {result.fullAddress}
                  </div>
                </button>
              ))}
            </div>
          )}

          {query.trim().length >= 2 &&
            !loading &&
            results.length === 0 &&
            !selected && (
              <p
                style={{
                  marginBottom: 0,
                  opacity: 0.65,
                }}
              >
                No Maharashtra villages found.
              </p>
            )}
        </div>
      </div>

      {/* ======================================================
          SELECTED VILLAGE
      ====================================================== */}

      {selected && (
        <div
          style={{
            background: "white",
            border: "1px solid #e1e6ef",
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 1,
              opacity: 0.6,
            }}
          >
            SELECTED LOCATION
          </p>

          <h2 style={{ margin: "8px 0" }}>
            {selected.hierarchy.village.name}
          </h2>

          <p
            style={{
              margin: "0 0 20px",
              fontSize: 16,
            }}
          >
            {selected.fullAddress}
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
            }}
          >
            <div>
              <strong>Village</strong>
              <div>{selected.hierarchy.village.name}</div>
            </div>

            <div>
              <strong>Sub-District</strong>
              <div>{selected.hierarchy.subDistrict.name}</div>
            </div>

            <div>
              <strong>District</strong>
              <div>{selected.hierarchy.district.name}</div>
            </div>

            <div>
              <strong>State</strong>
              <div>{selected.hierarchy.state.name}</div>
            </div>

            <div>
              <strong>Country</strong>
              <div>{selected.hierarchy.country.name}</div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          CONTACT FORM
      ====================================================== */}

      <div
        style={{
          background: "white",
          border: "1px solid #e1e6ef",
          borderRadius: 16,
          padding: 24,
        }}
      >
        <h2 style={{ marginTop: 0 }}>
          Contact / API Access Request
        </h2>

        <p
          style={{
            opacity: 0.7,
            lineHeight: 1.5,
          }}
        >
          Interested in using the full API? Send us your details.
        </p>

        {successMessage && (
          <div
            style={{
              marginBottom: 18,
              padding: 14,
              borderRadius: 10,
              background: "#effaf4",
              border: "1px solid #bfe5cc",
              color: "#167044",
            }}
          >
            {successMessage}
          </div>
        )}

        <form onSubmit={submitContact}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 16,
            }}
          >
            <div>
              <label
                htmlFor="demo-name"
                style={{
                  display: "block",
                  marginBottom: 6,
                  fontWeight: 600,
                }}
              >
                Name *
              </label>

              <input
                id="demo-name"
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Your name"
                maxLength={100}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "12px 14px",
                  borderRadius: 8,
                  border: "1px solid #cfd6e2",
                }}
              />
            </div>

            <div>
              <label
                htmlFor="demo-email"
                style={{
                  display: "block",
                  marginBottom: 6,
                  fontWeight: 600,
                }}
              >
                Email *
              </label>

              <input
                id="demo-email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="you@example.com"
                maxLength={200}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "12px 14px",
                  borderRadius: 8,
                  border: "1px solid #cfd6e2",
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <label
              htmlFor="demo-message"
              style={{
                display: "block",
                marginBottom: 6,
                fontWeight: 600,
              }}
            >
              Message *
            </label>

            <textarea
              id="demo-message"
              value={message}
              onChange={(event) =>
                setMessage(event.target.value)
              }
              placeholder="Tell us how you plan to use the API..."
              maxLength={2000}
              rows={5}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px 14px",
                borderRadius: 8,
                border: "1px solid #cfd6e2",
                resize: "vertical",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: 16,
              padding: "12px 20px",
              borderRadius: 8,
              border: 0,
              cursor: submitting ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            {submitting ? "Submitting..." : "Submit Request"}
          </button>
        </form>
      </div>
    </section>
  );
}