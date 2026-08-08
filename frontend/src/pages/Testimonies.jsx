import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";

const HEADER_IMG =
  "https://images.unsplash.com/photo-1503424160383-57de83bd6fb2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzl8MHwxfHNlYXJjaHwxfHxwZWFjZWZ1bCUyMG5hdHVyZSUyMGxhbmRzY2FwZSUyMGRhd258ZW58MHx8fHwxNzg2MTg1NDg0fDA&ixlib=rb-4.1.0&q=85";

export default function Testimonies() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api.get("/posts", { params: { type: "testimony" } })
      .then((r) => setPosts(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post("/posts", { type: "testimony", title, content });
      toast.success("Testemunho enviado para aprovação.");
      setTitle("");
      setContent("");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div data-testid="testimonies-page">
      <div className="relative h-56 md:h-64 overflow-hidden">
        <img src={HEADER_IMG} alt="Amanhecer sobre a natureza" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-primary/60" />
        <div className="relative max-w-6xl mx-auto px-6 h-full flex flex-col justify-end pb-8 text-white">
          <p className="overline-label !text-white/70">Gratidão</p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight mt-1">Mural de Testemunhos</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 grid md:grid-cols-12 gap-8">
        <div className="md:col-span-8 space-y-5">
          {loading ? (
            <p className="text-muted-foreground text-sm">Carregando testemunhos...</p>
          ) : posts.length === 0 ? (
            <p className="text-muted-foreground text-sm" data-testid="testimony-empty">Nenhum testemunho aprovado ainda.</p>
          ) : (
            posts.map((p, i) => (
              <article
                key={p.id}
                data-testid={`testimony-post-${p.id}`}
                className="feed-card animate-feed-in"
                style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-9 h-9 rounded-full bg-accent/10 text-accent flex items-center justify-center">
                    <Sparkles size={16} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{p.author_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <h2 className="font-display text-2xl font-semibold">{p.title}</h2>
                <p className="text-muted-foreground text-sm mt-2 leading-relaxed">{p.content}</p>
              </article>
            ))
          )}
        </div>

        <aside className="md:col-span-4">
          <form onSubmit={handleSubmit} className="feed-card md:sticky md:top-24" data-testid="testimony-form">
            <p className="overline-label">Novo testemunho</p>
            <h2 className="font-display text-2xl font-semibold mt-1 mb-5">Conte o que Deus fez</h2>
            <Input
              required
              minLength={3}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título do testemunho"
              data-testid="testimony-title-input"
            />
            <Textarea
              required
              minLength={5}
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Compartilhe seu testemunho..."
              data-testid="testimony-content-input"
              className="mt-3"
            />
            <p className="text-xs text-muted-foreground mt-3">
              Seu testemunho será revisado pela liderança antes de aparecer no mural.
            </p>
            <Button
              type="submit"
              disabled={sending}
              data-testid="testimony-submit-button"
              className="w-full mt-4 rounded-full bg-primary hover:bg-primary/90 active:scale-95 transition-transform duration-100"
            >
              {sending ? "Enviando..." : "Enviar testemunho"}
            </Button>
          </form>
        </aside>
      </div>
    </div>
  );
}
