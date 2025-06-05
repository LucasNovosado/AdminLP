import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import authService from '../services/authService';
import marcasService from '../services/marcasService';
import lojasService from '../services/lojasService';
import './DashboardLojasPage.css';

const DashboardLojasPage = () => {
  const { marcaId } = useParams();
  const [user, setUser] = useState(null);
  const [marca, setMarca] = useState(null);
  const [lojas, setLojas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [modalExcluir, setModalExcluir] = useState({ aberto: false, loja: null });
  const [excluindo, setExcluindo] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const verificarAutenticacao = () => {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        navigate('/');
        return false;
      }
      setUser(currentUser);
      return true;
    };

    const carregarDados = async () => {
      if (!verificarAutenticacao()) return;

      setLoading(true);
      setErro('');

      try {
        // Carregar dados da marca
        const marcaData = await marcasService.getMarcaById(marcaId);
        setMarca(marcaData);

        // Carregar lojas da marca
        await carregarLojas();
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        if (error.code === 101) { // Parse error code for object not found
          setErro('Marca não encontrada.');
          navigate('/marcas');
        } else {
          setErro('Erro ao carregar os dados. Tente novamente.');
        }
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [marcaId, navigate]);

  const carregarLojas = async () => {
    try {
      const resultado = await lojasService.getLojasPorMarca(marcaId, filtroEstado);
      setLojas(resultado);
    } catch (error) {
      console.error('Erro ao carregar lojas:', error);
      setErro('Erro ao carregar as lojas.');
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

  const voltarMarcas = () => {
    navigate('/marcas');
  };

  const handleFiltroChange = (e) => {
    setFiltroEstado(e.target.value);
  };

  const aplicarFiltro = () => {
    carregarLojas();
  };

  const novaLoja = () => {
    navigate(`/marca/${marcaId}/nova-loja`);
  };

  const editarLoja = (lojaId) => {
    navigate(`/marca/${marcaId}/editar-loja/${lojaId}`);
  };

  const importarLojas = () => {
    navigate(`/marca/${marcaId}/importar-lojas`);
  };

  const gerenciarPrecos = () => {
    navigate(`/marca/${marcaId}/precos`);
  };

  const alternarStatus = async (loja) => {
    try {
      await lojasService.alternarStatus(loja);
      await carregarLojas(); // Recarregar lista
    } catch (error) {
      console.error('Erro ao alterar status da loja:', error);
      setErro('Erro ao alterar o status da loja.');
    }
  };

  const abrirModalExcluir = (loja) => {
    setModalExcluir({ aberto: true, loja });
  };

  const fecharModalExcluir = () => {
    setModalExcluir({ aberto: false, loja: null });
  };

  const confirmarExclusao = async () => {
    if (!modalExcluir.loja) return;

    setExcluindo(true);
    try {
      await lojasService.excluirLoja(modalExcluir.loja.id);
      await carregarLojas(); // Recarregar lista
      fecharModalExcluir();
    } catch (error) {
      console.error('Erro ao excluir loja:', error);
      setErro('Erro ao excluir a loja.');
    } finally {
      setExcluindo(false);
    }
  };

  const formatarPreco = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor || 0);
  };

  const gerarUrlLoja = (slug) => {
    if (!marca || !slug) return '#';
    return `https://suaempresa.com.br/${marca.get('slug')}/${slug}`;
  };

  if (loading) {
    return (
      <div className="dashboard-lojas-container">
        <div className="loading-container">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p>Carregando dados...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!marca) {
    return (
      <div className="dashboard-lojas-container">
        <div className="loading-container">
          <div className="loading-content">
            <p>Marca não encontrada.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-lojas-container">
      <header className="dashboard-lojas-header">
        <div className="dashboard-lojas-header-content">
          <div className="header-left">
            <div className="marca-info">
              {marca.get('logo') ? (
                <img 
                  src={marca.get('logo').url()} 
                  alt={`Logo ${marca.get('nome')}`}
                  className="marca-logo"
                />
              ) : (
                <div className="marca-logo-placeholder">
                  {marca.get('nome').charAt(0).toUpperCase()}
                </div>
              )}
              
              <div className="marca-details">
                <h1>{marca.get('nome')}</h1>
                <span className="marca-slug">/{marca.get('slug')}</span>
              </div>
            </div>
            <span className="user-info">Olá, {user?.get('username')}</span>
          </div>
          
          <div className="header-actions">
            <button className="btn-voltar-marcas" onClick={voltarMarcas}>
              ← Voltar para Marcas
            </button>
            <button className="btn-logout" onClick={handleLogout}>
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-lojas-content">
        {erro && <div className="erro-message">{erro}</div>}

        <div className="dashboard-actions">
          <div className="actions-row">
            <h2 className="actions-title">Gerenciar Lojas</h2>
            <div className="primary-actions">
              <button onClick={novaLoja} className="btn-nova-loja">
                ➕ Nova Loja
              </button>
              <button onClick={importarLojas} className="btn-importar">
                📥 Importar Lojas
              </button>
              <button onClick={gerenciarPrecos} className="btn-gerenciar-precos">
                💰 Gerenciar Preços
              </button>
            </div>
          </div>
          
          <div className="filters-row">
            <select 
              value={filtroEstado} 
              onChange={handleFiltroChange}
              className="filtro-select"
            >
              <option value="">Todos os estados</option>
              <option value="PR">Paraná (PR)</option>
              <option value="SP">São Paulo (SP)</option>
            </select>
            <button onClick={aplicarFiltro} className="btn-filtrar">
              🔍 Filtrar
            </button>
          </div>
        </div>
        
        <div className="lojas-container">
          <div className="lojas-header">
            <h2>Lojas da Marca</h2>
            <span className="lojas-count">
              {lojas.length} {lojas.length === 1 ? 'loja encontrada' : 'lojas encontradas'}
            </span>
          </div>
          
          <div className="lojas-content">
            {loading ? (
              <div className="loading-message">Carregando lojas...</div>
            ) : lojas.length === 0 ? (
              <div className="empty-message">
                <div className="empty-icon">🏪</div>
                <p>Nenhuma loja encontrada para esta marca.</p>
                <button onClick={novaLoja} className="btn-nova-loja">
                  ➕ Criar primeira loja
                </button>
              </div>
            ) : (
              <table className="lojas-tabela">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Cidade</th>
                    <th>Slug</th>
                    <th>Telefone</th>
                    <th>Preço</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {lojas.map((loja) => (
                    <tr 
                      key={loja.id} 
                      className={loja.get('ativa') ? '' : 'loja-inativa'}
                    >
                      <td>
                        <span className={`status-badge ${loja.get('ativa') ? 'status-ativo' : 'status-inativo'}`}>
                          {loja.get('ativa') ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      <td>
                        <span className="cidade-info">{loja.get('cidade')}</span>
                        <span className="estado-badge">{loja.get('estado')}</span>
                      </td>
                      <td>
                        <span className="slug-link">/{loja.get('slug')}</span>
                      </td>
                      <td>
                        <span className="telefone-info">{loja.get('telefone')}</span>
                      </td>
                      <td>
                        <span className="preco-info">
                          {formatarPreco(loja.get('preco_inicial'))}
                        </span>
                      </td>
                      <td className="acoes-cell">
                        <button 
                          onClick={() => editarLoja(loja.id)} 
                          className="btn-icon btn-editar"
                          title="Editar loja"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => alternarStatus(loja)} 
                          className="btn-icon btn-status"
                          title={loja.get('ativa') ? 'Desativar' : 'Ativar'}
                        >
                          {loja.get('ativa') ? '🔴' : '🟢'}
                        </button>
                        <a 
                          href={gerarUrlLoja(loja.get('slug'))} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn-icon btn-visualizar"
                          title="Visualizar no site"
                        >
                          👁️
                        </a>
                        <button 
                          onClick={() => abrirModalExcluir(loja)} 
                          className="btn-icon btn-excluir"
                          title="Excluir loja"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Modal de confirmação de exclusão */}
      {modalExcluir.aberto && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Confirmar Exclusão</h3>
            </div>
            <div className="modal-body">
              <p>
                Tem certeza que deseja excluir a loja <strong>{modalExcluir.loja?.get('cidade')}</strong>?
              </p>
              <p>Esta ação não pode ser desfeita.</p>
            </div>
            <div className="modal-actions">
              <button 
                onClick={fecharModalExcluir}
                className="btn-cancelar"
                disabled={excluindo}
              >
                Cancelar
              </button>
              <button 
                onClick={confirmarExclusao}
                className="btn-confirmar"
                disabled={excluindo}
              >
                {excluindo ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLojasPage;