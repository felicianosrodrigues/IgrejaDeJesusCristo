import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HeartHandshake, Sparkles, Landmark, Copy, ArrowRight, Clock, MapPin, Instagram, Youtube, ExternalLink, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { api, formatApiError } from "../lib/api";

const getVideoThumbnail = (url) => {
  if (!url) return null;
  const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (youtubeMatch) {
    return `https://img.youtube.com/vi/${youtubeMatch[1]}/hqdefault.jpg`;
  }
  return null;
};

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

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

const quickLinks = [
  { to: "/agenda", title: "Cultos e horários", description: "Confira os próximos encontros e eventos da igreja.", icon: CalendarDays },
  { to: "/oracao", title: "Mural de oração", description: "Deixe seu pedido e receba intercessão da comunidade.", icon: HeartHandshake },
  { to: "/testemunhos", title: "Testemunhos", description: "Leia histórias de fé e transformação da nossa igreja.", icon: Sparkles },
  { to: "/contribuicoes", title: "Contribua", description: "Apoie a obra com sua oferta, dízimo e participação.", icon: Landmark },
];

export default function Home() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [prayers, setPrayers] = useState([]);
  const [testimonies, setTestimonies] = useState([]);
  const [info, setInfo] = useState(null);
  const pixQrUrl = "/pix-qrcode.png";

  useEffect(() => {
    api.get("/events").then((r) => setEvents(r.data.slice(0, 4))).catch(() => {});
    api.get("/posts", { params: { type: "prayer" } }).then((r) => setPrayers(r.data.slice(0, 3))).catch(() => {});
    api.get("/posts", { params: { type: "testimony" } }).then((r) => setTestimonies(r.data.slice(0, 3))).catch(() => {});
    api.get("/church-info").then((r) => setInfo(r.data)).catch(() => {});
  }, []);

  const copyPix = () => {
    if (!info?.pix_key) return;
    navigator.clipboard
      .writeText(info.pix_key)
      .then(() => toast.success("Chave PIX copiada"))
      .catch(() => toast.error(`Não foi possível copiar. Chave PIX: ${info.pix_key}`));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" data-testid="home-page">
      <section className="relative overflow-hidden rounded-[2rem] border border-border/80 bg-card shadow-[0_30px_80px_-35px_rgba(15,46,33,0.35)]">
        <img
          src="https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1400&q=80"
          alt="Igreja em culto"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f2e21]/95 via-[#0f2e21]/75 to-[#0f2e21]/20" />
        <div className="relative grid gap-8 px-6 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:px-10 lg:py-14">
          <div className="max-w-2xl text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-200">Paz do Senhor</p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              {user ? `Olá, ${user.name.split(" ")[0]}` : "Uma igreja acolhedora, viva e cheia de propósito"}
            </h1>
            <p className="mt-4 text-base text-white/80 sm:text-lg">
              “Tudo quanto fizerdes, fazei-o de coração, como ao Senhor.” — Colossenses 3:23
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {!user ? (
                <Link
                  to="/login"
                  data-testid="home-login-cta"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                >
                  Entrar ou cadastrar-se <ArrowRight size={16} />
                </Link>
              ) : (
                <Link
                  to="/agenda"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                >
                  Ver agenda <ArrowRight size={16} />
                </Link>
              )}
              <Link
                to="/oracao"
                className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Mural de oração
              </Link>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/15 bg-white/10 p-5 backdrop-blur-md">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-100">Na igreja</p>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-sm font-semibold text-white">Cultos aos domingos</p>
                <p className="mt-1 text-sm text-white/75">Experiências de adoração, palavra e comunhão.</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-sm font-semibold text-white">Oração e apoio</p>
                <p className="mt-1 text-sm text-white/75">Uma comunidade pronta para interceder por você.</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-sm font-semibold text-white">Mídia e conteúdo</p>
                <p className="mt-1 text-sm text-white/75">Cultos, mensagens e testemunhos em um só lugar.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4" data-testid="home-quick-links">
        {quickLinks.map(({ to, title, description, icon: Icon }) => (
          <Link key={title} to={to} className="feed-card block group">
            <div className="flex items-center gap-3">
              <span className="rounded-2xl bg-primary/10 p-2 text-primary">
                <Icon size={18} />
              </span>
              <div>
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
          </Link>
        ))}
      </section>

      <section className="mt-10" data-testid="home-events-section">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="overline-label">Agenda</p>
            <h2 className="mt-1 font-display text-3xl font-semibold">Próximos eventos</h2>
          </div>
          <Link to="/agenda" data-testid="home-see-agenda-link" className="text-sm font-semibold text-primary hover:underline">
            Ver agenda completa
          </Link>
        </div>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground" data-testid="home-no-events">Nenhum evento programado no momento.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {events.map((ev) => (
              <div key={ev.id} data-testid={`home-event-${ev.id}`} className="feed-card">
                <p className="font-display text-3xl font-bold leading-none text-primary">{ev.date.split("-")[2]}</p>
                <p className="overline-label mt-1">{MESES[parseInt(ev.date.split("-")[1], 10) - 1]}</p>
                <h3 className="mt-3 font-semibold">{ev.title}</h3>
                <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock size={12} /> {ev.time}
                </p>
                {ev.location && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin size={12} /> {ev.location}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section data-testid="home-prayers-section">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="overline-label">Intercessão</p>
              <h2 className="mt-1 font-display text-3xl font-semibold">Pedidos de oração</h2>
            </div>
            <Link to="/oracao" data-testid="home-see-prayers-link" className="text-sm font-semibold text-primary hover:underline">
              Ver mural
            </Link>
          </div>
          {prayers.length === 0 ? (
            <p className="text-sm text-muted-foreground" data-testid="home-no-prayers">Nenhum pedido publicado ainda.</p>
          ) : (
            <div className="space-y-4">
              {prayers.map((p) => (
                <Link key={p.id} to="/oracao" data-testid={`home-prayer-${p.id}`} className="feed-card block group">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold transition-colors duration-150 group-hover:text-primary">{p.title}</h3>
                    <span className="inline-flex items-center gap-1.5 shrink-0 text-xs font-semibold text-accent">
                      <HeartHandshake size={14} /> {p.pray_count} orando
                    </span>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{p.content}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{p.author_name}</p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section data-testid="home-testimonies-section">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="overline-label">Gratidão</p>
              <h2 className="mt-1 font-display text-3xl font-semibold">Testemunhos</h2>
            </div>
            <Link to="/testemunhos" data-testid="home-see-testimonies-link" className="text-sm font-semibold text-primary hover:underline">
              Ver mural
            </Link>
          </div>
          {testimonies.length === 0 ? (
            <p className="text-sm text-muted-foreground" data-testid="home-no-testimonies">Nenhum testemunho publicado ainda.</p>
          ) : (
            <div className="space-y-4">
              {testimonies.map((p) => (
                <Link key={p.id} to="/testemunhos" data-testid={`home-testimony-${p.id}`} className="feed-card block group">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="shrink-0 text-accent" />
                    <h3 className="font-semibold transition-colors duration-150 group-hover:text-primary">{p.title}</h3>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{p.content}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{p.author_name}</p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="mt-10" data-testid="home-media-section">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="overline-label">Mídia</p>
            <h2 className="mt-1 font-display text-3xl font-semibold">Galeria e redes sociais</h2>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            {(info?.videos || []).length > 0 ? (
              info.videos.map((video) => {
                const thumbnail = getVideoThumbnail(video.url);
                return (
                  <a
                    key={video.id}
                    href={video.url}
                    target="_blank"
                    rel="noreferrer"
                    className="feed-card block overflow-hidden p-0 group"
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
                      {video.description && <p className="mt-2 text-sm text-muted-foreground">{video.description}</p>}
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
              <div className="mt-4 space-y-3">
                {socialLinks.map(({ href, label, description, icon: Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-xl border border-border p-3 transition-colors duration-150 hover:bg-secondary"
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

          </div>
        </div>
      </section>

      <section className="mt-10" data-testid="home-contributions-section">
        <p className="overline-label">Generosidade</p>
        <h2 className="mt-1 mb-6 font-display text-3xl font-semibold">Contribua com a obra</h2>
        {info && (
          <div className="feed-card grid gap-6 md:grid-cols-[auto_1fr] md:items-center">
            {pixQrUrl && (
              <div className="flex flex-col items-center gap-3">
                <img
                  src={pixQrUrl}
                  alt="QR code do PIX"
                  className="h-40 w-40 rounded-2xl border border-border bg-white p-2"
                />
              </div>
            )}
            <div className="min-w-[220px] flex-1">
              <p className="text-sm font-semibold text-foreground">Associação Evangelica do Povo de Deus</p>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Chave PIX</p>
              <p className="break-all font-semibold" data-testid="home-pix-key">{info.pix_key}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                CNPJ {info.cnpj || "—"} • {info.bank_name} • Ag {info.agency} • Cc {info.account}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Escaneie o QR code para facilitar a contribuição pelo PIX.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={copyPix}
                  data-testid="home-copy-pix-button"
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:scale-95"
                >
                  <Copy size={14} /> Copiar chave
                </button>
                <Link
                  to="/contribuicoes"
                  data-testid="home-see-contributions-link"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold text-primary transition-colors duration-150 hover:bg-secondary"
                >
                  Detalhes <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>

      {info?.addresses?.length > 0 && (
        <section className="mt-10" data-testid="home-addresses-section">
          <p className="overline-label">Visite-nos</p>
          <h2 className="mt-1 mb-6 font-display text-3xl font-semibold">Nossos endereços</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {info.addresses.map((addr, i) => (
              <div key={i} data-testid={`home-address-${i}`} className="feed-card flex items-start gap-3">
                <MapPin size={18} className="mt-0.5 shrink-0 text-accent" />
                <p className="text-sm">{addr}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
