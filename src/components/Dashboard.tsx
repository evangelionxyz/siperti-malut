import { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Pickaxe,
  Wrench,
  Compass,
  MapPin,
  Building,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Search,
  RotateCcw,
  Eye,
  ChevronRight
} from 'lucide-react';
import type {
  LicenseWithRelations,
  LicenseFilters,
  ComputedStatus
} from '../types/database';
import { computeLicenseStatus } from '../types/database';
import {
  PersentaseAktifCircle,
  StatusPieChart,
  JenisIzinPieChart,
  KabupatenVerticalBarChart,
  TrenTahunChart,
  KomoditasHorizontalBarChart
} from './DashboardVisualizers';

interface DashboardProps {
  licenses: LicenseWithRelations[];
  totalCompaniesCount: number;
  onSelectLicense: (license: LicenseWithRelations) => void;
  onNavigateToLicenses: (filter?: { computedStatus?: ComputedStatus; categoryName?: string; regency?: string }) => void;
  lastUpdated?: Date;
}

export const Dashboard = ({
  licenses,
  totalCompaniesCount,
  onSelectLicense,
  onNavigateToLicenses,
  lastUpdated
}: DashboardProps) => {
  const [filters, setFilters] = useState<LicenseFilters>({
    searchQuery: '',
    regency: '',
    categoryName: '',
    computedStatus: 'ALL',
    activityStage: '',
    year: '',
    commodity: ''
  });

  // Extract unique filter dropdown values
  const regencies = useMemo(() => {
    const set = new Set<string>();
    licenses.forEach((l) => {
      if (l.regency) set.add(l.regency);
    });
    return Array.from(set).sort();
  }, [licenses]);

  const stages = useMemo(() => {
    const set = new Set<string>();
    licenses.forEach((l) => {
      if (l.activity_stage) set.add(l.activity_stage);
    });
    return Array.from(set).sort();
  }, [licenses]);

  const years = useMemo(() => {
    const set = new Set<number>();
    licenses.forEach((l) => {
      if (l.issued_year) set.add(l.issued_year);
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [licenses]);

  const commodities = useMemo(() => {
    const set = new Set<string>();
    licenses.forEach((l) => {
      if (l.commodity && l.commodity !== 'Unknown') set.add(l.commodity);
    });
    return Array.from(set).sort();
  }, [licenses]);

  // Apply filters
  const filteredLicenses = useMemo(() => {
    return licenses.filter((lic) => {
      const statusInfo = computeLicenseStatus(lic.end_date, lic.status);

      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const comp = lic.companies?.name?.toLowerCase() || '';
        const sk = lic.sk_number.toLowerCase();
        const comm = lic.commodity?.toLowerCase() || '';
        if (!comp.includes(q) && !sk.includes(q) && !comm.includes(q)) {
          return false;
        }
      }

      if (filters.regency && lic.regency !== filters.regency) {
        return false;
      }

      if (filters.categoryName) {
        const cat = lic.license_type?.category_name || '';
        if (cat !== filters.categoryName) return false;
      }

      if (filters.computedStatus && filters.computedStatus !== 'ALL') {
        if (statusInfo.status !== filters.computedStatus) return false;
      }

      if (filters.activityStage && lic.activity_stage !== filters.activityStage) {
        return false;
      }

      if (filters.year && lic.issued_year !== Number(filters.year)) {
        return false;
      }

      if (filters.commodity && lic.commodity !== filters.commodity) {
        return false;
      }

      return true;
    });
  }, [licenses, filters]);

  // Calculate comprehensive stats for visualizers
  const stats = useMemo(() => {
    let totalIupMblb = 0;
    let totalIpr = 0;
    let totalIujp = 0;
    let totalArea = 0;
    let active = 0;
    let expiringSoon = 0;
    let expired = 0;

    const regencyMap: Record<string, { count: number; area: number }> = {};
    const granularTypeMap: Record<string, number> = {};
    const yearMap: Record<number, number> = {};
    const commodityMap: Record<string, number> = {};

    filteredLicenses.forEach((lic) => {
      const st = computeLicenseStatus(lic.end_date, lic.status);
      if (st.status === 'AKTIF') active++;
      else if (st.status === 'AKAN BERAKHIR') expiringSoon++;
      else expired++;

      const cat = lic.license_type?.category_name || 'IUP';
      const code = lic.license_type?.code || 'IUP';

      if (code === 'IPR' || cat === 'IPR') totalIpr++;
      else if (code === 'IUJP' || cat === 'IUJP') totalIujp++;
      else totalIupMblb++;

      if (lic.area_ha) totalArea += Number(lic.area_ha);

      // granular license types
      granularTypeMap[code] = (granularTypeMap[code] || 0) + 1;

      // regency
      const reg = lic.regency || 'Lainnya';
      if (!regencyMap[reg]) regencyMap[reg] = { count: 0, area: 0 };
      regencyMap[reg].count++;
      if (lic.area_ha) regencyMap[reg].area += Number(lic.area_ha);

      // year
      if (lic.issued_year) {
        yearMap[lic.issued_year] = (yearMap[lic.issued_year] || 0) + 1;
      }

      // commodity
      if (lic.commodity && lic.commodity !== 'Unknown') {
        commodityMap[lic.commodity] = (commodityMap[lic.commodity] || 0) + 1;
      }
    });

    const activePct = filteredLicenses.length > 0 ? (active / filteredLicenses.length) * 100 : 0;

    // Ensure all 9 regencies are present in order for the vertical bar chart
    const standardRegencies = [
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

    const regencyList = standardRegencies.map((name) => {
      const val = regencyMap[name] || { count: 0, area: 0 };
      return {
        name,
        count: val.count,
        area: Math.round(val.area * 100) / 100
      };
    });

    return {
      total: filteredLicenses.length,
      totalIupMblb,
      totalIpr,
      totalIujp,
      totalArea: Math.round(totalArea * 100) / 100,
      active,
      expiringSoon,
      expired,
      activePct: Math.round(activePct * 10) / 10,
      regencyList,
      yearList: Object.entries(yearMap).map(([yr, count]) => ({
        year: Number(yr),
        count
      })),
      commodityList: Object.entries(commodityMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      granularList: Object.entries(granularTypeMap)
        .map(([code, count]) => ({ code, count }))
        .sort((a, b) => b.count - a.count)
    };
  }, [filteredLicenses]);

  // Urgent expiring or expired licenses
  const urgentLicenses = useMemo(() => {
    return licenses
      .map((lic) => ({
        license: lic,
        statusInfo: computeLicenseStatus(lic.end_date, lic.status)
      }))
      .filter((item) => item.statusInfo.status === 'AKAN BERAKHIR' || item.statusInfo.status === 'BERAKHIR')
      .sort((a, b) => new Date(a.license.end_date).getTime() - new Date(b.license.end_date).getTime());
  }, [licenses]);

  const resetFilters = () => {
    setFilters({
      searchQuery: '',
      regency: '',
      categoryName: '',
      computedStatus: 'ALL',
      activityStage: '',
      year: '',
      commodity: ''
    });
  };

  const formattedUpdateDetailed = lastUpdated
    ? new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Jayapura'
      }).format(lastUpdated) + ' WIT'
    : 'Sinkronisasi Aktif';

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Welcome with Live Update Status */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-2xl p-6 text-white shadow-sm border border-slate-700/60 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Data Supabase
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-xs text-slate-300 flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              Pembaruan Terakhir: <strong className="text-white">{formattedUpdateDetailed}</strong>
            </span>
          </div>

          <h2 className="text-xl md:text-2xl font-bold text-white m-0">
            Dashboard Monitoring Perizinan Pertambangan Maluku Utara
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 mb-0">
            Monitoring data perizinan IUP Mineral Bukan Logam & Batuan, IPR, dan Jasa Pertambangan (IUJP) secara real-time.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigateToLicenses()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-md shadow-emerald-900/40 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Buka Tabel Data Izin</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total IUP MBLB */}
        <div
          onClick={() => onNavigateToLicenses({ categoryName: 'IUP' })}
          className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total IUP MBLB
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Pickaxe className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stats.totalIupMblb}</span>
            <span className="text-[11px] text-emerald-600 font-medium">SIPB & Batuan</span>
          </div>
          <div className="mt-1 text-[10px] text-slate-400">Mineral Bukan Logam & Batuan</div>
        </div>

        {/* Total IPR */}
        <div
          onClick={() => onNavigateToLicenses({ categoryName: 'IPR' })}
          className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:border-amber-500 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total IPR
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stats.totalIpr}</span>
            <span className="text-[11px] text-amber-600 font-medium">Izin Rakyat</span>
          </div>
          <div className="mt-1 text-[10px] text-slate-400">Pertambangan Rakyat (Emas dsb)</div>
        </div>

        {/* Total IUJP */}
        <div
          onClick={() => onNavigateToLicenses({ categoryName: 'IUJP' })}
          className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total IUJP
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stats.totalIujp}</span>
            <span className="text-[11px] text-blue-600 font-medium">Jasa Tambang</span>
          </div>
          <div className="mt-1 text-[10px] text-slate-400">Izin Usaha Jasa Pertambangan</div>
        </div>

        {/* Total Area HA */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Luas Konsesi
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900">
              {stats.totalArea.toLocaleString('id-ID')}
            </span>
            <span className="text-xs text-slate-500 font-medium">HA</span>
          </div>
          <div className="mt-1 text-[10px] text-slate-400">Konsesi IUP & IPR Terdata</div>
        </div>

        {/* Total Companies */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Badan Usaha / PT
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalCompaniesCount}</span>
            <span className="text-[11px] text-purple-600 font-medium">Perusahaan</span>
          </div>
          <div className="mt-1 text-[10px] text-slate-400">Pemegang Izin Resmi</div>
        </div>

        {/* Active Percentage */}
        <div
          onClick={() => onNavigateToLicenses({ computedStatus: 'AKTIF' })}
          className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Persentase Aktif
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stats.activePct}%</span>
            <span className="text-[11px] text-emerald-600 font-medium">
              {stats.active}/{stats.total}
            </span>
          </div>
          <div className="mt-1 text-[10px] text-slate-400">
            {stats.expiringSoon} akan berakhir, {stats.expired} berakhir
          </div>
        </div>
      </div>

      {/* Interactive Multi-Filter Bar (Now includes Tahun Terbit and Komoditas) */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <Search className="w-4 h-4 text-emerald-600" />
            <span>Filter Data Dashboard</span>
          </div>
          {(filters.searchQuery ||
            filters.regency ||
            filters.categoryName ||
            filters.computedStatus !== 'ALL' ||
            filters.activityStage ||
            filters.year ||
            filters.commodity) && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Bersihkan Semua Filter</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {/* Search Query */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Cari SK / PT
            </label>
            <input
              type="text"
              placeholder="SK, PT, Komoditas..."
              value={filters.searchQuery || ''}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Regency Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Kabupaten / Kota
            </label>
            <select
              value={filters.regency || ''}
              onChange={(e) => setFilters({ ...filters, regency: e.target.value })}
              className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all cursor-pointer"
            >
              <option value="">Semua Wilayah</option>
              {regencies.map((reg) => (
                <option key={reg} value={reg}>
                  {reg}
                </option>
              ))}
            </select>
          </div>

          {/* License Category */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Kategori Izin
            </label>
            <select
              value={filters.categoryName || ''}
              onChange={(e) => setFilters({ ...filters, categoryName: e.target.value })}
              className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all cursor-pointer"
            >
              <option value="">Semua Kategori</option>
              <option value="IUP">IUP (MBLB & Batuan)</option>
              <option value="IPR">IPR (Rakyat)</option>
              <option value="IUJP">IUJP (Jasa)</option>
            </select>
          </div>

          {/* Computed Status Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Status Izin
            </label>
            <select
              value={filters.computedStatus || 'ALL'}
              onChange={(e) => setFilters({ ...filters, computedStatus: e.target.value as ComputedStatus | 'ALL' })}
              className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="AKTIF">🟢 Aktif</option>
              <option value="AKAN BERAKHIR">🟡 Akan Berakhir</option>
              <option value="BERAKHIR">🔴 Berakhir</option>
            </select>
          </div>

          {/* NEW FILTER: Tahun Terbit */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Tahun Terbit
            </label>
            <select
              value={filters.year || ''}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
              className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all cursor-pointer"
            >
              <option value="">Semua Tahun</option>
              {years.map((yr) => (
                <option key={yr} value={yr}>
                  Tahun {yr}
                </option>
              ))}
            </select>
          </div>

          {/* NEW FILTER: Komoditas */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Komoditas Tambang
            </label>
            <select
              value={filters.commodity || ''}
              onChange={(e) => setFilters({ ...filters, commodity: e.target.value })}
              className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all cursor-pointer"
            >
              <option value="">Semua Komoditas</option>
              {commodities.map((comm) => (
                <option key={comm} value={comm}>
                  {comm}
                </option>
              ))}
            </select>
          </div>

          {/* Tahapan Kegiatan */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Tahapan Kegiatan
            </label>
            <select
              value={filters.activityStage || ''}
              onChange={(e) => setFilters({ ...filters, activityStage: e.target.value })}
              className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all cursor-pointer"
            >
              <option value="">Semua Tahapan</option>
              {stages.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 6 DASHBOARD VISUALIZERS SECTION                                  */}
      {/* ================================================================ */}

      {/* Row 1: Persentase Perizinan Aktif, Status Izin (Pie), Komposisi Jenis Izin (Pie) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Persentase Perizinan Aktif (Circle Gauge) */}
        <PersentaseAktifCircle
          percentage={stats.activePct}
          total={stats.total}
          active={stats.active}
          expiringSoon={stats.expiringSoon}
          expired={stats.expired}
        />

        {/* 2. Status Izin (Pie/Donut Chart) */}
        <StatusPieChart
          active={stats.active}
          expiringSoon={stats.expiringSoon}
          expired={stats.expired}
          total={stats.total}
        />

        {/* 3. Komposisi Jenis Izin (Pie/Donut Chart) */}
        <JenisIzinPieChart
          totalIupMblb={stats.totalIupMblb}
          totalIpr={stats.totalIpr}
          totalIujp={stats.totalIujp}
          total={stats.total}
          granularBreakdown={stats.granularList}
        />
      </div>

      {/* Row 2: Jumlah Izin Per Kabupaten (Vertical Bar Chart) */}
      <div>
        <KabupatenVerticalBarChart
          data={stats.regencyList}
          onSelectRegency={(reg) => {
            setFilters({ ...filters, regency: reg });
          }}
        />
      </div>

      {/* Row 3: Tren Penerbitan Izin Per Tahun & Komoditas Tambang Terbanyak */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 5. Tren Penerbitan Izin Per Tahun (Line & Dot Chart) */}
        <TrenTahunChart
          data={stats.yearList}
          selectedYear={filters.year ? Number(filters.year) : null}
          onSelectYear={(yr) => {
            setFilters({
              ...filters,
              year: filters.year === String(yr) ? '' : String(yr)
            });
          }}
        />

        {/* 6. Komoditas Tambang Terbanyak (Horizontal Bar Chart) */}
        <KomoditasHorizontalBarChart
          data={stats.commodityList}
          totalLicenses={stats.total}
        />
      </div>

      {/* Urgent Alert Table: Daftar Izin Yang Akan Berakhir & Berakhir */}
      <div className="bg-white rounded-xl shadow-sm border border-rose-200 overflow-hidden">
        <div className="bg-gradient-to-r from-rose-50 to-amber-50 px-6 py-4 border-b border-rose-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-950 m-0">
                Daftar Izin Yang Akan Berakhir & Berakhir (Peringatan Dini)
              </h3>
              <p className="text-xs text-rose-700 m-0 mt-0.5">
                Monitoring izin yang kedaluwarsa atau kurang dari 180 hari menuju jatuh tempo.
              </p>
            </div>
          </div>

          <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-200/80 text-rose-900 border border-rose-300">
            {urgentLicenses.length} Izin Memerlukan Atensi
          </span>
        </div>

        {urgentLicenses.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            Tidak ada izin yang berstatus akan berakhir atau berakhir.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Nama Perusahaan</th>
                  <th className="py-3 px-4">Nomor SK</th>
                  <th className="py-3 px-4">Jenis Izin</th>
                  <th className="py-3 px-4">Kabupaten</th>
                  <th className="py-3 px-4">Komoditas</th>
                  <th className="py-3 px-4">Tanggal Berakhir</th>
                  <th className="py-3 px-4">Status & Sisa Hari</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {urgentLicenses.map(({ license, statusInfo }) => (
                  <tr
                    key={license.id}
                    className="hover:bg-rose-50/40 transition-colors cursor-pointer"
                    onClick={() => onSelectLicense(license)}
                  >
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {license.companies?.name || 'Perusahaan tidak tertaut'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {license.sk_number}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {license.license_type?.code || 'IUP'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium">{license.regency}</td>
                    <td className="py-3 px-4 text-slate-600">{license.commodity || '-'}</td>
                    <td className="py-3 px-4 font-medium text-slate-800 font-mono">
                      {license.end_date}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusInfo.badgeClass}`}
                      >
                        {statusInfo.status === 'BERAKHIR' ? (
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                        ) : (
                          <Clock className="w-3 h-3 text-amber-600" />
                        )}
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onSelectLicense(license)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                        title="Lihat Detail Izin"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
