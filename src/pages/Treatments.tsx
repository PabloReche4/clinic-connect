import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Clock, Search } from "lucide-react";
import { toast } from "sonner";
import { CreateTreatmentDialog } from "@/components/CreateTreatmentDialog";
import { EditTreatmentDialog } from "@/components/EditTreatmentDialog";

interface Treatment {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number | null;
  is_active: boolean;
}

const Treatments = () => {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchTreatments();
  }, []);

  const fetchTreatments = async () => {
    try {
      const { data, error } = await supabase
        .from("treatments")
        .select("*")
        .order("name");

      if (error) throw error;
      setTreatments(data || []);
    } catch (error: any) {
      toast.error("Error al cargar tratamientos: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredTreatments = useMemo(() => {
    if (!searchTerm) return treatments;
    const term = searchTerm.toLowerCase();
    return treatments.filter(
      (treatment) =>
        treatment.name.toLowerCase().includes(term) ||
        treatment.description?.toLowerCase().includes(term) ||
        treatment.price.toString().includes(term)
    );
  }, [treatments, searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando tratamientos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tratamientos</h1>
          <p className="text-muted-foreground">Catálogo de tratamientos disponibles</p>
        </div>
        <CreateTreatmentDialog onTreatmentCreated={fetchTreatments} />
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, descripción o precio..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filteredTreatments.length === 0 ? (
          <Card className="md:col-span-2">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">
                {searchTerm ? "No se encontraron tratamientos" : "No hay tratamientos registrados"}
              </p>
              {!searchTerm && <CreateTreatmentDialog onTreatmentCreated={fetchTreatments} />}
            </CardContent>
          </Card>
        ) : (
          filteredTreatments.map((treatment) => (
            <Card key={treatment.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{treatment.name}</CardTitle>
                  <Badge variant={treatment.is_active ? "default" : "outline"}>
                    {treatment.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
                {treatment.description && (
                  <CardDescription className="line-clamp-2">
                    {treatment.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Precio:</span>
                    <span className="text-xl font-bold text-primary">€{treatment.price.toFixed(2)}</span>
                  </div>
                  {treatment.duration_minutes && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{treatment.duration_minutes} minutos</span>
                    </div>
                  )}
                  <Button variant="outline" className="w-full mt-2" onClick={() => setEditingTreatment(treatment)}>
                    Editar Tratamiento
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {editingTreatment && (
        <EditTreatmentDialog
          open={!!editingTreatment}
          onOpenChange={(open) => !open && setEditingTreatment(null)}
          treatment={editingTreatment}
          onUpdated={fetchTreatments}
        />
      )}
    </div>
  );
};

export default Treatments;
