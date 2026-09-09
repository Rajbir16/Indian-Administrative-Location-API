import { useEffect, useState } from "react";
import { api, getApiMessage } from "../services/api";

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

interface VillageRow {
  state: string;
  district: string;
  subDistrict: string;
  villageCode: string;
  villageName: string;
}

interface VillageResponse {
  success: boolean;
  count: number;
  data: VillageRow[];
  meta?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export function AdminVillagePage() {
  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [subDistricts, setSubDistricts] = useState<SubDistrict[]>([]);

  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedSubDistrict, setSelectedSubDistrict] = useState("");
  const [villageSearch, setVillageSearch] = useState("");

  const [pageSize, setPageSize] = useState(500);
  const [page, setPage] = useState(1);

  const [villages, setVillages] = useState<VillageRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingSubDistricts, setLoadingSubDistricts] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // ----------------------------------------------------------
  // LOAD STATES
  // ----------------------------------------------------------

  useEffect(() => {
    const loadStates = async () => {
      try {
        setLoadingStates(true);
        setError("");

        const response = await api.get("/v1/states");

        const data = Array.isArray(response.data?.data)
          ? response.data.data
          : [];

        setStates(
          data.map((item: any) => ({
            id: Number(item.id),
            code: String(item.code ?? ""),
            name: String(item.name ?? item.label ?? ""),
          }))
        );
      } catch (err) {
        setError(getApiMessage(err, "Unable to load states."));
      } finally {
        setLoadingStates(false);
      }
    };

    loadStates();
  }, []);

  // ----------------------------------------------------------
  // LOAD DISTRICTS
  // ----------------------------------------------------------

  useEffect(() => {
    if (!selectedState) {
      setDistricts([]);
      setSelectedDistrict("");
      return;
    }

    const loadDistricts = async () => {
      try {
        setLoadingDistricts(true);
        setError("");

        const response = await api.get(
          `/v1/states/${selectedState}/districts`
        );

        const data = Array.isArray(response.data?.data)
          ? response.data.data
          : [];

        setDistricts(
          data.map((item: any) => ({
            id: Number(item.id),
            code: String(item.code ?? ""),
            name: String(item.name ?? item.label ?? ""),
          }))
        );
      } catch (err) {
        setError(getApiMessage(err, "Unable to load districts."));
        setDistricts([]);
      } finally {
        setLoadingDistricts(false);
      }
    };

    setSelectedDistrict("");
    setSelectedSubDistrict("");
    setSubDistricts([]);
    setPage(1);

    loadDistricts();
  }, [selectedState]);

  // ----------------------------------------------------------
  // LOAD SUB-DISTRICTS
  // ----------------------------------------------------------

  useEffect(() => {
    if (!selectedDistrict) {
      setSubDistricts([]);
      setSelectedSubDistrict("");
      return;
    }

    const loadSubDistricts = async () => {
      try {
        setLoadingSubDistricts(true);
        setError("");

        const response = await api.get(
          `/v1/districts/${selectedDistrict}/subdistricts`
        );

        const data = Array.isArray(response.data?.data)
          ? response.data.data
          : [];

        setSubDistricts(
          data.map((item: any) => ({
            id: Number(item.id),
            code: String(item.code ?? ""),
            name: String(item.name ?? item.label ?? ""),
          }))
        );
      } catch (err) {
        setError(
          getApiMessage(err, "Unable to load sub-districts.")
        );
        setSubDistricts([]);
      } finally {
        setLoadingSubDistricts(false);
      }
    };

    setSelectedSubDistrict("");
    setPage(1);

    loadSubDistricts();
  }, [selectedDistrict]);

  // ----------------------------------------------------------
  // LOAD VILLAGES
  // ----------------------------------------------------------

  const loadVillages = async () => {
    if (!selectedState) {
      setError("Please select a state first.");
      return;
    }

    try {
      setLoadingVillages(true);
      setError("");
      setMessage("");

      const params = new URLSearchParams();

      params.set("state", selectedState);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));

      if (selectedDistrict) {
        params.set("district", selectedDistrict);
      }

      if (selectedSubDistrict) {
        params.set("subDistrict", selectedSubDistrict);
      }

      if (villageSearch.trim()) {
        params.set("village", villageSearch.trim());
      }

      const response = await api.get<VillageResponse>(
        `/admin/villages?${params.toString()}`
      );

      setVillages(response.data.data ?? []);

      setTotal(response.data.meta?.total ?? response.data.count ?? 0);

      setTotalPages(
        response.data.meta?.totalPages ??
          Math.max(
            1,
            Math.ceil(
              (response.data.meta?.total ??
                response.data.count ??
                0) / pageSize
            )
          )
      );
    } catch (err) {
      setVillages([]);
      setTotal(0);
      setTotalPages(1);
      setError(getApiMessage(err, "Unable to load village data."));
    } finally {
      setLoadingVillages(false);
    }
  };

  useEffect(() => {
    if (selectedState) {
      loadVillages();
    }
  }, [page, pageSize]);

  const searchVillages = () => {
    if (!selectedState) {
      setError("Please select a state first.");
      return;
    }

    setPage(1);

    // Search immediately with page 1.
    loadVillages();
  };

  const clearFilters = () => {
    setSelectedState("");
    setSelectedDistrict("");
    setSelectedSubDistrict("");
    setVillageSearch("");

    setDistricts([]);
    setSubDistricts([]);
    setVillages([]);

    setTotal(0);
    setTotalPages(1);
    setPage(1);
    setError("");
    setMessage("");
  };

  const changePageSize = (value: number) => {
    setPageSize(value);
    setPage(1);
  };

  return (
    <section className="foundation-page">
      <div className="foundation-header">
        <div>
          <p className="foundation-eyebrow">
            ADMINISTRATION
          </p>

          <h1>Village Master</h1>

          <p>
            Browse and search the Indian administrative village
            master data.
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
          FILTERS
      ----------------------------------------------------- */}

      <div
        style={{
          background: "white",
          border: "1px solid #e1e6ef",
          borderRadius: 16,
          padding: 20,
          marginBottom: 20,
        }}
      >
        <h2 style={{ marginTop: 0 }}>Village Filters</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(210px, 1fr))",
            gap: 14,
          }}
        >
          {/* STATE */}

          <div>
            <label
              htmlFor="village-state"
              style={{
                display: "block",
                marginBottom: 6,
                fontWeight: 600,
              }}
            >
              State *
            </label>

            <select
              id="village-state"
              value={selectedState}
              disabled={loadingStates}
              onChange={(event) =>
                setSelectedState(event.target.value)
              }
              style={{ width: "100%" }}
            >
              <option value="">
                {loadingStates
                  ? "Loading states..."
                  : "Select state"}
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

          {/* DISTRICT */}

          <div>
            <label
              htmlFor="village-district"
              style={{
                display: "block",
                marginBottom: 6,
                fontWeight: 600,
              }}
            >
              District
            </label>

            <select
              id="village-district"
              value={selectedDistrict}
              disabled={
                !selectedState || loadingDistricts
              }
              onChange={(event) =>
                setSelectedDistrict(event.target.value)
              }
              style={{ width: "100%" }}
            >
              <option value="">
                {!selectedState
                  ? "Select state first"
                  : loadingDistricts
                    ? "Loading districts..."
                    : "All districts"}
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

          {/* SUB-DISTRICT */}

          <div>
            <label
              htmlFor="village-subdistrict"
              style={{
                display: "block",
                marginBottom: 6,
                fontWeight: 600,
              }}
            >
              Sub-District
            </label>

            <select
              id="village-subdistrict"
              value={selectedSubDistrict}
              disabled={
                !selectedDistrict ||
                loadingSubDistricts
              }
              onChange={(event) =>
                setSelectedSubDistrict(event.target.value)
              }
              style={{ width: "100%" }}
            >
              <option value="">
                {!selectedDistrict
                  ? "Select district first"
                  : loadingSubDistricts
                    ? "Loading sub-districts..."
                    : "All sub-districts"}
              </option>

              {subDistricts.map((subDistrict) => (
                <option
                  key={subDistrict.id}
                  value={subDistrict.code}
                >
                  {subDistrict.name}
                </option>
              ))}
            </select>
          </div>

          {/* VILLAGE SEARCH */}

          <div>
            <label
              htmlFor="village-search"
              style={{
                display: "block",
                marginBottom: 6,
                fontWeight: 600,
              }}
            >
              Village
            </label>

            <input
              id="village-search"
              value={villageSearch}
              onChange={(event) =>
                setVillageSearch(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  searchVillages();
                }
              }}
              placeholder="Search village name..."
              maxLength={100}
              style={{ width: "100%" }}
            />
          </div>
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
            onClick={searchVillages}
            disabled={loadingVillages || !selectedState}
          >
            {loadingVillages ? "Loading..." : "Search Villages"}
          </button>

          <button
            type="button"
            onClick={clearFilters}
          >
            Clear
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------
          RESULTS
      ----------------------------------------------------- */}

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
              Village Records
            </h2>

            <p style={{ margin: "5px 0 0" }}>
              {selectedState
                ? `${total.toLocaleString()} matching villages`
                : "Select a state to load village data"}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <label htmlFor="page-size">
              Page size
            </label>

            <select
              id="page-size"
              value={pageSize}
              onChange={(event) =>
                changePageSize(
                  Number(event.target.value)
                )
              }
            >
              <option value={500}>500</option>
              <option value={5000}>5,000</option>
              <option value={10000}>10,000</option>
            </select>

            <button
              type="button"
              onClick={loadVillages}
              disabled={
                loadingVillages || !selectedState
              }
            >
              Refresh
            </button>
          </div>
        </div>

        {loadingVillages ? (
          <div style={{ padding: 24 }}>
            Loading village records...
          </div>
        ) : !selectedState ? (
          <div style={{ padding: 24 }}>
            Select a state above to view village records.
          </div>
        ) : villages.length === 0 ? (
          <div style={{ padding: 24 }}>
            No village records found for the selected
            filters.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 900,
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
                    #
                  </th>

                  <th
                    style={{
                      padding: 14,
                      textAlign: "left",
                    }}
                  >
                    State
                  </th>

                  <th
                    style={{
                      padding: 14,
                      textAlign: "left",
                    }}
                  >
                    District
                  </th>

                  <th
                    style={{
                      padding: 14,
                      textAlign: "left",
                    }}
                  >
                    Sub-District
                  </th>

                  <th
                    style={{
                      padding: 14,
                      textAlign: "left",
                    }}
                  >
                    Village Code
                  </th>

                  <th
                    style={{
                      padding: 14,
                      textAlign: "left",
                    }}
                  >
                    Village Name
                  </th>
                </tr>
              </thead>

              <tbody>
                {villages.map((village, index) => (
                  <tr
                    key={`${village.villageCode}-${index}`}
                  >
                    <td style={{ padding: 14 }}>
                      {(page - 1) * pageSize +
                        index +
                        1}
                    </td>

                    <td style={{ padding: 14 }}>
                      {village.state}
                    </td>

                    <td style={{ padding: 14 }}>
                      {village.district}
                    </td>

                    <td style={{ padding: 14 }}>
                      {village.subDistrict}
                    </td>

                    <td
                      style={{
                        padding: 14,
                        fontFamily: "monospace",
                      }}
                    >
                      {village.villageCode}
                    </td>

                    <td
                      style={{
                        padding: 14,
                        fontWeight: 600,
                      }}
                    >
                      {village.villageName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --------------------------------------------------
            PAGINATION
        --------------------------------------------------- */}

        {!loadingVillages &&
          selectedState &&
          totalPages > 1 && (
            <div
              style={{
                padding: 18,
                borderTop:
                  "1px solid #e1e6ef",
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
                onClick={() =>
                  setPage((current) => current - 1)
                }
              >
                Previous
              </button>

              <span>
                Page {page} of {totalPages}
              </span>

              <button
                type="button"
                disabled={page >= totalPages}
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