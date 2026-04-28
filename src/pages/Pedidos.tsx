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
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  precioOriginal?: number;
  precioEspecial?: number;
}

type RowKind = "PEDIDO" | "SOBRESTOCK" | "CARRITO";

interface Pedido {
  id: string;
  numero: string;
  cliente: string;
  vendedor: string;
  canal: string;
  ruta: string | null;
  fechaPedido: string;
  fechaEntrega: string;
  urgencia: "HOY" | "MAÑANA" | string;
  estado: string;
  total: string;
  origen: "INTERNO" | "PORTAL" | "ESPECIAL";
  creadoPor: string | null;
  productos: PedidoProducto[];
  kind?: RowKind;
}

// Stock disponible total por SKU (mock)
const stockPorSku: Record<string, number> = {
  "PAN-CL-900": 120,
  "PAN-MOL-BL": 85,
  "EMP-POL-12": 30,
  "CRO-MAN": 0,
  "TOR-3L-1K": 15,
  "PAN-CHO-900": 60,
  "PAN-MOL-INT": 70,
  "KEK-MAR-400": 40,
};

// ---------- Mock data ----------
const P = (
  id: string,
  numero: string,
  cliente: string,
  vendedor: string,
  canal: string,
  ruta: string | null,
  urgencia: string,
  fechaEntrega: string,
  total: string,
  origen: "INTERNO" | "PORTAL" | "ESPECIAL",
  productos: PedidoProducto[],
  kind: RowKind = "PEDIDO"
): Pedido => ({
  id,
  numero,
  cliente,
  vendedor,
  canal,
  ruta,
  fechaPedido: "2026-03-18",
  fechaEntrega,
  urgencia,
  estado: "PENDIENTE",
  total,
  origen,
  creadoPor: vendedor,
  productos,
  kind,
});

const mockData: Pedido[] = [
  // Carlos Ríos - LIM-01
  P("1", "PED-2026-0045", "Bodega San Martín", "Carlos Ríos", "Tradicional", "LIM-01", "HOY", "2026-03-20", "S/ 480", "PORTAL", [
    { sku: "PAN-CL-900", nombre: "Panetón Clásico 900g", cantidad: 10 },
    { sku: "PAN-MOL-BL", nombre: "Pan de Molde Blanco 500g", cantidad: 12 },
  ]),
  P("2", "PED-2026-0039", "Minimarket Los Andes", "Carlos Ríos", "Tradicional", "LIM-01", "HOY", "2026-03-20", "S/ 320", "INTERNO", [
    { sku: "EMP-POL-12", nombre: "Empanada Pollo x12", cantidad: 8 },
  ]),
  P("3", "PED-2026-0033", "Bodega El Progreso", "Carlos Ríos", "Tradicional", "LIM-01", "MAÑANA", "2026-03-21", "S/ 560", "PORTAL", [
    { sku: "CRO-MAN", nombre: "Croissant Mantequilla", cantidad: 20 },
    { sku: "PAN-CL-900", nombre: "Panetón Clásico 900g", cantidad: 6 },
  ]),
  P("4", "PED-2026-0027", "Tienda Señora Rosa", "Carlos Ríos", "Tradicional", "LIM-01", "MAÑANA", "2026-03-21", "S/ 210", "INTERNO", [
    { sku: "KEK-MAR-400", nombre: "Keke Marmoleado 400g", cantidad: 6 },
  ]),
  P("5s", "SBS-CR-LIM01", "Sobrestock disponible para venta directa", "Carlos Ríos", "Tradicional", "LIM-01", "HOY", "2026-03-20", "S/ 850", "INTERNO", [
    { sku: "PAN-CL-900", nombre: "Panetón Clásico 900g", cantidad: 15 },
    { sku: "PAN-MOL-BL", nombre: "Pan de Molde Blanco 500g", cantidad: 20 },
  ], "SOBRESTOCK"),
  P("5c", "CARR-CR-LIM01", "Carrito de ayer (referencial)", "Carlos Ríos", "Tradicional", "LIM-01", "—", "—", "—", "INTERNO", [
    { sku: "PAN-CL-900", nombre: "Panetón Clásico 900g", cantidad: 8 },
    { sku: "PAN-MOL-BL", nombre: "Pan de Molde Blanco 500g", cantidad: 12 },
    { sku: "KEK-MAR-400", nombre: "Keke Marmoleado 400g", cantidad: 5 },
  ], "CARRITO"),

  // María Torres - LIM-02
  P("6", "PED-2026-0044", "Bodega La Cruz", "María Torres", "Tradicional", "LIM-02", "HOY", "2026-03-20", "S/ 390", "PORTAL", [
    { sku: "PAN-MOL-BL", nombre: "Pan de Molde Blanco 500g", cantidad: 18 },
  ]),
  P("7", "PED-2026-0038", "Minimarket Don José", "María Torres", "Tradicional", "LIM-02", "HOY", "2026-03-20", "S/ 275", "INTERNO", [
    { sku: "EMP-POL-12", nombre: "Empanada Pollo x12", cantidad: 12 },
  ]),
  P("8", "PED-2026-0032", "Bodega Santa Rosa", "María Torres", "Tradicional", "LIM-02", "MAÑANA", "2026-03-21", "S/ 440", "PORTAL", [
    { sku: "PAN-CL-900", nombre: "Panetón Clásico 900g", cantidad: 14 },
  ]),
  P("9", "PED-2026-0026", "Tienda El Carmen", "María Torres", "Tradicional", "LIM-02", "MAÑANA", "2026-03-21", "S/ 180", "INTERNO", [
    { sku: "KEK-MAR-400", nombre: "Keke Marmoleado 400g", cantidad: 5 },
  ]),
  P("10s", "SBS-MT-LIM02", "Sobrestock disponible para venta directa", "María Torres", "Tradicional", "LIM-02", "HOY", "2026-03-20", "S/ 620", "INTERNO", [
    { sku: "PAN-MOL-BL", nombre: "Pan de Molde Blanco 500g", cantidad: 18 },
    { sku: "EMP-POL-12", nombre: "Empanada Pollo x12", cantidad: 10 },
  ], "SOBRESTOCK"),
  P("10c", "CARR-MT-LIM02", "Carrito de ayer (referencial)", "María Torres", "Tradicional", "LIM-02", "—", "—", "—", "INTERNO", [
    { sku: "PAN-CHO-900", nombre: "Panetón Chocolate 900g", cantidad: 6 },
    { sku: "EMP-POL-12", nombre: "Empanada Pollo x12", cantidad: 10 },
    { sku: "CRO-MAN", nombre: "Croissant Mantequilla", cantidad: 4 },
  ], "CARRITO"),

  // Pedro Soto - LIM-03 (no rutas listadas — usaremos LIM-03 informalmente)
  P("11", "PED-2026-0043", "Distribuidora Lima", "Pedro Soto", "Tradicional", "LIM-02", "HOY", "2026-03-20", "S/ 720", "INTERNO", [
    { sku: "PAN-CL-900", nombre: "Panetón Clásico 900g", cantidad: 25 },
    { sku: "CRO-MAN", nombre: "Croissant Mantequilla", cantidad: 15 },
  ]),
  P("12", "PED-2026-0037", "Bodega El Sol", "Pedro Soto", "Tradicional", "LIM-02", "HOY", "2026-03-20", "S/ 310", "PORTAL", [
    { sku: "PAN-MOL-INT", nombre: "Pan de Molde Integral", cantidad: 8 },
  ]),
  P("13", "PED-2026-0031", "Minimarket Perú", "Pedro Soto", "Tradicional", "LIM-02", "MAÑANA", "2026-03-21", "S/ 490", "INTERNO", [
    { sku: "KEK-MAR-400", nombre: "Keke Marmoleado 400g", cantidad: 12 },
  ]),
  P("14", "PED-2026-0025", "Tienda San Pedro", "Pedro Soto", "Tradicional", "LIM-02", "MAÑANA", "2026-03-21", "S/ 230", "PORTAL", [
    { sku: "PAN-MOL-BL", nombre: "Pan de Molde Blanco 500g", cantidad: 8 },
  ]),
  P("15s", "SBS-PS-LIM03", "Sobrestock disponible para venta directa", "Pedro Soto", "Tradicional", "LIM-02", "HOY", "2026-03-20", "S/ 780", "INTERNO", [
    { sku: "PAN-MOL-INT", nombre: "Pan de Molde Integral", cantidad: 15 },
    { sku: "KEK-MAR-400", nombre: "Keke Marmoleado 400g", cantidad: 10 },
  ], "SOBRESTOCK"),
  P("15c", "CARR-PS-LIM03", "Carrito de ayer (referencial)", "Pedro Soto", "Tradicional", "LIM-02", "—", "—", "—", "INTERNO", [
    { sku: "PAN-MOL-INT", nombre: "Pan de Molde Integral", cantidad: 15 },
    { sku: "KEK-MAR-400", nombre: "Keke Marmoleado 400g", cantidad: 8 },
  ], "CARRITO"),

  // Ana Villanueva - PRV-01
  P("16", "PED-2026-0042", "Bodega Norte", "Ana Villanueva", "Tradicional", "PRV-01", "HOY", "2026-03-20", "S/ 2,100", "PORTAL", [
    { sku: "PAN-CL-900", nombre: "Panetón Clásico 900g", cantidad: 50 },
  ]),
  P("17", "PED-2026-0036", "Distribuidora Trujillo", "Ana Villanueva", "Tradicional", "PRV-01", "HOY", "2026-03-20", "S/ 3,400", "INTERNO", [
    { sku: "PAN-MOL-BL", nombre: "Pan de Molde Blanco 500g", cantidad: 80 },
  ]),
  P("18", "PED-2026-0030", "Minimarket Chicama", "Ana Villanueva", "Tradicional", "PRV-01", "MAÑANA", "2026-03-21", "S/ 1,800", "PORTAL", [
    { sku: "EMP-POL-12", nombre: "Empanada Pollo x12", cantidad: 40 },
  ]),
  P("19", "PED-2026-0024", "Bodega El Huaco", "Ana Villanueva", "Tradicional", "PRV-01", "MAÑANA", "2026-03-21", "S/ 950", "INTERNO", [
    { sku: "TOR-3L-1K", nombre: "Torta Tres Leches 1kg", cantidad: 18 },
  ]),
  P("20s", "SBS-AV-PRV01", "Sobrestock disponible para venta directa", "Ana Villanueva", "Tradicional", "PRV-01", "HOY", "2026-03-20", "S/ 2,200", "INTERNO", [
    { sku: "PAN-CL-900", nombre: "Panetón Clásico 900g", cantidad: 30 },
    { sku: "PAN-MOL-BL", nombre: "Pan de Molde Blanco 500g", cantidad: 25 },
  ], "SOBRESTOCK"),
  P("20c", "CARR-AV-PRV01", "Carrito de ayer (referencial)", "Ana Villanueva", "Tradicional", "PRV-01", "—", "—", "—", "INTERNO", [
    { sku: "PAN-CL-900", nombre: "Panetón Clásico 900g", cantidad: 20 },
    { sku: "PAN-MOL-BL", nombre: "Pan de Molde Blanco 500g", cantidad: 18 },
    { sku: "TOR-3L-1K", nombre: "Torta Tres Leches 1kg", cantidad: 3 },
  ], "CARRITO"),

  // Luis Paredes - PRV-02
  P("21", "PED-2026-0041", "Tienda Piura Centro", "Luis Paredes", "Tradicional", "PRV-02", "HOY", "2026-03-20", "S/ 1,650", "PORTAL", [
    { sku: "PAN-CL-900", nombre: "Panetón Clásico 900g", cantidad: 40 },
  ]),
  P("22", "PED-2026-0035", "Bodega El Bosque", "Luis Paredes", "Tradicional", "PRV-02", "HOY", "2026-03-20", "S/ 2,300", "INTERNO", [
    { sku: "EMP-POL-12", nombre: "Empanada Pollo x12", cantidad: 60 },
  ]),
  P("23", "PED-2026-0029", "Distribuidora Piura", "Luis Paredes", "Tradicional", "PRV-02", "MAÑANA", "2026-03-21", "S/ 4,100", "PORTAL", [
    { sku: "PAN-MOL-BL", nombre: "Pan de Molde Blanco 500g", cantidad: 100 },
  ]),
  P("24", "PED-2026-0023", "Minimarket Los Jardines", "Luis Paredes", "Tradicional", "PRV-02", "MAÑANA", "2026-03-21", "S/ 1,200", "INTERNO", [
    { sku: "KEK-MAR-400", nombre: "Keke Marmoleado 400g", cantidad: 25 },
  ]),
  P("25s", "SBS-LP-PRV02", "Sobrestock disponible para venta directa", "Luis Paredes", "Tradicional", "PRV-02", "HOY", "2026-03-20", "S/ 1,900", "INTERNO", [
    { sku: "PAN-CL-900", nombre: "Panetón Clásico 900g", cantidad: 35 },
    { sku: "EMP-POL-12", nombre: "Empanada Pollo x12", cantidad: 20 },
  ], "SOBRESTOCK"),
  P("25c", "CARR-LP-PRV02", "Carrito de ayer (referencial)", "Luis Paredes", "Tradicional", "PRV-02", "—", "—", "—", "INTERNO", [
    { sku: "EMP-POL-12", nombre: "Empanada Pollo x12", cantidad: 12 },
    { sku: "PAN-CHO-900", nombre: "Panetón Chocolate 900g", cantidad: 9 },
    { sku: "KEK-MAR-400", nombre: "Keke Marmoleado 400g", cantidad: 6 },
  ], "CARRITO"),

  // Juan López - Moderno
  P("26", "PED-2026-0044M", "Supermercados Plaza", "Juan López", "Moderno", null, "HOY", "2026-03-20", "S/ 1,850", "INTERNO", [
    { sku: "PAN-CL-900", nombre: "Panetón Clásico 900g", cantidad: 40 },
  ]),
  P("27", "PED-2026-0040M", "Metro San Isidro", "Juan López", "Moderno", null, "HOY", "2026-03-20", "S/ 3,200", "PORTAL", [
    { sku: "PAN-MOL-BL", nombre: "Pan de Molde Blanco 500g", cantidad: 80 },
  ]),
  P("28", "PED-2026-0034M", "Plaza Vea Miraflores", "Juan López", "Moderno", null, "MAÑANA", "2026-03-21", "S/ 2,750", "INTERNO", [
    { sku: "TOR-3L-1K", nombre: "Torta Tres Leches 1kg", cantidad: 40 },
  ]),

  // Roberto Chávez - Corporativo
  P("29", "PED-2026-0042C", "Restaurant El Buen Sabor", "Roberto Chávez", "Corporativo", null, "22/03", "2026-03-22", "S/ 950", "PORTAL", [
    { sku: "EMP-POL-12", nombre: "Empanada Pollo x12", cantidad: 25 },
  ]),
  P("30", "PED-2026-0028", "Colegio San Agustín", "Roberto Chávez", "Corporativo", null, "23/03", "2026-03-23", "S/ 1,400", "INTERNO", [
    { sku: "PAN-MOL-BL", nombre: "Pan de Molde Blanco 500g", cantidad: 30 },
  ]),

  // Carlos Ríos - Directa (ESPECIAL)
  P("31", "PED-2026-0046", "Bodega El Carmen", "Carlos Ríos", "Directa", null, "HOY", "2026-03-20", "S/ 340", "ESPECIAL", [
    { sku: "PAN-CL-900", nombre: "Panetón Clásico 900g", cantidad: 12, precioOriginal: 28, precioEspecial: 18 },
    { sku: "PAN-MOL-BL", nombre: "Pan de Molde Blanco 500g", cantidad: 8, precioOriginal: 12, precioEspecial: 8 },
  ]),
];

// Histórico (no-bandeja)
const historialData: Pedido[] = [
  P("h1", "PED-2026-0020", "Minimarket Los Olivos", "Carlos Ríos", "Tradicional", "LIM-01", "18/03", "2026-03-18", "S/ 1,100", "PORTAL", [
    { sku: "PAN-CL-900", nombre: "Panetón Clásico 900g", cantidad: 30 },
  ]),
  P("h2", "PED-2026-0019", "Cevichería Marina", "Juan López", "Corporativo", null, "17/03", "2026-03-17", "S/ 620", "INTERNO", [
    { sku: "TOR-3L-1K", nombre: "Torta Tres Leches 1kg", cantidad: 8 },
  ]),
];
historialData.forEach((p) => (p.estado = "CONFIRMADO"));

const canalColors: Record<string, string> = {
  Tradicional: "bg-blue-100 text-blue-700",
  Moderno: "bg-emerald-100 text-emerald-700",
  Directa: "bg-violet-100 text-violet-700",
  Corporativo: "bg-orange-100 text-orange-700",
};

const origenColors: Record<string, string> = {
  INTERNO: "bg-purple-100 text-purple-700",
  PORTAL: "bg-teal-100 text-teal-700",
  ESPECIAL: "bg-purple-100 text-purple-700",
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
function parseTotal(t: string): number {
  return Number(t.replace(/[^\d.-]/g, "")) || 0;
}

const RUTAS_POR_CANAL: Record<string, string[]> = {
  Tradicional: ["LIM-01", "LIM-02", "PRV-01", "PRV-02"],
  Corporativo: [],
  Moderno: [],
  Directa: [],
};
const TODAS_LAS_RUTAS = ["LIM-01", "LIM-02", "PRV-01", "PRV-02"];

function vendorInitials(name: string) {
  return name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Pedidos() {
  const [searchParams] = useSearchParams();
  const estadoParam = searchParams.get("estado");
  const isBandeja = estadoParam === "PENDIENTE";

  const [data, setData] = useState<Pedido[]>(isBandeja ? mockData : historialData);
  const [globalFilter, setGlobalFilter] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<Pedido | null>(null);
  const [rejectDialog, setRejectDialog] = useState<Pedido | null>(null);
  const [rejectMotivo, setRejectMotivo] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [canalFilter, setCanalFilter] = useState<string>("all");
  const [rutaFilter, setRutaFilter] = useState<string>("all");
  const [bulkConfirmGroup, setBulkConfirmGroup] = useState<{ key: string; vendedor: string; pedidos: Pedido[] } | null>(null);
  const [bulkForce, setBulkForce] = useState(false);

  const { checkFifo, applyFifo } = useLotes();

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const rutaDisabled = canalFilter !== "all" && canalFilter !== "Tradicional";
  const rutasDisponibles = useMemo(() => {
    if (canalFilter === "all") return TODAS_LAS_RUTAS;
    return RUTAS_POR_CANAL[canalFilter] || [];
  }, [canalFilter]);

  const filteredData = useMemo(() => {
    let rows = data;
    if (estadoParam && !isBandeja) rows = rows.filter((p) => p.estado === estadoParam);
    if (canalFilter !== "all") rows = rows.filter((p) => p.canal === canalFilter);
    if (rutaFilter !== "all") rows = rows.filter((p) => p.ruta === rutaFilter);
    if (globalFilter.trim()) {
      const q = globalFilter.toLowerCase();
      rows = rows.filter(
        (p) =>
          p.numero.toLowerCase().includes(q) ||
          p.cliente.toLowerCase().includes(q) ||
          p.vendedor.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [data, estadoParam, isBandeja, canalFilter, rutaFilter, globalFilter]);

  // Group by vendedor + canal (+ ruta for Tradicional)
  const groups = useMemo(() => {
    if (!isBandeja) return [];
    const map = new Map<string, { key: string; vendedor: string; canal: string; ruta: string | null; rows: Pedido[] }>();
    for (const p of filteredData) {
      const key = `${p.vendedor}|${p.canal}|${p.ruta ?? ""}`;
      if (!map.has(key)) map.set(key, { key, vendedor: p.vendedor, canal: p.canal, ruta: p.ruta, rows: [] });
      map.get(key)!.rows.push(p);
    }
    // Within each group: real pedidos first, then SOBRESTOCK, then CARRITO
    const order = (k?: RowKind) => (k === "CARRITO" ? 2 : k === "SOBRESTOCK" ? 1 : 0);
    for (const g of map.values()) {
      g.rows.sort((a, b) => order(a.kind) - order(b.kind));
    }
    return Array.from(map.values());
  }, [filteredData, isBandeja]);

  const groupSummary = useMemo(() => {
    return groups.map((g) => {
      const realPedidos = g.rows.filter((r) => r.estado === "PENDIENTE" && r.kind !== "CARRITO");
      const total = realPedidos.reduce((acc, p) => acc + parseTotal(p.total), 0);
      return { ...g, count: realPedidos.filter((r) => r.kind === "PEDIDO").length, total, confirmable: realPedidos };
    });
  }, [groups]);

  const totalPendingCount = useMemo(
    () => filteredData.filter((p) => p.estado === "PENDIENTE" && p.kind !== "CARRITO" && p.kind !== "SOBRESTOCK").length,
    [filteredData]
  );
  const totalSum = useMemo(
    () => filteredData
      .filter((p) => p.estado === "PENDIENTE" && p.kind !== "CARRITO")
      .reduce((acc, p) => acc + parseTotal(p.total), 0),
    [filteredData]
  );
  const vendorCount = groups.length;

  const fifoResult = useMemo(() => {
    if (!confirmDialog) return null;
    return checkFifo(confirmDialog.productos);
  }, [confirmDialog, checkFifo]);

  const bulkWarnings = useMemo(() => {
    if (!bulkConfirmGroup) return [];
    const issues: { pedido: string; cliente: string; warnings: { sku: string; nombre: string; needed: number; available: number }[] }[] = [];
    for (const p of bulkConfirmGroup.pedidos) {
      const r = checkFifo(p.productos);
      if (!r.success) issues.push({ pedido: p.numero, cliente: p.cliente, warnings: r.warnings });
    }
    return issues;
  }, [bulkConfirmGroup, checkFifo]);

  const bulkTotal = useMemo(
    () => bulkConfirmGroup?.pedidos.reduce((acc, p) => acc + parseTotal(p.total), 0) ?? 0,
    [bulkConfirmGroup]
  );

  const handleConfirm = () => {
    if (!confirmDialog) return;
    const lotesAfectados = applyFifo(confirmDialog.productos, confirmDialog.numero);
    setData((prev) =>
      prev.map((p) => (p.id === confirmDialog.id ? { ...p, estado: "CONFIRMADO" } : p))
    );
    toast.success(`Pedido ${confirmDialog.numero} confirmado. Stock actualizado en ${lotesAfectados} lote(s).`);
    setConfirmDialog(null);
  };
  const handleReject = () => {
    if (!rejectDialog || !rejectMotivo.trim()) return;
    setData((prev) =>
      prev.map((p) => (p.id === rejectDialog.id ? { ...p, estado: "RECHAZADO" } : p))
    );
    toast.success(`Pedido ${rejectDialog.numero} rechazado.`);
    setRejectDialog(null);
    setRejectMotivo("");
  };
  const handleBulkConfirm = () => {
    if (!bulkConfirmGroup) return;
    let totalLotes = 0;
    const ids = bulkConfirmGroup.pedidos.map((p) => p.id);
    for (const p of bulkConfirmGroup.pedidos) {
      totalLotes += applyFifo(p.productos, p.numero);
    }
    setData((prev) => prev.map((p) => (ids.includes(p.id) ? { ...p, estado: "CONFIRMADO" } : p)));
    toast.success(`${ids.length} pedidos confirmados. Stock actualizado en ${totalLotes} lote(s).`);
    setBulkConfirmGroup(null);
    setBulkForce(false);
  };

  // ---------- "Todos los pedidos" — TanStack table (unchanged-ish) ----------
  const [sorting, setSorting] = useState<SortingState>([{ id: "fechaPedido", desc: true }]);
  const histColumns = useMemo<ColumnDef<Pedido>[]>(
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
      { accessorKey: "cliente", header: "Cliente" },
      {
        accessorKey: "canal", header: "Canal",
        cell: ({ row }) => (
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${canalColors[row.original.canal] || "bg-slate-100 text-slate-600"}`}>
            {row.original.canal}
          </span>
        ),
      },
      {
        accessorKey: "fechaPedido",
        header: ({ column }) => (
          <button className="flex items-center gap-1" onClick={() => column.toggleSorting()}>
            F. Pedido <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.fechaPedido}</span>,
      },
      {
        accessorKey: "estado", header: "Estado",
        cell: ({ row }) => {
          const e = row.original.estado;
          return (
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${estadoColors[e] || "bg-slate-100 text-slate-600"}`}>
              {e}
            </span>
          );
        },
      },
      { accessorKey: "total", header: "Total c/IGV", cell: ({ row }) => <span className="font-medium">{row.original.total}</span> },
      {
        accessorKey: "origen", header: "Origen",
        cell: ({ row }) => (
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${origenColors[row.original.origen]}`}>
            {row.original.origen}
          </span>
        ),
      },
    ],
    []
  );
  const histTable = useReactTable({
    data: filteredData,
    columns: histColumns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  // ---------- Render ----------
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {isBandeja ? "Bandeja de Pedidos" : "Todos los Pedidos"}
        </h1>
        {isBandeja ? (
          <p className="text-sm font-medium text-warning mt-1">
            {totalPendingCount} pedidos pendientes · {vendorCount} vendedores · Total S/ {totalSum.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground mt-1">Historial completo de pedidos</p>
        )}
      </div>

      {/* Search + Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por N° pedido, cliente o vendedor..."
            className="pl-9 bg-card"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
        </div>

        {isBandeja && (
          <>
            <Select value={canalFilter} onValueChange={(v) => { setCanalFilter(v); if (v !== "all" && v !== "Tradicional") setRutaFilter("all"); }}>
              <SelectTrigger className="w-[180px] bg-card"><SelectValue placeholder="Canal" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los canales</SelectItem>
                <SelectItem value="Corporativo">Corporativo</SelectItem>
                <SelectItem value="Moderno">Moderno</SelectItem>
                <SelectItem value="Tradicional">Tradicional</SelectItem>
                <SelectItem value="Directa">Directa</SelectItem>
              </SelectContent>
            </Select>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Select value={rutaFilter} onValueChange={setRutaFilter} disabled={rutaDisabled}>
                      <SelectTrigger className="w-[180px] bg-card"><SelectValue placeholder="Ruta" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las rutas</SelectItem>
                        {rutasDisponibles.map((r) => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TooltipTrigger>
                {rutaDisabled && <TooltipContent>Este canal no tiene rutas asignadas.</TooltipContent>}
              </Tooltip>
            </TooltipProvider>

            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              Estado: PENDIENTE
            </Badge>
          </>
        )}
      </div>

      {/* Body */}
      {isBandeja ? (
        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="w-10"></TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">N° Pedido</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cliente</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Entrega</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Estado</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Origen</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupSummary.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">No hay pedidos.</TableCell>
                </TableRow>
              ) : (
                groupSummary.map((g) => {
                  const collapsed = collapsedGroups.has(g.key);
                  return (
                    <Fragment key={g.key}>
                      {/* LEVEL 1 — vendor header */}
                      <TableRow
                        className="bg-slate-100 border-l-4 border-[#1E3A5F] hover:bg-slate-100/90 cursor-pointer"
                        onClick={() => toggleGroup(g.key)}
                      >
                        <TableCell className="py-2">
                          {collapsed ? <ChevronDown className="h-4 w-4 text-[#1E3A5F]" /> : <ChevronUp className="h-4 w-4 text-[#1E3A5F]" />}
                        </TableCell>
                        <TableCell colSpan={6} className="py-2">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center text-xs font-semibold">
                              {vendorInitials(g.vendedor)}
                            </div>
                            <span className="font-semibold text-foreground">{g.vendedor}</span>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${canalColors[g.canal] || "bg-slate-200 text-slate-600"}`}>
                              {g.canal}
                            </span>
                            {g.ruta && (
                              <span className="text-xs text-muted-foreground font-mono">{g.ruta}</span>
                            )}
                            <span className="text-xs text-muted-foreground">· {g.count} pedido{g.count === 1 ? "" : "s"}</span>
                            <span className="text-xs font-medium text-foreground">
                              · Total S/ {g.total.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-right">
                          {g.confirmable.length > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-[#E8A020] text-[#E8A020] hover:bg-[#E8A020]/10 hover:text-[#E8A020]"
                              onClick={(e) => {
                                e.stopPropagation();
                                setBulkForce(false);
                                setBulkConfirmGroup({ key: g.key, vendedor: g.vendedor, pedidos: g.confirmable });
                              }}
                            >
                              Confirmar todos
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>

                      {/* LEVEL 2 — pedido rows */}
                      {!collapsed && g.rows.map((p) => {
                        const isExpanded = expandedRows.has(p.id);
                        const isCarrito = p.kind === "CARRITO";
                        const isSobrestock = p.kind === "SOBRESTOCK";
                        const isEspecial = p.origen === "ESPECIAL";
                        const hasIssue = p.estado === "PENDIENTE" && !isCarrito && pedidoHasStockIssue(p.productos);

                        let rowClass = "h-12 cursor-pointer transition-colors hover:bg-slate-50/70";
                        if (isCarrito) rowClass = "h-12 bg-amber-50 border-l-4 border-amber-300 opacity-80 cursor-pointer hover:bg-amber-100/60";
                        else if (isSobrestock) rowClass = "h-12 bg-blue-50 border-l-4 border-blue-400 cursor-pointer hover:bg-blue-100/60";
                        else if (isEspecial) rowClass = "h-12 bg-purple-50 border-l-4 border-purple-400 cursor-pointer hover:bg-purple-100/60";
                        else if (hasIssue) rowClass = "h-12 bg-red-50 border-l-4 border-red-400 cursor-pointer hover:bg-red-100/70";

                        const rowContent = (
                          <TableRow key={p.id} className={rowClass} onClick={() => toggleRow(p.id)}>
                            <TableCell className="pl-8">
                              {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                            </TableCell>
                            <TableCell className="text-sm">
                              {isCarrito ? (
                                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700">FLOTANTE</span>
                              ) : isSobrestock ? (
                                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-700">SOBRESTOCK</span>
                              ) : (
                                <span className="font-medium">{p.numero}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm">
                              {isCarrito ? (
                                <span>
                                  Unidades en el camión
                                  <span className="text-slate-500 font-medium"> · {p.productos.reduce((s: number, pr: any) => s + (pr.cantidad || 0), 0)}u</span>
                                </span>
                              ) : (
                                p.cliente
                              )}
                            </TableCell>
                            <TableCell className="text-sm">
                              {urgenciaStyle(p.urgencia) ? (
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${urgenciaStyle(p.urgencia)}`}>{p.urgencia}</span>
                              ) : (
                                <span className="text-muted-foreground">{p.urgencia}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm">
                              {!isCarrito && (
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${estadoColors[p.estado] || "bg-slate-100 text-slate-600"}`}>
                                  {p.estado}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm font-medium">{p.total}</TableCell>
                            <TableCell className="text-sm">
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${origenColors[p.origen]}`}>
                                {p.origen}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              {!isCarrito && p.estado === "PENDIENTE" && (
                                <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
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
                              )}
                            </TableCell>
                          </TableRow>
                        );

                        return (
                          <Fragment key={p.id}>
                            {isCarrito ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>{rowContent}</TooltipTrigger>
                                  <TooltipContent side="top">
                                    Productos del sobrestock de ayer que no se vendieron.<br />
                                    Aún están en el camión del vendedor.
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : rowContent}

                            {/* LEVEL 3 — product detail */}
                            {isExpanded && (
                              <TableRow className="bg-slate-50/50">
                                <TableCell colSpan={8} className="p-0">
                                  <div className="px-12 py-3">
                                    {isCarrito && (
                                      <div className="mb-2 flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                                        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                        Vista referencial. Estos productos ya están en el camión del vendedor.
                                      </div>
                                    )}
                                    <table className="w-full text-sm">
                                      <thead>
                                        <tr className="text-xs text-muted-foreground uppercase">
                                          <th className="text-left py-1 font-medium">Producto</th>
                                          <th className="text-left py-1 font-medium">SKU</th>
                                          <th className="text-right py-1 font-medium">Cantidad pedida</th>
                                          <th className="text-right py-1 font-medium">Stock disponible</th>
                                          {isEspecial && <th className="text-right py-1 font-medium">Precio orig.</th>}
                                          {isEspecial && <th className="text-right py-1 font-medium">Precio especial</th>}
                                          {!isCarrito && <th className="text-right py-1 font-medium">Cobertura</th>}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {p.productos.map((prod) => {
                                          const stockDisp = getStockDisponible(prod.sku);
                                          const cubierto = stockDisp >= prod.cantidad;
                                          return (
                                            <tr key={prod.sku} className="border-t border-slate-100">
                                              <td className="py-2 text-foreground">{prod.nombre}</td>
                                              <td className="py-2 text-muted-foreground font-mono text-xs">{prod.sku}</td>
                                              <td className="py-2 text-right font-medium">{prod.cantidad}u</td>
                                              <td className="py-2 text-right text-muted-foreground">{stockDisp}u</td>
                                              {isEspecial && (
                                                <td className="py-2 text-right text-muted-foreground line-through">
                                                  S/ {prod.precioOriginal?.toFixed(2) ?? "—"}
                                                </td>
                                              )}
                                              {isEspecial && (
                                                <td className="py-2 text-right font-semibold text-purple-700">
                                                  S/ {prod.precioEspecial?.toFixed(2) ?? "—"}
                                                </td>
                                              )}
                                              {!isCarrito && (
                                                <td className="py-2 text-right">
                                                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cubierto ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                                    {cubierto ? "CUBIERTO" : "SIN STOCK"}
                                                  </span>
                                                </td>
                                              )}
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
                      })}
                    </Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        // Historical view
        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              {histTable.getHeaderGroups().map((hg) => (
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
              {histTable.getRowModel().rows.length ? (
                histTable.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="h-12 hover:bg-slate-50/70">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={histColumns.length} className="h-24 text-center text-muted-foreground">No hay pedidos.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between px-4 py-3 border-t bg-slate-50/50">
            <p className="text-xs text-muted-foreground">{histTable.getFilteredRowModel().rows.length} pedido(s)</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => histTable.previousPage()} disabled={!histTable.getCanPreviousPage()}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground">
                Pág. {histTable.getState().pagination.pageIndex + 1} de {histTable.getPageCount()}
              </span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => histTable.nextPage()} disabled={!histTable.getCanNextPage()}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

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
                  <span>Stock insuficiente para <strong>{w.nombre}</strong>: necesitas {w.needed}u, disponible {w.available}u.</span>
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
              <AlertDialogAction onClick={handleConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
            <AlertDialogDescription>Esta acción notificará al cliente.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <label className="text-sm font-medium">Motivo de rechazo <span className="text-red-600">*</span></label>
            <Textarea className="mt-1.5" placeholder="Escribe el motivo..." value={rejectMotivo} onChange={(e) => setRejectMotivo(e.target.value)} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} disabled={!rejectMotivo.trim()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Rechazar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Confirm Dialog (per vendor group) */}
      <AlertDialog open={!!bulkConfirmGroup} onOpenChange={(o) => { if (!o) { setBulkConfirmGroup(null); setBulkForce(false); } }}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Confirmar {bulkConfirmGroup?.pedidos.length ?? 0} pedidos de {bulkConfirmGroup?.vendedor}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Total S/ {bulkTotal.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.
              Los precios quedarán congelados y el stock se actualizará automáticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {bulkWarnings.length > 0 && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 space-y-2 max-h-40 overflow-auto">
              <div className="flex items-center gap-2 text-sm font-medium text-red-700">
                <AlertTriangle className="h-4 w-4" />
                Stock insuficiente en {bulkWarnings.length} pedido(s)
              </div>
              {bulkWarnings.map((w) => (
                <div key={w.pedido} className="text-xs text-red-700 pl-6">
                  <strong>{w.pedido}</strong> — {w.cliente}
                  <ul className="list-disc pl-5 mt-0.5">
                    {w.warnings.map((sk) => (
                      <li key={sk.sku}>{sk.nombre}: necesita {sk.needed}u, disponible {sk.available}u</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-md bg-muted/50 p-3 max-h-48 overflow-auto">
            <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Pedidos a confirmar</p>
            {bulkConfirmGroup?.pedidos.map((p) => (
              <div key={p.id} className="flex justify-between text-sm py-0.5">
                <span><strong>{p.numero}</strong> — {p.cliente}</span>
                <span className="font-medium">{p.total}</span>
              </div>
            ))}
          </div>

          <AlertDialogFooter>
            {bulkWarnings.length > 0 && !bulkForce ? (
              <>
                <AlertDialogCancel onClick={() => setBulkConfirmGroup(null)}>Revisar antes de confirmar</AlertDialogCancel>
                <AlertDialogAction onClick={handleBulkConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Confirmar todos de todas formas
                </AlertDialogAction>
              </>
            ) : (
              <>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleBulkConfirm}>Confirmar todos</AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
