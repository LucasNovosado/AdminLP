import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import marcasService from '../services/marcasService';
import authService from '../services/authService';
import './FormularioMarcaPage.css';

const FormularioMarcaPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    slug: '',
    descricao: '',
    valor_padrao_pr: '',
    valor_padrao_sp: '',
    meta_title: '',
    meta_description: '',
    ativa: true,
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

    const carregarMarca = async () => {
      if (!verificarAutenticacao()) return;
      if (!id) return; // Caso seja uma nova marca

      setCarregando(true);
      setErro('');

      try {
        const marca = await marcasService.getMarcaById(id);

        if (marca) {
          setFormData({
            nome: marca.get('nome') || '',
            slug: marca.get('slug') || '',
            descricao: marca.get('descricao') || '',
            valor_padrao_pr: marca.get('valor_padrao_pr') || '',
            valor_padrao_sp: marca.get('valor_padrao_sp') || '',
            meta_title: marca.get('meta_title') || '',
            meta_description: marca.get('meta_description') || '',
            ativa: marca.get('ativa') !== undefined ? marca.get('ativa') : true,
          });

          // Carregar preview do logo
          const logo = marca.get('logo');
          if (logo) {
            setLogoPreview(logo.url());
          }
        }
      } catch (error) {
        console.error('Erro ao carregar marca:', error);
        setErro('Erro ao carregar os dados da marca. Tente novamente.');
      } finally {
        setCarregando(false);
      }
    };

    carregarMarca();
  }, [id, navigate]);

  const gerarSlug = (nome) => {
    return nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-') // Remove hífens duplos
      .replace(/^-|-$/g, ''); // Remove hífens do início e fim
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'nome') {
      // Auto-gerar slug baseado no nome (apenas para novas marcas)
      setFormData({
        ...formData,
        [name]: value,
        ...(id ? {} : { slug: gerarSlug(value) }) // Só gera slug se for nova marca
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value,
      });
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        setErro('Por favor, selecione apenas arquivos de imagem.');
        return;
      }

      // Validar tamanho (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErro('A imagem deve ter no máximo 5MB.');
        return;
      }

      setLogoFile(file);
      const preview = URL.createObjectURL(file);
      setLogoPreview(preview);
      setErro('');
    }
  };

  const validarFormulario = async () => {
    if (!formData.nome || !formData.slug) {
      setErro('Preencha os campos obrigatórios: Nome e Slug.');
      return false;
    }

    // Validar formato do slug
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(formData.slug)) {
      setErro('O slug deve conter apenas letras minúsculas, números e hífen.');
      return false;
    }

    // Verificar se o slug já existe (excluindo a marca atual se for edição)
    try {
      const slugExiste = await marcasService.verificarSlugExistente(formData.slug, id);
      if (slugExiste) {
        setErro('Este slug já está em uso. Escolha outro.');
        return false;
      }
    } catch (error) {
      console.error('Erro ao verificar slug:', error);
      setErro('Erro ao validar o slug. Tente novamente.');
      return false;
    }

    // Validar valores (devem ser números positivos)
    if (formData.valor_padrao_pr && (isNaN(formData.valor_padrao_pr) || Number(formData.valor_padrao_pr) < 0)) {
      setErro('O valor padrão PR deve ser um número válido.');
      return false;
    }

    if (formData.valor_padrao_sp && (isNaN(formData.valor_padrao_sp) || Number(formData.valor_padrao_sp) < 0)) {
      setErro('O valor padrão SP deve ser um número válido.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!(await validarFormulario())) {
      return;
    }

    setSalvando(true);
    setErro('');

    try {
      const marcaData = {
        ...formData,
        logoFile
      };

      await marcasService.salvarMarca(marcaData, id);
      navigate('/marcas');
    } catch (error) {
      console.error('Erro ao salvar marca:', error);
      setErro('Erro ao salvar os dados da marca. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const voltar = () => {
    navigate('/marcas');
  };

  if (carregando) {
    return (
      <div className="formulario-marca-container">
        <div className="loading-container">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p>Carregando dados da marca...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="formulario-marca-container">
      <header className="formulario-marca-header">
        <div className="formulario-marca-header-content">
          <h1>{id ? 'Editar Marca' : 'Nova Marca'}</h1>
          <button className="btn-voltar" onClick={voltar}>
            ← Voltar
          </button>
        </div>
      </header>

      <div className="formulario-marca-content">
        {erro && <div className="erro-message">{erro}</div>}

        <form onSubmit={handleSubmit} className="formulario-marca-card">
          {/* Informações Básicas */}
          <div className="form-section">
            <div className="form-section-header">
              <h2>Informações Básicas</h2>
              <p className="form-section-description">
                Configure as informações principais da marca
              </p>
            </div>
            
            <div className="form-row">
              <div className="form-group required">
                <label htmlFor="nome">Nome da Marca</label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Ex: Rede Única de Baterias"
                  required
                />
                <small>Este será o nome principal exibido da marca</small>
              </div>

              <div className="form-group required">
                <label htmlFor="slug">Slug (Identificador)</label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Ex: rede-unica-baterias"
                  disabled={id ? true : false} // Não permitir editar slug em edição
                  required
                />
                <small>
                  Identificador único usado nas URLs. Apenas letras minúsculas, números e hífen.
                  {formData.slug && (
                    <div className="slug-preview">
                      URL: <strong>suaempresa.com.br/{formData.slug}/cidade</strong>
                    </div>
                  )}
                </small>
              </div>
            </div>

            <div className="form-row single">
              <div className="form-group">
                <label htmlFor="descricao">Descrição</label>
                <textarea
                  id="descricao"
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleInputChange}
                  className="form-input form-textarea"
                  placeholder="Descrição da marca (opcional)"
                />
                <small>Breve descrição sobre a marca e seus produtos/serviços</small>
              </div>
            </div>

            <div className="checkbox-container">
              <input
                type="checkbox"
                id="ativa"
                name="ativa"
                checked={formData.ativa}
                onChange={handleInputChange}
                className="checkbox-input"
              />
              <label htmlFor="ativa" className="checkbox-label">
                Marca ativa
              </label>
            </div>
          </div>

          {/* Logo da Marca */}
          <div className="form-section">
            <div className="form-section-header">
              <h2>Logo da Marca</h2>
              <p className="form-section-description">
                Faça upload do logo da marca (formatos: JPG, PNG, GIF - máx: 5MB)
              </p>
            </div>

            <div className={`logo-upload-section ${logoFile ? 'has-file' : ''}`}>
              <input
                type="file"
                id="logo"
                name="logo"
                onChange={handleLogoChange}
                accept="image/*"
                className="logo-file-input"
              />
              <label htmlFor="logo" className="logo-file-label">
                📁 {logoFile ? 'Alterar Logo' : 'Selecionar Logo'}
              </label>
              
              {logoPreview && (
                <div className="logo-preview">
                  <img src={logoPreview} alt="Preview do logo" />
                </div>
              )}
            </div>
          </div>

          {/* Valores Padrão */}
          <div className="form-section">
            <div className="form-section-header">
              <h2>Valores Padrão por Estado</h2>
              <p className="form-section-description">
                Configure os valores padrão que serão aplicados às novas lojas desta marca
              </p>
            </div>

            <div className="valores-grid">
              <div className="valor-card">
                <h3>🌟 Paraná (PR)</h3>
                <div className="currency-input-container">
                  <span className="currency-prefix">R$</span>
                  <input
                    type="number"
                    id="valor_padrao_pr"
                    name="valor_padrao_pr"
                    value={formData.valor_padrao_pr}
                    onChange={handleInputChange}
                    className="currency-input"
                    placeholder="0"
                    min="0"
                    step="1"
                  />
                </div>
              </div>

              <div className="valor-card">
                <h3>🏙️ São Paulo (SP)</h3>
                <div className="currency-input-container">
                  <span className="currency-prefix">R$</span>
                  <input
                    type="number"
                    id="valor_padrao_sp"
                    name="valor_padrao_sp"
                    value={formData.valor_padrao_sp}
                    onChange={handleInputChange}
                    className="currency-input"
                    placeholder="0"
                    min="0"
                    step="1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SEO */}
          <div className="form-section">
            <div className="form-section-header">
              <h2>Configurações de SEO</h2>
              <p className="form-section-description">
                Otimize a marca para motores de busca (opcional)
              </p>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="meta_title">Título SEO</label>
                <input
                  type="text"
                  id="meta_title"
                  name="meta_title"
                  value={formData.meta_title}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Ex: Baterias Automotivas | Rede Única"
                  maxLength="60"
                />
                <small>Título que aparece nos resultados de busca (máx: 60 caracteres)</small>
              </div>
            </div>

            <div className="form-row single">
              <div className="form-group">
                <label htmlFor="meta_description">Descrição SEO</label>
                <textarea
                  id="meta_description"
                  name="meta_description"
                  value={formData.meta_description}
                  onChange={handleInputChange}
                  className="form-input form-textarea"
                  placeholder="Descrição que aparece nos resultados de busca"
                  maxLength="160"
                  rows="3"
                />
                <small>Descrição que aparece nos resultados de busca (máx: 160 caracteres)</small>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="form-actions">
            <button type="button" className="btn-cancelar" onClick={voltar}>
              Cancelar
            </button>
            <button type="submit" className="btn-salvar" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar Marca'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormularioMarcaPage;