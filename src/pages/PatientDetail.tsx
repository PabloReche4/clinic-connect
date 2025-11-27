import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
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
import { EditPatientDialog } from "@/components/EditPatientDialog";

interface Patient {
  id: string;
  full_name: string;
  email: string | null;
  phone: string;
  address: string | null;
  dni: string | null;
  birth_date: string | null;
  notes: string | null;
  created_at: string;
  patient_groups: {
    id: string;
    name: string;
  } | null;
}

interface Budget {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  status: string;
  total_amount: number;
  created_at: string;
}

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    if (id) fetchPatient();
  }, [id]);

  const fetchPatient = async () => {
    try {
      const [patientRes, budgetsRes, invoicesRes, groupsRes] = await Promise.all([
        supabase
          .from("patients")
          .select(`*, patient_groups (id, name)`)
          .eq("id", id)
          .maybeSingle(),
        supabase
          .from("budgets")
          .select("id, status, total_amount, created_at")
          .eq("patient_id", id)
          .order("created_at", { ascending: false }),
        supabase
          .from("invoices")
          .select("id, invoice_number, status, total_amount, created_at")
          .eq("patient_id", id)
          .order("created_at", { ascending: false }),
        supabase.from("patient_groups").select("id, name").order("name"),
      ]);

      if (patientRes.error) throw patientRes.error;
      if (!patientRes.data) {
        toast.error("Paciente no encontrado");
        navigate("/patients");
        return;
      }
      setPatient(patientRes.data);
      setBudgets(budgetsRes.data || []);
      setInvoices(invoicesRes.data || []);
      setGroups(groupsRes.data || []);
    } catch (error: any) {
      toast.error("Error al cargar paciente: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from("patients").delete().eq("id", id);
      if (error) throw error;
      toast.success("Paciente eliminado");
      navigate("/patients");
    } catch (error: any) {
      toast.error("Error al eliminar: " + error.message);
    }
  };

  const getStatusBadge = (status: string, type: "budget" | "invoice") => {
    const budgetConfig = {
      pending: { label: "Pendiente", variant: "outline" as const },
      approved: { label: "Aprobado", variant: "default" as const },
      rejected: { label: "Rechazado", variant: "destructive" as const },
    };
    const invoiceConfig = {
      pending: { label: "Pendiente", variant: "outline" as const },
      paid: { label: "Pagada", variant: "default" as const },
      cancelled: { label: "Cancelada", variant: "destructive" as const },
    };
    const config = type === "budget" ? budgetConfig : invoiceConfig;
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

  if (!patient) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/patients")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{patient.full_name}</h1>
            {patient.patient_groups && (
              <p className="text-muted-foreground">Grupo: {patient.patient_groups.name}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
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
                <AlertDialogTitle>¿Eliminar paciente?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción eliminará el paciente pero no sus presupuestos ni facturas asociadas.
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
            <CardTitle>Información Personal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {patient.dni && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">DNI:</span>
                <span>{patient.dni}</span>
              </div>
            )}
            {patient.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{patient.email}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>{patient.phone}</span>
            </div>
            {patient.address && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                <span>{patient.address}</span>
              </div>
            )}
            {patient.birth_date && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{format(new Date(patient.birth_date), "d 'de' MMMM, yyyy", { locale: es })}</span>
              </div>
            )}
            {patient.notes && (
              <div>
                <span className="text-muted-foreground">Notas:</span>
                <p className="mt-1">{patient.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Presupuestos:</span>
              <span className="font-semibold">{budgets.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Facturas:</span>
              <span className="font-semibold">{invoices.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total facturado:</span>
              <span className="font-bold text-primary">
                €{invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + i.total_amount, 0).toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Presupuestos</CardTitle>
        </CardHeader>
        <CardContent>
          {budgets.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No hay presupuestos</p>
          ) : (
            <div className="space-y-4">
              {budgets.map((budget) => (
                <div
                  key={budget.id}
                  className="flex justify-between items-center p-4 border rounded-lg cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/budgets/${budget.id}`)}
                >
                  <div>
                    <p className="font-medium">
                      {format(new Date(budget.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                    </p>
                    {getStatusBadge(budget.status, "budget")}
                  </div>
                  <span className="font-semibold">€{budget.total_amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Facturas</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No hay facturas</p>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex justify-between items-center p-4 border rounded-lg cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/invoices/${invoice.id}`)}
                >
                  <div>
                    <p className="font-medium">#{invoice.invoice_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(invoice.created_at), "d/MM/yyyy", { locale: es })}
                    </p>
                    {getStatusBadge(invoice.status, "invoice")}
                  </div>
                  <span className="font-semibold">€{invoice.total_amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <EditPatientDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        patient={patient}
        groups={groups}
        onUpdated={fetchPatient}
      />
    </div>
  );
};

export default PatientDetail;
