import { Parse } from './parseService';

/**
 * Serviço para gerenciar as lojas no Parse Server
 */
const lojasService = {
  /**
   * Obtém todas as lojas
   * @param {String} estado - Filtro por estado (opcional)
   * @returns {Promise} - Promise com o array de lojas
   */
  getListas: async (estado = null) => {
    try {
      const Loja = Parse.Object.extend("Lojas");
      const query = new Parse.Query(Loja);
      
      // Aplicar filtro se necessário
      if (estado) {
        query.equalTo("estado", estado);
      }
      
      query.descending("createdAt");
      return await query.find();
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtém uma loja pelo ID
   * @param {String} id - ID da loja
   * @returns {Promise} - Promise com a loja
   */
  getLojaById: async (id) => {
    try {
      const Loja = Parse.Object.extend("Lojas");
      const query = new Parse.Query(Loja);
      return await query.get(id);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Salva uma loja (nova ou existente)
   * @param {Object} lojaData - Dados da loja
   * @param {String} id - ID da loja (se for edição)
   * @returns {Promise} - Promise com a loja salva
   */
  salvarLoja: async (lojaData, id = null) => {
    try {
      const Loja = Parse.Object.extend("Lojas");
      let loja;

      if (id) {
        // Editando loja existente
        const query = new Parse.Query(Loja);
        loja = await query.get(id);
      } else {
        // Criando nova loja
        loja = new Loja();
      }

      // Atualiza os campos de texto
      loja.set('slug', lojaData.slug.toLowerCase());
      loja.set('cidade', lojaData.cidade);
      loja.set('estado', lojaData.estado);
      loja.set('telefone', lojaData.telefone);
      loja.set('preco_inicial', Number(lojaData.preco_inicial));
      loja.set('link_whatsapp', lojaData.link_whatsapp);
      loja.set('link_maps', lojaData.link_maps);
      loja.set('popup_tipo', lojaData.popup_tipo);
      loja.set('meta_title', lojaData.meta_title);
      loja.set('meta_description', lojaData.meta_description);
      loja.set('ativa', lojaData.ativa);

      // Atualiza as imagens se fornecidas
      if (lojaData.imagemProdutoFile) {
        const imagemProdutoParseFile = new Parse.File(
          `imagem_produto_${lojaData.slug}.jpg`, 
          lojaData.imagemProdutoFile
        );
        await imagemProdutoParseFile.save();
        loja.set('imagem_produto', imagemProdutoParseFile);
      }

      if (lojaData.imagemLojaFile) {
        const imagemLojaParseFile = new Parse.File(
          `imagem_loja_${lojaData.slug}.jpg`, 
          lojaData.imagemLojaFile
        );
        await imagemLojaParseFile.save();
        loja.set('imagem_loja', imagemLojaParseFile);
      }

      // Salva a loja
      return await loja.save();
    } catch (error) {
      throw error;
    }
  },

  /**
   * Alterna o status (ativo/inativo) de uma loja
   * @param {Object} loja - Objeto da loja Parse
   * @returns {Promise} - Promise com a loja atualizada
   */
  alternarStatus: async (loja) => {
    try {
      loja.set("ativa", !loja.get("ativa"));
      return await loja.save();
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Importa múltiplas lojas a partir de dados CSV
   * @param {Array} lojas - Array de objetos com dados das lojas
   * @returns {Object} - Objeto com resultados da importação
   */
  importarLojas: async (lojas) => {
    const resultados = {
      sucesso: 0,
      falhas: 0,
      erros: []
    };

    // Processar cada loja do array
    for (const lojaData of lojas) {
      try {
        // Verificar se já existe uma loja com o mesmo slug
        const Loja = Parse.Object.extend("Lojas");
        const query = new Parse.Query(Loja);
        query.equalTo("slug", lojaData.slug.toLowerCase());
        const lojaExistente = await query.first();

        if (lojaExistente) {
          resultados.falhas++;
          resultados.erros.push({
            slug: lojaData.slug,
            erro: "Já existe uma loja com este slug"
          });
          continue;
        }

        // Criar nova loja
        const novaLoja = new Loja();
        
        // Definir campos obrigatórios
        novaLoja.set('slug', lojaData.slug.toLowerCase());
        novaLoja.set('cidade', lojaData.cidade);
        novaLoja.set('estado', lojaData.estado);
        novaLoja.set('telefone', lojaData.telefone);
        novaLoja.set('preco_inicial', Number(lojaData.preco_inicial) || 0);
        
        // Definir campos opcionais
        if (lojaData.link_whatsapp) novaLoja.set('link_whatsapp', lojaData.link_whatsapp);
        if (lojaData.link_maps) novaLoja.set('link_maps', lojaData.link_maps);
        if (lojaData.popup_tipo) novaLoja.set('popup_tipo', lojaData.popup_tipo);
        if (lojaData.meta_title) novaLoja.set('meta_title', lojaData.meta_title);
        if (lojaData.meta_description) novaLoja.set('meta_description', lojaData.meta_description);
        
        // Por padrão, definir como ativa
        novaLoja.set('ativa', true);

        // Salvar a loja
        await novaLoja.save();
        resultados.sucesso++;
      } catch (error) {
        resultados.falhas++;
        resultados.erros.push({
          slug: lojaData.slug,
          erro: error.message
        });
      }
    }

    return resultados;
  },
  
  /**
   * Verifica se um slug já está em uso
   * @param {String} slug - Slug a ser verificado
   * @returns {Promise<Boolean>} - True se o slug já estiver em uso
   */
  verificarSlugExistente: async (slug) => {
    try {
      const Loja = Parse.Object.extend("Lojas");
      const query = new Parse.Query(Loja);
      query.equalTo("slug", slug.toLowerCase());
      const loja = await query.first();
      return !!loja;
    } catch (error) {
      throw error;
    }
  }
};

export default lojasService;