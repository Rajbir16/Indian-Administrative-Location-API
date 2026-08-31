#!/usr/bin/env python3
"""
Phase 3 - Database Verification Script

Verifies that database migration and seeding were successful.
Usage: python docs/phase3-verify.py

Requires:
  - Database must be populated with seed data
  - DATABASE_URL environment variable set, or .env file in backend/
"""

import os
import sys
from pathlib import Path

# Add backend to path for imports
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

def verify_database():
    """Verify database setup and data integrity."""
    
    try:
        import psycopg2
        from psycopg2.extras import RealDictCursor
        from dotenv import load_dotenv
    except ImportError:
        print("❌ Required Python packages not found")
        print("Install with: pip install psycopg2-binary python-dotenv")
        return False
    
    # Load environment variables
    env_file = backend_path / ".env"
    if env_file.exists():
        load_dotenv(env_file)
    
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ DATABASE_URL not set")
        print("Set in backend/.env or as environment variable")
        return False
    
    # Parse connection string
    try:
        # Simple parsing for postgresql://user:password@host/db
        from urllib.parse import urlparse
        parsed = urlparse(database_url)
        
        conn_params = {
            "host": parsed.hostname,
            "port": parsed.port or 5432,
            "user": parsed.username,
            "password": parsed.password,
            "database": parsed.path.lstrip("/"),
        }
    except Exception as e:
        print(f"❌ Failed to parse DATABASE_URL: {e}")
        return False
    
    # Connect to database
    try:
        print("🔗 Connecting to database...")
        conn = psycopg2.connect(**conn_params)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        print("✓ Database connected\n")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False
    
    all_checks_passed = True
    
    # Verification checks
    checks = [
        ("country", "Country records", lambda c: c.execute("SELECT COUNT(*) as count FROM country") or c.fetchone()["count"]),
        ("state", "State records", lambda c: c.execute("SELECT COUNT(*) as count FROM state") or c.fetchone()["count"]),
        ("district", "District records", lambda c: c.execute("SELECT COUNT(*) as count FROM district") or c.fetchone()["count"]),
        ("sub_district", "Sub-District records", lambda c: c.execute("SELECT COUNT(*) as count FROM sub_district") or c.fetchone()["count"]),
        ("village", "Village records", lambda c: c.execute("SELECT COUNT(*) as count FROM village") or c.fetchone()["count"]),
        ("user", "User records", lambda c: c.execute("SELECT COUNT(*) as count FROM user") or c.fetchone()["count"]),
    ]
    
    print("📊 Table Record Counts:")
    print("-" * 40)
    
    for table, label, query in checks:
        try:
            count = query(cursor)
            if count > 0:
                print(f"✓ {label}: {count}")
            else:
                print(f"⚠ {label}: {count} (empty)")
                if table not in ["user"]:  # User table can be empty
                    all_checks_passed = False
        except Exception as e:
            print(f"✗ {label}: {e}")
            all_checks_passed = False
    
    print()
    
    # Verify relationships
    print("🔗 Verifying Relationships:")
    print("-" * 40)
    
    relationship_checks = [
        (
            "Foreign Key: state.country_id",
            "SELECT COUNT(*) as count FROM state WHERE country_id IS NULL",
            0,
        ),
        (
            "Foreign Key: district.state_id",
            "SELECT COUNT(*) as count FROM district WHERE state_id IS NULL",
            0,
        ),
        (
            "Foreign Key: sub_district.district_id",
            "SELECT COUNT(*) as count FROM sub_district WHERE district_id IS NULL",
            0,
        ),
        (
            "Foreign Key: village.sub_district_id",
            "SELECT COUNT(*) as count FROM village WHERE sub_district_id IS NULL",
            0,
        ),
    ]
    
    for check_name, query_str, expected in relationship_checks:
        try:
            cursor.execute(query_str)
            result = cursor.fetchone()["count"]
            if result == expected:
                print(f"✓ {check_name}")
            else:
                print(f"✗ {check_name}: Found {result} orphaned records")
                all_checks_passed = False
        except Exception as e:
            print(f"✗ {check_name}: {e}")
            all_checks_passed = False
    
    print()
    
    # Verify sample data
    print("🔍 Sample Location Hierarchy:")
    print("-" * 40)
    
    try:
        cursor.execute("""
            SELECT 
                c.name as country,
                s.name as state,
                d.name as district,
                sd.name as sub_district,
                v.name as village
            FROM village v
            JOIN sub_district sd ON v.sub_district_id = sd.id
            JOIN district d ON sd.district_id = d.id
            JOIN state s ON d.state_id = s.id
            JOIN country c ON s.country_id = c.id
            LIMIT 3
        """)
        
        rows = cursor.fetchall()
        if rows:
            for row in rows:
                print(f"✓ {row['country']} → {row['state']} → {row['district']} → {row['sub_district']} → {row['village']}")
        else:
            print("⚠ No location data found")
            all_checks_passed = False
    except Exception as e:
        print(f"✗ Could not retrieve sample data: {e}")
        all_checks_passed = False
    
    print()
    
    # Index verification
    print("📈 Index Statistics:")
    print("-" * 40)
    
    try:
        cursor.execute("""
            SELECT 
                tablename,
                indexname
            FROM pg_indexes
            WHERE schemaname = 'public'
            ORDER BY tablename, indexname
        """)
        
        indexes = cursor.fetchall()
        if indexes:
            current_table = None
            for idx in indexes:
                if idx["tablename"] != current_table:
                    current_table = idx["tablename"]
                    print(f"\n{current_table}:")
                print(f"  - {idx['indexname']}")
        else:
            print("⚠ No indexes found")
    except Exception as e:
        print(f"✗ Could not retrieve indexes: {e}")
    
    print()
    
    # Database size
    print("💾 Database Information:")
    print("-" * 40)
    
    try:
        cursor.execute("""
            SELECT 
                pg_database.datname,
                pg_size_pretty(pg_database_size(pg_database.datname)) as size
            FROM pg_database
            WHERE datname = current_database()
        """)
        
        result = cursor.fetchone()
        if result:
            print(f"Database: {result['datname']}")
            print(f"Size: {result['size']}")
    except Exception as e:
        print(f"⚠ Could not get database size: {e}")
    
    # Cleanup
    cursor.close()
    conn.close()
    
    print()
    print("=" * 40)
    
    if all_checks_passed:
        print("✅ All verification checks passed!")
        print("\nPhase 3 Status: COMPLETE")
        return True
    else:
        print("⚠ Some verification checks failed")
        print("\nPlease review the issues above")
        return False


if __name__ == "__main__":
    success = verify_database()
    sys.exit(0 if success else 1)
