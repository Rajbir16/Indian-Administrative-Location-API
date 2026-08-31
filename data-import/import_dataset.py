import os
import argparse
import json
from datetime import datetime

import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv


# ============================================================
# CONFIGURATION
# ============================================================

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

load_dotenv(os.path.join(SCRIPT_DIR, ".env"))

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL not found. Make sure data-import/.env exists."
    )

DATASET_DIR = os.path.join(
    SCRIPT_DIR,
    "dataset",
    "dataset"
)

BATCH_SIZE = 5000

REPORT_FILE = os.path.join(
    SCRIPT_DIR,
    "import_report.json"
)


# ============================================================
# HELPERS
# ============================================================

def clean_code(value):
    """Convert source code to string while preserving leading zeros."""

    if value is None:
        return None

    value = str(value).strip()

    if value.lower() in ("nan", "none", ""):
        return None

    return value


def clean_name(value):
    """Clean text values."""

    if value is None:
        return None

    value = str(value).strip()

    if value.lower() in ("nan", "none", ""):
        return None

    return value


def is_placeholder(code, placeholder):
    return code is None or code == placeholder


# ============================================================
# DATABASE
# ============================================================

def get_connection():
    return psycopg2.connect(DATABASE_URL)


def get_or_create_country(cursor):
    """Create India if it doesn't already exist."""

    cursor.execute(
        'SELECT "id" FROM "Country" WHERE "code" = %s',
        ("IN",)
    )

    row = cursor.fetchone()

    if row:
        return row[0]

    now = datetime.now()

    cursor.execute(
        """
        INSERT INTO "Country"
            ("code", "name", "status", "createdAt", "updatedAt")
        VALUES (%s, %s, %s, %s, %s)
        RETURNING "id"
        """,
        ("IN", "India", "ACTIVE", now, now)
    )

    return cursor.fetchone()[0]


# ============================================================
# STATES
# ============================================================

def upsert_states(cursor, records, country_id):

    states = {}

    for record in records:

        code = record["state_code"]
        name = record["state_name"]

        if not code or not name:
            continue

        if code == "00":
            continue

        states[code] = name

    if not states:
        return {}

    now = datetime.now()

    values = [
        (
            code,
            name,
            country_id,
            "ACTIVE",
            now,
            now
        )
        for code, name in states.items()
    ]

    execute_values(
        cursor,
        """
        INSERT INTO "State"
            ("code", "name", "countryId",
             "status", "createdAt", "updatedAt")
        VALUES %s

        ON CONFLICT ("code", "countryId")
        DO UPDATE SET
            "name" = EXCLUDED."name",
            "updatedAt" = EXCLUDED."updatedAt"
        """,
        values,
        page_size=BATCH_SIZE
    )

    result = {}

    for code in states:

        cursor.execute(
            """
            SELECT "id"
            FROM "State"
            WHERE "code" = %s
              AND "countryId" = %s
            """,
            (code, country_id)
        )

        row = cursor.fetchone()

        if row:
            result[code] = row[0]

    return result


# ============================================================
# DISTRICTS
# ============================================================

def upsert_districts(cursor, records, state_ids):

    districts = {}

    for record in records:

        state_code = record["state_code"]
        district_code = record["district_code"]
        district_name = record["district_name"]

        if state_code not in state_ids:
            continue

        if is_placeholder(district_code, "000"):
            continue

        if not district_name:
            continue

        state_id = state_ids[state_code]

        key = (
            state_code,
            district_code,
            state_id
        )

        districts[key] = district_name

    if not districts:
        return {}

    now = datetime.now()

    values = [
        (
            district_code,
            district_name,
            state_id,
            "ACTIVE",
            now,
            now
        )
        for (
            state_code,
            district_code,
            state_id
        ), district_name in districts.items()
    ]

    execute_values(
        cursor,
        """
        INSERT INTO "District"
            ("code", "name", "stateId",
             "status", "createdAt", "updatedAt")
        VALUES %s

        ON CONFLICT ("code", "stateId")
        DO UPDATE SET
            "name" = EXCLUDED."name",
            "updatedAt" = EXCLUDED."updatedAt"
        """,
        values,
        page_size=BATCH_SIZE
    )

    result = {}

    for (
        state_code,
        district_code,
        state_id
    ) in districts:

        cursor.execute(
            """
            SELECT "id"
            FROM "District"
            WHERE "code" = %s
              AND "stateId" = %s
            """,
            (
                district_code,
                state_id
            )
        )

        row = cursor.fetchone()

        if row:
            result[
                (
                    state_code,
                    district_code
                )
            ] = row[0]

    return result


# ============================================================
# SUB-DISTRICTS
# ============================================================

def upsert_subdistricts(cursor, records, district_ids):

    subdistricts = {}

    for record in records:

        state_code = record["state_code"]
        district_code = record["district_code"]

        subdistrict_code = record["subdistrict_code"]
        subdistrict_name = record["subdistrict_name"]

        district_key = (
            state_code,
            district_code
        )

        if district_key not in district_ids:
            continue

        if is_placeholder(subdistrict_code, "00000"):
            continue

        if not subdistrict_name:
            continue

        district_id = district_ids[district_key]

        key = (
            state_code,
            district_code,
            subdistrict_code,
            district_id
        )

        subdistricts[key] = subdistrict_name

    if not subdistricts:
        return {}

    now = datetime.now()

    values = [
        (
            code,
            name,
            district_id,
            "ACTIVE",
            now,
            now
        )
        for (
            state_code,
            district_code,
            code,
            district_id
        ), name in subdistricts.items()
    ]

    execute_values(
        cursor,
        """
        INSERT INTO "SubDistrict"
            ("code", "name", "districtId",
             "status", "createdAt", "updatedAt")
        VALUES %s

        ON CONFLICT ("code", "districtId")
        DO UPDATE SET
            "name" = EXCLUDED."name",
            "updatedAt" = EXCLUDED."updatedAt"
        """,
        values,
        page_size=BATCH_SIZE
    )

    result = {}

    for (
        state_code,
        district_code,
        code,
        district_id
    ) in subdistricts:

        cursor.execute(
            """
            SELECT "id"
            FROM "SubDistrict"
            WHERE "code" = %s
              AND "districtId" = %s
            """,
            (
                code,
                district_id
            )
        )

        row = cursor.fetchone()

        if row:
            result[
                (
                    state_code,
                    district_code,
                    code
                )
            ] = row[0]

    return result


# ============================================================
# VILLAGES
# ============================================================

def insert_villages(
    cursor,
    records,
    state_ids,
    district_ids,
    subdistrict_ids
):

    village_values = []

    stats = {
        "valid": 0,
        "placeholder": 0,
        "missing_name": 0,
        "missing_hierarchy": 0,
        "duplicates_in_source": 0
    }

    seen = set()

    inserted = 0

    for record in records:

        village_code = record["village_code"]
        village_name = record["village_name"]

        if is_placeholder(village_code, "000000"):
            stats["placeholder"] += 1
            continue

        if not village_name:
            stats["missing_name"] += 1
            continue

        state_code = record["state_code"]
        district_code = record["district_code"]
        subdistrict_code = record["subdistrict_code"]

        if state_code not in state_ids:
            stats["missing_hierarchy"] += 1
            continue

        district_key = (
            state_code,
            district_code
        )

        if district_key not in district_ids:
            stats["missing_hierarchy"] += 1
            continue

        subdistrict_key = (
            state_code,
            district_code,
            subdistrict_code
        )

        if subdistrict_key not in subdistrict_ids:
            stats["missing_hierarchy"] += 1
            continue

        subdistrict_id = subdistrict_ids[
            subdistrict_key
        ]

        duplicate_key = (
            village_code,
            subdistrict_id
        )

        if duplicate_key in seen:
            stats["duplicates_in_source"] += 1
            continue

        seen.add(duplicate_key)

        village_values.append(
            (
                village_code,
                village_name,
                subdistrict_id,
                "ACTIVE",
                datetime.now(),
                datetime.now()
            )
        )

        stats["valid"] += 1

        if len(village_values) >= BATCH_SIZE:

            execute_values(
                cursor,
                """
                INSERT INTO "Village"
                    ("code", "name", "subDistrictId",
                     "status", "createdAt", "updatedAt")
                VALUES %s

                ON CONFLICT ("code", "subDistrictId")
                DO UPDATE SET
                    "name" = EXCLUDED."name",
                    "updatedAt" = EXCLUDED."updatedAt"
                """,
                village_values,
                page_size=BATCH_SIZE
            )

            inserted += len(village_values)

            village_values.clear()

            print(
                f"    Villages processed: {inserted:,}"
            )

    if village_values:

        execute_values(
            cursor,
            """
            INSERT INTO "Village"
                ("code", "name", "subDistrictId",
                 "status", "createdAt", "updatedAt")
            VALUES %s

            ON CONFLICT ("code", "subDistrictId")
            DO UPDATE SET
                "name" = EXCLUDED."name",
                "updatedAt" = EXCLUDED."updatedAt"
            """,
            village_values,
            page_size=BATCH_SIZE
        )

        inserted += len(village_values)

    return inserted, stats


# ============================================================
# LOAD EXCEL / ODS FILE
# ============================================================

def load_data_file(filepath):

    filename = os.path.basename(filepath)

    print(f"\nReading: {filename}")

    extension = os.path.splitext(filepath)[1].lower()

    if extension == ".ods":
        engine = "odf"
    else:
        engine = "xlrd"

    df = pd.read_excel(
        filepath,
        dtype=str,
        engine=engine
    )

    required_columns = [
        "MDDS STC",
        "STATE NAME",
        "MDDS DTC",
        "DISTRICT NAME",
        "MDDS Sub_DT",
        "SUB-DISTRICT NAME",
        "MDDS PLCN",
        "Area Name"
    ]

    missing = [
        column
        for column in required_columns
        if column not in df.columns
    ]

    if missing:
        raise ValueError(
            f"Missing columns: {missing}"
        )

    records = []

    for _, row in df.iterrows():

        records.append(
            {
                "state_code":
                    clean_code(row["MDDS STC"]),

                "state_name":
                    clean_name(row["STATE NAME"]),

                "district_code":
                    clean_code(row["MDDS DTC"]),

                "district_name":
                    clean_name(row["DISTRICT NAME"]),

                "subdistrict_code":
                    clean_code(row["MDDS Sub_DT"]),

                "subdistrict_name":
                    clean_name(
                        row["SUB-DISTRICT NAME"]
                    ),

                "village_code":
                    clean_code(row["MDDS PLCN"]),

                "village_name":
                    clean_name(row["Area Name"])
            }
        )

    return records


# ============================================================
# IMPORT ONE FILE
# ============================================================

def import_file(filepath):

    records = load_data_file(filepath)

    print(
        f"  Records read: {len(records):,}"
    )

    connection = get_connection()

    try:

        with connection.cursor() as cursor:

            country_id = get_or_create_country(
                cursor
            )

            state_ids = upsert_states(
                cursor,
                records,
                country_id
            )

            print(
                f"  States processed: {len(state_ids):,}"
            )

            district_ids = upsert_districts(
                cursor,
                records,
                state_ids
            )

            print(
                f"  Districts processed: {len(district_ids):,}"
            )

            subdistrict_ids = upsert_subdistricts(
                cursor,
                records,
                district_ids
            )

            print(
                f"  Sub-districts processed: "
                f"{len(subdistrict_ids):,}"
            )

            inserted, stats = insert_villages(
                cursor,
                records,
                state_ids,
                district_ids,
                subdistrict_ids
            )

            print(
                f"  Villages inserted/updated: "
                f"{inserted:,}"
            )

            print(
                f"  Placeholder rows skipped: "
                f"{stats['placeholder']:,}"
            )

            print(
                f"  Missing names skipped: "
                f"{stats['missing_name']:,}"
            )

            print(
                f"  Missing hierarchy skipped: "
                f"{stats['missing_hierarchy']:,}"
            )

            print(
                f"  Source duplicates skipped: "
                f"{stats['duplicates_in_source']:,}"
            )

        connection.commit()

        print("  ✅ Transaction committed.")

        return {
            "file": os.path.basename(filepath),
            "records_read": len(records),
            "villages_inserted_or_updated": inserted,
            "statistics": stats,
            "status": "SUCCESS"
        }

    except Exception as error:

        connection.rollback()

        print("  ❌ Transaction rolled back.")
        print(f"  Error: {error}")

        return {
            "file": os.path.basename(filepath),
            "records_read": len(records),
            "status": "FAILED",
            "error": str(error)
        }

    finally:

        connection.close()


# ============================================================
# MAIN
# ============================================================

def main():

    parser = argparse.ArgumentParser(
        description="Import MDDS location dataset into NeonDB"
    )

    parser.add_argument(
        "--state-code",
        help="Import only one state, for example 27",
        default=None
    )

    args = parser.parse_args()

    if not os.path.isdir(DATASET_DIR):

        raise RuntimeError(
            f"Dataset directory not found: {DATASET_DIR}"
        )

    # Find XLS and ODS files
    files = [
        os.path.join(DATASET_DIR, filename)
        for filename in os.listdir(DATASET_DIR)
        if filename.lower().endswith((".xls", ".ods"))
        and "23_MADHYA_PRADESH" not in filename
    ]

    files.sort()

    # Filter state if requested
    if args.state_code:

        state_code = str(
            int(args.state_code)
        ).zfill(2)

        prefix = f"Rdir_2011_{state_code}_"

        files = [
            filepath
            for filepath in files
            if os.path.basename(
                filepath
            ).startswith(prefix)
        ]

    if not files:

        raise RuntimeError(
            "No matching XLS/ODS files found."
        )

    print("=" * 70)
    print("MDDS DATA IMPORT")
    print("=" * 70)

    print(
        f"Files to process: {len(files)}"
    )

    print(
        f"Dataset directory: {DATASET_DIR}"
    )

    print("=" * 70)

    report = {
        "started_at":
            datetime.now().isoformat(),

        "files_requested":
            len(files),

        "files": []
    }

    # Process files
    for filepath in files:

        result = import_file(filepath)

        report["files"].append(result)

    report["finished_at"] = (
        datetime.now().isoformat()
    )

    with open(
        REPORT_FILE,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            report,
            file,
            indent=2
        )

    print("\n" + "=" * 70)
    print("IMPORT COMPLETE")
    print("=" * 70)

    print(
        f"Report saved to: {REPORT_FILE}"
    )


if __name__ == "__main__":
    main()