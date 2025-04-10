//src/pages/DashboardPage.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import './DashboardPage.css';

const DashboardPage = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar se o usuário está logado usando authService
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      // Se não estiver logado, redireciona para o login
      navigate('/');
      return;
    }
    
    setUser(currentUser);
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  if (!user) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <button className="logout-button" onClick={handleLogout}>
          Sair
        </button>
      </header>
      
      <div className="dashboard-content">
        <div className="welcome-card">
          <h2>Bem-vindo, {user.get('username')}!</h2>
          <p>Você está logado com sucesso no sistema.</p>
        </div>
        
        <div className="dashboard-cards">
          <div className="dashboard-card">
            <h3>Informações da Conta</h3>
            <p>Usuário: {user.get('username')}</p>
            <p>Email: {user.get('email') || 'Não informado'}</p>
          </div>
          
          {/* Outros cards podem ser adicionados aqui */}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;