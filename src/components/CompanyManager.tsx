import { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  MapPin,
  X,
  AlertTriangle,
  Eye,
  Lock
} from 'lucide-react';
import type { Company, LicenseWithRelations } from '../types/database';
import { computeLicenseStatus } from '../types/database';
import { licenseService } from '../services/licenseService';

interface CompanyManagerProps {
  companies: Company[];
  licenses: LicenseWithRelations[];
  onRefresh: () => void;
  onSelectLicense: (license: LicenseWithRelations) => void;
  isAuthenticated: boolean;
  onRequireAuth: () => void;
}

export const CompanyManager = ({
  companies,
  licenses,
  onRefresh,
  onSelectLicense,
  isAuthenticated,
  onRequireAuth
}: CompanyManagerProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompanyForView, setSelectedCompanyForView] = useState<Company | null>(null);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [deleteConfirmCompany, setDeleteConfirmCompany] = useState<Company | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Group licenses by company
  const companyLicensesMap = useMemo(() => {
    const map: Record<string, LicenseWithRelations[]> = {};
    licenses.forEach((lic) => {
      if (!map[lic.company_id]) map[lic.company_id] = [];
      map[lic.company_id].push(lic);
    });
    return map;
  }, [licenses]);

  // Filter companies
  const filteredCompanies = useMemo(() => {
    if (!searchQuery.trim()) return companies;
    const q = searchQuery.toLowerCase();
    return companies.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.address && c.address.toLowerCase().includes(q))
    );
  }, [companies, searchQuery]);

  // Open Form
  const handleOpenCreate = () => {
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    setEditingCompany(null);
    setCompanyName('');
    setCompanyAddress('');
    setErrorMessage(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (comp: Company) => {
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    setEditingCompany(comp);
    setCompanyName(comp.name);
    setCompanyAddress(comp.address || '');
    setErrorMessage(null);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setErrorMessage('Nama perusahaan wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (editingCompany) {
        await licenseService.updateCompany(editingCompany.id, {
          name: companyName.trim(),
          address: companyAddress.trim() || null
        });
      } else {
        await licenseService.createCompany({
          name: companyName.trim(),
          address: companyAddress.trim() || null
        });
      }
      setIsFormOpen(false);
      onRefresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan data perusahaan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmCompany) return;
    setIsSubmitting(true);
    try {
      await licenseService.deleteCompany(deleteConfirmCompany.id);
      setDeleteConfirmCompany(null);
      if (selectedCompanyForView?.id === deleteConfirmCompany.id) {
        setSelectedCompanyForView(null);
      }
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 m-0">Data Badan Usaha / Perusahaan</h2>
          <p className="text-xs text-slate-500 m-0 mt-0.5">
            Kelola data pemegang izin pertambangan di Provinsi Maluku Utara.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-xs font-semibold shadow-md transition-all cursor-pointer self-start sm:self-auto ${
            isAuthenticated
              ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30'
              : 'bg-slate-800 hover:bg-slate-700 border border-slate-700'
          }`}
          title={isAuthenticated ? 'Tambah Perusahaan Baru' : 'Masuk sebagai Admin untuk menambah perusahaan'}
        >
          {isAuthenticated ? (
            <Plus className="w-4 h-4" />
          ) : (
            <Lock className="w-3.5 h-3.5 text-amber-300" />
          )}
          <span>Tambah Perusahaan Baru</span>
          {!isAuthenticated && <span className="text-[10px] text-amber-300 font-normal">(Admin)</span>}
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama perusahaan atau alamat domisili..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Grid of Companies */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCompanies.map((comp) => {
          const compLicenses = companyLicensesMap[comp.id] || [];

          return (
            <div
              key={comp.id}
              className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:border-emerald-500/60 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 m-0 line-clamp-1" title={comp.name}>
                      {comp.name}
                    </h3>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      compLicenses.length > 0
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {compLicenses.length} Izin
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4 min-h-[32px]">
                  {comp.address ? (
                    <span className="flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{comp.address}</span>
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">Alamat belum dicatat</span>
                  )}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setSelectedCompanyForView(comp)}
                  className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Lihat {compLicenses.length} Izin</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(comp)}
                    className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                    title="Edit Perusahaan"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        onRequireAuth();
                        return;
                      }
                      setDeleteConfirmCompany(comp);
                    }}
                    className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                    title={isAuthenticated ? 'Hapus Perusahaan' : 'Perlu akses Admin untuk menghapus'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: VIEW COMPANY LICENSES */}
      {selectedCompanyForView && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setSelectedCompanyForView(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-1">
              <Building2 className="w-4 h-4" />
              <span>Daftar Izin Perusahaan</span>
            </div>

            <h3 className="text-xl font-bold text-slate-900 m-0 mb-1">
              {selectedCompanyForView.name}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {selectedCompanyForView.address || 'Alamat tidak tercatat'}
            </p>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {(companyLicensesMap[selectedCompanyForView.id] || []).length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl">
                  Perusahaan ini belum memiliki izin yang tertaut.
                </div>
              ) : (
                (companyLicensesMap[selectedCompanyForView.id] || []).map((lic) => {
                  const st = computeLicenseStatus(lic.end_date, lic.status);

                  return (
                    <div
                      key={lic.id}
                      onClick={() => {
                        setSelectedCompanyForView(null);
                        onSelectLicense(lic);
                      }}
                      className="p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-slate-50 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                            {lic.license_type?.code || 'IUP'}
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {lic.sk_number}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 flex flex-wrap gap-2">
                          <span>Wilayah: <strong>{lic.regency}</strong></span>
                          {lic.area_ha && <span>• Luas: <strong>{lic.area_ha} HA</strong></span>}
                          {lic.commodity && <span>• Komoditas: <strong>{lic.commodity}</strong></span>}
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-end justify-between gap-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${st.badgeClass}`}>
                          {st.status}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          s.d. {lic.end_date}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT COMPANY */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 m-0 mb-1">
              {editingCompany ? 'Edit Data Perusahaan' : 'Tambah Perusahaan Baru'}
            </h3>
            <p className="text-xs text-slate-500 m-0 mb-4">
              Daftarkan nama badan usaha pemegang izin pertambangan.
            </p>

            {errorMessage && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Badan Usaha / Perusahaan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: PT NIKEL MAJU BERSAMA"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 uppercase"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Alamat Lengkap Domisili / Kantor
                </label>
                <textarea
                  rows={3}
                  placeholder="Contoh: Desa Lelilef, Kec. Weda Tengah, Kab. Halmahera Tengah..."
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perusahaan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {deleteConfirmCompany && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <h3 className="text-base font-bold text-slate-900 m-0 mb-1">
              Konfirmasi Hapus Perusahaan
            </h3>
            <p className="text-xs text-slate-600 m-0 mb-4 leading-relaxed">
              Apakah Anda yakin ingin menghapus perusahaan{' '}
              <strong className="text-slate-900">{deleteConfirmCompany.name}</strong>? Perusahaan hanya dapat dihapus jika tidak memiliki izin yang tertaut.
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmCompany(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
