import { supabase } from '../utils/supabase';
import type {
  Company,
  License,
  LicenseType,
  LicenseWithRelations,
  DashboardStats
} from '../types/database';
import { computeLicenseStatus } from '../types/database';

export const licenseService = {
  // --- LICENSES ---
  async getLicenses(): Promise<LicenseWithRelations[]> {
    const { data, error } = await supabase
      .from('licenses')
      .select('*, companies(*), license_type(*)')
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Error fetching licenses:', error);
      throw error;
    }
    return (data || []) as LicenseWithRelations[];
  },

  async createLicense(license: Omit<License, 'id' | 'created_at'>): Promise<License> {
    const { data, error } = await supabase
      .from('licenses')
      .insert([license])
      .select()
      .single();

    if (error) {
      console.error('Error creating license:', error);
      throw error;
    }
    return data as License;
  },

  async updateLicense(id: string, updates: Partial<Omit<License, 'id' | 'created_at'>>): Promise<License> {
    const { data, error } = await supabase
      .from('licenses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating license:', error);
      throw error;
    }
    return data as License;
  },

  async deleteLicense(id: string): Promise<void> {
    const { error } = await supabase
      .from('licenses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting license:', error);
      throw error;
    }
  },

  // --- COMPANIES ---
  async getCompanies(): Promise<Company[]> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching companies:', error);
      throw error;
    }
    return (data || []) as Company[];
  },

  async createCompany(company: { name: string; address?: string | null }): Promise<Company> {
    const { data, error } = await supabase
      .from('companies')
      .insert([company])
      .select()
      .single();

    if (error) {
      console.error('Error creating company:', error);
      throw error;
    }
    return data as Company;
  },

  async updateCompany(id: string, updates: { name?: string; address?: string | null }): Promise<Company> {
    const { data, error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating company:', error);
      throw error;
    }
    return data as Company;
  },

  async deleteCompany(id: string): Promise<void> {
    // Check if company has active licenses
    const { count, error: countErr } = await supabase
      .from('licenses')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', id);

    if (countErr) throw countErr;
    if (count && count > 0) {
      throw new Error(`Perusahaan tidak dapat dihapus karena masih memiliki ${count} izin tertaut.`);
    }

    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting company:', error);
      throw error;
    }
  },

  // --- LICENSE TYPES ---
  async getLicenseTypes(): Promise<LicenseType[]> {
    const { data, error } = await supabase
      .from('license_type')
      .select('*')
      .order('category_name', { ascending: true });

    if (error) {
      console.error('Error fetching license types:', error);
      throw error;
    }
    return (data || []) as LicenseType[];
  },

  // --- STATS CALCULATION HELPER ---
  computeStats(licenses: LicenseWithRelations[], totalUniqueCompanies: number): DashboardStats {
    let totalIupMblb = 0;
    let totalIpr = 0;
    let totalIujp = 0;
    let totalAreaHa = 0;
    let activeCount = 0;
    let expiringSoonCount = 0;
    let expiredCount = 0;

    const regencyMap: Record<string, { count: number; area: number }> = {};
    const categoryMap: Record<string, number> = {};
    const stageMap: Record<string, number> = {};
    const commodityMap: Record<string, number> = {};

    for (const lic of licenses) {
      const code = lic.license_type?.code || '';
      const cat = lic.license_type?.category_name || '';
      const statusInfo = computeLicenseStatus(lic.end_date, lic.status);

      if (statusInfo.status === 'AKTIF') {
        activeCount++;
      } else if (statusInfo.status === 'AKAN BERAKHIR') {
        expiringSoonCount++;
      } else {
        expiredCount++;
      }

      // Check category counts
      if (code === 'IPR' || cat === 'IPR') {
        totalIpr++;
      } else if (code === 'IUJP' || cat === 'IUJP') {
        totalIujp++;
      } else {
        // SIPB, IUP BATUAN, IUP MINERAL BUKAN LOGAM, etc.
        totalIupMblb++;
      }

      // Area sum
      if (lic.area_ha) {
        totalAreaHa += Number(lic.area_ha);
      }

      // Groupings
      const reg = lic.regency || 'Lainnya';
      if (!regencyMap[reg]) regencyMap[reg] = { count: 0, area: 0 };
      regencyMap[reg].count++;
      if (lic.area_ha) regencyMap[reg].area += Number(lic.area_ha);

      const categoryLabel = cat || 'Lainnya';
      categoryMap[categoryLabel] = (categoryMap[categoryLabel] || 0) + 1;

      if (lic.activity_stage) {
        stageMap[lic.activity_stage] = (stageMap[lic.activity_stage] || 0) + 1;
      }

      if (lic.commodity) {
        commodityMap[lic.commodity] = (commodityMap[lic.commodity] || 0) + 1;
      }
    }

    const totalLicenses = licenses.length;
    const activePercentage = totalLicenses > 0 ? (activeCount / totalLicenses) * 100 : 0;

    return {
      totalLicenses,
      totalIupMblb,
      totalIpr,
      totalIujp,
      totalAreaHa: Math.round(totalAreaHa * 100) / 100,
      totalCompanies: totalUniqueCompanies,
      activeCount,
      expiringSoonCount,
      expiredCount,
      activePercentage: Math.round(activePercentage * 10) / 10,
      byRegency: Object.entries(regencyMap)
        .map(([name, val]) => ({ name, count: val.count, area: Math.round(val.area * 100) / 100 }))
        .sort((a, b) => b.count - a.count),
      byCategory: Object.entries(categoryMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      byStage: Object.entries(stageMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      byCommodity: Object.entries(commodityMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    };
  }
};
