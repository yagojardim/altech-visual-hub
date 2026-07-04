import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://bjoudcfydahanbcirqcl.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqb3VkY2Z5ZGFoYW5iY2lycWNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwMzE2MjYsImV4cCI6MjA5ODYwNzYyNn0.Ck7PUa-dIlcvr27ViJXFdPSNbf-gRdmW2QcS3neKxr8";

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const PROJECT_ID = "altech-core";
const TENANT_ID = "00000000-0000-0000-0000-000000000001";

const members = [
  { name: "Ana Silva", email: "ana.silva@altech.dev", role: "PO", avatar_color: "#2F6BFF" },
  { name: "Bruno Costa", email: "bruno.costa@altech.dev", role: "Tech Lead", avatar_color: "#06C18A" },
  { name: "Camila Rocha", email: "camila.rocha@altech.dev", role: "Dev", avatar_color: "#F59E0B" },
  { name: "Diego Alves", email: "diego.alves@altech.dev", role: "Dev", avatar_color: "#A855F7" },
  { name: "Elisa Nunes", email: "elisa.nunes@altech.dev", role: "QA", avatar_color: "#EC4899" },
];

const workItemsSeed = [
  { item_key: "CORE-LOGIN",   titulo: "Login corporativo",       tipo: "História", prioridade: "Alta" },
  { item_key: "CORE-KANBAN",  titulo: "Kanban do board",         tipo: "Tarefa",   prioridade: "Média" },
  { item_key: "CORE-COUNT",   titulo: "Contador de projetos",    tipo: "Bug",      prioridade: "Alta" },
  { item_key: "CORE-RLS",     titulo: "Política de RLS anon",    tipo: "Tarefa",   prioridade: "Crítica" },
  { item_key: "CORE-PESSOAS", titulo: "Tela de Pessoas",         tipo: "História", prioridade: "Média" },
];

async function upsertMembers() {
  const results: { id: string; name: string }[] = [];
  for (const m of members) {
    const { data: existing } = await sb
      .from("team_members").select("id").eq("name", m.name).maybeSingle();
    if (existing?.id) {
      await sb.from("team_members").update(m).eq("id", existing.id);
      results.push({ id: existing.id, name: m.name });
    } else {
      const { data, error } = await sb.from("team_members").insert(m).select("id").single();
      if (error) throw error;
      results.push({ id: data.id, name: m.name });
    }
  }
  return results;
}

async function upsertProjectMembers(memberIds: string[]) {
  for (const mid of memberIds) {
    await sb.from("project_members")
      .upsert({ project_id: PROJECT_ID, member_id: mid }, { onConflict: "project_id,member_id" });
  }
}

async function ensureBoardAndBacklogColumn() {
  const boardName = `Board — Altech Core`;
  const { data: b } = await sb.from("boards").select("id")
    .eq("project_id", PROJECT_ID).eq("name", boardName).maybeSingle();
  if (!b?.id) throw new Error("Board de altech-core não encontrado");
  const { data: col } = await sb.from("board_columns").select("id")
    .eq("board_id", b.id).eq("name", "Backlog").maybeSingle();
  if (!col?.id) throw new Error("Coluna Backlog não encontrada");
  return { boardId: b.id as string, backlogColId: col.id as string };
}

async function upsertWorkItems(memberIds: string[], boardId: string, backlogColId: string) {
  const ids: string[] = [];
  for (let i = 0; i < workItemsSeed.length; i++) {
    const s = workItemsSeed[i];
    const responsavel = members[i % members.length].name;
    const payload = {
      project_id: PROJECT_ID,
      tenant_id: TENANT_ID,
      item_key: s.item_key,
      titulo: s.titulo,
      tipo: s.tipo,
      prioridade: s.prioridade,
      status: "A Fazer",
      responsavel,
      ordem: i + 1,
      board_id: boardId,
      column_id: backlogColId,
      assignee_id: memberIds[i % memberIds.length],
    };
    const { data: existing } = await sb.from("work_items").select("id")
      .eq("item_key", s.item_key).maybeSingle();
    if (existing?.id) {
      // Try full update; fall back without board/column/assignee if columns absent
      const { error } = await sb.from("work_items").update(payload).eq("id", existing.id);
      if (error) {
        const { board_id, column_id, assignee_id, ...rest } = payload;
        await sb.from("work_items").update(rest).eq("id", existing.id);
      }
      ids.push(existing.id);
    } else {
      let { data, error } = await sb.from("work_items").insert(payload).select("id").single();
      if (error) {
        const { board_id, column_id, assignee_id, ...rest } = payload;
        const r2 = await sb.from("work_items").insert(rest).select("id").single();
        if (r2.error) throw r2.error;
        data = r2.data;
      }
      ids.push(data!.id);
    }
  }
  return ids;
}

async function upsertSprints() {
  const sprintDefs = [
    { nome: "Sprint 1 — Fundação", status: "Concluída", data_inicio: "2026-02-01", data_fim: "2026-02-14", meta: "Fundação técnica e visual." },
    { nome: "Sprint 2 — Execução", status: "Ativa",     data_inicio: "2026-02-15", data_fim: "2026-02-28", meta: "Execução das primeiras entregas." },
  ];
  const out: { id: string; nome: string }[] = [];
  for (const s of sprintDefs) {
    const payload = { project_id: PROJECT_ID, tenant_id: TENANT_ID, ...s };
    const { data: existing } = await sb.from("sprints").select("id")
      .eq("project_id", PROJECT_ID).eq("nome", s.nome).maybeSingle();
    if (existing?.id) {
      await sb.from("sprints").update(payload).eq("id", existing.id);
      out.push({ id: existing.id, nome: s.nome });
    } else {
      const { data, error } = await sb.from("sprints").insert(payload).select("id").single();
      if (error) throw error;
      out.push({ id: data.id, nome: s.nome });
    }
  }
  return out;
}

async function linkSprintItems(sprintIds: string[], workItemIds: string[]) {
  const [s1, s2] = sprintIds;
  const s1Items = workItemIds.slice(0, 3);
  const s2Items = workItemIds.slice(3, 5);

  // 1) Update work_items.sprint_id (used by the app)
  for (const id of s1Items) await sb.from("work_items").update({ sprint_id: s1 }).eq("id", id);
  for (const id of s2Items) await sb.from("work_items").update({ sprint_id: s2 }).eq("id", id);

  // 2) Best-effort insert into sprint_items join table
  const rows = [
    ...s1Items.map((wid) => ({ sprint_id: s1, work_item_id: wid })),
    ...s2Items.map((wid) => ({ sprint_id: s2, work_item_id: wid })),
  ];
  const { error } = await sb.from("sprint_items")
    .upsert(rows, { onConflict: "sprint_id,work_item_id" });
  if (error) console.warn("sprint_items upsert warn:", error.message);
}

async function main() {
  const mem = await upsertMembers();
  const memberIds = mem.map((m) => m.id);
  console.log("team_members:", mem.length);

  await upsertProjectMembers(memberIds);
  console.log("project_members: linked", memberIds.length);

  const { boardId, backlogColId } = await ensureBoardAndBacklogColumn();
  const wiIds = await upsertWorkItems(memberIds, boardId, backlogColId);
  console.log("work_items:", wiIds.length);

  const sprints = await upsertSprints();
  console.log("sprints:", sprints.length);

  await linkSprintItems(sprints.map((s) => s.id), wiIds);

  // Totals
  const [tm, pm, wi, sp, si] = await Promise.all([
    sb.from("team_members").select("*", { count: "exact", head: true }),
    sb.from("project_members").select("*", { count: "exact", head: true }).eq("project_id", PROJECT_ID),
    sb.from("work_items").select("*", { count: "exact", head: true }).eq("project_id", PROJECT_ID),
    sb.from("sprints").select("*", { count: "exact", head: true }).eq("project_id", PROJECT_ID),
    sb.from("sprint_items").select("*", { count: "exact", head: true }),
  ]);
  console.log("COUNTS", {
    team_members: tm.count,
    project_members_core: pm.count,
    work_items_core: wi.count,
    sprints_core: sp.count,
    sprint_items_total: si.count,
  });
}

main().catch((e) => { console.error("SEED ERROR:", e); process.exit(1); });
