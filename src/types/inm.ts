export type UnitCode = 'IRNA' | 'RAJAL' | 'LAB' | 'RAD' | 'GIZI' | 'IGD' | 'BDRS' | 'OK' | 'FARM';

export interface UnitInfo {
  code: UnitCode;
  name: string;
  fullName: string;
  description: string;
}

export type IndicatorType = 'N_D' | 'PERCENT_ONLY';

export interface IndicatorDefinition {
  id: number;
  code: string;
  title: string;
  targetLabel: string;
  targetValue: number;
  targetOperator: '>=' | '>' | '<=' | '<' | '=';
  type: IndicatorType;
  numeratorLabel?: string;
  denominatorLabel?: string;
  relevantUnits?: UnitCode[]; // if undefined, applies to all
  description: string;
  standardReference: string;
}

export interface UnitCellData {
  numerator?: number | null;
  denominator?: number | null;
  percent?: number | null; // for PERCENT_ONLY or cached
}

export type IndicatorRowData = {
  [key in UnitCode]?: UnitCellData;
};

export interface MonthlyRecord {
  month: number; // 1-12
  year: number;
  data: {
    [indicatorId: number]: IndicatorRowData;
  };
  notes?: string;
  lastUpdated?: string;
}

export interface IndicatorSummary {
  id: number;
  title: string;
  targetLabel: string;
  targetValue: number;
  targetOperator: string;
  type: IndicatorType;
  unitValues: {
    [key in UnitCode]?: {
      numerator: number | null;
      denominator: number | null;
      percent: number | null;
      isMet: boolean | null;
    };
  };
  avgNumerator: number | null;
  avgDenominator: number | null;
  avgPercent: number | null;
  aggregatePercent: number | null;
  isMetAverage: boolean | null;
  activeUnitCount: number;
}

export interface HospitalConfig {
  name: string;
  subTitle: string;
  address: string;
  city: string;
  leadQualityName: string;
  leadQualityNip: string;
  directorName: string;
  directorNip: string;
}

export interface ValidationError {
  indicatorId: number;
  indicatorTitle: string;
  unitCode: UnitCode;
  field: 'numerator' | 'denominator' | 'percent';
  message: string;
  severity: 'error' | 'warning';
}

export interface ThresholdAlert {
  indicatorId: number;
  indicatorTitle: string;
  targetLabel: string;
  targetValue: number;
  currentValue: number;
  gap: number;
  severity: 'critical' | 'warning';
  message: string;
  recommendation: string;
}

