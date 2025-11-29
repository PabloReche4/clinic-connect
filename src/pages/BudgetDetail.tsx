import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Check, X, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { generateBudgetPDF } from "@/utils/pdfGenerator";
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
import { EditBudgetDialog } from "@/components/EditBudgetDialog";

interface BudgetItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface Budget {
  id: string;
  status: string;
  total_amount: number;
  valid_until: string | null;
  created_at: string;
  notes: string | null;
  patients: {
    id: string;
    full_name: string;
  };
}

const BudgetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    if (id) fetchBudget();
  }, [id]);

  const fetchBudget = async () => {
    try {
      const { data: budgetData, error: budgetError } = await supabase
        .from("budgets")
        .select(`
          *,
          patients (
            id,
            full_name
          )
        `)
        .eq("id", id)
        .maybeSingle();

      if (budgetError) throw budgetError;
      if (!budgetData) {
        toast.error("Presupuesto no encontrado");
        navigate("/budgets");
        return;
      }
      setBudget(budgetData);

      const { data: itemsData, error: itemsError } = await supabase
        .from("budget_items")
        .select("*")
        .eq("budget_id", id);

      if (itemsError) throw itemsError;
      setItems(itemsData || []);
    } catch (error: any) {
      toast.error("Error al cargar presupuesto: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from("budgets")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;
      toast.success(`Presupuesto ${newStatus === "approved" ? "aprobado" : "rechazado"}`);
      fetchBudget();
    } catch (error: any) {
      toast.error("Error al actualizar estado: " + error.message);
    }
  };

  const handleDelete = async () => {
    try {
      await supabase.from("budget_items").delete().eq("budget_id", id);
      const { error } = await supabase.from("budgets").delete().eq("id", id);
      if (error) throw error;
      toast.success("Presupuesto eliminado");
      navigate("/budgets");
    } catch (error: any) {
      toast.error("Error al eliminar: " + error.message);
    }
  };

  const handleDownloadPDF = async () => {
    if (!budget) return;
    await generateBudgetPDF({
      patient_name: budget.patients.full_name,
      created_at: budget.created_at,
      valid_until: budget.valid_until,
      status: budget.status,
      total_amount: budget.total_amount,
      notes: budget.notes,
      items: items,
    });
    toast.success("PDF generado");
  };

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { label: "Pendiente", variant: "outline" as const },
      approved: { label: "Aprobado", variant: "default" as const },
      rejected: { label: "Rechazado", variant: "destructive" as const },
    };
    const c = config[status as keyof typeof config];
    return <Badge variant={c?.variant}>{c?.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!budget) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/budgets")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Presupuesto</h1>
            <p className="text-muted-foreground">Para {budget.patients.full_name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
            <Pencil className="w-4 h-4 mr-2" />
            Editar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar presupuesto?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estado:</span>
              {getStatusBadge(budget.status)}
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha:</span>
              <span>{format(new Date(budget.created_at), "d 'de' MMMM, yyyy", { locale: es })}</span>
            </div>
            {budget.valid_until && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Válido hasta:</span>
                <span>{format(new Date(budget.valid_until), "d/MM/yyyy", { locale: es })}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total:</span>
              <span className="text-2xl font-bold text-primary">€{budget.total_amount.toFixed(2)}</span>
            </div>
            {budget.notes && (
              <div>
                <span className="text-muted-foreground">Notas:</span>
                <p className="mt-1">{budget.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {budget.status === "pending" && (
              <>
                <Button className="w-full" onClick={() => updateStatus("approved")}>
                  <Check className="w-4 h-4 mr-2" />
                  Aprobar Presupuesto
                </Button>
                <Button variant="destructive" className="w-full" onClick={() => updateStatus("rejected")}>
                  <X className="w-4 h-4 mr-2" />
                  Rechazar Presupuesto
                </Button>
              </>
            )}
            {budget.status === "approved" && (
              <Button className="w-full" onClick={() => navigate(`/invoices/new?budget=${budget.id}`)}>
                Crear Factura desde Presupuesto
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tratamientos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items.map((item) => (
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
          </div>
        </CardContent>
      </Card>

      <EditBudgetDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        budget={budget}
        onUpdated={fetchBudget}
      />
    </div>
  );
};

export default BudgetDetail;
