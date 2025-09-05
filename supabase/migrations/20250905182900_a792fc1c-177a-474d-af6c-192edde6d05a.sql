-- Create public search history table for all users
CREATE TABLE public.public_search_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT NOT NULL,
  response TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.public_search_history ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to view search history
CREATE POLICY "Anyone can view public search history" 
ON public.public_search_history 
FOR SELECT 
USING (true);

-- Create policy to allow anyone to insert search history
CREATE POLICY "Anyone can insert public search history" 
ON public.public_search_history 
FOR INSERT 
WITH CHECK (true);

-- Create index for better query performance
CREATE INDEX idx_public_search_history_created_at ON public.public_search_history(created_at DESC);
CREATE INDEX idx_public_search_history_query ON public.public_search_history(query);