import os
import pandas as pd

dataset_dir = r"data-import\dataset\dataset"

expected = [
    "MDDS STC",
    "STATE NAME",
    "MDDS DTC",
    "DISTRICT NAME",
    "MDDS Sub_DT",
    "SUB-DISTRICT NAME",
    "MDDS PLCN",
    "Area Name"
]

for filename in sorted(os.listdir(dataset_dir)):

    if not filename.lower().endswith(".xls"):
        continue

    filepath = os.path.join(dataset_dir, filename)

    try:
        df = pd.read_excel(
            filepath,
            dtype=str,
            engine="xlrd"
        )

        columns = df.columns.tolist()

        if columns != expected:

            print("\n❌ DIFFERENT COLUMNS")
            print("FILE:", filename)
            print("EXPECTED:", expected)
            print("ACTUAL:", columns)

        else:

            print("✅ OK:", filename)

    except Exception as e:

        print("\n❌ ERROR")
        print("FILE:", filename)
        print("ERROR:", e)