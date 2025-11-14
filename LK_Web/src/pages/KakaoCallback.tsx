import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { kakaoLogin } from '../utils/api';

export function KakaoCallback() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const processedRef = useRef(false); // useRef로 중복 실행 방지 (렌더링과 무관)

  useEffect(() => {
    // 이미 처리된 경우 중복 실행 방지
    if (processedRef.current) {
      console.log('이미 처리된 콜백입니다.');
      return;
    }
    
    const handleCallback = async () => {
      processedRef.current = true; // 처리 시작 표시 (즉시 설정)
      // opener의 origin 가져오기 (보안 제한으로 직접 접근 불가하므로 document.referrer 사용)
      // 또는 localhost인 경우 '*' 사용 (개발 환경에서만)
      const openerOrigin = window.opener 
        ? (document.referrer ? new URL(document.referrer).origin : '*')
        : window.location.origin;
      
      // localhost인 경우 보안을 위해 '*' 사용 (개발 환경)
      const targetOrigin = openerOrigin.includes('localhost') ? '*' : openerOrigin;
      
      if (error) {
        alert('로그인에 실패했습니다.');
        window.opener?.postMessage(
          { type: 'KAKAO_AUTH_ERROR', error },
          targetOrigin
        );
        window.close();
        return;
      }

      if (code) {
        try {
          // 이미 여기서 토큰을 받았으므로, postMessage로는 성공 메시지만 전송
          const response = await kakaoLogin(code);
          // 성공 메시지만 전송 (코드는 전송하지 않음 - 이미 사용됨)
          window.opener?.postMessage(
            { type: 'KAKAO_AUTH_SUCCESS', userInfo: response.user_info },
            targetOrigin
          );
          window.close();
        } catch (error: any) {
          console.error('로그인 실패:', error);
          const errorMessage = error?.message || '로그인에 실패했습니다.';
          alert(errorMessage);
          window.opener?.postMessage(
            { type: 'KAKAO_AUTH_ERROR', error: errorMessage },
            targetOrigin
          );
          window.close();
        }
      } else {
        alert('인증 코드를 받지 못했습니다.');
        window.close();
      }
    };

    handleCallback();
  }, [code, error]); // processed 제거 (useRef 사용)

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

