import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Truck,
  Pencil,
  ArrowLeftRight,
  ChevronRight,
  ChevronDown,
  Download,
  Package,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ==================== TYPES ====================

type EstadoDespacho = "PLANIFICADO" | "EN_RUTA" | "COMPLETADO" | "CON_RETORNOS";

interface ProductoLote {
  producto: string;
  lote: string;
  fabricado: string;
  vence: string;
  condicion: string;
  clienteDestino: string;
  cantidad: number;
}

interface PedidoDetalle {
  id: string;
  numero: string;
  cliente: string;
  total: string;
  estadoEntrega: string;
  productos: { nombre: string; cantidad: number; unidad: string; lote: string; vence: string }[];
}

interface StockFlotante {
  sku: string;
  nombre: string;
  cantidadExtra: number;
  lote: string;
}

// ==================== MOCK DATA ====================

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

const entregaEstadoStyles: Record<string, string> = {
  PENDIENTE: "bg-amber-100 text-amber-700",
  ENTREGADO: "bg-green-100 text-green-700",
  PARCIAL: "bg-blue-100 text-blue-700",
  RECHAZADO: "bg-red-100 text-red-700",
};

const mockDespacho = {
  numero: "DSP-2026-0018",
  estado: "EN_RUTA" as EstadoDespacho,
  ruta: "LIM-01",
  vendedor: "Juan López",
  fecha: "20/03/2026",
  numPedidos: 5,
  totalBultos: 28,
};

const mockPedidos: PedidoDetalle[] = [
  {
    id: "p1",
    numero: "PED-2026-0045",
    cliente: "Bodega San Martín",
    total: "S/ 480",
    estadoEntrega: "PENDIENTE",
    productos: [
      { nombre: "Panetón Clásico 900g", cantidad: 12, unidad: "und", lote: "L-2026-001", vence: "28/03/26" },
      { nombre: "Pan de Molde Integral", cantidad: 6, unidad: "und", lote: "L-2026-008", vence: "01/04/26" },
      { nombre: "Galleta Soda x6", cantidad: 4, unidad: "paq", lote: "L-2026-020", vence: "30/06/26" },
    ],
  },
  {
    id: "p2",
    numero: "PED-2026-0046",
    cliente: "Bodega La Estrella",
    total: "S/ 320",
    estadoEntrega: "PENDIENTE",
    productos: [
      { nombre: "Bizcocho Vainilla 500g", cantidad: 8, unidad: "und", lote: "L-2026-012", vence: "25/03/26" },
      { nombre: "Keke Marmoleado 400g", cantidad: 4, unidad: "und", lote: "L-2026-022", vence: "30/03/26" },
    ],
  },
  {
    id: "p3",
    numero: "PED-2026-0047",
    cliente: "Tienda Rosales",
    total: "S/ 1,280",
    estadoEntrega: "ENTREGADO",
    productos: [
      { nombre: "Panetón Clásico 900g", cantidad: 20, unidad: "und", lote: "L-2026-001", vence: "28/03/26" },
      { nombre: "Pan Francés (bolsa x10)", cantidad: 8, unidad: "bolsa", lote: "L-2026-030", vence: "21/03/26" },
      { nombre: "Torta Helada 1kg", cantidad: 4, unidad: "und", lote: "L-2026-035", vence: "25/03/26" },
      { nombre: "Empanada de Carne x4", cantidad: 2, unidad: "paq", lote: "L-2026-040", vence: "15/04/26" },
    ],
  },
  {
    id: "p4",
    numero: "PED-2026-0048",
    cliente: "Market Express",
    total: "S/ 2,100",
    estadoEntrega: "PENDIENTE",
    productos: [
      { nombre: "Panetón Clásico 900g", cantidad: 16, unidad: "und", lote: "L-2026-003", vence: "15/04/26" },
      { nombre: "Pan de Molde Integral", cantidad: 18, unidad: "und", lote: "L-2026-010", vence: "22/04/26" },
    ],
  },
  {
    id: "p5",
    numero: "PED-2026-0049",
    cliente: "Bodega Carmela",
    total: "S/ 2,300",
    estadoEntrega: "PARCIAL",
    productos: [
      { nombre: "Galleta Soda x6", cantidad: 8, unidad: "paq", lote: "L-2026-020", vence: "30/06/26" },
      { nombre: "Bizcocho Vainilla 500g", cantidad: 8, unidad: "und", lote: "L-2026-015", vence: "10/05/26" },
      { nombre: "Keke Marmoleado 400g", cantidad: 6, unidad: "und", lote: "L-2026-025", vence: "20/04/26" },
      { nombre: "Pan Francés (bolsa x10)", cantidad: 10, unidad: "bolsa", lote: "L-2026-030", vence: "21/03/26" },
      { nombre: "Empanada de Carne x4", cantidad: 6, unidad: "paq", lote: "L-2026-040", vence: "15/04/26" },
    ],
  },
];

const mockStockFlotante: StockFlotante[] = [
  { sku: "PAN-CL-900", nombre: "Panetón Clásico 900g", cantidadExtra: 10, lote: "L-2026-003" },
  { sku: "GAL-SOD-6", nombre: "Galleta Soda x6", cantidadExtra: 6, lote: "L-2026-020" },
];

const mockTrazabilidad: ProductoLote[] = [
  { producto: "Panetón Clásico 900g", lote: "L-2026-001", fabricado: "10/03/26", vence: "28/03/26", condicion: "PRÓXIMO VENCER", clienteDestino: "Bodega San Martín", cantidad: 12 },
  { producto: "Panetón Clásico 900g", lote: "L-2026-001", fabricado: "10/03/26", vence: "28/03/26", condicion: "PRÓXIMO VENCER", clienteDestino: "Tienda Rosales", cantidad: 20 },
  { producto: "Panetón Clásico 900g", lote: "L-2026-003", fabricado: "15/03/26", vence: "15/04/26", condicion: "ÓPTIMO", clienteDestino: "Market Express", cantidad: 16 },
  { producto: "Pan de Molde Integral", lote: "L-2026-008", fabricado: "08/03/26", vence: "01/04/26", condicion: "ÓPTIMO", clienteDestino: "Bodega San Martín", cantidad: 6 },
  { producto: "Pan de Molde Integral", lote: "L-2026-010", fabricado: "12/03/26", vence: "22/04/26", condicion: "ÓPTIMO", clienteDestino: "Market Express", cantidad: 18 },
  { producto: "Bizcocho Vainilla 500g", lote: "L-2026-012", fabricado: "05/03/26", vence: "25/03/26", condicion: "PRÓXIMO VENCER", clienteDestino: "Bodega La Estrella", cantidad: 8 },
  { producto: "Bizcocho Vainilla 500g", lote: "L-2026-015", fabricado: "14/03/26", vence: "10/05/26", condicion: "ÓPTIMO", clienteDestino: "Bodega Carmela", cantidad: 8 },
  { producto: "Galleta Soda x6", lote: "L-2026-020", fabricado: "01/03/26", vence: "30/06/26", condicion: "ÓPTIMO", clienteDestino: "Bodega San Martín", cantidad: 4 },
  { producto: "Galleta Soda x6", lote: "L-2026-020", fabricado: "01/03/26", vence: "30/06/26", condicion: "ÓPTIMO", clienteDestino: "Bodega Carmela", cantidad: 8 },
  { producto: "Keke Marmoleado 400g", lote: "L-2026-022", fabricado: "06/03/26", vence: "30/03/26", condicion: "PRÓXIMO VENCER", clienteDestino: "Bodega La Estrella", cantidad: 4 },
  { producto: "Keke Marmoleado 400g", lote: "L-2026-025", fabricado: "16/03/26", vence: "20/04/26", condicion: "ÓPTIMO", clienteDestino: "Bodega Carmela", cantidad: 6 },
  { producto: "Pan Francés (bolsa x10)", lote: "L-2026-030", fabricado: "19/03/26", vence: "21/03/26", condicion: "PRÓXIMO VENCER", clienteDestino: "Tienda Rosales", cantidad: 8 },
  { producto: "Pan Francés (bolsa x10)", lote: "L-2026-030", fabricado: "19/03/26", vence: "21/03/26", condicion: "PRÓXIMO VENCER", clienteDestino: "Bodega Carmela", cantidad: 10 },
  { producto: "Torta Helada 1kg", lote: "L-2026-035", fabricado: "17/03/26", vence: "25/03/26", condicion: "PRÓXIMO VENCER", clienteDestino: "Tienda Rosales", cantidad: 4 },
  { producto: "Empanada de Carne x4", lote: "L-2026-040", fabricado: "18/03/26", vence: "15/04/26", condicion: "ÓPTIMO", clienteDestino: "Tienda Rosales", cantidad: 2 },
  { producto: "Empanada de Carne x4", lote: "L-2026-040", fabricado: "18/03/26", vence: "15/04/26", condicion: "ÓPTIMO", clienteDestino: "Bodega Carmela", cantidad: 6 },
];

const mockLoteHistorial = [
  { fecha: "15/03/2026", evento: "Producción finalizada", detalle: "120 unidades fabricadas" },
  { fecha: "16/03/2026", evento: "Ingreso a almacén", detalle: "QC aprobado — condición ÓPTIMO" },
  { fecha: "18/03/2026", evento: "Asignación a despacho DSP-2026-0018", detalle: "48 und asignadas a ruta LIM-01" },
  { fecha: "20/03/2026", evento: "En ruta", detalle: "Vendedor Juan López — 3 clientes destino" },
];

// ==================== SUB-COMPONENTS ====================

function PedidoRow({ pedido }: { pedido: PedidoDetalle }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50/70 transition-colors cursor-pointer border-b last:border-b-0">
          <div className="shrink-0">
            {open ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <span className="text-sm font-medium w-36">{pedido.numero}</span>
          <span className="text-sm flex-1">{pedido.cliente}</span>
          <span className="text-sm font-medium w-24 text-right">{pedido.total}</span>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium w-24 justify-center ${
              entregaEstadoStyles[pedido.estadoEntrega] || "bg-slate-100 text-slate-600"
            }`}
          >
            {pedido.estadoEntrega}
          </span>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-4 pb-3 pl-12">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="text-xs font-medium text-muted-foreground uppercase">Producto</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase text-right">Cant.</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase">Unidad</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase">Lote</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase">Vence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pedido.productos.map((p, i) => (
                <TableRow key={i} className="h-10">
                  <TableCell className="text-sm">{p.nombre}</TableCell>
                  <TableCell className="text-sm text-right font-medium">{p.cantidad}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.unidad}</TableCell>
                  <TableCell>
                    <span className="text-sm text-primary font-medium cursor-pointer hover:underline">
                      {p.lote}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.vence}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ==================== MAIN PAGE ====================

export default function DespachoDetalle() {
  const { id } = useParams();
  const [estado, setEstado] = useState<EstadoDespacho>(mockDespacho.estado);
  const [enRutaDialog, setEnRutaDialog] = useState(false);
  const [loteSheetOpen, setLoteSheetOpen] = useState(false);
  const [selectedLote, setSelectedLote] = useState<string | null>(null);

  const handleMarcarEnRuta = () => {
    setEstado("EN_RUTA");
    toast.success(`${mockDespacho.numero} marcado EN RUTA.`);
    setEnRutaDialog(false);
  };

  const handleExportTrazabilidad = () => {
    toast.success("Exportando trazabilidad a Excel...");
  };

  const openLoteSheet = (lote: string) => {
    setSelectedLote(lote);
    setLoteSheetOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/entrega/despachos">Entrega</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/entrega/despachos">Despachos</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{mockDespacho.numero}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-foreground">
              Despacho {mockDespacho.numero}
            </h1>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${estadoStyles[estado]}`}
            >
              {estadoLabels[estado]}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span>Ruta: <span className="font-medium text-foreground">{mockDespacho.ruta}</span></span>
            <span>Vendedor: <span className="font-medium text-foreground">{mockDespacho.vendedor}</span></span>
            <span>Fecha: <span className="font-medium text-foreground">{mockDespacho.fecha}</span></span>
            <span>{mockDespacho.numPedidos} pedidos · {mockDespacho.totalBultos} bultos</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {estado === "PLANIFICADO" && (
            <>
              <Button variant="outline" className="gap-2">
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
              <Button className="gap-2" onClick={() => setEnRutaDialog(true)}>
                <Truck className="h-4 w-4" />
                Marcar En Ruta
              </Button>
            </>
          )}
          {estado === "EN_RUTA" && (
            <Button variant="outline" className="gap-2">
              <ArrowLeftRight className="h-4 w-4" />
              Ver retornos del día
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pedidos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pedidos">Pedidos y Lotes</TabsTrigger>
          <TabsTrigger value="stock-flotante">Stock Flotante</TabsTrigger>
          <TabsTrigger value="trazabilidad">Trazabilidad</TabsTrigger>
        </TabsList>

        {/* Tab 1: Pedidos y Lotes */}
        <TabsContent value="pedidos">
          <Card>
            <CardContent className="p-0">
              {/* Column headers */}
              <div className="flex items-center gap-4 px-4 py-2.5 border-b bg-slate-50 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <div className="w-4 shrink-0" />
                <span className="w-36">N° Pedido</span>
                <span className="flex-1">Cliente</span>
                <span className="w-24 text-right">Total</span>
                <span className="w-24 text-center">Estado</span>
              </div>
              {mockPedidos.map((p) => (
                <PedidoRow key={p.id} pedido={p} />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Stock Flotante */}
        <TabsContent value="stock-flotante">
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                El vendedor llevará estas unidades adicionales para ventas en ruta.
              </p>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-xs font-medium text-muted-foreground uppercase">SKU</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground uppercase">Nombre</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground uppercase text-right">Cantidad extra</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground uppercase">Lote asignado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockStockFlotante.map((item, i) => (
                      <TableRow key={i} className="h-11">
                        <TableCell className="text-sm font-mono text-muted-foreground">{item.sku}</TableCell>
                        <TableCell className="text-sm">{item.nombre}</TableCell>
                        <TableCell className="text-sm text-right font-medium">{item.cantidadExtra}</TableCell>
                        <TableCell>
                          <button
                            onClick={() => openLoteSheet(item.lote)}
                            className="text-sm text-primary font-medium hover:underline"
                          >
                            {item.lote}
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Trazabilidad */}
        <TabsContent value="trazabilidad">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" className="gap-2" onClick={handleExportTrazabilidad}>
                <Download className="h-4 w-4" />
                Exportar trazabilidad
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-xs font-medium text-muted-foreground uppercase">Producto</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground uppercase">Lote</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground uppercase">Fabricado</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground uppercase">Vence</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground uppercase">Condición</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground uppercase">Cliente destino</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground uppercase text-right">Cant.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockTrazabilidad.map((row, i) => {
                      const isProximo = row.condicion === "PRÓXIMO VENCER";
                      return (
                        <TableRow key={i} className={cn("h-11", isProximo && "bg-amber-50/60")}>
                          <TableCell className="text-sm">{row.producto}</TableCell>
                          <TableCell>
                            <button
                              onClick={() => openLoteSheet(row.lote)}
                              className="text-sm text-primary font-medium hover:underline"
                            >
                              {row.lote}
                            </button>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{row.fabricado}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{row.vence}</TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                                isProximo ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700",
                              )}
                            >
                              {row.condicion}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">{row.clienteDestino}</TableCell>
                          <TableCell className="text-sm text-right font-medium">{row.cantidad}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Mark EN_RUTA Dialog */}
      <AlertDialog open={enRutaDialog} onOpenChange={setEnRutaDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Marcar despacho en ruta?</AlertDialogTitle>
            <AlertDialogDescription>
              El despacho {mockDespacho.numero} ({mockDespacho.ruta}) pasará a estado EN RUTA.
              El vendedor {mockDespacho.vendedor} será notificado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleMarcarEnRuta}>Marcar en ruta</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Lote Traceability Sheet */}
      <Sheet open={loteSheetOpen} onOpenChange={setLoteSheetOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Lote {selectedLote}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Producto</p>
                <p className="text-sm font-medium mt-0.5">Panetón Clásico 900g</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Cantidad producida</p>
                <p className="text-sm font-medium mt-0.5">120 und</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Fecha fabricación</p>
                <p className="text-sm font-medium mt-0.5">15/03/2026</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Vencimiento</p>
                <p className="text-sm font-medium mt-0.5">15/04/2026</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Condición</p>
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 mt-0.5">
                  ÓPTIMO
                </span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Disponible</p>
                <p className="text-sm font-medium mt-0.5">72 und</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-3">Historial de trazabilidad</h3>
              <div className="space-y-3">
                {mockLoteHistorial.map((h, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                      {i < mockLoteHistorial.length - 1 && (
                        <div className="w-px flex-1 bg-border mt-1" />
                      )}
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
        </SheetContent>
      </Sheet>
    </div>
  );
}
