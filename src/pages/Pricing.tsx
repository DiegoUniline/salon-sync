import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, Star, Zap, Shield, Users, Store, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';

interface Plan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  max_users: number;
  max_branches: number;
  features: string[] | Record<string, boolean>;
  is_popular?: boolean;
}

export default function Pricing() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isYearly, setIsYearly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const data = await api.plans.getAll();
        // Normalize features if they come as object
        const normalizedPlans = data.map((plan: any) => ({
          ...plan,
          features: Array.isArray(plan.features) 
            ? plan.features 
            : Object.entries(plan.features || {})
                .filter(([, value]) => value === true)
                .map(([key]) => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())),
        }));
        setPlans(normalizedPlans);
      } catch (error) {
        console.error('Error loading plans:', error);
        // Fallback mock data
        setPlans([
          {
            id: 'plan-free',
            name: 'Gratis',
            description: 'Para empezar',
            price_monthly: 0,
            price_yearly: 0,
            max_users: 1,
            max_branches: 1,
            features: ['Agenda básica', 'Clientes limitados', 'Soporte por email'],
          },
          {
            id: 'plan-basic',
            name: 'Básico',
            description: 'Para pequeños negocios',
            price_monthly: 299,
            price_yearly: 2990,
            max_users: 3,
            max_branches: 1,
            features: ['Todo del plan Gratis', 'Clientes ilimitados', 'Reportes básicos', 'Inventario'],
          },
          {
            id: 'plan-pro',
            name: 'Profesional',
            description: 'Para negocios en crecimiento',
            price_monthly: 599,
            price_yearly: 5990,
            max_users: 10,
            max_branches: 3,
            features: ['Todo del plan Básico', 'Múltiples sucursales', 'Reportes avanzados', 'Turnos y cortes', 'Soporte prioritario'],
            is_popular: true,
          },
          {
            id: 'plan-enterprise',
            name: 'Empresarial',
            description: 'Para grandes empresas',
            price_monthly: 1299,
            price_yearly: 12990,
            max_users: 50,
            max_branches: 10,
            features: ['Todo del plan Profesional', 'Usuarios ilimitados', 'API access', 'Soporte dedicado', 'Personalización'],
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    loadPlans();
  }, []);

  const getPrice = (plan: Plan) => {
    const price = isYearly ? plan.price_yearly : plan.price_monthly;
    return Number(price) || 0;
  };

  const getSavings = (plan: Plan) => {
    const monthly = Number(plan.price_monthly) || 0;
    const yearly = Number(plan.price_yearly) || 0;
    if (monthly === 0) return 0;
    const yearlyMonthly = yearly / 12;
    return Math.round(((monthly - yearlyMonthly) / monthly) * 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-bg flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">SalonPro</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost">Iniciar sesión</Button>
            </Link>
            <Link to="/signup">
              <Button>Comenzar gratis</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-16 text-center">
        <Badge variant="secondary" className="mb-4">
          <Star className="h-3 w-3 mr-1" />
          14 días de prueba gratis
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Planes para cada <span className="gradient-text">negocio</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Elige el plan que mejor se adapte a tu salón. Sin contratos a largo plazo, cancela cuando quieras.
        </p>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <Label htmlFor="billing" className={!isYearly ? 'font-semibold' : 'text-muted-foreground'}>
            Mensual
          </Label>
          <Switch
            id="billing"
            checked={isYearly}
            onCheckedChange={setIsYearly}
          />
          <Label htmlFor="billing" className={isYearly ? 'font-semibold' : 'text-muted-foreground'}>
            Anual
            <Badge variant="secondary" className="ml-2 bg-green-500/10 text-green-600">
              Ahorra hasta 20%
            </Badge>
          </Label>
        </div>
      </section>

      {/* Plans Grid */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative flex flex-col ${plan.is_popular ? 'border-primary shadow-lg scale-105' : ''}`}
            >
              {plan.is_popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    <Star className="h-3 w-3 mr-1" />
                    Más popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold">
                    ${getPrice(plan).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {isYearly ? '/año' : '/mes'}
                  </div>
                  {isYearly && getSavings(plan) > 0 && (
                    <Badge variant="outline" className="mt-2 text-green-600 border-green-600">
                      Ahorras {getSavings(plan)}%
                    </Badge>
                  )}
                </div>

                <div className="flex justify-center gap-4 text-sm text-muted-foreground py-2 border-y">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {plan.max_users} usuarios
                  </div>
                  <div className="flex items-center gap-1">
                    <Store className="h-4 w-4" />
                    {plan.max_branches} sucursales
                  </div>
                </div>

                <ul className="space-y-2">
                  {(plan.features as string[]).map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter>
                <Link to={`/signup?plan=${plan.id}`} className="w-full">
                  <Button 
                    className="w-full gap-2" 
                    variant={plan.is_popular ? 'default' : 'outline'}
                  >
                    {Number(plan.price_monthly) === 0 ? 'Comenzar gratis' : 'Probar 14 días gratis'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16 border-t">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-8">Todos los planes incluyen</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3 justify-center">
              <Shield className="h-5 w-5 text-primary" />
              <span>Datos seguros</span>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <Zap className="h-5 w-5 text-primary" />
              <span>Actualizaciones gratis</span>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <Users className="h-5 w-5 text-primary" />
              <span>Soporte incluido</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>© 2024 SalonPro. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
