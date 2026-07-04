import { supabase } from "./supabase";
import { logSupabaseError } from "./supabase-errors";

export type TeamMemberRole = "PMO" | "PM" | "PO" | "Tech Lead" | "Dev" | "QA" | "Stakeholder";

export const TEAM_MEMBER_ROLES: TeamMemberRole[] = [
  "PMO",
  "PM",
  "PO",
  "Tech Lead",
  "Dev",
  "QA",
  "Stakeholder",
];

export interface TeamMember {
  id: string;
  name: string;
  email: string | null;
  role: TeamMemberRole | null;
  avatar_color: string | null;
  created_at?: string;
}

export interface TeamMemberInput {
  name: string;
  email?: string | null;
  role?: TeamMemberRole | null;
  avatar_color?: string | null;
}

const AVATAR_COLORS = [
  "#2F6BFF",
  "#06C18A",
  "#F59E0B",
  "#EF4444",
  "#A855F7",
  "#EC4899",
  "#0EA5E9",
  "#14B8A6",
];

export function pickAvatarColor(seed?: string): string {
  const s = seed ?? "";
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export async function listTeamMembers(): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from("team_members")
    .select("id, name, email, role, avatar_color, created_at")
    .order("name", { ascending: true });
  if (error) {
    logSupabaseError("team-members-api:list", error);
    throw error;
  }
  return (data ?? []) as TeamMember[];
}

export async function createTeamMember(input: TeamMemberInput): Promise<TeamMember> {
  const payload = {
    name: input.name.trim(),
    email: input.email?.trim() || null,
    role: input.role ?? null,
    avatar_color: input.avatar_color ?? pickAvatarColor(input.name),
  };
  const { data, error } = await supabase
    .from("team_members")
    .insert(payload)
    .select("id, name, email, role, avatar_color, created_at")
    .single();
  if (error) throw error;
  return data as TeamMember;
}

export async function updateTeamMember(id: string, patch: TeamMemberInput): Promise<TeamMember> {
  const payload: Record<string, unknown> = {};
  if (patch.name !== undefined) payload.name = patch.name.trim();
  if (patch.email !== undefined) payload.email = patch.email?.trim() || null;
  if (patch.role !== undefined) payload.role = patch.role;
  if (patch.avatar_color !== undefined) payload.avatar_color = patch.avatar_color;
  const { data, error } = await supabase
    .from("team_members")
    .update(payload)
    .eq("id", id)
    .select("id, name, email, role, avatar_color, created_at")
    .single();
  if (error) throw error;
  return data as TeamMember;
}

export async function deleteTeamMember(id: string): Promise<void> {
  const { error } = await supabase.from("team_members").delete().eq("id", id);
  if (error) throw error;
}
