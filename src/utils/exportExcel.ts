import * as XLSX from 'xlsx';
import { INDICATORS, MONTH_NAMES, UNITS } from '../data/inmConfig';
import { HospitalConfig, MonthlyRecord } from '../types/inm';
import { computeMonthlySummaries } from './calculations';

/**
 * Exports current monthly record into an Excel workbook.
 * Sheet 1: Rekapitulasi Nilai Rata-Rata Mutu RS (Consolidated Average of each indicator)
 * Sheet 2: Rincian Data Per Unit (Matrix of 9 units)
 */
export function exportToExcel(record: MonthlyRecord, hospital: HospitalConfig) {
  const summaries = computeMonthlySummaries(record);
  const monthName = MONTH_NAMES[record.month - 1];

  const wb = XLSX.utils.book_new();

  // SHEET 1: REKAPITULASI NILAI RATA-RATA MUTU
  const avgRows: (string | number)[][] = [
    [hospital.name],
    [hospital.subTitle],
    [`LAPORAN REKAPITULASI NILAI RATA-RATA INDIKATOR NASIONAL MUTU (INM)`],
    [`PERIODE: BULAN ${monthName.toUpperCase()} ${record.year}`],
    [],
    [
      'NO.',
      'INDIKATOR NASIONAL MUTU',
      'STANDAR / TARGET',
      'RATA-RATA NUMERATOR (N)',
      'RATA-RATA DENOMINATOR (D)',
      'NILAI RATA-RATA CAPAIAN (%)',
      'STATUS CAPAIAN',
    ],
  ];

  summaries.forEach((summary) => {
    const isMet = summary.isMetAverage;
    const statusText =
      isMet === true ? 'TERCAPAI' : isMet === false ? 'BELUM TERCAPAI' : 'BELUM ADA DATA';

    avgRows.push([
      summary.id,
      summary.title,
      summary.targetLabel,
      summary.type === 'PERCENT_ONLY' ? '-' : summary.avgNumerator !== null ? Number(summary.avgNumerator.toFixed(2)) : '-',
      summary.type === 'PERCENT_ONLY' ? '-' : summary.avgDenominator !== null ? Number(summary.avgDenominator.toFixed(2)) : '-',
      summary.avgPercent !== null ? Number(summary.avgPercent.toFixed(2)) : '-',
      statusText,
    ]);
  });

  const wsAvg = XLSX.utils.aoa_to_sheet(avgRows);
  wsAvg['!cols'] = [
    { wch: 6 },  // NO
    { wch: 45 }, // INDIKATOR
    { wch: 18 }, // STANDAR
    { wch: 24 }, // RATA N
    { wch: 24 }, // RATA D
    { wch: 28 }, // NILAI RATA %
    { wch: 20 }, // STATUS
  ];

  XLSX.utils.book_append_sheet(wb, wsAvg, `Rekap_Rata_Rata_INM`);

  // SHEET 2: RINCIAN PER UNIT (Lampiran)
  const unitRows: (string | number)[][] = [
    ['LAMPIRAN RINCIAN DATA INDIKATOR MUTU PER UNIT PELAYANAN'],
    [`PERIODE: ${monthName.toUpperCase()} ${record.year}`],
    [],
    ['NO.', 'INDIKATOR', '', 'N/D/%', ...UNITS.map(u => u.code), 'RATA-RATA'],
  ];

  summaries.forEach((summary) => {
    if (summary.type === 'PERCENT_ONLY') {
      unitRows.push([
        summary.id,
        summary.title,
        '',
        '%',
        ...UNITS.map(u => {
          const val = summary.unitValues[u.code]?.percent;
          return val !== null && val !== undefined ? Number(val.toFixed(2)) : '';
        }),
        summary.avgPercent !== null ? Number(summary.avgPercent.toFixed(2)) : ''
      ]);
    } else {
      // N
      unitRows.push([
        summary.id,
        summary.title,
        '',
        'N',
        ...UNITS.map(u => {
          const val = summary.unitValues[u.code]?.numerator;
          return val !== null && val !== undefined ? val : '';
        }),
        summary.avgNumerator !== null ? Number(summary.avgNumerator.toFixed(2)) : ''
      ]);

      // D
      unitRows.push([
        '',
        '',
        '',
        'D',
        ...UNITS.map(u => {
          const val = summary.unitValues[u.code]?.denominator;
          return val !== null && val !== undefined ? val : '';
        }),
        summary.avgDenominator !== null ? Number(summary.avgDenominator.toFixed(2)) : ''
      ]);

      // %
      unitRows.push([
        '',
        '',
        '',
        '%',
        ...UNITS.map(u => {
          const val = summary.unitValues[u.code]?.percent;
          return val !== null && val !== undefined ? Number(val.toFixed(2)) : '';
        }),
        summary.avgPercent !== null ? Number(summary.avgPercent.toFixed(2)) : ''
      ]);
    }
  });

  const wsUnits = XLSX.utils.aoa_to_sheet(unitRows);
  wsUnits['!cols'] = [
    { wch: 6 },
    { wch: 45 },
    { wch: 4 },
    { wch: 6 },
    ...UNITS.map(() => ({ wch: 10 })),
    { wch: 12 },
  ];

  XLSX.utils.book_append_sheet(wb, wsUnits, `Rincian_Unit_Pelayanan`);

  // Download workbook
  XLSX.writeFile(wb, `Laporan_Rata_Rata_INM_${monthName}_${record.year}.xlsx`);
}

/**
 * Exports directly to CSV format matching the exact structure from the user's attachment.
 */
export function exportToCSV(record: MonthlyRecord) {
  const summaries = computeMonthlySummaries(record);

  const lines: string[] = [
    ',,,,,,,,,,,,,',
    'NO.,INDIKATOR,,,IRNA,RAJAL,LAB,RAD,GIZI,IGD,BDRS,OK,FARM,RATA-RATA',
  ];

  summaries.forEach((summary) => {
    if (summary.type === 'PERCENT_ONLY') {
      const vals = UNITS.map(u => {
        const p = summary.unitValues[u.code]?.percent;
        return p !== null && p !== undefined ? p.toFixed(2) : '';
      }).join(',');
      const avg = summary.avgPercent !== null ? summary.avgPercent.toFixed(2) : '';
      lines.push(`${summary.id},"${summary.title}",,%,${vals},${avg}`);
    } else {
      // N
      const nVals = UNITS.map(u => {
        const v = summary.unitValues[u.code]?.numerator;
        return v !== null && v !== undefined ? String(v) : '';
      }).join(',');
      const nAvg = summary.avgNumerator !== null ? summary.avgNumerator.toFixed(2) : '#DIV/0!';
      lines.push(`${summary.id},"${summary.title}",,N,${nVals},${nAvg}`);

      // D
      const dVals = UNITS.map(u => {
        const v = summary.unitValues[u.code]?.denominator;
        return v !== null && v !== undefined ? String(v) : '';
      }).join(',');
      const dAvg = summary.avgDenominator !== null ? summary.avgDenominator.toFixed(2) : '#DIV/0!';
      lines.push(`,,,D,${dVals},${dAvg}`);

      // %
      let hasDiv0 = false;
      const pVals = UNITS.map(u => {
        const n = summary.unitValues[u.code]?.numerator;
        const d = summary.unitValues[u.code]?.denominator;
        if (n !== null && n !== undefined && d !== null && d !== undefined && d > 0) {
          return ((n / d) * 100).toFixed(2);
        }
        hasDiv0 = true;
        return '#DIV/0!';
      }).join(',');
      const pAvg = !hasDiv0 && summary.avgPercent !== null ? summary.avgPercent.toFixed(2) : '#DIV/0!';
      lines.push(`,,,%,${pVals},${pAvg}`);
    }
  });

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Laporan_Mutu_Nasional_${record.month}_${record.year}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parses uploaded CSV / Excel file and merges values into target monthly record.
 */
export async function parseImportFile(file: File, baseRecord: MonthlyRecord): Promise<MonthlyRecord> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = wb.SheetNames[0];
  const ws = wb.Sheets[firstSheetName];
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

  const updatedData = JSON.parse(JSON.stringify(baseRecord.data));

  // Find header row containing IRNA, RAJAL, etc.
  let headerRowIndex = -1;
  const unitColMap: { [colIdx: number]: string } = {};

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;
    for (let c = 0; c < row.length; c++) {
      const cellVal = String(row[c] || '').trim().toUpperCase();
      const matchUnit = UNITS.find(u => u.code === cellVal);
      if (matchUnit) {
        headerRowIndex = r;
        unitColMap[c] = matchUnit.code;
      }
    }
    if (headerRowIndex !== -1) break;
  }

  if (headerRowIndex === -1) {
    throw new Error('Format file tidak dikenali. Pastikan terdapat kolom unit (IRNA, RAJAL, LAB, dll).');
  }

  // Parse rows following header
  let currentIndicatorId: number | null = null;

  for (let r = headerRowIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const noCell = row[0];
    const indTitleCell = row[1];
    let typeCell = '';

    // Search for N, D, % in cells 2, 3, or 4
    for (let c = 1; c <= 4; c++) {
      const v = String(row[c] || '').trim().toUpperCase();
      if (v === 'N' || v === 'D' || v === '%') {
        typeCell = v;
        break;
      }
    }

    if (noCell && !isNaN(Number(noCell)) && Number(noCell) >= 1 && Number(noCell) <= 13) {
      currentIndicatorId = Number(noCell);
    } else if (indTitleCell) {
      // Try to find indicator matching title
      const found = INDICATORS.find(ind =>
        String(indTitleCell).toLowerCase().includes(ind.code.toLowerCase()) ||
        String(indTitleCell).toLowerCase().includes(ind.title.toLowerCase().substring(0, 10))
      );
      if (found) currentIndicatorId = found.id;
    }

    if (!currentIndicatorId) continue;
    const indId = currentIndicatorId;
    if (!updatedData[indId]) {
      updatedData[indId] = {};
    }

    Object.entries(unitColMap).forEach(([colStr, unitCode]) => {
      const colIdx = Number(colStr);
      const valRaw = row[colIdx];
      const valNum = valRaw !== undefined && valRaw !== '' && !isNaN(Number(valRaw)) ? Number(valRaw) : null;

      if (!updatedData[indId][unitCode]) {
        updatedData[indId][unitCode] = {};
      }

      if (typeCell === 'N') {
        updatedData[indId][unitCode].numerator = valNum;
      } else if (typeCell === 'D') {
        updatedData[indId][unitCode].denominator = valNum;
      } else if (typeCell === '%' && indId === 13) {
        updatedData[indId][unitCode].percent = valNum;
      }
    });
  }

  return {
    ...baseRecord,
    lastUpdated: new Date().toISOString(),
    data: updatedData,
  };
}
