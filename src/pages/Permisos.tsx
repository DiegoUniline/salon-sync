import { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  Plus, 
  Pencil, 
  Trash2, 
  Save,
  X,
  Check,
  Eye,
  PlusCircle,
  Edit,
  Trash,
  Settings,
  ChevronDown,
  ChevronRight,
  UserCog,
  Copy,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import {
  modules,
  actions,
  type ModuleId,
  type ModulePermissions,
  createEmptyPermissions,
} from '@/lib/permissions';

// Types from API
interface Role {
  id: string;
  name: string;
  description: string;
  color: string;
  permissions: Record<ModuleId, ModulePermissions>;
}

interface UserWithRole {
  id: string;
  name: string;
  email: string;
  roleId: string;
  role?: Role;
  branchId?: string;
  branch?: { id: string; name: string };
  active: boolean;
}

interface Branch {
  id: string;
  name: string;
}

const actionIcons = {
  view: Eye,
  create: PlusCircle,
  edit: Edit,
  delete: Trash,
};

const colorOptions = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', 
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
];

export default function Permisos() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Dialogs
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  
  // Expanded modules for permissions editor
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  
  // Form states
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    permissions: createEmptyPermissions(),
  });
  
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    roleId: '',
    branchId: '',
    active: true,
  });

  // Load data from API
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rolesData, usersData, branchesData] = await Promise.all([
        api.roles.getAll(),
        api.roles.getUsersList(),
        api.branches.getAll(),
      ]);
      
      // Normalize roles data
      const normalizedRoles = (rolesData.roles || rolesData || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        description: r.description || '',
        color: r.color || '#3B82F6',
        permissions: r.permissions || createEmptyPermissions(),
      }));
      
      // Normalize users data
      const normalizedUsers = (usersData.users || usersData || []).map((u: any) => ({
        id: u.id,
        name: u.name || u.full_name,
        email: u.email,
        roleId: u.role_id || u.roleId || '',
        role: u.role,
        branchId: u.branch_id || u.branchId,
        branch: u.branch,
        active: u.active !== false,
      }));
      
      setRoles(normalizedRoles);
      setUsers(normalizedUsers);
      setBranches(branchesData.branches || branchesData || []);
    } catch (error) {
      console.error('Error loading permissions data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  // Role handlers
  const openRoleDialog = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setRoleForm({
        name: role.name,
        description: role.description,
        color: role.color,
        permissions: JSON.parse(JSON.stringify(role.permissions)),
      });
    } else {
      setEditingRole(null);
      setRoleForm({
        name: '',
        description: '',
        color: '#3B82F6',
        permissions: createEmptyPermissions(),
      });
    }
    setRoleDialogOpen(true);
  };

  const handleSaveRole = async () => {
    if (!roleForm.name.trim()) {
      toast.error('El nombre del rol es requerido');
      return;
    }

    try {
      setSaving(true);
      
      const roleData = {
        name: roleForm.name,
        description: roleForm.description,
        color: roleForm.color,
        permissions: roleForm.permissions,
      };

      if (editingRole) {
        await api.roles.update(editingRole.id, roleData);
        toast.success('Rol actualizado');
      } else {
        await api.roles.create(roleData);
        toast.success('Rol creado');
      }
      
      setRoleDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar el rol');
    } finally {
      setSaving(false);
    }
  };

  const deleteRole = async (roleId: string) => {
    const usersWithRole = users.filter(u => u.roleId === roleId);
    if (usersWithRole.length > 0) {
      toast.error(`No se puede eliminar: ${usersWithRole.length} usuario(s) tienen este rol asignado`);
      return;
    }
    
    try {
      await api.roles.delete(roleId);
      toast.success('Rol eliminado');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar el rol');
    }
  };

  const duplicateRole = async (role: Role) => {
    try {
      await api.roles.duplicate(role.id);
      toast.success('Rol duplicado');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Error al duplicar el rol');
    }
  };

  const togglePermission = (moduleId: ModuleId, action: keyof ModulePermissions) => {
    setRoleForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [moduleId]: {
          ...prev.permissions[moduleId],
          [action]: !prev.permissions[moduleId][action],
        },
      },
    }));
  };

  const toggleAllModulePermissions = (moduleId: ModuleId, enabled: boolean) => {
    setRoleForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [moduleId]: {
          view: enabled,
          create: enabled,
          edit: enabled,
          delete: enabled,
        },
      },
    }));
  };

  const toggleAllPermissions = (enabled: boolean) => {
    const newPermissions = createEmptyPermissions();
    modules.forEach(m => {
      newPermissions[m.id] = { view: enabled, create: enabled, edit: enabled, delete: enabled };
    });
    setRoleForm(prev => ({ ...prev, permissions: newPermissions }));
  };

  // User handlers
  const openUserDialog = (user?: UserWithRole) => {
    if (user) {
      setEditingUser(user);
      setUserForm({
        name: user.name,
        email: user.email,
        password: '',
        roleId: user.roleId,
        branchId: user.branchId || '',
        active: user.active,
      });
    } else {
      setEditingUser(null);
      setUserForm({
        name: '',
        email: '',
        password: '',
        roleId: '',
        branchId: '',
        active: true,
      });
    }
    setUserDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!userForm.roleId) {
      toast.error('El rol es requerido');
      return;
    }

    try {
      setSaving(true);
      
      if (editingUser) {
        // Update user role assignment
        await api.roles.assignRole({
          user_id: editingUser.id,
          role_id: userForm.roleId,
        });
        toast.success('Rol de usuario actualizado');
      } else {
        toast.error('Para crear usuarios, usa el módulo de usuarios');
      }
      
      setUserDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const deleteUserRole = async (userId: string) => {
    try {
      await api.roles.removeRole(userId);
      toast.success('Rol removido del usuario');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Error al remover rol');
    }
  };

  const getRoleById = (roleId: string) => roles.find(r => r.id === roleId);

  const countPermissions = (permissions: Record<ModuleId, ModulePermissions>) => {
    let count = 0;
    modules.forEach(m => {
      actions.forEach(a => {
        if (permissions[m.id]?.[a.id]) count++;
      });
    });
    return count;
  };

  const totalPermissions = modules.length * actions.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Permisos y Roles
          </h1>
          <p className="text-muted-foreground">
            Gestiona los roles del sistema y los permisos de cada usuario
          </p>
        </div>
      </div>

      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="roles" className="gap-2">
            <Shield className="h-4 w-4" />
            Roles ({roles.length})
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Usuarios ({users.length})
          </TabsTrigger>
        </TabsList>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openRoleDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Rol
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {roles.map(role => (
              <Card key={role.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-4 w-4 rounded-full" 
                      style={{ backgroundColor: role.color }}
                    />
                    <CardTitle className="text-lg">{role.name}</CardTitle>
                  </div>
                  <CardDescription>{role.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Permisos activos:</span>
                      <Badge variant="outline">
                        {countPermissions(role.permissions)} / {totalPermissions}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {modules.filter(m => role.permissions[m.id]?.view).slice(0, 5).map(m => (
                        <Badge key={m.id} variant="secondary" className="text-xs">
                          {m.icon} {m.name}
                        </Badge>
                      ))}
                      {modules.filter(m => role.permissions[m.id]?.view).length > 5 && (
                        <Badge variant="secondary" className="text-xs">
                          +{modules.filter(m => role.permissions[m.id]?.view).length - 5}
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1"
                        onClick={() => openRoleDialog(role)}
                      >
                        <Pencil className="h-3 w-3" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => duplicateRole(role)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteRole(role.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Sucursal</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => {
                  const role = user.role || getRoleById(user.roleId);
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <UserCog className="h-4 w-4 text-muted-foreground" />
                          {user.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        {role && (
                          <Badge 
                            style={{ backgroundColor: role.color, color: 'white' }}
                          >
                            {role.name}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{user.branch?.name || 'Todas'}</TableCell>
                      <TableCell>
                        <Badge variant={user.active ? "default" : "secondary"}>
                          {user.active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openUserDialog(user)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteUserRole(user.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? 'Editar Rol' : 'Nuevo Rol'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="roleName">Nombre del Rol *</Label>
                <Input
                  id="roleName"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Administrador"
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`h-8 w-8 rounded-full border-2 transition-transform ${roleForm.color === color ? 'border-foreground scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setRoleForm(prev => ({ ...prev, color }))}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="roleDescription">Descripción</Label>
              <Textarea
                id="roleDescription"
                value={roleForm.description}
                onChange={(e) => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe las responsabilidades de este rol"
                rows={2}
              />
            </div>

            {/* Permissions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Permisos por Módulo</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => toggleAllPermissions(true)}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Todos
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => toggleAllPermissions(false)}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Ninguno
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg divide-y">
                {modules.map(module => {
                  const isExpanded = expandedModules.includes(module.id);
                  const modulePerms = roleForm.permissions[module.id] || { view: false, create: false, edit: false, delete: false };
                  const activeCount = Object.values(modulePerms).filter(Boolean).length;
                  
                  return (
                    <Collapsible
                      key={module.id}
                      open={isExpanded}
                      onOpenChange={(open) => {
                        setExpandedModules(prev => 
                          open ? [...prev, module.id] : prev.filter(id => id !== module.id)
                        );
                      }}
                    >
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="text-lg">{module.icon}</span>
                          <span className="font-medium">{module.name}</span>
                        </div>
                        <Badge variant={activeCount > 0 ? "default" : "secondary"}>
                          {activeCount} / {actions.length}
                        </Badge>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-10 pb-3 pt-1">
                          <div className="flex items-center gap-2 mb-3">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleAllModulePermissions(module.id, true)}
                              className="text-xs h-7"
                            >
                              Activar todos
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleAllModulePermissions(module.id, false)}
                              className="text-xs h-7"
                            >
                              Desactivar todos
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {actions.map(action => {
                              const ActionIcon = actionIcons[action.id];
                              return (
                                <div
                                  key={action.id}
                                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                                    modulePerms[action.id] ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                                  }`}
                                  onClick={() => togglePermission(module.id, action.id)}
                                >
                                  <Checkbox
                                    checked={modulePerms[action.id]}
                                    onCheckedChange={() => togglePermission(module.id, action.id)}
                                  />
                                  <ActionIcon className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{action.name}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveRole} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingRole ? 'Guardar Cambios' : 'Crear Rol'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Role Dialog */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Cambiar Rol de Usuario' : 'Asignar Rol'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {editingUser && (
              <div className="space-y-2">
                <Label>Usuario</Label>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">{editingUser.name}</p>
                  <p className="text-sm text-muted-foreground">{editingUser.email}</p>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="userRole">Rol *</Label>
              <Select
                value={userForm.roleId}
                onValueChange={(value) => setUserForm(prev => ({ ...prev, roleId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-3 w-3 rounded-full" 
                          style={{ backgroundColor: role.color }}
                        />
                        {role.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUserDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveUser} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
