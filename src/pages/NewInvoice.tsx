import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { z } from "zod";

interface Patient {
  id: string;
  full_name: string;
}

interface Treatment {
  id: string;
  name: string;
  price: number;
}

interface InvoiceItem {
  treatment_id: string;
  description: string;
  quantity: number;
  unit_price: number;
}

const NewInvoice = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [patientId, setPatientId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPatients();
    fetchTreatments();
  }, []);

  const fetchPatients = async () => {
    const { data, error } = await supabase
      .from("patients")
      .select("id, full_name")
      .order("full_name");
    
    if (!error && data) setPatients(data);
  };

  const fetchTreatments = async () => {
    const { data, error } = await supabase
      .from("treatments")
      .select("id, name, price")
      .eq("is_active", true)
      .order("name");
    
    if (!error && data) setTreatments(data);
  };

  const addItem = () => {
    setItems([...items, { treatment_id: "", description: "", quantity: 1, unit_price: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === "treatment_id" && value) {
      const treatment = treatments.find(t => t.id === value);
      if (treatment) {
        newItems[index].description = treatment.name;
        newItems[index].unit_price = treatment.price;
      }
    }
    
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!patientId) {
      toast.error("Selecciona un paciente");
      return;
    }
    
    if (items.length === 0) {
      toast.error("Añade al menos un tratamiento");
      return;
    }

    setLoading(true);
    
    try {
      const invoiceNumber = `F${Date.now()}`;
      const totalAmount = calculateTotal();
      
      const { data: user } = await supabase.auth.getUser();
      
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          invoice_number: invoiceNumber,
          patient_id: patientId,
          status: "pending",
          total_amount: totalAmount,
          notes,
          created_by: user.user?.id,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      const invoiceItems = items.map(item => ({
        invoice_id: invoice.id,
        treatment_id: item.treatment_id || null,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.quantity * item.unit_price,
      }));

      const { error: itemsError } = await supabase
        .from("invoice_items")
        .insert(invoiceItems);

      if (itemsError) throw itemsError;

      toast.success("Factura creada correctamente");
      navigate("/invoices");
    } catch (error: any) {
      toast.error("Error al crear factura: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/invoices")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nueva Factura</h1>
          <p className="text-muted-foreground">Crear una nueva factura para un paciente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información de la Factura</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patient">Paciente</Label>
              <Select value={patientId} onValueChange={setPatientId} required>
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
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas adicionales sobre la factura"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Tratamientos</CardTitle>
                <CardDescription>Añade los tratamientos realizados</CardDescription>
              </div>
              <Button type="button" onClick={addItem} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Añadir Tratamiento
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="flex gap-4 p-4 border rounded-lg">
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tratamiento</Label>
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
                              {treatment.name} - €{treatment.price}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Cantidad</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(index, "description", e.target.value)}
                      placeholder="Descripción del tratamiento"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Precio Unitario (€)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, "unit_price", parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="pt-2">
                    <p className="text-sm text-muted-foreground">
                      Subtotal: <span className="font-semibold text-foreground">€{(item.quantity * item.unit_price).toFixed(2)}</span>
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(index)}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}

            {items.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No hay tratamientos añadidos. Haz clic en "Añadir Tratamiento" para empezar.
              </p>
            )}

            {items.length > 0 && (
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-primary">€{calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate("/invoices")}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creando..." : "Crear Factura"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewInvoice;
