import styled from 'styled-components';
import { useKakaoLogin } from '../hooks/useKakaoLogin';

export function KakaoLoginButton() {
  const { handleKakaoLogin, loading } = useKakaoLogin();

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

