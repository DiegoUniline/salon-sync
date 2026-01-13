// Business type configuration for multi-industry support

export type BusinessType = 'salon' | 'nutrition' | 'medical';

export interface TicketField {
  id: string;
  label: string;
  enabled: boolean;
}

export interface BusinessConfig {
  type: BusinessType;
  name: string;
  logo?: string;
  address: string;
  phone: string;
  email?: string;
  rfc?: string;
  ticketFields: TicketField[];
  ticketFooter?: string;
}

// Terminology mapping per business type
export const terminology: Record<BusinessType, {
  professional: string;
  professionals: string;
  service: string;
  services: string;
  appointment: string;
  appointments: string;
  client: string;
  clients: string;
  branch: string;
  branches: string;
  schedule: string;
  role: {
    admin: string;
    stylist: string;
    receptionist: string;
  };
}> = {
  salon: {
    professional: 'Estilista',
    professionals: 'Estilistas',
    service: 'Servicio',
    services: 'Servicios',
    appointment: 'Cita',
    appointments: 'Citas',
    client: 'Cliente',
    clients: 'Clientes',
    branch: 'Sucursal',
    branches: 'Sucursales',
    schedule: 'Horario',
    role: {
      admin: 'Administrador',
      stylist: 'Estilista',
      receptionist: 'Recepción',
    },
  },
  nutrition: {
    professional: 'Nutriólogo',
    professionals: 'Nutriólogos',
    service: 'Consulta',
    services: 'Consultas',
    appointment: 'Cita',
    appointments: 'Citas',
    client: 'Paciente',
    clients: 'Pacientes',
    branch: 'Consultorio',
    branches: 'Consultorios',
    schedule: 'Horario',
    role: {
      admin: 'Administrador',
      stylist: 'Nutriólogo',
      receptionist: 'Recepción',
    },
  },
  medical: {
    professional: 'Doctor',
    professionals: 'Doctores',
    service: 'Consulta',
    services: 'Consultas',
    appointment: 'Cita',
    appointments: 'Citas',
    client: 'Paciente',
    clients: 'Pacientes',
    branch: 'Clínica',
    branches: 'Clínicas',
    schedule: 'Horario',
    role: {
      admin: 'Administrador',
      stylist: 'Doctor',
      receptionist: 'Recepción',
    },
  },
};

export const businessTypeLabels: Record<BusinessType, string> = {
  salon: 'Estética / Peluquería / Barbería',
  nutrition: 'Nutriología / Dietética',
  medical: 'Consultorio Médico',
};

export const businessTypeIcons: Record<BusinessType, string> = {
  salon: '💇',
  nutrition: '🥗',
  medical: '🩺',
};

export const defaultTicketFields: TicketField[] = [
  { id: 'logo', label: 'Logo del negocio', enabled: true },
  { id: 'businessName', label: 'Nombre del negocio', enabled: true },
  { id: 'address', label: 'Dirección', enabled: true },
  { id: 'phone', label: 'Teléfono', enabled: true },
  { id: 'rfc', label: 'RFC / Datos fiscales', enabled: false },
  { id: 'folio', label: 'Número de folio', enabled: true },
  { id: 'date', label: 'Fecha y hora', enabled: true },
  { id: 'clientName', label: 'Nombre del cliente', enabled: true },
  { id: 'clientPhone', label: 'Teléfono del cliente', enabled: false },
  { id: 'professional', label: 'Profesional que atendió', enabled: true },
  { id: 'services', label: 'Servicios realizados', enabled: true },
  { id: 'products', label: 'Productos vendidos', enabled: true },
  { id: 'subtotal', label: 'Subtotal', enabled: true },
  { id: 'discount', label: 'Descuentos', enabled: true },
  { id: 'total', label: 'Total', enabled: true },
  { id: 'paymentMethod', label: 'Método de pago', enabled: true },
  { id: 'footer', label: 'Mensaje de pie', enabled: true },
];

export const defaultBusinessConfig: BusinessConfig = {
  type: 'salon',
  name: 'Mi Negocio',
  address: '',
  phone: '',
  ticketFields: defaultTicketFields,
  ticketFooter: '¡Gracias por su preferencia!',
};

// Storage key
const BUSINESS_CONFIG_KEY = 'app_business_config';

export const getBusinessConfig = (): BusinessConfig => {
  try {
    const stored = localStorage.getItem(BUSINESS_CONFIG_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    console.error('Error loading business config');
  }
  return defaultBusinessConfig;
};

export const setBusinessConfig = (config: BusinessConfig): void => {
  try {
    localStorage.setItem(BUSINESS_CONFIG_KEY, JSON.stringify(config));
  } catch {
    console.error('Error saving business config');
  }
};
