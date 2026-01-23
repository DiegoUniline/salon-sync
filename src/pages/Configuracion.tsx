import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { usePermissions } from '@/hooks/usePermissions';
import api from '@/lib/api';
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
  Apple,
  Stethoscope,
  Eye,
  Loader2,
  Upload,
  Image,
  Mail,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  email?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  color: string;
  active: boolean;
  branch_id?: string;
}

interface Category {
  id: string;
  name: string;
  type: 'service' | 'product';
}

// Get the appropriate icon for services based on business type
const getServiceIcon = (type: BusinessType) => {
  switch (type) {
    case 'salon': return Scissors;
    case 'nutrition': return Apple;
    case 'medical': return Stethoscope;
    default: return Scissors;
  }
};

export default function Configuracion() {
  const { businessConfig, updateBusinessConfig, terms, branches: contextBranches } = useApp();
  const { currentUser } = usePermissions();
  
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [serviceCategories, setServiceCategories] = useState<Category[]>([]);
  const [productCategories, setProductCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [isBranchDialogOpen, setIsBranchDialogOpen] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [categoryType, setCategoryType] = useState<'service' | 'product'>('service');
  
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [branchForm, setBranchForm] = useState({ name: '', address: '', phone: '', email: '' });
  const [userForm, setUserForm] = useState({ 
    name: '', 
    email: '',
    phone: '',
    password: '',
    role: 'stylist', 
    color: '#c97f67',
    branch_id: ''
  });
  const [newCategory, setNewCategory] = useState('');
  
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Load data from API
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [branchesData, usersData, serviceCatsData, productCatsData] = await Promise.all([
        api.branches.getAll(),
        api.users.getAll(),
        api.services.getCategories().catch(() => []),
        api.products.getCategories().catch(() => []),
      ]);
      
      setBranches(branchesData || []);
      setUsers((usersData || []).map((u: any) => ({
        id: u.id,
        name: u.name || u.full_name,
        email: u.email,
        phone: u.phone,
        role: u.role || 'stylist',
        color: u.color || '#c97f67',
        active: u.active !== false,
        branch_id: u.branch_id,
      })));
      
      // Map categories
      setServiceCategories((serviceCatsData || []).map((c: any) => ({
        id: c.id || c.name,
        name: c.name || c,
        type: 'service' as const,
      })));
      setProductCategories((productCatsData || []).map((c: any) => ({
        id: c.id || c.name,
        name: c.name || c,
        type: 'product' as const,
      })));
    } catch (error) {
      console.error('Error loading config data:', error);
      toast.error('Error al cargar datos de configuración');
    } finally {
      setLoading(false);
    }
  };

  // Branch handlers
  const openBranchDialog = (branch?: Branch) => {
    if (branch) {
      setEditingBranch(branch);
      setBranchForm({ 
        name: branch.name, 
        address: branch.address, 
        phone: branch.phone,
        email: branch.email || ''
      });
    } else {
      setEditingBranch(null);
      setBranchForm({ name: '', address: '', phone: '', email: '' });
    }
    setIsBranchDialogOpen(true);
  };

  const saveBranch = async () => {
    if (!branchForm.name) {
      toast.error('El nombre es requerido');
      return;
    }

    setSaving(true);
    try {
      if (editingBranch) {
        await api.branches.update(editingBranch.id, branchForm);
        setBranches(prev => prev.map(b => 
          b.id === editingBranch.id ? { ...b, ...branchForm } : b
        ));
        toast.success(`${terms.branch} actualizada`);
      } else {
        const newBranch = await api.branches.create(branchForm);
        setBranches(prev => [...prev, newBranch]);
        toast.success(`${terms.branch} creada`);
      }
      setIsBranchDialogOpen(false);
    } catch (error: any) {
      console.error('Error saving branch:', error);
      toast.error(error?.message || `Error al guardar ${terms.branch.toLowerCase()}`);
    } finally {
      setSaving(false);
    }
  };

  const deleteBranch = async (id: string) => {
    if (!confirm(`¿Eliminar esta ${terms.branch.toLowerCase()}?`)) return;
    
    try {
      await api.branches.delete(id);
      setBranches(prev => prev.filter(b => b.id !== id));
      toast.success(`${terms.branch} eliminada`);
    } catch (error: any) {
      console.error('Error deleting branch:', error);
      toast.error(error?.message || `Error al eliminar ${terms.branch.toLowerCase()}`);
    }
  };

  // User handlers
  const openUserDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setUserForm({ 
        name: user.name, 
        email: user.email,
        phone: user.phone || '',
        password: '',
        role: user.role, 
        color: user.color,
        branch_id: user.branch_id || ''
      });
    } else {
      setEditingUser(null);
      setUserForm({ name: '', email: '', phone: '', password: '', role: 'stylist', color: '#c97f67', branch_id: '' });
    }
    setIsUserDialogOpen(true);
  };

  const saveUser = async () => {
    if (!userForm.name) {
      toast.error('El nombre es requerido');
      return;
    }
    if (!userForm.email) {
      toast.error('El email es requerido');
      return;
    }
    if (!editingUser && !userForm.password) {
      toast.error('La contraseña es requerida para nuevos usuarios');
      return;
    }

    setSaving(true);
    try {
      const userData = {
        name: userForm.name,
        email: userForm.email,
        phone: userForm.phone,
        role: userForm.role,
        color: userForm.color,
        branch_id: userForm.branch_id || undefined,
        ...(userForm.password ? { password: userForm.password } : {}),
      };

      if (editingUser) {
        await api.users.update(editingUser.id, userData);
        setUsers(prev => prev.map(u => 
          u.id === editingUser.id ? { ...u, ...userData } : u
        ));
        toast.success('Usuario actualizado');
      } else {
        const newUser = await api.users.create(userData);
        setUsers(prev => [...prev, {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role || 'stylist',
          color: newUser.color || '#c97f67',
          active: true,
          branch_id: newUser.branch_id,
        }]);
        toast.success('Usuario creado');
      }
      setIsUserDialogOpen(false);
    } catch (error: any) {
      console.error('Error saving user:', error);
      toast.error(error?.message || 'Error al guardar usuario');
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    
    try {
      await api.users.delete(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      toast.success('Usuario eliminado');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error?.message || 'Error al eliminar usuario');
    }
  };

  // Category handlers
  const openCategoryDialog = (type: 'service' | 'product', category?: Category) => {
    setCategoryType(type);
    if (category) {
      setEditingCategory(category);
      setNewCategory(category.name);
    } else {
      setEditingCategory(null);
      setNewCategory('');
    }
    setIsCategoryDialogOpen(true);
  };

  const saveCategory = async () => {
    if (!newCategory) {
      toast.error('El nombre es requerido');
      return;
    }

    setSaving(true);
    try {
      if (editingCategory) {
        // Update category
        if (categoryType === 'service') {
          await api.services.updateCategory(editingCategory.id, { name: newCategory });
          setServiceCategories(prev => prev.map(c => 
            c.id === editingCategory.id ? { ...c, name: newCategory } : c
          ));
        } else {
          await api.products.updateCategory(editingCategory.id, { name: newCategory });
          setProductCategories(prev => prev.map(c => 
            c.id === editingCategory.id ? { ...c, name: newCategory } : c
          ));
        }
        toast.success('Categoría actualizada');
      } else {
        // Create category
        if (categoryType === 'service') {
          const result = await api.services.createCategory({ name: newCategory });
          setServiceCategories(prev => [...prev, {
            id: result?.id || newCategory,
            name: newCategory,
            type: 'service',
          }]);
        } else {
          const result = await api.products.createCategory({ name: newCategory });
          setProductCategories(prev => [...prev, {
            id: result?.id || newCategory,
            name: newCategory,
            type: 'product',
          }]);
        }
        toast.success('Categoría agregada');
      }
      setIsCategoryDialogOpen(false);
    } catch (error: any) {
      console.error('Error saving category:', error);
      toast.error(error?.message || 'Error al guardar categoría');
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (type: 'service' | 'product', category: Category) => {
    if (!confirm(`¿Eliminar la categoría "${category.name}"?`)) return;
    
    try {
      if (type === 'service') {
        await api.services.deleteCategory(category.id);
        setServiceCategories(prev => prev.filter(c => c.id !== category.id));
      } else {
        await api.products.deleteCategory(category.id);
        setProductCategories(prev => prev.filter(c => c.id !== category.id));
      }
      toast.success('Categoría eliminada');
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast.error(error?.message || 'Error al eliminar categoría');
    }
  };

  // Ticket field toggle
  const toggleTicketField = (fieldId: string) => {
    const newFields = businessConfig.ticketFields.map(f => 
      f.id === fieldId ? { ...f, enabled: !f.enabled } : f
    );
    updateBusinessConfig({ ticketFields: newFields });
  };

  // Logo upload handler
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten archivos de imagen');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen no puede ser mayor a 2MB');
      return;
    }

    try {
      // Convert to base64 for preview (in production, upload to storage)
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        updateBusinessConfig({ logo: base64 });
        toast.success('Logo actualizado');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Error al subir el logo');
    }
  };

  const removeLogo = () => {
    updateBusinessConfig({ logo: undefined });
    toast.success('Logo eliminado');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
              {/* Logo Upload Section */}
              <div className="space-y-2">
                <Label>Logo del negocio</Label>
                <div className="flex items-center gap-4">
                  {businessConfig.logo ? (
                    <div className="relative">
                      <img 
                        src={businessConfig.logo} 
                        alt="Logo" 
                        className="h-20 w-20 object-contain rounded-lg border"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={removeLogo}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="h-20 w-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      <Image className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {businessConfig.logo ? 'Cambiar logo' : 'Subir logo'}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG o SVG. Máximo 2MB.
                    </p>
                  </div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </div>
              </div>

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

          {branches.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No hay {terms.branches.toLowerCase()} registradas</p>
                <Button className="mt-4" onClick={() => openBranchDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar {terms.branch}
                </Button>
              </CardContent>
            </Card>
          ) : (
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
                    {branch.address && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {branch.address}
                      </div>
                    )}
                    {branch.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        {branch.phone}
                      </div>
                    )}
                    {branch.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        {branch.email}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Users */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-end">
            <Button className="gradient-bg border-0" onClick={() => openUserDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo {terms.professional}
            </Button>
          </div>

          {users.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No hay {terms.professionals.toLowerCase()} registrados</p>
                <Button className="mt-4" onClick={() => openUserDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar {terms.professional}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {users.map(user => (
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
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs mt-1">
                              {terms.role[user.role as keyof typeof terms.role] || user.role}
                            </Badge>
                            {!user.active && (
                              <Badge variant="destructive" className="text-xs mt-1">
                                Inactivo
                              </Badge>
                            )}
                          </div>
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
                  <CardContent className="text-sm text-muted-foreground">
                    <p>{user.email}</p>
                    {user.phone && <p>{user.phone}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Categories */}
        <TabsContent value="categories" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Service Categories */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {(() => {
                      const ServiceIcon = getServiceIcon(businessConfig.type);
                      return <ServiceIcon className="h-5 w-5 text-primary" />;
                    })()}
                    Categorías de {terms.services}
                  </span>
                  <Button size="sm" variant="outline" onClick={() => openCategoryDialog('service')}>
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {serviceCategories.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    No hay categorías de {terms.services.toLowerCase()}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {serviceCategories.map(cat => (
                      <Badge key={cat.id} variant="secondary" className="gap-1 pr-1">
                        {cat.name}
                        <button 
                          onClick={() => deleteCategory('service', cat)}
                          className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
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
                {productCategories.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    No hay categorías de productos
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {productCategories.map(cat => (
                      <Badge key={cat.id} variant="secondary" className="gap-1 pr-1">
                        {cat.name}
                        <button 
                          onClick={() => deleteCategory('product', cat)}
                          className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tickets */}
        <TabsContent value="tickets" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Settings */}
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
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
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

            {/* Live Preview */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Vista Previa del Ticket
                </CardTitle>
                <CardDescription>
                  Así se verá tu ticket impreso
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-white text-black rounded-lg p-4 font-mono text-xs max-h-[500px] overflow-y-auto shadow-inner">
                  {/* Header */}
                  <div className="text-center mb-3">
                    {businessConfig.ticketFields.find(f => f.id === 'logo')?.enabled && (
                      businessConfig.logo ? (
                        <img src={businessConfig.logo} alt="Logo" className="h-10 mx-auto mb-1" />
                      ) : (
                        <div className="text-3xl mb-1">{businessTypeIcons[businessConfig.type]}</div>
                      )
                    )}
                    {businessConfig.ticketFields.find(f => f.id === 'businessName')?.enabled && (
                      <div className="font-bold text-sm">{businessConfig.name || 'Mi Negocio'}</div>
                    )}
                    {businessConfig.ticketFields.find(f => f.id === 'address')?.enabled && businessConfig.address && (
                      <div className="text-[10px]">{businessConfig.address}</div>
                    )}
                    {businessConfig.ticketFields.find(f => f.id === 'phone')?.enabled && businessConfig.phone && (
                      <div className="text-[10px]">Tel: {businessConfig.phone}</div>
                    )}
                    {businessConfig.ticketFields.find(f => f.id === 'rfc')?.enabled && businessConfig.rfc && (
                      <div className="text-[10px]">RFC: {businessConfig.rfc}</div>
                    )}
                  </div>

                  <div className="border-t border-dashed border-gray-400 my-2" />

                  {/* Folio & Date */}
                  <div className="space-y-0.5">
                    {businessConfig.ticketFields.find(f => f.id === 'folio')?.enabled && (
                      <div className="flex justify-between">
                        <span>Folio:</span>
                        <span className="font-bold">#0001</span>
                      </div>
                    )}
                    {businessConfig.ticketFields.find(f => f.id === 'date')?.enabled && (
                      <div className="flex justify-between">
                        <span>Fecha:</span>
                        <span>{format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}</span>
                      </div>
                    )}
                    {businessConfig.ticketFields.find(f => f.id === 'clientName')?.enabled && (
                      <div className="flex justify-between">
                        <span>{terms.client}:</span>
                        <span>María García</span>
                      </div>
                    )}
                    {businessConfig.ticketFields.find(f => f.id === 'clientPhone')?.enabled && (
                      <div className="flex justify-between">
                        <span>Tel {terms.client}:</span>
                        <span>555-1234</span>
                      </div>
                    )}
                    {businessConfig.ticketFields.find(f => f.id === 'professional')?.enabled && (
                      <div className="flex justify-between">
                        <span>Atendió:</span>
                        <span>{terms.professional} Ejemplo</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-dashed border-gray-400 my-2" />

                  {/* Services */}
                  {businessConfig.ticketFields.find(f => f.id === 'services')?.enabled && (
                    <div className="mb-2">
                      <div className="font-bold mb-1">{terms.services.toUpperCase()}</div>
                      <div className="flex justify-between">
                        <span>1x {terms.service} Ejemplo</span>
                        <span>$350.00</span>
                      </div>
                    </div>
                  )}

                  {/* Products */}
                  {businessConfig.ticketFields.find(f => f.id === 'products')?.enabled && (
                    <div className="mb-2">
                      <div className="font-bold mb-1">PRODUCTOS</div>
                      <div className="flex justify-between">
                        <span>1x Producto Ejemplo</span>
                        <span>$150.00</span>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-dashed border-gray-400 my-2" />

                  {/* Totals */}
                  <div className="space-y-0.5">
                    {businessConfig.ticketFields.find(f => f.id === 'subtotal')?.enabled && (
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>$500.00</span>
                      </div>
                    )}
                    {businessConfig.ticketFields.find(f => f.id === 'discount')?.enabled && (
                      <div className="flex justify-between text-green-700">
                        <span>Descuento:</span>
                        <span>-$50.00</span>
                      </div>
                    )}
                    {businessConfig.ticketFields.find(f => f.id === 'total')?.enabled && (
                      <div className="flex justify-between font-bold text-sm pt-1 border-t border-gray-300">
                        <span>TOTAL:</span>
                        <span>$450.00</span>
                      </div>
                    )}
                  </div>

                  {/* Payment */}
                  {businessConfig.ticketFields.find(f => f.id === 'paymentMethod')?.enabled && (
                    <>
                      <div className="border-t border-dashed border-gray-400 my-2" />
                      <div className="flex justify-between">
                        <span>Pagó con:</span>
                        <span>Efectivo</span>
                      </div>
                    </>
                  )}

                  {/* Footer */}
                  {businessConfig.ticketFields.find(f => f.id === 'footer')?.enabled && businessConfig.ticketFooter && (
                    <>
                      <div className="border-t border-dashed border-gray-400 my-2" />
                      <div className="text-center text-[10px]">
                        {businessConfig.ticketFooter}
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
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
              <Label>Nombre *</Label>
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input
                  value={branchForm.phone}
                  onChange={(e) => setBranchForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="555-0000"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={branchForm.email}
                  onChange={(e) => setBranchForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="sucursal@email.com"
                  type="email"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsBranchDialogOpen(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button className="gradient-bg border-0" onClick={saveBranch} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Guardar
              </Button>
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
              <Label>Nombre *</Label>
              <Input
                value={userForm.name}
                onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nombre completo"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  value={userForm.email}
                  onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@ejemplo.com"
                  type="email"
                />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input
                  value={userForm.phone}
                  onChange={(e) => setUserForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="555-0000"
                />
              </div>
            </div>
            {!editingUser && (
              <div className="space-y-2">
                <Label>Contraseña *</Label>
                <Input
                  value={userForm.password}
                  onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Contraseña"
                  type="password"
                />
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select 
                  value={userForm.role} 
                  onValueChange={(v) => setUserForm(prev => ({ ...prev, role: v }))}
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
                <Label>{terms.branch}</Label>
                <Select 
                  value={userForm.branch_id} 
                  onValueChange={(v) => setUserForm(prev => ({ ...prev, branch_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    {branches.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
              <Button variant="outline" onClick={() => setIsUserDialogOpen(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button className="gradient-bg border-0" onClick={saveUser} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Editar' : 'Nueva'} Categoría de {categoryType === 'service' ? terms.service : 'Producto'}
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
              <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button className="gradient-bg border-0" onClick={saveCategory} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingCategory ? 'Guardar' : 'Agregar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
