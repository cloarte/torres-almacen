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
import {
  Eye,
  Search,
  ArrowUpDown,
  Filter,
  Package,
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

type Condicion = "ÓPTIMO" | "PRÓXIMO_VENCER" | "VENCIDO" | "DEFECTO_ESTÉTICO";

interface Lote {
  id: string;
  numero: string;
  fechaFabricacion: string;
  fechaVencimiento: string;
  diasRestantes: number;
  numProductos: number;
  condicion: Condicion;
  stockDisponible: number;
  unidad: string;
}

interface LoteProducto {
  sku: string;
  nombre: string;
  cantidadOriginal: number;
  cantidadDisponible: number;
  despachado: number;
  devuelto: number;
}

interface Movimiento {
  fecha: string;
  tipo: string;
  referencia: string;
  cantidad: number;
  detalle: string;
}

// ==================== MOCK DATA ====================

const mockLotes: Lote[] = [
  { id: "1", numero: "L-2026-012", fechaFabricacion: "01/03/2026", fechaVencimiento: "30/04/2026", diasRestantes: 41, numProductos: 3, condicion: "ÓPTIMO", stockDisponible: 280, unidad: "und" },
  { id: "2", numero: "L-2026-011", fechaFabricacion: "20/02/2026", fechaVencimiento: "21/03/2026", diasRestantes: 1, numProductos: 2, condicion: "PRÓXIMO_VENCER", stockDisponible: 45, unidad: "und" },
  { id: "3", numero: "L-2026-010", fechaFabricacion: "15/02/2026", fechaVencimiento: "16/03/2026", diasRestantes: -4, numProductos: 1, condicion: "VENCIDO", stockDisponible: 8, unidad: "und" },
  { id: "4", numero: "L-2026-009", fechaFabricacion: "25/02/2026", fechaVencimiento: "25/04/2026", diasRestantes: 36, numProductos: 4, condicion: "DEFECTO_ESTÉTICO", stockDisponible: 180, unidad: "und" },
];

const mockProductosPorLote: Record<string, LoteProducto[]> = {
  "1": [
    { sku: "PAN-CL-900", nombre: "Panetón Clásico 900g", cantidadOriginal: 200, cantidadDisponible: 120, despachado: 80, devuelto: 0 },
    { sku: "PAN-MOL-INT", nombre: "Pan de Molde Integral", cantidadOriginal: 100, cantidadDisponible: 90, despachado: 12, devuelto: 2 },
    { sku: "KEK-MAR-400", nombre: "Keke Marmoleado 400g", cantidadOriginal: 80, cantidadDisponible: 70, despachado: 10, devuelto: 0 },
  ],
  "2": [
    { sku: "BIZ-VAN-500", nombre: "Bizcocho Vainilla 500g", cantidadOriginal: 40, cantidadDisponible: 25, despachado: 16, devuelto: 1 },
    { sku: "TOR-HEL-1K", nombre: "Torta Helada 1kg", cantidadOriginal: 30, cantidadDisponible: 20, despachado: 10, devuelto: 0 },
  ],
  "3": [
    { sku: "PAN-FRA-10", nombre: "Pan Francés (bolsa x10)", cantidadOriginal: 50, cantidadDisponible: 8, despachado: 42, devuelto: 0 },
  ],
  "4": [
    { sku: "PAN-CL-900", nombre: "Panetón Clásico 900g", cantidadOriginal: 100, cantidadDisponible: 80, despachado: 20, devuelto: 0 },
    { sku: "GAL-SOD-6", nombre: "Galleta Soda x6", cantidadOriginal: 60, cantidadDisponible: 50, despachado: 10, devuelto: 0 },
    { sku: "EMP-CAR-4", nombre: "Empanada de Carne x4", cantidadOriginal: 40, cantidadDisponible: 30, despachado: 10, devuelto: 0 },
    { sku: "KEK-MAR-400", nombre: "Keke Marmoleado 400g", cantidadOriginal: 30, cantidadDisponible: 20, despachado: 10, devuelto: 0 },
  ],
};

const mockMovimientos: Record<string, Movimiento[]> = {
  "1": [
    { fecha: "01/03/2026", tipo: "Ingreso", referencia: "PROD-2026-012", cantidad: 380, detalle: "Producción finalizada — QC aprobado" },
    { fecha: "10/03/2026", tipo: "Despacho", referencia: "DSP-2026-0015", cantidad: -52, detalle: "Ruta LIM-01 — Juan López" },
    { fecha: "15/03/2026", tipo: "Despacho", referencia: "DSP-2026-0018", cantidad: -50, detalle: "Ruta LIM-02 — Pedro Soto" },
    { fecha: "16/03/2026", tipo: "Retorno", referencia: "RET-2026-003", cantidad: 2, detalle: "Pan de Molde — empaque dañado" },
  ],
  "2": [
    { fecha: "20/02/2026", tipo: "Ingreso", referencia: "PROD-2026-011", cantidad: 70, detalle: "Producción finalizada" },
    { fecha: "05/03/2026", tipo: "Despacho", referencia: "DSP-2026-0016", cantidad: -26, detalle: "Ruta PRV-01 — María Torres" },
    { fecha: "06/03/2026", tipo: "Retorno", referencia: "RET-2026-002", cantidad: 1, detalle: "Bizcocho — cliente rechazó" },
  ],
  "3": [
    { fecha: "15/02/2026", tipo: "Ingreso", referencia: "PROD-2026-010", cantidad: 50, detalle: "Producción finalizada" },
    { fecha: "01/03/2026", tipo: "Despacho", referencia: "DSP-2026-0014", cantidad: -42, detalle: "Ruta LIM-01 — Juan López" },
  ],
  "4": [
    { fecha: "25/02/2026", tipo: "Ingreso", referencia: "PROD-2026-009", cantidad: 230, detalle: "Producción finalizada — defecto estético reportado" },
    { fecha: "12/03/2026", tipo: "Despacho", referencia: "DSP-2026-0017", cantidad: -50, detalle: "Ruta LIM-02 — Pedro Soto" },
  ],
};

// ==================== HELPERS ====================

const condicionStyles: Record<Condicion, string> = {
  ÓPTIMO: "bg-green-100 text-green-700",
  PRÓXIMO_VENCER: "bg-amber-100 text-amber-700",
  VENCIDO: "bg-red-100 text-red-700",
  DEFECTO_ESTÉTICO: "bg-orange-100 text-orange-700",
};

const condicionLabels: Record<Condicion, string> = {
  ÓPTIMO: "ÓPTIMO",
  PRÓXIMO_VENCER: "PRÓXIMO VENCER",
  VENCIDO: "VENCIDO",
  DEFECTO_ESTÉTICO: "DEFECTO ESTÉTICO",
};

const diasColor = (d: number) => {
  if (d <= 7) return "text-danger font-semibold";
  if (d <= 15) return "text-warning font-semibold";
  return "text-success";
};

const movTipoStyles: Record<string, string> = {
  Ingreso: "bg-green-100 text-green-700",
  Despacho: "bg-blue-100 text-blue-700",
  Retorno: "bg-amber-100 text-amber-700",
};

// ==================== COMPONENT ====================

export default function Lotes() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [condicionFilter, setCondicionFilter] = useState("all");
  const [venceFilter, setVenceFilter] = useState("all");
  const [sheetLote, setSheetLote] = useState<Lote | null>(null);

  const filteredData = useMemo(() => {
    return mockLotes.filter((l) => {
      if (condicionFilter !== "all" && l.condicion !== condicionFilter) return false;
      if (venceFilter !== "all") {
        const days = parseInt(venceFilter);
        if (l.diasRestantes > days || l.diasRestantes < 0) return false;
      }
      return true;
    });
  }, [condicionFilter, venceFilter]);

  const columns = useMemo<ColumnDef<Lote>[]>(
    () => [
      {
        accessorKey: "numero",
        header: ({ column }) => (
          <button className="flex items-center gap-1" onClick={() => column.toggleSorting()}>
            N° Lote <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => <span className="font-medium text-foreground">{row.original.numero}</span>,
      },
      {
        accessorKey: "fechaFabricacion",
        header: "Fabricación",
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.fechaFabricacion}</span>,
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
              {d < 0 ? `${Math.abs(d)} días vencido` : `${d} día${d !== 1 ? "s" : ""}`}
            </span>
          );
        },
      },
      {
        accessorKey: "numProductos",
        header: "Productos",
        cell: ({ row }) => <span className="text-sm">{row.original.numProductos} prod</span>,
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
        header: "Stock disp.",
        cell: ({ row }) => (
          <span className="text-sm font-medium">{row.original.stockDisponible} {row.original.unidad}</span>
        ),
      },
      {
        id: "acciones",
        header: "Acciones",
        cell: ({ row }) => (
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Ver detalle" onClick={() => setSheetLote(row.original)}>
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

  const sheetProductos = sheetLote ? (mockProductosPorLote[sheetLote.id] || []) : [];
  const sheetMovimientos = sheetLote ? (mockMovimientos[sheetLote.id] || []) : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Lotes de Producción</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Los lotes son registrados automáticamente desde producción.
        </p>
      </div>

      {/* Search + Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por N° de lote o producto..."
            className="pl-9 bg-card"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtros
              {(condicionFilter !== "all" || venceFilter !== "all") && (
                <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {[condicionFilter !== "all", venceFilter !== "all"].filter(Boolean).length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 space-y-4" align="start">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Condición</Label>
              <Select value={condicionFilter} onValueChange={setCondicionFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="ÓPTIMO">Óptimo</SelectItem>
                  <SelectItem value="PRÓXIMO_VENCER">Próximo a vencer</SelectItem>
                  <SelectItem value="VENCIDO">Vencido</SelectItem>
                  <SelectItem value="DEFECTO_ESTÉTICO">Defecto estético</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Vence en</Label>
              <Select value={venceFilter} onValueChange={setVenceFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="7">7 días</SelectItem>
                  <SelectItem value="15">15 días</SelectItem>
                  <SelectItem value="30">30 días</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(condicionFilter !== "all" || venceFilter !== "all") && (
              <Button variant="ghost" size="sm" className="w-full" onClick={() => { setCondicionFilter("all"); setVenceFilter("all"); }}>
                Limpiar filtros
              </Button>
            )}
          </PopoverContent>
        </Popover>
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
                  No hay lotes para los filtros seleccionados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between px-4 py-3 border-t bg-slate-50/50">
          <p className="text-xs text-muted-foreground">{table.getFilteredRowModel().rows.length} lote(s)</p>
        </div>
      </div>

      {/* Lot Detail Sheet */}
      <Sheet open={!!sheetLote} onOpenChange={() => setSheetLote(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Lote {sheetLote?.numero}
            </SheetTitle>
          </SheetHeader>

          {sheetLote && (
            <div className="mt-6 space-y-6">
              {/* Info card */}
              <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/50 p-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Fabricado</p>
                  <p className="text-sm font-medium mt-0.5">{sheetLote.fechaFabricacion}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Vence</p>
                  <p className="text-sm font-medium mt-0.5">{sheetLote.fechaVencimiento}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Días restantes</p>
                  <p className={cn("text-sm mt-0.5", diasColor(sheetLote.diasRestantes))}>
                    {sheetLote.diasRestantes < 0
                      ? `${Math.abs(sheetLote.diasRestantes)} días vencido`
                      : `${sheetLote.diasRestantes} día${sheetLote.diasRestantes !== 1 ? "s" : ""}`}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Condición</p>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-0.5 ${condicionStyles[sheetLote.condicion]}`}>
                    {condicionLabels[sheetLote.condicion]}
                  </span>
                </div>
              </div>

              {/* Products */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Productos en este lote</h3>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="text-[11px] font-medium text-muted-foreground uppercase">Producto</TableHead>
                        <TableHead className="text-[11px] font-medium text-muted-foreground uppercase text-right">Original</TableHead>
                        <TableHead className="text-[11px] font-medium text-muted-foreground uppercase text-right">Disp.</TableHead>
                        <TableHead className="text-[11px] font-medium text-muted-foreground uppercase text-right">Desp.</TableHead>
                        <TableHead className="text-[11px] font-medium text-muted-foreground uppercase text-right">Dev.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sheetProductos.map((p, i) => (
                        <TableRow key={i} className="h-10">
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">{p.nombre}</p>
                              <p className="text-[11px] text-muted-foreground font-mono">{p.sku}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-right text-muted-foreground">{p.cantidadOriginal}</TableCell>
                          <TableCell className="text-sm text-right font-medium">{p.cantidadDisponible}</TableCell>
                          <TableCell className="text-sm text-right text-muted-foreground">{p.despachado}</TableCell>
                          <TableCell className="text-sm text-right text-muted-foreground">{p.devuelto}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Movements */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Historial de movimientos</h3>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="text-[11px] font-medium text-muted-foreground uppercase">Fecha</TableHead>
                        <TableHead className="text-[11px] font-medium text-muted-foreground uppercase">Tipo</TableHead>
                        <TableHead className="text-[11px] font-medium text-muted-foreground uppercase">Ref.</TableHead>
                        <TableHead className="text-[11px] font-medium text-muted-foreground uppercase text-right">Cant.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sheetMovimientos.map((m, i) => (
                        <TableRow key={i} className="h-10">
                          <TableCell className="text-sm text-muted-foreground">{m.fecha}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${movTipoStyles[m.tipo] || "bg-slate-100 text-slate-600"}`}>
                              {m.tipo}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">{m.referencia}</p>
                              <p className="text-[11px] text-muted-foreground">{m.detalle}</p>
                            </div>
                          </TableCell>
                          <TableCell className={cn("text-sm text-right font-medium", m.cantidad > 0 ? "text-success" : "text-foreground")}>
                            {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
