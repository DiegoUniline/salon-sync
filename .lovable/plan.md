

# Plan: Reparar Sistema Completo de SalonPro

## Problema Principal (Pantalla en blanco)

El archivo `.env` no existe en el proyecto, lo que causa que `import.meta.env.VITE_SUPABASE_URL` sea `undefined`. El archivo `client.ts` (auto-generado) falla al crear el cliente porque la URL es requerida.

**Causa raiz**: El `.env` es gestionado automaticamente por la plataforma, pero no esta siendo inyectado correctamente. No se debe editar manualmente.

**Solucion**: Eliminar la linea `envPrefix: "VITE_"` que fue agregada manualmente a `vite.config.ts` (no estaba originalmente) y limpiar el debug de `main.tsx`. Esto forzara un rebuild limpio donde la plataforma inyecte correctamente las variables de entorno.

## Problema Secundario (RLS Restrictivas)

Todas las politicas RLS estan marcadas como **RESTRICTIVE** (`Permissive: No`). En PostgreSQL, multiples politicas RESTRICTIVE requieren que **TODAS** se cumplan simultaneamente. Esto significa que un usuario normal nunca podra acceder a datos porque no cumple la politica de `super_admin` al mismo tiempo que la de `account_user`.

**Solucion**: Cambiar todas las politicas a PERMISSIVE para que funcionen con logica OR (cualquier politica que se cumpla permite acceso).

## Problema Terciario (Trigger faltante)

La funcion `handle_new_user()` existe pero no hay trigger asociado en `auth.users`. Esto significa que al hacer signup, no se crea automaticamente el perfil en `profiles`.

**Solucion**: Crear el trigger en `auth.users`.

---

## Pasos de Implementacion

### Paso 1: Restaurar vite.config.ts

Eliminar `envPrefix: "VITE_"` que no es necesario (Vite usa ese prefijo por defecto). Esto ayudara a forzar un rebuild limpio.

### Paso 2: Limpiar main.tsx

Remover los logs de debug que no son necesarios y pueden interferir.

### Paso 3: Migracion SQL - Corregir RLS y Trigger

Ejecutar una migracion que:

1. **Elimine todas las politicas RESTRICTIVE** y las recree como **PERMISSIVE** en todas las tablas (accounts, branches, profiles, user_roles, services, products, etc.)
2. **Cree el trigger** `on_auth_user_created` en `auth.users` que llame a `handle_new_user()`
3. **Verifique** que `subscription_plans` tenga datos

### Tablas afectadas por cambio RLS:
- accounts
- branches
- profiles
- user_roles
- custom_roles
- account_subscriptions
- subscription_plans
- services
- products
- clients
- appointments
- sales
- expenses
- purchases
- purchase_payments
- shifts
- cash_cuts
- categories
- suppliers
- schedules
- blocked_days
- inventory_movements

---

## Seccion Tecnica

### vite.config.ts (resultado final)
```typescript
export default defineConfig(({ mode }) => ({
  server: { host: "::", port: 8080 },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
}));
```

### main.tsx (resultado final)
```typescript
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
```

### SQL Migration (resumen)
- DROP + CREATE de ~45 politicas RLS cambiando de RESTRICTIVE a PERMISSIVE
- CREATE TRIGGER on_auth_user_created para auto-crear perfil al signup

### Resultado Esperado
1. La app cargara correctamente mostrando la pantalla de login
2. El signup creara correctamente el perfil, cuenta, sucursal y suscripcion
3. El login permitira acceder a los datos de la cuenta del usuario
4. Todas las operaciones CRUD funcionaran correctamente con las politicas RLS permisivas

