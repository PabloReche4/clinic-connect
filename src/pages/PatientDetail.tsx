import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Pencil, Trash2, Upload, FileImage, X, AlertTriangle, Pill, HeartPulse } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  allergies: string | null;
  medical_conditions: string | null;
  current_medications: string | null;
  medical_notes: string | null;
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

interface PatientFile {
  id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  description: string | null;
  created_at: string;
}

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [files, setFiles] = useState<PatientFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileDescription, setFileDescription] = useState("");

  useEffect(() => {
    if (id) fetchPatient();
  }, [id]);

  const fetchPatient = async () => {
    try {
      const [patientRes, budgetsRes, invoicesRes, groupsRes, filesRes] = await Promise.all([
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
        supabase
          .from("patient_files")
          .select("*")
          .eq("patient_id", id)
          .order("created_at", { ascending: false }),
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
      setFiles(filesRes.data || []);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("patient-files")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("patient-files")
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase.from("patient_files").insert({
        patient_id: id,
        file_url: publicUrl,
        file_name: file.name,
        file_type: file.type,
        description: fileDescription || null,
      });

      if (dbError) throw dbError;

      toast.success("Archivo subido correctamente");
      setFileDescription("");
      setUploadDialogOpen(false);
      fetchPatient();
    } catch (error: any) {
      toast.error("Error al subir archivo: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string, fileUrl: string) => {
    try {
      const filePath = fileUrl.split("/patient-files/")[1];
      if (filePath) {
        await supabase.storage.from("patient-files").remove([filePath]);
      }

      const { error } = await supabase.from("patient_files").delete().eq("id", fileId);
      if (error) throw error;

      toast.success("Archivo eliminado");
      fetchPatient();
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

      {/* Clinical History Card */}
      <Card className={patient.allergies ? "border-destructive/50" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HeartPulse className="w-5 h-5" />
            Historial Clínico
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {patient.allergies && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
              <div className="flex items-center gap-2 text-destructive font-semibold mb-1">
                <AlertTriangle className="w-4 h-4" />
                Alergias a Medicamentos
              </div>
              <p className="text-sm">{patient.allergies}</p>
            </div>
          )}
          
          {patient.medical_conditions && (
            <div>
              <span className="text-muted-foreground font-medium">Condiciones Médicas:</span>
              <p className="mt-1">{patient.medical_conditions}</p>
            </div>
          )}
          
          {patient.current_medications && (
            <div className="flex items-start gap-2">
              <Pill className="w-4 h-4 text-muted-foreground mt-1" />
              <div>
                <span className="text-muted-foreground font-medium">Medicación Actual:</span>
                <p className="mt-1">{patient.current_medications}</p>
              </div>
            </div>
          )}
          
          {patient.medical_notes && (
            <div>
              <span className="text-muted-foreground font-medium">Notas Médicas:</span>
              <p className="mt-1">{patient.medical_notes}</p>
            </div>
          )}
          
          {!patient.allergies && !patient.medical_conditions && !patient.current_medications && !patient.medical_notes && (
            <p className="text-muted-foreground text-center py-4">No hay información clínica registrada</p>
          )}
        </CardContent>
      </Card>

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

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Fotos y Radiografías</CardTitle>
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Upload className="w-4 h-4 mr-2" />
                  Subir Archivo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Subir Foto o Radiografía</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Descripción (opcional)</Label>
                    <Input
                      value={fileDescription}
                      onChange={(e) => setFileDescription(e.target.value)}
                      placeholder="Ej: Radiografía panorámica"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Archivo</Label>
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                  </div>
                  {uploading && <p className="text-sm text-muted-foreground">Subiendo...</p>}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No hay archivos</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {files.map((file) => (
                <Card key={file.id} className="overflow-hidden">
                  <div className="relative aspect-video bg-muted flex items-center justify-center">
                    {file.file_type.startsWith("image/") ? (
                      <img src={file.file_url} alt={file.file_name} className="object-cover w-full h-full" />
                    ) : (
                      <FileImage className="w-12 h-12 text-muted-foreground" />
                    )}
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => handleDeleteFile(file.id, file.file_url)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <CardContent className="p-3">
                    <p className="text-sm font-medium truncate">{file.file_name}</p>
                    {file.description && (
                      <p className="text-xs text-muted-foreground">{file.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(file.created_at), "d/MM/yyyy", { locale: es })}
                    </p>
                  </CardContent>
                </Card>
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
