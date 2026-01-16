import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Eye, EyeOff, Zap, Store, User, Mail, Phone, Lock, ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';

interface Plan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  max_users: number;
  max_branches: number;
}

export default function Signup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshCurrentUser } = usePermissions();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [plansLoading, setPlansLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    account_name: '',
    branch_name: '',
    admin_name: '',
    admin_email: '',
    admin_password: '',
    admin_phone: '',
    plan_id: searchParams.get('plan') || 'plan-basic',
  });

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const data = await api.plans.getAll();
        setPlans(data);
        // If plan from URL doesn't exist, set first available
        if (data.length > 0 && !data.find((p: Plan) => p.id === form.plan_id)) {
          setForm(f => ({ ...f, plan_id: data[0].id }));
        }
      } catch (error) {
        console.error('Error loading plans:', error);
        // Fallback
        setPlans([
          { id: 'plan-basic', name: 'Básico', description: 'Para pequeños negocios', price_monthly: 299, max_users: 3, max_branches: 1 },
          { id: 'plan-pro', name: 'Profesional', description: 'Para negocios en crecimiento', price_monthly: 599, max_users: 10, max_branches: 3 },
        ]);
      } finally {
        setPlansLoading(false);
      }
    };
    loadPlans();
  }, []);

  const selectedPlan = plans.find(p => p.id === form.plan_id);

  const validateForm = () => {
    if (!form.account_name.trim()) return 'El nombre del negocio es requerido';
    if (!form.branch_name.trim()) return 'El nombre de la sucursal es requerido';
    if (!form.admin_name.trim()) return 'Tu nombre es requerido';
    if (!form.admin_email.trim()) return 'El email es requerido';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.admin_email)) return 'Email inválido';
    if (!form.admin_password) return 'La contraseña es requerida';
    if (form.admin_password.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      await api.auth.signup({
        account_name: form.account_name.trim(),
        branch_name: form.branch_name.trim(),
        admin_name: form.admin_name.trim(),
        admin_email: form.admin_email.trim().toLowerCase(),
        admin_password: form.admin_password,
        admin_phone: form.admin_phone.trim() || undefined,
        plan_id: form.plan_id,
      });

      toast.success('¡Cuenta creada exitosamente!', {
        description: 'Tu periodo de prueba de 14 días ha comenzado.',
      });

      // Force reload to ensure auth context picks up new session
      window.location.href = '/#/';
    } catch (err: any) {
      setError(err.message || 'Error al crear la cuenta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/pricing" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Volver a planes
          </Link>
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-bg flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">SalonPro</span>
          </Link>
          <Link to="/login">
            <Button variant="ghost">Iniciar sesión</Button>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
        <div className="w-full max-w-4xl grid md:grid-cols-5 gap-8">
          {/* Form */}
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle className="text-2xl">Crea tu cuenta</CardTitle>
              <CardDescription>
                Comienza tu prueba gratuita de 14 días. Sin tarjeta de crédito.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Business info */}
                <div className="space-y-4 pb-4 border-b">
                  <h3 className="font-medium flex items-center gap-2">
                    <Store className="h-4 w-4 text-primary" />
                    Información del negocio
                  </h3>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="account_name">Nombre del negocio *</Label>
                      <Input
                        id="account_name"
                        placeholder="Ej: Salón Belleza María"
                        value={form.account_name}
                        onChange={(e) => setForm({ ...form, account_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="branch_name">Nombre de la sucursal principal *</Label>
                      <Input
                        id="branch_name"
                        placeholder="Ej: Sucursal Centro"
                        value={form.branch_name}
                        onChange={(e) => setForm({ ...form, branch_name: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Admin info */}
                <div className="space-y-4 pb-4 border-b">
                  <h3 className="font-medium flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    Tu información
                  </h3>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="admin_name">Nombre completo *</Label>
                      <Input
                        id="admin_name"
                        placeholder="Ej: María García"
                        value={form.admin_name}
                        onChange={(e) => setForm({ ...form, admin_name: e.target.value })}
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="admin_email">Email *</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="admin_email"
                            type="email"
                            placeholder="tu@email.com"
                            className="pl-10"
                            value={form.admin_email}
                            onChange={(e) => setForm({ ...form, admin_email: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="admin_phone">Teléfono</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="admin_phone"
                            type="tel"
                            placeholder="55 1234 5678"
                            className="pl-10"
                            value={form.admin_phone}
                            onChange={(e) => setForm({ ...form, admin_phone: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin_password">Contraseña *</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="admin_password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Mínimo 6 caracteres"
                          className="pl-10 pr-10"
                          value={form.admin_password}
                          onChange={(e) => setForm({ ...form, admin_password: e.target.value })}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Plan selection */}
                <div className="space-y-4">
                  <h3 className="font-medium">Selecciona tu plan</h3>
                  <Select
                    value={form.plan_id}
                    onValueChange={(value) => setForm({ ...form, plan_id: value })}
                    disabled={plansLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          <div className="flex items-center gap-2">
                            <span>{plan.name}</span>
                            <span className="text-muted-foreground">
                              - ${Number(plan.price_monthly).toLocaleString()}/mes
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? 'Creando cuenta...' : 'Comenzar prueba gratuita de 14 días'}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Al crear una cuenta, aceptas nuestros{' '}
                  <a href="#" className="underline hover:text-foreground">Términos de Servicio</a>
                  {' '}y{' '}
                  <a href="#" className="underline hover:text-foreground">Política de Privacidad</a>.
                </p>
              </form>
            </CardContent>
          </Card>

          {/* Plan summary */}
          <div className="md:col-span-2 space-y-4">
            {selectedPlan && (
              <Card className="sticky top-24">
                <CardHeader className="pb-2">
                  <Badge variant="secondary" className="w-fit">Plan seleccionado</Badge>
                  <CardTitle className="text-xl">{selectedPlan.name}</CardTitle>
                  <CardDescription>{selectedPlan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-3xl font-bold">
                      ${Number(selectedPlan.price_monthly).toLocaleString()}
                      <span className="text-sm font-normal text-muted-foreground">/mes</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Después de los 14 días de prueba
                    </p>
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      Hasta {selectedPlan.max_users} usuarios
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      Hasta {selectedPlan.max_branches} sucursales
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      14 días de prueba gratis
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      Sin tarjeta de crédito
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      Cancela cuando quieras
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <p className="text-sm text-muted-foreground text-center">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
