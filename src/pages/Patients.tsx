import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CreatePatientDialog } from "@/components/CreatePatientDialog";
import { PatientGroupsManager } from "@/components/PatientGroupsManager";

interface Patient {
  id: string;
  full_name: string;
  email: string | null;
  phone: string;
  address: string | null;
  dni: string | null;
  birth_date: string | null;
  created_at: string;
  patient_groups: {
    name: string;
  } | null;
}

interface PatientGroup {
  id: string;
  name: string;
}

const Patients = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [groups, setGroups] = useState<PatientGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
    fetchGroups();
  }, []);

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from("patients")
        .select(`
          *,
          patient_groups (
            name
          )
        `)
        .order("full_name");

      if (error) throw error;
      setPatients(data || []);
    } catch (error: any) {
      toast.error("Error al cargar pacientes: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from("patient_groups")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setGroups(data || []);
    } catch (error: any) {
      toast.error("Error al cargar grupos: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando pacientes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pacientes</h1>
          <p className="text-muted-foreground">Gestión de pacientes de la clínica</p>
        </div>
        <CreatePatientDialog onPatientCreated={fetchPatients} groups={groups} />
      </div>

      <Tabs defaultValue="patients" className="space-y-4">
        <TabsList>
          <TabsTrigger value="patients">Lista de Pacientes</TabsTrigger>
          <TabsTrigger value="groups">Grupos</TabsTrigger>
        </TabsList>

        <TabsContent value="patients" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {patients.length === 0 ? (
              <Card className="md:col-span-2 lg:col-span-3">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground mb-4">No hay pacientes registrados</p>
                  <CreatePatientDialog onPatientCreated={fetchPatients} groups={groups} />
                </CardContent>
              </Card>
            ) : (
              patients.map((patient) => (
                <Card key={patient.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{patient.full_name}</CardTitle>
                    <CardDescription>
                      {patient.dni && `DNI: ${patient.dni}`}
                      {patient.patient_groups && (
                        <span className="block text-xs mt-1">
                          Grupo: {patient.patient_groups.name}
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {patient.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="truncate">{patient.email}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{patient.phone}</span>
                      </div>
                      {patient.address && (
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <span className="line-clamp-2">{patient.address}</span>
                        </div>
                      )}
                      {patient.birth_date && (
                        <p className="text-sm text-muted-foreground">
                          Nacimiento: {format(new Date(patient.birth_date), "d 'de' MMMM, yyyy", { locale: es })}
                        </p>
                      )}
                      <Button variant="outline" className="w-full mt-2" onClick={() => navigate(`/patients/${patient.id}`)}>
                        Ver Historial
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="groups">
          <PatientGroupsManager onGroupsChange={fetchGroups} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Patients;
