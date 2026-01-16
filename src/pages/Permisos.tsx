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
  Copy
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
import { branches } from '@/lib/mockData';
import {
  modules,
  actions,
  type Role,
  type UserWithRole,
  type ModuleId,
  type ModulePermissions,
  getRoles,
  saveRoles,
  getUsersWithRoles,
  saveUsersWithRoles,
  createEmptyPermissions,
  defaultRoles,
} from '@/lib/permissions';

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
  const [roles, setRoles] = useState<Role[]>(getRoles);
  const [users, setUsers] = useState<UserWithRole[]>(getUsersWithRoles);
  
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

  // Persist changes
  useEffect(() => {
    saveRoles(roles);
  }, [roles]);

  useEffect(() => {
    saveUsersWithRoles(users);
  }, [users]);

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

  const handleSaveRole = () => {
    if (!roleForm.name.trim()) {
      toast.error('El nombre del rol es requerido');
      return;
    }

    if (editingRole) {
      setRoles(prev => prev.map(r => 
        r.id === editingRole.id 
          ? { ...r, name: roleForm.name, description: roleForm.description, color: roleForm.color, permissions: roleForm.permissions }
          : r
      ));
      toast.success('Rol actualizado');
    } else {
      const newRole: Role = {
        id: `role_${Date.now()}`,
        name: roleForm.name,
        description: roleForm.description,
        color: roleForm.color,
        isSystem: false,
        permissions: roleForm.permissions,
      };
      setRoles(prev => [...prev, newRole]);
      toast.success('Rol creado');
    }
    setRoleDialogOpen(false);
  };

  const deleteRole = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (role?.isSystem) {
      toast.error('No se pueden eliminar roles del sistema');
      return;
    }
    
    const usersWithRole = users.filter(u => u.roleId === roleId);
    if (usersWithRole.length > 0) {
      toast.error(`No se puede eliminar: ${usersWithRole.length} usuario(s) tienen este rol asignado`);
      return;
    }
    
    setRoles(prev => prev.filter(r => r.id !== roleId));
    toast.success('Rol eliminado');
  };

  const duplicateRole = (role: Role) => {
    const newRole: Role = {
      ...role,
      id: `role_${Date.now()}`,
      name: `${role.name} (copia)`,
      isSystem: false,
      permissions: JSON.parse(JSON.stringify(role.permissions)),
    };
    setRoles(prev => [...prev, newRole]);
    toast.success('Rol duplicado');
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
        password: user.password,
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

  const handleSaveUser = () => {
    if (!userForm.name.trim() || !userForm.email.trim() || !userForm.roleId) {
      toast.error('Nombre, email y rol son requeridos');
      return;
    }

    if (!editingUser && !userForm.password.trim()) {
      toast.error('La contraseña es requerida para nuevos usuarios');
      return;
    }

    if (editingUser) {
      setUsers(prev => prev.map(u => 
        u.id === editingUser.id 
          ? { ...u, ...userForm }
          : u
      ));
      toast.success('Usuario actualizado');
    } else {
      const newUser: UserWithRole = {
        id: `user_${Date.now()}`,
        ...userForm,
      };
      setUsers(prev => [...prev, newUser]);
      toast.success('Usuario creado');
    }
    setUserDialogOpen(false);
  };

  const deleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    toast.success('Usuario eliminado');
  };

  const toggleUserActive = (userId: string) => {
    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, active: !u.active } : u
    ));
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
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-4 w-4 rounded-full" 
                        style={{ backgroundColor: role.color }}
                      />
                      <CardTitle className="text-lg">{role.name}</CardTitle>
                    </div>
                    {role.isSystem && (
                      <Badge variant="secondary" className="text-xs">Sistema</Badge>
                    )}
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
                      {!role.isSystem && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteRole(role.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openUserDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Usuario
            </Button>
          </div>

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
                  const role = getRoleById(user.roleId);
                  const branch = branches.find(b => b.id === user.branchId);
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
                      <TableCell>{branch?.name || 'Todas'}</TableCell>
                      <TableCell>
                        <Switch
                          checked={user.active}
                          onCheckedChange={() => toggleUserActive(user.id)}
                        />
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
                            onClick={() => deleteUser(user.id)}
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
                  placeholder="Ej: Supervisor"
                  disabled={editingRole?.isSystem}
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`h-8 w-8 rounded-full transition-transform ${
                        roleForm.color === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                      }`}
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
                placeholder="Describe las responsabilidades de este rol..."
                rows={2}
              />
            </div>

            {/* Permissions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Permisos por Módulo</Label>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => toggleAllPermissions(true)}
                  >
                    Marcar todos
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => toggleAllPermissions(false)}
                  >
                    Desmarcar todos
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
                      <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <span className="text-lg">{module.icon}</span>
                          <span className="font-medium">{module.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={activeCount > 0 ? 'default' : 'secondary'}>
                            {activeCount} / 4
                          </Badge>
                          <Switch
                            checked={activeCount === 4}
                            onCheckedChange={(checked) => toggleAllModulePermissions(module.id, checked)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-4 py-3 bg-muted/30 grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {actions.map(action => {
                            const Icon = actionIcons[action.id];
                            return (
                              <label
                                key={action.id}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <Checkbox
                                  checked={modulePerms[action.id]}
                                  onCheckedChange={() => togglePermission(module.id, action.id)}
                                />
                                <Icon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{action.name}</span>
                              </label>
                            );
                          })}
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
            <Button onClick={handleSaveRole} className="gap-2">
              <Save className="h-4 w-4" />
              {editingRole ? 'Guardar Cambios' : 'Crear Rol'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Dialog */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="userName">Nombre *</Label>
              <Input
                id="userName"
                value={userForm.name}
                onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nombre completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userEmail">Email *</Label>
              <Input
                id="userEmail"
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userPassword">Contraseña *</Label>
              <Input
                id="userPassword"
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder="••••••••"
              />
            </div>

            <div className="space-y-2">
              <Label>Rol *</Label>
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

            <div className="space-y-2">
              <Label>Sucursal</Label>
              <Select
                value={userForm.branchId}
                onValueChange={(value) => setUserForm(prev => ({ ...prev, branchId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas las sucursales" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas las sucursales</SelectItem>
                  {branches.map(branch => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="userActive">Usuario activo</Label>
              <Switch
                id="userActive"
                checked={userForm.active}
                onCheckedChange={(checked) => setUserForm(prev => ({ ...prev, active: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUserDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveUser} className="gap-2">
              <Save className="h-4 w-4" />
              {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
