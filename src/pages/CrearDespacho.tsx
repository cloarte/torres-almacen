import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Truck,
  Bell,
  AlertTriangle,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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

interface Vendedor {
  id: string;
  nombre: string;
  canal: "Corporativo" | "Moderno" | "Tradicional" | "Directa";
  ruta: string | null;
  numPedidos: number;
  totalSoles: string;
  totalUnidades: number;
}

interface PedidoDespacho {
  id: string;
  numero: string;
  cliente: string;
  productos: number;
  total: string;
}

interface Lote {
  id: string;
  codigo: string;
  vencimiento: string;
  condicion: "ÓPTIMO" | "PRÓXIMO_VENCER" | "ALERTA_VENCIMIENTO";
  disponible: number;
}

interface ProductoDespacho {
  id: string;
  nombre: string;
  unidad: string;
  necesario: number;
  lotes: Lote[];
  asignaciones: Record<string, number>;
}

// ==================== MOCK DATA ====================

const vendedores: Vendedor[] = [
  { id: "v1", nombre: "Juan López",   canal: "Tradicional", ruta: "LIM-01", numPedidos: 5, totalSoles: "S/ 6,480", totalUnidades: 102 },
  { id: "v2", nombre: "Pedro Soto",   canal: "Tradicional", ruta: "LIM-02", numPedidos: 4, totalSoles: "S/ 4,250", totalUnidades: 78 },
  { id: "v3", nombre: "María Torres", canal: "Moderno",     ruta: null,     numPedidos: 3, totalSoles: "S/ 8,100", totalUnidades: 56 },
  { id: "v4", nombre: "Lucía Vega",   canal: "Corporativo", ruta: null,     numPedidos: 2, totalSoles: "S/ 12,300", totalUnidades: 40 },
];

const pedidosPorVendedor: Record<string, PedidoDespacho[]> = {
  v1: [
    { id: "p1", numero: "PED-2026-0045", cliente: "Bodega San Martín", productos: 3, total: "S/ 480" },
    { id: "p2", numero: "PED-2026-0046", cliente: "Bodega La Estrella", productos: 2, total: "S/ 320" },
    { id: "p3", numero: "PED-2026-0047", cliente: "Tienda Rosales", productos: 4, total: "S/ 1,280" },
    { id: "p4", numero: "PED-2026-0048", cliente: "Market Express", productos: 2, total: "S/ 2,100" },
    { id: "p5", numero: "PED-2026-0049", cliente: "Bodega Carmela", productos: 5, total: "S/ 2,300" },
  ],
  v2: [
    { id: "p6", numero: "PED-2026-0044", cliente: "Supermercados Plaza", productos: 6, total: "S/ 1,850" },
    { id: "p7", numero: "PED-2026-0050", cliente: "Minimarket Sol", productos: 3, total: "S/ 740" },
  ],
  v3: [
    { id: "p8", numero: "PED-2026-0041", cliente: "Plaza Vea Surco", productos: 2, total: "S/ 720" },
  ],
  v4: [
    { id: "p9", numero: "PED-2026-0040", cliente: "Banco Pichincha HQ", productos: 1, total: "S/ 5,400" },
  ],
};

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

const canalColors: Record<string, string> = {
  Corporativo: "bg-purple-100 text-purple-700",
  Moderno: "bg-blue-100 text-blue-700",
  Tradicional: "bg-emerald-100 text-emerald-700",
  Directa: "bg-orange-100 text-orange-700",
};

function buildProductos(): ProductoDespacho[] {
  return [
    {
      id: "pr1",
      nombre: "Panetón Clásico 900g",
      unidad: "und",
      necesario: 48,
      lotes: [
        { id: "l1", codigo: "L-2026-003", vencimiento: "15/04/26", condicion: "ÓPTIMO", disponible: 120 },
        { id: "l2", codigo: "L-2026-001", vencimiento: "28/03/26", condicion: "PRÓXIMO_VENCER", disponible: 85 },
      ],
      asignaciones: { l2: 48 }, // FIFO: oldest first
    },
    {
      id: "pr2",
      nombre: "Pan de Molde Integral",
      unidad: "und",
      necesario: 24,
      lotes: [
        { id: "l3", codigo: "L-2026-010", vencimiento: "22/04/26", condicion: "ÓPTIMO", disponible: 60 },
        { id: "l4", codigo: "L-2026-008", vencimiento: "01/04/26", condicion: "ÓPTIMO", disponible: 30 },
      ],
      asignaciones: { l4: 24 },
    },
    {
      id: "pr3",
      nombre: "Bizcocho Vainilla 500g",
      unidad: "und",
      necesario: 16,
      lotes: [
        { id: "l5", codigo: "L-2026-015", vencimiento: "10/05/26", condicion: "ÓPTIMO", disponible: 40 },
        { id: "l6", codigo: "L-2026-012", vencimiento: "25/03/26", condicion: "ALERTA_VENCIMIENTO", disponible: 20 },
      ],
      asignaciones: { l6: 16 },
    },
    {
      id: "pr4",
      nombre: "Galleta Soda x6",
      unidad: "paq",
      necesario: 12,
      lotes: [
        { id: "l7", codigo: "L-2026-020", vencimiento: "30/06/26", condicion: "ÓPTIMO", disponible: 200 },
      ],
      asignaciones: { l7: 12 },
    },
    {
      id: "pr5",
      nombre: "Keke Marmoleado 400g",
      unidad: "und",
      necesario: 10,
      lotes: [
        { id: "l8", codigo: "L-2026-025", vencimiento: "20/04/26", condicion: "ÓPTIMO", disponible: 35 },
        { id: "l9", codigo: "L-2026-022", vencimiento: "30/03/26", condicion: "PRÓXIMO_VENCER", disponible: 15 },
      ],
      asignaciones: { l9: 10 },
    },
    {
      id: "pr6",
      nombre: "Pan Francés (bolsa x10)",
      unidad: "bolsa",
      necesario: 8,
      lotes: [
        { id: "l10", codigo: "L-2026-030", vencimiento: "21/03/26", condicion: "ÓPTIMO", disponible: 50 },
      ],
      asignaciones: { l10: 8 },
    },
    {
      id: "pr7",
      nombre: "Torta Helada 1kg",
      unidad: "und",
      necesario: 4,
      lotes: [
        { id: "l11", codigo: "L-2026-035", vencimiento: "25/03/26", condicion: "PRÓXIMO_VENCER", disponible: 10 },
      ],
      asignaciones: { l11: 4 },
    },
    {
      id: "pr8",
      nombre: "Empanada de Carne x4",
      unidad: "paq",
      necesario: 2,
      lotes: [
        { id: "l12", codigo: "L-2026-040", vencimiento: "15/04/26", condicion: "ÓPTIMO", disponible: 30 },
      ],
      asignaciones: { l12: 2 },
    },
  ];
}

// ==================== STEP INDICATOR ====================

function StepIndicator({ current }: { current: number }) {
  const steps = ["Seleccionar Ruta", "Asignar Lotes", "Confirmar"];
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const done = stepNum < current;
        const active = stepNum === current;
        return (
          <div key={label} className="flex items-center">
            {i > 0 && (
              <div
                className={cn(
                  "h-px w-12 sm:w-20",
                  done ? "bg-primary" : "bg-border",
                )}
              />
            )}
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors",
                  done && "bg-primary text-primary-foreground",
                  active && "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2",
                  !done && !active && "bg-muted text-muted-foreground",
                )}
              >
                {done ? <Check className="h-4 w-4" /> : stepNum}
              </div>
              <span
                className={cn(
                  "text-sm font-medium hidden sm:inline",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ==================== MAIN WIZARD ====================

export default function CrearDespacho() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Step 1 state
  const [selectedRutaId, setSelectedRutaId] = useState("");
  const [selectedPedidos, setSelectedPedidos] = useState<Set<string>>(new Set());

  // Step 2 state
  const [productos, setProductos] = useState<ProductoDespacho[]>([]);

  // Step 3 state
  const [verified, setVerified] = useState(false);

  const selectedRuta = rutas.find((r) => r.id === selectedRutaId);
  const pedidosForRuta = selectedRutaId ? (pedidosPorRuta[selectedRutaId] || []) : [];

  // When ruta changes, pre-select all pedidos
  const handleRutaChange = (rutaId: string) => {
    setSelectedRutaId(rutaId);
    const pedidos = pedidosPorRuta[rutaId] || [];
    setSelectedPedidos(new Set(pedidos.map((p) => p.id)));
  };

  const togglePedido = (id: string) => {
    setSelectedPedidos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllPedidos = () => {
    if (selectedPedidos.size === pedidosForRuta.length) {
      setSelectedPedidos(new Set());
    } else {
      setSelectedPedidos(new Set(pedidosForRuta.map((p) => p.id)));
    }
  };

  const totalProductosSeleccionados = pedidosForRuta
    .filter((p) => selectedPedidos.has(p.id))
    .reduce((sum, p) => sum + p.productos, 0);

  // Step 2 helpers
  const handleAsignacionChange = (productoId: string, loteId: string, value: number) => {
    setProductos((prev) =>
      prev.map((p) => {
        if (p.id !== productoId) return p;
        return { ...p, asignaciones: { ...p.asignaciones, [loteId]: Math.max(0, value) } };
      }),
    );
  };

  const getTotalAsignado = (producto: ProductoDespacho) =>
    Object.values(producto.asignaciones).reduce((s, v) => s + v, 0);

  const allProductsFullyAssigned = productos.every(
    (p) => getTotalAsignado(p) === p.necesario,
  );

  // Check if product uses FIFO (oldest lots first)
  const isProductFifo = (producto: ProductoDespacho): boolean => {
    const sortedLotes = [...producto.lotes].sort((a, b) =>
      a.vencimiento.localeCompare(b.vencimiento),
    );
    let remaining = producto.necesario;
    for (const lote of sortedLotes) {
      const expected = Math.min(remaining, lote.disponible);
      const actual = producto.asignaciones[lote.id] || 0;
      if (actual !== expected) return false;
      remaining -= expected;
      if (remaining <= 0) break;
    }
    return true;
  };

  const nonFifoProducts = productos.filter((p) => !isProductFifo(p));

  // Summary values for step 2 & 3
  const summaryValues = useMemo(() => {
    const totalUnidades = productos.reduce((s, p) => s + getTotalAsignado(p), 0);
    const lotesUsados = new Set(
      productos.flatMap((p) =>
        Object.entries(p.asignaciones)
          .filter(([, v]) => v > 0)
          .map(([k]) => k),
      ),
    ).size;
    return {
      pedidos: selectedPedidos.size,
      productosDistintos: productos.length,
      totalUnidades,
      totalValor: "6,480",
      lotesAsignados: lotesUsados,
    };
  }, [productos, selectedPedidos]);

  const proximoVencerLotes = productos.flatMap((p) =>
    p.lotes.filter(
      (l) =>
        (l.condicion === "PRÓXIMO_VENCER" || l.condicion === "ALERTA_VENCIMIENTO") &&
        (p.asignaciones[l.id] || 0) > 0,
    ),
  );

  // Navigation
  const goToStep2 = () => {
    setProductos(buildProductos());
    setStep(2);
  };

  const goToStep3 = () => {
    setVerified(false);
    setStep(3);
  };

  const handleConfirm = () => {
    toast.success("Despacho DSP-2026-0019 creado. Juan López puede iniciar su ruta.");
    navigate("/entrega/despachos");
  };

  // ==================== RENDER ====================

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Nuevo Despacho</h1>
      </div>

      <StepIndicator current={step} />

      {/* ========== STEP 1 ========== */}
      {step === 1 && (
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ruta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>
                  Ruta <span className="text-danger">*</span>
                </Label>
                <Select value={selectedRutaId} onValueChange={handleRutaChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar ruta..." />
                  </SelectTrigger>
                  <SelectContent>
                    {rutas.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.nombre} — {r.vendedor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedRuta && (
                <div className="grid grid-cols-3 gap-4 rounded-lg bg-muted/50 p-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Vendedor</p>
                    <p className="text-sm font-medium mt-0.5">{selectedRuta.vendedor}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Días</p>
                    <p className="text-sm font-medium mt-0.5">{selectedRuta.dias}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Clientes</p>
                    <p className="text-sm font-medium mt-0.5">{selectedRuta.numClientes}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedRutaId && pedidosForRuta.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pedidos LISTO_DESPACHO para esta ruta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="w-10">
                          <Checkbox
                            checked={selectedPedidos.size === pedidosForRuta.length}
                            onCheckedChange={toggleAllPedidos}
                          />
                        </TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground uppercase">N° Pedido</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground uppercase">Cliente</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground uppercase">Productos</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground uppercase">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pedidosForRuta.map((p) => (
                        <TableRow key={p.id} className="h-11">
                          <TableCell>
                            <Checkbox
                              checked={selectedPedidos.has(p.id)}
                              onCheckedChange={() => togglePedido(p.id)}
                            />
                          </TableCell>
                          <TableCell className="text-sm font-medium">{p.numero}</TableCell>
                          <TableCell className="text-sm">{p.cliente}</TableCell>
                          <TableCell className="text-sm">{p.productos}</TableCell>
                          <TableCell className="text-sm font-medium">{p.total}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Info className="h-4 w-4" />
                  {selectedPedidos.size} pedidos seleccionados — {totalProductosSeleccionados} productos en total
                </div>
              </CardContent>
            </Card>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => navigate("/entrega/despachos")}>
              Cancelar
            </Button>
            <Button
              onClick={goToStep2}
              disabled={!selectedRutaId || selectedPedidos.size === 0}
              className="gap-2"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ========== STEP 2 ========== */}
      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Lot assignment */}
          <div className="lg:col-span-3 space-y-4">
            {productos.map((producto) => {
              const totalAsig = getTotalAsignado(producto);
              const fulfilled = totalAsig === producto.necesario;
              const over = totalAsig > producto.necesario;

              return (
                <Card key={producto.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{producto.nombre}</CardTitle>
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          fulfilled ? "text-success" : over ? "text-danger" : "text-warning",
                        )}
                      >
                        {totalAsig}/{producto.necesario} {producto.unidad}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableHead className="text-xs font-medium text-muted-foreground uppercase">Lote</TableHead>
                            <TableHead className="text-xs font-medium text-muted-foreground uppercase">Vence</TableHead>
                            <TableHead className="text-xs font-medium text-muted-foreground uppercase">Cond.</TableHead>
                            <TableHead className="text-xs font-medium text-muted-foreground uppercase text-right">Disp.</TableHead>
                            <TableHead className="text-xs font-medium text-muted-foreground uppercase text-right w-24">Asig.</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {producto.lotes.map((lote) => {
                            const isProximoVencer = lote.condicion === "PRÓXIMO_VENCER";
                            const isAlerta = lote.condicion === "ALERTA_VENCIMIENTO";
                            const asig = producto.asignaciones[lote.id] || 0;

                            // Check if this specific row breaks FIFO
                            const sortedLotes = [...producto.lotes].sort((a, b) =>
                              a.vencimiento.localeCompare(b.vencimiento),
                            );
                            const loteIndex = sortedLotes.findIndex((l) => l.id === lote.id);
                            const isOldest = loteIndex === 0;
                            const olderHasCapacity =
                              !isOldest &&
                              asig > 0 &&
                              sortedLotes
                                .slice(0, loteIndex)
                                .some(
                                  (older) =>
                                    (producto.asignaciones[older.id] || 0) < older.disponible,
                                );

                            return (
                              <TableRow
                                key={lote.id}
                                className={cn(
                                  "h-11",
                                  (isProximoVencer || isAlerta) && "bg-amber-50/60",
                                )}
                              >
                                <TableCell className="text-sm font-medium">
                                  {lote.codigo}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {lote.vencimiento}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    {(isProximoVencer || isAlerta) && (
                                      <Bell className="h-3.5 w-3.5 text-amber-500" />
                                    )}
                                    <span
                                      className={cn(
                                        "text-xs font-medium",
                                        isAlerta
                                          ? "text-danger"
                                          : isProximoVencer
                                            ? "text-amber-600"
                                            : "text-success",
                                      )}
                                    >
                                      {lote.condicion.replace("_", " ")}
                                    </span>
                                  </div>
                                  {isAlerta && asig > 0 && (
                                    <p className="text-[11px] text-danger mt-0.5">
                                      ⚠ Lote en alerta de vencimiento
                                    </p>
                                  )}
                                </TableCell>
                                <TableCell className="text-sm text-right text-muted-foreground">
                                  {lote.disponible}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <Input
                                      type="number"
                                      min={0}
                                      max={lote.disponible}
                                      className="w-20 h-8 text-right text-sm"
                                      value={asig}
                                      onChange={(e) =>
                                        handleAsignacionChange(
                                          producto.id,
                                          lote.id,
                                          parseInt(e.target.value) || 0,
                                        )
                                      }
                                    />
                                    {olderHasCapacity && (
                                      <span
                                        className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700"
                                        title="No sigue orden FIFO"
                                      >
                                        ⚠ No FIFO
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Right: Summary (sticky) */}
          <div className="lg:col-span-2">
            <div className="sticky top-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resumen del despacho</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ruta</span>
                      <span className="font-medium">{selectedRuta?.nombre}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vendedor</span>
                      <span className="font-medium">{selectedRuta?.vendedor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pedidos</span>
                      <span className="font-medium">{summaryValues.pedidos}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Productos distintos</span>
                      <span className="font-medium">{summaryValues.productosDistintos}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total unidades</span>
                      <span className="font-medium">{summaryValues.totalUnidades}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total valor</span>
                      <span className="font-semibold">S/ {summaryValues.totalValor}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lotes asignados</span>
                      <span className="font-medium">{summaryValues.lotesAsignados}</span>
                    </div>
                    {nonFifoProducts.length > 0 && (
                      <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 p-2.5">
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700">
                          {nonFifoProducts.length} producto(s) no siguen orden FIFO
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer full-width */}
          <div className="lg:col-span-5 flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button onClick={goToStep3} disabled={!allProductsFullyAssigned} className="gap-2">
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ========== STEP 3 ========== */}
      {step === 3 && (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Despacho summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Despacho a crear</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Ruta</p>
                  <p className="text-sm font-semibold mt-0.5">{selectedRuta?.nombre}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Vendedor</p>
                  <p className="text-sm font-medium mt-0.5">{selectedRuta?.vendedor}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Fecha</p>
                  <p className="text-sm font-medium mt-0.5">Hoy 20/03/2026</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Total</p>
                  <p className="text-sm font-semibold mt-0.5">S/ {summaryValues.totalValor}</p>
                </div>
              </div>
              <div className="flex gap-6 mt-4 text-sm text-muted-foreground">
                <span>{summaryValues.pedidos} pedidos</span>
                <span>{summaryValues.productosDistintos} productos</span>
                <span>{summaryValues.totalUnidades} unidades</span>
              </div>
            </CardContent>
          </Card>

          {/* Lot assignment accordion */}
          <Accordion type="single" collapsible>
            <AccordionItem value="lotes" className="border rounded-lg">
              <AccordionTrigger className="px-6 text-base font-semibold hover:no-underline">
                Asignación de lotes
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4">
                <div className="space-y-3">
                  {productos.map((p) => (
                    <div key={p.id} className="text-sm">
                      <p className="font-medium">{p.nombre}</p>
                      <div className="ml-4 mt-1 space-y-0.5">
                        {p.lotes
                          .filter((l) => (p.asignaciones[l.id] || 0) > 0)
                          .map((l) => (
                            <p key={l.id} className="text-muted-foreground">
                              {l.codigo} — {p.asignaciones[l.id]} {p.unidad} (vence {l.vencimiento})
                            </p>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Alerts */}
          {(nonFifoProducts.length > 0 || proximoVencerLotes.length > 0) && (
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-amber-800">
                  <AlertTriangle className="h-4 w-4" />
                  Alertas antes de confirmar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm text-amber-700">
                  {nonFifoProducts.length > 0 && (
                    <li>• {nonFifoProducts.length} producto(s) no siguen orden FIFO</li>
                  )}
                  {proximoVencerLotes.length > 0 && (
                    <li>
                      • {proximoVencerLotes.length} lote(s) próximos a vencer incluidos en
                      este despacho
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Verification checkbox */}
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <Checkbox
              id="verify"
              checked={verified}
              onCheckedChange={(c) => setVerified(c === true)}
            />
            <Label htmlFor="verify" className="text-sm font-medium cursor-pointer">
              Verificado que las cantidades físicas coinciden
            </Label>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button onClick={handleConfirm} disabled={!verified} className="gap-2">
              <Truck className="h-4 w-4" />
              Confirmar Despacho
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
