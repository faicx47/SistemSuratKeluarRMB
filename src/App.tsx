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
import { LetterDocument, OrganizationProfile } from './types/letter';
import { StorageService } from './utils/storage';
import { SupabaseService } from './utils/supabaseClient';
import {
  generateLetterNumber,
  generateVerificationCode,
  getRomanMonth,
} from './utils/dateAndNumber';
import { CheckCircle2, MapPin, Mail, Phone } from 'lucide-react';

export default function App() {
  const [letters, setLetters] = useState<LetterDocument[]>([]);
  const [orgProfile, setOrgProfile] = useState<OrganizationProfile>(StorageService.getOrgProfile());
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
    // 1. Initial fast local load
    const loaded = StorageService.getLetters();
    setLetters(loaded);
    setOrgProfile(StorageService.getOrgProfile());

    // 2. Background sync with Supabase
    const initSupabaseSync = async () => {
      try {
        const remoteLetters = await SupabaseService.fetchLetters();
        if (remoteLetters && remoteLetters.length > 0) {
          // Merge remote letters with local
          const local = StorageService.getLetters();
          const map = new Map<string, LetterDocument>();
          local.forEach((l) => map.set(l.id, l));
          remoteLetters.forEach((l) => map.set(l.id, l));
          const merged = Array.from(map.values()).sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
          setLetters(merged);
          localStorage.setItem('remasbara_letters_v1', JSON.stringify(merged));
        } else if (loaded && loaded.length > 0) {
          // If remote is empty, backup local letters to Supabase
          SupabaseService.syncAllLetters(loaded).catch(() => {});
        }

        const remoteProfile = await SupabaseService.fetchOrgProfile();
        if (remoteProfile) {
          setOrgProfile(remoteProfile);
          StorageService.saveOrgProfile(remoteProfile);
        }

        const remoteStamps = await SupabaseService.fetchStamps();
        if (remoteStamps && remoteStamps.length > 0) {
          localStorage.setItem('remasbara_stamps_v1', JSON.stringify(remoteStamps));
        } else {
          const localStamps = StorageService.getStamps();
          SupabaseService.syncAllStamps(localStamps).catch(() => {});
        }
      } catch (err) {
        console.warn('Initial Supabase sync notice:', err);
      }
    };

    initSupabaseSync();
  }, []);

  const refreshLetters = () => {
    setLetters(StorageService.getLetters());
  };

  const refreshOrgProfile = () => {
    const profile = StorageService.getOrgProfile();
    setOrgProfile(profile);
    SupabaseService.saveOrgProfile(profile).catch(() => {});
  };

  const handleStartCreate = () => {
    const blank = StorageService.createNewBlankLetter();
    setActiveLetter(blank);
    setCurrentView('create');
  };

  const handleStartEdit = (letter: LetterDocument) => {
    setActiveLetter(letter);
    setCurrentView('edit');
  };

  const handleDuplicate = (source: LetterDocument) => {
    const nextSeq = StorageService.getNextSequenceNumber();
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

    StorageService.saveLetter(duplicated);
    refreshLetters();
    SupabaseService.saveLetter(duplicated).catch(() => {});
    showToast(`Surat berhasil diduplikasi menjadi nomor: ${newNumber}`);
  };

  const handleDeleteLetter = (id: string) => {
    StorageService.deleteLetter(id);
    refreshLetters();
    SupabaseService.deleteLetter(id).catch(() => {});
    showToast('Surat berhasil dihapus dari arsip');
  };

  const handleSaveLetter = (savedLetter: LetterDocument) => {
    StorageService.saveLetter(savedLetter);
    refreshLetters();
    SupabaseService.saveLetter(savedLetter).catch(() => {});
    setCurrentView('archive');
    setActiveLetter(null);
    showToast(`Surat ${savedLetter.letterNumber} berhasil disimpan ke arsip!`);
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
