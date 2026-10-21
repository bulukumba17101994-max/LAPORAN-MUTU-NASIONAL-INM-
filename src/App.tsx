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
import {
  subscribeToMonthlyRecord,
  subscribeToYearRecords,
  saveRecordToCloud,
  deleteRecordFromCloud,
  deleteAllRecordsFromCloud,
  subscribeToHospitalConfig,
  saveHospitalConfigToCloud,
  fetchAllCloudRecords
} from './services/firebase';
import { AlertCircle, CheckCircle, Info, Sparkles, Cloud } from 'lucide-react';

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
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
  const [yearRecords, setYearRecords] = useState<Record<number, MonthlyRecord>>({});

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
        // Clean any remnants of old mock sample data permanently
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

  // Subscribe to Hospital Config in Cloud Firestore (live sync across all devices)
  useEffect(() => {
    const unsub = subscribeToHospitalConfig(
      (cloudConfig) => {
        if (cloudConfig) {
          setHospital(cloudConfig);
          try {
            localStorage.setItem(HOSPITAL_STORAGE_KEY, JSON.stringify(cloudConfig));
          } catch (e) {
            console.error(e);
          }
        }
      },
      (err) => {
        console.warn('Hospital config live sync fallback to local:', err);
      }
    );
    return () => unsub();
  }, []);

  // Live real-time Cloud Firestore synchronization for monthly record
  useEffect(() => {
    const key = `${STORAGE_KEY_PREFIX}${selectedYear}_${selectedMonth}`;

    // 1. Fast load from local storage cache for immediate display
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.data?.[1]?.IRNA?.numerator === 1220 || parsed?.data?.[4]?.OK?.numerator === 24) {
          const fresh = createEmptyRecord(selectedMonth, selectedYear);
          localStorage.setItem(key, JSON.stringify(fresh));
          setCurrentRecord(fresh);
        } else {
          setCurrentRecord(parsed);
        }
      } else {
        setCurrentRecord(createEmptyRecord(selectedMonth, selectedYear));
      }
    } catch (e) {
      console.error(e);
      setCurrentRecord(createEmptyRecord(selectedMonth, selectedYear));
    }

    // 2. Real-time Cloud listener (sync across any device/browser anywhere)
    const unsub = subscribeToMonthlyRecord(
      selectedYear,
      selectedMonth,
      (cloudRecord) => {
        if (cloudRecord) {
          setCurrentRecord(cloudRecord);
          try {
            localStorage.setItem(key, JSON.stringify(cloudRecord));
          } catch (e) {
            console.error(e);
          }
          setSyncStatus('synced');
        } else {
          // Record doesn't exist on Cloud yet; if local cache has meaningful data, push to Cloud
          try {
            const local = localStorage.getItem(key);
            if (local) {
              const parsed = JSON.parse(local);
              if (!isRecordEmpty(parsed)) {
                saveRecordToCloud(parsed).catch(console.error);
              }
            }
          } catch (e) {
            console.error(e);
          }
          setSyncStatus('synced');
        }
      },
      (err) => {
        console.warn('Real-time cloud listener offline:', err);
        setSyncStatus('offline');
      }
    );

    return () => unsub();
  }, [selectedMonth, selectedYear]);

  // Live real-time Cloud Firestore synchronization for all 12 months of selectedYear
  useEffect(() => {
    // 1. Initial fast load from localStorage cache
    const initialYearMap: Record<number, MonthlyRecord> = {};
    for (let m = 1; m <= 12; m++) {
      const k = `${STORAGE_KEY_PREFIX}${selectedYear}_${m}`;
      const local = localStorage.getItem(k);
      if (local) {
        try {
          const parsed = JSON.parse(local);
          if (!isRecordEmpty(parsed)) {
            initialYearMap[m] = parsed;
          }
        } catch (e) {}
      }
    }
    if (!isRecordEmpty(currentRecord) && currentRecord.year === selectedYear) {
      initialYearMap[currentRecord.month] = currentRecord;
    }
    setYearRecords(initialYearMap);

    // 2. Real-time subscription to all records of selectedYear from Cloud Firestore
    const unsub = subscribeToYearRecords(
      selectedYear,
      (cloudRecords) => {
        setYearRecords((prev) => ({
          ...prev,
          ...cloudRecords,
        }));
      },
      (err) => {
        console.warn('Real-time year records listener offline:', err);
      }
    );

    return () => unsub();
  }, [selectedYear]);

  // Real-time Update: updates local state, localStorage cache, and Cloud Firestore simultaneously
  const handleUpdateRecord = async (updatedRecord: MonthlyRecord) => {
    // 1. Immediate UI update
    setCurrentRecord(updatedRecord);
    if (updatedRecord.year === selectedYear) {
      setYearRecords((prev) => ({
        ...prev,
        [updatedRecord.month]: updatedRecord,
      }));
    }

    // 2. Immediate Local Storage cache
    const key = `${STORAGE_KEY_PREFIX}${updatedRecord.year}_${updatedRecord.month}`;
    try {
      localStorage.setItem(key, JSON.stringify(updatedRecord));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }

    // 3. Real-time Cloud Firestore push (accessible anywhere)
    setSyncStatus('syncing');
    try {
      await saveRecordToCloud(updatedRecord);
      setSyncStatus('synced');
    } catch (err) {
      console.error('Failed to push to Cloud Firestore:', err);
      setSyncStatus('offline');
    }
  };

  // Save hospital configuration locally and to Cloud
  const handleSaveHospital = async (newConfig: HospitalConfig) => {
    setHospital(newConfig);
    try {
      localStorage.setItem(HOSPITAL_STORAGE_KEY, JSON.stringify(newConfig));
    } catch (e) {
      console.error(e);
    }

    try {
      await saveHospitalConfigToCloud(newConfig);
      showToast('Data identitas rumah sakit berhasil disinkronkan ke Cloud & Lokal!');
    } catch (e) {
      console.error('Error saving hospital config to cloud:', e);
      showToast('Data tersimpan di perangkat lokal (menunggu koneksi cloud)', 'info');
    }
  };

  // Delete handlers (Cloud & Local)
  const handleDeleteCurrentMonth = async () => {
    const key = `${STORAGE_KEY_PREFIX}${selectedYear}_${selectedMonth}`;
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(e);
    }
    const emptyRecord = createEmptyRecord(selectedMonth, selectedYear);
    setCurrentRecord(emptyRecord);
    setYearRecords((prev) => {
      const next = { ...prev };
      delete next[selectedMonth];
      return next;
    });

    try {
      await deleteRecordFromCloud(selectedYear, selectedMonth);
      showToast(`Data bulan ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear} telah berhasil dikosongkan dari Cloud & Lokal.`, 'info');
    } catch (err) {
      console.error(err);
      showToast(`Data bulan telah dikosongkan di perangkat lokal.`, 'info');
    }
  };

  const handleDeleteAllData = async () => {
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
    setYearRecords({});

    try {
      await deleteAllRecordsFromCloud();
      showToast('Seluruh data indikator mutu di semua periode berhasil dihapus permanen dari Cloud & Lokal.', 'info');
    } catch (err) {
      console.error(err);
      showToast('Seluruh data di perangkat lokal berhasil dikosongkan.', 'info');
    }
  };

  // Backup all data to JSON (incorporating both Cloud & local cache)
  const handleBackupData = async () => {
    try {
      // 1. Fetch from cloud
      let allRecords: Record<string, MonthlyRecord> = {};
      try {
        allRecords = await fetchAllCloudRecords();
      } catch (err) {
        console.warn('Could not fetch cloud records for backup, using local cache:', err);
      }

      // 2. Merge local records
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
          try {
            const val = localStorage.getItem(key);
            if (val) {
              const parsed = JSON.parse(val);
              const cloudKey = `${parsed.year}_${parsed.month}`;
              if (!allRecords[cloudKey]) {
                allRecords[cloudKey] = parsed;
              }
            }
          } catch (err) {
            console.error(err);
          }
        }
      }

      // Also ensure current record is included
      const currentKey = `${selectedYear}_${selectedMonth}`;
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
      exportToExcel(currentRecord, hospital, yearRecords);
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
          for (const [k, rec] of Object.entries(parsed.records)) {
            const monthlyRec = rec as MonthlyRecord;
            localStorage.setItem(`${STORAGE_KEY_PREFIX}${monthlyRec.year}_${monthlyRec.month}`, JSON.stringify(monthlyRec));
            // Sync to cloud
            saveRecordToCloud(monthlyRec).catch(console.error);
          }
          if (parsed.hospital) {
            handleSaveHospital(parsed.hospital);
          }
          const currentKey = `${selectedYear}_${selectedMonth}`;
          if (parsed.records[currentKey]) {
            setCurrentRecord(parsed.records[currentKey] as MonthlyRecord);
          }
          showToast(`Berkas cadangan "${file.name}" berhasil dipulihkan & disinkronkan ke Cloud!`);
          return;
        }
      }

      // If it's an Excel or CSV file
      const mergedRecord = await parseImportFile(file, currentRecord);
      await handleUpdateRecord(mergedRecord);
      showToast(`Data dari file "${file.name}" berhasil diimpor ke bulan ${MONTH_NAMES[selectedMonth - 1]} & tersinkron ke Cloud!`);
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
        syncStatus={syncStatus}
      />

      {/* Main Content Body */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1">
        {/* Real-time Cloud Sync Banner */}
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative shrink-0">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${syncStatus === 'syncing' ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${syncStatus === 'syncing' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
            </span>
            <span className="font-semibold text-slate-800">
              Cloud Database Terhubung:
            </span>
            <span>
              Perubahan data di perangkat ini langsung tersinkronisasi otomatis ke semua komputer, tablet, & HP lain secara live.
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
            <Cloud className="w-3.5 h-3.5 text-emerald-600" />
            <span>Database Online: Aktif</span>
          </div>
        </div>

        {/* Empty month notification if no data yet */}
        {isRecordEmpty(currentRecord) && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-emerald-700 shrink-0" />
              <div>
                <p className="font-bold">Bulan {MONTH_NAMES[selectedMonth - 1]} {selectedYear} siap untuk penginputan data</p>
                <p className="text-emerald-800">
                  Data Anda tersinkronisasi di Cloud dan aman permanen di perangkat ini kecuali dihapus secara sengaja.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyFromPreviousMonth}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg transition-colors cursor-pointer shadow-xs"
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

        {/* Tab 2: Laporan Mutu Nasional (Rekap Bulanan & Tahunan) */}
        {activeTab === 'report' && (
          <ReportSheet
            record={currentRecord}
            hospital={hospital}
            yearRecords={yearRecords}
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
            <span>Cloud Database Firestore &bull; Sinkronisasi Multi-Device Aktif</span>
          </div>
        </div>
      </footer>

      {/* Print Preview Modal */}
      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        record={currentRecord}
        hospital={hospital}
        yearRecords={yearRecords}
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
