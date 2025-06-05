import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import lojasService from '../services/lojasService';
import marcasService from '../services/marcasService';
import authService from '../services/authService';
import './FormularioLojaPage.css';

const FormularioLojaPage = () => {
  const { marcaId, id } = useParams();
  const navigate = useNavigate();
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [marca, setMarca] = useState(null);
  const [imagemProdutoPreview, setImagemProdutoPreview] = useState(null);
  const [imagemLojaPreview, setImagemLojaPreview] = useState(null);
  const [formData, setFormData] = useState({
    slug: '',
    cidade: '',
    estado: 'PR',
    telefone: '',
    preco_inicial: '',
    link_whatsapp: '',
    link_maps: '',
    popup_tipo: 'whatsapp',
    meta_title: '',
    meta_description: '',
    ativa: true,
  });
  const [imagemProdutoFile, setImagemProdutoFile] = useState(null);
  const [imagemLojaFile, setImagemLojaFile] = useState(null);

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

      setCarregando(true);
      setErro('');

      try {
        // Carregar dados da marca
        const marcaData = await marcasService.getMarcaById(marcaId);
        setMarca(marcaData);

        // Se for edição, carregar dados da loja
        if (id) {
          const loja = await lojasService.getLojaById(id);

          if (loja) {
            // Verificar se a loja pertence à marca correta
            if (loja.get('marca_id') !== marcaId) {
              setErro('Loja não encontrada nesta marca.');
              navigate(`/marca/${marcaId}/lojas`);
              return;
            }

            setFormData({
              slug: loja.get('slug') || '',
              cidade: loja.get('cidade') || '',
              estado: loja.get('estado') || 'PR',
              telefone: loja.get('telefone') || '',
              preco_inicial: loja.get('preco_inicial') || '',
              link_whatsapp: loja.get('link_whatsapp') || '',
              link_maps: loja.get('link_maps') || '',
              popup_tipo: loja.get('popup_tipo') || 'whatsapp',
              meta_title: loja.get('meta_title') || '',
              meta_description: loja.get('meta_description') || '',
              ativa: loja.get('ativa') !== undefined ? loja.get('ativa') : true,
            });

            // Carregar previews das imagens
            const imagemProduto = loja.get('imagem_produto');
            if (imagemProduto) {
              setImagemProdutoPreview(imagemProduto.url());
            }

            const imagemLoja = loja.get('imagem_loja');
            if (imagemLoja) {
              setImagemLojaPreview(imagemLoja.url());
            }
          }
        } else {
          // Se for nova loja, pré-preencher com valores padrão da marca
          const valorPadrao = marcaData.get('estado') === 'SP' 
            ? marcaData.get('valor_padrao_sp') 
            : marcaData.get('valor_padrao_pr');

          setFormData(prev => ({
            ...prev,
            preco_inicial: valorPadrao || ''
          }));
        }

      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        if (error.code === 101) {
          setErro('Marca ou loja não encontrada.');
          navigate('/marcas');
        } else {
          setErro('Erro ao carregar os dados. Tente novamente.');
        }
      } finally {
        setCarregando(false);
      }
    };

    carregarDados();
  }, [marcaId, id, navigate]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'estado' && !id) {
      // Se mudou o estado e é nova loja, atualizar preço inicial com valor padrão da marca
      const valorPadrao = value === 'SP' 
        ? marca?.get('valor_padrao_sp') 
        : marca?.get('valor_padrao_pr');
      
      setFormData({
        ...formData,
        [name]: value,
        preco_inicial: valorPadrao || formData.preco_inicial
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value,
      });
    }
  };

  const handleImagemProdutoChange = (e) => {
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

      setImagemProdutoFile(file);
      const preview = URL.createObjectURL(file);
      setImagemProdutoPreview(preview);
      setErro('');
    }
  };

  const handleImagemLojaChange = (e) => {
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

      setImagemLojaFile(file);
      const preview = URL.createObjectURL(file);
      setImagemLojaPreview(preview);
      setErro('');
    }
  };

  const validarFormulario = async () => {
    if (!formData.slug || !formData.cidade || !formData.telefone || !formData.preco_inicial) {
      setErro('Preencha os campos obrigatórios: Slug, Cidade, Telefone e Preço.');
      return false;
    }

    // Validar formato do slug (apenas letras minúsculas, números e hífen)
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(formData.slug)) {
      setErro('O slug deve conter apenas letras minúsculas, números e hífen.');
      return false;
    }

    // Validar formato do telefone
    const telefoneRegex = /^\(\d{2}\) \d{4,5}-\d{4}$/;
    if (!telefoneRegex.test(formData.telefone)) {
      setErro('Formato de telefone inválido. Use (XX) XXXXX-XXXX');
      return false;
    }

    // Verificar se o slug já existe na marca (excluindo a loja atual se for edição)
    try {
      const slugExiste = await lojasService.verificarSlugExistente(formData.slug, marcaId, id);
      if (slugExiste) {
        setErro('Este slug já está em uso nesta marca. Escolha outro.');
        return false;
      }
    } catch (error) {
      console.error('Erro ao verificar slug:', error);
      setErro('Erro ao validar o slug. Tente novamente.');
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
      const lojaData = {
        ...formData,
        marca_id: marcaId,
        imagemProdutoFile,
        imagemLojaFile
      };

      await lojasService.salvarLoja(lojaData, id);
      navigate(`/marca/${marcaId}/lojas`);
    } catch (error) {
      console.error('Erro ao salvar loja:', error);
      setErro('Erro ao salvar os dados da loja. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const voltar = () => {
    navigate(`/marca/${marcaId}/lojas`);
  };

  if (carregando) {
    return <div className="loading">Carregando dados...</div>;
  }

  if (!marca) {
    return <div className="loading">Marca não encontrada.</div>;
  }

  return (
    <div className="formulario-container">
      <header className="formulario-header">
        <h1>{id ? 'Editar Loja' : 'Nova Loja'} - {marca.get('nome')}</h1>
        <button className="btn-voltar" onClick={voltar}>Voltar</button>
      </header>

      <div className="formulario-content">
        {erro && <div className="erro-message">{erro}</div>}

        <form onSubmit={handleSubmit} className="formulario-loja">
          <div className="form-section">
            <h2>Informações Básicas</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="slug">Slug (URL)*</label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  placeholder="ex: londrina"
                  disabled={id ? true : false} // Não permitir editar o slug se for edição
                  required
                />
                <small>Identificador único na URL: {marca.get('slug')}/{formData.slug}</small>
              </div>

              <div className="form-group">
                <label htmlFor="ativa">Status</label>
                <div className="checkbox-container">
                  <input
                    type="checkbox"
                    id="ativa"
                    name="ativa"
                    checked={formData.ativa}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="ativa" className="checkbox-label">Loja ativa</label>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="cidade">Cidade*</label>
                <input
                  type="text"
                  id="cidade"
                  name="cidade"
                  value={formData.cidade}
                  onChange={handleInputChange}
                  placeholder="ex: Londrina"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="estado">Estado*</label>
                <select
                  id="estado"
                  name="estado"
                  value={formData.estado}
                  onChange={handleInputChange}
                  required
                >
                  <option value="PR">Paraná</option>
                  <option value="SP">São Paulo</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="telefone">Telefone*</label>
                <input
                  type="text"
                  id="telefone"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleInputChange}
                  placeholder="ex: (43) 99999-9999"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="preco_inicial">Preço Inicial*</label>
                <input
                  type="number"
                  id="preco_inicial"
                  name="preco_inicial"
                  value={formData.preco_inicial}
                  onChange={handleInputChange}
                  placeholder="ex: 289"
                  required
                />
                <small>
                  Valor padrão {formData.estado}: R$ {formData.estado === 'SP' ? marca.get('valor_padrao_sp') : marca.get('valor_padrao_pr')},00
                </small>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Imagens</h2>
            
            <div className="form-row">
              <div className="form-group imagem-upload">
                <label htmlFor="imagem_produto">Imagem do Produto</label>
                <input
                  type="file"
                  id="imagem_produto"
                  name="imagem_produto"
                  onChange={handleImagemProdutoChange}
                  accept="image/*"
                />
                {imagemProdutoPreview && (
                  <div className="imagem-preview">
                    <img src={imagemProdutoPreview} alt="Preview do produto" />
                  </div>
                )}
              </div>

              <div className="form-group imagem-upload">
                <label htmlFor="imagem_loja">Imagem da Loja</label>
                <input
                  type="file"
                  id="imagem_loja"
                  name="imagem_loja"
                  onChange={handleImagemLojaChange}
                  accept="image/*"
                />
                {imagemLojaPreview && (
                  <div className="imagem-preview">
                    <img src={imagemLojaPreview} alt="Preview da loja" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Links e Configurações</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="link_whatsapp">Link do WhatsApp</label>
                <input
                  type="text"
                  id="link_whatsapp"
                  name="link_whatsapp"
                  value={formData.link_whatsapp}
                  onChange={handleInputChange}
                  placeholder="ex: https://wa.me/5543999999999"
                />
              </div>

              <div className="form-group">
                <label htmlFor="link_maps">Link do Google Maps</label>
                <input
                  type="text"
                  id="link_maps"
                  name="link_maps"
                  value={formData.link_maps}
                  onChange={handleInputChange}
                  placeholder="ex: https://goo.gl/maps/..."
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="popup_tipo">Tipo de Popup</label>
                <select
                  id="popup_tipo"
                  name="popup_tipo"
                  value={formData.popup_tipo}
                  onChange={handleInputChange}
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="raspadinha">Raspadinha</option>
                  <option value="simples">Simples</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>SEO</h2>
            
            <div className="form-group">
              <label htmlFor="meta_title">Título (Meta Title)</label>
              <input
                type="text"
                id="meta_title"
                name="meta_title"
                value={formData.meta_title}
                onChange={handleInputChange}
                placeholder={`ex: Baterias em ${formData.cidade} | ${marca.get('nome')}`}
              />
            </div>

            <div className="form-group">
              <label htmlFor="meta_description">Descrição (Meta Description)</label>
              <textarea
                id="meta_description"
                name="meta_description"
                value={formData.meta_description}
                onChange={handleInputChange}
                placeholder={`ex: Encontre as melhores baterias em ${formData.cidade}. Preços a partir de R$ ${formData.preco_inicial},00.`}
                rows="3"
              ></textarea>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancelar" onClick={voltar}>Cancelar</button>
            <button type="submit" className="btn-salvar" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar Loja'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormularioLojaPage;