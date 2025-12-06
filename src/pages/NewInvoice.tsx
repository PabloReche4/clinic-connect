import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

interface Patient {
  id: string;
  full_name: string;
}

interface Budget {
  id: string;
  total_amount: number;
  created_at: string;
  patients: {
    id: string;
    full_name: string;
  };
}

interface BudgetItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

const NewInvoice = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedBudgetId = searchParams.get("budget");

  const [patients, setPatients] = useState<Patient[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedBudgetId, setSelectedBudgetId] = useState(preselectedBudgetId || "");
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [patientId, setPatientId] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPatients();
    fetchBudgets();
  }, []);

  useEffect(() => {
    if (selectedBudgetId) {
      fetchBudgetItems(selectedBudgetId);
      const budget = budgets.find((b) => b.id === selectedBudgetId);
      if (budget) {
        setPatientId(budget.patients.id);
      }
    } else {
      setBudgetItems([]);
    }
  }, [selectedBudgetId, budgets]);

  const fetchPatients = async () => {
    const { data, error } = await supabase
      .from("patients")
      .select("id, full_name")
      .order("full_name");
    if (!error && data) setPatients(data);
  };

  const fetchBudgets = async () => {
    const { data, error } = await supabase
      .from("budgets")
      .select(`
        id,
        total_amount,
        created_at,
        patients (
          id,
          full_name
        )
      `)
      .eq("status", "approved")
      .order("created_at", { ascending: false });
    if (!error && data) setBudgets(data as Budget[]);
  };

  const fetchBudgetItems = async (budgetId: string) => {
    const { data, error } = await supabase
      .from("budget_items")
      .select("*")
      .eq("budget_id", budgetId);
    if (!error && data) setBudgetItems(data);
  };

  const calculateTotal = () => {
    return budgetItems.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBudgetId) {
      toast.error("Selecciona un presupuesto aprobado");
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
          budget_id: selectedBudgetId,
          status: "pending",
          total_amount: totalAmount,
          payment_method: paymentMethod || null,
          notes,
          created_by: user.user?.id,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      const invoiceItems = budgetItems.map((item) => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
      }));

      const { error: itemsError } = await supabase.from("invoice_items").insert(invoiceItems);

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
          <p className="text-muted-foreground">Crear una factura desde un presupuesto aprobado</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Seleccionar Presupuesto</CardTitle>
            <CardDescription>
              Solo puedes crear facturas desde presupuestos aprobados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="budget">Presupuesto Aprobado</Label>
              <Select value={selectedBudgetId} onValueChange={setSelectedBudgetId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar presupuesto" />
                </SelectTrigger>
                <SelectContent>
                  {budgets.map((budget) => (
                    <SelectItem key={budget.id} value={budget.id}>
                      {budget.patients.full_name} - €{budget.total_amount.toFixed(2)} ({new Date(budget.created_at).toLocaleDateString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {patientId && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Paciente: <span className="font-semibold text-foreground">{patients.find((p) => p.id === patientId)?.full_name}</span>
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Método de Pago</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="financiacion">Financiación</SelectItem>
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

        {budgetItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Conceptos del Presupuesto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {budgetItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{item.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} x €{item.unit_price.toFixed(2)}
                    </p>
                  </div>
                  <span className="font-semibold">€{item.subtotal.toFixed(2)}</span>
                </div>
              ))}

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-primary">€{calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate("/invoices")}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading || !selectedBudgetId}>
            {loading ? "Creando..." : "Crear Factura"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewInvoice;
