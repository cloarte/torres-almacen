import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import { LotesProvider } from "@/contexts/LotesContext";
import Pedidos from "@/pages/Pedidos";
import Despachos from "@/pages/Despachos";
import CrearDespacho from "@/pages/CrearDespacho";
import CompletarDespacho from "@/pages/CompletarDespacho";
import DespachoDetalle from "@/pages/DespachoDetalle";
import Lotes from "@/pages/Lotes";
import Retornos from "@/pages/Retornos";
import VentaEspecial from "@/pages/VentaEspecial";
import Donaciones from "@/pages/Donaciones";
import AlertasVencimiento from "@/pages/AlertasVencimiento";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <LotesProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/pedidos?estado=PENDIENTE" replace />} />
            <Route element={<AppLayout />}>
              <Route path="/pedidos" element={<Pedidos />} />
              <Route path="/entrega/despachos" element={<Despachos />} />
              <Route path="/entrega/despachos/nuevo" element={<CrearDespacho />} />
              <Route path="/entrega/despachos/:id/completar" element={<CompletarDespacho />} />
              <Route path="/entrega/despachos/:id" element={<DespachoDetalle />} />
              <Route path="/entrega/lotes" element={<Lotes />} />
              <Route path="/entrega/retornos" element={<Retornos />} />
              <Route path="/entrega/venta-especial" element={<VentaEspecial />} />
              <Route path="/entrega/donaciones" element={<Donaciones />} />
              <Route path="/vencidos/alertas" element={<AlertasVencimiento />} />
              <Route path="/reportes/dashboard" element={<Dashboard />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </LotesProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
