import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { kakaoLogin } from '../utils/api';

export function KakaoCallback() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  useEffect(() => {
    const handleCallback = async () => {
      if (error) {
        alert('로그인에 실패했습니다.');
        window.opener?.postMessage(
          { type: 'KAKAO_AUTH_ERROR', error },
          window.location.origin
        );
        window.close();
        return;
      }

      if (code) {
        try {
          await kakaoLogin(code);
          window.opener?.postMessage(
            { type: 'KAKAO_AUTH_CODE', code },
            window.location.origin
          );
          window.close();
        } catch (error: any) {
          console.error('로그인 실패:', error);
          const errorMessage = error?.message || '로그인에 실패했습니다.';
          alert(errorMessage);
          window.opener?.postMessage(
            { type: 'KAKAO_AUTH_ERROR', error: errorMessage },
            window.location.origin
          );
          window.close();
        }
      } else {
        alert('인증 코드를 받지 못했습니다.');
        window.close();
      }
    };

    handleCallback();
  }, [code, error]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <div>로그인 처리 중...</div>
    </div>
  );
}

