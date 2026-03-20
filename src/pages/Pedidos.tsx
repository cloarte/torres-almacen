import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type ColumnDef,
  type SortingState,
  flexRender,
} from "@tanstack/react-table";
import {
  Eye,
  CheckCircle,
  Pencil,
  X,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Pedido {
  id: string;
  numero: string;
  cliente: string;
  canal: string;
  ruta: string | null;
  fechaEntrega: string;
  urgencia: "HOY" | "MAÑANA" | string;
  estado: string;
  total: string;
  origen: "INTERNO" | "PORTAL";
  creadoPor: string | null;
}

const mockData: Pedido[] = [
  {
    id: "1", numero: "PED-2026-0045", cliente: "Bodega San Martín", canal: "Tradicional",
    ruta: "LIM-01", fechaEntrega: "2026-03-20", urgencia: "HOY", estado: "PENDIENTE",
    total: "S/ 480", origen: "PORTAL", creadoPor: null,
  },
  {
    id: "2", numero: "PED-2026-0044", cliente: "Supermercados Plaza", canal: "Moderno",
    ruta: null, fechaEntrega: "2026-03-20", urgencia: "HOY", estado: "PENDIENTE",
    total: "S/ 1,850", origen: "INTERNO", creadoPor: "Juan López",
  },
  {
    id: "3", numero: "PED-2026-0043", cliente: "Distribuidora Lima", canal: "Directa",
    ruta: null, fechaEntrega: "2026-03-21", urgencia: "MAÑANA", estado: "PENDIENTE",
    total: "S/ 3,200", origen: "INTERNO", creadoPor: "Pedro Soto",
  },
  {
    id: "4", numero: "PED-2026-0042", cliente: "Restaurant El Buen Sabor", canal: "Corporativo",
    ruta: null, fechaEntrega: "2026-03-22", urgencia: "22/03", estado: "PENDIENTE",
    total: "S/ 950", origen: "PORTAL", creadoPor: null,
  },
  {
    id: "5", numero: "PED-2026-0041", cliente: "Bodega La Cruz", canal: "Tradicional",
    ruta: "PRV-01", fechaEntrega: "2026-03-23", urgencia: "23/03", estado: "PENDIENTE",
    total: "S/ 720", origen: "INTERNO", creadoPor: "María Torres",
  },
];

const canalColors: Record<string, string> = {
  Tradicional: "bg-blue-100 text-blue-700",
  Moderno: "bg-emerald-100 text-emerald-700",
  Directa: "bg-violet-100 text-violet-700",
  Corporativo: "bg-orange-100 text-orange-700",
};

const origenColors: Record<string, string> = {
  INTERNO: "bg-purple-100 text-purple-700",
  PORTAL: "bg-teal-100 text-teal-700",
};

const urgenciaStyle = (u: string) => {
  if (u === "HOY") return "bg-red-100 text-red-700";
  if (u === "MAÑANA") return "bg-amber-100 text-amber-700";
  return "";
};

export default function Pedidos() {
  const [data, setData] = useState(mockData);
  const [sorting, setSorting] = useState<SortingState>([{ id: "urgencia", desc: false }]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<Pedido | null>(null);
  const [rejectDialog, setRejectDialog] = useState<Pedido | null>(null);
  const [rejectMotivo, setRejectMotivo] = useState("");

  const pendingCount = data.filter((p) => p.estado === "PENDIENTE").length;

  const columns = useMemo<ColumnDef<Pedido>[]>(
    () => [
      {
        accessorKey: "numero",
        header: ({ column }) => (
          <button className="flex items-center gap-1" onClick={() => column.toggleSorting()}>
            N° Pedido <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => <span className="font-medium text-foreground">{row.original.numero}</span>,
      },
      {
        accessorKey: "cliente",
        header: "Cliente",
      },
      {
        accessorKey: "canal",
        header: "Canal",
        cell: ({ row }) => (
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${canalColors[row.original.canal] || "bg-slate-100 text-slate-600"}`}>
            {row.original.canal}
          </span>
        ),
      },
      {
        accessorKey: "ruta",
        header: "Ruta",
        cell: ({ row }) => row.original.ruta ? (
          <span className="text-muted-foreground">{row.original.ruta}</span>
        ) : <span className="text-slate-300">—</span>,
      },
      {
        accessorKey: "urgencia",
        header: ({ column }) => (
          <button className="flex items-center gap-1" onClick={() => column.toggleSorting()}>
            Entrega <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => {
          const u = row.original.urgencia;
          const cls = urgenciaStyle(u);
          return cls ? (
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${cls}`}>{u}</span>
          ) : (
            <span className="text-muted-foreground text-sm">{u}</span>
          );
        },
      },
      {
        accessorKey: "estado",
        header: "Estado",
        cell: ({ row }) => {
          const e = row.original.estado;
          const map: Record<string, string> = {
            PENDIENTE: "bg-amber-100 text-amber-700",
            CONFIRMADO: "bg-blue-100 text-blue-700",
            LISTO_DESPACHO: "bg-green-100 text-green-700",
            CANCELADO: "bg-red-100 text-red-700",
            RECHAZADO: "bg-slate-100 text-slate-500",
          };
          return (
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[e] || "bg-slate-100 text-slate-600"}`}>
              {e}
            </span>
          );
        },
      },
      {
        accessorKey: "total",
        header: "Total c/IGV",
        cell: ({ row }) => <span className="font-medium">{row.original.total}</span>,
      },
      {
        accessorKey: "origen",
        header: "Origen",
        cell: ({ row }) => (
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${origenColors[row.original.origen]}`}>
            {row.original.origen}
          </span>
        ),
      },
      {
        accessorKey: "creadoPor",
        header: "Creado por",
        cell: ({ row }) => row.original.creadoPor ? (
          <span className="text-sm">{row.original.creadoPor}</span>
        ) : <span className="text-slate-300">—</span>,
      },
      {
        id: "acciones",
        header: "Acciones",
        cell: ({ row }) => {
          const p = row.original;
          if (p.estado !== "PENDIENTE") return null;
          return (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Ver detalle">
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost" size="icon"
                className="h-8 w-8 text-success hover:text-success"
                title="Confirmar"
                onClick={() => setConfirmDialog(p)}
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Modificar">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost" size="icon"
                className="h-8 w-8 text-danger hover:text-danger"
                title="Rechazar"
                onClick={() => { setRejectMotivo(""); setRejectDialog(p); }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  const handleConfirm = () => {
    if (!confirmDialog) return;
    setData((prev) =>
      prev.map((p) => p.id === confirmDialog.id ? { ...p, estado: "CONFIRMADO" } : p)
    );
    toast.success(`Pedido ${confirmDialog.numero} confirmado. Precios congelados.`);
    setConfirmDialog(null);
  };

  const handleReject = () => {
    if (!rejectDialog || !rejectMotivo.trim()) return;
    setData((prev) =>
      prev.map((p) => p.id === rejectDialog.id ? { ...p, estado: "RECHAZADO" } : p)
    );
    toast.success(`Pedido ${rejectDialog.numero} rechazado.`);
    setRejectDialog(null);
    setRejectMotivo("");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Bandeja de Pedidos</h1>
        <p className="text-sm font-medium text-warning mt-1">
          {pendingCount} pedidos pendientes de confirmación
        </p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por N° pedido o cliente..."
            className="pl-9 bg-card"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
        </div>
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
          Estado: PENDIENTE
        </Badge>
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
                  No hay pedidos pendientes.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t bg-slate-50/50">
          <p className="text-xs text-muted-foreground">
            {table.getFilteredRowModel().rows.length} pedido(s)
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground">
              Pág. {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
            </span>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      <AlertDialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              Confirmar pedido {confirmDialog?.numero} de {confirmDialog?.cliente} por {confirmDialog?.total}.
              <br />Los precios quedarán congelados al confirmar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>Confirmar pedido</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={!!rejectDialog} onOpenChange={() => setRejectDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Rechazar pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción notificará al cliente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <label className="text-sm font-medium">
              Motivo de rechazo <span className="text-danger">*</span>
            </label>
            <Textarea
              className="mt-1.5"
              placeholder="Escribe el motivo..."
              value={rejectMotivo}
              onChange={(e) => setRejectMotivo(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={!rejectMotivo.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Rechazar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
