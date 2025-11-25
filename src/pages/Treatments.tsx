import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock } from "lucide-react";
import { toast } from "sonner";

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
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Tratamiento
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {treatments.length === 0 ? (
          <Card className="md:col-span-2">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No hay tratamientos registrados</p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primer Tratamiento
              </Button>
            </CardContent>
          </Card>
        ) : (
          treatments.map((treatment) => (
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
                  <Button variant="outline" className="w-full mt-2">
                    Editar Tratamiento
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Treatments;
