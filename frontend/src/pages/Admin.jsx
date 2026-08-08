import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Check, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

const TYPE_LABELS = { dizimo: "Dízimo", oferta: "Oferta", missoes: "Missões", outro: "Outro" };
const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "-");

export default function Admin() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [pendingPosts, setPendingPosts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [events, setEvents] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [info, setInfo] = useState(null);
  const [eventForm, setEventForm] = useState({ title: "", description: "", date: "", time: "", location: "" });
  const [savingEvent, setSavingEvent] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);

  const loadAll = useCallback(() => {
    api.get("/admin/stats").then((r) => setStats(r.data)).catch(() => {});
    api.get("/admin/posts", { params: { status: "pending" } }).then((r) => setPendingPosts(r.data)).catch(() => {});
    api.get("/admin/suggestions").then((r) => setSuggestions(r.data)).catch(() => {});
    api.get("/events").then((r) => setEvents(r.data)).catch(() => {});
    api.get("/admin/contributions").then((r) => setContributions(r.data)).catch(() => {});
    api.get("/church-info").then((r) => setInfo(r.data)).catch(() => {});
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  if (user === false) return <Navigate to="/login" replace />;
  if (user && user.role !== "admin") return <Navigate to="/" replace />;

  const postAction = async (id, action) => {
    try {
      await api.post(`/admin/posts/${id}/${action}`);
      toast.success(action === "approve" ? "Publicação aprovada." : "Publicação rejeitada.");
      loadAll();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const deletePost = async (id) => {
    try {
      await api.delete(`/admin/posts/${id}`);
      toast.success("Publicação removida.");
      loadAll();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const suggestionAction = async (id, action) => {
    try {
      await api.post(`/admin/suggestions/${id}/${action}`);
      toast.success(action === "approve" ? "Sugestão aprovada e evento criado." : "Sugestão rejeitada.");
      loadAll();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const createEvent = async (e) => {
    e.preventDefault();
    setSavingEvent(true);
    try {
      await api.post("/admin/events", eventForm);
      toast.success("Evento criado.");
      setEventForm({ title: "", description: "", date: "", time: "", location: "" });
      loadAll();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSavingEvent(false);
    }
  };

  const deleteEvent = async (id) => {
    try {
      await api.delete(`/admin/events/${id}`);
      toast.success("Evento removido.");
      loadAll();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const confirmContribution = async (id) => {
    try {
      await api.post(`/admin/contributions/${id}/confirm`);
      toast.success("Contribuição confirmada.");
      loadAll();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const deleteContribution = async (id) => {
    try {
      await api.delete(`/admin/contributions/${id}`);
      toast.success("Registro removido.");
      loadAll();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const saveInfo = async (e) => {
    e.preventDefault();
    setSavingInfo(true);
    try {
      await api.put("/admin/church-info", info);
      toast.success("Dados da igreja atualizados.");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSavingInfo(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10" data-testid="admin-page">
      <p className="overline-label">Painel</p>
      <h1 className="font-display text-4xl font-semibold tracking-tight mt-1 mb-8">Administração</h1>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8" data-testid="admin-stats">
          {[
            { label: "Membros", value: stats.members, testid: "stat-members" },
            { label: "Posts pendentes", value: stats.pending_posts, testid: "stat-pending" },
            { label: "Eventos", value: stats.events, testid: "stat-events" },
            { label: "Contribuições", value: brl(stats.contributions_total), testid: "stat-contributions" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
              <p className="font-display text-3xl font-bold text-primary mt-1" data-testid={s.testid}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <Tabs defaultValue="moderacao">
        <TabsList data-testid="admin-tabs" className="mb-6 flex-wrap h-auto gap-1">
          <TabsTrigger value="moderacao" data-testid="tab-moderacao">Moderação ({pendingPosts.length})</TabsTrigger>
          <TabsTrigger value="eventos" data-testid="tab-eventos">Eventos</TabsTrigger>
          <TabsTrigger value="sugestoes" data-testid="tab-sugestoes">Sugestões ({suggestions.filter((s) => s.status === "pending").length})</TabsTrigger>
          <TabsTrigger value="contribuicoes" data-testid="tab-contribuicoes">Contribuições</TabsTrigger>
          <TabsTrigger value="igreja" data-testid="tab-igreja">Dados da Igreja</TabsTrigger>
        </TabsList>

        <TabsContent value="moderacao">
          {pendingPosts.length === 0 ? (
            <p className="text-muted-foreground text-sm" data-testid="moderation-empty">Nenhuma publicação aguardando aprovação.</p>
          ) : (
            <div className="space-y-4">
              {pendingPosts.map((p) => (
                <div key={p.id} data-testid={`pending-post-${p.id}`} className="rounded-2xl border border-border bg-card p-5 flex flex-wrap items-start gap-4">
                  <div className="flex-1 min-w-[240px]">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className={p.type === "prayer" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"}>
                        {p.type === "prayer" ? "Oração" : "Testemunho"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{p.author_name} • {fmtDate(p.created_at)}</span>
                    </div>
                    <h3 className="font-display text-xl font-semibold">{p.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{p.content}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => postAction(p.id, "approve")} data-testid={`approve-post-${p.id}`} className="rounded-full bg-primary hover:bg-primary/90">
                      <Check size={14} className="mr-1" /> Aprovar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => postAction(p.id, "reject")} data-testid={`reject-post-${p.id}`} className="rounded-full">
                      <X size={14} className="mr-1" /> Rejeitar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deletePost(p.id)} data-testid={`delete-post-${p.id}`} className="rounded-full text-destructive">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="eventos">
          <div className="grid lg:grid-cols-3 gap-8">
            <form onSubmit={createEvent} className="rounded-2xl border border-border bg-card p-5 space-y-4" data-testid="event-form">
              <h3 className="font-display text-xl font-semibold">Novo evento</h3>
              <div>
                <Label>Título</Label>
                <Input required minLength={3} value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} data-testid="event-title-input" className="mt-1.5" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Data</Label>
                  <Input type="date" required value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} data-testid="event-date-input" className="mt-1.5" />
                </div>
                <div>
                  <Label>Horário</Label>
                  <Input type="time" required value={eventForm.time} onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })} data-testid="event-time-input" className="mt-1.5" />
                </div>
              </div>
              <div>
                <Label>Local</Label>
                <Input value={eventForm.location} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} data-testid="event-location-input" className="mt-1.5" />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea rows={3} value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} data-testid="event-description-input" className="mt-1.5" />
              </div>
              <Button type="submit" disabled={savingEvent} data-testid="event-submit-button" className="w-full rounded-full bg-primary hover:bg-primary/90">
                {savingEvent ? "Salvando..." : "Criar evento"}
              </Button>
            </form>
            <div className="lg:col-span-2 space-y-3">
              {events.length === 0 ? (
                <p className="text-muted-foreground text-sm" data-testid="admin-events-empty">Nenhum evento cadastrado.</p>
              ) : (
                events.map((ev) => (
                  <div key={ev.id} data-testid={`admin-event-${ev.id}`} className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{ev.title}</p>
                      <p className="text-xs text-muted-foreground">{fmtDate(ev.date + "T00:00:00")} às {ev.time}{ev.location ? ` • ${ev.location}` : ""}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => deleteEvent(ev.id)} data-testid={`delete-event-${ev.id}`} className="rounded-full text-destructive">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sugestoes">
          {suggestions.length === 0 ? (
            <p className="text-muted-foreground text-sm" data-testid="suggestions-empty">Nenhuma sugestão recebida.</p>
          ) : (
            <div className="space-y-3">
              {suggestions.map((s) => (
                <div key={s.id} data-testid={`suggestion-${s.id}`} className="rounded-xl border border-border bg-card p-4 flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-[240px]">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{s.title}</p>
                      <Badge variant="secondary" className={
                        s.status === "approved" ? "bg-primary/10 text-primary" :
                        s.status === "rejected" ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"
                      }>
                        {s.status === "approved" ? "Aprovada" : s.status === "rejected" ? "Rejeitada" : "Pendente"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {s.proposed_by_name} • {fmtDate(s.proposed_date + "T00:00:00")}{s.proposed_time ? ` às ${s.proposed_time}` : ""}{s.location ? ` • ${s.location}` : ""}
                    </p>
                    {s.description && <p className="text-sm text-muted-foreground mt-1">{s.description}</p>}
                  </div>
                  {s.status === "pending" && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => suggestionAction(s.id, "approve")} data-testid={`approve-suggestion-${s.id}`} className="rounded-full bg-primary hover:bg-primary/90">
                        <Check size={14} className="mr-1" /> Aprovar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => suggestionAction(s.id, "reject")} data-testid={`reject-suggestion-${s.id}`} className="rounded-full">
                        <X size={14} className="mr-1" /> Rejeitar
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="contribuicoes">
          {contributions.length === 0 ? (
            <p className="text-muted-foreground text-sm" data-testid="admin-contributions-empty">Nenhuma contribuição registrada.</p>
          ) : (
            <div className="rounded-2xl border border-border bg-card overflow-x-auto">
              <table className="w-full text-sm" data-testid="admin-contributions-table">
                <thead className="bg-secondary text-muted-foreground text-left">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Membro</th>
                    <th className="px-5 py-3 font-semibold">Data</th>
                    <th className="px-5 py-3 font-semibold">Tipo</th>
                    <th className="px-5 py-3 font-semibold">Valor</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {contributions.map((c) => (
                    <tr key={c.id} data-testid={`admin-contribution-${c.id}`} className="border-t border-border">
                      <td className="px-5 py-3">{c.user_name}</td>
                      <td className="px-5 py-3">{fmtDate(c.contributed_at + "T00:00:00")}</td>
                      <td className="px-5 py-3">{TYPE_LABELS[c.type]}</td>
                      <td className="px-5 py-3 font-semibold">{brl(c.amount)}</td>
                      <td className="px-5 py-3">
                        <Badge variant="secondary" className={c.status === "confirmada" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"}>
                          {c.status === "confirmada" ? "Confirmada" : "Registrada"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-2">
                          {c.status !== "confirmada" && (
                            <Button size="sm" onClick={() => confirmContribution(c.id)} data-testid={`confirm-contribution-${c.id}`} className="rounded-full bg-primary hover:bg-primary/90 h-8">
                              <Check size={13} className="mr-1" /> Confirmar
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => deleteContribution(c.id)} data-testid={`delete-contribution-${c.id}`} className="rounded-full text-destructive h-8">
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="igreja">
          {info && (
            <form onSubmit={saveInfo} className="rounded-2xl border border-border bg-card p-6 max-w-2xl space-y-4" data-testid="church-info-form">
              <h3 className="font-display text-xl font-semibold">Dados para contribuição</h3>
              <div>
                <Label>Nome da igreja</Label>
                <Input value={info.church_name} onChange={(e) => setInfo({ ...info, church_name: e.target.value })} data-testid="church-name-input" className="mt-1.5" />
              </div>
              <div>
                <Label>Chave PIX</Label>
                <Input value={info.pix_key} onChange={(e) => setInfo({ ...info, pix_key: e.target.value })} data-testid="church-pix-input" className="mt-1.5" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Banco</Label>
                  <Input value={info.bank_name} onChange={(e) => setInfo({ ...info, bank_name: e.target.value })} data-testid="church-bank-input" className="mt-1.5" />
                </div>
                <div>
                  <Label>Titular</Label>
                  <Input value={info.holder} onChange={(e) => setInfo({ ...info, holder: e.target.value })} data-testid="church-holder-input" className="mt-1.5" />
                </div>
                <div>
                  <Label>Agência</Label>
                  <Input value={info.agency} onChange={(e) => setInfo({ ...info, agency: e.target.value })} data-testid="church-agency-input" className="mt-1.5" />
                </div>
                <div>
                  <Label>Conta</Label>
                  <Input value={info.account} onChange={(e) => setInfo({ ...info, account: e.target.value })} data-testid="church-account-input" className="mt-1.5" />
                </div>
              </div>
              <div>
                <Label>CNPJ</Label>
                <Input value={info.cnpj} onChange={(e) => setInfo({ ...info, cnpj: e.target.value })} data-testid="church-cnpj-input" className="mt-1.5" />
              </div>
              <div>
                <Label>Endereços das igrejas (um por linha)</Label>
                <Textarea
                  rows={3}
                  value={(info.addresses || []).join("\n")}
                  onChange={(e) => setInfo({ ...info, addresses: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })}
                  placeholder={"Templo Principal — Rua da Fé, 123, Centro"}
                  data-testid="church-addresses-input"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Instruções</Label>
                <Textarea rows={3} value={info.instructions} onChange={(e) => setInfo({ ...info, instructions: e.target.value })} data-testid="church-instructions-input" className="mt-1.5" />
              </div>
              <Button type="submit" disabled={savingInfo} data-testid="church-info-save-button" className="rounded-full bg-primary hover:bg-primary/90">
                {savingInfo ? "Salvando..." : "Salvar alterações"}
              </Button>
            </form>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
