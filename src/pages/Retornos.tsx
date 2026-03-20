import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type ColumnDef,
  type SortingState,
  flexRender,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { CalendarIcon, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ==================== TYPES ====================

type Condicion = "ÓPTIMO" | "PRÓXIMO_VENCER" | "VENCIDO" | "DEFECTO_ESTÉTICO";
type EstadoRetorno = "PENDIENTE" | "REINGRESADO" | "MERMA" | "STOCK_FLOTANTE" | "POOL_GG";
type Destino = "REINGRESO" | "STOCK_FLOTANTE" | "MERMA" | "POOL_DECISION_GG";

interface Retorno {
  id: string;
  vendedor: string;
  ruta: string;
  producto: string;
  lote: string;
  cantidad: number;
  unidad: string;
  condicion: Condicion;
  estado: EstadoRetorno;
}

// ==================== MOCK ====================

const initialData: Retorno[] = [
  { id: "1", vendedor: "Juan López", ruta: "LIM-01", producto: "Panetón Clásico 900g", lote: "L-2026-008", cantidad: 12, unidad: "und", condicion: "PRÓXIMO_VENCER", estado: "PENDIENTE" },
  { id: "2", vendedor: "Juan López", ruta: "LIM-01", producto: "Pan de Molde Blanco 500g", lote: "L-2026-009", cantidad: 8, unidad: "und", condicion: "ÓPTIMO", estado: "PENDIENTE" },
  { id: "3", vendedor: "Pedro Soto", ruta: "LIM-02", producto: "Empanada Pollo x12", lote: "L-2026-007", cantidad: 5, unidad: "und", condicion: "DEFECTO_ESTÉTICO", estado: "PENDIENTE" },
  { id: "4", vendedor: "María Torres", ruta: "PRV-01", producto: "Panetón Chocolate 900g", lote: "L-2026-006", cantidad: 20, unidad: "und", condicion: "PRÓXIMO_VENCER", estado: "POOL_GG" },
  { id: "5", vendedor: "María Torres", ruta: "PRV-01", producto: "Torta Tres Leches 1kg", lote: "L-2026-010", cantidad: 3, unidad: "und", condicion: "VENCIDO", estado: "MERMA" },
];

const condicionStyles: Record<Condicion, string> = {
  ÓPTIMO: "bg-green-100 text-green-700",
  PRÓXIMO_VENCER: "bg-amber-100 text-amber-700",
  VENCIDO: "bg-red-100 text-red-700",
  DEFECTO_ESTÉTICO: "bg-orange-100 text-orange-700",
};
const condicionLabels: Record<Condicion, string> = {
  ÓPTIMO: "ÓPTIMO", PRÓXIMO_VENCER: "PRÓXIMO VENCER", VENCIDO: "VENCIDO", DEFECTO_ESTÉTICO: "DEFECTO ESTÉTICO",
};

const estadoStyles: Record<EstadoRetorno, string> = {
  PENDIENTE: "bg-amber-100 text-amber-700",
  REINGRESADO: "bg-green-100 text-green-700",
  MERMA: "bg-red-100 text-red-700",
  STOCK_FLOTANTE: "bg-blue-100 text-blue-700",
  POOL_GG: "bg-purple-100 text-purple-700",
};
const estadoLabels: Record<EstadoRetorno, string> = {
  PENDIENTE: "PENDIENTE", REINGRESADO: "REINGRESADO", MERMA: "MERMA", STOCK_FLOTANTE: "STOCK FLOTANTE", POOL_GG: "POOL GG",
};

const destinoToEstado: Record<Destino, EstadoRetorno> = {
  REINGRESO: "REINGRESADO", STOCK_FLOTANTE: "STOCK_FLOTANTE", MERMA: "MERMA", POOL_DECISION_GG: "POOL_GG",
};
const destinoLabels: Record<Destino, string> = {
  REINGRESO: "Reingreso a almacén", STOCK_FLOTANTE: "Stock flotante", MERMA: "Merma (descarte)", POOL_DECISION_GG: "Pool decisión GG",
};

const VENDEDORES = ["Juan López", "Pedro Soto", "María Torres"];

// ==================== COMPONENT ====================

export default function Retornos() {
  const [data, setData] = useState(initialData);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [dateFilter, setDateFilter] = useState<Date | undefined>(new Date(2026, 2, 20));
  const [vendedorFilter, setVendedorFilter] = useState("all");
  const [estadoFilter, setEstadoFilter] = useState("all");

  // Process dialog
  const [processTarget, setProcessTarget] = useState<Retorno | null>(null);
  const [destino, setDestino] = useState<Destino | "">("");
  const [motivo, setMotivo] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const pendientes = data.filter((r) => r.estado === "PENDIENTE").length;
  const procesadosHoy = data.filter((r) => r.estado !== "PENDIENTE").length;
  const enPoolGG = data.filter((r) => r.estado === "POOL_GG").length;

  const filteredData = useMemo(() => {
    return data.filter((r) => {
      if (vendedorFilter !== "all" && r.vendedor !== vendedorFilter) return false;
      if (estadoFilter !== "all" && r.estado !== estadoFilter) return false;
      return true;
    });
  }, [data, vendedorFilter, estadoFilter]);

  const columns = useMemo<ColumnDef<Retorno>[]>(
    () => [
      {
        accessorKey: "vendedor",
        header: ({ column }) => (
          <button className="flex items-center gap-1" onClick={() => column.toggleSorting()}>
            Vendedor <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => <span className="text-sm font-medium">{row.original.vendedor}</span>,
      },
      { accessorKey: "ruta", header: "Ruta" },
      { accessorKey: "producto", header: "Producto" },
      {
        accessorKey: "lote",
        header: "Lote",
        cell: ({ row }) => <span className="text-sm font-mono text-muted-foreground">{row.original.lote}</span>,
      },
      {
        accessorKey: "cantidad",
        header: "Cantidad",
        cell: ({ row }) => <span className="text-sm font-medium">{row.original.cantidad}{row.original.unidad}</span>,
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
        accessorKey: "estado",
        header: "Estado",
        cell: ({ row }) => (
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${estadoStyles[row.original.estado]}`}>
            {estadoLabels[row.original.estado]}
          </span>
        ),
      },
      {
        id: "acciones",
        header: "Acciones",
        cell: ({ row }) => {
          if (row.original.estado !== "PENDIENTE") return null;
          return (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDestino("");
                setMotivo("");
                setObservaciones("");
                setProcessTarget(row.original);
              }}
            >
              Procesar
            </Button>
          );
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const canConfirm = destino !== "" && (destino !== "MERMA" || motivo.trim());

  const handleProcess = () => {
    if (!processTarget || !destino) return;
    const newEstado = destinoToEstado[destino];
    setData((prev) => prev.map((r) => (r.id === processTarget.id ? { ...r, estado: newEstado } : r)));
    toast.success(`Retorno procesado: ${destinoLabels[destino]}`);
    setProcessTarget(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Retornos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Productos devueltos por vendedores pendientes de procesar
        </p>
      </div>

      {/* Summary badges */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium bg-amber-100 text-amber-700">
          Pendientes de procesar: {pendientes}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium bg-green-100 text-green-700">
          Procesados hoy: {procesadosHoy}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium bg-purple-100 text-purple-700">
          En Pool GG: {enPoolGG}
        </span>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-[180px] justify-start text-left font-normal", !dateFilter && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFilter ? format(dateFilter, "dd/MM/yyyy") : "Fecha"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateFilter} onSelect={setDateFilter} initialFocus className={cn("p-3 pointer-events-auto")} />
          </PopoverContent>
        </Popover>

        <Select value={vendedorFilter} onValueChange={setVendedorFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Vendedor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {VENDEDORES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={estadoFilter} onValueChange={setEstadoFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {(Object.keys(estadoLabels) as EstadoRetorno[]).map((e) => (
              <SelectItem key={e} value={e}>{estadoLabels[e]}</SelectItem>
            ))}
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
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="h-12 hover:bg-slate-50/70 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No hay retornos para los filtros seleccionados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between px-4 py-3 border-t bg-slate-50/50">
          <p className="text-xs text-muted-foreground">{table.getFilteredRowModel().rows.length} retorno(s)</p>
        </div>
      </div>

      {/* Process Dialog */}
      <Dialog open={!!processTarget} onOpenChange={(open) => { if (!open) setProcessTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Procesar retorno</DialogTitle>
            <DialogDescription>Define el destino de este producto devuelto.</DialogDescription>
          </DialogHeader>

          {processTarget && (
            <div className="space-y-4 py-2">
              {/* Info card */}
              <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/50 p-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Vendedor</p>
                  <p className="font-medium">{processTarget.vendedor}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Producto</p>
                  <p className="font-medium">{processTarget.producto}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Lote</p>
                  <p className="font-mono">{processTarget.lote}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cantidad</p>
                  <p className="font-medium">{processTarget.cantidad} {processTarget.unidad}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Condición</p>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-0.5 ${condicionStyles[processTarget.condicion]}`}>
                    {condicionLabels[processTarget.condicion]}
                  </span>
                </div>
              </div>

              {/* Destino select */}
              <div className="space-y-1.5">
                <Label>Destino <span className="text-danger">*</span></Label>
                <Select value={destino} onValueChange={(v) => setDestino(v as Destino)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar destino..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REINGRESO">Reingreso — Vuelve al stock de almacén</SelectItem>
                    <SelectItem value="STOCK_FLOTANTE">Stock flotante — Se queda en el vehículo</SelectItem>
                    <SelectItem value="MERMA">Merma — Descarte por pérdida</SelectItem>
                    <SelectItem value="POOL_DECISION_GG">Pool decisión GG — Gerente General decide</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Conditional fields */}
              {destino === "STOCK_FLOTANTE" && (
                <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                  Solo aplica si el vendedor continuará ruta mañana.
                </div>
              )}

              {destino === "MERMA" && (
                <div className="space-y-1.5">
                  <Label>Motivo <span className="text-danger">*</span></Label>
                  <Textarea placeholder="Describe el motivo del descarte..." value={motivo} onChange={(e) => setMotivo(e.target.value)} />
                </div>
              )}

              {destino === "POOL_DECISION_GG" && (
                <>
                  <div className="rounded-md border border-purple-200 bg-purple-50 p-3 text-sm text-purple-800">
                    El Gerente decidirá si dona, vende con descuento o descarta.
                  </div>
                  <div className="space-y-1.5">
                    <Label>Observaciones (opcional)</Label>
                    <Textarea placeholder="Observaciones adicionales..." value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setProcessTarget(null)}>Cancelar</Button>
            <Button onClick={handleProcess} disabled={!canConfirm}>Procesar retorno</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
