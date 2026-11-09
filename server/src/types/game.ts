export interface Game {
  id: number;
  title: string;
  description: string;
  platforms: string[];
  photos: string[];
  average_rating: number;
  reviews_count: number;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: number;
  game_id: number;
  user_id: number;
  username: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
}

export interface CreateGameDto {
  title: string;
  description: string;
  platforms: string[];
  photos?: string[];
}

export interface CreateReviewDto {
  rating: number;
  comment: string;
}
