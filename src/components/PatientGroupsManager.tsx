import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, Plus, Trash2, Search } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface PatientGroup {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface PatientGroupsManagerProps {
  onGroupsChange: () => void;
}

export const PatientGroupsManager = ({ onGroupsChange }: PatientGroupsManagerProps) => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<PatientGroup[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from("patient_groups")
        .select("*")
        .order("name");

      if (error) throw error;
      setGroups(data || []);
    } catch (error: any) {
      toast.error("Error al cargar grupos: " + error.message);
    }
  };

  const filteredGroups = useMemo(() => {
    if (!searchTerm) return groups;
    const term = searchTerm.toLowerCase();
    return groups.filter(
      (group) =>
        group.name.toLowerCase().includes(term) ||
        group.description?.toLowerCase().includes(term)
    );
  }, [groups, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("patient_groups").insert([{
        name: formData.name,
        description: formData.description || null,
      }]);

      if (error) throw error;

      toast.success("Grupo creado exitosamente");
      setOpen(false);
      setFormData({ name: "", description: "" });
      fetchGroups();
      onGroupsChange();
    } catch (error: any) {
      toast.error("Error al crear grupo: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("patient_groups")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Grupo eliminado exitosamente");
      fetchGroups();
      onGroupsChange();
    } catch (error: any) {
      toast.error("Error al eliminar grupo: " + error.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Grupos de Pacientes</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Grupo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Grupo</DialogTitle>
              <DialogDescription>
                Crea un grupo para organizar a tus pacientes
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Grupo *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creando..." : "Crear Grupo"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar grupos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {filteredGroups.length === 0 ? (
          <p className="text-sm text-muted-foreground col-span-full">
            {searchTerm ? "No se encontraron grupos" : "No hay grupos creados"}
          </p>
        ) : (
          filteredGroups.map((group) => (
            <Card key={group.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/groups/${group.id}`)}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <CardTitle className="text-base">{group.name}</CardTitle>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar grupo?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Los pacientes del grupo no se eliminarán.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(group.id)}>
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                {group.description && (
                  <CardDescription className="text-sm line-clamp-2">
                    {group.description}
                  </CardDescription>
                )}
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
