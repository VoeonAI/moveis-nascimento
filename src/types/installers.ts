export interface Installer {
  id: string;
  name: string;
  phone: string;
  city?: string | null;
  photo_url?: string | null;
  photo_alt?: string | null;
  bio?: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}