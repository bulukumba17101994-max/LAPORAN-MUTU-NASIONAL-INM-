import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { InputSheet } from './components/InputSheet';
import { ReportSheet } from './components/ReportSheet';
import { AnalyticsView } from './components/AnalyticsView';
import { PrintReportModal } from './components/PrintReportModal';
import { HospitalSettingsModal } from './components/HospitalSettingsModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { DEFAULT_HOSPITAL_CONFIG, createEmptyRecord, MONTH_NAMES } from './data/inmConfig';
import { HospitalConfig, MonthlyRecord, UnitCode } from './types/inm';
import { exportToCSV, exportToExcel, parseImportFile } from './utils/exportExcel';
import { AlertCircle, CheckCircle, Info, Sparkles } from 'lucide-react';

const STORAGE_KEY_PREFIX = 'inm_record_';
const HOSPITAL_STORAGE_KEY = 'inm_hospital_config';

/**
 * Checks if a monthly record has any data entered by the user
 */
function isRecordEmpty(record: MonthlyRecord): boolean {
  if (!record || !record.data) return true;
  for (const indId in record.data) {
    const unitMap = record.data[indId];
    if (!unitMap) continue;
    for (const u in unitMap) {
      const cell = unitMap[u as UnitCode];
      if (cell && (cell.numerator != null || cell.denominator != null || cell.percent != null)) {
        return false;
      }
    }
  }
  return true;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'input' | 'report' | 'analytics'>('input');
  const [selectedMonth, setSelectedMonth] = useState<number>(1); // 1 = Januari
  const [selectedYear, setSelectedYear] = useState<number>(2025);

  const [hospital, setHospital] = useState<HospitalConfig>(() => {
    try {
      const saved = localStorage.getItem(HOSPITAL_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_HOSPITAL_CONFIG;
  });

  // Current active monthly record - clean and real-time safe
  const [currentRecord, setCurrentRecord] = useState<MonthlyRecord>(() => {
    try {
      const key = `${STORAGE_KEY_PREFIX}${2025}_${1}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Clear any remnants of old mock sample data permanently
        if (parsed?.data?.[1]?.IRNA?.numerator === 1220 || parsed?.data?.[4]?.OK?.numerator === 24) {
          const fresh = createEmptyRecord(1, 2025);
          localStorage.setItem(key, JSON.stringify(fresh));
          return fresh;
        }
        return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return createEmptyRecord(1, 2025);
  });

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Show notification briefly
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 3500);
  };

  // Load record when month or year changes
  useEffect(() => {
    const key = `${STORAGE_KEY_PREFIX}${selectedYear}_${selectedMonth}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure old sample numbers are cleared if encountered
        if (parsed?.data?.[1]?.IRNA?.numerator === 1220 || parsed?.data?.[4]?.OK?.numerator === 24) {
          const fresh = createEmptyRecord(selectedMonth, selectedYear);
          localStorage.setItem(key, JSON.stringify(fresh));
          setCurrentRecord(fresh);
        } else {
          setCurrentRecord(parsed);
        }
      } else {
        // Initialize pristine empty record
        setCurrentRecord(createEmptyRecord(selectedMonth, selectedYear));
      }
    } catch (e) {
      console.error(e);
    }
  }, [selectedMonth, selectedYear]);

  // Save current record to localStorage real-time
  const handleUpdateRecord = (updatedRecord: MonthlyRecord) => {
    setCurrentRecord(updatedRecord);
    try {
      const key = `${STORAGE_KEY_PREFIX}${updatedRecord.year}_${updatedRecord.month}`;
      localStorage.setItem(key, JSON.stringify(updatedRecord));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  };

  // Save hospital configuration
  const handleSaveHospital = (newConfig: HospitalConfig) => {
    setHospital(newConfig);
    try {
      localStorage.setItem(HOSPITAL_STORAGE_KEY, JSON.stringify(newConfig));
      showToast('Data identitas rumah sakit berhasil diperbarui!');
    } catch (e) {
      console.error(e);
    }
  };

  // Delete handlers
  const handleDeleteCurrentMonth = () => {
    const key = `${STORAGE_KEY_PREFIX}${selectedYear}_${selectedMonth}`;
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(e);
    }
    const emptyRecord = createEmptyRecord(selectedMonth, selectedYear);
    setCurrentRecord(emptyRecord);
    showToast(`Data bulan ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear} telah berhasil dikosongkan.`, 'info');
  };

  const handleDeleteAllData = () => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.error(e);
    }
    const emptyRecord = createEmptyRecord(selectedMonth, selectedYear);
    setCurrentRecord(emptyRecord);
    showToast('Seluruh data indikator mutu di semua periode berhasil dihapus secara permanen.', 'info');
  };

  // Backup all data to JSON
  const handleBackupData = () => {
    try {
      const allRecords: Record<string, MonthlyRecord> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
          try {
            const val = localStorage.getItem(key);
            if (val) allRecords[key] = JSON.parse(val);
          } catch (err) {
            console.error(err);
          }
        }
      }

      // Also ensure current record is included
      const currentKey = `${STORAGE_KEY_PREFIX}${selectedYear}_${selectedMonth}`;
      allRecords[currentKey] = currentRecord;

      const backupPayload = {
        appName: 'Sistem Informasi Indikator Mutu Nasional (INM)',
        exportedAt: new Date().toISOString(),
        hospital,
        records: allRecords,
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupPayload, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `cadangan_data_inm_${selectedYear}_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showToast('Cadangan seluruh data berhasil diunduh ke berkas JSON!');
    } catch (e) {
      console.error(e);
      showToast('Gagal membuat berkas cadangan data.', 'error');
    }
  };

  // Export handlers
  const handleExportExcel = () => {
    try {
      exportToExcel(currentRecord, hospital);
      showToast('Laporan berhasil diekspor ke format Excel (.xlsx)!');
    } catch (err) {
      console.error(err);
      showToast('Gagal mengekspor ke Excel', 'error');
    }
  };

  const handleExportCSV = () => {
    try {
      exportToCSV(currentRecord);
      showToast('Laporan berhasil diekspor ke format CSV!');
    } catch (err) {
      console.error(err);
      showToast('Gagal mengekspor ke CSV', 'error');
    }
  };

  // Import handler
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // If it's a JSON backup
      if (file.name.endsWith('.json')) {
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (parsed.records) {
          Object.entries(parsed.records).forEach(([k, rec]) => {
            localStorage.setItem(k, JSON.stringify(rec));
          });
          if (parsed.hospital) {
            handleSaveHospital(parsed.hospital);
          }
          const currentKey = `${STORAGE_KEY_PREFIX}${selectedYear}_${selectedMonth}`;
          if (parsed.records[currentKey]) {
            setCurrentRecord(parsed.records[currentKey]);
          }
          showToast(`Berkas cadangan "${file.name}" berhasil dipulihkan!`);
          return;
        }
      }

      // If it's an Excel or CSV file
      const mergedRecord = await parseImportFile(file, currentRecord);
      handleUpdateRecord(mergedRecord);
      showToast(`Data dari file "${file.name}" berhasil diimpor ke bulan ${MONTH_NAMES[selectedMonth - 1]}!`);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Gagal membaca format file yang diunggah.', 'error');
    } finally {
      e.target.value = '';
    }
  };

  // Copy data from previous month helper
  const handleCopyFromPreviousMonth = () => {
    const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
    const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
    const prevKey = `${STORAGE_KEY_PREFIX}${prevYear}_${prevMonth}`;
    try {
      const prevDataStr = localStorage.getItem(prevKey);
      if (!prevDataStr) {
        showToast(`Tidak ditemukan data pada bulan ${MONTH_NAMES[prevMonth - 1]} ${prevYear}.`, 'info');
        return;
      }
      const prevRecord: MonthlyRecord = JSON.parse(prevDataStr);
      const cloned = {
        month: selectedMonth,
        year: selectedYear,
        data: JSON.parse(JSON.stringify(prevRecord.data)),
        lastUpdated: new Date().toISOString(),
      };
      handleUpdateRecord(cloned);
      showToast(`Berhasil menyalin data dari ${MONTH_NAMES[prevMonth - 1]} ${prevYear}!`);
    } catch (e) {
      console.error(e);
      showToast('Gagal menyalin data', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold text-white transition-all animate-bounce bg-slate-900 border border-slate-700">
          {notification.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
          {notification.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
          {notification.type === 'info' && <Info className="w-4 h-4 text-cyan-400" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Main Header with Navigation and Period Selector */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onMonthChange={setSelectedMonth}
        onYearChange={setSelectedYear}
        hospital={hospital}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onExportExcel={handleExportExcel}
        onExportCSV={handleExportCSV}
        onPrint={() => setIsPrintModalOpen(true)}
        onOpenDeleteModal={() => setIsDeleteModalOpen(true)}
        onBackupData={handleBackupData}
        onImportFile={handleImportFile}
        isSaved={true}
      />

      {/* Main Content Body */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1">
        {/* Empty month notification if no data yet */}
        {isRecordEmpty(currentRecord) && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-emerald-700 shrink-0" />
              <div>
                <p className="font-bold">Bulan {MONTH_NAMES[selectedMonth - 1]} {selectedYear} siap untuk penginputan data</p>
                <p className="text-emerald-800">
                  Data Anda tersimpan secara real-time dan aman permanen di perangkat ini kecuali dihapus secara sengaja.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyFromPreviousMonth}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Salin dari Bulan Lalu
              </button>
            </div>
          </div>
        )}

        {/* Tab 1: Lembar Kerja (Sheet Penginputan Data & Rata-rata) */}
        {activeTab === 'input' && (
          <InputSheet
            record={currentRecord}
            onChangeRecord={handleUpdateRecord}
          />
        )}

        {/* Tab 2: Laporan Mutu Nasional (Rekap Bulanan) */}
        {activeTab === 'report' && (
          <ReportSheet
            record={currentRecord}
            hospital={hospital}
            onExportExcel={handleExportExcel}
            onExportCSV={handleExportCSV}
            onPrint={() => setIsPrintModalOpen(true)}
            onNavigateToInput={() => setActiveTab('input')}
          />
        )}

        {/* Tab 3: Grafik & Analisis Mutu */}
        {activeTab === 'analytics' && (
          <AnalyticsView record={currentRecord} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            &copy; {selectedYear} {hospital.name} &bull; Sistem Indikator Nasional Mutu Pelayanan Kesehatan (Permenkes No. 30 Tahun 2022)
          </p>
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Penyimpanan Real-Time Aktif & Aman</span>
          </div>
        </div>
      </footer>

      {/* Print Preview Modal */}
      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        record={currentRecord}
        hospital={hospital}
      />

      {/* Hospital Identity Settings Modal */}
      <HospitalSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        config={hospital}
        onSave={handleSaveHospital}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDeleteCurrentMonth={handleDeleteCurrentMonth}
        onDeleteAllData={handleDeleteAllData}
        monthName={MONTH_NAMES[selectedMonth - 1]}
        year={selectedYear}
      />
    </div>
  );
}
