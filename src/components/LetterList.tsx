import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Eye,
  Edit3,
  Copy,
  Printer,
  Trash2,
  Plus,
  Download,
  Calendar,
  FileText,
  Clock,
  ShieldCheck,
  CheckCircle,
  Send,
} from 'lucide-react';
import { LetterDocument, LetterCategoryCode, LETTER_CATEGORIES } from '../types/letter';

interface LetterListProps {
  letters: LetterDocument[];
  onNewLetter: () => void;
  onEditLetter: (letter: LetterDocument) => void;
  onPreviewLetter: (letter: LetterDocument) => void;
  onDuplicateLetter: (letter: LetterDocument) => void;
  onDeleteLetter: (id: string) => void;
  onDirectPrint: (letter: LetterDocument) => void;
  onOpenVerify: () => void;
  onSendLetter?: (letter: LetterDocument) => void;
}

export const LetterList: React.FC<LetterListProps> = ({
  letters,
  onNewLetter,
  onEditLetter,
  onPreviewLetter,
  onDuplicateLetter,
  onDeleteLetter,
  onDirectPrint,
  onOpenVerify,
  onSendLetter,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Statistics
  const stats = useMemo(() => {
    const total = letters.length;
    const sent = letters.filter((l) => l.status === 'terkirim').length;
    const approved = letters.filter((l) => l.status === 'disetujui').length;
    const draft = letters.filter((l) => l.status === 'draft').length;
    return { total, sent, approved, draft };
  }, [letters]);

  // Filtered Letters
  const filteredLetters = useMemo(() => {
    return letters.filter((item) => {
      const matchSearch =
        item.letterNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.dateFormattedMasehi.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCategory =
        categoryFilter === 'all' || item.categoryCode === categoryFilter;

      const matchStatus =
        statusFilter === 'all' || item.status === statusFilter;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [letters, searchTerm, categoryFilter, statusFilter]);

  // Export to CSV
  const handleExportCSV = () => {
    if (letters.length === 0) return;
    const headers = [
      'Nomor Surat',
      'Klasifikasi',
      'Perihal',
      'Tujuan/Penerima',
      'Tanggal Masehi',
      'Tanggal Hijriah',
      'Status',
      'Kode Verifikasi',
      'Dibuat',
    ];

    const rows = letters.map((l) => [
      `"${l.letterNumber}"`,
      `"${l.categoryCode}"`,
      `"${l.subject.replace(/"/g, '""')}"`,
      `"${l.recipientName.replace(/"/g, '""')}"`,
      `"${l.dateFormattedMasehi}"`,
      `"${l.dateHijri || ''}"`,
      `"${l.status}"`,
      `"${l.verification.verificationCode || ''}"`,
      `"${l.createdAt}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Arsip_Surat_Keluar_Remasbara_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: LetterDocument['status']) => {
    switch (status) {
      case 'terkirim':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <CheckCircle className="w-3 h-3 text-emerald-700" />
            Terkirim
          </span>
        );
      case 'disetujui':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            <ShieldCheck className="w-3 h-3 text-blue-700" />
            Disetujui
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            <Clock className="w-3 h-3 text-amber-700" />
            Draft
          </span>
        );
      case 'diarsipkan':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            Diarsipkan
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 4 Stat Cards in Single-Elevation Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500">Total Arsip Surat</p>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {stats.total}
            </p>
            <span className="text-[11px] text-slate-400">Tercatat</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500">Surat Terkirim</p>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl font-bold font-mono text-emerald-800 tabular-nums">
              {stats.sent}
            </p>
            <span className="text-[11px] text-emerald-700">Resmi</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500">Telah Disetujui</p>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl font-bold font-mono text-blue-800 tabular-nums">
              {stats.approved}
            </p>
            <span className="text-[11px] text-blue-700">Bertanda tangan</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500">Draft / Konsep</p>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl font-bold font-mono text-amber-800 tabular-nums">
              {stats.draft}
            </p>
            <span className="text-[11px] text-amber-700">Dalam proses</span>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Controls Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nomor surat, perihal, nama penerima..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white"
              />
            </div>

            {/* Top Toolbar Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenVerify}
                className="px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
                title="Verifikasi keaslian surat"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                Cek Verifikasi
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
                title="Ekspor ke Excel / CSV"
              >
                <Download className="w-3.5 h-3.5" />
                Ekspor CSV
              </button>

              <button
                type="button"
                onClick={onNewLetter}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Buat Surat Baru
              </button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 font-medium">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter Kategori:</span>
            </div>

            <select
              aria-label="Filter Berdasarkan Kategori"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1 text-slate-700 focus:ring-1 focus:ring-emerald-600"
            >
              <option value="all">Semua Kategori ({letters.length})</option>
              {LETTER_CATEGORIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.label}
                </option>
              ))}
            </select>

            <span className="text-slate-300">|</span>

            <div className="flex items-center gap-1.5 text-slate-500 font-medium">
              <span>Status:</span>
            </div>

            <select
              aria-label="Filter Berdasarkan Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1 text-slate-700 focus:ring-1 focus:ring-emerald-600"
            >
              <option value="all">Semua Status</option>
              <option value="terkirim">Terkirim</option>
              <option value="disetujui">Disetujui</option>
              <option value="draft">Draft</option>
              <option value="diarsipkan">Diarsipkan</option>
            </select>

            {(searchTerm || categoryFilter !== 'all' || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setStatusFilter('all');
                }}
                className="text-[11px] text-emerald-800 hover:underline font-medium ml-auto"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* Table List View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3 px-4 w-48">Nomor Surat</th>
                <th className="py-3 px-4">Perihal & Tujuan</th>
                <th className="py-3 px-4 w-36">Tanggal Surat</th>
                <th className="py-3 px-4 w-28">Status</th>
                <th className="py-3 px-4 w-28 text-center">Tanda Tangan</th>
                <th className="py-3 px-4 min-w-[220px] text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLetters.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto stroke-1 text-slate-300 mb-2" />
                    <p className="font-medium text-slate-600">Tidak ada arsip surat yang sesuai</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Coba ubah kata kunci pencarian atau buat surat keluar baru.
                    </p>
                    <button
                      type="button"
                      onClick={onNewLetter}
                      className="mt-3 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg inline-flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Buat Surat Baru
                    </button>
                  </td>
                </tr>
              ) : (
                filteredLetters.map((letter) => {
                  const hasSigChairman =
                    letter.signatories.firstSignatory.includeSignature &&
                    Boolean(letter.signatories.firstSignatory.signatureDataUrl);
                  const hasSigSecretary =
                    letter.signatories.secondSignatory.includeSignature &&
                    Boolean(letter.signatories.secondSignatory.signatureDataUrl);
                  const hasSigKemasjidan =
                    !letter.signatories.kemasjidanSignatory?.enabled ||
                    (letter.signatories.kemasjidanSignatory.includeSignature &&
                      Boolean(letter.signatories.kemasjidanSignatory.signatureDataUrl));
                  const hasSigYayasan =
                    !letter.signatories.yayasanSignatory?.enabled ||
                    (letter.signatories.yayasanSignatory.includeSignature &&
                      Boolean(letter.signatories.yayasanSignatory.signatureDataUrl));
                  const isAllSigned =
                    hasSigChairman && hasSigSecretary && hasSigKemasjidan && hasSigYayasan;
                  const isPartiallySigned =
                    hasSigChairman || hasSigSecretary;

                  return (
                    <tr
                      key={letter.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Nomor Surat */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-mono font-bold text-slate-900 tracking-tight">
                          {letter.letterNumber}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <span className="font-semibold text-emerald-800">
                            {letter.categoryCode}
                          </span>
                          <span>·</span>
                          <span>{letter.isCustomNumber ? 'Kustom' : 'Otomatis'}</span>
                        </div>
                      </td>

                      {/* Perihal & Tujuan */}
                      <td className="py-3.5 px-4 align-top">
                        <p className="font-semibold text-slate-900 group-hover:text-emerald-900 transition-colors line-clamp-1">
                          {letter.subject}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Kepada: <span className="font-medium text-slate-700">{letter.recipientName}</span>
                          {letter.recipientInstitution ? ` (${letter.recipientInstitution})` : ''}
                        </p>
                      </td>

                      {/* Tanggal Surat */}
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <div className="flex items-center gap-1 font-medium text-slate-800">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{letter.dateFormattedMasehi}</span>
                        </div>
                        {letter.dateHijri && (
                          <div className="text-[10px] text-slate-500 italic mt-0.5 font-serif-doc">
                            {letter.dateHijri}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <div className="flex flex-col items-start gap-1">
                          {getStatusBadge(letter.status)}
                          {letter.status === 'terkirim' && onSendLetter && (
                            <button
                              type="button"
                              onClick={() => onSendLetter(letter)}
                              className="text-[10px] text-emerald-700 hover:text-emerald-900 font-semibold inline-flex items-center gap-1 hover:underline pt-0.5"
                              title="Kirim via WhatsApp atau Email"
                            >
                              <Send className="w-2.5 h-2.5 text-emerald-600" />
                              <span>Kirim WA/Email</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Tanda Tangan Status */}
                      <td className="py-3.5 px-4 align-top text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 text-[11px] text-slate-600">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isAllSigned
                                ? 'bg-emerald-600'
                                : isPartiallySigned
                                ? 'bg-amber-500'
                                : 'bg-slate-300'
                            }`}
                          />
                          <span>
                            {isAllSigned
                              ? 'Lengkap'
                              : isPartiallySigned
                              ? 'Parsial'
                              : 'Tanpa TTD'}
                          </span>
                        </div>
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {/* Tombol Kirim (via Email/WA) jika status arsip dokumen terkirim resmi */}
                          {letter.status === 'terkirim' && onSendLetter && (
                            <button
                              type="button"
                              onClick={() => onSendLetter(letter)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 border border-emerald-300 rounded-lg shadow-2xs transition-colors mr-1 group/send"
                              title="Kirim Dokumen Resmi (via WhatsApp / Email)"
                            >
                              <Send className="w-3.5 h-3.5 text-emerald-700 group-hover/send:translate-x-0.5 transition-transform" />
                              <span>Kirim (WA/Email)</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onPreviewLetter(letter)}
                            className="p-1.5 text-slate-600 hover:text-emerald-800 hover:bg-slate-100 rounded transition-colors"
                            title="Pratinjau Surat A4"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDirectPrint(letter)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                            title="Cetak Langsung / PDF"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onEditLetter(letter)}
                            className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded transition-colors"
                            title="Edit Surat"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDuplicateLetter(letter)}
                            className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-slate-100 rounded transition-colors"
                            title="Duplikat Surat (Gunakan Template Ini)"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(letter.id)}
                            className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                            title="Hapus Surat"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            Menampilkan <strong className="text-slate-700">{filteredLetters.length}</strong> dari{' '}
            <strong className="text-slate-700">{letters.length}</strong> arsip surat keluar
          </span>
          <span className="text-[11px] text-slate-400">
            Remasbara · Sekretariat Jl. Tole Iskandar KM 3 Mekarjaya Depok
          </span>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4 border border-slate-200">
            <h4 className="text-base font-bold text-slate-900">Konfirmasi Hapus Surat</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus surat keluar ini dari arsip? Dokumen yang dihapus tidak dapat dipulihkan kembali.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteLetter(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm"
              >
                Hapus Arsip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
