import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Church } from "lucide-react";
import { api, formatApiError } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setToken(searchParams.get("token") || "");
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, new_password: newPassword, confirm_password: confirmPassword });
      setSuccess("Senha redefinida com sucesso. Você já pode entrar no sistema.");
      setTimeout(() => navigate("/login", { replace: true }), 1500);
    } catch (err) {
      setError(formatApiError(err, "Não foi possível redefinir a senha."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 py-12">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <span className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <Church size={20} />
          </span>
          <span className="font-display text-xl font-semibold text-primary">Igreja de Jesus Cristo</span>
        </div>
        <h2 className="font-display text-3xl font-semibold">Redefinir senha</h2>
        <p className="text-sm text-muted-foreground mt-2">Informe a nova senha para concluir a recuperação.</p>

        {error && <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-sm px-4 py-3">{error}</div>}
        {success && <div className="mt-4 rounded-lg border border-primary/30 bg-primary/10 text-primary text-sm px-4 py-3">{success}</div>}

        <div className="space-y-4 mt-6">
          <div>
            <Label htmlFor="new-password">Nova senha</Label>
            <Input id="new-password" type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="confirm-password">Confirmar senha</Label>
            <Input id="confirm-password" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1.5" />
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full mt-6 rounded-full bg-primary hover:bg-primary/90">
          {loading ? "Salvando..." : "Salvar nova senha"}
        </Button>
      </form>
    </div>
  );
}
