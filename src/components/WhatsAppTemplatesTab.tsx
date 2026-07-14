import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageCircle, Save, Eye } from "lucide-react";
import { toast } from "sonner";
import api, { WA_TEMPLATE_TYPES } from "@/lib/api";

const VARIABLES = ["cliente", "fecha", "hora", "servicio", "estilista", "sucursal", "total", "folio", "negocio"];

const SAMPLE: Record<string, string> = {
  cliente: "María Pérez", fecha: "12/07/2026", hora: "16:00",
  servicio: "Corte + Tinte", estilista: "Ana", sucursal: "Sucursal Centro",
  total: "450", folio: "V-0123", negocio: "Mi Salón",
};

interface Row { type: string; label: string; content: string; enabled: boolean; }

export function WhatsAppTemplatesTab() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingType, setSavingType] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<string | null>(null);

  useEffect(() => { (async () => {
    setLoading(true);
    try {
      const data = await api.whatsappTemplates.seedIfMissing();
      const byType: Record<string, any> = Object.fromEntries((data || []).map((t: any) => [t.type, t]));
      setRows(WA_TEMPLATE_TYPES.map(def => ({
        type: def.type,
        label: def.label,
        content: byType[def.type]?.content ?? def.defaultBody,
        enabled: byType[def.type]?.enabled ?? true,
      })));
    } catch (e: any) { toast.error(e?.message || "Error cargando plantillas"); }
    finally { setLoading(false); }
  })(); }, []);

  const updateRow = (type: string, patch: Partial<Row>) =>
    setRows(prev => prev.map(r => r.type === type ? { ...r, ...patch } : r));

  const save = async (type: string) => {
    const row = rows.find(r => r.type === type); if (!row) return;
    setSavingType(type);
    try {
      await api.whatsappTemplates.upsert(type, { content: row.content, enabled: row.enabled });
      toast.success("Plantilla guardada");
    } catch (e: any) { toast.error(e?.message || "Error"); }
    finally { setSavingType(null); }
  };

  const insertVar = (type: string, v: string) => {
    const row = rows.find(r => r.type === type); if (!row) return;
    updateRow(type, { content: `${row.content}{{${v}}}` });
  };

  const render = (body: string) =>
    body.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, k) => SAMPLE[k] ?? `{{${k}}}`);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            Plantillas de WhatsApp
          </CardTitle>
          <CardDescription>
            Personaliza los mensajes automáticos. Usa variables entre llaves dobles como <code>{'{{cliente}}'}</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {VARIABLES.map(v => (
              <Badge key={v} variant="secondary" className="font-mono text-[10px]">{`{{${v}}}`}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {rows.map(row => (
        <Card key={row.type} className="glass-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">{row.label}</CardTitle>
                <CardDescription className="text-xs font-mono">{row.type}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Activa</span>
                <Switch checked={row.enabled} onCheckedChange={(v) => updateRow(row.type, { enabled: v })} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={row.content}
              onChange={(e) => updateRow(row.type, { content: e.target.value })}
              rows={4}
              placeholder="Escribe el mensaje..."
              className="font-mono text-sm"
            />
            <div className="flex flex-wrap gap-1">
              {VARIABLES.map(v => (
                <button key={v} onClick={() => insertVar(row.type, v)}
                  className="text-[10px] px-2 py-0.5 rounded border bg-muted hover:bg-accent font-mono">
                  +{`{{${v}}}`}
                </button>
              ))}
            </div>
            {previewType === row.type && (
              <div className="rounded-md border bg-green-50 dark:bg-green-950/30 p-3 text-sm whitespace-pre-wrap">
                {render(row.content)}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setPreviewType(previewType === row.type ? null : row.type)}>
                <Eye className="h-3.5 w-3.5 mr-1" /> {previewType === row.type ? "Ocultar" : "Vista previa"}
              </Button>
              <Button size="sm" onClick={() => save(row.type)} disabled={savingType === row.type}>
                {savingType === row.type ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                Guardar
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
