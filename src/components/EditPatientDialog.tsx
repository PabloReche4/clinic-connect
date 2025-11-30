import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface EditPatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: {
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
    patient_groups: { id: string; name: string } | null;
  };
  groups: { id: string; name: string }[];
  onUpdated: () => void;
}

export function EditPatientDialog({ open, onOpenChange, patient, groups, onUpdated }: EditPatientDialogProps) {
  const [fullName, setFullName] = useState(patient.full_name);
  const [email, setEmail] = useState(patient.email || "");
  const [phone, setPhone] = useState(patient.phone);
  const [address, setAddress] = useState(patient.address || "");
  const [dni, setDni] = useState(patient.dni || "");
  const [birthDate, setBirthDate] = useState(patient.birth_date || "");
  const [notes, setNotes] = useState(patient.notes || "");
  const [groupId, setGroupId] = useState(patient.patient_groups?.id || "none");
  const [allergies, setAllergies] = useState(patient.allergies || "");
  const [medicalConditions, setMedicalConditions] = useState(patient.medical_conditions || "");
  const [currentMedications, setCurrentMedications] = useState(patient.current_medications || "");
  const [medicalNotes, setMedicalNotes] = useState(patient.medical_notes || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFullName(patient.full_name);
    setEmail(patient.email || "");
    setPhone(patient.phone);
    setAddress(patient.address || "");
    setDni(patient.dni || "");
    setBirthDate(patient.birth_date || "");
    setNotes(patient.notes || "");
    setGroupId(patient.patient_groups?.id || "none");
    setAllergies(patient.allergies || "");
    setMedicalConditions(patient.medical_conditions || "");
    setCurrentMedications(patient.current_medications || "");
    setMedicalNotes(patient.medical_notes || "");
  }, [patient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("patients")
        .update({
          full_name: fullName,
          email: email || null,
          phone,
          address: address || null,
          dni: dni || null,
          birth_date: birthDate || null,
          notes: notes || null,
          group_id: groupId === "none" ? null : groupId,
          allergies: allergies || null,
          medical_conditions: medicalConditions || null,
          current_medications: currentMedications || null,
          medical_notes: medicalNotes || null,
        })
        .eq("id", patient.id);

      if (error) throw error;
      toast.success("Paciente actualizado");
      onUpdated();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Paciente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre completo *</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>DNI</Label>
              <Input value={dni} onChange={(e) => setDni(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Teléfono *</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Dirección</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha de nacimiento</Label>
              <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Grupo</Label>
              <Select value={groupId} onValueChange={setGroupId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin grupo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin grupo</SelectItem>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>

          <div className="border-t pt-4 mt-4">
            <h3 className="font-semibold text-lg mb-4 text-destructive">Historial Clínico</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-destructive">Alergias a Medicamentos</Label>
                <Textarea
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="Ej: Penicilina, Ibuprofeno..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Condiciones Médicas</Label>
                <Textarea
                  value={medicalConditions}
                  onChange={(e) => setMedicalConditions(e.target.value)}
                  placeholder="Ej: Diabetes, Hipertensión..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Medicación Actual</Label>
                <Textarea
                  value={currentMedications}
                  onChange={(e) => setCurrentMedications(e.target.value)}
                  placeholder="Ej: Metformina 850mg..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Notas Médicas Adicionales</Label>
                <Textarea
                  value={medicalNotes}
                  onChange={(e) => setMedicalNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
