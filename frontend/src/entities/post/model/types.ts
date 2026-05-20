export type PostPhoto = {
  id: number;
  post_id: number;
  path: string;
};

export type Post = {
  id: number;
  author_id: number;
  status: string;
  description: string | null;
  event_date: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  hashtag: string;
  created_at: string;
  author_name: string;
  author_avatar?: string | null;
  comments_count: number;
  photos: PostPhoto[];
  is_favorited?: boolean;
};

export type PostComment = {
  id: number;
  post_id: number;
  author_id: number;
  author_name: string;
  author_avatar?: string | null;
  text: string;
  created_at: string;
};
