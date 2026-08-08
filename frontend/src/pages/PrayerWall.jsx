import { useEffect, useState } from "react";
import { HeartHandshake } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";

const HEADER_IMG =
  "https://images.unsplash.com/photo-1649514829172-07d9bdcb4b72?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NzB8MHwxfHNlYXJjaHw0fHxwcmF5aW5nJTIwaGFuZHMlMjBzaWxob3VldHRlfGVufDB8fHx8MTc4NjE4NTQ4NHww&ixlib=rb-4.1.0&q=85";

export default function PrayerWall() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  const load = () =>
    api.get("/posts", { params: { type: "prayer" } })
      .then((r) => setPosts(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post("/posts", { type: "prayer", title, content });
      toast.success("Pedido de oração enviado para aprovação.");
      setTitle("");
      setContent("");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSending(false);
    }
  };

  const handlePray = async (post) => {
    const optimistic = post.prayed_by.includes(user.id)
      ? { prayed_by: post.prayed_by.filter((id) => id !== user.id), count: post.pray_count - 1 }
      : { prayed_by: [...post.prayed_by, user.id], count: post.pray_count + 1 };
    setPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, prayed_by: optimistic.prayed_by, pray_count: optimistic.count } : p))
    );
    try {
      const { data } = await api.post(`/posts/${post.id}/pray`);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? {
                ...p,
                pray_count: data.count,
                prayed_by: data.praying
                  ? [...p.prayed_by.filter((id) => id !== user.id), user.id]
                  : p.prayed_by.filter((id) => id !== user.id),
              }
            : p
        )
      );
    } catch (err) {
      setPosts((prev) => prev.map((p) => (p.id === post.id ? post : p)));
      toast.error(formatApiError(err));
    }
  };

  return (
    <div data-testid="prayer-wall-page">
      <div className="relative h-56 md:h-64 overflow-hidden">
        <img src={HEADER_IMG} alt="Mãos unidas em oração" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-primary/70" />
        <div className="relative max-w-6xl mx-auto px-6 h-full flex flex-col justify-end pb-8 text-white">
          <p className="overline-label !text-white/70">Intercessão</p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight mt-1">Mural de Oração</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 grid md:grid-cols-12 gap-8">
        <div className="md:col-span-8 space-y-5">
          {loading ? (
            <p className="text-muted-foreground text-sm">Carregando pedidos...</p>
          ) : posts.length === 0 ? (
            <p className="text-muted-foreground text-sm" data-testid="prayer-empty">Nenhum pedido aprovado ainda. Seja o primeiro a compartilhar.</p>
          ) : (
            posts.map((p, i) => {
              const praying = p.prayed_by.includes(user.id);
              return (
                <article
                  key={p.id}
                  data-testid={`prayer-post-${p.id}`}
                  className="feed-card animate-feed-in"
                  style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                      {p.author_name?.[0]?.toUpperCase()}
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
                  <div className="mt-4 pt-4 border-t border-border">
                    <button
                      onClick={() => handlePray(p)}
                      data-testid={`pray-button-${p.id}`}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-150 active:scale-95 ${
                        praying
                          ? "bg-accent text-accent-foreground"
                          : "bg-accent/10 text-accent hover:bg-accent/20"
                      }`}
                    >
                      <HeartHandshake size={16} />
                      {praying ? "Você está orando" : "Orando por você"}
                      <span data-testid={`pray-count-${p.id}`} className="font-bold">{p.pray_count}</span>
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>

        <aside className="md:col-span-4">
          <form onSubmit={handleSubmit} className="feed-card md:sticky md:top-24" data-testid="prayer-form">
            <p className="overline-label">Novo pedido</p>
            <h2 className="font-display text-2xl font-semibold mt-1 mb-5">Compartilhe seu pedido</h2>
            <Input
              required
              minLength={3}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título do pedido"
              data-testid="prayer-title-input"
            />
            <Textarea
              required
              minLength={5}
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Descreva seu pedido de oração..."
              data-testid="prayer-content-input"
              className="mt-3"
            />
            <p className="text-xs text-muted-foreground mt-3">
              Seu pedido será revisado pela liderança antes de aparecer no mural.
            </p>
            <Button
              type="submit"
              disabled={sending}
              data-testid="prayer-submit-button"
              className="w-full mt-4 rounded-full bg-primary hover:bg-primary/90 active:scale-95 transition-transform duration-100"
            >
              {sending ? "Enviando..." : "Enviar pedido"}
            </Button>
          </form>
        </aside>
      </div>
    </div>
  );
}
