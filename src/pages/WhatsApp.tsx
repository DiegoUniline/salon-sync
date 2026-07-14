import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Send, Phone, QrCode, RefreshCw, Power, MessageSquare, Search, User, CalendarPlus, Link2, UserPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuickAppointmentSheet } from "@/components/QuickAppointmentSheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import api from "@/lib/api";

interface Instance { id: string; instance_name: string; phone_number: string | null; status: string; qr_code: string | null; }
interface Conversation { id: string; remote_jid: string; contact_name: string | null; contact_phone: string | null; last_message: string | null; last_message_at: string | null; unread_count: number; client_id: string | null; client_name?: string | null; }
interface Message { id: string; from_me: boolean; content: string | null; message_type: string; status: string; timestamp: string; }
interface ClientRow { id: string; name: string; phone: string | null; }

export default function WhatsApp() {
  const [instance, setInstance] = useState<Instance | null>(null);
  const [loadingInst, setLoadingInst] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [newChatPhone, setNewChatPhone] = useState("");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [linking, setLinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const callFn = async (action: string, params: Record<string, any> = {}) => {
    const { data, error } = await supabase.functions.invoke("evolution-api", { body: { action, ...params } });
    if (error) throw new Error(error.message);
    if ((data as any)?.error) throw new Error((data as any).error);
    return data;
  };

  const loadInstance = async () => {
    setLoadingInst(true);
    const { data } = await supabase.from("whatsapp_instances").select("*").maybeSingle();
    setInstance(data as any);
    setLoadingInst(false);
  };
  const loadConversations = async () => {
    const { data } = await supabase
      .from("whatsapp_conversations")
      .select("*, clients(name)")
      .order("last_message_at", { ascending: false, nullsFirst: false });
    setConversations(((data as any[]) || []).map((c) => ({ ...c, client_name: c.clients?.name || null })));
  };
  const openLinkClient = async () => {
    setLinkOpen(true);
    try {
      const all = await api.clients.getAll();
      setClients((all || []).map((c: any) => ({ id: c.id, name: c.name, phone: c.phone })));
    } catch (e: any) { toast.error(e?.message || "Error cargando clientes"); }
  };
  const linkClient = async (clientId: string | null) => {
    if (!selectedId) return;
    setLinking(true);
    try {
      await supabase.from("whatsapp_conversations").update({ client_id: clientId }).eq("id", selectedId);
      toast.success(clientId ? "Cliente vinculado" : "Vínculo eliminado");
      setLinkOpen(false);
      await loadConversations();
    } catch (e: any) { toast.error(e?.message || "Error"); }
    finally { setLinking(false); }
  };
  const createAndLinkClient = async () => {
    if (!selected) return;
    setLinking(true);
    try {
      const created = await api.clients.create({
        name: selected.contact_name || selected.contact_phone || "Cliente WhatsApp",
        phone: selected.contact_phone || "",
      });
      await supabase.from("whatsapp_conversations").update({ client_id: created.id }).eq("id", selected.id);
      toast.success("Cliente creado y vinculado");
      setLinkOpen(false);
      await loadConversations();
    } catch (e: any) { toast.error(e?.message || "Error"); }
    finally { setLinking(false); }
  };
  const loadMessages = async (convId: string) => {
    const { data } = await supabase.from("whatsapp_messages").select("*").eq("conversation_id", convId).order("timestamp", { ascending: true }).limit(200);
    setMessages((data as any[]) || []);
    await supabase.from("whatsapp_conversations").update({ unread_count: 0 }).eq("id", convId);
  };

  useEffect(() => { loadInstance(); loadConversations(); }, []);
  useEffect(() => { if (selectedId) loadMessages(selectedId); else setMessages([]); }, [selectedId]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: 999999, behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    const ch = supabase
      .channel("wa-realtime")
      .on("postgres_changes" as any, { event: "*", schema: "public", table: "whatsapp_conversations" }, () => loadConversations())
      .on("postgres_changes" as any, { event: "*", schema: "public", table: "whatsapp_messages" }, (payload: any) => {
        if (payload.new?.conversation_id === selectedId) loadMessages(selectedId!);
      })
      .on("postgres_changes" as any, { event: "*", schema: "public", table: "whatsapp_instances" }, () => loadInstance())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [selectedId]);

  const connect = async () => {
    try {
      toast.loading("Solicitando QR...", { id: "wa-connect" });
      await callFn("create_instance");
      toast.success("Escanea el QR desde tu WhatsApp", { id: "wa-connect" });
      loadInstance();
    } catch (e: any) { toast.error(e.message, { id: "wa-connect" }); }
  };
  const refresh = async () => {
    try { await callFn("status"); loadInstance(); toast.success("Estado actualizado"); }
    catch (e: any) { toast.error(e.message); }
  };
  const disconnect = async () => {
    if (!confirm("¿Desconectar WhatsApp?")) return;
    try { await callFn("logout"); loadInstance(); toast.success("Desconectado"); }
    catch (e: any) { toast.error(e.message); }
  };
  const send = async () => {
    if (!reply.trim() || !selectedId) return;
    setSending(true);
    try {
      await callFn("send_message", { conversation_id: selectedId, text: reply });
      setReply("");
      loadMessages(selectedId);
    } catch (e: any) { toast.error(e.message); }
    finally { setSending(false); }
  };
  const startNewChat = async () => {
    if (!newChatPhone.trim()) return;
    try {
      const res: any = await callFn("start_conversation", { phone: newChatPhone });
      setNewChatPhone("");
      await loadConversations();
      setSelectedId(res.conversation.id);
    } catch (e: any) { toast.error(e.message); }
  };

  const filtered = conversations.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (c.contact_name || "").toLowerCase().includes(q) || (c.contact_phone || "").includes(q);
  });
  const selected = conversations.find((c) => c.id === selectedId);

  if (loadingInst) return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  if (!instance || instance.status !== "connected") {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">WhatsApp CRM</h1>
          <p className="text-muted-foreground">Conecta tu número escaneando el QR</p>
        </div>
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 font-semibold"><QrCode className="h-5 w-5" />Conexión</div>
          {instance?.qr_code ? (
            <div className="flex flex-col items-center gap-4">
              <img src={instance.qr_code.startsWith("data:") ? instance.qr_code : `data:image/png;base64,${instance.qr_code}`} alt="QR" className="w-64 h-64 border-2 border-primary rounded-lg" />
              <p className="text-sm text-center text-muted-foreground">Abre WhatsApp en tu celular → <strong>Dispositivos vinculados → Vincular dispositivo</strong> y escanea.</p>
              <Badge variant="outline">{instance.status}</Badge>
              <Button variant="outline" onClick={refresh}><RefreshCw className="h-4 w-4 mr-2" />Verificar conexión</Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">No hay instancia activa. Genera el código QR.</p>
              <Button onClick={connect} className="w-full"><QrCode className="h-4 w-4 mr-2" />Conectar WhatsApp</Button>
              
            </>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2"><MessageSquare className="h-6 w-6" />WhatsApp CRM</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Badge className="bg-green-600">Conectado</Badge>
            {instance.phone_number && <span>+{instance.phone_number}</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refresh}><RefreshCw className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={disconnect}><Power className="h-4 w-4 mr-1" />Desconectar</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4 h-[calc(100vh-220px)]">
        <Card className="flex flex-col overflow-hidden">
          <div className="p-3 border-b space-y-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar chat..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-1">
              <Input placeholder="Nuevo chat (5215551234567)" value={newChatPhone} onChange={(e) => setNewChatPhone(e.target.value)} />
              <Button size="sm" onClick={startNewChat}><Phone className="h-4 w-4" /></Button>
            </div>
          </div>
          <ScrollArea className="flex-1">
            {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground p-6">Sin conversaciones aún</p>}
            {filtered.map((c) => {
              const displayName = c.client_name || c.contact_name || c.contact_phone;
              return (
                <button key={c.id} onClick={() => setSelectedId(c.id)}
                  className={cn("w-full text-left p-3 border-b hover:bg-accent transition-colors", selectedId === c.id && "bg-accent")}>
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate flex items-center gap-1.5">
                        {displayName}
                        {c.client_id && <Link2 className="h-3 w-3 text-primary shrink-0" />}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{c.last_message || "—"}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {c.last_message_at && <span className="text-[10px] text-muted-foreground">{new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                      {c.unread_count > 0 && <Badge className="h-5 min-w-5 px-1 text-[10px]">{c.unread_count}</Badge>}
                    </div>
                  </div>
                </button>
              );
            })}
          </ScrollArea>
        </Card>

        <Card className="flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">Selecciona una conversación</div>
          ) : (
            <>
              <div className="p-3 border-b flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center"><User className="h-5 w-5" /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate flex items-center gap-1.5">
                    {selected.client_name || selected.contact_name || selected.contact_phone}
                    {selected.client_id && <Badge variant="secondary" className="text-[10px] gap-1"><Link2 className="h-3 w-3" />Cliente</Badge>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    +{selected.contact_phone}
                    {selected.client_name && selected.contact_name && selected.client_name !== selected.contact_name && (
                      <span className="ml-1">· WA: {selected.contact_name}</span>
                    )}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={openLinkClient} className="gap-1">
                  <Link2 className="h-4 w-4" />
                  <span className="hidden sm:inline">{selected.client_id ? "Cambiar" : "Vincular"}</span>
                </Button>
                <Button size="sm" variant="default" onClick={() => setScheduleOpen(true)} className="gap-1">
                  <CalendarPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Agendar</span>
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 bg-muted/20" ref={scrollRef}>
                <div className="space-y-2">
                  {messages.map((m) => (
                    <div key={m.id} className={cn("flex", m.from_me ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[75%] rounded-lg px-3 py-2 text-sm shadow-sm",
                        m.from_me ? "bg-primary text-primary-foreground" : "bg-card border")}>
                        <p className="whitespace-pre-wrap break-words">{m.content}</p>
                        <p className={cn("text-[10px] mt-1 opacity-70", m.from_me ? "text-right" : "text-left")}>
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-3 border-t flex gap-2">
                <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Escribe un mensaje..."
                  className="min-h-[44px] max-h-32 resize-none"
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} />
                <Button onClick={send} disabled={sending || !reply.trim()}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>

      {selected && (
        <QuickAppointmentSheet
          open={scheduleOpen}
          onOpenChange={setScheduleOpen}
          contactName={selected.contact_name}
          contactPhone={selected.contact_phone}
          existingClientId={selected.client_id}
          conversationId={selected.id}
          onScheduled={loadConversations}
        />
      )}

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Vincular contacto a un cliente</DialogTitle>
            <DialogDescription>
              Al vincular, el chat mostrará el nombre del cliente en el CRM.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start gap-2" onClick={createAndLinkClient} disabled={linking}>
              <UserPlus className="h-4 w-4" />
              Crear cliente nuevo con estos datos
            </Button>
            {selected?.client_id && (
              <Button variant="ghost" className="w-full justify-start gap-2 text-destructive" onClick={() => linkClient(null)} disabled={linking}>
                <X className="h-4 w-4" />
                Quitar vínculo actual
              </Button>
            )}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar cliente existente..." className="pl-8"
                value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} />
            </div>
            <ScrollArea className="h-64 border rounded-md">
              {clients
                .filter((c) => {
                  if (!clientSearch) return true;
                  const q = clientSearch.toLowerCase();
                  return c.name.toLowerCase().includes(q) || (c.phone || "").includes(q);
                })
                .slice(0, 100)
                .map((c) => (
                  <button key={c.id} onClick={() => linkClient(c.id)} disabled={linking}
                    className={cn("w-full text-left px-3 py-2 border-b hover:bg-accent transition-colors flex justify-between items-center gap-2",
                      selected?.client_id === c.id && "bg-primary/10")}>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      {c.phone && <p className="text-xs text-muted-foreground truncate">{c.phone}</p>}
                    </div>
                    {selected?.client_id === c.id && <Badge variant="secondary" className="text-[10px]">actual</Badge>}
                  </button>
                ))}
              {clients.length === 0 && <p className="text-center text-sm text-muted-foreground p-6">No hay clientes</p>}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
