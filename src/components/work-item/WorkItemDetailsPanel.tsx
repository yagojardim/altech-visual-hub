import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { LoadingState, ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkItemAttachmentsLive } from "./WorkItemAttachmentsLive";

type WorkItemRow = {
  id: string;
  item_key: string | null;
  title: string;
  description: string | null;
  type: string | null;
  status: string | null;
  priority: string | null;
  assignee: string | null;
  estimate: number | null;
  sprint_id: string | null;
  start_date: string | null;
  due_date: string | null;
  acceptance_criteria: unknown;
  board_id: string | null;
  column_id: string | null;
};

type CommentRow = {
  id: string;
  work_item_id: string;
  author_id: string | null;
  author_name?: string | null;
  body: string;
  created_at: string;
};

type Criterion = { id: string; text: string; done: boolean };

const STATUS_OPTIONS = ["Backlog", "A Fazer", "Em Andamento", "Em Validação", "Concluído"];
const TYPE_OPTIONS = ["Épico", "História", "Tarefa", "Bug"];

function parseCriteria(raw: unknown): Criterion[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((c, i) => ({
      id: String((c as any)?.id ?? i),
      text: String((c as any)?.text ?? c ?? ""),
      done: Boolean((c as any)?.done),
    }));
  }
  return [];
}

export function WorkItemDetailsPanel({ workItemId }: { workItemId: string }) {
  const { user } = useAuth();
  const [item, setItem] = useState<WorkItemRow | null>(null);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draftComment, setDraftComment] = useState("");
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ data: it, error: iErr }, { data: cs, error: cErr }] = await Promise.all([
        supabase.from("work_items").select("*").eq("id", workItemId).maybeSingle(),
        supabase
          .from("comments")
          .select("*")
          .eq("work_item_id", workItemId)
          .order("created_at", { ascending: true }),
      ]);
      if (iErr) throw iErr;
      if (cErr) throw cErr;
      if (!it) throw new Error("Work item não encontrado");
      const row = it as WorkItemRow;
      setItem(row);
      setCriteria(parseCriteria(row.acceptance_criteria));
      setComments((cs ?? []) as CommentRow[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, [workItemId]);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = async (patch: Partial<WorkItemRow>) => {
    if (!item) return;
    const prev = item;
    const next = { ...item, ...patch };
    setItem(next);
    const { error: uErr } = await supabase.from("work_items").update(patch).eq("id", item.id);
    if (uErr) {
      setItem(prev);
      setError(uErr.message);
    }
  };

  const toggleCriterion = async (id: string, done: boolean) => {
    const next = criteria.map((c) => (c.id === id ? { ...c, done } : c));
    setCriteria(next);
    await patch({ acceptance_criteria: next as unknown as WorkItemRow["acceptance_criteria"] });
  };

  const postComment = async () => {
    if (!draftComment.trim() || !item) return;
    setPosting(true);
    const body = draftComment.trim();
    setDraftComment("");
    const { data, error: pErr } = await supabase
      .from("comments")
      .insert({
        work_item_id: item.id,
        author_id: user?.id ?? "dev-user",
        author_name: user?.name ?? "Dev Altech",
        body,
      })
      .select()
      .single();
    setPosting(false);
    if (pErr) {
      setError(pErr.message);
      setDraftComment(body);
      return;
    }
    setComments((cur) => [...cur, data as CommentRow]);
  };

  if (loading) return <LoadingState label="Carregando work item…" />;
  if (error) return <ErrorState description={error} onRetry={() => void load()} />;
  if (!item) return <ErrorState description="Work item não encontrado" />;

  return (
    <div className="grid gap-6 pt-4 lg:grid-cols-[1fr_260px]">
      <div className="space-y-6">
        <header className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="rounded bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground">
              {item.item_key ?? item.id.slice(0, 6)}
            </span>
            {item.type && <Badge variant="outline">{item.type}</Badge>}
          </div>
          <Input
            className="text-lg font-semibold"
            value={item.title}
            onChange={(e) => setItem({ ...item, title: e.target.value })}
            onBlur={(e) => {
              if (e.target.value !== item.title || true)
                void patch({ title: e.target.value });
            }}
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Status</span>
            <Select value={item.status ?? ""} onValueChange={(v) => void patch({ status: v })}>
              <SelectTrigger className="h-8 w-48">
                <SelectValue placeholder="Selecionar" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </header>

        <section className="space-y-2">
          <h3 className="text-sm font-medium">Descrição</h3>
          <Textarea
            rows={5}
            value={item.description ?? ""}
            onChange={(e) => setItem({ ...item, description: e.target.value })}
            onBlur={(e) => void patch({ description: e.target.value })}
            placeholder="Descreva o work item…"
          />
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-medium">Critérios de aceite</h3>
          {criteria.length === 0 && (
            <p className="text-xs text-muted-foreground">Nenhum critério cadastrado.</p>
          )}
          <ul className="space-y-1.5">
            {criteria.map((c) => (
              <li key={c.id} className="flex items-start gap-2 text-sm">
                <Checkbox
                  checked={c.done}
                  onCheckedChange={(v) => void toggleCriterion(c.id, Boolean(v))}
                  className="mt-0.5"
                />
                <span className={cn(c.done && "line-through text-muted-foreground")}>{c.text}</span>
              </li>
            ))}
          </ul>
        </section>

        <WorkItemAttachmentsLive workItemId={item.id} />

        <section className="space-y-3">
          <h3 className="text-sm font-medium">Comentários</h3>
          <ul className="space-y-3">
            {comments.map((c) => (
              <li key={c.id} className="rounded-lg border border-border bg-panel p-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-foreground">
                    {c.author_name ?? c.author_id ?? "—"}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(c.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-foreground">{c.body}</p>
              </li>
            ))}
            {comments.length === 0 && (
              <p className="text-xs text-muted-foreground">Sem comentários ainda.</p>
            )}
          </ul>
          <div className="flex gap-2">
            <Textarea
              rows={2}
              placeholder="Escreva um comentário…"
              value={draftComment}
              onChange={(e) => setDraftComment(e.target.value)}
            />
            <Button onClick={() => void postComment()} disabled={posting || !draftComment.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </section>
      </div>

      <aside className="space-y-3 rounded-xl border border-border bg-panel/40 p-4 text-sm">
        <h3 className="text-sm font-medium">Metadados</h3>
        <MetaRow label="Assignee" value={item.assignee ?? "—"} />
        <MetaRow label="Prioridade" value={item.priority ?? "—"} />
        <MetaRow label="Estimate" value={item.estimate != null ? String(item.estimate) : "—"} />
        <MetaRow label="Sprint" value={item.sprint_id ?? "—"} />
        <MetaRow label="Início" value={item.start_date ?? "—"} />
        <MetaRow label="Prazo" value={item.due_date ?? "—"} />
      </aside>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border/50 py-1 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs text-foreground">{value}</span>
    </div>
  );
}
