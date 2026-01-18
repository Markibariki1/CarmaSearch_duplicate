-- Global Trade Database Schema (SQLite Version)
-- Comprehensive database for import/export tariffs, taxes, and duties worldwide
-- Supports 200+ countries with full HS code coverage

-- Countries and Regions
CREATE TABLE IF NOT EXISTS countries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    iso2_code TEXT UNIQUE NOT NULL,
    iso3_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    region TEXT,
    subregion TEXT,
    currency_code TEXT,
    vat_rate REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Harmonized System (HS) Classification
CREATE TABLE IF NOT EXISTS hs_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL, -- 2, 4, 6, 8, or 10 digits
    level INTEGER NOT NULL, -- 2, 4, 6, 8, 10
    description TEXT NOT NULL,
    parent_code TEXT REFERENCES hs_codes(code),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Trade Agreements
CREATE TABLE IF NOT EXISTS trade_agreements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    short_name TEXT,
    type TEXT, -- FTA, CUSTOMS_UNION, PREFERENTIAL, etc.
    effective_date DATE,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Trade Agreement Memberships
CREATE TABLE IF NOT EXISTS trade_agreement_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agreement_id INTEGER REFERENCES trade_agreements(id),
    country_iso2 TEXT REFERENCES countries(iso2_code),
    membership_type TEXT, -- FULL, PARTIAL, OBSERVER
    effective_date DATE,
    UNIQUE(agreement_id, country_iso2)
);

-- Tariff Rates (Most Important Table)
CREATE TABLE IF NOT EXISTS tariff_rates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dest_country_iso2 TEXT REFERENCES countries(iso2_code),
    origin_country_iso2 TEXT REFERENCES countries(iso2_code),
    hs_code TEXT REFERENCES hs_codes(code),
    agreement_id INTEGER REFERENCES trade_agreements(id), -- NULL for MFN rates
    
    -- Rate Information
    rate_type TEXT NOT NULL, -- MFN, PREFERENTIAL, SPECIAL, etc.
    rate REAL NOT NULL, -- Can be percentage or specific amount
    rate_unit TEXT DEFAULT 'PERCENT', -- PERCENT, PER_KG, PER_UNIT, etc.
    
    -- Conditions
    min_value REAL, -- Minimum value threshold
    max_value REAL, -- Maximum value threshold
    quantity_unit TEXT, -- KG, LITERS, UNITS, etc.
    
    -- Validity
    effective_date DATE NOT NULL,
    expiry_date DATE,
    
    -- Metadata
    source TEXT, -- WTO, TARIC, HTS, etc.
    source_url TEXT,
    notes TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(dest_country_iso2, origin_country_iso2, hs_code, agreement_id, effective_date)
);

-- VAT and Sales Tax Rates
CREATE TABLE IF NOT EXISTS vat_rates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    country_iso2 TEXT REFERENCES countries(iso2_code),
    hs_code TEXT REFERENCES hs_codes(code),
    
    -- Rate Information
    vat_rate REAL NOT NULL,
    rate_type TEXT DEFAULT 'STANDARD', -- STANDARD, REDUCED, ZERO, EXEMPT
    
    -- Conditions
    min_value REAL,
    max_value REAL,
    
    -- Validity
    effective_date DATE NOT NULL,
    expiry_date DATE,
    
    -- Metadata
    source TEXT,
    notes TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(country_iso2, hs_code, effective_date)
);

-- Additional Taxes and Fees
CREATE TABLE IF NOT EXISTS additional_taxes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    country_iso2 TEXT REFERENCES countries(iso2_code),
    hs_code TEXT REFERENCES hs_codes(code),
    
    -- Tax Information
    tax_name TEXT NOT NULL,
    tax_type TEXT, -- EXCISE, ENVIRONMENTAL, LUXURY, etc.
    rate REAL NOT NULL,
    rate_unit TEXT DEFAULT 'PERCENT',
    
    -- Calculation Base
    base_type TEXT, -- CIF, CUSTOMS_VALUE, CIF_PLUS_DUTY, etc.
    
    -- Conditions
    min_value REAL,
    max_value REAL,
    quantity_unit TEXT,
    
    -- Validity
    effective_date DATE NOT NULL,
    expiry_date DATE,
    
    -- Metadata
    source TEXT,
    notes TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Import/Export Restrictions
CREATE TABLE IF NOT EXISTS trade_restrictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    country_iso2 TEXT REFERENCES countries(iso2_code),
    hs_code TEXT REFERENCES hs_codes(code),
    origin_country_iso2 TEXT REFERENCES countries(iso2_code),
    
    -- Restriction Information
    restriction_type TEXT NOT NULL, -- BAN, QUOTA, LICENSE, SANCTION
    restriction_level TEXT, -- TOTAL, PARTIAL, CONDITIONAL
    
    -- Details
    description TEXT,
    quota_amount REAL,
    quota_unit TEXT,
    
    -- Validity
    effective_date DATE NOT NULL,
    expiry_date DATE,
    
    -- Metadata
    source TEXT,
    legal_reference TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- De Minimis Values (Duty-free thresholds)
CREATE TABLE IF NOT EXISTS de_minimis_values (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    country_iso2 TEXT REFERENCES countries(iso2_code),
    
    -- Value Information
    currency_code TEXT NOT NULL,
    amount REAL NOT NULL,
    
    -- Conditions
    applies_to TEXT DEFAULT 'ALL', -- ALL, SPECIFIC_HS, SPECIFIC_ORIGIN
    hs_code TEXT REFERENCES hs_codes(code),
    origin_country_iso2 TEXT REFERENCES countries(iso2_code),
    
    -- Validity
    effective_date DATE NOT NULL,
    expiry_date DATE,
    
    -- Metadata
    source TEXT,
    notes TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Data Sources and Updates
CREATE TABLE IF NOT EXISTS data_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT, -- API, FILE, MANUAL
    base_url TEXT,
    update_frequency TEXT, -- DAILY, WEEKLY, MONTHLY, QUARTERLY
    last_updated DATETIME,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Data Update Log
CREATE TABLE IF NOT EXISTS data_updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER REFERENCES data_sources(id),
    table_name TEXT NOT NULL,
    records_added INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_deleted INTEGER DEFAULT 0,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    status TEXT DEFAULT 'running', -- running, completed, failed
    error_message TEXT,
    metadata TEXT -- JSON string
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_tariff_rates_lookup ON tariff_rates(dest_country_iso2, origin_country_iso2, hs_code, effective_date);
CREATE INDEX IF NOT EXISTS idx_tariff_rates_country ON tariff_rates(dest_country_iso2, effective_date);
CREATE INDEX IF NOT EXISTS idx_vat_rates_lookup ON vat_rates(country_iso2, hs_code, effective_date);
CREATE INDEX IF NOT EXISTS idx_additional_taxes_lookup ON additional_taxes(country_iso2, hs_code, effective_date);
CREATE INDEX IF NOT EXISTS idx_trade_restrictions_lookup ON trade_restrictions(country_iso2, hs_code, origin_country_iso2);
CREATE INDEX IF NOT EXISTS idx_hs_codes_level ON hs_codes(level, code);
CREATE INDEX IF NOT EXISTS idx_hs_codes_parent ON hs_codes(parent_code);

-- Views for Common Queries
CREATE VIEW IF NOT EXISTS current_tariff_rates AS
SELECT 
    tr.*,
    c1.name as dest_country_name,
    c2.name as origin_country_name,
    hc.description as hs_description,
    ta.name as agreement_name
FROM tariff_rates tr
JOIN countries c1 ON tr.dest_country_iso2 = c1.iso2_code
JOIN countries c2 ON tr.origin_country_iso2 = c2.iso2_code
JOIN hs_codes hc ON tr.hs_code = hc.code
LEFT JOIN trade_agreements ta ON tr.agreement_id = ta.id
WHERE tr.effective_date <= DATE('now') 
AND (tr.expiry_date IS NULL OR tr.expiry_date >= DATE('now'));

CREATE VIEW IF NOT EXISTS current_vat_rates AS
SELECT 
    vr.*,
    c.name as country_name,
    hc.description as hs_description
FROM vat_rates vr
JOIN countries c ON vr.country_iso2 = c.iso2_code
JOIN hs_codes hc ON vr.hs_code = hc.code
WHERE vr.effective_date <= DATE('now') 
AND (vr.expiry_date IS NULL OR vr.expiry_date >= DATE('now'));
