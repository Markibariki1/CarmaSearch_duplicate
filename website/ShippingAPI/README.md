# VICE - Vehicle Import Cost Engine

A standalone web application for calculating vehicle import costs using real global trade data.

## Features

- **24,038 vehicles** from 177 makes and 5,104 models
- **Real global trade data** with 171 countries, tariff rates, and VAT rates
- **Auto-fill vehicle specifications** from comprehensive database
- **Professional import cost calculations** with actual tariff and VAT rates
- **Clean, modern interface** that works offline

## Quick Start

1. **Start the web server:**
   ```bash
   python3 -m http.server 3000
   ```

2. **Open your browser:**
   ```
   http://localhost:3000/vice_standalone.html
   ```

3. **Calculate import costs:**
   - Select vehicle make, model, and year
   - Watch specs auto-fill from database
   - Choose origin and destination countries
   - Get real import cost calculations

## Data Sources

- **Vehicle Database:** 24,038 vehicles with specifications from Ultimate Specs + EPA
- **Global Trade Database:** 171 countries with real tariff and VAT rates
- **HS Code Classification:** Automatic classification based on vehicle specifications

## Files

- `vice_standalone.html` - Main web application
- `massive_vehicle_dataset_cleaned.json` - Cleaned vehicle database (24,038 vehicles)
- `global_trade.db` - Global trade database (171 countries, tariff/VAT rates)
- `global_trade_sqlite_schema.sql` - Database schema

## Technical Details

- **Frontend:** Pure HTML/CSS/JavaScript (no dependencies)
- **Database:** SQLite with comprehensive global trade data
- **Vehicle Data:** JSON format with structured makes/models arrays
- **Calculations:** Real tariff rates, VAT rates, and de minimis values

## Data Quality

The vehicle database has been cleaned to remove:
- Duplicate makes (e.g., "Ruf Automobile Gmbh" vs "RUF Automobile")
- Full vehicle descriptions in make field (e.g., "2019 Citroen Spacetourer..." → "Citroen")
- Company suffixes (e.g., "Bitter Gmbh and Co. Kg" → "Bitter")

See `VEHICLE_DATA_CLEANING_REPORT.md` for detailed cleaning information.
