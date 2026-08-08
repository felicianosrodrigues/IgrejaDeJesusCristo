import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Copy, Landmark } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { api, formatApiError } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

const TYPE_LABELS = { dizimo: "Dízimo", oferta: "Oferta", missoes: "Missões", outro: "Outro" };
const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Contributions() {
  const { user } = useAuth();
  const [info, setInfo] = useState(null);
  const [mine, setMine] = useState([]);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ type: "oferta", amount: "", contributed_at: "", note: "" });

  const loadMine = () => api.get("/contributions").then((r) => setMine(r.data)).catch(() => {});

  useEffect(() => {
    api.get("/church-info").then((r) => setInfo(r.data)).catch(() => {});
    loadMine();
  }, []);

  const copy = (text, label) => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success(`${label} copiada`))
      .catch(() => toast.error(`Não foi possível copiar. ${label}: ${text}`));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post("/contributions", {
        type: form.type,
        amount: parseFloat(form.amount),
        contributed_at: form.contributed_at || null,
        note: form.note,
      });
      toast.success("Contribuição registrada. Aguarde a confirmação da tesouraria.");
      setForm({ type: "oferta", amount: "", contributed_at: "", note: "" });
      loadMine();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12" data-testid="contributions-page">
      <p className="overline-label">Generosidade</p>
      <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight mt-1 mb-10">Contribuições</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="feed-card" data-testid="church-info-card">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Landmark size={20} />
            </span>
            <div>
              <p className="overline-label">Dados para contribuir</p>
              <h2 className="font-display text-2xl font-semibold">{info?.church_name || "Igreja"}</h2>
            </div>
          </div>

          {info && (
            <div className="space-y-4">
              <div className="rounded-xl bg-secondary p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Chave PIX</p>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold break-all" data-testid="pix-key-text">{info.pix_key}</p>
                  <button
                    onClick={() => copy(info.pix_key, "Chave PIX")}
                    data-testid="copy-pix-button"
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold hover:bg-primary/90 active:scale-95 transition-all duration-150"
                  >
                    <Copy size={13} /> Copiar
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-border p-3">
                  <p className="text-xs text-muted-foreground">Banco</p>
                  <p className="font-semibold mt-0.5" data-testid="bank-name-text">{info.bank_name}</p>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <p className="text-xs text-muted-foreground">Agência / Conta</p>
                  <p className="font-semibold mt-0.5" data-testid="bank-account-text">{info.agency} / {info.account}</p>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <p className="text-xs text-muted-foreground">Titular</p>
                  <p className="font-semibold mt-0.5">{info.holder}</p>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <p className="text-xs text-muted-foreground">CNPJ</p>
                  <p className="font-semibold mt-0.5">{info.cnpj}</p>
                </div>
              </div>
              {info.instructions && (
                <p className="text-xs text-muted-foreground leading-relaxed">{info.instructions}</p>
              )}
            </div>
          )}
        </div>

        {user ? (
        <form onSubmit={handleSubmit} className="feed-card" data-testid="contribution-form">
          <p className="overline-label">Registrar contribuição</p>
          <h2 className="font-display text-2xl font-semibold mt-1 mb-5">Informe seu dízimo ou oferta</h2>
          <div className="space-y-4">
            <div>
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger data-testid="contribution-type-select" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dizimo" data-testid="contribution-type-dizimo">Dízimo</SelectItem>
                  <SelectItem value="oferta" data-testid="contribution-type-oferta">Oferta</SelectItem>
                  <SelectItem value="missoes" data-testid="contribution-type-missoes">Missões</SelectItem>
                  <SelectItem value="outro" data-testid="contribution-type-outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="c-amount">Valor (R$)</Label>
                <Input
                  id="c-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="100,00"
                  data-testid="contribution-amount-input"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="c-date">Data</Label>
                <Input
                  id="c-date"
                  type="date"
                  value={form.contributed_at}
                  onChange={(e) => setForm({ ...form, contributed_at: e.target.value })}
                  data-testid="contribution-date-input"
                  className="mt-1.5"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="c-note">Observação (opcional)</Label>
              <Textarea
                id="c-note"
                rows={2}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                data-testid="contribution-note-input"
                className="mt-1.5"
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={sending}
            data-testid="contribution-submit-button"
            className="w-full mt-5 rounded-full bg-primary hover:bg-primary/90 active:scale-95 transition-transform duration-100"
          >
            {sending ? "Registrando..." : "Registrar contribuição"}
          </Button>
        </form>
        ) : (
        <div className="feed-card text-center" data-testid="contribution-login-prompt">
          <h2 className="font-display text-2xl font-semibold">Registre sua contribuição</h2>
          <p className="text-muted-foreground text-sm mt-2 mb-5">Entre ou cadastre-se para registrar dízimos e ofertas e acompanhar seu histórico.</p>
          <Link to="/login" data-testid="contribution-login-link" className="inline-block rounded-full bg-primary text-primary-foreground px-6 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors duration-150">
            Entrar ou cadastrar-se
          </Link>
        </div>
        )}
      </div>

      {user && (
      <div className="mt-14">
        <p className="overline-label">Histórico</p>
        <h2 className="font-display text-3xl font-semibold mt-1 mb-6">Minhas contribuições</h2>
        {mine.length === 0 ? (
          <p className="text-muted-foreground text-sm" data-testid="contributions-empty">Você ainda não registrou contribuições.</p>
        ) : (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-muted-foreground text-left">
                <tr>
                  <th className="px-5 py-3 font-semibold">Data</th>
                  <th className="px-5 py-3 font-semibold">Tipo</th>
                  <th className="px-5 py-3 font-semibold">Valor</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {mine.map((c) => (
                  <tr key={c.id} data-testid={`contribution-row-${c.id}`} className="border-t border-border">
                    <td className="px-5 py-3">{new Date(c.contributed_at + "T00:00:00").toLocaleDateString("pt-BR")}</td>
                    <td className="px-5 py-3">{TYPE_LABELS[c.type]}</td>
                    <td className="px-5 py-3 font-semibold">{brl(c.amount)}</td>
                    <td className="px-5 py-3">
                      <Badge
                        data-testid={`contribution-status-${c.id}`}
                        className={c.status === "confirmada" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"}
                        variant="secondary"
                      >
                        {c.status === "confirmada" ? "Confirmada" : "Aguardando confirmação"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
