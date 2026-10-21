import { INDICATORS, UNITS } from '../data/inmConfig';
import { IndicatorDefinition, IndicatorRowData, IndicatorSummary, MonthlyRecord, UnitCode } from '../types/inm';

export function calculatePercent(numerator?: number | null, denominator?: number | null): number | null {
  if (numerator === null || numerator === undefined || denominator === null || denominator === undefined) {
    return null;
  }
  if (denominator <= 0) {
    return null; // Equivalent to #DIV/0! in Excel
  }
  return (numerator / denominator) * 100;
}

export function isTargetMet(value: number | null, operator: string, target: number): boolean | null {
  if (value === null || isNaN(value)) return null;

  const roundedVal = Math.round(value * 100) / 100;
  const roundedTarget = Math.round(target * 100) / 100;

  switch (operator) {
    case '>=':
      return roundedVal >= roundedTarget;
    case '>':
      return roundedVal > roundedTarget;
    case '<=':
      return roundedVal <= roundedTarget;
    case '<':
      return roundedVal < roundedTarget;
    case '=':
      return Math.abs(roundedVal - roundedTarget) < 0.01;
    default:
      return roundedVal >= roundedTarget;
  }
}

export function formatNumber(val?: number | null, decimals = 2, emptyPlaceholder = '-'): string {
  if (val === null || val === undefined || isNaN(val)) {
    return emptyPlaceholder;
  }
  return val.toLocaleString('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPercent(val?: number | null, decimals = 2, emptyPlaceholder = '-'): string {
  if (val === null || val === undefined || isNaN(val)) {
    return emptyPlaceholder;
  }
  return `${val.toLocaleString('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}%`;
}

/**
 * Returns exact cell value as rendered in Excel template (e.g. "91.94" or "#DIV/0!")
 */
export function getExcelCellDisplay(
  num?: number | null,
  den?: number | null,
  decimals = 2
): string {
  if (num === null || num === undefined || den === null || den === undefined || den === 0) {
    return '#DIV/0!';
  }
  const pct = (num / den) * 100;
  return pct.toFixed(decimals);
}

export function computeIndicatorSummary(
  indicator: IndicatorDefinition,
  rowData?: IndicatorRowData
): IndicatorSummary {
  const unitValues: IndicatorSummary['unitValues'] = {};
  let sumN = 0;
  let countN = 0;
  let sumD = 0;
  let countD = 0;
  let sumPct = 0;
  let countPct = 0;

  UNITS.forEach((u) => {
    const cell = rowData?.[u.code];
    let num: number | null = null;
    let den: number | null = null;
    let pct: number | null = null;

    if (indicator.type === 'PERCENT_ONLY') {
      if (cell?.percent !== undefined && cell?.percent !== null && !isNaN(cell.percent)) {
        pct = Number(cell.percent);
        sumPct += pct;
        countPct++;
      }
    } else {
      if (cell?.numerator !== undefined && cell?.numerator !== null && !isNaN(cell.numerator)) {
        num = Number(cell.numerator);
        sumN += num;
        countN++;
      }
      if (cell?.denominator !== undefined && cell?.denominator !== null && !isNaN(cell.denominator)) {
        den = Number(cell.denominator);
        sumD += den;
        countD++;
      }
      if (num !== null && den !== null && den > 0) {
        pct = (num / den) * 100;
        sumPct += pct;
        countPct++;
      }
    }

    const met = pct !== null ? isTargetMet(pct, indicator.targetOperator, indicator.targetValue) : null;

    unitValues[u.code] = {
      numerator: num,
      denominator: den,
      percent: pct,
      isMet: met,
    };
  });

  const avgNumerator = countN > 0 ? sumN / countN : null;
  const avgDenominator = countD > 0 ? sumD / countD : null;
  const avgPercent = countPct > 0 ? sumPct / countPct : null;
  const aggregatePercent = sumD > 0 ? (sumN / sumD) * 100 : null;

  const isMetAverage =
    avgPercent !== null
      ? isTargetMet(avgPercent, indicator.targetOperator, indicator.targetValue)
      : null;

  return {
    id: indicator.id,
    title: indicator.title,
    targetLabel: indicator.targetLabel,
    targetValue: indicator.targetValue,
    targetOperator: indicator.targetOperator,
    type: indicator.type,
    unitValues,
    avgNumerator,
    avgDenominator,
    avgPercent,
    aggregatePercent,
    isMetAverage,
    activeUnitCount: countPct,
  };
}

export function computeMonthlySummaries(record: MonthlyRecord): IndicatorSummary[] {
  return INDICATORS.map((ind) => computeIndicatorSummary(ind, record.data[ind.id]));
}

export function computeOverallStats(summaries: IndicatorSummary[]) {
  let totalWithData = 0;
  let totalMet = 0;
  let totalNotMet = 0;

  summaries.forEach((s) => {
    if (s.avgPercent !== null) {
      totalWithData++;
      if (s.isMetAverage) {
        totalMet++;
      } else {
        totalNotMet++;
      }
    }
  });

  const complianceRate = totalWithData > 0 ? (totalMet / totalWithData) * 100 : 0;

  return {
    totalIndicators: summaries.length,
    totalWithData,
    totalMet,
    totalNotMet,
    complianceRate,
  };
}
