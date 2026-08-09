import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Church } from "lucide-react";
import { api, formatApiError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

const AUTH_BG =
  "https://images.pexels.com/photos/14530767/pexels-photo-14530767.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

export default function Login() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setUser(data);
      navigate("/", { replace: true });
    } catch (err) {
      setError(formatApiError(err, "Não foi possível entrar."));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    setForgotSuccess("");
    setForgotLoading(true);
    try {
      await api.post("/auth/forgot-password", {
        email: forgotEmail,
      });
      setForgotSuccess("Se a conta existir, enviamos um link de redefinição para o e-mail informado.");
      setShowForgotPassword(false);
      setForgotEmail("");
    } catch (err) {
      setError(formatApiError(err, "Não foi possível redefinir a senha."));
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-background" data-testid="login-page">
      <div className="relative hidden md:block">
        <img src={AUTH_BG} alt="Comunidade reunida em oração" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <p className="overline-label !text-white/70">Igreja de Jesus Cristo</p>
          <h1 className="font-display text-4xl lg:text-5xl font-semibold mt-3 leading-tight">
            “Onde dois ou três estiverem reunidos em meu nome, ali estou eu no meio deles.”
          </h1>
          <p className="text-white/80 text-sm mt-4">Mateus 18:20</p>
        </div>
      </div>
      <div className="flex items-center justify-center px-6 py-12">
        <form onSubmit={handleSubmit} className="w-full max-w-sm" data-testid="login-form">
          <div className="flex items-center gap-2 mb-8">
            <span className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Church size={20} />
            </span>
            <span className="font-display text-2xl font-semibold text-primary">Igreja de Jesus Cristo</span>
          </div>
          <h2 className="font-display text-4xl font-semibold tracking-tight">Bem-vindo de volta</h2>
          <p className="text-muted-foreground text-sm mt-2 mb-8">Entre com seu email e senha para acessar a comunidade.</p>

          {error && (
            <div data-testid="login-error" className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-sm px-4 py-3">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                data-testid="login-email-input"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                data-testid="login-password-input"
                className="mt-1.5"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            data-testid="login-submit-button"
            className="w-full mt-6 rounded-full h-11 bg-primary hover:bg-primary/90 active:scale-95 transition-transform duration-100"
          >
            {loading ? "Entrando..." : "Entrar"}
          </Button>

          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={() => setShowForgotPassword((current) => !current)}
              className="text-sm text-primary font-semibold hover:underline"
            >
              Esqueci a senha
            </button>
          </div>

          {showForgotPassword && (
            <form onSubmit={handleForgotPassword} className="mt-4 rounded-xl border border-border bg-muted/40 p-4 space-y-3">
              <p className="text-sm text-muted-foreground">Informe o email e defina uma nova senha.</p>
              <Input
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="seu@email.com"
              />
              <Button type="submit" disabled={forgotLoading} className="w-full rounded-full bg-primary hover:bg-primary/90">
                {forgotLoading ? "Enviando..." : "Enviar link de redefinição"}
              </Button>
            </form>
          )}

          {forgotSuccess && <p className="mt-4 text-sm text-primary">{forgotSuccess}</p>}

          <p className="text-sm text-muted-foreground text-center mt-6">
            Ainda não tem conta?{" "}
            <Link to="/registro" data-testid="go-to-register-link" className="text-primary font-semibold hover:underline">
              Cadastre-se
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
