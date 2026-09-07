export interface Company {
  id: string;
  created_at?: string;
  name: string;
  address: string | null;
}

export interface LicenseType {
  id: string;
  created_at?: string;
  code: string;
  category_name: string;
}

export interface License {
  id: string;
  created_at?: string;
  company_id: string;
  license_type_id: string;
  sk_number: string;
  province: string;
  regency: string;
  area_ha: number | null;
  activity_stage: string | null;
  start_date: string;
  end_date: string;
  status: boolean;
  issued_year: number;
  commodity: string | null;
}

export interface LicenseWithRelations extends License {
  companies: Company | null;
  license_type: LicenseType | null;
}

export type ComputedStatus = 'AKTIF' | 'AKAN BERAKHIR' | 'BERAKHIR';

export interface LicenseStatusInfo {
  status: ComputedStatus;
  daysRemaining: number;
  label: string;
  badgeClass: string;
}

export function computeLicenseStatus(endDateStr: string, activeBool: boolean): LicenseStatusInfo {
  if (!activeBool) {
    return {
      status: 'BERAKHIR',
      daysRemaining: -1,
      label: 'Tidak Aktif / Dicabut',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-200'
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const end = new Date(endDateStr);
  end.setHours(0, 0, 0, 0);

  const diffTime = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: 'BERAKHIR',
      daysRemaining: diffDays,
      label: `Berakhir (${Math.abs(diffDays)} hari lalu)`,
      badgeClass: 'bg-red-100 text-red-700 border-red-200'
    };
  }

  if (diffDays <= 180) {
    return {
      status: 'AKAN BERAKHIR',
      daysRemaining: diffDays,
      label: `Akan Berakhir (${diffDays} hari lagi)`,
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300'
    };
  }

  return {
    status: 'AKTIF',
    daysRemaining: diffDays,
    label: `Aktif (${diffDays} hari)`,
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  };
}

export interface DashboardStats {
  totalLicenses: number;
  totalIupMblb: number;
  totalIpr: number;
  totalIujp: number;
  totalAreaHa: number;
  totalCompanies: number;
  activeCount: number;
  expiringSoonCount: number;
  expiredCount: number;
  activePercentage: number;
  byRegency: { name: string; count: number; area: number }[];
  byCategory: { name: string; count: number }[];
  byStage: { name: string; count: number }[];
  byCommodity: { name: string; count: number }[];
}

export interface LicenseFilters {
  searchQuery?: string;
  regency?: string;
  licenseTypeCode?: string;
  categoryName?: string;
  computedStatus?: ComputedStatus | 'ALL';
  activityStage?: string;
  year?: number | string;
  commodity?: string;
}

