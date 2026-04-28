import { useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, ShoppingCart, Package, AlertTriangle, XCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

type Estado = "CUBIERTO" | "EN_RIESGO" | "SIN_STOCK" | "SOBRESTOCK";

interface DemandaRow {
  producto: string;
  sku: string;
  requerido: number;
  disponible: number;
  canales: string[];
}

const MOCK_DEMANDA: DemandaRow[] = [
  { producto: "Panetón Clásico 900g", sku: "PAN-CL-900", requerido: 145, disponible: 85, canales: ["Tradicional", "Moderno"] },
  { producto: "Pan de Molde Blanco 500g", sku: "PAN-MOL-BLA", requerido: 80, disponible: 120, canales: ["Moderno", "Corporativo"] },
  { producto: "Keke Marmoleado 400g", sku: "KEK-MAR-400", requerido: 60, disponible: 90, canales: ["Tradicional"] },
  { producto: "Empanada Pollo x12", sku: "EMP-POL-12", requerido: 35, disponible: 30, canales: ["Directa"] },
  { producto: "Croissant Mantequilla", sku: "CRO-MAN", requerido: 28, disponible: 0, canales: ["Moderno"] },
  { producto: "Torta Tres Leches 1kg", sku: "TOR-TRL-1K", requerido: 15, disponible: 15, canales: ["Corporativo"] },
  { producto: "Panetón Chocolate 900g", sku: "PAN-CHO-900", requerido: 90, disponible: 40, canales: ["Tradicional", "Moderno"] },
  { producto: "Pan Integral 500g", sku: "PAN-INT-500", requerido: 22, disponible: 0, canales: ["Moderno"] },
];

const MOCK_LOTES: Record<string, Array<{ lote: string; venc: string; dias: string; cond: "OPTIMO" | "PROXIMO_VENCER" | "VENCIDO" | "DEFECTO_ESTETICO"; stock: number }>> = {
  "PAN-CL-900": [
    { lote: "L-2026-010", venc: "16/03/2026", dias: "vencido", cond: "VENCIDO", stock: 8 },
    { lote: "L-2026-011", venc: "21/03/2026", dias: "1 día", cond: "PROXIMO_VENCER", stock: 40 },
    { lote: "L-2026-012", venc: "30/04/2026", dias: "41 días", cond: "OPTIMO", stock: 45 },
  ],
};

const MOCK_PEDIDOS: Record<string, Array<{ num: string; cliente: string; vendedor: string; canal: string; cantidad: number; entrega: string }>> = {
  "PAN-CL-900": [
    { num: "PED-2026-0045", cliente: "Bodega San Martín", vendedor: "Carlos Ríos", canal: "Tradicional", cantidad: 20, entrega: "Hoy" },
    { num: "PED-2026-0039", cliente: "Minimarket Los Andes", vendedor: "Carlos Ríos", canal: "Tradicional", cantidad: 15, entrega: "Hoy" },
    { num: "PED-2026-0042", cliente: "Bodega Norte", vendedor: "Ana Villanueva", canal: "Tradicional", cantidad: 40, entrega: "Hoy" },
    { num: "PED-2026-0044", cliente: "Supermercados Plaza", vendedor: "Juan López", canal: "Moderno", cantidad: 70, entrega: "Hoy" },
  ],
};

function getEstado(req: number, disp: number): Estado {
  if (disp === 0) return "SIN_STOCK";
  if (disp > req * 1.5) return "SOBRESTOCK";
  if (disp >= req) return "CUBIERTO";
  return "EN_RIESGO";
}

const estadoOrder: Record<Estado, number> = { SIN_STOCK: 0, EN_RIESGO: 1, CUBIERTO: 2, SOBRESTOCK: 3 };

const estadoBadge: Record<Estado, { label: string; cls: string }> = {
  CUBIERTO: { label: "CUBIERTO", cls: "bg-green-100 text-green-700 hover:bg-green-100" },
  EN_RIESGO: { label: "EN RIESGO", cls: "bg-amber-100 text-amber-700 hover:bg-amber-100" },
  SIN_STOCK: { label: "SIN STOCK", cls: "bg-red-100 text-red-700 hover:bg-red-100" },
  SOBRESTOCK: { label: "SOBRESTOCK", cls: "bg-blue-100 text-blue-700 hover:bg-blue-100" },
};

const condBadge: Record<string, { label: string; cls: string }> = {
  OPTIMO: { label: "ÓPTIMO", cls: "bg-green-100 text-green-700" },
  PROXIMO_VENCER: { label: "PRÓXIMO VENCER", cls: "bg-amber-100 text-amber-700" },
  VENCIDO: { label: "VENCIDO", cls: "bg-red-100 text-red-700" },
  DEFECTO_ESTETICO: { label: "DEFECTO ESTÉTICO", cls: "bg-orange-100 text-orange-700" },
};

const condRowBg: Record<string, string> = {
  OPTIMO: "bg-white",
  PROXIMO_VENCER: "bg-amber-50",
  VENCIDO: "bg-red-50 opacity-60",
  DEFECTO_ESTETICO: "bg-orange-50",
};

export default function PlanificacionDemanda() {
  const today = new Date();
  const [from, setFrom] = useState<Date | undefined>(today);
  const [to, setTo] = useState<Date | undefined>(today);
  const [estadoFilter, setEstadoFilter] = useState("TODOS");
  const [canalFilter, setCanalFilter] = useState("TODOS");
  const [selected, setSelected] = useState<DemandaRow | null>(null);
  const [pedidosOpen, setPedidosOpen] = useState(false);

  const enriched = useMemo(() => {
    return MOCK_DEMANDA.map((d) => ({
      ...d,
      deficit: d.disponible - d.requerido,
      cobertura: d.requerido > 0 ? Math.min(100, (d.disponible / d.requerido) * 100) : 100,
      estado: getEstado(d.requerido, d.disponible),
    }));
  }, []);

  const filtered = useMemo(() => {
    return enriched
      .filter((r) => {
        if (estadoFilter === "EN_RIESGO") return r.estado === "EN_RIESGO";
        if (estadoFilter === "SIN_STOCK") return r.estado === "SIN_STOCK";
        if (estadoFilter === "CUBIERTO") return r.estado === "CUBIERTO" || r.estado === "SOBRESTOCK";
        return true;
      })
      .filter((r) => canalFilter === "TODOS" || r.canales.includes(canalFilter))
      .sort((a, b) => estadoOrder[a.estado] - estadoOrder[b.estado]);
  }, [enriched, estadoFilter, canalFilter]);

  const kpis = useMemo(() => {
    return {
      skus: enriched.length,
      unidades: enriched.reduce((s, r) => s + r.requerido, 0),
      enRiesgo: enriched.filter((r) => r.estado === "EN_RIESGO").length,
      sinStock: enriched.filter((r) => r.estado === "SIN_STOCK").length,
    };
  }, [enriched]);

  const setQuick = (key: "hoy" | "manana" | "semana") => {
    const t = new Date();
    if (key === "hoy") { setFrom(t); setTo(t); }
    if (key === "manana") {
      const m = new Date(t); m.setDate(m.getDate() + 1);
      setFrom(m); setTo(m);
    }
    if (key === "semana") {
      const end = new Date(t); end.setDate(end.getDate() + 6);
      setFrom(t); setTo(end);
    }
  };

  const coberturaColor = (pct: number) => {
    if (pct >= 100) return "bg-green-500";
    if (pct >= 50) return "bg-amber-400";
    if (pct >= 1) return "bg-orange-500";
    return "bg-red-500";
  };

  const lotes = selected ? (MOCK_LOTES[selected.sku] ?? []) : [];
  const pedidos = selected ? (MOCK_PEDIDOS[selected.sku] ?? []) : [];
  const totalUsable = lotes.filter((l) => l.cond !== "VENCIDO").reduce((s, l) => s + l.stock, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Planificación de Demanda</h1>
        <p className="text-sm text-muted-foreground">Requerido vs disponible en lotes para pedidos pendientes.</p>
      </div>

      {/* Date range */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <DateField label="Desde" value={from} onChange={setFrom} />
          <DateField label="Hasta" value={to} onChange={setTo} />
          <Button size="sm" className="bg-[#1E3A5F] hover:bg-[#1E3A5F]/90">Aplicar</Button>
          <div className="flex gap-2 ml-2">
            {[
              { k: "hoy", l: "Hoy" },
              { k: "manana", l: "Mañana" },
              { k: "semana", l: "Esta semana" },
            ].map((q) => (
              <button key={q.k} onClick={() => setQuick(q.k as any)} className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200">
                {q.l}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={ShoppingCart} iconColor="text-[#1E3A5F]" value={kpis.skus} label="SKUs en demanda" />
        <KpiCard icon={Package} iconColor="text-[#1E3A5F]" value={kpis.unidades} label="Unidades requeridas" />
        <KpiCard icon={AlertTriangle} iconColor="text-amber-500" value={kpis.enRiesgo} label="En riesgo" extra="border-l-4 border-amber-400 bg-amber-50" />
        <KpiCard icon={XCircle} iconColor="text-red-500" value={kpis.sinStock} label="Sin stock" extra="border-l-4 border-red-400 bg-red-50" />
      </div>

      {/* Demand table */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold">Detalle por producto</h2>
            <div className="flex gap-2">
              <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  <SelectItem value="EN_RIESGO">En riesgo</SelectItem>
                  <SelectItem value="SIN_STOCK">Sin stock</SelectItem>
                  <SelectItem value="CUBIERTO">Cubierto</SelectItem>
                </SelectContent>
              </Select>
              <Select value={canalFilter} onValueChange={setCanalFilter}>
                <SelectTrigger className="w-[180px] h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos los canales</SelectItem>
                  <SelectItem value="Corporativo">Corporativo</SelectItem>
                  <SelectItem value="Moderno">Moderno</SelectItem>
                  <SelectItem value="Tradicional">Tradicional</SelectItem>
                  <SelectItem value="Directa">Directa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Requerido</TableHead>
                <TableHead className="text-right">Disponible en lotes</TableHead>
                <TableHead className="text-right">Déficit</TableHead>
                <TableHead className="w-[200px]">Cobertura %</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.sku} className="cursor-pointer" onClick={() => setSelected(r)}>
                  <TableCell className="font-medium">{r.producto}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{r.sku}</TableCell>
                  <TableCell className="text-right">{r.requerido}u</TableCell>
                  <TableCell className="text-right">{r.disponible}u</TableCell>
                  <TableCell className={cn(
                    "text-right",
                    r.deficit > 0 && "text-green-600",
                    r.deficit < 0 && "text-red-600 font-bold",
                    r.deficit === 0 && "text-slate-500",
                  )}>
                    {r.deficit > 0 ? `+${r.deficit}` : r.deficit}u
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className={cn("h-full transition-all", coberturaColor(r.cobertura))} style={{ width: `${r.cobertura}%` }} />
                      </div>
                      <span className="text-xs text-slate-600 w-10 text-right">{Math.round(r.cobertura)}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={estadoBadge[r.estado].cls}>{estadoBadge[r.estado].label}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Side panel */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-96 sm:max-w-md overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.producto}</SheetTitle>
                <p className="text-xs text-muted-foreground">{selected.sku}</p>
                <div className="pt-2">
                  <Badge className={estadoBadge[getEstado(selected.requerido, selected.disponible)].cls}>
                    {estadoBadge[getEstado(selected.requerido, selected.disponible)].label}
                  </Badge>
                </div>
                <div className="flex gap-3 text-xs pt-2 text-slate-600">
                  <span>Requerido: <b>{selected.requerido}u</b></span>
                  <span>Disponible: <b>{selected.disponible}u</b></span>
                  <span>Déficit: <b>{selected.disponible - selected.requerido}u</b></span>
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-2">
                <h3 className="text-sm font-semibold">Lotes disponibles</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Lote</TableHead>
                      <TableHead className="text-xs">Venc.</TableHead>
                      <TableHead className="text-xs">Días</TableHead>
                      <TableHead className="text-xs">Condición</TableHead>
                      <TableHead className="text-xs text-right">Stock</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lotes.map((l) => (
                      <TableRow key={l.lote} className={condRowBg[l.cond]}>
                        <TableCell className="text-xs font-medium">{l.lote}</TableCell>
                        <TableCell className="text-xs">{l.venc}</TableCell>
                        <TableCell className="text-xs">{l.dias}</TableCell>
                        <TableCell><Badge className={cn("text-[10px]", condBadge[l.cond].cls)}>{condBadge[l.cond].label}</Badge></TableCell>
                        <TableCell className={cn("text-xs text-right", l.cond === "VENCIDO" && "line-through")}>{l.stock}u</TableCell>
                      </TableRow>
                    ))}
                    {lotes.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground">Sin lotes registrados</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
                <p className="text-xs text-slate-600 pt-2">Total usable: <b>{totalUsable}u</b></p>
              </div>

              <div className="mt-6">
                <Collapsible open={pedidosOpen} onOpenChange={setPedidosOpen}>
                  <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold w-full text-left">
                    <ChevronDown className={cn("h-4 w-4 transition-transform", !pedidosOpen && "-rotate-90")} />
                    Pedidos que demandan este producto ({pedidos.length})
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">N°</TableHead>
                          <TableHead className="text-xs">Cliente</TableHead>
                          <TableHead className="text-xs">Vendedor</TableHead>
                          <TableHead className="text-xs">Canal</TableHead>
                          <TableHead className="text-xs text-right">Cant.</TableHead>
                          <TableHead className="text-xs">Entrega</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pedidos.map((p) => (
                          <TableRow key={p.num}>
                            <TableCell className="text-xs font-medium">{p.num}</TableCell>
                            <TableCell className="text-xs">{p.cliente}</TableCell>
                            <TableCell className="text-xs">{p.vendedor}</TableCell>
                            <TableCell className="text-xs">{p.canal}</TableCell>
                            <TableCell className="text-xs text-right">{p.cantidad}u</TableCell>
                            <TableCell className="text-xs">{p.entrega}</TableCell>
                          </TableRow>
                        ))}
                        {pedidos.length === 0 && (
                          <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground">Sin pedidos pendientes</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DateField({ label, value, onChange }: { label: string; value?: Date; onChange: (d?: Date) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 justify-start font-normal w-[150px]">
            <CalendarIcon className="mr-2 h-3.5 w-3.5" />
            {value ? format(value, "dd/MM/yyyy") : "Seleccionar"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={value} onSelect={onChange} initialFocus className={cn("p-3 pointer-events-auto")} />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function KpiCard({ icon: Icon, iconColor, value, label, extra }: { icon: any; iconColor: string; value: number; label: string; extra?: string }) {
  return (
    <Card className={extra}>
      <CardContent className="p-4 flex items-center gap-3">
        <Icon className={cn("h-8 w-8", iconColor)} />
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
