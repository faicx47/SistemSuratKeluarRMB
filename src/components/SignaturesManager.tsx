import React, { useState, useRef, useEffect } from 'react';
import { PenTool, Check, Trash2, Plus, Edit2, X, Upload, Database, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { SavedSignature } from '../types/letter';
import { StorageService, isDefaultSignature } from '../utils/storage';
import { SupabaseService } from '../utils/supabaseClient';
import { processSignatureImageFile } from '../utils/signatureImageHelper';
import { SignatureCanvasModal } from './SignatureCanvasModal';

interface SignaturesManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const SignaturesManager: React.FC<SignaturesManagerProps> = ({
  isOpen,
  onClose,
  onUpdate,
}) => {
  const [signatures, setSignatures] = useState<SavedSignature[]>(StorageService.getSignatures());
  const [editingSig, setEditingSig] = useState<SavedSignature | null>(null);
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [drawingSig, setDrawingSig] = useState<SavedSignature | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isSavingDb, setIsSavingDb] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetSigId, setUploadTargetSigId] = useState<string | null>(null);

  // Reload latest signatures whenever modal opens or storage updates
  useEffect(() => {
    if (isOpen) {
      setSignatures(StorageService.getSignatures());
      setEditingSig(null);
      setDrawingSig(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleSignaturesChanged = () => {
      setSignatures(StorageService.getSignatures());
    };
    window.addEventListener('signatures-updated', handleSignaturesChanged);
    window.addEventListener('storage', handleSignaturesChanged);
    return () => {
      window.removeEventListener('signatures-updated', handleSignaturesChanged);
      window.removeEventListener('storage', handleSignaturesChanged);
    };
  }, []);

  if (!isOpen) return null;

  const showFeedback = (msg: string) => {
    setFeedbackNotice(msg);
    setTimeout(() => setFeedbackNotice(null), 3500);
  };

  const handleOpenDraw = (sigId: string) => {
    const target = signatures.find((s) => s.id === sigId) || StorageService.getSignatures().find((s) => s.id === sigId);
    if (!target) return;
    setDrawingSig(target);
    setIsCanvasOpen(true);
  };

  const handleTriggerUpload = (sigId: string) => {
    setUploadTargetSigId(sigId);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTargetSigId) return;

    setIsProcessingFile(true);
    try {
      const dataUrl = await processSignatureImageFile(file);
      const target = signatures.find((s) => s.id === uploadTargetSigId) || StorageService.getSignatures().find((s) => s.id === uploadTargetSigId);
      if (!target) return;

      const newSig: SavedSignature = {
        ...target,
        dataUrl,
        updatedAt: new Date().toISOString(),
      };

      // 1. Simpan ke local storage
      StorageService.saveSignature(newSig);

      // 2. Simpan ke database Supabase
      await SupabaseService.saveSignature(newSig);

      // 3. Update state di UI
      const latest = StorageService.getSignatures();
      setSignatures(latest);

      // Jika form ubah data sedang terbuka untuk penandatangan ini, perbarui juga dataUrl di form
      if (editingSig && editingSig.id === uploadTargetSigId) {
        setEditingSig((prev) => (prev ? { ...prev, dataUrl, updatedAt: newSig.updatedAt } : null));
      }

      showFeedback(`✓ Berkas TTD ${newSig.name} berhasil disimpan permanen ke Database!`);
      onUpdate();
    } catch (err: any) {
      alert(err?.message || 'Gagal mengunggah berkas gambar tanda tangan');
    } finally {
      setIsProcessingFile(false);
      setUploadTargetSigId(null);
      if (e.target) e.target.value = '';
    }
  };

  const handleSaveDrawnSignature = async (dataUrl: string) => {
    if (!drawingSig) return;
    setIsSavingDb(true);
    try {
      const newSig: SavedSignature = {
        ...drawingSig,
        dataUrl,
        updatedAt: new Date().toISOString(),
      };

      // 1. Simpan ke Local Storage
      StorageService.saveSignature(newSig);

      // 2. Simpan ke Supabase Database
      await SupabaseService.saveSignature(newSig);

      // 3. Refresh list
      const latest = StorageService.getSignatures();
      setSignatures(latest);

      // Sinkronkan juga jika sedang membuka drawer edit untuk ID ini
      if (editingSig && editingSig.id === drawingSig.id) {
        setEditingSig((prev) => (prev ? { ...prev, dataUrl, updatedAt: newSig.updatedAt } : null));
      }

      showFeedback(`✓ Goresan TTD ${newSig.name} tersimpan rapi & permanen di Database!`);
      onUpdate();
    } catch (err: any) {
      console.warn('Gagal sync TTD ke Supabase:', err);
    } finally {
      setIsSavingDb(false);
      setIsCanvasOpen(false);
      setDrawingSig(null);
    }
  };

  const handleSaveInfo = async (sigToSave: SavedSignature) => {
    setIsSavingDb(true);
    try {
      // Pastikan dataUrl tanda tangan tidak pernah tereset ke default jika pengguna hanya mengedit teks!
      const currentInStorage = StorageService.getSignatures().find((s) => s.id === sigToSave.id);
      const currentInState = signatures.find((s) => s.id === sigToSave.id);
      
      // Pertahankan dataUrl terbaru (prioritaskan dataUrl di form jika ada, atau dataUrl yang sudah tersimpan sebelumnya)
      const preservedDataUrl =
        sigToSave.dataUrl ||
        currentInState?.dataUrl ||
        currentInStorage?.dataUrl ||
        '';

      const updatedSig: SavedSignature = {
        ...sigToSave,
        dataUrl: preservedDataUrl,
        updatedAt: new Date().toISOString(),
      };

      // 1. Simpan ke LocalStorage
      StorageService.saveSignature(updatedSig);

      // 2. Simpan ke Supabase Database
      await SupabaseService.saveSignature(updatedSig);

      // 3. Refresh state
      const latest = StorageService.getSignatures();
      setSignatures(latest);
      setEditingSig(null);

      showFeedback(`✓ Data ${updatedSig.name} (${updatedSig.role}) berhasil diperbarui & tersimpan aman!`);
      onUpdate();
    } catch (err: any) {
      console.warn('Gagal menyimpan info penandatangan:', err);
      showFeedback('Perubahan disimpan di penyimpanan lokal.');
    } finally {
      setIsSavingDb(false);
    }
  };

  const handleAddNew = async () => {
    const newSig: SavedSignature = {
      id: 'sig-' + Date.now(),
      title: 'Tanda Tangan Pengurus',
      role: 'Koordinator Bidang',
      name: 'Nama Pejabat Penandatangan',
      idNumber: 'NTA: 2024.01...',
      dataUrl: '',
      updatedAt: new Date().toISOString(),
    };
    StorageService.saveSignature(newSig);
    await SupabaseService.saveSignature(newSig).catch(() => {});
    const latest = StorageService.getSignatures();
    setSignatures(latest);
    setEditingSig(newSig);
    showFeedback('✓ Pejabat penandatangan baru berhasil ditambahkan!');
    onUpdate();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus data penandatangan ini dari Master?')) return;
    StorageService.deleteSignature(id);
    await SupabaseService.deleteSignature(id).catch(() => {});
    const latest = StorageService.getSignatures();
    setSignatures(latest);
    if (editingSig && editingSig.id === id) {
      setEditingSig(null);
    }
    showFeedback('✓ Penandatangan berhasil dihapus');
    onUpdate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <PenTool className="w-4 h-4 text-emerald-400" />
              Kelola Master Tanda Tangan Digital Remasbara
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Tanda tangan tersimpan permanen di Database Supabase & otomatis sinkron di semua tab tanpa pernah tereset.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden file input for direct signature file uploads */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Feedback Alert */}
        {feedbackNotice && (
          <div className="mx-6 mt-3 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold flex items-center justify-between animate-fadeIn">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" />
              {feedbackNotice}
            </span>
          </div>
        )}

        {/* Content list */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">
                Daftar Penandatangan Terdaftar ({signatures.length}):
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 rounded-full">
                <Database className="w-3 h-3 text-emerald-600" />
                Cloud DB Aktif
              </span>
            </div>
            <button
              type="button"
              onClick={handleAddNew}
              className="text-xs font-medium text-emerald-800 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Penandatangan
            </button>
          </div>

          <div className="space-y-4">
            {signatures.map((sig) => {
              const isDefaultSvg = isDefaultSignature(sig.dataUrl);
              const hasCustomSig = !!sig.dataUrl && !isDefaultSvg;

              return (
                <div
                  key={sig.id}
                  className={`p-4 rounded-xl border transition-all ${
                    editingSig?.id === sig.id
                      ? 'border-blue-400 bg-blue-50/30 ring-2 ring-blue-100'
                      : 'border-slate-200 bg-slate-50'
                  } flex flex-col sm:flex-row items-center justify-between gap-4`}
                >
                  {/* Details */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900">{sig.name}</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">
                        {sig.role}
                      </span>
                      {hasCustomSig ? (
                        <span className="text-[9px] bg-blue-100 text-blue-800 font-semibold px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" /> TTD Kustom Tersimpan
                        </span>
                      ) : isDefaultSvg ? (
                        <span className="text-[9px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                          TTD Default
                        </span>
                      ) : (
                        <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                          Belum Ada TTD
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-mono">{sig.idNumber || '-'}</p>
                    <p className="text-[10px] text-slate-400">
                      ID: {sig.id} • Diperbarui: {sig.updatedAt ? sig.updatedAt.slice(0, 10) : '-'}
                    </p>
                  </div>

                  {/* Signature Preview */}
                  <div className="w-36 h-[50px] max-h-[50px] bg-white border border-slate-200 rounded-lg flex items-center justify-center p-1 relative shadow-2xs overflow-hidden">
                    {sig.dataUrl ? (
                      <img
                        src={sig.dataUrl}
                        alt={sig.name}
                        className="max-h-[50px] h-full w-auto max-w-[130px] object-contain select-none"
                      />
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Belum digores</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleTriggerUpload(sig.id)}
                      disabled={isProcessingFile}
                      className="px-2.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                      title="Unggah berkas PNG/JPG TTD langsung"
                    >
                      <Upload className="w-3 h-3 text-emerald-700" />
                      Unggah
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenDraw(sig.id)}
                      className="px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                      title="Gores langsung di layar"
                    >
                      <PenTool className="w-3 h-3 text-slate-700" />
                      Gores
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        // Pastikan membuka form edit dengan data signature terbaru
                        setEditingSig({ ...sig });
                      }}
                      className="p-1.5 text-slate-600 hover:text-blue-700 rounded-lg cursor-pointer"
                      title="Ubah Data Penandatangan"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {signatures.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDelete(sig.id)}
                        className="p-1.5 text-slate-400 hover:text-red-700 rounded-lg cursor-pointer"
                        title="Hapus Penandatangan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Edit Form Modal Drawer */}
          {editingSig && (
            <div className="mt-4 p-5 border border-blue-200 bg-blue-50/60 rounded-xl space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-blue-100">
                <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Edit2 className="w-3.5 h-3.5 text-blue-700" />
                  Ubah Data Pejabat Penandatangan: <span className="text-blue-900">{editingSig.name}</span>
                </h5>
                <span className="text-[10px] text-blue-700 font-mono">ID: {editingSig.id}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Nama Lengkap:
                  </label>
                  <input
                    type="text"
                    value={editingSig.name}
                    onChange={(e) =>
                      setEditingSig({ ...editingSig, name: e.target.value })
                    }
                    className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-2 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Jabatan:
                  </label>
                  <input
                    type="text"
                    value={editingSig.role}
                    onChange={(e) =>
                      setEditingSig({ ...editingSig, role: e.target.value })
                    }
                    className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    NTA / Nomor Identitas:
                  </label>
                  <input
                    type="text"
                    value={editingSig.idNumber}
                    onChange={(e) =>
                      setEditingSig({ ...editingSig, idNumber: e.target.value })
                    }
                    className="w-full text-xs font-mono bg-white border border-slate-300 rounded px-2.5 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Tanda Tangan Preview & Actions di dalam form edit */}
              <div className="p-3 bg-white border border-blue-200 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-32 h-[50px] max-h-[50px] border border-slate-200 rounded bg-slate-50 flex items-center justify-center p-1 overflow-hidden">
                    {editingSig.dataUrl ? (
                      <img
                        src={editingSig.dataUrl}
                        alt={editingSig.name}
                        className="max-h-[50px] h-full w-auto max-w-[120px] object-contain select-none"
                      />
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Belum ada TTD</span>
                    )}
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-800">
                      Berkas Gambar Tanda Tangan
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {editingSig.dataUrl
                        ? isDefaultSignature(editingSig.dataUrl)
                          ? 'Menggunakan tanda tangan default'
                          : 'Tanda tangan kustom telah tersimpan rapi'
                        : 'Belum ada tanda tangan terpasang'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleTriggerUpload(editingSig.id)}
                    className="px-2.5 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded flex items-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3 h-3 text-emerald-700" />
                    Ganti File
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenDraw(editingSig.id)}
                    className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded flex items-center gap-1 cursor-pointer"
                  >
                    <PenTool className="w-3 h-3 text-slate-700" />
                    Gores Ulang
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1 border-t border-blue-100">
                <button
                  type="button"
                  onClick={() => setEditingSig(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isSavingDb}
                  onClick={() => handleSaveInfo(editingSig)}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSavingDb ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Simpan Perubahan
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <span className="text-xs text-slate-500">
            Perubahan nama, NTA, dan TTD langsung aktif di pembuatan surat berikutnya.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>

      {/* Canvas Modal for Drawing */}
      {isCanvasOpen && drawingSig && (
        <SignatureCanvasModal
          isOpen={isCanvasOpen}
          onClose={() => {
            setIsCanvasOpen(false);
            setDrawingSig(null);
          }}
          onSave={handleSaveDrawnSignature}
          title={`Gores Tanda Tangan: ${drawingSig.name}`}
          signatoryName={drawingSig.name}
          signatoryRole={drawingSig.role}
        />
      )}
    </div>
  );
};
