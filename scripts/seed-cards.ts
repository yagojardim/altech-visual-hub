import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://bjoudcfydahanbcirqcl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqb3VkY2Z5ZGFoYW5iY2lycWNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwMzE2MjYsImV4cCI6MjA5ODYwNzYyNn0.Ck7PUa-dIlcvr27ViJXFdPSNbf-gRdmW2QcS3neKxr8",
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const PROJECTS = ["altech-core", "altech-labs", "altech-launch"];

const TITLES_BY_PROJECT: Record<string, string[]> = {
  "altech-core": [
    "Tela de login",
    "Ajuste no contador de projetos",
    "Refino do backlog",
    "Correção de RLS na tabela work_items",
    "Documentação da API interna",
  ],
  "altech-labs": [
    "Prototipar dashboard experimental",
    "Investigar performance do Kanban",
    "PoC de integração com IA",
    "Bug no filtro de prioridade",
    "Explorar drag & drop no board",
  ],
  "altech-launch": [
    "Landing page de lançamento",
    "Checklist de go-live",
    "Configurar analytics de release",
    "Corrigir metadados de SEO",
    "Plano de comunicação externa",
  ],
};

const TYPES = ["story", "task", "bug", "risk"] as const;
const PRIORITIES = ["baixa", "media", "alta", "critica"] as const;

function pick<T>(arr: readonly T[], seed: number): T {
  return arr[seed % arr.length];
}

async function getMembers(projectId: string): Promise<string[]> {
  const { data: pm } = await sb
    .from("project_members")
    .select("member_id")
    .eq("project_id", projectId);
  const ids = (pm ?? []).map((r: any) => r.member_id).filter(Boolean);
  if (ids.length) return ids;
  const { data: tm } = await sb.from("team_members").select("id").limit(10);
  return (tm ?? []).map((r: any) => r.id);
}

async function getBoardAndBacklog(projectId: string) {
  const { data: boards, error: be } = await sb
    .from("boards")
    .select("id,name")
    .eq("project_id", projectId);
  if (be) throw be;
  if (!boards?.length) throw new Error(`Sem board em ${projectId}`);
  const board = boards[0];
  const { data: cols, error: ce } = await sb
    .from("board_columns")
    .select("id,name,position")
    .eq("board_id", board.id);
  if (ce) throw ce;
  const backlog =
    cols?.find((c: any) => /backlog/i.test(c.name)) ??
    cols?.sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))[0];
  if (!backlog) throw new Error(`Sem coluna em ${projectId}`);
  return { boardId: board.id as string, columnId: backlog.id as string };
}

async function seedProject(projectId: string) {
  const { boardId, columnId } = await getBoardAndBacklog(projectId);
  const memberIds = await getMembers(projectId);
  const titles = TITLES_BY_PROJECT[projectId];
  let inserted = 0;
  let updated = 0;
  for (let i = 0; i < titles.length; i++) {
    const title = titles[i];
    const payload = {
      project_id: projectId,
      board_id: boardId,
      column_id: columnId,
      title,
      type: pick(TYPES, i + projectId.length),
      priority: pick(PRIORITIES, i * 3 + projectId.length),
      status: "Backlog",
      assignee_id: memberIds.length ? memberIds[i % memberIds.length] : null,
      position: i + 1,
    };
    const { data: existing } = await sb
      .from("work_items")
      .select("id")
      .eq("project_id", projectId)
      .eq("title", title)
      .maybeSingle();
    if (existing?.id) {
      const { error } = await sb.from("work_items").update(payload).eq("id", existing.id);
      if (error) throw error;
      updated++;
    } else {
      const { error } = await sb.from("work_items").insert(payload);
      if (error) throw error;
      inserted++;
    }
  }
  console.log(`[${projectId}] board=${boardId} col=${columnId} inserted=${inserted} updated=${updated}`);
}

async function main() {
  for (const p of PROJECTS) {
    await seedProject(p);
  }
  const { count } = await sb
    .from("work_items")
    .select("*", { count: "exact", head: true });
  console.log("total work_items:", count);
}

main().catch((e) => {
  console.error("SEED_FAIL", e?.message ?? e);
  process.exit(1);
});
