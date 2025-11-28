-- Add sessions field to treatments table
ALTER TABLE treatments ADD COLUMN sessions_count integer DEFAULT 1 CHECK (sessions_count > 0);

-- Create patient_files table for storing photos and x-rays
CREATE TABLE patient_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  description text,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE patient_files ENABLE ROW LEVEL SECURITY;

-- Create policies for patient_files
CREATE POLICY "Trabajadores autenticados pueden ver archivos de pacientes"
  ON patient_files FOR SELECT
  USING (true);

CREATE POLICY "Trabajadores autenticados pueden crear archivos de pacientes"
  ON patient_files FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Trabajadores autenticados pueden actualizar archivos de pacientes"
  ON patient_files FOR UPDATE
  USING (true);

CREATE POLICY "Trabajadores autenticados pueden eliminar archivos de pacientes"
  ON patient_files FOR DELETE
  USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_patient_files_updated_at
  BEFORE UPDATE ON patient_files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for patient files
INSERT INTO storage.buckets (id, name, public)
VALUES ('patient-files', 'patient-files', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Trabajadores pueden ver archivos de pacientes"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'patient-files' AND auth.role() = 'authenticated');

CREATE POLICY "Trabajadores pueden subir archivos de pacientes"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'patient-files' AND auth.role() = 'authenticated');

CREATE POLICY "Trabajadores pueden eliminar archivos de pacientes"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'patient-files' AND auth.role() = 'authenticated');