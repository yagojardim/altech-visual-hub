import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/states";
import { Paperclip, Upload, Trash2, Download, AlertCircle } from "lucide-react";

const MAX_BYTES = 50 * 1024 * 1024; // 50MB
const BLOCKED_EXT = new Set(["exe", "bat", "cmd", "msi", "dll", "sh", "apk", "iso"]);
const BUCKET = "attachments";

type Attachment = {
  id: string;
  work_item_id: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number;
  storage_path: string;
  uploaded_by: string | null;
  created_at: string;
};

function formatSize(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

export function WorkItemAttachmentsLive({ workItemId }: { workItemId: string }) {
  const { user } = useAuth();
  const [items, setItems] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: e } = await supabase
      .from("attachments")
      .select("*")
      .eq("work_item_id", workItemId)
      .order("created_at", { ascending: false });
    if (e) setError(e.message);
    else setItems((data ?? []) as Attachment[]);
    setLoading(false);
  }, [workItemId]);

  useEffect(() => {
    void load();
  }, [load]);

  const onFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setError(null);
    for (const file of Array.from(files)) {
      const ext = extOf(file.name);
      if (BLOCKED_EXT.has(ext)) {
        setError(`Extensão .${ext} bloqueada por segurança.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        setError(`"${file.name}" excede o limite de 50MB (tem ${formatSize(file.size)}).`);
        continue;
      }
      setUploading(true);
      const path = `${workItemId}/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });
      if (upErr) {
        setError(`Falha ao enviar "${file.name}": ${upErr.message}`);
        setUploading(false);
        continue;
      }
      const { data: ins, error: insErr } = await supabase
        .from("attachments")
        .insert({
          work_item_id: workItemId,
          file_name: file.name,
          mime_type: file.type || null,
          size_bytes: file.size,
          storage_path: path,
          uploaded_by: user?.name ?? user?.id ?? "Dev Altech",
        })
        .select()
        .single();
      setUploading(false);
      if (insErr) {
        setError(`Falha ao registrar metadados: ${insErr.message}`);
        // best effort cleanup
        void supabase.storage.from(BUCKET).remove([path]);
        continue;
      }
      setItems((cur) => [ins as Attachment, ...cur]);
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  const download = async (a: Attachment) => {
    const { data, error: e } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(a.storage_path, 60);
    if (e || !data) {
      setError(e?.message ?? "Falha ao gerar link");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  };

  const remove = async (a: Attachment) => {
    setError(null);
    const prev = items;
    setItems((cur) => cur.filter((i) => i.id !== a.id));
    const { error: dErr } = await supabase.from("attachments").delete().eq("id", a.id);
    if (dErr) {
      setItems(prev);
      setError(dErr.message);
      return;
    }
    void supabase.storage.from(BUCKET).remove([a.storage_path]);
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-medium">
          <Paperclip className="h-4 w-4" /> Anexos
        </h3>
        <div>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => void onFiles(e.target.files)}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            {uploading ? "Enviando…" : "Enviar arquivo"}
          </Button>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Máx. 50MB por arquivo. Bloqueados: .exe .bat .cmd .msi .dll .sh .apk .iso
      </p>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <LoadingState label="Carregando anexos…" />
      ) : items.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhum anexo enviado.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-panel p-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{a.file_name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {formatSize(a.size_bytes)} · {a.uploaded_by ?? "—"} ·{" "}
                  {new Date(a.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => void download(a)}>
                  <Download className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void remove(a)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
