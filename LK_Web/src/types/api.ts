export interface UserInfo {
  id: number;
  nickname?: string;
  profile_image?: string;
  email?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_info: UserInfo;
}

