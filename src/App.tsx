/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LetterList } from './components/LetterList';
import { LetterEditor } from './components/LetterEditor';
import { LetterPreviewModal } from './components/LetterPreviewModal';
import { SignaturesManager } from './components/SignaturesManager';
import { VerificationModal } from './components/VerificationModal';
import { OrgSettingsModal } from './components/OrgSettingsModal';
import { SendLetterModal } from './components/SendLetterModal';
import { SupabaseSyncModal } from './components/SupabaseSyncModal';
import { StampsManagerModal } from './components/StampsManagerModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LetterDocument, OrganizationProfile, SavedSignature } from './types/letter';
import { StorageService, isDefaultSignature } from './utils/storage';
import { SupabaseService, sanitizePayload } from './utils/supabaseClient';
import {
  generateLetterNumber,
  generateVerificationCode,
  getRomanMonth,
} from './utils/dateAndNumber';
import { CheckCircle2, MapPin, Mail, Phone, RefreshCw, Database, Loader2 } from 'lucide-react';
import { RemasbaraLogo } from './components/RemasbaraVisuals';

export default function App() {
  const [letters, setLetters] = useState<LetterDocument[]>([]);
  const [orgProfile, setOrgProfile] = useState<OrganizationProfile>(StorageService.getOrgProfile());
  const [isInitialSyncing, setIsInitialSyncing] = useState<boolean>(true);
  const [currentView, setCurrentView] = useState<'archive' | 'create' | 'edit'>('archive');
  const [activeLetter, setActiveLetter] = useState<LetterDocument | null>(null);

  // Modals
  const [previewLetter, setPreviewLetter] = useState<LetterDocument | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [sendLetter, setSendLetter] = useState<LetterDocument | null>(null);
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [isSignaturesOpen, setIsSignaturesOpen] = useState(false);
  const [isStampsOpen, setIsStampsOpen] = useState(false);
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [isOrgSettingsOpen, setIsOrgSettingsOpen] = useState(false);
  const [isSupabaseOpen, setIsSupabaseOpen] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  useEffect(() => {
    let isMounted = true;

    // Memuat data langsung dari tabel-tabel Supabase saat awal dimuat (Initial Fetch)
    const performInitialCloudSync = async () => {
      try {
        const [remoteLetters, remoteProfile, remoteStamps, remoteSignatures] = await Promise.all([
          SupabaseService.fetchLetters(),
          SupabaseService.fetchOrgProfile(),
          SupabaseService.fetchStamps(),
          SupabaseService.fetchSignatures(),
        ]);

        if (!isMounted) return;

        // 1. SURAT: Segera timpa state lokal dengan data cloud Supabase
        if (remoteLetters && remoteLetters.length > 0) {
          setLetters(remoteLetters);
          localStorage.setItem('remasbara_letters_v1', JSON.stringify(remoteLetters));
        } else {
          // Hanya fallback ke lokal jika database kosong atau belum terisi
          const local = StorageService.getLetters();
          setLetters(local);
          if (local && local.length > 0) {
            SupabaseService.syncAllLetters(local).catch(() => {});
          }
        }

        // 2. KOP SURAT / PROFIL ORGANISASI: Segera timpa state lokal dengan data cloud Supabase
        const effectiveProfile = remoteProfile || StorageService.getOrgProfile();
        if (remoteStamps && remoteStamps.length > 0) {
          const remasbaraStamp = remoteStamps.find((s) => s.id === 'stamp-remasbara' || s.category === 'remasbara');
          const kemasjidanStamp = remoteStamps.find((s) => s.id === 'stamp-kemasjidan' || s.category === 'kemasjidan');
          const yayasanStamp = remoteStamps.find((s) => s.id === 'stamp-yayasan' || s.category === 'yayasan');
          if (remasbaraStamp?.imageUrl && !effectiveProfile.defaultStampUrl) {
            effectiveProfile.defaultStampUrl = remasbaraStamp.imageUrl;
          }
          if (kemasjidanStamp?.imageUrl && !effectiveProfile.defaultKemasjidanStampUrl) {
            effectiveProfile.defaultKemasjidanStampUrl = kemasjidanStamp.imageUrl;
          }
          if (yayasanStamp?.imageUrl && !effectiveProfile.defaultYayasanStampUrl) {
            effectiveProfile.defaultYayasanStampUrl = yayasanStamp.imageUrl;
          }
        }
        setOrgProfile(effectiveProfile);
        StorageService.saveOrgProfile(effectiveProfile);

        // 3. MASTER STEMPEL: Segera timpa state lokal dengan data cloud Supabase
        if (remoteStamps && remoteStamps.length > 0) {
          localStorage.setItem('remasbara_stamps_v1', JSON.stringify(remoteStamps));
        } else {
          const localStamps = StorageService.getStamps();
          SupabaseService.syncAllStamps(localStamps).catch(() => {});
        }

        // 4. MASTER TTD: Segera timpa state lokal dengan data cloud Supabase
        if (remoteSignatures && remoteSignatures.length > 0) {
          localStorage.setItem('remasbara_signatures_v1', JSON.stringify(remoteSignatures));
          try {
            window.dispatchEvent(new Event('signatures-updated'));
          } catch {}
        } else {
          const localSigs = StorageService.getSignatures();
          SupabaseService.syncSignatures(localSigs).catch(() => {});
        }
      } catch (err) {
        console.warn('Initial Supabase sync error:', err);
        setLetters(StorageService.getLetters());
        setOrgProfile(StorageService.getOrgProfile());
      } finally {
        if (isMounted) {
          setIsInitialSyncing(false);
        }
      }
    };

    performInitialCloudSync();

    // Safety timer batas maksimum loading 2.5 detik agar antarmuka tidak terhambat
    const safetyTimeout = setTimeout(() => {
      if (isMounted) {
        setIsInitialSyncing(false);
      }
    }, 2500);

    // Multi-Tab Synchronizer
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'remasbara_letters_v1') {
        setLetters(StorageService.getLetters());
      } else if (e.key === 'remasbara_org_profile_v1') {
        setOrgProfile(StorageService.getOrgProfile());
      } else if (e.key === 'remasbara_signatures_v1') {
        setLetters(StorageService.getLetters());
      } else if (e.key === 'remasbara_stamps_v1') {
        setOrgProfile(StorageService.getOrgProfile());
      }
    };

    const handleSignaturesUpdated = () => {
      setLetters(StorageService.getLetters());
    };

    const handleOrgProfileUpdated = (e: any) => {
      if (e?.detail) {
        setOrgProfile(e.detail);
      } else {
        setOrgProfile(StorageService.getOrgProfile());
      }
    };

    const handleStampsUpdated = async () => {
      try {
        const remote = await SupabaseService.fetchOrgProfile();
        if (remote) {
          setOrgProfile(remote);
        } else {
          setOrgProfile(StorageService.getOrgProfile());
        }
      } catch {
        setOrgProfile(StorageService.getOrgProfile());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('signatures-updated', handleSignaturesUpdated);
    window.addEventListener('stamps-updated', handleStampsUpdated);
    window.addEventListener('org-profile-updated', handleOrgProfileUpdated);
    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('signatures-updated', handleSignaturesUpdated);
      window.removeEventListener('stamps-updated', handleStampsUpdated);
      window.removeEventListener('org-profile-updated', handleOrgProfileUpdated);
    };
  }, []);

  const refreshLetters = async () => {
    try {
      const remote = await SupabaseService.fetchLetters();
      if (remote && remote.length > 0) {
        setLetters(remote);
        localStorage.setItem('remasbara_letters_v1', JSON.stringify(remote));
        return;
      }
    } catch {}
    setLetters(StorageService.getLetters());
  };

  const refreshOrgProfile = async () => {
    try {
      const remote = await SupabaseService.fetchOrgProfile();
      if (remote) {
        setOrgProfile(remote);
        StorageService.saveOrgProfile(remote);
        return;
      }
    } catch {}
    const profile = StorageService.getOrgProfile();
    setOrgProfile(profile);
    SupabaseService.saveOrgProfile(profile).catch(() => {});
  };

  const handleStartCreate = async () => {
    try {
      const nextSeq = await SupabaseService.getNextLetterSequence();
      const blank = StorageService.createNewBlankLetterWithSeq(nextSeq);
      setActiveLetter(blank);
    } catch {
      const blank = StorageService.createNewBlankLetter();
      setActiveLetter(blank);
    }
    setCurrentView('create');
  };

  const handleStartEdit = (letter: LetterDocument) => {
    setActiveLetter(letter);
    setCurrentView('edit');
  };

  const handleDuplicate = async (source: LetterDocument) => {
    const nextSeq = await SupabaseService.getNextLetterSequence();
    const now = new Date();
    const roman = getRomanMonth(now);
    const yr = now.getFullYear();
    const newNumber = generateLetterNumber(
      nextSeq,
      source.categoryCode,
      roman,
      yr,
      orgProfile.codeIdentifier || 'RMB'
    );
    const newVerifCode = generateVerificationCode(newNumber);

    const duplicated: LetterDocument = {
      ...source,
      id: 'doc-' + Date.now().toString(36),
      letterNumber: newNumber,
      isCustomNumber: false,
      sequenceNumber: nextSeq,
      romanMonth: roman,
      year: yr,
      status: 'draft',
      verification: {
        enabled: true,
        verificationCode: newVerifCode,
        verifiedAt: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const clean = sanitizePayload(duplicated);
    const res = await SupabaseService.saveLetter(clean);
    if (!res.success) {
      alert("Gagal menduplikasi surat ke Supabase: " + (res.error || 'Terjadi kesalahan'));
      return;
    }

    try {
      StorageService.saveLetter(clean);
    } catch (e) {
      console.warn('Storage warning:', e);
    }
    refreshLetters();
    showToast(`Surat berhasil diduplikasi menjadi nomor: ${newNumber}`);
  };

  const handleDeleteLetter = async (id: string) => {
    StorageService.deleteLetter(id);
    refreshLetters();
    await SupabaseService.deleteLetter(id).catch(() => {});
    showToast('Surat berhasil dihapus dari arsip');
  };

  const handleSaveLetter = async (savedLetter: LetterDocument) => {
    try {
      // 1. Pastikan seluruh nilai payload tidak ada yang bernilai undefined (fallback ke null / "")
      const cleanLetter = sanitizePayload(savedLetter);

      // 2. Simpan surat ke tabel Supabase (letters)
      const res = await SupabaseService.saveLetter(cleanLetter);
      if (!res.success) {
        console.error("Gagal simpan surat ke Supabase:", res.error);
        alert("Gagal simpan surat: " + (res.error || "Gagal menghubungi database Supabase"));
        return;
      }

      // 3. Simpan ke local storage dengan proteksi kuota aman (tidak melempar QuotaExceededError)
      try {
        StorageService.saveLetter(cleanLetter);
      } catch (storageErr) {
        console.warn("Storage warning (surat tetap aman di Cloud Supabase):", storageErr);
      }

      // 4. Refresh data surat dari database / local
      await refreshLetters();

      // 5. Tutup modal/tampilan form dan kembali ke arsip surat
      setCurrentView('archive');
      setActiveLetter(null);

      alert("Surat berhasil disimpan!");
      showToast(`Surat ${cleanLetter.letterNumber} berhasil disimpan ke arsip!`);
    } catch (err: any) {
      console.error("Error catch simpan surat:", err);
      alert("Terjadi kesalahan: " + (err?.message || err));
    }
  };

  const handleOpenPreview = (letter: LetterDocument) => {
    setPreviewLetter(letter);
    setIsPreviewOpen(true);
  };

  const handleOpenSend = (letter: LetterDocument) => {
    setSendLetter(letter);
    setIsSendOpen(true);
  };

  const handleDirectPrint = (letter: LetterDocument) => {
    setPreviewLetter(letter);
    setIsPreviewOpen(true);
    setTimeout(() => {
      window.print();
    }, 250);
  };

  if (isInitialSyncing) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950 flex flex-col items-center justify-center p-6 text-white select-none">
        <div className="flex flex-col items-center max-w-sm text-center space-y-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-emerald-800/80 border border-emerald-500/40 flex items-center justify-center shadow-xl shadow-emerald-950/60">
              <RemasbaraLogo size={52} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center border-2 border-slate-900 shadow-md">
              <RefreshCw className="w-4 h-4 text-white animate-spin" />
            </div>
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">
              Menghubungkan ke Cloud Supabase
            </h2>
            <p className="text-xs text-emerald-200/90 mt-1.5 leading-relaxed">
              Menyelaraskan arsip surat, profil kop, dan master stempel resmi...
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-emerald-300/80 font-mono bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sinkronisasi Data Real-Time Antar-Perangkat</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="no-print fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        currentView={currentView}
        orgProfile={orgProfile}
        onNavigateArchive={() => setCurrentView('archive')}
        onNavigateCreate={handleStartCreate}
        onOpenSignatures={() => setIsSignaturesOpen(true)}
        onOpenStamps={() => setIsStampsOpen(true)}
        onOpenVerify={() => setIsVerifyOpen(true)}
        onOpenOrgSettings={() => setIsOrgSettingsOpen(true)}
        onOpenSupabase={() => setIsSupabaseOpen(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <ErrorBoundary fallbackTitle="Kendala Memuat Tampilan Utama">
          {currentView === 'archive' && (
            <LetterList
              letters={letters}
              onNewLetter={handleStartCreate}
              onEditLetter={handleStartEdit}
              onPreviewLetter={handleOpenPreview}
              onDuplicateLetter={handleDuplicate}
              onDeleteLetter={handleDeleteLetter}
              onDirectPrint={handleDirectPrint}
              onOpenVerify={() => setIsVerifyOpen(true)}
              onSendLetter={handleOpenSend}
            />
          )}

          {(currentView === 'create' || currentView === 'edit') && activeLetter && (
            <LetterEditor
              initialLetter={activeLetter}
              orgProfile={orgProfile}
              onSave={handleSaveLetter}
              onCancel={() => {
                setCurrentView('archive');
                setActiveLetter(null);
              }}
              onPreview={(doc) => {
                setPreviewLetter(doc);
                setIsPreviewOpen(true);
              }}
            />
          )}
        </ErrorBoundary>
      </main>

      {/* Official Institutional Footer */}
      <footer className="no-print bg-white border-t border-slate-200 mt-auto py-8 px-4 sm:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <p className="font-bold text-slate-800">
              {orgProfile.name} — {orgProfile.subName}
            </p>
            <p className="flex items-center justify-center md:justify-start gap-1 text-[11px] text-slate-500">
              <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>
                {orgProfile.address}, {orgProfile.kelurahan}, {orgProfile.kecamatan}, {orgProfile.city} {orgProfile.postalCode}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-slate-400" />
              {orgProfile.phone}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Mail className="w-3 h-3 text-slate-400" />
              {orgProfile.email}
            </span>
            <span>·</span>
            <span className="text-slate-400 font-mono">
              Kode Surat: {orgProfile.codeIdentifier}
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <LetterPreviewModal
        letter={previewLetter}
        orgProfile={orgProfile}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onEdit={(doc) => {
          setIsPreviewOpen(false);
          handleStartEdit(doc);
        }}
        onSend={(doc) => {
          handleOpenSend(doc);
        }}
      />

      <SendLetterModal
        letter={sendLetter}
        orgProfile={orgProfile}
        isOpen={isSendOpen}
        onClose={() => {
          setIsSendOpen(false);
          setSendLetter(null);
        }}
        onDirectPrint={handleDirectPrint}
      />

      <SignaturesManager
        isOpen={isSignaturesOpen}
        onClose={() => setIsSignaturesOpen(false)}
        onUpdate={refreshLetters}
      />

      <StampsManagerModal
        isOpen={isStampsOpen}
        onClose={() => setIsStampsOpen(false)}
        onUpdate={refreshOrgProfile}
      />

      <VerificationModal
        isOpen={isVerifyOpen}
        onClose={() => setIsVerifyOpen(false)}
        letters={letters}
        onOpenLetterPreview={handleOpenPreview}
      />

      <OrgSettingsModal
        isOpen={isOrgSettingsOpen}
        onClose={() => setIsOrgSettingsOpen(false)}
        onSaved={refreshOrgProfile}
      />

      <SupabaseSyncModal
        isOpen={isSupabaseOpen}
        onClose={() => setIsSupabaseOpen(false)}
        letters={letters}
        orgProfile={orgProfile}
        onSyncComplete={(updatedLetters) => {
          setLetters(updatedLetters);
          showToast('Sinkronisasi Supabase berhasil diperbarui!');
        }}
      />
    </div>
  );
}
