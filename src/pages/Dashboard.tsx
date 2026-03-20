import { Link } from "react-router-dom";
import {
  Package,
  AlertTriangle,
  Truck,
  CornerDownLeft,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// ==================== KPI DATA ====================

const kpis = [
  {
    label: "Pedidos listos para despacho",
    value: 12,
    icon: Package,
    alertColor: (v: number) => v > 0 ? "text-warning" : "text-foreground",
    bgColor: (v: number) => v > 0 ? "bg-amber-50" : "bg-card",
    link: "/pedidos?estado=LISTO_DESPACHO",
    linkLabel: "Ver pedidos",
  },
  {
    label: "Alertas de vencimiento activas",
    value: 7,
    icon: AlertTriangle,
    alertColor: (v: number) => v > 0 ? "text-danger" : "text-foreground",
    bgColor: (v: number) => v > 0 ? "bg-red-50" : "bg-card",
    link: "/vencidos/alertas",
    linkLabel: "Ver alertas",
  },
  {
    label: "Despachos en ruta hoy",
    value: 3,
    icon: Truck,
    alertColor: () => "text-foreground",
    bgColor: () => "bg-card",
    link: "/entrega/despachos",
    linkLabel: "Ver despachos",
  },
  {
    label: "Retornos pendientes",
    value: 4,
    icon: CornerDownLeft,
    alertColor: (v: number) => v > 0 ? "text-warning" : "text-foreground",
    bgColor: (v: number) => v > 0 ? "bg-amber-50" : "bg-card",
    link: "/entrega/retornos",
    linkLabel: "Ver retornos",
  },
];

const topRutas = [
  { ruta: "LIM-01", vendedor: "Juan López", devoluciones: 18, unidades: 47, porcentaje: "6.2%" },
  { ruta: "PRV-01", vendedor: "María Torres", devoluciones: 14, unidades: 38, porcentaje: "5.8%" },
  { ruta: "LIM-02", vendedor: "Pedro Soto", devoluciones: 9, unidades: 22, porcentaje: "3.4%" },
  { ruta: "LIM-03", vendedor: "Carlos Ríos", devoluciones: 6, unidades: 15, porcentaje: "2.1%" },
  { ruta: "PRV-02", vendedor: "Ana Mendoza", devoluciones: 4, unidades: 10, porcentaje: "1.7%" },
];

// ==================== COMPONENT ====================

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard Operativo</h1>
        <p className="text-sm text-muted-foreground mt-1">Resumen del día — 20/03/2026</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className={cn("border", kpi.bgColor(kpi.value))}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <p className={cn("text-3xl font-bold tracking-tight", kpi.alertColor(kpi.value))}>
                    {kpi.value}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/60 p-2.5">
                  <kpi.icon className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
              <Link
                to={kpi.link}
                className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-primary hover:underline"
              >
                {kpi.linkLabel}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top rutas table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Top 5 rutas con mayor devolución — últimos 7 días</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link to="/entrega/retornos">Ver retornos</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">#</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ruta</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Vendedor</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-right">Devoluciones</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-right">Unidades</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-right">% del total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topRutas.map((r, i) => (
                <TableRow key={r.ruta} className="h-11">
                  <TableCell className="text-sm font-medium text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="text-sm font-semibold">{r.ruta}</TableCell>
                  <TableCell className="text-sm">{r.vendedor}</TableCell>
                  <TableCell className="text-sm text-right font-medium">{r.devoluciones}</TableCell>
                  <TableCell className="text-sm text-right text-muted-foreground">{r.unidades}</TableCell>
                  <TableCell className="text-sm text-right">
                    <span className={cn(
                      "font-medium",
                      parseFloat(r.porcentaje) > 5 ? "text-danger" : parseFloat(r.porcentaje) > 3 ? "text-warning" : "text-foreground",
                    )}>
                      {r.porcentaje}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
