import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Pencil, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { useCan } from "@/lib/auth";
import { UnauthorizedState, LoadingState, EmptyState, ErrorState } from "@/components/states";
import { WidgetCard } from "@/components/dashboard/WidgetCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createTeamMember,
  deleteTeamMember,
  listTeamMembers,
  pickAvatarColor,
  TEAM_MEMBER_ROLES,
  updateTeamMember,
  type TeamMember,
  type TeamMemberRole,
} from "@/lib/team-members-api";
import { formatSupabaseError } from "@/lib/supabase-errors";

export const Route = createFileRoute("/_workspace/pessoas")({
  head: () => ({ meta: [{ title: "Pessoas · Altech Project" }] }),
  component: PessoasPage,
});

const QK_TEAM = ["team_members"] as const;

function initialOf(name: string): string {
  const t = name.trim();
  if (!t) return "?";
  const parts = t.split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase() || "?";
}

function Avatar({ member, size = 40 }: { member: Pick<TeamMember, "name" | "avatar_color">; size?: number }) {
  const bg = member.avatar_color ?? pickAvatarColor(member.name);
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
      style={{ background: bg, width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden="true"
    >
      {initialOf(member.name)}
    </div>
  );
}

function PessoasPage() {
  const canView = useCan("board.view");
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [toDelete, setToDelete] = useState<TeamMember | null>(null);

  const membersQ = useQuery({ queryKey: QK_TEAM, queryFn: listTeamMembers });

  const filtered = useMemo(() => {
    const list = membersQ.data ?? [];
    const term = search.trim().toLowerCase();
    return list.filter((m) => {
      if (roleFilter !== "all" && m.role !== roleFilter) return false;
      if (term && !m.name.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [membersQ.data, search, roleFilter]);

  const removeMut = useMutation({
    mutationFn: (id: string) => deleteTeamMember(id),
    onSuccess: () => {
      toast.success("Pessoa removida.");
      void qc.invalidateQueries({ queryKey: QK_TEAM });
    },
    onError: (e) => toast.error(formatSupabaseError(e, "Erro ao remover pessoa.")),
  });

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (m: TeamMember) => {
    setEditing(m);
    setDialogOpen(true);
  };

  if (!canView) return <UnauthorizedState />;

  const loading = membersQ.isLoading;
  const error = membersQ.error ? formatSupabaseError(membersQ.error, "Erro ao carregar pessoas.") : null;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground"
        >
          <span>Workspace</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Pessoas</span>
        </nav>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Pessoas</h1>
              <Badge variant="outline" className="font-mono text-[11px]">
                {membersQ.isLoading ? "…" : `${(membersQ.data ?? []).length} pessoas`}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Time do workspace Altech Project.
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar pessoa
          </Button>
        </div>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Buscar por nome…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="sm:w-56">
            <SelectValue placeholder="Filtrar por papel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os papéis</SelectItem>
            {TEAM_MEMBER_ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <LoadingState variant="skeleton" />
      ) : error ? (
        <ErrorState
          title="Não foi possível carregar as pessoas"
          description={error}
          onRetry={() => void membersQ.refetch()}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="h-5 w-5" />}
          title="Nenhuma pessoa cadastrada"
          description={
            (membersQ.data ?? []).length === 0
              ? "Adicione a primeira pessoa ao workspace."
              : "Nenhuma pessoa corresponde aos filtros."
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((m) => (
            <WidgetCard key={m.id} className="flex h-full flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar member={m} />
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-foreground">{m.name}</h3>
                    <p className="truncate text-xs text-muted-foreground">{m.email ?? "—"}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Editar pessoa"
                    onClick={() => openEdit(m)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remover pessoa"
                    onClick={() => setToDelete(m)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                {m.role ? (
                  <Badge variant="secondary">{m.role}</Badge>
                ) : (
                  <Badge variant="outline">Sem papel</Badge>
                )}
              </div>
            </WidgetCard>
          ))}
        </div>
      )}

      <PessoaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSaved={() => {
          setDialogOpen(false);
          void qc.invalidateQueries({ queryKey: QK_TEAM });
        }}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover pessoa?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete ? `"${toDelete.name}" será removida do workspace.` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!toDelete) return;
                removeMut.mutate(toDelete.id, {
                  onSettled: () => setToDelete(null),
                });
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PessoaDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: TeamMember | null;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamMemberRole | "">("");

  // Reset form when dialog opens
  useMemoResetForm(open, editing, (m) => {
    setName(m?.name ?? "");
    setEmail(m?.email ?? "");
    setRole((m?.role ?? "") as TeamMemberRole | "");
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        name,
        email: email || null,
        role: role || null,
      } as const;
      if (editing) return updateTeamMember(editing.id, payload);
      return createTeamMember(payload);
    },
    onSuccess: () => {
      toast.success(editing ? "Pessoa atualizada." : "Pessoa adicionada.");
      onSaved();
    },
    onError: (e) => toast.error(formatSupabaseError(e, "Erro ao salvar pessoa.")),
  });

  const canSave = name.trim().length > 0 && !saveMut.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Editar pessoa" : "Adicionar pessoa"}</DialogTitle>
          <DialogDescription>
            Cadastre membros do time do workspace Altech Project.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSave) saveMut.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="pessoa-nome">Nome</Label>
            <Input
              id="pessoa-nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome completo"
              autoFocus
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pessoa-email">E-mail</Label>
            <Input
              id="pessoa-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="pessoa@exemplo.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pessoa-papel">Papel</Label>
            <Select value={role || undefined} onValueChange={(v) => setRole(v as TeamMemberRole)}>
              <SelectTrigger id="pessoa-papel">
                <SelectValue placeholder="Selecione um papel" />
              </SelectTrigger>
              <SelectContent>
                {TEAM_MEMBER_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!canSave}>
              {saveMut.isPending ? "Salvando…" : editing ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Ensures dialog fields reset when opening (create or edit) without leaking prior values.
function useMemoResetForm(
  open: boolean,
  editing: TeamMember | null,
  reset: (m: TeamMember | null) => void,
) {
  useMemo(() => {
    if (open) reset(editing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing?.id]);
}
