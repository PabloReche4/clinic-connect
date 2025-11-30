-- Add clinical history fields to patients table
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS allergies text,
ADD COLUMN IF NOT EXISTS medical_conditions text,
ADD COLUMN IF NOT EXISTS current_medications text,
ADD COLUMN IF NOT EXISTS medical_notes text;

-- Create appointments table for manual appointment management
CREATE TABLE public.appointments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    patient_name TEXT NOT NULL,
    patient_phone TEXT,
    patient_email TEXT,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    treatment_type TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'scheduled',
    source TEXT DEFAULT 'manual',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for appointments
CREATE POLICY "Trabajadores autenticados pueden ver citas"
ON public.appointments FOR SELECT
USING (true);

CREATE POLICY "Trabajadores autenticados pueden crear citas"
ON public.appointments FOR INSERT
WITH CHECK (true);

CREATE POLICY "Trabajadores autenticados pueden actualizar citas"
ON public.appointments FOR UPDATE
USING (true);

CREATE POLICY "Trabajadores autenticados pueden eliminar citas"
ON public.appointments FOR DELETE
USING (true);

-- Create trigger for appointments updated_at
CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();