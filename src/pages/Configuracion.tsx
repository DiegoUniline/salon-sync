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
import { useApp } from '@/contexts/AppContext';
import { 
  businessTypeLabels, 
  businessTypeIcons,
  defaultTicketFields,
  type BusinessType,
  type TicketField,
} from '@/lib/businessConfig';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  Scissors,
  Package,
  Settings2,
  Receipt,
  Briefcase,
} from 'lucide-react';
import { toast } from 'sonner';

export default function Configuracion() {
  const { businessConfig, updateBusinessConfig, terms } = useApp();
  
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
      toast.success(`${terms.branch} actualizada`);
    } else {
      const newBranch: Branch = {
        id: `b${Date.now()}`,
        ...branchForm,
      };
      setBranches(prev => [...prev, newBranch]);
      toast.success(`${terms.branch} creada`);
    }

    setIsBranchDialogOpen(false);
  };

  const deleteBranch = (id: string) => {
    setBranches(prev => prev.filter(b => b.id !== id));
    toast.success(`${terms.branch} eliminada`);
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

  // Ticket field toggle
  const toggleTicketField = (fieldId: string) => {
    const newFields = businessConfig.ticketFields.map(f => 
      f.id === fieldId ? { ...f, enabled: !f.enabled } : f
    );
    updateBusinessConfig({ ticketFields: newFields });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">Administra tu negocio, {terms.branches.toLowerCase()}, usuarios y preferencias</p>
      </div>

      <Tabs defaultValue="business" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="business" className="gap-2">
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">Negocio</span>
          </TabsTrigger>
          <TabsTrigger value="branches" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">{terms.branches}</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">{terms.professionals}</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <Tag className="h-4 w-4" />
            <span className="hidden sm:inline">Categorías</span>
          </TabsTrigger>
          <TabsTrigger value="tickets" className="gap-2">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Tickets</span>
          </TabsTrigger>
        </TabsList>

        {/* Business Type */}
        <TabsContent value="business" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Tipo de Negocio
              </CardTitle>
              <CardDescription>
                Selecciona el tipo de negocio para adaptar la terminología
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {(Object.keys(businessTypeLabels) as BusinessType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => updateBusinessConfig({ type })}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      businessConfig.type === type 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="text-3xl mb-2">{businessTypeIcons[type]}</div>
                    <div className="font-medium">{businessTypeLabels[type]}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {type === 'salon' && 'Cortes, tintes, manicure, etc.'}
                      {type === 'nutrition' && 'Consultas, planes alimenticios'}
                      {type === 'medical' && 'Consultas médicas generales'}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-primary" />
                Datos del Negocio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nombre del negocio</Label>
                  <Input
                    value={businessConfig.name}
                    onChange={(e) => updateBusinessConfig({ name: e.target.value })}
                    placeholder="Mi Negocio"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input
                    value={businessConfig.phone}
                    onChange={(e) => updateBusinessConfig({ phone: e.target.value })}
                    placeholder="555-0000"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Dirección</Label>
                  <Input
                    value={businessConfig.address}
                    onChange={(e) => updateBusinessConfig({ address: e.target.value })}
                    placeholder="Calle, Número, Colonia, Ciudad"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={businessConfig.email || ''}
                    onChange={(e) => updateBusinessConfig({ email: e.target.value })}
                    placeholder="contacto@minegocio.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>RFC (opcional)</Label>
                  <Input
                    value={businessConfig.rfc || ''}
                    onChange={(e) => updateBusinessConfig({ rfc: e.target.value })}
                    placeholder="XAXX010101000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branches */}
        <TabsContent value="branches" className="space-y-4">
          <div className="flex justify-end">
            <Button className="gradient-bg border-0" onClick={() => openBranchDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva {terms.branch}
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
              Nuevo {terms.professional}
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
                          {terms.role[user.role]}
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
                    Categorías de {terms.services}
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

        {/* Tickets */}
        <TabsContent value="tickets" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                Configuración de Tickets
              </CardTitle>
              <CardDescription>
                Personaliza qué información aparece en los tickets impresos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {businessConfig.ticketFields.map(field => (
                  <div key={field.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <span className="text-sm">{field.label}</span>
                    <Switch
                      checked={field.enabled}
                      onCheckedChange={() => toggleTicketField(field.id)}
                    />
                  </div>
                ))}
              </div>
              
              <div className="space-y-2 pt-4 border-t">
                <Label>Mensaje de pie del ticket</Label>
                <Textarea
                  value={businessConfig.ticketFooter || ''}
                  onChange={(e) => updateBusinessConfig({ ticketFooter: e.target.value })}
                  placeholder="¡Gracias por su preferencia!"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Branch Dialog */}
      <Dialog open={isBranchDialogOpen} onOpenChange={setIsBranchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBranch ? `Editar ${terms.branch}` : `Nueva ${terms.branch}`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={branchForm.name}
                onChange={(e) => setBranchForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder={`Nombre de la ${terms.branch.toLowerCase()}`}
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
            <DialogTitle>{editingUser ? `Editar ${terms.professional}` : `Nuevo ${terms.professional}`}</DialogTitle>
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
                  <SelectItem value="admin">{terms.role.admin}</SelectItem>
                  <SelectItem value="stylist">{terms.role.stylist}</SelectItem>
                  <SelectItem value="receptionist">{terms.role.receptionist}</SelectItem>
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
              Nueva Categoría de {categoryType === 'service' ? terms.service : 'Producto'}
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
