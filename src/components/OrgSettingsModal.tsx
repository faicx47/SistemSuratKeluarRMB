import React, { useState, useRef } from 'react';
import {
  Building2,
  Save,
  X,
  MapPin,
  Phone,
  Mail,
  Instagram,
  Upload,
  RotateCcw,
  ImageIcon,
  CheckCircle2,
  Award,
} from 'lucide-react';
import { OrganizationProfile } from '../types/letter';
import { StorageService } from '../utils/storage';
import { RemasbaraLogo, RemasbaraOfficialStamp } from './RemasbaraVisuals';

interface OrgSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const OrgSettingsModal: React.FC<OrgSettingsModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [profile, setProfile] = useState<OrganizationProfile>(StorageService.getOrgProfile());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setProfile((prev) => ({ ...prev, logoUrl: dataUrl }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetToDefaultLogo = () => {
    setProfile((prev) => ({ ...prev, logoUrl: undefined }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleStampUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setProfile((prev) => ({ ...prev, defaultStampUrl: dataUrl }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetToDefaultStamp = () => {
    setProfile((prev) => ({ ...prev, defaultStampUrl: undefined }));
    if (stampInputRef.current) {
      stampInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveOrgProfile(profile);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-400" />
              Profil Organisasi & Kop Surat
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Identitas resmi Remasbara yang dicantumkan pada setiap surat keluar.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* Logo Section */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <label className="block text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-emerald-700" />
              Logo Organisasi (Kop Surat & Header)
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-20 h-20 bg-white border border-slate-200 rounded-lg p-1.5 flex items-center justify-center shadow-xs shrink-0">
                {profile.logoUrl ? (
                  <img
                    src={profile.logoUrl}
                    alt="Logo Pratinjau"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <RemasbaraLogo size={68} />
                )}
              </div>

              <div className="flex-1 space-y-2 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-1.5">
                  <span className="text-xs font-semibold text-slate-800">
                    {profile.logoUrl ? 'Logo Kustom Aktif' : 'Logo Vektor Resmi Remasbara'}
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Format disarankan: PNG transparan, SVG, atau JPG. Logo ini akan dicetak otomatis di Kop Surat A4.
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-file-input"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Unggah Logo Gambar
                  </button>

                  {profile.logoUrl && (
                    <button
                      type="button"
                      onClick={handleResetToDefaultLogo}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                      Gunakan Logo Vektor Remasbara
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Master Stempel Section */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <label className="block text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-700" />
              Sampel Stempel Resmi Organisasi (Default)
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-20 h-20 bg-white border border-slate-200 rounded-lg p-1.5 flex items-center justify-center shadow-xs shrink-0">
                {profile.defaultStampUrl ? (
                  <img
                    src={profile.defaultStampUrl}
                    alt="Sampel Stempel Default"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <RemasbaraOfficialStamp size={68} />
                )}
              </div>

              <div className="flex-1 space-y-2 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-1.5">
                  <span className="text-xs font-semibold text-slate-800">
                    {profile.defaultStampUrl ? 'Sampel Stempel Kustom Aktif' : 'Stempel Vektor Resmi Remasbara'}
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Unggah berkas sampel stempel cap basah (PNG transparan/JPG) untuk dipakai otomatis di sebelah kiri tanda tangan.
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <input
                    type="file"
                    ref={stampInputRef}
                    accept="image/*"
                    onChange={handleStampUpload}
                    className="hidden"
                    id="stamp-file-input"
                  />
                  <button
                    type="button"
                    onClick={() => stampInputRef.current?.click()}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Unggah Sampel Stempel
                  </button>

                  {profile.defaultStampUrl && (
                    <button
                      type="button"
                      onClick={handleResetToDefaultStamp}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                      Gunakan Stempel Resmi Bawaan
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Singkatan Nama Organisasi:
              </label>
              <input
                type="text"
                required
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Lengkap Organisasi:
              </label>
              <input
                type="text"
                required
                value={profile.subName}
                onChange={(e) => setProfile({ ...profile, subName: e.target.value })}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Basis Masjid:
              </label>
              <input
                type="text"
                required
                value={profile.mosqueName}
                onChange={(e) => setProfile({ ...profile, mosqueName: e.target.value })}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Sekretariat:
              </label>
              <input
                type="text"
                required
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kelurahan:
              </label>
              <input
                type="text"
                value={profile.kelurahan}
                onChange={(e) => setProfile({ ...profile, kelurahan: e.target.value })}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kecamatan:
              </label>
              <input
                type="text"
                value={profile.kecamatan}
                onChange={(e) => setProfile({ ...profile, kecamatan: e.target.value })}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kota / Kabupaten:
              </label>
              <input
                type="text"
                value={profile.city}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kode Pos:
              </label>
              <input
                type="text"
                value={profile.postalCode}
                onChange={(e) => setProfile({ ...profile, postalCode: e.target.value })}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Telepon / WhatsApp:
              </label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Surel / Email:
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Instagram:
              </label>
              <input
                type="text"
                value={profile.instagram}
                onChange={(e) => setProfile({ ...profile, instagram: e.target.value })}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kode Penomoran Organisasi:
              </label>
              <input
                type="text"
                required
                value={profile.codeIdentifier}
                onChange={(e) => setProfile({ ...profile, codeIdentifier: e.target.value })}
                className="w-full text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg px-3 py-2"
              />
              <span className="text-[10px] text-slate-400">Dipakai pada nomor surat (misal: RMB)</span>
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              Simpan Profil
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
