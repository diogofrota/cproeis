/**
 * DESCRIÇÃO DO BLOCO:
 * Configuração sintética exclusiva do botão "Criar vagas mês anterior". Ela separa os parâmetros
 * de variação da competência anterior da lógica que grava vagas no LocalStorage.
 *
 * PARÂMETROS E RETORNO:
 * Não recebe parâmetros e não retorna valores. Ele expõe `window.CPROEIS_VAGAS_MES_ANTERIOR_SIMULADAS`
 * para consumo por `js/script-index-demo-data.js`.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados diretamente. Os valores ficam em memória no navegador até que o usuário clique
 * no botão de criação de vagas do mês anterior.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em homologação online, substituir estes parâmetros por escala fechada da competência
 * anterior, exigindo autorização administrativa para recriação ou correção retroativa.
 */
window.CPROEIS_VAGAS_MES_ANTERIOR_SIMULADAS = {
  classesOficiais: ['A', 'B'],
  turnos: {
    servico12: ['07:00', '19:00'],
    servico8: ['09:00', '17:00'],
    servico6: ['16:00', '22:00']
  },
  labelsServico: {
    oficial: 'Supervisão retroativa',
    praca: 'Policiamento retroativo',
    apoio: 'Apoio retroativo'
  },
  pontoReferencia: 'Base operacional'
};
