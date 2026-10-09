import React, { useState } from 'react';
import { Printer, Copy, Check, Edit3, X, ZoomIn, ZoomOut, RotateCcw, Send } from 'lucide-react';
import { LetterDocument, OrganizationProfile } from '../types/letter';
import { LetterPreviewA4 } from './LetterPreviewA4';

interface LetterPreviewModalProps {
  letter: LetterDocument | null;
  orgProfile: OrganizationProfile;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (letter: LetterDocument) => void;
  onSend?: (letter: LetterDocument) => void;
}

export const LetterPreviewModal: React.FC<LetterPreviewModalProps> = ({
  letter,
  orgProfile,
  isOpen,
  onClose,
  onEdit,
  onSend,
}) => {
  const [copied, setCopied] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  if (!isOpen || !letter) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const lines = [
      `REMAJA MASJID BAITURRAHMAN`,
      `CIKUMPA MEKARJAYA SUKMAJAYA KOTA DEPOK`,
      `Jl. Tole Iskandar KM 3, Mekarjaya, Sukmajaya, Kota Depok`,
      `Hotline: 0896-4333-1415 | Surel: remasbaraofficial@gmail.com`,
      `--------------------------------------------------`,
      `Nomor    : ${letter.letterNumber}`,
      `Lampiran : ${letter.attachment || '-'}`,
      `Perihal  : ${letter.subject}`,
      `Tanggal  : ${letter.city}, ${letter.dateFormattedMasehi} (${letter.dateHijri})`,
      ``,
      `Kepada Yth.`,
      `${letter.recipientName}`,
      `${letter.recipientInstitution}`,
      ``,
      `${letter.openingGreeting},`,
      ``,
      letter.openingParagraph,
      ``,
    ];

    if (letter.eventDetails?.enabled) {
      lines.push(`Rincian Acara:`);
      if (letter.eventDetails.dayDate) lines.push(`Hari/Tanggal : ${letter.eventDetails.dayDate}`);
      if (letter.eventDetails.time) lines.push(`Waktu        : ${letter.eventDetails.time}`);
      if (letter.eventDetails.location) lines.push(`Tempat       : ${letter.eventDetails.location}`);
      if (letter.eventDetails.agenda) lines.push(`Agenda       : ${letter.eventDetails.agenda}`);
      lines.push(``);
    }

    letter.contentParagraphs.forEach((p) => lines.push(p, ``));

    lines.push(
      letter.closingParagraph,
      ``,
      `${letter.closingGreeting},`,
      ``,
      `${letter.signatories.firstSignatory.name} (${letter.signatories.firstSignatory.role})`,
      `${letter.signatories.secondSignatory.name} (${letter.signatories.secondSignatory.role})`
    );

    if (letter.signatories.kemasjidanSignatory?.enabled) {
      lines.push(`Mengetahui: ${letter.signatories.kemasjidanSignatory.name} (${letter.signatories.kemasjidanSignatory.role})`);
    }
    if (letter.signatories.yayasanSignatory?.enabled) {
      lines.push(`Mengetahui: ${letter.signatories.yayasanSignatory.name} (${letter.signatories.yayasanSignatory.role})`);
    }

    lines.push(
      ``,
      `Kode Verifikasi: ${letter.verification.verificationCode}`
    );

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/80 backdrop-blur-xs overflow-hidden">
      {/* Top Floating Control Bar (Hidden on print) */}
      <header className="no-print h-14 bg-slate-900 border-b border-slate-800 text-white px-4 sm:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-1 rounded border border-emerald-800/80">
            {letter.letterNumber}
          </span>
          <span className="text-xs text-slate-300 hidden md:inline truncate max-w-sm">
            {letter.subject}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 mr-2">
            <button
              type="button"
              onClick={() => setZoomLevel((prev) => Math.max(75, prev - 10))}
              className="p-1 hover:text-white"
              title="Perkecil Tampilan"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="w-12 text-center font-mono">{zoomLevel}%</span>
            <button
              type="button"
              onClick={() => setZoomLevel((prev) => Math.min(130, prev + 10))}
              className="p-1 hover:text-white"
              title="Perbesar Tampilan"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(100)}
              className="p-1 hover:text-white"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyText}
            className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
          </button>

          {/* Tombol Kirim jika status arsip dokumen terkirim resmi */}
          {letter.status === 'terkirim' && onSend && (
            <button
              type="button"
              onClick={() => {
                onSend(letter);
              }}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors ring-1 ring-emerald-400/50"
              title="Kirim Arsip Surat Resmi (via WhatsApp / Email)"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Kirim (WA/Email)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onEdit(letter);
              onClose();
            }}
            className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Surat</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / PDF</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Sheet Viewport */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center items-start print:p-0 print:m-0 print:overflow-visible">
        <div
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
          className="transition-transform duration-150 ease-out"
        >
          <LetterPreviewA4 letter={letter} orgProfile={orgProfile} />
        </div>
      </div>
    </div>
  );
};
