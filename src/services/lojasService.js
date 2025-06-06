import Parse from 'parse/dist/parse.min.js';

/**
 * Serviço para gerenciar as lojas no Parse Server
 */
const lojasService = {
  /**
   * Obtém todas as lojas de uma marca específica
   * @param {String} marcaId - ID da marca
   * @param {String} estado - Filtro por estado (opcional)
   * @returns {Promise} - Promise com o array de lojas
   */
  getLojasPorMarca: async (marcaId, estado = null) => {
    try {
      const Loja = Parse.Object.extend("Lojas");
      const query = new Parse.Query(Loja);
      
      query.equalTo("marca_id", marcaId);
      
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
   * Obtém todas as lojas (método legacy para compatibilidade)
   * @param {String} estado - Filtro por estado (opcional)
   * @returns {Promise} - Promise com o array de lojas
   */
  getLojas: async (estado = null) => {
    try {
      const Loja = Parse.Object.extend("Lojas");
      const query = new Parse.Query(Loja);
      
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

      // Campos obrigatórios
      loja.set('slug', lojaData.slug.toLowerCase());
      loja.set('cidade', lojaData.cidade);
      loja.set('estado', lojaData.estado);
      loja.set('telefone', lojaData.telefone);
      loja.set('preco_inicial', Number(lojaData.preco_inicial));
      loja.set('marca_id', lojaData.marca_id); // Novo campo obrigatório
      
      // Campos opcionais
      loja.set('link_whatsapp', lojaData.link_whatsapp || '');
      loja.set('link_maps', lojaData.link_maps || '');
      loja.set('popup_tipo', lojaData.popup_tipo || 'whatsapp');
      loja.set('meta_title', lojaData.meta_title || '');
      loja.set('meta_description', lojaData.meta_description || '');
      loja.set('ativa', lojaData.ativa !== undefined ? lojaData.ativa : true);

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
   * @param {String} marcaId - ID da marca para vincular as lojas
   * @returns {Object} - Objeto com resultados da importação
   */
  importarLojas: async (lojas, marcaId) => {
    const resultados = {
      sucesso: 0,
      falhas: 0,
      erros: []
    };

    for (const lojaData of lojas) {
      try {
        // Verificar se já existe uma loja com o mesmo slug na mesma marca
        const Loja = Parse.Object.extend("Lojas");
        const query = new Parse.Query(Loja);
        query.equalTo("slug", lojaData.slug.toLowerCase());
        query.equalTo("marca_id", marcaId);
        const lojaExistente = await query.first();

        if (lojaExistente) {
          resultados.falhas++;
          resultados.erros.push({
            slug: lojaData.slug,
            erro: "Já existe uma loja com este slug nesta marca"
          });
          continue;
        }

        // Criar nova loja
        const novaLoja = new Loja();
        
        // Campos obrigatórios
        novaLoja.set('slug', lojaData.slug.toLowerCase());
        novaLoja.set('cidade', lojaData.cidade);
        novaLoja.set('estado', lojaData.estado);
        novaLoja.set('telefone', lojaData.telefone);
        novaLoja.set('preco_inicial', Number(lojaData.preco_inicial) || 0);
        novaLoja.set('marca_id', marcaId);
        
        // Campos opcionais
        if (lojaData.link_whatsapp) novaLoja.set('link_whatsapp', lojaData.link_whatsapp);
        if (lojaData.link_maps) novaLoja.set('link_maps', lojaData.link_maps);
        if (lojaData.popup_tipo) novaLoja.set('popup_tipo', lojaData.popup_tipo);
        if (lojaData.meta_title) novaLoja.set('meta_title', lojaData.meta_title);
        if (lojaData.meta_description) novaLoja.set('meta_description', lojaData.meta_description);
        
        novaLoja.set('ativa', true);

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
   * Verifica se um slug já está em uso em uma marca específica
   * @param {String} slug - Slug a ser verificado
   * @param {String} marcaId - ID da marca
   * @param {String} excluirId - ID da loja a excluir da verificação (para edição)
   * @returns {Promise<Boolean>} - True se o slug já estiver em uso
   */
  verificarSlugExistente: async (slug, marcaId, excluirId = null) => {
    try {
      const Loja = Parse.Object.extend("Lojas");
      const query = new Parse.Query(Loja);
      query.equalTo("slug", slug.toLowerCase());
      query.equalTo("marca_id", marcaId);
      
      if (excluirId) {
        query.notEqualTo("objectId", excluirId);
      }
      
      const loja = await query.first();
      return !!loja;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Exclui uma loja
   * @param {String} id - ID da loja
   * @returns {Promise} - Promise da exclusão
   */
  excluirLoja: async (id) => {
    try {
      const Loja = Parse.Object.extend("Lojas");
      const query = new Parse.Query(Loja);
      const loja = await query.get(id);
      return await loja.destroy();
    } catch (error) {
      throw error;
    }
  },

  /**
   * Atualiza preços de lojas específicas de uma marca
   * @param {String} marcaId - ID da marca
   * @param {Array} lojasIds - Array de IDs das lojas a serem atualizadas
   * @param {Number} valorPR - Novo valor para lojas do PR
   * @param {Number} valorSP - Novo valor para lojas de SP
   * @returns {Promise} - Promise com quantidade de lojas atualizadas
   */
  atualizarPrecosLojas: async (marcaId, lojasIds, valorPR, valorSP) => {
    try {
      let lojasAtualizadas = 0;
      
      for (const lojaId of lojasIds) {
        const Loja = Parse.Object.extend("Lojas");
        const query = new Parse.Query(Loja);
        const loja = await query.get(lojaId);
        
        // Verificar se a loja pertence à marca
        if (loja.get('marca_id') !== marcaId) {
          continue;
        }
        
        // Aplicar preço baseado no estado
        if (loja.get('estado') === 'PR' && valorPR > 0) {
          loja.set('preco_inicial', Number(valorPR));
          await loja.save();
          lojasAtualizadas++;
        } else if (loja.get('estado') === 'SP' && valorSP > 0) {
          loja.set('preco_inicial', Number(valorSP));
          await loja.save();
          lojasAtualizadas++;
        }
      }
      
      return lojasAtualizadas;
    } catch (error) {
      throw error;
    }
  }
};

export default lojasService;