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
  Truck,
  Eye,
  Pencil,
  ArrowUpDown,
  AlertTriangle,
  Printer,
  FilePlus,
  CalendarIcon,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ---------- Types ----------

type EstadoDespacho = "PLANIFICADO" | "OBSERVADO" | "EN_RUTA";

interface GuiaProducto {
  producto: string;
  sku: string;
  lotes: string;
  condicion: string;
  cantidad: number;
}

interface Despacho {
  id: string;
  numero: string;
  ruta: string;
  vendedor: string;
  canal: string;
  fecha: string;
  numPedidos: number;
  totalBultos: number;
  totalValor: string;
  estado: EstadoDespacho;
  productos: GuiaProducto[];
}

// ---------- Mock data ----------

const mockDespachos: Despacho[] = [
  {
    id: "1",
    numero: "DSP-2026-0018",
    ruta: "LIM-01",
    vendedor: "Juan López",
    canal: "Tradicional",
    fecha: "2026-03-20",
    numPedidos: 5,
    totalBultos: 28,
    totalValor: "6,480",
    estado: "EN_RUTA",
    productos: [
      { producto: "Panetón Clásico 900g", sku: "PAN-CL-900", lotes: "L-2026-001 / L-2026-003", condicion: "ÓPTIMO", cantidad: 48 },
      { producto: "Pan de Molde Integral", sku: "PAN-MOL-INT", lotes: "L-2026-008 / L-2026-010", condicion: "ÓPTIMO", cantidad: 24 },
      { producto: "Galleta Soda x6", sku: "GAL-SOD-6", lotes: "L-2026-020", condicion: "ÓPTIMO", cantidad: 12 },
    ],
  },
  {
    id: "2",
    numero: "DSP-2026-0017",
    ruta: "LIM-02",
    vendedor: "Pedro Soto",
    canal: "Tradicional",
    fecha: "2026-03-20",
    numPedidos: 4,
    totalBultos: 22,
    totalValor: "4,250",
    estado: "PLANIFICADO",
    productos: [
      { producto: "Bizcocho Vainilla 500g", sku: "BIZ-VAN-500", lotes: "L-2026-015", condicion: "ÓPTIMO", cantidad: 16 },
      { producto: "Keke Marmoleado 400g", sku: "KEK-MAR-400", lotes: "L-2026-009", condicion: "DEFECTO_ESTÉTICO", cantidad: 10 },
    ],
  },
  {
    id: "3",
    numero: "DSP-2026-0016",
    ruta: "LIM-03",
    vendedor: "Carlos Ríos",
    canal: "Tradicional",
    fecha: "2026-03-20",
    numPedidos: 3,
    totalBultos: 18,
    totalValor: "3,180",
    estado: "OBSERVADO",
    productos: [
      { producto: "Panetón Clásico 900g", sku: "PAN-CL-900", lotes: "L-2026-001", condicion: "ÓPTIMO", cantidad: 15 },
      { producto: "Keke Marmoleado 400g", sku: "KEK-MAR-400", lotes: "L-2026-009", condicion: "ÓPTIMO", cantidad: 9 },
      { producto: "Pan de Molde Integral", sku: "PAN-MOL-INT", lotes: "L-2026-010", condicion: "ÓPTIMO", cantidad: 15 },
    ],
  },
];

const RUTAS = ["LIM-01", "LIM-02", "LIM-03", "PRV-01"];
const ESTADOS: EstadoDespacho[] = ["PLANIFICADO", "OBSERVADO", "EN_RUTA"];

const estadoStyles: Record<EstadoDespacho, string> = {
  PLANIFICADO: "bg-blue-100 text-blue-700",
  OBSERVADO: "bg-amber-100 text-amber-700",
  EN_RUTA: "bg-green-100 text-green-700",
};

const estadoLabels: Record<EstadoDespacho, string> = {
  PLANIFICADO: "PLANIFICADO",
  OBSERVADO: "OBSERVADO",
  EN_RUTA: "EN RUTA",
};

const pedidosSinDespacho = 3;

// ---------- Component ----------

export default function Despachos() {
  const navigate = useNavigate();
  const [data] = useState(mockDespachos);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [dateFilter, setDateFilter] = useState<Date | undefined>(new Date(2026, 2, 20));
  const [rutaFilter, setRutaFilter] = useState("all");
  const [estadoFilter, setEstadoFilter] = useState("all");
  const [printDespacho, setPrintDespacho] = useState<Despacho | null>(null);

  const filteredData = useMemo(() => {
    return data.filter((d) => {
      if (dateFilter) {
        const fDate = format(dateFilter, "yyyy-MM-dd");
        if (d.fecha !== fDate) return false;
      }
      if (rutaFilter !== "all" && d.ruta !== rutaFilter) return false;
      if (estadoFilter !== "all" && d.estado !== estadoFilter) return false;
      return true;
    });
  }, [data, dateFilter, rutaFilter, estadoFilter]);

  const columns = useMemo<ColumnDef<Despacho>[]>(
    () => [
      {
        accessorKey: "numero",
        header: ({ column }) => (
          <button className="flex items-center gap-1" onClick={() => column.toggleSorting()}>
            N° Despacho <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="font-medium text-foreground">{row.original.numero}</span>
        ),
      },
      { accessorKey: "ruta", header: "Ruta", cell: ({ row }) => <span className="text-sm font-medium">{row.original.ruta}</span> },
      { accessorKey: "vendedor", header: "Vendedor" },
      {
        accessorKey: "fecha",
        header: ({ column }) => (
          <button className="flex items-center gap-1" onClick={() => column.toggleSorting()}>
            Fecha <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => {
          const f = row.original.fecha;
          if (f === "2026-03-20") return <span className="text-sm">Hoy</span>;
          if (f === "2026-03-19") return <span className="text-sm text-muted-foreground">Ayer</span>;
          return <span className="text-sm text-muted-foreground">{f}</span>;
        },
      },
      { accessorKey: "numPedidos", header: "N° pedidos", cell: ({ row }) => <span className="text-sm">{row.original.numPedidos} pedidos</span> },
      { accessorKey: "totalBultos", header: "Total bultos", cell: ({ row }) => <span className="text-sm">{row.original.totalBultos} bultos</span> },
      {
        accessorKey: "estado",
        header: "Estado",
        cell: ({ row }) => {
          const e = row.original.estado;
          return (
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${estadoStyles[e]}`}>
              {estadoLabels[e]}
            </span>
          );
        },
      },
      {
        id: "acciones",
        header: "Acciones",
        cell: ({ row }) => {
          const d = row.original;
          return (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Ver detalle"
                onClick={() => navigate(`/entrega/despachos/${d.id}`)}
              >
                <Eye className="h-4 w-4" />
              </Button>

              {d.estado === "PLANIFICADO" && (
                <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar">
                  <Pencil className="h-4 w-4" />
                </Button>
              )}

              {d.estado === "OBSERVADO" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                  title="Completar despacho"
                  onClick={() => navigate(`/entrega/despachos/${d.id}/completar`)}
                >
                  <FilePlus className="h-4 w-4" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Imprimir guía"
                onClick={() => setPrintDespacho(d)}
              >
                <Printer className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [navigate],
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Despachos</h1>
        <Button onClick={() => navigate("/entrega/despachos/nuevo")} className="gap-2">
          <Truck className="h-4 w-4" />
          Nuevo Despacho
        </Button>
      </div>

      {/* Alert Banner */}
      {pedidosSinDespacho > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="flex-1 text-sm text-amber-800">
            Hay <span className="font-semibold">{pedidosSinDespacho}</span> pedidos listos
            para despacho sin asignar a una ruta. Crea un nuevo despacho.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="border-amber-300 text-amber-700 hover:bg-amber-100"
            onClick={() => navigate("/entrega/despachos/nuevo")}
          >
            Crear despacho
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("w-[180px] justify-start text-left font-normal", !dateFilter && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFilter ? format(dateFilter, "dd/MM/yyyy") : "Fecha"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateFilter} onSelect={setDateFilter} initialFocus className={cn("p-3 pointer-events-auto")} />
          </PopoverContent>
        </Popover>

        <Select value={rutaFilter} onValueChange={setRutaFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Ruta" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las rutas</SelectItem>
            {RUTAS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={estadoFilter} onValueChange={setEstadoFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {ESTADOS.map((e) => <SelectItem key={e} value={e}>{estadoLabels[e]}</SelectItem>)}
          </SelectContent>
        </Select>

        {(dateFilter || rutaFilter !== "all" || estadoFilter !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => {
              setDateFilter(undefined);
              setRutaFilter("all");
              setEstadoFilter("all");
            }}
          >
            Limpiar filtros
          </Button>
        )}
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
                  No hay despachos para los filtros seleccionados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between px-4 py-3 border-t bg-slate-50/50">
          <p className="text-xs text-muted-foreground">{table.getFilteredRowModel().rows.length} despacho(s)</p>
        </div>
      </div>

      {/* Print Guía Modal */}
      <Dialog open={!!printDespacho} onOpenChange={(o) => !o && setPrintDespacho(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Guía de Despacho {printDespacho?.numero}</DialogTitle>
          </DialogHeader>

          {printDespacho && (
            <div id="print-area" className="space-y-4 bg-white p-4 print:p-8">
              {/* Header */}
              <div className="flex items-start justify-between border-b pb-4">
                <div>
                  <div className="h-12 w-32 bg-[#1E3A5F] text-white rounded flex items-center justify-center font-bold">
                    Torres SGV
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Sistema de Gestión de Ventas</p>
                </div>
                <div className="text-right space-y-0.5 text-sm">
                  <p className="font-semibold text-base">{printDespacho.numero}</p>
                  <p><span className="text-muted-foreground">Fecha:</span> {printDespacho.fecha}</p>
                  <p><span className="text-muted-foreground">Vendedor:</span> {printDespacho.vendedor}</p>
                  <p><span className="text-muted-foreground">Ruta:</span> {printDespacho.ruta}</p>
                  <p><span className="text-muted-foreground">Canal:</span> {printDespacho.canal}</p>
                </div>
              </div>

              {/* Products table */}
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="text-xs uppercase">Producto</TableHead>
                    <TableHead className="text-xs uppercase">SKU</TableHead>
                    <TableHead className="text-xs uppercase">Lote(s) asignado(s)</TableHead>
                    <TableHead className="text-xs uppercase">Condición</TableHead>
                    <TableHead className="text-xs uppercase text-right">Cantidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {printDespacho.productos.map((p, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm">{p.producto}</TableCell>
                      <TableCell className="text-sm font-mono text-muted-foreground">{p.sku}</TableCell>
                      <TableCell className="text-sm">{p.lotes}</TableCell>
                      <TableCell className="text-sm">{p.condicion}</TableCell>
                      <TableCell className="text-sm text-right font-medium">{p.cantidad}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Footer */}
              <div className="border-t pt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total bultos:</span>
                  <span className="font-semibold">{printDespacho.totalBultos}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total valor:</span>
                  <span className="font-semibold">S/ {printDespacho.totalValor}</span>
                </div>
                <div className="pt-8">
                  <p className="text-xs text-muted-foreground mb-1">Firma del vendedor:</p>
                  <div className="border-b border-foreground h-10" />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPrintDespacho(null)}>Cerrar</Button>
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              Descargar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
