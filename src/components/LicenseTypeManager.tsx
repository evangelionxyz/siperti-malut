import { Layers, ShieldCheck, FileCheck2, ArrowRight } from 'lucide-react';
import type { LicenseType, LicenseWithRelations } from '../types/database';

interface LicenseTypeManagerProps {
  licenseTypes: LicenseType[];
  licenses: LicenseWithRelations[];
  onSelectCategory: (category: string) => void;
}

export const LicenseTypeManager: React.FC<LicenseTypeManagerProps> = ({
  licenseTypes,
  licenses,
  onSelectCategory
}) => {
  // Description map for each permit type
  const descriptions: Record<string, { desc: string; authority: string; characteristic: string }> = {
    SIPB: {
      desc: 'Surat Izin Penambangan Batuan diberikan untuk melaksanakan kegiatan penambangan batuan jenis tertentu atau untuk keperluan tertentu dengan luas wilayah terbatas.',
      authority: 'Pemerintah Daerah Provinsi / DPMPTSP',
      characteristic: 'Batuan, Sirtu, Pasir, Batu Bangunan (Skala Kecil)'
    },
    'IUP BATUAN': {
      desc: 'Izin Usaha Pertambangan untuk komoditas batuan (quarry) yang meliputi tahap eksplorasi dan/atau operasi produksi.',
      authority: 'Pemerintah Provinsi / Kementerian ESDM',
      characteristic: 'Batu Gunung, Gabro, Andesit, Tuff'
    },
    'IUP MINERAL BUKAN LOGAM': {
      desc: 'Izin untuk usaha pertambangan komoditas mineral bukan logam seperti batugamping, tanah diatome, bentonit, zeolit, kalsit, dll.',
      authority: 'Pemerintah Provinsi / Kementerian ESDM',
      characteristic: 'Batugamping, Tanah Diatome, Feldspar'
    },
    'IUP MINERAL BUKAN LOGAM JENIS TERTENTU': {
      desc: 'Izin untuk usaha pertambangan mineral bukan logam jenis tertentu untuk bahan baku semen dan industri strategis lainnya.',
      authority: 'Kementerian ESDM / Pemerintah Provinsi',
      characteristic: 'Batugamping untuk Industri Semen & Smelter'
    },
    IPR: {
      desc: 'Izin Pertambangan Rakyat diberikan kepada orang perseorangan setempat atau koperasi setempat untuk melaksanakan usaha pertambangan dalam Wilayah Pertambangan Rakyat (WPR).',
      authority: 'Pemerintah Provinsi (Gubernur)',
      characteristic: 'Maksimal 5 HA perorangan / 10 HA koperasi (Emas, dsb)'
    },
    IUJP: {
      desc: 'Izin Usaha Jasa Pertambangan diberikan kepada badan usaha untuk melakukan kegiatan usaha jasa pertambangan inti atau penunjang.',
      authority: 'Kementerian ESDM / Pemerintah Provinsi',
      characteristic: 'Jasa konsultasi, survei, pengupasan, penggalian, pengangkutan'
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-1">
          <Layers className="w-4 h-4" />
          <span>Regulasi & Nomenklatur Perizinan</span>
        </div>
        <h2 className="text-lg font-bold text-slate-900 m-0">
          Referensi Jenis Izin Pertambangan (UU Minerba)
        </h2>
        <p className="text-xs text-slate-500 m-0 mt-0.5">
          Klasifikasi perizinan sektor pertambangan yang dikelola oleh Dinas ESDM Provinsi Maluku Utara.
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {licenseTypes.map((type) => {
          const count = licenses.filter((l) => l.license_type_id === type.id).length;
          const info = descriptions[type.code] || {
            desc: 'Kategori perizinan pertambangan resmi.',
            authority: 'Pemerintah Provinsi Maluku Utara',
            characteristic: 'Mineral & Batuan'
          };

          return (
            <div
              key={type.id}
              className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:border-emerald-500 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                      {type.category_name}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1.5 m-0">{type.code}</h3>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    {count} Izin
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {info.desc}
                </p>

                <div className="space-y-2 text-xs pt-3 border-t border-slate-100">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">Kewenangan Penerbitan:</span>
                      <span className="font-semibold text-slate-700">{info.authority}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <FileCheck2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">Karakteristik & Komoditas:</span>
                      <span className="font-semibold text-slate-700">{info.characteristic}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100">
                <button
                  onClick={() => onSelectCategory(type.code)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-50 hover:bg-emerald-50 text-emerald-700 font-semibold text-xs transition-colors cursor-pointer border border-slate-200 hover:border-emerald-300"
                >
                  <span>Lihat {count} Izin Terkait</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
