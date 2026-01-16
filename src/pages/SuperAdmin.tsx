import { useState, useEffect } from 'react';
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
import api from '@/lib/api';
import {
  Building2,
  CreditCard,
  Users,
  Plus,
  Pencil,
  Trash2,
  Crown,
  Infinity,
  DollarSign,
  Percent,
  Store,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Loader2,
  Receipt,
  RefreshCw,
} from 'lucide-react';

// Types matching backend
interface Plan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly?: number;
  max_users: number;
  max_branches: number;
  features: string[] | Record<string, boolean>;
  active: boolean;
}

interface Account {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  active: boolean;
  created_at: string;
  subscription?: Subscription;
}

interface Subscription {
  id: string;
  account_id: string;
  plan_id: string;
  plan_name?: string;
  status: 'active' | 'expired' | 'suspended' | 'trial';
  billing_cycle?: 'monthly' | 'yearly';
  starts_at: string;
  ends_at: string | null;
  trial_ends_at?: string;
  days_remaining?: number;
  current_users?: number;
  current_branches?: number;
  notes?: string;
}

interface Payment {
  id: string;
  subscription_id?: string;
  account_id: string;
  amount: number;
  currency: string;
  payment_method: 'card' | 'transfer' | 'cash' | 'other';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  reference?: string;
  notes?: string;
  paid_at?: string;
  period_start: string;
  period_end: string;
  created_at: string;
}

export default function SuperAdmin() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('accounts');
  
  // Dialog states
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingSubscription, setEditingSubscription] = useState<{ account: Account; subscription?: Subscription } | null>(null);
  const [selectedAccountForPayment, setSelectedAccountForPayment] = useState<Account | null>(null);

  // Form states
  const [accountForm, setAccountForm] = useState<Partial<Account>>({
    name: '',
    email: '',
    phone: '',
    address: '',
    active: true,
  });

  const [subscriptionForm, setSubscriptionForm] = useState({
    plan_id: '',
    status: 'active' as Subscription['status'],
    billing_cycle: 'monthly' as 'monthly' | 'yearly',
    starts_at: new Date().toISOString().split('T')[0],
    ends_at: '',
    durationType: 'months',
    durationValue: 12,
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    payment_method: 'transfer' as Payment['payment_method'],
    reference: '',
    notes: '',
    period_start: new Date().toISOString().split('T')[0],
    period_end: addMonths(new Date(), 1).toISOString().split('T')[0],
  });

  const [unlimitedTime, setUnlimitedTime] = useState(false);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Cargando datos de SuperAdmin...');
      
      const [plansData, accountsData] = await Promise.all([
        api.plans.getAll().catch((err) => {
          console.error('❌ Error cargando planes:', err);
          return [];
        }),
        api.admin.getAccounts().catch((err) => {
          console.error('❌ Error cargando cuentas:', err);
          return [];
        }),
      ]);
      
      console.log('✅ Planes recibidos:', plansData);
      console.log('✅ Cuentas recibidas:', accountsData);
      
      // Normalize plans features
      const normalizedPlans = (plansData || []).map((p: any) => ({
        ...p,
        features: Array.isArray(p.features) 
          ? p.features 
          : Object.entries(p.features || {})
              .filter(([, v]) => v === true)
              .map(([k]) => k.replace(/_/g, ' ')),
      }));
      
      // Si las cuentas no tienen suscripción embebida, cargarlas por separado
      const accountsWithSubs = await Promise.all(
        (accountsData || []).map(async (account: Account) => {
          if (account.subscription) {
            console.log(`✅ Cuenta ${account.name} ya tiene suscripción embebida`);
            return account;
          }
          try {
            const subscription = await api.admin.getSubscription(account.id);
            console.log(`✅ Suscripción cargada para ${account.name}:`, subscription);
            return { ...account, subscription };
          } catch (err) {
            console.log(`ℹ️ Sin suscripción para ${account.name}`);
            return account;
          }
        })
      );
      
      console.log('✅ Cuentas con suscripciones:', accountsWithSubs);
      
      setPlans(normalizedPlans);
      setAccounts(accountsWithSubs);
    } catch (error) {
      console.error('❌ Error general cargando datos:', error);
      toast.error('Error al cargar datos');
    } finally {
      setIsLoading(false);
    }
  };

  // Helpers
  const getPlanById = (id: string) => plans.find(p => p.id === id);

  const getStatusBadge = (status: Subscription['status']) => {
    const config = {
      active: { label: 'Activa', variant: 'default' as const, icon: CheckCircle2, className: 'bg-green-500' },
      expired: { label: 'Vencida', variant: 'destructive' as const, icon: XCircle, className: '' },
      suspended: { label: 'Suspendida', variant: 'secondary' as const, icon: AlertTriangle, className: '' },
      trial: { label: 'Prueba', variant: 'outline' as const, icon: Clock, className: 'border-blue-500 text-blue-500' },
    };
    const { label, variant, icon: Icon, className } = config[status] || config.expired;
    return (
      <Badge variant={variant} className={`gap-1 ${className}`}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const getDaysRemaining = (endsAt: string | null, trialEndsAt?: string): number | null => {
    const dateToUse = endsAt || trialEndsAt;
    if (!dateToUse) return null;
    return differenceInDays(new Date(dateToUse), new Date());
  };

  const getDaysRemainingBadge = (days: number | null) => {
    if (days === null) return <Badge variant="outline" className="gap-1"><Infinity className="h-3 w-3" /> Sin límite</Badge>;
    if (days < 0) return <Badge variant="destructive">Vencido hace {Math.abs(days)} días</Badge>;
    if (days <= 3) return <Badge variant="destructive">Vence en {days} días</Badge>;
    if (days <= 7) return <Badge variant="secondary" className="text-orange-600 border-orange-300">Vence en {days} días</Badge>;
    if (days <= 30) return <Badge variant="outline">Vence en {days} días</Badge>;
    return <Badge variant="outline" className="text-green-600 border-green-300">{days} días restantes</Badge>;
  };

  // Account CRUD
  const handleSaveAccount = async () => {
    try {
      console.log('💾 Guardando cuenta:', accountForm);
      
      if (editingAccount) {
        const result = await api.admin.updateAccount(editingAccount.id, accountForm);
        console.log('✅ Cuenta actualizada:', result);
        toast.success('Cuenta actualizada');
      } else {
        const result = await api.admin.createAccount(accountForm);
        console.log('✅ Cuenta creada:', result);
        toast.success('Cuenta creada exitosamente');
      }
      await loadData();
      resetAccountForm();
    } catch (error: any) {
      console.error('❌ Error guardando cuenta:', error);
      toast.error(error.message || 'Error al guardar cuenta');
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta cuenta? Se eliminarán todos sus datos.')) return;
    try {
      await api.admin.deleteAccount(id);
      toast.success('Cuenta eliminada');
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar cuenta');
    }
  };

  const resetAccountForm = () => {
    setAccountForm({ name: '', email: '', phone: '', address: '', active: true });
    setEditingAccount(null);
    setAccountDialogOpen(false);
  };

  const openEditAccount = (account: Account) => {
    setEditingAccount(account);
    setAccountForm(account);
    setAccountDialogOpen(true);
  };

  // Subscription management
  const handleSaveSubscription = async () => {
    if (!editingSubscription) return;
    
    try {
      let ends_at: string | null = null;
      
      if (!unlimitedTime) {
        const startDate = new Date(subscriptionForm.starts_at);
        if (subscriptionForm.durationType === 'months') {
          ends_at = addMonths(startDate, subscriptionForm.durationValue).toISOString().split('T')[0];
        } else if (subscriptionForm.durationType === 'years') {
          ends_at = addYears(startDate, subscriptionForm.durationValue).toISOString().split('T')[0];
        } else if (subscriptionForm.ends_at) {
          ends_at = subscriptionForm.ends_at;
        }
      }

      await api.admin.updateSubscription(editingSubscription.account.id, {
        plan_id: subscriptionForm.plan_id,
        status: subscriptionForm.status,
        billing_cycle: subscriptionForm.billing_cycle,
        ends_at,
      });
      
      toast.success('Suscripción actualizada');
      await loadData();
      resetSubscriptionForm();
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar suscripción');
    }
  };

  const resetSubscriptionForm = () => {
    setSubscriptionForm({
      plan_id: '',
      status: 'active',
      billing_cycle: 'monthly',
      starts_at: new Date().toISOString().split('T')[0],
      ends_at: '',
      durationType: 'months',
      durationValue: 12,
    });
    setUnlimitedTime(false);
    setEditingSubscription(null);
    setSubscriptionDialogOpen(false);
  };

  const openEditSubscription = (account: Account) => {
    const sub = account.subscription;
    setEditingSubscription({ account, subscription: sub });
    setSubscriptionForm({
      plan_id: sub?.plan_id || plans[0]?.id || '',
      status: sub?.status || 'trial',
      billing_cycle: sub?.billing_cycle || 'monthly',
      starts_at: sub?.starts_at || new Date().toISOString().split('T')[0],
      ends_at: sub?.ends_at || '',
      durationType: 'months',
      durationValue: 12,
    });
    setUnlimitedTime(!sub?.ends_at);
    setSubscriptionDialogOpen(true);
  };

  // Payment management
  const handleSavePayment = async () => {
    if (!selectedAccountForPayment) return;
    
    try {
      await api.admin.addPayment(selectedAccountForPayment.id, {
        amount: paymentForm.amount,
        payment_method: paymentForm.payment_method,
        reference: paymentForm.reference || undefined,
        notes: paymentForm.notes || undefined,
        period_start: paymentForm.period_start,
        period_end: paymentForm.period_end,
      });
      
      toast.success('Pago registrado');
      resetPaymentForm();
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Error al registrar pago');
    }
  };

  const resetPaymentForm = () => {
    setPaymentForm({
      amount: 0,
      payment_method: 'transfer',
      reference: '',
      notes: '',
      period_start: new Date().toISOString().split('T')[0],
      period_end: addMonths(new Date(), 1).toISOString().split('T')[0],
    });
    setSelectedAccountForPayment(null);
    setPaymentDialogOpen(false);
  };

  const openPaymentDialog = (account: Account) => {
    const plan = account.subscription ? getPlanById(account.subscription.plan_id) : null;
    setSelectedAccountForPayment(account);
    setPaymentForm({
      ...paymentForm,
      amount: plan?.price_monthly || 0,
    });
    setPaymentDialogOpen(true);
  };

  // Filtered data
  const filteredAccounts = accounts.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const stats = {
    totalAccounts: accounts.length,
    activeAccounts: accounts.filter(a => a.active).length,
    activeSubscriptions: accounts.filter(a => a.subscription?.status === 'active').length,
    trialSubscriptions: accounts.filter(a => a.subscription?.status === 'trial').length,
    expiringsSoon: accounts.filter(a => {
      const days = getDaysRemaining(a.subscription?.ends_at || null, a.subscription?.trial_ends_at);
      return days !== null && days >= 0 && days <= 7;
    }).length,
    totalRevenue: accounts
      .filter(a => a.subscription?.status === 'active')
      .reduce((sum, a) => {
        const plan = getPlanById(a.subscription?.plan_id || '');
        return sum + (plan?.price_monthly || 0);
      }, 0),
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
        <Button variant="outline" onClick={loadData} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.totalAccounts}</p>
                <p className="text-xs text-muted-foreground">Cuentas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.activeSubscriptions}</p>
                <p className="text-xs text-muted-foreground">Activas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.trialSubscriptions}</p>
                <p className="text-xs text-muted-foreground">En prueba</p>
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
                <p className="text-xs text-muted-foreground">Ingreso/mes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{plans.length}</p>
                <p className="text-xs text-muted-foreground">Planes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="accounts" className="gap-2">
            <Building2 className="h-4 w-4" />
            Cuentas
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
                      checked={accountForm.active ?? true}
                      onCheckedChange={(checked) => setAccountForm({ ...accountForm, active: checked })}
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
                  <TableHead>Plan</TableHead>
                  <TableHead>Estado Suscripción</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No hay cuentas registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAccounts.map((account) => {
                    const sub = account.subscription;
                    const plan = sub ? getPlanById(sub.plan_id) : null;
                    const days = getDaysRemaining(sub?.ends_at || null, sub?.trial_ends_at);
                    
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
                                Desde {format(new Date(account.created_at), "MMM yyyy", { locale: es })}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{account.email}</p>
                          {account.phone && <p className="text-sm text-muted-foreground">{account.phone}</p>}
                        </TableCell>
                        <TableCell>
                          {plan ? (
                            <div className="space-y-1">
                              <Badge variant="outline">{plan.name}</Badge>
                              <p className="text-xs text-muted-foreground">${plan.price_monthly}/mes</p>
                            </div>
                          ) : (
                            <Badge variant="secondary">Sin plan</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {sub ? getStatusBadge(sub.status) : (
                            <Badge variant="secondary">Sin suscripción</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {getDaysRemainingBadge(days)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => openPaymentDialog(account)}
                              title="Registrar pago"
                            >
                              <Receipt className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => openEditSubscription(account)}
                              title="Gestionar suscripción"
                            >
                              <CreditCard className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openEditAccount(account)} title="Editar cuenta">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteAccount(account.id)} title="Eliminar">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* PLANS TAB */}
        <TabsContent value="plans" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => {
              const subsCount = accounts.filter(a => a.subscription?.plan_id === plan.id && a.subscription?.status === 'active').length;
              const features = Array.isArray(plan.features) ? plan.features : [];
              
              return (
                <Card key={plan.id} className={!plan.active ? 'opacity-60' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {plan.name}
                          {!plan.active && <Badge variant="secondary">Inactivo</Badge>}
                        </CardTitle>
                        <CardDescription>{plan.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-3xl font-bold">
                      ${plan.price_monthly.toLocaleString()}
                      <span className="text-sm font-normal text-muted-foreground">/mes</span>
                    </div>
                    
                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {plan.max_users} usuarios
                      </div>
                      <div className="flex items-center gap-1">
                        <Store className="h-4 w-4 text-muted-foreground" />
                        {plan.max_branches} sucursales
                      </div>
                    </div>

                    {features.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Características:</p>
                        <ul className="space-y-1">
                          {features.slice(0, 5).map((feature, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm">
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                              {feature}
                            </li>
                          ))}
                          {features.length > 5 && (
                            <li className="text-sm text-muted-foreground">
                              +{features.length - 5} más...
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

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
          
          <p className="text-sm text-muted-foreground text-center">
            Los planes se gestionan directamente en la base de datos. Contacta al desarrollador para agregar o modificar planes.
          </p>
        </TabsContent>
      </Tabs>

      {/* Subscription Dialog */}
      <Dialog open={subscriptionDialogOpen} onOpenChange={(open) => { if (!open) resetSubscriptionForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Gestionar Suscripción</DialogTitle>
            <DialogDescription>
              {editingSubscription?.account.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label>Plan *</Label>
              <Select
                value={subscriptionForm.plan_id}
                onValueChange={(value) => setSubscriptionForm({ ...subscriptionForm, plan_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.filter(p => p.active).map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} - ${p.price_monthly}/mes
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
              <Label>Ciclo de facturación</Label>
              <Select
                value={subscriptionForm.billing_cycle}
                onValueChange={(value) => setSubscriptionForm({ ...subscriptionForm, billing_cycle: value as 'monthly' | 'yearly' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensual</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
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
                        value={subscriptionForm.ends_at}
                        onChange={(e) => setSubscriptionForm({ ...subscriptionForm, ends_at: e.target.value })}
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>Cantidad</Label>
                      <Input
                        type="number"
                        min={1}
                        value={subscriptionForm.durationValue}
                        onChange={(e) => setSubscriptionForm({ ...subscriptionForm, durationValue: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetSubscriptionForm}>Cancelar</Button>
            <Button onClick={handleSaveSubscription} disabled={!subscriptionForm.plan_id}>
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={(open) => { if (!open) resetPaymentForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
            <DialogDescription>
              {selectedAccountForPayment?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Monto *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Método de pago</Label>
              <Select
                value={paymentForm.payment_method}
                onValueChange={(value) => setPaymentForm({ ...paymentForm, payment_method: value as Payment['payment_method'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                  <SelectItem value="card">Tarjeta</SelectItem>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Referencia</Label>
              <Input
                value={paymentForm.reference}
                onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                placeholder="Número de transacción, folio, etc."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Periodo inicio</Label>
                <Input
                  type="date"
                  value={paymentForm.period_start}
                  onChange={(e) => setPaymentForm({ ...paymentForm, period_start: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Periodo fin</Label>
                <Input
                  type="date"
                  value={paymentForm.period_end}
                  onChange={(e) => setPaymentForm({ ...paymentForm, period_end: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                placeholder="Notas adicionales sobre el pago..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetPaymentForm}>Cancelar</Button>
            <Button onClick={handleSavePayment} disabled={paymentForm.amount <= 0}>
              Registrar pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
