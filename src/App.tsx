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
import Services from "./pages/Services";
import Products from "./pages/Products";
import ComingSoon from "./pages/ComingSoon";
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
              <Route path="/citas" element={<ComingSoon />} />
              <Route path="/servicios" element={<Services />} />
              <Route path="/productos" element={<Products />} />
              <Route path="/inventario" element={<ComingSoon />} />
              <Route path="/compras" element={<ComingSoon />} />
              <Route path="/gastos" element={<ComingSoon />} />
              <Route path="/ventas" element={<ComingSoon />} />
              <Route path="/turnos" element={<ComingSoon />} />
              <Route path="/cortes" element={<ComingSoon />} />
              <Route path="/configuracion" element={<ComingSoon />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
