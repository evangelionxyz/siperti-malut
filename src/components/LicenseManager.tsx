import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Download,
  Eye,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Calendar,
  Layers,
  MapPin,
  Lock
} from 'lucide-react';
import type {
  License,
  LicenseWithRelations,
  Company,
  LicenseType,
  ComputedStatus
} from '../types/database';
import { computeLicenseStatus } from '../types/database';
import { licenseService } from '../services/licenseService';

interface LicenseManagerProps {
  licenses: LicenseWithRelations[];
  companies: Company[];
  licenseTypes: LicenseType[];
  onRefresh: () => void;
  initialFilters?: { computedStatus?: ComputedStatus; categoryName?: string };
  isAuthenticated: boolean;
  onRequireAuth: () => void;
}

export const LicenseManager = ({
  licenses,
  companies,
  licenseTypes,
  onRefresh,
  initialFilters,
  isAuthenticated,
  onRequireAuth
}: LicenseManagerProps) => {
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegency, setSelectedRegency] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ComputedStatus | 'ALL'>(
    initialFilters?.computedStatus || 'ALL'
  );
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedCommodity, setSelectedCommodity] = useState('');

  const availableYears = useMemo(() => {
    return Array.from(new Set(licenses.map((l) => l.issued_year).filter(Boolean))).sort((a, b) => b - a);
  }, [licenses]);

  const availableCommodities = useMemo(() => {
    return Array.from(new Set(licenses.map((l) => l.commodity).filter(Boolean) as string[])).sort();
  }, [licenses]);

  // Pagination & Sorting state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [sortField, setSortField] = useState<keyof License | 'company_name'>('end_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modal states
  const [detailModalLicense, setDetailModalLicense] = useState<LicenseWithRelations | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState<LicenseWithRelations | null>(null);
  const [deleteConfirmLicense, setDeleteConfirmLicense] = useState<LicenseWithRelations | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Fields State
  const [formCompanyId, setFormCompanyId] = useState('');
  const [formLicenseTypeId, setFormLicenseTypeId] = useState('');
  const [formSkNumber, setFormSkNumber] = useState('');
  const [formProvince, setFormProvince] = useState('MALUKU UTARA');
  const [formRegency, setFormRegency] = useState('HALMAHERA BARAT');
  const [formAreaHa, setFormAreaHa] = useState('');
  const [formActivityStage, setFormActivityStage] = useState('PRODUKSI');
  const [formCommodity, setFormCommodity] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formIssuedYear, setFormIssuedYear] = useState(new Date().getFullYear().toString());
  const [formStatus, setFormStatus] = useState(true);

  // Regency lists for dropdown
  const regencyOptions = [
    'HALMAHERA BARAT',
    'HALMAHERA SELATAN',
    'HALMAHERA TENGAH',
    'HALMAHERA TIMUR',
    'HALMAHERA UTARA',
    'KOTA TERNATE',
    'KOTA TIDORE KEPULAUAN',
    'PULAU MOROTAI',
    'PULAU TALIABU'
  ];

  // Open Form for Create
  const handleOpenCreate = () => {
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    setEditingLicense(null);
    setFormCompanyId(companies[0]?.id || '');
    setFormLicenseTypeId(licenseTypes[0]?.id || '');
    setFormSkNumber('');
    setFormProvince('MALUKU UTARA');
    setFormRegency('HALMAHERA BARAT');
    setFormAreaHa('');
    setFormActivityStage('PRODUKSI');
    setFormCommodity('');
    setFormStartDate(new Date().toISOString().split('T')[0]);
    setFormEndDate(
      new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );
    setFormIssuedYear(new Date().getFullYear().toString());
    setFormStatus(true);
    setErrorMessage(null);
    setIsFormModalOpen(true);
  };

  // Open Form for Edit
  const handleOpenEdit = (license: LicenseWithRelations) => {
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    setEditingLicense(license);
    setFormCompanyId(license.company_id);
    setFormLicenseTypeId(license.license_type_id);
    setFormSkNumber(license.sk_number);
    setFormProvince(license.province);
    setFormRegency(license.regency);
    setFormAreaHa(license.area_ha !== null ? license.area_ha.toString() : '');
    setFormActivityStage(license.activity_stage || '');
    setFormCommodity(license.commodity || '');
    setFormStartDate(license.start_date);
    setFormEndDate(license.end_date);
    setFormIssuedYear(license.issued_year?.toString() || new Date().getFullYear().toString());
    setFormStatus(license.status);
    setErrorMessage(null);
    setIsFormModalOpen(true);
  };

  // Submit Form (Create / Update)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (!formCompanyId) throw new Error('Perusahaan wajib dipilih');
      if (!formLicenseTypeId) throw new Error('Jenis izin wajib dipilih');
      if (!formSkNumber.trim()) throw new Error('Nomor SK wajib diisi');
      if (!formStartDate || !formEndDate) throw new Error('Tanggal mulai dan berakhir wajib diisi');

      const payload = {
        company_id: formCompanyId,
        license_type_id: formLicenseTypeId,
        sk_number: formSkNumber.trim(),
        province: formProvince.trim(),
        regency: formRegency.trim(),
        area_ha: formAreaHa ? parseFloat(formAreaHa) : null,
        activity_stage: formActivityStage || null,
        commodity: formCommodity.trim() || null,
        start_date: formStartDate,
        end_date: formEndDate,
        issued_year: parseInt(formIssuedYear) || new Date(formStartDate).getFullYear(),
        status: formStatus
      };

      if (editingLicense) {
        await licenseService.updateLicense(editingLicense.id, payload);
      } else {
        await licenseService.createLicense(payload);
      }

      setIsFormModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan data izin');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleDeleteLicense = async () => {
    if (!deleteConfirmLicense) return;
    setIsSubmitting(true);
    try {
      await licenseService.deleteLicense(deleteConfirmLicense.id);
      setDeleteConfirmLicense(null);
      onRefresh();
    } catch (err: any) {
      alert(`Gagal menghapus izin: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter and sort licenses
  const filteredLicenses = useMemo(() => {
    return licenses.filter((lic) => {
      const statusInfo = computeLicenseStatus(lic.end_date, lic.status);

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const comp = lic.companies?.name?.toLowerCase() || '';
        const sk = lic.sk_number.toLowerCase();
        const comm = lic.commodity?.toLowerCase() || '';
        if (!comp.includes(q) && !sk.includes(q) && !comm.includes(q)) return false;
      }

      if (selectedRegency && lic.regency !== selectedRegency) return false;
      if (selectedType && lic.license_type?.code !== selectedType) return false;
      if (selectedStatus !== 'ALL' && statusInfo.status !== selectedStatus) return false;
      if (selectedStage && lic.activity_stage !== selectedStage) return false;
      if (selectedYear && lic.issued_year !== Number(selectedYear)) return false;
      if (selectedCommodity && lic.commodity !== selectedCommodity) return false;

      return true;
    });
  }, [licenses, searchQuery, selectedRegency, selectedType, selectedStatus, selectedStage, selectedYear, selectedCommodity]);

  const sortedLicenses = useMemo(() => {
    const list = [...filteredLicenses];
    list.sort((a, b) => {
      let valA: any = a[sortField as keyof License];
      let valB: any = b[sortField as keyof License];

      if (sortField === 'company_name') {
        valA = a.companies?.name || '';
        valB = b.companies?.name || '';
      }

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (sortOrder === 'asc') {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });
    return list;
  }, [filteredLicenses, sortField, sortOrder]);

  // Pagination calculation
  const totalPages = Math.ceil(sortedLicenses.length / pageSize) || 1;
  const paginatedLicenses = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedLicenses.slice(start, start + pageSize);
  }, [sortedLicenses, currentPage, pageSize]);

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'No',
      'Nama Perusahaan',
      'Alamat Perusahaan',
      'Nomor SK',
      'Jenis Izin',
      'Kategori',
      'Provinsi',
      'Kabupaten',
      'Luas (HA)',
      'Tahapan Kegiatan',
      'Komoditas',
      'Tanggal Mulai',
      'Tanggal Berakhir',
      'Status',
      'Tahun Terbit'
    ];

    const rows = sortedLicenses.map((lic, index) => {
      const st = computeLicenseStatus(lic.end_date, lic.status);
      return [
        index + 1,
        `"${(lic.companies?.name || '').replace(/"/g, '""')}"`,
        `"${(lic.companies?.address || '').replace(/"/g, '""')}"`,
        `"${lic.sk_number.replace(/"/g, '""')}"`,
        lic.license_type?.code || '',
        lic.license_type?.category_name || '',
        lic.province,
        lic.regency,
        lic.area_ha !== null ? lic.area_ha : '',
        lic.activity_stage || '',
        `"${(lic.commodity || '').replace(/"/g, '""')}"`,
        lic.start_date,
        lic.end_date,
        st.status,
        lic.issued_year
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `data_perizinan_pertambangan_malut_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSort = (field: keyof License | 'company_name') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 m-0">Data Izin Pertambangan Maluku Utara</h2>
          <p className="text-xs text-slate-500 m-0 mt-0.5">
            Daftar lengkap perizinan IUP, IPR, dan IUJP yang terdaftar di sistem Supabase ESDM.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-xs font-semibold shadow-md transition-all cursor-pointer ${
              isAuthenticated
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30'
                : 'bg-slate-800 hover:bg-slate-700 border border-slate-700'
            }`}
            title={isAuthenticated ? 'Tambah Izin Baru' : 'Masuk sebagai Admin untuk menambah data'}
          >
            {isAuthenticated ? (
              <Plus className="w-4 h-4" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-amber-300" />
            )}
            <span>Tambah Izin Baru</span>
            {!isAuthenticated && <span className="text-[10px] text-amber-300 font-normal">(Admin)</span>}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {/* Search query */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Cari Izin</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="SK, PT, Komoditas..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Regency */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Kabupaten / Kota</label>
            <select
              value={selectedRegency}
              onChange={(e) => {
                setSelectedRegency(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 cursor-pointer"
            >
              <option value="">Semua Wilayah</option>
              {regencyOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* License Type */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Jenis Izin</label>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 cursor-pointer"
            >
              <option value="">Semua Jenis</option>
              {licenseTypes.map((t) => (
                <option key={t.id} value={t.code}>
                  {t.code} ({t.category_name})
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Status Keberlakuan</label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value as ComputedStatus | 'ALL');
                setCurrentPage(1);
              }}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="AKTIF">🟢 Aktif</option>
              <option value="AKAN BERAKHIR">🟡 Akan Berakhir (≤ 180 hari)</option>
              <option value="BERAKHIR">🔴 Berakhir</option>
            </select>
          </div>

          {/* Tahapan Kegiatan */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tahapan Kegiatan</label>
            <select
              value={selectedStage}
              onChange={(e) => {
                setSelectedStage(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 cursor-pointer"
            >
              <option value="">Semua Tahapan</option>
              <option value="PRODUKSI">PRODUKSI</option>
              <option value="OPERASI PRODUKSI">OPERASI PRODUKSI</option>
              <option value="EKSPLORASI">EKSPLORASI</option>
            </select>
          </div>

          {/* Tahun Terbit */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tahun Terbit</label>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 cursor-pointer"
            >
              <option value="">Semua Tahun</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Komoditas */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Komoditas</label>
            <select
              value={selectedCommodity}
              onChange={(e) => {
                setSelectedCommodity(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 cursor-pointer"
            >
              <option value="">Semua Komoditas</option>
              {availableCommodities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results summary & reset */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Menampilkan <strong>{sortedLicenses.length}</strong> dari <strong>{licenses.length}</strong> total izin
          </span>
          {(searchQuery ||
            selectedRegency ||
            selectedType ||
            selectedStatus !== 'ALL' ||
            selectedStage ||
            selectedYear ||
            selectedCommodity) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedRegency('');
                setSelectedType('');
                setSelectedStatus('ALL');
                setSelectedStage('');
                setSelectedYear('');
                setSelectedCommodity('');
                setCurrentPage(1);
              }}
              className="flex items-center gap-1 text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Bersihkan Filter</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-3.5 text-center">No</th>
                <th
                  className="py-3 px-3.5 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => toggleSort('company_name')}
                >
                  <div className="flex items-center gap-1">
                    <span>Perusahaan</span>
                    {sortField === 'company_name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </div>
                </th>
                <th
                  className="py-3 px-3.5 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => toggleSort('sk_number')}
                >
                  <div className="flex items-center gap-1">
                    <span>Nomor SK</span>
                    {sortField === 'sk_number' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </div>
                </th>
                <th className="py-3 px-3.5">Jenis</th>
                <th
                  className="py-3 px-3.5 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => toggleSort('regency')}
                >
                  <div className="flex items-center gap-1">
                    <span>Wilayah</span>
                    {sortField === 'regency' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </div>
                </th>
                <th
                  className="py-3 px-3.5 cursor-pointer hover:bg-slate-100 transition-colors text-right"
                  onClick={() => toggleSort('area_ha')}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Luas (HA)</span>
                    {sortField === 'area_ha' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </div>
                </th>
                <th className="py-3 px-3.5">Tahapan</th>
                <th className="py-3 px-3.5">Komoditas</th>
                <th
                  className="py-3 px-3.5 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => toggleSort('end_date')}
                >
                  <div className="flex items-center gap-1">
                    <span>Masa Berlaku</span>
                    {sortField === 'end_date' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </div>
                </th>
                <th className="py-3 px-3.5 text-center">Status</th>
                <th className="py-3 px-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLicenses.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    Tidak ada data izin yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                paginatedLicenses.map((lic, index) => {
                  const statusInfo = computeLicenseStatus(lic.end_date, lic.status);
                  const rowNumber = (currentPage - 1) * pageSize + index + 1;

                  return (
                    <tr
                      key={lic.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => setDetailModalLicense(lic)}
                    >
                      <td className="py-3 px-3.5 text-center font-mono text-slate-400">
                        {rowNumber}
                      </td>
                      <td className="py-3 px-3.5 font-bold text-slate-900 max-w-[200px] truncate" title={lic.companies?.name}>
                        {lic.companies?.name || 'Perusahaan tidak tertaut'}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-[11px] text-slate-600 max-w-[180px] truncate" title={lic.sk_number}>
                        {lic.sk_number}
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          {lic.license_type?.code || 'IUP'}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-slate-700 font-medium">
                        {lic.regency}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono text-slate-800">
                        {lic.area_ha !== null ? Number(lic.area_ha).toLocaleString('id-ID') : '-'}
                      </td>
                      <td className="py-3 px-3.5 text-[11px] text-slate-600 font-medium">
                        {lic.activity_stage || '-'}
                      </td>
                      <td className="py-3 px-3.5 text-slate-600 max-w-[130px] truncate" title={lic.commodity || ''}>
                        {lic.commodity || '-'}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-[11px] text-slate-600">
                        <div>s.d. {lic.end_date}</div>
                        <div className="text-[10px] text-slate-400">({lic.start_date})</div>
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.badgeClass}`}
                        >
                          {statusInfo.status}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setDetailModalLicense(lic)}
                            className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-emerald-700 transition-colors"
                            title="Detail"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(lic)}
                            className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (!isAuthenticated) {
                                onRequireAuth();
                                return;
                              }
                              setDeleteConfirmLicense(lic);
                            }}
                            className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-rose-600 transition-colors"
                            title={isAuthenticated ? 'Hapus' : 'Perlu akses Admin untuk menghapus'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>Baris per halaman:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 rounded border border-slate-200 bg-white"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span>
              Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong>
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded border border-slate-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded border border-slate-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: DETAIL VIEW */}
      {detailModalLicense && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in duration-200">
            <button
              onClick={() => setDetailModalLicense(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
              <Layers className="w-4 h-4" />
              <span>Detail Informasi Izin Pertambangan</span>
            </div>

            <h3 className="text-xl font-bold text-slate-900 m-0">
              {detailModalLicense.companies?.name || 'Perusahaan tidak tertaut'}
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-1 mb-4">
              {detailModalLicense.sk_number}
            </p>

            {/* Status Badge alert */}
            {(() => {
              const st = computeLicenseStatus(detailModalLicense.end_date, detailModalLicense.status);
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
                  {detailModalLicense.license_type?.code} ({detailModalLicense.license_type?.category_name})
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Wilayah (Kabupaten / Kota)</span>
                <span className="font-bold text-slate-800 text-sm flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  {detailModalLicense.regency}, {detailModalLicense.province}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Luas Konsesi (HA)</span>
                <span className="font-bold text-slate-800 text-sm font-mono">
                  {detailModalLicense.area_ha !== null ? `${Number(detailModalLicense.area_ha).toLocaleString('id-ID')} Hektar` : 'Tidak berlaku (Jasa Pertambangan)'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Tahapan Kegiatan</span>
                <span className="font-bold text-slate-800 text-sm">
                  {detailModalLicense.activity_stage || '-'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Komoditas Tambang</span>
                <span className="font-bold text-slate-800 text-sm">
                  {detailModalLicense.commodity || '-'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Tahun Terbit SK</span>
                <span className="font-bold text-slate-800 text-sm font-mono">
                  {detailModalLicense.issued_year}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 sm:col-span-2">
                <span className="text-slate-400 block mb-0.5">Masa Berlaku</span>
                <span className="font-bold text-slate-800 text-sm font-mono flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  {detailModalLicense.start_date} s.d. {detailModalLicense.end_date}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 sm:col-span-2">
                <span className="text-slate-400 block mb-0.5">Alamat Perusahaan</span>
                <span className="text-slate-700 leading-relaxed">
                  {detailModalLicense.companies?.address || 'Alamat belum tercatat di sistem.'}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  const target = detailModalLicense;
                  setDetailModalLicense(null);
                  handleOpenEdit(target);
                }}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
              >
                Edit Izin Ini
              </button>
              <button
                onClick={() => setDetailModalLicense(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT FORM */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setIsFormModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 m-0 mb-1">
              {editingLicense ? 'Perbarui Data Izin Pertambangan' : 'Tambah Izin Pertambangan Baru'}
            </h3>
            <p className="text-xs text-slate-500 m-0 mb-4">
              Isi data perizinan secara akurat sesuai Surat Keputusan (SK) resmi.
            </p>

            {errorMessage && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              {/* Company Selection */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Badan Usaha / Perusahaan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formCompanyId}
                  onChange={(e) => setFormCompanyId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 cursor-pointer"
                  required
                >
                  <option value="">Pilih Perusahaan...</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* License Type & SK */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Jenis Izin <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formLicenseTypeId}
                    onChange={(e) => setFormLicenseTypeId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 cursor-pointer"
                    required
                  >
                    <option value="">Pilih Jenis Izin...</option>
                    {licenseTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.code} ({t.category_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nomor SK Izin <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: IZIN : 11072301674920004"
                    value={formSkNumber}
                    onChange={(e) => setFormSkNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-mono"
                    required
                  />
                </div>
              </div>

              {/* Regency & Province */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kabupaten / Kota <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formRegency}
                    onChange={(e) => setFormRegency(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 cursor-pointer"
                    required
                  >
                    {regencyOptions.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Provinsi</label>
                  <input
                    type="text"
                    value={formProvince}
                    onChange={(e) => setFormProvince(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none"
                    readOnly
                  />
                </div>
              </div>

              {/* Area & Tahapan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Luas Wilayah (HA) <span className="text-slate-400 font-normal">(Kosongkan jika IUJP)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Contoh: 15.50"
                    value={formAreaHa}
                    onChange={(e) => setFormAreaHa(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tahapan Kegiatan</label>
                  <select
                    value={formActivityStage}
                    onChange={(e) => setFormActivityStage(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="">Tidak Ada / Tidak Berlaku</option>
                    <option value="PRODUKSI">PRODUKSI</option>
                    <option value="OPERASI PRODUKSI">OPERASI PRODUKSI</option>
                    <option value="EKSPLORASI">EKSPLORASI</option>
                  </select>
                </div>
              </div>

              {/* Commodity & Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Komoditas</label>
                  <input
                    type="text"
                    placeholder="Contoh: BATUAN, EMAS, SIRTU, PASIR"
                    value={formCommodity}
                    onChange={(e) => setFormCommodity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tahun Terbit SK</label>
                  <input
                    type="number"
                    value={formIssuedYear}
                    onChange={(e) => setFormIssuedYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tanggal Mulai Berlaku <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tanggal Berakhir <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-mono"
                    required
                  />
                </div>
              </div>

              {/* Status Administrative Checkbox */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formStatus}
                    onChange={(e) => setFormStatus(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-slate-700">Status Administratif Aktif / Berlaku</span>
                </label>
                <p className="text-[10px] text-slate-400 ml-6 mt-0.5">
                  Jika dinonaktifkan, izin dianggap dicabut atau dibekukan secara administratif.
                </p>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-900/20 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                  <span>{editingLicense ? 'Simpan Perubahan' : 'Tambahkan Izin'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {deleteConfirmLicense && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <h3 className="text-base font-bold text-slate-900 m-0 mb-1">
              Konfirmasi Hapus Izin
            </h3>
            <p className="text-xs text-slate-600 m-0 mb-4 leading-relaxed">
              Apakah Anda yakin ingin menghapus izin dengan SK{' '}
              <strong className="text-slate-900 font-mono">{deleteConfirmLicense.sk_number}</strong> atas nama{' '}
              <strong className="text-slate-900">{deleteConfirmLicense.companies?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmLicense(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteLicense}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus Izin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
