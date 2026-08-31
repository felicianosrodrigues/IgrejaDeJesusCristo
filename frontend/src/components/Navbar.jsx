import { NavLink, useNavigate } from "react-router-dom";
import { LogOut, Menu, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import logoIgreja from "../assets/logo_igreja.png";

const links = [
  { to: "/", label: "Início", end: true },
  { to: "/oracao", label: "Mural de Oração" },
  { to: "/testemunhos", label: "Testemunhos" },
  { to: "/devocionais", label: "Devocionais" },
  { to: "/agenda", label: "Agenda" },
  { to: "/contribuicoes", label: "Contribuições" },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        // Check if click is outside menu AND not on hamburger button
        const hamburgerButton = event.target.closest('[aria-label="Abrir menu"]');
        if (!hamburgerButton) {
          setIsMobileMenuOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-40 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo - sempre visível */}
          <NavLink to="/" data-testid="nav-logo" className="flex items-center gap-2 shrink-0">
            <img
              src={logoIgreja}
              alt="Logo da Igreja"
              className="h-9 w-9 rounded-full object-cover border border-border"
            />
            <span className="font-display text-xl font-semibold tracking-tight text-primary hidden sm:block">
              Igreja de Jesus Cristo
            </span>
          </NavLink>

          {/* Botão hambúrguer (mobile apenas) */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Abrir menu"
          >
            {isMobileMenuOpen ? (
              <X size={20} className="block" />
            ) : (
              <Menu size={20} className="block" />
            )}
          </button>

          {/* Navigation Desktop (escondido em mobile) */}
          <nav className="hidden md:flex md:items-center md:flex-1 md:gap-1 md:overflow-x-auto">
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
                }`}
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
                }`}
              >
                Administração
              </NavLink>
            )}
          </nav>

          {/* User actions (Desktop e Mobile) */}
          <div className="flex items-center gap-3 shrink-0">
            {/* User name (escondido em mobile quando menu fechado) */}
            {!isMobileMenuOpen && user ? (
              <span data-testid="nav-user-name" className="md:block text-sm text-muted-foreground">
                {user.name}
              </span>
            ) : (
              <>
                {/* User name no mobile menu (quando aberto) */}
                {isMobileMenuOpen && user && (
                  <div className="mb-4">
                    <span className="block text-sm font-medium text-foreground">
                      {user.name}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {user.role === "admin" ? "Administrador" : "Usuário"}
                    </span>
                  </div>
                )}
              </>
            )}
            <button
              onClick={handleLogout}
              data-testid="logout-button"
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors duration-150"
              title="Sair"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu (escondido em desktop, expandido para baixo) */}
      {isMobileMenuOpen && (
        <div className="md:hidden" ref={menuRef}>
          <div className="fixed left-0 right-0 top-[3.5rem] z-30 mt-0 w-full bg-white border-t border-border px-4 pb-6 pt-2 shadow-lg">
            <div className="space-y-2">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  data-testid={`nav-link-mobile-${l.to === "/" ? "home" : l.to.slice(1)}`}
                  onClick={toggleMobileMenu}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                >
                  {l.label}
                </NavLink>
              ))}
              {user?.role === "admin" && (
                <NavLink
                  to="/admin"
                  data-testid="nav-link-admin-mobile"
                  onClick={toggleMobileMenu}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-accent hover:bg-accent/10"
                    }`}
                >
                  Administração
                </NavLink>
              )}
              {user && (
                <>
                  <div className="mb-4">
                    <span className="block text-sm font-medium text-foreground">
                      {user.name}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {user.role === "admin" ? "Administrador" : "Usuário"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}