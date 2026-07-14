import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import salonProLogo from '@/assets/salon-pro-logo.png.asset.json';
import {
  Calendar,
  MessageCircle,
  CreditCard,
  Users,
  BarChart3,
  Package,
  Scissors,
  Sparkles,
  Check,
  ArrowRight,
  Star,
  Clock,
  Shield,
  Cloud,
  Bell,
  Bot,
  Heart,
  Store,
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';

const features = [
  {
    icon: Calendar,
    title: 'Agenda inteligente',
    description: 'Citas, recordatorios y confirmaciones automáticas. Cero huecos, cero olvidos.',
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp integrado',
    description: 'Confirma, reprograma y envía recibos desde el mismo WhatsApp de tu negocio.',
  },
  {
    icon: Bell,
    title: 'Notificaciones por WhatsApp',
    description: 'Recordatorios 24h y 2h antes de la cita. Menos no-shows, más clientes atendidos.',
  },
  {
    icon: Bot,
    title: 'Agenda desde WhatsApp',
    description: 'Tus clientes agendan solos por WhatsApp. El sistema valida horarios y confirma al instante.',
  },
  {
    icon: Sparkles,
    title: 'Agente de IA',
    description: 'Un asistente inteligente que responde, agenda y resuelve dudas de tus clientes 24/7.',
  },
  {
    icon: CreditCard,
    title: 'Punto de venta',
    description: 'Cobra servicios y productos en segundos. Múltiples métodos de pago y cortes de caja automáticos.',
  },
  {
    icon: Package,
    title: 'Inventario y compras',
    description: 'Control de productos, proveedores, stock bajo y órdenes de compra desde un solo lugar.',
  },
  {
    icon: Users,
    title: 'Equipo y comisiones',
    description: 'Horarios, turnos, comisiones por servicio y rendimiento por colaborador en tiempo real.',
  },
  {
    icon: BarChart3,
    title: 'Reportes claros',
    description: 'Ingresos, servicios más vendidos, retención de clientes y decisiones basadas en datos.',
  },
];

const businessTypes = [
  {
    icon: Scissors,
    label: 'Barberías',
    description: 'Turnos rápidos, comisiones por barbero y agenda pública para tus clientes.',
  },
  {
    icon: Sparkles,
    label: 'Estéticas y salones',
    description: 'Servicios largos, paquetes, seguimiento de clientes y control de productos.',
  },
  {
    icon: Heart,
    label: 'Spas y wellness',
    description: 'Cabinas, terapeutas, membresías y experiencias personalizadas.',
  },
  {
    icon: Store,
    label: 'Cadenas y franquicias',
    description: 'Varias sucursales, roles, reportes consolidados y control central.',
  },
];

// Real photos from Unsplash — barbería, estética, salones
const heroPhoto = 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1600&q=80';
const photo1 = 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=800&q=80'; // barber
const photo2 = 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80'; // salón
const photo3 = 'https://images.unsplash.com/photo-1595475884562-073c30d45670?auto=format&fit=crop&w=800&q=80'; // estética
const photo4 = 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=800&q=80'; // spa

const testimonials = [
  {
    quote: 'Antes perdíamos citas por WhatsApp desorganizado. Con Salon Pro las confirmaciones son automáticas y llenamos la agenda.',
    author: 'Ana Martínez',
    role: 'Dueña, Estética Bella',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
  },
  {
    quote: 'El punto de venta y los cortes de caja nos ahorran una hora diaria. El equipo lo aprendió en un día.',
    author: 'Carlos Ramírez',
    role: 'Barbero, Corte y Estilo',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  },
  {
    quote: 'Ver las comisiones y el rendimiento de cada estilista en tiempo real cambió cómo administramos el salón.',
    author: 'Laura González',
    role: 'Gerente, Salon Studio',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
  },
];

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

export default function Landing() {
  const location = useLocation();
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.slice(1);
      // Wait for layout, then smooth-scroll to the target section
      const t = setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
      return () => clearTimeout(t);
    } else {
      window.scrollTo({ top: 0 });
    }
  }, [location.hash, location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      {/* ============ NAV ============ */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={salonProLogo.url} alt="Salon Pro" className="h-8 w-8" />
            <span className="font-display font-semibold text-lg tracking-tight text-foreground">
              Salon <span className="text-accent">Pro</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#top" className="hover:text-foreground transition-colors">Inicio</a>
            <a href="#whatsapp" className="hover:text-foreground transition-colors inline-flex items-center gap-1"><WhatsAppIcon className="h-3.5 w-3.5 text-[#25D366]" /> WhatsApp</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Precios</a>
            <a href="#about" className="hover:text-foreground transition-colors">Quiénes somos</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm">Iniciar sesión</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                Empezar gratis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ============ HERO ============ */}
      <section id="top" className="relative overflow-hidden">
        {/* Ambient blobs */}
        <div className="blob bg-accent/30 h-[380px] w-[380px] -top-24 -left-24" />
        <div className="blob bg-primary/20 h-[420px] w-[420px] top-40 -right-32" style={{ animationDelay: '2s' }} />

        <div className="relative max-w-7xl mx-auto px-4 md:px-6 pt-16 md:pt-24 pb-16 md:pb-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Copy */}
            <div className="space-y-6 fade-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-medium">
                <Cloud className="h-3.5 w-3.5" />
                Software en la nube para salones, barberías y spas
              </div>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05] text-foreground">
                Administra tu salón
                <span className="block shimmer-text">sin caos y sin perder citas.</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                Agenda, <span className="inline-flex items-center gap-1 font-semibold text-foreground"><WhatsAppIcon className="h-4 w-4 text-[#25D366]" /> WhatsApp automático</span>, punto de venta e inventario en un solo sistema.
                Llena tu agenda, cobra rápido y sabe cuánto ganas cada día.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link to="/signup">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 h-12 px-6 text-base">
                    Empezar gratis 14 días
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <a href="#features">
                  <Button size="lg" variant="outline" className="h-12 px-6 text-base">
                    Ver cómo funciona
                  </Button>
                </a>
              </div>
              <div className="flex items-center gap-6 pt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-accent" /> Sin tarjeta
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-accent" /> Setup en 5 min
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-accent" /> Cancela cuando quieras
                </div>
              </div>
            </div>

            {/* Hero image */}
            <div className="relative fade-up">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-border/60 aspect-[4/5] lg:aspect-[5/6]">
                <img
                  src={heroPhoto}
                  alt="Salón profesional trabajando con Salon Pro"
                  className="w-full h-full object-cover"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-transparent" />
              </div>

              {/* Floating card 1 — WhatsApp confirmación */}
              <div className="absolute -left-4 md:-left-10 top-8 md:top-14 bg-card border border-border/70 rounded-2xl shadow-xl p-3.5 w-64 backdrop-blur hidden md:block floaty">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="h-9 w-9 rounded-full bg-[#25D366]/15 flex items-center justify-center flex-shrink-0 glow-ring">
                    <WhatsAppIcon className="h-5 w-5 text-[#25D366]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-foreground truncate">María López</div>
                    <div className="text-[10px] text-muted-foreground">vía WhatsApp · ahora</div>
                  </div>
                </div>
                <div className="bg-[#25D366]/10 text-foreground text-xs rounded-xl rounded-tl-sm px-3 py-2 wa-pop">
                  ¡Confirmada tu cita para hoy 4:30 pm! ✂️
                </div>
              </div>

              {/* Floating card 2 — ingresos hoy */}
              <div className="absolute -right-4 md:-right-8 bottom-10 md:bottom-16 bg-card border border-border/70 rounded-2xl shadow-xl p-4 w-52 backdrop-blur hidden md:block floaty" style={{ animationDelay: '1.5s' }}>
                <div className="text-xs text-muted-foreground mb-1">Ingresos hoy</div>
                <div className="text-2xl font-display font-semibold text-foreground">$8,450</div>
                <div className="text-xs text-success font-medium mt-1">↑ 24% vs ayer</div>
              </div>
            </div>
          </div>
        </div>

        {/* Business types strip */}
        <div className="border-y border-border/60 bg-card/40">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
            <p className="text-center text-xs uppercase tracking-wider text-muted-foreground mb-5 font-medium">
              Diseñado para todo tipo de negocio de belleza
            </p>
            <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12">
              {businessTypes.map((b) => (
                <div key={b.label} className="flex items-center gap-2 text-muted-foreground">
                  <b.icon className="h-5 w-5" />
                  <span className="font-medium">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section id="features" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium mb-4">
              Todo lo que necesitas
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-4">
              Un sistema, todo tu negocio
            </h2>
            <p className="text-lg text-muted-foreground">
              Deja Excel, WhatsApp suelto y libretas. Salon Pro conecta todo lo que importa.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="group relative p-6 rounded-2xl bg-card border border-border/70 hover:border-accent/40 hover:shadow-lg transition-all duration-300"
              >
                <div className="h-11 w-11 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/15 transition-colors">
                  <f.icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2 text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ WHATSAPP SHOWCASE ============ */}
      <section id="whatsapp" className="relative py-20 md:py-28 overflow-hidden bg-gradient-to-b from-background to-secondary/30">
        <div className="blob bg-[#25D366]/25 h-[360px] w-[360px] top-10 -left-24" />
        <div className="blob bg-accent/20 h-[320px] w-[320px] bottom-0 -right-16" style={{ animationDelay: '3s' }} />

        <div className="relative max-w-7xl mx-auto px-4 md:px-6 grid lg:grid-cols-2 gap-14 items-center">
          {/* Copy */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#25D366]/15 text-[#128C7E] text-xs font-semibold">
              <WhatsAppIcon className="h-3.5 w-3.5" />
              WhatsApp que trabaja por ti
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tight text-foreground leading-[1.05]">
              Tu WhatsApp se vuelve
              <span className="block text-[#25D366]">tu mejor recepcionista.</span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
              Recordatorios automáticos, confirmaciones al instante y clientes que agendan solos.
              Menos no-shows, más caja llena — sin que muevas un dedo.
            </p>
            <ul className="space-y-3 pt-2">
              {[
                'Recordatorio 24h y 2h antes de la cita',
                'Confirmación con un solo clic desde el chat',
                'Agente IA que responde y agenda 24/7',
                'Recibos y encuestas post-servicio automáticas',
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-foreground">
                  <div className="mt-0.5 h-5 w-5 rounded-full bg-[#25D366]/15 flex items-center justify-center flex-shrink-0">
                    <Check className="h-3 w-3 text-[#128C7E]" />
                  </div>
                  <span className="text-sm md:text-base">{t}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-6 pt-4">
              <div>
                <div className="font-display text-3xl font-semibold text-foreground">-72%</div>
                <div className="text-xs text-muted-foreground">no-shows</div>
              </div>
              <div>
                <div className="font-display text-3xl font-semibold text-foreground">3x</div>
                <div className="text-xs text-muted-foreground">más confirmaciones</div>
              </div>
              <div>
                <div className="font-display text-3xl font-semibold text-foreground">24/7</div>
                <div className="text-xs text-muted-foreground">agenda abierta</div>
              </div>
            </div>
          </div>

          {/* Chat mockup */}
          <div className="relative mx-auto w-full max-w-sm">
            <div className="absolute inset-0 -m-6 rounded-[3rem] bg-gradient-to-tr from-[#25D366]/25 to-accent/20 blur-2xl" />
            <div className="relative rounded-[2.2rem] border border-border/70 bg-card shadow-2xl overflow-hidden floaty">
              {/* WA header */}
              <div className="flex items-center gap-3 bg-[#075E54] text-white px-4 py-3">
                <div className="h-10 w-10 rounded-full bg-white/15 flex items-center justify-center">
                  <WhatsAppIcon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">Salon Pro · Agenda</div>
                  <div className="text-[10px] text-white/70">en línea</div>
                </div>
              </div>
              {/* Chat body */}
              <div className="bg-[#ECE5DD] dark:bg-muted p-4 space-y-2.5 min-h-[420px]">
                <div className="wa-pop max-w-[80%] bg-white text-slate-800 text-sm rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm">
                  Hola María 👋 Te recordamos tu cita mañana <b>4:30 pm</b> con Carlos.
                </div>
                <div className="wa-pop max-w-[80%] bg-white text-slate-800 text-sm rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm" style={{ animationDelay: '0.3s' }}>
                  ¿Confirmas tu asistencia?
                </div>
                <div className="wa-pop max-w-[70%] ml-auto bg-[#DCF8C6] text-slate-800 text-sm rounded-2xl rounded-tr-sm px-3 py-2 shadow-sm" style={{ animationDelay: '0.9s' }}>
                  ¡Sí, confirmada! ✅
                </div>
                <div className="wa-pop max-w-[80%] bg-white text-slate-800 text-sm rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm" style={{ animationDelay: '1.4s' }}>
                  Perfecto 🙌 Te esperamos. Aquí tu ubicación y contacto.
                </div>
                <div className="wa-pop max-w-[60%] ml-auto bg-[#DCF8C6] text-slate-800 text-sm rounded-2xl rounded-tr-sm px-3 py-2 shadow-sm" style={{ animationDelay: '2s' }}>
                  ¿Puedo mover a las 5:00?
                </div>
                <div className="wa-pop max-w-[85%] bg-white text-slate-800 text-sm rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm" style={{ animationDelay: '2.6s' }}>
                  Reprogramada a las <b>5:00 pm</b> ✨ ¡Nos vemos!
                </div>
                <div className="wa-pop inline-flex items-center bg-white text-slate-500 text-sm rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm" style={{ animationDelay: '3.1s' }}>
                  <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                </div>
              </div>
            </div>

            {/* Floating stat */}
            <div className="absolute -bottom-6 -left-6 bg-card border border-border/70 rounded-2xl shadow-xl p-3 flex items-center gap-2.5 floaty" style={{ animationDelay: '1s' }}>
              <div className="h-9 w-9 rounded-full bg-[#25D366]/15 flex items-center justify-center">
                <Bell className="h-4 w-4 text-[#128C7E]" />
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">Enviados hoy</div>
                <div className="text-sm font-semibold text-foreground">128 recordatorios</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ VISUAL SHOWCASE ============ */}
      <section className="py-20 md:py-24 bg-secondary/40">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-4 gap-4">
            {[photo1, photo2, photo3, photo4].map((src, i) => (
              <div
                key={i}
                className={`relative rounded-2xl overflow-hidden aspect-[3/4] shadow-md ${
                  i % 2 === 0 ? 'md:translate-y-6' : ''
                }`}
              >
                <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
            ))}
          </div>
          <div className="max-w-2xl mx-auto text-center mt-16">
            <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-4">
              Hecho para negocios que operan de verdad
            </h2>
            <p className="text-lg text-muted-foreground">
              No importa si son 2 sillas o 3 sucursales. Salon Pro se adapta al ritmo de tu día.
            </p>
          </div>
        </div>
      </section>

      {/* ============ PARA QUIÉN ============ */}
      <section id="for-who" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium mb-4">
              Para quién es Salon Pro
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-4">
              Un sistema pensado para tu tipo de negocio
            </h2>
            <p className="text-lg text-muted-foreground">
              Barberías, estéticas, spas, salones unisex y cadenas. Cada uno con lo que necesita para operar mejor.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {businessTypes.map((b) => (
              <div
                key={b.label}
                className="p-6 rounded-2xl bg-card border border-border/70 hover:border-accent/40 hover:shadow-lg transition-all"
              >
                <div className="h-11 w-11 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                  <b.icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2 text-foreground">{b.label}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ QUIÉNES SOMOS ============ */}
      <section id="about" className="py-20 md:py-28 bg-secondary/40">
        <div className="max-w-6xl mx-auto px-4 md:px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium mb-4">
              Quiénes somos
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-4">
              Un equipo obsesionado con hacerte ganar más tiempo
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-4">
              Salon Pro nació trabajando codo a codo con dueños de barberías, estéticas y spas.
              Sabemos cómo se vive el mostrador un sábado a las 5 de la tarde: teléfono sonando,
              WhatsApp lleno, clientes esperando y una libreta que ya no da.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Por eso construimos un sistema simple, rápido y en español, pensado para que cualquier
              persona del equipo lo use desde el primer día — sin manuales ni capacitaciones eternas.
            </p>
            <div className="grid grid-cols-3 gap-4 mt-8">
              <div>
                <div className="font-display text-3xl font-semibold text-foreground">+500</div>
                <div className="text-sm text-muted-foreground">negocios activos</div>
              </div>
              <div>
                <div className="font-display text-3xl font-semibold text-foreground">98%</div>
                <div className="text-sm text-muted-foreground">satisfacción</div>
              </div>
              <div>
                <div className="font-display text-3xl font-semibold text-foreground">24/7</div>
                <div className="text-sm text-muted-foreground">soporte real</div>
              </div>
            </div>
          </div>
          <div className="relative rounded-3xl overflow-hidden aspect-[4/5] shadow-xl border border-border/60">
            <img
              src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1000&q=80"
              alt="Equipo Salon Pro"
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-transparent" />
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section id="testimonials" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-4">
              Negocios reales, resultados reales
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.author}
                className="p-6 rounded-2xl bg-card border border-border/70 flex flex-col"
              >
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-foreground leading-relaxed mb-6 flex-1">"{t.quote}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-border/60">
                  <img
                    src={t.avatar}
                    alt={t.author}
                    className="h-11 w-11 rounded-full object-cover"
                    loading="lazy"
                  />
                  <div>
                    <div className="font-medium text-sm text-foreground">{t.author}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PRICING ============ */}
      <section id="pricing" className="py-20 md:py-28 bg-secondary/40">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-4">
              Precios simples y transparentes
            </h2>
            <p className="text-lg text-muted-foreground">
              Elige el plan que se adapta a tu negocio. Cambia cuando quieras.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`relative p-8 rounded-2xl border transition-all ${
                  p.highlighted
                    ? 'bg-primary text-primary-foreground border-primary shadow-xl scale-[1.02]'
                    : 'bg-card border-border/70'
                }`}
              >
                {p.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    Más popular
                  </div>
                )}
                <h3 className="font-display font-semibold text-xl mb-1">{p.name}</h3>
                <p className={`text-sm mb-6 ${p.highlighted ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {p.description}
                </p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="font-display text-4xl font-semibold">{p.price}</span>
                  <span className={p.highlighted ? 'text-primary-foreground/70' : 'text-muted-foreground'}>{p.period}</span>
                </div>
                <Link to="/signup" className="block">
                  <Button
                    className={`w-full h-11 ${
                      p.highlighted
                        ? 'bg-accent hover:bg-accent/90 text-accent-foreground'
                        : 'bg-primary hover:bg-primary/90'
                    }`}
                  >
                    Empezar ahora
                  </Button>
                </Link>
                <ul className="space-y-3 mt-6">
                  {p.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-sm">
                      <Check className={`h-4 w-4 mt-0.5 flex-shrink-0 ${p.highlighted ? 'text-accent-foreground' : 'text-accent'}`} />
                      <span className={p.highlighted ? 'text-primary-foreground/90' : 'text-foreground'}>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <div className="relative overflow-hidden rounded-3xl p-10 md:p-16 text-center gradient-bg text-primary-foreground">
            <Sparkles className="h-10 w-10 mx-auto mb-5 opacity-90" />
            <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mb-4">
              Empieza hoy. Ordena tu negocio mañana.
            </h2>
            <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
              14 días gratis. Sin tarjeta de crédito. Cancela cuando quieras.
            </p>
            <Link to="/signup">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 h-12 px-8 text-base font-semibold">
                Crear mi cuenta gratis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-border/60 py-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src={salonProLogo.url} alt="Salon Pro" className="h-7 w-7" />
            <span className="font-display font-semibold text-foreground">
              Salon <span className="text-accent">Pro</span>
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#top" className="hover:text-foreground">Inicio</a>
            <a href="#pricing" className="hover:text-foreground">Precios</a>
            <a href="#about" className="hover:text-foreground">Quiénes somos</a>
            <Link to="/login" className="hover:text-foreground">Iniciar sesión</Link>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            © {new Date().getFullYear()} Salon Pro · Todos los derechos reservados
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 md:px-6 mt-6 pt-6 border-t border-border/60 text-center text-xs text-muted-foreground">
          Sistema desarrollado por <span className="font-semibold text-foreground">Uniline</span> · Innovación en la nube
        </div>
      </footer>
    </div>
  );
}
