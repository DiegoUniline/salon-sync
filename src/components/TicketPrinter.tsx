import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Printer, Download } from 'lucide-react';
import { getBusinessConfig, type BusinessConfig } from '@/lib/businessConfig';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TicketItem {
  name: string;
  quantity: number;
  price: number;
  discount?: number;
}

interface TicketData {
  folio: string;
  date: Date;
  clientName?: string;
  clientPhone?: string;
  professionalName?: string;
  services: TicketItem[];
  products: TicketItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  payments?: { method: string; amount: number }[];
}

interface TicketPrinterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: TicketData;
}

export function TicketPrinter({ open, onOpenChange, data }: TicketPrinterProps) {
  const ticketRef = useRef<HTMLDivElement>(null);
  const config = getBusinessConfig();

  const isFieldEnabled = (fieldId: string) => {
    const field = config.ticketFields.find(f => f.id === fieldId);
    return field?.enabled ?? true;
  };

  const handlePrint = () => {
    const printContent = ticketRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ticket #${data.folio}</title>
          <style>
            @page { 
              size: 80mm auto; 
              margin: 0; 
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              width: 80mm;
              margin: 0 auto;
              padding: 10px;
              box-sizing: border-box;
            }
            .ticket-header { text-align: center; margin-bottom: 10px; }
            .ticket-logo { max-width: 60px; margin-bottom: 5px; }
            .ticket-title { font-size: 14px; font-weight: bold; }
            .ticket-divider { border-top: 1px dashed #000; margin: 8px 0; }
            .ticket-row { display: flex; justify-content: space-between; margin: 3px 0; }
            .ticket-row-label { flex: 1; }
            .ticket-row-value { text-align: right; }
            .ticket-item { margin: 5px 0; }
            .ticket-item-name { font-weight: 500; }
            .ticket-item-detail { font-size: 11px; color: #666; padding-left: 10px; }
            .ticket-total { font-size: 14px; font-weight: bold; margin-top: 10px; }
            .ticket-footer { text-align: center; margin-top: 15px; font-size: 11px; }
            .ticket-center { text-align: center; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Vista Previa del Ticket
          </DialogTitle>
        </DialogHeader>

        <div className="bg-white text-black rounded-lg p-4 font-mono text-sm max-h-[60vh] overflow-y-auto">
          <div ref={ticketRef}>
            {/* Header */}
            <div className="ticket-header text-center mb-4">
              {isFieldEnabled('logo') && config.logo && (
                <img src={config.logo} alt="Logo" className="ticket-logo mx-auto h-12 mb-2" />
              )}
              {isFieldEnabled('businessName') && (
                <div className="ticket-title font-bold text-base">{config.name}</div>
              )}
              {isFieldEnabled('address') && config.address && (
                <div className="text-xs">{config.address}</div>
              )}
              {isFieldEnabled('phone') && config.phone && (
                <div className="text-xs">Tel: {config.phone}</div>
              )}
              {isFieldEnabled('rfc') && config.rfc && (
                <div className="text-xs">RFC: {config.rfc}</div>
              )}
            </div>

            <div className="ticket-divider border-t border-dashed border-gray-400 my-2" />

            {/* Folio & Date */}
            <div className="space-y-1">
              {isFieldEnabled('folio') && (
                <div className="ticket-row flex justify-between">
                  <span>Folio:</span>
                  <span className="font-bold">#{data.folio}</span>
                </div>
              )}
              {isFieldEnabled('date') && (
                <div className="ticket-row flex justify-between">
                  <span>Fecha:</span>
                  <span>{format(data.date, "dd/MM/yyyy HH:mm", { locale: es })}</span>
                </div>
              )}
              {isFieldEnabled('clientName') && data.clientName && (
                <div className="ticket-row flex justify-between">
                  <span>Cliente:</span>
                  <span>{data.clientName}</span>
                </div>
              )}
              {isFieldEnabled('clientPhone') && data.clientPhone && (
                <div className="ticket-row flex justify-between">
                  <span>Tel Cliente:</span>
                  <span>{data.clientPhone}</span>
                </div>
              )}
              {isFieldEnabled('professional') && data.professionalName && (
                <div className="ticket-row flex justify-between">
                  <span>Atendió:</span>
                  <span>{data.professionalName}</span>
                </div>
              )}
            </div>

            <div className="ticket-divider border-t border-dashed border-gray-400 my-2" />

            {/* Services */}
            {isFieldEnabled('services') && data.services.length > 0 && (
              <div className="mb-2">
                <div className="font-bold mb-1">SERVICIOS</div>
                {data.services.map((item, idx) => (
                  <div key={idx} className="ticket-item">
                    <div className="flex justify-between">
                      <span className="flex-1">{item.quantity}x {item.name}</span>
                      <span>{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                    {item.discount && item.discount > 0 && (
                      <div className="text-xs text-gray-600 pl-2">
                        Desc: -{item.discount}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Products */}
            {isFieldEnabled('products') && data.products.length > 0 && (
              <div className="mb-2">
                <div className="font-bold mb-1">PRODUCTOS</div>
                {data.products.map((item, idx) => (
                  <div key={idx} className="ticket-item">
                    <div className="flex justify-between">
                      <span className="flex-1">{item.quantity}x {item.name}</span>
                      <span>{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                    {item.discount && item.discount > 0 && (
                      <div className="text-xs text-gray-600 pl-2">
                        Desc: -{item.discount}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="ticket-divider border-t border-dashed border-gray-400 my-2" />

            {/* Totals */}
            <div className="space-y-1">
              {isFieldEnabled('subtotal') && (
                <div className="ticket-row flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(data.subtotal)}</span>
                </div>
              )}
              {isFieldEnabled('discount') && data.discount > 0 && (
                <div className="ticket-row flex justify-between text-green-700">
                  <span>Descuento:</span>
                  <span>-{formatCurrency(data.discount)}</span>
                </div>
              )}
              {isFieldEnabled('total') && (
                <div className="ticket-total flex justify-between font-bold text-base pt-1 border-t">
                  <span>TOTAL:</span>
                  <span>{formatCurrency(data.total)}</span>
                </div>
              )}
            </div>

            {/* Payment */}
            {isFieldEnabled('paymentMethod') && (
              <div className="mt-2">
                <div className="ticket-divider border-t border-dashed border-gray-400 my-2" />
                {data.payments && data.payments.length > 1 ? (
                  <div>
                    <div className="font-bold mb-1">PAGOS</div>
                    {data.payments.map((p, idx) => (
                      <div key={idx} className="flex justify-between text-xs">
                        <span>{p.method}:</span>
                        <span>{formatCurrency(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span>Pagó con:</span>
                    <span>{data.paymentMethod}</span>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            {isFieldEnabled('footer') && config.ticketFooter && (
              <>
                <div className="ticket-divider border-t border-dashed border-gray-400 my-3" />
                <div className="ticket-footer text-center text-xs">
                  {config.ticketFooter}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button className="gradient-bg border-0" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
