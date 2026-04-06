import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { Heart, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { cn } from "@/lib/utils";

type EstadoDonacion = "PENDIENTE" | "ENTREGADO";

interface Donacion {
  id: string;
  producto: string;
  lote: string;
  vencimiento: string;
  cantidad: number;
  institucion: string;
  aprobadoPorGG: string;
  estado: EstadoDonacion;
}

const initialData: Donacion[] = [
  {
    id: "1",
    producto: "Panetón Chocolate 900g",
    lote: "L-2026-006",
    vencimiento: "18/03/2026",
    cantidad: 20,
    institucion: "Albergue San Vicente",
    aprobadoPorGG: "10/03/2026",
    estado: "PENDIENTE",
  },
  {
    id: "2",
    producto: "Torta Tres Leches 1kg",
    lote: "L-2026-010",
    vencimiento: "16/03/2026",
    cantidad: 3,
    institucion: "Comedor Los Andes",
    aprobadoPorGG: "11/03/2026",
    estado: "PENDIENTE",
  },
  {
    id: "3",
    producto: "Pan de Molde Blanco",
    lote: "L-2026-008",
    vencimiento: "20/03/2026",
    cantidad: 15,
    institucion: "Albergue San Vicente",
    aprobadoPorGG: "08/03/2026",
    estado: "ENTREGADO",
  },
];

export default function Donaciones() {
  const [data, setData] = useState<Donacion[]>(initialData);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Donacion | null>(null);
  const [fechaEntrega, setFechaEntrega] = useState<Date | undefined>(new Date());
  const [cantidadEntregada, setCantidadEntregada] = useState("");
  const [responsable, setResponsable] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const pendientes = data.filter((d) => d.estado === "PENDIENTE").length;
  const entregados = data.filter((d) => d.estado === "ENTREGADO").length;

  const openDialog = (donacion: Donacion) => {
    setSelected(donacion);
    setFechaEntrega(new Date());
    setCantidadEntregada(String(donacion.cantidad));
    setResponsable("");
    setObservaciones("");
    setDialogOpen(true);
  };

  const handleConfirm = () => {
    if (!selected || !fechaEntrega || !cantidadEntregada || !responsable) return;
    const cant = parseInt(cantidadEntregada);
    if (isNaN(cant) || cant <= 0 || cant > selected.cantidad) return;

    setData((prev) =>
      prev.map((d) => (d.id === selected.id ? { ...d, estado: "ENTREGADO" as EstadoDonacion } : d))
    );
    toast.success(`Donación registrada. ${cant}u entregadas a ${selected.institucion}.`);
    setDialogOpen(false);
  };

  const columns: ColumnDef<Donacion>[] = [
    { accessorKey: "producto", header: "Producto" },
    { accessorKey: "lote", header: "Lote", cell: ({ row }) => <span className="font-mono text-xs">{row.original.lote}</span> },
    { accessorKey: "vencimiento", header: "Vencimiento" },
    { accessorKey: "cantidad", header: "Cantidad", cell: ({ row }) => `${row.original.cantidad}u` },
    { accessorKey: "institucion", header: "Institución destino" },
    { accessorKey: "aprobadoPorGG", header: "Aprobado por GG" },
    {
      accessorKey: "estado",
      header: "Estado",
      cell: ({ row }) =>
        row.original.estado === "PENDIENTE" ? (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-0">Pendiente</Badge>
        ) : (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0">Entregado</Badge>
        ),
    },
    {
      id: "acciones",
      header: "Acciones",
      cell: ({ row }) =>
        row.original.estado === "PENDIENTE" ? (
          <Button variant="outline" size="sm" onClick={() => openDialog(row.original)}>
            Registrar entrega
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Donaciones</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Productos aprobados por Gerencia para donación a instituciones.</p>
      </div>

      {/* Summary badges */}
      <div className="flex gap-3">
        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-0 text-xs px-3 py-1">
          Pendientes de entregar: {pendientes}
        </Badge>
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0 text-xs px-3 py-1">
          Entregados este mes: {entregados}
        </Badge>
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
                  No hay donaciones registradas.
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

      {/* Delivery Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar entrega de donación</DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="rounded-md border bg-muted/50 p-3 space-y-1 text-sm">
              <p><span className="font-medium">Producto:</span> {selected.producto}</p>
              <p><span className="font-medium">Lote:</span> {selected.lote}</p>
              <p><span className="font-medium">Cantidad:</span> {selected.cantidad}u</p>
              <p><span className="font-medium">Institución:</span> {selected.institucion}</p>
            </div>
          )}

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Fecha de entrega *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !fechaEntrega && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fechaEntrega ? format(fechaEntrega, "dd/MM/yyyy") : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={fechaEntrega} onSelect={setFechaEntrega} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Cantidad entregada *</Label>
              <Input
                type="number"
                min={1}
                max={selected?.cantidad}
                value={cantidadEntregada}
                onChange={(e) => setCantidadEntregada(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Responsable de recepción *</Label>
              <Input value={responsable} onChange={(e) => setResponsable(e.target.value)} placeholder="Nombre de quien recibe" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Observaciones</Label>
              <Textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Opcional" rows={2} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleConfirm} disabled={!fechaEntrega || !cantidadEntregada || !responsable}>
              Confirmar entrega
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
