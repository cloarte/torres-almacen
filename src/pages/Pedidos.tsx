import { useState, useMemo, Fragment } from "react";
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
  CheckCircle,
  X,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
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

// Stock disponible total por SKU (mock)
const stockPorSku: Record<string, number> = {
  "PAN-CL-900": 120,
  "PAN-MOL-BL": 85,
  "EMP-POL-12": 30,
  "CRO-MAN": 0,
  "TOR-3L-1K": 15,
  // SKUs sin stock definido se tratan como 0
};

const mockData: Pedido[] = [
  // PENDIENTE — CUBIERTO (all products have enough stock)
  {
    id: "1", numero: "PED-2026-0045", cliente: "Bodega San Martín", canal: "Tradicional",
    ruta: "LIM-01", fechaPedido: "2026-03-18", fechaEntrega: "2026-03-20", urgencia: "HOY", estado: "PENDIENTE",
    total: "S/ 480", origen: "PORTAL", creadoPor: null,
    productos: [
      { sku: "PAN-CL-900", nombre: "Panetón Clásico 900g", cantidad: 10 },
      { sku: "PAN-MOL-BL", nombre: "Pan de Molde Blanco 500g", cantidad: 20 },
    ],
  },
  // PENDIENTE — CUBIERTO
  {
    id: "2", numero: "PED-2026-0044", cliente: "Supermercados Plaza", canal: "Moderno",
    ruta: null, fechaPedido: "2026-03-18", fechaEntrega: "2026-03-20", urgencia: "HOY", estado: "PENDIENTE",
    total: "S/ 1,850", origen: "INTERNO", creadoPor: "Juan López",
    productos: [
      { sku: "EMP-POL-12", nombre: "Empanada Pollo x12", cantidad: 10 },
      { sku: "TOR-3L-1K", nombre: "Torta Tres Leches 1kg", cantidad: 5 },
    ],
  },
  // PENDIENTE — SIN STOCK (Croissant = 0u)
  {
    id: "3", numero: "PED-2026-0043", cliente: "Distribuidora Lima", canal: "Directa",
    ruta: null, fechaPedido: "2026-03-17", fechaEntrega: "2026-03-21", urgencia: "MAÑANA", estado: "PENDIENTE",
    total: "S/ 3,200", origen: "INTERNO", creadoPor: "Pedro Soto",
    productos: [
      { sku: "PAN-CL-900", nombre: "Panetón Clásico 900g", cantidad: 50 },
      { sku: "CRO-MAN", nombre: "Croissant Mantequilla", cantidad: 40 },
    ],
  },
  // PENDIENTE — SIN STOCK (Torta 15u disponible, piden 25)
  {
    id: "4", numero: "PED-2026-0042", cliente: "Restaurant El Buen Sabor", canal: "Corporativo",
    ruta: null, fechaPedido: "2026-03-16", fechaEntrega: "2026-03-22", urgencia: "22/03", estado: "PENDIENTE",
    total: "S/ 950", origen: "PORTAL", creadoPor: null,
    productos: [
      { sku: "TOR-3L-1K", nombre: "Torta Tres Leches 1kg", cantidad: 25 },
      { sku: "CRO-MAN", nombre: "Croissant Mantequilla", cantidad: 10 },
    ],
  },
  // PENDIENTE — CUBIERTO
  {
    id: "5", numero: "PED-2026-0041", cliente: "Bodega La Cruz", canal: "Tradicional",
    ruta: "PRV-01", fechaPedido: "2026-03-15", fechaEntrega: "2026-03-23", urgencia: "23/03", estado: "PENDIENTE",
    total: "S/ 720", origen: "INTERNO", creadoPor: "María Torres",
    productos: [
      { sku: "PAN-MOL-BL", nombre: "Pan de Molde Blanco 500g", cantidad: 15 },
    ],
  },
  // CONFIRMADO
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
    productos: [{ sku: "TOR-3L-1K", nombre: "Torta Tres Leches 1kg", cantidad: 8 }],
  },
  {
    id: "8", numero: "PED-2026-0038", cliente: "Panadería Central", canal: "Directa",
    ruta: "LIM-02", fechaPedido: "2026-03-12", fechaEntrega: "2026-03-16", urgencia: "16/03", estado: "LISTO_DESPACHO",
    total: "S/ 2,400", origen: "INTERNO", creadoPor: "Pedro Soto",
    productos: [{ sku: "PAN-MOL-BL", nombre: "Pan de Molde Blanco 500g", cantidad: 40 }],
  },
  // CANCELADO / RECHAZADO
  {
    id: "9", numero: "PED-2026-0037", cliente: "Bodega El Sol", canal: "Tradicional",
    ruta: null, fechaPedido: "2026-03-11", fechaEntrega: "2026-03-15", urgencia: "15/03", estado: "CANCELADO",
    total: "S/ 350", origen: "PORTAL", creadoPor: null,
    productos: [{ sku: "EMP-POL-12", nombre: "Empanada Pollo x12", cantidad: 5 }],
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

function getStockDisponible(sku: string): number {
  return stockPorSku[sku] ?? 0;
}

function pedidoHasStockIssue(productos: PedidoProducto[]): boolean {
  return productos.some((p) => getStockDisponible(p.sku) < p.cantidad);
}

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
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { checkFifo, applyFifo } = useLotes();

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredData = useMemo(() => {
    if (!estadoParam) return data;
    return data.filter((p) => p.estado === estadoParam);
  }, [data, estadoParam]);

  const pendingCount = data.filter((p) => p.estado === "PENDIENTE").length;

  const fifoResult = useMemo(() => {
    if (!confirmDialog) return null;
    return checkFifo(confirmDialog.productos);
  }, [confirmDialog, checkFifo]);

  const columns = useMemo<ColumnDef<Pedido>[]>(
    () => [
      ...(isBandeja ? [{
        id: "expander",
        header: () => null,
        cell: ({ row }: any) => {
          const isExpanded = expandedRows.has(row.original.id);
          return (
            <button
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => { e.stopPropagation(); toggleRow(row.original.id); }}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          );
        },
        size: 40,
      }] as ColumnDef<Pedido>[] : []),
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
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost" size="icon"
                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                title="Confirmar"
                onClick={() => setConfirmDialog(p)}
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost" size="icon"
                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
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
    [isBandeja, expandedRows]
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
              table.getRowModel().rows.map((row) => {
                const pedido = row.original;
                const isExpanded = expandedRows.has(pedido.id);
                const hasIssue = isBandeja && pedido.estado === "PENDIENTE" && pedidoHasStockIssue(pedido.productos);
                const rowClass = hasIssue
                  ? "h-12 bg-red-50 border-l-4 border-red-400 hover:bg-red-100/70 transition-colors cursor-pointer"
                  : "h-12 hover:bg-slate-50/70 transition-colors cursor-pointer";

                return (
                  <Fragment key={row.id}>
                    <TableRow
                      className={rowClass}
                      onClick={() => isBandeja && toggleRow(pedido.id)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="text-sm">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                    {isBandeja && isExpanded && (
                      <TableRow className="bg-slate-50/50">
                        <TableCell colSpan={columns.length} className="p-0">
                          <div className="px-8 py-3">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-xs text-muted-foreground uppercase">
                                  <th className="text-left py-1 font-medium">Producto</th>
                                  <th className="text-right py-1 font-medium">Cantidad pedida</th>
                                  <th className="text-right py-1 font-medium">Stock disponible total</th>
                                  <th className="text-right py-1 font-medium">Estado cobertura</th>
                                </tr>
                              </thead>
                              <tbody>
                                {pedido.productos.map((prod) => {
                                  const stockDisp = getStockDisponible(prod.sku);
                                  const cubierto = stockDisp >= prod.cantidad;
                                  return (
                                    <tr key={prod.sku} className="border-t border-slate-100">
                                      <td className="py-2 text-foreground">{prod.nombre}</td>
                                      <td className="py-2 text-right font-medium">{prod.cantidad}u</td>
                                      <td className="py-2 text-right text-muted-foreground">{stockDisp}u</td>
                                      <td className="py-2 text-right">
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                          cubierto ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                        }`}>
                                          {cubierto ? "CUBIERTO" : "SIN STOCK"}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })
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
              Motivo de rechazo <span className="text-red-600">*</span>
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
