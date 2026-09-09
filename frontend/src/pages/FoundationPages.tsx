import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SessionUser } from "../hooks/useAuth";
import { getApiMessage } from "../services/api";
import {
  AdminAnalytics,
  AnalyticsSummary,
  getAdminAnalytics,
  getAdminAnalyticsSummary,
  getUserUsage,
  getUserUsageHistory,
  UserUsage,
  UserUsageHistory,
} from "../services/analytics";

function LoadingCard() {
  return <div className="loading-card" aria-label="Loading" />;
}

function ErrorPanel({
  message,
  retry,
}: {
  message: string;
  retry: () => void;
}) {
  return (
    <div className="data-message error-message">
      <p>{message}</p>
      <button className="retry-button" onClick={retry}>
        Retry
      </button>
    </div>
  );
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="data-message">
      <p>{message}</p>
    </div>
  );
}

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function UserDashboard() {
  const [usage, setUsage] = useState<UserUsage | null>(null);
  const [history, setHistory] = useState<UserUsageHistory | null>(null);
  const [error, setError] = useState("");
  const [historyError, setHistoryError] = useState("");

  const loadUsage = () => {
    setError("");

    getUserUsage()
      .then(setUsage)
      .catch((reason) =>
        setError(getApiMessage(reason, "Unable to load your usage."))
      );
  };

  const loadHistory = () => {
    setHistoryError("");

    getUserUsageHistory()
      .then(setHistory)
      .catch((reason) =>
        setHistoryError(
          getApiMessage(reason, "Unable to load usage history.")
        )
      );
  };

  useEffect(() => {
    loadUsage();
    loadHistory();
  }, []);

  if (error) {
    return <ErrorPanel message={error} retry={loadUsage} />;
  }

  if (!usage) {
    return (
      <div className="metric-grid">
        {[1, 2, 3, 4].map((item) => (
          <LoadingCard key={item} />
        ))}
      </div>
    );
  }

  const percentage = usage.plan.dailyRequestLimit
    ? Math.min(
        100,
        (usage.requestsToday / usage.plan.dailyRequestLimit) * 100
      )
    : 0;

  const hasUsage =
    history?.dailyRequests.some((item) => item.count > 0) ?? false;

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Your workspace</p>
          <h2>Usage at a glance</h2>
          <p className="muted">
            Live request activity for your account.
          </p>
        </div>

        <span className="plan-badge">{usage.plan.name}</span>
      </div>

      <div className="metric-grid">
        <Metric
          label="Today's Requests"
          value={usage.requestsToday.toLocaleString()}
          detail={`${usage.remainingDailyRequests.toLocaleString()} remaining of ${usage.plan.dailyRequestLimit.toLocaleString()}`}
        />

        <Metric
          label="This Month's Requests"
          value={usage.monthlyRequestCount.toLocaleString()}
          detail="Current calendar month"
        />

        <Metric
          label="Average Response Time"
          value={`${Math.round(usage.averageResponseTime)} ms`}
          detail="All recorded requests"
        />

        <Metric
          label="Successful Requests"
          value={`${usage.successfulRequestPercentage.toFixed(1)}%`}
          detail="2xx responses"
        />
      </div>

      <div className="usage-layout">
        <article className="chart-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Daily activity</p>
              <h3>Usage chart</h3>
              <small>API requests over the last 30 days</small>
            </div>

            <span className="chart-note">
              {percentage.toFixed(1)}% of daily limit
            </span>
          </div>

          {historyError ? (
            <ErrorPanel message={historyError} retry={loadHistory} />
          ) : !history ? (
            <div className="chart-loading">
              <LoadingCard />
            </div>
          ) : !hasUsage ? (
            <EmptyPanel message="No API usage recorded in the last 30 days." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={history.dailyRequests}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e8edf2"
                />

                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => value.slice(5)}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                />

                <Tooltip
                  labelFormatter={(value) => `Date: ${value}`}
                  formatter={(value) => [
                    Number(value).toLocaleString(),
                    "Requests",
                  ]}
                />

                <Area
                  type="monotone"
                  dataKey="count"
                  name="Requests"
                  stroke="#38536f"
                  fill="#dbe7ef"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </article>

        <article className="plan-panel">
          <p className="eyebrow">Current plan</p>

          <h3>{usage.plan.name}</h3>

          <p className="muted">
            {usage.plan.stateAccessPolicy.replace(/_/g, " ")}
          </p>

          <div className="limit-meter">
            <span style={{ width: `${percentage}%` }} />
          </div>

          <small>
            {usage.plan.burstPerMinuteLimit.toLocaleString()} requests per
            minute
          </small>
        </article>
      </div>
    </>
  );
}

const planColors = [
  "#d15b49",
  "#e7a35d",
  "#5b8c85",
  "#38536f",
];

function AdminDashboard() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(
    null
  );

  const [analytics, setAnalytics] =
    useState<AdminAnalytics | null>(null);

  const [error, setError] = useState("");

  const load = () => {
    setError("");

    Promise.all([
      getAdminAnalyticsSummary(),
      getAdminAnalytics(),
    ])
      .then(([nextSummary, nextAnalytics]) => {
        setSummary(nextSummary);
        setAnalytics(nextAnalytics);
      })
      .catch((reason) =>
        setError(
          getApiMessage(reason, "Unable to load analytics.")
        )
      );
  };

  useEffect(load, []);

  if (error) {
    return <ErrorPanel message={error} retry={load} />;
  }

  if (!summary || !analytics) {
    return (
      <div className="metric-grid">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <LoadingCard key={item} />
        ))}
      </div>
    );
  }

  const plans = ["FREE", "PREMIUM", "PRO", "UNLIMITED"].map(
    (name) => ({
      name,
      count: analytics.planDistribution[name] || 0,
    })
  );

  const heat = new Map(
    analytics.heatmap.map((item) => [
      `${item.dayOfWeek}-${item.hour}`,
      item.count,
    ])
  );

  const maxHeat = Math.max(
    1,
    ...analytics.heatmap.map((item) => item.count)
  );

  const responseTimeData = [
    {
      metric: "Average",
      value: analytics.responseTimes.average ?? 0,
    },
    {
      metric: "p95",
      value: analytics.responseTimes.p95 ?? 0,
    },
    {
      metric: "p99",
      value: analytics.responseTimes.p99 ?? 0,
    },
  ];

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            Admin overview · {analytics.timezone}
          </p>

          <h2>Platform pulse</h2>

          <p className="muted">
            Live operational measures from the location API.
          </p>
        </div>

        <span className="plan-badge">ADMIN</span>
      </div>

      <div className="metric-grid six-metrics">
        <Metric
          label="Total Villages"
          value={summary.totalVillages.toLocaleString()}
          detail="Active location records"
        />

        <Metric
          label="Active Users"
          value={summary.activeUsers.toLocaleString()}
          detail="Current accounts"
        />

        <Metric
          label="Today's Requests"
          value={summary.todayRequests.toLocaleString()}
          detail="UTC calendar day"
        />

        <Metric
          label="Average Response"
          value={`${Math.round(
            summary.averageResponseTime
          )} ms`}
          detail="All API logs"
        />

        <Metric
          label="p95 Response"
          value={`${Math.round(
            summary.p95ResponseTime
          )} ms`}
          detail="95th percentile"
        />

        <Metric
          label="p99 Response"
          value={`${Math.round(
            summary.p99ResponseTime
          )} ms`}
          detail="99th percentile"
        />
      </div>

      <div className="chart-grid">
        <ChartPanel
          title="Top 10 states"
          subtitle="Village count"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={analytics.topStates}
              layout="vertical"
              margin={{ left: 12, right: 18 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="#e8edf2"
              />

              <XAxis
                type="number"
                tick={{ fontSize: 11 }}
              />

              <YAxis
                type="category"
                dataKey="state"
                width={90}
                tick={{ fontSize: 11 }}
              />

              <Tooltip />

              <Bar
                dataKey="villageCount"
                name="Villages"
                fill="#d15b49"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel
          title="API requests · last 30 days"
          subtitle="UTC daily totals"
        >
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={analytics.dailyRequests}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e8edf2"
              />

              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => value.slice(5)}
              />

              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11 }}
              />

              <Tooltip />

              <Area
                type="monotone"
                dataKey="count"
                name="Requests"
                stroke="#38536f"
                fill="#dbe7ef"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel
          title="Users by plan"
          subtitle="Current account distribution"
        >
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={plans}
                dataKey="count"
                nameKey="name"
                innerRadius={62}
                outerRadius={92}
                paddingAngle={3}
                label
              >
                {plans.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={planColors[index]}
                  />
                ))}
              </Pie>

              <Tooltip />

              <LegendText />
            </PieChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel
          title="Endpoint requests"
          subtitle="Top endpoints by volume"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={analytics.endpointBreakdown}
              margin={{ bottom: 35 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e8edf2"
              />

              <XAxis
                dataKey="endpoint"
                angle={-28}
                textAnchor="end"
                interval={0}
                tick={{ fontSize: 9 }}
              />

              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11 }}
              />

              <Tooltip />

              <Bar
                dataKey="count"
                name="Requests"
                fill="#5b8c85"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel
          title="Response time"
          subtitle="Average, p95 and p99"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={responseTimeData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e8edf2"
              />

              <XAxis
                dataKey="metric"
                tick={{ fontSize: 11 }}
              />

              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11 }}
                label={{
                  value: "ms",
                  angle: -90,
                  position: "insideLeft",
                }}
              />

              <Tooltip
                formatter={(value) => [
                  `${Math.round(Number(value))} ms`,
                  "Response time",
                ]}
              />

              <Bar
                dataKey="value"
                name="Response time"
                fill="#38536f"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>

      <article className="chart-panel heat-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">UTC activity</p>
            <h3>Usage heat map</h3>
          </div>

          <span className="chart-note">
            Sunday → Saturday
          </span>
        </div>

        <div
          className="heatmap"
          aria-label="API request volume by UTC day and hour"
        >
          {Array.from({ length: 7 }, (_, day) => (
            <div className="heat-row" key={day}>
              <span className="heat-label">
                {[
                  "Sun",
                  "Mon",
                  "Tue",
                  "Wed",
                  "Thu",
                  "Fri",
                  "Sat",
                ][day]}
              </span>

              {Array.from({ length: 24 }, (_, hour) => {
                const count =
                  heat.get(`${day}-${hour}`) || 0;

                return (
                  <span
                    className="heat-cell"
                    key={hour}
                    title={`${count} requests on day ${day}, hour ${hour} UTC`}
                    style={{
                      opacity: count
                        ? 0.25 +
                          (count / maxHeat) * 0.75
                        : 0.08,
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </article>
    </>
  );
}

function LegendText() {
  return (
    <div className="chart-legend">
      FREE · PREMIUM · PRO · UNLIMITED
    </div>
  );
}

function ChartPanel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <article className="chart-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Analytics</p>
          <h3>{title}</h3>
          <small>{subtitle}</small>
        </div>
      </div>

      {children}
    </article>
  );
}

export function DashboardPage({
  user,
}: {
  user: SessionUser | null;
}) {
  return (
    <section className="foundation-page">
      {user?.role === "ADMIN" ? (
        <AdminDashboard />
      ) : (
        <UserDashboard />
      )}
    </section>
  );
}

export function AnalyticsPage({
  user,
}: {
  user: SessionUser | null;
}) {
  return (
    <section className="foundation-page">
      {user?.role === "ADMIN" ? (
        <AdminDashboard />
      ) : (
        <UserDashboard />
      )}
    </section>
  );
}

export function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="foundation-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Workspace</p>
          <h2>{title}</h2>
          <p className="muted">{description}</p>
        </div>
      </div>

      <div className="empty-panel">
        <span className="empty-mark">· · ·</span>
        <h3>Foundation ready</h3>
        <p className="muted">
          This area is reserved for the next implementation task.
        </p>

        <Link className="back-link" to="/dashboard">
          Return to dashboard
        </Link>
      </div>
    </section>
  );
}

export function AccessDeniedPage() {
  return (
    <section className="foundation-page">
      <div className="empty-panel">
        <span className="empty-mark">403</span>

        <h2>Access denied</h2>

        <p className="muted">
          Your account does not have permission to view this area.
        </p>

        <Link className="back-link" to="/dashboard">
          Return to dashboard
        </Link>
      </div>
    </section>
  );
}