-- Crear tabla de grupos de pacientes
CREATE TABLE public.patient_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Añadir columna group_id a la tabla patients
ALTER TABLE public.patients 
ADD COLUMN group_id UUID REFERENCES public.patient_groups(id);

-- Habilitar RLS en patient_groups
ALTER TABLE public.patient_groups ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para patient_groups
CREATE POLICY "Trabajadores autenticados pueden ver grupos de pacientes"
ON public.patient_groups
FOR SELECT
USING (true);

CREATE POLICY "Trabajadores autenticados pueden crear grupos de pacientes"
ON public.patient_groups
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Trabajadores autenticados pueden actualizar grupos de pacientes"
ON public.patient_groups
FOR UPDATE
USING (true);

CREATE POLICY "Trabajadores autenticados pueden eliminar grupos de pacientes"
ON public.patient_groups
FOR DELETE
USING (true);

-- Trigger para actualizar updated_at en patient_groups
CREATE TRIGGER update_patient_groups_updated_at
BEFORE UPDATE ON public.patient_groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();