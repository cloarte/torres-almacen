import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import Pedidos from "@/pages/Pedidos";
import UsuariosPortal from "@/pages/UsuariosPortal";
import Despachos from "@/pages/Despachos";
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
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
