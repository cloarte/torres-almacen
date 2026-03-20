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
  Search,
  ArrowUpDown,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { CalendarIcon } from "lucide-react";

// ---------- Types ----------

interface Despacho {
  id: string;
  numero: string;
  ruta: string;
  vendedor: string;
  fecha: string;
  numPedidos: number;
  totalBultos: number;
  estado: "PLANIFICADO" | "EN_RUTA" | "COMPLETADO" | "CON_RETORNOS";
}

// ---------- Mock data ----------

const mockDespachos: Despacho[] = [
  {
    id: "1",
    numero: "DSP-2026-0018",
    ruta: "LIM-01",
    vendedor: "Juan López",
    fecha: "2026-03-20",
    numPedidos: 5,
    totalBultos: 28,
    estado: "EN_RUTA",
  },
  {
    id: "2",
    numero: "DSP-2026-0017",
    ruta: "LIM-02",
    vendedor: "Pedro Soto",
    fecha: "2026-03-20",
    numPedidos: 4,
    totalBultos: 22,
    estado: "PLANIFICADO",
  },
  {
    id: "3",
    numero: "DSP-2026-0016",
    ruta: "PRV-01",
    vendedor: "María Torres",
    fecha: "2026-03-19",
    numPedidos: 8,
    totalBultos: 45,
    estado: "CON_RETORNOS",
  },
];

const RUTAS = ["LIM-01", "LIM-02", "PRV-01"];
const ESTADOS: Despacho["estado"][] = ["PLANIFICADO", "EN_RUTA", "COMPLETADO", "CON_RETORNOS"];

const estadoStyles: Record<string, string> = {
  PLANIFICADO: "bg-slate-100 text-slate-600",
  EN_RUTA: "bg-blue-100 text-blue-700",
  COMPLETADO: "bg-green-100 text-green-700",
  CON_RETORNOS: "bg-amber-100 text-amber-700",
};

const estadoLabels: Record<string, string> = {
  PLANIFICADO: "PLANIFICADO",
  EN_RUTA: "EN RUTA",
  COMPLETADO: "COMPLETADO",
  CON_RETORNOS: "CON RETORNOS",
};

// Mock: pedidos listos sin despacho
const pedidosSinDespacho = 3;

// ---------- Component ----------

export default function Despachos() {
  const navigate = useNavigate();
  const [data, setData] = useState(mockDespachos);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [dateFilter, setDateFilter] = useState<Date | undefined>(new Date(2026, 2, 20));
  const [rutaFilter, setRutaFilter] = useState("all");
  const [estadoFilter, setEstadoFilter] = useState("all");
  const [enRutaTarget, setEnRutaTarget] = useState<Despacho | null>(null);

  const filteredData = useMemo(() => {
    return data.filter((d) => {
      if (dateFilter) {
        const dDate = d.fecha;
        const fDate = format(dateFilter, "yyyy-MM-dd");
        if (dDate !== fDate) return false;
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
      {
        accessorKey: "ruta",
        header: "Ruta",
        cell: ({ row }) => (
          <span className="text-sm font-medium">{row.original.ruta}</span>
        ),
      },
      {
        accessorKey: "vendedor",
        header: "Vendedor",
      },
      {
        accessorKey: "fecha",
        header: ({ column }) => (
          <button className="flex items-center gap-1" onClick={() => column.toggleSorting()}>
            Fecha <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => {
          const today = "2026-03-20";
          const yesterday = "2026-03-19";
          const f = row.original.fecha;
          if (f === today) return <span className="text-sm">Hoy</span>;
          if (f === yesterday) return <span className="text-sm text-muted-foreground">Ayer</span>;
          return <span className="text-sm text-muted-foreground">{f}</span>;
        },
      },
      {
        accessorKey: "numPedidos",
        header: "N° pedidos",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.numPedidos} pedidos</span>
        ),
      },
      {
        accessorKey: "totalBultos",
        header: "Total bultos",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.totalBultos} bultos</span>
        ),
      },
      {
        accessorKey: "estado",
        header: "Estado",
        cell: ({ row }) => {
          const e = row.original.estado;
          return (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${estadoStyles[e]}`}
            >
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
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Ver detalle">
                <Eye className="h-4 w-4" />
              </Button>
              {d.estado === "PLANIFICADO" && (
                <>
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-blue-600 hover:text-blue-600"
                    title="Marcar En Ruta"
                    onClick={() => setEnRutaTarget(d)}
                  >
                    <Truck className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
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

  const handleMarkEnRuta = () => {
    if (!enRutaTarget) return;
    setData((prev) =>
      prev.map((d) => (d.id === enRutaTarget.id ? { ...d, estado: "EN_RUTA" as const } : d)),
    );
    toast.success(`${enRutaTarget.numero} marcado EN RUTA.`);
    setEnRutaTarget(null);
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
        {/* Date picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[180px] justify-start text-left font-normal",
                !dateFilter && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFilter ? format(dateFilter, "dd/MM/yyyy") : "Fecha"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateFilter}
              onSelect={setDateFilter}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        {/* Ruta */}
        <Select value={rutaFilter} onValueChange={setRutaFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Ruta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las rutas</SelectItem>
            {RUTAS.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Estado */}
        <Select value={estadoFilter} onValueChange={setEstadoFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {ESTADOS.map((e) => (
              <SelectItem key={e} value={e}>
                {estadoLabels[e]}
              </SelectItem>
            ))}
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
                  <TableHead
                    key={header.id}
                    className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
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
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No hay despachos para los filtros seleccionados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between px-4 py-3 border-t bg-slate-50/50">
          <p className="text-xs text-muted-foreground">
            {table.getFilteredRowModel().rows.length} despacho(s)
          </p>
        </div>
      </div>

      {/* Mark EN_RUTA Dialog */}
      <AlertDialog open={!!enRutaTarget} onOpenChange={() => setEnRutaTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Marcar despacho en ruta?</AlertDialogTitle>
            <AlertDialogDescription>
              El despacho {enRutaTarget?.numero} ({enRutaTarget?.ruta}) pasará a estado EN
              RUTA. El vendedor será notificado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleMarkEnRuta}>Marcar en ruta</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
