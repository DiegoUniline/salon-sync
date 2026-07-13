import { useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import api from "@/lib/api";

type Option = { id: string; label: string; sublabel?: string; raw?: any };

type Field = { name: string; label: string; type?: "text" | "number" | "email" | "tel"; required?: boolean };

type EntityConfig = {
  label: string;              // singular label ("Cliente")
  loadOptions: () => Promise<Option[]>;
  createFields: Field[];
  create: (values: Record<string, any>) => Promise<Option>;
};

const mapNamed = (rows: any[]): Option[] =>
  (rows || [])
    .map((r) => ({ id: r.id ?? r.name, label: r.name ?? r.full_name ?? String(r.id), sublabel: r.email || r.phone || undefined, raw: r }))
    .sort((a, b) => a.label.localeCompare(b.label, "es", { sensitivity: "base" }));

export const entityRegistry: Record<string, EntityConfig> = {
  cliente: {
    label: "Cliente",
    loadOptions: async () => mapNamed(await api.clients.getAll()),
    createFields: [
      { name: "name", label: "Nombre", required: true },
      { name: "phone", label: "Teléfono", type: "tel" },
      { name: "email", label: "Correo", type: "email" },
    ],
    create: async (v) => {
      const row = await api.clients.create(v);
      return { id: row.id, label: row.name, raw: row };
    },
  },
  proveedor: {
    label: "Proveedor",
    loadOptions: async () => mapNamed(await api.suppliers.getAll()),
    createFields: [
      { name: "name", label: "Nombre", required: true },
      { name: "phone", label: "Teléfono", type: "tel" },
      { name: "email", label: "Correo", type: "email" },
    ],
    create: async (v) => {
      const row = await api.suppliers.create(v);
      return { id: row.id, label: row.name, raw: row };
    },
  },
  producto: {
    label: "Producto",
    loadOptions: async () => mapNamed(await api.products.getAll()),
    createFields: [
      { name: "name", label: "Nombre", required: true },
      { name: "price", label: "Precio", type: "number", required: true },
      { name: "cost", label: "Costo", type: "number" },
      { name: "stock", label: "Stock inicial", type: "number" },
    ],
    create: async (v) => {
      const row = await api.products.create({
        ...v,
        price: Number(v.price) || 0,
        cost: Number(v.cost) || 0,
        stock: Number(v.stock) || 0,
      });
      return { id: row.id, label: row.name, raw: row };
    },
  },
  servicio: {
    label: "Servicio",
    loadOptions: async () => mapNamed(await api.services.getAll()),
    createFields: [
      { name: "name", label: "Nombre", required: true },
      { name: "price", label: "Precio", type: "number", required: true },
      { name: "duration_minutes", label: "Duración (min)", type: "number" },
    ],
    create: async (v) => {
      const row = await api.services.create({
        ...v,
        price: Number(v.price) || 0,
        duration_minutes: Number(v.duration_minutes) || 30,
      });
      return { id: row.id, label: row.name, raw: row };
    },
  },
  sucursal: {
    label: "Sucursal",
    loadOptions: async () => mapNamed(await api.branches.getAll()),
    createFields: [
      { name: "name", label: "Nombre", required: true },
      { name: "address", label: "Dirección" },
      { name: "phone", label: "Teléfono", type: "tel" },
    ],
    create: async (v) => {
      const row = await api.branches.create(v);
      return { id: row.id, label: row.name, raw: row };
    },
  },
  categoria_producto: {
    label: "Categoría de producto",
    loadOptions: async () => mapNamed(await api.products.getCategories()),
    createFields: [{ name: "name", label: "Nombre", required: true }],
    create: async (v) => {
      const row = await api.categories.create({ name: v.name, type: "product" });
      return { id: row.name, label: row.name, raw: row };
    },
  },
  categoria_servicio: {
    label: "Categoría de servicio",
    loadOptions: async () => mapNamed(await api.services.getCategories()),
    createFields: [{ name: "name", label: "Nombre", required: true }],
    create: async (v) => {
      const row = await api.categories.create({ name: v.name, type: "service" });
      return { id: row.name, label: row.name, raw: row };
    },
  },
  categoria_gasto: {
    label: "Categoría de gasto",
    loadOptions: async () => {
      const list = await api.expenses.getCategories();
      return mapNamed((list || []).map((n: any) => (typeof n === "string" ? { id: n, name: n } : n)));
    },
    createFields: [{ name: "name", label: "Nombre", required: true }],
    create: async (v) => {
      const row = await api.categories.create({ name: v.name, type: "expense" });
      return { id: row.name, label: row.name, raw: row };
    },
  },
  empleado: {
    label: "Empleado",
    loadOptions: async () => {
      const rows = await api.users.getAll({ active: true });
      return (rows || [])
        .map((r: any) => ({ id: r.id, label: r.name, sublabel: r.email || r.phone, raw: r }))
        .sort((a, b) => a.label.localeCompare(b.label, "es", { sensitivity: "base" }));
    },
    createFields: [
      { name: "name", label: "Nombre", required: true },
      { name: "email", label: "Correo", type: "email", required: true },
      { name: "password", label: "Contraseña", required: true },
      { name: "phone", label: "Teléfono", type: "tel" },
    ],
    create: async (v) => {
      const row = await api.users.create({ ...v, role: "employee" });
      return { id: row.id, label: row.name || v.name, raw: row };
    },
  },
  rol: {
    label: "Rol",
    loadOptions: async () => mapNamed(await api.roles.getAll()),
    createFields: [{ name: "name", label: "Nombre", required: true }],
    create: async (v) => {
      const row = await api.roles.create({ name: v.name, description: "", color: "#3B82F6", permissions: {} });
      return { id: row.id, label: row.name, raw: row };
    },
  },
};


interface Props {
  entity: keyof typeof entityRegistry;
  value: string | null | undefined;
  onChange: (id: string | null, raw?: any) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** If provided, overrides the default loader (e.g. filter by branch) */
  loadOptions?: () => Promise<Option[]>;
  /** Refresh dep — bump to force reload */
  refreshKey?: number;
}

export function EntityCombobox({
  entity,
  value,
  onChange,
  placeholder,
  disabled,
  className,
  loadOptions,
  refreshKey,
}: Props) {
  const config = entityRegistry[entity];
  if (!config) throw new Error(`EntityCombobox: unknown entity "${entity}"`);

  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createValues, setCreateValues] = useState<Record<string, any>>({});
  const [creating, setCreating] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (loadOptions ?? config.loadOptions)()
      .then((opts) => {
        if (cancelled) return;
        setOptions(
          [...opts].sort((a, b) => a.label.localeCompare(b.label, "es", { sensitivity: "base" }))
        );
      })
      .catch((e) => console.error(`Load ${entity} failed:`, e))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [entity, loadOptions, refreshKey, reloadTick]);

  const selected = useMemo(() => options.find((o) => o.id === value) || null, [options, value]);

  const openCreate = () => {
    const initial: Record<string, any> = {};
    for (const f of config.createFields) initial[f.name] = f.name === "name" ? search : "";
    setCreateValues(initial);
    setCreateOpen(true);
    setOpen(false);
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const f of config.createFields) {
      if (f.required && !String(createValues[f.name] ?? "").trim()) {
        toast.error(`${f.label} es requerido`);
        return;
      }
    }
    try {
      setCreating(true);
      const created = await config.create(createValues);
      toast.success(`${config.label} creado`);
      setCreateOpen(false);
      setSearch("");
      setReloadTick((t) => t + 1);
      onChange(created.id, created.raw);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || `Error al crear ${config.label.toLowerCase()}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn("w-full justify-between font-normal", !selected && "text-muted-foreground", className)}
          >
            <span className="truncate">
              {selected?.label || placeholder || `Selecciona ${config.label.toLowerCase()}`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command shouldFilter>
            <CommandInput
              placeholder={`Buscar ${config.label.toLowerCase()}...`}
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {loading ? (
                <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando...
                </div>
              ) : (
                <>
                  <CommandEmpty>
                    <div className="flex flex-col items-center gap-2 py-4">
                      <p className="text-sm text-muted-foreground">No se encontraron resultados</p>
                      <Button type="button" size="sm" variant="secondary" onClick={openCreate}>
                        <Plus className="h-4 w-4 mr-1" />
                        Crear {config.label.toLowerCase()}
                        {search ? `: "${search}"` : ""}
                      </Button>
                    </div>
                  </CommandEmpty>
                  <CommandGroup>
                    {options.map((opt) => (
                      <CommandItem
                        key={opt.id}
                        value={`${opt.label} ${opt.sublabel || ""}`}
                        onSelect={() => {
                          onChange(opt.id, opt.raw);
                          setOpen(false);
                          setSearch("");
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === opt.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span>{opt.label}</span>
                          {opt.sublabel && (
                            <span className="text-xs text-muted-foreground">{opt.sublabel}</span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <div className="border-t p-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={openCreate}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Crear nuevo {config.label.toLowerCase()}
                    </Button>
                  </div>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Crear {config.label.toLowerCase()}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitCreate} className="space-y-3">
            {config.createFields.map((f) => (
              <div key={f.name} className="space-y-1">
                <Label htmlFor={`ec-${f.name}`}>
                  {f.label}
                  {f.required && <span className="text-destructive ml-0.5">*</span>}
                </Label>
                <Input
                  id={`ec-${f.name}`}
                  type={f.type || "text"}
                  value={createValues[f.name] ?? ""}
                  onChange={(e) =>
                    setCreateValues((v) => ({ ...v, [f.name]: e.target.value }))
                  }
                  autoFocus={f.name === "name"}
                />
              </div>
            ))}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
                Cancelar
              </Button>
              <Button type="submit" disabled={creating}>
                {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Crear y seleccionar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
