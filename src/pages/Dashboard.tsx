import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import api from '@/lib/api';
import { StatCard } from '@/components/dashboard/StatCard';
import { AppointmentTimeline } from '@/components/dashboard/AppointmentTimeline';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { TopItemsList } from '@/components/dashboard/TopItemsList';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { AnimatedContainer, PageTransition } from '@/components/ui/animated-container';
import { motion } from 'framer-motion';
import {
  DollarSign,
  CalendarCheck,
  CheckCircle,
  Clock,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface DashboardStats {
  todaySales: number;
  todayAppointments: number;
  completedAppointments: number;
  pendingAppointments: number;
  inProgressAppointments?: number;
  topServices: Array<{ name: string; count: number; revenue: number }>;
  topProducts: Array<{ name: string; count: number; revenue: number }>;
  weeklyRevenue: Array<{ day: string; amount: number }>;
  pendingBalance?: number;
}

export default function Dashboard() {
  const { currentBranch } = useApp();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.dashboard.get(currentBranch.id);
        setStats(data);
      } catch (err) {
        console.error('Error loading dashboard:', err);
        setError('Error al cargar el dashboard');
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [currentBranch.id]);

  if (loading) {
    return (
      <PageTransition className="space-y-6">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageTransition>
    );
  }

  if (error || !stats) {
    return (
      <PageTransition className="space-y-6">
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <AlertCircle className="h-12 w-12 mb-4 text-destructive" />
          <p>{error || 'Error al cargar el dashboard'}</p>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="space-y-6">
      {/* Header */}
      <AnimatedContainer variant="fadeInUp" delay={0}>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground capitalize">{today}</p>
        </div>
      </AnimatedContainer>

      {/* Quick Actions */}
      <AnimatedContainer variant="fadeInUp" delay={0.05}>
        <QuickActions />
      </AnimatedContainer>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <StatCard
            title="Ventas del Día"
            value={`$${stats.todaySales.toLocaleString()}`}
            icon={DollarSign}
            trend={{ value: 15, positive: true }}
            delay={0}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <StatCard
            title="Citas Hoy"
            value={stats.todayAppointments}
            subtitle={`${stats.completedAppointments} completadas`}
            icon={CalendarCheck}
            delay={100}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <StatCard
            title="Completadas"
            value={stats.completedAppointments}
            icon={CheckCircle}
            trend={{ value: 8, positive: true }}
            delay={200}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
        >
          <StatCard
            title="Pendientes"
            value={stats.pendingAppointments}
            icon={Clock}
            delay={300}
          />
        </motion.div>
      </div>

      {/* Pending Balance Card (if exists) */}
      {stats.pendingBalance !== undefined && stats.pendingBalance > 0 && (
        <AnimatedContainer variant="fadeInUp" delay={0.3}>
          <div className="glass-card rounded-xl p-4 border-l-4 border-warning">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-warning" />
              <div>
                <p className="text-sm text-muted-foreground">Saldo por cobrar total</p>
                <p className="text-xl font-bold text-warning">
                  ${stats.pendingBalance.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </AnimatedContainer>
      )}

      {/* Main Content Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="grid gap-6 lg:grid-cols-3"
      >
        {/* Appointments Timeline */}
        <div className="lg:col-span-2">
          <AppointmentTimeline />
        </div>

        {/* Revenue Chart */}
        <div>
          <RevenueChart weeklyRevenue={stats.weeklyRevenue} />
        </div>
      </motion.div>

      {/* Bottom Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.35 }}
        className="grid gap-6 md:grid-cols-2"
      >
        <TopItemsList
          title="Servicios Más Vendidos"
          items={stats.topServices}
          type="services"
        />
        <TopItemsList
          title="Productos Más Vendidos"
          items={stats.topProducts}
          type="products"
        />
      </motion.div>
    </PageTransition>
  );
}
