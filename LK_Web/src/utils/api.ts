const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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

// 토큰 저장 및 관리
export const tokenStorage = {
  get: (): string | null => {
    return localStorage.getItem('access_token');
  },
  set: (token: string): void => {
    localStorage.setItem('access_token', token);
  },
  remove: (): void => {
    localStorage.removeItem('access_token');
  },
};

// API 요청 헬퍼
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = tokenStorage.get();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: '알 수 없는 오류가 발생했습니다' }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// 카카오 로그인 URL 가져오기
export async function getKakaoLoginUrl(): Promise<{ login_url: string }> {
  return apiRequest<{ login_url: string }>('/api/auth/kakao/login-url');
}

// 카카오 인증 코드로 로그인
export async function kakaoLogin(code: string): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>('/api/auth/kakao/callback', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
  
  // 토큰 저장
  if (response.access_token) {
    tokenStorage.set(response.access_token);
  }
  
  return response;
}

// 현재 사용자 정보 가져오기
export async function getCurrentUser(): Promise<UserInfo> {
  return apiRequest<UserInfo>('/api/auth/me');
}

// 로그아웃
export async function logout(): Promise<void> {
  tokenStorage.remove();
  await apiRequest('/api/auth/logout', { method: 'POST' });
}

