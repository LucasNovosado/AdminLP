import Papa from 'papaparse';
import lojasService from './lojasService';

/**
 * Serviço para importação massiva de lojas
 */
const importacaoService = {
  /**
   * Processa um arquivo CSV e converte para um array de objetos
   * @param {File} file - Arquivo CSV para processamento
   * @returns {Promise} - Promise com array de objetos
   */
  processarCSV: (file) => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve(results.data);
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  },
  
  /**
   * Valida o formato dos dados antes da importação
   * @param {Array} dados - Array de objetos com dados das lojas
   * @returns {Object} - Objeto com erros encontrados
   */
  validarDadosImportacao: (dados) => {
    const erros = [];
    const camposObrigatorios = ['slug', 'cidade', 'estado', 'telefone', 'preco_inicial'];
    
    // Verificar se há ao menos uma linha com dados
    if (!dados || dados.length === 0) {
      return {
        valido: false,
        erros: ['O arquivo não contém dados para importação']
      };
    }
    
    // Verificar cada linha de dados
    dados.forEach((linha, index) => {
      const linhaErros = [];
      
      // Verificar campos obrigatórios
      camposObrigatorios.forEach(campo => {
        if (!linha[campo]) {
          linhaErros.push(`Campo "${campo}" ausente ou vazio`);
        }
      });
      
      // Verificar formato de slug (apenas letras minúsculas, números e hífen)
      if (linha.slug) {
        const slugRegex = /^[a-z0-9-]+$/;
        if (!slugRegex.test(linha.slug.toString().toLowerCase())) {
          linhaErros.push('O slug deve conter apenas letras minúsculas, números e hífen');
        }
      }
      
      // Verificar estados válidos
      if (linha.estado && !['PR', 'SP'].includes(linha.estado.toString().toUpperCase())) {
        linhaErros.push('O estado deve ser PR ou SP');
      }
      
      // Verificar tipos de popup válidos
      if (linha.popup_tipo && 
          !['whatsapp', 'raspadinha', 'simples'].includes(linha.popup_tipo.toString().toLowerCase())) {
        linhaErros.push('O tipo de popup deve ser: whatsapp, raspadinha ou simples');
      }
      
      // Verificar se o preço é um número válido
      if (linha.preco_inicial && (isNaN(linha.preco_inicial) || Number(linha.preco_inicial) < 0)) {
        linhaErros.push('O preço inicial deve ser um número válido e positivo');
      }
      
      // Adicionar erros da linha ao array geral
      if (linhaErros.length > 0) {
        erros.push({
          linha: index + 2, // +2 porque o índice começa em 0 e desconsideramos o cabeçalho
          slug: linha.slug || `Linha ${index + 2}`,
          erros: linhaErros
        });
      }
    });
    
    return {
      valido: erros.length === 0,
      erros: erros
    };
  },
  
  /**
   * Realiza a importação massiva de lojas para uma marca específica
   * @param {File} file - Arquivo CSV com dados das lojas
   * @param {String} marcaId - ID da marca para vincular as lojas
   * @returns {Promise} - Promise com resultados da importação
   */
  importarCSVParaMarca: async (file, marcaId) => {
    try {
      // Processar o arquivo CSV
      const dadosCSV = await importacaoService.processarCSV(file);
      
      // Validar dados antes da importação
      const validacao = importacaoService.validarDadosImportacao(dadosCSV);
      if (!validacao.valido) {
        return {
          sucesso: false,
          mensagem: 'Existem erros nos dados que impedem a importação',
          validacao
        };
      }
      
      // Realizar a importação se os dados forem válidos
      const resultadoImportacao = await lojasService.importarLojas(dadosCSV, marcaId);
      
      return {
        sucesso: true,
        resultados: resultadoImportacao
      };
    } catch (error) {
      console.error('Erro na importação:', error);
      return {
        sucesso: false,
        mensagem: `Erro na importação: ${error.message}`
      };
    }
  },

  /**
   * Realiza a importação massiva de lojas (método legacy para compatibilidade)
   * @param {File} file - Arquivo CSV com dados das lojas
   * @returns {Promise} - Promise com resultados da importação
   */
  importarCSV: async (file) => {
    // Este método agora requer uma marca, então vamos retornar erro
    return {
      sucesso: false,
      mensagem: 'Método deprecado. Use importarCSVParaMarca especificando uma marca.'
    };
  },
  
  /**
   * Gera uma planilha modelo para download
   * @returns {Blob} - Arquivo CSV modelo
   */
  gerarPlanilhaModelo: () => {
    const cabecalho = [
      'slug',
      'cidade',
      'estado',
      'telefone',
      'preco_inicial',
      'link_whatsapp',
      'link_maps',
      'popup_tipo',
      'meta_title',
      'meta_description'
    ];
    
    const exemploLinha1 = [
      'londrina',
      'Londrina',
      'PR',
      '(43) 3333-3333',
      '289',
      'https://wa.me/5543999999999',
      'https://goo.gl/maps/exemplo1',
      'whatsapp',
      'Baterias em Londrina | Sua Marca',
      'Encontre as melhores baterias em Londrina. Preços a partir de R$ 289,00.'
    ];
    
    const exemploLinha2 = [
      'maringa',
      'Maringá',
      'PR',
      '(44) 4444-4444',
      '299',
      'https://wa.me/5544999999999',
      'https://goo.gl/maps/exemplo2',
      'raspadinha',
      'Baterias em Maringá | Sua Marca',
      'Baterias automotivas com os melhores preços em Maringá.'
    ];

    const exemploLinha3 = [
      'sao-paulo-centro',
      'São Paulo',
      'SP',
      '(11) 1111-1111',
      '319',
      'https://wa.me/5511999999999',
      'https://goo.gl/maps/exemplo3',
      'simples',
      'Baterias em São Paulo | Sua Marca',
      'Baterias automotivas no centro de São Paulo com entrega rápida.'
    ];
    
    // Criar conteúdo CSV
    const csvContent = [
      cabecalho,
      exemploLinha1,
      exemploLinha2,
      exemploLinha3
    ].map(e => e.join(',')).join('\n');
    
    // Criar blob para download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    return blob;
  }
};

export default importacaoService;