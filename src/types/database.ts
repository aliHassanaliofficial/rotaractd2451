export type UserRole = 'member' | 'club_admin' | 'district_admin' | 'superadmin';
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';
export type CalendarType = 'event' | 'project' | 'meeting';
export type RegStatus = 'pending' | 'confirmed' | 'cancelled' | 'declined' | 'attended';
export type PostStatus = 'draft' | 'published' | 'archived';
export type MediaType = 'image' | 'video' | 'document' | 'pdf';
export type AnnouncementPriority = 'normal' | 'important' | 'urgent';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  role: UserRole;
  club_id?: string;
  rotaract_id?: string;
  graduation_year?: number;
  occupation?: string;
  social_linkedin?: string;
  social_instagram?: string;
  social_facebook?: string;
  is_active: boolean;
  is_verified: boolean;
  approval_status?: ApprovalStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
  club?: Club;
}

export interface Club {
  id: string;
  name: string;
  slug: string;
  charter_date?: string;
  description?: string;
  mission?: string;
  vision?: string;
  logo_url?: string;
  cover_url?: string;
  university?: string;
  city?: string;
  country: string;
  website?: string;
  email?: string;
  phone?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  president_id?: string;
  secretary_id?: string;
  treasurer_id?: string;
  member_count: number;
  is_active: boolean;
  founded_year?: number;
  meeting_day?: string;
  meeting_time?: string;
  meeting_location?: string;
  created_at: string;
  updated_at: string;
}

export interface ClubOfficer {
  id: string;
  club_id: string;
  profile_id: string;
  position: string;
  year: string;
  is_current: boolean;
  created_at: string;
  profile?: Profile;
}

export interface Event {
  id: string;
  slug: string;
  title: string;
  description?: string;
  rich_description?: any;
  cover_url?: string;
  start_at: string;
  end_at: string;
  approval_status?: ApprovalStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  location?: string;
  location_url?: string;
  latitude?: number;
  longitude?: number;
  is_online: boolean;
  online_url?: string;
  capacity?: number;
  show_capacity: boolean;
  registration_open: boolean;
  registration_deadline?: string;
  registration_type: 'public' | 'members_only';
  price: number;
  currency: string;
  event_type: 'event' | 'conference';
  status: EventStatus;
  host_club_id?: string;
  organizer_id?: string;
  category?: string;
  calendar_type?: CalendarType;
  tags?: string[];
  agenda?: any;
  sponsors?: any;
  created_at: string;
  updated_at: string;
  host_club?: Club;
  organizer?: Profile;
}

export type TransactionMethodType =
  | 'transfer'
  | 'card'
  | 'mobile'
  | 'cash'
  | 'bank_deposit'
  | 'other';

export interface TransactionMethod {
  id: string;
  name: string;
  description?: string;
  instructions?: string;
  is_active: boolean;
  sort_order: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Registration {
  id: string;
  event_id: string;
  profile_id?: string;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  guest_club?: string;
  qr_code: string;
  ticket_number?: string;
  status: RegStatus;
  notes?: string;
  transaction_method_id?: string;
  transaction_proof_url?: string;
  checked_in_at?: string;
  checked_in_by?: string;
  registered_at: string;
  updated_at: string;
  event?: Event;
  profile?: Profile;
  transaction_method?: TransactionMethod;
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  content?: any;
  cover_url?: string;
  author_id?: string;
  club_id?: string;
  status: PostStatus;
  approval_status?: ApprovalStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  is_announcement: boolean;
  is_pinned: boolean;
  announcement_priority: AnnouncementPriority;
  tags?: string[];
  views: number;
  published_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  author?: Profile;
  club?: Club;
}

export interface GalleryAlbum {
  id: string;
  title: string;
  slug: string;
  description?: string;
  cover_url?: string;
  event_id?: string;
  club_id?: string;
  is_published: boolean;
  approval_status?: ApprovalStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  created_by?: string;
  created_at: string;
  event?: Event;
  club?: Club;
  media?: GalleryMedia[];
}

export interface GalleryMedia {
  id: string;
  album_id: string;
  url: string;
  thumbnail_url?: string;
  type: MediaType;
  caption?: string;
  sort_order: number;
  uploaded_by?: string;
  created_at: string;
}

export interface LibraryCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  sort_order: number;
}

export interface LibraryItem {
  id: string;
  title: string;
  description?: string;
  file_url?: string;
  external_url?: string;
  type: MediaType;
  category_id?: string;
  tags?: string[];
  is_published: boolean;
  downloads: number;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
  category?: LibraryCategory;
}

export interface HistoryEntry {
  id: string;
  year: number;
  title: string;
  description?: string;
  image_url?: string;
  milestone_type?: string;
  sort_order: number;
  created_at: string;
}

export interface DistrictLeadership {
  id: string;
  name?: string;
  position: string;
  year: string;
  is_current: boolean;
  sort_order: number;
  bio?: string;
  photo_url?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  is_read: boolean;
  replied_at?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  profile_id: string;
  title: string;
  message?: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  action: string;
  table_name?: string;
  record_id?: string;
  old_data?: any;
  new_data?: any;
  ip_address?: string;
  created_at: string;
}

export interface SiteSetting {
  key: string;
  value: any;
  updated_by?: string;
  updated_at: string;
}

export interface ClubAdmin {
  id: string;
  profile_id: string;
  club_id: string;
  created_at: string;
  profile?: Profile;
  club?: Club;
}
