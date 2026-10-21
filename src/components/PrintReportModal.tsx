import React from 'react';
import { X, Printer, Download, Building2 } from 'lucide-react';
import { INDICATORS, MONTH_NAMES, UNITS } from '../data/inmConfig';
import { HospitalConfig, MonthlyRecord } from '../types/inm';
import { computeMonthlySummaries, formatNumber } from '../utils/calculations';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: MonthlyRecord;
  hospital: HospitalConfig;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  record,
  hospital,
}) => {
  if (!isOpen) return null;

  const summaries = computeMonthlySummaries(record);
  const monthName = MONTH_NAMES[record.month - 1];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 print:max-w-none print:max-h-none print:shadow-none print:border-none print:rounded-none">
        {/* Modal Top Bar (Hidden in Print) */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between z-10 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-800 text-sm">
              Pratinjau Dokumen Cetak Rekapitulasi Mutu Nasional
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang (Ctrl + P)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas */}
        <div className="p-8 sm:p-12 print:p-4 text-slate-900 bg-white" id="printable-area">
          {/* Hospital Official Kop */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6 text-center relative">
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-slate-900">
              {hospital.name}
            </h1>
            <h2 className="text-sm sm:text-base font-bold text-slate-700 uppercase tracking-wide mt-0.5">
              {hospital.subTitle}
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              {hospital.address} &bull; Kota {hospital.city}
            </p>
            <div className="border-t border-slate-400 mt-2 pt-1 text-[11px] text-slate-500 flex justify-between">
              <span>Formulir: INM-KEMENKES-01</span>
              <span>Dokumen Standar Akreditasi Rumah Sakit</span>
            </div>
          </div>

          {/* Title & Period */}
          <div className="text-center my-6">
            <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-900">
              LAPORAN REKAPITULASI INDIKATOR NASIONAL MUTU (INM)
            </h3>
            <p className="text-xs font-semibold text-slate-700 mt-0.5">
              PERIODE PELAPORAN: BULAN {monthName.toUpperCase()} {record.year}
            </p>
          </div>

          {/* Official INM Table - Consolidated Averages */}
          <div className="overflow-x-auto my-4">
            <table className="w-full text-xs border-collapse border border-slate-400">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold font-sans">
                  <th className="border border-slate-400 py-2.5 px-2 text-center w-10">NO.</th>
                  <th className="border border-slate-400 py-2.5 px-3 text-left">INDIKATOR NASIONAL MUTU</th>
                  <th className="border border-slate-400 py-2.5 px-2 text-center w-28">STANDAR</th>
                  <th className="border border-slate-400 py-2.5 px-2 text-right w-28">RATA-RATA (N)</th>
                  <th className="border border-slate-400 py-2.5 px-2 text-right w-28">RATA-RATA (D)</th>
                  <th className="border border-slate-400 py-2.5 px-3 text-center w-36 bg-slate-200">
                    NILAI RATA-RATA (%)
                  </th>
                  <th className="border border-slate-400 py-2.5 px-2 text-center w-32">STATUS</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {summaries.map((summary) => {
                  const ind = INDICATORS.find((i) => i.id === summary.id)!;
                  const isMet = summary.isMetAverage;
                  const hasData = summary.avgPercent !== null;

                  return (
                    <tr key={summary.id} className="hover:bg-slate-50">
                      <td className="border border-slate-400 py-2 px-1 text-center font-bold font-sans">
                        {summary.id}
                      </td>
                      <td className="border border-slate-400 py-2 px-3 font-sans font-medium text-slate-900">
                        {summary.title}
                      </td>
                      <td className="border border-slate-400 py-2 px-2 text-center font-bold text-slate-800">
                        {summary.targetLabel}
                      </td>
                      <td className="border border-slate-400 py-2 px-2 text-right pr-3">
                        {summary.type === 'PERCENT_ONLY' ? '-' : summary.avgNumerator !== null ? formatNumber(summary.avgNumerator, 2) : '-'}
                      </td>
                      <td className="border border-slate-400 py-2 px-2 text-right pr-3">
                        {summary.type === 'PERCENT_ONLY' ? '-' : summary.avgDenominator !== null ? formatNumber(summary.avgDenominator, 2) : '-'}
                      </td>
                      <td className="border border-slate-400 py-2 px-3 text-center font-bold bg-slate-100 text-slate-900">
                        {hasData && summary.avgPercent !== null ? `${summary.avgPercent.toFixed(2)}%` : '-'}
                      </td>
                      <td className="border border-slate-400 py-2 px-2 text-center font-sans text-[11px] font-bold">
                        {isMet === true ? (
                          <span className="text-emerald-800">TERCAPAI</span>
                        ) : isMet === false ? (
                          <span className="text-rose-800">BELUM TERCAPAI</span>
                        ) : (
                          <span className="text-slate-400">BELUM ADA DATA</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Endorsement Signatures */}
          <div className="mt-8 pt-4 page-break-inside-avoid">
            <div className="text-right text-xs mb-6 font-sans">
              {hospital.city},{' '}
              {new Date().toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </div>

            <div className="grid grid-cols-2 gap-8 text-center text-xs font-sans">
              <div>
                <p className="text-slate-600 mb-20">
                  Mengetahui,<br />
                  <strong>Ketua Komite Mutu & Keselamatan Pasien</strong>
                </p>
                <p className="font-bold underline text-slate-900">{hospital.leadQualityName}</p>
                <p className="text-[11px] text-slate-500">NIP. {hospital.leadQualityNip}</p>
              </div>

              <div>
                <p className="text-slate-600 mb-20">
                  Menyetujui,<br />
                  <strong>Direktur Rumah Sakit</strong>
                </p>
                <p className="font-bold underline text-slate-900">{hospital.directorName}</p>
                <p className="text-[11px] text-slate-500">NIP. {hospital.directorNip}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
