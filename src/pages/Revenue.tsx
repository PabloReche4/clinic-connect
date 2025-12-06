import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Euro, FileText, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, parseISO, eachMonthOfInterval, isSameMonth } from "date-fns";
import { es } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

interface Invoice {
  id: string;
  invoice_number: string;
  status: string;
  total_amount: number;
  payment_date: string | null;
  created_at: string;
  payment_method: string | null;
  patients: {
    full_name: string;
  } | null;
}

const Revenue = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select(`*, patients (full_name)`)
        .eq("status", "paid")
        .order("payment_date", { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error: any) {
      toast.error("Error al cargar facturas: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const paymentDate = inv.payment_date || inv.created_at;
      const date = new Date(paymentDate);
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      return date >= start && date <= end;
    });
  }, [invoices, startDate, endDate]);

  const totalRevenue = useMemo(() => {
    return filteredInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
  }, [filteredInvoices]);

  const averageInvoice = useMemo(() => {
    if (filteredInvoices.length === 0) return 0;
    return totalRevenue / filteredInvoices.length;
  }, [filteredInvoices, totalRevenue]);

  // Datos para gráfico mensual
  const monthlyChartData = useMemo(() => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const months = eachMonthOfInterval({ start, end });

    return months.map((month) => {
      const monthInvoices = filteredInvoices.filter((inv) => {
        const invDate = new Date(inv.payment_date || inv.created_at);
        return isSameMonth(invDate, month);
      });
      const total = monthInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
      return {
        month: format(month, "MMM yyyy", { locale: es }),
        total,
        count: monthInvoices.length,
      };
    });
  }, [filteredInvoices, startDate, endDate]);

  // Datos por método de pago
  const paymentMethodData = useMemo(() => {
    const methods: Record<string, number> = {};
    filteredInvoices.forEach((inv) => {
      const method = inv.payment_method || "Sin especificar";
      methods[method] = (methods[method] || 0) + inv.total_amount;
    });

    const labels: Record<string, string> = {
      efectivo: "Efectivo",
      tarjeta: "Tarjeta",
      transferencia: "Transferencia",
      financiacion: "Financiación",
      "Sin especificar": "Sin especificar",
    };

    return Object.entries(methods).map(([method, total]) => ({
      method: labels[method] || method,
      total,
    }));
  }, [filteredInvoices]);

  const setQuickRange = (range: string) => {
    const now = new Date();
    switch (range) {
      case "thisMonth":
        setStartDate(format(startOfMonth(now), "yyyy-MM-dd"));
        setEndDate(format(endOfMonth(now), "yyyy-MM-dd"));
        break;
      case "lastMonth":
        const lastMonth = subMonths(now, 1);
        setStartDate(format(startOfMonth(lastMonth), "yyyy-MM-dd"));
        setEndDate(format(endOfMonth(lastMonth), "yyyy-MM-dd"));
        break;
      case "last3Months":
        setStartDate(format(startOfMonth(subMonths(now, 2)), "yyyy-MM-dd"));
        setEndDate(format(endOfMonth(now), "yyyy-MM-dd"));
        break;
      case "thisYear":
        setStartDate(format(startOfYear(now), "yyyy-MM-dd"));
        setEndDate(format(endOfYear(now), "yyyy-MM-dd"));
        break;
      case "all":
        setStartDate("2020-01-01");
        setEndDate(format(now, "yyyy-MM-dd"));
        break;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ingresos</h1>
        <p className="text-muted-foreground">Resumen de facturación por período</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Filtrar por Fechas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label>Desde</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Hasta</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => setQuickRange("thisMonth")}>
                Este mes
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQuickRange("lastMonth")}>
                Mes anterior
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQuickRange("last3Months")}>
                Últimos 3 meses
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQuickRange("thisYear")}>
                Este año
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQuickRange("all")}>
                Todo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Facturado</CardTitle>
            <Euro className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              €{totalRevenue.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              En el período seleccionado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Facturas Pagadas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{filteredInvoices.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Total de facturas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio por Factura</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              €{averageInvoice.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Media de facturación</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ingresos por Mes</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    formatter={(value: number) => [`€${value.toFixed(2)}`, "Total"]}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No hay datos para mostrar</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Por Método de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentMethodData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={paymentMethodData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="method" type="category" className="text-xs" width={100} />
                  <Tooltip
                    formatter={(value: number) => [`€${value.toFixed(2)}`, "Total"]}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="total" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No hay datos para mostrar</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalle de Facturas Pagadas</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No hay facturas pagadas en este período
            </p>
          ) : (
            <div className="space-y-4">
              {filteredInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex justify-between items-center p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">#{invoice.invoice_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {invoice.patients?.full_name || "Paciente desconocido"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {invoice.payment_date
                        ? format(new Date(invoice.payment_date), "d 'de' MMMM, yyyy", { locale: es })
                        : format(new Date(invoice.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">
                      €{invoice.total_amount.toFixed(2)}
                    </p>
                    <Badge variant="default">Pagada</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Revenue;
