import { NavLink, useNavigate } from "react-router-dom";
import { Church, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/", label: "Início", end: true },
  { to: "/oracao", label: "Mural de Oração" },
  { to: "/testemunhos", label: "Testemunhos" },
  { to: "/agenda", label: "Agenda" },
  { to: "/contribuicoes", label: "Contribuições" },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-6">
        <NavLink to="/" data-testid="nav-logo" className="flex items-center gap-2 shrink-0">
          <span className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <Church size={18} />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight text-primary hidden sm:block">
            Comunidade da Fé
          </span>
        </NavLink>
        <nav className="flex-1 flex items-center gap-1 overflow-x-auto">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              data-testid={`nav-link-${l.to === "/" ? "home" : l.to.slice(1)}`}
              className={({ isActive }) =>
                `px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors duration-150 ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
          {user?.role === "admin" && (
            <NavLink
              to="/admin"
              data-testid="nav-link-admin"
              className={({ isActive }) =>
                `px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors duration-150 ${
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-accent hover:bg-accent/10"
                }`
              }
            >
              Administração
            </NavLink>
          )}
        </nav>
        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <>
              <span data-testid="nav-user-name" className="text-sm text-muted-foreground hidden md:block">
                {user.name}
              </span>
              <button
                onClick={handleLogout}
                data-testid="logout-button"
                className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors duration-150"
                title="Sair"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <NavLink
              to="/login"
              data-testid="nav-login-button"
              className="px-4 py-2 rounded-full text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-150"
            >
              Entrar
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
}
