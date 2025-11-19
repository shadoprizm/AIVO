/*
  # Add Rich Analysis Data to Scans

  ## Summary
  This migration extends the scans table to support detailed AI-generated analysis results, enabling AIVO Insights to store category breakdowns, recommendations, and insights beyond just the overall score.

  ## Changes
  
  ### Updated Columns in `scans` table
  - Add `analysis_json` (jsonb, nullable) - Stores structured analysis results including:
    - Category scores (structure, clarity, schema, Q&A readiness, authority, accessibility)
    - Detailed recommendations with severity, category, description, and suggested fixes
    - Analysis notes and warnings
    - Metadata about the analysis run

  ## Schema Structure for analysis_json

  The JSONB field will contain:
  ```json
  {
    "overall_score": 75,
    "category_scores": {
      "content_clarity": 80,
      "semantic_structure": 70,
      "schema_metadata": 60,
      "qa_readiness": 75,
      "authority_trust": 85,
      "technical_accessibility": 90
    },
    "recommendations": [
      {
        "id": "rec-1",
        "category": "semantic_structure",
        "severity": "high",
        "title": "Add semantic HTML5 elements",
        "description": "Your page lacks semantic structure...",
        "suggested_fix": "Wrap main content in <article> or <section> tags",
        "implementation_effort": "low"
      }
    ],
    "notes": [
      "Page loads quickly and is mobile-responsive"
    ],
    "warnings": [
      "Missing critical meta description"
    ],
    "analyzed_at": "2025-01-18T10:30:00Z",
    "analysis_version": "1.0"
  }
  ```

  ## Important Notes
  1. The analysis_json field is nullable to support backward compatibility
  2. Existing scans without analysis_json will continue to work
  3. The overall_score column remains the primary score for quick access
  4. JSONB allows efficient querying of nested data if needed in the future
*/

-- Add analysis_json column to scans table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scans' AND column_name = 'analysis_json'
  ) THEN
    ALTER TABLE scans ADD COLUMN analysis_json jsonb;
  END IF;
END $$;

-- Create index for efficient JSONB queries (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_scans_analysis_json ON scans USING gin (analysis_json);
