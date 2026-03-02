-- Add missing columns to inventory table
ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS type_document TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS nom_agent_inventaire TEXT NOT NULL DEFAULT '';