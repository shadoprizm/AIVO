CREATE TABLE scan_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_token TEXT REFERENCES scans(public_token),
  usefulness TEXT CHECK (usefulness IN ('yes', 'no', 'partial')),
  role TEXT,
  free_text TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
