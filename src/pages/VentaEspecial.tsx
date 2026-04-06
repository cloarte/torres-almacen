import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type ColumnDef,
  type SortingState,
  flexRender,
} from "@tanstack/react-table";
import { Search, Filter, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Condicion = "PRÓXIMO_VENCER" | "DEFECTO_ESTÉTICO";
type Estado = "DISPONIBLE" | "RESERVADO" | "AGOTADO";

interface VentaEspecialItem {
  id: string;
  producto: string;
  sku: string;
  lote: string;
  vencimiento: string;
  diasRestantes: number;
  condicion: Condicion;
  cantidadDisponible: number;
  precioEspecial: number;
  canalDestino: string;
  estado: Estado;
}

const mockData: VentaEspecialItem[] = [
  {
    id: "1",
    producto: "Panetón Clásico 900g",
    sku: "PAN-CL-900",
    lote: "L-2026-011",
    vencimiento: "21/03/2026",
    diasRestantes: 1,
    condicion: "PRÓXIMO_VENCER",
    cantidadDisponible: 45,
    precioEspecial: 12.0,
    canalDestino: "Todos",
    estado: "DISPONIBLE",
  },
  {
    id: "2",
    producto: "Keke Marmoleado 400g",
    sku: "KEK-MAR-400",
    lote: "L-2026-009",
    vencimiento: "25/04/2026",
    diasRestantes: 36,
    condicion: "DEFECTO_ESTÉTICO",
    cantidadDisponible: 60,
    precioEspecial: 5.5,
    canalDestino: "Tradicional",
    estado: "DISPONIBLE",
  },
  {
    id: "3",
    producto: "Pan de Molde Integral",
    sku: "PAN-MOL-INT",
    lote: "L-2026-011",
    vencimiento: "21/03/2026",
    diasRestantes: 1,
    condicion: "PRÓXIMO_VENCER",
    cantidadDisponible: 30,
    precioEspecial: 4.0,
    canalDestino: "Todos",
    estado: "RESERVADO",
  },
  {
    id: "4",
    producto: "Empanada Pollo x12",
    sku: "EMP-POL-12",
    lote: "L-2026-009",
    vencimiento: "25/04/2026",
    diasRestantes: 36,
    condicion: "DEFECTO_ESTÉTICO",
    cantidadDisponible: 20,
    precioEspecial: 8.0,
    canalDestino: "Moderno",
    estado: "AGOTADO",
  },
];

const condicionBadge = (c: Condicion) => {
  if (c === "DEFECTO_ESTÉTICO")
    return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-0">Defecto Estético</Badge>;
  return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-0">Próximo a Vencer</Badge>;
};

const estadoBadge = (e: Estado) => {
  if (e === "DISPONIBLE")
    return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0">Disponible</Badge>;
  if (e === "RESERVADO")
    return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0">Reservado</Badge>;
  return <Badge className="bg-gray-100 text-gray-500 hover:bg-gray-100 border-0">Agotado</Badge>;
};

export default function VentaEspecial() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [condicionFilter, setCondicionFilter] = useState("todos");
  const [canalFilter, setCanalFilter] = useState("todos");
  const [estadoFilter, setEstadoFilter] = useState("todos");
  const [venceFilter, setVenceFilter] = useState("todos");
  const [showFilters, setShowFilters] = useState(false);

  const filteredData = useMemo(() => {
    let data = mockData;
    if (condicionFilter !== "todos") data = data.filter((d) => d.condicion === condicionFilter);
    if (canalFilter !== "todos") data = data.filter((d) => d.canalDestino === canalFilter);
    if (estadoFilter !== "todos") data = data.filter((d) => d.estado === estadoFilter);
    if (venceFilter === "7d") data = data.filter((d) => d.diasRestantes <= 7);
    else if (venceFilter === "15d") data = data.filter((d) => d.diasRestantes <= 15);
    return data;
  }, [condicionFilter, canalFilter, estadoFilter, venceFilter]);

  const columns = useMemo<ColumnDef<VentaEspecialItem>[]>(
    () => [
      { accessorKey: "producto", header: "Producto" },
      { accessorKey: "sku", header: "SKU", cell: ({ row }) => <span className="font-mono text-xs">{row.original.sku}</span> },
      { accessorKey: "lote", header: "Lote", cell: ({ row }) => <span className="font-mono text-xs">{row.original.lote}</span> },
      { accessorKey: "vencimiento", header: "Vencimiento" },
      { accessorKey: "diasRestantes", header: "Días rest.", cell: ({ row }) => <span className={row.original.diasRestantes <= 7 ? "text-destructive font-semibold" : ""}>{row.original.diasRestantes}d</span> },
      { accessorKey: "condicion", header: "Condición", cell: ({ row }) => condicionBadge(row.original.condicion) },
      { accessorKey: "cantidadDisponible", header: "Cant. disp.", cell: ({ row }) => `${row.original.cantidadDisponible}u` },
      { accessorKey: "precioEspecial", header: "Precio especial", cell: ({ row }) => `S/${row.original.precioEspecial.toFixed(2)}` },
      { accessorKey: "canalDestino", header: "Canal destino" },
      { accessorKey: "estado", header: "Estado", cell: ({ row }) => estadoBadge(row.original.estado) },
    ],
    []
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
  });

  const activeFilters = [condicionFilter, canalFilter, estadoFilter, venceFilter].filter((f) => f !== "todos").length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Pool de Venta Especial</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Productos aprobados por Gerencia para venta con descuento.</p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar producto, SKU, lote..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <Popover open={showFilters} onOpenChange={setShowFilters}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Filter className="h-3.5 w-3.5" />
              Filtros
              {activeFilters > 0 && (
                <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground px-1">
                  {activeFilters}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Condición</label>
              <Select value={condicionFilter} onValueChange={setCondicionFilter}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  <SelectItem value="PRÓXIMO_VENCER">Próximo a Vencer</SelectItem>
                  <SelectItem value="DEFECTO_ESTÉTICO">Defecto Estético</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Canal</label>
              <Select value={canalFilter} onValueChange={setCanalFilter}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="Tradicional">Tradicional</SelectItem>
                  <SelectItem value="Moderno">Moderno</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Estado</label>
              <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="DISPONIBLE">Disponible</SelectItem>
                  <SelectItem value="RESERVADO">Reservado</SelectItem>
                  <SelectItem value="AGOTADO">Agotado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Vence en</label>
              <Select value={venceFilter} onValueChange={setVenceFilter}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="7d">≤ 7 días</SelectItem>
                  <SelectItem value="15d">≤ 15 días</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => { setCondicionFilter("todos"); setCanalFilter("todos"); setEstadoFilter("todos"); setVenceFilter("todos"); }}>
              Limpiar filtros
            </Button>
          </PopoverContent>
        </Popover>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id} className="text-xs">
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                  No se encontraron productos.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
