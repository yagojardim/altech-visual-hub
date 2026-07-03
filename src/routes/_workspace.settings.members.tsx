import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { LoadingState, ErrorState, EmptyState } from "@/components/states";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

export const Route = createFileRoute("/_workspace/settings/members")({
  component: MembersPage,
});

type Profile = {
  id: string;
  name: string | null;
  role: string | null;
  avatar_url: string | null;
};

function MembersPage() {
  const [rows, setRows] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const { data, error: e } = await supabase
        .from("profiles")
        .select("id, name, role, avatar_url")
        .order("name", { ascending: true });
      if (!alive) return;
      if (e) setError(e.message);
      else setRows((data ?? []) as Profile[]);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Membros</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Lista de perfis do workspace. Somente leitura.
        </p>
      </div>

      {loading ? (
        <LoadingState label="Carregando membros…" />
      ) : error ? (
        <ErrorState description={error} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Users className="h-5 w-5" />}
          title="Sem membros"
          description="Nenhum perfil encontrado na tabela profiles."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-panel">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Membro</th>
                <th className="px-4 py-2 text-left font-medium">Papel</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={p.avatar_url ?? undefined} alt={p.name ?? ""} />
                        <AvatarFallback>
                          {(p.name ?? "?").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{p.name ?? "—"}</p>
                        <p className="text-[11px] text-muted-foreground">{p.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {p.role ? <Badge variant="outline">{p.role}</Badge> : <span className="text-muted-foreground">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
