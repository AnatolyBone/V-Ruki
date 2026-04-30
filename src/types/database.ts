export type UserRole = 'user' | 'admin' | 'moderator' | 'owner';

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  city: string | null;
  role: UserRole;
  is_blocked: boolean;
  blocked_reason?: string | null;
  blocked_at?: string | null;
  created_at: string;
};

export type SupportTicket = {
  id: string;
  user_id?: string | null;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'in_progress' | 'closed';
  admin_reply?: string | null;
  created_at: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
};

export type ListingStatus = 'draft' | 'moderation' | 'active' | 'rejected' | 'archived';

export type Location = {
  id: string;
  name: string;
  region: string | null;
  type: string;
  created_at: string;
};

export type Listing = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  price: number;
  category_id: string;
  city: string;
  region: string | null;
  address: string | null;
  status: ListingStatus;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  categories?: Category;
  listing_images?: ListingImage[];
};

export type ListingImage = {
  id: string;
  listing_id: string;
  url: string;
  is_main: boolean;
};

export type Favorite = {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
};

export type Conversation = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  listings?: Listing;
  buyer?: Profile;
  seller?: Profile;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
};

export type Deal = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  status: 'pending' | 'completed';
  created_at: string;
};

export type Review = {
  id: string;
  deal_id: string;
  reviewer_id: string;
  reviewed_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer?: Profile;
};

export type Report = {
  id: string;
  reporter_id: string;
  listing_id: string;
  reason: string;
  comment: string | null;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
};
