import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import importacaoService from '../services/importacaoService';
import marcasService from '../services/marcasService';
import authService from '../services/authService';
import './ImportacaoLojasPage.css';

const ImportacaoLojasPage = () => {
  const { marcaId } = useParams();
  const navigate = useNavigate();
  const [marca, setMarca] = useState(null);
  const [file, setFile] = useState(null);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState('');
  const [resultado, setResultado] = useState(null);
  const [validacaoErros, setValidacaoErros] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verificarAutenticacao = () => {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        navigate('/');
        return false;
      }
      return true;
    };

    const carregarMarca = async () => {
      if (!verificarAutenticacao()) return;

      setLoading(true);
      try {
        const marcaData = await marcasService.getMarcaById(marcaId);
        setMarca(marcaData);
      } catch (error) {
        console.error('Erro ao carregar marca:', error);
        if (error.code === 101) {
          setErro('Marca não encontrada.');
          navigate('/marcas');
        } else {
          setErro('Erro ao carregar os dados da marca.');
        }
      } finally {
        setLoading(false);
      }
    };

    carregarMarca();
  }, [marcaId, navigate]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    // Verificar se é um arquivo CSV
    if (selectedFile && selectedFile.type !== 'text/csv') {
      setErro('Por favor, selecione um arquivo CSV válido.');
      setFile(null);
      return;
    }
    
    setFile(selectedFile);
    setErro('');
    setResultado(null);
    setValidacaoErros(null);
  };

  const handleImportacao = async () => {
    if (!file) {
      setErro('Por favor, selecione um arquivo CSV para importação.');
      return;
    }

    setProcessando(true);
    setErro('');
    setResultado(null);
    setValidacaoErros(null);

    try {
      const resultado = await importacaoService.importarCSVParaMarca(file, marcaId);
      
      if (!resultado.sucesso) {
        setErro(resultado.mensagem);
        if (resultado.validacao && resultado.validacao.erros) {
          setValidacaoErros(resultado.validacao.erros);
        }
      } else {
        setResultado(resultado.resultados);
      }
    } catch (error) {
      console.error('Erro na importação:', error);
      setErro(`Erro ao processar a importação: ${error.message}`);
    } finally {
      setProcessando(false);
    }
  };

  const baixarPlanilhaModelo = () => {
    const blob = importacaoService.gerarPlanilhaModelo();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `modelo_importacao_lojas_${marca?.get('slug') || 'marca'}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const voltar = () => {
    navigate(`/marca/${marcaId}/lojas`);
  };

  const adicionarNovaLoja = () => {
    navigate(`/marca/${marcaId}/nova-loja`);
  };

  if (loading) {
    return <div className="loading">Carregando dados da marca...</div>;
  }

  if (!marca) {
    return <div className="loading">Marca não encontrada.</div>;
  }

  return (
    <div className="importacao-container">
      <header className="importacao-header">
        <h1>Importação de Lojas - {marca.get('nome')}</h1>
        <button className="btn-voltar" onClick={voltar}>Voltar</button>
      </header>

      <div className="importacao-content">
        {erro && <div className="erro-message">{erro}</div>}
        
        <div className="importacao-card">
          <div className="importacao-titulo">
            <h2>Importação Massiva de Lojas</h2>
            <p>
              Importe múltiplas lojas de uma vez para a marca <strong>{marca.get('nome')}</strong> através de um arquivo CSV.
              Faça o download do modelo e preencha com seus dados.
            </p>
          </div>
          
          <div className="importacao-acoes">
            <button 
              onClick={baixarPlanilhaModelo} 
              className="btn-download-modelo"
            >
              📥 Baixar Planilha Modelo
            </button>
            
            <div className="ou-separador">ou</div>
            
            <button 
              onClick={adicionarNovaLoja} 
              className="btn-nova-loja"
            >
              ➕ Adicionar Loja Individual
            </button>
          </div>
          
          <div className="importacao-upload">
            <div className="upload-area">
              <input 
                type="file" 
                id="csv-file" 
                accept=".csv" 
                onChange={handleFileChange}
                className="csv-file-input"
              />
              <label htmlFor="csv-file" className="csv-file-label">
                {file ? file.name : 'Selecionar arquivo CSV'}
              </label>
              {file && (
                <span className="arquivo-selecionado">
                  Arquivo selecionado: <strong>{file.name}</strong>
                </span>
              )}
            </div>
            
            <button 
              onClick={handleImportacao} 
              className="btn-importar" 
              disabled={!file || processando}
            >
              {processando ? 'Processando...' : 'Iniciar Importação'}
            </button>
          </div>
          
          {validacaoErros && validacaoErros.length > 0 && (
            <div className="validacao-erros">
              <h3>Erros de validação encontrados:</h3>
              <div className="erros-lista">
                {validacaoErros.map((erro, index) => (
                  <div key={index} className="erro-item">
                    <strong>Linha {erro.linha}:</strong> {erro.slug}
                    <ul>
                      {erro.erros.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <p className="erros-ajuda">
                Corrija os erros no arquivo CSV e tente novamente.
              </p>
            </div>
          )}
          
          {resultado && (
            <div className="importacao-resultado">
              <h3>Resultado da Importação</h3>
              <div className="resultado-stats">
                <div className="resultado-stat sucesso">
                  <span className="stat-numero">{resultado.sucesso}</span>
                  <span className="stat-label">Lojas importadas com sucesso</span>
                </div>
                <div className="resultado-stat falha">
                  <span className="stat-numero">{resultado.falhas}</span>
                  <span className="stat-label">Falhas durante a importação</span>
                </div>
              </div>
              
              {resultado.erros && resultado.erros.length > 0 && (
                <div className="resultado-erros">
                  <h4>Detalhes das falhas:</h4>
                  <ul>
                    {resultado.erros.map((erro, index) => (
                      <li key={index}>
                        <strong>{erro.slug}:</strong> {erro.erro}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="resultado-acoes">
                <button 
                  onClick={voltar} 
                  className="btn-voltar-dashboard"
                >
                  Voltar às Lojas
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportacaoLojasPage;