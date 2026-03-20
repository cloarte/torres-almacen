import { useLocation } from "react-router-dom";

const breadcrumbMap: Record<string, string[]> = {
  "/pedidos": ["Pedidos", "Bandeja de Pendientes"],
  "/pedidos/todos": ["Pedidos", "Todos los Pedidos"],
  "/pedidos/usuarios-portal": ["Pedidos", "Usuarios Portal"],
  "/entrega/despachos": ["Entrega", "Despachos"],
  "/entrega/lotes": ["Entrega", "Lotes de Producción"],
  "/entrega/retornos": ["Entrega", "Retornos"],
  "/vencidos/alertas": ["Vencidos", "Alertas de Vencimiento"],
  "/reportes/dashboard": ["Reportes", "Dashboard"],
  "/reportes/ventas-vendedor": ["Reportes", "Ventas x Vendedor"],
  "/reportes/devoluciones": ["Reportes", "Devoluciones"],
  "/cuenta/perfil": ["Cuenta", "Mi Perfil"],
};

export function AppHeader() {
  const location = useLocation();
  const crumbs = breadcrumbMap[location.pathname] || ["Inicio"];

  return (
    <header className="h-14 bg-primary flex items-center justify-between px-6 border-b border-sidebar-border">
      <div className="flex items-center gap-2 text-sm text-slate-300">
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <span className="text-slate-500">›</span>}
            <span className={i === crumbs.length - 1 ? "text-white font-medium" : ""}>{c}</span>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-bold text-white">
          ALMACÉN
        </span>
        <span className="text-sm text-slate-300">Rosnelli Flores</span>
        <div className="h-8 w-8 rounded-full bg-[hsl(213,40%,35%)] flex items-center justify-center text-xs font-bold text-white">
          RF
        </div>
      </div>
    </header>
  );
}
