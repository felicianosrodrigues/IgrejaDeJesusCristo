import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HeartHandshake, Sparkles, Landmark, Copy, ArrowRight, Clock, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export default function Home() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [prayers, setPrayers] = useState([]);
  const [testimonies, setTestimonies] = useState([]);
  const [info, setInfo] = useState(null);

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
    <div className="max-w-6xl mx-auto px-6 py-12" data-testid="home-page">
      <div className="max-w-2xl">
        <p className="overline-label">Paz do Senhor</p>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight mt-2">
          {user ? `Olá, ${user.name.split(" ")[0]}` : "Bem-vindo à Comunidade da Fé"}
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
