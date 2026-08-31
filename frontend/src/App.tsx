import { useEffect, useState } from "react";
import axios from "axios";

interface State {
  id: number;
  code: string;
  name: string;
}

interface District {
  id: number;
  code: string;
  name: string;
}

interface SubDistrict {
  id: number;
  code: string;
  name: string;
}

interface Village {
  id: number;
  code: string;
  name: string;
}

interface LocationResult {
  code: string;
  name: string;
  subDistrict: {
    code: string;
    name: string;
  };
  district: {
    code: string;
    name: string;
  };
  state: {
    code: string;
    name: string;
  };
}

interface ApiKey {
  id: number;
  name: string;
  status: string;
  lastUsed: string | null;
  createdAt: string;
  key?: string;
}

const API_URL =
  "https://indian-administrative-location-api.onrender.com/api/v1";
const AUTH_URL =
  "https://indian-administrative-location-api.onrender.com/api/auth"

function App() {
  // ============================================================
  // SEARCH
  // ============================================================

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ============================================================
  // LOCATION EXPLORER
  // ============================================================

  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [subDistricts, setSubDistricts] = useState<SubDistrict[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);

  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedSubDistrict, setSelectedSubDistrict] = useState("");

  const [locationLoading, setLocationLoading] = useState(false);

  // ============================================================
  // AUTHENTICATION
  // ============================================================

  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("TestPassword123");
  const [token, setToken] = useState(
    localStorage.getItem("location_token") || ""
  );

  const [authMessage, setAuthMessage] = useState("");

  // ============================================================
  // API KEYS
  // ============================================================

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState("");
  const [showApiKeys, setShowApiKeys] = useState(false);

  // ============================================================
  // LOAD STATES
  // ============================================================

  const loadStates = async () => {
    try {
      setLocationLoading(true);
      setError("");

      const response = await axios.get(`${API_URL}/states`);

      setStates(response.data.data || []);
    } catch (err) {
      console.error(err);
      setError("Unable to load states.");
    } finally {
      setLocationLoading(false);
    }
  };

  // Load states automatically
  useEffect(() => {
    loadStates();
  }, []);

  // ============================================================
  // LOAD DISTRICTS
  // ============================================================

  const handleStateChange = async (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const stateCode = event.target.value;

    setSelectedState(stateCode);
    setSelectedDistrict("");
    setSelectedSubDistrict("");

    setDistricts([]);
    setSubDistricts([]);
    setVillages([]);

    if (!stateCode) {
      return;
    }

    try {
      setLocationLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/districts/${stateCode}`
      );

      setDistricts(response.data.data || []);
    } catch (err) {
      console.error(err);
      setError("Unable to load districts.");
    } finally {
      setLocationLoading(false);
    }
  };

  // ============================================================
  // LOAD SUB-DISTRICTS
  // ============================================================

  const handleDistrictChange = async (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const districtCode = event.target.value;

    setSelectedDistrict(districtCode);
    setSelectedSubDistrict("");

    setSubDistricts([]);
    setVillages([]);

    if (!districtCode) {
      return;
    }

    try {
      setLocationLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/subdistricts/${districtCode}`
      );

      setSubDistricts(response.data.data || []);
    } catch (err) {
      console.error(err);
      setError("Unable to load sub-districts.");
    } finally {
      setLocationLoading(false);
    }
  };

  // ============================================================
  // LOAD VILLAGES
  // ============================================================

  const handleSubDistrictChange = async (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const subDistrictCode = event.target.value;

    setSelectedSubDistrict(subDistrictCode);
    setVillages([]);

    if (!subDistrictCode) {
      return;
    }

    try {
      setLocationLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/villages/${subDistrictCode}`
      );

      setVillages(response.data.data || []);
    } catch (err) {
      console.error(err);
      setError("Unable to load villages.");
    } finally {
      setLocationLoading(false);
    }
  };

  // ============================================================
  // VILLAGE SEARCH
  // ============================================================

  const searchVillage = async () => {
    if (!query.trim()) {
      setError("Please enter a village name.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/villages/search`,
        {
          params: {
            q: query,
          },
        }
      );

      setResults(response.data.data || []);
    } catch (err) {
      console.error(err);
      setError(
        "Unable to search. Make sure the backend is running."
      );
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      searchVillage();
    }
  };

  // ============================================================
  // LOGIN
  // ============================================================

  const login = async () => {
    try {
      setAuthMessage("");

      const response = await axios.post(
        `${AUTH_URL}/login`,
        {
          email,
          password,
        }
      );

      const newToken = response.data.data.token;

      setToken(newToken);
      localStorage.setItem(
        "location_token",
        newToken
      );

      setAuthMessage("Login successful.");
    } catch (err) {
      console.error(err);
      setAuthMessage("Login failed. Check your credentials.");
    }
  };

  const logout = () => {
    setToken("");
    localStorage.removeItem("location_token");
    setApiKeys([]);
    setCreatedKey("");
    setAuthMessage("Logged out successfully.");
  };

  // ============================================================
  // API KEY LIST
  // ============================================================

  const loadApiKeys = async () => {
    if (!token) {
      setAuthMessage("Please login first.");
      return;
    }

    try {
      const response = await axios.get(
        `${AUTH_URL}/api-keys`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setApiKeys(response.data.data || []);
      setShowApiKeys(true);
    } catch (err) {
      console.error(err);
      setAuthMessage("Unable to load API keys.");
    }
  };

  // ============================================================
  // CREATE API KEY
  // ============================================================

  const createApiKey = async () => {
    if (!token) {
      setAuthMessage("Please login first.");
      return;
    }

    if (!newKeyName.trim()) {
      setAuthMessage("Enter an API key name.");
      return;
    }

    try {
      const response = await axios.post(
        `${AUTH_URL}/api-keys`,
        {
          name: newKeyName,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setCreatedKey(response.data.data.key);
      setNewKeyName("");

      await loadApiKeys();

      setAuthMessage(
        "API key created. Save the key securely."
      );
    } catch (err) {
      console.error(err);
      setAuthMessage("Unable to create API key.");
    }
  };

  // ============================================================
  // REVOKE API KEY
  // ============================================================

  const revokeApiKey = async (id: number) => {
    if (!token) {
      return;
    }

    try {
      await axios.delete(
        `${AUTH_URL}/api-keys/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await loadApiKeys();

      setAuthMessage(
        "API key revoked successfully."
      );
    } catch (err) {
      console.error(err);
      setAuthMessage("Unable to revoke API key.");
    }
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="app">

      {/* HEADER */}

      <header className="header">

        <div className="brand">

          <div className="brand-icon">
            🇮🇳
          </div>

          <div>
            <h1>
              Indian Administrative
              <span> Location API</span>
            </h1>

            <p>
              Explore India's administrative
              location hierarchy
            </p>
          </div>

        </div>

        <div className="status">
          <span className="status-dot"></span>
          API Online
        </div>

      </header>


      {/* MAIN */}

      <main>

        {/* HERO */}

        <section className="hero">

          <div className="hero-content">

            <div className="badge">
              🇮🇳 INDIA LOCATION DATA
            </div>

            <h2>
              Find any village in India
            </h2>

            <p>
              Search and explore villages across
              states, districts and sub-districts
              using the administrative location
              hierarchy.
            </p>

            <div className="search-box">

              <input
                type="text"
                placeholder="Search village name e.g. Manibeli"
                value={query}
                onChange={(e) =>
                  setQuery(e.target.value)
                }
                onKeyDown={handleKeyDown}
              />

              <button
                onClick={searchVillage}
                disabled={loading}
              >
                {loading
                  ? "Searching..."
                  : "Search"}
              </button>

            </div>

            {error && (
              <div className="error">
                {error}
              </div>
            )}

          </div>

        </section>


        {/* STATISTICS */}

        <section className="stats">

          <div className="stat-card">
            <div className="stat-icon">🗺️</div>
            <div>
              <strong>30</strong>
              <span>States & UTs</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🏙️</div>
            <div>
              <strong>581</strong>
              <span>Districts</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📍</div>
            <div>
              <strong>5,422</strong>
              <span>Sub-Districts</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🏘️</div>
            <div>
              <strong>564K+</strong>
              <span>Villages</span>
            </div>
          </div>

        </section>


        {/* LOCATION EXPLORER */}

        <section className="content-section">

          <div className="section-header">

            <div>
              <h3>
                Administrative Location Explorer
              </h3>

              <p>
                Select a state, district and
                sub-district to explore villages.
              </p>
            </div>

          </div>


          <div className="explorer">

            <div className="form-group">

              <label>State</label>

              <select
                value={selectedState}
                onChange={handleStateChange}
              >
                <option value="">
                  Select State
                </option>

                {states.map((state) => (
                  <option
                    key={state.id}
                    value={state.code}
                  >
                    {state.name}
                  </option>
                ))}

              </select>

            </div>


            <div className="form-group">

              <label>District</label>

              <select
                value={selectedDistrict}
                onChange={handleDistrictChange}
                disabled={!selectedState}
              >
                <option value="">
                  Select District
                </option>

                {districts.map((district) => (
                  <option
                    key={district.id}
                    value={district.code}
                  >
                    {district.name}
                  </option>
                ))}

              </select>

            </div>


            <div className="form-group">

              <label>Sub-District</label>

              <select
                value={selectedSubDistrict}
                onChange={handleSubDistrictChange}
                disabled={!selectedDistrict}
              >
                <option value="">
                  Select Sub-District
                </option>

                {subDistricts.map(
                  (subDistrict) => (
                    <option
                      key={subDistrict.id}
                      value={subDistrict.code}
                    >
                      {subDistrict.name}
                    </option>
                  )
                )}

              </select>

            </div>

          </div>


          {locationLoading && (
            <div className="loading">
              Loading location data...
            </div>
          )}


          {villages.length > 0 && (

            <div className="village-list">

              <h4>
                Villages ({villages.length})
              </h4>

              <div className="village-grid">

                {villages.map((village) => (

                  <div
                    className="village-card"
                    key={village.id}
                  >

                    <strong>
                      {village.name}
                    </strong>

                    <small>
                      Code: {village.code}
                    </small>

                  </div>

                ))}

              </div>

            </div>

          )}

        </section>


        {/* SEARCH RESULTS */}

        <section className="content-section">

          <div className="section-header">

            <div>

              <h3>
                Search Results
              </h3>

              <p>
                {results.length > 0
                  ? `${results.length} matching location${
                      results.length !== 1
                        ? "s"
                        : ""
                    } found`
                  : "Search for a village to see its hierarchy"}
              </p>

            </div>

          </div>


          {results.length === 0 && !loading && (

            <div className="empty-state">

              <div className="empty-icon">
                🔎
              </div>

              <h4>
                Search for a village
              </h4>

              <p>
                Enter a village name above to
                view its complete administrative
                hierarchy.
              </p>

              <button
                className="example-button"
                onClick={() => {
                  setQuery("Manibeli");
                }}
              >
                Try "Manibeli"
              </button>

            </div>

          )}


          <div className="results">

            {results.map((location) => (

              <div
                className="result-card"
                key={`${location.code}-${location.name}`}
              >

                <div className="result-top">

                  <div>

                    <span className="result-label">
                      VILLAGE
                    </span>

                    <h4>
                      {location.name}
                    </h4>

                  </div>

                  <span className="code">
                    Code: {location.code}
                  </span>

                </div>


                <div className="hierarchy">

                  <div>
                    <span>State</span>
                    <strong>
                      {location.state.name}
                    </strong>
                    <small>
                      {location.state.code}
                    </small>
                  </div>

                  <div className="arrow">
                    →
                  </div>

                  <div>
                    <span>District</span>
                    <strong>
                      {location.district.name}
                    </strong>
                    <small>
                      {location.district.code}
                    </small>
                  </div>

                  <div className="arrow">
                    →
                  </div>

                  <div>
                    <span>Sub-District</span>
                    <strong>
                      {location.subDistrict.name}
                    </strong>
                    <small>
                      {location.subDistrict.code}
                    </small>
                  </div>

                </div>

              </div>

            ))}

          </div>

        </section>


        {/* AUTHENTICATION */}

        <section className="content-section">

          <div className="section-header">

            <div>
              <h3>
                Developer Authentication
              </h3>

              <p>
                Login to manage your API keys.
              </p>
            </div>

          </div>


          {!token ? (

            <div className="auth-form">

              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
              />

              <button
                onClick={login}
              >
                Login
              </button>

            </div>

          ) : (

            <div className="authenticated">

              <p>
                ✅ You are authenticated.
              </p>

              <button
                className="secondary-button"
                onClick={logout}
              >
                Logout
              </button>

              <button
                className="secondary-button"
                onClick={loadApiKeys}
              >
                {showApiKeys
                  ? "Refresh API Keys"
                  : "Manage API Keys"}
              </button>

            </div>

          )}


          {authMessage && (
            <div className="info-message">
              {authMessage}
            </div>
          )}

        </section>


        {/* API KEY MANAGEMENT */}

        {showApiKeys && token && (

          <section className="content-section">

            <div className="section-header">

              <div>

                <h3>
                  API Key Management
                </h3>

                <p>
                  Create and revoke API keys.
                </p>

              </div>

            </div>


            <div className="api-key-create">

              <input
                type="text"
                placeholder="API key name e.g. Production App"
                value={newKeyName}
                onChange={(e) =>
                  setNewKeyName(e.target.value)
                }
              />

              <button
                onClick={createApiKey}
              >
                Create API Key
              </button>

            </div>


            {createdKey && (

              <div className="created-key">

                <strong>
                  New API Key
                </strong>

                <p>
                  Save this key securely. It will
                  not be shown again.
                </p>

                <code>
                  {createdKey}
                </code>

              </div>

            )}


            <div className="api-key-list">

              {apiKeys.map((key) => (

                <div
                  className="api-key-card"
                  key={key.id}
                >

                  <div>

                    <strong>
                      {key.name}
                    </strong>

                    <span>
                      Status: {key.status}
                    </span>

                  </div>

                  <button
                    onClick={() =>
                      revokeApiKey(key.id)
                    }
                    disabled={
                      key.status !== "ACTIVE"
                    }
                  >
                    Revoke
                  </button>

                </div>

              ))}

              {apiKeys.length === 0 && (
                <p>
                  No API keys found.
                </p>
              )}

            </div>

          </section>

        )}

      </main>


      {/* FOOTER */}

      <footer>

        <div>

          <strong>
            Indian Administrative Location API
          </strong>

          <p>
            REST API for structured Indian
            administrative location data.
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

export default App;