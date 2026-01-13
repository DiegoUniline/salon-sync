import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { 
  expenses as mockExpenses,
  expenseCategories,
  type Expense,
} from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Building2,
  Zap,
  Package,
  Users,
  MoreHorizontal,
  CreditCard,
  Banknote,
  ArrowRightLeft,
  Trash2,
  Edit,
  TrendingDown,
  Wallet,
  PieChart,
} from 'lucide-react';
import { toast } from 'sonner';

const categoryIcons = {
  rent: Building2,
  utilities: Zap,
  supplies: Package,
  payroll: Users,
  other: MoreHorizontal,
};

const categoryLabels = {
  rent: 'Renta',
  utilities: 'Servicios',
  supplies: 'Insumos',
  payroll: 'Nómina',
  other: 'Otros',
};

const categoryColors = {
  rent: 'bg-purple-500/20 text-purple-600 border-purple-500/30',
  utilities: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
  supplies: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
  payroll: 'bg-green-500/20 text-green-600 border-green-500/30',
  other: 'bg-gray-500/20 text-gray-600 border-gray-500/30',
};

const paymentLabels = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
};

export default function Gastos() {
  const { currentBranch } = useApp();
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [formData, setFormData] = useState({
    category: 'supplies' as Expense['category'],
    description: '',
    amount: '',
    paymentMethod: 'cash' as 'cash' | 'card' | 'transfer',
    date: new Date().toISOString().split('T')[0],
    supplier: '',
  });

  const filteredExpenses = expenses.filter(e => {
    const matchesBranch = e.branchId === currentBranch.id;
    const matchesSearch = e.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter;
    return matchesBranch && matchesSearch && matchesCategory;
  });

  const totalGastos = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const gastosPorCategoria = Object.keys(categoryLabels).map(cat => ({
    category: cat as Expense['category'],
    total: filteredExpenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0),
  })).filter(g => g.total > 0);

  const resetForm = () => {
    setFormData({
      category: 'supplies',
      description: '',
      amount: '',
      paymentMethod: 'cash',
      date: new Date().toISOString().split('T')[0],
      supplier: '',
    });
    setEditingExpense(null);
  };

  const openEditDialog = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      category: expense.category,
      description: expense.description,
      amount: expense.amount.toString(),
      paymentMethod: expense.paymentMethod,
      date: expense.date,
      supplier: expense.supplier || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.description || !formData.amount) {
      toast.error('Completa los campos requeridos');
      return;
    }

    if (editingExpense) {
      setExpenses(prev => prev.map(e => 
        e.id === editingExpense.id
          ? {
              ...e,
              category: formData.category,
              description: formData.description,
              amount: parseFloat(formData.amount),
              paymentMethod: formData.paymentMethod,
              date: formData.date,
              supplier: formData.supplier,
            }
          : e
      ));
      toast.success('Gasto actualizado');
    } else {
      const newExpense: Expense = {
        id: `e${Date.now()}`,
        branchId: currentBranch.id,
        category: formData.category,
        description: formData.description,
        amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod,
        date: formData.date,
        supplier: formData.supplier,
      };
      setExpenses(prev => [newExpense, ...prev]);
      toast.success('Gasto registrado');
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    toast.success('Gasto eliminado');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gastos</h1>
          <p className="text-muted-foreground">Control de gastos de la sucursal</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gradient-bg border-0">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Gasto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingExpense ? 'Editar Gasto' : 'Registrar Gasto'}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(v: Expense['category']) => setFormData(prev => ({ ...prev, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([key, label]) => {
                      const Icon = categoryIcons[key as keyof typeof categoryIcons];
                      return (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción del gasto"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Monto</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      className="pl-7"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Método de Pago</Label>
                <Select 
                  value={formData.paymentMethod} 
                  onValueChange={(v: 'cash' | 'card' | 'transfer') => setFormData(prev => ({ ...prev, paymentMethod: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">
                      <div className="flex items-center gap-2">
                        <Banknote className="h-4 w-4" />
                        Efectivo
                      </div>
                    </SelectItem>
                    <SelectItem value="card">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Tarjeta
                      </div>
                    </SelectItem>
                    <SelectItem value="transfer">
                      <div className="flex items-center gap-2">
                        <ArrowRightLeft className="h-4 w-4" />
                        Transferencia
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Proveedor (opcional)</Label>
                <Input
                  value={formData.supplier}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                  placeholder="Nombre del proveedor"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                  Cancelar
                </Button>
                <Button 
                  className="gradient-bg border-0"
                  onClick={handleSubmit}
                  disabled={!formData.description || !formData.amount}
                >
                  {editingExpense ? 'Guardar Cambios' : 'Registrar Gasto'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-destructive/10">
              <TrendingDown className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Gastos</p>
              <p className="text-2xl font-bold">${totalGastos.toLocaleString()}</p>
            </div>
          </div>
        </div>
        {gastosPorCategoria.slice(0, 3).map(({ category, total }) => {
          const Icon = categoryIcons[category];
          return (
            <div key={category} className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className={cn("p-3 rounded-lg", categoryColors[category].split(' ')[0])}>
                  <Icon className={cn("h-5 w-5", categoryColors[category].split(' ')[1])} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{categoryLabels[category]}</p>
                  <p className="text-2xl font-bold">${total.toLocaleString()}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por descripción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Pago</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExpenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No hay gastos registrados
                </TableCell>
              </TableRow>
            ) : (
              filteredExpenses
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((expense) => {
                  const Icon = categoryIcons[expense.category];
                  return (
                    <TableRow key={expense.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(expense.date).toLocaleDateString('es-MX')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('border gap-1', categoryColors[expense.category])}>
                          <Icon className="h-3 w-3" />
                          {categoryLabels[expense.category]}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{expense.description}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {expense.supplier || '-'}
                      </TableCell>
                      <TableCell>{paymentLabels[expense.paymentMethod]}</TableCell>
                      <TableCell className="text-right font-semibold text-destructive">
                        -${expense.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8"
                            onClick={() => openEditDialog(expense)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-destructive"
                            onClick={() => deleteExpense(expense.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
