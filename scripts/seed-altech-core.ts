import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://bjoudcfydahanbcirqcl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqb3VkY2Z5ZGFoYW5iY2lycWNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwMzE2MjYsImV4cCI6MjA5ODYwNzYyNn0.Ck7PUa-dIlcvr27ViJXFdPSNbf-gRdmW2QcS3neKxr8",
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const PROJECT_ID = "altech-core";

const members = [
  { name: "Ana Silva",    email: "ana.silva@altech.dev",    role: "PO",        avatar_color: "#2F6BFF" },
  { name: "Bruno Costa",  email: "bruno.costa@altech.dev",  role: "Tech Lead", avatar_color: "#06C18A" },
  { name: "Camila Rocha", email: "camila.rocha@altech.dev", role: "Dev",       avatar_color: "#F59E0B" },
  { name: "Diego Alves",  email: "diego.alves@altech.dev",  role: "Dev",       avatar_color: "#A855F7" },
  { name: "Elisa Nunes",  email: "elisa.nunes@altech.dev",  role: "QA",        avatar_color: "#EC4899" },
];

const wiSeed = [
  { title: "Login corporativo",    type: "story", priority: "alta" },
  { title: "Kanban do board",      type: "task",  priority: "media" },
  { title: "Contador de projetos", type: "bug",   priority: "alta" },
  { title: "Política de RLS anon", type: "task",  priority: "critica" },
  { title: "Tela de Pessoas",      type: "story", priority: "media" },
];

async function upsertMembers() {
  const out: { id: string; name: string }[] = [];
  for (const m of members) {
    const { data: e } = await sb.from("team_members").select("id").eq("name", m.name).maybeSingle();
    if (e?.id) {
      await sb.from("team_members").update(m).eq("id", e.id);
      out.push({ id: e.id, name: m.name });
    } else {
      const { data, error } = await sb.from("team_members").insert(m).select("id").single();
      if (error) throw error;
      out.push({ id: data.id, name: m.name });
    }
  }
  return out;
}

async function upsertProjectMembers(ids: string[]) {
  await sb.from("project_members")
    .upsert(ids.map((member_id) => ({ project_id: PROJECT_ID, member_id })),
      { onConflict: "project_id,member_id" });
}

async function ensureBoardCol() {
  const { data: b } = await sb.from("boards").select("id")
    .eq("project_id", PROJECT_ID).eq("name", "Board — Altech Core").maybeSingle();
  if (!b?.id) throw new Error("Board de altech-core não encontrado");
  const { data: c } = await sb.from("board_columns").select("id")
    .eq("board_id", b.id).eq("name", "Backlog").maybeSingle();
  if (!c?.id) throw new Error("Coluna Backlog não encontrada");
  return { boardId: b.id as string, backlogId: c.id as string };
}

async function upsertWorkItems(memberIds: string[], boardId: string, backlogId: string) {
  const ids: string[] = [];
  for (let i = 0; i < wiSeed.length; i++) {
    const s = wiSeed[i];
    const payload = {
      project_id: PROJECT_ID,
      board_id: boardId,
      column_id: backlogId,
      title: s.title,
      type: s.type,
      priority: s.priority,
      status: "Backlog",
      assignee_id: memberIds[i % memberIds.length],
      position: i + 1,
    };
    const { data: e } = await sb.from("work_items").select("id")
      .eq("project_id", PROJECT_ID).eq("title", s.title).maybeSingle();
    if (e?.id) {
      await sb.from("work_items").update(payload).eq("id", e.id);
      ids.push(e.id);
    } else {
      const { data, error } = await sb.from("work_items").insert(payload).select("id").single();
      if (error) throw error;
      ids.push(data.id);
    }
  }
  return ids;
}

async function upsertSprints() {
  const defs = [
    { name: "Sprint 1 — Fundação", status: "concluida", start_date: "2026-02-01", end_date: "2026-02-14", goal: "Fundação técnica e visual." },
    { name: "Sprint 2 — Execução", status: "ativa",     start_date: "2026-02-15", end_date: "2026-02-28", goal: "Execução das primeiras entregas." },
  ];
  const out: string[] = [];
  for (const d of defs) {
    const payload = { project_id: PROJECT_ID, ...d };
    const { data: e } = await sb.from("sprints").select("id")
      .eq("project_id", PROJECT_ID).eq("name", d.name).maybeSingle();
    if (e?.id) {
      await sb.from("sprints").update(payload).eq("id", e.id);
      out.push(e.id);
    } else {
      const { data, error } = await sb.from("sprints").insert(payload).select("id").single();
      if (error) throw error;
      out.push(data.id);
    }
  }
  return out;
}

async function linkSprintItems(sprintIds: string[], wiIds: string[]) {
  const [s1, s2] = sprintIds;
  const rows = [
    ...wiIds.slice(0, 3).map((work_item_id) => ({ sprint_id: s1, work_item_id })),
    ...wiIds.slice(3, 5).map((work_item_id) => ({ sprint_id: s2, work_item_id })),
  ];
  const { error } = await sb.from("sprint_items")
    .upsert(rows, { onConflict: "sprint_id,work_item_id" });
  if (error) throw error;
}

async function main() {
  const mem = await upsertMembers();
  console.log("team_members:", mem.length);
  await upsertProjectMembers(mem.map((m) => m.id));
  console.log("project_members: linked", mem.length);
  const { boardId, backlogId } = await ensureBoardCol();
  const wiIds = await upsertWorkItems(mem.map((m) => m.id), boardId, backlogId);
  console.log("work_items:", wiIds.length);
  const sprintIds = await upsertSprints();
  console.log("sprints:", sprintIds.length);
  await linkSprintItems(sprintIds, wiIds);

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
