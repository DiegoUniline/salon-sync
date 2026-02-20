import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { usePermissions } from '@/hooks/usePermissions';
import api from '@/lib/api';
import { getRoles, saveRoles, type Role, createEmptyPermissions, modules } from '@/lib/permissions';
import type { ModuleId, ModulePermissions } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Building2,
  Users,
  Tag,
  Plus,
  Edit,
  Trash2,
  Phone,
  MapPin,
  Mail,
  Loader2,
  Shield,
  Copy,
  Search,
  Scissors,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';

// ====== Types ======
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

export default function Catalogos() {
  const { terms, branches: contextBranches } = useApp();
  const { canView } = usePermissions();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Data
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRolesState] = useState<Role[]>([]);
  const [serviceCategories, setServiceCategories] = useState<Category[]>([]);
  const [productCategories, setProductCategories] = useState<Category[]>([]);

  // Dialogs
  const [isBranchDialogOpen, setIsBranchDialogOpen] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [categoryType, setCategoryType] = useState<'service' | 'product'>('service');

  // Editing
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Forms
  const [branchForm, setBranchForm] = useState({ name: '', address: '', phone: '', email: '' });
  const [userForm, setUserForm] = useState({
    name: '', email: '', phone: '', password: '', role: 'stylist', color: '#c97f67', branch_id: ''
  });
  const [roleForm, setRoleForm] = useState({
    name: '', description: '', color: '#3B82F6', permissions: createEmptyPermissions()
  });
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [branchesData, usersData, serviceCatsData, productCatsData] = await Promise.all([
        api.branches.getAll().catch(() => []),
        api.users.getAll().catch(() => []),
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
      setServiceCategories((serviceCatsData || []).map((c: any) => ({
        id: c.id || c.name, name: c.name || c, type: 'service' as const,
      })));
      setProductCategories((productCatsData || []).map((c: any) => ({
        id: c.id || c.name, name: c.name || c, type: 'product' as const,
      })));

      // Load roles from local storage / API
      try {
        const apiRoles = await api.roles.getAll();
        if (apiRoles && Array.isArray(apiRoles) && apiRoles.length > 0) {
          setRolesState(apiRoles);
        } else {
          setRolesState(getRoles());
        }
      } catch {
        setRolesState(getRoles());
      }
    } catch (error) {
      console.error('Error loading catalog data:', error);
      toast.error('Error al cargar catálogos');
    } finally {
      setLoading(false);
    }
  };

  // ====== BRANCH CRUD ======
  const openBranchDialog = (branch?: Branch) => {
    if (branch) {
      setEditingBranch(branch);
      setBranchForm({ name: branch.name, address: branch.address, phone: branch.phone, email: branch.email || '' });
    } else {
      setEditingBranch(null);
      setBranchForm({ name: '', address: '', phone: '', email: '' });
    }
    setIsBranchDialogOpen(true);
  };

  const saveBranch = async () => {
    if (!branchForm.name) { toast.error('El nombre es requerido'); return; }
    setSaving(true);
    try {
      if (editingBranch) {
        await api.branches.update(editingBranch.id, branchForm);
        setBranches(prev => prev.map(b => b.id === editingBranch.id ? { ...b, ...branchForm } : b));
        toast.success(`${terms.branch} actualizada`);
      } else {
        const newBranch = await api.branches.create(branchForm);
        setBranches(prev => [...prev, newBranch]);
        toast.success(`${terms.branch} creada`);
      }
      setIsBranchDialogOpen(false);
    } catch (error: any) {
      toast.error(error?.message || `Error al guardar ${terms.branch.toLowerCase()}`);
    } finally { setSaving(false); }
  };

  const deleteBranch = async (id: string) => {
    if (!confirm(`¿Eliminar esta ${terms.branch.toLowerCase()}?`)) return;
    try {
      await api.branches.delete(id);
      setBranches(prev => prev.filter(b => b.id !== id));
      toast.success(`${terms.branch} eliminada`);
    } catch (error: any) {
      toast.error(error?.message || `Error al eliminar ${terms.branch.toLowerCase()}`);
    }
  };

  // ====== USER CRUD ======
  const openUserDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setUserForm({
        name: user.name, email: user.email, phone: user.phone || '', password: '',
        role: user.role, color: user.color, branch_id: user.branch_id || ''
      });
    } else {
      setEditingUser(null);
      setUserForm({ name: '', email: '', phone: '', password: '', role: 'stylist', color: '#c97f67', branch_id: '' });
    }
    setIsUserDialogOpen(true);
  };

  const saveUser = async () => {
    if (!userForm.name) { toast.error('El nombre es requerido'); return; }
    if (!userForm.email) { toast.error('El email es requerido'); return; }
    if (!editingUser && !userForm.password) { toast.error('La contraseña es requerida'); return; }

    setSaving(true);
    try {
      const userData = {
        name: userForm.name, email: userForm.email, phone: userForm.phone,
        role: userForm.role, color: userForm.color,
        branch_id: userForm.branch_id || undefined,
        ...(userForm.password ? { password: userForm.password } : {}),
      };

      if (editingUser) {
        await api.users.update(editingUser.id, userData);
        setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...userData } : u));
        toast.success('Usuario actualizado');
      } else {
        const newUser = await api.users.create(userData);
        setUsers(prev => [...prev, {
          id: newUser.id, name: newUser.name, email: newUser.email,
          phone: newUser.phone, role: newUser.role || 'stylist',
          color: newUser.color || '#c97f67', active: true, branch_id: newUser.branch_id,
        }]);
        toast.success('Usuario creado');
      }
      setIsUserDialogOpen(false);
    } catch (error: any) {
      toast.error(error?.message || 'Error al guardar usuario');
    } finally { setSaving(false); }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    try {
      await api.users.delete(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      toast.success('Usuario eliminado');
    } catch (error: any) {
      toast.error(error?.message || 'Error al eliminar usuario');
    }
  };

  // ====== ROLE CRUD ======
  const openRoleDialog = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setRoleForm({
        name: role.name, description: role.description,
        color: role.color, permissions: JSON.parse(JSON.stringify(role.permissions))
      });
    } else {
      setEditingRole(null);
      setRoleForm({
        name: '', description: '', color: '#3B82F6', permissions: createEmptyPermissions()
      });
    }
    setIsRoleDialogOpen(true);
  };

  const saveRole = async () => {
    if (!roleForm.name) { toast.error('El nombre es requerido'); return; }
    setSaving(true);
    try {
      if (editingRole) {
        const updated: Role = { ...editingRole, ...roleForm };
        try {
          await api.roles.update(editingRole.id, roleForm);
        } catch { /* fallback to local */ }
        setRolesState(prev => {
          const newRoles = prev.map(r => r.id === editingRole.id ? updated : r);
          saveRoles(newRoles);
          return newRoles;
        });
        toast.success('Rol actualizado');
      } else {
        const newRole: Role = {
          id: `role_${Date.now()}`,
          ...roleForm,
          isSystem: false,
        };
        try {
          const apiResult = await api.roles.create(roleForm);
          if (apiResult?.id) newRole.id = apiResult.id;
        } catch { /* fallback to local */ }
        setRolesState(prev => {
          const newRoles = [...prev, newRole];
          saveRoles(newRoles);
          return newRoles;
        });
        toast.success('Rol creado');
      }
      setIsRoleDialogOpen(false);
    } catch (error: any) {
      toast.error(error?.message || 'Error al guardar rol');
    } finally { setSaving(false); }
  };

  const duplicateRole = (role: Role) => {
    const newRole: Role = {
      ...JSON.parse(JSON.stringify(role)),
      id: `role_${Date.now()}`,
      name: `${role.name} (copia)`,
      isSystem: false,
    };
    setRolesState(prev => {
      const newRoles = [...prev, newRole];
      saveRoles(newRoles);
      return newRoles;
    });
    toast.success('Rol duplicado');
  };

  const deleteRole = (id: string) => {
    const role = roles.find(r => r.id === id);
    if (role?.isSystem) { toast.error('No se puede eliminar un rol del sistema'); return; }
    if (!confirm('¿Eliminar este rol?')) return;
    try { api.roles.delete(id).catch(() => {}); } catch {}
    setRolesState(prev => {
      const newRoles = prev.filter(r => r.id !== id);
      saveRoles(newRoles);
      return newRoles;
    });
    toast.success('Rol eliminado');
  };

  const togglePermission = (moduleId: string, action: keyof ModulePermissions) => {
    setRoleForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [moduleId]: {
          ...prev.permissions[moduleId as ModuleId],
          [action]: !prev.permissions[moduleId as ModuleId]?.[action],
        }
      }
    }));
  };

  const toggleAllModule = (moduleId: string, enabled: boolean) => {
    setRoleForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [moduleId]: { view: enabled, create: enabled, edit: enabled, delete: enabled }
      }
    }));
  };

  // ====== CATEGORY CRUD ======
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
    if (!newCategory) { toast.error('El nombre es requerido'); return; }
    setSaving(true);
    try {
      if (editingCategory) {
        if (categoryType === 'service') {
          await api.services.updateCategory(editingCategory.id, { name: newCategory });
          setServiceCategories(prev => prev.map(c => c.id === editingCategory.id ? { ...c, name: newCategory } : c));
        } else {
          await api.products.updateCategory(editingCategory.id, { name: newCategory });
          setProductCategories(prev => prev.map(c => c.id === editingCategory.id ? { ...c, name: newCategory } : c));
        }
        toast.success('Categoría actualizada');
      } else {
        if (categoryType === 'service') {
          const result = await api.services.createCategory({ name: newCategory });
          setServiceCategories(prev => [...prev, { id: result?.id || newCategory, name: newCategory, type: 'service' }]);
        } else {
          const result = await api.products.createCategory({ name: newCategory });
          setProductCategories(prev => [...prev, { id: result?.id || newCategory, name: newCategory, type: 'product' }]);
        }
        toast.success('Categoría creada');
      }
      setIsCategoryDialogOpen(false);
    } catch (error: any) {
      toast.error(error?.message || 'Error al guardar categoría');
    } finally { setSaving(false); }
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
      toast.error(error?.message || 'Error al eliminar categoría');
    }
  };

  // Filtered data
  const filteredBranches = branches.filter(b =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredRoles = roles.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Catálogos</h1>
          <p className="text-muted-foreground">Administra {terms.branches.toLowerCase()}, usuarios, roles y categorías</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs defaultValue="branches" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="branches" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">{terms.branches}</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Usuarios</span>
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Roles</span>
          </TabsTrigger>
          <TabsTrigger value="service-categories" className="gap-2">
            <Scissors className="h-4 w-4" />
            <span className="hidden sm:inline">Cat. {terms.services}</span>
          </TabsTrigger>
          <TabsTrigger value="product-categories" className="gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Cat. Productos</span>
          </TabsTrigger>
        </TabsList>

        {/* ====== BRANCHES TAB ====== */}
        <TabsContent value="branches" className="space-y-4">
          <div className="flex justify-end">
            <Button className="gradient-bg border-0" onClick={() => openBranchDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva {terms.branch}
            </Button>
          </div>

          {filteredBranches.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No hay {terms.branches.toLowerCase()}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="hidden sm:table-cell">Dirección</TableHead>
                    <TableHead className="hidden sm:table-cell">Teléfono</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="w-[100px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBranches.map(branch => (
                    <TableRow key={branch.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-primary" />
                          {branch.name}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{branch.address || '—'}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{branch.phone || '—'}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{branch.email || '—'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openBranchDialog(branch)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteBranch(branch.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* ====== USERS TAB ====== */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-end">
            <Button className="gradient-bg border-0" onClick={() => openUserDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Usuario
            </Button>
          </div>

          {filteredUsers.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No hay usuarios</p>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead className="hidden sm:table-cell">Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead className="hidden md:table-cell">{terms.branch}</TableHead>
                    <TableHead className="hidden sm:table-cell">Estado</TableHead>
                    <TableHead className="w-[100px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map(user => {
                    const branchName = branches.find(b => b.id === user.branch_id)?.name;
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div
                              className="h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                              style={{ backgroundColor: user.color }}
                            >
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-xs text-muted-foreground sm:hidden">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {terms.role[user.role as keyof typeof terms.role] || user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{branchName || 'Todas'}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant={user.active ? 'default' : 'destructive'}>
                            {user.active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openUserDialog(user)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteUser(user.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* ====== ROLES TAB ====== */}
        <TabsContent value="roles" className="space-y-4">
          <div className="flex justify-end">
            <Button className="gradient-bg border-0" onClick={() => openRoleDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Rol
            </Button>
          </div>

          {filteredRoles.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Shield className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No hay roles</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredRoles.map(role => {
                const permCount = Object.values(role.permissions).filter(p => p.view).length;
                return (
                  <Card key={role.id} className="glass-card">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-3">
                          <div className="h-4 w-4 rounded-full" style={{ backgroundColor: role.color }} />
                          <div>
                            <p className="text-sm">{role.name}</p>
                            {role.isSystem && (
                              <Badge variant="outline" className="text-[10px] mt-1">Sistema</Badge>
                            )}
                          </div>
                        </span>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => duplicateRole(role)} title="Duplicar">
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openRoleDialog(role)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          {!role.isSystem && (
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteRole(role.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      <p>{role.description}</p>
                      <p className="mt-2 text-xs">{permCount} módulos con acceso</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ====== SERVICE CATEGORIES TAB ====== */}
        <TabsContent value="service-categories" className="space-y-4">
          <div className="flex justify-end">
            <Button className="gradient-bg border-0" onClick={() => openCategoryDialog('service')}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Categoría
            </Button>
          </div>

          {serviceCategories.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Tag className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No hay categorías de {terms.services.toLowerCase()}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="w-[100px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviceCategories.map(cat => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Scissors className="h-4 w-4 text-primary" />
                          {cat.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openCategoryDialog('service', cat)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteCategory('service', cat)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* ====== PRODUCT CATEGORIES TAB ====== */}
        <TabsContent value="product-categories" className="space-y-4">
          <div className="flex justify-end">
            <Button className="gradient-bg border-0" onClick={() => openCategoryDialog('product')}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Categoría
            </Button>
          </div>

          {productCategories.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Tag className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No hay categorías de productos</p>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="w-[100px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productCategories.map(cat => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-primary" />
                          {cat.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openCategoryDialog('product', cat)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteCategory('product', cat)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ====== BRANCH DIALOG ====== */}
      <Dialog open={isBranchDialogOpen} onOpenChange={setIsBranchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBranch ? `Editar ${terms.branch}` : `Nueva ${terms.branch}`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input value={branchForm.name} onChange={(e) => setBranchForm(prev => ({ ...prev, name: e.target.value }))} placeholder={`Nombre de la ${terms.branch.toLowerCase()}`} />
            </div>
            <div className="space-y-2">
              <Label>Dirección</Label>
              <Input value={branchForm.address} onChange={(e) => setBranchForm(prev => ({ ...prev, address: e.target.value }))} placeholder="Dirección completa" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input value={branchForm.phone} onChange={(e) => setBranchForm(prev => ({ ...prev, phone: e.target.value }))} placeholder="555-0000" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={branchForm.email} onChange={(e) => setBranchForm(prev => ({ ...prev, email: e.target.value }))} placeholder="sucursal@email.com" type="email" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsBranchDialogOpen(false)} disabled={saving}>Cancelar</Button>
              <Button className="gradient-bg border-0" onClick={saveBranch} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ====== USER DIALOG ====== */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input value={userForm.name} onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Nombre completo" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input value={userForm.email} onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))} placeholder="email@ejemplo.com" type="email" />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input value={userForm.phone} onChange={(e) => setUserForm(prev => ({ ...prev, phone: e.target.value }))} placeholder="555-0000" />
              </div>
            </div>
            {!editingUser && (
              <div className="space-y-2">
                <Label>Contraseña *</Label>
                <Input value={userForm.password} onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))} placeholder="Contraseña" type="password" />
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select value={userForm.role} onValueChange={(v) => setUserForm(prev => ({ ...prev, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {roles.map(r => (
                      <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{terms.branch}</Label>
                <Select value={userForm.branch_id || 'all'} onValueChange={(v) => setUserForm(prev => ({ ...prev, branch_id: v === 'all' ? '' : v }))}>
                  <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
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
                <input type="color" value={userForm.color} onChange={(e) => setUserForm(prev => ({ ...prev, color: e.target.value }))} className="h-10 w-20 rounded border cursor-pointer" />
                <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: userForm.color }}>
                  {userForm.name?.charAt(0) || 'U'}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsUserDialogOpen(false)} disabled={saving}>Cancelar</Button>
              <Button className="gradient-bg border-0" onClick={saveUser} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ====== ROLE DIALOG ====== */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRole ? 'Editar Rol' : 'Nuevo Rol'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input value={roleForm.name} onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Nombre del rol" />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={roleForm.color} onChange={(e) => setRoleForm(prev => ({ ...prev, color: e.target.value }))} className="h-10 w-14 rounded border cursor-pointer" />
                  <div className="h-6 w-6 rounded-full" style={{ backgroundColor: roleForm.color }} />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input value={roleForm.description} onChange={(e) => setRoleForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Descripción del rol" />
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold">Permisos por módulo</Label>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Módulo</TableHead>
                      <TableHead className="text-center w-16">Ver</TableHead>
                      <TableHead className="text-center w-16">Crear</TableHead>
                      <TableHead className="text-center w-16">Editar</TableHead>
                      <TableHead className="text-center w-16">Eliminar</TableHead>
                      <TableHead className="text-center w-16">Todos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modules.filter(m => m.id !== 'superadmin').map(mod => {
                      const perms = roleForm.permissions[mod.id as ModuleId];
                      const allEnabled = perms?.view && perms?.create && perms?.edit && perms?.delete;
                      return (
                        <TableRow key={mod.id}>
                          <TableCell className="font-medium">
                            <span className="mr-2">{mod.icon}</span>
                            {mod.name}
                          </TableCell>
                          {(['view', 'create', 'edit', 'delete'] as const).map(action => (
                            <TableCell key={action} className="text-center">
                              <Checkbox
                                checked={perms?.[action] || false}
                                onCheckedChange={() => togglePermission(mod.id, action)}
                              />
                            </TableCell>
                          ))}
                          <TableCell className="text-center">
                            <Checkbox
                              checked={allEnabled || false}
                              onCheckedChange={(checked) => toggleAllModule(mod.id, !!checked)}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)} disabled={saving}>Cancelar</Button>
              <Button className="gradient-bg border-0" onClick={saveRole} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ====== CATEGORY DIALOG ====== */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'} de {categoryType === 'service' ? terms.services : 'Productos'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Nombre de la categoría" />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)} disabled={saving}>Cancelar</Button>
              <Button className="gradient-bg border-0" onClick={saveCategory} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
