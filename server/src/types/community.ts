export interface Community {
  id: number;
  game_id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  game_title?: string;
  game_photos?: string[];
}

export interface CommunityPost {
  id: number;
  community_id: number;
  user_id: number;
  username: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  comments_count: number;
}

export interface CommunityComment {
  id: number;
  post_id: number;
  user_id: number;
  username: string;
  parent_comment_id: number | null;
  content: string;
  created_at: string;
  updated_at: string;
  replies?: CommunityComment[];
}

export interface CreatePostDto {
  title: string;
  content: string;
}

export interface CreateCommentDto {
  content: string;
  parent_comment_id?: number | null;
}
