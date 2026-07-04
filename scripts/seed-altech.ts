import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://bjoudcfydahanbcirqcl.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqb3VkY2Z5ZGFoYW5iY2lycWNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwMzE2MjYsImV4cCI6MjA5ODYwNzYyNn0.Ck7PUa-dIlcvr27ViJXFdPSNbf-gRdmW2QcS3neKxr8";

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const projects = [
  {
    id: "altech-core",
    slug: "altech-core",
    name: "Altech Core",
    status: "em_progresso",
    owner: "Ana Silva",
    description: "Núcleo da plataforma Altech Project.",
    start_date: "2026-01-15",
    end_date: "2026-09-30",
  },
  {
    id: "altech-labs",
    slug: "altech-labs",
    name: "Altech Labs",
    status: "planejamento",
    owner: "Bruno Costa",
    description: "Laboratório de experimentos e novas capacidades.",
    start_date: "2026-04-01",
    end_date: "2026-12-31",
  },
  {
    id: "altech-launch",
    slug: "altech-launch",
    name: "Altech Launch",
    status: "em_progresso",
    owner: "Camila Rocha",
    description: "Preparação de lançamento e go-to-market.",
    start_date: "2026-03-10",
    end_date: "2026-08-15",
  },
] as const;

const COLUMNS = [
  { name: "Backlog", position: 0 },
  { name: "Em progresso", position: 1 },
  { name: "Revisão", position: 2 },
  { name: "Concluído", position: 3 },
] as const;

async function main() {
  // projects (upsert by id)
  const { error: pErr } = await sb.from("projects").upsert(projects, { onConflict: "id" });
  if (pErr) throw pErr;
  console.log("projects upserted:", projects.length);

  for (const p of projects) {
    const boardName = `Board — ${p.name}`;
    // find existing board for this project with same name
    const { data: existing, error: bSelErr } = await sb
      .from("boards")
      .select("id")
      .eq("project_id", p.id)
      .eq("name", boardName)
      .maybeSingle();
    if (bSelErr) throw bSelErr;

    let boardId: string;
    if (existing?.id) {
      boardId = existing.id;
    } else {
      const { data: inserted, error: bInsErr } = await sb
        .from("boards")
        .insert({ project_id: p.id, name: boardName, description: `Board principal de ${p.name}.` })
        .select("id")
        .single();
      if (bInsErr) throw bInsErr;
      boardId = inserted.id;
    }
    console.log(`board ${p.id}:`, boardId);

    // columns idempotently
    const { data: existingCols, error: cSelErr } = await sb
      .from("board_columns")
      .select("name")
      .eq("board_id", boardId);
    if (cSelErr) throw cSelErr;
    const existingNames = new Set((existingCols ?? []).map((c) => c.name));
    const toInsert = COLUMNS.filter((c) => !existingNames.has(c.name)).map((c) => ({
      board_id: boardId,
      name: c.name,
      position: c.position,
    }));
    if (toInsert.length > 0) {
      const { error: cInsErr } = await sb.from("board_columns").insert(toInsert);
      if (cInsErr) throw cInsErr;
    }
    console.log(`  columns inserted: ${toInsert.length} / existing: ${existingNames.size}`);
  }

  // Verify
  const [{ count: pc }, { count: bc }] = await Promise.all([
    sb.from("projects").select("*", { count: "exact", head: true }),
    sb.from("boards").select("*", { count: "exact", head: true }),
  ]);
  console.log("TOTALS -> projects:", pc, "boards:", bc);
}

main().catch((e) => {
  console.error("SEED ERROR:", e);
  process.exit(1);
});
