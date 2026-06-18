import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AppContextType {
  user: User | null;
  isGuest: boolean;
  apiKey: string;
  setApiKey: (key: string) => void;
  setIsGuest: (guest: boolean) => void;
  loading: boolean;
  logout: () => Promise<void>;
  saveApiKeyToCloud: (key: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [apiKey, setApiKeyState] = useState('');
  const [loading, setLoading] = useState(true);

  // 初始化认证状态
  useEffect(() => {
    async function fetchApiKeyFromCloud(userId: string) {
      try {
        const { data } = await supabase
          .from('user_settings')
          .select('api_key')
          .eq('user_id', userId)
          .single();
        
        if (data && data.api_key) {
          setApiKeyState(data.api_key);
        }
      } catch (err) {
        console.error('Failed to fetch API key:', err);
      } finally {
        setLoading(false);
      }
    }
    // 检查本地是否有 guest 标记
    const localGuest = localStorage.getItem('isGuest') === 'true';
    if (localGuest) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsGuest(true);
      const localKey = localStorage.getItem('deepseek_api_key');
      if (localKey) setApiKeyState(localKey);
      setLoading(false);
      return;
    }

    // 检查 Supabase 登录状态
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchApiKeyFromCloud(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchApiKeyFromCloud(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);



  const saveApiKeyToCloud = async (key: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({ user_id: user.id, api_key: key });
      if (error) throw error;
    } catch (err) {
      console.error('Failed to save API key:', err);
    }
  };

  const setApiKey = (key: string) => {
    setApiKeyState(key);
    if (isGuest) {
      localStorage.setItem('deepseek_api_key', key);
    } else if (user) {
      saveApiKeyToCloud(key);
    }
  };

  const handleSetIsGuest = (guest: boolean) => {
    setIsGuest(guest);
    localStorage.setItem('isGuest', String(guest));
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setApiKeyState('');
    setIsGuest(false);
    localStorage.removeItem('isGuest');
    localStorage.removeItem('deepseek_api_key');
  };

  return (
    <AppContext.Provider value={{
      user, isGuest, apiKey, setApiKey, setIsGuest: handleSetIsGuest, loading, logout, saveApiKeyToCloud
    }}>
      {children}
    </AppContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
