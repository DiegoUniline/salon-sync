import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { format, differenceInDays, addMonths, addYears } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Building2,
  CreditCard,
  Users,
  Plus,
  Pencil,
  Trash2,
  Crown,
  CalendarDays,
  Infinity,
  DollarSign,
  Percent,
  Store,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  MoreHorizontal,
  Eye,
} from 'lucide-react';

// Types
interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  maxUsers: number;
  maxBranches: number;
  features: string[];
  isActive: boolean;
}

interface Account {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt: string;
}

interface Subscription {
  id: string;
  accountId: string;
  planId: string;
  status: 'active' | 'expired' | 'suspended' | 'trial';
  startsAt: string;
  expiresAt: string | null; // null = sin límite
  discount?: number;
  customPrice?: number;
  notes?: string;
}

// Mock Data
const mockPlans: SubscriptionPlan[] = [
  {
    id: 'plan1',
    name: 'Básico',
    description: 'Para negocios pequeños',
    price: 299,
    maxUsers: 3,
    maxBranches: 1,
    features: ['Agenda básica', 'Reportes simples', 'Soporte por email'],
    isActive: true,
  },
  {
    id: 'plan2',
    name: 'Profesional',
    description: 'Para negocios en crecimiento',
    price: 599,
    maxUsers: 10,
    maxBranches: 3,
    features: ['Todo del Básico', 'Inventario', 'Múltiples sucursales', 'Reportes avanzados', 'Soporte prioritario'],
    isActive: true,
  },
  {
    id: 'plan3',
    name: 'Empresarial',
    description: 'Para grandes operaciones',
    price: 999,
    maxUsers: 50,
    maxBranches: 10,
    features: ['Todo del Profesional', 'API access', 'Personalización', 'Gerente de cuenta dedicado'],
    isActive: true,
  },
];

const mockAccounts: Account[] = [
  {
    id: 'acc1',
    name: 'Salón Bella Vista',
    email: 'contacto@bellavista.com',
    phone: '555-0001',
    address: 'Av. Principal 123, CDMX',
    isActive: true,
    createdAt: '2024-06-15',
  },
  {
    id: 'acc2',
    name: 'Barbería Los Reyes',
    email: 'info@losreyes.mx',
    phone: '555-0002',
    isActive: true,
    createdAt: '2024-09-01',
  },
  {
    id: 'acc3',
    name: 'Spa Serenidad',
    email: 'reservas@serenidad.com',
    phone: '555-0003',
    address: 'Plaza Central 456',
    isActive: false,
    createdAt: '2024-03-20',
  },
];

const mockSubscriptions: Subscription[] = [
  {
    id: 'sub1',
    accountId: 'acc1',
    planId: 'plan2',
    status: 'active',
    startsAt: '2024-06-15',
    expiresAt: '2025-06-15',
  },
  {
    id: 'sub2',
    accountId: 'acc2',
    planId: 'plan1',
    status: 'active',
    startsAt: '2024-09-01',
    expiresAt: '2025-03-01',
    discount: 10,
  },
  {
    id: 'sub3',
    accountId: 'acc3',
    planId: 'plan3',
    status: 'expired',
    startsAt: '2024-03-20',
    expiresAt: '2024-09-20',
    notes: 'No renovó',
  },
];

export default function SuperAdmin() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>(mockPlans);
  const [accounts, setAccounts] = useState<Account[]>(mockAccounts);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(mockSubscriptions);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('accounts');
  
  // Dialog states
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);

  // Form states
  const [planForm, setPlanForm] = useState<Partial<SubscriptionPlan>>({
    name: '',
    description: '',
    price: 0,
    maxUsers: 5,
    maxBranches: 1,
    features: [],
    isActive: true,
  });

  const [accountForm, setAccountForm] = useState<Partial<Account>>({
    name: '',
    email: '',
    phone: '',
    address: '',
    isActive: true,
  });

  const [subscriptionForm, setSubscriptionForm] = useState<Partial<Subscription> & { durationType?: string; durationValue?: number }>({
    accountId: '',
    planId: '',
    status: 'active',
    startsAt: new Date().toISOString().split('T')[0],
    expiresAt: null,
    discount: 0,
    customPrice: undefined,
    notes: '',
    durationType: 'months',
    durationValue: 12,
  });

  const [featuresInput, setFeaturesInput] = useState('');
  const [unlimitedTime, setUnlimitedTime] = useState(false);

  // Helpers
  const getAccountById = (id: string) => accounts.find(a => a.id === id);
  const getPlanById = (id: string) => plans.find(p => p.id === id);
  const getSubscriptionByAccountId = (accountId: string) => subscriptions.find(s => s.accountId === accountId);

  const getStatusBadge = (status: Subscription['status']) => {
    const config = {
      active: { label: 'Activa', variant: 'default' as const, icon: CheckCircle2 },
      expired: { label: 'Vencida', variant: 'destructive' as const, icon: XCircle },
      suspended: { label: 'Suspendida', variant: 'secondary' as const, icon: AlertTriangle },
      trial: { label: 'Prueba', variant: 'outline' as const, icon: Clock },
    };
    const { label, variant, icon: Icon } = config[status];
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const getDaysRemaining = (expiresAt: string | null): number | null => {
    if (!expiresAt) return null;
    return differenceInDays(new Date(expiresAt), new Date());
  };

  const getDaysRemainingBadge = (days: number | null) => {
    if (days === null) return <Badge variant="outline" className="gap-1"><Infinity className="h-3 w-3" /> Sin límite</Badge>;
    if (days < 0) return <Badge variant="destructive">Vencido hace {Math.abs(days)} días</Badge>;
    if (days <= 3) return <Badge variant="destructive">Vence en {days} días</Badge>;
    if (days <= 7) return <Badge variant="secondary" className="text-orange-600 border-orange-300">Vence en {days} días</Badge>;
    if (days <= 30) return <Badge variant="outline">Vence en {days} días</Badge>;
    return <Badge variant="outline" className="text-green-600 border-green-300">{days} días restantes</Badge>;
  };

  // Plan CRUD
  const handleSavePlan = () => {
    const features = featuresInput.split('\n').filter(f => f.trim());
    
    if (editingPlan) {
      setPlans(plans.map(p => p.id === editingPlan.id ? { ...p, ...planForm, features } : p));
      toast.success('Plan actualizado correctamente');
    } else {
      const newPlan: SubscriptionPlan = {
        id: `plan${Date.now()}`,
        name: planForm.name || '',
        description: planForm.description || '',
        price: planForm.price || 0,
        maxUsers: planForm.maxUsers || 5,
        maxBranches: planForm.maxBranches || 1,
        features,
        isActive: planForm.isActive ?? true,
      };
      setPlans([...plans, newPlan]);
      toast.success('Plan creado correctamente');
    }
    resetPlanForm();
  };

  const handleDeletePlan = (id: string) => {
    const hasSubscriptions = subscriptions.some(s => s.planId === id);
    if (hasSubscriptions) {
      toast.error('No se puede eliminar un plan con suscripciones activas');
      return;
    }
    setPlans(plans.filter(p => p.id !== id));
    toast.success('Plan eliminado');
  };

  const resetPlanForm = () => {
    setPlanForm({ name: '', description: '', price: 0, maxUsers: 5, maxBranches: 1, features: [], isActive: true });
    setFeaturesInput('');
    setEditingPlan(null);
    setPlanDialogOpen(false);
  };

  const openEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setPlanForm(plan);
    setFeaturesInput(plan.features.join('\n'));
    setPlanDialogOpen(true);
  };

  // Account CRUD
  const handleSaveAccount = () => {
    if (editingAccount) {
      setAccounts(accounts.map(a => a.id === editingAccount.id ? { ...a, ...accountForm } : a));
      toast.success('Cuenta actualizada correctamente');
    } else {
      const newAccount: Account = {
        id: `acc${Date.now()}`,
        name: accountForm.name || '',
        email: accountForm.email || '',
        phone: accountForm.phone,
        address: accountForm.address,
        isActive: accountForm.isActive ?? true,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setAccounts([...accounts, newAccount]);
      toast.success('Cuenta creada correctamente');
    }
    resetAccountForm();
  };

  const handleDeleteAccount = (id: string) => {
    setAccounts(accounts.filter(a => a.id !== id));
    setSubscriptions(subscriptions.filter(s => s.accountId !== id));
    toast.success('Cuenta eliminada');
  };

  const resetAccountForm = () => {
    setAccountForm({ name: '', email: '', phone: '', address: '', isActive: true });
    setEditingAccount(null);
    setAccountDialogOpen(false);
  };

  const openEditAccount = (account: Account) => {
    setEditingAccount(account);
    setAccountForm(account);
    setAccountDialogOpen(true);
  };

  // Subscription CRUD
  const handleSaveSubscription = () => {
    let expiresAt: string | null = null;
    
    if (!unlimitedTime && subscriptionForm.startsAt) {
      const startDate = new Date(subscriptionForm.startsAt);
      if (subscriptionForm.durationType === 'months') {
        expiresAt = addMonths(startDate, subscriptionForm.durationValue || 12).toISOString().split('T')[0];
      } else if (subscriptionForm.durationType === 'years') {
        expiresAt = addYears(startDate, subscriptionForm.durationValue || 1).toISOString().split('T')[0];
      } else if (subscriptionForm.durationType === 'custom' && subscriptionForm.expiresAt) {
        expiresAt = subscriptionForm.expiresAt;
      }
    }

    if (editingSubscription) {
      setSubscriptions(subscriptions.map(s => 
        s.id === editingSubscription.id 
          ? { ...s, ...subscriptionForm, expiresAt } 
          : s
      ));
      toast.success('Suscripción actualizada correctamente');
    } else {
      // Check if account already has subscription
      const existingSub = subscriptions.find(s => s.accountId === subscriptionForm.accountId);
      if (existingSub) {
        toast.error('Esta cuenta ya tiene una suscripción. Edítala en lugar de crear una nueva.');
        return;
      }

      const newSubscription: Subscription = {
        id: `sub${Date.now()}`,
        accountId: subscriptionForm.accountId || '',
        planId: subscriptionForm.planId || '',
        status: subscriptionForm.status || 'active',
        startsAt: subscriptionForm.startsAt || new Date().toISOString().split('T')[0],
        expiresAt,
        discount: subscriptionForm.discount,
        customPrice: subscriptionForm.customPrice,
        notes: subscriptionForm.notes,
      };
      setSubscriptions([...subscriptions, newSubscription]);
      toast.success('Suscripción creada correctamente');
    }
    resetSubscriptionForm();
  };

  const handleDeleteSubscription = (id: string) => {
    setSubscriptions(subscriptions.filter(s => s.id !== id));
    toast.success('Suscripción eliminada');
  };

  const resetSubscriptionForm = () => {
    setSubscriptionForm({
      accountId: '',
      planId: '',
      status: 'active',
      startsAt: new Date().toISOString().split('T')[0],
      expiresAt: null,
      discount: 0,
      customPrice: undefined,
      notes: '',
      durationType: 'months',
      durationValue: 12,
    });
    setUnlimitedTime(false);
    setEditingSubscription(null);
    setSubscriptionDialogOpen(false);
  };

  const openEditSubscription = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setSubscriptionForm({
      ...subscription,
      durationType: 'custom',
      durationValue: 12,
    });
    setUnlimitedTime(subscription.expiresAt === null);
    setSubscriptionDialogOpen(true);
  };

  // Calculate effective price
  const getEffectivePrice = (sub: Subscription) => {
    const plan = getPlanById(sub.planId);
    if (!plan) return 0;
    if (sub.customPrice !== undefined) return sub.customPrice;
    if (sub.discount) return plan.price * (1 - sub.discount / 100);
    return plan.price;
  };

  // Filtered data
  const filteredAccounts = accounts.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const stats = {
    totalAccounts: accounts.length,
    activeAccounts: accounts.filter(a => a.isActive).length,
    activeSubscriptions: subscriptions.filter(s => s.status === 'active').length,
    expiringsSoon: subscriptions.filter(s => {
      const days = getDaysRemaining(s.expiresAt);
      return days !== null && days >= 0 && days <= 7;
    }).length,
    totalRevenue: subscriptions
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + getEffectivePrice(s), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Crown className="h-6 w-6 text-yellow-500" />
            Panel Super Admin
          </h1>
          <p className="text-muted-foreground">
            Gestiona cuentas, planes y suscripciones
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.totalAccounts}</p>
                <p className="text-xs text-muted-foreground">Cuentas totales</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.activeAccounts}</p>
                <p className="text-xs text-muted-foreground">Activas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.activeSubscriptions}</p>
                <p className="text-xs text-muted-foreground">Suscripciones</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats.expiringsSoon}</p>
                <p className="text-xs text-muted-foreground">Por vencer</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Ingreso mensual</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="accounts" className="gap-2">
            <Building2 className="h-4 w-4" />
            Cuentas
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Suscripciones
          </TabsTrigger>
          <TabsTrigger value="plans" className="gap-2">
            <Crown className="h-4 w-4" />
            Planes
          </TabsTrigger>
        </TabsList>

        {/* ACCOUNTS TAB */}
        <TabsContent value="accounts" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cuentas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Dialog open={accountDialogOpen} onOpenChange={(open) => { if (!open) resetAccountForm(); else setAccountDialogOpen(true); }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nueva Cuenta
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingAccount ? 'Editar Cuenta' : 'Nueva Cuenta'}</DialogTitle>
                  <DialogDescription>
                    {editingAccount ? 'Modifica los datos de la cuenta' : 'Registra una nueva cuenta de cliente'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nombre del negocio *</Label>
                    <Input
                      value={accountForm.name || ''}
                      onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                      placeholder="Ej: Salón Bella Vista"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={accountForm.email || ''}
                      onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                      placeholder="contacto@ejemplo.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <Input
                      value={accountForm.phone || ''}
                      onChange={(e) => setAccountForm({ ...accountForm, phone: e.target.value })}
                      placeholder="555-0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Dirección</Label>
                    <Input
                      value={accountForm.address || ''}
                      onChange={(e) => setAccountForm({ ...accountForm, address: e.target.value })}
                      placeholder="Calle y número, ciudad"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={accountForm.isActive ?? true}
                      onCheckedChange={(checked) => setAccountForm({ ...accountForm, isActive: checked })}
                    />
                    <Label>Cuenta activa</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={resetAccountForm}>Cancelar</Button>
                  <Button onClick={handleSaveAccount} disabled={!accountForm.name || !accountForm.email}>
                    {editingAccount ? 'Guardar cambios' : 'Crear cuenta'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cuenta</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Suscripción</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.map((account) => {
                  const subscription = getSubscriptionByAccountId(account.id);
                  const plan = subscription ? getPlanById(subscription.planId) : null;
                  return (
                    <TableRow key={account.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Store className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{account.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Desde {format(new Date(account.createdAt), "MMM yyyy", { locale: es })}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{account.email}</p>
                        {account.phone && <p className="text-sm text-muted-foreground">{account.phone}</p>}
                      </TableCell>
                      <TableCell>
                        {subscription ? (
                          <div className="space-y-1">
                            <Badge variant="outline">{plan?.name}</Badge>
                            {getDaysRemainingBadge(getDaysRemaining(subscription.expiresAt))}
                          </div>
                        ) : (
                          <Badge variant="secondary">Sin suscripción</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {account.isActive ? (
                          <Badge variant="default" className="bg-green-500">Activa</Badge>
                        ) : (
                          <Badge variant="secondary">Inactiva</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditAccount(account)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteAccount(account.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* SUBSCRIPTIONS TAB */}
        <TabsContent value="subscriptions" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={subscriptionDialogOpen} onOpenChange={(open) => { if (!open) resetSubscriptionForm(); else setSubscriptionDialogOpen(true); }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nueva Suscripción
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingSubscription ? 'Editar Suscripción' : 'Nueva Suscripción'}</DialogTitle>
                  <DialogDescription>
                    {editingSubscription ? 'Modifica los detalles de la suscripción' : 'Asigna un plan a una cuenta'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  <div className="space-y-2">
                    <Label>Cuenta *</Label>
                    <Select
                      value={subscriptionForm.accountId}
                      onValueChange={(value) => setSubscriptionForm({ ...subscriptionForm, accountId: value })}
                      disabled={!!editingSubscription}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una cuenta" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.filter(a => a.isActive).map(a => (
                          <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Plan *</Label>
                    <Select
                      value={subscriptionForm.planId}
                      onValueChange={(value) => setSubscriptionForm({ ...subscriptionForm, planId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {plans.filter(p => p.isActive).map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} - ${p.price}/mes
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Select
                      value={subscriptionForm.status}
                      onValueChange={(value) => setSubscriptionForm({ ...subscriptionForm, status: value as Subscription['status'] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Activa</SelectItem>
                        <SelectItem value="trial">Prueba</SelectItem>
                        <SelectItem value="suspended">Suspendida</SelectItem>
                        <SelectItem value="expired">Vencida</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Fecha de inicio</Label>
                    <Input
                      type="date"
                      value={subscriptionForm.startsAt || ''}
                      onChange={(e) => setSubscriptionForm({ ...subscriptionForm, startsAt: e.target.value })}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={unlimitedTime}
                        onCheckedChange={setUnlimitedTime}
                      />
                      <Label className="flex items-center gap-1">
                        <Infinity className="h-4 w-4" />
                        Sin límite de tiempo
                      </Label>
                    </div>

                    {!unlimitedTime && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Duración</Label>
                          <Select
                            value={subscriptionForm.durationType}
                            onValueChange={(value) => setSubscriptionForm({ ...subscriptionForm, durationType: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="months">Meses</SelectItem>
                              <SelectItem value="years">Años</SelectItem>
                              <SelectItem value="custom">Fecha específica</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {subscriptionForm.durationType === 'custom' ? (
                          <div className="space-y-2">
                            <Label>Fecha fin</Label>
                            <Input
                              type="date"
                              value={subscriptionForm.expiresAt || ''}
                              onChange={(e) => setSubscriptionForm({ ...subscriptionForm, expiresAt: e.target.value })}
                            />
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Label>Cantidad</Label>
                            <Input
                              type="number"
                              min={1}
                              value={subscriptionForm.durationValue || 12}
                              onChange={(e) => setSubscriptionForm({ ...subscriptionForm, durationValue: parseInt(e.target.value) || 12 })}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Percent className="h-4 w-4" />
                      Precio y descuentos
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Descuento (%)</Label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={subscriptionForm.discount || 0}
                          onChange={(e) => setSubscriptionForm({ ...subscriptionForm, discount: parseInt(e.target.value) || 0, customPrice: undefined })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>O precio fijo</Label>
                        <Input
                          type="number"
                          min={0}
                          placeholder="Precio personalizado"
                          value={subscriptionForm.customPrice || ''}
                          onChange={(e) => setSubscriptionForm({ ...subscriptionForm, customPrice: parseFloat(e.target.value) || undefined, discount: 0 })}
                        />
                      </div>
                    </div>

                    {subscriptionForm.planId && (
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-sm">
                          Precio base: <span className="font-medium">${getPlanById(subscriptionForm.planId)?.price || 0}</span>
                        </p>
                        {(subscriptionForm.discount || subscriptionForm.customPrice) && (
                          <p className="text-sm text-green-600">
                            Precio final: <span className="font-bold">
                              ${subscriptionForm.customPrice || 
                                ((getPlanById(subscriptionForm.planId)?.price || 0) * (1 - (subscriptionForm.discount || 0) / 100)).toFixed(2)}
                            </span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Notas</Label>
                    <Textarea
                      value={subscriptionForm.notes || ''}
                      onChange={(e) => setSubscriptionForm({ ...subscriptionForm, notes: e.target.value })}
                      placeholder="Notas adicionales..."
                      rows={2}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={resetSubscriptionForm}>Cancelar</Button>
                  <Button onClick={handleSaveSubscription} disabled={!subscriptionForm.accountId || !subscriptionForm.planId}>
                    {editingSubscription ? 'Guardar cambios' : 'Crear suscripción'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cuenta</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Vigencia</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((subscription) => {
                  const account = getAccountById(subscription.accountId);
                  const plan = getPlanById(subscription.planId);
                  const daysRemaining = getDaysRemaining(subscription.expiresAt);
                  return (
                    <TableRow key={subscription.id}>
                      <TableCell>
                        <p className="font-medium">{account?.name || 'Cuenta eliminada'}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{plan?.name}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {plan?.maxUsers} usuarios, {plan?.maxBranches} sucursales
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">${getEffectivePrice(subscription).toLocaleString()}/mes</p>
                          {subscription.discount && (
                            <Badge variant="secondary" className="gap-1">
                              <Percent className="h-3 w-3" />
                              {subscription.discount}% desc.
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm">
                            {format(new Date(subscription.startsAt), "dd MMM yyyy", { locale: es })}
                            {' → '}
                            {subscription.expiresAt 
                              ? format(new Date(subscription.expiresAt), "dd MMM yyyy", { locale: es })
                              : 'Sin límite'
                            }
                          </p>
                          {getDaysRemainingBadge(daysRemaining)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(subscription.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditSubscription(subscription)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteSubscription(subscription.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* PLANS TAB */}
        <TabsContent value="plans" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={planDialogOpen} onOpenChange={(open) => { if (!open) resetPlanForm(); else setPlanDialogOpen(true); }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nuevo Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingPlan ? 'Editar Plan' : 'Nuevo Plan'}</DialogTitle>
                  <DialogDescription>
                    {editingPlan ? 'Modifica los detalles del plan' : 'Crea un nuevo plan de suscripción'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  <div className="space-y-2">
                    <Label>Nombre del plan *</Label>
                    <Input
                      value={planForm.name || ''}
                      onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                      placeholder="Ej: Profesional"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Input
                      value={planForm.description || ''}
                      onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                      placeholder="Breve descripción del plan"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Precio mensual ($)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={planForm.price || 0}
                      onChange={(e) => setPlanForm({ ...planForm, price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        Máx. usuarios
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        value={planForm.maxUsers || 5}
                        onChange={(e) => setPlanForm({ ...planForm, maxUsers: parseInt(e.target.value) || 5 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        <Store className="h-4 w-4" />
                        Máx. sucursales
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        value={planForm.maxBranches || 1}
                        onChange={(e) => setPlanForm({ ...planForm, maxBranches: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Características (una por línea)</Label>
                    <Textarea
                      value={featuresInput}
                      onChange={(e) => setFeaturesInput(e.target.value)}
                      placeholder="Agenda básica&#10;Reportes simples&#10;Soporte por email"
                      rows={4}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={planForm.isActive ?? true}
                      onCheckedChange={(checked) => setPlanForm({ ...planForm, isActive: checked })}
                    />
                    <Label>Plan activo</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={resetPlanForm}>Cancelar</Button>
                  <Button onClick={handleSavePlan} disabled={!planForm.name}>
                    {editingPlan ? 'Guardar cambios' : 'Crear plan'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => {
              const subsCount = subscriptions.filter(s => s.planId === plan.id && s.status === 'active').length;
              return (
                <Card key={plan.id} className={!plan.isActive ? 'opacity-60' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {plan.name}
                          {!plan.isActive && <Badge variant="secondary">Inactivo</Badge>}
                        </CardTitle>
                        <CardDescription>{plan.description}</CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditPlan(plan)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeletePlan(plan.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-3xl font-bold">
                      ${plan.price.toLocaleString()}
                      <span className="text-sm font-normal text-muted-foreground">/mes</span>
                    </div>
                    
                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {plan.maxUsers} usuarios
                      </div>
                      <div className="flex items-center gap-1">
                        <Store className="h-4 w-4 text-muted-foreground" />
                        {plan.maxBranches} sucursales
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Características:</p>
                      <ul className="space-y-1">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="border-t pt-3">
                      <Badge variant="outline" className="gap-1">
                        <CreditCard className="h-3 w-3" />
                        {subsCount} suscripciones activas
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
