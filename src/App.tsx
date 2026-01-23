import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { PermissionsProvider, usePermissions } from "@/hooks/usePermissions";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/layout/Layout";

// Pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Pricing from "./pages/Pricing";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Agenda from "./pages/Agenda";
import Citas from "./pages/Citas";
import Ventas from "./pages/Ventas";
import Pagos from "./pages/Pagos";
import Gastos from "./pages/Gastos";
import Compras from "./pages/Compras";
import Inventario from "./pages/Inventario";
import Services from "./pages/Services";
import Products from "./pages/Products";
import Turnos from "./pages/Turnos";
import Cortes from "./pages/Cortes";
import Horarios from "./pages/Horarios";
import Configuracion from "./pages/Configuracion";
import Permisos from "./pages/Permisos";
import Proveedores from "./pages/Proveedores";
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

  // Public routes (no auth required)
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Authenticated - show main app
  return (
    <Layout>
      <Routes>
        {/* Redirect from auth pages to home when authenticated */}
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/signup" element={<Navigate to="/" replace />} />
        <Route path="/pricing" element={<Navigate to="/" replace />} />
        
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
        <Route
          path="/proveedores"
          element={
            <ProtectedRoute moduleId="proveedores">
              <Proveedores />
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
