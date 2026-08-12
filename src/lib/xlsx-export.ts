// Client-side XLSX export helpers.
// Values in columns marked `text: true` are written as string cells so that
// phone numbers, KRA PINs, bank accounts, etc. are never shown truncated or in
// scientific notation by Excel.
'use client';

import * as XLSX from 'xlsx';

export interface XlsxColumn {
  header: string;
  key: string;
  text?: boolean;
}

export function downloadXlsx(
  rows: Record<string, unknown>[],
  columns: XlsxColumn[],
  filename: string,
  sheetName = 'Report'
) {
  const aoa: (string | number)[][] = [columns.map((c) => c.header)];

  rows.forEach((row) => {
    aoa.push(
      columns.map((col) => {
        let value = row[col.key];
        if (value === null || value === undefined) {
          value = '';
        }
        if (col.text) {
          return String(value);
        }
        return value as string | number;
      })
    );
  });

  const worksheet = XLSX.utils.aoa_to_sheet(aoa);
  worksheet['!cols'] = columns.map((c) => ({
    wch: Math.max(c.header.length + 2, 16),
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
}
