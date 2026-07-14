import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MessageCircle, Save, Eye, RotateCcw, Send } from "lucide-react";
import { toast } from "sonner";
import api, { WA_TEMPLATE_TYPES } from "@/lib/api";

const VARIABLES = ["cliente", "fecha", "hora", "servicio", "estilista", "sucursal", "total", "folio", "negocio"];

const SAMPLE: Record<string, string> = {
  cliente: "María Pérez",
  fecha: "12/07/2026",
  hora: "16:00",
  servicio: "Corte + Tinte",
  estilista: "Ana",
  sucursal: "Sucursal Centro",
  total: "450",
  folio: "V-0123",
  negocio: "Mi Salón",
};

interface Row { type: string; label: string; content: string; enabled: boolean; }

// Minimal WhatsApp-like markdown: *bold* -> <strong>
function toWhatsappHTML(text: string): string {
  const esc = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return esc.replace(/\*([^*\n]+)\*/g, "<strong>$1</strong>");
}

export function WhatsAppTemplatesTab() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingType, setSavingType] = useState<string | null>(null);
  const [sendingType, setSendingType] = useState<string | null>(null);
  const [sendingAll, setSendingAll] = useState(false);
  const [previewType, setPreviewType] = useState<string | null>("appointment_confirmed");
  const [testPhone, setTestPhone] = useState<string>("5213171035768");

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

  const restoreDefault = async (type: string) => {
    const def = WA_TEMPLATE_TYPES.find(t => t.type === type); if (!def) return;
    updateRow(type, { content: def.defaultBody });
    try {
      await api.whatsappTemplates.upsert(type, { content: def.defaultBody });
      toast.success("Plantilla restaurada al predeterminado");
    } catch (e: any) { toast.error(e?.message || "Error"); }
  };

  const insertVar = (type: string, v: string) => {
    const row = rows.find(r => r.type === type); if (!row) return;
    updateRow(type, { content: `${row.content}{{${v}}}` });
  };

  const render = (body: string) =>
    body.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, k) => SAMPLE[k] ?? `{{${k}}}`);

  const sendTest = async (type: string) => {
    const row = rows.find(r => r.type === type); if (!row) return;
    const phone = testPhone.replace(/\D/g, "");
    if (!phone) { toast.error("Ingresa un número válido"); return; }
    setSendingType(type);
    try {
      // Guardar antes de enviar para que el backend use la última versión.
      await api.whatsappTemplates.upsert(type, { content: row.content, enabled: row.enabled });
      const res = await api.whatsappTemplates.sendTemplate({ type, phone, extra_vars: SAMPLE });
      if (res?.skipped) {
        toast.warning(`No enviado: ${res.reason === 'not_connected' ? 'WhatsApp no está conectado' : res.reason}`);
      } else {
        toast.success(`Enviado a ${phone}`);
      }
    } catch (e: any) { toast.error(e?.message || "Error enviando"); }
    finally { setSendingType(null); }
  };

  const sendAllTests = async () => {
    const phone = testPhone.replace(/\D/g, "");
    if (!phone) { toast.error("Ingresa un número válido"); return; }
    setSendingAll(true);
    let ok = 0, fail = 0;
    try {
      for (const row of rows) {
        try {
          await api.whatsappTemplates.upsert(row.type, { content: row.content, enabled: row.enabled });
          const res = await api.whatsappTemplates.sendTemplate({ type: row.type, phone, extra_vars: SAMPLE });
          if (res?.skipped) fail++; else ok++;
          await new Promise(r => setTimeout(r, 800));
        } catch { fail++; }
      }
      toast.success(`Envío de prueba: ${ok} enviadas, ${fail} omitidas`);
    } finally { setSendingAll(false); }
  };

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
            Puedes dar formato con <code>*negritas*</code> y saltos de línea para que se vea limpio en WhatsApp.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {VARIABLES.map(v => (
              <Badge key={v} variant="secondary" className="font-mono text-[10px]">{`{{${v}}}`}</Badge>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end gap-2 pt-2 border-t">
            <div className="flex-1">
              <Label className="text-xs">Enviar prueba al número</Label>
              <Input
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="5213171035768"
                inputMode="tel"
              />
            </div>
            <Button onClick={sendAllTests} disabled={sendingAll} className="gap-2">
              {sendingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Enviar todas de prueba
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Requiere WhatsApp conectado en esta cuenta. Se usan datos de ejemplo para las variables.
          </p>
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
            <div className="grid md:grid-cols-2 gap-3">
              <Textarea
                value={row.content}
                onChange={(e) => updateRow(row.type, { content: e.target.value })}
                rows={12}
                placeholder="Escribe el mensaje..."
                className="font-mono text-xs leading-relaxed"
              />
              <div className="rounded-lg bg-[#e5ddd5] dark:bg-[#0b141a] p-3 min-h-[220px] flex flex-col justify-end">
                <div className="max-w-[85%] self-end bg-[#dcf8c6] dark:bg-[#005c4b] text-black dark:text-white rounded-lg rounded-tr-sm px-3 py-2 shadow text-sm whitespace-pre-wrap break-words">
                  <div dangerouslySetInnerHTML={{ __html: toWhatsappHTML(render(row.content)) }} />
                  <div className="text-[10px] text-right opacity-60 mt-1">16:00 ✓✓</div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {VARIABLES.map(v => (
                <button key={v} onClick={() => insertVar(row.type, v)}
                  className="text-[10px] px-2 py-0.5 rounded border bg-muted hover:bg-accent font-mono">
                  +{`{{${v}}}`}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => restoreDefault(row.type)}>
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Restaurar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setPreviewType(previewType === row.type ? null : row.type)}>
                <Eye className="h-3.5 w-3.5 mr-1" /> {previewType === row.type ? "Ocultar" : "Vista previa"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => sendTest(row.type)} disabled={sendingType === row.type}>
                {sendingType === row.type ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Send className="h-3.5 w-3.5 mr-1" />}
                Enviar prueba
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
