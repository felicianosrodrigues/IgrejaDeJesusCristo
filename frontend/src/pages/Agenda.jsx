import { useEffect, useState } from "react";
import { CalendarPlus, Clock, MapPin } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export default function Agenda() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", proposed_date: "", proposed_time: "", location: "" });

  useEffect(() => {
    api.get("/events")
      .then((r) => setEvents(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSuggest = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post("/suggestions", form);
      toast.success("Sugestão enviada para a liderança.");
      setOpen(false);
      setForm({ title: "", description: "", proposed_date: "", proposed_time: "", location: "" });
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12" data-testid="agenda-page">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
        <div>
          <p className="overline-label">Programação</p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight mt-1">Agenda da Igreja</h1>
        </div>
        <Button
          onClick={() => setOpen(true)}
          data-testid="suggest-event-button"
          variant="outline"
          className="rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground active:scale-95 transition-all duration-150"
        >
          <CalendarPlus size={16} className="mr-2" /> Sugerir evento
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando agenda...</p>
      ) : events.length === 0 ? (
        <p className="text-muted-foreground text-sm" data-testid="agenda-empty">Nenhum evento programado no momento.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((ev, i) => {
            const [y, m, d] = ev.date.split("-");
            return (
              <article
                key={ev.id}
                data-testid={`event-card-${ev.id}`}
                className="feed-card flex gap-5 animate-feed-in"
                style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
              >
                <div className="text-center shrink-0 w-16 border-r border-border pr-5">
                  <p className="font-display text-4xl font-bold text-primary leading-none">{d}</p>
                  <p className="overline-label mt-1">{MESES[parseInt(m, 10) - 1]}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{y}</p>
                </div>
                <div className="min-w-0">
                  <h2 className="font-display text-2xl font-semibold leading-tight">{ev.title}</h2>
                  {ev.description && (
                    <p className="text-muted-foreground text-sm mt-1.5 line-clamp-2">{ev.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-3">
                    <Clock size={13} /> {ev.time}
                  </p>
                  {ev.location && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                      <MapPin size={13} /> {ev.location}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent data-testid="suggest-event-dialog" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Sugerir um evento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSuggest} className="space-y-4 mt-2">
            <div>
              <Label htmlFor="sug-title">Nome do evento</Label>
              <Input
                id="sug-title"
                required
                minLength={3}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                data-testid="suggest-title-input"
                className="mt-1.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="sug-date">Data</Label>
                <Input
                  id="sug-date"
                  type="date"
                  required
                  value={form.proposed_date}
                  onChange={(e) => setForm({ ...form, proposed_date: e.target.value })}
                  data-testid="suggest-date-input"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="sug-time">Horário</Label>
                <Input
                  id="sug-time"
                  type="time"
                  value={form.proposed_time}
                  onChange={(e) => setForm({ ...form, proposed_time: e.target.value })}
                  data-testid="suggest-time-input"
                  className="mt-1.5"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="sug-location">Local</Label>
              <Input
                id="sug-location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                data-testid="suggest-location-input"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="sug-desc">Descrição</Label>
              <Textarea
                id="sug-desc"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                data-testid="suggest-description-input"
                className="mt-1.5"
              />
            </div>
            <Button
              type="submit"
              disabled={sending}
              data-testid="suggest-submit-button"
              className="w-full rounded-full bg-primary hover:bg-primary/90 active:scale-95 transition-transform duration-100"
            >
              {sending ? "Enviando..." : "Enviar sugestão"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
