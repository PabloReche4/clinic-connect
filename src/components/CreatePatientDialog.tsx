import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface PatientGroup {
  id: string;
  name: string;
}

interface CreatePatientDialogProps {
  onPatientCreated: () => void;
  groups: PatientGroup[];
}

export const CreatePatientDialog = ({ onPatientCreated, groups }: CreatePatientDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    dni: "",
    birth_date: "",
    group_id: "",
    notes: "",
    allergies: "",
    medical_conditions: "",
    current_medications: "",
    medical_notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("patients").insert([{
        full_name: formData.full_name,
        email: formData.email || null,
        phone: formData.phone,
        address: formData.address || null,
        dni: formData.dni || null,
        birth_date: formData.birth_date || null,
        group_id: formData.group_id || null,
        notes: formData.notes || null,
        allergies: formData.allergies || null,
        medical_conditions: formData.medical_conditions || null,
        current_medications: formData.current_medications || null,
        medical_notes: formData.medical_notes || null,
      }]);

      if (error) throw error;

      toast.success("Paciente creado exitosamente");
      setOpen(false);
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        address: "",
        dni: "",
        birth_date: "",
        group_id: "",
        notes: "",
        allergies: "",
        medical_conditions: "",
        current_medications: "",
        medical_notes: "",
      });
      onPatientCreated();
    } catch (error: any) {
      toast.error("Error al crear paciente: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Paciente
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Paciente</DialogTitle>
          <DialogDescription>
            Completa los datos del nuevo paciente
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nombre Completo *</Label>
              <Input
                id="full_name"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dni">DNI</Label>
              <Input
                id="dni"
                value={formData.dni}
                onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono *</Label>
              <Input
                id="phone"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="birth_date">Fecha de Nacimiento</Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group_id">Grupo de Pacientes</Label>
              <Select value={formData.group_id} onValueChange={(value) => setFormData({ ...formData, group_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar grupo" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>

          <div className="border-t pt-4 mt-4">
            <h3 className="font-semibold text-lg mb-4 text-destructive">Historial Clínico</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="allergies" className="text-destructive">Alergias a Medicamentos</Label>
                <Textarea
                  id="allergies"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  placeholder="Ej: Penicilina, Ibuprofeno..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medical_conditions">Condiciones Médicas</Label>
                <Textarea
                  id="medical_conditions"
                  value={formData.medical_conditions}
                  onChange={(e) => setFormData({ ...formData, medical_conditions: e.target.value })}
                  placeholder="Ej: Diabetes, Hipertensión..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="current_medications">Medicación Actual</Label>
                <Textarea
                  id="current_medications"
                  value={formData.current_medications}
                  onChange={(e) => setFormData({ ...formData, current_medications: e.target.value })}
                  placeholder="Ej: Metformina 850mg..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medical_notes">Notas Médicas Adicionales</Label>
                <Textarea
                  id="medical_notes"
                  value={formData.medical_notes}
                  onChange={(e) => setFormData({ ...formData, medical_notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear Paciente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
