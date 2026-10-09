import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  Table,
  UploadCloud,
  Layers,
} from 'lucide-react';
import {
  SupabaseService,
  SUPABASE_URL,
  SUPABASE_SQL_SCHEMA,
  SupabaseHealth,
} from '../utils/supabaseClient';
import { LetterDocument, OrganizationProfile, SavedSignature } from '../types/letter';
import { StorageService, isDefaultSignature } from '../utils/storage';

interface SupabaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  letters: LetterDocument[];
  orgProfile: OrganizationProfile;
  onSyncComplete: (updatedLetters: LetterDocument[]) => void;
}

export const SupabaseSyncModal: React.FC<SupabaseSyncModalProps> = ({
  isOpen,
  onClose,
  letters,
  orgProfile,
  onSyncComplete,
}) => {
  const [health, setHealth] = useState<SupabaseHealth | null>(null);
  const [checking, setChecking] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlGuide, setShowSqlGuide] = useState(false);

  useEffect(() => {
    if (isOpen) {
      runCheck();
    }
  }, [isOpen]);

  const runCheck = async () => {
    setChecking(true);
    setSyncMessage(null);
    try {
      const res = await SupabaseService.checkConnection();
      setHealth(res);
    } catch (e: any) {
      setHealth({
        connected: false,
        message: e?.message || 'Gagal tersambung ke Supabase.',
        tables: { letters: false, org_profile: false, signatures: false, stamps: false },
        lastChecked: new Date(),
      });
    } finally {
      setChecking(false);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      // 1. Upload local letters to Supabase
      const localLetters = StorageService.getLetters();
      await SupabaseService.syncAllLetters(localLetters);

      // 2. Upload org profile
      await SupabaseService.saveOrgProfile(orgProfile);

      // 3. Upload signatures (smart merge with database)
      const localSignatures = StorageService.getSignatures();
      const remoteSigs = await SupabaseService.fetchSignatures();
      if (remoteSigs && remoteSigs.length > 0) {
        const sigMap = new Map<string, SavedSignature>();
        localSignatures.forEach((s) => sigMap.set(s.id, s));
        let pushNeeded = false;

        remoteSigs.forEach((remote) => {
          const local = sigMap.get(remote.id);
          if (!local) {
            sigMap.set(remote.id, remote);
            return;
          }
          const localIsDef = isDefaultSignature(local.dataUrl);
          const remoteIsDef = isDefaultSignature(remote.dataUrl);
          if (!localIsDef && remoteIsDef) {
            sigMap.set(local.id, local);
            pushNeeded = true;
          } else if (localIsDef && !remoteIsDef) {
            sigMap.set(remote.id, remote);
          } else {
            const lTime = new Date(local.updatedAt || 0).getTime();
            const rTime = new Date(remote.updatedAt || 0).getTime();
            if (rTime > lTime) {
              sigMap.set(remote.id, remote);
            } else if (lTime > rTime) {
              sigMap.set(local.id, local);
              pushNeeded = true;
            }
          }
        });

        const mergedSigs = Array.from(sigMap.values());
        localStorage.setItem('remasbara_signatures_v1', JSON.stringify(mergedSigs));
        try {
          window.dispatchEvent(new Event('signatures-updated'));
        } catch {}

        if (pushNeeded || mergedSigs.length > remoteSigs.length) {
          await SupabaseService.syncSignatures(mergedSigs);
        }
      } else {
        await SupabaseService.syncSignatures(localSignatures);
      }

      // 4. Upload stamps
      const localStamps = StorageService.getStamps();
      await SupabaseService.syncAllStamps(localStamps);

      // 5. Fetch latest letters from Supabase to merge
      const remoteLetters = await SupabaseService.fetchLetters();
      if (remoteLetters && remoteLetters.length > 0) {
        // Merge with local letters by ID
        const map = new Map<string, LetterDocument>();
        localLetters.forEach((l) => map.set(l.id, l));
        remoteLetters.forEach((l) => map.set(l.id, l));
        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );

        localStorage.setItem('remasbara_letters_v1', JSON.stringify(merged));
        onSyncComplete(merged);
      }

      // Fetch remote stamps
      const remoteStamps = await SupabaseService.fetchStamps();
      if (remoteStamps && remoteStamps.length > 0) {
        localStorage.setItem('remasbara_stamps_v1', JSON.stringify(remoteStamps));
      }

      setSyncMessage('Sinkronisasi Berhasil! Semua arsip surat, kop, tanda tangan, dan stempel telah tersimpan di Supabase.');
      await runCheck();
    } catch (err: any) {
      setSyncMessage(`Kendala sinkronisasi: ${err?.message || 'Periksa tabel database Supabase'}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  if (!isOpen) return null;

  const allTablesReady =
    health?.tables.letters &&
    health?.tables.org_profile &&
    health?.tables.signatures &&
    health?.tables.stamps;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-white">
                    Integrasi Cloud Database Supabase
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Terkoneksi
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-mono mt-0.5 break-all">
                  {SUPABASE_URL}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Status Panel */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-700" />
                Status Kesiapan Database & Tabel:
              </span>
              <button
                type="button"
                onClick={runCheck}
                disabled={checking}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
                <span>{checking ? 'Memeriksa...' : 'Cek Status'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
              {/* Letters Table */}
              <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                    <Table className="w-3 h-3 text-slate-400" />
                    <span>tabel letters</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Arsip Surat Keluar</div>
                </div>
                {health?.tables.letters ? (
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Siap
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Perlu SQL
                  </span>
                )}
              </div>

              {/* Org Profile Table */}
              <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                    <Table className="w-3 h-3 text-slate-400" />
                    <span>tabel org_profile</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Kop & Profil REMASBARA</div>
                </div>
                {health?.tables.org_profile ? (
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Siap
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Perlu SQL
                  </span>
                )}
              </div>

              {/* Signatures Table */}
              <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                    <Table className="w-3 h-3 text-slate-400" />
                    <span>tabel signatures</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Master Tanda Tangan</div>
                </div>
                {health?.tables.signatures ? (
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Siap
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Perlu SQL
                  </span>
                )}
              </div>

              {/* Stamps Table */}
              <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                    <Table className="w-3 h-3 text-slate-400" />
                    <span>tabel stamps</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Master Stempel Resmi</div>
                </div>
                {health?.tables.stamps ? (
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Siap
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Perlu SQL
                  </span>
                )}
              </div>
            </div>

            {health?.message && (
              <p className="text-[11px] text-slate-600 pt-1">
                Keterangan: {health.message}
              </p>
            )}
          </div>

          {/* Sync Trigger Action */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <UploadCloud className="w-4 h-4 text-emerald-700" />
                  Sinkronisasi Dua Arah (Cloud & Offline)
                </h4>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  Unggah seluruh arsip lokal ({letters.length} surat), pengaturan kop surat, dan tanda tangan ke Supabase Cloud.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSyncNow}
                disabled={syncing}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
              </button>
            </div>

            {syncMessage && (
              <div className="p-2.5 bg-white border border-emerald-300 rounded-lg text-xs font-medium text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{syncMessage}</span>
              </div>
            )}
          </div>

          {/* SQL Setup Helper Accordion */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSqlGuide(!showSqlGuide)}
              className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left transition-colors"
            >
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-800">
                  Skrip SQL Skema Supabase (Untuk Inisialisasi Tabel)
                </span>
              </div>
              <span className="text-xs font-semibold text-emerald-700">
                {showSqlGuide ? 'Sembunyikan' : 'Buka Skrip SQL'}
              </span>
            </button>

            {showSqlGuide && (
              <div className="p-4 bg-white border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-slate-600">
                    Jalankan skrip ini sekali di menu <strong>SQL Editor</strong> di dashboard Supabase Anda jika tabel belum dibuat:
                  </p>
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>SQL Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Skrip SQL</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-slate-900 text-emerald-300 p-3 rounded-lg font-mono text-[11px] max-h-48 overflow-y-auto leading-relaxed border border-slate-800">
                  <pre>{SUPABASE_SQL_SCHEMA}</pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            Koneksi Supabase aktif & terhubung ke PostgreSQL cloud database.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg shadow-2xs hover:bg-slate-100 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
