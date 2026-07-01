import { Plus, Filter, Group, ArrowUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function BacklogToolbar() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" disabled>
          <Plus className="mr-1.5 h-4 w-4" />
          Novo item
        </Button>
        <Button variant="outline" size="sm" disabled>
          <Filter className="mr-1.5 h-4 w-4" />
          Filtros
        </Button>
        <Button variant="outline" size="sm" disabled>
          <Group className="mr-1.5 h-4 w-4" />
          Agrupar
        </Button>
        <Button variant="outline" size="sm" disabled>
          <ArrowUpDown className="mr-1.5 h-4 w-4" />
          Ordenar
        </Button>
      </div>
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input type="text" placeholder="Pesquisar..." className="pl-9" disabled />
      </div>
    </div>
  );
}
