import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://bjoudcfydahanbcirqcl.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqb3VkY2Z5ZGFoYW5iY2lycWNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwMzE2MjYsImV4cCI6MjA5ODYwNzYyNn0.Ck7PUa-dIlcvr27ViJXFdPSNbf-gRdmW2QcS3neKxr8";

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const PROJECTS = ["altech-core", "altech-labs", "altech-launch"];

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

const today = new Date();
const d = (offset: number) => {
  const x = new Date(today);
  x.setDate(x.getDate() + offset);
  return iso(x);
};

const SPRINT_TEMPLATES = [
  { name: "Sprint 1 — Fundação", status: "concluida" as const, goal: "Base do projeto e primeiras entregas.", start: d(-28), end: d(-15), targetStatus: "Concluído" },
  { name: "Sprint 2 — Execução", status: "ativa" as const,     goal: "Executar histórias prioritárias.",       start: d(-14), end: d(0),   targetStatus: "Em progresso" },
  { name: "Sprint 3 — Refino",   status: "planejada" as const,  goal: "Refino e preparação para release.",     start: d(1),   end: d(14),  targetStatus: "Backlog" },
];

async function audit(event: string, entityId: string, after: unknown) {
  const { error } = await sb.from("audit_log").insert({
    event,
    actor_name: "seed-sprints",
    entity_type: event.startsWith("sprint.scope") ? "sprint_item" : "sprint",
    entity_id: entityId,
    after,
  });
  if (error) console.warn("[audit]", event, error.message);
}

async function resolveProject(slug: string): Promise<string | null> {
  // projects.id is text; try id=slug first (as used elsewhere), else lookup by slug column
  const byId = await sb.from("projects").select("id").eq("id", slug).maybeSingle();
  if (byId.data?.id) return byId.data.id as string;
  const bySlug = await sb.from("projects").select("id").eq("slug", slug).maybeSingle();
  return (bySlug.data?.id as string) ?? null;
}

async function upsertSprint(projectId: string, tpl: (typeof SPRINT_TEMPLATES)[number]) {
  const existing = await sb
    .from("sprints")
    .select("id, name, status, goal, start_date, end_date")
    .eq("project_id", projectId)
    .eq("name", tpl.name)
    .maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) {
    const upd = await sb
      .from("sprints")
      .update({ status: tpl.status, goal: tpl.goal, start_date: tpl.start, end_date: tpl.end })
      .eq("id", existing.data.id)
      .select("id")
      .single();
    if (upd.error) throw upd.error;
    return { id: upd.data.id as string, created: false };
  }
  const ins = await sb
    .from("sprints")
    .insert({
      project_id: projectId,
      name: tpl.name,
      goal: tpl.goal,
      status: tpl.status,
      start_date: tpl.start,
      end_date: tpl.end,
    })
    .select("id")
    .single();
  if (ins.error) throw ins.error;
  return { id: ins.data.id as string, created: true };
}

async function run() {
  const results: Array<{ project: string; sprints: number; linked: number }> = [];

  for (const slug of PROJECTS) {
    const projectId = await resolveProject(slug);
    if (!projectId) {
      console.warn(`Projeto ${slug} não encontrado. Pulando.`);
      continue;
    }
    console.log(`\n== ${slug} (${projectId}) ==`);

    // 1) Sprints
    const sprints: Array<{ id: string; tpl: (typeof SPRINT_TEMPLATES)[number] }> = [];
    for (const tpl of SPRINT_TEMPLATES) {
      const { id, created } = await upsertSprint(projectId, tpl);
      sprints.push({ id, tpl });
      if (created) {
        await audit("sprint.created", id, { project_id: projectId, name: tpl.name, status: tpl.status });
      }
      console.log(`  sprint ${created ? "criada" : "atualizada"}: ${tpl.name} (${id.slice(0, 8)})`);
    }

    // 2) Histórias sem sprint
    const stories = await sb
      .from("work_items")
      .select("id, title, status")
      .eq("project_id", projectId)
      .eq("type", "story");
    if (stories.error) throw stories.error;

    const already = await sb
      .from("sprint_items")
      .select("work_item_id, sprint_id")
      .in("sprint_id", sprints.map((s) => s.id));
    if (already.error) throw already.error;
    const linkedIds = new Set((already.data ?? []).map((r) => r.work_item_id as string));

    const free = (stories.data ?? []).filter((s) => !linkedIds.has(s.id as string));
    console.log(`  histórias total=${stories.data?.length ?? 0}  disponíveis=${free.length}`);

    // 3) Round-robin
    let linked = 0;
    for (let i = 0; i < free.length; i++) {
      const s = sprints[i % sprints.length];
      const story = free[i];
      const ins = await sb
        .from("sprint_items")
        .insert({ sprint_id: s.id, work_item_id: story.id })
        .select("sprint_id, work_item_id")
        .maybeSingle();
      if (ins.error) {
        console.warn("  sprint_items insert falhou:", ins.error.message);
        continue;
      }
      const upd = await sb
        .from("work_items")
        .update({ status: s.tpl.targetStatus })
        .eq("id", story.id);
      if (upd.error) console.warn("  status update falhou:", upd.error.message);

      await audit("sprint.scope.changed", s.id, {
        sprint: s.tpl.name,
        work_item_id: story.id,
        title: story.title,
        new_status: s.tpl.targetStatus,
      });
      linked++;
    }
    console.log(`  vinculadas=${linked}`);
    results.push({ project: slug, sprints: sprints.length, linked });
  }

  console.log("\nResumo:", JSON.stringify(results, null, 2));

  // Contagens finais
  for (const slug of PROJECTS) {
    const pid = await resolveProject(slug);
    if (!pid) continue;
    const s = await sb.from("sprints").select("id", { count: "exact", head: true }).eq("project_id", pid);
    const st = await sb.from("work_items").select("id", { count: "exact", head: true }).eq("project_id", pid).eq("type", "story");
    console.log(`${slug}: sprints=${s.count ?? 0}  histórias=${st.count ?? 0}`);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
