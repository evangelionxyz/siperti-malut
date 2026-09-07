import { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import type { ActiveTab } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { LicenseManager } from './components/LicenseManager';
import { CompanyManager } from './components/CompanyManager';
import { LicenseTypeManager } from './components/LicenseTypeManager';
import { AuthModal } from './components/AuthModal';
import { licenseService } from './services/licenseService';
import { authService } from './services/authService';
import type { User } from '@supabase/supabase-js';
import type {
  Company,
  LicenseType,
  LicenseWithRelations,
  ComputedStatus
} from './types/database';
import { computeLicenseStatus } from './types/database';
import { AlertCircle, Layers, Calendar, MapPin, X } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [licenses, setLicenses] = useState<LicenseWithRelations[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [licenseTypes, setLicenseTypes] = useState<LicenseType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Authentication State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Cross-component state
  const [selectedLicenseForModal, setSelectedLicenseForModal] = useState<LicenseWithRelations | null>(null);
  const [licenseTableFilters, setLicenseTableFilters] = useState<{
    computedStatus?: ComputedStatus;
    categoryName?: string;
  }>({});

  // Load all data from Supabase
  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const [fetchedLicenses, fetchedCompanies, fetchedTypes] = await Promise.all([
        licenseService.getLicenses(),
        licenseService.getCompanies(),
        licenseService.getLicenseTypes()
      ]);

      setLicenses(fetchedLicenses);
      setCompanies(fetchedCompanies);
      setLicenseTypes(fetchedTypes);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Failed to load data from Supabase:', err);
      setError(
        err.message ||
          'Gagal terhubung ke Supabase. Pastikan RLS policies dan koneksi internet Anda aktif.'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Check initial auth session
    authService.getSession().then((session) => {
      setUser(session?.user || null);
    });

    // Listen to real-time auth changes
    const { data: { subscription } } = authService.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadData]);

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      setUser(null);
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  // Handle navigation with preset filters
  const handleNavigateToLicensesWithFilter = (filter?: {
    computedStatus?: ComputedStatus;
    categoryName?: string;
  }) => {
    setLicenseTableFilters(filter || {});
    setActiveTab('licenses');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col selection:bg-emerald-200 selection:text-emerald-900">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'licenses') setLicenseTableFilters({});
          setActiveTab(tab);
        }}
        onRefresh={() => loadData(true)}
        isRefreshing={isRefreshing}
        totalCount={licenses.length}
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
        lastUpdated={lastUpdated}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <strong className="font-bold">Terjadi Kesalahan Koneksi Database:</strong>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
            <button
              onClick={() => loadData()}
              className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-colors shrink-0"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-emerald-600/20 border-t-emerald-600 rounded-full animate-spin"></div>
            <p className="text-xs font-semibold text-slate-500">
              Memuat data perizinan pertambangan dari Supabase...
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard
                licenses={licenses}
                totalCompaniesCount={companies.length}
                onSelectLicense={(lic) => setSelectedLicenseForModal(lic)}
                onNavigateToLicenses={handleNavigateToLicensesWithFilter}
                lastUpdated={lastUpdated}
              />
            )}

            {activeTab === 'licenses' && (
              <LicenseManager
                licenses={licenses}
                companies={companies}
                licenseTypes={licenseTypes}
                onRefresh={() => loadData(true)}
                initialFilters={licenseTableFilters}
                isAuthenticated={Boolean(user)}
                onRequireAuth={() => setIsAuthModalOpen(true)}
              />
            )}

            {activeTab === 'companies' && (
              <CompanyManager
                companies={companies}
                licenses={licenses}
                onRefresh={() => loadData(true)}
                onSelectLicense={(lic) => setSelectedLicenseForModal(lic)}
                isAuthenticated={Boolean(user)}
                onRequireAuth={() => setIsAuthModalOpen(true)}
              />
            )}

            {activeTab === 'types' && (
              <LicenseTypeManager
                licenseTypes={licenseTypes}
                licenses={licenses}
                onSelectCategory={(code) => {
                  setLicenseTableFilters({ categoryName: code });
                  setActiveTab('licenses');
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Admin Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          setIsAuthModalOpen(false);
          loadData(true);
        }}
      />

      {/* Global Quick Detail Modal */}
      {selectedLicenseForModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in duration-200">
            <button
              onClick={() => setSelectedLicenseForModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
              <Layers className="w-4 h-4" />
              <span>Detail Informasi Izin Pertambangan</span>
            </div>

            <h3 className="text-xl font-bold text-slate-900 m-0">
              {selectedLicenseForModal.companies?.name || 'Perusahaan tidak tertaut'}
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-1 mb-4">
              {selectedLicenseForModal.sk_number}
            </p>

            {/* Status Alert */}
            {(() => {
              const st = computeLicenseStatus(
                selectedLicenseForModal.end_date,
                selectedLicenseForModal.status
              );
              return (
                <div className={`p-3 rounded-xl border flex items-center justify-between mb-4 ${st.badgeClass}`}>
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span>Status Keberlakuan:</span>
                    <span className="uppercase">{st.status}</span>
                  </div>
                  <span className="text-xs font-semibold">{st.label}</span>
                </div>
              );
            })()}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Jenis & Kategori Izin</span>
                <span className="font-bold text-slate-800 text-sm">
                  {selectedLicenseForModal.license_type?.code} ({selectedLicenseForModal.license_type?.category_name})
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Wilayah (Kabupaten / Kota)</span>
                <span className="font-bold text-slate-800 text-sm flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  {selectedLicenseForModal.regency}, {selectedLicenseForModal.province}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Luas Konsesi (HA)</span>
                <span className="font-bold text-slate-800 text-sm font-mono">
                  {selectedLicenseForModal.area_ha !== null
                    ? `${Number(selectedLicenseForModal.area_ha).toLocaleString('id-ID')} Hektar`
                    : 'Tidak berlaku (IUJP)'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Tahapan Kegiatan</span>
                <span className="font-bold text-slate-800 text-sm">
                  {selectedLicenseForModal.activity_stage || '-'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Komoditas Tambang</span>
                <span className="font-bold text-slate-800 text-sm">
                  {selectedLicenseForModal.commodity || '-'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Tahun Terbit SK</span>
                <span className="font-bold text-slate-800 text-sm font-mono">
                  {selectedLicenseForModal.issued_year}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 sm:col-span-2">
                <span className="text-slate-400 block mb-0.5">Masa Berlaku Izin</span>
                <span className="font-bold text-slate-800 text-sm font-mono flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  {selectedLicenseForModal.start_date} s.d. {selectedLicenseForModal.end_date}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 sm:col-span-2">
                <span className="text-slate-400 block mb-0.5">Alamat Lengkap Perusahaan</span>
                <span className="text-slate-700 leading-relaxed">
                  {selectedLicenseForModal.companies?.address || 'Alamat tidak tercatat'}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  setSelectedLicenseForModal(null);
                  setActiveTab('licenses');
                }}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
              >
                Buka di Tabel Izin
              </button>
              <button
                onClick={() => setSelectedLicenseForModal(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-6 text-xs mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <p className="font-semibold text-slate-200 m-0">
              Dinas Energi dan Sumber Daya Mineral (ESDM) Provinsi Maluku Utara
            </p>
            <p className="text-slate-400 m-0 mt-0.5">
              Sistem Pengelolaan & Monitoring Izin Usaha Pertambangan (IUP • IPR • IUJP)
            </p>
          </div>
          <div className="text-[11px] text-slate-400">
            Terhubung ke Supabase PostgreSQL • Real-time Data
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
