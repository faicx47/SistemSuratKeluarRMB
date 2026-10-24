import React, { useState, useRef, useEffect } from 'react';
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
  Loader2,
  Cloud,
} from 'lucide-react';
import { OrganizationProfile } from '../types/letter';
import { StorageService } from '../utils/storage';
import { SupabaseService } from '../utils/supabaseClient';
import { processLogoImageFile, processStampImageFile } from '../utils/stampImageHelper';
import { RemasbaraLogo, RemasbaraOfficialStamp } from './RemasbaraVisuals';

interface OrgSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (savedProfile?: OrganizationProfile) => void;
}

export const OrgSettingsModal: React.FC<OrgSettingsModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [profile, setProfile] = useState<OrganizationProfile>(StorageService.getOrgProfile());
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState<boolean>(false);
  const [isUploadingStamp, setIsUploadingStamp] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);

  // Refs untuk menjamin nilai berkas gambar logo dan stempel terbaru selalu tersedia saat submit
  const currentLogoRef = useRef<string | undefined>(profile.logoUrl);
  const currentStampRef = useRef<string | undefined>(profile.defaultStampUrl);
  const hasUserUploadedInSession = useRef<boolean>(false);

  const notifySync = (msg: string) => {
    setSyncNotice(msg);
    setTimeout(() => setSyncNotice(null), 4000);
  };

  // Fetch directly from Supabase table on open to ensure latest cloud profile is displayed
  useEffect(() => {
    if (!isOpen) {
      hasUserUploadedInSession.current = false;
      return;
    }
    let isMounted = true;
    setIsLoadingProfile(true);

    const loadRemoteProfile = async () => {
      try {
        const remote = await SupabaseService.fetchOrgProfile();
        if (remote && isMounted) {
          // Hanya sinkronkan remote jika pengguna belum mengunggah gambar baru di sesi modal ini
          if (!hasUserUploadedInSession.current) {
            setProfile(remote);
            currentLogoRef.current = remote.logoUrl;
            currentStampRef.current = remote.defaultStampUrl;
            StorageService.saveOrgProfile(remote);
          }
        }
      } catch (e) {
        console.warn('Gagal memuat profil organisasi dari Supabase:', e);
      } finally {
        if (isMounted) {
          setIsLoadingProfile(false);
        }
      }
    };

    loadRemoteProfile();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        if (typeof onClose === 'function') {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      isMounted = false;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    hasUserUploadedInSession.current = true;
    try {
      const dataUrl = await processLogoImageFile(file);
      if (!dataUrl) throw new Error('Gagal mengonversi berkas logo');

      // 1. Langsung update ref dan state form organisasi
      currentLogoRef.current = dataUrl;
      setProfile((prev) => ({ ...prev, logoUrl: dataUrl }));

      // 2. Simpan langsung ke Supabase (tabel org_profile kolom emblem_url)
      const res = await SupabaseService.saveOrgLogo(dataUrl);
      if (res.success) {
        notifySync('✓ Logo baru berhasil disimpan ke Cloud Supabase!');
      } else {
        notifySync('⚠ ' + (res.error || 'Gagal menyimpan logo ke Supabase'));
      }
    } catch (err: any) {
      console.error('Logo upload error:', err);
      alert('Gagal memproses gambar logo: ' + (err?.message || err));
    } finally {
      setIsUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleResetToDefaultLogo = async () => {
    setIsUploadingLogo(true);
    hasUserUploadedInSession.current = true;
    try {
      currentLogoRef.current = undefined;
      setProfile((prev) => ({ ...prev, logoUrl: undefined }));
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      await SupabaseService.saveOrgLogo(undefined);
      notifySync('✓ Menggunakan Logo Vektor Resmi Remasbara.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleStampUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingStamp(true);
    hasUserUploadedInSession.current = true;
    try {
      const dataUrl = await processStampImageFile(file);
      if (!dataUrl) throw new Error('Gagal memproses berkas stempel');

      currentStampRef.current = dataUrl;
      setProfile((prev) => ({ ...prev, defaultStampUrl: dataUrl }));

      const res = await SupabaseService.saveActiveCustomStamp('remasbara', dataUrl);
      if (res.success) {
        notifySync('✓ Sampel stempel berhasil disimpan ke Cloud Supabase!');
      } else {
        notifySync('⚠ ' + (res.error || 'Gagal menyimpan stempel ke Supabase'));
      }
    } catch (err: any) {
      console.error('Stamp upload error:', err);
      alert('Gagal memproses gambar stempel: ' + (err?.message || err));
    } finally {
      setIsUploadingStamp(false);
      if (stampInputRef.current) stampInputRef.current.value = '';
    }
  };

  const handleResetToDefaultStamp = async () => {
    setIsUploadingStamp(true);
    hasUserUploadedInSession.current = true;
    try {
      currentStampRef.current = undefined;
      setProfile((prev) => ({ ...prev, defaultStampUrl: undefined }));
      if (stampInputRef.current) {
        stampInputRef.current.value = '';
      }
      await SupabaseService.resetActiveCustomStamp('remasbara');
      notifySync('✓ Kembali menggunakan Stempel Vektor Resmi.');
    } finally {
      setIsUploadingStamp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Pastikan payload Supabase benar-benar menyertakan nilai gambar logo dan stempel terbaru
      const profileToSave: OrganizationProfile = {
        ...profile,
        logoUrl: currentLogoRef.current,
        defaultStampUrl: currentStampRef.current,
      };

      // Simpan langsung ke Supabase menargetkan baris tunggal konsisten
      const saved = await SupabaseService.saveOrgProfile(profileToSave);
      if (!saved) {
        console.warn('Gagal menyimpan profil ke Supabase saat submit');
      }

      // Perbarui state form dan storage tanpa me-reset ke nilai lama
      StorageService.saveOrgProfile(profileToSave);
      setProfile(profileToSave);

      try {
        window.dispatchEvent(new CustomEvent('org-profile-updated', { detail: profileToSave }));
      } catch {}

      if (typeof onSaved === 'function') {
        onSaved(profileToSave);
      }
      onClose();
    } catch (err: any) {
      console.error('Gagal simpan profil ke Supabase:', err);
      const fallbackProfile: OrganizationProfile = {
        ...profile,
        logoUrl: currentLogoRef.current,
        defaultStampUrl: currentStampRef.current,
      };
      if (typeof onSaved === 'function') {
        onSaved(fallbackProfile);
      }
      onClose();
    } finally {
      setIsSaving(false);
    }
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
          {/* Cloud Sync Notice Banner */}
          {syncNotice && (
            <div className="bg-emerald-600 text-white rounded-xl p-3 text-xs font-semibold flex items-center justify-between shadow-md animate-fadeIn">
              <span className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-emerald-200" />
                {syncNotice}
              </span>
              <span className="text-[10px] bg-emerald-700 px-2 py-0.5 rounded font-mono">
                SUPABASE ✓
              </span>
            </div>
          )}

          {/* Logo Section */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <label className="block text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-700" />
                Logo Organisasi (Kop Surat & Header)
              </span>
              <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Cloud className="w-3 h-3 text-emerald-700" />
                Sinkron Cloud
              </span>
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-20 h-20 bg-white border border-slate-200 rounded-lg p-1.5 flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
                {isLoadingProfile ? (
                  <div className="flex flex-col items-center justify-center gap-1 text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                    <span className="text-[9px] font-medium">Cloud...</span>
                  </div>
                ) : profile.logoUrl ? (
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
                    {isLoadingProfile
                      ? 'Memuat data logo...'
                      : profile.logoUrl
                      ? 'Logo Kustom Aktif (Cloud Supabase)'
                      : 'Logo Vektor Resmi Remasbara'}
                  </span>
                  {!isLoadingProfile && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Format disarankan: PNG transparan, SVG, atau JPG. Logo ini otomatis disinkronkan ke Supabase dan dicetak di Kop Surat A4 pada semua PC.
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
                    disabled={isUploadingLogo || isLoadingProfile}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    {isUploadingLogo ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Menyimpan ke Cloud...
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        Unggah Logo Gambar
                      </>
                    )}
                  </button>

                  {!isLoadingProfile && profile.logoUrl && (
                    <button
                      type="button"
                      disabled={isUploadingLogo}
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
            <label className="block text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-700" />
                Sampel Stempel Resmi Organisasi (Default)
              </span>
              <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Cloud className="w-3 h-3 text-emerald-700" />
                Sinkron Cloud
              </span>
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-20 h-20 bg-white border border-slate-200 rounded-lg p-1.5 flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
                {isLoadingProfile ? (
                  <div className="flex flex-col items-center justify-center gap-1 text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                    <span className="text-[9px] font-medium">Cloud...</span>
                  </div>
                ) : profile.defaultStampUrl ? (
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
                    {isLoadingProfile
                      ? 'Memuat data stempel...'
                      : profile.defaultStampUrl
                      ? 'Sampel Stempel Kustom Aktif (Cloud Supabase)'
                      : 'Stempel Vektor Resmi Remasbara'}
                  </span>
                  {!isLoadingProfile && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Unggah berkas sampel stempel cap basah (PNG transparan/JPG) untuk disimpan permanen di database Supabase dan dipakai otomatis di sebelah kiri tanda tangan.
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
                    disabled={isUploadingStamp || isLoadingProfile}
                    onClick={() => stampInputRef.current?.click()}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    {isUploadingStamp ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Menyimpan ke Cloud...
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        Unggah Sampel Stempel
                      </>
                    )}
                  </button>

                  {!isLoadingProfile && profile.defaultStampUrl && (
                    <button
                      type="button"
                      disabled={isUploadingStamp}
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
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Menyimpan ke Cloud...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Profil</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
