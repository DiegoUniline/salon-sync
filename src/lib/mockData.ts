// Types
export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  duration: number;
  price: number;
  commission?: number;
  active: boolean;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  sku: string;
  stock: number;
  minStock: number;
  active: boolean;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
}

export interface Stylist {
  id: string;
  name: string;
  role: 'admin' | 'stylist' | 'receptionist';
  avatar?: string;
  color: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  client: Client;
  stylistId: string;
  stylist: Stylist;
  branchId: string;
  date: string;
  time: string;
  services: Service[];
  products?: Product[];
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'mixed';
  total: number;
  notes?: string;
}

export interface Sale {
  id: string;
  branchId: string;
  date: string;
  type: 'appointment' | 'direct';
  appointmentId?: string;
  products: { product: Product; quantity: number }[];
  services?: Service[];
  paymentMethod: 'cash' | 'card' | 'transfer' | 'mixed';
  total: number;
  stylistId?: string;
}

export interface Expense {
  id: string;
  branchId: string;
  date: string;
  category: 'rent' | 'utilities' | 'supplies' | 'payroll' | 'other';
  description: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'transfer';
}

export interface Shift {
  id: string;
  branchId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  initialCash: number;
  finalCash?: number;
  status: 'open' | 'closed';
}

// Mock Data
export const branches: Branch[] = [
  { id: 'b1', name: 'Sucursal Centro', address: 'Av. Principal 123', phone: '555-0101' },
  { id: 'b2', name: 'Sucursal Norte', address: 'Calle Norte 456', phone: '555-0102' },
  { id: 'b3', name: 'Sucursal Sur', address: 'Blvd. Sur 789', phone: '555-0103' },
];

export const stylists: Stylist[] = [
  { id: 's1', name: 'María García', role: 'admin', color: '#c97f67' },
  { id: 's2', name: 'Carlos López', role: 'stylist', color: '#67a3c9' },
  { id: 's3', name: 'Ana Martínez', role: 'stylist', color: '#8bc967' },
  { id: 's4', name: 'Laura Torres', role: 'receptionist', color: '#c967b3' },
];

export const serviceCategories = ['Corte', 'Color', 'Barba', 'Uñas', 'Facial', 'Peinado', 'Tratamiento'];

export const services: Service[] = [
  { id: 'sv1', name: 'Corte Clásico', category: 'Corte', duration: 30, price: 250, active: true },
  { id: 'sv2', name: 'Corte + Barba', category: 'Corte', duration: 45, price: 350, active: true },
  { id: 'sv3', name: 'Coloración Completa', category: 'Color', duration: 120, price: 800, active: true },
  { id: 'sv4', name: 'Mechas', category: 'Color', duration: 90, price: 650, active: true },
  { id: 'sv5', name: 'Arreglo de Barba', category: 'Barba', duration: 20, price: 150, active: true },
  { id: 'sv6', name: 'Manicure', category: 'Uñas', duration: 40, price: 200, active: true },
  { id: 'sv7', name: 'Pedicure', category: 'Uñas', duration: 50, price: 280, active: true },
  { id: 'sv8', name: 'Facial Express', category: 'Facial', duration: 30, price: 300, active: true },
  { id: 'sv9', name: 'Peinado Especial', category: 'Peinado', duration: 60, price: 400, active: true },
  { id: 'sv10', name: 'Tratamiento Capilar', category: 'Tratamiento', duration: 45, price: 350, active: true },
];

export const productCategories = ['Shampoo', 'Acondicionador', 'Styling', 'Tratamiento', 'Accesorios'];

export const products: Product[] = [
  { id: 'p1', name: 'Shampoo Profesional 500ml', category: 'Shampoo', price: 280, cost: 140, sku: 'SHP001', stock: 25, minStock: 5, active: true },
  { id: 'p2', name: 'Acondicionador Hidratante', category: 'Acondicionador', price: 260, cost: 130, sku: 'ACD001', stock: 20, minStock: 5, active: true },
  { id: 'p3', name: 'Cera para Cabello', category: 'Styling', price: 180, cost: 90, sku: 'STY001', stock: 15, minStock: 3, active: true },
  { id: 'p4', name: 'Gel Fijador Fuerte', category: 'Styling', price: 120, cost: 60, sku: 'STY002', stock: 30, minStock: 5, active: true },
  { id: 'p5', name: 'Mascarilla Reparadora', category: 'Tratamiento', price: 350, cost: 175, sku: 'TRT001', stock: 12, minStock: 3, active: true },
  { id: 'p6', name: 'Aceite de Argán', category: 'Tratamiento', price: 420, cost: 210, sku: 'TRT002', stock: 8, minStock: 2, active: true },
  { id: 'p7', name: 'Cepillo Profesional', category: 'Accesorios', price: 150, cost: 75, sku: 'ACC001', stock: 10, minStock: 2, active: true },
  { id: 'p8', name: 'Peine de Corte', category: 'Accesorios', price: 80, cost: 40, sku: 'ACC002', stock: 20, minStock: 5, active: true },
];

export const clients: Client[] = [
  { id: 'c1', name: 'Roberto Hernández', phone: '555-1001', email: 'roberto@email.com' },
  { id: 'c2', name: 'Patricia Sánchez', phone: '555-1002', email: 'patricia@email.com' },
  { id: 'c3', name: 'Miguel Ángel Ruiz', phone: '555-1003' },
  { id: 'c4', name: 'Fernanda Castro', phone: '555-1004', email: 'fer@email.com' },
  { id: 'c5', name: 'Diego Morales', phone: '555-1005' },
  { id: 'c6', name: 'Sofía Vargas', phone: '555-1006', email: 'sofia@email.com' },
];

// Generate appointments for today
const today = new Date().toISOString().split('T')[0];

export const appointments: Appointment[] = [
  {
    id: 'a1',
    clientId: 'c1',
    client: clients[0],
    stylistId: 's2',
    stylist: stylists[1],
    branchId: 'b1',
    date: today,
    time: '09:00',
    services: [services[0]],
    status: 'completed',
    paymentMethod: 'card',
    total: 250,
  },
  {
    id: 'a2',
    clientId: 'c2',
    client: clients[1],
    stylistId: 's3',
    stylist: stylists[2],
    branchId: 'b1',
    date: today,
    time: '10:00',
    services: [services[2]],
    status: 'in-progress',
    total: 800,
  },
  {
    id: 'a3',
    clientId: 'c3',
    client: clients[2],
    stylistId: 's2',
    stylist: stylists[1],
    branchId: 'b1',
    date: today,
    time: '11:30',
    services: [services[1]],
    status: 'scheduled',
    total: 350,
  },
  {
    id: 'a4',
    clientId: 'c4',
    client: clients[3],
    stylistId: 's3',
    stylist: stylists[2],
    branchId: 'b1',
    date: today,
    time: '13:00',
    services: [services[5], services[6]],
    status: 'scheduled',
    total: 480,
  },
  {
    id: 'a5',
    clientId: 'c5',
    client: clients[4],
    stylistId: 's2',
    stylist: stylists[1],
    branchId: 'b1',
    date: today,
    time: '14:00',
    services: [services[0], services[4]],
    status: 'scheduled',
    total: 400,
  },
  {
    id: 'a6',
    clientId: 'c6',
    client: clients[5],
    stylistId: 's1',
    stylist: stylists[0],
    branchId: 'b1',
    date: today,
    time: '15:30',
    services: [services[8]],
    status: 'scheduled',
    total: 400,
  },
];

export const expenseCategories = [
  { id: 'rent', name: 'Renta', icon: 'Building2' },
  { id: 'utilities', name: 'Servicios', icon: 'Zap' },
  { id: 'supplies', name: 'Insumos', icon: 'Package' },
  { id: 'payroll', name: 'Nómina', icon: 'Users' },
  { id: 'other', name: 'Otros', icon: 'MoreHorizontal' },
];

export const paymentMethods = [
  { id: 'cash', name: 'Efectivo', icon: 'Banknote' },
  { id: 'card', name: 'Tarjeta', icon: 'CreditCard' },
  { id: 'transfer', name: 'Transferencia', icon: 'ArrowRightLeft' },
  { id: 'mixed', name: 'Mixto', icon: 'Layers' },
];

// Dashboard stats
export const getDashboardStats = (branchId?: string) => {
  const filteredAppointments = branchId 
    ? appointments.filter(a => a.branchId === branchId)
    : appointments;

  const todayAppointments = filteredAppointments.filter(a => a.date === today);
  const completedToday = todayAppointments.filter(a => a.status === 'completed');
  const salesTotal = completedToday.reduce((sum, a) => sum + a.total, 0);

  return {
    todaySales: salesTotal,
    todayAppointments: todayAppointments.length,
    completedAppointments: completedToday.length,
    pendingAppointments: todayAppointments.filter(a => a.status === 'scheduled').length,
    topServices: [
      { name: 'Corte Clásico', count: 45, revenue: 11250 },
      { name: 'Coloración', count: 28, revenue: 22400 },
      { name: 'Manicure', count: 35, revenue: 7000 },
    ],
    topProducts: [
      { name: 'Shampoo Profesional', count: 18, revenue: 5040 },
      { name: 'Cera para Cabello', count: 12, revenue: 2160 },
      { name: 'Aceite de Argán', count: 8, revenue: 3360 },
    ],
    weeklyRevenue: [
      { day: 'Lun', amount: 4500 },
      { day: 'Mar', amount: 5200 },
      { day: 'Mie', amount: 4800 },
      { day: 'Jue', amount: 6100 },
      { day: 'Vie', amount: 7200 },
      { day: 'Sab', amount: 9500 },
      { day: 'Dom', amount: 3200 },
    ],
  };
};
