import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, Phone, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import { EditGroupDialog } from "@/components/EditGroupDialog";

interface PatientGroup {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface Patient {
  id: string;
  full_name: string;
  email: string | null;
  phone: string;
}

const GroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState<PatientGroup | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    if (id) fetchGroup();
  }, [id]);

  const fetchGroup = async () => {
    try {
      const [groupRes, patientsRes] = await Promise.all([
        supabase.from("patient_groups").select("*").eq("id", id).maybeSingle(),
        supabase
          .from("patients")
          .select("id, full_name, email, phone")
          .eq("group_id", id)
          .order("full_name"),
      ]);

      if (groupRes.error) throw groupRes.error;
      if (!groupRes.data) {
        toast.error("Grupo no encontrado");
        navigate("/patients");
        return;
      }
      setGroup(groupRes.data);
      setPatients(patientsRes.data || []);
    } catch (error: any) {
      toast.error("Error al cargar grupo: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      // First remove group_id from patients
      await supabase.from("patients").update({ group_id: null }).eq("group_id", id);
      const { error } = await supabase.from("patient_groups").delete().eq("id", id);
      if (error) throw error;
      toast.success("Grupo eliminado");
      navigate("/patients");
    } catch (error: any) {
      toast.error("Error al eliminar: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!group) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/patients")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{group.name}</h1>
            {group.description && <p className="text-muted-foreground">{group.description}</p>}
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
                <AlertDialogTitle>¿Eliminar grupo?</AlertDialogTitle>
                <AlertDialogDescription>
                  Los pacientes del grupo no serán eliminados, solo se les quitará del grupo.
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

      <Card>
        <CardHeader>
          <CardTitle>Pacientes en este grupo ({patients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {patients.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No hay pacientes en este grupo</p>
          ) : (
            <div className="space-y-4">
              {patients.map((patient) => (
                <div
                  key={patient.id}
                  className="flex justify-between items-center p-4 border rounded-lg cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/patients/${patient.id}`)}
                >
                  <div>
                    <p className="font-medium">{patient.full_name}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {patient.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {patient.email}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {patient.phone}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <EditGroupDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        group={group}
        onUpdated={fetchGroup}
      />
    </div>
  );
};

export default GroupDetail;
