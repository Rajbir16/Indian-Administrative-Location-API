import { useEffect, useState } from "react";
import { api, getApiMessage } from "../services/api";

interface ApiKey {
  id: number;
  name: string;
  status: string;
  lastUsed: string | null;
  createdAt: string;
}

interface CreatedSecret {
  apiKey: string;
  secret: string;
  name: string;
  secretNotice: string;
}

export function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createdSecret, setCreatedSecret] = useState<CreatedSecret | null>(
    null
  );

  const loadKeys = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get<{ data: ApiKey[] }>("/auth/api-keys");
      setKeys(response.data.data);
    } catch (err) {
      setError(getApiMessage(err, "Unable to load API keys."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const createKey = async () => {
    if (!name.trim()) {
      setError("Please enter a name for the API key.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");
      setCreatedSecret(null);

      const response = await api.post<{
        data: {
          id: number;
          key: string;
          name: string;
          status: string;
          createdAt: string;
          secret: string;
          secretNotice: string;
        };
      }>("/auth/api-keys", {
        name: name.trim(),
      });

      setCreatedSecret({
        apiKey: response.data.data.key,
        secret: response.data.data.secret,
        name: response.data.data.name,
        secretNotice: response.data.data.secretNotice,
      });

      setName("");
      setSuccess("API key created successfully.");
      await loadKeys();
    } catch (err) {
      setError(getApiMessage(err, "Unable to create API key."));
    } finally {
      setSaving(false);
    }
  };

  const revokeKey = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to revoke this API key? This cannot be undone."
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await api.delete(`/auth/api-keys/${id}`);

      setSuccess("API key revoked successfully.");
      await loadKeys();
    } catch (err) {
      setError(getApiMessage(err, "Unable to revoke API key."));
    }
  };

  const rotateSecret = async (id: number) => {
    const confirmed = window.confirm(
      "Rotate this secret? The previous secret will stop working."
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");
      setCreatedSecret(null);

      const response = await api.post<{
        data: {
          apiKeyId: number;
          secret: string;
          secretNotice: string;
        };
      }>(`/auth/api-keys/${id}/rotate-secret`);

      const key = keys.find((item) => item.id === id);

      setCreatedSecret({
        apiKey: `API key #${id}`,
        secret: response.data.data.secret,
        name: key?.name || "API Key",
        secretNotice: response.data.data.secretNotice,
      });

      setSuccess("API secret rotated successfully.");
    } catch (err) {
      setError(getApiMessage(err, "Unable to rotate API secret."));
    }
  };

  const copyText = async (value: string, message: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setSuccess(message);
    } catch {
      setError("Unable to copy. Please copy it manually.");
    }
  };

  return (
    <section className="foundation-page">
      <div className="foundation-header">
        <div>
          <p className="foundation-eyebrow">DEVELOPER WORKSPACE</p>
          <h1>API Keys</h1>
          <p>
            Create and manage credentials for accessing the Indian
            Administrative Location API.
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
            border: "1px solid #f3c2c2",
            color: "#a52222",
          }}
        >
          {error}
        </div>
      )}

      {success && (
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
          {success}
        </div>
      )}

      {createdSecret && (
        <div
          style={{
            marginBottom: 24,
            padding: 20,
            borderRadius: 14,
            background: "#fff8e8",
            border: "1px solid #efd99a",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Save your API secret</h2>

          <p style={{ marginBottom: 18 }}>
            {createdSecret.secretNotice}
          </p>

          <div style={{ marginBottom: 14 }}>
            <strong>{createdSecret.name}</strong>
          </div>

          <div
            style={{
              display: "grid",
              gap: 12,
            }}
          >
            <div>
              <label>API Key</label>
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <input
                  readOnly
                  value={createdSecret.apiKey}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() =>
                    copyText(createdSecret.apiKey, "API key copied.")
                  }
                >
                  Copy
                </button>
              </div>
            </div>

            <div>
              <label>API Secret</label>
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <input
                  readOnly
                  value={createdSecret.secret}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() =>
                    copyText(createdSecret.secret, "API secret copied.")
                  }
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          background: "white",
          border: "1px solid #e1e6ef",
          borderRadius: 16,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h2 style={{ marginTop: 0 }}>Create API key</h2>
        <p>Give your key a name so you can identify it later.</p>

        <div
          style={{
            display: "flex",
            gap: 12,
            maxWidth: 700,
          }}
        >
          <input
            type="text"
            placeholder="e.g. Production App"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                createKey();
              }
            }}
            style={{
              flex: 1,
              minWidth: 0,
            }}
          />

          <button
            type="button"
            onClick={createKey}
            disabled={saving}
          >
            {saving ? "Creating..." : "Generate API Key"}
          </button>
        </div>
      </div>

      <div
        style={{
          background: "white",
          border: "1px solid #e1e6ef",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <div style={{ padding: 24 }}>
          <h2 style={{ margin: 0 }}>Your API keys</h2>
          <p style={{ marginBottom: 0 }}>
            You can have up to 5 active API keys.
          </p>
        </div>

        {loading ? (
          <div style={{ padding: 24 }}>Loading API keys...</div>
        ) : keys.length === 0 ? (
          <div style={{ padding: 24 }}>
            No API keys yet. Create your first key above.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: 16 }}>Name</th>
                  <th style={{ textAlign: "left", padding: 16 }}>API Key</th>
                  <th style={{ textAlign: "left", padding: 16 }}>Status</th>
                  <th style={{ textAlign: "left", padding: 16 }}>
                    Last Used
                  </th>
                  <th style={{ textAlign: "left", padding: 16 }}>
                    Created
                  </th>
                  <th style={{ textAlign: "right", padding: 16 }}>
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {keys.map((key) => (
                  <tr key={key.id}>
                    <td style={{ padding: 16 }}>{key.name}</td>

                    <td
                      style={{
                        padding: 16,
                        fontFamily: "monospace",
                      }}
                    >
                      ak_••••••••••••••••
                    </td>

                    <td style={{ padding: 16 }}>
                      <span
                        style={{
                          padding: "5px 10px",
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 600,
                          background:
                            key.status === "ACTIVE"
                              ? "#eaf8f0"
                              : "#f3f3f3",
                          color:
                            key.status === "ACTIVE"
                              ? "#167044"
                              : "#666",
                        }}
                      >
                        {key.status}
                      </span>
                    </td>

                    <td style={{ padding: 16 }}>
                      {key.lastUsed
                        ? new Date(key.lastUsed).toLocaleString()
                        : "Never"}
                    </td>

                    <td style={{ padding: 16 }}>
                      {new Date(key.createdAt).toLocaleDateString()}
                    </td>

                    <td
                      style={{
                        padding: 16,
                        textAlign: "right",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {key.status === "ACTIVE" && (
                        <>
                          <button
                            type="button"
                            onClick={() => rotateSecret(key.id)}
                            style={{ marginRight: 8 }}
                          >
                            Rotate Secret
                          </button>

                          <button
                            type="button"
                            onClick={() => revokeKey(key.id)}
                          >
                            Revoke
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}