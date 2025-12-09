-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "Los usuarios pueden ver su propio perfil" ON public.profiles;

-- Create a new policy that allows all authenticated users to see all profiles
CREATE POLICY "Trabajadores autenticados pueden ver perfiles" 
ON public.profiles 
FOR SELECT 
USING (auth.role() = 'authenticated');