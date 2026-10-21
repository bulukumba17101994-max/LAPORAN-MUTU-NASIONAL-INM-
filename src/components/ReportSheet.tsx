import React, { useState } from 'react';
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
  ChevronUp
} from 'lucide-react';
import { INDICATORS, MONTH_NAMES, UNITS } from '../data/inmConfig';
import { HospitalConfig, MonthlyRecord, ThresholdAlert } from '../types/inm';
import {
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
  onExportExcel: () => void;
  onExportCSV: () => void;
  onPrint: () => void;
  onNavigateToInput: () => void;
}

export const ReportSheet: React.FC<ReportSheetProps> = ({
  record,
  hospital,
  onExportExcel,
  onExportCSV,
  onPrint,
  onNavigateToInput,
}) => {
  const [showUnitBreakdown, setShowUnitBreakdown] = useState<boolean>(false);
  const [filterThreshold, setFilterThreshold] = useState<'all' | 'alertsOnly'>('all');
  const [showAlertDetails, setShowAlertDetails] = useState<boolean>(true);

  const monthName = MONTH_NAMES[record.month - 1];

  const summaries = computeMonthlySummaries(record);
  const stats = computeOverallStats(summaries);
  const alerts: ThresholdAlert[] = getThresholdAlerts(summaries);

  // Filter indicators if user selected alertsOnly
  const displayedSummaries = summaries.filter((s) => {
    if (filterThreshold === 'alertsOnly') {
      return s.isMetAverage === false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner: Auto-Sync Notification */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Otomatis Terhubung ke Lembar Kerja</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight">
              LAPORAN MUTU NASIONAL (INM)
            </h2>
            <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-3xl leading-relaxed">
              Nilai <span className="text-emerald-300 font-bold">RATA-RATA</span> hasil penginputan pada Lembar Kerja otomatis dipindahkan ke laporan ini.
              Dilengkapi <span className="text-amber-300 font-bold underline decoration-amber-400">sistem peringatan ambang batas</span> dan{' '}
              <span className="text-teal-300 font-bold underline decoration-teal-400">grafik visualisasi mutu</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onExportExcel}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition-all cursor-pointer shadow-md"
            >
              <Download className="w-4 h-4 text-emerald-700" />
              <span>Unduh Rekap Excel</span>
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
            <span>Periode: <strong className="text-emerald-300">{monthName} {record.year}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Nilai rata-rata indikator terhitung otomatis</span>
          </div>
        </div>
      </div>

      {/* SISTEM PERINGATAN (WARNING NOTIFICATION SYSTEM) */}
      {alerts.length > 0 ? (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-600/30 animate-pulse">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-rose-950 uppercase tracking-tight">
                    Sistem Peringatan Mutu: {alerts.length} Indikator Berada di Luar Ambang Batas!
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-600 text-white">
                    PERINGATAN
                  </span>
                </div>
                <p className="text-xs text-rose-800 mt-0.5">
                  Rata-rata data bulanan pada indikator berikut belum mencapai standar nasional Kemenkes RI.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAlertDetails(!showAlertDetails)}
                className="px-3 py-1.5 text-xs font-bold text-rose-900 bg-white hover:bg-rose-100 rounded-lg border border-rose-300 transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>{showAlertDetails ? 'Sembunyikan Rincian' : 'Lihat Rincian'}</span>
                {showAlertDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {showAlertDetails && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {alerts.map((alert) => (
                <div
                  key={alert.indicatorId}
                  className="bg-white rounded-xl p-3.5 border border-rose-200 shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-bold text-xs text-slate-900 line-clamp-1">
                        INM-{alert.indicatorId < 10 ? `0${alert.indicatorId}` : alert.indicatorId}: {alert.indicatorTitle}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 shrink-0">
                        Gap -{alert.gap.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs py-1 px-2 bg-slate-50 rounded-lg font-mono mb-2">
                      <span className="text-slate-500">Target: <strong className="text-slate-800">{alert.targetLabel}</strong></span>
                      <span className="text-slate-500">Capaian: <strong className="text-rose-600">{alert.currentValue.toFixed(2)}%</strong></span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      <strong className="text-rose-700">Rekomendasi:</strong> {alert.recommendation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs text-emerald-950">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm">Semua Indikator Terisi Memenuhi Ambang Batas Target Nasional</p>
              <p className="text-emerald-800 text-[11px]">
                Seluruh nilai rata-rata mutu pelayanan rumah sakit periode {monthName} {record.year} telah memenuhi standar Kemenkes.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-bold shrink-0">
            Kepatuhan 100%
          </span>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <p className="text-xs text-slate-500 font-medium">Total Indikator Nasional</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900">13</span>
            <span className="text-xs text-slate-400">Indikator Kemenkes</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {stats.totalWithData} indikator telah memiliki data
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-emerald-200 p-4 shadow-2xs bg-emerald-50/30">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-emerald-800 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Standar Tercapai
            </p>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              {stats.totalWithData > 0 ? `${((stats.totalMet / stats.totalWithData) * 100).toFixed(0)}%` : '0%'}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-700">{stats.totalMet}</span>
            <span className="text-xs font-semibold text-emerald-600">dari {stats.totalWithData} indikator</span>
          </div>
          <p className="text-[11px] text-emerald-600/90 mt-1">
            Memenuhi batas standar nasional
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-rose-200 p-4 shadow-2xs bg-rose-50/30">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-rose-800 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              Belum Tercapai
            </p>
            <span className="text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
              Peringatan
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

        <div className="bg-white rounded-2xl border border-teal-200 p-4 shadow-2xs bg-teal-50/30">
          <p className="text-xs font-semibold text-teal-800 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
            Kepatuhan Mutu Rumah Sakit
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-teal-800">
              {stats.complianceRate.toFixed(1)}%
            </span>
            <span className="text-xs text-teal-600 font-semibold">Tingkat Capaian</span>
          </div>
          <div className="w-full bg-teal-200/70 h-2 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-teal-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.complianceRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* VISUALISASI DATA: GRAFIK RATA-RATA BULANAN (BAR & LINE) */}
      <ReportChart summaries={summaries} monthName={monthName} year={record.year} />

      {/* Main Table: REKAPITULASI NILAI RATA-RATA SETIAP INDIKATOR MUTU (DILENGKAPI SOROTAN PERINGATAN) */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden">
        {/* Table Title Bar & Filter Options */}
        <div className="bg-slate-100/90 px-6 py-4 border-b border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-sm md:text-base">
                TABEL REKAPITULASI NILAI RATA-RATA INDIKATOR NASIONAL MUTU (INM)
              </h3>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                Rekap Nilai RS
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Sel dengan latar belakang <span className="text-rose-700 font-bold">merah muda</span> disorot otomatis karena berada di luar ambang batas standar.
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

        {/* The Core Consolidated Average Table with Alert Highlighting */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-200/90 text-slate-900 font-bold border-b-2 border-slate-300 font-sans">
                <th className="py-3 px-3 w-12 text-center border-r border-slate-300">NO.</th>
                <th className="py-3 px-4 min-w-[300px] border-r border-slate-300">
                  INDIKATOR NASIONAL MUTU
                </th>
                <th className="py-3 px-3 w-28 text-center border-r border-slate-300 bg-slate-100">
                  STANDAR / TARGET
                </th>
                <th className="py-3 px-3 w-32 text-center border-r border-slate-300">
                  RATA-RATA NUMERATOR (N)
                </th>
                <th className="py-3 px-3 w-32 text-center border-r border-slate-300">
                  RATA-RATA DENOMINATOR (D)
                </th>
                <th className="py-3 px-4 w-44 text-center border-r border-slate-300 bg-emerald-100/70 text-emerald-950 font-black">
                  NILAI RATA-RATA CAPAIAN MUTU (%)
                </th>
                <th className="py-3 px-3 w-36 text-center border-r border-slate-300">
                  STATUS CAPAIAN
                </th>
                <th className="py-3 px-4 min-w-[200px]">
                  ANALISIS & TINDAK LANJUT
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {displayedSummaries.map((summary) => {
                const ind = INDICATORS.find((i) => i.id === summary.id)!;
                const hasData = summary.avgPercent !== null;
                const isMet = summary.isMetAverage;
                const isBreached = isMet === false;
                const gap =
                  hasData && summary.avgPercent !== null
                    ? ind.targetOperator === '<'
                      ? summary.avgPercent - summary.targetValue
                      : summary.targetValue - summary.avgPercent
                    : null;

                return (
                  <tr
                    key={summary.id}
                    className={`transition-colors ${
                      isBreached
                        ? 'bg-rose-50/70 hover:bg-rose-100/60 ring-1 ring-inset ring-rose-200'
                        : isMet === true
                        ? 'bg-white hover:bg-slate-50'
                        : 'bg-slate-50/40 hover:bg-slate-100/50'
                    }`}
                  >
                    {/* Column 1: NO */}
                    <td className="py-3 px-3 text-center font-bold text-slate-800 border-r border-slate-200">
                      <span
                        className={`w-6 h-6 rounded-full inline-flex items-center justify-center font-bold text-xs ${
                          isBreached
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
                        {isBreached && (
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

                    {/* Column 4: RATA-RATA N */}
                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800 border-r border-slate-200 pr-4">
                      {summary.type === 'PERCENT_ONLY' ? (
                        <span className="text-slate-400 font-sans italic text-[11px]">Survei Indeks</span>
                      ) : summary.avgNumerator !== null ? (
                        formatNumber(summary.avgNumerator, 2)
                      ) : (
                        <span className="text-slate-400 font-normal">-</span>
                      )}
                    </td>

                    {/* Column 5: RATA-RATA D */}
                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800 border-r border-slate-200 pr-4">
                      {summary.type === 'PERCENT_ONLY' ? (
                        <span className="text-slate-400 font-sans italic text-[11px]">Responden</span>
                      ) : summary.avgDenominator !== null ? (
                        formatNumber(summary.avgDenominator, 2)
                      ) : (
                        <span className="text-slate-400 font-normal">-</span>
                      )}
                    </td>

                    {/* Column 6: NILAI RATA-RATA CAPAIAN MUTU (%) - HIGHLIGHTED WHEN BREACHED */}
                    <td
                      className={`py-3 px-4 border-r border-slate-200 text-center transition-all ${
                        isBreached
                          ? 'bg-rose-100/80 ring-2 ring-inset ring-rose-400'
                          : 'bg-emerald-50/40'
                      }`}
                    >
                      {hasData && summary.avgPercent !== null ? (
                        <div className="flex flex-col items-center">
                          <span
                            className={`text-sm font-extrabold font-mono px-3 py-1 rounded-lg ${
                              isMet === true
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-rose-600 text-white shadow-xs animate-pulse'
                            }`}
                          >
                            {summary.avgPercent.toFixed(2)}%
                          </span>
                          {/* Mini Progress Bar */}
                          <div className="w-24 bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isMet === true ? 'bg-emerald-600' : 'bg-rose-600'
                              }`}
                              style={{ width: `${Math.min(100, summary.avgPercent)}%` }}
                            ></div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Belum Ada Data</span>
                      )}
                    </td>

                    {/* Column 7: STATUS CAPAIAN */}
                    <td className="py-3 px-3 text-center border-r border-slate-200">
                      {isMet === true ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <Check className="w-3.5 h-3.5" />
                          <span>TERCAPAI</span>
                        </span>
                      ) : isMet === false ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-600 text-white border border-rose-700 shadow-2xs">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>PERINGATAN</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500">
                          <span>Belum Diisi</span>
                        </span>
                      )}
                    </td>

                    {/* Column 8: ANALISIS & TINDAK LANJUT */}
                    <td className="py-3 px-4 text-xs">
                      {isMet === true ? (
                        <span className="text-emerald-700 font-medium">
                          &bull; Capaian di atas target nasional. Pertahankan kepatuhan pelayanan.
                        </span>
                      ) : isMet === false ? (
                        <div>
                          <span className="text-rose-800 font-bold block">
                            &bull; Gap di luar ambang batas: {gap !== null ? `${Math.abs(gap).toFixed(2)}%` : '-'}
                          </span>
                          <span className="text-rose-700 text-[11px] block mt-0.5 font-medium">
                            Perlu intervensi & audit berkala pada unit pelayanan terkait.
                          </span>
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
                Laporan Mutu Nasional di atas menampilkan nilai rata-rata tiap indikator. Buka panel ini jika ingin melihat rincian per unit.
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
