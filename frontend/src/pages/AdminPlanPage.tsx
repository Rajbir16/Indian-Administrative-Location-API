import { useEffect, useState } from "react";
import { api, getApiMessage } from "../services/api";

interface Plan {
  name: "FREE" | "PREMIUM" | "PRO" | "UNLIMITED";
  price: number;
  dailyRequestLimit: number;
  burstPerMinuteLimit: number;
  stateAccessPolicy: string;
}

const planOrder: Plan["name"][] = [
  "FREE",
  "PREMIUM",
  "PRO",
  "UNLIMITED",
];

export function AdminPlanPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<number | null>(
    null
  );

  const [userId, setUserId] = useState("");
  const [selectedPlan, setSelectedPlan] =
    useState<Plan["name"]>("FREE");

  const [currentUserPlan, setCurrentUserPlan] =
    useState<Plan | null>(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // ----------------------------------------------------------
  // LOAD PLANS
  // ----------------------------------------------------------

  const loadPlans = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get<{ data: Plan[] }>(
        "/admin/plans"
      );

      setPlans(response.data.data ?? []);
    } catch (err) {
      setError(
        getApiMessage(err, "Unable to load subscription plans.")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  // ----------------------------------------------------------
  // LOAD USER PLAN
  // ----------------------------------------------------------

  const loadUserPlan = async () => {
    const id = Number(userId);

    if (!Number.isInteger(id) || id <= 0) {
      setError("Please enter a valid user ID.");
      return;
    }

    try {
      setError("");
      setMessage("");

      const response = await api.get<{
        data: {
          userId: number;
          plan: Plan;
        };
      }>(`/admin/users/${id}/plan`);

      const plan = response.data.data.plan;

      setCurrentUserPlan(plan);
      setSelectedPlan(plan.name);
    } catch (err) {
      setCurrentUserPlan(null);
      setError(
        getApiMessage(err, "Unable to load the user's plan.")
      );
    }
  };

  // ----------------------------------------------------------
  // UPDATE USER PLAN
  // ----------------------------------------------------------

  const updateUserPlan = async () => {
    const id = Number(userId);

    if (!Number.isInteger(id) || id <= 0) {
      setError("Please enter a valid user ID.");
      return;
    }

    try {
      setSavingUserId(id);
      setError("");
      setMessage("");

      const response = await api.put<{
        data: {
          userId: number;
          plan: Plan;
        };
      }>(`/admin/users/${id}/plan`, {
        plan: selectedPlan,
      });

      setCurrentUserPlan(response.data.data.plan);

      setMessage(
        `User ${id} has been moved to the ${selectedPlan} plan.`
      );
    } catch (err) {
      setError(
        getApiMessage(err, "Unable to update the user's plan.")
      );
    } finally {
      setSavingUserId(null);
    }
  };

  const formatLimit = (value: number) => {
    if (value >= 1_000_000) {
      return `${value / 1_000_000}M`;
    }

    if (value >= 1_000) {
      return `${value / 1_000}K`;
    }

    return value.toLocaleString();
  };

  return (
    <section className="foundation-page">
      <div className="foundation-header">
        <div>
          <p className="foundation-eyebrow">
            ADMINISTRATION
          </p>

          <h1>Plan Management</h1>

          <p>
            Review subscription plans and manage user plan
            assignments.
          </p>
        </div>
      </div>

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

      {message && (
        <div
          style={{
            marginBottom: 20,
            padding: 14,
            borderRadius: 10,
            background: "#effaf4",
            border: "1px solid #bfe5cc",
            color: "#167044",
          }}
        >
          {message}
        </div>
      )}

      {/* ----------------------------------------------------
          PLAN DEFINITIONS
      ----------------------------------------------------- */}

      <div
        style={{
          background: "white",
          border: "1px solid #e1e6ef",
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 20,
            marginBottom: 18,
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>
              Subscription Plans
            </h2>

            <p style={{ margin: "5px 0 0" }}>
              Current plan definitions and API limits.
            </p>
          </div>

          <button
            type="button"
            onClick={loadPlans}
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 20 }}>
            Loading plans...
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(230px, 1fr))",
              gap: 16,
            }}
          >
            {planOrder.map((planName) => {
              const plan = plans.find(
                (item) => item.name === planName
              );

              if (!plan) return null;

              return (
                <div
                  key={plan.name}
                  style={{
                    border: "1px solid #e1e6ef",
                    borderRadius: 14,
                    padding: 18,
                  }}
                >
                  <h3 style={{ marginTop: 0 }}>
                    {plan.name}
                  </h3>

                  <div
                    style={{
                      fontSize: 26,
                      fontWeight: 700,
                      marginBottom: 15,
                    }}
                  >
                    ₹{plan.price.toLocaleString()}
                  </div>

                  <div style={{ marginBottom: 8 }}>
                    <strong>Daily requests:</strong>{" "}
                    {formatLimit(plan.dailyRequestLimit)}
                  </div>

                  <div style={{ marginBottom: 8 }}>
                    <strong>Requests/min:</strong>{" "}
                    {formatLimit(plan.burstPerMinuteLimit)}
                  </div>

                  <div>
                    <strong>State access:</strong>{" "}
                    {plan.stateAccessPolicy}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ----------------------------------------------------
          USER PLAN MANAGEMENT
      ----------------------------------------------------- */}

      <div
        style={{
          background: "white",
          border: "1px solid #e1e6ef",
          borderRadius: 16,
          padding: 20,
        }}
      >
        <h2 style={{ marginTop: 0 }}>
          Manage User Plan
        </h2>

        <p>
          Enter a user ID to view or update that user's
          subscription plan.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(180px, 240px) minmax(180px, 240px) auto",
            gap: 12,
            alignItems: "end",
            marginTop: 20,
          }}
        >
          <div>
            <label
              htmlFor="plan-user-id"
              style={{
                display: "block",
                marginBottom: 6,
                fontWeight: 600,
              }}
            >
              User ID
            </label>

            <input
              id="plan-user-id"
              type="number"
              min="1"
              value={userId}
              onChange={(event) =>
                setUserId(event.target.value)
              }
              placeholder="e.g. 15"
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label
              htmlFor="plan-select"
              style={{
                display: "block",
                marginBottom: 6,
                fontWeight: 600,
              }}
            >
              New Plan
            </label>

            <select
              id="plan-select"
              value={selectedPlan}
              onChange={(event) =>
                setSelectedPlan(
                  event.target.value as Plan["name"]
                )
              }
              style={{ width: "100%" }}
            >
              {planOrder.map((plan) => (
                <option key={plan} value={plan}>
                  {plan}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={loadUserPlan}
          >
            Load User
          </button>
        </div>

        {currentUserPlan && (
          <div
            style={{
              marginTop: 24,
              padding: 18,
              border: "1px solid #e1e6ef",
              borderRadius: 12,
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              Current Plan
            </h3>

            <p>
              User ID:{" "}
              <strong>
                {currentUserPlan
                  ? userId
                  : "—"}
              </strong>
            </p>

            <p>
              Current plan:{" "}
              <strong>{currentUserPlan.name}</strong>
            </p>

            <p>
              Daily limit:{" "}
              <strong>
                {currentUserPlan.dailyRequestLimit.toLocaleString()}
              </strong>
            </p>

            <p>
              Per-minute limit:{" "}
              <strong>
                {currentUserPlan.burstPerMinuteLimit.toLocaleString()}
              </strong>
            </p>

            <button
              type="button"
              disabled={
                savingUserId !== null ||
                currentUserPlan.name === selectedPlan
              }
              onClick={updateUserPlan}
            >
              {savingUserId !== null
                ? "Updating..."
                : currentUserPlan.name === selectedPlan
                  ? "Plan Already Selected"
                  : `Change to ${selectedPlan}`}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}