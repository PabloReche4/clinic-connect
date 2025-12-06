import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, LogIn, LogOut, Calendar, User } from "lucide-react";
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

const TimeTracking = () => {
  const [records, setRecords] = useState<TimeRecord[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const [selectedUserId, setSelectedUserId] = useState<string>("all");

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

  // Agrupar registros por día y usuario
  const groupedRecords = useMemo(() => {
    const groups: Record<string, Record<string, TimeRecord[]>> = {};

    filteredRecords.forEach((record) => {
      const dateKey = format(new Date(record.recorded_at), "yyyy-MM-dd");
      const userId = record.user_id;

      if (!groups[dateKey]) {
        groups[dateKey] = {};
      }
      if (!groups[dateKey][userId]) {
        groups[dateKey][userId] = [];
      }
      groups[dateKey][userId].push(record);
    });

    // Ordenar registros dentro de cada grupo por hora
    Object.keys(groups).forEach((dateKey) => {
      Object.keys(groups[dateKey]).forEach((userId) => {
        groups[dateKey][userId].sort(
          (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
        );
      });
    });

    return groups;
  }, [filteredRecords]);

  const calculateDayHours = (dayRecords: TimeRecord[]) => {
    let totalMinutes = 0;
    let entryTime: Date | null = null;

    dayRecords.forEach((record) => {
      if (record.record_type === "entry") {
        entryTime = new Date(record.recorded_at);
      } else if (record.record_type === "exit" && entryTime) {
        const exitTime = new Date(record.recorded_at);
        totalMinutes += (exitTime.getTime() - entryTime.getTime()) / (1000 * 60);
        entryTime = null;
      }
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    return { hours, minutes, totalMinutes };
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

  const sortedDates = Object.keys(groupedRecords).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Registro Horario</h1>
        <p className="text-muted-foreground">Control de entradas y salidas de trabajadores</p>
      </div>

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
            <CardContent className="space-y-4">
              {Object.keys(groupedRecords[dateKey]).map((userId) => {
                const userRecords = groupedRecords[dateKey][userId];
                const { hours, minutes } = calculateDayHours(userRecords);

                return (
                  <div key={userId} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold">{getProfileName(userId)}</span>
                      </div>
                      <Badge variant="outline">
                        {hours}h {minutes}min
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {userRecords.map((record) => (
                        <Badge
                          key={record.id}
                          variant={record.record_type === "entry" ? "default" : "secondary"}
                          className="flex items-center gap-1"
                        >
                          {record.record_type === "entry" ? (
                            <LogIn className="w-3 h-3" />
                          ) : (
                            <LogOut className="w-3 h-3" />
                          )}
                          {format(new Date(record.recorded_at), "HH:mm")}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default TimeTracking;
