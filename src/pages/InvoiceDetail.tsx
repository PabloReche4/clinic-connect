import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Check, X, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { generateInvoicePDF } from "@/utils/pdfGenerator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { EditInvoiceDialog } from "@/components/EditInvoiceDialog";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  status: string;
  total_amount: number;
  payment_date: string | null;
  payment_method: string | null;
  created_at: string;
  notes: string | null;
  budget_id: string | null;
  patients: {
    id: string;
    full_name: string;
  };
}

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    if (id) fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .select(`
          *,
          patients (
            id,
            full_name
          )
        `)
        .eq("id", id)
        .maybeSingle();

      if (invoiceError) throw invoiceError;
      if (!invoiceData) {
        toast.error("Factura no encontrada");
        navigate("/invoices");
        return;
      }
      setInvoice(invoiceData);

      const { data: itemsData, error: itemsError } = await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", id);

      if (itemsError) throw itemsError;
      setItems(itemsData || []);
    } catch (error: any) {
      toast.error("Error al cargar factura: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === "paid") {
        updateData.payment_date = new Date().toISOString().split("T")[0];
      }
      const { error } = await supabase
        .from("invoices")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
      toast.success(`Factura ${newStatus === "paid" ? "pagada" : "cancelada"}`);
      fetchInvoice();
    } catch (error: any) {
      toast.error("Error al actualizar estado: " + error.message);
    }
  };

  const handleDelete = async () => {
    try {
      await supabase.from("invoice_items").delete().eq("invoice_id", id);
      const { error } = await supabase.from("invoices").delete().eq("id", id);
      if (error) throw error;
      toast.success("Factura eliminada");
      navigate("/invoices");
    } catch (error: any) {
      toast.error("Error al eliminar: " + error.message);
    }
  };

  const handleDownloadPDF = () => {
    if (!invoice) return;
    generateInvoicePDF({
      invoice_number: invoice.invoice_number,
      patient_name: invoice.patients.full_name,
      created_at: invoice.created_at,
      payment_date: invoice.payment_date,
      status: invoice.status,
      total_amount: invoice.total_amount,
      payment_method: invoice.payment_method,
      notes: invoice.notes,
      items: items,
    });
    toast.success("PDF generado");
  };

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { label: "Pendiente", variant: "outline" as const },
      paid: { label: "Pagada", variant: "default" as const },
      cancelled: { label: "Cancelada", variant: "destructive" as const },
    };
    const c = config[status as keyof typeof config];
    return <Badge variant={c?.variant}>{c?.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!invoice) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/invoices")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Factura #{invoice.invoice_number}</h1>
            <p className="text-muted-foreground">Paciente: {invoice.patients.full_name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
            <Pencil className="w-4 h-4 mr-2" />
            Editar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar factura?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estado:</span>
              {getStatusBadge(invoice.status)}
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha:</span>
              <span>{format(new Date(invoice.created_at), "d 'de' MMMM, yyyy", { locale: es })}</span>
            </div>
            {invoice.payment_date && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fecha de pago:</span>
                <span>{format(new Date(invoice.payment_date), "d/MM/yyyy", { locale: es })}</span>
              </div>
            )}
            {invoice.payment_method && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Método de pago:</span>
                <span className="capitalize">{invoice.payment_method}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total:</span>
              <span className="text-2xl font-bold text-primary">€{invoice.total_amount.toFixed(2)}</span>
            </div>
            {invoice.notes && (
              <div>
                <span className="text-muted-foreground">Notas:</span>
                <p className="mt-1">{invoice.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {invoice.status === "pending" && (
              <>
                <Button className="w-full" onClick={() => updateStatus("paid")}>
                  <Check className="w-4 h-4 mr-2" />
                  Marcar como Pagada
                </Button>
                <Button variant="destructive" className="w-full" onClick={() => updateStatus("cancelled")}>
                  <X className="w-4 h-4 mr-2" />
                  Cancelar Factura
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conceptos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between items-center p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{item.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.quantity} x €{item.unit_price.toFixed(2)}
                  </p>
                </div>
                <span className="font-semibold">€{item.subtotal.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <EditInvoiceDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        invoice={invoice}
        onUpdated={fetchInvoice}
      />
    </div>
  );
};

export default InvoiceDetail;
