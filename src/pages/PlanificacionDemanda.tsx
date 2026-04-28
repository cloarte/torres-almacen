import { Fragment, useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, ShoppingCart, Package, AlertTriangle, XCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type Estado = "CUBIERTO" | "EN_RIESGO" | "SIN_STOCK" | "SOBRESTOCK";

interface PedidoDemanda {
  num: string;
  cliente: string;
  vendedor: string;
  canal: string;
  cantidad: number;
  fecha: Date; // entrega date
}

interface DemandaRow {
  producto: string;
  sku: string;
  requerido: number;
  disponible: number;
  canales: string[];
  pedidos: PedidoDemanda[];
}

const today = new Date(); today.setHours(0, 0, 0, 0);
const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
const d = (s: string) => {
  // dd/mm/yyyy
  const [dd, mm, yyyy] = s.split("/").map(Number);
  return new Date(yyyy, mm - 1, dd);
};

const MOCK_DEMANDA: DemandaRow[] = [
  {
    producto: "Panetón Clásico 900g", sku: "PAN-CL-900", requerido: 145, disponible: 85, canales: ["Tradicional", "Moderno"],
    pedidos: [
      { num: "PED-2026-0045", cliente: "Bodega San Martín", vendedor: "Carlos Ríos", canal: "Tradicional", cantidad: 20, fecha: today },
      { num: "PED-2026-0039", cliente: "Minimarket Los Andes", vendedor: "Carlos Ríos", canal: "Tradicional", cantidad: 15, fecha: today },
      { num: "PED-2026-0042", cliente: "Bodega Norte", vendedor: "Ana Villanueva", canal: "Tradicional", cantidad: 40, fecha: tomorrow },
      { num: "PED-2026-0044", cliente: "Supermercados Plaza", vendedor: "Juan López", canal: "Moderno", cantidad: 70, fecha: d("02/05/2026") },
    ],
  },
  {
    producto: "Pan de Molde Blanco 500g", sku: "PAN-MOL-BLA", requerido: 80, disponible: 120, canales: ["Moderno", "Corporativo"],
    pedidos: [
      { num: "PED-2026-0027", cliente: "Tienda Señora Rosa", vendedor: "Carlos Ríos", canal: "Tradicional", cantidad: 30, fecha: today },
      { num: "PED-2026-0032", cliente: "Bodega Santa Rosa", vendedor: "María Torres", canal: "Tradicional", cantidad: 50, fecha: tomorrow },
    ],
  },
  {
    producto: "Keke Marmoleado 400g", sku: "KEK-MAR-400", requerido: 60, disponible: 90, canales: ["Tradicional"],
    pedidos: [
      { num: "PED-2026-0025", cliente: "Tienda San Pedro", vendedor: "Pedro Soto", canal: "Tradicional", cantidad: 25, fecha: today },
      { num: "PED-2026-0029", cliente: "Distribuidora Piura", vendedor: "Luis Paredes", canal: "Tradicional", cantidad: 35, fecha: d("30/04/2026") },
    ],
  },
  {
    producto: "Empanada Pollo x12", sku: "EMP-POL-12", requerido: 35, disponible: 30, canales: ["Directa"],
    pedidos: [
      { num: "PED-2026-0043", cliente: "Distribuidora Lima", vendedor: "Pedro Soto", canal: "Directa", cantidad: 18, fecha: today },
      { num: "PED-2026-0033", cliente: "Bodega El Progreso", vendedor: "Carlos Ríos", canal: "Tradicional", cantidad: 17, fecha: tomorrow },
    ],
  },
  {
    producto: "Croissant Mantequilla", sku: "CRO-MAN", requerido: 28, disponible: 0, canales: ["Moderno"],
    pedidos: [
      { num: "PED-2026-0026", cliente: "Tienda El Carmen", vendedor: "María Torres", canal: "Tradicional", cantidad: 12, fecha: today },
      { num: "PED-2026-0038", cliente: "Minimarket Don José", vendedor: "María Torres", canal: "Tradicional", cantidad: 16, fecha: today },
    ],
  },
  {
    producto: "Torta Tres Leches 1kg", sku: "TOR-TRL-1K", requerido: 15, disponible: 15, canales: ["Corporativo"],
    pedidos: [
      { num: "PED-2026-0040", cliente: "Metro San Isidro", vendedor: "Juan López", canal: "Moderno", cantidad: 15, fecha: tomorrow },
    ],
  },
  {
    producto: "Panetón Chocolate 900g", sku: "PAN-CHO-900", requerido: 90, disponible: 40, canales: ["Tradicional", "Moderno"],
    pedidos: [
      { num: "PED-2026-0041", cliente: "Tienda Piura Centro", vendedor: "Luis Paredes", canal: "Tradicional", cantidad: 30, fecha: today },
      { num: "PED-2026-0035", cliente: "Bodega El Bosque", vendedor: "Luis Paredes", canal: "Tradicional", cantidad: 35, fecha: tomorrow },
      { num: "PED-2026-0028", cliente: "Colegio San Agustín", vendedor: "Roberto Chávez", canal: "Corporativo", cantidad: 25, fecha: d("30/04/2026") },
    ],
  },
  {
    producto: "Pan Integral 500g", sku: "PAN-INT-500", requerido: 22, disponible: 0, canales: ["Moderno"],
    pedidos: [
      { num: "PED-2026-0036", cliente: "Distribuidora Trujillo", vendedor: "Ana Villanueva", canal: "Tradicional", cantidad: 22, fecha: tomorrow },
    ],
  },
];

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

const canalBadgeCls: Record<string, string> = {
  Tradicional: "bg-violet-100 text-violet-700",
  Moderno: "bg-sky-100 text-sky-700",
  Corporativo: "bg-indigo-100 text-indigo-700",
  Directa: "bg-emerald-100 text-emerald-700",
};

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function entregaBadge(fecha: Date) {
  if (isSameDay(fecha, today)) return { label: "HOY", cls: "bg-red-100 text-red-700" };
  if (isSameDay(fecha, tomorrow)) return { label: "MAÑANA", cls: "bg-amber-100 text-amber-700" };
  return { label: format(fecha, "dd/MM/yyyy"), cls: "bg-slate-100 text-slate-600" };
}

export default function PlanificacionDemanda() {
  const [from, setFrom] = useState<Date | undefined>(today);
  const [to, setTo] = useState<Date | undefined>(today);
  const [estadoFilter, setEstadoFilter] = useState("TODOS");
  const [canalFilter, setCanalFilter] = useState("TODOS");
  const [expandedSku, setExpandedSku] = useState<string | null>(null);

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

  const kpis = useMemo(() => ({
    skus: enriched.length,
    unidades: enriched.reduce((s, r) => s + r.requerido, 0),
    enRiesgo: enriched.filter((r) => r.estado === "EN_RIESGO").length,
    sinStock: enriched.filter((r) => r.estado === "SIN_STOCK").length,
  }), [enriched]);

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
                <TableHead className="w-8"></TableHead>
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
              {filtered.map((r) => {
                const expanded = expandedSku === r.sku;
                const fechas = r.pedidos.map((p) => p.fecha.getTime());
                const minF = fechas.length ? new Date(Math.min(...fechas)) : null;
                const maxF = fechas.length ? new Date(Math.max(...fechas)) : null;
                const totalDemandado = r.pedidos.reduce((s, p) => s + p.cantidad, 0);
                return (
                  <Fragment key={r.sku}>
                    <TableRow
                      className={cn("cursor-pointer", expanded && "bg-secondary hover:bg-secondary")}
                      onClick={() => setExpandedSku(expanded ? null : r.sku)}
                    >
                      <TableCell className="pr-0">
                        <ChevronRight className={cn("h-4 w-4 text-slate-500 transition-transform", expanded && "rotate-90")} />
                      </TableCell>
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

                    {expanded && (
                      <>
                        <TableRow className="bg-muted hover:bg-muted">
                          <TableCell colSpan={8} className="py-2 px-4 text-[11px] uppercase tracking-wide text-muted-foreground">
                            Pedidos que demandan este producto — {r.pedidos.length} pedidos
                            {minF && maxF && (
                              <> · entrega entre {format(minF, "dd/MM/yyyy")} y {format(maxF, "dd/MM/yyyy")}</>
                            )}
                          </TableCell>
                        </TableRow>
                        {r.pedidos.map((p, idx) => {
                          const eb = entregaBadge(p.fecha);
                          const isLast = idx === r.pedidos.length - 1;
                          return (
                            <TableRow key={p.num} className={cn("bg-muted hover:bg-muted text-xs", isLast && "border-b-2 border-slate-300")}>
                              <TableCell></TableCell>
                              <TableCell colSpan={2} className="py-2">
                                <div className="font-medium text-slate-700">{p.num}</div>
                                <div className="text-slate-500">{p.cliente}</div>
                              </TableCell>
                              <TableCell className="py-2">{p.vendedor}</TableCell>
                              <TableCell className="py-2">
                                <Badge className={cn("text-[10px]", canalBadgeCls[p.canal] ?? "bg-slate-100 text-slate-600")}>{p.canal}</Badge>
                              </TableCell>
                              <TableCell className="py-2 text-right font-medium">{p.cantidad}u</TableCell>
                              <TableCell className="py-2" colSpan={2}>
                                <Badge className={cn("text-[10px]", eb.cls)}>{eb.label}</Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        <TableRow className="bg-muted hover:bg-muted">
                          <TableCell colSpan={8} className="py-1.5 px-2.5 text-[11px] text-muted-foreground text-right">
                            Total demandado: {totalDemandado}u en {r.pedidos.length} pedidos
                          </TableCell>
                        </TableRow>
                      </>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
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
