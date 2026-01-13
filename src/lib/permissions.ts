// Módulos del sistema
export const modules = [
  { id: 'dashboard', name: 'Dashboard', icon: '📊' },
  { id: 'agenda', name: 'Agenda', icon: '📅' },
  { id: 'ventas', name: 'Ventas', icon: '💰' },
  { id: 'gastos', name: 'Gastos', icon: '💸' },
  { id: 'compras', name: 'Compras', icon: '📦' },
  { id: 'inventario', name: 'Inventario', icon: '🏪' },
  { id: 'servicios', name: 'Servicios', icon: '✂️' },
  { id: 'productos', name: 'Productos', icon: '🧴' },
  { id: 'turnos', name: 'Turnos', icon: '🕐' },
  { id: 'cortes', name: 'Cortes', icon: '🧾' },
  { id: 'horarios', name: 'Horarios', icon: '📆' },
  { id: 'configuracion', name: 'Configuración', icon: '⚙️' },
  { id: 'permisos', name: 'Permisos', icon: '🔐' },
] as const;

export type ModuleId = typeof modules[number]['id'];

// Acciones disponibles
export const actions = [
  { id: 'view', name: 'Ver', description: 'Puede acceder y ver el módulo' },
  { id: 'create', name: 'Crear', description: 'Puede agregar nuevos registros' },
  { id: 'edit', name: 'Editar', description: 'Puede modificar registros existentes' },
  { id: 'delete', name: 'Eliminar', description: 'Puede eliminar registros' },
] as const;

export type ActionId = typeof actions[number]['id'];

// Estructura de permisos por módulo
export interface ModulePermissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

// Rol
export interface Role {
  id: string;
  name: string;
  description: string;
  color: string;
  isSystem: boolean; // Roles del sistema no se pueden eliminar
  permissions: Record<ModuleId, ModulePermissions>;
}

// Usuario con rol asignado
export interface UserWithRole {
  id: string;
  name: string;
  email: string;
  password: string; // Contraseña (simulada)
  roleId: string;
  branchId?: string;
  active: boolean;
}

// Permisos por defecto (todos deshabilitados)
const defaultPermissions: Record<ModuleId, ModulePermissions> = {
  dashboard: { view: false, create: false, edit: false, delete: false },
  agenda: { view: false, create: false, edit: false, delete: false },
  ventas: { view: false, create: false, edit: false, delete: false },
  gastos: { view: false, create: false, edit: false, delete: false },
  compras: { view: false, create: false, edit: false, delete: false },
  inventario: { view: false, create: false, edit: false, delete: false },
  servicios: { view: false, create: false, edit: false, delete: false },
  productos: { view: false, create: false, edit: false, delete: false },
  turnos: { view: false, create: false, edit: false, delete: false },
  cortes: { view: false, create: false, edit: false, delete: false },
  horarios: { view: false, create: false, edit: false, delete: false },
  configuracion: { view: false, create: false, edit: false, delete: false },
  permisos: { view: false, create: false, edit: false, delete: false },
};

// Permisos completos (todos habilitados)
const fullPermissions: Record<ModuleId, ModulePermissions> = {
  dashboard: { view: true, create: true, edit: true, delete: true },
  agenda: { view: true, create: true, edit: true, delete: true },
  ventas: { view: true, create: true, edit: true, delete: true },
  gastos: { view: true, create: true, edit: true, delete: true },
  compras: { view: true, create: true, edit: true, delete: true },
  inventario: { view: true, create: true, edit: true, delete: true },
  servicios: { view: true, create: true, edit: true, delete: true },
  productos: { view: true, create: true, edit: true, delete: true },
  turnos: { view: true, create: true, edit: true, delete: true },
  cortes: { view: true, create: true, edit: true, delete: true },
  horarios: { view: true, create: true, edit: true, delete: true },
  configuracion: { view: true, create: true, edit: true, delete: true },
  permisos: { view: true, create: true, edit: true, delete: true },
};

// Roles predefinidos del sistema
export const defaultRoles: Role[] = [
  {
    id: 'admin',
    name: 'Administrador',
    description: 'Acceso completo a todos los módulos y acciones',
    color: '#EF4444',
    isSystem: true,
    permissions: fullPermissions,
  },
  {
    id: 'manager',
    name: 'Gerente',
    description: 'Gestión completa excepto configuración de permisos',
    color: '#F59E0B',
    isSystem: true,
    permissions: {
      ...fullPermissions,
      permisos: { view: false, create: false, edit: false, delete: false },
    },
  },
  {
    id: 'receptionist',
    name: 'Recepcionista',
    description: 'Gestión de citas, ventas y clientes',
    color: '#3B82F6',
    isSystem: true,
    permissions: {
      dashboard: { view: true, create: false, edit: false, delete: false },
      agenda: { view: true, create: true, edit: true, delete: true },
      ventas: { view: true, create: true, edit: false, delete: false },
      gastos: { view: false, create: false, edit: false, delete: false },
      compras: { view: false, create: false, edit: false, delete: false },
      inventario: { view: true, create: false, edit: false, delete: false },
      servicios: { view: true, create: false, edit: false, delete: false },
      productos: { view: true, create: false, edit: false, delete: false },
      turnos: { view: true, create: true, edit: false, delete: false },
      cortes: { view: false, create: false, edit: false, delete: false },
      horarios: { view: true, create: false, edit: false, delete: false },
      configuracion: { view: false, create: false, edit: false, delete: false },
      permisos: { view: false, create: false, edit: false, delete: false },
    },
  },
  {
    id: 'stylist',
    name: 'Estilista',
    description: 'Ver agenda y registrar servicios propios',
    color: '#10B981',
    isSystem: true,
    permissions: {
      dashboard: { view: true, create: false, edit: false, delete: false },
      agenda: { view: true, create: false, edit: false, delete: false },
      ventas: { view: false, create: false, edit: false, delete: false },
      gastos: { view: false, create: false, edit: false, delete: false },
      compras: { view: false, create: false, edit: false, delete: false },
      inventario: { view: false, create: false, edit: false, delete: false },
      servicios: { view: true, create: false, edit: false, delete: false },
      productos: { view: true, create: false, edit: false, delete: false },
      turnos: { view: true, create: false, edit: false, delete: false },
      cortes: { view: false, create: false, edit: false, delete: false },
      horarios: { view: true, create: false, edit: false, delete: false },
      configuracion: { view: false, create: false, edit: false, delete: false },
      permisos: { view: false, create: false, edit: false, delete: false },
    },
  },
];

// Storage keys
const ROLES_KEY = 'salon_roles';
const USERS_KEY = 'salon_users_with_roles';

// Helper para crear permisos vacíos
export const createEmptyPermissions = (): Record<ModuleId, ModulePermissions> => {
  return JSON.parse(JSON.stringify(defaultPermissions));
};

// Obtener roles
export const getRoles = (): Role[] => {
  try {
    const stored = localStorage.getItem(ROLES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error loading roles:', e);
  }
  return [...defaultRoles];
};

// Guardar roles
export const saveRoles = (roles: Role[]): void => {
  localStorage.setItem(ROLES_KEY, JSON.stringify(roles));
};

// Obtener usuarios con roles
export const getUsersWithRoles = (): UserWithRole[] => {
  try {
    const stored = localStorage.getItem(USERS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error loading users:', e);
  }
  // Usuarios por defecto con contraseñas
  return [
    { id: 'u1', name: 'María García', email: 'maria@salon.com', password: 'admin123', roleId: 'admin', branchId: 'b1', active: true },
    { id: 'u2', name: 'Carlos López', email: 'carlos@salon.com', password: '123456', roleId: 'manager', branchId: 'b1', active: true },
    { id: 'u3', name: 'Ana Martínez', email: 'ana@salon.com', password: '123456', roleId: 'receptionist', branchId: 'b1', active: true },
    { id: 'u4', name: 'Luis Hernández', email: 'luis@salon.com', password: '123456', roleId: 'stylist', branchId: 'b1', active: true },
  ];
};

// Guardar usuarios con roles
export const saveUsersWithRoles = (users: UserWithRole[]): void => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// Verificar si un usuario tiene permiso
export const hasPermission = (
  roleId: string,
  moduleId: ModuleId,
  action: ActionId,
  roles: Role[] = getRoles()
): boolean => {
  const role = roles.find(r => r.id === roleId);
  if (!role) return false;
  return role.permissions[moduleId]?.[action] ?? false;
};

// Obtener rol por ID
export const getRoleById = (roleId: string, roles: Role[] = getRoles()): Role | undefined => {
  return roles.find(r => r.id === roleId);
};
