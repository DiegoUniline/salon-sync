import { useApp } from '@/contexts/AppContext';
import { getDashboardStats } from '@/lib/mockData';
import { StatCard } from '@/components/dashboard/StatCard';
import { AppointmentTimeline } from '@/components/dashboard/AppointmentTimeline';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { TopItemsList } from '@/components/dashboard/TopItemsList';
import { QuickActions } from '@/components/dashboard/QuickActions';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground capitalize">{today}</p>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Ventas del Día"
          value={`$${stats.todaySales.toLocaleString()}`}
          icon={DollarSign}
          trend={{ value: 15, positive: true }}
          delay={0}
        />
        <StatCard
          title="Citas Hoy"
          value={stats.todayAppointments}
          subtitle={`${stats.completedAppointments} completadas`}
          icon={CalendarCheck}
          delay={100}
        />
        <StatCard
          title="Completadas"
          value={stats.completedAppointments}
          icon={CheckCircle}
          trend={{ value: 8, positive: true }}
          delay={200}
        />
        <StatCard
          title="Pendientes"
          value={stats.pendingAppointments}
          icon={Clock}
          delay={300}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Appointments Timeline */}
        <div className="lg:col-span-2">
          <AppointmentTimeline />
        </div>

        {/* Revenue Chart */}
        <div>
          <RevenueChart />
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid gap-6 md:grid-cols-2">
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
      </div>
    </div>
  );
}
