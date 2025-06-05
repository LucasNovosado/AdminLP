import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import MarcasPage from '../pages/MarcasPage';
import FormularioMarcaPage from '../pages/FormularioMarcaPage';
import DashboardLojasPage from '../pages/DashboardLojasPages';
import DashboardLojasPage from '../pages/DashboardLojasPages';
import FormularioLojaPage from '../pages/FormularioLojaPage';
import PrecosMarcaPage from '../pages/PrecosMarcaPage';
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
      return <Navigate to="/marcas" replace />;
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
      
      {/* Rotas de Marcas */}
      <Route 
        path="/marcas" 
        element={
          <ProtectedRoute>
            <MarcasPage />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/nova-marca" 
        element={
          <ProtectedRoute>
            <FormularioMarcaPage />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/editar-marca/:id" 
        element={
          <ProtectedRoute>
            <FormularioMarcaPage />
          </ProtectedRoute>
        } 
      />

      {/* Rotas de Lojas por Marca */}
      <Route 
        path="/marca/:marcaId/lojas" 
        element={
          <ProtectedRoute>
            <DashboardLojasPage />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/marca/:marcaId/nova-loja" 
        element={
          <ProtectedRoute>
            <FormularioLojaPage />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/marca/:marcaId/editar-loja/:id" 
        element={
          <ProtectedRoute>
            <FormularioLojaPage />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/marca/:marcaId/precos" 
        element={
          <ProtectedRoute>
            <PrecosMarcaPage />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/marca/:marcaId/importar-lojas" 
        element={
          <ProtectedRoute>
            <ImportacaoLojasPage />
          </ProtectedRoute>
        } 
      />

      {/* Rotas legacy para compatibilidade - redirecionam para /marcas */}
      <Route path="/dashboard" element={<Navigate to="/marcas" replace />} />
      <Route path="/nova-loja" element={<Navigate to="/marcas" replace />} />
      <Route path="/editar-loja/:id" element={<Navigate to="/marcas" replace />} />
      <Route path="/precos" element={<Navigate to="/marcas" replace />} />
      <Route path="/importar-lojas" element={<Navigate to="/marcas" replace />} />
      
      {/* Redirecionamento de rotas não encontradas para marcas */}
      <Route path="*" element={<Navigate to="/marcas" replace />} />
    </Routes>
  );
};

export default AppRoutes;