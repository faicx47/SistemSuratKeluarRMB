import React, { useState } from 'react';
import { ShieldCheck, Search, CheckCircle, AlertCircle, X, ExternalLink, Calendar, User, Award } from 'lucide-react';
import { LetterDocument } from '../types/letter';
import { RemasbaraLogo, RemasbaraOfficialStamp } from './RemasbaraVisuals';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  letters: LetterDocument[];
  onOpenLetterPreview?: (letter: LetterDocument) => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  onClose,
  letters,
  onOpenLetterPreview,
}) => {
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState(false);
  const [matchedLetter, setMatchedLetter] = useState<LetterDocument | null>(null);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const clean = query.trim().toLowerCase();
    const found = letters.find(
      (l) =>
        l.verification.verificationCode.toLowerCase() === clean ||
        l.letterNumber.toLowerCase() === clean ||
        clean.includes(l.verification.verificationCode.toLowerCase())
    );

    setMatchedLetter(found || null);
    setSearched(true);
  };

  const handleQuickTest = (code: string) => {
    setQuery(code);
    const found = letters.find((l) => l.verification.verificationCode === code);
    setMatchedLetter(found || null);
    setSearched(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RemasbaraLogo size={36} />
            <div>
              <h3 className="text-base font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-5 h-5 text-emerald-300" />
                Verifikasi Keaslian Surat Keluar Remasbara
              </h3>
              <p className="text-[11px] text-emerald-200">
                Pusat Autentikasi Dokumen Resmi Masjid Baiturrahman Mekarjaya Depok
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-300 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Masukkan Kode Verifikasi atau Nomor Surat:
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Contoh: VERIF-RMB-001UND-A82K atau 001/UND/REMASBARA-MBR/X/2026"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-sm"
              >
                Periksa
              </button>
            </div>
          </form>

          {/* Quick test pills */}
          {letters.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
              <span>Coba verifikasi contoh:</span>
              {letters.slice(0, 2).map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => handleQuickTest(l.verification.verificationCode)}
                  className="font-mono text-[11px] text-emerald-800 hover:underline bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                >
                  {l.verification.verificationCode}
                </button>
              ))}
            </div>
          )}

          {/* Result view */}
          {searched && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              {matchedLetter ? (
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                      <CheckCircle className="w-5 h-5 text-emerald-700" />
                      <span>DOKUMEN RESMI DAN TERVALIDASI</span>
                    </div>
                    <span className="text-[10px] font-semibold bg-emerald-200/80 text-emerald-900 px-2.5 py-0.5 rounded uppercase">
                      Sah & Terdaftar
                    </span>
                  </div>

                  <div className="bg-white rounded-lg p-3.5 border border-emerald-100 space-y-2 text-xs">
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500">Nomor Surat:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {matchedLetter.letterNumber}
                      </span>
                    </div>

                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500">Perihal:</span>
                      <span className="font-semibold text-slate-900 text-right max-w-xs">
                        {matchedLetter.subject}
                      </span>
                    </div>

                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500">Penerima / Tujuan:</span>
                      <span className="font-medium text-slate-800">
                        {matchedLetter.recipientName}
                      </span>
                    </div>

                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500">Tanggal Resmi:</span>
                      <span className="font-medium text-slate-800">
                        {matchedLetter.dateFormattedMasehi} ({matchedLetter.dateHijri})
                      </span>
                    </div>

                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500">Penandatangan 1:</span>
                      <span className="font-semibold text-slate-900">
                        {matchedLetter.signatories.firstSignatory.name} ({matchedLetter.signatories.firstSignatory.role})
                      </span>
                    </div>

                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500">Penandatangan 2:</span>
                      <span className="font-semibold text-slate-900">
                        {matchedLetter.signatories.secondSignatory.name} ({matchedLetter.signatories.secondSignatory.role})
                      </span>
                    </div>

                    {matchedLetter.signatories.kemasjidanSignatory?.enabled && (
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-slate-500">Mengetahui 1:</span>
                        <span className="font-semibold text-slate-900">
                          {matchedLetter.signatories.kemasjidanSignatory.name} ({matchedLetter.signatories.kemasjidanSignatory.role})
                        </span>
                      </div>
                    )}

                    {matchedLetter.signatories.yayasanSignatory?.enabled && (
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-slate-500">Mengetahui 2:</span>
                        <span className="font-semibold text-slate-900">
                          {matchedLetter.signatories.yayasanSignatory.name} ({matchedLetter.signatories.yayasanSignatory.role})
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-slate-500">Status Dokumen:</span>
                      <span className="font-semibold uppercase text-emerald-800">
                        {matchedLetter.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <p className="text-[11px] text-slate-500">
                      Diterbitkan oleh: <strong>Remasbara Masjid Baiturrahman</strong> · Mekarjaya Sukmajaya Depok
                    </p>

                    {onOpenLetterPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenLetterPreview(matchedLetter);
                          onClose();
                        }}
                        className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 flex items-center gap-1"
                      >
                        Lihat Surat
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center space-y-2">
                  <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
                  <h4 className="text-sm font-bold text-red-900">
                    Dokumen Tidak Ditemukan / Tidak Valid!
                  </h4>
                  <p className="text-xs text-red-700 max-w-sm mx-auto">
                    Kode verifikasi atau nomor surat "{query}" tidak tercatat dalam basis data resmi Remasbara Baiturrahman. Harap waspada terhadap indikasi dokumen palsu.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
