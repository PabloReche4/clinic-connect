import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Clock, User, Phone, Trash2, Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
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

interface Appointment {
  id: string;
  patient_id: string | null;
  patient_name: string;
  patient_phone: string | null;
  patient_email: string | null;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  treatment_type: string | null;
  notes: string | null;
  status: string;
  source: string;
  created_at: string;
}

interface Patient {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
}

const Appointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);

  // Form state
  const [selectedPatientId, setSelectedPatientId] = useState<string>("new");
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [duration, setDuration] = useState("30");
  const [treatmentType, setTreatmentType] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appointmentsRes, patientsRes] = await Promise.all([
        supabase
          .from("appointments")
          .select("*")
          .order("appointment_date", { ascending: true })
          .order("appointment_time", { ascending: true }),
        supabase.from("patients").select("id, full_name, phone, email").order("full_name"),
      ]);

      if (appointmentsRes.error) throw appointmentsRes.error;
      if (patientsRes.error) throw patientsRes.error;

      setAppointments(appointmentsRes.data || []);
      setPatients(patientsRes.data || []);
    } catch (error: any) {
      toast.error("Error al cargar citas: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const matchesSearch =
        searchTerm === "" ||
        apt.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.patient_phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.treatment_type?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [appointments, searchTerm]);

  const appointmentsForSelectedDate = useMemo(() => {
    return filteredAppointments.filter((apt) =>
      isSameDay(new Date(apt.appointment_date), selectedDate)
    );
  }, [filteredAppointments, selectedDate]);

  const datesWithAppointments = useMemo(() => {
    return appointments.map((apt) => new Date(apt.appointment_date));
  }, [appointments]);

  const handlePatientSelect = (patientId: string) => {
    setSelectedPatientId(patientId);
    if (patientId !== "new") {
      const patient = patients.find((p) => p.id === patientId);
      if (patient) {
        setPatientName(patient.full_name);
        setPatientPhone(patient.phone);
        setPatientEmail(patient.email || "");
      }
    } else {
      setPatientName("");
      setPatientPhone("");
      setPatientEmail("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !appointmentDate || !appointmentTime) {
      toast.error("Complete los campos requeridos");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("appointments").insert({
        patient_id: selectedPatientId !== "new" ? selectedPatientId : null,
        patient_name: patientName,
        patient_phone: patientPhone || null,
        patient_email: patientEmail || null,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        duration_minutes: parseInt(duration),
        treatment_type: treatmentType || null,
        notes: notes || null,
        status: "scheduled",
        source: "manual",
      });

      if (error) throw error;

      toast.success("Cita creada correctamente");
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error("Error al crear cita: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setSelectedPatientId("new");
    setPatientName("");
    setPatientPhone("");
    setPatientEmail("");
    setAppointmentDate("");
    setAppointmentTime("");
    setDuration("30");
    setTreatmentType("");
    setNotes("");
  };

  const handleDeleteAppointment = async (id: string) => {
    try {
      const { error } = await supabase.from("appointments").delete().eq("id", id);
      if (error) throw error;
      toast.success("Cita eliminada");
      fetchData();
    } catch (error: any) {
      toast.error("Error al eliminar: " + error.message);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: newStatus })
        .eq("id", id);
      if (error) throw error;
      toast.success("Estado actualizado");
      fetchData();
    } catch (error: any) {
      toast.error("Error: " + error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: "default" | "outline" | "secondary" | "destructive" }> = {
      scheduled: { label: "Programada", variant: "outline" },
      confirmed: { label: "Confirmada", variant: "default" },
      completed: { label: "Completada", variant: "secondary" },
      cancelled: { label: "Cancelada", variant: "destructive" },
    };
    const c = config[status] || { label: status, variant: "outline" as const };
    return <Badge variant={c.variant}>{c.label}</Badge>;
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Calendario de Citas</h1>
          <p className="text-muted-foreground">Gestiona las citas de la clínica</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Cita
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nueva Cita</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Paciente</Label>
                <Popover open={patientSearchOpen} onOpenChange={setPatientSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={patientSearchOpen}
                      className="w-full justify-between"
                    >
                      {selectedPatientId === "new"
                        ? "Nuevo paciente"
                        : selectedPatientId
                        ? patients.find((p) => p.id === selectedPatientId)?.full_name
                        : "Seleccionar paciente..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 bg-popover" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar paciente..." />
                      <CommandList>
                        <CommandEmpty>No se encontraron pacientes.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="nuevo paciente"
                            onSelect={() => {
                              handlePatientSelect("new");
                              setPatientSearchOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedPatientId === "new" ? "opacity-100" : "opacity-0"
                              )}
                            />
                            Nuevo paciente
                          </CommandItem>
                          {patients.map((p) => (
                            <CommandItem
                              key={p.id}
                              value={p.full_name}
                              onSelect={() => {
                                handlePatientSelect(p.id);
                                setPatientSearchOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedPatientId === p.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {p.full_name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Nombre del paciente *</Label>
                <Input
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input value={patientPhone} onChange={(e) => setPatientPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={patientEmail}
                    onChange={(e) => setPatientEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha *</Label>
                  <Input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hora *</Label>
                  <Input
                    type="time"
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duración (min)</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 min</SelectItem>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="45">45 min</SelectItem>
                      <SelectItem value="60">1 hora</SelectItem>
                      <SelectItem value="90">1h 30min</SelectItem>
                      <SelectItem value="120">2 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de tratamiento</Label>
                  <Input
                    value={treatmentType}
                    onChange={(e) => setTreatmentType(e.target.value)}
                    placeholder="Ej: Limpieza, Revisión..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando..." : "Crear Cita"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Buscar por nombre, teléfono o tratamiento..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Calendario</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={es}
              modifiers={{
                hasAppointment: datesWithAppointments,
              }}
              modifiersStyles={{
                hasAppointment: {
                  fontWeight: "bold",
                  backgroundColor: "hsl(var(--primary) / 0.1)",
                  color: "hsl(var(--primary))",
                },
              }}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Citas para {format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {appointmentsForSelectedDate.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No hay citas para este día</p>
            ) : (
              <div className="space-y-4">
                {appointmentsForSelectedDate.map((apt) => (
                  <Card key={apt.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="font-semibold">
                            {apt.appointment_time.substring(0, 5)} - {apt.duration_minutes} min
                          </span>
                          {getStatusBadge(apt.status)}
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span>{apt.patient_name}</span>
                        </div>
                        {apt.patient_phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{apt.patient_phone}</span>
                          </div>
                        )}
                        {apt.treatment_type && (
                          <p className="text-sm text-muted-foreground">
                            Tratamiento: {apt.treatment_type}
                          </p>
                        )}
                        {apt.notes && (
                          <p className="text-sm text-muted-foreground">Notas: {apt.notes}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Select
                          value={apt.status}
                          onValueChange={(value) => handleStatusChange(apt.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="scheduled">Programada</SelectItem>
                            <SelectItem value="confirmed">Confirmada</SelectItem>
                            <SelectItem value="completed">Completada</SelectItem>
                            <SelectItem value="cancelled">Cancelada</SelectItem>
                          </SelectContent>
                        </Select>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar cita?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteAppointment(apt.id)}>
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Appointments;
