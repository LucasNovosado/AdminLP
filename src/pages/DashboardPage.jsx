// src/pages/DashboardPage.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { Parse } from '../services/parseService';
import './DashboardPage.css';
import MarcasPage from '../pages/MarcasPage';


const DashboardPage = () => {
  const [user, setUser] = useState(null);
  const [lojas, setLojas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar se o usuário está logado
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      navigate('/');
      return;
    }
    
    setUser(currentUser);
    carregarLojas();
  }, [navigate]);

  const carregarLojas = async () => {
    setLoading(true);
    try {
      // Consulta de lojas no Parse/Back4App
      const Loja = Parse.Object.extend("Lojas");
      const query = new Parse.Query(Loja);
      
      // Aplicar filtro se necessário
      if (filtroEstado) {
        query.equalTo("estado", filtroEstado);
      }
      
      query.descending("createdAt");
      const resultado = await query.find();
      
      setLojas(resultado);
    } catch (error) {
      console.error("Erro ao carregar lojas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleFiltroChange = (e) => {
    setFiltroEstado(e.target.value);
  };

  const aplicarFiltro = () => {
    carregarLojas();
  };

  const editarLoja = (objectId) => {
    navigate(`/editar-loja/${objectId}`);
  };

  const novaLoja = () => {
    navigate('/nova-loja');
  };

  const importarLojas = () => {
    navigate('/importar-lojas');
  };

  const gerenciarPrecos = () => {
    navigate('/precos');
  };

  const alternarStatus = async (loja) => {
    try {
      loja.set("ativa", !loja.get("ativa"));
      await loja.save();
      // Recarrega a lista para mostrar a mudança
      carregarLojas();
    } catch (error) {
      console.error("Erro ao alterar status da loja:", error);
    }
  };

  if (loading && !user) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Painel Administrativo</h1>
          <span className="user-info">Olá, {user?.get('username')}</span>
        </div>
        <div className="header-right">
          <button className="logout-button" onClick={handleLogout}>Sair</button>
        </div>
      </header>
      
      <div className="dashboard-content">
        <div className="dashboard-actions">
          <div className="filtro-container">
            <select 
              value={filtroEstado} 
              onChange={handleFiltroChange}
              className="filtro-select"
            >
              <option value="">Todos os estados</option>
              <option value="PR">Paraná</option>
              <option value="SP">São Paulo</option>
            </select>
            <button onClick={aplicarFiltro} className="btn-filtrar">Filtrar</button>
          </div>
          
          <div className="action-buttons">
            <button onClick={novaLoja} className="btn-primario">Nova Loja</button>
            <button onClick={importarLojas} className="btn-primario">Importar Lojas</button>
            <button onClick={gerenciarPrecos} className="btn-secundario">Gerenciar Preços</button>
          </div>
        </div>
        
        <div className="lojas-container">
          <h2>Lojas Cadastradas</h2>
          
          {loading ? (
            <div className="loading-message">Carregando lojas...</div>
          ) : lojas.length === 0 ? (
            <div className="empty-message">
              Nenhuma loja encontrada. Crie uma nova loja para começar.
            </div>
          ) : (
            <table className="lojas-tabela">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Cidade</th>
                  <th>Estado</th>
                  <th>Slug</th>
                  <th>Telefone</th>
                  <th>Preço</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {lojas.map((loja) => (
                  <tr key={loja.id} className={loja.get('ativa') ? 'loja-ativa' : 'loja-inativa'}>
                    <td>
                      <span className={`status-badge ${loja.get('ativa') ? 'status-ativo' : 'status-inativo'}`}>
                        {loja.get('ativa') ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>{loja.get('cidade')}</td>
                    <td>{loja.get('estado')}</td>
                    <td>{loja.get('slug')}</td>
                    <td>{loja.get('telefone')}</td>
                    <td>R$ {loja.get('preco_inicial')},00</td>
                    <td className="acoes-cell">
                      <button 
                        onClick={() => editarLoja(loja.id)} 
                        className="btn-editar"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => alternarStatus(loja)} 
                        className={`btn-status ${loja.get('ativa') ? 'desativar' : 'ativar'}`}
                        title={loja.get('ativa') ? 'Desativar' : 'Ativar'}
                      >
                        {loja.get('ativa') ? '🔴' : '🟢'}
                      </button>
                      <a 
                        href={`https://redeunicadebaterias.com.br/${loja.get('slug')}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn-visualizar"
                        title="Visualizar no site"
                      >
                        👁️
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;