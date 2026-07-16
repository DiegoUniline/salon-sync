import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const fmtMoney = (n: number) => `$${(n || 0).toFixed(2)}`;

function toCsv(rows: any[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Comisiones() {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);
  const [defaultPct, setDefaultPct] = useState(10);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("account_id").eq("user_id", user.id).maybeSingle();
      if (!profile?.account_id) { setSales([]); return; }
      const { data } = await supabase
        .from("sales")
        .select("*")
        .eq("account_id", profile.account_id)
        .gte("date", from)
        .lte("date", to);
      setSales((data as any[]) || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const rows = useMemo(() => {
    const map = new Map<string, { name: string; ventas: number; total: number; comision_registrada: number; comision_calculada: number; propinas: number }>();
    sales.forEach((s) => {
      const key = s.employee_id || "sin-asignar";
      const name = s.employee_name || "Sin asignar";
      const total = Number(s.total || 0);
      const registrada = Number(s.commission || 0);
      const calculada = total * (defaultPct / 100);
      const prev = map.get(key) || { name, ventas: 0, total: 0, comision_registrada: 0, comision_calculada: 0, propinas: 0 };
      prev.ventas += 1;
      prev.total += total;
      prev.comision_registrada += registrada;
      prev.comision_calculada += calculada;
      map.set(key, prev);

      // Propinas: distribuir por tip_employee_id o por lista `tips`
      const tips = Array.isArray(s.tips) ? s.tips : [];
      if (tips.length > 0) {
        tips.forEach((t: any) => {
          const empId = t.employee_id || "sin-asignar";
          const empName = t.employee_name || (empId === "sin-asignar" ? "Sin asignar" : empId);
          const row = map.get(empId) || { name: empName, ventas: 0, total: 0, comision_registrada: 0, comision_calculada: 0, propinas: 0 };
          row.propinas += Number(t.amount || 0);
          map.set(empId, row);
        });
      } else if (Number(s.tip_amount || 0) > 0) {
        const empId = s.tip_employee_id || s.employee_id || "sin-asignar";
        const empName = s.employee_name || "Sin asignar";
        const row = map.get(empId) || { name: empName, ventas: 0, total: 0, comision_registrada: 0, comision_calculada: 0, propinas: 0 };
        row.propinas += Number(s.tip_amount || 0);
        map.set(empId, row);
      }
    });
    return Array.from(map.values()).sort((a, b) => (b.total + b.propinas) - (a.total + a.propinas));
  }, [sales, defaultPct]);

  const totalPagar = rows.reduce((s, r) => s + (r.comision_registrada || r.comision_calculada) + r.propinas, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Comisiones</h1>
        <p className="text-muted-foreground">Liquidación de comisiones por empleado</p>
      </div>

      <Card>
        <CardContent className="pt-6 flex flex-wrap gap-3 items-end">
          <div><label className="text-sm text-muted-foreground">Desde</label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div><label className="text-sm text-muted-foreground">Hasta</label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          <div><label className="text-sm text-muted-foreground">% comisión por defecto</label><Input type="number" min={0} max={100} value={defaultPct} onChange={(e) => setDefaultPct(Number(e.target.value) || 0)} /></div>
          <Button onClick={load} disabled={loading}>{loading ? "Cargando..." : "Aplicar"}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><DollarSign className="h-4 w-4" />Total a pagar en el periodo</CardTitle></CardHeader>
        <CardContent><div className="text-3xl font-bold">{fmtMoney(totalPagar)}</div></CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Detalle por empleado</CardTitle>
          <Button size="sm" variant="outline" onClick={() => toCsv(rows, `comisiones_${from}_${to}.csv`)}><Download className="h-4 w-4 mr-1" />CSV</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Empleado</TableHead><TableHead className="text-right">Ventas</TableHead><TableHead className="text-right">Total ventas</TableHead><TableHead className="text-right">Registrada</TableHead><TableHead className="text-right">Calculada ({defaultPct}%)</TableHead><TableHead className="text-right">Propinas</TableHead><TableHead className="text-right">A pagar</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.name}>
                  <TableCell>{r.name}</TableCell>
                  <TableCell className="text-right">{r.ventas}</TableCell>
                  <TableCell className="text-right">{fmtMoney(r.total)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{fmtMoney(r.comision_registrada)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{fmtMoney(r.comision_calculada)}</TableCell>
                  <TableCell className="text-right text-success">{fmtMoney(r.propinas)}</TableCell>
                  <TableCell className="text-right font-bold">{fmtMoney((r.comision_registrada || r.comision_calculada) + r.propinas)}</TableCell>
                </TableRow>
              ))}
              {!rows.length && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Sin datos</TableCell></TableRow>}
            </TableBody>
          </Table>
          <p className="text-xs text-muted-foreground mt-4">* &quot;Registrada&quot; usa el campo <code>commission</code> guardado con la venta. &quot;Calculada&quot; aplica el % por defecto sobre el total. Se paga la registrada si existe. Las propinas se suman aparte.</p>
        </CardContent>
      </Card>
    </div>
  );
}
