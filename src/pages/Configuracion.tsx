import { useState } from 'react';
import { 
  branches as mockBranches,
  stylists as mockStylists,
  serviceCategories as mockServiceCategories,
  productCategories as mockProductCategories,
  paymentMethods,
  type Branch,
  type Stylist,
} from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Building2,
  Users,
  Tag,
  CreditCard,
  Plus,
  Edit,
  Trash2,
  Phone,
  MapPin,
  User,
  Palette,
  Settings2,
  Scissors,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';

export default function Configuracion() {
  const [branches, setBranches] = useState<Branch[]>(mockBranches);
  const [stylists, setStylists] = useState<Stylist[]>(mockStylists);
  const [serviceCategories, setServiceCategories] = useState<string[]>(mockServiceCategories);
  const [productCategories, setProductCategories] = useState<string[]>(mockProductCategories);
  
  const [isBranchDialogOpen, setIsBranchDialogOpen] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [categoryType, setCategoryType] = useState<'service' | 'product'>('service');
  
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [editingUser, setEditingUser] = useState<Stylist | null>(null);

  const [branchForm, setBranchForm] = useState({ name: '', address: '', phone: '' });
  const [userForm, setUserForm] = useState({ name: '', role: 'stylist' as Stylist['role'], color: '#c97f67' });
  const [newCategory, setNewCategory] = useState('');

  // Branch handlers
  const openBranchDialog = (branch?: Branch) => {
    if (branch) {
      setEditingBranch(branch);
      setBranchForm({ name: branch.name, address: branch.address, phone: branch.phone });
    } else {
      setEditingBranch(null);
      setBranchForm({ name: '', address: '', phone: '' });
    }
    setIsBranchDialogOpen(true);
  };

  const saveBranch = () => {
    if (!branchForm.name) {
      toast.error('El nombre es requerido');
      return;
    }

    if (editingBranch) {
      setBranches(prev => prev.map(b => 
        b.id === editingBranch.id ? { ...b, ...branchForm } : b
      ));
      toast.success('Sucursal actualizada');
    } else {
      const newBranch: Branch = {
        id: `b${Date.now()}`,
        ...branchForm,
      };
      setBranches(prev => [...prev, newBranch]);
      toast.success('Sucursal creada');
    }

    setIsBranchDialogOpen(false);
  };

  const deleteBranch = (id: string) => {
    setBranches(prev => prev.filter(b => b.id !== id));
    toast.success('Sucursal eliminada');
  };

  // User handlers
  const openUserDialog = (user?: Stylist) => {
    if (user) {
      setEditingUser(user);
      setUserForm({ name: user.name, role: user.role, color: user.color });
    } else {
      setEditingUser(null);
      setUserForm({ name: '', role: 'stylist', color: '#c97f67' });
    }
    setIsUserDialogOpen(true);
  };

  const saveUser = () => {
    if (!userForm.name) {
      toast.error('El nombre es requerido');
      return;
    }

    if (editingUser) {
      setStylists(prev => prev.map(u => 
        u.id === editingUser.id ? { ...u, ...userForm } : u
      ));
      toast.success('Usuario actualizado');
    } else {
      const newUser: Stylist = {
        id: `s${Date.now()}`,
        ...userForm,
      };
      setStylists(prev => [...prev, newUser]);
      toast.success('Usuario creado');
    }

    setIsUserDialogOpen(false);
  };

  const deleteUser = (id: string) => {
    setStylists(prev => prev.filter(u => u.id !== id));
    toast.success('Usuario eliminado');
  };

  // Category handlers
  const openCategoryDialog = (type: 'service' | 'product') => {
    setCategoryType(type);
    setNewCategory('');
    setIsCategoryDialogOpen(true);
  };

  const addCategory = () => {
    if (!newCategory) {
      toast.error('El nombre es requerido');
      return;
    }

    if (categoryType === 'service') {
      setServiceCategories(prev => [...prev, newCategory]);
    } else {
      setProductCategories(prev => [...prev, newCategory]);
    }

    toast.success('Categoría agregada');
    setIsCategoryDialogOpen(false);
  };

  const deleteCategory = (type: 'service' | 'product', category: string) => {
    if (type === 'service') {
      setServiceCategories(prev => prev.filter(c => c !== category));
    } else {
      setProductCategories(prev => prev.filter(c => c !== category));
    }
    toast.success('Categoría eliminada');
  };

  const roleLabels = {
    admin: 'Administrador',
    stylist: 'Estilista',
    receptionist: 'Recepción',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">Administra sucursales, usuarios y preferencias</p>
      </div>

      <Tabs defaultValue="branches" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="branches" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Sucursales</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Usuarios</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <Tag className="h-4 w-4" />
            <span className="hidden sm:inline">Categorías</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Pagos</span>
          </TabsTrigger>
        </TabsList>

        {/* Branches */}
        <TabsContent value="branches" className="space-y-4">
          <div className="flex justify-end">
            <Button className="gradient-bg border-0" onClick={() => openBranchDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Sucursal
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {branches.map(branch => (
              <Card key={branch.id} className="glass-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      {branch.name}
                    </span>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openBranchDialog(branch)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteBranch(branch.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {branch.address}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {branch.phone}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Users */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-end">
            <Button className="gradient-bg border-0" onClick={() => openUserDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Usuario
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stylists.map(user => (
              <Card key={user.id} className="glass-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-3">
                      <div 
                        className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: user.color }}
                      >
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p>{user.name}</p>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {roleLabels[user.role]}
                        </Badge>
                      </div>
                    </span>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openUserDialog(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteUser(user.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Categories */}
        <TabsContent value="categories" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Service Categories */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Scissors className="h-5 w-5 text-primary" />
                    Categorías de Servicios
                  </span>
                  <Button size="sm" variant="outline" onClick={() => openCategoryDialog('service')}>
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {serviceCategories.map(cat => (
                    <Badge key={cat} variant="secondary" className="gap-1 pr-1">
                      {cat}
                      <button 
                        onClick={() => deleteCategory('service', cat)}
                        className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Product Categories */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Categorías de Productos
                  </span>
                  <Button size="sm" variant="outline" onClick={() => openCategoryDialog('product')}>
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {productCategories.map(cat => (
                    <Badge key={cat} variant="secondary" className="gap-1 pr-1">
                      {cat}
                      <button 
                        onClick={() => deleteCategory('product', cat)}
                        className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Payments */}
        <TabsContent value="payments" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Métodos de Pago
              </CardTitle>
              <CardDescription>
                Configura los métodos de pago aceptados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentMethods.map(method => (
                <div key={method.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      {method.id === 'cash' && <CreditCard className="h-4 w-4 text-primary" />}
                      {method.id === 'card' && <CreditCard className="h-4 w-4 text-primary" />}
                      {method.id === 'transfer' && <CreditCard className="h-4 w-4 text-primary" />}
                      {method.id === 'mixed' && <CreditCard className="h-4 w-4 text-primary" />}
                    </div>
                    <div>
                      <p className="font-medium">{method.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {method.id === 'cash' && 'Pagos en efectivo'}
                        {method.id === 'card' && 'Tarjetas de crédito y débito'}
                        {method.id === 'transfer' && 'Transferencias bancarias'}
                        {method.id === 'mixed' && 'Combinación de métodos'}
                      </p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Branch Dialog */}
      <Dialog open={isBranchDialogOpen} onOpenChange={setIsBranchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBranch ? 'Editar Sucursal' : 'Nueva Sucursal'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={branchForm.name}
                onChange={(e) => setBranchForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nombre de la sucursal"
              />
            </div>
            <div className="space-y-2">
              <Label>Dirección</Label>
              <Input
                value={branchForm.address}
                onChange={(e) => setBranchForm(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Dirección completa"
              />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input
                value={branchForm.phone}
                onChange={(e) => setBranchForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="555-0000"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsBranchDialogOpen(false)}>Cancelar</Button>
              <Button className="gradient-bg border-0" onClick={saveBranch}>Guardar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Dialog */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={userForm.name}
                onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nombre completo"
              />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select 
                value={userForm.role} 
                onValueChange={(v: Stylist['role']) => setUserForm(prev => ({ ...prev, role: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="stylist">Estilista</SelectItem>
                  <SelectItem value="receptionist">Recepción</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={userForm.color}
                  onChange={(e) => setUserForm(prev => ({ ...prev, color: e.target.value }))}
                  className="h-10 w-20 rounded border cursor-pointer"
                />
                <div 
                  className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: userForm.color }}
                >
                  {userForm.name?.charAt(0) || 'U'}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>Cancelar</Button>
              <Button className="gradient-bg border-0" onClick={saveUser}>Guardar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Nueva Categoría de {categoryType === 'service' ? 'Servicio' : 'Producto'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Nombre de la categoría"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>Cancelar</Button>
              <Button className="gradient-bg border-0" onClick={addCategory}>Agregar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
