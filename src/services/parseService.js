// src/services/precosService.js
import { Parse } from './parseService';

/**
 * Serviço para gerenciar preços por marca e estado
 */
const precosService = {
  /**
   * Obtém preços de todas as marcas
   * @returns {Promise} - Promise com array de preços organizados por marca
   */
  getPrecosPorMarca: async () => {
    try {
      const Preco = Parse.Object.extend("Precos");
      const query = new Parse.Query(Preco);
      query.include("marca_id");
      query.ascending("marca_id.nome");
      
      const resultados = await query.find();
      
      // Organizar por marca
      const precosPorMarca = {};
      
      resultados.forEach(preco => {
        const marca = preco.get('marca_id');
        if (!marca) return;
        
        const marcaId = marca.id;
        const marcaNome = marca.get('nome');
        const estado = preco.get('estado');
        
        if (!precosPorMarca[marcaId]) {
          precosPorMarca[marcaId] = {
            marca: {
              id: marcaId,
              nome: marcaNome,
              logo: marca.get('logo')?.url(),
              cor_primaria: marca.get('cor_primaria')
            },
            precos: {
              PR: { bateria_40ah: '', objectId: null },
              SP: { bateria_40ah: '', objectId: null }
            }
          };
        }
        
        if (estado === 'PR' || estado === 'SP') {
          precosPorMarca[marcaId].precos[estado] = {
            bateria_40ah: preco.get('bateria_40ah') || '',
            objectId: preco.id
          };
        }
      });
      
      return Object.values(precosPorMarca);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtém preços de uma marca específica
   * @param {String} marcaId - ID da marca
   * @returns {Promise} - Promise com os preços da marca
   */
  getPrecosMarca: async (marcaId) => {
    try {
      const Preco = Parse.Object.extend("Precos");
      const query = new Parse.Query(Preco);
      
      const marca = new (Parse.Object.extend("Marcas"))();
      marca.id = marcaId;
      query.equalTo("marca_id", marca);
      
      const resultados = await query.find();
      
      const precos = {
        PR: { bateria_40ah: '', objectId: null },
        SP: { bateria_40ah: '', objectId: null }
      };
      
      resultados.forEach(preco => {
        const estado = preco.get('estado');
        if (estado === 'PR' || estado === 'SP') {
          precos[estado] = {
            bateria_40ah: preco.get('bateria_40ah') || '',
            objectId: preco.id
          };
        }
      });
      
      return precos;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Salva preço para uma marca e estado específicos
   * @param {String} marcaId - ID da marca
   * @param {String} estado - Estado (PR ou SP)
   * @param {Object} precosData - Dados dos preços
   * @returns {Promise} - Promise com o preço salvo
   */
  salvarPrecoMarca: async (marcaId, estado, precosData) => {
    try {
      const Preco = Parse.Object.extend("Precos");
      let precoObject;

      // Verificar se já existe um registro para a marca e estado
      if (precosData.objectId) {
        const query = new Parse.Query(Preco);
        precoObject = await query.get(precosData.objectId);
      } else {
        // Verificar se já existe registro sem objectId
        const query = new Parse.Query(Preco);
        const marca = new (Parse.Object.extend("Marcas"))();
        marca.id = marcaId;
        query.equalTo("marca_id", marca);
        query.equalTo("estado", estado);
        
        precoObject = await query.first();
        
        if (!precoObject) {
          precoObject = new Preco();
          precoObject.set('marca_id', marca);
          precoObject.set('estado', estado);
        }
      }

      // Definir os valores
      precoObject.set('bateria_40ah', Number(precosData.bateria_40ah) || 0);

      // Salvar
      return await precoObject.save();
    } catch (error) {
      throw error;
    }
  },

  /**
   * Aplica um preço para todas as marcas em um estado
   * @param {String} estado - Estado (PR ou SP)
   * @param {Object} precosData - Dados dos preços
   * @returns {Promise} - Promise com resultados da aplicação
   */
  aplicarPrecoTodasMarcas: async (estado, precosData) => {
    try {
      // Buscar todas as marcas ativas
      const Marca = Parse.Object.extend("Marcas");
      const queryMarcas = new Parse.Query(Marca);
      queryMarcas.equalTo("ativa", true);
      const marcas = await queryMarcas.find();

      const resultados = {
        sucesso: 0,
        falhas: 0,
        erros: []
      };

      // Aplicar preço para cada marca
      for (const marca of marcas) {
        try {
          await precosService.salvarPrecoMarca(marca.id, estado, precosData);
          resultados.sucesso++;
        } catch (error) {
          resultados.falhas++;
          resultados.erros.push({
            marca: marca.get('nome'),
            erro: error.message
          });
        }
      }

      return resultados;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtém histórico de alterações de preços
   * @param {String} marcaId - ID da marca (opcional)
   * @param {Number} limite - Limite de registros
   * @returns {Promise} - Promise com histórico
   */
  getHistoricoPrecos: async (marcaId = null, limite = 50) => {
    try {
      const Preco = Parse.Object.extend("Precos");
      const query = new Parse.Query(Preco);
      query.include("marca_id");
      query.descending("updatedAt");
      query.limit(limite);
      
      if (marcaId) {
        const marca = new (Parse.Object.extend("Marcas"))();
        marca.id = marcaId;
        query.equalTo("marca_id", marca);
      }
      
      const resultados = await query.find();
      
      return resultados.map(preco => ({
        id: preco.id,
        marca: preco.get('marca_id')?.get('nome') || 'Marca não encontrada',
        estado: preco.get('estado'),
        bateria_40ah: preco.get('bateria_40ah'),
        dataAtualizacao: preco.get('updatedAt'),
        dataCriacao: preco.get('createdAt')
      }));
    } catch (error) {
      throw error;
    }
  },

  /**
   * Copia preços de uma marca para outra
   * @param {String} marcaOrigemId - ID da marca de origem
   * @param {String} marcaDestinoId - ID da marca de destino
   * @returns {Promise} - Promise com resultado da cópia
   */
  copiarPrecos: async (marcaOrigemId, marcaDestinoId) => {
    try {
      const precosOrigem = await precosService.getPrecosMarca(marcaOrigemId);
      
      const resultados = {
        sucesso: 0,
        falhas: 0,
        erros: []
      };

      // Copiar preços para cada estado
      for (const estado of ['PR', 'SP']) {
        if (precosOrigem[estado].bateria_40ah) {
          try {
            await precosService.salvarPrecoMarca(
              marcaDestinoId, 
              estado, 
              { bateria_40ah: precosOrigem[estado].bateria_40ah }
            );
            resultados.sucesso++;
          } catch (error) {
            resultados.falhas++;
            resultados.erros.push({
              estado,
              erro: error.message
            });
          }
        }
      }

      return resultados;
    } catch (error) {
      throw error;
    }
  }
};

export default precosService;