import Parse from 'parse/dist/parse.min.js';

/**
 * Serviço para gerenciar marcas no Parse Server
 */
const marcasService = {
  /**
   * Obtém todas as marcas
   * @param {Boolean} apenasAtivas - Se true, retorna apenas marcas ativas
   * @returns {Promise} - Promise com o array de marcas
   */
  getMarcas: async (apenasAtivas = false) => {
    try {
      const Marca = Parse.Object.extend("Marcas");
      const query = new Parse.Query(Marca);
      
      if (apenasAtivas) {
        query.equalTo("ativa", true);
      }
      
      query.ascending("nome");
      return await query.find();
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtém uma marca pelo ID
   * @param {String} id - ID da marca
   * @returns {Promise} - Promise com a marca
   */
  getMarcaById: async (id) => {
    try {
      const Marca = Parse.Object.extend("Marcas");
      const query = new Parse.Query(Marca);
      return await query.get(id);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Salva uma marca (nova ou existente)
   * @param {Object} marcaData - Dados da marca
   * @param {String} id - ID da marca (se for edição)
   * @returns {Promise} - Promise with saved marca
   */
  salvarMarca: async (marcaData, id = null) => {
    try {
      const Marca = Parse.Object.extend("Marcas");
      let marca;

      if (id) {
        // Editando marca existente
        const query = new Parse.Query(Marca);
        marca = await query.get(id);
      } else {
        // Criando nova marca
        marca = new Marca();
      }

      // Campos obrigatórios
      marca.set('nome', marcaData.nome);
      marca.set('slug', marcaData.slug.toLowerCase());
      marca.set('descricao', marcaData.descricao || '');
      marca.set('ativa', marcaData.ativa !== undefined ? marcaData.ativa : true);
      
      // Valores padrão
      marca.set('valor_padrao_pr', Number(marcaData.valor_padrao_pr) || 0);
      marca.set('valor_padrao_sp', Number(marcaData.valor_padrao_sp) || 0);
      
      // Campos de SEO
      marca.set('meta_title', marcaData.meta_title || '');
      marca.set('meta_description', marcaData.meta_description || '');
      
      // Logo da marca
      if (marcaData.logoFile) {
        const logoParseFile = new Parse.File(
          `logo_${marcaData.slug}.jpg`, 
          marcaData.logoFile
        );
        await logoParseFile.save();
        marca.set('logo', logoParseFile);
      }

      return await marca.save();
    } catch (error) {
      throw error;
    }
  },

  /**
   * Alterna o status (ativo/inativo) de uma marca
   * @param {Object} marca - Objeto da marca Parse
   * @returns {Promise} - Promise com a marca atualizada
   */
  alternarStatus: async (marca) => {
    try {
      marca.set("ativa", !marca.get("ativa"));
      return await marca.save();
    } catch (error) {
      throw error;
    }
  },

  /**
   * Exclui uma marca
   * @param {String} id - ID da marca
   * @returns {Promise} - Promise da exclusão
   */
  excluirMarca: async (id) => {
    try {
      // Verificar se existem lojas vinculadas a esta marca
      const Loja = Parse.Object.extend("Lojas");
      const queryLojas = new Parse.Query(Loja);
      queryLojas.equalTo("marca_id", id);
      const lojasVinculadas = await queryLojas.count();

      if (lojasVinculadas > 0) {
        throw new Error(`Não é possível excluir a marca. Existem ${lojasVinculadas} loja(s) vinculada(s) a ela.`);
      }

      const Marca = Parse.Object.extend("Marcas");
      const query = new Parse.Query(Marca);
      const marca = await query.get(id);
      return await marca.destroy();
    } catch (error) {
      throw error;
    }
  },

  /**
   * Verifica se um slug já está em uso
   * @param {String} slug - Slug a ser verificado
   * @param {String} excluirId - ID da marca a excluir da verificação (para edição)
   * @returns {Promise<Boolean>} - True se o slug já estiver em uso
   */
  verificarSlugExistente: async (slug, excluirId = null) => {
    try {
      const Marca = Parse.Object.extend("Marcas");
      const query = new Parse.Query(Marca);
      query.equalTo("slug", slug.toLowerCase());
      
      if (excluirId) {
        query.notEqualTo("objectId", excluirId);
      }
      
      const marca = await query.first();
      return !!marca;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Atualiza valores padrão de uma marca e aplica em todas as lojas
   * @param {String} marcaId - ID da marca
   * @param {Number} valorPR - Novo valor padrão PR
   * @param {Number} valorSP - Novo valor padrão SP
   * @param {Boolean} aplicarTodasLojas - Se deve aplicar em todas as lojas da marca
   * @returns {Promise} - Promise com resultado da operação
   */
  atualizarValoresPadrao: async (marcaId, valorPR, valorSP, aplicarTodasLojas = false) => {
    try {
      // Atualizar a marca
      const Marca = Parse.Object.extend("Marcas");
      const queryMarca = new Parse.Query(Marca);
      const marca = await queryMarca.get(marcaId);
      
      marca.set('valor_padrao_pr', Number(valorPR));
      marca.set('valor_padrao_sp', Number(valorSP));
      await marca.save();

      let lojasAtualizadas = 0;

      // Se solicitado, aplicar em todas as lojas da marca
      if (aplicarTodasLojas) {
        const Loja = Parse.Object.extend("Lojas");
        const queryLojas = new Parse.Query(Loja);
        queryLojas.equalTo("marca_id", marcaId);
        const lojas = await queryLojas.find();

        for (const loja of lojas) {
          if (loja.get('estado') === 'PR') {
            loja.set('preco_inicial', Number(valorPR));
          } else if (loja.get('estado') === 'SP') {
            loja.set('preco_inicial', Number(valorSP));
          }
          await loja.save();
          lojasAtualizadas++;
        }
      }

      return {
        marcaAtualizada: true,
        lojasAtualizadas
      };
    } catch (error) {
      throw error;
    }
  }
};

export default marcasService;