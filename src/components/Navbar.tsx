import {
  LayoutDashboard,
  FileSpreadsheet,
  Building2,
  Layers,
  RefreshCw,
  Lock,
  LogOut,
  Shield,
  Clock
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';

export type ActiveTab = 'dashboard' | 'licenses' | 'companies' | 'types';

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  totalCount: number;
  user: User | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
  lastUpdated?: Date;
}

export const Navbar = ({
  activeTab,
  onSelectTab,
  onRefresh,
  isRefreshing,
  totalCount,
  user,
  onOpenAuth,
  onSignOut,
  lastUpdated
}: NavbarProps) => {
  const formattedUpdate = lastUpdated
    ? new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Jayapura'
      }).format(lastUpdated) + ' WIT'
    : null;

  return (
    <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white shadow-xl border-b border-emerald-800/40">
      {/* Top institution bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between border-b border-slate-700/50 text-xs text-slate-300 gap-2">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="font-semibold tracking-wider uppercase text-emerald-300">
            Pemerintah Provinsi Maluku Utara
          </span>
          <span className="text-slate-500">•</span>
          <span className="hidden sm:inline text-slate-300">Dinas Energi dan Sumber Daya Mineral</span>
        </div>
        <div className="flex items-center gap-3">
          {formattedUpdate && (
            <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] text-slate-300 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700">
              <Clock className="w-3 h-3 text-emerald-400" />
              <span>Update: <strong className="text-white font-mono">{formattedUpdate}</strong></span>
            </span>
          )}

          <span className="bg-emerald-950/80 border border-emerald-700/50 px-2.5 py-0.5 rounded-full text-[11px] font-medium text-emerald-300 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            {totalCount} Izin Terdaftar
          </span>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh data dari Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="text-[11px]">Perbarui</span>
          </button>

          <span className="text-slate-600">|</span>

          {/* Admin Auth Status */}
          {user ? (
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1">
                <Shield className="w-3 h-3 text-emerald-400" />
                <span className="max-w-[120px] truncate" title={user.email}>{user.email}</span>
              </span>
              <button
                onClick={onSignOut}
                className="flex items-center gap-1 text-[11px] text-rose-300 hover:text-rose-200 transition-colors cursor-pointer"
                title="Keluar dari sesi Admin"
              >
                <LogOut className="w-3 h-3" />
                <span>Keluar</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-700/60 hover:bg-emerald-600 text-white text-[11px] font-semibold transition-all border border-emerald-500/30 cursor-pointer shadow-xs"
              title="Masuk sebagai Administrator ESDM untuk mengubah data"
            >
              <Lock className="w-3 h-3 text-emerald-300" />
              <span>Masuk Admin</span>
            </button>
          )}
        </div>
      </div>

      {/* Main app header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* North Maluku Official Emblem */}
            <div className="w-15 h-18 flex items-center justify-center p-1 bg-0 rounded-xl border border-0 shadow-emerald-950/40 backdrop-blur-xs">
              <img
                src="/North_Maluku.svg"
                alt="Lambang Maluku Utara"
                className="w-full h-full object-contain filter drop-shadow-md"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white m-0">
                  SIPERTI MALUT
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950 uppercase tracking-wider">
                  ESDM
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 m-0">
                Sistem Informasi & Dashboard Monitoring Perizinan Pertambangan (IUP • IPR • IUJP)
              </p>
            </div>
          </div>

          {/* Navigation tabs */}
          <nav className="flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-xl border border-slate-700/60 self-start md:self-auto overflow-x-auto max-w-full">
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => onSelectTab('licenses')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'licenses'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Data Izin</span>
            </button>

            <button
              onClick={() => onSelectTab('companies')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'companies'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Perusahaan</span>
            </button>

            <button
              onClick={() => onSelectTab('types')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'types'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Jenis Izin</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
