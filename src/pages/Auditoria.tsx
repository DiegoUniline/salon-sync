import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const actionColor: Record<string, string> = {
  create: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  update: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  delete: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  login: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  logout: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

export default function Auditoria() {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [tableFilter, setTableFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      setLogs((data as any[]) || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const tables = Array.from(new Set(logs.map((l) => l.entity_table))).filter(Boolean);
  const filtered = logs.filter((l) => {
    if (tableFilter !== "all" && l.entity_table !== tableFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (l.summary || "").toLowerCase().includes(q) ||
      (l.user_name || "").toLowerCase().includes(q) ||
      (l.action || "").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Bitácora del sistema</h1>
        <p className="text-muted-foreground">Últimas 500 acciones registradas</p>
      </div>

      <Card>
        <CardContent className="pt-6 flex flex-wrap gap-3">
          <Input placeholder="Buscar por acción, usuario o descripción..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
          <Select value={tableFilter} onValueChange={setTableFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Módulo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los módulos</SelectItem>
              {tables.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{loading ? "Cargando..." : `${filtered.length} registros`}</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>Módulo</TableHead>
                <TableHead>Descripción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-sm whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</TableCell>
                  <TableCell className="text-sm">{l.user_name || l.user_id?.slice(0, 8) || "—"}</TableCell>
                  <TableCell><Badge className={actionColor[l.action] || ""} variant="secondary">{l.action}</Badge></TableCell>
                  <TableCell className="text-sm">{l.entity_table}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{l.summary || "—"}</TableCell>
                </TableRow>
              ))}
              {!filtered.length && !loading && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Sin registros</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
