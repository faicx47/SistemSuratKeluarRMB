import React, { useState } from 'react';
import { PenTool, Check, Trash2, Plus, Edit2, ShieldCheck, X } from 'lucide-react';
import { SavedSignature } from '../types/letter';
import { StorageService } from '../utils/storage';
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
  const [targetSigId, setTargetSigId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleOpenDraw = (sigId: string) => {
    setTargetSigId(sigId);
    const target = signatures.find((s) => s.id === sigId);
    if (target) {
      setEditingSig(target);
    }
    setIsCanvasOpen(true);
  };

  const handleSaveDrawnSignature = (dataUrl: string) => {
    if (!targetSigId) return;
    const updated = signatures.map((s) => {
      if (s.id === targetSigId) {
        return { ...s, dataUrl, updatedAt: new Date().toISOString().slice(0, 10) };
      }
      return s;
    });
    setSignatures(updated);
    updated.forEach((s) => StorageService.saveSignature(s));
    onUpdate();
  };

  const handleSaveInfo = (sig: SavedSignature) => {
    StorageService.saveSignature(sig);
    setSignatures(StorageService.getSignatures());
    setEditingSig(null);
    onUpdate();
  };

  const handleAddNew = () => {
    const newSig: SavedSignature = {
      id: 'sig-' + Date.now(),
      title: 'Tanda Tangan Pengurus',
      role: 'Koordinator Divisi',
      name: 'Nama Pengurus',
      idNumber: 'NTA: 2024.01...',
      dataUrl: '',
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    StorageService.saveSignature(newSig);
    setSignatures(StorageService.getSignatures());
    setEditingSig(newSig);
    onUpdate();
  };

  const handleDelete = (id: string) => {
    StorageService.deleteSignature(id);
    setSignatures(StorageService.getSignatures());
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
              Tanda tangan tersimpan untuk memudahkan pengesahan surat keluar sewaktu-waktu.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-700">
              Daftar Penandatangan Terdaftar ({signatures.length}):
            </span>
            <button
              type="button"
              onClick={handleAddNew}
              className="text-xs font-medium text-emerald-800 hover:text-emerald-900 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Penandatangan
            </button>
          </div>

          <div className="space-y-4">
            {signatures.map((sig) => (
              <div
                key={sig.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                {/* Details */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{sig.name}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">
                      {sig.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono">{sig.idNumber || '-'}</p>
                  <p className="text-[10px] text-slate-400">
                    Diperbarui: {sig.updatedAt}
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
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenDraw(sig.id)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <PenTool className="w-3 h-3 text-emerald-700" />
                    Gores
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingSig(sig)}
                    className="p-1.5 text-slate-600 hover:text-blue-700 rounded-lg"
                    title="Ubah Data"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {signatures.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDelete(sig.id)}
                      className="p-1.5 text-slate-400 hover:text-red-700 rounded-lg"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Edit Form Modal Drawer */}
          {editingSig && (
            <div className="mt-4 p-4 border border-blue-200 bg-blue-50/50 rounded-xl space-y-3">
              <h5 className="text-xs font-bold text-slate-900">Ubah Data Penandatangan</h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Nama Lengkap:
                  </label>
                  <input
                    type="text"
                    value={editingSig.name}
                    onChange={(e) =>
                      setEditingSig({ ...editingSig, name: e.target.value })
                    }
                    className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Jabatan:
                  </label>
                  <input
                    type="text"
                    value={editingSig.role}
                    onChange={(e) =>
                      setEditingSig({ ...editingSig, role: e.target.value })
                    }
                    className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    NTA / Nomor Identitas:
                  </label>
                  <input
                    type="text"
                    value={editingSig.idNumber}
                    onChange={(e) =>
                      setEditingSig({ ...editingSig, idNumber: e.target.value })
                    }
                    className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingSig(null)}
                  className="px-3 py-1 text-xs text-slate-600 hover:text-slate-900"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveInfo(editingSig)}
                  className="px-3 py-1 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
          >
            Selesai
          </button>
        </div>
      </div>

      {/* Canvas Modal for Drawing */}
      {isCanvasOpen && (
        <SignatureCanvasModal
          isOpen={isCanvasOpen}
          onClose={() => setIsCanvasOpen(false)}
          onSave={handleSaveDrawnSignature}
          title={`Gores Tanda Tangan: ${editingSig?.name || ''}`}
          signatoryName={editingSig?.name}
          signatoryRole={editingSig?.role}
        />
      )}
    </div>
  );
};
