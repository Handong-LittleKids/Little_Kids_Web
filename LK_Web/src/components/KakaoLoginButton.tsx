import { useState } from 'react';
import styled from 'styled-components';
import { getKakaoLoginUrl, kakaoLogin } from '../utils/api';
import { useAuth } from '../hooks/useAuth';

export function KakaoLoginButton() {
  const [loading, setLoading] = useState(false);
  const { refresh } = useAuth();

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
      const messageHandler = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'KAKAO_AUTH_CODE') {
          try {
            await kakaoLogin(event.data.code);
            await refresh();
            window.removeEventListener('message', messageHandler);
            popup?.close();
            setLoading(false);
          } catch (error) {
            console.error('로그인 실패:', error);
            alert('로그인에 실패했습니다. 다시 시도해주세요.');
            window.removeEventListener('message', messageHandler);
            popup?.close();
            setLoading(false);
          }
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

