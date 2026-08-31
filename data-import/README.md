# MDDS Data Import Pipeline

This directory contains tools for inspecting and importing the MDDS (Master Directory of Data Set) - India's comprehensive administrative location hierarchy dataset.

## Current Status

✅ **Phase 4: Dataset Inspection - COMPLETE**

- 30 state/UT dataset files located and extracted
- 518,441 village records analyzed
- Schema structure and data quality assessed
- Import pipeline ready for implementation

## Directory Structure

```
data-import/
├── dataset/                    # Extracted MDDS dataset files (30 states)
│   └── dataset/
│       ├── Rdir_2011_02_HIMACHAL_PRADESH.xls
│       ├── Rdir_2011_03_PUNJAB.xls
│       ├── ... (28 more state files)
│       └── Rdir_2011_35_ANDAMAN_and_NICOBAR_ISLANDS.xls
│
├── inspect_dataset.py          # Inspection & validation script (READY)
├── import_dataset.py            # Data import script (TODO - Phase 4.2)
├── validate_dataset.py          # Post-import validation (TODO - Phase 4.2)
│
├── inspection_report.json       # Detailed inspection data (machine-readable)
├── inspection_output.txt        # Human-readable inspection output
├── INSPECTION_REPORT.md         # Comprehensive inspection report
│
├── requirements.txt             # Python dependencies
├── README.md                    # This file
└── .env.example                 # Environment configuration template
```

## Quick Start

### 1. Install Dependencies

```bash
cd data-import
pip install -r requirements.txt
```

**Requires:**
- Python 3.7+
- pandas
- openpyxl (xlsx support)
- xlrd (xls support)
- odfpy (ods support)

### 2. Inspect Dataset (Already Complete)

```bash
python inspect_dataset.py
```

**Output:**
- Console report with statistics
- `inspection_report.json` - JSON formatted data
- `inspection_output.txt` - Text output

## Dataset Overview

### File Statistics
- **Total Files:** 30 (29 .xls + 1 .ods)
- **Total Records:** 518,441 village records
- **Format:** MDDS 2011 Census data
- **Coverage:** All 28 states + 8 union territories

### Column Schema (Consistent Across All Files)
```
1. MDDS STC          → State Code (2-35)
2. STATE NAME        → State/UT Name
3. MDDS DTC          → District Code
4. DISTRICT NAME     → District Name
5. MDDS Sub_DT       → Sub-District Code
6. SUB-DISTRICT NAME → Sub-District/Tehsil Name
7. MDDS PLCN         → Place Code
8. Area Name         → Village/Area Name
```

### Data Quality
| Metric | Status |
|--------|--------|
| Total Records | 518,441 ✅ |
| Duplicates | 1 found ℹ️ |
| Missing Values | 2 files with nulls ⚠️ |
| Format Consistency | 100% ✅ |
| File Read Success | 29/30 (96.7%) ⚠️ |

### Known Issues
1. **ODS File Error** - `Rdir_2011_09_UTTAR_PRADESH.ods` requires conversion to XLS
2. **Leading Zeros** - Codes stored as integers, leading zeros must be preserved during import
3. **Missing Sub-Districts** - Assam (1 null) and Dadra & Nagar Haveli (multiple nulls)

## Inspection Report

Read the comprehensive inspection report:

📋 **[INSPECTION_REPORT.md](./INSPECTION_REPORT.md)**

Includes:
- Detailed file-by-file analysis
- Row counts for each state
- Data quality metrics
- Column mapping for database
- Critical findings and recommendations

## Next Phase: Data Import (Phase 4.2)

### Tasks to Implement

1. **fix-ods-file.sh / .bat** - Convert ODS to XLS
   ```bash
   libreoffice --headless --convert-to xls dataset/dataset/Rdir_2011_09_UTTAR_PRADESH.ods
   ```

2. **import_dataset.py** - Import all 30 files to database
   - Read all dataset files
   - Batch process records (5000 per batch)
   - Insert into Prisma database
   - Handle duplicates and null values
   - Generate import statistics

3. **validate_dataset.py** - Validate import completion
   - Verify all 518,441 records imported
   - Check referential integrity
   - Validate relationships
   - Generate summary report

### Expected Import Time
- **Throughput:** 10,000-50,000 records/second (batch inserts)
- **Duration:** ~10-30 seconds (with optimization)
- **Database:** NeonDB PostgreSQL (US-East-2)
cp .env.example .env

# Edit .env with your configuration
```

## Configuration

Edit `.env` file with:

```
DATABASE_URL=postgresql://user:password@localhost:5432/indian_locations
EXCEL_FILE_PATH=./data/mdds_data.xlsx
LOG_FILE_PATH=./logs/import.log
BATCH_SIZE=5000
```

### Database URL Format
- Local PostgreSQL: `postgresql://user:password@localhost:5432/dbname`
- NeonDB: `postgresql://user:password@host.neon.tech/database?sslmode=require`

## Data Format

Expected Excel columns:
```
MDDS STC          → State Code
STATE NAME        → State Name
MDDS DTC          → District Code
DISTRICT NAME     → District Name
MDDS Sub_DT       → Sub-District Code
SUB-DISTRICT NAME → Sub-District Name
MDDS PLCN         → Village Code
Area Name         → Village Name
```

## Usage

### Basic Import

```bash
# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Run import
python importer.py

# Check logs
tail -f logs/import.log
```

### Import Process

The importer will:

1. **Validate Excel File**
   - Check file exists
   - Verify columns present
   - Detect missing values

2. **Clean Data**
   - Strip whitespace
   - Normalize codes
   - Detect duplicates

3. **Validate Data**
   - Check code formats
   - Verify required fields
   - Validate data types

4. **Import Data**
   - Create/verify India country record
   - Upsert states
   - Upsert districts
   - Upsert sub-districts
   - Batch insert villages (5,000 records per batch)

5. **Generate Report**
   - Summary statistics
   - Failed records with reasons
   - Import duration
   - Row counts

6. **Verify Integrity**
   - Check foreign key relationships
   - Detect orphan records
   - Compare expected vs imported counts

### Example Output

```
==========================================
MDDS Data Import Report
==========================================
Start Time:        2024-01-15 10:30:00
End Time:          2024-01-15 10:45:30
Duration:          15.5 minutes

IMPORT SUMMARY:
States:            36 imported
Districts:         704 imported
Sub-Districts:     6,189 imported
Villages:          597,942 imported

ERRORS:
Failed States:     0
Failed Districts:  0
Failed Sub-Dists:  2
Failed Villages:   145

DETAILS:
Error log saved to: logs/import.log
```

## Error Handling

The importer continues processing after non-fatal errors. Check logs for:

```
ERROR - Row 1245: Duplicate district code '497'
ERROR - Row 5890: Missing required field 'SUB-DISTRICT NAME'
WARNING - Row 8921: Null value in MDDS PLCN
```

## Batch Processing

Villages are imported in batches of ~5,000 records to:
- Prevent memory overflow with large datasets
- Allow progress tracking
- Enable faster rollback if issues occur
- Show status updates during import

## Incremental Imports

The importer is **idempotent** - safe to run multiple times:

- Existing records are updated (upserted)
- Duplicate entries are skipped
- New records are inserted
- No data duplication occurs

## Database Schema

The importer creates/updates:

### Country
```sql
CREATE TABLE country (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  code VARCHAR(10) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active'
);
```

### State
```sql
CREATE TABLE state (
  id SERIAL PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  country_id INTEGER REFERENCES country(id),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active'
);
```

Similar tables for District, SubDistrict, Village.

## Troubleshooting

### Connection Error
```
psycopg2.OperationalError: could not connect to server
```
- Check `DATABASE_URL` in `.env`
- Verify PostgreSQL is running
- Test connection: `psql <connection_string>`

### File Not Found
```
FileNotFoundError: ./data/mdds_data.xlsx
```
- Create `data/` directory
- Place Excel file at specified path
- Verify filename matches `EXCEL_FILE_PATH`

### Missing Columns
```
KeyError: 'MDDS STC'
```
- Verify Excel file has correct column headers
- Check spelling exactly matches expected names

### Database Locked
```
psycopg2.OperationalError: database is locked
```
- Ensure no other processes are accessing database
- Wait for concurrent imports to complete
- Check if connection pooling issue

## Performance

### Import Time Estimates (on modern hardware)
- 600,000 villages: ~15-20 minutes
- 6,000 sub-districts: ~30 seconds
- 700 districts: ~2 seconds
- 36 states: <1 second

### Optimization Tips
- Increase `BATCH_SIZE` for faster imports (use 10,000 for large datasets)
- Ensure database is on same network for fastest connection
- Consider disabling indexes during import (and rebuilding after)

## Logs

Logs are written to `logs/import.log`:

```
[2024-01-15 10:30:00] INFO: Starting MDDS data import
[2024-01-15 10:30:02] INFO: Validating Excel file...
[2024-01-15 10:30:05] INFO: Found 36 states, 704 districts
[2024-01-15 10:35:10] ERROR: Row 1245: Duplicate key
[2024-01-15 10:45:30] INFO: Import completed successfully
```

## Advanced Usage

### Custom Validation

Edit `validators.py` to add custom validation rules:

```python
def validate_village_code(code: str) -> bool:
    # Add custom validation logic
    return len(code) == 8 and code.isdigit()
```

### Skip Specific Records

Edit `importer.py` to skip certain rows:

```python
if row['STATE NAME'] == 'Skip This State':
    continue
```

### Export Data

After import, export locations:

```bash
python -c "
import psycopg2
conn = psycopg2.connect(...)
cursor = conn.cursor()
cursor.execute('SELECT * FROM village LIMIT 10')
print(cursor.fetchall())
"
```

## Database Verification

After import, run verification queries:

```sql
-- Check total records
SELECT 
  COUNT(*) as states FROM state
UNION ALL
SELECT COUNT(*) as districts FROM district
UNION ALL
SELECT COUNT(*) as sub_districts FROM sub_district
UNION ALL
SELECT COUNT(*) as villages FROM village;

-- Check for orphans
SELECT * FROM village 
WHERE sub_district_id NOT IN (SELECT id FROM sub_district);

-- Check hierarchy integrity
SELECT DISTINCT s.id FROM state s
LEFT JOIN district d ON s.id = d.state_id
WHERE d.id IS NULL AND s.id > 1;
```

## Support & Debugging

For issues:
1. Check `logs/import.log` for error messages
2. Verify environment variables in `.env`
3. Test database connection separately
4. Run with verbose output (modify `logging.basicConfig`)

## Additional Resources

- [Pandas Documentation](https://pandas.pydata.org/docs/)
- [openpyxl Documentation](https://openpyxl.readthedocs.io/)
- [psycopg2 Documentation](https://www.psycopg.org/docs/)
- [SQLAlchemy ORM](https://docs.sqlalchemy.org/en/14/orm/)
