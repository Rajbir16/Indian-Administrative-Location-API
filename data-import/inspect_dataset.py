"""
MDDS Dataset Inspection Tool

This script inspects the actual MDDS dataset structure, columns, and data quality.
Supports .xls, .xlsx, and .ods file formats.

Purpose:
- List all dataset files
- Identify sheet names and structures
- Check column names and mappings
- Count rows and detect duplicates
- Identify data quality issues
- Generate inspection report

Usage:
    python inspect_dataset.py
"""

import os
import sys
from pathlib import Path
from typing import Dict, List, Tuple
import warnings

warnings.filterwarnings('ignore')

try:
    import pandas as pd
except ImportError:
    print("ERROR: pandas is required. Install with: pip install pandas")
    sys.exit(1)

try:
    import openpyxl
except ImportError:
    print("WARNING: openpyxl not installed. .xlsx support may be limited.")

try:
    import xlrd
except ImportError:
    print("WARNING: xlrd not installed. .xls support may be limited.")

try:
    from odf import opendocument, table
except ImportError:
    print("WARNING: odfpy not installed. .ods support may be limited.")


class MDDSDatasetInspector:
    """Inspects MDDS dataset files and reports structure and quality."""
    
    def __init__(self, dataset_dir: str):
        """Initialize inspector with dataset directory."""
        self.dataset_dir = Path(dataset_dir)
        self.files = []
        self.inspection_results = {}
        self.file_formats = {'xls': 0, 'xlsx': 0, 'ods': 0, 'other': 0}
        self.unique_schemas = {}
        
    def find_dataset_files(self) -> List[Path]:
        """Find all dataset files (.xls, .xlsx, .ods)."""
        if not self.dataset_dir.exists():
            print(f"ERROR: Dataset directory not found: {self.dataset_dir}")
            sys.exit(1)
            
        patterns = ['*.xls', '*.xlsx', '*.ods']
        files = []
        
        for pattern in patterns:
            files.extend(self.dataset_dir.glob(pattern))
        
        files.sort()
        self.files = files
        
        print(f"\n[FILES] Found {len(files)} dataset files:\n")
        for f in files:
            print(f"  * {f.name}")
        
        return files
    
    def get_file_format(self, file_path: Path) -> str:
        """Determine file format."""
        suffix = file_path.suffix.lower()
        format_map = {'.xls': 'xls', '.xlsx': 'xlsx', '.ods': 'ods'}
        return format_map.get(suffix, 'other')
    
    def read_file(self, file_path: Path) -> Tuple[Dict, str]:
        """
        Read file and extract sheet names and data.
        Returns: (data_dict, error_message)
        """
        file_format = self.get_file_format(file_path)
        self.file_formats[file_format] += 1
        
        try:
            if file_format in ['xls', 'xlsx']:
                # Read Excel file
                xls = pd.ExcelFile(file_path)
                data = {}
                for sheet in xls.sheet_names:
                    try:
                        df = pd.read_excel(file_path, sheet_name=sheet)
                        data[sheet] = df
                    except Exception as e:
                        data[sheet] = None
                return data, None
            
            elif file_format == 'ods':
                # Read ODS file
                try:
                    doc = opendocument.load(str(file_path))
                    tables_obj = doc.spreadsheet.getElementsByType(table.Table)
                    data = {}
                    
                    for table_obj in tables_obj:
                        sheet_name = table_obj.getAttribute('name')
                        rows = table_obj.getElementsByType(table.TableRow)
                        
                        # Convert ODS to DataFrame-like structure
                        sheet_data = []
                        for row in rows:
                            cells = row.getElementsByType(table.TableCell)
                            row_data = []
                            for cell in cells:
                                p_elements = cell.getElementsByType(table.P)
                                cell_value = ""
                                if p_elements:
                                    for p in p_elements:
                                        text_nodes = p.childNodes
                                        for node in text_nodes:
                                            if hasattr(node, 'data'):
                                                cell_value += node.data
                                row_data.append(cell_value)
                            sheet_data.append(row_data)
                        
                        if sheet_data:
                            df = pd.DataFrame(sheet_data[1:], columns=sheet_data[0])
                            data[sheet_name] = df
                    
                    return data, None
                except Exception as e:
                    return {}, f"Failed to read ODS: {str(e)}"
        
        except Exception as e:
            return {}, f"Error reading file: {str(e)}"
    
    def analyze_sheet(self, sheet_name: str, df: pd.DataFrame) -> Dict:
        """Analyze a single sheet's structure and quality."""
        if df is None or df.empty:
            return {
                'sheet': sheet_name,
                'rows': 0,
                'columns': 0,
                'col_names': [],
                'status': 'EMPTY'
            }
        
        # Get column info
        columns = list(df.columns)
        rows = len(df)
        
        # Check for duplicates
        duplicates = df.duplicated().sum()
        
        # Check for missing values
        missing = df.isnull().sum().to_dict()
        
        return {
            'sheet': sheet_name,
            'rows': rows,
            'columns': len(columns),
            'col_names': columns,
            'missing_values': missing,
            'duplicates': duplicates,
            'status': 'OK',
            'sample_rows': df.head(3).to_dict('records') if rows > 0 else []
        }
    
    def normalize_columns(self, columns: List[str]) -> List[str]:
        """Normalize column names for comparison."""
        return [str(col).strip().upper() for col in columns]
    
    def inspect_file(self, file_path: Path) -> Dict:
        """Fully inspect a single file."""
        print(f"  Processing: {file_path.name}...", end=" ")
        
        data, error = self.read_file(file_path)
        
        if error:
            print(f"[ERROR] {error}")
            return {
                'file': file_path.name,
                'status': 'ERROR',
                'error': error
            }
        
        if not data:
            print("[NO DATA]")
            return {
                'file': file_path.name,
                'status': 'EMPTY'
            }
        
        # Analyze all sheets
        sheets_info = []
        for sheet_name, df in data.items():
            sheet_analysis = self.analyze_sheet(sheet_name, df)
            sheets_info.append(sheet_analysis)
        
        file_info = {
            'file': file_path.name,
            'format': self.get_file_format(file_path),
            'sheets': len(sheets_info),
            'sheets_info': sheets_info,
            'status': 'OK'
        }
        
        print("[OK]")
        return file_info
    
    def run_inspection(self) -> None:
        """Run full dataset inspection."""
        print("\n" + "="*80)
        print("MDDS DATASET INSPECTION REPORT")
        print("="*80)
        
        # Find files
        files = self.find_dataset_files()
        
        if not files:
            print("No dataset files found!")
            return
        
        # Inspect each file
        print(f"\n[INSPECT] Inspecting {len(files)} files...\n")
        
        for file_path in files:
            result = self.inspect_file(file_path)
            self.inspection_results[file_path.name] = result
        
        # Generate report
        self.generate_report()
    
    def generate_report(self) -> None:
        """Generate and display inspection report."""
        print("\n" + "="*80)
        print("INSPECTION SUMMARY")
        print("="*80)
        
        # File format summary
        print("\n[FILE FORMATS]")
        print(f"  .xls files:  {self.file_formats['xls']}")
        print(f"  .xlsx files: {self.file_formats['xlsx']}")
        print(f"  .ods files:  {self.file_formats['ods']}")
        print(f"  Total:       {len(self.files)}")
        
        # Detailed file analysis
        print("\n" + "-"*80)
        print("DETAILED FILE ANALYSIS")
        print("-"*80)
        
        for file_name, result in self.inspection_results.items():
            print(f"\n[FILE] {file_name}")
            print(f"   Status: {result.get('status', 'UNKNOWN')}")
            
            if result['status'] == 'ERROR':
                print(f"   Error: {result.get('error', 'Unknown error')}")
                continue
            
            if result['status'] == 'EMPTY':
                continue
            
            print(f"   Format: {result.get('format', 'unknown')}")
            print(f"   Sheets: {result.get('sheets', 0)}")
            
            # Analyze each sheet
            for sheet_info in result.get('sheets_info', []):
                if sheet_info['status'] == 'EMPTY':
                    continue
                
                print(f"\n   [SHEET] {sheet_info['sheet']}")
                print(f"     Rows: {sheet_info['rows']}")
                print(f"     Columns: {sheet_info['columns']}")
                print(f"     Duplicates: {sheet_info['duplicates']}")
                
                # Column names
                print(f"     Columns: {sheet_info['col_names'][:5]}")
                if len(sheet_info['col_names']) > 5:
                    print(f"              ... and {len(sheet_info['col_names']) - 5} more")
                
                # Missing values
                missing = {k: v for k, v in sheet_info['missing_values'].items() if v > 0}
                if missing:
                    print(f"     Missing Values: {missing}")
                
                # Sample records
                if sheet_info['sample_rows']:
                    print(f"     Sample Row (1st): {sheet_info['sample_rows'][0]}")
        
        # Analyze column name patterns across files
        self.analyze_column_patterns()
        
        # Check data quality
        self.analyze_data_quality()
    
    def analyze_column_patterns(self) -> None:
        """Identify column name patterns and mappings."""
        print("\n" + "-"*80)
        print("[COLUMN ANALYSIS]")
        print("-"*80)
        
        all_columns = set()
        file_columns = {}
        
        for file_name, result in self.inspection_results.items():
            if result['status'] != 'OK':
                continue
            
            for sheet_info in result.get('sheets_info', []):
                cols = sheet_info.get('col_names', [])
                file_columns[file_name] = cols
                all_columns.update(cols)
        
        print(f"\nTotal Unique Columns Across All Files: {len(all_columns)}\n")
        
        # Sample columns from first file
        if file_columns:
            first_file = next(iter(file_columns))
            print(f"Sample Columns (from {first_file}):")
            for col in file_columns[first_file][:10]:
                print(f"  • {col}")
            if len(file_columns[first_file]) > 10:
                print(f"  ... and {len(file_columns[first_file]) - 10} more")
    
    def analyze_data_quality(self) -> None:
        """Analyze data quality issues."""
        print("\n" + "-"*80)
        print("[DATA QUALITY ANALYSIS]")
        print("-"*80)
        
        total_duplicates = 0
        files_with_missing = 0
        total_rows = 0
        
        for file_name, result in self.inspection_results.items():
            if result['status'] != 'OK':
                continue
            
            for sheet_info in result.get('sheets_info', []):
                total_rows += sheet_info.get('rows', 0)
                total_duplicates += sheet_info.get('duplicates', 0)
                
                missing = sheet_info.get('missing_values', {})
                if any(v > 0 for v in missing.values()):
                    files_with_missing += 1
        
        print(f"\nTotal Rows Across All Sheets: {total_rows:,}")
        print(f"Total Duplicates Found: {total_duplicates}")
        print(f"Files With Missing Values: {files_with_missing}")
    
    def save_report(self, output_file: str) -> None:
        """Save inspection report to JSON file."""
        import json
        
        try:
            with open(output_file, 'w') as f:
                json.dump(self.inspection_results, f, indent=2, default=str)
            print(f"\n[SUCCESS] Report saved to: {output_file}")
        except Exception as e:
            print(f"\n[ERROR] Failed to save report: {e}")


def main():
    """Main entry point."""
    # Determine dataset directory
    current_dir = Path(__file__).parent
    dataset_dir = current_dir / "dataset" / "dataset"
    
    if not dataset_dir.exists():
        dataset_dir = current_dir / "dataset"
    
    # Run inspection
    inspector = MDDSDatasetInspector(str(dataset_dir))
    inspector.run_inspection()
    
    # Save detailed report
    report_file = current_dir / "inspection_report.json"
    inspector.save_report(str(report_file))
    
    print("\n" + "="*80)
    print("[INSPECTION COMPLETE]")
    print("="*80)


if __name__ == '__main__':
    main()
