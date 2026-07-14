import { Link } from 'react-router-dom';
import { Check, Star, Shield, Zap, Users, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import salonProLogo from '@/assets/salon-pro-logo.png.asset.json';

const plans = [
  {
    name: 'Starter',
    price: '$399',
    period: '/mes',
    description: 'Para negocios que empiezan',
    features: ['1 sucursal', 'Hasta 3 usuarios', 'Agenda y citas', 'Punto de venta básico', 'Soporte por email'],
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$799',
    period: '/mes',
    description: 'El más popular',
    features: [
      '1 sucursal',
      'Usuarios ilimitados',
      'WhatsApp integrado',
      'Inventario y compras',
      'Reportes avanzados',
      'Soporte prioritario',
    ],
    highlighted: true,
  },
  {
    name: 'Business',
    price: '$1,499',
    period: '/mes',
    description: 'Para cadenas y franquicias',
    features: [
      'Sucursales ilimitadas',
      'Usuarios ilimitados',
      'Agente IA (asistente inteligente)',
      'Todo lo de Pro',
    ],
    highlighted: false,
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-background">
      {/* NAV — homologado con Landing */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={salonProLogo.url} alt="Salon Pro" className="h-8 w-8" />
            <span className="font-display font-semibold text-lg tracking-tight">
              Salon <span className="text-accent">Pro</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link to="/#top" className="hover:text-foreground transition-colors">Inicio</Link>
            <Link to="/#pricing" className="hover:text-foreground transition-colors">Precios</Link>
            <Link to="/#about" className="hover:text-foreground transition-colors">Quiénes somos</Link>
            
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm">Iniciar sesión</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm">Comenzar gratis</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 pt-16 pb-8 text-center">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Volver a inicio
        </Link>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium mb-4">
          <Star className="h-3 w-3" /> 14 días de prueba gratis
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-semibold tracking-tight mb-4">
          Planes para cada <span className="text-accent">negocio</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Elige el plan que mejor se adapte a tu salón. Sin contratos a largo plazo, cancela cuando quieras.
        </p>
      </section>

      {/* PLANES — mismos precios que Landing */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative p-8 rounded-2xl border transition-all ${
                p.highlighted
                  ? 'bg-primary text-primary-foreground border-primary shadow-xl scale-[1.02]'
                  : 'bg-card border-border hover:border-accent/40'
              }`}
            >
              {p.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold">
                  Más popular
                </div>
              )}
              <h3 className="text-xl font-display font-semibold mb-1">{p.name}</h3>
              <p className={`text-sm mb-6 ${p.highlighted ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                {p.description}
              </p>
              <div className="mb-6">
                <span className="text-4xl font-display font-semibold">{p.price}</span>
                <span className={`text-sm ${p.highlighted ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {p.period}
                </span>
              </div>
              <Link to="/signup">
                <Button
                  className={`w-full h-11 gap-2 ${
                    p.highlighted
                      ? 'bg-accent text-accent-foreground hover:bg-accent/90'
                      : ''
                  }`}
                  variant={p.highlighted ? 'default' : 'outline'}
                >
                  Probar 14 días gratis
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <ul className="mt-6 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className={`h-4 w-4 mt-0.5 flex-shrink-0 ${p.highlighted ? 'text-accent-foreground' : 'text-accent'}`} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* EXTRAS */}
      <section className="max-w-4xl mx-auto px-4 md:px-6 py-16 border-t border-border/60">
        <h2 className="text-2xl font-display font-semibold text-center mb-8">Todos los planes incluyen</h2>
        <div className="grid sm:grid-cols-3 gap-6 text-sm">
          <div className="flex items-center gap-3 justify-center">
            <Shield className="h-5 w-5 text-accent" /> Datos seguros
          </div>
          <div className="flex items-center gap-3 justify-center">
            <Zap className="h-5 w-5 text-accent" /> Actualizaciones gratis
          </div>
          <div className="flex items-center gap-3 justify-center">
            <Users className="h-5 w-5 text-accent" /> Soporte incluido
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-2">
          <img src={salonProLogo.url} alt="Salon Pro" className="h-6 w-6" />
          <span className="font-display font-semibold">
            Salon <span className="text-accent">Pro</span>
          </span>
        </div>
        <div>© {new Date().getFullYear()} Salon Pro · Todos los derechos reservados</div>
        <div className="text-xs mt-2">
          Sistema desarrollado por <span className="font-semibold text-foreground">Uniline</span> · Innovación en la nube
        </div>
      </footer>
    </div>
  );
}
