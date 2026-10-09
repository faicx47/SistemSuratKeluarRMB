import { createClient } from '@supabase/supabase-js';
import { LetterDocument, OrganizationProfile, SavedSignature, SavedStamp } from '../types/letter';

// Supabase Configuration from Environment or Direct Project Credentials
export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://jekeecwrqtdkvrgkvovx.supabase.co';
export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_qgUaQEsghvooy0kVzkqP7w_xemeIPeb';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const SUPABASE_SQL_SCHEMA = `-- ========================================================
-- SKEMA DATABASE SUPABASE UNTUK SISTEM SURAT RESMI REMASBARA
-- Jalankan script ini di Supabase Dashboard -> SQL Editor
-- ========================================================

-- 1. Tabel Arsip Surat Keluar
create table if not exists public.letters (
  id text primary key,
  letter_number text not null,
  category_code text,
  subject text,
  status text default 'draft',
  recipient_name text,
  date_masehi text,
  document_data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Tabel Profil Organisasi (REMASBARA)
create table if not exists public.org_profile (
  id text primary key default 'main',
  profile_data jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Tabel Master Tanda Tangan Tersimpan
create table if not exists public.signatures (
  id text primary key,
  name text not null,
  role text not null,
  id_number text,
  data_url text,
  signature_data jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. Tabel Master Stempel Resmi (REMASBARA, Kemasjidan, Yayasan, Kustom)
create table if not exists public.stamps (
  id text primary key,
  category text not null,
  title text not null,
  organization text,
  color text default 'red',
  opacity numeric default 0.92,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Aktifkan RLS dan Izinkan Akses Publik / Publishable Key
alter table public.letters enable row level security;
alter table public.org_profile enable row level security;
alter table public.signatures enable row level security;
alter table public.stamps enable row level security;

-- Policy untuk letters
drop policy if exists "Allow all access to letters" on public.letters;
create policy "Allow all access to letters" on public.letters for all using (true) with check (true);

-- Policy untuk org_profile
drop policy if exists "Allow all access to org_profile" on public.org_profile;
create policy "Allow all access to org_profile" on public.org_profile for all using (true) with check (true);

-- Policy untuk signatures
drop policy if exists "Allow all access to signatures" on public.signatures;
create policy "Allow all access to signatures" on public.signatures for all using (true) with check (true);

-- Policy untuk stamps
drop policy if exists "Allow all access to stamps" on public.stamps;
create policy "Allow all access to stamps" on public.stamps for all using (true) with check (true);
`;

export interface SupabaseHealth {
  connected: boolean;
  message: string;
  tables: {
    letters: boolean;
    org_profile: boolean;
    signatures: boolean;
    stamps: boolean;
  };
  lastChecked: Date | null;
}

export const SupabaseService = {
  /**
   * Healthcheck to verify connectivity and table readiness
   */
  async checkConnection(): Promise<SupabaseHealth> {
    const health: SupabaseHealth = {
      connected: false,
      message: '',
      tables: {
        letters: false,
        org_profile: false,
        signatures: false,
        stamps: false,
      },
      lastChecked: new Date(),
    };

    try {
      // Test letters table
      const { error: letErr } = await supabase
        .from('letters')
        .select('id')
        .limit(1);

      if (!letErr) {
        health.tables.letters = true;
      }

      // Test org_profile table
      const { error: orgErr } = await supabase
        .from('org_profile')
        .select('id')
        .limit(1);

      if (!orgErr) {
        health.tables.org_profile = true;
      }

      // Test signatures table
      const { error: sigErr } = await supabase
        .from('signatures')
        .select('id')
        .limit(1);

      if (!sigErr) {
        health.tables.signatures = true;
      }

      // Test stamps table
      const { error: stampErr } = await supabase
        .from('stamps')
        .select('id')
        .limit(1);

      if (!stampErr) {
        health.tables.stamps = true;
      }

      health.connected = true;
      if (
        health.tables.letters &&
        health.tables.org_profile &&
        health.tables.signatures &&
        health.tables.stamps
      ) {
        health.message = 'Terhubung & Semua 4 tabel (letters, org_profile, signatures, stamps) aktif di database.';
      } else {
        health.message = 'Terhubung ke Supabase, skema tabel belum lengkap di database.';
      }
    } catch (err: any) {
      health.connected = false;
      health.message = err?.message || 'Gagal tersambung ke endpoint Supabase.';
    }

    return health;
  },

  /**
   * Fetch all letters from Supabase
   */
  async fetchLetters(): Promise<LetterDocument[] | null> {
    try {
      const { data, error } = await supabase
        .from('letters')
        .select('document_data, updated_at')
        .order('updated_at', { ascending: false });

      if (error || !data) {
        console.warn('Supabase fetchLetters notice:', error?.message);
        return null;
      }

      const letters: LetterDocument[] = data.map((row: any) => row.document_data);
      return letters;
    } catch (e) {
      console.warn('Error fetching letters from Supabase:', e);
      return null;
    }
  },

  /**
   * Upsert a letter document to Supabase
   */
  async saveLetter(letter: LetterDocument): Promise<boolean> {
    try {
      const { error } = await supabase.from('letters').upsert(
        {
          id: letter.id,
          letter_number: letter.letterNumber,
          category_code: letter.categoryCode,
          subject: letter.subject,
          status: letter.status,
          recipient_name: letter.recipientName,
          date_masehi: letter.dateMasehi,
          document_data: letter,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

      if (error) {
        console.warn('Supabase saveLetter error:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Supabase saveLetter exception:', e);
      return false;
    }
  },

  /**
   * Delete a letter from Supabase
   */
  async deleteLetter(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('letters').delete().eq('id', id);
      if (error) {
        console.warn('Supabase deleteLetter error:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Supabase deleteLetter exception:', e);
      return false;
    }
  },

  /**
   * Bulk upload / sync letters
   */
  async syncAllLetters(letters: LetterDocument[]): Promise<boolean> {
    if (!letters || letters.length === 0) return true;
    try {
      const rows = letters.map((l) => ({
        id: l.id,
        letter_number: l.letterNumber,
        category_code: l.categoryCode,
        subject: l.subject,
        status: l.status,
        recipient_name: l.recipientName,
        date_masehi: l.dateMasehi,
        document_data: l,
        updated_at: l.updatedAt || new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('letters')
        .upsert(rows, { onConflict: 'id' });

      if (error) {
        console.warn('Supabase syncAllLetters error:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Supabase syncAllLetters exception:', e);
      return false;
    }
  },

  /**
   * Save organization profile to Supabase
   */
  async saveOrgProfile(profile: OrganizationProfile): Promise<boolean> {
    try {
      const { error } = await supabase.from('org_profile').upsert(
        {
          id: 'main',
          profile_data: profile,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

      if (error) {
        console.warn('Supabase saveOrgProfile error:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Supabase saveOrgProfile exception:', e);
      return false;
    }
  },

  /**
   * Fetch organization profile from Supabase
   */
  async fetchOrgProfile(): Promise<OrganizationProfile | null> {
    try {
      const { data, error } = await supabase
        .from('org_profile')
        .select('profile_data')
        .eq('id', 'main')
        .maybeSingle();

      if (error || !data) return null;
      return data.profile_data as OrganizationProfile;
    } catch (e) {
      return null;
    }
  },

  /**
   * Save signatures to Supabase
   */
  async syncSignatures(signatures: SavedSignature[]): Promise<boolean> {
    if (!signatures || signatures.length === 0) return true;
    try {
      const rows = signatures.map((s) => ({
        id: s.id,
        name: s.name,
        role: s.role,
        id_number: s.idNumber,
        data_url: s.dataUrl,
        signature_data: s,
        updated_at: s.updatedAt || new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('signatures')
        .upsert(rows, { onConflict: 'id' });

      if (error) {
        console.warn('Supabase syncSignatures error:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * Save or upsert a single signature to Supabase database
   */
  async saveSignature(sig: SavedSignature): Promise<boolean> {
    try {
      const { error } = await supabase.from('signatures').upsert(
        {
          id: sig.id,
          name: sig.name,
          role: sig.role,
          id_number: sig.idNumber || null,
          data_url: sig.dataUrl,
          signature_data: sig,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

      if (error) {
        console.warn('Supabase saveSignature error:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Supabase saveSignature exception:', e);
      return false;
    }
  },

  /**
   * Delete a signature from Supabase database
   */
  async deleteSignature(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('signatures').delete().eq('id', id);
      if (error) {
        console.warn('Supabase deleteSignature error:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * Fetch signatures from Supabase
   */
  async fetchSignatures(): Promise<SavedSignature[] | null> {
    try {
      const { data, error } = await supabase
        .from('signatures')
        .select('*')
        .order('updated_at', { ascending: true });

      if (error || !data || data.length === 0) return null;
      return data.map((d: any) => {
        if (d.signature_data) {
          return {
            ...d.signature_data,
            id: d.id,
            name: d.name || d.signature_data.name,
            role: d.role || d.signature_data.role,
            idNumber: d.id_number ?? d.signature_data.idNumber ?? '',
            dataUrl: d.data_url || d.signature_data.dataUrl,
            updatedAt: d.updated_at || d.signature_data.updatedAt,
          };
        }
        return {
          id: d.id,
          title: d.role || 'Tanda Tangan',
          role: d.role,
          name: d.name,
          idNumber: d.id_number || '',
          dataUrl: d.data_url,
          updatedAt: d.updated_at,
        } as SavedSignature;
      });
    } catch (e) {
      return null;
    }
  },

  /**
   * Save / Upsert a single stamp to Supabase
   */
  async saveStamp(stamp: SavedStamp): Promise<boolean> {
    try {
      const { error } = await supabase.from('stamps').upsert(
        {
          id: stamp.id,
          category: stamp.category,
          title: stamp.title,
          organization: stamp.organization,
          color: stamp.color,
          opacity: stamp.opacity,
          image_url: stamp.imageUrl || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

      if (error) {
        console.warn('Supabase saveStamp error:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * Sync all stamps to Supabase
   */
  async syncAllStamps(stamps: SavedStamp[]): Promise<boolean> {
    if (!stamps || stamps.length === 0) return true;
    try {
      const rows = stamps.map((s) => ({
        id: s.id,
        category: s.category,
        title: s.title,
        organization: s.organization,
        color: s.color,
        opacity: s.opacity,
        image_url: s.imageUrl || null,
        updated_at: s.updatedAt || new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('stamps')
        .upsert(rows, { onConflict: 'id' });

      if (error) {
        console.warn('Supabase syncAllStamps error:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * Fetch all stamps from Supabase
   */
  async fetchStamps(): Promise<SavedStamp[] | null> {
    try {
      const { data, error } = await supabase
        .from('stamps')
        .select('id, category, title, organization, color, opacity, image_url, updated_at')
        .order('updated_at', { ascending: true });

      if (error || !data || data.length === 0) return null;
      const stamps: SavedStamp[] = data.map((d: any) => ({
        id: d.id,
        category: d.category,
        title: d.title,
        organization: d.organization || '',
        color: d.color || 'red',
        opacity: d.opacity !== null ? Number(d.opacity) : 0.92,
        imageUrl: d.image_url || undefined,
        updatedAt: d.updated_at,
      }));
      return stamps;
    } catch (e) {
      return null;
    }
  },

  /**
   * Delete a stamp from Supabase
   */
  async deleteStamp(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('stamps').delete().eq('id', id);
      if (error) {
        console.warn('Supabase deleteStamp error:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  },
};
