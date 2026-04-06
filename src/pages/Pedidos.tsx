import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
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
  AlertTriangle,
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
import { useLotes } from "@/contexts/LotesContext";

interface PedidoProducto {
  sku: string;
  nombre: string;
  cantidad: number;
}

interface Pedido {
  id: string;
  numero: string;
  cliente: string;
  canal: string;
  ruta: string | null;
  fechaPedido: string;
  fechaEntrega: string;
  urgencia: "HOY" | "MAÑANA" | string;
  estado: string;
  total: string;
  origen: "INTERNO" | "PORTAL";
  creadoPor: string | null;
  productos: PedidoProducto[];
}

const mockData: Pedido[] = [
  {
    id: "1", numero: "PED-2026-0045", cliente: "Bodega San Martín", canal: "Tradicional",
    ruta: "LIM-01", fechaPedido: "2026-03-18", fechaEntrega: "2026-03-20", urgencia: "HOY", estado: "PENDIENTE",
    total: "S/ 480", origen: "PORTAL", creadoPor: null,
    productos: [
      { sku: "PAN-CL-900", nombre: "Panetón Clásico 900g", cantidad: 10 },
      { sku: "KEK-MAR-400", nombre: "Keke Marmoleado 400g", cantidad: 5 },
    ],
  },
  {
    id: "2", numero: "PED-2026-0044", cliente: "Supermercados Plaza", canal: "Moderno",
    ruta: null, fechaPedido: "2026-03-18", fechaEntrega: "2026-03-20", urgencia: "HOY", estado: "PENDIENTE",
    total: "S/ 1,850", origen: "INTERNO", creadoPor: "Juan López",
    productos: [
      { sku: "PAN-MOL-INT", nombre: "Pan de Molde Integral", cantidad: 20 },
      { sku: "BIZ-VAN-500", nombre: "Bizcocho Vainilla 500g", cantidad: 15 },
    ],
  },
  {
    id: "3", numero: "PED-2026-0043", cliente: "Distribuidora Lima", canal: "Directa",
    ruta: null, fechaPedido: "2026-03-17", fechaEntrega: "2026-03-21", urgencia: "MAÑANA", estado: "PENDIENTE",
    total: "S/ 3,200", origen: "INTERNO", creadoPor: "Pedro Soto",
    productos: [
      { sku: "PAN-CL-900", nombre: "Panetón Clásico 900g", cantidad: 50 },
    ],
  },
  {
    id: "4", numero: "PED-2026-0042", cliente: "Restaurant El Buen Sabor", canal: "Corporativo",
    ruta: null, fechaPedido: "2026-03-16", fechaEntrega: "2026-03-22", urgencia: "22/03", estado: "PENDIENTE",
    total: "S/ 950", origen: "PORTAL", creadoPor: null,
    productos: [
      { sku: "EMP-CAR-4", nombre: "Empanada de Carne x4", cantidad: 15 },
    ],
  },
  {
    id: "5", numero: "PED-2026-0041", cliente: "Bodega La Cruz", canal: "Tradicional",
    ruta: "PRV-01", fechaPedido: "2026-03-15", fechaEntrega: "2026-03-23", urgencia: "23/03", estado: "PENDIENTE",
    total: "S/ 720", origen: "INTERNO", creadoPor: "María Torres",
    productos: [
      { sku: "GAL-SOD-6", nombre: "Galleta Soda x6", cantidad: 10 },
    ],
  },
  // CONFIRMADO orders
  {
    id: "6", numero: "PED-2026-0040", cliente: "Minimarket Los Olivos", canal: "Tradicional",
    ruta: "LIM-01", fechaPedido: "2026-03-14", fechaEntrega: "2026-03-18", urgencia: "18/03", estado: "CONFIRMADO",
    total: "S/ 1,100", origen: "PORTAL", creadoPor: null,
    productos: [{ sku: "PAN-CL-900", nombre: "Panetón Clásico 900g", cantidad: 30 }],
  },
  {
    id: "7", numero: "PED-2026-0039", cliente: "Cevichería Marina", canal: "Corporativo",
    ruta: null, fechaPedido: "2026-03-13", fechaEntrega: "2026-03-17", urgencia: "17/03", estado: "CONFIRMADO",
    total: "S/ 620", origen: "INTERNO", creadoPor: "Juan López",
    productos: [{ sku: "TOR-HEL-1K", nombre: "Torta Helada 1kg", cantidad: 8 }],
  },
  {
    id: "8", numero: "PED-2026-0038", cliente: "Panadería Central", canal: "Directa",
    ruta: "LIM-02", fechaPedido: "2026-03-12", fechaEntrega: "2026-03-16", urgencia: "16/03", estado: "LISTO_DESPACHO",
    total: "S/ 2,400", origen: "INTERNO", creadoPor: "Pedro Soto",
    productos: [{ sku: "PAN-FRA-10", nombre: "Pan Francés (bolsa x10)", cantidad: 40 }],
  },
  // CANCELADO / RECHAZADO
  {
    id: "9", numero: "PED-2026-0037", cliente: "Bodega El Sol", canal: "Tradicional",
    ruta: null, fechaPedido: "2026-03-11", fechaEntrega: "2026-03-15", urgencia: "15/03", estado: "CANCELADO",
    total: "S/ 350", origen: "PORTAL", creadoPor: null,
    productos: [{ sku: "GAL-SOD-6", nombre: "Galleta Soda x6", cantidad: 5 }],
  },
  {
    id: "10", numero: "PED-2026-0036", cliente: "Hotel Gran Vista", canal: "Corporativo",
    ruta: null, fechaPedido: "2026-03-10", fechaEntrega: "2026-03-14", urgencia: "14/03", estado: "RECHAZADO",
    total: "S/ 4,500", origen: "INTERNO", creadoPor: "María Torres",
    productos: [{ sku: "PAN-CL-900", nombre: "Panetón Clásico 900g", cantidad: 100 }],
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

const estadoColors: Record<string, string> = {
  PENDIENTE: "bg-amber-100 text-amber-700",
  CONFIRMADO: "bg-blue-100 text-blue-700",
  LISTO_DESPACHO: "bg-green-100 text-green-700",
  CANCELADO: "bg-red-100 text-red-700",
  RECHAZADO: "bg-slate-100 text-slate-500",
};

const urgenciaStyle = (u: string) => {
  if (u === "HOY") return "bg-red-100 text-red-700";
  if (u === "MAÑANA") return "bg-amber-100 text-amber-700";
  return "";
};

export default function Pedidos() {
  const [searchParams] = useSearchParams();
  const estadoParam = searchParams.get("estado");
  const isBandeja = estadoParam === "PENDIENTE";

  const [data, setData] = useState(mockData);
  const [sorting, setSorting] = useState<SortingState>(
    isBandeja ? [{ id: "urgencia", desc: false }] : [{ id: "fechaPedido", desc: true }]
  );
  const [globalFilter, setGlobalFilter] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<Pedido | null>(null);
  const [rejectDialog, setRejectDialog] = useState<Pedido | null>(null);
  const [rejectMotivo, setRejectMotivo] = useState("");

  const { checkFifo, applyFifo } = useLotes();

  const filteredData = useMemo(() => {
    if (!estadoParam) return data;
    return data.filter((p) => p.estado === estadoParam);
  }, [data, estadoParam]);

  const pendingCount = data.filter((p) => p.estado === "PENDIENTE").length;

  // FIFO check when opening confirm dialog
  const fifoResult = useMemo(() => {
    if (!confirmDialog) return null;
    return checkFifo(confirmDialog.productos);
  }, [confirmDialog, checkFifo]);

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
      ...(!isBandeja ? [{
        accessorKey: "fechaPedido" as const,
        header: ({ column }: any) => (
          <button className="flex items-center gap-1" onClick={() => column.toggleSorting()}>
            F. Pedido <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }: any) => <span className="text-sm text-muted-foreground">{row.original.fechaPedido}</span>,
      }] as ColumnDef<Pedido>[] : []),
      {
        accessorKey: "urgencia",
        header: ({ column }) => (
          <button className="flex items-center gap-1" onClick={() => column.toggleSorting()}>
            Entrega <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        sortingFn: (rowA, rowB) => {
          const stateOrder = (s: string) => s === "PENDIENTE" ? 0 : 1;
          const sDiff = stateOrder(rowA.original.estado) - stateOrder(rowB.original.estado);
          if (sDiff !== 0) return sDiff;
          return rowA.original.fechaEntrega.localeCompare(rowB.original.fechaEntrega);
        },
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
          return (
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${estadoColors[e] || "bg-slate-100 text-slate-600"}`}>
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
    [isBandeja]
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
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  const handleConfirm = () => {
    if (!confirmDialog) return;
    const lotesAfectados = applyFifo(confirmDialog.productos, confirmDialog.numero);
    setData((prev) =>
      prev.map((p) => p.id === confirmDialog.id ? { ...p, estado: "CONFIRMADO" } : p)
    );
    toast.success(`Pedido ${confirmDialog.numero} confirmado. Stock actualizado en ${lotesAfectados} lote(s).`);
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
        <h1 className="text-2xl font-semibold text-foreground">
          {isBandeja ? "Bandeja de Pedidos" : "Todos los Pedidos"}
        </h1>
        {isBandeja && (
          <p className="text-sm font-medium text-warning mt-1">
            {pendingCount} pedidos pendientes de confirmación
          </p>
        )}
        {!isBandeja && (
          <p className="text-sm text-muted-foreground mt-1">
            Historial completo de pedidos
          </p>
        )}
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
        {isBandeja && (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            Estado: PENDIENTE
          </Badge>
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
                  No hay pedidos.
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

          {/* FIFO stock warnings */}
          {fifoResult && !fifoResult.success && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 space-y-2">
              {fifoResult.warnings.map((w) => (
                <div key={w.sku} className="flex items-start gap-2 text-sm text-red-700">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    Stock insuficiente para <strong>{w.nombre}</strong>: necesitas {w.needed}u, disponible {w.available}u. ¿Confirmar de todas formas?
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Product summary */}
          {confirmDialog && (
            <div className="rounded-md bg-muted/50 p-3">
              <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Productos del pedido</p>
              {confirmDialog.productos.map((p) => (
                <div key={p.sku} className="flex justify-between text-sm py-0.5">
                  <span>{p.nombre}</span>
                  <span className="font-medium">{p.cantidad}u</span>
                </div>
              ))}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            {fifoResult && !fifoResult.success ? (
              <AlertDialogAction
                onClick={handleConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Confirmar de todas formas
              </AlertDialogAction>
            ) : (
              <AlertDialogAction onClick={handleConfirm}>Confirmar pedido</AlertDialogAction>
            )}
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
