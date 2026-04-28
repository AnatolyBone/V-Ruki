export type UserRole = 'user' | 'admin' | 'moderator';

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  city: string | null;
  role: UserRole;
  is_blocked: boolean;
  created_at: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
};

export type ListingStatus = 'draft' | 'moderation' | 'active' | 'rejected' | 'archived';

export type Listing = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  price: number;
  category_id: string;
  city: string;
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

export type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  listing_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
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
