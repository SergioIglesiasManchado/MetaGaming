export interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin';
  is_admin: boolean;
  created_at: string;
}

export interface AuthResponse {
  status: string;
  data: {
    user: UserProfile;
    token: string;
  };
}
