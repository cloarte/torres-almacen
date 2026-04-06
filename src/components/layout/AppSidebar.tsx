import { useLocation, Link } from "react-router-dom";
import {
  Inbox,
  ClipboardList,
  Truck,
  Package,
  CornerDownLeft,
  Tag,
  Heart,
  User,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navigation: NavSection[] = [
  {
    title: "PEDIDOS",
    items: [
      { label: "Bandeja de Pendientes", icon: Inbox, path: "/pedidos?estado=PENDIENTE", badge: 5 },
      { label: "Todos los Pedidos", icon: ClipboardList, path: "/pedidos" },
    ],
  },
  {
    title: "ENTREGA",
    items: [
      { label: "Despachos", icon: Truck, path: "/entrega/despachos" },
      { label: "Lotes de Producción", icon: Package, path: "/entrega/lotes" },
      { label: "Retornos", icon: CornerDownLeft, path: "/entrega/retornos" },
      { label: "Venta Especial", icon: Tag, path: "/entrega/venta-especial" },
      { label: "Donaciones", icon: Heart, path: "/entrega/donaciones" },
    ],
  },
  {
    title: "CUENTA",
    items: [
      { label: "Mi Perfil", icon: User, path: "/cuenta/perfil" },
    ],
  },
];

export function AppSidebar() {
  const location = useLocation();
  const fullPath = location.pathname + location.search;

  const isActive = (path: string) => {
    // Exact match for paths with query params
    if (path.includes("?")) return fullPath === path;
    // For /pedidos without params, only active if no estado param
    if (path === "/pedidos") return location.pathname === "/pedidos" && !location.search.includes("estado=");
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-primary flex flex-col z-30">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-sidebar-border">
        <span className="text-lg font-bold text-white tracking-tight">Torres SGV</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
        {navigation.map((section, si) => (
          <div key={section.title}>
            {si > 0 && <div className="my-2 border-t border-sidebar-border" />}
            <p className="px-3 py-1.5 text-[11px] font-semibold tracking-widest text-slate-400 uppercase">
              {section.title}
            </p>
            {section.items.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    active
                      ? "bg-primary-light text-primary"
                      : "text-slate-300 hover:bg-[hsl(213,40%,30%)]"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white px-1.5">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-[hsl(213,40%,35%)] flex items-center justify-center text-xs font-bold text-white">
            RF
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Rosnelli Flores</p>
            <p className="text-[11px] text-slate-400">Almacén</p>
          </div>
          <button className="text-slate-400 hover:text-white transition-colors" title="Cerrar sesión">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
