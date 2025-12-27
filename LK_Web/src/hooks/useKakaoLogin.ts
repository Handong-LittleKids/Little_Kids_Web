import { useState } from 'react'
import { getKakaoLoginUrl } from '../utils/api'
import { useAuth } from './useAuth'

export function useKakaoLogin() {
  const [loading, setLoading] = useState(false)
  const { refresh, setUserFromLogin } = useAuth()

  const handleKakaoLogin = async () => {
    try {
      setLoading(true)
      const { login_url } = await getKakaoLoginUrl()

      const width = 500
      const height = 600
      const left = window.screen.width / 2 - width / 2
      const top = window.screen.height / 2 - height / 2

      const popup = window.open(
        login_url,
        '카카오 로그인',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
      )

      let messageProcessed = false
      const messageHandler = async (event: MessageEvent) => {
        // 프로덕션 환경에서는 현재 origin과 일치하는지 확인
        // 개발 환경에서는 localhost 허용
        const isLocalhost = event.origin.startsWith('http://localhost:') || 
                           event.origin.startsWith('https://localhost:')
        const isSameOrigin = event.origin === window.location.origin
        
        if (!isLocalhost && !isSameOrigin) {
          console.log('메시지 origin 불일치:', event.origin, '현재 origin:', window.location.origin)
          return
        }

        if (messageProcessed) {
          console.log('이미 처리된 메시지입니다.')
          return
        }

        if (event.data.type === 'KAKAO_AUTH_SUCCESS') {
          messageProcessed = true
          if (event.data.userInfo) {
            setUserFromLogin(event.data.userInfo)
          }
          await refresh()
          window.removeEventListener('message', messageHandler)
          popup?.close()
          setLoading(false)
        } else if (event.data.type === 'KAKAO_AUTH_ERROR') {
          messageProcessed = true
          window.removeEventListener('message', messageHandler)
          popup?.close()
          setLoading(false)
        }
      }

      window.addEventListener('message', messageHandler)

      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed)
          window.removeEventListener('message', messageHandler)
          setLoading(false)
        }
      }, 1000)
    } catch (error) {
      console.error('카카오 로그인 URL 가져오기 실패:', error)
      alert('로그인 페이지를 불러오는데 실패했습니다.')
      setLoading(false)
    }
  }

  return { handleKakaoLogin, loading }
}


