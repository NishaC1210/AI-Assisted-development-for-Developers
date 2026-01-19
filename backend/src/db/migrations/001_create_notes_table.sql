-- Migration: Create notes table
-- Run this migration using: docker exec -i dashboard_postgres psql -U dashboard_user -d dashboard_db -f -

CREATE TABLE IF NOT EXISTS notes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries by user
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);

-- Create index for ordering by updated_at
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC);

