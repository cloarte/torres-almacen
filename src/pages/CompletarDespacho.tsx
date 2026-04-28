import { useState, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { AlertTriangle, FilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ---------- Types ----------

interface Faltante {
  sku: string;
  producto: string;
  original: number;
  retirado: number;
  faltante: number;
}

interface LoteSugerido {
  id: string;
  codigo: string;
  vencimiento: string;
  condicion: "ÓPTIMO" | "DEFECTO_ESTÉTICO";
  disponible: number;
  fechaFabricacion: string;
}

// ---------- Mock data ----------

const mockDespachoNumero = "DSP-2026-0016";

const mockFaltantes: Faltante[] = [
  { sku: "PAN-CL-900", producto: "Panetón Clásico 900g", original: 20, retirado: 5, faltante: 5 },
  { sku: "KEK-MAR-400", producto: "Keke Marmoleado 400g", original: 12, retirado: 3, faltante: 3 },
];

const mockLotesPorSku: Record<string, LoteSugerido[]> = {
  "PAN-CL-900": [
    {
      id: "L-2026-012",
      codigo: "L-2026-012",
      vencimiento: "30/04/2026",
      condicion: "ÓPTIMO",
      disponible: 45,
      fechaFabricacion: "2026-03-01",
    },
  ],
  "KEK-MAR-400": [
    {
      id: "L-2026-009",
      codigo: "L-2026-009",
      vencimiento: "25/04/2026",
      condicion: "DEFECTO_ESTÉTICO",
      disponible: 12,
      fechaFabricacion: "2026-02-25",
    },
  ],
};

// Suggestion logic: ÓPTIMO FIFO first, then DEFECTO_ESTÉTICO
function suggestAssignments(faltante: number, lotes: LoteSugerido[]): Record<string, number> {
  const sorted = [...lotes].sort((a, b) => {
    if (a.condicion !== b.condicion) return a.condicion === "ÓPTIMO" ? -1 : 1;
    return a.fechaFabricacion.localeCompare(b.fechaFabricacion);
  });
  const result: Record<string, number> = {};
  let remaining = faltante;
  for (const lote of sorted) {
    if (remaining <= 0) break;
    const take = Math.min(remaining, lote.disponible);
    result[lote.id] = take;
    remaining -= take;
  }
  return result;
}

const condicionStyles: Record<string, string> = {
  ÓPTIMO: "bg-green-100 text-green-700",
  DEFECTO_ESTÉTICO: "bg-amber-100 text-amber-700",
};

// ---------- Component ----------

export default function CompletarDespacho() {
  const navigate = useNavigate();
  const { id } = useParams();

  const initialAssignments = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    for (const f of mockFaltantes) {
      map[f.sku] = suggestAssignments(f.faltante, mockLotesPorSku[f.sku] || []);
    }
    return map;
  }, []);

  const [assignments, setAssignments] = useState(initialAssignments);
  const [skipped, setSkipped] = useState<Record<string, boolean>>({});

  const handleAssignChange = (sku: string, loteId: string, value: number) => {
    setAssignments((prev) => ({
      ...prev,
      [sku]: { ...prev[sku], [loteId]: Math.max(0, value) },
    }));
  };

  const getCubierto = (sku: string) =>
    Object.values(assignments[sku] || {}).reduce((s, v) => s + v, 0);

  const totalNecesario = mockFaltantes.reduce((s, f) => s + f.faltante, 0);
  const totalCubierto = mockFaltantes.reduce(
    (s, f) => s + (skipped[f.sku] ? f.faltante : Math.min(getCubierto(f.sku), f.faltante)),
    0,
  );

  const handleConfirm = () => {
    toast.success("Despacho completado. El Inspector debe revisarlo nuevamente.");
    navigate("/entrega/despachos");
  };

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link to="/entrega/despachos">Entrega</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link to="/entrega/despachos">Despachos</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Completar {mockDespachoNumero}</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Completar Despacho {mockDespachoNumero}
        </h1>
      </div>

      {/* Amber banner */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          El Inspector retiró productos de este despacho. Completa las unidades faltantes
          usando los lotes sugeridos.
        </p>
      </div>

      {/* Two-section layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT — Productos con faltante */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Productos con faltante</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="text-xs uppercase">Producto</TableHead>
                  <TableHead className="text-xs uppercase">SKU</TableHead>
                  <TableHead className="text-xs uppercase text-right">Original</TableHead>
                  <TableHead className="text-xs uppercase text-right">Retirado</TableHead>
                  <TableHead className="text-xs uppercase text-right">Faltante</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockFaltantes.map((f) => (
                  <TableRow key={f.sku} className="h-11">
                    <TableCell className="text-sm">{f.producto}</TableCell>
                    <TableCell className="text-sm font-mono text-muted-foreground">{f.sku}</TableCell>
                    <TableCell className="text-sm text-right">{f.original}u</TableCell>
                    <TableCell className="text-sm text-right text-muted-foreground">{f.retirado}u</TableCell>
                    <TableCell className="text-sm text-right text-red-600 font-bold">{f.faltante}u</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* RIGHT — Lotes sugeridos */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Lotes sugeridos para completar</h2>
          {mockFaltantes.map((f) => {
            const lotes = mockLotesPorSku[f.sku] || [];
            const cubierto = getCubierto(f.sku);
            const fullyCovered = cubierto >= f.faltante;
            const isSkipped = skipped[f.sku];
            const noStock = lotes.length === 0;

            if (noStock) {
              return (
                <Card key={f.sku} className="border-red-200 bg-red-50">
                  <CardContent className="p-4 space-y-2">
                    <p className="text-sm text-red-800">
                      Sin stock disponible para <span className="font-semibold">{f.producto}</span>.
                      Puedes continuar sin este producto o reducir la cantidad del pedido.
                    </p>
                    <label className="flex items-center gap-2 text-sm text-red-800">
                      <Checkbox
                        checked={!!isSkipped}
                        onCheckedChange={(c) => setSkipped((prev) => ({ ...prev, [f.sku]: c === true }))}
                      />
                      Despachar sin este producto
                    </label>
                  </CardContent>
                </Card>
              );
            }

            return (
              <Card key={f.sku}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{f.producto}</CardTitle>
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-700">
                      Faltan {f.faltante}u
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="text-xs uppercase">Lote</TableHead>
                        <TableHead className="text-xs uppercase">Vence</TableHead>
                        <TableHead className="text-xs uppercase">Condición</TableHead>
                        <TableHead className="text-xs uppercase text-right">Disp.</TableHead>
                        <TableHead className="text-xs uppercase text-right w-24">Asignar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lotes.map((l) => (
                        <TableRow key={l.id} className="h-11">
                          <TableCell className="text-sm font-medium">{l.codigo}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{l.vencimiento}</TableCell>
                          <TableCell>
                            <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium", condicionStyles[l.condicion])}>
                              {l.condicion.replace("_", " ")}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-right text-muted-foreground">{l.disponible}u</TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              min={0}
                              max={l.disponible}
                              className="w-20 h-8 text-right text-sm ml-auto"
                              value={assignments[f.sku]?.[l.id] || 0}
                              onChange={(e) =>
                                handleAssignChange(f.sku, l.id, parseInt(e.target.value) || 0)
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className={cn(
                    "px-4 py-2 text-sm font-medium border-t",
                    fullyCovered ? "text-green-700 bg-green-50" : "text-red-600 bg-red-50",
                  )}>
                    Cubierto: {cubierto}u de {f.faltante}u necesarias
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-64 right-0 bg-card border-t shadow-lg px-6 py-3 flex items-center justify-between z-40">
        <p className="text-sm">
          <span className="text-muted-foreground">Cobertura total:</span>{" "}
          <span className="font-semibold">
            {totalCubierto} de {totalNecesario} unidades cubiertas
          </span>
        </p>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate("/entrega/despachos")}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
          >
            <FilePlus className="h-4 w-4" />
            Confirmar y volver a PLANIFICADO
          </Button>
        </div>
      </div>
    </div>
  );
}
