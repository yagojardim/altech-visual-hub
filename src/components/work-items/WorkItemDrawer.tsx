import { useQuery } from "@tanstack/react-query";
import { Calendar, FolderKanban, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatSupabaseError, logSupabaseError } from "@/lib/supabase-errors";
import type { WorkItemRow } from "@/lib/work-items-api";
import { listProjects, type ProjectRow } from "@/lib/projects-api";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { LoadingState, ErrorState } from "@/components/states";

async function getWorkItem(id: string): Promise<WorkItemRow | null> {
  const { data, error } = await supabase
    .from("work_items")
    .select("id, project_id, tenant_id, item_key, titulo, tipo, status, responsavel, descricao, prioridade, ordem, sprint_id, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();
  if (error) { logSupabaseError("work_items:get", error); throw error; }
  return (data as WorkItemRow | null) ?? null;
}

function tipoVariant(tipo: string): "default" | "secondary" | "outline" | "destructive" {
  if (tipo === "Bug") return "destructive";
  if (tipo === "Épico") return "default";
  return "secondary";
}
function prioridadeVariant(p: string): "default" | "secondary" | "outline" | "destructive" {
  if (p === "Crítica") return "destructive";
  if (p === "Alta") return "default";
  if (p === "Baixa") return "outline";
  return "secondary";
}

function fmtDateTime(s?: string | null): string {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return s;
  }
}

export interface WorkItemDrawerProps {
  itemId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WorkItemDrawer({ itemId, open, onOpenChange }: WorkItemDrawerProps) {
  const itemQ = useQuery({
    queryKey: ["work_items", "detail", itemId],
    queryFn: () => getWorkItem(itemId as string),
    enabled: !!itemId && open,
  });
  const projectsQ = useQuery({
    queryKey: ["projects", "all"],
    queryFn: listProjects,
    enabled: open,
  });

  const item = itemQ.data ?? null;
  const project: ProjectRow | undefined = item
    ? (projectsQ.data ?? []).find((p) => p.id === item.project_id)
    : undefined;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        {itemQ.isLoading ? (
          <div className="space-y-4 pt-6">
            <LoadingState variant="skeleton" rows={4} />
          </div>
        ) : itemQ.error ? (
          <div className="pt-6">
            <ErrorState
              title="Não foi possível carregar o work item"
              description={formatSupabaseError(itemQ.error, "Erro ao carregar o item.")}
              onRetry={() => void itemQ.refetch()}
            />
          </div>
        ) : !item ? (
          <div className="pt-6">
            <SheetHeader>
              <SheetTitle>Item não encontrado</SheetTitle>
              <SheetDescription>O work item pode ter sido removido.</SheetDescription>
            </SheetHeader>
          </div>
        ) : (
          <div className="space-y-6">
            <SheetHeader className="space-y-2 text-left">
              <SheetTitle className="text-lg font-semibold leading-tight">
                {item.titulo}
              </SheetTitle>
              <SheetDescription className="text-xs uppercase tracking-wider text-muted-foreground">
                Altech Project · Work Item
              </SheetDescription>
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant={tipoVariant(item.tipo)} className="text-[10px] uppercase">
                  {item.tipo}
                </Badge>
                <Badge variant={prioridadeVariant(item.prioridade)} className="text-[10px] uppercase">
                  {item.prioridade}
                </Badge>
                <Badge variant="outline" className="text-[10px] uppercase">
                  {item.status}
                </Badge>
              </div>
            </SheetHeader>

            <dl className="grid gap-3 text-sm">
              <div className="flex items-start justify-between gap-4">
                <dt className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
                  <User className="h-3.5 w-3.5" /> Responsável
                </dt>
                <dd className="text-right text-foreground">{item.responsavel ?? "—"}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
                  <FolderKanban className="h-3.5 w-3.5" /> Projeto
                </dt>
                <dd className="text-right text-foreground">{project?.nome ?? "—"}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" /> Criado em
                </dt>
                <dd className="text-right text-foreground">{fmtDateTime(item.created_at)}</dd>
              </div>
            </dl>

            <div className="space-y-1.5">
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground">Descrição</h3>
              <p className="whitespace-pre-wrap text-sm text-foreground">
                {item.descricao?.trim() || "Sem descrição."}
              </p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
