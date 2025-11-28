import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { Trash2 } from "lucide-react";

interface EditTreatmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treatment: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    duration_minutes: number | null;
    is_active: boolean | null;
  };
  onUpdated: () => void;
}

export function EditTreatmentDialog({ open, onOpenChange, treatment, onUpdated }: EditTreatmentDialogProps) {
  const [name, setName] = useState(treatment.name);
  const [description, setDescription] = useState(treatment.description || "");
  const [price, setPrice] = useState(treatment.price.toString());
  const [durationMinutes, setDurationMinutes] = useState(treatment.duration_minutes?.toString() || "");
  const [sessionsCount, setSessionsCount] = useState((treatment as any).sessions_count?.toString() || "1");
  const [isActive, setIsActive] = useState(treatment.is_active ?? true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("treatments")
        .update({
          name,
          description: description || null,
          price: parseFloat(price),
          duration_minutes: durationMinutes ? parseInt(durationMinutes) : null,
          sessions_count: parseInt(sessionsCount),
          is_active: isActive,
        })
        .eq("id", treatment.id);

      if (error) throw error;
      toast.success("Tratamiento actualizado");
      onUpdated();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from("treatments").delete().eq("id", treatment.id);
      if (error) throw error;
      toast.success("Tratamiento eliminado");
      onUpdated();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Error al eliminar: " + error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Tratamiento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Precio (€) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Duración (minutos)</Label>
              <Input
                type="number"
                min="0"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Número de sesiones *</Label>
            <Input
              type="number"
              min="1"
              value={sessionsCount}
              onChange={(e) => setSessionsCount(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Para tratamientos de sesión única, poner 1. Para tratamientos con múltiples sesiones (ej: ortodoncia), indicar el número total.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <Label>Activo</Label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <div className="flex justify-between">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar tratamiento?</AlertDialogTitle>
                  <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
