import { Navigate, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) return <p className="page muted">Chargement…</p>;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          ATS Portal
          <span>Moov Money</span>
        </div>
        <nav>
          <NavLink to="/" end>
            Journées
          </NavLink>
          <NavLink to="/settings">Paramètres</NavLink>
        </nav>
        <div className="sidebar-footer">
          <span>{user?.username}</span>
          <button type="button" className="btn-ghost" onClick={logout}>
            Déconnexion
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
