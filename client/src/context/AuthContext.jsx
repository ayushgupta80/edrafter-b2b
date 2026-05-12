import { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    const { data } = await API.post('/users/login', { email, password });
    const userData = { _id: data._id, name: data.name, email: data.email, isAdmin: data.isAdmin, token: data.token };
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setProfile(data.profile);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await API.get('/users/profile' + (user.isAdmin ? '?clients=true' : ''));
      setProfile(data);
    } catch (e) {
      console.error('Profile fetch failed:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) refreshProfile();
  }, [user?.token]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
