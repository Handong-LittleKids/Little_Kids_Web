import type { UserInfo, AuthResponse } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // 401 Unauthorized (토큰 만료 등) 시 자동으로 토큰 제거
    if (response.status === 401) {
      tokenStorage.remove();
      // 페이지 리로드하여 로그인 화면으로 이동 (AuthContext가 토큰 없음을 감지)
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const error = await response.json();
      errorMessage = error.detail || error.message || error.error || errorMessage;
    } catch {
      errorMessage = `서버 오류 (${response.status})`;
    }
    console.error('API 오류:', errorMessage);
    throw new Error(errorMessage);
  }

  return response.json();
}

// 카카오 로그인 URL 가져오기
export async function getKakaoLoginUrl(): Promise<{ login_url: string }> {
  return apiRequest<{ login_url: string }>('/api/auth/kakao/login-url');
}

// 타입 재export
export type { UserInfo, AuthResponse } from '../types/api';

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

// 경기 비디오 업로드 (첫 프레임 이미지 생성)
export async function uploadMatchVideo(
  file: File
): Promise<{ match_id: string; frame_url: string }> {
  const token = tokenStorage.get();
  const formData = new FormData();
  formData.append('file', file);

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/matches/upload`, {
    method: 'POST',
    body: formData,
    headers,
  });

  if (!response.ok) {
    // 401 Unauthorized (토큰 만료 등) 시 자동으로 토큰 제거
    if (response.status === 401) {
      tokenStorage.remove();
      // 페이지 리로드하여 로그인 화면으로 이동
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const error = await response.json();
      errorMessage = error.detail || error.message || error.error || errorMessage;
    } catch {
      errorMessage = `서버 오류 (${response.status})`;
    }
    console.error('업로드 API 오류:', errorMessage);
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return {
    match_id: data.match_id,
    frame_url: `${API_BASE_URL}${data.frame_url}`,
  };
}


