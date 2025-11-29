import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Download, Search } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { generateInvoicePDF } from "@/utils/pdfGenerator";

interface Invoice {
  id: string;
  invoice_number: string;
  status: string;
  total_amount: number;
  payment_date: string | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  patients: {
    full_name: string;
  };
}

const Invoices = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          id,
          invoice_number,
          status,
          total_amount,
          payment_date,
          payment_method,
          notes,
          created_at,
          patients (
            full_name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error: any) {
      toast.error("Error al cargar facturas: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = useMemo(() => {
    if (!searchTerm) return invoices;
    const term = searchTerm.toLowerCase();
    return invoices.filter(
      (invoice) =>
        invoice.invoice_number.toLowerCase().includes(term) ||
        invoice.patients.full_name.toLowerCase().includes(term) ||
        invoice.status.toLowerCase().includes(term) ||
        invoice.total_amount.toString().includes(term)
    );
  }, [invoices, searchTerm]);

  const handleDownloadPDF = async (invoiceId: string) => {
    try {
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .select(`
          *,
          patients (
            full_name
          )
        `)
        .eq("id", invoiceId)
        .single();

      if (invoiceError) throw invoiceError;

      const { data: items, error: itemsError } = await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", invoiceId);

      if (itemsError) throw itemsError;

      await generateInvoicePDF({
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

      toast.success("PDF generado exitosamente");
    } catch (error: any) {
      toast.error("Error al generar PDF: " + error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendiente", variant: "outline" as const },
      paid: { label: "Pagada", variant: "default" as const },
      cancelled: { label: "Cancelada", variant: "destructive" as const },
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando facturas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Facturas</h1>
          <p className="text-muted-foreground">Gestión de facturas y pagos</p>
        </div>
        <Link to="/invoices/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nueva Factura
          </Button>
        </Link>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por número, paciente, estado o importe..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-4">
        {filteredInvoices.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">
                {searchTerm ? "No se encontraron facturas" : "No hay facturas registradas"}
              </p>
              {!searchTerm && (
                <Link to="/invoices/new">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Primera Factura
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredInvoices.map((invoice) => (
            <Card key={invoice.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      Factura #{invoice.invoice_number}
                    </CardTitle>
                    <CardDescription>
                      Paciente: {invoice.patients.full_name}
                    </CardDescription>
                  </div>
                  {getStatusBadge(invoice.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-primary">
                      €{invoice.total_amount.toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(invoice.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleDownloadPDF(invoice.id)}>
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" onClick={() => navigate(`/invoices/${invoice.id}`)}>Ver Detalles</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Invoices;
