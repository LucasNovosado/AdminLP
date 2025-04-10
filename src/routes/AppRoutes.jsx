import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import FormularioLojaPage from '../pages/FormularioLojaPage';
import PrecosPage from '../pages/PrecosPage';
import ImportacaoLojasPage from '../pages/ImportacaoLojasPage';
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
      
      {/* Rotas protegidas */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/nova-loja" 
        element={
          <ProtectedRoute>
            <FormularioLojaPage />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/editar-loja/:id" 
        element={
          <ProtectedRoute>
            <FormularioLojaPage />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/precos" 
        element={
          <ProtectedRoute>
            <PrecosPage />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/importar-lojas" 
        element={
          <ProtectedRoute>
            <ImportacaoLojasPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Redirecionamento de rotas não encontradas para o dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;