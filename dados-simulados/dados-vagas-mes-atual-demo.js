/**
 * DESCRIÇÃO DO BLOCO:
 * Configuração sintética exclusiva do botão "Criar vagas mês atual". Ela separa os parâmetros
 * de variação da competência atual da lógica que grava vagas no LocalStorage.
 *
 * PARÂMETROS E RETORNO:
 * Não recebe parâmetros e não retorna valores. Ele expõe `window.CPROEIS_VAGAS_MES_ATUAL_SIMULADAS`
 * para consumo por `js/script-index-demo-data.js`.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados diretamente. Os valores ficam em memória no navegador até que o usuário clique
 * no botão de criação de vagas do mês atual.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em homologação online, substituir estes parâmetros por escala importada do backend para
 * a competência atual, validando contrato, vigência, saldo financeiro e autorização do responsável.
 */
window.CPROEIS_VAGAS_MES_ATUAL_SIMULADAS = {
  classesOficiais: ['A', 'B'],
  turnos: {
    servico12: ['08:00', '20:00'],
    servico8: ['08:00', '16:00'],
    servico6: ['14:00', '20:00']
  },
  labelsServico: {
    oficial: 'Supervisão',
    praca: 'Policiamento',
    apoio: 'Apoio'
  },
  pontoReferencia: 'Portaria principal'
};
