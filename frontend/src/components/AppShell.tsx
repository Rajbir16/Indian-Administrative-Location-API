import { ReactNode, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { SessionUser } from "../hooks/useAuth";

interface AppShellProps {
  children: ReactNode;
  user: SessionUser | null;
  isAdmin: boolean;
  onLogout: () => void;
}

const mainLinks = [
  ["/dashboard", "Dashboard"],
  ["/locations", "Location Explorer"],
  ["/search", "Village Search"],
  ["/api-keys", "API Keys"],
  ["/analytics", "Analytics"],
  ["/usage", "Usage"],
];

const adminLinks = [
  ["/admin/users", "User Management"],
  ["/admin/villages", "Village Master"],
  ["/admin/api-logs", "API Logs"],
  ["/admin/plans", "Plan Management"],
];

export function AppShell({ children, user, isAdmin, onLogout }: AppShellProps) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const title = location.pathname.startsWith("/admin") ? "Administration" : location.pathname === "/dashboard" ? "Dashboard" : "Developer workspace";

  return (
    <div className="shell">
      <button className="shell-overlay" aria-label="Close navigation" onClick={() => setOpen(false)} data-open={open} />
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand"><span className="brand-mark">IN</span><span><strong>INDIA LOCATIONS</strong><small>API workspace</small></span></div>
        <nav aria-label="Primary navigation">
          <p className="nav-label">Workspace</p>
          {mainLinks.map(([to, label]) => <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>{label}</NavLink>)}
          {isAdmin && <><p className="nav-label admin-label">Admin</p>{adminLinks.map(([to, label]) => <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>{label}</NavLink>)}</>}
        </nav>
        <div className="sidebar-footer"><span className="online-dot" /> API service online</div>
      </aside>
      <div className="shell-main">
        <header className="topbar"><button className="menu-button" aria-label="Open navigation" onClick={() => setOpen(true)}>Menu</button><div><p className="eyebrow">Workspace / {location.pathname.replace(/^\//, "") || "dashboard"}</p><h1>{title}</h1></div><div className="topbar-user"><span className="topbar-plan">{user?.plan || "FREE"}</span><span className="avatar">{(user?.name || user?.email || "U").slice(0, 1).toUpperCase()}</span><span><strong>{user?.name || "Account"}</strong><small>{user?.email || "Signed in"}</small></span><button className="text-button" onClick={() => { onLogout(); navigate("/"); }}>Log out</button></div></header>
        <main className="shell-content">{children}</main>
      </div>
    </div>
  );
}
