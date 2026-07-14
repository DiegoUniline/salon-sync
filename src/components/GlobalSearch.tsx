import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import {
  Calendar,
  Users,
  Package,
  Scissors,
  LayoutDashboard,
  DollarSign,
  Warehouse,
  ShoppingCart,
  Settings,
  FileText,
  TrendingUp,
} from "lucide-react";

const navShortcuts = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Agenda", path: "/agenda", icon: Calendar },
  { label: "Citas", path: "/citas", icon: Calendar },
  { label: "Ventas", path: "/ventas", icon: DollarSign },
  { label: "Reportes", path: "/reportes", icon: TrendingUp },
  { label: "Comisiones", path: "/comisiones", icon: DollarSign },
  { label: "Bitácora", path: "/auditoria", icon: FileText },
  { label: "Inventario", path: "/inventario", icon: Warehouse },
  { label: "Compras", path: "/compras", icon: ShoppingCart },
  { label: "Servicios", path: "/servicios", icon: Scissors },
  { label: "Productos", path: "/productos", icon: Package },
  { label: "Configuración", path: "/configuracion", icon: Settings },
];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ clients: any[]; products: any[]; services: any[] }>({ clients: [], products: [], services: [] });
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (!q || q.length < 2) { setResults({ clients: [], products: [], services: [] }); return; }
    const run = async () => {
      const like = `%${q}%`;
      const [clients, products, services] = await Promise.all([
        supabase.from("clients").select("id,name,phone").ilike("name", like).limit(5),
        supabase.from("products").select("id,name,sku").ilike("name", like).limit(5),
        supabase.from("services").select("id,name,price").ilike("name", like).limit(5),
      ]);
      setResults({
        clients: (clients.data as any[]) || [],
        products: (products.data as any[]) || [],
        services: (services.data as any[]) || [],
      });
    };
    const t = setTimeout(run, 200);
    return () => clearTimeout(t);
  }, [q]);

  const go = (path: string) => { setOpen(false); setQ(""); navigate(path); };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar cliente, producto, servicio o página... (Ctrl+K)" value={q} onValueChange={setQ} />
      <CommandList>
        <CommandEmpty>Sin resultados</CommandEmpty>

        <CommandGroup heading="Ir a">
          {navShortcuts
            .filter((s) => !q || s.label.toLowerCase().includes(q.toLowerCase()))
            .map((s) => (
              <CommandItem key={s.path} onSelect={() => go(s.path)}>
                <s.icon className="mr-2 h-4 w-4" />
                {s.label}
              </CommandItem>
            ))}
        </CommandGroup>

        {results.clients.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Clientes">
              {results.clients.map((c) => (
                <CommandItem key={c.id} onSelect={() => go(`/agenda?client=${c.id}`)}>
                  <Users className="mr-2 h-4 w-4" />
                  {c.name}{c.phone ? ` · ${c.phone}` : ""}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {results.services.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Servicios">
              {results.services.map((s) => (
                <CommandItem key={s.id} onSelect={() => go(`/servicios`)}>
                  <Scissors className="mr-2 h-4 w-4" />
                  {s.name}{s.price ? ` · $${s.price}` : ""}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {results.products.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Productos">
              {results.products.map((p) => (
                <CommandItem key={p.id} onSelect={() => go(`/productos`)}>
                  <Package className="mr-2 h-4 w-4" />
                  {p.name}{p.sku ? ` · ${p.sku}` : ""}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
