import { useState, useMemo, useCallback, useRef } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type ColumnDef,
  type SortingState,
  flexRender,
} from "@tanstack/react-table";
import { format } from "date-fns";
import {
  Eye,
  Search,
  ArrowUpDown,
  Filter,
  Package,
  Upload,
  Pencil,
  Download,
  FileSpreadsheet,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
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
import { useLotes, type Lote, type Condicion, type LoteProducto } from "@/contexts/LotesContext";

// ==================== HELPERS ====================

const condicionStyles: Record<Condicion, string> = {
  ÓPTIMO: "bg-green-100 text-green-700",
  PRÓXIMO_VENCER: "bg-amber-100 text-amber-700",
  VENCIDO: "bg-red-100 text-red-700",
  DEFECTO_ESTÉTICO: "bg-orange-100 text-orange-700",
};

const condicionLabels: Record<Condicion, string> = {
  ÓPTIMO: "ÓPTIMO",
  PRÓXIMO_VENCER: "PRÓXIMO VENCER",
  VENCIDO: "VENCIDO",
  DEFECTO_ESTÉTICO: "DEFECTO ESTÉTICO",
};

const diasColor = (d: number) => {
  if (d <= 7) return "text-danger font-semibold";
  if (d <= 15) return "text-warning font-semibold";
  return "text-success";
};

const movTipoStyles: Record<string, string> = {
  Ingreso: "bg-green-100 text-green-700",
  Despacho: "bg-blue-100 text-blue-700",
  Retorno: "bg-amber-100 text-amber-700",
};

// ==================== IMPORT TYPES ====================

interface ImportRow {
  lote: string;
  fechaFabricacion: string;
  fechaVencimiento: string;
  sku: string;
  producto: string;
  cantidad: number;
  estado: "VÁLIDO" | "DUPLICADO" | "ERROR";
  error?: string;
}

// ==================== COMPONENT ====================

export default function Lotes() {
  const { lotes, setLotes, productosPorLote, setProductosPorLote, movimientos } = useLotes();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [condicionFilter, setCondicionFilter] = useState("all");
  const [venceFilter, setVenceFilter] = useState("all");
  const [sheetLote, setSheetLote] = useState<Lote | null>(null);

  // Import state
  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [importDragOver, setImportDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit state
  const [editLote, setEditLote] = useState<Lote | null>(null);
  const [editFechaFab, setEditFechaFab] = useState<Date | undefined>();
  const [editFechaVenc, setEditFechaVenc] = useState<Date | undefined>();
  const [editCondicion, setEditCondicion] = useState<Condicion>("ÓPTIMO");
  const [editProductos, setEditProductos] = useState<LoteProducto[]>([]);
  const [fabPopoverOpen, setFabPopoverOpen] = useState(false);
  const [vencPopoverOpen, setVencPopoverOpen] = useState(false);

  const filteredData = useMemo(() => {
    return lotes.filter((l) => {
      if (condicionFilter !== "all" && l.condicion !== condicionFilter) return false;
      if (venceFilter !== "all") {
        const days = parseInt(venceFilter);
        if (l.diasRestantes > days || l.diasRestantes < 0) return false;
      }
      return true;
    });
  }, [lotes, condicionFilter, venceFilter]);

  // ==================== IMPORT HANDLERS ====================

  const parseFile = useCallback((file: File) => {
    // Simulate parsing - in production would use a real parser
    const mockImportRows: ImportRow[] = [
      { lote: "L-2026-013", fechaFabricacion: "2026-03-20", fechaVencimiento: "2026-05-20", sku: "PAN-CL-900", producto: "Panetón Clásico 900g", cantidad: 150, estado: "VÁLIDO" },
      { lote: "L-2026-014", fechaFabricacion: "2026-03-20", fechaVencimiento: "2026-05-15", sku: "BIZ-VAN-500", producto: "Bizcocho Vainilla 500g", cantidad: 80, estado: "VÁLIDO" },
      { lote: "L-2026-012", fechaFabricacion: "2026-03-01", fechaVencimiento: "2026-04-30", sku: "PAN-CL-900", producto: "Panetón Clásico 900g", cantidad: 50, estado: "DUPLICADO" },
      { lote: "L-2026-015", fechaFabricacion: "", fechaVencimiento: "2026-06-01", sku: "KEK-MAR-400", producto: "Keke Marmoleado 400g", cantidad: 0, estado: "ERROR", error: "Fecha fabricación vacía, cantidad = 0" },
    ];
    setImportRows(mockImportRows);
  }, []);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setImportDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }, [parseFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  }, [parseFile]);

  const handleImport = useCallback(() => {
    const valid = importRows.filter((r) => r.estado === "VÁLIDO");
    const duplicated = importRows.filter((r) => r.estado === "DUPLICADO");
    const newLotesCount = valid.length + duplicated.length;

    // Add valid new lotes
    for (const row of valid) {
      const newId = String(Date.now() + Math.random());
      const newLote: Lote = {
        id: newId,
        numero: row.lote,
        fechaFabricacion: row.fechaFabricacion,
        fechaVencimiento: row.fechaVencimiento,
        diasRestantes: Math.ceil((new Date(row.fechaVencimiento).getTime() - Date.now()) / 86400000),
        numProductos: 1,
        condicion: "ÓPTIMO",
        stockDisponible: row.cantidad,
        unidad: "und",
      };
      setLotes((prev) => [...prev, newLote]);
      setProductosPorLote((prev) => ({
        ...prev,
        [newId]: [{ sku: row.sku, nombre: row.producto, cantidadOriginal: row.cantidad, cantidadDisponible: row.cantidad, despachado: 0, devuelto: 0 }],
      }));
    }

    // Update duplicated lotes (sum stock)
    for (const row of duplicated) {
      setLotes((prev) =>
        prev.map((l) => l.numero === row.lote ? { ...l, stockDisponible: l.stockDisponible + row.cantidad } : l)
      );
      setProductosPorLote((prev) => {
        const lote = lotes.find((l) => l.numero === row.lote);
        if (!lote) return prev;
        const prods = prev[lote.id] || [];
        const existing = prods.find((p) => p.sku === row.sku);
        if (existing) {
          return {
            ...prev,
            [lote.id]: prods.map((p) =>
              p.sku === row.sku
                ? { ...p, cantidadOriginal: p.cantidadOriginal + row.cantidad, cantidadDisponible: p.cantidadDisponible + row.cantidad }
                : p
            ),
          };
        }
        return prev;
      });
    }

    toast.success(`${newLotesCount} lotes importados correctamente.`);
    setImportOpen(false);
    setImportRows([]);
  }, [importRows, lotes, setLotes, setProductosPorLote]);

  // ==================== EDIT HANDLERS ====================

  const openEdit = useCallback((lote: Lote) => {
    setEditLote(lote);
    setEditFechaFab(new Date(lote.fechaFabricacion));
    setEditFechaVenc(new Date(lote.fechaVencimiento));
    setEditCondicion(lote.condicion);
    setEditProductos((productosPorLote[lote.id] || []).map((p) => ({ ...p })));
  }, [productosPorLote]);

  const handleSaveEdit = useCallback(() => {
    if (!editLote) return;
    setLotes((prev) =>
      prev.map((l) =>
        l.id === editLote.id
          ? {
              ...l,
              fechaFabricacion: editFechaFab ? format(editFechaFab, "yyyy-MM-dd") : l.fechaFabricacion,
              fechaVencimiento: editFechaVenc ? format(editFechaVenc, "yyyy-MM-dd") : l.fechaVencimiento,
              diasRestantes: editFechaVenc ? Math.ceil((editFechaVenc.getTime() - Date.now()) / 86400000) : l.diasRestantes,
              condicion: editCondicion,
            }
          : l
      )
    );
    setProductosPorLote((prev) => ({ ...prev, [editLote.id]: editProductos }));
    toast.success(`Lote ${editLote.numero} actualizado.`);
    setEditLote(null);
  }, [editLote, editFechaFab, editFechaVenc, editCondicion, editProductos, setLotes, setProductosPorLote]);

  const addProductRow = useCallback(() => {
    setEditProductos((prev) => [
      ...prev,
      { sku: "", nombre: "", cantidadOriginal: 0, cantidadDisponible: 0, despachado: 0, devuelto: 0 },
    ]);
  }, []);

  const removeProductRow = useCallback((idx: number) => {
    setEditProductos((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  // ==================== TABLE COLUMNS ====================

  const columns = useMemo<ColumnDef<Lote>[]>(
    () => [
      {
        accessorKey: "numero",
        header: ({ column }) => (
          <button className="flex items-center gap-1" onClick={() => column.toggleSorting()}>
            N° Lote <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => <span className="font-medium text-foreground">{row.original.numero}</span>,
      },
      {
        accessorKey: "fechaFabricacion",
        header: "Fabricación",
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.fechaFabricacion}</span>,
      },
      {
        accessorKey: "fechaVencimiento",
        header: "Vencimiento",
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.fechaVencimiento}</span>,
      },
      {
        accessorKey: "diasRestantes",
        header: ({ column }) => (
          <button className="flex items-center gap-1" onClick={() => column.toggleSorting()}>
            Días rest. <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => {
          const d = row.original.diasRestantes;
          return (
            <span className={cn("text-sm", diasColor(d))}>
              {d < 0 ? `${Math.abs(d)} días vencido` : `${d} día${d !== 1 ? "s" : ""}`}
            </span>
          );
        },
      },
      {
        accessorKey: "numProductos",
        header: "Productos",
        cell: ({ row }) => <span className="text-sm">{row.original.numProductos} prod</span>,
      },
      {
        accessorKey: "condicion",
        header: "Condición",
        cell: ({ row }) => (
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${condicionStyles[row.original.condicion]}`}>
            {condicionLabels[row.original.condicion]}
          </span>
        ),
      },
      {
        accessorKey: "stockDisponible",
        header: "Stock disp.",
        cell: ({ row }) => (
          <span className="text-sm font-medium">{row.original.stockDisponible} {row.original.unidad}</span>
        ),
      },
      {
        id: "acciones",
        header: "Acciones",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Ver detalle" onClick={() => setSheetLote(row.original)}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar" onClick={() => openEdit(row.original)}>
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [openEdit],
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

  const sheetProductos = sheetLote ? (productosPorLote[sheetLote.id] || []) : [];
  const sheetMovimientos = sheetLote ? (movimientos[sheetLote.id] || []) : [];

  const importValid = importRows.filter((r) => r.estado === "VÁLIDO").length;
  const importDuplicados = importRows.filter((r) => r.estado === "DUPLICADO").length;
  const importErrors = importRows.filter((r) => r.estado === "ERROR").length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Lotes de Producción</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Registra lotes desde producción. Importa desde Excel o ajusta manualmente.
          </p>
        </div>
        <Button className="gap-2" onClick={() => { setImportRows([]); setImportOpen(true); }}>
          <Upload className="h-4 w-4" />
          Importar lotes
        </Button>
      </div>

      {/* Search + Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por N° de lote o producto..."
            className="pl-9 bg-card"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtros
              {(condicionFilter !== "all" || venceFilter !== "all") && (
                <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {[condicionFilter !== "all", venceFilter !== "all"].filter(Boolean).length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 space-y-4" align="start">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Condición</Label>
              <Select value={condicionFilter} onValueChange={setCondicionFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="ÓPTIMO">Óptimo</SelectItem>
                  <SelectItem value="PRÓXIMO_VENCER">Próximo a vencer</SelectItem>
                  <SelectItem value="VENCIDO">Vencido</SelectItem>
                  <SelectItem value="DEFECTO_ESTÉTICO">Defecto estético</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Vence en</Label>
              <Select value={venceFilter} onValueChange={setVenceFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="7">7 días</SelectItem>
                  <SelectItem value="15">15 días</SelectItem>
                  <SelectItem value="30">30 días</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(condicionFilter !== "all" || venceFilter !== "all") && (
              <Button variant="ghost" size="sm" className="w-full" onClick={() => { setCondicionFilter("all"); setVenceFilter("all"); }}>
                Limpiar filtros
              </Button>
            )}
          </PopoverContent>
        </Popover>
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
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="h-12 hover:bg-slate-50/70 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No hay lotes para los filtros seleccionados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between px-4 py-3 border-t bg-slate-50/50">
          <p className="text-xs text-muted-foreground">{table.getFilteredRowModel().rows.length} lote(s)</p>
        </div>
      </div>

      {/* ==================== IMPORT DIALOG ==================== */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Importar Lotes de Producción
            </DialogTitle>
            <DialogDescription>
              Sube un archivo .xlsx, .xls o .csv con los lotes a importar.
            </DialogDescription>
          </DialogHeader>

          {importRows.length === 0 ? (
            <div className="space-y-4">
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                  importDragOver ? "border-primary bg-primary/5" : "border-border"
                )}
                onDragOver={(e) => { e.preventDefault(); setImportDragOver(true); }}
                onDragLeave={() => setImportDragOver(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium">Arrastra tu archivo aquí</p>
                <p className="text-xs text-muted-foreground mt-1">o haz clic para seleccionar</p>
                <p className="text-xs text-muted-foreground mt-2">Formatos: .xlsx, .xls, .csv</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileSelect}
              />
              <button className="flex items-center gap-2 text-sm text-primary hover:underline">
                <Download className="h-4 w-4" />
                Descargar template de importación
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex items-center gap-3 text-sm">
                <span className="text-green-700">✓ {importValid} válidas</span>
                <span className="text-amber-700">⚠ {importDuplicados} duplicadas</span>
                <span className="text-red-700">✕ {importErrors} con error</span>
              </div>
              {importDuplicados > 0 && (
                <p className="text-xs text-muted-foreground">
                  Los lotes duplicados actualizarán el stock del lote existente sumando las cantidades.
                </p>
              )}

              {/* Preview table */}
              <div className="rounded-lg border overflow-hidden max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-[11px] uppercase">N° Lote</TableHead>
                      <TableHead className="text-[11px] uppercase">Fab</TableHead>
                      <TableHead className="text-[11px] uppercase">Vence</TableHead>
                      <TableHead className="text-[11px] uppercase">SKU</TableHead>
                      <TableHead className="text-[11px] uppercase">Producto</TableHead>
                      <TableHead className="text-[11px] uppercase text-right">Cantidad</TableHead>
                      <TableHead className="text-[11px] uppercase">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importRows.map((row, i) => (
                      <TableRow key={i} className="h-10">
                        <TableCell className="text-sm font-medium">{row.lote}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{row.fechaFabricacion}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{row.fechaVencimiento}</TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">{row.sku}</TableCell>
                        <TableCell className="text-sm">{row.producto}</TableCell>
                        <TableCell className="text-sm text-right">{row.cantidad}</TableCell>
                        <TableCell>
                          <span className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                            row.estado === "VÁLIDO" && "bg-green-100 text-green-700",
                            row.estado === "DUPLICADO" && "bg-amber-100 text-amber-700",
                            row.estado === "ERROR" && "bg-red-100 text-red-700",
                          )}>
                            {row.estado}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>Cancelar</Button>
            {importRows.length > 0 && (
              <Button onClick={handleImport} disabled={importValid + importDuplicados === 0}>
                Importar {importValid + importDuplicados} lotes válidos
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== EDIT DIALOG ==================== */}
      <Dialog open={!!editLote} onOpenChange={() => setEditLote(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Lote {editLote?.numero}</DialogTitle>
          </DialogHeader>

          <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700">
            ⚠ Solo edita campos descriptivos. El stock es gestionado automáticamente.
          </div>

          <div className="space-y-4">
            {/* Read-only fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">N° Lote</Label>
                <p className="text-sm font-medium mt-1">{editLote?.numero}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Stock disponible</Label>
                <p className="text-sm font-medium mt-1">{editLote?.stockDisponible} {editLote?.unidad}</p>
              </div>
            </div>

            {/* Editable fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Fecha fabricación</Label>
                <Popover open={fabPopoverOpen} onOpenChange={setFabPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      {editFechaFab ? format(editFechaFab, "dd/MM/yyyy") : "Seleccionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={editFechaFab}
                      onSelect={(d) => { setEditFechaFab(d); setFabPopoverOpen(false); }}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Fecha vencimiento</Label>
                <Popover open={vencPopoverOpen} onOpenChange={setVencPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      {editFechaVenc ? format(editFechaVenc, "dd/MM/yyyy") : "Seleccionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={editFechaVenc}
                      onSelect={(d) => { setEditFechaVenc(d); setVencPopoverOpen(false); }}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Condición</Label>
              <Select value={editCondicion} onValueChange={(v) => setEditCondicion(v as Condicion)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ÓPTIMO">Óptimo</SelectItem>
                  <SelectItem value="DEFECTO_ESTÉTICO">Defecto estético</SelectItem>
                  <SelectItem value="PRÓXIMO_VENCER">Próximo a vencer</SelectItem>
                  <SelectItem value="VENCIDO">Vencido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Products sub-table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-medium">Productos</Label>
                <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={addProductRow}>
                  <Plus className="h-3 w-3" /> Agregar
                </Button>
              </div>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-[11px] uppercase">SKU</TableHead>
                      <TableHead className="text-[11px] uppercase">Nombre</TableHead>
                      <TableHead className="text-[11px] uppercase text-right">Orig.</TableHead>
                      <TableHead className="text-[11px] uppercase text-right">Disp.</TableHead>
                      <TableHead className="text-[11px] uppercase w-8"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {editProductos.map((p, i) => (
                      <TableRow key={i} className="h-10">
                        <TableCell className="text-xs font-mono">{p.sku || <Input className="h-7 text-xs" placeholder="SKU" value={p.sku} onChange={(e) => {
                          const next = [...editProductos];
                          next[i] = { ...next[i], sku: e.target.value };
                          setEditProductos(next);
                        }} />}</TableCell>
                        <TableCell className="text-sm">{p.nombre || <Input className="h-7 text-xs" placeholder="Nombre" value={p.nombre} onChange={(e) => {
                          const next = [...editProductos];
                          next[i] = { ...next[i], nombre: e.target.value };
                          setEditProductos(next);
                        }} />}</TableCell>
                        <TableCell className="text-sm text-right text-muted-foreground">{p.cantidadOriginal}</TableCell>
                        <TableCell className="text-sm text-right font-medium">{p.cantidadDisponible}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-danger" onClick={() => removeProductRow(i)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditLote(null)}>Cancelar</Button>
            <Button onClick={handleSaveEdit}>Guardar cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== LOT DETAIL SHEET ==================== */}
      <Sheet open={!!sheetLote} onOpenChange={() => setSheetLote(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Lote {sheetLote?.numero}
            </SheetTitle>
          </SheetHeader>

          {sheetLote && (
            <div className="mt-6 space-y-6">
              {/* Info card */}
              <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/50 p-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Fabricado</p>
                  <p className="text-sm font-medium mt-0.5">{sheetLote.fechaFabricacion}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Vence</p>
                  <p className="text-sm font-medium mt-0.5">{sheetLote.fechaVencimiento}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Días restantes</p>
                  <p className={cn("text-sm mt-0.5", diasColor(sheetLote.diasRestantes))}>
                    {sheetLote.diasRestantes < 0
                      ? `${Math.abs(sheetLote.diasRestantes)} días vencido`
                      : `${sheetLote.diasRestantes} día${sheetLote.diasRestantes !== 1 ? "s" : ""}`}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Condición</p>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-0.5 ${condicionStyles[sheetLote.condicion]}`}>
                    {condicionLabels[sheetLote.condicion]}
                  </span>
                </div>
              </div>

              {/* Products */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Productos en este lote</h3>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="text-[11px] font-medium text-muted-foreground uppercase">Producto</TableHead>
                        <TableHead className="text-[11px] font-medium text-muted-foreground uppercase text-right">Original</TableHead>
                        <TableHead className="text-[11px] font-medium text-muted-foreground uppercase text-right">Disp.</TableHead>
                        <TableHead className="text-[11px] font-medium text-muted-foreground uppercase text-right">Desp.</TableHead>
                        <TableHead className="text-[11px] font-medium text-muted-foreground uppercase text-right">Dev.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sheetProductos.map((p, i) => (
                        <TableRow key={i} className="h-10">
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">{p.nombre}</p>
                              <p className="text-[11px] text-muted-foreground font-mono">{p.sku}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-right text-muted-foreground">{p.cantidadOriginal}</TableCell>
                          <TableCell className="text-sm text-right font-medium">{p.cantidadDisponible}</TableCell>
                          <TableCell className="text-sm text-right text-muted-foreground">{p.despachado}</TableCell>
                          <TableCell className="text-sm text-right text-muted-foreground">{p.devuelto}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Movements */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Historial de movimientos</h3>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="text-[11px] font-medium text-muted-foreground uppercase">Fecha</TableHead>
                        <TableHead className="text-[11px] font-medium text-muted-foreground uppercase">Tipo</TableHead>
                        <TableHead className="text-[11px] font-medium text-muted-foreground uppercase">Ref.</TableHead>
                        <TableHead className="text-[11px] font-medium text-muted-foreground uppercase text-right">Cant.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sheetMovimientos.map((m, i) => (
                        <TableRow key={i} className="h-10">
                          <TableCell className="text-sm text-muted-foreground">{m.fecha}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${movTipoStyles[m.tipo] || "bg-slate-100 text-slate-600"}`}>
                              {m.tipo}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">{m.referencia}</p>
                              <p className="text-[11px] text-muted-foreground">{m.detalle}</p>
                            </div>
                          </TableCell>
                          <TableCell className={cn("text-sm text-right font-medium", m.cantidad > 0 ? "text-success" : "text-foreground")}>
                            {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
