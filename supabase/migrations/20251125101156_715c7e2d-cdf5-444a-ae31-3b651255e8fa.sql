-- Crear tabla de perfiles de trabajadores
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff',
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS en profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Los usuarios pueden ver su propio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Los usuarios pueden actualizar su propio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Crear tabla de pacientes
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  address TEXT,
  dni TEXT UNIQUE,
  birth_date DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS en patients
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Políticas para patients (todos los trabajadores autenticados pueden ver y gestionar)
CREATE POLICY "Trabajadores autenticados pueden ver pacientes"
  ON public.patients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Trabajadores autenticados pueden crear pacientes"
  ON public.patients FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Trabajadores autenticados pueden actualizar pacientes"
  ON public.patients FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Trabajadores autenticados pueden eliminar pacientes"
  ON public.patients FOR DELETE
  TO authenticated
  USING (true);

-- Crear tabla de tratamientos
CREATE TABLE public.treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  duration_minutes INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS en treatments
ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;

-- Políticas para treatments
CREATE POLICY "Trabajadores autenticados pueden ver tratamientos"
  ON public.treatments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Trabajadores autenticados pueden crear tratamientos"
  ON public.treatments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Trabajadores autenticados pueden actualizar tratamientos"
  ON public.treatments FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Trabajadores autenticados pueden eliminar tratamientos"
  ON public.treatments FOR DELETE
  TO authenticated
  USING (true);

-- Crear tabla de presupuestos
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  valid_until DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Crear tabla de items de presupuesto
CREATE TABLE public.budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  treatment_id UUID REFERENCES public.treatments(id),
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS en budgets
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;

-- Políticas para budgets
CREATE POLICY "Trabajadores autenticados pueden ver presupuestos"
  ON public.budgets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Trabajadores autenticados pueden crear presupuestos"
  ON public.budgets FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Trabajadores autenticados pueden actualizar presupuestos"
  ON public.budgets FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Trabajadores autenticados pueden eliminar presupuestos"
  ON public.budgets FOR DELETE
  TO authenticated
  USING (true);

-- Políticas para budget_items
CREATE POLICY "Trabajadores autenticados pueden ver items de presupuesto"
  ON public.budget_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Trabajadores autenticados pueden crear items de presupuesto"
  ON public.budget_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Trabajadores autenticados pueden actualizar items de presupuesto"
  ON public.budget_items FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Trabajadores autenticados pueden eliminar items de presupuesto"
  ON public.budget_items FOR DELETE
  TO authenticated
  USING (true);

-- Crear tabla de facturas
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  budget_id UUID REFERENCES public.budgets(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  payment_method TEXT,
  payment_date DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Crear tabla de items de factura
CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  treatment_id UUID REFERENCES public.treatments(id),
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS en invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- Políticas para invoices
CREATE POLICY "Trabajadores autenticados pueden ver facturas"
  ON public.invoices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Trabajadores autenticados pueden crear facturas"
  ON public.invoices FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Trabajadores autenticados pueden actualizar facturas"
  ON public.invoices FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Trabajadores autenticados pueden eliminar facturas"
  ON public.invoices FOR DELETE
  TO authenticated
  USING (true);

-- Políticas para invoice_items
CREATE POLICY "Trabajadores autenticados pueden ver items de factura"
  ON public.invoice_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Trabajadores autenticados pueden crear items de factura"
  ON public.invoice_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Trabajadores autenticados pueden actualizar items de factura"
  ON public.invoice_items FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Trabajadores autenticados pueden eliminar items de factura"
  ON public.invoice_items FOR DELETE
  TO authenticated
  USING (true);

-- Función para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    'staff'
  );
  RETURN NEW;
END;
$$;

-- Trigger para crear perfil al registrar usuario
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers para actualizar updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_treatments_updated_at
  BEFORE UPDATE ON public.treatments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();