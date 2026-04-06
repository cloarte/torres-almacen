import { createContext, useContext, useState, ReactNode } from "react";

export type Condicion = "ÓPTIMO" | "PRÓXIMO_VENCER" | "VENCIDO" | "DEFECTO_ESTÉTICO";

export interface LoteProducto {
  sku: string;
  nombre: string;
  cantidadOriginal: number;
  cantidadDisponible: number;
  despachado: number;
  devuelto: number;
}

export interface Lote {
  id: string;
  numero: string;
  fechaFabricacion: string;
  fechaVencimiento: string;
  diasRestantes: number;
  numProductos: number;
  condicion: Condicion;
  stockDisponible: number;
  unidad: string;
}

export interface Movimiento {
  fecha: string;
  tipo: string;
  referencia: string;
  cantidad: number;
  detalle: string;
}

const initialLotes: Lote[] = [
  { id: "1", numero: "L-2026-012", fechaFabricacion: "2026-03-01", fechaVencimiento: "2026-04-30", diasRestantes: 41, numProductos: 3, condicion: "ÓPTIMO", stockDisponible: 280, unidad: "und" },
  { id: "2", numero: "L-2026-011", fechaFabricacion: "2026-02-20", fechaVencimiento: "2026-03-21", diasRestantes: 1, numProductos: 2, condicion: "PRÓXIMO_VENCER", stockDisponible: 45, unidad: "und" },
  { id: "3", numero: "L-2026-010", fechaFabricacion: "2026-02-15", fechaVencimiento: "2026-03-16", diasRestantes: -4, numProductos: 1, condicion: "VENCIDO", stockDisponible: 8, unidad: "und" },
  { id: "4", numero: "L-2026-009", fechaFabricacion: "2026-02-25", fechaVencimiento: "2026-04-25", diasRestantes: 36, numProductos: 4, condicion: "DEFECTO_ESTÉTICO", stockDisponible: 180, unidad: "und" },
];

const initialProductos: Record<string, LoteProducto[]> = {
  "1": [
    { sku: "PAN-CL-900", nombre: "Panetón Clásico 900g", cantidadOriginal: 200, cantidadDisponible: 120, despachado: 80, devuelto: 0 },
    { sku: "PAN-MOL-INT", nombre: "Pan de Molde Integral", cantidadOriginal: 100, cantidadDisponible: 90, despachado: 12, devuelto: 2 },
    { sku: "KEK-MAR-400", nombre: "Keke Marmoleado 400g", cantidadOriginal: 80, cantidadDisponible: 70, despachado: 10, devuelto: 0 },
  ],
  "2": [
    { sku: "BIZ-VAN-500", nombre: "Bizcocho Vainilla 500g", cantidadOriginal: 40, cantidadDisponible: 25, despachado: 16, devuelto: 1 },
    { sku: "TOR-HEL-1K", nombre: "Torta Helada 1kg", cantidadOriginal: 30, cantidadDisponible: 20, despachado: 10, devuelto: 0 },
  ],
  "3": [
    { sku: "PAN-FRA-10", nombre: "Pan Francés (bolsa x10)", cantidadOriginal: 50, cantidadDisponible: 8, despachado: 42, devuelto: 0 },
  ],
  "4": [
    { sku: "PAN-CL-900", nombre: "Panetón Clásico 900g", cantidadOriginal: 100, cantidadDisponible: 80, despachado: 20, devuelto: 0 },
    { sku: "GAL-SOD-6", nombre: "Galleta Soda x6", cantidadOriginal: 60, cantidadDisponible: 50, despachado: 10, devuelto: 0 },
    { sku: "EMP-CAR-4", nombre: "Empanada de Carne x4", cantidadOriginal: 40, cantidadDisponible: 30, despachado: 10, devuelto: 0 },
    { sku: "KEK-MAR-400", nombre: "Keke Marmoleado 400g", cantidadOriginal: 30, cantidadDisponible: 20, despachado: 10, devuelto: 0 },
  ],
};

const initialMovimientos: Record<string, Movimiento[]> = {
  "1": [
    { fecha: "01/03/2026", tipo: "Ingreso", referencia: "PROD-2026-012", cantidad: 380, detalle: "Producción finalizada — QC aprobado" },
    { fecha: "10/03/2026", tipo: "Despacho", referencia: "DSP-2026-0015", cantidad: -52, detalle: "Ruta LIM-01 — Juan López" },
    { fecha: "15/03/2026", tipo: "Despacho", referencia: "DSP-2026-0018", cantidad: -50, detalle: "Ruta LIM-02 — Pedro Soto" },
    { fecha: "16/03/2026", tipo: "Retorno", referencia: "RET-2026-003", cantidad: 2, detalle: "Pan de Molde — empaque dañado" },
  ],
  "2": [
    { fecha: "20/02/2026", tipo: "Ingreso", referencia: "PROD-2026-011", cantidad: 70, detalle: "Producción finalizada" },
    { fecha: "05/03/2026", tipo: "Despacho", referencia: "DSP-2026-0016", cantidad: -26, detalle: "Ruta PRV-01 — María Torres" },
    { fecha: "06/03/2026", tipo: "Retorno", referencia: "RET-2026-002", cantidad: 1, detalle: "Bizcocho — cliente rechazó" },
  ],
  "3": [
    { fecha: "15/02/2026", tipo: "Ingreso", referencia: "PROD-2026-010", cantidad: 50, detalle: "Producción finalizada" },
    { fecha: "01/03/2026", tipo: "Despacho", referencia: "DSP-2026-0014", cantidad: -42, detalle: "Ruta LIM-01 — Juan López" },
  ],
  "4": [
    { fecha: "25/02/2026", tipo: "Ingreso", referencia: "PROD-2026-009", cantidad: 230, detalle: "Producción finalizada — defecto estético reportado" },
    { fecha: "12/03/2026", tipo: "Despacho", referencia: "DSP-2026-0017", cantidad: -50, detalle: "Ruta LIM-02 — Pedro Soto" },
  ],
};

export interface FifoResult {
  success: boolean;
  warnings: { sku: string; nombre: string; needed: number; available: number }[];
  affectedLotes: number;
}

interface LotesContextType {
  lotes: Lote[];
  setLotes: React.Dispatch<React.SetStateAction<Lote[]>>;
  productosPorLote: Record<string, LoteProducto[]>;
  setProductosPorLote: React.Dispatch<React.SetStateAction<Record<string, LoteProducto[]>>>;
  movimientos: Record<string, Movimiento[]>;
  setMovimientos: React.Dispatch<React.SetStateAction<Record<string, Movimiento[]>>>;
  checkFifo: (items: { sku: string; nombre: string; cantidad: number }[]) => FifoResult;
  applyFifo: (items: { sku: string; nombre: string; cantidad: number }[], pedidoNumero: string) => number;
}

const LotesContext = createContext<LotesContextType | null>(null);

export function LotesProvider({ children }: { children: ReactNode }) {
  const [lotes, setLotes] = useState<Lote[]>(initialLotes);
  const [productosPorLote, setProductosPorLote] = useState(initialProductos);
  const [movimientos, setMovimientos] = useState(initialMovimientos);

  // Sort lotes by fechaFabricacion ASC (FIFO)
  const getSortedLoteIds = () =>
    [...lotes].sort((a, b) => a.fechaFabricacion.localeCompare(b.fechaFabricacion)).map((l) => l.id);

  const checkFifo = (items: { sku: string; nombre: string; cantidad: number }[]): FifoResult => {
    const warnings: FifoResult["warnings"] = [];
    const sortedIds = getSortedLoteIds();

    for (const item of items) {
      let available = 0;
      for (const loteId of sortedIds) {
        const prods = productosPorLote[loteId] || [];
        const prod = prods.find((p) => p.sku === item.sku);
        if (prod) available += prod.cantidadDisponible;
      }
      if (available < item.cantidad) {
        warnings.push({ sku: item.sku, nombre: item.nombre, needed: item.cantidad, available });
      }
    }

    return { success: warnings.length === 0, warnings, affectedLotes: 0 };
  };

  const applyFifo = (items: { sku: string; nombre: string; cantidad: number }[], pedidoNumero: string): number => {
    const sortedIds = getSortedLoteIds();
    const affectedLoteIds = new Set<string>();

    setProductosPorLote((prev) => {
      const next = { ...prev };
      for (const loteId of Object.keys(next)) {
        next[loteId] = [...next[loteId].map((p) => ({ ...p }))];
      }

      for (const item of items) {
        let remaining = item.cantidad;
        for (const loteId of sortedIds) {
          if (remaining <= 0) break;
          const prods = next[loteId];
          if (!prods) continue;
          const prod = prods.find((p) => p.sku === item.sku);
          if (!prod || prod.cantidadDisponible <= 0) continue;

          const deduct = Math.min(remaining, prod.cantidadDisponible);
          prod.cantidadDisponible -= deduct;
          prod.despachado += deduct;
          remaining -= deduct;
          affectedLoteIds.add(loteId);
        }
      }

      return next;
    });

    // Update lote stockDisponible totals
    setLotes((prev) =>
      prev.map((l) => {
        const prods = productosPorLote[l.id];
        if (!prods || !affectedLoteIds.has(l.id)) return l;
        // Recalculate from items
        let totalDeducted = 0;
        for (const item of items) {
          const prod = prods.find((p) => p.sku === item.sku);
          if (prod) {
            const available = prod.cantidadDisponible;
            const deduct = Math.min(item.cantidad, available);
            totalDeducted += deduct;
          }
        }
        return { ...l, stockDisponible: Math.max(0, l.stockDisponible - totalDeducted) };
      })
    );

    return affectedLoteIds.size;
  };

  return (
    <LotesContext.Provider value={{ lotes, setLotes, productosPorLote, setProductosPorLote, movimientos, setMovimientos, checkFifo, applyFifo }}>
      {children}
    </LotesContext.Provider>
  );
}

export function useLotes() {
  const ctx = useContext(LotesContext);
  if (!ctx) throw new Error("useLotes must be used inside LotesProvider");
  return ctx;
}
