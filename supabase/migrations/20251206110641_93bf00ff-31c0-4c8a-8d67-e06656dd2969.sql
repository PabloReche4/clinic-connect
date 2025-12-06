-- Crear tabla para registro horario de trabajadores
CREATE TABLE public.time_records (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  record_type text NOT NULL CHECK (record_type IN ('entry', 'exit')),
  recorded_at timestamp with time zone NOT NULL DEFAULT now(),
  notes text,
  source text DEFAULT 'manual',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.time_records ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - los trabajadores autenticados pueden ver todos los registros
CREATE POLICY "Trabajadores autenticados pueden ver registros horarios"
  ON public.time_records
  FOR SELECT
  TO authenticated
  USING (true);

-- Políticas RLS - los trabajadores pueden crear registros
CREATE POLICY "Trabajadores autenticados pueden crear registros horarios"
  ON public.time_records
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Políticas RLS - los trabajadores pueden actualizar registros
CREATE POLICY "Trabajadores autenticados pueden actualizar registros horarios"
  ON public.time_records
  FOR UPDATE
  TO authenticated
  USING (true);

-- Políticas RLS - los trabajadores pueden eliminar registros
CREATE POLICY "Trabajadores autenticados pueden eliminar registros horarios"
  ON public.time_records
  FOR DELETE
  TO authenticated
  USING (true);

-- Índice para consultas por usuario y fecha
CREATE INDEX idx_time_records_user_date ON public.time_records (user_id, recorded_at);