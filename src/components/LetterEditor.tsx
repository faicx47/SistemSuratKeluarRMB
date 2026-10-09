import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Hash,
  Calendar,
  User,
  PenTool,
  Award,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Trash2,
  Save,
  Eye,
  Sliders,
  Layers,
  Sparkles,
  Upload,
  RotateCcw,
  Image as ImageIcon,
} from 'lucide-react';
import {
  LetterDocument,
  LetterCategoryCode,
  LETTER_CATEGORIES,
  OrganizationProfile,
  SavedSignature,
} from '../types/letter';
import {
  generateLetterNumber,
  formatIndonesianDate,
  getApproximateHijriDate,
  getRomanMonth,
  generateVerificationCode,
} from '../utils/dateAndNumber';
import { LETTER_TEMPLATES } from '../utils/templates';
import { StorageService } from '../utils/storage';
import { SignatureCanvasModal } from './SignatureCanvasModal';
import {
  RemasbaraOfficialStamp,
  KemasjidanOfficialStamp,
  YayasanOfficialStamp,
} from './RemasbaraVisuals';

interface LetterEditorProps {
  initialLetter: LetterDocument;
  orgProfile: OrganizationProfile;
  onSave: (savedLetter: LetterDocument) => void;
  onCancel: () => void;
  onPreview: (letter: LetterDocument) => void;
}

export const LetterEditor: React.FC<LetterEditorProps> = ({
  initialLetter,
  orgProfile,
  onSave,
  onCancel,
  onPreview,
}) => {
  const [formData, setFormData] = useState<LetterDocument>(initialLetter);
  const [duplicateWarning, setDuplicateWarning] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'nomor' | 'konten' | 'agenda' | 'ttd' | 'stempel'>('nomor');
  
  // Signature Modal state
  const [sigModalState, setSigModalState] = useState<{
    isOpen: boolean;
    target: 'first' | 'second' | 'kemasjidan' | 'yayasan';
    title: string;
    signatoryName: string;
    signatoryRole: string;
  }>({
    isOpen: false,
    target: 'first',
    title: '',
    signatoryName: '',
    signatoryRole: '',
  });

  const savedSignatures = StorageService.getSignatures();

  // Stamp Upload Refs
  const stampRemasbaraInputRef = useRef<HTMLInputElement>(null);
  const stampKemasjidanInputRef = useRef<HTMLInputElement>(null);
  const stampYayasanInputRef = useRef<HTMLInputElement>(null);

  const handleStampUpload = (
    target: 'remasbara' | 'kemasjidan' | 'yayasan',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      if (target === 'remasbara') {
        setFormData((prev) => ({
          ...prev,
          stamp: {
            ...prev.stamp,
            customStampUrl: dataUrl,
            enabled: true,
          },
        }));
      } else if (target === 'kemasjidan') {
        setFormData((prev) => ({
          ...prev,
          kemasjidanStamp: {
            ...(prev.kemasjidanStamp || { enabled: true, color: 'emerald', opacity: 0.92 }),
            customStampUrl: dataUrl,
            enabled: true,
          },
        }));
      } else if (target === 'yayasan') {
        setFormData((prev) => ({
          ...prev,
          yayasanStamp: {
            ...(prev.yayasanStamp || { enabled: true, color: 'emerald', opacity: 0.92 }),
            customStampUrl: dataUrl,
            enabled: true,
          },
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetStamp = (target: 'remasbara' | 'kemasjidan' | 'yayasan') => {
    if (target === 'remasbara') {
      if (stampRemasbaraInputRef.current) stampRemasbaraInputRef.current.value = '';
      setFormData((prev) => ({
        ...prev,
        stamp: {
          ...prev.stamp,
          customStampUrl: undefined,
        },
      }));
    } else if (target === 'kemasjidan') {
      if (stampKemasjidanInputRef.current) stampKemasjidanInputRef.current.value = '';
      setFormData((prev) => ({
        ...prev,
        kemasjidanStamp: {
          ...(prev.kemasjidanStamp || { enabled: true, color: 'emerald', opacity: 0.92 }),
          customStampUrl: undefined,
        },
      }));
    } else if (target === 'yayasan') {
      if (stampYayasanInputRef.current) stampYayasanInputRef.current.value = '';
      setFormData((prev) => ({
        ...prev,
        yayasanStamp: {
          ...(prev.yayasanStamp || { enabled: true, color: 'emerald', opacity: 0.92 }),
          customStampUrl: undefined,
        },
      }));
    }
  };

  // Validate duplicate letter number
  useEffect(() => {
    const isTaken = StorageService.isLetterNumberTaken(formData.letterNumber, formData.id);
    setDuplicateWarning(isTaken);
  }, [formData.letterNumber, formData.id]);

  // Recalculate auto number when seq, cat, date changes in auto mode
  const handleUpdateAutoNumber = (seq: number, catCode: LetterCategoryCode, dateMasehi: string) => {
    const d = new Date(dateMasehi);
    const roman = getRomanMonth(isNaN(d.getTime()) ? new Date() : d);
    const yr = isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
    const newNumber = generateLetterNumber(seq, catCode, roman, yr, orgProfile.codeIdentifier || 'RMB');
    
    setFormData((prev) => ({
      ...prev,
      sequenceNumber: seq,
      categoryCode: catCode,
      romanMonth: roman,
      year: yr,
      letterNumber: newNumber,
    }));
  };

  const handleDateChange = (dateVal: string) => {
    const dateObj = new Date(dateVal);
    const formattedMasehi = formatIndonesianDate(dateObj);
    const formattedHijri = getApproximateHijriDate(dateObj);

    if (!formData.isCustomNumber) {
      const roman = getRomanMonth(dateObj);
      const yr = dateObj.getFullYear();
      const updatedNum = generateLetterNumber(
        formData.sequenceNumber,
        formData.categoryCode,
        roman,
        yr,
        orgProfile.codeIdentifier || 'RMB'
      );
      setFormData((prev) => ({
        ...prev,
        dateMasehi: dateVal,
        dateFormattedMasehi: formattedMasehi,
        dateHijri: formattedHijri,
        romanMonth: roman,
        year: yr,
        letterNumber: updatedNum,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        dateMasehi: dateVal,
        dateFormattedMasehi: formattedMasehi,
        dateHijri: formattedHijri,
      }));
    }
  };

  const handleApplyTemplate = (templateId: string) => {
    const template = LETTER_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;

    setFormData((prev) => {
      let letterNum = prev.letterNumber;
      if (!prev.isCustomNumber) {
        letterNum = generateLetterNumber(
          prev.sequenceNumber,
          template.categoryCode,
          prev.romanMonth,
          prev.year,
          orgProfile.codeIdentifier || 'RMB'
        );
      }
      return {
        ...prev,
        categoryCode: template.categoryCode,
        letterNumber: letterNum,
        subject: template.subject,
        attachment: template.attachment,
        recipientName: template.recipientName,
        recipientInstitution: template.recipientInstitution,
        openingGreeting: template.openingGreeting,
        openingParagraph: template.openingParagraph,
        eventDetails: template.eventDetails ? { ...template.eventDetails } : undefined,
        contentParagraphs: [...template.contentParagraphs],
        closingParagraph: template.closingParagraph,
        closingGreeting: template.closingGreeting,
        copies: [...template.copies],
      };
    });
  };

  const handleOpenSignatureModal = (target: 'first' | 'second' | 'kemasjidan' | 'yayasan') => {
    if (target === 'first') {
      setSigModalState({
        isOpen: true,
        target: 'first',
        title: 'Tanda Tangan Ketua Umum',
        signatoryName: formData.signatories.firstSignatory.name,
        signatoryRole: formData.signatories.firstSignatory.role,
      });
    } else if (target === 'second') {
      setSigModalState({
        isOpen: true,
        target: 'second',
        title: 'Tanda Tangan Sekretaris Umum',
        signatoryName: formData.signatories.secondSignatory.name,
        signatoryRole: formData.signatories.secondSignatory.role,
      });
    } else if (target === 'kemasjidan') {
      setSigModalState({
        isOpen: true,
        target: 'kemasjidan',
        title: 'Tanda Tangan Ketua Bidang Kemasjidan',
        signatoryName: formData.signatories.kemasjidanSignatory?.name || 'Nursyamsu Hidayat',
        signatoryRole: formData.signatories.kemasjidanSignatory?.role || 'Ketua Bidang Kemasjidan',
      });
    } else if (target === 'yayasan') {
      setSigModalState({
        isOpen: true,
        target: 'yayasan',
        title: 'Tanda Tangan Ketua Yayasan Masjid Baiturrahman',
        signatoryName: formData.signatories.yayasanSignatory?.name || 'H. Arifin Lambaga',
        signatoryRole: formData.signatories.yayasanSignatory?.role || 'Ketua Yayasan Masjid Baiturrahman',
      });
    }
  };

  const handleSaveSignatureFromModal = (dataUrl: string) => {
    if (sigModalState.target === 'first') {
      setFormData((prev) => ({
        ...prev,
        signatories: {
          ...prev.signatories,
          firstSignatory: {
            ...prev.signatories.firstSignatory,
            signatureDataUrl: dataUrl,
            includeSignature: true,
          },
        },
      }));
    } else if (sigModalState.target === 'second') {
      setFormData((prev) => ({
        ...prev,
        signatories: {
          ...prev.signatories,
          secondSignatory: {
            ...prev.signatories.secondSignatory,
            signatureDataUrl: dataUrl,
            includeSignature: true,
          },
        },
      }));
    } else if (sigModalState.target === 'kemasjidan') {
      setFormData((prev) => ({
        ...prev,
        signatories: {
          ...prev.signatories,
          kemasjidanSignatory: {
            enabled: true,
            role: prev.signatories.kemasjidanSignatory?.role || 'Ketua Bidang Kemasjidan',
            name: prev.signatories.kemasjidanSignatory?.name || 'Nursyamsu Hidayat',
            idNumber: prev.signatories.kemasjidanSignatory?.idNumber || 'YAS.MBR/KM/01',
            signatureDataUrl: dataUrl,
            includeSignature: true,
          },
        },
      }));
    } else if (sigModalState.target === 'yayasan') {
      setFormData((prev) => ({
        ...prev,
        signatories: {
          ...prev.signatories,
          yayasanSignatory: {
            enabled: true,
            role: prev.signatories.yayasanSignatory?.role || 'Ketua Yayasan Masjid Baiturrahman',
            name: prev.signatories.yayasanSignatory?.name || 'H. Arifin Lambaga',
            idNumber: prev.signatories.yayasanSignatory?.idNumber || 'YAS.MBR/01/2022',
            signatureDataUrl: dataUrl,
            includeSignature: true,
          },
        },
      }));
    }
  };

  const handleSelectSavedSignature = (
    target: 'first' | 'second' | 'kemasjidan' | 'yayasan',
    sig: SavedSignature
  ) => {
    if (target === 'first') {
      setFormData((prev) => ({
        ...prev,
        signatories: {
          ...prev.signatories,
          firstSignatory: {
            ...prev.signatories.firstSignatory,
            name: sig.name,
            role: sig.role,
            idNumber: sig.idNumber,
            signatureDataUrl: sig.dataUrl,
            includeSignature: true,
          },
        },
      }));
    } else if (target === 'second') {
      setFormData((prev) => ({
        ...prev,
        signatories: {
          ...prev.signatories,
          secondSignatory: {
            ...prev.signatories.secondSignatory,
            name: sig.name,
            role: sig.role,
            idNumber: sig.idNumber,
            signatureDataUrl: sig.dataUrl,
            includeSignature: true,
          },
        },
      }));
    } else if (target === 'kemasjidan') {
      setFormData((prev) => ({
        ...prev,
        signatories: {
          ...prev.signatories,
          kemasjidanSignatory: {
            enabled: true,
            name: sig.name,
            role: sig.role,
            idNumber: sig.idNumber,
            signatureDataUrl: sig.dataUrl,
            includeSignature: true,
          },
        },
      }));
    } else if (target === 'yayasan') {
      setFormData((prev) => ({
        ...prev,
        signatories: {
          ...prev.signatories,
          yayasanSignatory: {
            enabled: true,
            name: sig.name,
            role: sig.role,
            idNumber: sig.idNumber,
            signatureDataUrl: sig.dataUrl,
            includeSignature: true,
          },
        },
      }));
    }
  };

  const handleAddParagraph = () => {
    setFormData((prev) => ({
      ...prev,
      contentParagraphs: [...prev.contentParagraphs, ''],
    }));
  };

  const handleUpdateParagraph = (idx: number, val: string) => {
    const updated = [...formData.contentParagraphs];
    updated[idx] = val;
    setFormData((prev) => ({ ...prev, contentParagraphs: updated }));
  };

  const handleRemoveParagraph = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      contentParagraphs: prev.contentParagraphs.filter((_, i) => i !== idx),
    }));
  };

  const handleAddCopy = () => {
    setFormData((prev) => ({
      ...prev,
      copies: [...prev.copies, ''],
    }));
  };

  const handleUpdateCopy = (idx: number, val: string) => {
    const updated = [...formData.copies];
    updated[idx] = val;
    setFormData((prev) => ({ ...prev, copies: updated }));
  };

  const handleRemoveCopy = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      copies: prev.copies.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Top Banner & Template Quick Bar */}
      <div className="bg-slate-900 text-white px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            {initialLetter.createdAt ? 'Edit Surat Keluar' : 'Buat Surat Keluar Baru'}
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Organisasi: <span className="font-semibold text-emerald-300">Remasbara</span> · Mekarjaya, Sukmajaya, Depok
          </p>
        </div>

        {/* Quick Template Picker */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-300 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Template:
          </span>
          <select
            aria-label="Pilih Template Cepat"
            onChange={(e) => handleApplyTemplate(e.target.value)}
            defaultValue=""
            className="text-xs bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="" disabled>
              -- Muat Isi Template Cepat --
            </option>
            {LETTER_TEMPLATES.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Editor Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50/70 px-4 overflow-x-auto text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('nomor')}
          className={`px-4 py-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'nomor'
              ? 'border-emerald-700 text-emerald-800 font-semibold bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Hash className="w-4 h-4" />
          1. Penomoran & Tanggal
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('konten')}
          className={`px-4 py-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'konten'
              ? 'border-emerald-700 text-emerald-800 font-semibold bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          2. Perihal, Penerima & Isi
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('agenda')}
          className={`px-4 py-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'agenda'
              ? 'border-emerald-700 text-emerald-800 font-semibold bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          3. Rincian Acara & Tembusan
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ttd')}
          className={`px-4 py-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'ttd'
              ? 'border-emerald-700 text-emerald-800 font-semibold bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <PenTool className="w-4 h-4" />
          4. Tanda Tangan Digital
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('stempel')}
          className={`px-4 py-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'stempel'
              ? 'border-emerald-700 text-emerald-800 font-semibold bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Award className="w-4 h-4" />
          5. Stempel & QR Verifikasi
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        {/* TAB 1: PENOMORAN & TANGGAL */}
        {activeTab === 'nomor' && (
          <div className="space-y-6">
            {/* Mode Switch: Otomatis vs Custom */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-700" />
                    Metode Penomoran Surat
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Gunakan sistem penomoran otomatis Remasbara atau masukkan format kustom sesuai kebutuhan.
                  </p>
                </div>

                <div className="inline-flex p-1 bg-slate-200/80 rounded-lg text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      const updatedNum = generateLetterNumber(
                        formData.sequenceNumber,
                        formData.categoryCode,
                        formData.romanMonth,
                        formData.year,
                        orgProfile.codeIdentifier
                      );
                      setFormData((prev) => ({
                        ...prev,
                        isCustomNumber: false,
                        letterNumber: updatedNum,
                      }));
                    }}
                    className={`px-3 py-1.5 rounded-md transition-colors ${
                      !formData.isCustomNumber
                        ? 'bg-white text-emerald-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Otomatis (Rekomendasi)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, isCustomNumber: true }))}
                    className={`px-3 py-1.5 rounded-md transition-colors ${
                      formData.isCustomNumber
                        ? 'bg-white text-emerald-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Nomor Kustom
                  </button>
                </div>
              </div>

              {/* Automatic Configuration Controls */}
              {!formData.isCustomNumber ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nomor Urut:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={formData.sequenceNumber}
                        onChange={(e) =>
                          handleUpdateAutoNumber(
                            parseInt(e.target.value) || 1,
                            formData.categoryCode,
                            formData.dateMasehi
                          )
                        }
                        className="w-full text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-600"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = StorageService.getNextSequenceNumber();
                          handleUpdateAutoNumber(next, formData.categoryCode, formData.dateMasehi);
                        }}
                        className="px-2.5 py-2 text-xs text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg whitespace-nowrap"
                        title="Ambil nomor urut berikutnya dari arsip"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400">Terakhir tersimpan + 1</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Klasifikasi Surat:
                    </label>
                    <select
                      value={formData.categoryCode}
                      onChange={(e) =>
                        handleUpdateAutoNumber(
                          formData.sequenceNumber,
                          e.target.value as LetterCategoryCode,
                          formData.dateMasehi
                        )
                      }
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-600 font-medium"
                    >
                      {LETTER_CATEGORIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} — {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Identitas Organisasi:
                    </label>
                    <input
                      type="text"
                      disabled
                      value={orgProfile.codeIdentifier || 'RMB'}
                      className="w-full text-xs bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Bulan Romawi / Tahun:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        disabled
                        value={formData.romanMonth}
                        className="w-16 text-center text-xs bg-slate-100 border border-slate-200 rounded-lg px-2 py-2 text-slate-600 font-mono font-bold"
                      />
                      <input
                        type="text"
                        disabled
                        value={formData.year}
                        className="w-full text-center text-xs bg-slate-100 border border-slate-200 rounded-lg px-2 py-2 text-slate-600 font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pt-2 border-t border-slate-200">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Input Nomor Surat Manual / Kustom:
                  </label>
                  <input
                    type="text"
                    value={formData.letterNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, letterNumber: e.target.value }))}
                    placeholder="Contoh: 005/PAN-RAMADHAN/MBR/X/2026"
                    className="w-full text-sm font-mono font-semibold bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 focus:ring-1 focus:ring-emerald-600"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Format bebas untuk keperluan kepanitiaan khusus, kerja sama eksternal, atau nota dinas.
                  </p>
                </div>
              )}

              {/* Live Preview Box of Letter Number */}
              <div className="p-3 bg-white border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Nomor Surat Terbentuk:</span>
                  <span className="font-mono font-bold text-sm text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                    {formData.letterNumber}
                  </span>
                </div>

                {duplicateWarning && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-700 font-medium">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>Peringatan: Nomor surat ini sudah ada di arsip!</span>
                  </div>
                )}
              </div>
            </div>

            {/* Tanggal Surat & Tempat */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kota Pembuatan Surat:
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-600"
                  placeholder="Depok"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Masehi:
                </label>
                <input
                  type="date"
                  value={formData.dateMasehi}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-600"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Teks: {formData.dateFormattedMasehi}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Hijriah (Otomatis / Bisa Diedit):
                </label>
                <input
                  type="text"
                  value={formData.dateHijri}
                  onChange={(e) => setFormData((prev) => ({ ...prev, dateHijri: e.target.value }))}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-600"
                  placeholder="26 Rabiul Akhir 1448 H"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Format kalender Islam baku
                </span>
              </div>
            </div>

            {/* Status Dokumen & Catatan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status Arsip Dokumen:
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: e.target.value as LetterDocument['status'],
                    }))
                  }
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-600 font-medium"
                >
                  <option value="draft">Draft (Konsep Surat)</option>
                  <option value="disetujui">Disetujui / Ditandatangani</option>
                  <option value="terkirim">Terkirim Resmi</option>
                  <option value="diarsipkan">Diarsipkan</option>
                </select>
                {formData.status === 'terkirim' && (
                  <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md p-2 mt-2 flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Status <strong>Terkirim Resmi</strong> akan mengaktifkan tombol <strong>Kirim (via WhatsApp / Email)</strong> pada daftar arsip dokumen.</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Internal Sekretariat (Opsional):
                </label>
                <input
                  type="text"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Contoh: Telah dikirim via email dan tanda terima fisik dititipkan di satpam"
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PERIHAL, PENERIMA & ISI */}
        {activeTab === 'konten' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Perihal (Hal):
                </label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                  placeholder="Contoh: Undangan Rapat Koordinasi Akbar Pengurus Remasbara"
                  className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lampiran:
                </label>
                <input
                  type="text"
                  value={formData.attachment}
                  onChange={(e) => setFormData((prev) => ({ ...prev, attachment: e.target.value }))}
                  placeholder="Contoh: - atau 1 Berkas Proposal"
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>

            {/* Penerima Surat */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tujuan / Penerima (Nama / Jabatan):
                </label>
                <input
                  type="text"
                  required
                  value={formData.recipientName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, recipientName: e.target.value }))}
                  placeholder="Contoh: Bapak Ketua RW 07 Mekarjaya"
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lembaga / Tempat Tujuan:
                </label>
                <input
                  type="text"
                  required
                  value={formData.recipientInstitution}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, recipientInstitution: e.target.value }))
                  }
                  placeholder="Contoh: di Tempat / di Mekarjaya Depok"
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>

            {/* Salam Pembuka */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Salam Pembuka:
              </label>
              <input
                type="text"
                value={formData.openingGreeting}
                onChange={(e) => setFormData((prev) => ({ ...prev, openingGreeting: e.target.value }))}
                placeholder="Assalamu'alaikum Warahmatullahi Wabarakatuh"
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            {/* Paragraf Pembuka */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Paragraf Pembuka (Mukaddimah):
              </label>
              <textarea
                rows={3}
                value={formData.openingParagraph}
                onChange={(e) => setFormData((prev) => ({ ...prev, openingParagraph: e.target.value }))}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-3 focus:ring-1 focus:ring-emerald-600 leading-relaxed"
                placeholder="Puji syukur kehadirat Allah SWT..."
              />
            </div>

            {/* Paragraf Isi Dinamis */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  Paragraf Isi Surat:
                </label>
                <button
                  type="button"
                  onClick={handleAddParagraph}
                  className="inline-flex items-center gap-1 text-xs text-emerald-800 hover:text-emerald-900 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Paragraf Isi
                </button>
              </div>

              {formData.contentParagraphs.map((p, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <span className="text-xs text-slate-400 font-mono mt-2 w-5 text-right">
                    {idx + 1}.
                  </span>
                  <textarea
                    rows={2}
                    value={p}
                    onChange={(e) => handleUpdateParagraph(idx, e.target.value)}
                    className="flex-1 text-xs bg-white border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-600 leading-relaxed"
                    placeholder={`Isi paragraf ke-${idx + 1}...`}
                  />
                  {formData.contentParagraphs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveParagraph(idx)}
                      className="p-2 text-slate-400 hover:text-red-600 rounded-lg transition-colors mt-0.5"
                      title="Hapus Paragraf"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Paragraf Penutup & Salam Penutup */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Paragraf Penutup:
                </label>
                <textarea
                  rows={2}
                  value={formData.closingParagraph}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, closingParagraph: e.target.value }))
                  }
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-600"
                  placeholder="Demikian surat ini kami sampaikan..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Salam Penutup:
                </label>
                <input
                  type="text"
                  value={formData.closingGreeting}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, closingGreeting: e.target.value }))
                  }
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-600"
                  placeholder="Wassalamu'alaikum Warahmatullahi Wabarakatuh"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AGENDA ACARA & TEMBUSAN */}
        {activeTab === 'agenda' && (
          <div className="space-y-6">
            {/* Box Rincian Acara */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-700" />
                    Rincian Waktu & Lokasi Kegiatan
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Aktifkan jika surat memuat rincian agenda seperti undangan rapat, tabligh akbar, atau peminjaman aula.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.eventDetails?.enabled || false}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        eventDetails: {
                          enabled: e.target.checked,
                          dayDate: prev.eventDetails?.dayDate || 'Ahad, 18 Oktober 2026',
                          time: prev.eventDetails?.time || '19.30 WIB s.d Selesai',
                          location:
                            prev.eventDetails?.location ||
                            'Aula Serbaguna Masjid Baiturrahman Mekarjaya Lt. 2',
                          agenda: prev.eventDetails?.agenda || prev.subject,
                          dressCode: prev.eventDetails?.dressCode || 'Baju Koko / Pakaian Muslim Rapi',
                        },
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-700"></div>
                </label>
              </div>

              {formData.eventDetails?.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Hari, Tanggal:
                    </label>
                    <input
                      type="text"
                      value={formData.eventDetails.dayDate}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          eventDetails: { ...prev.eventDetails!, dayDate: e.target.value },
                        }))
                      }
                      placeholder="Contoh: Ahad, 18 Oktober 2026"
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Waktu Pelaksanaan:
                    </label>
                    <input
                      type="text"
                      value={formData.eventDetails.time}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          eventDetails: { ...prev.eventDetails!, time: e.target.value },
                        }))
                      }
                      placeholder="Contoh: 19.30 WIB (Ba'da Isya) s.d Selesai"
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tempat Kegiatan:
                    </label>
                    <input
                      type="text"
                      value={formData.eventDetails.location}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          eventDetails: { ...prev.eventDetails!, location: e.target.value },
                        }))
                      }
                      placeholder="Contoh: Aula Serbaguna Masjid Baiturrahman Mekarjaya"
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Agenda Acara:
                    </label>
                    <input
                      type="text"
                      value={formData.eventDetails.agenda}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          eventDetails: { ...prev.eventDetails!, agenda: e.target.value },
                        }))
                      }
                      placeholder="Contoh: Musyawarah Kerja & Penetapan Panitia"
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Pakaian / Catatan Tambahan (Opsional):
                    </label>
                    <input
                      type="text"
                      value={formData.eventDetails.dressCode || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          eventDetails: { ...prev.eventDetails!, dressCode: e.target.value },
                        }))
                      }
                      placeholder="Contoh: Baju Koko / Pakaian Muslim Rapi dan Sopan"
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Tembusan Surat */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-700" />
                    Tembusan Surat (Carbon Copy / Arsip)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pihak-pihak yang menerima tembusan surat resmi
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddCopy}
                  className="inline-flex items-center gap-1 text-xs text-emerald-800 hover:text-emerald-900 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Tembusan
                </button>
              </div>

              <div className="space-y-2 pt-2">
                {formData.copies.map((copy, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono w-5 text-right">{i + 1}.</span>
                    <input
                      type="text"
                      value={copy}
                      onChange={(e) => handleUpdateCopy(i, e.target.value)}
                      placeholder="Contoh: Ketua DKM Masjid Baiturrahman Mekarjaya"
                      className="flex-1 text-xs bg-white border border-slate-300 rounded-lg px-3 py-2"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCopy(i)}
                      className="p-2 text-slate-400 hover:text-red-600 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TANDA TANGAN DIGITAL */}
        {activeTab === 'ttd' && (
          <div className="space-y-6">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 flex items-start gap-3">
              <PenTool className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Dukungan Tanda Tangan Digital Remasbara</p>
                <p className="text-emerald-800 mt-0.5">
                  Anda dapat menggoreskan tanda tangan langsung melalui kanvas digital layar sentuh/mouse, mengunggah foto/scan transparan, atau memilih profil tanda tangan tersimpan.
                </p>
              </div>
            </div>

            {/* Grid 2 Penandatangan Utama: Ketua & Sekretaris */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* PENANDATANGAN 1: KETUA UMUM */}
              <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase">
                    <User className="w-4 h-4 text-emerald-700" />
                    Penandatangan 1 (Ketua)
                  </h4>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.signatories.firstSignatory.includeSignature}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          signatories: {
                            ...prev.signatories,
                            firstSignatory: {
                              ...prev.signatories.firstSignatory,
                              includeSignature: e.target.checked,
                            },
                          },
                        }))
                      }
                      className="rounded text-emerald-700 focus:ring-emerald-500"
                    />
                    Sertakan TTD
                  </label>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Jabatan:</label>
                    <input
                      type="text"
                      value={formData.signatories.firstSignatory.role}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          signatories: {
                            ...prev.signatories,
                            firstSignatory: {
                              ...prev.signatories.firstSignatory,
                              role: e.target.value,
                            },
                          },
                        }))
                      }
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Nama Lengkap:</label>
                    <input
                      type="text"
                      value={formData.signatories.firstSignatory.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          signatories: {
                            ...prev.signatories,
                            firstSignatory: {
                              ...prev.signatories.firstSignatory,
                              name: e.target.value,
                            },
                          },
                        }))
                      }
                      className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Nomor Induk / NTA:</label>
                    <input
                      type="text"
                      value={formData.signatories.firstSignatory.idNumber || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          signatories: {
                            ...prev.signatories,
                            firstSignatory: {
                              ...prev.signatories.firstSignatory,
                              idNumber: e.target.value,
                            },
                          },
                        }))
                      }
                      placeholder="NTA: 2024.01.001"
                      className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg px-3 py-2"
                    />
                  </div>

                  {/* Signature Box */}
                  <div className="pt-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Pratinjau Tanda Tangan:
                    </label>
                    <div className="h-[60px] max-h-[60px] border border-dashed border-slate-300 rounded-lg bg-slate-50 flex items-center justify-center p-1.5 relative overflow-hidden">
                      {formData.signatories.firstSignatory.signatureDataUrl ? (
                        <img
                          src={formData.signatories.firstSignatory.signatureDataUrl}
                          alt="Tanda Tangan Ketua"
                          className="max-h-[50px] w-auto max-w-[160px] object-contain select-none"
                        />
                      ) : (
                        <span className="text-xs text-slate-400 italic">Belum ada tanda tangan</span>
                      )}
                    </div>

                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => handleOpenSignatureModal('first')}
                        className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        Gores / Unggah TTD
                      </button>

                      {savedSignatures.length > 0 && (
                        <select
                          aria-label="Pilih tanda tangan tersimpan Ketua"
                          onChange={(e) => {
                            const found = savedSignatures.find((s) => s.id === e.target.value);
                            if (found) handleSelectSavedSignature('first', found);
                          }}
                          defaultValue=""
                          className="text-xs bg-slate-100 border border-slate-300 text-slate-700 rounded-lg px-2 py-1.5"
                        >
                          <option value="" disabled>
                            Pilih Tersimpan
                          </option>
                          {savedSignatures.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.role})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Bar Stempel Remasbara di Sebelah Kiri Ketua */}
                    <div className="mt-3 pt-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-200/80">
                      <div className="flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-emerald-700" />
                        <span className="text-[11px] font-semibold text-slate-800">
                          Stempel Remasbara:
                        </span>
                        <span className="text-[10px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">
                          {formData.stamp.enabled ? '✓ Aktif di Sebelah Kiri' : 'Non-aktif'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => stampRemasbaraInputRef.current?.click()}
                          className="px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-white hover:bg-emerald-100 border border-emerald-300 rounded flex items-center gap-1 shadow-2xs transition-colors"
                        >
                          <Upload className="w-3 h-3 text-emerald-700" />
                          {formData.stamp.customStampUrl ? 'Ganti Sampel' : 'Upload Sampel Stempel'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('stempel')}
                          className="px-2 py-1 text-[11px] text-slate-600 hover:text-slate-900 underline"
                        >
                          Atur
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* PENANDATANGAN 2: SEKRETARIS UMUM */}
              <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase">
                    <User className="w-4 h-4 text-emerald-700" />
                    Penandatangan 2 (Sekretaris)
                  </h4>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.signatories.secondSignatory.includeSignature}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          signatories: {
                            ...prev.signatories,
                            secondSignatory: {
                              ...prev.signatories.secondSignatory,
                              includeSignature: e.target.checked,
                            },
                          },
                        }))
                      }
                      className="rounded text-emerald-700 focus:ring-emerald-500"
                    />
                    Sertakan TTD
                  </label>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Jabatan:</label>
                    <input
                      type="text"
                      value={formData.signatories.secondSignatory.role}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          signatories: {
                            ...prev.signatories,
                            secondSignatory: {
                              ...prev.signatories.secondSignatory,
                              role: e.target.value,
                            },
                          },
                        }))
                      }
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Nama Lengkap:</label>
                    <input
                      type="text"
                      value={formData.signatories.secondSignatory.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          signatories: {
                            ...prev.signatories,
                            secondSignatory: {
                              ...prev.signatories.secondSignatory,
                              name: e.target.value,
                            },
                          },
                        }))
                      }
                      className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Nomor Induk / NTA:</label>
                    <input
                      type="text"
                      value={formData.signatories.secondSignatory.idNumber || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          signatories: {
                            ...prev.signatories,
                            secondSignatory: {
                              ...prev.signatories.secondSignatory,
                              idNumber: e.target.value,
                            },
                          },
                        }))
                      }
                      placeholder="NTA: 2024.01.018"
                      className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg px-3 py-2"
                    />
                  </div>

                  {/* Signature Box */}
                  <div className="pt-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Pratinjau Tanda Tangan:
                    </label>
                    <div className="h-[60px] max-h-[60px] border border-dashed border-slate-300 rounded-lg bg-slate-50 flex items-center justify-center p-1.5 relative overflow-hidden">
                      {formData.signatories.secondSignatory.signatureDataUrl ? (
                        <img
                          src={formData.signatories.secondSignatory.signatureDataUrl}
                          alt="Tanda Tangan Sekretaris"
                          className="max-h-[50px] w-auto max-w-[160px] object-contain select-none"
                        />
                      ) : (
                        <span className="text-xs text-slate-400 italic">Belum ada tanda tangan</span>
                      )}
                    </div>

                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => handleOpenSignatureModal('second')}
                        className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        Gores / Unggah TTD
                      </button>

                      {savedSignatures.length > 0 && (
                        <select
                          aria-label="Pilih tanda tangan tersimpan Sekretaris"
                          onChange={(e) => {
                            const found = savedSignatures.find((s) => s.id === e.target.value);
                            if (found) handleSelectSavedSignature('second', found);
                          }}
                          defaultValue=""
                          className="text-xs bg-slate-100 border border-slate-300 text-slate-700 rounded-lg px-2 py-1.5"
                        >
                          <option value="" disabled>
                            Pilih Tersimpan
                          </option>
                          {savedSignatures.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.role})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* OPSI MENGETAHUI PENGURUS YAYASAN */}
            <div className="space-y-4 pt-2">
              <div className="border-b border-slate-200 pb-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-700" />
                  Opsi Pengesahan / Mengetahui (Pengurus Yayasan)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pilih pejabat Yayasan Masjid Baiturrahman yang turut mengesahkan surat keluar Remasbara.
                </p>
              </div>

              {/* 1. KETUA BIDANG KEMASJIDAN (NURSYAMSU HIDAYAT) */}
              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 uppercase flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-800 text-white flex items-center justify-center text-[10px] font-bold">1</span>
                      Mengetahui: Ketua Bidang Kemasjidan (Nursyamsu Hidayat)
                    </h5>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pengesahan dari Ketua Bidang Kemasjidan Yayasan Masjid Baiturrahman.
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.signatories.kemasjidanSignatory?.enabled || false}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          signatories: {
                            ...prev.signatories,
                            kemasjidanSignatory: {
                              enabled: e.target.checked,
                              role: prev.signatories.kemasjidanSignatory?.role || 'Ketua Bidang Kemasjidan',
                              name: prev.signatories.kemasjidanSignatory?.name || 'Nursyamsu Hidayat',
                              idNumber: prev.signatories.kemasjidanSignatory?.idNumber || 'YAS.MBR/KM/01',
                              includeSignature: prev.signatories.kemasjidanSignatory?.includeSignature ?? true,
                              signatureDataUrl: prev.signatories.kemasjidanSignatory?.signatureDataUrl,
                            },
                          },
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-700"></div>
                  </label>
                </div>

                {formData.signatories.kemasjidanSignatory?.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-200">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Jabatan:</label>
                      <input
                        type="text"
                        value={formData.signatories.kemasjidanSignatory.role}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            signatories: {
                              ...prev.signatories,
                              kemasjidanSignatory: {
                                ...prev.signatories.kemasjidanSignatory!,
                                role: e.target.value,
                              },
                            },
                          }))
                        }
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Nama Pejabat:</label>
                      <input
                        type="text"
                        value={formData.signatories.kemasjidanSignatory.name}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            signatories: {
                              ...prev.signatories,
                              kemasjidanSignatory: {
                                ...prev.signatories.kemasjidanSignatory!,
                                name: e.target.value,
                              },
                            },
                          }))
                        }
                        className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Nomor Induk:</label>
                      <input
                        type="text"
                        value={formData.signatories.kemasjidanSignatory.idNumber || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            signatories: {
                              ...prev.signatories,
                              kemasjidanSignatory: {
                                ...prev.signatories.kemasjidanSignatory!,
                                idNumber: e.target.value,
                              },
                            },
                          }))
                        }
                        placeholder="YAS.MBR/KM/01"
                        className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg px-3 py-2"
                      />
                    </div>

                    {/* TTD Box Kemasjidan */}
                    <div className="md:col-span-3 pt-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-medium text-slate-600">
                          Pratinjau Tanda Tangan:
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.signatories.kemasjidanSignatory.includeSignature}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                signatories: {
                                  ...prev.signatories,
                                  kemasjidanSignatory: {
                                    ...prev.signatories.kemasjidanSignatory!,
                                    includeSignature: e.target.checked,
                                  },
                                },
                              }))
                            }
                            className="rounded text-emerald-700"
                          />
                          Sertakan TTD pada Surat
                        </label>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="w-full sm:w-56 h-[60px] max-h-[60px] border border-dashed border-slate-300 rounded-lg bg-white flex items-center justify-center p-1.5 overflow-hidden">
                          {formData.signatories.kemasjidanSignatory.signatureDataUrl ? (
                            <img
                              src={formData.signatories.kemasjidanSignatory.signatureDataUrl}
                              alt="Tanda Tangan Ketua Bidang Kemasjidan"
                              className="max-h-[50px] w-auto max-w-[160px] object-contain select-none"
                            />
                          ) : (
                            <span className="text-xs text-slate-400 italic">Belum ada tanda tangan</span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => handleOpenSignatureModal('kemasjidan')}
                            className="px-3 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg flex items-center gap-1.5"
                          >
                            <PenTool className="w-3.5 h-3.5 text-emerald-700" />
                            Gores / Unggah TTD
                          </button>

                          {savedSignatures.length > 0 && (
                            <select
                              aria-label="Pilih tanda tangan tersimpan Kemasjidan"
                              onChange={(e) => {
                                const found = savedSignatures.find((s) => s.id === e.target.value);
                                if (found) handleSelectSavedSignature('kemasjidan', found);
                              }}
                              defaultValue=""
                              className="text-xs bg-white border border-slate-300 text-slate-700 rounded-lg px-2 py-2"
                            >
                              <option value="" disabled>
                                Pilih Tersimpan
                              </option>
                              {savedSignatures.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name} ({s.role})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>

                      {/* Bar Stempel Bidang Kemasjidan di Sebelah Kiri */}
                      <div className="mt-3 pt-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-200/80">
                        <div className="flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-emerald-700" />
                          <span className="text-[11px] font-semibold text-slate-800">
                            Stempel Kemasjidan:
                          </span>
                          <span className="text-[10px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">
                            {(formData.kemasjidanStamp?.enabled ?? true) ? '✓ Aktif di Sebelah Kiri' : 'Non-aktif'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => stampKemasjidanInputRef.current?.click()}
                            className="px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-white hover:bg-emerald-100 border border-emerald-300 rounded flex items-center gap-1 shadow-2xs transition-colors"
                          >
                            <Upload className="w-3 h-3 text-emerald-700" />
                            {formData.kemasjidanStamp?.customStampUrl ? 'Ganti Sampel' : 'Upload Sampel Stempel'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab('stempel')}
                            className="px-2 py-1 text-[11px] text-slate-600 hover:text-slate-900 underline"
                          >
                            Atur
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. KETUA YAYASAN (H. ARIFIN LAMBAGA) */}
              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 uppercase flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-800 text-white flex items-center justify-center text-[10px] font-bold">2</span>
                      Mengetahui: Ketua Yayasan Masjid Baiturrahman (H. Arifin Lambaga)
                    </h5>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pengesahan tertinggi dari Ketua Yayasan Masjid Baiturrahman.
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.signatories.yayasanSignatory?.enabled || false}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          signatories: {
                            ...prev.signatories,
                            yayasanSignatory: {
                              enabled: e.target.checked,
                              role: prev.signatories.yayasanSignatory?.role || 'Ketua Yayasan Masjid Baiturrahman',
                              name: prev.signatories.yayasanSignatory?.name || 'H. Arifin Lambaga',
                              idNumber: prev.signatories.yayasanSignatory?.idNumber || 'YAS.MBR/01/2022',
                              includeSignature: prev.signatories.yayasanSignatory?.includeSignature ?? true,
                              signatureDataUrl: prev.signatories.yayasanSignatory?.signatureDataUrl,
                            },
                          },
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-700"></div>
                  </label>
                </div>

                {formData.signatories.yayasanSignatory?.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-200">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Jabatan:</label>
                      <input
                        type="text"
                        value={formData.signatories.yayasanSignatory.role}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            signatories: {
                              ...prev.signatories,
                              yayasanSignatory: {
                                ...prev.signatories.yayasanSignatory!,
                                role: e.target.value,
                              },
                            },
                          }))
                        }
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Nama Pejabat:</label>
                      <input
                        type="text"
                        value={formData.signatories.yayasanSignatory.name}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            signatories: {
                              ...prev.signatories,
                              yayasanSignatory: {
                                ...prev.signatories.yayasanSignatory!,
                                name: e.target.value,
                              },
                            },
                          }))
                        }
                        className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Nomor Induk:</label>
                      <input
                        type="text"
                        value={formData.signatories.yayasanSignatory.idNumber || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            signatories: {
                              ...prev.signatories,
                              yayasanSignatory: {
                                ...prev.signatories.yayasanSignatory!,
                                idNumber: e.target.value,
                              },
                            },
                          }))
                        }
                        placeholder="YAS.MBR/01/2022"
                        className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg px-3 py-2"
                      />
                    </div>

                    {/* TTD Box Yayasan */}
                    <div className="md:col-span-3 pt-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-medium text-slate-600">
                          Pratinjau Tanda Tangan:
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.signatories.yayasanSignatory.includeSignature}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                signatories: {
                                  ...prev.signatories,
                                  yayasanSignatory: {
                                    ...prev.signatories.yayasanSignatory!,
                                    includeSignature: e.target.checked,
                                  },
                                },
                              }))
                            }
                            className="rounded text-emerald-700"
                          />
                          Sertakan TTD pada Surat
                        </label>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="w-full sm:w-56 h-[60px] max-h-[60px] border border-dashed border-slate-300 rounded-lg bg-white flex items-center justify-center p-1.5 overflow-hidden">
                          {formData.signatories.yayasanSignatory.signatureDataUrl ? (
                            <img
                              src={formData.signatories.yayasanSignatory.signatureDataUrl}
                              alt="Tanda Tangan Ketua Yayasan"
                              className="max-h-[50px] w-auto max-w-[160px] object-contain select-none"
                            />
                          ) : (
                            <span className="text-xs text-slate-400 italic">Belum ada tanda tangan</span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => handleOpenSignatureModal('yayasan')}
                            className="px-3 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg flex items-center gap-1.5"
                          >
                            <PenTool className="w-3.5 h-3.5 text-emerald-700" />
                            Gores / Unggah TTD
                          </button>

                          {savedSignatures.length > 0 && (
                            <select
                              aria-label="Pilih tanda tangan tersimpan Yayasan"
                              onChange={(e) => {
                                const found = savedSignatures.find((s) => s.id === e.target.value);
                                if (found) handleSelectSavedSignature('yayasan', found);
                              }}
                              defaultValue=""
                              className="text-xs bg-white border border-slate-300 text-slate-700 rounded-lg px-2 py-2"
                            >
                              <option value="" disabled>
                                Pilih Tersimpan
                              </option>
                              {savedSignatures.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name} ({s.role})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>

                      {/* Bar Stempel Yayasan di Sebelah Kiri */}
                      <div className="mt-3 pt-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-200/80">
                        <div className="flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-emerald-700" />
                          <span className="text-[11px] font-semibold text-slate-800">
                            Stempel Yayasan:
                          </span>
                          <span className="text-[10px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">
                            {(formData.yayasanStamp?.enabled ?? true) ? '✓ Aktif di Sebelah Kiri' : 'Non-aktif'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => stampYayasanInputRef.current?.click()}
                            className="px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-white hover:bg-emerald-100 border border-emerald-300 rounded flex items-center gap-1 shadow-2xs transition-colors"
                          >
                            <Upload className="w-3 h-3 text-emerald-700" />
                            {formData.yayasanStamp?.customStampUrl ? 'Ganti Sampel' : 'Upload Sampel Stempel'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab('stempel')}
                            className="px-2 py-1 text-[11px] text-slate-600 hover:text-slate-900 underline"
                          >
                            Atur
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: STEMPEL RESMI & QR VERIFIKASI */}
        {activeTab === 'stempel' && (
          <div className="space-y-6">
            {/* 1. Box Stempel Resmi Remasbara (Ketua Umum) */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-700" />
                    <h3 className="text-sm font-bold text-slate-900">
                      1. Stempel Resmi Remasbara (Ketua Umum)
                    </h3>
                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      Posisi: Tepat di Sebelah Kiri Ketua Umum
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Stempel resmi berlambang "REMAJA MASJID BAITURRAHMAN - CIKUMPA DEPOK" yang ditempatkan tepat di sebelah kiri tanda tangan Ketua Umum.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.stamp.enabled}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          stamp: { ...prev.stamp, enabled: e.target.checked },
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-700"></div>
                  </label>
                </div>
              </div>

              {formData.stamp.enabled && (
                <div className="pt-4 border-t border-slate-200 space-y-4">
                  {/* Pratinjau & Tombol Upload Sampel */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 rounded-lg border border-slate-200">
                    <div className="w-24 h-24 bg-slate-50 border border-dashed border-slate-300 rounded-lg flex items-center justify-center p-2 relative shrink-0">
                      {formData.stamp.customStampUrl ? (
                        <img
                          src={formData.stamp.customStampUrl}
                          alt="Sampel Stempel Remasbara"
                          style={{ opacity: formData.stamp.opacity ?? 0.92 }}
                          className="max-h-20 max-w-20 object-contain transform -rotate-6 select-none"
                        />
                      ) : (
                        <RemasbaraOfficialStamp
                          color={formData.stamp.color || 'red'}
                          opacity={formData.stamp.opacity ?? 0.92}
                          size={76}
                        />
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5 text-center sm:text-left">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <span className="text-xs font-bold text-slate-800">
                          {formData.stamp.customStampUrl ? 'Sampel Stempel Kustom Aktif' : 'Stempel Vektor Resmi Remasbara'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          (Diletakkan tepat di sebelah kiri Ketua Umum)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Unggah sampel stempel fisik (format PNG transparan, JPG, atau SVG) atau gunakan stempel resmi bawaan.
                      </p>

                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                        <input
                          type="file"
                          ref={stampRemasbaraInputRef}
                          accept="image/*"
                          onChange={(e) => handleStampUpload('remasbara', e)}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => stampRemasbaraInputRef.current?.click()}
                          className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
                        >
                          <Upload className="w-3.5 h-3.5 text-emerald-700" />
                          {formData.stamp.customStampUrl ? 'Ganti Sampel Stempel' : 'Unggah Sampel Stempel'}
                        </button>

                        {formData.stamp.customStampUrl && (
                          <button
                            type="button"
                            onClick={() => handleResetStamp('remasbara')}
                            className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg flex items-center gap-1.5 transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                            Kembali ke Vektor Bawaan
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Warna & Kepekatan */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">
                        Warna Tinta Stempel:
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        {[
                          { id: 'red', label: 'Merah Remasbara', colorBg: 'bg-red-600' },
                          { id: 'emerald', label: 'Hijau Masjid', colorBg: 'bg-emerald-700' },
                          { id: 'blue', label: 'Biru Dinas', colorBg: 'bg-blue-700' },
                          { id: 'purple', label: 'Ungu Tradisional', colorBg: 'bg-purple-700' },
                        ].map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                stamp: { ...prev.stamp, color: c.id as any },
                              }))
                            }
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                              formData.stamp.color === c.id
                                ? 'border-emerald-600 bg-white text-slate-900 shadow-xs ring-1 ring-emerald-500'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            <span className={`w-3 h-3 rounded-full ${c.colorBg}`} />
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">
                        Kepekatan Tinta Stempel: ({Math.round((formData.stamp.opacity ?? 0.92) * 100)}%)
                      </label>
                      <input
                        type="range"
                        min="0.4"
                        max="1.0"
                        step="0.05"
                        value={formData.stamp.opacity ?? 0.92}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            stamp: { ...prev.stamp, opacity: parseFloat(e.target.value) },
                          }))
                        }
                        className="w-full accent-emerald-700"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                        <span>Transparan (40%)</span>
                        <span>Penuh (100%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Box Stempel Bidang Kemasjidan (Ketua Bidang) */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-700" />
                    <h3 className="text-sm font-bold text-slate-900">
                      2. Stempel Bidang Kemasjidan (Ketua Bidang)
                    </h3>
                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      Posisi: Tepat di Sebelah Kiri Ketua Bidang
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Stempel resmi "YAYASAN MASJID BAITURRAHMAN - BIDANG KEMASJIDAN" yang ditempatkan tepat di sebelah kiri tanda tangan Ketua Bidang Kemasjidan.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.kemasjidanStamp?.enabled ?? true}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          kemasjidanStamp: {
                            ...(prev.kemasjidanStamp || { color: 'emerald', opacity: 0.92 }),
                            enabled: e.target.checked,
                          },
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-700"></div>
                  </label>
                </div>
              </div>

              {(formData.kemasjidanStamp?.enabled ?? true) && (
                <div className="pt-4 border-t border-slate-200 space-y-4">
                  {/* Pratinjau & Tombol Upload Sampel */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 rounded-lg border border-slate-200">
                    <div className="w-24 h-24 bg-slate-50 border border-dashed border-slate-300 rounded-lg flex items-center justify-center p-2 relative shrink-0">
                      {formData.kemasjidanStamp?.customStampUrl ? (
                        <img
                          src={formData.kemasjidanStamp.customStampUrl}
                          alt="Sampel Stempel Kemasjidan"
                          style={{ opacity: formData.kemasjidanStamp.opacity ?? 0.92 }}
                          className="max-h-20 max-w-20 object-contain transform -rotate-6 select-none"
                        />
                      ) : (
                        <KemasjidanOfficialStamp
                          color={formData.kemasjidanStamp?.color || 'emerald'}
                          opacity={formData.kemasjidanStamp?.opacity ?? 0.92}
                          size={76}
                        />
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5 text-center sm:text-left">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <span className="text-xs font-bold text-slate-800">
                          {formData.kemasjidanStamp?.customStampUrl ? 'Sampel Stempel Kustom Aktif' : 'Stempel Vektor Resmi Kemasjidan'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          (Diletakkan tepat di sebelah kiri Ketua Bidang)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Unggah sampel berkas stempel cap basah fisik Kemasjidan atau gunakan stempel resmi bawaan.
                      </p>

                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                        <input
                          type="file"
                          ref={stampKemasjidanInputRef}
                          accept="image/*"
                          onChange={(e) => handleStampUpload('kemasjidan', e)}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => stampKemasjidanInputRef.current?.click()}
                          className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
                        >
                          <Upload className="w-3.5 h-3.5 text-emerald-700" />
                          {formData.kemasjidanStamp?.customStampUrl ? 'Ganti Sampel Stempel' : 'Unggah Sampel Stempel Kemasjidan'}
                        </button>

                        {formData.kemasjidanStamp?.customStampUrl && (
                          <button
                            type="button"
                            onClick={() => handleResetStamp('kemasjidan')}
                            className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg flex items-center gap-1.5 transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                            Kembali ke Vektor Bawaan
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Warna & Kepekatan */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">
                        Warna Tinta Stempel Kemasjidan:
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        {[
                          { id: 'emerald', label: 'Hijau Masjid', colorBg: 'bg-emerald-700' },
                          { id: 'blue', label: 'Biru Dinas', colorBg: 'bg-blue-700' },
                          { id: 'purple', label: 'Ungu Tradisional', colorBg: 'bg-purple-700' },
                          { id: 'red', label: 'Merah', colorBg: 'bg-red-600' },
                        ].map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                kemasjidanStamp: {
                                  ...(prev.kemasjidanStamp || { enabled: true, opacity: 0.92 }),
                                  color: c.id as any,
                                },
                              }))
                            }
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                              (formData.kemasjidanStamp?.color || 'emerald') === c.id
                                ? 'border-emerald-600 bg-white text-slate-900 shadow-xs ring-1 ring-emerald-500'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            <span className={`w-3 h-3 rounded-full ${c.colorBg}`} />
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">
                        Kepekatan Tinta Stempel: ({Math.round(((formData.kemasjidanStamp?.opacity ?? 0.92)) * 100)}%)
                      </label>
                      <input
                        type="range"
                        min="0.4"
                        max="1.0"
                        step="0.05"
                        value={formData.kemasjidanStamp?.opacity ?? 0.92}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            kemasjidanStamp: {
                              ...(prev.kemasjidanStamp || { enabled: true, color: 'emerald' }),
                              opacity: parseFloat(e.target.value),
                            },
                          }))
                        }
                        className="w-full accent-emerald-700"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                        <span>Transparan (40%)</span>
                        <span>Penuh (100%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Box Stempel Ketua Yayasan (H. Arifin Lambaga) */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-700" />
                    <h3 className="text-sm font-bold text-slate-900">
                      3. Stempel Ketua Yayasan Masjid Baiturrahman
                    </h3>
                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      Posisi: Tepat di Sebelah Kiri Ketua Yayasan
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Stempel resmi "YAYASAN MASJID BAITURRAHMAN - KOTA DEPOK" yang ditempatkan tepat di sebelah kiri tanda tangan Ketua Yayasan.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.yayasanStamp?.enabled ?? true}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          yayasanStamp: {
                            ...(prev.yayasanStamp || { color: 'emerald', opacity: 0.92 }),
                            enabled: e.target.checked,
                          },
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-700"></div>
                  </label>
                </div>
              </div>

              {(formData.yayasanStamp?.enabled ?? true) && (
                <div className="pt-4 border-t border-slate-200 space-y-4">
                  {/* Pratinjau & Tombol Upload Sampel */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 rounded-lg border border-slate-200">
                    <div className="w-24 h-24 bg-slate-50 border border-dashed border-slate-300 rounded-lg flex items-center justify-center p-2 relative shrink-0">
                      {formData.yayasanStamp?.customStampUrl ? (
                        <img
                          src={formData.yayasanStamp.customStampUrl}
                          alt="Sampel Stempel Yayasan"
                          style={{ opacity: formData.yayasanStamp.opacity ?? 0.92 }}
                          className="max-h-20 max-w-20 object-contain transform -rotate-6 select-none"
                        />
                      ) : (
                        <YayasanOfficialStamp
                          color={formData.yayasanStamp?.color || 'emerald'}
                          opacity={formData.yayasanStamp?.opacity ?? 0.92}
                          size={76}
                        />
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5 text-center sm:text-left">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <span className="text-xs font-bold text-slate-800">
                          {formData.yayasanStamp?.customStampUrl ? 'Sampel Stempel Kustom Aktif' : 'Stempel Vektor Resmi Yayasan'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          (Diletakkan tepat di sebelah kiri Ketua Yayasan)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Unggah sampel berkas stempel cap basah fisik Yayasan atau gunakan stempel resmi bawaan.
                      </p>

                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                        <input
                          type="file"
                          ref={stampYayasanInputRef}
                          accept="image/*"
                          onChange={(e) => handleStampUpload('yayasan', e)}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => stampYayasanInputRef.current?.click()}
                          className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
                        >
                          <Upload className="w-3.5 h-3.5 text-emerald-700" />
                          {formData.yayasanStamp?.customStampUrl ? 'Ganti Sampel Stempel' : 'Unggah Sampel Stempel Yayasan'}
                        </button>

                        {formData.yayasanStamp?.customStampUrl && (
                          <button
                            type="button"
                            onClick={() => handleResetStamp('yayasan')}
                            className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg flex items-center gap-1.5 transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                            Kembali ke Vektor Bawaan
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Warna & Kepekatan */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">
                        Warna Tinta Stempel Yayasan:
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        {[
                          { id: 'emerald', label: 'Hijau Masjid', colorBg: 'bg-emerald-700' },
                          { id: 'blue', label: 'Biru Dinas', colorBg: 'bg-blue-700' },
                          { id: 'purple', label: 'Ungu Tradisional', colorBg: 'bg-purple-700' },
                          { id: 'red', label: 'Merah', colorBg: 'bg-red-600' },
                        ].map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                yayasanStamp: {
                                  ...(prev.yayasanStamp || { enabled: true, opacity: 0.92 }),
                                  color: c.id as any,
                                },
                              }))
                            }
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                              (formData.yayasanStamp?.color || 'emerald') === c.id
                                ? 'border-emerald-600 bg-white text-slate-900 shadow-xs ring-1 ring-emerald-500'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            <span className={`w-3 h-3 rounded-full ${c.colorBg}`} />
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">
                        Kepekatan Tinta Stempel: ({Math.round(((formData.yayasanStamp?.opacity ?? 0.92)) * 100)}%)
                      </label>
                      <input
                        type="range"
                        min="0.4"
                        max="1.0"
                        step="0.05"
                        value={formData.yayasanStamp?.opacity ?? 0.92}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            yayasanStamp: {
                              ...(prev.yayasanStamp || { enabled: true, color: 'emerald' }),
                              opacity: parseFloat(e.target.value),
                            },
                          }))
                        }
                        className="w-full accent-emerald-700"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                        <span>Transparan (40%)</span>
                        <span>Penuh (100%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Box QR Code Autentikasi Dokumen */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    QR Code Verifikasi Keaslian Dokumen
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Membuat kode verifikasi unik untuk membuktikan surat sah diterbitkan oleh Pengurus Remasbara Baiturrahman Mekarjaya.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.verification.enabled}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        verification: {
                          ...prev.verification,
                          enabled: e.target.checked,
                          verificationCode:
                            prev.verification.verificationCode ||
                            generateVerificationCode(prev.letterNumber),
                        },
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-700"></div>
                </label>
              </div>

              {formData.verification.enabled && (
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">Kode Verifikasi:</span>
                    <span className="font-mono font-bold text-xs text-emerald-900 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                      {formData.verification.verificationCode}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Penerima surat dapat memindai QR Code untuk memeriksa nomor surat, perihal, dan tanggal penerbitan yang terdaftar.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* BOTTOM ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-6 border-t border-slate-200">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Status:</span>
            <span className="font-semibold text-slate-700 capitalize">{formData.status}</span>
            <span>·</span>
            <span>{formData.contentParagraphs.length} paragraf isi</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={() => onPreview(formData)}
              className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              <Eye className="w-4 h-4 text-slate-700" />
              Pratinjau A4
            </button>

            <button
              type="submit"
              className="flex-1 sm:flex-none px-5 py-2.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              <Save className="w-4 h-4" />
              Simpan ke Arsip
            </button>
          </div>
        </div>
      </form>

      {/* Signature Modal */}
      <SignatureCanvasModal
        isOpen={sigModalState.isOpen}
        onClose={() => setSigModalState((prev) => ({ ...prev, isOpen: false }))}
        onSave={handleSaveSignatureFromModal}
        title={sigModalState.title}
        signatoryName={sigModalState.signatoryName}
        signatoryRole={sigModalState.signatoryRole}
      />
    </div>
  );
};
