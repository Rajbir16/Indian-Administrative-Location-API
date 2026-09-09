import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, getApiMessage } from "../services/api";

interface UserRow {
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
  createdAt: string;
  updatedAt: string;
  lastActive?: string | null;
  requestCount: number;
}

interface UsersResponse {
  data: UserRow[];
  meta: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const statusOptions = [
  "ALL",
  "PENDING_APPROVAL",
  "ACTIVE",
  "REJECTED",
  "SUSPENDED",
];

const planOptions = ["ALL", "FREE", "PREMIUM", "PRO", "UNLIMITED"];

export function AdminUsersPage() {
  const navigate = useNavigate();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [plan, setPlan] = useState("ALL");

  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [selected, setSelected] = useState<number[]>([]);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [message, setMessage] = useState("");

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      params.set("page", String(page));
      params.set("limit", "25");
      params.set("sort", "createdAt");
      params.set("order", "desc");

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (status !== "ALL") {
        params.set("status", status);
      }

      if (plan !== "ALL") {
        params.set("plan", plan);
      }

      const response = await api.get<UsersResponse>(
        `/admin/users?${params.toString()}`
      );

      setUsers(response.data.data);
      setPages(response.data.meta.pages);
      setTotal(response.data.meta.total);
      setSelected([]);
    } catch (err) {
      setError(getApiMessage(err, "Unable to load users."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page, status, plan]);

  const performAction = async (
    id: number,
    action: "approve" | "reject" | "suspend" | "reactivate"
  ) => {
    try {
      setActionLoading(id);
      setError("");
      setMessage("");

      await api.post(`/admin/users/${id}/${action}`);

      setMessage(`User ${action}d successfully.`);
      await loadUsers();
    } catch (err) {
      setError(getApiMessage(err, `Unable to ${action} user.`));
    } finally {
      setActionLoading(null);
    }
  };

  const deleteUser = async (id: number) => {
    const confirmed = window.confirm(
      "Delete this user permanently? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      setActionLoading(id);
      setError("");
      setMessage("");

      await api.post("/admin/users/bulk-action", {
        action: "delete",
        userIds: [id],
      });

      setMessage("User deleted successfully.");
      await loadUsers();
    } catch (err) {
      setError(getApiMessage(err, "Unable to delete user."));
    } finally {
      setActionLoading(null);
    }
  };

  const runBulkAction = async (
    action: "approve" | "suspend" | "delete"
  ) => {
    if (selected.length === 0) return;

    if (
      action === "delete" &&
      !window.confirm(
        `Delete ${selected.length} selected user(s) permanently?`
      )
    ) {
      return;
    }

    try {
      setBulkLoading(true);
      setError("");
      setMessage("");

      await api.post("/admin/users/bulk-action", {
        action,
        userIds: selected,
      });

      setMessage(
        `${selected.length} user(s) ${action}d successfully where permitted.`
      );

      await loadUsers();
    } catch (err) {
      setError(getApiMessage(err, "Bulk action failed."));
    } finally {
      setBulkLoading(false);
    }
  };

  const toggleSelected = (id: number) => {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const toggleAll = () => {
    if (selected.length === users.length) {
      setSelected([]);
    } else {
      setSelected(users.map((user) => user.id));
    }
  };

  const applySearch = () => {
    setPage(1);
    loadUsers();
  };

  const statusLabel = (value: string) => {
    if (value === "PENDING_APPROVAL") return "PENDING";
    return value;
  };

  return (
    <section className="foundation-page">
      <div className="foundation-header">
        <div>
          <p className="foundation-eyebrow">ADMINISTRATION</p>
          <h1>User Management</h1>
          <p>
            Review, approve and manage B2B API users and their access.
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

      <div
        style={{
          background: "white",
          border: "1px solid #e1e6ef",
          borderRadius: 16,
          padding: 20,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(240px, 1fr) 180px 180px auto",
            gap: 12,
            alignItems: "end",
          }}
        >
          <div>
            <label>Search users</label>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  applySearch();
                }
              }}
              placeholder="Email, business name..."
              style={{ width: "100%", marginTop: 6 }}
            />
          </div>

          <div>
            <label>Status</label>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              style={{ width: "100%", marginTop: 6 }}
            >
              {statusOptions.map((item) => (
                <option key={item} value={item}>
                  {item === "ALL" ? "All statuses" : statusLabel(item)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Plan</label>
            <select
              value={plan}
              onChange={(event) => {
                setPlan(event.target.value);
                setPage(1);
              }}
              style={{ width: "100%", marginTop: 6 }}
            >
              {planOptions.map((item) => (
                <option key={item} value={item}>
                  {item === "ALL" ? "All plans" : item}
                </option>
              ))}
            </select>
          </div>

          <button type="button" onClick={applySearch}>
            Search
          </button>
        </div>
      </div>

      {selected.length > 0 && (
        <div
          style={{
            background: "#fff8e8",
            border: "1px solid #efd99a",
            borderRadius: 12,
            padding: 14,
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <strong>{selected.length} selected</strong>

          <button
            type="button"
            disabled={bulkLoading}
            onClick={() => runBulkAction("approve")}
          >
            Approve
          </button>

          <button
            type="button"
            disabled={bulkLoading}
            onClick={() => runBulkAction("suspend")}
          >
            Suspend
          </button>

          <button
            type="button"
            disabled={bulkLoading}
            onClick={() => runBulkAction("delete")}
          >
            Delete
          </button>
        </div>
      )}

      <div
        style={{
          background: "white",
          border: "1px solid #e1e6ef",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: 20,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>Users</h2>
            <p style={{ margin: "5px 0 0" }}>
              {total} users found
            </p>
          </div>

          <button type="button" onClick={loadUsers}>
            Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 24 }}>Loading users...</div>
        ) : users.length === 0 ? (
          <div style={{ padding: 24 }}>
            No users match the selected filters.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 1100,
              }}
            >
              <thead>
                <tr>
                  <th style={{ padding: 14, textAlign: "left" }}>
                    <input
                      type="checkbox"
                      checked={
                        users.length > 0 &&
                        selected.length === users.length
                      }
                      onChange={toggleAll}
                    />
                  </th>

                  <th style={{ padding: 14, textAlign: "left" }}>
                    User
                  </th>

                  <th style={{ padding: 14, textAlign: "left" }}>
                    Business
                  </th>

                  <th style={{ padding: 14, textAlign: "left" }}>
                    Status
                  </th>

                  <th style={{ padding: 14, textAlign: "left" }}>
                    Plan
                  </th>

                  <th style={{ padding: 14, textAlign: "left" }}>
                    Requests
                  </th>

                  <th style={{ padding: 14, textAlign: "left" }}>
                    Last Active
                  </th>

                  <th style={{ padding: 14, textAlign: "right" }}>
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td style={{ padding: 14 }}>
                      <input
                        type="checkbox"
                        checked={selected.includes(user.id)}
                        onChange={() => toggleSelected(user.id)}
                      />
                    </td>

                    <td style={{ padding: 14 }}>
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/admin/users/${user.id}`)
                        }
                        style={{
                          border: "none",
                          background: "transparent",
                          padding: 0,
                          cursor: "pointer",
                          fontWeight: 700,
                          textAlign: "left",
                        }}
                      >
                        {user.name || "Unnamed user"}
                      </button>

                      <div
                        style={{
                          fontSize: 13,
                          opacity: 0.7,
                        }}
                      >
                        {user.email}
                      </div>
                    </td>

                    <td style={{ padding: 14 }}>
                      {user.businessName || "—"}

                      {user.businessEmail && (
                        <div
                          style={{
                            fontSize: 13,
                            opacity: 0.7,
                          }}
                        >
                          {user.businessEmail}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: 14 }}>
                      <span
                        style={{
                          padding: "5px 9px",
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 600,
                          background:
                            user.approvalStatus === "ACTIVE"
                              ? "#eaf8f0"
                              : user.approvalStatus === "SUSPENDED"
                                ? "#fff4df"
                                : "#f2f2f2",
                        }}
                      >
                        {statusLabel(user.approvalStatus)}
                      </span>
                    </td>

                    <td style={{ padding: 14 }}>
                      {user.plan}
                    </td>

                    <td style={{ padding: 14 }}>
                      {user.requestCount.toLocaleString()}
                    </td>

                    <td style={{ padding: 14 }}>
                      {user.lastActive
                        ? new Date(
                            user.lastActive
                          ).toLocaleString()
                        : "Never"}
                    </td>

                    <td
                      style={{
                        padding: 14,
                        textAlign: "right",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {actionLoading === user.id ? (
                        "Working..."
                      ) : (
                        <>
                          {user.approvalStatus ===
                            "PENDING_APPROVAL" && (
                            <button
                              type="button"
                              onClick={() =>
                                performAction(
                                  user.id,
                                  "approve"
                                )
                              }
                              style={{
                                marginRight: 6,
                              }}
                            >
                              Approve
                            </button>
                          )}

                          {user.approvalStatus === "ACTIVE" && (
                            <button
                              type="button"
                              onClick={() =>
                                performAction(
                                  user.id,
                                  "suspend"
                                )
                              }
                              style={{
                                marginRight: 6,
                              }}
                            >
                              Suspend
                            </button>
                          )}

                          {user.approvalStatus === "SUSPENDED" && (
                            <button
                              type="button"
                              onClick={() =>
                                performAction(
                                  user.id,
                                  "reactivate"
                                )
                              }
                              style={{
                                marginRight: 6,
                              }}
                            >
                              Reactivate
                            </button>
                          )}

                          {user.role !== "ADMIN" && (
                            <button
                              type="button"
                              onClick={() =>
                                deleteUser(user.id)
                              }
                            >
                              Delete
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && pages > 1 && (
          <div
            style={{
              padding: 18,
              borderTop: "1px solid #e1e6ef",
              display: "flex",
              justifyContent: "center",
              gap: 12,
              alignItems: "center",
            }}
          >
            <button
              type="button"
              disabled={page <= 1}
              onClick={() =>
                setPage((current) => current - 1)
              }
            >
              Previous
            </button>

            <span>
              Page {page} of {pages}
            </span>

            <button
              type="button"
              disabled={page >= pages}
              onClick={() =>
                setPage((current) => current + 1)
              }
            >
              Next
            </button>
          </div>
        )}
      </div>
    </section>
  );
}