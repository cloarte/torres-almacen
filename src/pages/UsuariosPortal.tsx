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
import {
  UserPlus,
  Pencil,
  Power,
  KeyRound,
  Search,
  Copy,
  Check,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

// ---------- Types ----------

interface UsuarioPortal {
  id: string;
  cliente: string;
  canal: string;
  email: string | null;
  ultimoAcceso: string;
  estado: "ACTIVO" | "INACTIVO";
}

interface ClienteOption {
  id: string;
  nombre: string;
  ruc: string;
  canal: string;
}

// ---------- Mock data ----------

const clientesCatalogo: ClienteOption[] = [
  { id: "c1", nombre: "Supermercados Plaza", ruc: "20501234567", canal: "Moderno" },
  { id: "c2", nombre: "Bodega San Martín", ruc: "10456789012", canal: "Tradicional" },
  { id: "c3", nombre: "Restaurant El Buen Sabor", ruc: "20609876543", canal: "Corporativo" },
  { id: "c4", nombre: "Distribuidora Lima", ruc: "20512345678", canal: "Directa" },
  { id: "c5", nombre: "Bodega La Cruz", ruc: "10987654321", canal: "Tradicional" },
];

const initialData: UsuarioPortal[] = [
  {
    id: "1",
    cliente: "Supermercados Plaza",
    canal: "Moderno",
    email: "plaza@email.com",
    ultimoAcceso: "hace 2 horas",
    estado: "ACTIVO",
  },
  {
    id: "2",
    cliente: "Bodega San Martín",
    canal: "Tradicional",
    email: "bodega.sm@email.com",
    ultimoAcceso: "hace 3 días",
    estado: "ACTIVO",
  },
  {
    id: "3",
    cliente: "Restaurant El Buen Sabor",
    canal: "Corporativo",
    email: null,
    ultimoAcceso: "Nunca",
    estado: "INACTIVO",
  },
];

// ---------- Helpers ----------

const canalColors: Record<string, string> = {
  Tradicional: "bg-blue-100 text-blue-700",
  Moderno: "bg-emerald-100 text-emerald-700",
  Directa: "bg-violet-100 text-violet-700",
  Corporativo: "bg-orange-100 text-orange-700",
};

function generatePassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let pwd = "";
  for (let i = 0; i < 10; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  return pwd;
}

// ---------- Sub-components ----------

function ClienteCombobox({
  value,
  onChange,
  clientes,
}: {
  value: string;
  onChange: (id: string) => void;
  clientes: ClienteOption[];
}) {
  const [open, setOpen] = useState(false);
  const selected = clientes.find((c) => c.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selected ? selected.nombre : "Buscar cliente por nombre o RUC..."}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Nombre o RUC..." />
          <CommandList>
            <CommandEmpty>No se encontraron clientes.</CommandEmpty>
            <CommandGroup>
              {clientes.map((c) => (
                <CommandItem
                  key={c.id}
                  value={`${c.nombre} ${c.ruc}`}
                  onSelect={() => {
                    onChange(c.id);
                    setOpen(false);
                  }}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{c.nombre}</span>
                    <span className="text-xs text-muted-foreground">
                      RUC: {c.ruc} · {c.canal}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function PasswordRevealBox({
  password,
  onCopied,
}: {
  password: string;
  onCopied?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(password);
    setCopied(true);
    onCopied?.();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2.5 mt-2">
      <code className="flex-1 text-sm font-mono font-semibold tracking-wide text-foreground">
        {password}
      </code>
      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleCopy}>
        {copied ? (
          <Check className="h-4 w-4 text-success" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

// ---------- Main page ----------

export default function UsuariosPortal() {
  const [data, setData] = useState(initialData);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [createClienteId, setCreateClienteId] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createSendEmail, setCreateSendEmail] = useState(true);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);

  // Reset dialog state
  const [resetTarget, setResetTarget] = useState<UsuarioPortal | null>(null);
  const [resetPassword, setResetPassword] = useState<string | null>(null);
  const [resetSendEmail, setResetSendEmail] = useState(true);

  // Toggle dialog state
  const [toggleTarget, setToggleTarget] = useState<UsuarioPortal | null>(null);

  // ---------- Table columns ----------

  const columns = useMemo<ColumnDef<UsuarioPortal>[]>(
    () => [
      {
        accessorKey: "cliente",
        header: ({ column }) => (
          <button className="flex items-center gap-1" onClick={() => column.toggleSorting()}>
            Cliente <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="font-medium text-foreground">{row.original.cliente}</span>
        ),
      },
      {
        accessorKey: "canal",
        header: "Canal",
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              canalColors[row.original.canal] || "bg-slate-100 text-slate-600"
            }`}
          >
            {row.original.canal}
          </span>
        ),
      },
      {
        accessorKey: "email",
        header: "Email de acceso",
        cell: ({ row }) =>
          row.original.email ? (
            <span className="text-sm">{row.original.email}</span>
          ) : (
            <span className="text-slate-300">—</span>
          ),
      },
      {
        accessorKey: "ultimoAcceso",
        header: "Último acceso",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.ultimoAcceso}</span>
        ),
      },
      {
        accessorKey: "estado",
        header: "Estado",
        cell: ({ row }) => {
          const active = row.original.estado === "ACTIVO";
          return (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}
            >
              {row.original.estado}
            </span>
          );
        },
      },
      {
        id: "acciones",
        header: "Acciones",
        cell: ({ row }) => {
          const u = row.original;
          return (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${
                  u.estado === "ACTIVO"
                    ? "text-danger hover:text-danger"
                    : "text-success hover:text-success"
                }`}
                title={u.estado === "ACTIVO" ? "Desactivar" : "Activar"}
                onClick={() => setToggleTarget(u)}
              >
                <Power className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Resetear contraseña"
                onClick={() => {
                  setResetPassword(null);
                  setResetSendEmail(true);
                  setResetTarget(u);
                }}
              >
                <KeyRound className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // ---------- Handlers ----------

  const openCreateDialog = () => {
    setCreateClienteId("");
    setCreateEmail("");
    setCreateSendEmail(true);
    setCreatedPassword(null);
    setCreateOpen(true);
  };

  const handleCreate = () => {
    const cliente = clientesCatalogo.find((c) => c.id === createClienteId);
    if (!cliente || !createEmail.trim()) return;

    const pwd = generatePassword();
    setCreatedPassword(pwd);

    const newUser: UsuarioPortal = {
      id: String(Date.now()),
      cliente: cliente.nombre,
      canal: cliente.canal,
      email: createEmail.trim(),
      ultimoAcceso: "Nunca",
      estado: "ACTIVO",
    };
    setData((prev) => [...prev, newUser]);
    toast.success(`Acceso creado. Contraseña: ${pwd} — cópiala ahora.`);
  };

  const handleReset = () => {
    if (!resetTarget) return;
    const pwd = generatePassword();
    setResetPassword(pwd);
    toast.success(`Contraseña reseteada para ${resetTarget.cliente}.`);
  };

  const handleToggle = () => {
    if (!toggleTarget) return;
    const newState = toggleTarget.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO";
    setData((prev) =>
      prev.map((u) => (u.id === toggleTarget.id ? { ...u, estado: newState } : u)),
    );
    toast.success(
      `${toggleTarget.cliente} ${newState === "ACTIVO" ? "activado" : "desactivado"}.`,
    );
    setToggleTarget(null);
  };

  // ---------- Render ----------

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Usuarios del Portal de Clientes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona los accesos al portal de autoservicio de cada cliente.
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Crear acceso
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente o email..."
          className="pl-9 bg-card"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-slate-50 hover:bg-slate-50">
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="h-12 hover:bg-slate-50/70 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No hay usuarios registrados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between px-4 py-3 border-t bg-slate-50/50">
          <p className="text-xs text-muted-foreground">
            {table.getFilteredRowModel().rows.length} usuario(s)
          </p>
        </div>
      </div>

      {/* ---- Create Access Dialog ---- */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateOpen(false);
            setCreatedPassword(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Crear acceso al portal</DialogTitle>
            <DialogDescription>
              Genera credenciales de acceso para un cliente.
            </DialogDescription>
          </DialogHeader>

          {!createdPassword ? (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>
                  Cliente <span className="text-danger">*</span>
                </Label>
                <ClienteCombobox
                  value={createClienteId}
                  onChange={setCreateClienteId}
                  clientes={clientesCatalogo}
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  Email de acceso <span className="text-danger">*</span>
                </Label>
                <Input
                  type="email"
                  placeholder="correo@empresa.com"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="send-create"
                  checked={createSendEmail}
                  onCheckedChange={setCreateSendEmail}
                />
                <Label htmlFor="send-create" className="text-sm font-normal">
                  Enviar credenciales por email al cliente
                </Label>
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <p className="text-sm text-muted-foreground">
                Acceso creado exitosamente. Copia la contraseña temporal — no podrás verla
                de nuevo.
              </p>
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Contraseña temporal
              </Label>
              <PasswordRevealBox password={createdPassword} />
            </div>
          )}

          <DialogFooter>
            {!createdPassword ? (
              <>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={!createClienteId || !createEmail.trim()}
                >
                  Crear acceso
                </Button>
              </>
            ) : (
              <Button onClick={() => { setCreateOpen(false); setCreatedPassword(null); }}>
                Cerrar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Reset Password Dialog ---- */}
      <Dialog
        open={!!resetTarget}
        onOpenChange={(open) => {
          if (!open) {
            setResetTarget(null);
            setResetPassword(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Resetear contraseña de {resetTarget?.cliente}</DialogTitle>
            <DialogDescription>
              Se generará una nueva contraseña temporal.
            </DialogDescription>
          </DialogHeader>

          {!resetPassword ? (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2">
                <Switch
                  id="send-reset"
                  checked={resetSendEmail}
                  onCheckedChange={setResetSendEmail}
                />
                <Label htmlFor="send-reset" className="text-sm font-normal">
                  Enviar nueva contraseña por email
                </Label>
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <p className="text-sm text-muted-foreground">
                Nueva contraseña generada. Cópiala ahora — no podrás verla de nuevo.
              </p>
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Nueva contraseña temporal
              </Label>
              <PasswordRevealBox password={resetPassword} />
            </div>
          )}

          <DialogFooter>
            {!resetPassword ? (
              <>
                <Button variant="outline" onClick={() => setResetTarget(null)}>
                  Cancelar
                </Button>
                <Button onClick={handleReset}>Generar contraseña</Button>
              </>
            ) : (
              <Button onClick={() => { setResetTarget(null); setResetPassword(null); }}>
                Cerrar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Toggle Active/Inactive Dialog ---- */}
      <AlertDialog open={!!toggleTarget} onOpenChange={() => setToggleTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿{toggleTarget?.estado === "ACTIVO" ? "Desactivar" : "Activar"} acceso?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleTarget?.estado === "ACTIVO"
                ? `${toggleTarget?.cliente} ya no podrá acceder al portal de clientes.`
                : `${toggleTarget?.cliente} podrá acceder nuevamente al portal.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggle}
              className={
                toggleTarget?.estado === "ACTIVO"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {toggleTarget?.estado === "ACTIVO" ? "Desactivar" : "Activar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
