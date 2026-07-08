
import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);
const APP_DATA_STORAGE_KEY = 'expocentro_app_data_v1';

const findSupplierByEmail = (email) => {
  try {
    const raw = localStorage.getItem(APP_DATA_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const suppliers = parsed?.suppliers || [];
    const needle = String(email || '').toLowerCase();

    return suppliers.find((supplier) => {
      const supplierEmail = String(supplier?.email || supplier?.emailEmpresa || '').toLowerCase();
      return Boolean(supplierEmail) && supplierEmail === needle;
    }) || null;
  } catch {
    return null;
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = (email, password, role) => {
    const credentials = {
      admin: { email: 'admin@expocentro.com.br', password: '123456' },
      fornecedor: { email: 'fornecedor@empresa.com.br', password: '123456' },
      guarita: { email: 'guarita@expocentro.com.br', password: '123456' }
    };

    if (role === 'fornecedor') {
      const supplier = findSupplierByEmail(email);
      if (supplier && password === '123456') {
        setCurrentUser({
          email,
          name: supplier?.nome || supplier?.name || 'Fornecedor'
        });
        setUserRole(role);
        setIsAuthenticated(true);
        return true;
      }
    }

    if (credentials[role] && credentials[role].email === email && credentials[role].password === password) {
      setCurrentUser({ 
        email, 
        name: role === 'admin' ? 'Administrador' : role === 'fornecedor' ? 'Art Planos Stands' : 'Guarita Demo' 
      });
      setUserRole(role);
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    setUserRole(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ currentUser, userRole, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
