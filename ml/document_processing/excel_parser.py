"""
Excel / CSV parser — extracts all sheets as structured text.
Owner: Member 2 — ML & Document Intelligence Lead
"""
import pandas as pd
from loguru import logger
from pathlib import Path


class ExcelParser:
    """Parse Excel (.xlsx, .xls) and CSV files into text."""

    def extract(self, file_path: str) -> str:
        try:
            path = Path(file_path)
            if path.suffix.lower() == ".csv":
                df = pd.read_csv(file_path)
                return self._df_to_text(df, path.stem)

            xl = pd.ExcelFile(file_path)
            parts = []
            for sheet in xl.sheet_names:
                df = xl.parse(sheet)
                if df.empty:
                    continue
                parts.append(f"[Sheet: {sheet}]\n{self._df_to_text(df, sheet)}")
            return "\n\n".join(parts)

        except Exception as e:
            logger.error(f"Excel/CSV parse failed for {file_path}: {e}")
            return ""

    # ------------------------------------------------------------------
    def _df_to_text(self, df: pd.DataFrame, name: str) -> str:
        if df.empty:
            return ""
        lines = [
            f"Table: {name}",
            f"Rows: {len(df)} | Columns: {', '.join(df.columns.astype(str))}",
            "",
        ]
        for _, row in df.head(500).iterrows():  # cap at 500 rows
            pairs = [
                f"{col}: {val}"
                for col, val in row.items()
                if pd.notna(val) and str(val).strip()
            ]
            if pairs:
                lines.append(" | ".join(pairs))
        return "\n".join(lines)
