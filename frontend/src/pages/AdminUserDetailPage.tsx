import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, getApiMessage } from "../services/api";

interface State {
  id: number;
  code: string;
  name: string;
}

interface StateAccess {
  allStates: boolean;
  stateCodes: string[];
}

interface UserDetail {
  id: number;
  email: string;
  name: string;
  businessEmail?: string | null;
  businessName?: string | null;
  gstNumber?: string | null;
  phoneNumber?: string | null;
  status: string;
  approvalStatus: string;
  role: string;
  plan: string;
  rejectionReason?: string | null;
  approvedAt?: string | null;
  approvedBy?: number | null;
  createdAt: string;
  updatedAt: string;
  stateAccess: unknown[];
  notes: Array<{
    id: number;
    note: string;
    createdAt: string;
  }>;
  apiKeys: Array<{
    id: number;
    name: string;
    key: string;
    status: string;
    lastUsed: string | null;
    requestCount: number;
    createdAt: string;
  }>;
  requestCount: number;
  apiLogCount: number;
}

export function AdminUserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState<UserDetail | null>(null);
  const [states, setStates] = useState<State[]>([]);
  const [stateAccess, setStateAccess] = useState<StateAccess>({
    allStates: false,
    stateCodes: [],
  });

  const [selectedStateIds, setSelectedStateIds] = useState<number[]>([]);

  const [loading, setLoading] = useState(true);
  const [savingStates, setSavingStates] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadUser = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError("");

      const [userResponse, accessResponse, statesResponse] =
        await Promise.all([
          api.get<{ data: UserDetail }>(`/admin/users/${id}`),
          api.get<{ data: StateAccess }>(
            `/admin/users/${id}/state-access`
          ),
          api.get<{ data: State[] }>("/v1/states"),
        ]);

      setUser(userResponse.data.data);
      setStateAccess(accessResponse.data.data);
      setStates(statesResponse.data.data);

      const accessCodes = accessResponse.data.data.stateCodes;

      setSelectedStateIds(
        statesResponse.data.data
          .filter((state) => accessCodes.includes(state.code))
          .map((state) => state.id)
      );
    } catch (err) {
      setError(getApiMessage(err, "Unable to load user details."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, [id]);

  const performAction = async (
    action: "approve" | "reject" | "suspend" | "reactivate"
  ) => {
    if (!id) return;

    try {
      setActionLoading(true);
      setError("");
      setMessage("");

      await api.post(`/admin/users/${id}/${action}`);

      setMessage(`User ${action}d successfully.`);
      await loadUser();
    } catch (err) {
      setError(getApiMessage(err, `Unable to ${action} user.`));
    } finally {
      setActionLoading(false);
    }
  };

  const grantAllStates = async () => {
    if (!id) return;

    try {
      setSavingStates(true);
      setError("");
      setMessage("");

      await api.post(`/admin/users/${id}/state-access/all`);

      setMessage("All-state access granted successfully.");
      await loadUser();
    } catch (err) {
      setError(getApiMessage(err, "Unable to grant all-state access."));
    } finally {
      setSavingStates(false);
    }
  };

  const saveSelectedStates = async () => {
    if (!id) return;

    try {
      setSavingStates(true);
      setError("");
      setMessage("");

      await api.put(`/admin/users/${id}/state-access`, {
        stateIds: selectedStateIds,
      });

      setMessage("Selected state access updated successfully.");
      await loadUser();
    } catch (err) {
      setError(getApiMessage(err, "Unable to update state access."));
    } finally {
      setSavingStates(false);
    }
  };

  const toggleState = (stateId: number) => {
    setSelectedStateIds((current) =>
      current.includes(stateId)
        ? current.filter((id) => id !== stateId)
        : [...current, stateId]
    );
  };

  if (loading) {
    return (
      <section className="foundation-page">
        <div className="foundation-header">
          <div>
            <p className="foundation-eyebrow">ADMINISTRATION</p>
            <h1>User Details</h1>
            <p>Loading user information...</p>
          </div>
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="foundation-page">
        <div className="foundation-header">
          <div>
            <p className="foundation-eyebrow">ADMINISTRATION</p>
            <h1>User Not Found</h1>
            <p>{error || "The requested user could not be found."}</p>
          </div>
        </div>

        <button type="button" onClick={() => navigate("/admin/users")}>
          Back to Users
        </button>
      </section>
    );
  }

  return (
    <section className="foundation-page">
      <div
        className="foundation-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 20,
          alignItems: "flex-start",
        }}
      >
        <div>
          <p className="foundation-eyebrow">ADMINISTRATION</p>
          <h1>{user.name || "User Details"}</h1>
          <p>{user.email}</p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/admin/users")}
        >
          ← Back to Users
        </button>
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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <MetricCard
          title="Plan"
          value={user.plan}
        />

        <MetricCard
          title="Role"
          value={user.role}
        />

        <MetricCard
          title="Requests"
          value={user.requestCount.toLocaleString()}
        />

        <MetricCard
          title="API Logs"
          value={user.apiLogCount.toLocaleString()}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 20,
          marginBottom: 24,
        }}
      >
        <Panel title="Account Information">
          <InfoRow label="User ID" value={String(user.id)} />
          <InfoRow label="Email" value={user.email} />
          <InfoRow
            label="Business Name"
            value={user.businessName || "—"}
          />
          <InfoRow
            label="Business Email"
            value={user.businessEmail || "—"}
          />
          <InfoRow
            label="GST Number"
            value={user.gstNumber || "—"}
          />
          <InfoRow
            label="Phone"
            value={user.phoneNumber || "—"}
          />
          <InfoRow
            label="Status"
            value={user.status}
          />
          <InfoRow
            label="Approval"
            value={user.approvalStatus}
          />
          <InfoRow
            label="Created"
            value={new Date(user.createdAt).toLocaleString()}
          />
        </Panel>

        <Panel title="Administration Actions">
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            {user.approvalStatus === "PENDING_APPROVAL" && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => performAction("approve")}
              >
                Approve
              </button>
            )}

            {user.approvalStatus === "ACTIVE" && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => performAction("suspend")}
              >
                Suspend
              </button>
            )}

            {user.approvalStatus === "SUSPENDED" && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => performAction("reactivate")}
              >
                Reactivate
              </button>
            )}

            {user.approvalStatus === "PENDING_APPROVAL" && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => performAction("reject")}
              >
                Reject
              </button>
            )}
          </div>

          {actionLoading && (
            <p style={{ marginTop: 15 }}>
              Updating user...
            </p>
          )}
        </Panel>
      </div>

      <Panel title="State Access">
        <p>
          Control which Indian states this user can access through
          the API.
        </p>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 20,
          }}
        >
          <button
            type="button"
            disabled={savingStates}
            onClick={grantAllStates}
          >
            Grant All States
          </button>

          <button
            type="button"
            disabled={savingStates}
            onClick={saveSelectedStates}
          >
            Save Selected States
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 10,
            maxHeight: 420,
            overflowY: "auto",
            padding: 4,
          }}
        >
          {states.map((state) => (
            <label
              key={state.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: 10,
                border: "1px solid #e1e6ef",
                borderRadius: 8,
              }}
            >
              <input
                type="checkbox"
                checked={selectedStateIds.includes(state.id)}
                disabled={stateAccess.allStates}
                onChange={() => toggleState(state.id)}
              />

              <span>
                {state.name}
                <small
                  style={{
                    display: "block",
                    opacity: 0.65,
                  }}
                >
                  {state.code}
                </small>
              </span>
            </label>
          ))}
        </div>

        <p style={{ marginTop: 15 }}>
          Current access:{" "}
          <strong>
            {stateAccess.allStates
              ? "All states"
              : stateAccess.stateCodes.length > 0
                ? `${stateAccess.stateCodes.length} state(s)`
                : "No states"}
          </strong>
        </p>
      </Panel>

      <Panel title="API Keys">
        {user.apiKeys.length === 0 ? (
          <p>No API keys associated with this user.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: 12 }}>
                    Name
                  </th>
                  <th style={{ textAlign: "left", padding: 12 }}>
                    Key
                  </th>
                  <th style={{ textAlign: "left", padding: 12 }}>
                    Status
                  </th>
                  <th style={{ textAlign: "left", padding: 12 }}>
                    Requests
                  </th>
                </tr>
              </thead>

              <tbody>
                {user.apiKeys.map((key) => (
                  <tr key={key.id}>
                    <td style={{ padding: 12 }}>
                      {key.name}
                    </td>

                    <td
                      style={{
                        padding: 12,
                        fontFamily: "monospace",
                      }}
                    >
                      {key.key}
                    </td>

                    <td style={{ padding: 12 }}>
                      {key.status}
                    </td>

                    <td style={{ padding: 12 }}>
                      {key.requestCount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Notes">
        {user.notes.length === 0 ? (
          <p>No admin notes have been added.</p>
        ) : (
          user.notes.map((note) => (
            <div
              key={note.id}
              style={{
                padding: 12,
                borderBottom: "1px solid #e1e6ef",
              }}
            >
              <p style={{ marginTop: 0 }}>{note.note}</p>
              <small>
                {new Date(note.createdAt).toLocaleString()}
              </small>
            </div>
          ))
        )}
      </Panel>
    </section>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e1e6ef",
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
      }}
    >
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      {children}
    </div>
  );
}

function MetricCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e1e6ef",
        borderRadius: 14,
        padding: 20,
      }}
    >
      <p style={{ margin: 0, opacity: 0.65 }}>{title}</p>
      <strong
        style={{
          display: "block",
          marginTop: 8,
          fontSize: 24,
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 20,
        padding: "9px 0",
        borderBottom: "1px solid #eef0f4",
      }}
    >
      <span style={{ opacity: 0.65 }}>{label}</span>
      <strong style={{ textAlign: "right" }}>{value}</strong>
    </div>
  );
}