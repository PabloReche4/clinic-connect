import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Download } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { generateBudgetPDF } from "@/utils/pdfGenerator";

interface Budget {
  id: string;
  status: string;
  total_amount: number;
  valid_until: string | null;
  created_at: string;
  patients: {
    full_name: string;
  };
}

const Budgets = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      const { data, error } = await supabase
        .from("budgets")
        .select(`
          id,
          status,
          total_amount,
          valid_until,
          created_at,
          notes,
          patients (
            full_name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBudgets(data || []);
    } catch (error: any) {
      toast.error("Error al cargar presupuestos: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (budgetId: string) => {
    try {
      const { data: budget, error: budgetError } = await supabase
        .from("budgets")
        .select(`
          *,
          patients (
            full_name
          )
        `)
        .eq("id", budgetId)
        .single();

      if (budgetError) throw budgetError;

      const { data: items, error: itemsError } = await supabase
        .from("budget_items")
        .select("*")
        .eq("budget_id", budgetId);

      if (itemsError) throw itemsError;

      generateBudgetPDF({
        patient_name: budget.patients.full_name,
        created_at: budget.created_at,
        valid_until: budget.valid_until,
        status: budget.status,
        total_amount: budget.total_amount,
        notes: budget.notes,
        items: items,
      });

      toast.success("PDF generado exitosamente");
    } catch (error: any) {
      toast.error("Error al generar PDF: " + error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendiente", variant: "outline" as const },
      approved: { label: "Aprobado", variant: "default" as const },
      rejected: { label: "Rechazado", variant: "destructive" as const },
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando presupuestos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Presupuestos</h1>
          <p className="text-muted-foreground">Gestión de presupuestos para pacientes</p>
        </div>
        <Link to="/budgets/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Presupuesto
          </Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {budgets.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No hay presupuestos registrados</p>
              <Link to="/budgets/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primer Presupuesto
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          budgets.map((budget) => (
            <Card key={budget.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      Presupuesto para {budget.patients.full_name}
                    </CardTitle>
                    <CardDescription>
                      {format(new Date(budget.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                      {budget.valid_until && (
                        <> • Válido hasta {format(new Date(budget.valid_until), "d/MM/yyyy", { locale: es })}</>
                      )}
                    </CardDescription>
                  </div>
                  {getStatusBadge(budget.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <p className="text-2xl font-bold text-primary">
                    €{budget.total_amount.toFixed(2)}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleDownloadPDF(budget.id)}>
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="outline">Ver Detalles</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Budgets;
