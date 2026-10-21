import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Check,
  XCircle,
  Building2,
  Clock,
  Layers,
  TableProperties,
  Bell,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Calendar,
  BarChart3,
  Award
} from 'lucide-react';
import { INDICATORS, MONTH_NAMES, UNITS } from '../data/inmConfig';
import { HospitalConfig, MonthlyRecord, ThresholdAlert } from '../types/inm';
import {
  computeAnnualSummaries,
  computeIndicatorSummary,
  computeMonthlySummaries,
  computeOverallStats,
  formatNumber,
  formatPercent,
  isTargetMet
} from '../utils/calculations';
import { getThresholdAlerts } from '../utils/validation';
import { ReportChart } from './ReportChart';

interface ReportSheetProps {
  record: MonthlyRecord;
  hospital: HospitalConfig;
  yearRecords?: Record<number, MonthlyRecord>;
  onExportExcel: () => void;
  onExportCSV: () => void;
  onPrint: () => void;
  onNavigateToInput: () => void;
}

export const ReportSheet: React.FC<ReportSheetProps> = ({
  record,
  hospital,
  yearRecords,
  onExportExcel,
  onExportCSV,
  onPrint,
  onNavigateToInput,
}) => {
  const [showUnitBreakdown, setShowUnitBreakdown] = useState<boolean>(false);
  const [showAnnualMatrix, setShowAnnualMatrix] = useState<boolean>(true);
  const [filterThreshold, setFilterThreshold] = useState<'all' | 'alertsOnly'>('all');
  const [showAlertDetails, setShowAlertDetails] = useState<boolean>(true);

  const monthName = MONTH_NAMES[record.month - 1];

  // Monthly computations for the currently selected month
  const summaries = useMemo(() => computeMonthlySummaries(record), [record]);
  const stats = useMemo(() => computeOverallStats(summaries), [summaries]);
  const alerts: ThresholdAlert[] = useMemo(() => getThresholdAlerts(summaries), [summaries]);

  // Annual computations across all 12 months of the year
  const annualSummary = useMemo(() => {
    return computeAnnualSummaries(record.year, yearRecords || { [record.month]: record });
  }, [record.year, record.month, record, yearRecords]);

  // Filter indicators if user selected alertsOnly
  const displayedSummaries = summaries.filter((s) => {
    if (filterThreshold === 'alertsOnly') {
      return s.isMetAverage === false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner: Auto-Sync Notification & Annual Info */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Otomatis Terhubung ke Lembar Kerja & Rekap Tahunan</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight">
              LAPORAN MUTU NASIONAL (INM)
            </h2>
            <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-3xl leading-relaxed">
              Nilai <span className="text-emerald-300 font-bold">RATA-RATA BULANAN</span> dan{' '}
              <span className="text-teal-300 font-bold underline decoration-teal-400">RATA-RATA TAHUNAN</span> ke-13 indikator terhitung otomatis dari seluruh unit pelayanan.
              Dilengkapi <span className="text-amber-300 font-bold underline decoration-amber-400">sistem peringatan ambang batas</span> dan matriks tren 12 bulan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onExportExcel}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition-all cursor-pointer shadow-md"
            >
              <Download className="w-4 h-4 text-emerald-700" />
              <span>Unduh Rekap Excel (Bulanan & Tahunan)</span>
            </button>
            <button
              type="button"
              onClick={onPrint}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-xl transition-all cursor-pointer border border-emerald-500/40 shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Laporan / PDF</span>
            </button>
          </div>
        </div>

        {/* Quick Period & Sync status */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between text-xs text-slate-300 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">{hospital.name}</span>
            <span>&bull;</span>
            <span>Periode Bulan: <strong className="text-emerald-300">{monthName} {record.year}</strong></span>
            <span>&bull;</span>
            <span>Tahun Berjalan: <strong className="text-teal-300">{record.year}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Rata-rata bulanan & tahunan tersinkronisasi otomatis</span>
          </div>
        </div>
      </div>

      {/* SISTEM PERINGATAN (WARNING NOTIFICATION SYSTEM) */}
      {alerts.length > 0 ? (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-600/30 animate-pulse">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-rose-950 text-sm md:text-base flex items-center gap-2">
                  <span>PERINGATAN: {alerts.length} INDIKATOR DI LUAR AMBANG BATAS</span>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-600 text-white">
                    Perlu Tindak Lanjut
                  </span>
                </h3>
                <p className="text-xs text-rose-700 mt-0.5">
                  Rata-rata capaian mutu pada bulan <strong>{monthName} {record.year}</strong> belum memenuhi standar nasional Kemenkes RI.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAlertDetails(!showAlertDetails)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-800 bg-rose-100 hover:bg-rose-200 rounded-lg transition-colors cursor-pointer border border-rose-300"
              >
                <span>{showAlertDetails ? 'Sembunyikan Rincian' : 'Lihat Rincian Peringatan'}</span>
                {showAlertDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Expanded List of Warnings */}
          {showAlertDetails && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {alerts.map((al) => (
                <div
                  key={al.indicatorId}
                  className="bg-white rounded-xl p-3.5 border border-rose-200 shadow-2xs flex items-start gap-3"
                >
                  <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    {al.indicatorId}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-xs text-slate-900 truncate">
                        {al.indicatorTitle}
                      </h4>
                      <span className="text-[11px] font-extrabold font-mono text-rose-600 shrink-0">
                        {al.currentValue.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span>Target: <strong className="text-slate-800">{al.targetLabel}</strong></span>
                      <span>&bull;</span>
                      <span className="text-rose-600 font-semibold">Gap: {Math.abs(al.gap).toFixed(2)}%</span>
                    </div>
                    <p className="text-[11px] text-rose-900/90 font-medium mt-1.5 bg-rose-50 p-2 rounded-lg border border-rose-100">
                      &bull; {al.recommendation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : stats.totalWithData > 0 ? (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 shadow-2xs flex items-center justify-between gap-3 text-emerald-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm">SELURUH INDIKATOR MEMENUHI AMBANG BATAS</h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                Semua indikator yang terisi data pada bulan <strong>{monthName} {record.year}</strong> telah mencapai target mutu nasional.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
            Kinerja Mutu Prima
          </span>
        </div>
      ) : null}

      {/* EXECUTIVE KPI SUMMARY CARDS (BULANAN & TAHUNAN) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Kepatuhan Bulan Ini */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs bg-slate-50/40">
          <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Capaian Bulan {monthName}
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900">
              {stats.complianceRate.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-500 font-semibold">Tercapai</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {stats.totalMet} dari {stats.totalWithData} indikator terdata
          </p>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.complianceRate}%` }}
            ></div>
          </div>
        </div>

        {/* Card 2: Indikator Peringatan Bulan Ini */}
        <div className="bg-white rounded-2xl border border-rose-200 p-4 shadow-2xs bg-rose-50/30">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-rose-800 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              Peringatan Bulan Ini
            </p>
            <span className="text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
              {stats.totalNotMet} Indikator
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-rose-700">{stats.totalNotMet}</span>
            <span className="text-xs font-semibold text-rose-600">Perlu tindak lanjut</span>
          </div>
          <p className="text-[11px] text-rose-600/90 mt-1">
            Memerlukan perbaikan mutu (PDCA)
          </p>
        </div>

        {/* Card 3: RATA-RATA TAHUNAN KESELURUHAN (TAHUN {record.year}) */}
        <div className="bg-white rounded-2xl border border-teal-300 p-4 shadow-2xs bg-teal-50/40 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-teal-900 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-teal-700" />
              Rata-Rata Tahunan {record.year}
            </p>
            <span className="text-[11px] font-extrabold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full border border-teal-200">
              Akumulasi YTD
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-teal-800">
              {annualSummary.overallAnnualComplianceRate.toFixed(1)}%
            </span>
            <span className="text-xs text-teal-700 font-semibold">Tingkat Capaian RS</span>
          </div>
          <p className="text-[11px] text-teal-700 mt-1">
            {annualSummary.totalMet} dari {annualSummary.totalWithData} indikator memenuhi target tahunan
          </p>
          <div className="w-full bg-teal-200/70 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-teal-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${annualSummary.overallAnnualComplianceRate}%` }}
            ></div>
          </div>
        </div>

        {/* Card 4: Status Bulan Aktif Terdata */}
        <div className="bg-white rounded-2xl border border-cyan-200 p-4 shadow-2xs bg-cyan-50/30">
          <p className="text-xs font-semibold text-cyan-800 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-600" />
            Cakupan Periode {record.year}
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-cyan-900">
              {Object.keys(yearRecords || {}).length}
            </span>
            <span className="text-xs text-cyan-700 font-semibold">dari 12 Bulan Terdata</span>
          </div>
          <p className="text-[11px] text-cyan-700 mt-1">
            Rata-rata tahunan dihitung dari bulan yang telah diinput
          </p>
          <div className="w-full bg-cyan-200/70 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-cyan-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${(Object.keys(yearRecords || {}).length / 12) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* VISUALISASI DATA: GRAFIK RATA-RATA BULANAN (BAR & LINE) */}
      <ReportChart summaries={summaries} monthName={monthName} year={record.year} />

      {/* Main Table: REKAPITULASI NILAI RATA-RATA SETIAP INDIKATOR MUTU (DILENGKAPI RATA-RATA PER TAHUN) */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden">
        {/* Table Title Bar & Filter Options */}
        <div className="bg-slate-100/90 px-6 py-4 border-b border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-sm md:text-base">
                TABEL REKAPITULASI NILAI RATA-RATA INDIKATOR NASIONAL MUTU (INM)
              </h3>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                Bulanan & Tahunan
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Menampilkan nilai <span className="font-bold text-slate-800">Rata-Rata Bulan {monthName}</span> berdampingan dengan{' '}
              <span className="font-bold text-teal-800">Rata-Rata Pertahun ({record.year})</span> untuk ke-13 indikator.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter: All vs Alerts Only */}
            <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-300 text-xs">
              <button
                type="button"
                onClick={() => setFilterThreshold('all')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  filterThreshold === 'all'
                    ? 'bg-slate-800 text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua ({summaries.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterThreshold('alertsOnly')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  filterThreshold === 'alertsOnly'
                    ? 'bg-rose-700 text-white font-bold'
                    : 'text-rose-700 hover:bg-rose-50'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Peringatan ({alerts.length})</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onNavigateToInput}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer"
            >
              <span>Ubah di Lembar Kerja</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* The Core Consolidated Average Table with Monthly & Annual Averages */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-200/90 text-slate-900 font-bold border-b-2 border-slate-300 font-sans">
                <th className="py-3 px-3 w-12 text-center border-r border-slate-300">NO.</th>
                <th className="py-3 px-4 min-w-[260px] border-r border-slate-300">
                  INDIKATOR NASIONAL MUTU
                </th>
                <th className="py-3 px-3 w-28 text-center border-r border-slate-300 bg-slate-100">
                  STANDAR / TARGET
                </th>
                <th className="py-3 px-2 w-28 text-center border-r border-slate-300">
                  RATA (N) BULAN INI
                </th>
                <th className="py-3 px-2 w-28 text-center border-r border-slate-300">
                  RATA (D) BULAN INI
                </th>
                <th className="py-3 px-3 w-36 text-center border-r border-slate-300 bg-emerald-100/80 text-emerald-950 font-black">
                  RATA-RATA BULAN {monthName.substring(0, 3).toUpperCase()} (%)
                </th>
                <th className="py-3 px-3 w-40 text-center border-r border-slate-300 bg-teal-100/90 text-teal-950 font-black">
                  RATA-RATA PER TAHUN {record.year} (%)
                </th>
                <th className="py-3 px-3 w-32 text-center border-r border-slate-300">
                  STATUS CAPAIAN
                </th>
                <th className="py-3 px-4 min-w-[220px]">
                  ANALISIS & TINDAK LANJUT
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {displayedSummaries.map((summary) => {
                const ind = INDICATORS.find((i) => i.id === summary.id)!;
                const hasMonthlyData = summary.avgPercent !== null;
                const isMonthlyMet = summary.isMetAverage;
                const isMonthlyBreached = isMonthlyMet === false;

                // Annual data calculation for this indicator
                const annInd = annualSummary.indicators.find((a) => a.id === summary.id);
                const hasAnnualData = annInd && annInd.annualAvgPercent !== null;
                const isAnnualMet = annInd?.isMetAnnual;
                const isAnnualBreached = isAnnualMet === false;

                const gap =
                  hasMonthlyData && summary.avgPercent !== null
                    ? ind.targetOperator === '<'
                      ? summary.avgPercent - summary.targetValue
                      : summary.targetValue - summary.avgPercent
                    : null;

                return (
                  <tr
                    key={summary.id}
                    className={`transition-colors ${
                      isMonthlyBreached
                        ? 'bg-rose-50/70 hover:bg-rose-100/60 ring-1 ring-inset ring-rose-200'
                        : isMonthlyMet === true
                        ? 'bg-white hover:bg-slate-50'
                        : 'bg-slate-50/40 hover:bg-slate-100/50'
                    }`}
                  >
                    {/* Column 1: NO */}
                    <td className="py-3 px-3 text-center font-bold text-slate-800 border-r border-slate-200">
                      <span
                        className={`w-6 h-6 rounded-full inline-flex items-center justify-center font-bold text-xs ${
                          isMonthlyBreached
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        {summary.id}
                      </span>
                    </td>

                    {/* Column 2: INDIKATOR */}
                    <td className="py-3 px-4 border-r border-slate-200">
                      <div className="flex items-center gap-1.5">
                        {isMonthlyBreached && (
                          <span title="Melebihi / Di Bawah Ambang Batas Target!">
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          </span>
                        )}
                        <span className="font-bold text-slate-900 text-xs leading-snug">
                          {summary.title}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                          {ind.code}
                        </span>
                        <span>{summary.activeUnitCount} Unit Terlibat</span>
                      </div>
                    </td>

                    {/* Column 3: STANDAR / TARGET */}
                    <td className="py-3 px-3 text-center border-r border-slate-200 bg-slate-50/50 font-bold font-mono text-emerald-800">
                      <span className="px-2 py-1 rounded-md bg-emerald-50 border border-emerald-200 inline-block">
                        {summary.targetLabel}
                      </span>
                    </td>

                    {/* Column 4: RATA-RATA N BULAN INI */}
                    <td className="py-3 px-2 text-right font-mono font-semibold text-slate-800 border-r border-slate-200 pr-3">
                      {summary.type === 'PERCENT_ONLY' ? (
                        <span className="text-slate-400 font-sans italic text-[11px]">Survei</span>
                      ) : summary.avgNumerator !== null ? (
                        formatNumber(summary.avgNumerator, 2)
                      ) : (
                        <span className="text-slate-400 font-normal">-</span>
                      )}
                    </td>

                    {/* Column 5: RATA-RATA D BULAN INI */}
                    <td className="py-3 px-2 text-right font-mono font-semibold text-slate-800 border-r border-slate-200 pr-3">
                      {summary.type === 'PERCENT_ONLY' ? (
                        <span className="text-slate-400 font-sans italic text-[11px]">Responden</span>
                      ) : summary.avgDenominator !== null ? (
                        formatNumber(summary.avgDenominator, 2)
                      ) : (
                        <span className="text-slate-400 font-normal">-</span>
                      )}
                    </td>

                    {/* Column 6: NILAI RATA-RATA BULAN INI (%) */}
                    <td
                      className={`py-3 px-3 border-r border-slate-200 text-center transition-all ${
                        isMonthlyBreached
                          ? 'bg-rose-100/80 ring-2 ring-inset ring-rose-400'
                          : 'bg-emerald-50/40'
                      }`}
                    >
                      {hasMonthlyData && summary.avgPercent !== null ? (
                        <div className="flex flex-col items-center">
                          <span
                            className={`text-sm font-extrabold font-mono px-2.5 py-1 rounded-lg ${
                              isMonthlyMet === true
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-rose-600 text-white shadow-xs animate-pulse'
                            }`}
                          >
                            {summary.avgPercent.toFixed(2)}%
                          </span>
                          {/* Mini Progress Bar */}
                          <div className="w-20 bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isMonthlyMet === true ? 'bg-emerald-600' : 'bg-rose-600'
                              }`}
                              style={{ width: `${Math.min(100, summary.avgPercent)}%` }}
                            ></div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Belum Ada Data</span>
                      )}
                    </td>

                    {/* Column 7: NILAI RATA-RATA PER TAHUN (%) - THE USER REQUEST */}
                    <td
                      className={`py-3 px-3 border-r border-slate-200 text-center transition-all ${
                        isAnnualBreached
                          ? 'bg-amber-100/70 ring-2 ring-inset ring-amber-400'
                          : 'bg-teal-50/50'
                      }`}
                    >
                      {hasAnnualData && annInd?.annualAvgPercent !== null && annInd?.annualAvgPercent !== undefined ? (
                        <div className="flex flex-col items-center">
                          <span
                            className={`text-sm font-extrabold font-mono px-2.5 py-1 rounded-lg ${
                              isAnnualMet === true
                                ? 'bg-teal-700 text-white shadow-xs'
                                : 'bg-amber-600 text-white shadow-xs'
                            }`}
                          >
                            {annInd.annualAvgPercent.toFixed(2)}%
                          </span>
                          <span className="text-[10px] text-teal-900 font-semibold mt-1">
                            {annInd.activeMonthsCount} Bulan Terdata
                          </span>
                          {/* Mini Progress Bar */}
                          <div className="w-20 bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isAnnualMet === true ? 'bg-teal-600' : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(100, annInd.annualAvgPercent)}%` }}
                            ></div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Belum Ada Data</span>
                      )}
                    </td>

                    {/* Column 8: STATUS CAPAIAN (BULAN & TAHUN) */}
                    <td className="py-3 px-3 text-center border-r border-slate-200">
                      <div className="flex flex-col items-center gap-1">
                        {/* Monthly Status */}
                        {isMonthlyMet === true ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <Check className="w-3 h-3" />
                            <span>Bulan Ini: OK</span>
                          </span>
                        ) : isMonthlyMet === false ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-600 text-white">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Bulan Ini: Perlu</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Bln: -</span>
                        )}

                        {/* Annual Status */}
                        {isAnnualMet === true ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-300">
                            <span>Tahunan: Tercapai</span>
                          </span>
                        ) : isAnnualMet === false ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            <span>Tahunan: Belum</span>
                          </span>
                        ) : null}
                      </div>
                    </td>

                    {/* Column 9: ANALISIS & TINDAK LANJUT */}
                    <td className="py-3 px-4 text-xs">
                      {isMonthlyMet === true ? (
                        <div>
                          <span className="text-emerald-700 font-medium block">
                            &bull; Capaian bulan {monthName} memenuhi target nasional ({summary.targetLabel}).
                          </span>
                          {hasAnnualData && annInd?.annualAvgPercent !== null && (
                            <span className="text-teal-700 text-[11px] block mt-0.5">
                              Rata-rata tahunan {record.year}: <strong>{annInd.annualAvgPercent.toFixed(2)}%</strong>
                            </span>
                          )}
                        </div>
                      ) : isMonthlyMet === false ? (
                        <div>
                          <span className="text-rose-800 font-bold block">
                            &bull; Gap di luar batas: {gap !== null ? `${Math.abs(gap).toFixed(2)}%` : '-'}
                          </span>
                          <span className="text-rose-700 text-[11px] block mt-0.5 font-medium">
                            Perlu intervensi & audit berkala pada unit pelayanan terkait.
                          </span>
                          {hasAnnualData && annInd?.annualAvgPercent !== null && (
                            <span className="text-slate-600 text-[10px] block mt-1">
                              Akumulasi Tahunan: <strong>{annInd.annualAvgPercent.toFixed(2)}%</strong> ({annInd.isMetAnnual ? 'Tercapai' : 'Belum Tercapai'})
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">
                          Data belum diinput di lembar kerja.
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* DEDICATED SECTION: TABEL MATRIKS REKAPITULASI 12 BULAN & RATA-RATA TAHUNAN */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-teal-900 via-slate-800 to-slate-900 text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm md:text-base">
                MATRIKS REKAPITULASI BULANAN & RATA-RATA TAHUNAN (TAHUN {record.year})
              </h4>
              <p className="text-xs text-teal-200 mt-0.5">
                Rincian capaian setiap bulan (Januari s/d Desember) dan akumulasi Rata-Rata Pertahun untuk ke-13 indikator.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAnnualMatrix(!showAnnualMatrix)}
            className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg border border-white/20 transition-colors cursor-pointer shrink-0"
          >
            {showAnnualMatrix ? 'Sembunyikan Matriks' : 'Buka Matriks 12 Bulan'}
          </button>
        </div>

        {showAnnualMatrix && (
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 font-sans">
                  <th className="py-2.5 px-2 text-center w-8 border-r border-slate-300">NO</th>
                  <th className="py-2.5 px-3 min-w-[220px] border-r border-slate-300">INDIKATOR MUTU</th>
                  <th className="py-2.5 px-2 text-center w-20 border-r border-slate-300 bg-slate-200/60">TARGET</th>
                  {MONTH_NAMES.map((m, idx) => (
                    <th
                      key={m}
                      className={`py-2 px-1 text-center w-14 border-r border-slate-300 font-mono text-[11px] ${
                        idx + 1 === record.month ? 'bg-emerald-100 text-emerald-950 font-black' : ''
                      }`}
                    >
                      {m.substring(0, 3).toUpperCase()}
                    </th>
                  ))}
                  <th className="py-2.5 px-3 text-center w-36 bg-teal-100 text-teal-950 font-black border-r border-slate-300">
                    RATA-RATA TAHUNAN ({record.year})
                  </th>
                  <th className="py-2.5 px-2 text-center w-28 bg-slate-100 font-bold">
                    STATUS TAHUNAN
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                {annualSummary.indicators.map((ind) => {
                  const hasAnnual = ind.annualAvgPercent !== null;

                  return (
                    <tr key={ind.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-2 text-center font-bold text-slate-800 border-r border-slate-200 font-sans">
                        {ind.id}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-sans font-semibold text-slate-900">
                        {ind.title}
                      </td>
                      <td className="py-2 px-2 text-center border-r border-slate-200 bg-slate-50 text-slate-700 font-bold">
                        {ind.targetLabel}
                      </td>
                      {ind.monthlyPercents.map((pct, idx) => {
                        const isCurrentMonth = idx + 1 === record.month;
                        const metMonth = pct !== null ? isTargetMet(pct, ind.targetOperator, ind.targetValue) : null;

                        return (
                          <td
                            key={idx}
                            className={`py-2 px-1 text-right border-r border-slate-200 pr-2 ${
                              isCurrentMonth ? 'font-bold bg-emerald-50/60' : ''
                            } ${
                              metMonth === false
                                ? 'text-rose-600 bg-rose-50/40'
                                : metMonth === true
                                ? 'text-emerald-700'
                                : 'text-slate-400'
                            }`}
                          >
                            {pct !== null ? `${pct.toFixed(1)}%` : '-'}
                          </td>
                        );
                      })}
                      <td className="py-2 px-3 text-center border-r border-slate-200 bg-teal-50/70 font-bold text-xs text-teal-950 font-mono">
                        {hasAnnual && ind.annualAvgPercent !== null ? (
                          <span
                            className={`px-2 py-0.5 rounded-md font-extrabold ${
                              ind.isMetAnnual ? 'bg-teal-600 text-white' : 'bg-amber-600 text-white'
                            }`}
                          >
                            {ind.annualAvgPercent.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal italic">-</span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-center font-sans text-[11px] font-bold">
                        {ind.isMetAnnual === true ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            TERCAPAI
                          </span>
                        ) : ind.isMetAnnual === false ? (
                          <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            PERINGATAN
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">BELUM LENGKAP</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Optional Accordion: Tampilkan Rincian Per Unit (Sebagai Data Dukung / Lampiran) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <TableProperties className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                Lampiran Rincian Data Per Unit (IRNA, RAJAL, LAB, RAD, GIZI, IGD, BDRS, OK, FARM)
              </h4>
              <p className="text-[11px] text-slate-500">
                Laporan Mutu Nasional di atas menampilkan nilai rata-rata tiap indikator. Buka panel ini jika ingin melihat rincian per unit untuk bulan berjalan.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowUnitBreakdown(!showUnitBreakdown)}
            className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          >
            {showUnitBreakdown ? 'Sembunyikan Rincian Unit' : 'Tampilkan Rincian Unit'}
          </button>
        </div>

        {/* Collapsible matrix breakdown */}
        {showUnitBreakdown && (
          <div className="mt-4 pt-4 border-t border-slate-200 overflow-x-auto">
            <table className="w-full text-left border-collapse text-[11px] font-mono">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 font-sans">
                  <th className="py-2 px-2 text-center w-8 border-r border-slate-300">NO</th>
                  <th className="py-2 px-3 min-w-[200px] border-r border-slate-300">INDIKATOR</th>
                  <th className="py-2 px-1 text-center w-7 border-r border-slate-300">TIPE</th>
                  {UNITS.map((u) => (
                    <th key={u.code} className="py-2 px-1 text-center w-14 border-r border-slate-300 font-bold">
                      {u.code}
                    </th>
                  ))}
                  <th className="py-2 px-2 text-center w-20 bg-emerald-100 text-emerald-950 font-bold">
                    RATA-RATA
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {summaries.map((summary) => (
                  <tr key={summary.id} className="hover:bg-slate-50">
                    <td className="py-1.5 px-2 text-center font-bold text-slate-800 border-r border-slate-200 font-sans">
                      {summary.id}
                    </td>
                    <td className="py-1.5 px-3 border-r border-slate-200 font-sans font-medium text-slate-900 truncate max-w-[220px]">
                      {summary.title}
                    </td>
                    <td className="py-1 px-1 text-center font-bold border-r border-slate-200 text-slate-600 bg-slate-50">
                      %
                    </td>
                    {UNITS.map((u) => {
                      const val = summary.unitValues[u.code]?.percent;
                      return (
                        <td key={u.code} className="py-1 px-1 text-right border-r border-slate-200 pr-2">
                          {val !== null && val !== undefined ? `${val.toFixed(2)}%` : '-'}
                        </td>
                      );
                    })}
                    <td className="py-1 px-2 text-right bg-emerald-50 font-bold text-emerald-950 pr-2">
                      {summary.avgPercent !== null ? `${summary.avgPercent.toFixed(2)}%` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Official Signatures Block for Reporting */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="text-center pb-4 border-b border-slate-100">
          <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
            Lembar Pengesahan Laporan Rekapitulasi Mutu Nasional
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            {hospital.city}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6 max-w-2xl mx-auto text-center">
          <div>
            <p className="text-xs text-slate-500 mb-16">
              Mengetahui,<br />
              <strong>Ketua Komite Mutu & Keselamatan Pasien</strong>
            </p>
            <p className="text-xs font-bold text-slate-900 underline">{hospital.leadQualityName}</p>
            <p className="text-[11px] text-slate-500">NIP. {hospital.leadQualityNip}</p>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-16">
              Menyetujui,<br />
              <strong>Direktur Rumah Sakit</strong>
            </p>
            <p className="text-xs font-bold text-slate-900 underline">{hospital.directorName}</p>
            <p className="text-[11px] text-slate-500">NIP. {hospital.directorNip}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
