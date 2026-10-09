import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  RotateCcw,
  Check,
  Sparkles,
  ShieldCheck,
  Palette,
  Layers,
  Trash2,
  Plus,
} from 'lucide-react';
import { SavedStamp } from '../types/letter';
import { StorageService } from '../utils/storage';
import { SupabaseService } from '../utils/supabaseClient';
import {
  RemasbaraOfficialStamp,
  KemasjidanOfficialStamp,
  YayasanOfficialStamp,
} from './RemasbaraVisuals';

interface StampsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

const STAMP_COLORS: { id: SavedStamp['color']; name: string; hex: string }[] = [
  { id: 'red', name: 'Merah Resmi', hex: '#b91c1c' },
  { id: 'emerald', name: 'Hijau Zamrud', hex: '#047857' },
  { id: 'blue', name: 'Biru Dokumen', hex: '#1d4ed8' },
  { id: 'purple', name: 'Ungu Arsip', hex: '#7e22ce' },
];

export const StampsManagerModal: React.FC<StampsManagerModalProps> = ({
  isOpen,
  onClose,
  onUpdate,
}) => {
  const [stamps, setStamps] = useState<SavedStamp[]>(StorageService.getStamps());
  const [selectedStampId, setSelectedStampId] = useState<string>('stamp-remasbara');
  const [savedFeedback, setSavedFeedback] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const activeStamp = stamps.find((s) => s.id === selectedStampId) || stamps[0];

  const handleUpdateActiveStamp = (updates: Partial<SavedStamp>) => {
    if (!activeStamp) return;
    const updated: SavedStamp = {
      ...activeStamp,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const newStamps = stamps.map((s) => (s.id === updated.id ? updated : s));
    setStamps(newStamps);
    StorageService.saveStamp(updated);
    SupabaseService.saveStamp(updated).catch(() => {});

    // If it's one of the primary org stamps, also update orgProfile defaults
    const org = StorageService.getOrgProfile();
    let orgChanged = false;
    if (updated.id === 'stamp-remasbara') {
      org.defaultStampUrl = updated.imageUrl;
      orgChanged = true;
    } else if (updated.id === 'stamp-kemasjidan') {
      org.defaultKemasjidanStampUrl = updated.imageUrl;
      orgChanged = true;
    } else if (updated.id === 'stamp-yayasan') {
      org.defaultYayasanStampUrl = updated.imageUrl;
      orgChanged = true;
    }
    if (orgChanged) {
      StorageService.saveOrgProfile(org);
      SupabaseService.saveOrgProfile(org).catch(() => {});
    }

    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
    if (onUpdate) onUpdate();
  };

  const handleUploadSample = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        handleUpdateActiveStamp({ imageUrl: dataUrl });
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetToVector = () => {
    handleUpdateActiveStamp({ imageUrl: undefined });
  };

  const handleAddNewCustomStamp = () => {
    const newId = 'stamp-' + Date.now().toString(36);
    const newStamp: SavedStamp = {
      id: newId,
      category: 'custom',
      title: 'Stempel Panitia Khusus',
      organization: 'REMASBARA Baiturrahman',
      color: 'red',
      opacity: 0.92,
      updatedAt: new Date().toISOString(),
    };
    const updated = [...stamps, newStamp];
    setStamps(updated);
    StorageService.saveStamp(newStamp);
    SupabaseService.saveStamp(newStamp).catch(() => {});
    setSelectedStampId(newId);
  };

  const handleDeleteStamp = (id: string) => {
    if (['stamp-remasbara', 'stamp-kemasjidan', 'stamp-yayasan'].includes(id)) {
      alert('Stempel resmi organisasi utama tidak dapat dihapus.');
      return;
    }
    const updated = stamps.filter((s) => s.id !== id);
    setStamps(updated);
    StorageService.deleteStamp(id);
    SupabaseService.deleteStamp(id).catch(() => {});
    setSelectedStampId(updated[0]?.id || 'stamp-remasbara');
  };

  const renderStampPreview = (stamp: SavedStamp) => {
    if (stamp.imageUrl) {
      return (
        <img
          src={stamp.imageUrl}
          alt={stamp.title}
          style={{ opacity: stamp.opacity }}
          className="w-36 h-36 object-contain transform -rotate-6 select-none"
        />
      );
    }

    if (stamp.category === 'kemasjidan') {
      return (
        <KemasjidanOfficialStamp
          color={stamp.color}
          opacity={stamp.opacity}
          size={140}
        />
      );
    }

    if (stamp.category === 'yayasan') {
      return (
        <YayasanOfficialStamp
          color={stamp.color}
          opacity={stamp.opacity}
          size={140}
        />
      );
    }

    return (
      <RemasbaraOfficialStamp
        color={stamp.color}
        opacity={stamp.opacity}
        size={140}
      />
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-red-950 via-slate-900 to-emerald-950 text-white shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-400/30 flex items-center justify-center text-red-300 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">
                    Master Database Stempel Resmi
                  </h3>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    Supabase Cloud Sync
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Kelola stempel cap basah resmi REMASBARA, Kemasjidan, Yayasan, dan panitia khusus.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Pill Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 mt-4 pt-2 border-t border-white/10 overflow-x-auto">
            {stamps.map((stamp) => (
              <button
                key={stamp.id}
                type="button"
                onClick={() => setSelectedStampId(stamp.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  selectedStampId === stamp.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {stamp.title}
              </button>
            ))}

            <button
              type="button"
              onClick={handleAddNewCustomStamp}
              className="px-2.5 py-1 text-xs font-medium text-emerald-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg flex items-center gap-1 transition-colors"
              title="Tambah Stempel Baru"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Stempel Baru</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeStamp && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Visual Preview Box */}
              <div className="md:col-span-5 flex flex-col items-center">
                <div className="w-full h-60 border-2 border-dashed border-slate-300 rounded-2xl bg-radial from-slate-50 to-slate-100 flex items-center justify-center p-4 relative shadow-inner">
                  {renderStampPreview(activeStamp)}

                  {activeStamp.imageUrl && (
                    <span className="absolute bottom-2 left-2 text-[10px] bg-black/60 text-white px-2 py-0.5 rounded font-medium">
                      Sampel Berkas Unggahan
                    </span>
                  )}
                </div>

                <div className="flex gap-2 w-full mt-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleUploadSample}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{activeStamp.imageUrl ? 'Ganti Sampel' : 'Unggah Sampel Cap'}</span>
                  </button>

                  {activeStamp.imageUrl && (
                    <button
                      type="button"
                      onClick={handleResetToVector}
                      className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl flex items-center gap-1 transition-colors"
                      title="Kembali ke Vektor Resmi"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Vektor</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Settings Configuration */}
              <div className="md:col-span-7 space-y-4">
                {/* Title and Org Input */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama / Judul Stempel:
                    </label>
                    <input
                      type="text"
                      value={activeStamp.title}
                      onChange={(e) => handleUpdateActiveStamp({ title: e.target.value })}
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-semibold focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Institusi / Bidang:
                    </label>
                    <input
                      type="text"
                      value={activeStamp.organization}
                      onChange={(e) => handleUpdateActiveStamp({ organization: e.target.value })}
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
                    />
                  </div>
                </div>

                {/* Ink Color Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-slate-500" />
                    <span>Warna Tinta Stempel:</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {STAMP_COLORS.map((color) => (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => handleUpdateActiveStamp({ color: color.id })}
                        className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-2 transition-all ${
                          activeStamp.color === color.id
                            ? 'border-slate-900 bg-slate-50 font-bold shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: color.hex }}
                        />
                        <span className="text-[11px] truncate">{color.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Opacity Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-500" />
                      Kepekatan Tinta Stempel (Opacity):
                    </span>
                    <span className="font-mono text-emerald-700">
                      {Math.round(activeStamp.opacity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.0"
                    step="0.02"
                    value={activeStamp.opacity}
                    onChange={(e) => handleUpdateActiveStamp({ opacity: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-700 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>50% (Halus)</span>
                    <span>92% (Standar Cap Basah)</span>
                    <span>100% (Solid)</span>
                  </div>
                </div>

                {/* Delete button if custom */}
                {activeStamp.category === 'custom' && (
                  <div className="pt-2 border-t border-slate-100 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleDeleteStamp(activeStamp.id)}
                      className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Stempel Kustom Ini</span>
                    </button>
                  </div>
                )}

                {savedFeedback && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Perubahan stempel berhasil disimpan & disinkronkan ke Supabase!</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            Tersimpan di tabel <strong>public.stamps</strong> database Supabase.
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg shadow-2xs hover:bg-slate-100 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
