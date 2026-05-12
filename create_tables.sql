CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  open_id VARCHAR(255) UNIQUE,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  name VARCHAR(255),
  farm_location TEXT,
  preferred_language VARCHAR(50) DEFAULT 'en',
  crop_types TEXT,
  role VARCHAR(50) DEFAULT 'user',
  last_signed_in TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scans (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  image_url TEXT NOT NULL,
  image_key TEXT NOT NULL,
  crop_type VARCHAR(100) NOT NULL,
  crop_variety VARCHAR(100),
  detected_disease VARCHAR(255),
  confidence_score INTEGER,
  disease_description TEXT,
  treatment_recommendations JSONB,
  fertilizer_suggestions JSONB,
  prevention_measures JSONB,
  treatment_plan TEXT,
  error_message TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  language VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  language VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMP DEFAULT NOW()
);