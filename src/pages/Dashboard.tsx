import { useApp } from '@/contexts/AppContext';
import { getDashboardStats } from '@/lib/mockData';
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
} from 'lucide-react';

export default function Dashboard() {
  const { currentBranch } = useApp();
  const stats = getDashboardStats(currentBranch.id);

  const today = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

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
          <RevenueChart />
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
