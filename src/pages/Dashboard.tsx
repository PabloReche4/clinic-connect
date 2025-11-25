import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ClipboardList, Stethoscope, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const quickLinks = [
    {
      title: "Facturas",
      description: "Gestionar facturas y pagos",
      icon: FileText,
      path: "/invoices",
      color: "bg-blue-500",
    },
    {
      title: "Presupuestos",
      description: "Crear y revisar presupuestos",
      icon: ClipboardList,
      path: "/budgets",
      color: "bg-green-500",
    },
    {
      title: "Tratamientos",
      description: "Catálogo de tratamientos",
      icon: Stethoscope,
      path: "/treatments",
      color: "bg-purple-500",
    },
    {
      title: "Pacientes",
      description: "Gestión de pacientes",
      icon: Users,
      path: "/patients",
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bienvenido a la Clínica Dental</h1>
        <p className="text-muted-foreground">Sistema de Gestión Interna</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Card
              key={link.path}
              className="cursor-pointer hover:shadow-lg transition-all"
              onClick={() => navigate(link.path)}
            >
              <CardHeader>
                <div className={`w-12 h-12 ${link.color} rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg">{link.title}</CardTitle>
                <CardDescription>{link.description}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Acceso Rápido</CardTitle>
          <CardDescription>
            Desde aquí puedes acceder a todas las funciones del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Selecciona una opción del menú lateral o de las tarjetas superiores para comenzar.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
