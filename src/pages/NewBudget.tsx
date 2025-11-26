import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

interface Patient {
  id: string;
  full_name: string;
}

interface Treatment {
  id: string;
  name: string;
  price: number;
}

interface BudgetItem {
  treatment_id: string;
  treatment_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

const NewBudget = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [formData, setFormData] = useState({
    patient_id: "",
    valid_until: "",
    notes: "",
  });

  useEffect(() => {
    fetchPatients();
    fetchTreatments();
  }, []);

  const fetchPatients = async () => {
    const { data, error } = await supabase
      .from("patients")
      .select("id, full_name")
      .order("full_name");

    if (error) {
      toast.error("Error al cargar pacientes");
      return;
    }
    setPatients(data || []);
  };

  const fetchTreatments = async () => {
    const { data, error } = await supabase
      .from("treatments")
      .select("id, name, price")
      .eq("is_active", true)
      .order("name");

    if (error) {
      toast.error("Error al cargar tratamientos");
      return;
    }
    setTreatments(data || []);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        treatment_id: "",
        treatment_name: "",
        quantity: 1,
        unit_price: 0,
        subtotal: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof BudgetItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === "treatment_id") {
      const treatment = treatments.find((t) => t.id === value);
      if (treatment) {
        newItems[index].treatment_name = treatment.name;
        newItems[index].unit_price = treatment.price;
        newItems[index].subtotal = treatment.price * newItems[index].quantity;
      }
    } else if (field === "quantity") {
      newItems[index].subtotal = newItems[index].unit_price * value;
    }

    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.length === 0) {
      toast.error("Añade al menos un tratamiento");
      return;
    }

    if (!formData.patient_id) {
      toast.error("Selecciona un paciente");
      return;
    }

    setLoading(true);

    try {
      const total = calculateTotal();

      const { data: budget, error: budgetError } = await supabase
        .from("budgets")
        .insert([{
          patient_id: formData.patient_id,
          total_amount: total,
          valid_until: formData.valid_until || null,
          notes: formData.notes || null,
          status: "pending",
        }])
        .select()
        .single();

      if (budgetError) throw budgetError;

      const budgetItems = items.map((item) => ({
        budget_id: budget.id,
        treatment_id: item.treatment_id,
        description: item.treatment_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
      }));

      const { error: itemsError } = await supabase
        .from("budget_items")
        .insert(budgetItems);

      if (itemsError) throw itemsError;

      toast.success("Presupuesto creado exitosamente");
      navigate("/budgets");
    } catch (error: any) {
      toast.error("Error al crear presupuesto: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/budgets")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nuevo Presupuesto</h1>
          <p className="text-muted-foreground">Crea un presupuesto para un paciente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información del Presupuesto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patient">Paciente *</Label>
                <Select value={formData.patient_id} onValueChange={(value) => setFormData({ ...formData, patient_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="valid_until">Válido Hasta</Label>
                <Input
                  id="valid_until"
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Tratamientos</CardTitle>
                <CardDescription>Añade los tratamientos del presupuesto</CardDescription>
              </div>
              <Button type="button" onClick={addItem} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Añadir Tratamiento
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay tratamientos añadidos
              </p>
            ) : (
              items.map((item, index) => (
                <div key={index} className="flex gap-4 items-end border-b pb-4 last:border-0">
                  <div className="flex-1 space-y-2">
                    <Label>Tratamiento *</Label>
                    <Select
                      value={item.treatment_id}
                      onValueChange={(value) => updateItem(index, "treatment_id", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {treatments.map((treatment) => (
                          <SelectItem key={treatment.id} value={treatment.id}>
                            {treatment.name} - €{treatment.price.toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24 space-y-2">
                    <Label>Cantidad</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="w-32 space-y-2">
                    <Label>Precio Unit.</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="w-32 space-y-2">
                    <Label>Subtotal</Label>
                    <div className="h-10 flex items-center font-semibold">
                      €{item.subtotal.toFixed(2)}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
            
            {items.length > 0 && (
              <div className="flex justify-end items-center gap-4 pt-4 border-t">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-2xl font-bold text-primary">
                  €{calculateTotal().toFixed(2)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate("/budgets")}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creando..." : "Crear Presupuesto"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewBudget;
