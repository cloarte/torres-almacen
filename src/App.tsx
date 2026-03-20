import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import Pedidos from "@/pages/Pedidos";
import UsuariosPortal from "@/pages/UsuariosPortal";
import Despachos from "@/pages/Despachos";
import CrearDespacho from "@/pages/CrearDespacho";
import DespachoDetalle from "@/pages/DespachoDetalle";
import Lotes from "@/pages/Lotes";
import Retornos from "@/pages/Retornos";
import AlertasVencimiento from "@/pages/AlertasVencimiento";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/pedidos" replace />} />
          <Route element={<AppLayout />}>
            <Route path="/pedidos" element={<Pedidos />} />
            <Route path="/pedidos/usuarios-portal" element={<UsuariosPortal />} />
            <Route path="/entrega/despachos" element={<Despachos />} />
            <Route path="/entrega/despachos/nuevo" element={<CrearDespacho />} />
            <Route path="/entrega/despachos/:id" element={<DespachoDetalle />} />
            <Route path="/entrega/lotes" element={<Lotes />} />
            <Route path="/entrega/retornos" element={<Retornos />} />
            <Route path="/vencidos/alertas" element={<AlertasVencimiento />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
