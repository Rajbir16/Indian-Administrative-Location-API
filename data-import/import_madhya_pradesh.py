import os
from datetime import datetime

import pandas as pd
import psycopg2
from dotenv import load_dotenv


# ============================================================
# CONFIGURATION
# ============================================================

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

load_dotenv(os.path.join(SCRIPT_DIR, ".env"))

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL not found in data-import/.env"
    )

FILE_PATH = os.path.join(
    SCRIPT_DIR,
    "dataset",
    "dataset",
    "Rdir_2011_23_MADHYA_PRADESH.xls"
)


# ============================================================
# DATABASE
# ============================================================

def get_connection():
    return psycopg2.connect(DATABASE_URL)


# ============================================================
# IMPORT MADHYA PRADESH
# ============================================================

def main():

    print("=" * 65)
    print("MADHYA PRADESH DATA IMPORT")
    print("=" * 65)

    # Read the special MP file
    df = pd.read_excel(
        FILE_PATH,
        header=None,
        dtype=str,
        engine="xlrd"
    )

    print(f"Rows found: {len(df)}")

    connection = get_connection()

    try:

        with connection.cursor() as cursor:

            # ------------------------------------------------
            # Country
            # ------------------------------------------------

            cursor.execute(
                'SELECT "id" FROM "Country" WHERE "code" = %s',
                ("IN",)
            )

            country = cursor.fetchone()

            if country:
                country_id = country[0]
            else:

                now = datetime.now()

                cursor.execute(
                    """
                    INSERT INTO "Country"
                        ("code", "name", "status",
                         "createdAt", "updatedAt")
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING "id"
                    """,
                    (
                        "IN",
                        "India",
                        "ACTIVE",
                        now,
                        now
                    )
                )

                country_id = cursor.fetchone()[0]

            # ------------------------------------------------
            # Madhya Pradesh
            # ------------------------------------------------

            state_code = "23"
            state_name = "MADHYA PRADESH"

            cursor.execute(
                """
                INSERT INTO "State"
                    ("code", "name", "countryId",
                     "status", "createdAt", "updatedAt")
                VALUES (%s, %s, %s, %s, %s, %s)

                ON CONFLICT ("code", "countryId")
                DO UPDATE SET
                    "name" = EXCLUDED."name",
                    "updatedAt" = EXCLUDED."updatedAt"

                RETURNING "id"
                """,
                (
                    state_code,
                    state_name,
                    country_id,
                    "ACTIVE",
                    datetime.now(),
                    datetime.now()
                )
            )

            state_id = cursor.fetchone()[0]

            print(
                f"State: {state_name} ({state_code})"
            )

            # ------------------------------------------------
            # Districts
            # ------------------------------------------------

            district_count = 0

            for index in range(4, len(df)):

                row = df.iloc[index]

                # Expected:
                # column 0 = state code
                # column 1 = parent code
                # column 2 = district code
                # column 3 = secondary code
                # column 4 = district name

                code = str(row.iloc[2]).strip()
                name = str(row.iloc[4]).strip()

                if (
                    not code
                    or code.lower() == "nan"
                    or not name
                    or name.lower() == "nan"
                ):
                    continue

                # Remove source marker *
                name = name.replace("*", "").strip()

                now = datetime.now()

                cursor.execute(
                    """
                    INSERT INTO "District"
                        ("code", "name", "stateId",
                         "status", "createdAt", "updatedAt")
                    VALUES (%s, %s, %s, %s, %s, %s)

                    ON CONFLICT ("code", "stateId")
                    DO UPDATE SET
                        "name" = EXCLUDED."name",
                        "updatedAt" = EXCLUDED."updatedAt"
                    """,
                    (
                        code.zfill(2),
                        name,
                        state_id,
                        "ACTIVE",
                        now,
                        now
                    )
                )

                district_count += 1

            print(
                f"Districts imported/updated: "
                f"{district_count}"
            )

        connection.commit()

        print("=" * 65)
        print("✅ MADHYA PRADESH IMPORT COMPLETE")
        print("=" * 65)

    except Exception as error:

        connection.rollback()

        print("❌ Import failed")
        print(error)

        raise

    finally:

        connection.close()


if __name__ == "__main__":
    main()