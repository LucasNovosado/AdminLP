import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import authService from '../services/authService';

/**
 * Componente que protege rotas que requerem autenticação
 */
const ProtectedRoute = ({ children }) => {
  try {
    const isAuthenticated = !!authService.getCurrentUser();
    
    if (!isAuthenticated) {
      return <Navigate to="/" replace />;
    }
    
    return children;
  } catch (error) {
    console.error("Erro ao verificar autenticação:", error);
    return <Navigate to="/" replace />;
  }
};

/**
 * Componente que redireciona usuários já autenticados
 */
const PublicRoute = ({ children }) => {
  try {
    const isAuthenticated = !!authService.getCurrentUser();
    
    if (isAuthenticated) {
      return <Navigate to="/dashboard" replace />;
    }
    
    return children;
  } catch (error) {
    console.error("Erro ao verificar autenticação:", error);
    return children;
  }
};

/**
 * Configuração principal de rotas da aplicação
 */
const AppRoutes = () => {
  return (
    <Routes>
      {/* Rota pública - Login */}
      <Route 
        path="/" 
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } 
      />
      
      {/* Rota protegida - Dashboard */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Redirecionamento de rotas não encontradas para a página inicial */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;