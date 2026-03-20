import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type ColumnDef,
  type SortingState,
  flexRender,
} from "@tanstack/react-table";
import {
  Eye,
  Search,
  ArrowUpDown,
  Filter,
  Lightbulb,
  Package,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// ==================== TYPES ====================

type NivelAlerta = "CRÍTICO" | "URGENTE" | "PREVENTIVO";
type Condicion = "PRÓXIMO_VENCER" | "VENCIDO";

interface Alerta {
  id: string;
  lote: string;
  producto: string;
  fechaVencimiento: string;
  diasRestantes: number;
  condicion: Condicion;
  nivel: NivelAlerta;
  stockDisponible: number;
  unidad: string;
  ubicacion: string;
}

interface LoteMovimiento {
  fecha: string;
  evento: string;
  detalle: string;
}

// ==================== MOCK ====================

const mockAlertas: Alerta[] = [
  { id: "1", lote: "L-2026-010", producto: "Pan Francés (bolsa x10)", fechaVencimiento: "16/03/2026", diasRestantes: -4, condicion: "VENCIDO", nivel: "CRÍTICO", stockDisponible: 8, unidad: "bolsa", ubicacion: "Rack A-3" },
  { id: "2", lote: "L-2026-011", producto: "Bizcocho Vainilla 500g", fechaVencimiento: "21/03/2026", diasRestantes: 1, condicion: "PRÓXIMO_VENCER", nivel: "CRÍTICO", stockDisponible: 45, unidad: "und", ubicacion: "Rack B-1" },
  { id: "3", lote: "L-2026-008", producto: "Panetón Clásico 900g", fechaVencimiento: "28/03/2026", diasRestantes: 8, condicion: "PRÓXIMO_VENCER", nivel: "URGENTE", stockDisponible: 85, unidad: "und", ubicacion: "Rack A-1" },
  { id: "4", lote: "L-2026-022", producto: "Keke Marmoleado 400g", fechaVencimiento: "30/03/2026", diasRestantes: 10, condicion: "PRÓXIMO_VENCER", nivel: "URGENTE", stockDisponible: 15, unidad: "und", ubicacion: "Rack C-2" },
  { id: "5", lote: "L-2026-035", producto: "Torta Helada 1kg", fechaVencimiento: "25/03/2026", diasRestantes: 5, condicion: "PRÓXIMO_VENCER", nivel: "URGENTE", stockDisponible: 10, unidad: "und", ubicacion: "Cámara fría 1" },
  { id: "6", lote: "L-2026-009", producto: "Pan de Molde Blanco 500g", fechaVencimiento: "10/04/2026", diasRestantes: 21, condicion: "PRÓXIMO_VENCER", nivel: "PREVENTIVO", stockDisponible: 120, unidad: "und", ubicacion: "Rack A-2" },
  { id: "7", lote: "L-2026-012", producto: "Bizcocho Vainilla 500g", fechaVencimiento: "25/03/2026", diasRestantes: 5, condicion: "PRÓXIMO_VENCER", nivel: "URGENTE", stockDisponible: 20, unidad: "und", ubicacion: "Rack B-2" },
];

const mockLoteHistorial: LoteMovimiento[] = [
  { fecha: "10/03/2026", evento: "Producción finalizada", detalle: "120 unidades fabricadas — QC aprobado" },
  { fecha: "12/03/2026", evento: "Ingreso a almacén", detalle: "Ubicación: Rack A-1" },
  { fecha: "15/03/2026", evento: "Despacho DSP-2026-0015", detalle: "35 und → Ruta LIM-01" },
  { fecha: "18/03/2026", evento: "Alerta generada", detalle: "8 días para vencimiento — marcado PRÓXIMO_VENCER" },
];

// ==================== HELPERS ====================

const nivelStyles: Record<NivelAlerta, string> = {
  CRÍTICO: "bg-red-100 text-red-700",
  URGENTE: "bg-amber-100 text-amber-700",
  PREVENTIVO: "bg-blue-100 text-blue-700",
};

const condicionStyles: Record<Condicion, string> = {
  PRÓXIMO_VENCER: "bg-amber-100 text-amber-700",
  VENCIDO: "bg-red-100 text-red-700",
};
const condicionLabels: Record<Condicion, string> = {
  PRÓXIMO_VENCER: "PRÓXIMO VENCER",
  VENCIDO: "VENCIDO",
};

const diasColor = (d: number) => {
  if (d <= 0) return "text-danger font-bold";
  if (d <= 7) return "text-danger font-semibold";
  if (d <= 15) return "text-warning font-semibold";
  return "text-success";
};

const NIVELES: NivelAlerta[] = ["CRÍTICO", "URGENTE", "PREVENTIVO"];

// ==================== COMPONENT ====================

export default function AlertasVencimiento() {
  const navigate = useNavigate();
  const [sorting, setSorting] = useState<SortingState>([{ id: "diasRestantes", desc: false }]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [nivelFilter, setNivelFilter] = useState("all");
  const [sheetAlerta, setSheetAlerta] = useState<Alerta | null>(null);

  const filteredData = useMemo(() => {
    return mockAlertas.filter((a) => {
      if (nivelFilter !== "all" && a.nivel !== nivelFilter) return false;
      return true;
    });
  }, [nivelFilter]);

  const criticos = mockAlertas.filter((a) => a.nivel === "CRÍTICO").length;
  const urgentes = mockAlertas.filter((a) => a.nivel === "URGENTE").length;
  const preventivos = mockAlertas.filter((a) => a.nivel === "PREVENTIVO").length;

  const columns = useMemo<ColumnDef<Alerta>[]>(
    () => [
      {
        accessorKey: "nivel",
        header: "Nivel",
        cell: ({ row }) => (
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${nivelStyles[row.original.nivel]}`}>
            {row.original.nivel === "CRÍTICO" && "🔴 "}
            {row.original.nivel === "URGENTE" && "🟡 "}
            {row.original.nivel === "PREVENTIVO" && "🔵 "}
            {row.original.nivel}
          </span>
        ),
      },
      {
        accessorKey: "lote",
        header: "Lote",
        cell: ({ row }) => <span className="text-sm font-mono font-medium">{row.original.lote}</span>,
      },
      {
        accessorKey: "producto",
        header: ({ column }) => (
          <button className="flex items-center gap-1" onClick={() => column.toggleSorting()}>
            Producto <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
      },
      {
        accessorKey: "fechaVencimiento",
        header: "Vencimiento",
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.fechaVencimiento}</span>,
      },
      {
        accessorKey: "diasRestantes",
        header: ({ column }) => (
          <button className="flex items-center gap-1" onClick={() => column.toggleSorting()}>
            Días rest. <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => {
          const d = row.original.diasRestantes;
          return (
            <span className={cn("text-sm", diasColor(d))}>
              {d < 0 ? `${Math.abs(d)}d vencido` : d === 0 ? "Hoy" : `${d}d`}
            </span>
          );
        },
      },
      {
        accessorKey: "condicion",
        header: "Condición",
        cell: ({ row }) => (
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${condicionStyles[row.original.condicion]}`}>
            {condicionLabels[row.original.condicion]}
          </span>
        ),
      },
      {
        accessorKey: "stockDisponible",
        header: "Stock",
        cell: ({ row }) => (
          <span className="text-sm font-medium">{row.original.stockDisponible} {row.original.unidad}</span>
        ),
      },
      {
        accessorKey: "ubicacion",
        header: "Ubicación",
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.ubicacion}</span>,
      },
      {
        id: "acciones",
        header: "Acciones",
        cell: ({ row }) => (
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Ver trazabilidad" onClick={() => setSheetAlerta(row.original)}>
            <Eye className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Alertas de Vencimiento</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Lotes próximos a vencer o vencidos que requieren atención
        </p>
      </div>

      {/* Context box */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
        <Lightbulb className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-blue-800">
            Usa estas alertas al crear despachos: prioriza los lotes marcados como PRÓXIMO_VENCER
            para esos clientes en el siguiente despacho.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 border-blue-300 text-blue-700 hover:bg-blue-100"
          onClick={() => navigate("/entrega/despachos/nuevo")}
        >
          Crear nuevo despacho →
        </Button>
      </div>

      {/* Summary badges */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium bg-red-100 text-red-700">
          <Bell className="h-3.5 w-3.5" /> Críticos: {criticos}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium bg-amber-100 text-amber-700">
          Urgentes: {urgentes}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium bg-blue-100 text-blue-700">
          Preventivos: {preventivos}
        </span>
      </div>

      {/* Search + Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por lote o producto..."
            className="pl-9 bg-card"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
        </div>
        <Select value={nivelFilter} onValueChange={setNivelFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Nivel" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los niveles</SelectItem>
            {NIVELES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-slate-50 hover:bg-slate-50">
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => {
                const isCritico = row.original.nivel === "CRÍTICO";
                return (
                  <TableRow key={row.id} className={cn("h-12 hover:bg-slate-50/70 transition-colors", isCritico && "bg-red-50/40")}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No hay alertas para los filtros seleccionados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between px-4 py-3 border-t bg-slate-50/50">
          <p className="text-xs text-muted-foreground">{table.getFilteredRowModel().rows.length} alerta(s)</p>
        </div>
      </div>

      {/* Trazabilidad Sheet */}
      <Sheet open={!!sheetAlerta} onOpenChange={() => setSheetAlerta(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Lote {sheetAlerta?.lote}
            </SheetTitle>
          </SheetHeader>

          {sheetAlerta && (
            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/50 p-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Producto</p>
                  <p className="text-sm font-medium mt-0.5">{sheetAlerta.producto}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Vencimiento</p>
                  <p className="text-sm font-medium mt-0.5">{sheetAlerta.fechaVencimiento}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Días restantes</p>
                  <p className={cn("text-sm mt-0.5", diasColor(sheetAlerta.diasRestantes))}>
                    {sheetAlerta.diasRestantes < 0
                      ? `${Math.abs(sheetAlerta.diasRestantes)} días vencido`
                      : sheetAlerta.diasRestantes === 0
                        ? "Vence hoy"
                        : `${sheetAlerta.diasRestantes} días`}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Condición</p>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-0.5 ${condicionStyles[sheetAlerta.condicion]}`}>
                    {condicionLabels[sheetAlerta.condicion]}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Stock</p>
                  <p className="text-sm font-medium mt-0.5">{sheetAlerta.stockDisponible} {sheetAlerta.unidad}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Ubicación</p>
                  <p className="text-sm font-medium mt-0.5">{sheetAlerta.ubicacion}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-3">Historial de trazabilidad</h3>
                <div className="space-y-3">
                  {mockLoteHistorial.map((h, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                        {i < mockLoteHistorial.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                      </div>
                      <div className="pb-3">
                        <p className="text-xs text-muted-foreground">{h.fecha}</p>
                        <p className="text-sm font-medium">{h.evento}</p>
                        <p className="text-xs text-muted-foreground">{h.detalle}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
