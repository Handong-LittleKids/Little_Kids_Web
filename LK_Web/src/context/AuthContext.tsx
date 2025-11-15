import { createContext, useCallback, useEffect, useMemo, useState, ReactNode } from 'react'
import type { UserInfo } from '../types/api'
import { getCurrentUser, logout as apiLogout, tokenStorage } from '../utils/api'

type AuthContextValue = {
  user: UserInfo | null
  isAuthenticated: boolean
  loading: boolean
  displayName: string
  customNickname: string | null
  refresh: () => Promise<void>
  logout: () => Promise<void>
  setUserFromLogin: (userInfo: UserInfo) => void
  setCustomNickname: (name: string) => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const CUSTOM_NICKNAME_KEY = 'lk_custom_nickname'
const DEFAULT_NICKNAME = '익명의 사용자'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [customNickname, setCustomNicknameState] = useState<string | null>(() => {
    const stored = localStorage.getItem(CUSTOM_NICKNAME_KEY)
    return stored ? stored : null
  })

  const deriveDisplayName = useCallback(
    (targetUser: UserInfo | null, nicknameOverride: string | null) => {
      if (nicknameOverride && nicknameOverride.trim()) {
        return nicknameOverride.trim()
      }
      if (targetUser?.nickname && targetUser.nickname.trim()) {
        return targetUser.nickname.trim()
      }
      return DEFAULT_NICKNAME
    },
    []
  )

  const [displayName, setDisplayName] = useState<string>(DEFAULT_NICKNAME)

  const syncDisplayName = useCallback(
    (targetUser: UserInfo | null, nicknameOverride: string | null = customNickname) => {
      setDisplayName(deriveDisplayName(targetUser, nicknameOverride))
    },
    [customNickname, deriveDisplayName]
  )

  const refresh = useCallback(async () => {
    const token = tokenStorage.get()
    if (!token) {
      setUser(null)
      setIsAuthenticated(false)
      setLoading(false)
      syncDisplayName(null)
      return
    }

    try {
      const userInfo = await getCurrentUser()
      setUser(userInfo)
      setIsAuthenticated(true)
      syncDisplayName(userInfo)
    } catch (error) {
      console.error('인증 확인 실패:', error)
      tokenStorage.remove()
      setUser(null)
      setIsAuthenticated(false)
      syncDisplayName(null)
    } finally {
      setLoading(false)
    }
  }, [syncDisplayName])

  const logout = useCallback(async () => {
    try {
      await apiLogout()
    } catch (error) {
      console.error('로그아웃 실패:', error)
    } finally {
      tokenStorage.remove()
      setUser(null)
      setIsAuthenticated(false)
      syncDisplayName(null)
    }
  }, [syncDisplayName])

  const setUserFromLogin = useCallback(
    (nextUser: UserInfo) => {
      setUser(nextUser)
      setIsAuthenticated(true)
      syncDisplayName(nextUser)
    },
    [syncDisplayName]
  )

  const setCustomNickname = useCallback(
    (name: string) => {
      const trimmed = name.trim()
      if (trimmed) {
        localStorage.setItem(CUSTOM_NICKNAME_KEY, trimmed)
        setCustomNicknameState(trimmed)
        syncDisplayName(user, trimmed)
      } else {
        localStorage.removeItem(CUSTOM_NICKNAME_KEY)
        setCustomNicknameState(null)
        syncDisplayName(user, null)
      }
    },
    [syncDisplayName, user]
  )

  useEffect(() => {
    refresh()
  }, [refresh])

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      isAuthenticated,
      loading,
      displayName,
      customNickname,
      refresh,
      logout,
      setUserFromLogin,
      setCustomNickname,
    }
  }, [
    customNickname,
    displayName,
    isAuthenticated,
    loading,
    logout,
    refresh,
    setCustomNickname,
    setUserFromLogin,
    user,
  ])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
