import { useCallback, useEffect, useState } from "react";
import { MessageSquare, Send, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { auditLog } from "@/lib/audit-log";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LoadingState } from "@/components/states";

type Comment = {
  id: string;
  work_item_id: string;
  author: string | null;
  body: string;
  created_at: string;
};

export function WorkItemCommentsLive({ workItemId }: { workItemId: string }) {
  const { user } = useAuth();
  const [items, setItems] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: e } = await supabase
      .from("comments")
      .select("*")
      .eq("work_item_id", workItemId)
      .order("created_at", { ascending: false });
    if (e) setError(e.message);
    else setItems((data ?? []) as Comment[]);
    setLoading(false);
  }, [workItemId]);

  useEffect(() => {
    void load();
  }, [load]);

  const send = async () => {
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    setError(null);
    const { data, error: e } = await supabase
      .from("comments")
      .insert({
        work_item_id: workItemId,
        author: user?.name ?? user?.id ?? "Dev Altech",
        author_id: user?.id ?? null,
        body,
      })
      .select()
      .single();
    setSending(false);
    if (e) {
      setError(e.message);
      return;
    }
    setItems((cur) => [data as Comment, ...cur]);
    setDraft("");
    void auditLog({
      event: "comment.created",
      actor_id: user?.id ?? null,
      actor_name: user?.name ?? null,
      entity_type: "work_item",
      entity_id: workItemId,
      after: { id: (data as Comment).id, body },
    });
  };

  const remove = async (c: Comment) => {
    const prev = items;
    setItems((cur) => cur.filter((i) => i.id !== c.id));
    const { error: e } = await supabase.from("comments").delete().eq("id", c.id);
    if (e) {
      setItems(prev);
      setError(e.message);
    }
  };

  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-medium">
        <MessageSquare className="h-4 w-4" /> Comentários
      </h3>

      <div className="space-y-2 rounded-xl border border-border bg-panel p-3">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Escreva um comentário…"
          className="min-h-[72px] resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={() => void send()} disabled={sending || !draft.trim()}>
            <Send className="mr-1.5 h-3.5 w-3.5" />
            {sending ? "Enviando…" : "Comentar"}
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {loading ? (
        <LoadingState label="Carregando comentários…" />
      ) : items.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhum comentário ainda.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((c) => (
            <li
              key={c.id}
              className="rounded-lg border border-border bg-panel p-3"
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-foreground">
                  {c.author ?? "—"}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(c.created_at).toLocaleString()}
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => void remove(c)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <p className="whitespace-pre-wrap text-sm text-foreground">{c.body}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
