import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import authService from '../services/authService';
import marcasService from '../services/marcasService';
import lojasService from '../services/lojasService';
import './PrecosMarcaPage.css';

const PrecosMarcaPage = () => {
  const { marcaId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [marca, setMarca] = useState(null);
  const [lojas, setLojas] = useState([]);
  const [lojaSelecionadas, setLojasSelecionadas] = useState([]);
  
  const [valores, setValores] = useState({
    valor_pr: '',
    valor_sp: '',
    aplicar_todas_lojas: false
  });

  const [valoresIndividuais, setValoresIndividuais] = useState({
    valor_pr: '',
    valor_sp: ''
  });

  useEffect(() => {
    const verificarAutenticacao = () => {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        navigate('/');
        return false;
      }
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

        // Carregar valores atuais da marca
        setValores({
          valor_pr: marcaData.get('valor_padrao_pr') || '',
          valor_sp: marcaData.get('valor_padrao_sp') || '',
          aplicar_todas_lojas: false
        });

        // Carregar lojas da marca
        const lojasData = await lojasService.getLojasPorMarca(marcaId);
        setLojas(lojasData);

      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        if (error.code === 101) {
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

  const voltar = () => {
    navigate(`/marca/${marcaId}/lojas`);
  };

  const handleValorChange = (campo, valor) => {
    setValores({
      ...valores,
      [campo]: valor
    });
  };

  const handleIndividualChange = (campo, valor) => {
    setValoresIndividuais({
      ...valoresIndividuais,
      [campo]: valor
    });
  };

  const handleLojaSelection = (lojaId) => {
    setLojasSelecionadas(prev => {
      if (prev.includes(lojaId)) {
        return prev.filter(id => id !== lojaId);
      } else {
        return [...prev, lojaId];
      }
    });
  };

  const selecionarTodasLojas = () => {
    if (lojaSelecionadas.length === lojas.length) {
      setLojasSelecionadas([]);
    } else {
      setLojasSelecionadas(lojas.map(loja => loja.id));
    }
  };

  const validarValoresPadrao = () => {
    if (!valores.valor_pr || !valores.valor_sp) {
      setErro('Preencha os valores para PR e SP.');
      return false;
    }

    if (isNaN(valores.valor_pr) || Number(valores.valor_pr) < 0) {
      setErro('O valor para PR deve ser um número válido e positivo.');
      return false;
    }

    if (isNaN(valores.valor_sp) || Number(valores.valor_sp) < 0) {
      setErro('O valor para SP deve ser um número válido e positivo.');
      return false;
    }

    return true;
  };

  const atualizarValoresPadrao = async () => {
    if (!validarValoresPadrao()) return;

    setSalvando(true);
    setErro('');
    setSucesso('');

    try {
      const resultado = await marcasService.atualizarValoresPadrao(
        marcaId,
        Number(valores.valor_pr),
        Number(valores.valor_sp),
        valores.aplicar_todas_lojas
      );

      if (valores.aplicar_todas_lojas) {
        setSucesso(`Valores padrão atualizados e aplicados em ${resultado.lojasAtualizadas} loja(s)!`);
        // Recarregar lojas para mostrar novos preços
        const lojasAtualizadas = await lojasService.getLojasPorMarca(marcaId);
        setLojas(lojasAtualizadas);
      } else {
        setSucesso('Valores padrão da marca atualizados com sucesso!');
      }

      // Atualizar dados da marca
      const marcaAtualizada = await marcasService.getMarcaById(marcaId);
      setMarca(marcaAtualizada);

    } catch (error) {
      console.error('Erro ao atualizar valores padrão:', error);
      setErro('Erro ao atualizar os valores padrão. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const validarValoresIndividuais = () => {
    if (lojaSelecionadas.length === 0) {
      setErro('Selecione ao menos uma loja para aplicar os valores.');
      return false;
    }

    if (!valoresIndividuais.valor_pr && !valoresIndividuais.valor_sp) {
      setErro('Preencha ao menos um dos valores (PR ou SP).');
      return false;
    }

    if (valoresIndividuais.valor_pr && (isNaN(valoresIndividuais.valor_pr) || Number(valoresIndividuais.valor_pr) < 0)) {
      setErro('O valor para PR deve ser um número válido e positivo.');
      return false;
    }

    if (valoresIndividuais.valor_sp && (isNaN(valoresIndividuais.valor_sp) || Number(valoresIndividuais.valor_sp) < 0)) {
      setErro('O valor para SP deve ser um número válido e positivo.');
      return false;
    }

    return true;
  };

  const aplicarValoresIndividuais = async () => {
    if (!validarValoresIndividuais()) return;

    setSalvando(true);
    setErro('');
    setSucesso('');

    try {
      const lojasAtualizadas = await lojasService.atualizarPrecosLojas(
        marcaId,
        lojaSelecionadas,
        valoresIndividuais.valor_pr ? Number(valoresIndividuais.valor_pr) : 0,
        valoresIndividuais.valor_sp ? Number(valoresIndividuais.valor_sp) : 0
      );

      setSucesso(`Valores aplicados em ${lojasAtualizadas} loja(s) selecionada(s)!`);

      // Recarregar lojas para mostrar novos preços
      const lojasAtualizadasData = await lojasService.getLojasPorMarca(marcaId);
      setLojas(lojasAtualizadasData);

      // Limpar seleções
      setLojasSelecionadas([]);
      setValoresIndividuais({ valor_pr: '', valor_sp: '' });

    } catch (error) {
      console.error('Erro ao aplicar valores individuais:', error);
      setErro('Erro ao aplicar os valores nas lojas selecionadas. Tente novamente.');
    } finally {
      setSalvando(false);
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
      <div className="precos-marca-container">
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
      <div className="precos-marca-container">
        <div className="loading-container">
          <div className="loading-content">
            <p>Marca não encontrada.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="precos-marca-container">
      <header className="precos-marca-header">
        <div className="precos-marca-header-content">
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
                <h1>Gerenciar Preços</h1>
                <span className="marca-subtitle">{marca.get('nome')}</span>
              </div>
            </div>
          </div>
          
          <button className="btn-voltar" onClick={voltar}>
            ← Voltar
          </button>
        </div>
      </header>

      <div className="precos-marca-content">
        {erro && <div className="erro-message">{erro}</div>}
        {sucesso && <div className="sucesso-message">{sucesso}</div>}

        {/* Instruções */}
        <div className="precos-instrucoes">
          <div className="instrucoes-header">
            <span className="instrucoes-icon">💰</span>
            <h2 className="instrucoes-title">Gestão de Preços</h2>
          </div>
          <p className="instrucoes-text">
            Configure os valores padrão da marca ou aplique preços específicos em lojas individuais. 
            Os valores padrão serão aplicados automaticamente em novas lojas criadas nesta marca.
          </p>
        </div>

        {/* Valores Padrão da Marca */}
        <div className="precos-section">
          <div className="section-header">
            <h2 className="section-title">Valores Padrão da Marca</h2>
            <p className="section-description">
              Configure os valores padrão que serão aplicados automaticamente em novas lojas desta marca
            </p>
          </div>

          <div className="section-content">
            <div className="valores-padrão-grid">
              {/* Valor PR */}
              <div className="valor-card">
                <div className="valor-card-header">
                  <span className="estado-icon">🌟</span>
                  <h3 className="valor-card-title">Paraná (PR)</h3>
                </div>
                <div className="valor-input-container">
                  <span className="currency-prefix">R$</span>
                  <input
                    type="number"
                    value={valores.valor_pr}
                    onChange={(e) => handleValorChange('valor_pr', e.target.value)}
                    className="valor-input"
                    placeholder="0"
                    min="0"
                    step="1"
                  />
                </div>
              </div>

              {/* Valor SP */}
              <div className="valor-card">
                <div className="valor-card-header">
                  <span className="estado-icon">🏙️</span>
                  <h3 className="valor-card-title">São Paulo (SP)</h3>
                </div>
                <div className="valor-input-container">
                  <span className="currency-prefix">R$</span>
                  <input
                    type="number"
                    value={valores.valor_sp}
                    onChange={(e) => handleValorChange('valor_sp', e.target.value)}
                    className="valor-input"
                    placeholder="0"
                    min="0"
                    step="1"
                  />
                </div>
              </div>
            </div>

            {/* Opção de aplicar em todas as lojas */}
            <div className="aplicar-opcoes">
              <div className="checkbox-container">
                <input
                  type="checkbox"
                  id="aplicar_todas"
                  checked={valores.aplicar_todas_lojas}
                  onChange={(e) => handleValorChange('aplicar_todas_lojas', e.target.checked)}
                  className="checkbox-input"
                />
                <label htmlFor="aplicar_todas" className="checkbox-label">
                  Aplicar estes valores em todas as lojas existentes desta marca
                </label>
              </div>
              <p className="checkbox-description">
                Se marcado, todos os preços das lojas existentes serão atualizados com estes novos valores padrão.
              </p>

              <button 
                onClick={atualizarValoresPadrao}
                className="btn-atualizar-valores"
                disabled={salvando}
              >
                {salvando ? 'Atualizando...' : 'Atualizar Valores Padrão'}
              </button>
            </div>
          </div>
        </div>

        {/* Aplicação Individual */}
        {lojas.length > 0 && (
          <div className="precos-section">
            <div className="section-header">
              <h2 className="section-title">Aplicar Preços Individualmente</h2>
              <p className="section-description">
                Selecione lojas específicas e defina valores customizados para cada estado
              </p>
            </div>

            <div className="section-content">
              {/* Lista de lojas */}
              <div className="lojas-individuais-grid">
                {lojas.map((loja) => (
                  <div 
                    key={loja.id} 
                    className={`loja-card ${lojaSelecionadas.includes(loja.id) ? 'selecionada' : ''}`}
                  >
                    <div className="loja-card-header">
                      <div className="loja-info">
                        <h4>{loja.get('cidade')}</h4>
                        <span className="loja-estado">{loja.get('estado')}</span>
                        <div className="loja-slug">/{loja.get('slug')}</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={lojaSelecionadas.includes(loja.id)}
                        onChange={() => handleLojaSelection(loja.id)}
                        className="checkbox-loja"
                      />
                    </div>
                    <div className="preco-atual">
                      {formatarPreco(loja.get('preco_inicial'))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Controles de aplicação */}
              <div className="aplicar-individuais">
                <div className="aplicar-header">
                  <h3 className="aplicar-title">Aplicar Novos Valores</h3>
                  <p className="aplicar-subtitle">
                    {lojaSelecionadas.length} loja(s) selecionada(s)
                    {lojaSelecionadas.length > 0 && (
                      <span> • </span>
                    )}
                    <button 
                      onClick={selecionarTodasLojas}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: '#3b82f6', 
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        fontSize: 'inherit'
                      }}
                    >
                      {lojaSelecionadas.length === lojas.length ? 'Desmarcar todas' : 'Selecionar todas'}
                    </button>
                  </p>
                </div>

                <div className="valores-aplicar-grid">
                  <div className="valor-aplicar-card">
                    <h4 className="valor-aplicar-title">🌟 Valor para PR</h4>
                    <div className="valor-input-container">
                      <span className="currency-prefix">R$</span>
                      <input
                        type="number"
                        value={valoresIndividuais.valor_pr}
                        onChange={(e) => handleIndividualChange('valor_pr', e.target.value)}
                        className="valor-input"
                        placeholder="Deixe vazio para não alterar"
                        min="0"
                        step="1"
                      />
                    </div>
                  </div>

                  <div className="valor-aplicar-card">
                    <h4 className="valor-aplicar-title">🏙️ Valor para SP</h4>
                    <div className="valor-input-container">
                      <span className="currency-prefix">R$</span>
                      <input
                        type="number"
                        value={valoresIndividuais.valor_sp}
                        onChange={(e) => handleIndividualChange('valor_sp', e.target.value)}
                        className="valor-input"
                        placeholder="Deixe vazio para não alterar"
                        min="0"
                        step="1"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={aplicarValoresIndividuais}
                  className="btn-aplicar-individuais"
                  disabled={salvando || lojaSelecionadas.length === 0}
                >
                  {salvando ? 'Aplicando...' : `Aplicar em ${lojaSelecionadas.length} loja(s)`}
                </button>
              </div>
            </div>
          </div>
        )}

        {lojas.length === 0 && (
          <div className="precos-section">
            <div className="section-content">
              <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#6b7280' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.5 }}>🏪</div>
                <h3>Nenhuma loja encontrada</h3>
                <p>Crie lojas para esta marca antes de gerenciar preços individuais.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrecosMarcaPage;