import os
import psycopg2
from dotenv import load_dotenv

load_dotenv("data-import/.env")

database_url = os.getenv("DATABASE_URL")

if not database_url:
    raise RuntimeError("DATABASE_URL not found")

connection = psycopg2.connect(database_url)
cursor = connection.cursor()

tables = [
    "Country",
    "State",
    "District",
    "SubDistrict",
    "Village"
]

for table in tables:
    cursor.execute(f'SELECT COUNT(*) FROM "{table}"')
    count = cursor.fetchone()[0]
    print(f"{table}: {count:,}")

connection.close()