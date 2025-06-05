import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import marcasService from '../services/marcasService';
import './MarcasPage.css';

const MarcasPage = () => {
  const [user, setUser] = useState(null);
  const [marcas, setMarcas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [modalExcluir, setModalExcluir] = useState({ aberto: false, marca: null });
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

    const carregarMarcas = async () => {
      if (!verificarAutenticacao()) return;

      setLoading(true);
      setErro('');

      try {
        const resultado = await marcasService.getMarcas();
        setMarcas(resultado);
      } catch (error) {
        console.error('Erro ao carregar marcas:', error);
        setErro('Erro ao carregar as marcas. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    carregarMarcas();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const novaMarca = () => {
    navigate('/nova-marca');
  };

  const visualizarMarca = (marcaId) => {
    navigate(`/marca/${marcaId}/lojas`);
  };

  const editarMarca = (marcaId) => {
    navigate(`/editar-marca/${marcaId}`);
  };

  const alternarStatus = async (marca) => {
    try {
      await marcasService.alternarStatus(marca);
      // Recarregar as marcas
      const marcasAtualizadas = await marcasService.getMarcas();
      setMarcas(marcasAtualizadas);
    } catch (error) {
      console.error('Erro ao alterar status da marca:', error);
      setErro('Erro ao alterar o status da marca.');
    }
  };

  const abrirModalExcluir = (marca) => {
    setModalExcluir({ aberto: true, marca });
  };

  const fecharModalExcluir = () => {
    setModalExcluir({ aberto: false, marca: null });
  };

  const confirmarExclusao = async () => {
    if (!modalExcluir.marca) return;

    setExcluindo(true);
    try {
      await marcasService.excluirMarca(modalExcluir.marca.id);
      
      // Remover marca da lista
      setMarcas(marcas.filter(m => m.id !== modalExcluir.marca.id));
      fecharModalExcluir();
    } catch (error) {
      console.error('Erro ao excluir marca:', error);
      setErro(error.message || 'Erro ao excluir a marca.');
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

  if (loading) {
    return (
      <div className="marcas-container">
        <div className="loading-container">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p>Carregando marcas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="marcas-container">
      <header className="marcas-header">
        <div className="marcas-header-content">
          <div className="marcas-header-left">
            <h1>Gerenciador de Marcas</h1>
            <span className="user-info">Olá, {user?.get('username')}</span>
          </div>
          <div className="header-actions">
            <button className="btn-logout" onClick={handleLogout}>
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="marcas-content">
        {erro && <div className="erro-message">{erro}</div>}

        <div className="marcas-actions">
          <h2>Suas Marcas</h2>
          <button onClick={novaMarca} className="btn-nova-marca">
            ➕ Nova Marca
          </button>
        </div>

        {marcas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏪</div>
            <h3>Nenhuma marca encontrada</h3>
            <p>Crie sua primeira marca para começar a gerenciar suas lojas</p>
            <button onClick={novaMarca} className="btn-nova-marca">
              ➕ Criar primeira marca
            </button>
          </div>
        ) : (
          <div className="marcas-grid">
            {marcas.map((marca) => (
              <div 
                key={marca.id} 
                className={`marca-card ${marca.get('ativa') ? '' : 'inativa'}`}
              >
                <div className="marca-card-header">
                  <div className="marca-status">
                    <span className={`status-badge ${marca.get('ativa') ? 'status-ativo' : 'status-inativo'}`}>
                      {marca.get('ativa') ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>

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

                  <h3 className="marca-nome">{marca.get('nome')}</h3>
                  <span className="marca-slug">/{marca.get('slug')}</span>
                </div>

                <div className="marca-card-body">
                  <p className="marca-descricao">
                    {marca.get('descricao') || 'Sem descrição disponível'}
                  </p>

                  <div className="marca-valores">
                    <div className="valor-item">
                      <div className="valor-label">Valor PR</div>
                      <div className="valor-price">
                        {formatarPreco(marca.get('valor_padrao_pr'))}
                      </div>
                    </div>
                    <div className="valor-item">
                      <div className="valor-label">Valor SP</div>
                      <div className="valor-price">
                        {formatarPreco(marca.get('valor_padrao_sp'))}
                      </div>
                    </div>
                  </div>

                  <div className="marca-card-actions">
                    <button 
                      onClick={() => visualizarMarca(marca.id)}
                      className="btn-icon btn-visualizar"
                      title="Ver lojas"
                    >
                      👁️
                    </button>
                    <button 
                      onClick={() => editarMarca(marca.id)}
                      className="btn-icon btn-editar"
                      title="Editar marca"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => alternarStatus(marca)}
                      className="btn-icon btn-status"
                      title={marca.get('ativa') ? 'Desativar' : 'Ativar'}
                    >
                      {marca.get('ativa') ? '🔴' : '🟢'}
                    </button>
                    <button 
                      onClick={() => abrirModalExcluir(marca)}
                      className="btn-icon btn-excluir"
                      title="Excluir marca"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
                Tem certeza que deseja excluir a marca <strong>{modalExcluir.marca?.get('nome')}</strong>?
              </p>
              <p>Esta ação não pode ser desfeita e só será possível se não houver lojas vinculadas a esta marca.</p>
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

export default MarcasPage;