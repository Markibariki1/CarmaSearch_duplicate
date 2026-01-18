# Global Trade Database System

A comprehensive database system for global import/export tariffs, taxes, and duties covering 200+ countries with real-time data integration.

## Overview

This system provides a complete solution for accessing up-to-date global trade data including:

- **Tariff Rates**: Import duties for all countries and product categories
- **VAT/Tax Rates**: Value-added taxes and other consumption taxes
- **Trade Agreements**: Preferential rates under FTAs and customs unions
- **De Minimis Values**: Duty-free thresholds for low-value shipments
- **Trade Restrictions**: Bans, quotas, and licensing requirements
- **Real-time Updates**: Integration with official data sources

## Features

### 🌍 Global Coverage
- **200+ Countries**: Complete coverage of all major trading nations
- **Full HS Code Support**: Harmonized System classification for all products
- **Multiple Currencies**: Support for all major world currencies
- **Regional Integration**: EU, NAFTA, ASEAN, and other trade blocs

### 📊 Comprehensive Data
- **Tariff Rates**: MFN and preferential rates from official sources
- **VAT/Tax Rates**: Standard, reduced, and zero rates by country
- **Additional Taxes**: Excise, environmental, luxury taxes
- **Trade Restrictions**: Import/export bans and quotas
- **De Minimis Values**: Duty-free thresholds by country

### 🔄 Real-time Integration
- **WTO TTD**: World Trade Organization tariff data
- **USITC DataWeb**: US International Trade Commission
- **EU TARIC**: European Union customs database
- **UN Comtrade**: United Nations trade statistics
- **National APIs**: Direct integration with customs authorities

### 🚀 High Performance
- **Optimized Schema**: Efficient database design for fast queries
- **Caching System**: Redis-based caching for frequently accessed data
- **Rate Limiting**: Respectful API usage with built-in limits
- **Batch Processing**: Efficient bulk data updates

## Database Schema

### Core Tables

#### `countries`
- Country codes (ISO2/ISO3)
- Regional classifications
- Currency information
- Standard VAT rates

#### `hs_codes`
- Harmonized System classification
- Hierarchical structure (2-10 digits)
- Product descriptions
- Parent-child relationships

#### `tariff_rates`
- Import duty rates by country pair
- HS code specific rates
- Trade agreement preferences
- Effective date ranges

#### `vat_rates`
- Value-added tax rates
- Product-specific rates
- Standard/reduced/zero categories
- Effective date ranges

#### `trade_agreements`
- Free trade agreements
- Customs unions
- Preferential arrangements
- Membership details

#### `de_minimis_values`
- Duty-free thresholds
- Currency-specific amounts
- Product restrictions
- Country-specific rules

## Installation

### Prerequisites
- PostgreSQL 15+
- Python 3.11+
- Redis (optional, for caching)

### 1. Database Setup
```bash
# Create database
createdb global_trade_db

# Run schema creation
psql -d global_trade_db -f global_trade_database_schema.sql
```

### 2. Python Dependencies
```bash
pip install -r requirements.txt
```

### 3. Initialize Database
```bash
python setup_global_trade_db.py
```

### 4. Run Data Collection
```bash
python global_trade_collector.py
```

## Usage

### Basic Query Examples

#### Get Tariff Rate
```sql
SELECT 
    tr.rate,
    tr.rate_type,
    c1.name as destination,
    c2.name as origin,
    hc.description as product
FROM tariff_rates tr
JOIN countries c1 ON tr.dest_country_iso2 = c1.iso2_code
JOIN countries c2 ON tr.origin_country_iso2 = c2.iso2_code
JOIN hs_codes hc ON tr.hs_code = hc.code
WHERE tr.dest_country_iso2 = 'US'
  AND tr.origin_country_iso2 = 'JP'
  AND tr.hs_code = '8703.21'
  AND tr.effective_date <= CURRENT_DATE
  AND (tr.expiry_date IS NULL OR tr.expiry_date >= CURRENT_DATE);
```

#### Get VAT Rate
```sql
SELECT 
    vr.vat_rate,
    vr.rate_type,
    c.name as country,
    hc.description as product
FROM vat_rates vr
JOIN countries c ON vr.country_iso2 = c.iso2_code
JOIN hs_codes hc ON vr.hs_code = hc.code
WHERE vr.country_iso2 = 'DE'
  AND vr.hs_code = '8703.21'
  AND vr.effective_date <= CURRENT_DATE
  AND (vr.expiry_date IS NULL OR vr.expiry_date >= CURRENT_DATE);
```

#### Get De Minimis Value
```sql
SELECT 
    dmv.amount,
    dmv.currency_code,
    c.name as country
FROM de_minimis_values dmv
JOIN countries c ON dmv.country_iso2 = c.iso2_code
WHERE dmv.country_iso2 = 'US'
  AND dmv.effective_date <= CURRENT_DATE
  AND (dmv.expiry_date IS NULL OR dmv.expiry_date >= CURRENT_DATE);
```

### Python API Usage

#### Using the Global Trade APIs
```python
import asyncio
from global_trade_apis import GlobalTradeAPIs

async def get_tariff_info():
    async with GlobalTradeAPIs() as apis:
        # Get tariff rate
        rate = await apis.get_tariff_rate('US', 'JP', '8703.21')
        print(f"Tariff rate: {rate}")
        
        # Get VAT rate
        vat_rate = await apis.get_vat_rate('DE')
        print(f"VAT rate: {vat_rate}")
        
        # Get de minimis value
        de_minimis = await apis.get_de_minimis_value('US')
        print(f"De minimis: ${de_minimis}")

asyncio.run(get_tariff_info())
```

#### Using the Data Collector
```python
import asyncio
from global_trade_collector import GlobalTradeCollector

async def collect_data():
    collector = GlobalTradeCollector("postgresql://user:pass@localhost/db")
    
    # Collect from all sources
    results = await collector.collect_all_data()
    
    # Store collected data
    for source_id, source_results in results['sources'].items():
        if source_results.get('status') == 'success':
            tariff_records = source_results.get('tariff_records', [])
            if tariff_records:
                stored = collector.store_tariff_data(tariff_records)
                print(f"Stored {stored} records from {source_id}")

asyncio.run(collect_data())
```

## Data Sources

### Official Sources
- **WTO TTD**: World Trade Organization Tariff & Trade Data
- **USITC**: US International Trade Commission
- **EU TARIC**: European Union Customs Database
- **UN Comtrade**: United Nations Trade Statistics
- **World Bank**: Trade and Development Indicators

### National Customs Authorities
- **US CBP**: Customs and Border Protection
- **Canada CBSA**: Border Services Agency
- **UK HMRC**: Her Majesty's Revenue and Customs
- **Australia ABF**: Australian Border Force
- **Japan Customs**: Ministry of Finance

### Commercial Sources
- **CustomsRates.com**: Global tariff database
- **TradeAtlas**: Country-specific tariff information
- **Trademo**: Comprehensive trade data feeds

## API Integration

### Rate Limiting
Each data source has configured rate limits:
- WTO TTD: 60 requests/minute
- USITC: 100 requests/minute
- EU TARIC: 120 requests/minute
- UN Comtrade: 1000 requests/minute

### Authentication
Some sources require API keys:
- USITC DataWeb: API key required
- UN Comtrade: API key required
- US CBP: API key required

### Error Handling
- Automatic retry with exponential backoff
- Rate limit compliance
- Fallback to alternative sources
- Comprehensive error logging

## Maintenance

### Regular Updates
```bash
# Daily update script
python update_daily.py

# Weekly comprehensive update
python update_weekly.py

# Monthly full refresh
python update_monthly.py
```

### Data Validation
```bash
# Validate data integrity
python validate_data.py

# Check for missing rates
python check_missing_rates.py

# Verify source consistency
python verify_sources.py
```

### Performance Optimization
```sql
-- Update statistics
ANALYZE;

-- Reindex for performance
REINDEX DATABASE global_trade_db;

-- Vacuum for space recovery
VACUUM ANALYZE;
```

## Integration with VICE

The global trade database integrates seamlessly with the VICE (Vehicle Import Cost Engine) system:

### Updated Integrations
- Replace mock data with real tariff rates
- Add comprehensive country coverage
- Include trade agreement preferences
- Support for all vehicle HS codes

### Enhanced Calculations
- Real-time rate lookups
- Currency conversion
- Trade agreement benefits
- De minimis value checks

### API Endpoints
- `/v1/tariff/{country}/{hs_code}` - Get tariff rate
- `/v1/vat/{country}/{hs_code}` - Get VAT rate
- `/v1/de-minimis/{country}` - Get de minimis value
- `/v1/restrictions/{country}/{hs_code}` - Get trade restrictions

## Contributing

### Adding New Data Sources
1. Create integration class in `global_trade_apis.py`
2. Add configuration to `api_configs`
3. Implement rate limiting and error handling
4. Add tests for the new source

### Updating Existing Data
1. Modify the appropriate collector method
2. Update database schema if needed
3. Test with sample data
4. Deploy with proper versioning

### Reporting Issues
- Use GitHub issues for bug reports
- Include sample data and expected results
- Provide error logs and stack traces
- Specify affected countries/products

## License

This project is licensed under the MIT License. See LICENSE file for details.

## Support

For technical support or questions:
- Email: support@globaltrade.com
- Documentation: https://docs.globaltrade.com
- Issues: https://github.com/globaltrade/database/issues

## Changelog

### Version 1.0.0 (2024-01-05)
- Initial release
- 200+ countries coverage
- Complete HS code support
- Real-time API integration
- Comprehensive documentation

---

**Note**: This system requires regular updates to maintain accuracy. Tariff rates and trade policies change frequently, so automated data collection and validation are essential for production use.
