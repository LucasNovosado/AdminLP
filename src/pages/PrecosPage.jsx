// src/pages/PrecosPage.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Parse } from '../services/parseService';
import authService from '../services/authService';
import './PrecosPage.css';

const PrecosPage = () => {
  const navigate = useNavigate();
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [precos, setPrecos] = useState({
    PR: { bateria_40ah: '' },
    SP: { bateria_40ah: '' }
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

    const carregarPrecos = async () => {
      if (!verificarAutenticacao()) return;

      setCarregando(true);
      setErro('');

      try {
        const Preco = Parse.Object.extend("Precos");
        const query = new Parse.Query(Preco);
        const resultados = await query.find();

        const precosCarregados = {
          PR: { bateria_40ah: '' },
          SP: { bateria_40ah: '' }
        };

        // Processar os resultados
        resultados.forEach(preco => {
          const estado = preco.get('estado');
          if (estado && (estado === 'PR' || estado === 'SP')) {
            precosCarregados[estado] = {
              bateria_40ah: preco.get('bateria_40ah') || '',
              objectId: preco.id
            };
          }
        });

        setPrecos(precosCarregados);
      } catch (error) {
        console.error('Erro ao carregar preços:', error);
        setErro('Erro ao carregar os preços. Tente novamente.');
      } finally {
        setCarregando(false);
      }
    };

    carregarPrecos();
  }, [navigate]);

  const handleInputChange = (estado, campo, valor) => {
    setPrecos({
      ...precos,
      [estado]: {
        ...precos[estado],
        [campo]: valor
      }
    });
  };

  const salvarPreco = async (estado) => {
    setSalvando(true);
    setErro('');

    try {
      const Preco = Parse.Object.extend("Precos");
      let precoObject;

      // Verificar se já existe um registro para o estado
      if (precos[estado].objectId) {
        const query = new Parse.Query(Preco);
        precoObject = await query.get(precos[estado].objectId);
      } else {
        precoObject = new Preco();
        precoObject.set('estado', estado);
      }

      // Definir os valores
      precoObject.set('bateria_40ah', Number(precos[estado].bateria_40ah) || 0);

      // Salvar
      await precoObject.save();

      // Atualizar o objectId se for um novo registro
      if (!precos[estado].objectId) {
        setPrecos({
          ...precos,
          [estado]: {
            ...precos[estado],
            objectId: precoObject.id
          }
        });
      }

      alert(`Preços para ${estado} salvos com sucesso!`);
    } catch (error) {
      console.error(`Erro ao salvar preços para ${estado}:`, error);
      setErro(`Erro ao salvar os preços para ${estado}. Tente novamente.`);
    } finally {
      setSalvando(false);
    }
  };

  const voltar = () => {
    navigate('/dashboard');
  };

  if (carregando) {
    return <div className="loading">Carregando preços...</div>;
  }

  return (
    <div className="precos-container">
      <header className="precos-header">
        <h1>Gerenciar Preços por Estado</h1>
        <button className="btn-voltar" onClick={voltar}>Voltar</button>
      </header>

      <div className="precos-content">
        {erro && <div className="erro-message">{erro}</div>}

        <div className="precos-instrucoes">
          <p>
            Configure os preços para cada estado. Estes preços serão usados como base para todas as lojas
            no respectivo estado. Para personalizações específicas, edite cada loja individualmente.
          </p>
        </div>

        <div className="precos-cards">
          {/* Paraná */}
          <div className="preco-card">
            <div className="preco-card-header">
              <h2>Paraná - PR</h2>
            </div>
            <div className="preco-card-body">
              <div className="preco-form-group">
                <label htmlFor="pr-bateria-40ah">Bateria 40Ah</label>
                <div className="preco-input-container">
                  <span className="preco-prefix">R$</span>
                  <input
                    type="number"
                    id="pr-bateria-40ah"
                    value={precos.PR.bateria_40ah}
                    onChange={(e) => handleInputChange('PR', 'bateria_40ah', e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
            <div className="preco-card-footer">
              <button 
                className="btn-salvar-precos" 
                onClick={() => salvarPreco('PR')}
                disabled={salvando}
              >
                {salvando ? 'Salvando...' : 'Salvar Preços PR'}
              </button>
            </div>
          </div>

          {/* São Paulo */}
          <div className="preco-card">
            <div className="preco-card-header">
              <h2>São Paulo - SP</h2>
            </div>
            <div className="preco-card-body">
              <div className="preco-form-group">
                <label htmlFor="sp-bateria-40ah">Bateria 40Ah</label>
                <div className="preco-input-container">
                  <span className="preco-prefix">R$</span>
                  <input
                    type="number"
                    id="sp-bateria-40ah"
                    value={precos.SP.bateria_40ah}
                    onChange={(e) => handleInputChange('SP', 'bateria_40ah', e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
            <div className="preco-card-footer">
              <button 
                className="btn-salvar-precos" 
                onClick={() => salvarPreco('SP')}
                disabled={salvando}
              >
                {salvando ? 'Salvando...' : 'Salvar Preços SP'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrecosPage;