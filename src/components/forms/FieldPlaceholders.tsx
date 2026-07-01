import { Calendar, Clock, Upload, Users, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface BaseFieldPlaceholderProps {
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
}

function FieldShell({
  icon,
  placeholder,
  disabled,
  readOnly,
  className,
  variant = "trigger",
}: BaseFieldPlaceholderProps & {
  icon: React.ReactNode;
  variant?: "trigger" | "dashed";
}) {
  return (
    <button
      type="button"
      disabled={disabled || readOnly}
      aria-readonly={readOnly}
      className={cn(
        "flex h-9 w-full items-center gap-2 rounded-md px-3 py-2 text-sm shadow-sm transition-colors",
        "text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variant === "trigger"
          ? "border border-input bg-transparent hover:bg-accent/40"
          : "border border-dashed border-input bg-transparent hover:bg-accent/40",
        readOnly && "cursor-default opacity-80 hover:bg-transparent",
        className,
      )}
    >
      <span className="[&_svg]:h-4 [&_svg]:w-4">{icon}</span>
      <span className="truncate">{placeholder}</span>
    </button>
  );
}

export function DatePickerFieldPlaceholder(props: BaseFieldPlaceholderProps) {
  return (
    <FieldShell
      icon={<Calendar />}
      placeholder={props.placeholder ?? "Selecione uma data"}
      {...props}
    />
  );
}

export function TimePickerFieldPlaceholder(props: BaseFieldPlaceholderProps) {
  return (
    <FieldShell
      icon={<Clock />}
      placeholder={props.placeholder ?? "Selecione um horário"}
      {...props}
    />
  );
}

export function UserSelectorPlaceholder(props: BaseFieldPlaceholderProps) {
  return (
    <FieldShell
      icon={<Users />}
      placeholder={props.placeholder ?? "Atribuir a um usuário"}
      {...props}
    />
  );
}

export function TagSelectorPlaceholder(props: BaseFieldPlaceholderProps) {
  return (
    <FieldShell
      icon={<Tag />}
      placeholder={props.placeholder ?? "Adicionar tags"}
      {...props}
    />
  );
}

export function UploadFieldPlaceholder(props: BaseFieldPlaceholderProps) {
  return (
    <FieldShell
      icon={<Upload />}
      placeholder={props.placeholder ?? "Clique para enviar um arquivo"}
      variant="dashed"
      {...props}
    />
  );
}
