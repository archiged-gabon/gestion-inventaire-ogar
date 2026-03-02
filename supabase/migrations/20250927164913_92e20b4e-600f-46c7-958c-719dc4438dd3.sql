-- Create inventory table for insurance policies
CREATE TABLE public.inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  no SERIAL UNIQUE NOT NULL,
  intermediaire_orass TEXT NOT NULL,
  police_orass TEXT NOT NULL,
  ancien_numero TEXT,
  date_effet DATE NOT NULL,
  date_echeance DATE NOT NULL,
  nom_assure TEXT NOT NULL,
  societe_concernee TEXT NOT NULL CHECK (societe_concernee IN ('Vie', 'Non Vie')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster sorting by no
CREATE INDEX idx_inventory_no ON public.inventory(no);

-- Enable Row Level Security
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (since this is an internal business tool)
CREATE POLICY "Allow all operations on inventory" 
ON public.inventory 
FOR ALL 
USING (true) 
WITH CHECK (true);