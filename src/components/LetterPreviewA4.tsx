import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { LetterDocument, OrganizationProfile } from '../types/letter';
import {
  RemasbaraLogo,
  RemasbaraOfficialStamp,
  KemasjidanOfficialStamp,
  YayasanOfficialStamp,
} from './RemasbaraVisuals';

interface LetterPreviewA4Props {
  letter: LetterDocument | null | undefined;
  orgProfile?: OrganizationProfile | null;
  isLoadingAssets?: boolean;
}

export const LetterPreviewA4: React.FC<LetterPreviewA4Props> = ({
  letter,
  orgProfile,
  isLoadingAssets = false,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Fallback safely if letter is missing or malformed
  if (!letter) {
    return (
      <div className="print-sheet bg-white text-slate-500 w-full max-w-[210mm] min-h-[120mm] mx-auto p-12 shadow-xl border border-slate-200 flex items-center justify-center text-center">
        <p className="text-sm italic">Data dokumen surat tidak tersedia untuk dipratinjau.</p>
      </div>
    );
  }

  // Safe normalized profile with bullet-proof fallbacks
  const safeProfile: Partial<OrganizationProfile> = orgProfile || {
    name: 'Remasbara',
    address: 'Jl. Tole Iskandar KM 3',
    kelurahan: 'Mekarjaya',
    kecamatan: 'Sukmajaya',
    city: 'Kota Depok',
    postalCode: '16412',
    phone: '0896-4333-1415',
    email: 'remasbaraofficial@gmail.com',
    codeIdentifier: 'RMB',
    logoUrl: undefined,
    defaultStampUrl: undefined,
    defaultKemasjidanStampUrl: undefined,
    defaultYayasanStampUrl: undefined,
  };

  // Safe normalized signatories
  const safeSignatories = letter.signatories || {};
  const safeFirstSig = safeSignatories.firstSignatory || {
    name: 'Muhammad Faizal Addib',
    role: 'Ketua Umum Remasbara',
    includeSignature: false,
    idNumber: undefined,
    signatureDataUrl: undefined,
  };
  const safeSecondSig = safeSignatories.secondSignatory || {
    name: 'Muhammad Akbar Izzati',
    role: 'Sekretaris Umum',
    includeSignature: false,
    idNumber: undefined,
    signatureDataUrl: undefined,
  };
  const safeKemasjidanSig = safeSignatories.kemasjidanSignatory;
  const safeYayasanSig = safeSignatories.yayasanSignatory;

  const safeVerification = letter.verification || { enabled: false, verificationCode: '' };
  const safeContentParagraphs = Array.isArray(letter.contentParagraphs)
    ? letter.contentParagraphs
    : [];
  const safeCopies = Array.isArray(letter.copies) ? letter.copies : [];

  const effectiveRemasbaraStampUrl = letter.stamp?.customStampUrl || safeProfile.defaultStampUrl;
  const effectiveKemasjidanStampUrl = letter.kemasjidanStamp?.customStampUrl || safeProfile.defaultKemasjidanStampUrl;
  const effectiveYayasanStampUrl = letter.yayasanStamp?.customStampUrl || safeProfile.defaultYayasanStampUrl;

  useEffect(() => {
    if (safeVerification?.enabled && safeVerification?.verificationCode) {
      const verifData = `REMASBARA-MBR|NO:${letter?.letterNumber || ''}|TGL:${letter?.dateFormattedMasehi || ''}|HAL:${letter?.subject || ''}|KODE:${safeVerification.verificationCode}`;
      QRCode.toDataURL(verifData, {
        width: 140,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Failed generating QR:', err));
    } else {
      setQrDataUrl('');
    }
  }, [
    safeVerification?.enabled,
    safeVerification?.verificationCode,
    letter?.letterNumber,
    letter?.dateFormattedMasehi,
    letter?.subject,
  ]);

  return (
    <div className="print-sheet bg-white text-slate-900 w-full max-w-[210mm] min-h-[297mm] mx-auto p-8 sm:p-12 shadow-xl border border-slate-200 print:border-none print:shadow-none print:p-0 font-serif-doc text-[13.5px] leading-relaxed flex flex-col justify-between">
      <div>
        {/* KOP SURAT RESMI REMASBARA */}
        <div className="flex items-center gap-4 border-b-[2.5px] border-slate-900 pb-2">
          {/* Logo Remasbara */}
          <div className="shrink-0 flex items-center justify-center">
            {isLoadingAssets ? (
              <div className="w-20 h-20 sm:w-[88px] sm:h-[88px] rounded-lg bg-slate-100 animate-pulse flex items-center justify-center border border-slate-200">
                <span className="text-[10px] text-slate-400 font-sans">Memuat...</span>
              </div>
            ) : safeProfile.logoUrl ? (
              <img
                src={safeProfile.logoUrl}
                alt={`Logo ${safeProfile.name || 'Remasbara'}`}
                className="w-20 h-20 sm:w-[88px] sm:h-[88px] object-contain"
              />
            ) : (
              <RemasbaraLogo size={88} />
            )}
          </div>

          {/* Kop Text Info */}
          <div className="flex-1 text-center font-sans">
            <h1 className="text-xl sm:text-[22px] font-bold text-slate-900 tracking-wide uppercase leading-tight">
              REMAJA MASJID BAITURRAHMAN
            </h1>
            <h2 className="text-xs sm:text-[13px] font-bold text-emerald-950 uppercase tracking-wide">
              CIKUMPA MEKARJAYA SUKMAJAYA KOTA DEPOK
            </h2>
            <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">
              Sekretariat: {safeProfile.address || 'Jl. Tole Iskandar KM 3'}, {safeProfile.kelurahan || 'Mekarjaya'}, {safeProfile.kecamatan || 'Sukmajaya'}, {safeProfile.city || 'Kota Depok'} {safeProfile.postalCode || '16412'}
            </p>
            <p className="text-[9.5px] text-slate-500 leading-snug">
              Hotline: {safeProfile.phone || '0896-4333-1415'} · Surel: {safeProfile.email || 'remasbaraofficial@gmail.com'}
            </p>
          </div>
        </div>
        {/* Secondary thin divider line */}
        <div className="border-b border-slate-900 pt-0.5 mb-6"></div>

        {/* METADATA NOMOR, LAMPIRAN, HAL & TANGGAL */}
        <div className="flex justify-between items-start gap-4 mb-6">
          <div className="space-y-1">
            <div className="flex">
              <span className="w-20 font-medium">Nomor</span>
              <span className="mr-2">:</span>
              <span className="font-semibold font-mono tracking-tight text-slate-900">
                {letter.letterNumber || '-'}
              </span>
            </div>
            <div className="flex">
              <span className="w-20 font-medium">Lampiran</span>
              <span className="mr-2">:</span>
              <span>{letter.attachment || '-'}</span>
            </div>
            <div className="flex">
              <span className="w-20 font-medium">Perihal</span>
              <span className="mr-2">:</span>
              <span className="font-bold underline text-slate-900">{letter.subject || '(Tanpa Perihal)'}</span>
            </div>
          </div>

          <div className="text-right space-y-0.5 font-sans text-xs">
            {letter.dateHijri && (
              <p className="text-slate-600 italic font-serif-doc text-[12.5px]">
                {letter.dateHijri}
              </p>
            )}
            <p className="font-semibold text-slate-900 text-[13px]">
              {letter.city || 'Depok'}, {letter.dateFormattedMasehi || ''}
            </p>
          </div>
        </div>

        {/* TUJUAN SURAT */}
        <div className="mb-6 space-y-1">
          <p>Kepada Yth.</p>
          <p className="font-bold text-slate-900">{letter.recipientName || 'Bapak/Ibu'}</p>
          {letter.recipientInstitution && <p>{letter.recipientInstitution}</p>}
        </div>

        {/* SALAM PEMBUKA */}
        <div className="mb-3">
          <p className="italic font-medium">{letter.openingGreeting || "Assalamu'alaikum Wr. Wb."},</p>
        </div>

        {/* PARAGRAF PEMBUKA */}
        {letter.openingParagraph && (
          <p className="mb-4 text-justify indent-8 leading-relaxed whitespace-pre-line">
            {letter.openingParagraph || ''}
          </p>
        )}

        {/* DETAIL KEGIATAN / ACARA (JIKA ADA) */}
        {letter.eventDetails && letter.eventDetails.enabled && (
          <div className="my-4 ml-6 pl-4 border-l-2 border-emerald-700/40 space-y-1.5 font-sans text-[13px]">
            {letter.eventDetails.dayDate && (
              <div className="flex">
                <span className="w-28 font-semibold text-slate-700">Hari, Tanggal</span>
                <span className="mr-2">:</span>
                <span className="font-medium text-slate-900">{letter.eventDetails.dayDate}</span>
              </div>
            )}
            {letter.eventDetails.time && (
              <div className="flex">
                <span className="w-28 font-semibold text-slate-700">Waktu</span>
                <span className="mr-2">:</span>
                <span className="font-medium text-slate-900">{letter.eventDetails.time}</span>
              </div>
            )}
            {letter.eventDetails.location && (
              <div className="flex">
                <span className="w-28 font-semibold text-slate-700">Tempat</span>
                <span className="mr-2">:</span>
                <span className="font-medium text-slate-900 whitespace-pre-line">{letter.eventDetails.location || ''}</span>
              </div>
            )}
            {letter.eventDetails.agenda && (
              <div className="flex">
                <span className="w-28 font-semibold text-slate-700">Agenda / Acara</span>
                <span className="mr-2">:</span>
                <span className="font-bold text-slate-900 whitespace-pre-line">{letter.eventDetails.agenda || ''}</span>
              </div>
            )}
            {letter.eventDetails.dressCode && (
              <div className="flex">
                <span className="w-28 font-semibold text-slate-700">Pakaian</span>
                <span className="mr-2">:</span>
                <span className="font-medium text-slate-800">{letter.eventDetails.dressCode}</span>
              </div>
            )}
          </div>
        )}

        {/* PARAGRAF ISI */}
        {safeContentParagraphs.length > 0 && (
          <div className="space-y-3 mb-4 text-justify">
            {safeContentParagraphs.map((p, idx) => (
              <p key={idx} className="indent-8 leading-relaxed whitespace-pre-line">
                {p || ''}
              </p>
            ))}
          </div>
        )}

        {/* PARAGRAF PENUTUP */}
        {letter.closingParagraph && (
          <p className="mb-3 text-justify indent-8 leading-relaxed whitespace-pre-line">
            {letter.closingParagraph || ''}
          </p>
        )}

        {/* SALAM PENUTUP */}
        <div className="mb-6">
          <p className="italic font-medium">{letter.closingGreeting || "Wassalamu'alaikum Wr. Wb."}</p>
        </div>

        {/* AREA TANDA TANGAN RESMI */}
        <div className="mt-8">
          <div className="relative grid grid-cols-2 gap-8 text-center pt-2">
            {/* PENANDATANGAN 1 (KETUA UMUM) DENGAN STEMPEL DI SEBELAH KIRI */}
            <div className="relative flex flex-col items-center justify-between min-h-[140px]">
              {/* STEMPEL RESMI REMASBARA TEPAT DI SEBELAH KIRI KETUA UMUM */}
              {letter.stamp?.enabled && (
                <div
                  className="absolute -left-6 sm:-left-8 top-1 z-10 pointer-events-none"
                  style={{ transform: 'translateX(2cm)' }}
                >
                  {effectiveRemasbaraStampUrl ? (
                    <img
                      src={effectiveRemasbaraStampUrl}
                      alt="Stempel Resmi Remasbara"
                      style={{ opacity: letter.stamp.opacity ?? 0.92 }}
                      className="w-[130px] h-[130px] object-contain transform -rotate-6 select-none"
                    />
                  ) : (
                    <RemasbaraOfficialStamp
                      color={letter.stamp.color || 'red'}
                      opacity={letter.stamp.opacity ?? 0.92}
                      size={135}
                    />
                  )}
                </div>
              )}

              <p className="text-xs font-semibold text-slate-800 font-sans">
                {safeFirstSig.role || 'Ketua Umum'}
              </p>
              <div className="h-[50px] max-h-[50px] flex items-center justify-center my-1 overflow-hidden">
                {safeFirstSig.includeSignature && safeFirstSig.signatureDataUrl ? (
                  <img
                    src={safeFirstSig.signatureDataUrl}
                    alt="Tanda Tangan Ketua Umum"
                    className="max-h-[50px] h-full w-auto max-w-[160px] object-contain select-none block mx-auto"
                  />
                ) : (
                  <div className="h-[50px] flex items-center text-xs text-slate-300 italic">
                    (Tanda Tangan)
                  </div>
                )}
              </div>
              <div className="border-t border-slate-900 pt-1 w-44 font-sans">
                <p className="font-bold text-xs text-slate-900 underline">
                  {safeFirstSig.name || 'Muhammad Faizal Addib'}
                </p>
                {safeFirstSig.idNumber && (
                  <p className="text-[10px] text-slate-600 font-mono">
                    {safeFirstSig.idNumber}
                  </p>
                )}
              </div>
            </div>

            {/* PENANDATANGAN 2 (SEKRETARIS UMUM) */}
            <div className="flex flex-col items-center justify-between min-h-[140px]">
              <p className="text-xs font-semibold text-slate-800 font-sans">
                {safeSecondSig.role || 'Sekretaris Umum'}
              </p>
              <div className="h-[50px] max-h-[50px] flex items-center justify-center my-1 overflow-hidden">
                {safeSecondSig.includeSignature && safeSecondSig.signatureDataUrl ? (
                  <img
                    src={safeSecondSig.signatureDataUrl}
                    alt="Tanda Tangan Sekretaris Umum"
                    className="max-h-[50px] h-full w-auto max-w-[160px] object-contain select-none block mx-auto"
                  />
                ) : (
                  <div className="h-[50px] flex items-center text-xs text-slate-300 italic">
                    (Tanda Tangan)
                  </div>
                )}
              </div>
              <div className="border-t border-slate-900 pt-1 w-44 font-sans">
                <p className="font-bold text-xs text-slate-900 underline">
                  {safeSecondSig.name || 'Muhammad Akbar Izzati'}
                </p>
                {safeSecondSig.idNumber && (
                  <p className="text-[10px] text-slate-600 font-mono">
                    {safeSecondSig.idNumber}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* AREA MENGETAHUI (PENGURUS YAYASAN) */}
          {((safeKemasjidanSig && safeKemasjidanSig.enabled) ||
            (safeYayasanSig && safeYayasanSig.enabled) ||
            (safeSignatories.advisorSignatory && safeSignatories.advisorSignatory.enabled)) && (
            <div className="mt-6 pt-2 font-sans">
              <p className="text-center text-xs font-semibold text-slate-700 mb-2">
                Mengetahui,
              </p>

              {/* JIKA KEDUANYA AKTIF: TAMPILKAN 2 KOLOM (KIRI: KETUA YAYASAN, KANAN: KETUA BIDANG KEMASJIDAN) */}
              {safeKemasjidanSig?.enabled && safeYayasanSig?.enabled ? (
                <div className="grid grid-cols-2 gap-8 text-center pt-1">
                  {/* 1. SISI KIRI: KETUA YAYASAN DENGAN STEMPEL DI SEBELAH KIRI */}
                  <div className="relative flex flex-col items-center justify-between min-h-[140px]">
                    {/* STEMPEL RESMI YAYASAN TEPAT DI SEBELAH KIRI */}
                    {(letter.yayasanStamp?.enabled ?? true) && (
                      <div
                        className="absolute -left-6 sm:-left-8 top-1 z-10 pointer-events-none"
                        style={{ transform: 'translateX(2cm)' }}
                      >
                        {effectiveYayasanStampUrl ? (
                          <img
                            src={effectiveYayasanStampUrl}
                            alt="Stempel Yayasan"
                            style={{ opacity: letter.yayasanStamp?.opacity ?? 0.92 }}
                            className="w-[130px] h-[130px] object-contain transform -rotate-6 select-none"
                          />
                        ) : (
                          <YayasanOfficialStamp
                            color={letter.yayasanStamp?.color || 'emerald'}
                            opacity={letter.yayasanStamp?.opacity ?? 0.92}
                            size={135}
                          />
                        )}
                      </div>
                    )}

                    <p className="text-xs font-semibold text-slate-800">
                      {safeYayasanSig.role || 'Ketua Yayasan Masjid Baiturrahman'}
                    </p>
                    <div className="h-[50px] max-h-[50px] flex items-center justify-center my-1 overflow-hidden">
                      {safeYayasanSig.includeSignature && safeYayasanSig.signatureDataUrl ? (
                        <img
                          src={safeYayasanSig.signatureDataUrl}
                          alt="Tanda Tangan Ketua Yayasan"
                          className="max-h-[50px] h-full w-auto max-w-[160px] object-contain select-none block mx-auto"
                        />
                      ) : (
                        <div className="h-[50px] flex items-center text-xs text-slate-300 italic">
                          (Tanda Tangan)
                        </div>
                      )}
                    </div>
                    <div className="border-t border-slate-900 pt-1 w-48">
                      <p className="font-bold text-xs text-slate-900 underline">
                        {safeYayasanSig.name || 'H. Arifin Lambaga'}
                      </p>
                      {safeYayasanSig.idNumber && (
                        <p className="text-[10px] text-slate-600 font-mono">
                          {safeYayasanSig.idNumber}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 2. SISI KANAN: KETUA BIDANG KEMASJIDAN DENGAN STEMPEL DI SEBELAH KIRI */}
                  <div className="relative flex flex-col items-center justify-between min-h-[140px]">
                    {/* STEMPEL RESMI BIDANG KEMASJIDAN TEPAT DI SEBELAH KIRI */}
                    {(letter.kemasjidanStamp?.enabled ?? true) && (
                      <div
                        className="absolute -left-6 sm:-left-8 top-1 z-10 pointer-events-none"
                        style={{ transform: 'translateX(2cm)' }}
                      >
                        {effectiveKemasjidanStampUrl ? (
                          <img
                            src={effectiveKemasjidanStampUrl}
                            alt="Stempel Bidang Kemasjidan"
                            style={{ opacity: letter.kemasjidanStamp?.opacity ?? 0.92 }}
                            className="w-[130px] h-[130px] object-contain transform -rotate-6 select-none"
                          />
                        ) : (
                          <KemasjidanOfficialStamp
                            color={letter.kemasjidanStamp?.color || 'emerald'}
                            opacity={letter.kemasjidanStamp?.opacity ?? 0.92}
                            size={135}
                          />
                        )}
                      </div>
                    )}

                    <p className="text-xs font-semibold text-slate-800">
                      {safeKemasjidanSig.role || 'Ketua Bidang Kemasjidan'}
                    </p>
                    <div className="h-[50px] max-h-[50px] flex items-center justify-center my-1 overflow-hidden">
                      {safeKemasjidanSig.includeSignature && safeKemasjidanSig.signatureDataUrl ? (
                        <img
                          src={safeKemasjidanSig.signatureDataUrl}
                          alt="Tanda Tangan Ketua Bidang Kemasjidan"
                          className="max-h-[50px] h-full w-auto max-w-[160px] object-contain select-none block mx-auto"
                        />
                      ) : (
                        <div className="h-[50px] flex items-center text-xs text-slate-300 italic">
                          (Tanda Tangan)
                        </div>
                      )}
                    </div>
                    <div className="border-t border-slate-900 pt-1 w-48">
                      <p className="font-bold text-xs text-slate-900 underline">
                        {safeKemasjidanSig.name || 'H. Nursyamsu Hidayat'}
                      </p>
                      {safeKemasjidanSig.idNumber && (
                        <p className="text-[10px] text-slate-600 font-mono">
                          {safeKemasjidanSig.idNumber}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* JIKA HANYA SATU YANG AKTIF: TENGAH DENGAN STEMPEL DI SEBELAH KIRI */
                <div className="flex flex-col items-center justify-center text-center">
                  {(() => {
                    const isKemasjidan = safeKemasjidanSig?.enabled;
                    const isYayasan = safeYayasanSig?.enabled;
                    const activeAdvisor = isKemasjidan
                      ? safeKemasjidanSig
                      : isYayasan
                      ? safeYayasanSig
                      : safeSignatories?.advisorSignatory;

                    if (!activeAdvisor) return null;

                    return (
                      <div className="relative flex flex-col items-center justify-between min-h-[140px]">
                        {/* Stempel di sebelah kiri untuk single advisor */}
                        {isKemasjidan && (letter.kemasjidanStamp?.enabled ?? true) && (
                          <div
                            className="absolute -left-12 sm:-left-16 top-1 z-10 pointer-events-none"
                            style={{ transform: 'translateX(2cm)' }}
                          >
                            {effectiveKemasjidanStampUrl ? (
                              <img
                                src={effectiveKemasjidanStampUrl}
                                alt="Stempel Bidang Kemasjidan"
                                style={{ opacity: letter.kemasjidanStamp?.opacity ?? 0.92 }}
                                className="w-[130px] h-[130px] object-contain transform -rotate-6 select-none"
                              />
                            ) : (
                              <KemasjidanOfficialStamp
                                color={letter.kemasjidanStamp?.color || 'emerald'}
                                opacity={letter.kemasjidanStamp?.opacity ?? 0.92}
                                size={135}
                              />
                            )}
                          </div>
                        )}
                        {(isYayasan || (!isKemasjidan && !isYayasan)) && (letter.yayasanStamp?.enabled ?? true) && (
                          <div
                            className="absolute -left-12 sm:-left-16 top-1 z-10 pointer-events-none"
                            style={{ transform: 'translateX(2cm)' }}
                          >
                            {effectiveYayasanStampUrl ? (
                              <img
                                src={effectiveYayasanStampUrl}
                                alt="Stempel Yayasan"
                                style={{ opacity: letter.yayasanStamp?.opacity ?? 0.92 }}
                                className="w-[130px] h-[130px] object-contain transform -rotate-6 select-none"
                              />
                            ) : (
                              <YayasanOfficialStamp
                                color={letter.yayasanStamp?.color || 'emerald'}
                                opacity={letter.yayasanStamp?.opacity ?? 0.92}
                                size={135}
                              />
                            )}
                          </div>
                        )}

                        <p className="text-xs font-bold text-slate-900">
                          {activeAdvisor.role || 'Penasihat'}
                        </p>
                        <div className="h-[50px] max-h-[50px] flex items-center justify-center my-1 overflow-hidden">
                          {activeAdvisor.includeSignature && activeAdvisor.signatureDataUrl ? (
                            <img
                              src={activeAdvisor.signatureDataUrl}
                              alt={`Tanda Tangan ${activeAdvisor.role || 'Penasihat'}`}
                              className="max-h-[50px] h-full w-auto max-w-[160px] object-contain select-none block mx-auto"
                            />
                          ) : (
                            <div className="h-[50px] flex items-center text-xs text-slate-300 italic">
                              (Tanda Tangan)
                            </div>
                          )}
                        </div>
                        <div className="border-t border-slate-900 pt-1 w-52">
                          <p className="font-bold text-xs text-slate-900 underline">
                            {activeAdvisor.name || '-'}
                          </p>
                          {activeAdvisor.idNumber && (
                            <p className="text-[10px] text-slate-600 font-mono">
                              {activeAdvisor.idNumber}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* FOOTER: TEMBUSAN & QR VERIFIKASI */}
      <div className="mt-8 pt-4 border-t border-slate-200 flex items-end justify-between gap-4 font-sans text-xs">
        {/* Tembusan */}
        <div className="space-y-0.5">
          {safeCopies.length > 0 && (
            <>
              <p className="font-semibold text-slate-700 text-[11px]">Tembusan:</p>
              <ol className="list-decimal list-inside text-[10px] text-slate-600 space-y-0.5">
                {safeCopies.map((copy, i) => (
                  <li key={i}>{copy || ''}</li>
                ))}
              </ol>
            </>
          )}
        </div>

        {/* QR Code Autentikasi Elektronik */}
        {safeVerification.enabled && (
          <div className="flex items-center gap-2 border border-slate-200 bg-slate-50/80 p-1.5 rounded text-[10px] text-slate-600">
            {qrDataUrl && (
              <img
                src={qrDataUrl}
                alt="QR Verifikasi Dokumen Remasbara"
                className="w-12 h-12 shrink-0 bg-white p-0.5 border border-slate-200"
              />
            )}
            <div className="text-left leading-tight">
              <span className="font-bold text-slate-800 block">Surat Sah Terverifikasi</span>
              <span className="font-mono text-[9px] text-slate-500 block">
                {safeVerification.verificationCode || '-'}
              </span>
              <span className="text-[8.5px] text-emerald-800 block">
                Sistem Administrasi Remasbara
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
