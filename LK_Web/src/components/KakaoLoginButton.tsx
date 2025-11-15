import { useState } from 'react';
import styled from 'styled-components';
import { getKakaoLoginUrl } from '../utils/api';
import { useAuth } from '../hooks/useAuth';

export function KakaoLoginButton() {
  const [loading, setLoading] = useState(false);
  const { refresh, setUserFromLogin } = useAuth();

  const handleKakaoLogin = async () => {
    try {
      setLoading(true);
      const { login_url } = await getKakaoLoginUrl();
      
      // 팝업으로 카카오 로그인 열기
      const width = 500;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const popup = window.open(
        login_url,
        '카카오 로그인',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );

      // 팝업에서 메시지 받기
      let messageProcessed = false; // 중복 처리 방지
      const messageHandler = async (event: MessageEvent) => {
        // 현재 origin과 일치하는지 확인 (포트가 달라질 수 있으므로 localhost만 확인)
        const currentOrigin = window.location.origin;
        if (!event.origin.startsWith('http://localhost:') && !event.origin.startsWith('https://localhost:')) {
          return;
        }
        
        // 이미 처리된 경우 중복 실행 방지
        if (messageProcessed) {
          console.log('이미 처리된 메시지입니다.');
          return;
        }
        
        if (event.data.type === 'KAKAO_AUTH_SUCCESS') {
          // KakaoCallback에서 이미 로그인 처리가 완료됨
          messageProcessed = true;
          if (event.data.userInfo) {
            setUserFromLogin(event.data.userInfo);
          }
          await refresh(); // 사용자 정보 새로고침
          window.removeEventListener('message', messageHandler);
          popup?.close();
          setLoading(false);
        } else if (event.data.type === 'KAKAO_AUTH_ERROR') {
          // 에러 처리
          messageProcessed = true;
          window.removeEventListener('message', messageHandler);
          popup?.close();
          setLoading(false);
        }
      };

      window.addEventListener('message', messageHandler);

      // 팝업이 닫혔는지 확인
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          setLoading(false);
        }
      }, 1000);
    } catch (error) {
      console.error('카카오 로그인 URL 가져오기 실패:', error);
      alert('로그인 페이지를 불러오는데 실패했습니다.');
      setLoading(false);
    }
  };

  return (
    <KakaoButton onClick={handleKakaoLogin} disabled={loading}>
      {loading ? '로그인 중...' : '카카오로 로그인'}
    </KakaoButton>
  );
}

const KakaoButton = styled.button`
  background-color: #FEE500;
  color: #000000;
  border: none;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover:not(:disabled) {
    background-color: #FDD835;
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

