import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  Mail,
  Send,
  Printer,
  Download,
  Share2,
  CheckCircle2,
  FileCheck,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  Eye,
  Loader2,
  Check,
  Copy,
} from 'lucide-react';
import { LetterDocument, OrganizationProfile } from '../types/letter';
import { LetterPreviewA4 } from './LetterPreviewA4';
import {
  generateLetterPdf,
  triggerFileDownload,
  canSharePdfFile,
  sharePdfFile,
} from '../utils/pdfGenerator';

interface SendLetterModalProps {
  letter: LetterDocument | null;
  orgProfile: OrganizationProfile;
  isOpen: boolean;
  onClose: () => void;
  onDirectPrint?: (letter: LetterDocument) => void;
}

export const SendLetterModal: React.FC<SendLetterModalProps> = ({
  letter,
  orgProfile,
  isOpen,
  onClose,
  onDirectPrint,
}) => {
  const [activeTab, setActiveTab] = useState<'share' | 'wa' | 'email' | 'preview'>('share');
  const [waPhone, setWaPhone] = useState('');
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [copiedNote, setCopiedNote] = useState(false);

  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Sync default subject when letter changes
  React.useEffect(() => {
    if (letter) {
      setEmailSubject(`[Surat Resmi REMASBARA] No: ${letter.letterNumber} - ${letter.subject}`);
    }
  }, [letter]);

  const cleanFileName = useMemo(() => {
    if (!letter) return 'Surat_Resmi_REMASBARA.pdf';
    const safeNumber = letter.letterNumber.replace(/[\/\\:\*\?"<>\|]/g, '_');
    return `Surat_REMASBARA_${safeNumber}.pdf`;
  }, [letter]);

  if (!isOpen || !letter) return null;

  const showNotification = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => {
      setStatusNotice(null);
    }, 4000);
  };

  /**
   * Helper to generate PDF file from the rendered A4 container
   */
  const handleBuildPdf = async () => {
    if (!previewContainerRef.current) {
      throw new Error('Elemen pratinjau belum siap');
    }
    return await generateLetterPdf(previewContainerRef.current, cleanFileName);
  };

  /**
   * Primary Action: Share PDF File directly using Web Share API
   */
  const handleNativeSharePdf = async () => {
    setIsGenerating(true);
    setStatusNotice('Menyiapkan file PDF resmi beresolusi tinggi...');
    try {
      const { file } = await handleBuildPdf();
      const title = `Surat Resmi REMASBARA - ${letter.letterNumber}`;
      const text = `Berikut kami sampaikan berkas surat resmi berformat PDF:\nNomor: ${letter.letterNumber}\nPerihal: ${letter.subject}\nPengurus REMASBARA Baiturrahman Depok.`;

      const shared = await sharePdfFile(file, title, text);
      if (shared) {
        showNotification('File PDF berhasil dikirimkan!');
      } else {
        // Fallback: download PDF directly
        triggerFileDownload(file, cleanFileName);
        showNotification(`File PDF (${cleanFileName}) telah otomatis diunduh! Silakan lampirkan langsung.`);
      }
    } catch (err: any) {
      console.error(err);
      showNotification('Gagal menyiapkan PDF: ' + (err?.message || 'Silakan coba lagi'));
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Action: Download PDF file directly
   */
  const handleDownloadPdf = async () => {
    setIsGenerating(true);
    setStatusNotice('Sedang mengunduh file PDF resmi...');
    try {
      const { blob } = await handleBuildPdf();
      triggerFileDownload(blob, cleanFileName);
      showNotification(`File PDF ${cleanFileName} berhasil diunduh ke perangkat Anda!`);
    } catch (err: any) {
      console.error(err);
      showNotification('Gagal mengunduh file PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Action: Send PDF via WhatsApp
   */
  const handleSendViaWhatsApp = async () => {
    setIsGenerating(true);
    setStatusNotice('Menyiapkan file PDF untuk WhatsApp...');
    try {
      const { file } = await handleBuildPdf();

      // Check if browser can share file directly to WhatsApp
      if (canSharePdfFile(file)) {
        const title = `Surat Resmi REMASBARA - ${letter.letterNumber}`;
        const text = `📄 Melampirkan Dokumen PDF Surat Resmi REMASBARA\nNomor: ${letter.letterNumber}\nPerihal: ${letter.subject}\nKepada Yth: ${letter.recipientName}`;
        await navigator.share({
          files: [file],
          title,
          text,
        });
        showNotification('File PDF dibagikan ke WhatsApp!');
      } else {
        // Auto download PDF file so user has it ready
        triggerFileDownload(file, cleanFileName);

        // Format WA link
        let cleanPhone = waPhone.replace(/\D/g, '');
        if (cleanPhone.startsWith('0')) {
          cleanPhone = '62' + cleanPhone.slice(1);
        }
        const messageText = encodeURIComponent(
          `📄 *SURAT RESMI REMASBARA (BERKAS PDF TERLAMPIR)*\n` +
          `Nomor: ${letter.letterNumber}\n` +
          `Perihal: ${letter.subject}\n` +
          `Tujuan: ${letter.recipientName}\n\n` +
          `_File PDF resmi (${cleanFileName}) telah kami siapkan dan lampirkan._`
        );

        const waUrl = cleanPhone
          ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${messageText}`
          : `https://api.whatsapp.com/send?text=${messageText}`;

        window.open(waUrl, '_blank', 'noopener,noreferrer');
        showNotification(
          `✅ File PDF (${cleanFileName}) telah otomatis diunduh! Cukup klik icon klip kertas 📎 di WhatsApp lalu kirim file tersebut.`
        );
      }
    } catch (err: any) {
      console.error(err);
      showNotification('Terjadi kendala saat menyiapkan PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Action: Send PDF via Email
   */
  const handleSendViaEmail = async () => {
    setIsGenerating(true);
    setStatusNotice('Menyiapkan file PDF untuk surel resmi...');
    try {
      const { file } = await handleBuildPdf();

      if (canSharePdfFile(file)) {
        const title = emailSubject || `Surat Resmi REMASBARA - ${letter.letterNumber}`;
        const text = `Assalamu'alaikum Wr. Wb.\n\nTerlampir kami sampaikan berkas surat resmi PDF:\nNomor: ${letter.letterNumber}\nPerihal: ${letter.subject}\n\nPengurus REMASBARA`;
        await navigator.share({
          files: [file],
          title,
          text,
        });
        showNotification('File PDF dibagikan ke aplikasi Email!');
      } else {
        // Auto download PDF
        triggerFileDownload(file, cleanFileName);

        const target = emailTo.trim();
        const subject = encodeURIComponent(emailSubject || `[Surat Resmi REMASBARA] ${letter.letterNumber}`);
        const body = encodeURIComponent(
          `Assalamu'alaikum Warahmatullahi Wabarakatuh,\n\n` +
          `Kepada Yth.\n${letter.recipientName}\n${letter.recipientInstitution}\n\n` +
          `Dengan hormat,\nBerikut kami lampirkan berkas surat resmi berformat PDF:\n\n` +
          `Nomor Surat : ${letter.letterNumber}\n` +
          `Perihal     : ${letter.subject}\n` +
          `Lampiran    : ${cleanFileName}\n\n` +
          `Kode Verifikasi Keabsahan: ${letter.verification.verificationCode || '-'}\n\n` +
          `Wassalamu'alaikum Warahmatullahi Wabarakatuh,\n` +
          `Pengurus Remaja Masjid Baiturrahman (REMASBARA)\n` +
          `Sekretariat: ${orgProfile.address}, ${orgProfile.city}\nHotline: ${orgProfile.phone}`
        );

        window.location.href = `mailto:${target}?subject=${subject}&body=${body}`;
        showNotification(
          `✅ File PDF (${cleanFileName}) telah otomatis diunduh! Silakan lampirkan file tersebut pada jendela surel yang terbuka.`
        );
      }
    } catch (err: any) {
      console.error(err);
      showNotification('Terjadi kendala saat menyiapkan PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyFileName = () => {
    navigator.clipboard.writeText(cleanFileName);
    setCopiedNote(true);
    setTimeout(() => setCopiedNote(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      {/* Hidden offscreen container for high-res PDF generation */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div
          ref={previewContainerRef}
          style={{
            width: '794px',
            backgroundColor: '#ffffff',
            padding: '0px',
            margin: '0px',
          }}
        >
          <LetterPreviewA4 letter={letter} orgProfile={orgProfile} />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-200 bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-400/40">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  Status Arsip: Terkirim Resmi
                </span>
                <span className="font-mono text-xs text-emerald-100 bg-white/10 px-2 py-0.5 rounded">
                  {letter.letterNumber}
                </span>
              </div>
              <h3 className="text-base font-bold text-white leading-snug">
                Kirim Dokumen Arsip Resmi (Berkas File PDF)
              </h3>
              <p className="text-xs text-emerald-100/90 line-clamp-1">
                Hal: {letter.subject} · Tujuan: {letter.recipientName}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-emerald-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Channel Tabs */}
          <div className="flex flex-wrap gap-2 mt-4 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('share')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'share'
                  ? 'bg-white text-emerald-950 shadow-sm'
                  : 'text-emerald-100 hover:bg-white/10'
              }`}
            >
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>Kirim Berkas PDF</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('wa')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'wa'
                  ? 'bg-white text-emerald-950 shadow-sm'
                  : 'text-emerald-100 hover:bg-white/10'
              }`}
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Kirim via WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('email')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'email'
                  ? 'bg-white text-emerald-950 shadow-sm'
                  : 'text-emerald-100 hover:bg-white/10'
              }`}
            >
              <Mail className="w-4 h-4 text-blue-600" />
              <span>Kirim via Email</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'preview'
                  ? 'bg-white text-emerald-950 shadow-sm'
                  : 'text-emerald-100 hover:bg-white/10'
              }`}
            >
              <Eye className="w-4 h-4 text-teal-600" />
              <span>Pratinjau A4</span>
            </button>
          </div>
        </div>

        {/* Status Notification Banner */}
        {statusNotice && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-2.5 text-xs font-medium text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="flex-1">{statusNotice}</span>
          </div>
        )}

        {/* Tab Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* File Card Info */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-sm font-bold text-xs">
                PDF
              </div>
              <div className="leading-tight">
                <span className="text-xs font-bold text-slate-800 font-mono block">
                  {cleanFileName}
                </span>
                <span className="text-[11px] text-slate-500">
                  Format Berkas Resmi A4 · Berstempel & Bertanda Tangan Lengkap
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyFileName}
              className="text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg flex items-center gap-1 shrink-0"
              title="Salin Nama Berkas"
            >
              {copiedNote ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedNote ? 'Tersalin' : 'Nama File'}</span>
            </button>
          </div>

          {activeTab === 'share' && (
            /* TAB 1: QUICK SHARE PDF FILE */
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-2">
                  <Send className="w-4 h-4 text-emerald-700" />
                  Kirim Berkas PDF Langsung (File Share)
                </h4>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Kirimkan berkas dokumen PDF asli surat ini secara langsung. Jika perangkat mendukung Web Share, jendela pemilihan aplikasi (WhatsApp, Gmail, Telegram, Bluetooth) akan langsung melampirkan berkas PDF ini.
                </p>

                <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    onClick={handleNativeSharePdf}
                    disabled={isGenerating}
                    className="flex-1 py-3 px-4 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 disabled:opacity-50 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Share2 className="w-4 h-4" />
                    )}
                    <span>Kirim & Bagikan File PDF Sekarang</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    disabled={isGenerating}
                    className="py-3 px-4 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl flex items-center justify-center gap-2 transition-colors shrink-0"
                  >
                    <Download className="w-4 h-4 text-emerald-700" />
                    <span>Unduh Berkas PDF</span>
                  </button>
                </div>
              </div>

              {/* Detail Ringkasan Dokumen */}
              <div className="border border-slate-200 rounded-xl p-4 text-xs space-y-2 bg-white">
                <div className="font-semibold text-slate-700">Rincian Surat Keluar Terverifikasi:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <div><strong>Nomor:</strong> {letter.letterNumber}</div>
                  <div><strong>Tanggal:</strong> {letter.dateFormattedMasehi}</div>
                  <div><strong>Penerima:</strong> {letter.recipientName}</div>
                  <div><strong>Instansi:</strong> {letter.recipientInstitution}</div>
                  <div><strong>Perihal:</strong> {letter.subject}</div>
                  <div><strong>Kode Sah:</strong> {letter.verification.verificationCode || '-'}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'wa' && (
            /* TAB 2: WHATSAPP WITH PDF */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor WhatsApp Penerima (Opsional):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={waPhone}
                    onChange={(e) => setWaPhone(e.target.value)}
                    placeholder="Contoh: 081234567890 atau kosongkan untuk memilih kontak di WhatsApp"
                    className="flex-1 text-xs font-mono bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
                  />
                  {waPhone && (
                    <button
                      type="button"
                      onClick={() => setWaPhone('')}
                      className="px-2.5 text-xs text-slate-400 hover:text-slate-600 bg-slate-100 rounded-lg"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1.5">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  Alur Pengiriman File PDF ke WhatsApp:
                </div>
                <p className="text-[11px] leading-relaxed">
                  1. Klik tombol di bawah ini. Sistem akan otomatis menyiapkan dan mengunduh berkas <strong>{cleanFileName}</strong>.
                </p>
                <p className="text-[11px] leading-relaxed">
                  2. Jendela WhatsApp akan langsung terbuka. Anda cukup melampirkan berkas PDF tersebut ke ruang obrolan (chat).
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={handleSendViaWhatsApp}
                  disabled={isGenerating}
                  className="flex-1 py-3 px-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MessageCircle className="w-4 h-4 fill-white/20" />
                  )}
                  <span>Kirim File PDF ke WhatsApp</span>
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-200" />
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isGenerating}
                  className="py-3 px-4 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl flex items-center justify-center gap-1.5"
                >
                  <Download className="w-4 h-4 text-emerald-700" />
                  <span>Unduh PDF</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'email' && (
            /* TAB 3: EMAIL WITH PDF */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Tujuan / Penerima:
                  </label>
                  <input
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="Contoh: panitia@agenda.id atau kontak@tujuan.com"
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subjek Email Resmi:
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1.5">
                <div className="font-semibold text-blue-950 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-blue-600" />
                  Pengiriman Berkas PDF Resmi via Surel:
                </div>
                <p className="text-[11px] leading-relaxed">
                  Sistem menyiapkan berkas lampiran <strong>{cleanFileName}</strong> secara otomatis untuk dikirimkan melalui aplikasi surel standar institusi Anda.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={handleSendViaEmail}
                  disabled={isGenerating}
                  className="flex-1 py-3 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4 fill-white/20" />
                  )}
                  <span>Kirim File PDF via Aplikasi Email</span>
                  <ExternalLink className="w-3.5 h-3.5 text-blue-200" />
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isGenerating}
                  className="py-3 px-4 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl flex items-center justify-center gap-1.5"
                >
                  <Download className="w-4 h-4 text-blue-700" />
                  <span>Unduh PDF</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'preview' && (
            /* TAB 4: VISUAL A4 PREVIEW */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Pratinjau Lembar Surat Resmi A4 yang akan dijadikan berkas PDF:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Unduh PDF
                  </button>
                  {onDirectPrint && (
                    <button
                      type="button"
                      onClick={() => onDirectPrint(letter)}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Cetak
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-[380px] overflow-y-auto border border-slate-300 rounded-xl bg-slate-100 p-3 shadow-inner flex justify-center">
                <div className="transform scale-[0.6] origin-top bg-white shadow-md">
                  <LetterPreviewA4 letter={letter} orgProfile={orgProfile} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Dokumen Terverifikasi Resmi REMASBARA Baiturrahman Depok</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg shadow-2xs hover:bg-slate-100 transition-colors"
          >
            Selesai / Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
