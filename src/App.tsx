import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { Layout } from "@/components/layout/Layout";

// Pages
import Index from "./pages/Index";
import Agenda from "./pages/Agenda";
import Citas from "./pages/Citas";
import Services from "./pages/Services";
import Products from "./pages/Products";
import Inventario from "./pages/Inventario";
import Compras from "./pages/Compras";
import Gastos from "./pages/Gastos";
import Ventas from "./pages/Ventas";
import Turnos from "./pages/Turnos";
import Cortes from "./pages/Cortes";
import Configuracion from "./pages/Configuracion";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/citas" element={<Citas />} />
              <Route path="/servicios" element={<Services />} />
              <Route path="/productos" element={<Products />} />
              <Route path="/inventario" element={<Inventario />} />
              <Route path="/compras" element={<Compras />} />
              <Route path="/gastos" element={<Gastos />} />
              <Route path="/ventas" element={<Ventas />} />
              <Route path="/turnos" element={<Turnos />} />
              <Route path="/cortes" element={<Cortes />} />
              <Route path="/configuracion" element={<Configuracion />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
