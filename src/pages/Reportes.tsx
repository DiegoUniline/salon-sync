import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, TrendingUp, Users, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import api from "@/lib/api";

function toCsv(rows: any[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const fmtMoney = (n: number) => `$${(n || 0).toFixed(2)}`;

export default function Reportes() {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const profile = await (async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        const { data } = await supabase.from("profiles").select("account_id").eq("user_id", user.id).maybeSingle();
        return data;
      })();
      if (!profile?.account_id) { setSales([]); return; }
      const { data } = await supabase
        .from("sales")
        .select("*")
        .eq("account_id", profile.account_id)
        .gte("date", from)
        .lte("date", to)
        .order("date", { ascending: false });
      setSales((data as any[]) || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const totals = useMemo(() => {
    const total = sales.reduce((s, x) => s + Number(x.total || 0), 0);
    const count = sales.length;
    const avg = count ? total / count : 0;
    return { total, count, avg };
  }, [sales]);

  const byEmployee = useMemo(() => {
    const map = new Map<string, { name: string; total: number; count: number }>();
    sales.forEach((s) => {
      const key = s.employee_id || "sin-asignar";
      const name = s.employee_name || "Sin asignar";
      const prev = map.get(key) || { name, total: 0, count: 0 };
      prev.total += Number(s.total || 0);
      prev.count += 1;
      map.set(key, prev);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [sales]);

  const byService = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; total: number }>();
    sales.forEach((s) => {
      const items = Array.isArray(s.items) ? s.items : [];
      items.forEach((it: any) => {
        const name = it.name || it.service_name || it.product_name || "Item";
        const qty = Number(it.quantity || 1);
        const price = Number(it.price || it.subtotal || 0);
        const prev = map.get(name) || { name, qty: 0, total: 0 };
        prev.qty += qty;
        prev.total += price * qty;
        map.set(name, prev);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 20);
  }, [sales]);

  const byClient = useMemo(() => {
    const map = new Map<string, { name: string; total: number; visits: number }>();
    sales.forEach((s) => {
      const key = s.client_id || s.client_name || "Cliente eventual";
      const name = s.client_name || "Cliente eventual";
      const prev = map.get(key) || { name, total: 0, visits: 0 };
      prev.total += Number(s.total || 0);
      prev.visits += 1;
      map.set(key, prev);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 20);
  }, [sales]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Reportes</h1>
        <p className="text-muted-foreground">Analítica de ventas por rango de fecha</p>
      </div>

      <Card>
        <CardContent className="pt-6 flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-sm text-muted-foreground">Desde</label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Hasta</label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <Button onClick={load} disabled={loading}>{loading ? "Cargando..." : "Aplicar"}</Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><TrendingUp className="h-4 w-4" />Ingresos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmtMoney(totals.total)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Package className="h-4 w-4" />Ventas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{totals.count}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Users className="h-4 w-4" />Ticket promedio</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmtMoney(totals.avg)}</div></CardContent></Card>
      </div>

      <Tabs defaultValue="empleado">
        <TabsList>
          <TabsTrigger value="empleado">Por empleado</TabsTrigger>
          <TabsTrigger value="servicio">Top items</TabsTrigger>
          <TabsTrigger value="cliente">Top clientes</TabsTrigger>
        </TabsList>

        <TabsContent value="empleado">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Ingresos por empleado</CardTitle>
              <Button size="sm" variant="outline" onClick={() => toCsv(byEmployee, `empleados_${from}_${to}.csv`)}><Download className="h-4 w-4 mr-1" />CSV</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Empleado</TableHead><TableHead className="text-right">Ventas</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                <TableBody>
                  {byEmployee.map((r) => (
                    <TableRow key={r.name}><TableCell>{r.name}</TableCell><TableCell className="text-right">{r.count}</TableCell><TableCell className="text-right font-medium">{fmtMoney(r.total)}</TableCell></TableRow>
                  ))}
                  {!byEmployee.length && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Sin datos</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="servicio">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Top servicios y productos</CardTitle>
              <Button size="sm" variant="outline" onClick={() => toCsv(byService, `items_${from}_${to}.csv`)}><Download className="h-4 w-4 mr-1" />CSV</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Concepto</TableHead><TableHead className="text-right">Cantidad</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                <TableBody>
                  {byService.map((r) => (
                    <TableRow key={r.name}><TableCell>{r.name}</TableCell><TableCell className="text-right">{r.qty}</TableCell><TableCell className="text-right font-medium">{fmtMoney(r.total)}</TableCell></TableRow>
                  ))}
                  {!byService.length && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Sin datos</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cliente">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Clientes frecuentes</CardTitle>
              <Button size="sm" variant="outline" onClick={() => toCsv(byClient, `clientes_${from}_${to}.csv`)}><Download className="h-4 w-4 mr-1" />CSV</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Cliente</TableHead><TableHead className="text-right">Visitas</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                <TableBody>
                  {byClient.map((r) => (
                    <TableRow key={r.name}><TableCell>{r.name}</TableCell><TableCell className="text-right">{r.visits}</TableCell><TableCell className="text-right font-medium">{fmtMoney(r.total)}</TableCell></TableRow>
                  ))}
                  {!byClient.length && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Sin datos</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
