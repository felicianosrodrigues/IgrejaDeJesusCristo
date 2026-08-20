import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Check, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "../lib/api";
import { lookupCep, normalizeCep } from "../lib/cep";
import { fileToDataUrl } from "../lib/image";
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
const fmtBirthday = (value) => (value ? value.split("-").reverse().join("/") : "-");

export default function Admin() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [pendingPosts, setPendingPosts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [events, setEvents] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [users, setUsers] = useState([]);
  const [info, setInfo] = useState(null);
  const [eventForm, setEventForm] = useState({ title: "", description: "", date: "", time: "", location: "" });
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingUserForm, setEditingUserForm] = useState({
    name: "",
    email: "",
    role: "member",
    cep: "",
    rua: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    birthday: "",
    photo_url: "",
    password: "",
  });
  const [newUserForm, setNewUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "member",
    cep: "",
    rua: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    birthday: "",
    photo_url: "",
  });
  const [creatingUser, setCreatingUser] = useState(false);
  const [videoForm, setVideoForm] = useState({ title: "", url: "", description: "" });
  const [savingEvent, setSavingEvent] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [devotionals, setDevotionals] = useState([]);
  const [devotionalForm, setDevotionalForm] = useState({ title: "", content: "" });
  const [savingDevotional, setSavingDevotional] = useState(false);
  const [editingDevotionalId, setEditingDevotionalId] = useState(null);
  const [editingDevotionalForm, setEditingDevotionalForm] = useState({ title: "", content: "" });

  const loadAll = useCallback(() => {
    api.get("/admin/stats").then((r) => setStats(r.data)).catch(() => {});
    api.get("/admin/posts", { params: { status: "pending" } }).then((r) => setPendingPosts(r.data)).catch(() => {});
    api.get("/admin/suggestions").then((r) => setSuggestions(r.data)).catch(() => {});
    api.get("/events").then((r) => setEvents(r.data)).catch(() => {});
    api.get("/admin/contributions").then((r) => setContributions(r.data)).catch(() => {});
    api.get("/admin/users").then((r) => setUsers(r.data)).catch(() => {});
    api.get("/church-info").then((r) => setInfo(r.data || { addresses: [], videos: [] })).catch(() => {});
    api.get("/admin/devotionals").then((r) => setDevotionals(r.data)).catch(() => {});
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

  const startEditingUser = (user) => {
    setEditingUserId(user.id);
    setEditingUserForm({
      name: user.name || "",
      email: user.email || "",
      role: user.role || "member",
      cep: user.cep || "",
      rua: user.rua || "",
      numero: user.numero || "",
      complemento: user.complemento || "",
      bairro: user.bairro || "",
      cidade: user.cidade || "",
      estado: user.estado || "",
      birthday: user.birthday || "",
      photo_url: user.photo_url || "",
      password: "",
    });
  };

  const cancelEditingUser = () => {
    setEditingUserId(null);
    setEditingUserForm({
      name: "",
      email: "",
      role: "member",
      cep: "",
      rua: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      estado: "",
      birthday: "",
      photo_url: "",
      password: "",
    });
  };

  const saveUser = async (id) => {
    try {
      const payload = { ...editingUserForm };
      if (!payload.password?.trim()) {
        delete payload.password;
      }
      const response = await api.put(`/admin/users/${id}`, payload);
      setUsers((current) => current.map((user) => (user.id === id ? response.data : user)));
      setEditingUserId(null);
      toast.success("Usuário atualizado.");
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const createUser = async (e) => {
    e.preventDefault();
    setCreatingUser(true);
    try {
      const response = await api.post("/admin/users", newUserForm);
      setUsers((current) => [...current, response.data]);
      setNewUserForm({
        name: "",
        email: "",
        password: "",
        role: "member",
        cep: "",
        rua: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "",
        estado: "",
        birthday: "",
        photo_url: "",
      });
      toast.success("Usuário criado com sucesso.");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setCreatingUser(false);
    }
  };

  const handleNewUserCepLookup = async () => {
    try {
      if (normalizeCep(newUserForm.cep).length !== 8) return;
      const result = await lookupCep(newUserForm.cep);
      setNewUserForm((current) => ({ ...current, ...result }));
    } catch (err) {
      toast.error(err.message || "Não foi possível consultar o CEP.");
    }
  };

  const handleEditingUserCepLookup = async () => {
    try {
      if (normalizeCep(editingUserForm.cep).length !== 8) return;
      const result = await lookupCep(editingUserForm.cep);
      setEditingUserForm((current) => ({ ...current, ...result }));
    } catch (err) {
      toast.error(err.message || "Não foi possível consultar o CEP.");
    }
  };

  const handleNewUserPhotoChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const photo_url = await fileToDataUrl(file);
      setNewUserForm((current) => ({ ...current, photo_url }));
    } catch (err) {
      toast.error(err.message || "Não foi possível ler a imagem selecionada.");
    }
  };

  const handleEditingUserPhotoChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const photo_url = await fileToDataUrl(file);
      setEditingUserForm((current) => ({ ...current, photo_url }));
    } catch (err) {
      toast.error(err.message || "Não foi possível ler a imagem selecionada.");
    }
  };

  const addVideo = () => {
    if (!info) return;
    if (!videoForm.title.trim() || !videoForm.url.trim()) {
      toast.error("Preencha o título e a URL do vídeo.");
      return;
    }
    setInfo({
      ...info,
      videos: [
        ...(info.videos || []),
        {
          id: `${Date.now()}`,
          title: videoForm.title.trim(),
          url: videoForm.url.trim(),
          description: videoForm.description.trim(),
        },
      ],
    });
    setVideoForm({ title: "", url: "", description: "" });
  };

  const removeVideo = (id) => {
    if (!info) return;
    setInfo({ ...info, videos: (info.videos || []).filter((video) => video.id !== id) });
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

  const createDevotional = async (e) => {
    e.preventDefault();
    setSavingDevotional(true);
    try {
      const response = await api.post("/admin/devotionals", devotionalForm);
      setDevotionals((current) => [response.data, ...current]);
      setDevotionalForm({ title: "", content: "" });
      toast.success("Devocional publicado.");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSavingDevotional(false);
    }
  };

  const startEditingDevotional = (devotional) => {
    setEditingDevotionalId(devotional.id);
    setEditingDevotionalForm({ title: devotional.title || "", content: devotional.content || "" });
  };

  const cancelEditingDevotional = () => {
    setEditingDevotionalId(null);
    setEditingDevotionalForm({ title: "", content: "" });
  };

  const saveDevotional = async (id) => {
    try {
      const response = await api.put(`/admin/devotionals/${id}`, editingDevotionalForm);
      setDevotionals((current) => current.map((d) => (d.id === id ? response.data : d)));
      setEditingDevotionalId(null);
      toast.success("Devocional atualizado.");
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const deleteDevotional = async (id) => {
    try {
      await api.delete(`/admin/devotionals/${id}`);
      setDevotionals((current) => current.filter((d) => d.id !== id));
      toast.success("Devocional removido.");
    } catch (err) {
      toast.error(formatApiError(err));
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
          <TabsTrigger value="devocionais" data-testid="tab-devocionais">Devocionais ({devotionals.length})</TabsTrigger>
          <TabsTrigger value="eventos" data-testid="tab-eventos">Eventos</TabsTrigger>
          <TabsTrigger value="sugestoes" data-testid="tab-sugestoes">Sugestões ({suggestions.filter((s) => s.status === "pending").length})</TabsTrigger>
          <TabsTrigger value="contribuicoes" data-testid="tab-contribuicoes">Contribuições</TabsTrigger>
          <TabsTrigger value="usuarios" data-testid="tab-usuarios">Usuários ({users.length})</TabsTrigger>
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

        <TabsContent value="devocionais">
          <div className="grid lg:grid-cols-3 gap-8">
            <form onSubmit={createDevotional} className="rounded-2xl border border-border bg-card p-5 space-y-4" data-testid="devotional-form">
              <h3 className="font-display text-xl font-semibold">Novo devocional</h3>
              <div>
                <Label>Título</Label>
                <Input required minLength={3} value={devotionalForm.title} onChange={(e) => setDevotionalForm({ ...devotionalForm, title: e.target.value })} data-testid="devotional-title-input" className="mt-1.5" />
              </div>
              <div>
                <Label>Conteúdo</Label>
                <Textarea required minLength={5} rows={6} value={devotionalForm.content} onChange={(e) => setDevotionalForm({ ...devotionalForm, content: e.target.value })} data-testid="devotional-content-input" className="mt-1.5" />
              </div>
              <Button type="submit" disabled={savingDevotional} data-testid="devotional-submit-button" className="w-full rounded-full bg-primary hover:bg-primary/90">
                {savingDevotional ? "Publicando..." : "Publicar devocional"}
              </Button>
            </form>
            <div className="lg:col-span-2 space-y-3">
              {devotionals.length === 0 ? (
                <p className="text-muted-foreground text-sm" data-testid="admin-devotionals-empty">Nenhum devocional cadastrado.</p>
              ) : (
                devotionals.map((d) => (
                  <div key={d.id} data-testid={`admin-devotional-${d.id}`} className="rounded-xl border border-border bg-card p-4">
                    {editingDevotionalId === d.id ? (
                      <div className="space-y-3">
                        <div>
                          <Label>Título</Label>
                          <Input value={editingDevotionalForm.title} onChange={(e) => setEditingDevotionalForm({ ...editingDevotionalForm, title: e.target.value })} className="mt-1.5" />
                        </div>
                        <div>
                          <Label>Conteúdo</Label>
                          <Textarea rows={5} value={editingDevotionalForm.content} onChange={(e) => setEditingDevotionalForm({ ...editingDevotionalForm, content: e.target.value })} className="mt-1.5" />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => saveDevotional(d.id)} className="rounded-full bg-primary hover:bg-primary/90">Salvar</Button>
                          <Button size="sm" variant="outline" onClick={cancelEditingDevotional} className="rounded-full">Cancelar</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{d.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{fmtDate(d.created_at)}</p>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{d.content}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button size="sm" variant="outline" onClick={() => startEditingDevotional(d)} data-testid={`edit-devotional-${d.id}`} className="rounded-full">
                            Editar
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => deleteDevotional(d.id)} data-testid={`delete-devotional-${d.id}`} className="rounded-full text-destructive">
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
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

        <TabsContent value="usuarios">
          <div className="rounded-2xl border border-border bg-card p-6 mb-6">
            <h3 className="font-display text-xl font-semibold">Cadastrar novo usuário</h3>
            <form onSubmit={createUser} className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <Label>Nome</Label>
                <Input required value={newUserForm.name} onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })} className="mt-1.5" />
              </div>
              <div>
                <Label>Email</Label>
                <Input required type="email" value={newUserForm.email} onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })} className="mt-1.5" />
              </div>
              <div>
                <Label>Senha</Label>
                <Input required type="password" value={newUserForm.password} onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })} className="mt-1.5" />
              </div>
              <div>
                <Label>Tipo</Label>
                <select value={newUserForm.role} onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })} className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="member">Membro</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="md:col-span-2 rounded-2xl border border-border/60 p-4">
                <p className="text-sm font-medium mb-4">Endereço</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>CEP</Label>
                    <div className="mt-1.5 flex gap-2">
                      <Input
                        value={newUserForm.cep}
                        onChange={(e) => setNewUserForm({ ...newUserForm, cep: normalizeCep(e.target.value) })}
                        onBlur={handleNewUserCepLookup}
                        inputMode="numeric"
                        maxLength={8}
                      />
                      <Button type="button" variant="outline" onClick={handleNewUserCepLookup} className="rounded-full">
                        Buscar
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>Rua</Label>
                    <Input value={newUserForm.rua} onChange={(e) => setNewUserForm({ ...newUserForm, rua: e.target.value })} className="mt-1.5" />
                  </div>
                  <div>
                    <Label>Número</Label>
                    <Input value={newUserForm.numero} onChange={(e) => setNewUserForm({ ...newUserForm, numero: e.target.value })} className="mt-1.5" />
                  </div>
                  <div>
                    <Label>Complemento</Label>
                    <Input value={newUserForm.complemento} onChange={(e) => setNewUserForm({ ...newUserForm, complemento: e.target.value })} className="mt-1.5" />
                  </div>
                  <div>
                    <Label>Bairro</Label>
                    <Input value={newUserForm.bairro} onChange={(e) => setNewUserForm({ ...newUserForm, bairro: e.target.value })} className="mt-1.5" />
                  </div>
                  <div>
                    <Label>Cidade</Label>
                    <Input value={newUserForm.cidade} onChange={(e) => setNewUserForm({ ...newUserForm, cidade: e.target.value })} className="mt-1.5" />
                  </div>
                  <div>
                    <Label>Estado</Label>
                    <Input value={newUserForm.estado} onChange={(e) => setNewUserForm({ ...newUserForm, estado: e.target.value })} className="mt-1.5" />
                  </div>
                </div>
              </div>
              <div>
                <Label>Aniversário</Label>
                <Input type="date" value={newUserForm.birthday} onChange={(e) => setNewUserForm({ ...newUserForm, birthday: e.target.value })} className="mt-1.5" />
              </div>
              <div>
                <Label>Foto (arquivo opcional)</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleNewUserPhotoChange}
                  className="mt-1.5"
                />
                {newUserForm.photo_url && (
                  <img
                    src={newUserForm.photo_url}
                    alt="Pré-visualização da foto"
                    className="mt-3 h-20 w-20 rounded-full object-cover border border-border"
                  />
                )}
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit" disabled={creatingUser} className="rounded-full bg-primary hover:bg-primary/90">
                  {creatingUser ? "Cadastrando..." : "Cadastrar usuário"}
                </Button>
              </div>
            </form>
          </div>

          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {users.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground" data-testid="admin-users-empty">Nenhum usuário cadastrado.</p>
            ) : (
              <div className="divide-y divide-border">
                {users.map((userItem) => (
                  <div key={userItem.id} className="p-4" data-testid={`admin-user-${userItem.id}`}>
                    {editingUserId === userItem.id ? (
                      <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <Label>Nome</Label>
                            <Input
                              value={editingUserForm.name}
                              onChange={(e) => setEditingUserForm({ ...editingUserForm, name: e.target.value })}
                              className="mt-1.5"
                            />
                          </div>
                          <div>
                            <Label>Email</Label>
                            <Input
                              type="email"
                              value={editingUserForm.email}
                              onChange={(e) => setEditingUserForm({ ...editingUserForm, email: e.target.value })}
                              className="mt-1.5"
                            />
                          </div>
                          <div>
                            <Label>Tipo</Label>
                            <select
                              value={editingUserForm.role}
                              onChange={(e) => setEditingUserForm({ ...editingUserForm, role: e.target.value })}
                              className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                              <option value="member">Membro</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>
                          <div>
                            <Label>Aniversário</Label>
                            <Input
                              type="date"
                              value={editingUserForm.birthday}
                              onChange={(e) => setEditingUserForm({ ...editingUserForm, birthday: e.target.value })}
                              className="mt-1.5"
                            />
                          </div>
                        </div>
                        <div className="rounded-2xl border border-border/60 p-4">
                          <p className="text-sm font-medium mb-4">Endereço</p>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <Label>CEP</Label>
                              <div className="mt-1.5 flex gap-2">
                                <Input
                                  value={editingUserForm.cep}
                                  onChange={(e) => setEditingUserForm({ ...editingUserForm, cep: normalizeCep(e.target.value) })}
                                  onBlur={handleEditingUserCepLookup}
                                  inputMode="numeric"
                                  maxLength={8}
                                />
                                <Button type="button" variant="outline" onClick={handleEditingUserCepLookup} className="rounded-full">
                                  Buscar
                                </Button>
                              </div>
                            </div>
                            <div>
                              <Label>Rua</Label>
                              <Input
                                value={editingUserForm.rua}
                                onChange={(e) => setEditingUserForm({ ...editingUserForm, rua: e.target.value })}
                                className="mt-1.5"
                              />
                            </div>
                            <div>
                              <Label>Número</Label>
                              <Input
                                value={editingUserForm.numero}
                                onChange={(e) => setEditingUserForm({ ...editingUserForm, numero: e.target.value })}
                                className="mt-1.5"
                              />
                            </div>
                            <div>
                              <Label>Complemento</Label>
                              <Input
                                value={editingUserForm.complemento}
                                onChange={(e) => setEditingUserForm({ ...editingUserForm, complemento: e.target.value })}
                                className="mt-1.5"
                              />
                            </div>
                            <div>
                              <Label>Bairro</Label>
                              <Input
                                value={editingUserForm.bairro}
                                onChange={(e) => setEditingUserForm({ ...editingUserForm, bairro: e.target.value })}
                                className="mt-1.5"
                              />
                            </div>
                            <div>
                              <Label>Cidade</Label>
                              <Input
                                value={editingUserForm.cidade}
                                onChange={(e) => setEditingUserForm({ ...editingUserForm, cidade: e.target.value })}
                                className="mt-1.5"
                              />
                            </div>
                            <div>
                              <Label>Estado</Label>
                              <Input
                                value={editingUserForm.estado}
                                onChange={(e) => setEditingUserForm({ ...editingUserForm, estado: e.target.value })}
                                className="mt-1.5"
                              />
                            </div>
                          </div>
                        </div>
                        <div>
                          <Label>Foto (arquivo opcional)</Label>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleEditingUserPhotoChange}
                            className="mt-1.5"
                          />
                          {editingUserForm.photo_url && (
                            <img
                              src={editingUserForm.photo_url}
                              alt="Pré-visualização da foto"
                              className="mt-3 h-20 w-20 rounded-full object-cover border border-border"
                            />
                          )}
                        </div>
                        <div>
                          <Label>Nova senha</Label>
                          <Input
                            type="password"
                            value={editingUserForm.password}
                            onChange={(e) => setEditingUserForm({ ...editingUserForm, password: e.target.value })}
                            className="mt-1.5"
                            placeholder="Deixe em branco para manter"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => saveUser(userItem.id)} className="rounded-full bg-primary hover:bg-primary/90">
                            Salvar
                          </Button>
                          <Button variant="outline" onClick={cancelEditingUser} className="rounded-full">
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-[240px]">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{userItem.name}</p>
                            <Badge variant="secondary" className={userItem.role === "admin" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"}>
                              {userItem.role === "admin" ? "Admin" : "Membro"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{userItem.email}</p>
                          <p className="text-xs text-muted-foreground mt-1">Endereço: {userItem.address || "—"}</p>
                          <p className="text-xs text-muted-foreground mt-1">Aniversário: {fmtBirthday(userItem.birthday)}</p>
                        </div>
                        <Button variant="outline" onClick={() => startEditingUser(userItem)} className="rounded-full">
                          Editar
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
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
              <div>
                <Label>Vídeos exibidos na home</Label>
                <div className="mt-2 space-y-3 rounded-xl border border-border p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs">Título</Label>
                      <Input value={videoForm.title} onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })} placeholder="Culto de domingo" className="mt-1.5" />
                    </div>
                    <div>
                      <Label className="text-xs">URL do vídeo</Label>
                      <Input value={videoForm.url} onChange={(e) => setVideoForm({ ...videoForm, url: e.target.value })} placeholder="https://www.youtube.com/watch?v=..." className="mt-1.5" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Descrição</Label>
                    <Textarea rows={2} value={videoForm.description} onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })} placeholder="Resumo ou observação sobre o vídeo" className="mt-1.5" />
                  </div>
                  <Button type="button" onClick={addVideo} className="rounded-full bg-primary hover:bg-primary/90">
                    Adicionar vídeo
                  </Button>
                  <div className="space-y-2">
                    {(info.videos || []).map((video) => (
                      <div key={video.id} className="flex items-start justify-between gap-3 rounded-lg border border-border bg-secondary/50 p-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm">{video.title}</p>
                          <p className="text-xs text-muted-foreground break-all">{video.url}</p>
                          {video.description && <p className="text-xs text-muted-foreground mt-1">{video.description}</p>}
                        </div>
                        <Button type="button" size="sm" variant="ghost" onClick={() => removeVideo(video.id)} className="rounded-full text-destructive shrink-0">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
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
