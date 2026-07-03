import { useMemo } from "react";
import { Filter, ArrowUpDown, Group, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface OrgOption {
  value: string;
  label: string;
}

export interface OrgFilterField {
  key: string;
  label: string;
  options: OrgOption[];
}

export interface OrgControlsValue {
  filters: Record<string, string[]>;
  sortBy: string;
  sortDir: "asc" | "desc";
  groupBy: string;
}

export interface OrgControlsProps {
  value: OrgControlsValue;
  onChange: (patch: Partial<OrgControlsValue>) => void;
  filterFields?: OrgFilterField[];
  sortOptions: OrgOption[];
  groupOptions?: OrgOption[];
  onRefresh?: () => void;
  onReset?: () => void;
  className?: string;
}

export function OrgControls({
  value,
  onChange,
  filterFields = [],
  sortOptions,
  groupOptions = [],
  onRefresh,
  onReset,
  className,
}: OrgControlsProps) {
  const activeFilterCount = useMemo(
    () => Object.values(value.filters).reduce((n, arr) => n + (arr?.length ?? 0), 0),
    [value.filters],
  );
  const groupLabel = useMemo(
    () => groupOptions.find((o) => o.value === value.groupBy)?.label ?? "Sem",
    [groupOptions, value.groupBy],
  );
  const sortLabel = useMemo(() => {
    const option = sortOptions.find((o) => o.value === value.sortBy);
    if (!option) return sortOptions[0]?.label ?? "";
    const dirLabel =
      value.sortDir === "asc"
        ? value.sortBy === "nome"
          ? "A–Z"
          : "Crescente"
        : value.sortBy === "nome"
          ? "Z–A"
          : "Decrescente";
    return `${option.label} · ${dirLabel}`;
  }, [sortOptions, value.sortBy, value.sortDir]);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {filterFields.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
              <Filter className="mr-1 h-3.5 w-3.5" />
              Filtro
              {activeFilterCount > 0 && (
                <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/15 px-1 text-[10px] font-medium text-primary">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 space-y-4">
            {filterFields.map((field) => {
              const selected = value.filters[field.key] ?? [];
              return (
                <div key={field.key} className="space-y-2">
                  <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {field.label}
                  </div>
                  <div className="space-y-1.5">
                    {field.options.map((opt) => {
                      const checked = selected.includes(opt.value);
                      return (
                        <label
                          key={opt.value}
                          className="flex cursor-pointer items-center gap-2 text-sm"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(c) => {
                              const next = c
                                ? [...selected, opt.value]
                                : selected.filter((v) => v !== opt.value);
                              onChange({
                                filters: { ...value.filters, [field.key]: next },
                              });
                            }}
                          />
                          <span>{opt.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-full text-xs"
                onClick={() =>
                  onChange({
                    filters: Object.fromEntries(filterFields.map((f) => [f.key, [] as string[]])),
                  })
                }
              >
                <X className="mr-1 h-3.5 w-3.5" />
                Limpar filtros
              </Button>
            )}
          </PopoverContent>
        </Popover>
      )}

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
            <ArrowUpDown className="mr-1 h-3.5 w-3.5" />
            Ordenação
            <span className="ml-1 hidden text-muted-foreground sm:inline">· {sortLabel}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64 space-y-3">
          <div className="space-y-2">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Ordenar por
            </div>
            <RadioGroup
              value={value.sortBy}
              onValueChange={(v) => onChange({ sortBy: v })}
              className="space-y-1"
            >
              {sortOptions.map((opt) => (
                <label key={opt.value} className="flex cursor-pointer items-center gap-2 text-sm">
                  <RadioGroupItem value={opt.value} />
                  <span>{opt.label}</span>
                </label>
              ))}
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Direção
            </div>
            <RadioGroup
              value={value.sortDir}
              onValueChange={(v) => onChange({ sortDir: (v as "asc" | "desc") ?? "asc" })}
              className="flex gap-4"
            >
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <RadioGroupItem value="asc" />
                <span>Crescente</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <RadioGroupItem value="desc" />
                <span>Decrescente</span>
              </label>
            </RadioGroup>
          </div>
        </PopoverContent>
      </Popover>

      {groupOptions.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
              <Group className="mr-1 h-3.5 w-3.5" />
              Agrupamento
              <span className="ml-1 hidden text-muted-foreground sm:inline">· {groupLabel}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56">
            <RadioGroup
              value={value.groupBy}
              onValueChange={(v) => onChange({ groupBy: v })}
              className="space-y-1"
            >
              {groupOptions.map((opt) => (
                <label key={opt.value} className="flex cursor-pointer items-center gap-2 text-sm">
                  <RadioGroupItem value={opt.value} />
                  <span>{opt.label}</span>
                </label>
              ))}
            </RadioGroup>
          </PopoverContent>
        </Popover>
      )}

      {onRefresh && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs"
          onClick={onRefresh}
          aria-label="Atualizar"
        >
          <RefreshCw className="mr-1 h-3.5 w-3.5" />
          Atualizar
        </Button>
      )}

      {onReset && (activeFilterCount > 0 || value.groupBy !== "" || value.sortBy !== "") && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs text-muted-foreground"
          onClick={onReset}
        >
          Redefinir
        </Button>
      )}
    </div>
  );
}
