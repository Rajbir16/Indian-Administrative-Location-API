import { useEffect, useState } from "react";
import { api, getApiMessage } from "../services/api";

interface ApiLog {
  timestamp: string;
  apiKey: string | null;
  user: {
    id: number;
    name: string;
    businessName: string | null;
    email: string;
  } | null;
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  ip: string | null;
}

interface ApiLogsResponse {
  success: boolean;
  count: number;
  data: ApiLog[];
  meta?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

const formatDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
};

const getStatusLabel = (statusCode: number) => {
  if (statusCode >= 200 && statusCode < 300) return "2xx";
  if (statusCode >= 400 && statusCode < 500) return "4xx";
  if (statusCode >= 500 && statusCode < 600) return "5xx";
  return String(statusCode);
};

export function AdminApiLogsPage() {
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [page, setPage] = useState(1);
  const pageSize = 1000;

  const [range, setRange] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [user, setUser] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [status, setStatus] = useState("");
  const [minResponseTime, setMinResponseTime] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const buildParams = (currentPage: number) => {
    const params = new URLSearchParams();

    params.set("page", String(currentPage));
    params.set("pageSize", String(pageSize));

    if (range) {
      params.set("range", range);
    }

    if (range === "custom") {
      if (from) {
        params.set("from", new Date(from).toISOString());
      }

      if (to) {
        params.set("to", new Date(to).toISOString());
      }
    }

    if (user.trim()) {
      params.set("user", user.trim());
    }

    if (endpoint.trim()) {
      params.set("endpoint", endpoint.trim());
    }

    if (status) {
      params.set("status", status);
    }

    if (minResponseTime !== "") {
      params.set("minResponseTime", minResponseTime);
    }

    return params;
  };

  const loadLogs = async (currentPage = page) => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const params = buildParams(currentPage);

      const response = await api.get<ApiLogsResponse>(
        `/admin/api-logs?${params.toString()}`
      );

      setLogs(response.data.data ?? []);
      setTotal(response.data.meta?.total ?? response.data.count ?? 0);
      setTotalPages(
        response.data.meta?.totalPages ??
          Math.max(
            1,
            Math.ceil(
              (response.data.meta?.total ?? response.data.count ?? 0) /
                pageSize
            )
          )
      );
    } catch (err) {
      setLogs([]);
      setTotal(0);
      setTotalPages(1);
      setError(getApiMessage(err, "Unable to load API logs."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(1);
  }, []);

  const applyFilters = () => {
    if (range === "custom" && (!from || !to)) {
      setError("Please provide both From and To dates.");
      return;
    }

    setPage(1);
    loadLogs(1);
  };

  const clearFilters = () => {
    setRange("");
    setFrom("");
    setTo("");
    setUser("");
    setEndpoint("");
    setStatus("");
    setMinResponseTime("");
    setPage(1);

    setTimeout(() => {
      loadLogs(1);
    }, 0);
  };

  const changePage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages) {
      return;
    }

    setPage(nextPage);
    loadLogs(nextPage);
  };

  const exportLogs = async (format: "csv" | "json") => {
    try {
      setError("");
      setMessage("");

      const params = buildParams(1);
      params.delete("page");
      params.delete("pageSize");
      params.set("format", format);

      const response = await api.get(
        `/admin/api-logs/export?${params.toString()}`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], {
        type:
          format === "csv"
            ? "text/csv;charset=utf-8"
            : "application/json;charset=utf-8",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download =
        format === "csv" ? "api-logs.csv" : "api-logs.json";

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      setMessage(
        `API logs exported successfully as ${format.toUpperCase()}.`
      );
    } catch (err) {
      setError(getApiMessage(err, "Unable to export API logs."));
    }
  };

  return (
    <section className="foundation-page">
      <div className="foundation-header">
        <div>
          <p className="foundation-eyebrow">
            ADMINISTRATION
          </p>

          <h1>API Logs</h1>

          <p>
            Monitor API requests, response times, status codes and
            client activity.
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

      {/* FILTERS */}

      <div
        style={{
          background: "white",
          border: "1px solid #e1e6ef",
          borderRadius: 16,
          padding: 20,
          marginBottom: 20,
        }}
      >
        <h2 style={{ marginTop: 0 }}>Log Filters</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 14,
          }}
        >
          {/* DATE RANGE */}

          <div>
            <label
              htmlFor="log-range"
              style={{
                display: "block",
                marginBottom: 6,
                fontWeight: 600,
              }}
            >
              Date Range
            </label>

            <select
              id="log-range"
              value={range}
              onChange={(event) => {
                setRange(event.target.value);

                if (event.target.value !== "custom") {
                  setFrom("");
                  setTo("");
                }
              }}
              style={{ width: "100%" }}
            >
              <option value="">All time</option>
              <option value="hour">Last hour</option>
              <option value="day">Last 24 hours</option>
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
              <option value="custom">Custom range</option>
            </select>
          </div>

          {/* STATUS */}

          <div>
            <label
              htmlFor="log-status"
              style={{
                display: "block",
                marginBottom: 6,
                fontWeight: 600,
              }}
            >
              Status
            </label>

            <select
              id="log-status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value)
              }
              style={{ width: "100%" }}
            >
              <option value="">All statuses</option>
              <option value="2xx">2xx Success</option>
              <option value="4xx">4xx Client Error</option>
              <option value="5xx">5xx Server Error</option>
            </select>
          </div>

          {/* USER */}

          <div>
            <label
              htmlFor="log-user"
              style={{
                display: "block",
                marginBottom: 6,
                fontWeight: 600,
              }}
            >
              User
            </label>

            <input
              id="log-user"
              value={user}
              onChange={(event) =>
                setUser(event.target.value)
              }
              placeholder="Email or business name..."
              maxLength={200}
              style={{ width: "100%" }}
            />
          </div>

          {/* ENDPOINT */}

          <div>
            <label
              htmlFor="log-endpoint"
              style={{
                display: "block",
                marginBottom: 6,
                fontWeight: 600,
              }}
            >
              Endpoint
            </label>

            <input
              id="log-endpoint"
              value={endpoint}
              onChange={(event) =>
                setEndpoint(event.target.value)
              }
              placeholder="e.g. /v1/search"
              maxLength={200}
              style={{ width: "100%" }}
            />
          </div>

          {/* MIN RESPONSE */}

          <div>
            <label
              htmlFor="log-response"
              style={{
                display: "block",
                marginBottom: 6,
                fontWeight: 600,
              }}
            >
              Min Response Time (ms)
            </label>

            <input
              id="log-response"
              type="number"
              min="0"
              value={minResponseTime}
              onChange={(event) =>
                setMinResponseTime(event.target.value)
              }
              placeholder="e.g. 1000"
              style={{ width: "100%" }}
            />
          </div>

          {/* CUSTOM FROM */}

          {range === "custom" && (
            <div>
              <label
                htmlFor="log-from"
                style={{
                  display: "block",
                  marginBottom: 6,
                  fontWeight: 600,
                }}
              >
                From
              </label>

              <input
                id="log-from"
                type="datetime-local"
                value={from}
                onChange={(event) =>
                  setFrom(event.target.value)
                }
                style={{ width: "100%" }}
              />
            </div>
          )}

          {/* CUSTOM TO */}

          {range === "custom" && (
            <div>
              <label
                htmlFor="log-to"
                style={{
                  display: "block",
                  marginBottom: 6,
                  fontWeight: 600,
                }}
              >
                To
              </label>

              <input
                id="log-to"
                type="datetime-local"
                value={to}
                onChange={(event) =>
                  setTo(event.target.value)
                }
                style={{ width: "100%" }}
              />
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 18,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={applyFilters}
            disabled={loading}
          >
            {loading ? "Loading..." : "Apply Filters"}
          </button>

          <button
            type="button"
            onClick={clearFilters}
            disabled={loading}
          >
            Clear
          </button>

          <button
            type="button"
            onClick={() => exportLogs("csv")}
            disabled={loading}
          >
            Export CSV
          </button>

          <button
            type="button"
            onClick={() => exportLogs("json")}
            disabled={loading}
          >
            Export JSON
          </button>
        </div>
      </div>

      {/* RESULTS */}

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
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>
              API Request Logs
            </h2>

            <p style={{ margin: "5px 0 0" }}>
              {total.toLocaleString()} log records found
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadLogs(page)}
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 24 }}>
            Loading API logs...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 24 }}>
            No API logs found for the selected filters.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 1200,
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      padding: 14,
                      textAlign: "left",
                    }}
                  >
                    Timestamp
                  </th>

                  <th
                    style={{
                      padding: 14,
                      textAlign: "left",
                    }}
                  >
                    API Key
                  </th>

                  <th
                    style={{
                      padding: 14,
                      textAlign: "left",
                    }}
                  >
                    User
                  </th>

                  <th
                    style={{
                      padding: 14,
                      textAlign: "left",
                    }}
                  >
                    Endpoint
                  </th>

                  <th
                    style={{
                      padding: 14,
                      textAlign: "left",
                    }}
                  >
                    Method
                  </th>

                  <th
                    style={{
                      padding: 14,
                      textAlign: "left",
                    }}
                  >
                    Response
                  </th>

                  <th
                    style={{
                      padding: 14,
                      textAlign: "left",
                    }}
                  >
                    Status
                  </th>

                  <th
                    style={{
                      padding: 14,
                      textAlign: "left",
                    }}
                  >
                    IP
                  </th>
                </tr>
              </thead>

              <tbody>
                {logs.map((log, index) => (
                  <tr key={`${log.timestamp}-${index}`}>
                    <td style={{ padding: 14 }}>
                      {formatDate(log.timestamp)}
                    </td>

                    <td
                      style={{
                        padding: 14,
                        fontFamily: "monospace",
                      }}
                    >
                      {log.apiKey ?? "—"}
                    </td>

                    <td style={{ padding: 14 }}>
                      {log.user ? (
                        <div>
                          <strong>
                            {log.user.name}
                          </strong>

                          <div
                            style={{
                              fontSize: 13,
                              opacity: 0.7,
                              marginTop: 3,
                            }}
                          >
                            {log.user.email}
                          </div>

                          {log.user.businessName && (
                            <div
                              style={{
                                fontSize: 13,
                                opacity: 0.7,
                              }}
                            >
                              {log.user.businessName}
                            </div>
                          )}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td
                      style={{
                        padding: 14,
                        fontFamily: "monospace",
                      }}
                    >
                      {log.endpoint}
                    </td>

                    <td style={{ padding: 14 }}>
                      {log.method}
                    </td>

                    <td style={{ padding: 14 }}>
                      {log.responseTime} ms
                    </td>

                    <td style={{ padding: 14 }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "5px 9px",
                          borderRadius: 999,
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        {log.statusCode}{" "}
                        {getStatusLabel(log.statusCode)}
                      </span>
                    </td>

                    <td
                      style={{
                        padding: 14,
                        fontFamily: "monospace",
                      }}
                    >
                      {log.ip ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION */}

        {!loading && totalPages > 1 && (
          <div
            style={{
              padding: 18,
              borderTop: "1px solid #e1e6ef",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => changePage(page - 1)}
            >
              Previous
            </button>

            <span>
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => changePage(page + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </section>
  );
}