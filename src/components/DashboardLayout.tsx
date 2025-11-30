import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  FileText,
  ClipboardList,
  Stethoscope,
  Users,
  LogOut,
  CalendarDays,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import clinicaLogo from "@/assets/clinica-dental-reche-logo.jpg";

interface DashboardLayoutProps {
  children: ReactNode;
}

const menuItems = [
  { icon: CalendarDays, label: "Citas", path: "/appointments" },
  { icon: FileText, label: "Facturas", path: "/invoices" },
  { icon: ClipboardList, label: "Presupuestos", path: "/budgets" },
  { icon: TrendingUp, label: "Ingresos", path: "/revenue" },
  { icon: Stethoscope, label: "Tratamientos", path: "/treatments" },
  { icon: Users, label: "Pacientes", path: "/patients" },
];

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { signOut, user } = useAuth();
  const location = useLocation();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
        <Link to="/" className="p-6 border-b border-sidebar-border hover:bg-sidebar-accent transition-colors">
          <div className="flex items-center gap-3">
            <img src={clinicaLogo} alt="Clínica Dental Reche" className="w-10 h-10 rounded-lg object-cover" />
            <div>
              <h1 className="text-lg font-bold text-sidebar-foreground">Clínica Dental Reche</h1>
              <p className="text-xs text-sidebar-foreground/60">Sistema de Gestión</p>
            </div>
          </div>
        </Link>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="mb-4 p-3 bg-sidebar-accent rounded-lg">
            <p className="text-sm text-sidebar-foreground font-medium truncate">
              {user?.email}
            </p>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={signOut}
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;
