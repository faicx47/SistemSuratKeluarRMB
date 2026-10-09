import React from 'react';
import { Plus, ShieldCheck, PenTool, Building2, FileText, Database, Sparkles } from 'lucide-react';
import { RemasbaraLogo } from './RemasbaraVisuals';
import { OrganizationProfile } from '../types/letter';

interface NavbarProps {
  currentView: 'archive' | 'create' | 'edit';
  orgProfile?: OrganizationProfile;
  onNavigateArchive: () => void;
  onNavigateCreate: () => void;
  onOpenSignatures: () => void;
  onOpenStamps: () => void;
  onOpenVerify: () => void;
  onOpenOrgSettings: () => void;
  onOpenSupabase: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  orgProfile,
  onNavigateArchive,
  onNavigateCreate,
  onOpenSignatures,
  onOpenStamps,
  onOpenVerify,
  onOpenOrgSettings,
  onOpenSupabase,
}) => {
  return (
    <header className="no-print h-16 bg-white border-b border-slate-200 sticky top-0 z-40 px-4 lg:px-8">
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
        {/* Zone 1: Brand Wordmark (Single text element wordmark + clean mark) */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onNavigateArchive}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            {orgProfile?.logoUrl ? (
              <img
                src={orgProfile.logoUrl}
                alt="Logo Remasbara"
                className="w-9 h-9 object-contain rounded shrink-0"
              />
            ) : (
              <RemasbaraLogo size={36} className="shrink-0" />
            )}
            <div className="leading-tight">
              <span className="text-base font-bold tracking-tight text-slate-900 group-hover:text-emerald-900 transition-colors block">
                REMASBARA
              </span>
              <span className="text-[11px] text-slate-500 block">
                Sistem Surat Keluar REMASBARA
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: 4-6 Clean Text Navigation Links (Single-Line) */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
          <button
            type="button"
            onClick={onNavigateArchive}
            className={`transition-colors flex items-center gap-1.5 whitespace-nowrap py-1 ${
              currentView === 'archive'
                ? 'text-emerald-800 border-b-2 border-emerald-700'
                : 'hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Arsip Surat
          </button>

          <button
            type="button"
            onClick={onNavigateCreate}
            className={`transition-colors flex items-center gap-1.5 whitespace-nowrap py-1 ${
              currentView === 'create'
                ? 'text-emerald-800 border-b-2 border-emerald-700'
                : 'hover:text-slate-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Buat Surat
          </button>

          <button
            type="button"
            onClick={onOpenSignatures}
            className="transition-colors hover:text-slate-900 flex items-center gap-1.5 whitespace-nowrap py-1"
          >
            <PenTool className="w-3.5 h-3.5" />
            Master Tanda Tangan
          </button>

          <button
            type="button"
            onClick={onOpenStamps}
            className="transition-colors hover:text-slate-900 flex items-center gap-1.5 whitespace-nowrap py-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-red-600" />
            Master Stempel
          </button>

          <button
            type="button"
            onClick={onOpenVerify}
            className="transition-colors hover:text-slate-900 flex items-center gap-1.5 whitespace-nowrap py-1"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Verifikasi QR
          </button>

          <button
            type="button"
            onClick={onOpenOrgSettings}
            className="transition-colors hover:text-slate-900 flex items-center gap-1.5 whitespace-nowrap py-1"
          >
            <Building2 className="w-3.5 h-3.5" />
            Kop & Kontak
          </button>

          <button
            type="button"
            onClick={onOpenSupabase}
            className="transition-colors hover:text-slate-900 flex items-center gap-1.5 whitespace-nowrap py-1 text-emerald-800 font-medium"
            title="Kelola Koneksi Database Cloud Supabase"
          >
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>Supabase</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </button>
        </nav>

        {/* Zone 3: 1-2 Primary Action Points */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenSupabase}
            className="md:hidden p-2 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center justify-center transition-colors"
            title="Status Supabase"
          >
            <Database className="w-4 h-4 text-emerald-700" />
          </button>

          <button
            type="button"
            onClick={onNavigateCreate}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Surat Keluar Baru</span>
            <span className="sm:hidden">Buat Baru</span>
          </button>
        </div>
      </div>
    </header>
  );
};
