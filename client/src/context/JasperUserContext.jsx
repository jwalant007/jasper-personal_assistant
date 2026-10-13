import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const JasperUserContext = createContext(null);

const DEFAULT_USER_ID = 'jwalant';

export function JasperUserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('jasper_current_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      userId: localStorage.getItem('jasper_current_user_id') || DEFAULT_USER_ID,
      name: 'Jwalant',
      role: 'System Architect & Owner',
      avatar: '👑',
      hasPin: true,
      hasFaceProfile: false
    };
  });

  const [usersList, setUsersList] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('jasper_is_authenticated') === 'true';
  });
  const [loading, setLoading] = useState(true);

  // Sync users list from server
  const refreshUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.users)) {
          setUsersList(data.users);
          // If currentUser is in list, sync details
          const currentId = currentUser?.userId || localStorage.getItem('jasper_current_user_id') || DEFAULT_USER_ID;
          const match = data.users.find(u => u.userId.toLowerCase() === currentId.toLowerCase());
          if (match) {
            setCurrentUser(prev => ({
              ...prev,
              ...match
            }));
          }
        }
      }
    } catch (err) {
      console.warn('[JasperUserContext] Failed to fetch users list:', err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.userId]);

  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  // Save current user to localStorage whenever changed
  useEffect(() => {
    if (currentUser && currentUser.userId) {
      localStorage.setItem('jasper_current_user_id', currentUser.userId);
      localStorage.setItem('jasper_current_user', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  // User Login Action
  const login = useCallback(async (userId, pin = '') => {
    try {
      const cleanId = String(userId || '').trim().toLowerCase();
      if (!cleanId) throw new Error('User ID is required');

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': cleanId },
        body: JSON.stringify({ userId: cleanId, pin })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed');
      }

      const user = data.user;
      setCurrentUser(user);
      setIsAuthenticated(true);
      localStorage.setItem('jasper_current_user_id', user.userId);
      localStorage.setItem('jasper_current_user', JSON.stringify(user));
      localStorage.setItem('jasper_is_authenticated', 'true');
      if (data.token) {
        localStorage.setItem('jasper_auth_token', data.token);
      }

      window.dispatchEvent(new CustomEvent('jasper_user_changed', { detail: { user } }));
      await refreshUsers();
      return { success: true, user };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [refreshUsers]);

  // User Registration Action
  const register = useCallback(async ({ userId, name, pin = '', avatar = '👤', role = 'User' }) => {
    try {
      const cleanId = String(userId || '').trim().toLowerCase();
      if (!cleanId) throw new Error('User ID is required');

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': cleanId },
        body: JSON.stringify({ userId: cleanId, name, pin, avatar, role })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Registration failed');
      }

      const user = data.user;
      setCurrentUser(user);
      setIsAuthenticated(true);
      localStorage.setItem('jasper_current_user_id', user.userId);
      localStorage.setItem('jasper_current_user', JSON.stringify(user));
      localStorage.setItem('jasper_is_authenticated', 'true');
      if (data.token) {
        localStorage.setItem('jasper_auth_token', data.token);
      }

      window.dispatchEvent(new CustomEvent('jasper_user_changed', { detail: { user } }));
      await refreshUsers();
      return { success: true, user };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [refreshUsers]);

  // Fast Switch User Profile Action
  const switchUser = useCallback(async (userId, pin = '') => {
    try {
      const cleanId = String(userId || '').trim().toLowerCase();
      if (!cleanId) throw new Error('Target User ID required');

      const res = await fetch('/api/auth/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': cleanId },
        body: JSON.stringify({ userId: cleanId, pin })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Could not switch user profile');
      }

      const user = data.user;
      setCurrentUser(user);
      setIsAuthenticated(true);
      localStorage.setItem('jasper_current_user_id', user.userId);
      localStorage.setItem('jasper_current_user', JSON.stringify(user));
      localStorage.setItem('jasper_is_authenticated', 'true');

      window.dispatchEvent(new CustomEvent('jasper_user_changed', { detail: { user } }));
      return { success: true, user };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  // Update Profile Action
  const updateProfile = useCallback(async (updates) => {
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(prev => ({ ...prev, ...data.user }));
        await refreshUsers();
        return { success: true, user: data.user };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [refreshUsers]);

  // Delete User Action
  const deleteUserAccount = useCallback(async (userIdToDelete) => {
    try {
      const res = await fetch(`/api/users/${userIdToDelete}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        await refreshUsers();
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [refreshUsers]);

  // Logout / Lock Action
  const logout = useCallback(() => {
    setIsAuthenticated(false);
    localStorage.removeItem('jasper_is_authenticated');
  }, []);

  const value = {
    currentUser,
    setCurrentUser,
    usersList,
    isAuthenticated,
    setIsAuthenticated,
    loading,
    login,
    register,
    switchUser,
    updateProfile,
    deleteUserAccount,
    refreshUsers,
    logout
  };

  return (
    <JasperUserContext.Provider value={value}>
      {children}
    </JasperUserContext.Provider>
  );
}

export function useJasperUser() {
  const context = useContext(JasperUserContext);
  if (!context) {
    throw new Error('useJasperUser must be used within a JasperUserProvider');
  }
  return context;
}
