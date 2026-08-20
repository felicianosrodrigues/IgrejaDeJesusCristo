import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";

const HEADER_IMG =
  "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzl8MHwxfHNlYXJjaHwzfHxiaWJsZSUyMHJlYWRpbmclMjBsaWdodHxlbnwwfHx8fDE3ODYxODU0ODR8MA&ixlib=rb-4.1.0&q=85";

export default function Devotionals() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/posts", { params: { type: "devotional" } })
      .then((response) => setPosts(response.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div data-testid="devotionals-page">
      <div className="relative h-56 md:h-64 overflow-hidden">
        <img src={HEADER_IMG} alt="Bíblia aberta iluminada" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-emerald-900/65" />
        <div className="relative max-w-6xl mx-auto px-6 h-full flex flex-col justify-end pb-8 text-white">
          <p className="overline-label !text-white/70">Palavra e reflexão</p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight mt-1">Devocionais</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-5">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 text-sm text-emerald-900">
          Um espaço para meditar na Palavra, fortalecer a fé e levar uma reflexão para a semana.
        </div>

        {loading ? (
          <p className="text-muted-foreground text-sm">Carregando devocionais...</p>
        ) : posts.length === 0 ? (
          <p className="text-muted-foreground text-sm" data-testid="devotionals-empty">Nenhum devocional publicado ainda.</p>
        ) : (
          posts.map((post, index) => (
            <article
              key={post.id}
              data-testid={`devotional-post-${post.id}`}
              className="feed-card animate-feed-in"
              style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-10 w-10 border border-emerald-200">
                  <AvatarImage src={post.author_photo} alt={post.author_name} />
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm font-bold">
                    {post.author_name?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{post.author_name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
              <h2 className="font-display text-3xl font-semibold leading-tight">{post.title}</h2>
              <p className="text-muted-foreground text-base mt-3 leading-8 whitespace-pre-line">{post.content}</p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}