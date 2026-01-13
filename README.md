# Sistema de Gestión para Negocios de Servicios

Sistema multi-sucursal para la gestión de citas, ventas, inventario, turnos y cortes de caja. Diseñado para salones de belleza, consultorios nutricionales y clínicas médicas.

## 🚀 Tecnologías

- **Frontend:** React 18 + TypeScript
- **Estilos:** Tailwind CSS + shadcn/ui
- **Routing:** React Router DOM
- **Estado:** React Context + LocalStorage (mock)
- **Build:** Vite

---

## 📁 Estructura del Proyecto

```
src/
├── components/
│   ├── ui/                    # Componentes shadcn/ui
│   ├── dashboard/             # Widgets del dashboard
│   ├── layout/                # Header, Sidebar, Layout
│   ├── AppointmentFormDialog  # Formulario de citas
│   ├── EditableCell           # Celdas editables en tablas
│   ├── MultiPaymentSelector   # Selector de pagos mixtos
│   ├── OdooLineEditor         # Editor de líneas tipo ERP
│   ├── ShiftRequiredAlert     # Alerta de turno requerido
│   └── TicketPrinter          # Generador de tickets
├── contexts/
│   └── AppContext.tsx         # Estado global (sucursal, tema, config)
├── hooks/
│   ├── useShift.ts            # Lógica de turnos
│   └── useTerminology.ts      # Terminología dinámica
├── lib/
│   ├── mockData.ts            # Datos simulados
│   ├── businessConfig.ts      # Configuración de negocio
│   ├── storage.ts             # Helpers de LocalStorage
│   └── utils.ts               # Utilidades
└── pages/                     # Vistas principales
```

---

## 🗄️ MODELO DE DATOS

### 1. Branch (Sucursal)

```typescript
interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
}
```

| Campo   | Tipo   | Descripción                    |
|---------|--------|--------------------------------|
| id      | string | Identificador único (UUID)     |
| name    | string | Nombre de la sucursal          |
| address | string | Dirección física               |
| phone   | string | Teléfono de contacto           |

---

### 2. Stylist / Professional (Estilista/Profesional)

```typescript
interface Stylist {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'stylist' | 'receptionist';
  avatar?: string;
  color: string;
  branchId: string;
  active: boolean;
}
```

| Campo    | Tipo    | Descripción                              |
|----------|---------|------------------------------------------|
| id       | string  | Identificador único                      |
| name     | string  | Nombre completo                          |
| email    | string  | Correo electrónico                       |
| phone    | string  | Teléfono                                 |
| role     | enum    | Rol: admin, stylist, receptionist        |
| avatar   | string? | URL de imagen de perfil                  |
| color    | string  | Color para identificar en agenda (hex)   |
| branchId | string  | FK a Branch                              |
| active   | boolean | Si está activo o no                      |

---

### 3. Service (Servicio)

```typescript
interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number;      // minutos
  commission: number;    // porcentaje (0-100)
  active: boolean;
}
```

| Campo      | Tipo    | Descripción                        |
|------------|---------|-----------------------------------|
| id         | string  | Identificador único               |
| name       | string  | Nombre del servicio               |
| category   | string  | Categoría (corte, color, etc.)    |
| price      | number  | Precio en moneda local            |
| duration   | number  | Duración en minutos               |
| commission | number  | % de comisión para el profesional |
| active     | boolean | Si está disponible                |

**Categorías de Servicios:**
- Cortes
- Color
- Tratamientos
- Peinados
- Uñas
- Maquillaje
- Barba

---

### 4. Product (Producto)

```typescript
interface Product {
  id: string;
  name: string;
  category: string;
  sku: string;
  price: number;         // Precio de venta
  cost: number;          // Costo de compra
  stock: number;         // Cantidad actual
  minStock: number;      // Stock mínimo para alertas
  active: boolean;
}
```

| Campo    | Tipo    | Descripción                          |
|----------|---------|--------------------------------------|
| id       | string  | Identificador único                  |
| name     | string  | Nombre del producto                  |
| category | string  | Categoría                            |
| sku      | string  | Código único de producto             |
| price    | number  | Precio de venta al público           |
| cost     | number  | Costo de adquisición                 |
| stock    | number  | Cantidad en inventario               |
| minStock | number  | Nivel mínimo antes de alerta         |
| active   | boolean | Si está disponible para venta        |

**Categorías de Productos:**
- Shampoo
- Acondicionador
- Tratamiento
- Styling
- Color
- Accesorios

---

### 5. Client (Cliente)

```typescript
interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  createdAt: string;     // ISO date
}
```

| Campo     | Tipo    | Descripción                    |
|-----------|---------|--------------------------------|
| id        | string  | Identificador único            |
| name      | string  | Nombre completo                |
| phone     | string  | Teléfono (principal)           |
| email     | string? | Correo electrónico             |
| notes     | string? | Notas adicionales              |
| createdAt | string  | Fecha de registro (ISO 8601)   |

---

### 6. Appointment (Cita)

```typescript
interface AppointmentService {
  service: Service;
  price: number;         // Puede tener descuento
  discount: number;      // Porcentaje de descuento
}

interface AppointmentProduct {
  product: Product;
  quantity: number;
  price: number;
  discount: number;
}

interface PaymentMethod {
  method: 'cash' | 'card' | 'transfer';
  amount: number;
}

interface Appointment {
  id: string;
  branchId: string;
  clientId?: string;
  clientName: string;
  clientPhone: string;
  stylistId: string;
  stylist: Stylist;
  date: string;          // YYYY-MM-DD
  time: string;          // HH:mm
  duration: number;      // minutos totales
  services: AppointmentService[];
  products: AppointmentProduct[];
  payments: PaymentMethod[];
  subtotal: number;
  discount: number;      // Descuento general
  total: number;
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  createdAt: string;
}
```

| Campo       | Tipo                | Descripción                              |
|-------------|---------------------|------------------------------------------|
| id          | string              | Identificador único                      |
| branchId    | string              | FK a Branch                              |
| clientId    | string?             | FK a Client (opcional si es nuevo)       |
| clientName  | string              | Nombre del cliente                       |
| clientPhone | string              | Teléfono del cliente                     |
| stylistId   | string              | FK a Stylist                             |
| stylist     | Stylist             | Objeto del profesional (denormalizado)   |
| date        | string              | Fecha de la cita (YYYY-MM-DD)            |
| time        | string              | Hora de inicio (HH:mm)                   |
| duration    | number              | Duración total en minutos                |
| services    | AppointmentService[]| Lista de servicios con precios/descuentos|
| products    | AppointmentProduct[]| Productos vendidos en la cita            |
| payments    | PaymentMethod[]     | Métodos de pago utilizados               |
| subtotal    | number              | Subtotal antes de descuento general      |
| discount    | number              | % de descuento general                   |
| total       | number              | Total final a pagar                      |
| status      | enum                | Estado de la cita                        |
| notes       | string?             | Notas adicionales                        |
| createdAt   | string              | Fecha de creación                        |

**Estados de Cita:**
- `scheduled` - Agendada
- `confirmed` - Confirmada
- `in-progress` - En progreso
- `completed` - Completada (pagada)
- `cancelled` - Cancelada
- `no-show` - No se presentó

---

### 7. Sale (Venta directa sin cita)

```typescript
interface SaleItem {
  type: 'service' | 'product';
  itemId: string;
  name: string;
  quantity: number;
  price: number;
  discount: number;
  subtotal: number;
}

interface Sale {
  id: string;
  branchId: string;
  date: string;
  time: string;
  items: SaleItem[];
  payments: PaymentMethod[];
  subtotal: number;
  discount: number;
  total: number;
  clientName?: string;
  clientPhone?: string;
  stylistId?: string;
  notes?: string;
}
```

| Campo       | Tipo            | Descripción                        |
|-------------|-----------------|-----------------------------------|
| id          | string          | Identificador único               |
| branchId    | string          | FK a Branch                       |
| date        | string          | Fecha de la venta                 |
| time        | string          | Hora de la venta                  |
| items       | SaleItem[]      | Productos/servicios vendidos      |
| payments    | PaymentMethod[] | Métodos de pago                   |
| subtotal    | number          | Subtotal                          |
| discount    | number          | Descuento general %               |
| total       | number          | Total final                       |
| clientName  | string?         | Nombre del cliente (opcional)     |
| clientPhone | string?         | Teléfono (opcional)               |
| stylistId   | string?         | Profesional que atendió           |
| notes       | string?         | Notas                             |

---

### 8. Expense (Gasto)

```typescript
interface Expense {
  id: string;
  branchId: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'transfer';
  supplier?: string;
  notes?: string;
}
```

| Campo         | Tipo   | Descripción                      |
|---------------|--------|----------------------------------|
| id            | string | Identificador único              |
| branchId      | string | FK a Branch                      |
| date          | string | Fecha del gasto                  |
| category      | string | Categoría del gasto              |
| description   | string | Descripción                      |
| amount        | number | Monto del gasto                  |
| paymentMethod | enum   | Método de pago utilizado         |
| supplier      | string?| Proveedor (texto libre)          |
| notes         | string?| Notas adicionales                |

**Categorías de Gastos:**
- Renta
- Servicios (luz, agua, internet)
- Insumos
- Nómina
- Marketing
- Mantenimiento
- Otros

---

### 9. Purchase (Compra de inventario)

```typescript
interface PurchaseLine {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
}

interface Purchase {
  id: string;
  branchId: string;
  date: string;
  supplier: string;
  lines: PurchaseLine[];
  payments: PaymentMethod[];
  total: number;
  notes?: string;
}
```

| Campo    | Tipo            | Descripción                     |
|----------|-----------------|--------------------------------|
| id       | string          | Identificador único            |
| branchId | string          | FK a Branch                    |
| date     | string          | Fecha de la compra             |
| supplier | string          | Nombre del proveedor           |
| lines    | PurchaseLine[]  | Productos comprados            |
| payments | PaymentMethod[] | Métodos de pago                |
| total    | number          | Total de la compra             |
| notes    | string?         | Notas                          |

---

### 10. InventoryMovement (Movimiento de inventario)

```typescript
interface InventoryMovement {
  id: string;
  branchId: string;
  productId: string;
  productName: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;      // Positivo para entrada, negativo para salida
  reason: string;
  date: string;
  time: string;
  userId: string;
}
```

| Campo       | Tipo   | Descripción                              |
|-------------|--------|------------------------------------------|
| id          | string | Identificador único                      |
| branchId    | string | FK a Branch                              |
| productId   | string | FK a Product                             |
| productName | string | Nombre del producto (denormalizado)      |
| type        | enum   | Tipo: entrada, salida, ajuste            |
| quantity    | number | Cantidad (+entrada, -salida)             |
| reason      | string | Razón del movimiento                     |
| date        | string | Fecha del movimiento                     |
| time        | string | Hora del movimiento                      |
| userId      | string | Usuario que realizó el movimiento        |

**Tipos de Movimiento:**
- `in` - Entrada (compra, devolución)
- `out` - Salida (venta, merma, uso interno)
- `adjustment` - Ajuste de inventario

---

### 11. Shift (Turno)

```typescript
interface Shift {
  id: string;
  branchId: string;
  userId: string;
  user: Stylist;
  date: string;
  startTime: string;
  endTime?: string;
  initialCash: number;
  finalCash?: number;
  status: 'open' | 'closed';
}
```

| Campo       | Tipo    | Descripción                         |
|-------------|---------|-------------------------------------|
| id          | string  | Identificador único                 |
| branchId    | string  | FK a Branch                         |
| userId      | string  | FK a Stylist (quien abre turno)     |
| user        | Stylist | Objeto del usuario (denormalizado)  |
| date        | string  | Fecha del turno                     |
| startTime   | string  | Hora de apertura                    |
| endTime     | string? | Hora de cierre                      |
| initialCash | number  | Efectivo inicial en caja            |
| finalCash   | number? | Efectivo final declarado            |
| status      | enum    | open o closed                       |

---

### 12. CashCut (Corte de Caja)

```typescript
interface CashCut {
  id: string;
  shiftId: string;
  branchId: string;
  date: string;
  userId: string;
  userName: string;
  
  // Resumen
  totalSales: number;
  totalExpenses: number;
  totalPurchases: number;
  completedAppointments: number;
  
  // Por método de pago
  salesByMethod: Record<string, number>;
  expensesByMethod: Record<string, number>;
  purchasesByMethod: Record<string, number>;
  expectedByMethod: Record<string, number>;
  realByMethod: Record<string, number>;
  differenceByMethod: Record<string, number>;
  
  // Totales
  expected: number;
  real: number;
  difference: number;
  
  // Caja
  initialCash: number;
  finalCash: number;
  
  createdAt: string;
}
```

| Campo                 | Tipo                    | Descripción                           |
|-----------------------|-------------------------|---------------------------------------|
| id                    | string                  | Identificador único                   |
| shiftId               | string                  | FK a Shift                            |
| branchId              | string                  | FK a Branch                           |
| date                  | string                  | Fecha del corte                       |
| userId                | string                  | Usuario que hizo el corte             |
| userName              | string                  | Nombre del usuario                    |
| totalSales            | number                  | Suma de todas las ventas              |
| totalExpenses         | number                  | Suma de todos los gastos              |
| totalPurchases        | number                  | Suma de todas las compras             |
| completedAppointments | number                  | Citas completadas en el turno         |
| salesByMethod         | Record<string, number>  | Ventas por método de pago             |
| expensesByMethod      | Record<string, number>  | Gastos por método de pago             |
| purchasesByMethod     | Record<string, number>  | Compras por método de pago            |
| expectedByMethod      | Record<string, number>  | Esperado por método                   |
| realByMethod          | Record<string, number>  | Real declarado por método             |
| differenceByMethod    | Record<string, number>  | Diferencia por método                 |
| expected              | number                  | Total esperado                        |
| real                  | number                  | Total real declarado                  |
| difference            | number                  | Diferencia total                      |
| initialCash           | number                  | Efectivo inicial del turno            |
| finalCash             | number                  | Efectivo final declarado              |
| createdAt             | string                  | Fecha/hora de creación                |

---

### 14. Role (Rol de Usuario)

```typescript
interface ModulePermissions {
  view: boolean;      // Puede ver el módulo
  create: boolean;    // Puede crear registros
  edit: boolean;      // Puede editar registros
  delete: boolean;    // Puede eliminar registros
}

interface Role {
  id: string;
  name: string;
  description: string;
  color: string;
  isSystem: boolean;  // Roles del sistema no se pueden eliminar
  permissions: Record<ModuleId, ModulePermissions>;
}
```

| Campo       | Tipo                                    | Descripción                           |
|-------------|----------------------------------------|---------------------------------------|
| id          | string                                 | Identificador único                   |
| name        | string                                 | Nombre del rol                        |
| description | string                                 | Descripción del rol                   |
| color       | string                                 | Color para identificar (hex)          |
| isSystem    | boolean                                | Si es un rol del sistema              |
| permissions | Record<ModuleId, ModulePermissions>    | Permisos por módulo                   |

**Módulos controlados:**
- `dashboard` - Panel principal
- `agenda` - Calendario de citas
- `ventas` - Registro de ventas
- `gastos` - Registro de gastos
- `compras` - Registro de compras
- `inventario` - Control de stock
- `servicios` - Catálogo de servicios
- `productos` - Catálogo de productos
- `turnos` - Gestión de turnos
- `cortes` - Cortes de caja
- `horarios` - Configuración de horarios
- `configuracion` - Ajustes del sistema
- `permisos` - Gestión de roles y usuarios

**Roles predefinidos del sistema:**
| Rol           | Descripción                                          |
|---------------|------------------------------------------------------|
| Administrador | Acceso completo a todos los módulos y acciones       |
| Gerente       | Gestión completa excepto configuración de permisos   |
| Recepcionista | Gestión de citas, ventas y clientes                  |
| Estilista     | Ver agenda y registrar servicios propios             |

---

### 15. UserWithRole (Usuario con Rol)

```typescript
interface UserWithRole {
  id: string;
  name: string;
  email: string;
  roleId: string;      // FK a Role
  branchId?: string;   // FK a Branch (opcional, si aplica a todas)
  active: boolean;
}
```

| Campo    | Tipo    | Descripción                              |
|----------|---------|------------------------------------------|
| id       | string  | Identificador único                      |
| name     | string  | Nombre completo                          |
| email    | string  | Correo electrónico                       |
| roleId   | string  | FK a Role                                |
| branchId | string? | FK a Branch (null = todas las sucursales)|
| active   | boolean | Si el usuario está activo                |

---

### 16. Schedule (Horarios)

```typescript
interface DaySchedule {
  enabled: boolean;
  openTime: string;      // HH:mm
  closeTime: string;     // HH:mm
}

interface WeekSchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

interface BranchSchedule {
  branchId: string;
  schedule: WeekSchedule;
}

interface StylistSchedule {
  stylistId: string;
  branchId: string;
  schedule: WeekSchedule;
}

interface BlockedDay {
  id: string;
  type: 'all' | 'branch' | 'stylist';
  targetId?: string;     // branchId o stylistId
  startDate: string;
  endDate: string;
  reason: string;
}
```

---

## 📱 VISTAS Y FUNCIONALIDADES

### 1. Dashboard (`/`)

**Propósito:** Vista general del negocio con métricas del día.

**Widgets:**
- Ventas del día (monto total)
- Citas de hoy (total y completadas)
- Citas pendientes
- Timeline de citas del día
- Gráfico de ingresos semanales
- Top servicios vendidos
- Top productos vendidos

**Acciones rápidas:**
- Nueva cita
- Nueva venta
- Nuevo gasto
- Abrir/cerrar turno

---

### 2. Agenda (`/agenda`)

**Propósito:** Calendario visual para gestionar citas.

**Vistas:**
- Día (slots de 30 min)
- Semana (vista horizontal)
- Mes (vista calendario)

**Funcionalidades:**
- Filtrar por sucursal y profesional
- Crear cita con click o arrastre
- Ver detalle de cita en popover
- Editar/cancelar citas
- Colores por profesional

**Formulario de cita:**
- Cliente (existente o nuevo)
- Profesional
- Fecha y hora
- Servicios (múltiples, con descuento individual)
- Productos (múltiples, con cantidad y descuento)
- Descuento general
- Métodos de pago (mixto)
- Notas

---

### 3. Ventas (`/ventas`)

**Propósito:** Registro de ventas directas (sin cita).

**Requiere:** Turno abierto

**Campos del formulario:**
- Cliente (nombre y teléfono, opcional)
- Profesional
- Servicios y productos (con OdooLineEditor)
- Descuento general
- Métodos de pago mixtos
- Notas

**Tabla de ventas:**
- Fecha/hora
- Cliente
- Items
- Método de pago
- Total
- Acciones (ver, eliminar)

---

### 4. Gastos (`/gastos`)

**Propósito:** Registro de gastos operativos.

**Requiere:** Turno abierto

**Campos:**
- Categoría
- Descripción
- Monto
- Fecha
- Método de pago
- Proveedor (opcional)

**Estadísticas:**
- Total de gastos
- Gastos por categoría

---

### 5. Compras (`/compras`)

**Propósito:** Registro de compras de inventario.

**Requiere:** Turno abierto

**Campos:**
- Proveedor
- Fecha
- Líneas de productos (OdooLineEditor):
  - Producto
  - Cantidad
  - Costo unitario
  - Subtotal (calculado)
- Métodos de pago mixtos
- Notas

---

### 6. Inventario (`/inventario`)

**Propósito:** Control de stock y movimientos.

**Tabs:**
1. **Stock Actual:**
   - Lista de productos con stock actual
   - Alertas de stock bajo
   - Valor total del inventario
   - Filtros por categoría y stock

2. **Movimientos:**
   - Historial de entradas/salidas/ajustes
   - Filtros por tipo y fecha

**Acciones:**
- Entrada de inventario
- Salida de inventario
- Ajuste de inventario

---

### 7. Servicios (`/servicios`)

**Propósito:** Catálogo de servicios.

**Campos:**
- Nombre
- Categoría
- Precio
- Duración (minutos)
- Comisión (%)
- Activo (sí/no)

**Vistas:**
- Tabla (con edición inline)
- Tarjetas (agrupadas por categoría)

**Funcionalidades:**
- CRUD completo
- Creación masiva (bulk)
- Activar/desactivar
- Edición inline

---

### 8. Productos (`/productos`)

**Propósito:** Catálogo de productos.

**Campos:**
- Nombre
- Categoría
- SKU
- Precio de venta
- Costo
- Stock actual
- Stock mínimo
- Activo

**Indicadores:**
- Margen de ganancia
- Alerta de stock bajo

---

### 9. Turnos (`/turnos`)

**Propósito:** Gestión de turnos de caja.

**Abrir turno:**
- Seleccionar usuario
- Ingresar efectivo inicial

**Cerrar turno (2 pasos):**
1. **Paso 1 - Ingreso de montos:**
   - Ingresar monto real por cada método de pago:
     - Efectivo
     - Tarjeta
     - Transferencia

2. **Paso 2 - Resumen (solo lectura):**
   - Información del turno
   - Resumen: ventas, gastos, compras, citas completadas
   - Desglose por método de pago:
     - Ventas por método
     - Gastos por método
     - Compras por método
     - Esperado vs Real
     - Diferencia
   - Diferencia total

**Tabla de turnos:**
- Fecha
- Usuario
- Hora inicio/fin
- Caja inicial/final
- Estado

---

### 10. Cortes (`/cortes`)

**Propósito:** Historial de cortes de caja.

**Información mostrada:**
- Fecha y usuario
- Ventas totales
- Gastos totales
- Esperado vs Real
- Diferencia

---

### 11. Horarios (`/horarios`)

**Propósito:** Configuración de horarios.

**Tabs:**
1. **Sucursales:** Horario de operación por día
2. **Profesionales:** Horario individual por día
3. **Días bloqueados:** Vacaciones, días festivos

---

### 12. Permisos (`/permisos`)

**Propósito:** Gestión de roles y permisos de usuarios.

**Tabs:**

1. **Roles:**
   - Lista de roles con tarjetas
   - Crear/editar/duplicar/eliminar roles
   - Configurar permisos por módulo y acción
   - Roles del sistema (no eliminables): Admin, Gerente, Recepcionista, Estilista

2. **Usuarios:**
   - Tabla de usuarios con rol asignado
   - Crear/editar/eliminar usuarios
   - Asignar rol y sucursal
   - Activar/desactivar usuarios

**Editor de permisos:**
- Lista expandible de módulos
- 4 acciones por módulo: Ver, Crear, Editar, Eliminar
- Toggle para habilitar/deshabilitar todos
- Contador de permisos activos

**Validaciones:**
- No se pueden eliminar roles del sistema
- No se puede eliminar un rol si tiene usuarios asignados

---

### 13. Configuración (`/configuracion`)

**Propósito:** Ajustes del sistema.

**Secciones:**
- Tipo de negocio (salón, nutrición, médico)
- Información del negocio
- Campos del ticket
- Tema (claro/oscuro)

---

## 🔄 FLUJOS DE NEGOCIO

### Flujo de Apertura de Turno
```
1. Usuario selecciona "Abrir Turno"
2. Elige usuario responsable
3. Ingresa efectivo inicial
4. Sistema crea registro de Shift con status: 'open'
5. Se habilitan módulos que requieren turno (Ventas, Gastos, Compras)
```

### Flujo de Cierre de Turno
```
1. Usuario selecciona "Cerrar Turno"
2. Sistema muestra formulario para ingresar montos reales por método
3. Usuario ingresa: efectivo, tarjeta, transferencia
4. Usuario confirma cierre
5. Sistema calcula:
   - Ventas del turno (filtradas por fecha y sucursal)
   - Gastos del turno
   - Compras del turno
   - Citas completadas
   - Desglose por método de pago
   - Diferencias (esperado vs real)
6. Sistema muestra resumen (solo lectura)
7. Sistema crea registro de CashCut
8. Sistema actualiza Shift con status: 'closed'
```

### Flujo de Cita
```
1. Seleccionar fecha/hora en agenda
2. Elegir o crear cliente
3. Seleccionar profesional
4. Agregar servicios (con descuentos opcionales)
5. Agregar productos (con cantidades y descuentos)
6. Aplicar descuento general (opcional)
7. Seleccionar método(s) de pago
8. Guardar cita
9. Al completar: se registra como venta y afecta inventario
```

### Flujo de Venta Directa
```
1. Verificar turno abierto
2. Seleccionar servicios/productos
3. Aplicar descuentos
4. Seleccionar método(s) de pago
5. Guardar venta
6. Actualizar inventario automáticamente
```

### Flujo de Compra
```
1. Verificar turno abierto
2. Ingresar proveedor
3. Agregar líneas de productos con cantidad y costo
4. Seleccionar método(s) de pago
5. Guardar compra
6. Actualizar inventario (entrada automática)
```

---

## 💾 ALMACENAMIENTO LOCAL

El sistema usa LocalStorage para persistir datos. Las claves utilizadas son:

| Clave                    | Descripción                    |
|--------------------------|--------------------------------|
| `salon_current_branch`   | ID de sucursal activa          |
| `salon_theme`            | Tema (light/dark)              |
| `salon_business_config`  | Configuración del negocio      |
| `salon_shifts`           | Lista de turnos                |
| `salon_sales`            | Lista de ventas                |
| `salon_expenses`         | Lista de gastos                |
| `salon_purchases`        | Lista de compras               |
| `salon_appointments`     | Lista de citas                 |
| `salon_products`         | Lista de productos             |
| `salon_services`         | Lista de servicios             |
| `salon_clients`          | Lista de clientes              |
| `salon_inventory`        | Movimientos de inventario      |
| `salon_cash_cuts`        | Lista de cortes de caja        |
| `salon_roles`            | Lista de roles personalizados  |
| `salon_users_with_roles` | Usuarios con roles asignados   |

---

## 🗃️ ESQUEMA DE BASE DE DATOS SUGERIDO

```sql
-- Sucursales
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Usuarios/Profesionales
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE,
  phone VARCHAR(20),
  role VARCHAR(20) DEFAULT 'stylist',
  color VARCHAR(7) DEFAULT '#3B82F6',
  avatar_url TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Clientes
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Servicios
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50),
  price DECIMAL(10,2) NOT NULL,
  duration INTEGER DEFAULT 30,
  commission DECIMAL(5,2) DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Productos
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50),
  sku VARCHAR(50) UNIQUE,
  price DECIMAL(10,2) NOT NULL,
  cost DECIMAL(10,2) DEFAULT 0,
  stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 5,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Turnos
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id),
  user_id UUID REFERENCES users(id),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  initial_cash DECIMAL(10,2) DEFAULT 0,
  final_cash DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Citas
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id),
  client_id UUID REFERENCES clients(id),
  stylist_id UUID REFERENCES users(id),
  client_name VARCHAR(100),
  client_phone VARCHAR(20),
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration INTEGER DEFAULT 30,
  subtotal DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(5,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Servicios de cita (relación muchos a muchos)
CREATE TABLE appointment_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id),
  price DECIMAL(10,2) NOT NULL,
  discount DECIMAL(5,2) DEFAULT 0
);

-- Productos de cita
CREATE TABLE appointment_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  discount DECIMAL(5,2) DEFAULT 0
);

-- Pagos (genérico para citas, ventas, etc.)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_type VARCHAR(20) NOT NULL, -- 'appointment', 'sale', 'expense', 'purchase'
  reference_id UUID NOT NULL,
  method VARCHAR(20) NOT NULL, -- 'cash', 'card', 'transfer'
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Ventas directas
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id),
  stylist_id UUID REFERENCES users(id),
  client_name VARCHAR(100),
  client_phone VARCHAR(20),
  date DATE NOT NULL,
  time TIME NOT NULL,
  subtotal DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(5,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Items de venta
CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  item_type VARCHAR(20) NOT NULL, -- 'service', 'product'
  item_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  quantity INTEGER DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  discount DECIMAL(5,2) DEFAULT 0,
  subtotal DECIMAL(10,2) NOT NULL
);

-- Gastos
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id),
  date DATE NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(20) NOT NULL,
  supplier VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Compras
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id),
  date DATE NOT NULL,
  supplier VARCHAR(100) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Líneas de compra
CREATE TABLE purchase_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_cost DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL
);

-- Movimientos de inventario
CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id),
  product_id UUID REFERENCES products(id),
  type VARCHAR(20) NOT NULL, -- 'in', 'out', 'adjustment'
  quantity INTEGER NOT NULL,
  reason TEXT,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Cortes de caja
CREATE TABLE cash_cuts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID REFERENCES shifts(id),
  branch_id UUID REFERENCES branches(id),
  user_id UUID REFERENCES users(id),
  date DATE NOT NULL,
  total_sales DECIMAL(10,2) DEFAULT 0,
  total_expenses DECIMAL(10,2) DEFAULT 0,
  total_purchases DECIMAL(10,2) DEFAULT 0,
  completed_appointments INTEGER DEFAULT 0,
  expected DECIMAL(10,2) DEFAULT 0,
  real DECIMAL(10,2) DEFAULT 0,
  difference DECIMAL(10,2) DEFAULT 0,
  initial_cash DECIMAL(10,2) DEFAULT 0,
  final_cash DECIMAL(10,2) DEFAULT 0,
  sales_by_method JSONB DEFAULT '{}',
  expenses_by_method JSONB DEFAULT '{}',
  purchases_by_method JSONB DEFAULT '{}',
  expected_by_method JSONB DEFAULT '{}',
  real_by_method JSONB DEFAULT '{}',
  difference_by_method JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Horarios de sucursal
CREATE TABLE branch_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id) UNIQUE,
  schedule JSONB NOT NULL -- WeekSchedule object
);

-- Horarios de profesional
CREATE TABLE stylist_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stylist_id UUID REFERENCES users(id),
  branch_id UUID REFERENCES branches(id),
  schedule JSONB NOT NULL,
  UNIQUE(stylist_id, branch_id)
);

-- Días bloqueados
CREATE TABLE blocked_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL, -- 'all', 'branch', 'stylist'
  target_id UUID, -- branch_id o stylist_id según type
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Configuración del negocio
CREATE TABLE business_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) DEFAULT 'salon',
  name VARCHAR(100),
  phone VARCHAR(20),
  address TEXT,
  ticket_fields JSONB DEFAULT '[]',
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Roles del sistema
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6',
  is_system BOOLEAN DEFAULT FALSE,
  permissions JSONB NOT NULL, -- Record<ModuleId, ModulePermissions>
  created_at TIMESTAMP DEFAULT NOW()
);

-- Asignación de roles a usuarios
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role_id UUID REFERENCES roles(id) ON DELETE RESTRICT NOT NULL,
  branch_id UUID REFERENCES branches(id), -- NULL = todas las sucursales
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, role_id, branch_id)
);

-- Función para verificar permisos
CREATE OR REPLACE FUNCTION public.has_permission(
  _user_id UUID,
  _module_id TEXT,
  _action TEXT
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = _user_id
      AND ur.active = TRUE
      AND (r.permissions->_module_id->>_action)::boolean = TRUE
  )
$$;

-- Índices para mejor rendimiento
CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_appointments_branch ON appointments(branch_id);
CREATE INDEX idx_appointments_stylist ON appointments(stylist_id);
CREATE INDEX idx_sales_date ON sales(date);
CREATE INDEX idx_sales_branch ON sales(branch_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_branch ON expenses(branch_id);
CREATE INDEX idx_shifts_branch ON shifts(branch_id);
CREATE INDEX idx_shifts_date ON shifts(date);
CREATE INDEX idx_inventory_product ON inventory_movements(product_id);
CREATE INDEX idx_payments_reference ON payments(reference_type, reference_id);
```

---

## 🔐 CONSIDERACIONES DE SEGURIDAD (para backend)

1. **Autenticación:** Implementar JWT o sesiones
2. **Autorización:** Roles (admin, stylist, receptionist)
3. **RLS en Supabase:** Políticas por sucursal y usuario
4. **Validación:** Sanitizar inputs en servidor
5. **Auditoría:** Log de acciones críticas

---

## 📊 REPORTES SUGERIDOS

1. **Ventas por período** (día, semana, mes)
2. **Ventas por método de pago**
3. **Servicios más vendidos**
4. **Productos más vendidos**
5. **Rendimiento por profesional**
6. **Gastos por categoría**
7. **Inventario valorizado**
8. **Clientes frecuentes**
9. **Citas canceladas/no-show**
10. **Comparativo entre sucursales**

---

## 🚀 PRÓXIMOS PASOS PARA BACKEND

1. Crear proyecto en Supabase (o backend preferido)
2. Ejecutar scripts SQL del esquema
3. Configurar autenticación
4. Implementar RLS policies
5. Crear Edge Functions para lógica compleja
6. Conectar frontend con cliente Supabase
7. Migrar de LocalStorage a base de datos

---

## 📝 NOTAS ADICIONALES

- Los IDs usan formato UUID para compatibilidad con Supabase
- Los montos monetarios usan DECIMAL(10,2) para precisión
- Las fechas usan formato ISO 8601 (YYYY-MM-DD)
- Los horarios usan formato 24h (HH:mm)
- Los campos JSONB permiten estructuras flexibles
- El sistema soporta pagos mixtos (múltiples métodos por transacción)

---

**Versión:** 1.0  
**Última actualización:** Enero 2026
