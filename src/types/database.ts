export type UserRole = 'admin' | 'member';
export type UserStatus = 'pending' | 'approved' | 'rejected';
export type PostCategory = 'regular' | 'flash' | 'review' | 'lounge';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  status: UserStatus;
  pace: string | null;
  bio: string | null;
  crew_title: string | null;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  category: PostCategory;
  title: string;
  content: string;
  location: string | null;
  run_date: string | null;
  distance_km: number | null;
  target_pace: string | null;
  elevation_gain: number | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  author?: Profile;
  rsvps?: RSVP[];
  comments?: Comment[];
  _count?: {
    rsvps: number;
    comments: number;
  };
}

export interface RSVP {
  id: string;
  post_id: string;
  user_id: string;
  pace_group: string;
  status: 'attending' | 'waiting' | 'cancelled';
  created_at: string;
  user?: Profile;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: Profile;
}
