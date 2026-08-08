import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HeartHandshake, Sparkles, CalendarDays, HandCoins, ArrowRight, Clock, MapPin } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

const cards = [
  {
    to: "/oracao",
    icon: HeartHandshake,
    title: "Mural de Oração",
    desc: "Compartilhe seus pedidos e ore pelos irmãos.",
    testid: "home-card-prayer",
  },
  {
    to: "/testemunhos",
    icon: Sparkles,
    title: "Testemunhos",
    desc: "Leia e compartilhe o que Deus tem feito.",
    testid: "home-card-testimony",
  },
  {
    to: "/agenda",
    icon: CalendarDays,
    title: "Agenda da Igreja",
    desc: "Cultos, estudos e eventos da comunidade.",
    testid: "home-card-agenda",
  },
  {
    to: "/contribuicoes",
    icon: HandCoins,
    title: "Contribuições",
    desc: "Dízimos e ofertas com transparência.",
    testid: "home-card-contributions",
  },
];

export default function Home() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    api.get("/events").then((r) => setEvents(r.data.slice(0, 3))).catch(() => {});
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12" data-testid="home-page">
      <p className="overline-label">Paz do Senhor</p>
      <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight mt-2">
        Olá, {user?.name?.split(" ")[0]}
      </h1>
      <p className="text-muted-foreground mt-3 max-w-xl text-base md:text-lg">
        “Tudo quanto fizerdes, fazei-o de coração, como ao Senhor.” — Colossenses 3:23
      </p>

      <div className="grid sm:grid-cols-2 gap-6 mt-12">
        {cards.map((c, i) => (
          <Link
            key={c.to}
            to={c.to}
            data-testid={c.testid}
            className="feed-card group flex items-start gap-5 animate-feed-in"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <span className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
              <c.icon size={22} />
            </span>
            <div className="flex-1">
              <h2 className="font-display text-2xl font-semibold">{c.title}</h2>
              <p className="text-muted-foreground text-sm mt-1">{c.desc}</p>
            </div>
            <ArrowRight size={18} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-200 mt-1" />
          </Link>
        ))}
      </div>

      <div className="mt-16">
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
          <div className="grid md:grid-cols-3 gap-4">
            {events.map((ev) => {
              const [y, m, d] = ev.date.split("-");
              return (
                <div key={ev.id} data-testid={`home-event-${ev.id}`} className="feed-card flex gap-4">
                  <div className="text-center shrink-0 w-14">
                    <p className="font-display text-3xl font-bold text-primary leading-none">{d}</p>
                    <p className="overline-label mt-1">{MESES[parseInt(m, 10) - 1]}</p>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{ev.title}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock size={12} /> {ev.time}
                      {ev.location && (
                        <>
                          <span className="mx-1">•</span>
                          <MapPin size={12} /> {ev.location}
                        </>
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
