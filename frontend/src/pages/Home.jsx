import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HeartHandshake, Sparkles, Landmark, Copy, ArrowRight, Clock, MapPin, Instagram, Youtube, Images, ExternalLink, CalendarDays, Home as HomeIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { api, formatApiError } from "../lib/api";

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

const getVideoThumbnail = (url) => {
  if (!url) return null;
  const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (youtubeMatch) {
    return `https://img.youtube.com/vi/${youtubeMatch[1]}/hqdefault.jpg`;
  }
  return null;
};

const socialLinks = [
  {
    href: "https://www.instagram.com/igrejadejesuscristo_vespasiano/",
    label: "Instagram",
    description: "Acompanhe nossos bastidores e novidades",
    icon: Instagram,
  },
  {
    href: "https://www.youtube.com/@IgrejadeJesusCristoVespasiano",
    label: "YouTube",
    description: "Assista cultos, mensagens e vídeos especiais",
    icon: Youtube,
  },
];

export default function Home() {
  const { user, setUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [prayers, setPrayers] = useState([]);
  const [testimonies, setTestimonies] = useState([]);
  const [info, setInfo] = useState(null);
  const [profileForm, setProfileForm] = useState({ address: "", birthday: "" });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    api.get("/events").then((r) => setEvents(r.data.slice(0, 4))).catch(() => {});
    api.get("/posts", { params: { type: "prayer" } }).then((r) => setPrayers(r.data.slice(0, 3))).catch(() => {});
    api.get("/posts", { params: { type: "testimony" } }).then((r) => setTestimonies(r.data.slice(0, 3))).catch(() => {});
    api.get("/church-info").then((r) => setInfo(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      setProfileForm({ address: user.address || "", birthday: user.birthday || "" });
    }
  }, [user]);

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setIsSavingProfile(true);
    try {
      const response = await api.put("/auth/profile", profileForm);
      setUser(response.data);
      toast.success("Dados atualizados com sucesso");
    } catch (error) {
      toast.error(formatApiError(error, "Não foi possível salvar seus dados."));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const copyPix = () => {
    if (!info?.pix_key) return;
    navigator.clipboard
      .writeText(info.pix_key)
      .then(() => toast.success("Chave PIX copiada"))
      .catch(() => toast.error(`Não foi possível copiar. Chave PIX: ${info.pix_key}`));
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12" data-testid="home-page">
      <div className="max-w-2xl">
        <p className="overline-label">Paz do Senhor</p>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight mt-2">
          {user ? `Olá, ${user.name.split(" ")[0]}` : "Bem-vindo à Igreja de Jesus Cristo"}
        </h1>
        <p className="text-muted-foreground mt-3 text-base md:text-lg">
          “Tudo quanto fizerdes, fazei-o de coração, como ao Senhor.” — Colossenses 3:23
        </p>
        {!user && (
          <Link
            to="/login"
            data-testid="home-login-cta"
            className="inline-block mt-6 rounded-full bg-primary text-primary-foreground px-6 py-2.5 text-sm font-semibold hover:bg-primary/90 active:scale-95 transition-all duration-150"
          >
            Entrar ou cadastrar-se para participar
          </Link>
        )}
      </div>

      {user && (
        <section className="mt-10" data-testid="home-profile-section">
          <div className="feed-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="overline-label">Seu perfil</p>
                <h2 className="font-display text-2xl font-semibold mt-1">Atualize seus dados</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Adicione seu endereço e data de aniversário para manter seu cadastro sempre atualizado.
                </p>
              </div>
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                <HomeIcon size={18} />
              </div>
            </div>

            <form onSubmit={handleProfileSave} className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span className="flex items-center gap-2 font-medium text-foreground">
                  <HomeIcon size={14} /> Endereço
                </span>
                <input
                  type="text"
                  value={profileForm.address}
                  onChange={(event) => setProfileForm((current) => ({ ...current, address: event.target.value }))}
                  placeholder="Rua, número, bairro"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </label>

              <label className="space-y-2 text-sm">
                <span className="flex items-center gap-2 font-medium text-foreground">
                  <CalendarDays size={14} /> Data de aniversário
                </span>
                <input
                  type="date"
                  value={profileForm.birthday}
                  onChange={(event) => setProfileForm((current) => ({ ...current, birthday: event.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </label>

              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  {isSavingProfile ? "Salvando..." : "Salvar dados"}
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      <section className="mt-14" data-testid="home-events-section">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="overline-label">Agenda</p>
            <h2 className="font-display text-3xl font-semibold mt-1">Próximos eventos</h2>
          </div>
          <Link to="/agenda" data-testid="home-see-agenda-link" className="text-sm font-semibold text-primary hover:underline">
            Ver agenda completa
          </Link>
        </div>
        {events.length === 0 ? (
          <p className="text-muted-foreground text-sm" data-testid="home-no-events">Nenhum evento programado no momento.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {events.map((ev) => {
              const [y, m, d] = ev.date.split("-");
              return (
                <div key={ev.id} data-testid={`home-event-${ev.id}`} className="feed-card">
                  <p className="font-display text-3xl font-bold text-primary leading-none">{d}</p>
                  <p className="overline-label mt-1">{MESES[parseInt(m, 10) - 1]}</p>
                  <h3 className="font-semibold mt-3">{ev.title}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1.5">
                    <Clock size={12} /> {ev.time}
                  </p>
                  {ev.location && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin size={12} /> {ev.location}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="grid lg:grid-cols-2 gap-10 mt-14">
        <section data-testid="home-prayers-section">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="overline-label">Intercessão</p>
              <h2 className="font-display text-3xl font-semibold mt-1">Pedidos de oração</h2>
            </div>
            <Link to="/oracao" data-testid="home-see-prayers-link" className="text-sm font-semibold text-primary hover:underline">
              Ver mural
            </Link>
          </div>
          {prayers.length === 0 ? (
            <p className="text-muted-foreground text-sm" data-testid="home-no-prayers">Nenhum pedido publicado ainda.</p>
          ) : (
            <div className="space-y-4">
              {prayers.map((p) => (
                <Link key={p.id} to="/oracao" data-testid={`home-prayer-${p.id}`} className="feed-card block group">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold group-hover:text-primary transition-colors duration-150">{p.title}</h3>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent shrink-0">
                      <HeartHandshake size={14} /> {p.pray_count} orando
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm mt-1.5 line-clamp-2">{p.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">{p.author_name}</p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section data-testid="home-testimonies-section">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="overline-label">Gratidão</p>
              <h2 className="font-display text-3xl font-semibold mt-1">Testemunhos</h2>
            </div>
            <Link to="/testemunhos" data-testid="home-see-testimonies-link" className="text-sm font-semibold text-primary hover:underline">
              Ver mural
            </Link>
          </div>
          {testimonies.length === 0 ? (
            <p className="text-muted-foreground text-sm" data-testid="home-no-testimonies">Nenhum testemunho publicado ainda.</p>
          ) : (
            <div className="space-y-4">
              {testimonies.map((p) => (
                <Link key={p.id} to="/testemunhos" data-testid={`home-testimony-${p.id}`} className="feed-card block group">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-accent shrink-0" />
                    <h3 className="font-semibold group-hover:text-primary transition-colors duration-150">{p.title}</h3>
                  </div>
                  <p className="text-muted-foreground text-sm mt-1.5 line-clamp-2">{p.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">{p.author_name}</p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="mt-14" data-testid="home-media-section">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="overline-label">Mídia</p>
            <h2 className="font-display text-3xl font-semibold mt-1">Galeria e redes sociais</h2>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="grid sm:grid-cols-2 gap-4">
            {(info?.videos || []).length > 0 ? (
              info.videos.map((video) => {
                const thumbnail = getVideoThumbnail(video.url);
                return (
                  <a
                    key={video.id}
                    href={video.url}
                    target="_blank"
                    rel="noreferrer"
                    className="feed-card p-0 overflow-hidden group block"
                  >
                    <div className="relative">
                      {thumbnail ? (
                        <img src={thumbnail} alt={video.title} className="h-48 w-full object-cover transition duration-300 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-48 items-center justify-center bg-secondary/60">
                          <Youtube size={36} className="text-primary" />
                        </div>
                      )}
                      <span className="absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                        Vídeo
                      </span>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                          <Youtube size={16} />
                          {video.title}
                        </div>
                        <ExternalLink size={14} className="text-muted-foreground" />
                      </div>
                      {video.description && <p className="text-sm text-muted-foreground mt-2">{video.description}</p>}
                    </div>
                  </a>
                );
              })
            ) : (
              <div className="sm:col-span-2 rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                Nenhum vídeo cadastrado ainda. Use o painel admin para adicionar vídeos que aparecerão aqui.
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="feed-card">
              <p className="overline-label">Siga a igreja</p>
              <div className="space-y-3 mt-4">
                {socialLinks.map(({ href, label, description, icon: Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-xl border border-border p-3 hover:bg-secondary transition-colors duration-150"
                  >
                    <span className="flex items-center gap-3">
                      <span className="rounded-full bg-primary/10 p-2 text-primary">
                        <Icon size={18} />
                      </span>
                      <span>
                        <span className="block font-semibold">{label}</span>
                        <span className="block text-sm text-muted-foreground">{description}</span>
                      </span>
                    </span>
                    <ExternalLink size={16} className="text-muted-foreground" />
                  </a>
                ))}
              </div>
            </div>

            <a
              href="https://www.youtube.com/@IgrejadeJesusCristoVespasiano"
              target="_blank"
              rel="noreferrer"
              className="feed-card block group"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="overline-label">Vídeos</p>
                  <h3 className="font-semibold mt-2">Assista aos nossos conteúdos</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Acompanhe mensagens, cultos e momentos especiais no YouTube.
                  </p>
                </div>
                <span className="rounded-full bg-primary/10 p-2 text-primary shrink-0">
                  <Youtube size={18} />
                </span>
              </div>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors duration-150">
                <Youtube size={16} /> Abrir no YouTube
              </div>
            </a>
          </div>
        </div>
      </section>

      <section className="mt-14" data-testid="home-contributions-section">
        <p className="overline-label">Generosidade</p>
        <h2 className="font-display text-3xl font-semibold mt-1 mb-6">Contribua com a obra</h2>
        {info && (
          <div className="feed-card flex flex-wrap items-center gap-6">
            <span className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Landmark size={22} />
            </span>
            <div className="flex-1 min-w-[220px]">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Chave PIX</p>
              <p className="font-semibold break-all" data-testid="home-pix-key">{info.pix_key}</p>
              <p className="text-xs text-muted-foreground mt-1">{info.bank_name} • Ag {info.agency} • Cc {info.account}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={copyPix}
                data-testid="home-copy-pix-button"
                className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:bg-primary/90 active:scale-95 transition-all duration-150"
              >
                <Copy size={14} /> Copiar chave
              </button>
              <Link
                to="/contribuicoes"
                data-testid="home-see-contributions-link"
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold text-primary hover:bg-secondary transition-colors duration-150"
              >
                Detalhes <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </section>

      {info?.addresses?.length > 0 && (
        <section className="mt-14" data-testid="home-addresses-section">
          <p className="overline-label">Visite-nos</p>
          <h2 className="font-display text-3xl font-semibold mt-1 mb-6">Nossos endereços</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {info.addresses.map((addr, i) => (
              <div key={i} data-testid={`home-address-${i}`} className="feed-card flex items-start gap-3">
                <MapPin size={18} className="text-accent shrink-0 mt-0.5" />
                <p className="text-sm">{addr}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
