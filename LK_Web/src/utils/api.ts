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

// 경기 비디오 업로드 (임시 저장만, 프레임 추출은 별도)
export async function uploadMatchVideo(
  file: File
): Promise<{ match_id: string; message: string }> {
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
    message: data.message,
  };
}

// 첫 프레임 추출 및 S3 저장
export async function extractFrame(
  matchId: string
): Promise<{ match_id: string; frame_url: string; video_url?: string; message: string }> {
  return apiRequest(`/api/matches/${matchId}/extract-frame`, {
    method: 'POST',
  });
}

// 경기장 좌표 저장
export async function savePitchPoints(
  matchId: string,
  points: { x: number; y: number }[]
): Promise<{ match_id: string; points_count: number; points_url?: string; annotated_image_url?: string; message: string }> {
  // FastAPI가 배열을 직접 받을 수 있도록 Body를 사용하므로 배열을 직접 보냄
  const token = tokenStorage.get();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/matches/${matchId}/pitch-points`, {
    method: 'POST',
    headers,
    body: JSON.stringify(points),
  });

  if (!response.ok) {
    if (response.status === 401) {
      tokenStorage.remove();
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
    console.error('좌표 저장 API 오류:', errorMessage);
    throw new Error(errorMessage);
  }

  return response.json();
}

// 경기장 좌표 조회
export async function getPitchPoints(
  matchId: string
): Promise<{ match_id: string; points: { x: number; y: number }[] }> {
  return apiRequest(`/api/matches/${matchId}/pitch-points`);
}

// 매치 타입 정의
export type MatchVideoInfo = {
  match_id: string
  video_url?: string
  frame_url?: string
  points: { x: number; y: number }[]
}

export type Match = {
  match_id: string
  name: string
  user_id: string
  videos: MatchVideoInfo[]
  status: 'created' | 'analyzing' | 'completed' | 'failed'
  created_at: string
  updated_at: string
  csv_url?: string
  result_video_url?: string
  llm_report_url?: string
  llm_report_summary?: string
  progress?: number
  status_message?: string
}

export type MatchListItem = {
  match_id: string
  name: string
  status: 'created' | 'analyzing' | 'completed' | 'failed'
  created_at: string
  updated_at: string
  videos_count: number
  thumbnail_url?: string | null
}

// 매치 생성
export async function createMatch(
  name: string,
  videos: MatchVideoInfo[]
): Promise<{ match_id: string; name: string; status: string; message: string }> {
  return apiRequest('/api/matches', {
    method: 'POST',
    body: JSON.stringify({ name, videos }),
  });
}

// 매치 목록 조회
export async function listMatches(): Promise<{ matches: MatchListItem[] }> {
  return apiRequest('/api/matches');
}

// 매치 상세 조회
export async function getMatch(matchId: string): Promise<Match> {
  return apiRequest(`/api/matches/${matchId}`);
}

// 매치 이름 변경
export async function updateMatch(
  matchId: string,
  name: string
): Promise<{ match_id: string; name: string; message: string }> {
  return apiRequest(`/api/matches/${matchId}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });
}

// 매치 삭제
export async function deleteMatch(
  matchId: string
): Promise<{ match_id: string; message: string }> {
  return apiRequest(`/api/matches/${matchId}`, {
    method: 'DELETE',
  })
}

// 매치 분석 시작
export async function startAnalysis(
  matchId: string
): Promise<{ match_id: string; status: string; message: string }> {
  return apiRequest(`/api/matches/${matchId}/analyze`, {
    method: 'POST',
  })
}

// Presigned URL 가져오기 (CSV 또는 Video)
export async function getPresignedUrl(
  matchId: string,
  fileType: 'csv' | 'video'
): Promise<{ presigned_url: string; file_type: string; expires_in: number }> {
  return apiRequest(`/api/matches/${matchId}/presigned-url?file_type=${fileType}`, {
    method: 'GET',
  })
}

// LLM 리포트 생성
export async function generateLLMReport(
  matchId: string
): Promise<{
  success: boolean
  report_id: string
  report_url: string
  summary: string
  team_stats: Record<string, number>
  player_stats: Record<string, number>
}> {
  return apiRequest(`/api/matches/${matchId}/generate-llm-report`, {
    method: 'POST',
  })
}

// LLM 리포트 조회
export async function getLLMReport(
  matchId: string
): Promise<{
  report_url: string
  summary: string
  generated_at: string
}> {
  return apiRequest(`/api/matches/${matchId}/llm-report`, {
    method: 'GET',
  })
}

// LLM 리포트 HTML 내용 가져오기
export async function getLLMReportHTML(matchId: string): Promise<string> {
  const token = tokenStorage.get()
  const headers: Record<string, string> = {
    'Content-Type': 'text/html',
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}/api/matches/${matchId}/llm-report/html`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    if (response.status === 401) {
      tokenStorage.remove()
      if (window.location.pathname !== '/') {
        window.location.href = '/'
      }
    }
    
    let errorMessage = `HTTP error! status: ${response.status}`
    try {
      const error = await response.json()
      errorMessage = error.detail || error.message || error.error || errorMessage
    } catch {
      errorMessage = `서버 오류 (${response.status})`
    }
    console.error('API 오류:', errorMessage)
    throw new Error(errorMessage)
  }

  return response.text()
}


