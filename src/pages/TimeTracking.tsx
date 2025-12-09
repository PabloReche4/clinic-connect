import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Clock, LogIn, LogOut, Calendar, User, Plus, Play, Square, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { es } from "date-fns/locale";

interface TimeRecord {
  id: string;
  user_id: string;
  record_type: string;
  recorded_at: string;
  notes: string | null;
  source: string | null;
}

interface Profile {
  id: string;
  full_name: string;
}

interface TimePair {
  entry: TimeRecord | null;
  exit: TimeRecord | null;
}

interface WorkerStatus {
  isWorking: boolean;
  lastEntry: TimeRecord | null;
}

const TimeTracking = () => {
  const [records, setRecords] = useState<TimeRecord[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const [selectedUserId, setSelectedUserId] = useState<string>("all");
  
  // Form state for manual registration
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formUserId, setFormUserId] = useState("");
  const [formDate, setFormDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [formEntryTime, setFormEntryTime] = useState("");
  const [formExitTime, setFormExitTime] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [clockingUserId, setClockingUserId] = useState<string | null>(null);
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null);

  useEffect(() => {
    fetchRecords();
    fetchProfiles();
  }, []);

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from("time_records")
        .select("*")
        .order("recorded_at", { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error: any) {
      toast.error("Error al cargar registros: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .order("full_name");

      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      console.error("Error al cargar perfiles:", error.message);
    }
  };

  const getProfileName = (userId: string) => {
    const profile = profiles.find((p) => p.id === userId);
    return profile?.full_name || "Usuario desconocido";
  };

  // Get worker status (working or not) for today
  const getWorkerStatus = (userId: string): WorkerStatus => {
    const today = format(new Date(), "yyyy-MM-dd");
    const todayRecords = records.filter((r) => {
      const recordDate = format(new Date(r.recorded_at), "yyyy-MM-dd");
      return r.user_id === userId && recordDate === today;
    }).sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());

    let isWorking = false;
    let lastEntry: TimeRecord | null = null;

    todayRecords.forEach((record) => {
      if (record.record_type === "entry") {
        isWorking = true;
        lastEntry = record;
      } else if (record.record_type === "exit") {
        isWorking = false;
        lastEntry = null;
      }
    });

    return { isWorking, lastEntry };
  };

  const handleClockIn = async (userId: string) => {
    setClockingUserId(userId);
    try {
      const now = new Date();
      const { error } = await supabase.from("time_records").insert({
        user_id: userId,
        record_type: "entry",
        recorded_at: now.toISOString(),
        source: "manual",
      });

      if (error) throw error;

      toast.success(`Entrada registrada a las ${format(now, "HH:mm")}`);
      fetchRecords();
    } catch (error: any) {
      toast.error("Error al registrar entrada: " + error.message);
    } finally {
      setClockingUserId(null);
    }
  };

  const handleClockOut = async (userId: string) => {
    setClockingUserId(userId);
    try {
      const now = new Date();
      const { error } = await supabase.from("time_records").insert({
        user_id: userId,
        record_type: "exit",
        recorded_at: now.toISOString(),
        source: "manual",
      });

      if (error) throw error;

      toast.success(`Salida registrada a las ${format(now, "HH:mm")}`);
      fetchRecords();
    } catch (error: any) {
      toast.error("Error al registrar salida: " + error.message);
    } finally {
      setClockingUserId(null);
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm("¿Eliminar este registro?")) return;
    
    setDeletingRecordId(recordId);
    try {
      const { error } = await supabase.from("time_records").delete().eq("id", recordId);
      if (error) throw error;
      toast.success("Registro eliminado");
      fetchRecords();
    } catch (error: any) {
      toast.error("Error al eliminar: " + error.message);
    } finally {
      setDeletingRecordId(null);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formUserId) {
      toast.error("Selecciona un trabajador");
      return;
    }
    
    if (!formEntryTime) {
      toast.error("Indica la hora de entrada");
      return;
    }

    setSubmitting(true);

    try {
      const recordsToInsert = [];
      
      // Add entry record
      const entryDateTime = new Date(`${formDate}T${formEntryTime}:00`);
      recordsToInsert.push({
        user_id: formUserId,
        record_type: "entry",
        recorded_at: entryDateTime.toISOString(),
        notes: formNotes || null,
        source: "manual",
      });

      // Add exit record if provided
      if (formExitTime) {
        const exitDateTime = new Date(`${formDate}T${formExitTime}:00`);
        recordsToInsert.push({
          user_id: formUserId,
          record_type: "exit",
          recorded_at: exitDateTime.toISOString(),
          notes: formNotes || null,
          source: "manual",
        });
      }

      const { error } = await supabase.from("time_records").insert(recordsToInsert);

      if (error) throw error;

      toast.success("Registro añadido correctamente");
      setDialogOpen(false);
      resetForm();
      fetchRecords();
    } catch (error: any) {
      toast.error("Error al registrar: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormUserId("");
    setFormDate(format(new Date(), "yyyy-MM-dd"));
    setFormEntryTime("");
    setFormExitTime("");
    setFormNotes("");
  };

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const recordDate = new Date(record.recorded_at);
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const dateMatch = recordDate >= start && recordDate <= end;
      const userMatch = selectedUserId === "all" || record.user_id === selectedUserId;

      return dateMatch && userMatch;
    });
  }, [records, startDate, endDate, selectedUserId]);

  // Agrupar registros por día y usuario, y emparejar entradas con salidas
  const groupedRecordsWithPairs = useMemo(() => {
    const groups: Record<string, Record<string, { pairs: TimePair[]; totalMinutes: number }>> = {};

    // Primero agrupar por día y usuario
    const tempGroups: Record<string, Record<string, TimeRecord[]>> = {};
    
    filteredRecords.forEach((record) => {
      const dateKey = format(new Date(record.recorded_at), "yyyy-MM-dd");
      const userId = record.user_id;

      if (!tempGroups[dateKey]) {
        tempGroups[dateKey] = {};
      }
      if (!tempGroups[dateKey][userId]) {
        tempGroups[dateKey][userId] = [];
      }
      tempGroups[dateKey][userId].push(record);
    });

    // Ordenar y emparejar
    Object.keys(tempGroups).forEach((dateKey) => {
      groups[dateKey] = {};
      
      Object.keys(tempGroups[dateKey]).forEach((userId) => {
        const userRecords = tempGroups[dateKey][userId].sort(
          (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
        );

        const pairs: TimePair[] = [];
        let currentEntry: TimeRecord | null = null;
        let totalMinutes = 0;

        userRecords.forEach((record) => {
          if (record.record_type === "entry") {
            if (currentEntry) {
              // Si hay una entrada sin salida, guardarla
              pairs.push({ entry: currentEntry, exit: null });
            }
            currentEntry = record;
          } else if (record.record_type === "exit") {
            if (currentEntry) {
              const entryTime = new Date(currentEntry.recorded_at);
              const exitTime = new Date(record.recorded_at);
              totalMinutes += (exitTime.getTime() - entryTime.getTime()) / (1000 * 60);
              pairs.push({ entry: currentEntry, exit: record });
              currentEntry = null;
            } else {
              // Salida sin entrada
              pairs.push({ entry: null, exit: record });
            }
          }
        });

        // Si quedó una entrada sin salida
        if (currentEntry) {
          pairs.push({ entry: currentEntry, exit: null });
        }

        groups[dateKey][userId] = { pairs, totalMinutes };
      });
    });

    return groups;
  }, [filteredRecords]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}min`;
  };

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
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  const sortedDates = Object.keys(groupedRecordsWithPairs).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Registro Horario</h1>
          <p className="text-muted-foreground">Control de entradas y salidas de trabajadores</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Registro Manual
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Añadir Registro Manual</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Trabajador *</Label>
                <Select value={formUserId} onValueChange={setFormUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar trabajador" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fecha *</Label>
                <Input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hora Entrada *</Label>
                  <Input
                    type="time"
                    value={formEntryTime}
                    onChange={(e) => setFormEntryTime(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hora Salida</Label>
                  <Input
                    type="time"
                    value={formExitTime}
                    onChange={(e) => setFormExitTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notas (opcional)</Label>
                <Input
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Ej: Turno de mañana"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Worker Clock In/Out Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Fichar - {format(new Date(), "d/M/yyyy", { locale: es })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {profiles.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No hay trabajadores registrados</p>
          ) : (
            <div className="space-y-3">
              {profiles.map((profile) => {
                const status = getWorkerStatus(profile.id);
                const isClocking = clockingUserId === profile.id;
                
                return (
                  <div 
                    key={profile.id} 
                    className="flex items-center justify-between p-4 border rounded-lg bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{profile.full_name}</p>
                        {status.isWorking && status.lastEntry && (
                          <p className="text-sm text-muted-foreground">
                            Entrada: {format(new Date(status.lastEntry.recorded_at), "HH:mm")}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {status.isWorking ? (
                        <Badge variant="default" className="bg-green-500">Trabajando</Badge>
                      ) : (
                        <Badge variant="secondary">No fichado</Badge>
                      )}
                      {status.isWorking ? (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleClockOut(profile.id)}
                          disabled={isClocking}
                          className="flex items-center gap-2"
                        >
                          <Square className="w-4 h-4" />
                          {isClocking ? "..." : "Terminar"}
                        </Button>
                      ) : (
                        <Button 
                          size="sm"
                          onClick={() => handleClockIn(profile.id)}
                          disabled={isClocking}
                          className="flex items-center gap-2"
                        >
                          <Play className="w-4 h-4" />
                          {isClocking ? "..." : "Comenzar"}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Filtros
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
            <div className="space-y-2">
              <Label>Trabajador</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setQuickRange("thisMonth")}>
                Este mes
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQuickRange("lastMonth")}>
                Mes anterior
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {sortedDates.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              No hay registros en el período seleccionado
            </p>
          </CardContent>
        </Card>
      ) : (
        sortedDates.map((dateKey) => (
          <Card key={dateKey}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                {format(new Date(dateKey), "EEEE, d 'de' MMMM yyyy", { locale: es })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Trabajador</TableHead>
                    <TableHead>Entrada</TableHead>
                    <TableHead>Salida</TableHead>
                    <TableHead>Duración</TableHead>
                    <TableHead>Origen</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.keys(groupedRecordsWithPairs[dateKey]).map((userId) => {
                    const { pairs, totalMinutes } = groupedRecordsWithPairs[dateKey][userId];
                    
                    return pairs.map((pair, index) => {
                      const pairDuration = pair.entry && pair.exit
                        ? (new Date(pair.exit.recorded_at).getTime() - new Date(pair.entry.recorded_at).getTime()) / (1000 * 60)
                        : 0;
                      
                      return (
                        <TableRow key={`${userId}-${index}`}>
                          <TableCell>
                            {format(new Date(dateKey), "d/M/yyyy")}
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              {getProfileName(userId)}
                              {index === pairs.length - 1 && pairs.length > 1 && (
                                <Badge variant="outline" className="ml-2">
                                  Total: {formatDuration(totalMinutes)}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {pair.entry ? (
                              <Badge variant="default" className="flex items-center gap-1 w-fit">
                                <LogIn className="w-3 h-3" />
                                {format(new Date(pair.entry.recorded_at), "HH:mm")}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {pair.exit ? (
                              <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                                <LogOut className="w-3 h-3" />
                                {format(new Date(pair.exit.recorded_at), "HH:mm")}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">En curso...</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {pair.entry && pair.exit ? (
                              formatDuration(pairDuration)
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {pair.entry?.source === "manual" || pair.exit?.source === "manual" ? "Manual" : "Dispositivo"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {pair.entry && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteRecord(pair.entry!.id)}
                                  disabled={deletingRecordId === pair.entry.id}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                              {pair.exit && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteRecord(pair.exit!.id)}
                                  disabled={deletingRecordId === pair.exit.id}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    });
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default TimeTracking;
