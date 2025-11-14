import { useState, useEffect } from 'react';
import type { UserInfo } from '../types/api';
import { getCurrentUser, logout as apiLogout, tokenStorage } from '../utils/api';

export function useAuth() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = tokenStorage.get();
    if (!token) {
      setLoading(false);
      setIsAuthenticated(false);
      return;
    }

    try {
      const userInfo = await getCurrentUser();
      setUser(userInfo);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('인증 확인 실패:', error);
      tokenStorage.remove();
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.error('로그아웃 실패:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return {
    user,
    loading,
    isAuthenticated,
    logout,
    refresh: checkAuth,
  };
}

