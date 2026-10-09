export interface ArticleListItem {
  id: string;
  slug: string;
  title: string;
  status: 'draft' | 'published';
  featured: boolean;
  published_at: string | null;
  updated_at: string;
  cover_image_url: string | null;
}

export interface ArticleFull extends ArticleListItem {
  excerpt: string;
  content_html: string;
  cover_public_id: string | null;
  meta_title: string;
  meta_description: string;
  keywords: string[];
  author: string;
  article_categories?: { category_id: string }[];
}

export interface Hero {
  badge_text: string;
  heading: string;
  heading_highlight: string;
  subheading: string;
  cta_label: string;
  cta_href: string;
  secondary_cta_label: string;
  secondary_cta_href: string;
}

export interface SiteSettings {
  business_name: string;
  tagline: string;
  logo_url: string | null;
  logo_public_id: string | null;
  primary_color: string;
  secondary_color: string;
  default_hero_color: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country: string;
  lat: number | null;
  lng: number | null;
  facebook_url: string;
  instagram_url: string;
  youtube_url: string;
  tiktok_url: string;
  linkedin_url: string;
  google_maps_url: string;
  default_meta_title: string;
  default_meta_description: string;
  copyright_text?: string;
  business_hours: string;
  whatsapp_widget_enabled: boolean;
  whatsapp_greeting: string;
  whatsapp_message: string;
}

export interface TeamMember {
  name: string;
  role: string;
  description: string;
  image_url?: string | null;
  image_public_id?: string | null;
}

export interface AboutContent {
  headline: string;
  subheading: string;
  body_html: string;
  image_url: string | null;
  image_public_id: string | null;
  stats: { label: string; value: string }[];
  team: TeamMember[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface Stats {
  articles: number;
  published: number;
  drafts: number;
  categories: number;
  gallery: number;
  batches: number;
  activeAnnouncement: { id: string; title: string } | null;
}

// ---- Gallery -----------------------------------------------------------

export type CropMode = 'fill' | 'pad';
export type FrameStyle = 'none' | 'rounded' | 'polaroid' | 'gold' | 'shadow';
export type Gravity = 'auto' | 'face' | 'faces' | 'center';
export type AspectRatio = '1:1' | '4:3' | '3:4' | '3:2' | '16:9';

export interface GallerySettings {
  aspect_ratio: AspectRatio;
  crop_mode: CropMode;
  frame_style: FrameStyle;
  layout: 'grid' | 'masonry';
  columns: number;
}

export interface GalleryCategory {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  image_count?: number;
}

export interface GalleryImage {
  id: string;
  image_url: string;
  public_id: string | null;
  width: number | null;
  height: number | null;
  caption: string;
  alt: string;
  category_id: string | null;
  crop_mode: CropMode | null;
  gravity: Gravity;
  frame_style: FrameStyle | null;
  sort_order: number;
  active: boolean;
}

// ---- Announcements -----------------------------------------------------

export type AnnouncementLayout = 'image_top' | 'image_left' | 'image_background';

export interface Announcement {
  id: string;
  title: string;
  body_html: string;
  image_url: string | null;
  image_public_id: string | null;
  layout: AnnouncementLayout;
  cta_label: string;
  cta_href: string;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}

// ---- Batches -----------------------------------------------------------

export type BatchStatus = 'current' | 'outgoing' | 'archived';
export type BatchDisplayMode = 'slider' | 'featured_thumbs' | 'grid' | 'masonry';

export interface BatchImage {
  id: string;
  batch_id: string;
  image_url: string;
  public_id: string | null;
  width: number | null;
  height: number | null;
  caption: string;
  sort_order: number;
}

export interface Batch {
  id: string;
  name: string;
  slug: string;
  description: string;
  start_date: string | null;
  graduation_date: string | null;
  featured_image_url: string | null;
  featured_public_id: string | null;
  status: BatchStatus;
  display_mode: BatchDisplayMode;
  show_on_home: boolean;
  sort_order: number;
  image_count?: number;
  images?: BatchImage[];
}

// ---- Courses -------------------------------------------------------------

export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Course {
  id: string;
  title: string;
  description: string;
  duration: string;
  level: CourseLevel;
  price: string;
  features: string[];
  highlighted: boolean;
  badge_text: string;
  cta_label: string;
  cta_href: string;
  sort_order: number;
  active: boolean;
}

// ---- Google reviews ------------------------------------------------------

export interface ReviewSettings {
  place_id: string | null;
  place_name: string | null;
  place_address: string | null;
  maps_uri: string | null;
  rating: number | null;
  total_reviews: number | null;
  min_rating: number;
  keep_history: boolean;
  last_synced_at: string | null;
  last_error: string | null;
  has_api_key: boolean;
  api_key_source: 'admin' | 'env' | null;
  api_key_hint: string | null;
}

export interface GoogleReview {
  id: string;
  author_name: string;
  author_uri: string | null;
  author_photo_uri: string | null;
  rating: number;
  text: string;
  publish_time: string | null;
  relative_time: string | null;
  review_uri: string | null;
  hidden: boolean;
  pinned: boolean;
  in_latest_fetch: boolean;
}

export interface PlaceCandidate {
  place_id: string;
  name: string;
  address: string;
  rating: number | null;
  total_reviews: number | null;
}
