import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { PermissionsProvider, usePermissions } from "@/hooks/usePermissions";
import { Layout } from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Agenda from "./pages/Agenda";
import Citas from "./pages/Citas";
import Pagos from "./pages/Pagos";
import Services from "./pages/Services";
import Products from "./pages/Products";
import Inventario from "./pages/Inventario";
import Compras from "./pages/Compras";
import Gastos from "./pages/Gastos";
import Ventas from "./pages/Ventas";
import Turnos from "./pages/Turnos";
import Cortes from "./pages/Cortes";
import Horarios from "./pages/Horarios";
import Configuracion from "./pages/Configuracion";
import Permisos from "./pages/Permisos";
import SuperAdmin from "./pages/SuperAdmin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { isAuthenticated, isLoading } = usePermissions();

  // Mostrar loading mientras verifica sesión
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not authenticated, show login
  if (!isAuthenticated) {
    return <Login />;
  }

  // Authenticated - show main app
  return (
    <Layout>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute moduleId="dashboard">
              <Index />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin"
          element={
            <ProtectedRoute moduleId={"superadmin" as any}>
              <SuperAdmin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/agenda"
          element={
            <ProtectedRoute moduleId="agenda">
              <Agenda />
            </ProtectedRoute>
          }
        />
        <Route
          path="/citas"
          element={
            <ProtectedRoute moduleId="agenda">
              <Citas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pagos"
          element={
            <ProtectedRoute moduleId="agenda">
              <Pagos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/servicios"
          element={
            <ProtectedRoute moduleId="servicios">
              <Services />
            </ProtectedRoute>
          }
        />
        <Route
          path="/productos"
          element={
            <ProtectedRoute moduleId="productos">
              <Products />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventario"
          element={
            <ProtectedRoute moduleId="inventario">
              <Inventario />
            </ProtectedRoute>
          }
        />
        <Route
          path="/compras"
          element={
            <ProtectedRoute moduleId="compras">
              <Compras />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gastos"
          element={
            <ProtectedRoute moduleId="gastos">
              <Gastos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ventas"
          element={
            <ProtectedRoute moduleId="ventas">
              <Ventas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/turnos"
          element={
            <ProtectedRoute moduleId="turnos">
              <Turnos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cortes"
          element={
            <ProtectedRoute moduleId="cortes">
              <Cortes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/horarios"
          element={
            <ProtectedRoute moduleId="horarios">
              <Horarios />
            </ProtectedRoute>
          }
        />
        <Route
          path="/configuracion"
          element={
            <ProtectedRoute moduleId="configuracion">
              <Configuracion />
            </ProtectedRoute>
          }
        />
        <Route
          path="/permisos"
          element={
            <ProtectedRoute moduleId="permisos">
              <Permisos />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <PermissionsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <HashRouter>
            <AppRoutes />
          </HashRouter>
        </TooltipProvider>
      </PermissionsProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
