/**
 * DESCRIÇÃO DO BLOCO:
 * Base sintética exclusiva do módulo de contratos usada pelos botões de teste da página inicial.
 * A separação deste arquivo permite carregar contratos sem depender da massa de policiais.
 *
 * PARÂMETROS E RETORNO:
 * Não recebe parâmetros e não retorna valores. Ele expõe `window.CPROEIS_CONTRATOS_SIMULADOS`
 * para consumo por `js/script-index-demo-data.js`.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados diretamente. Os arrays ficam em memória no navegador até que o usuário clique
 * em "Carregar contratos", quando o script principal persiste as informações em LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em homologação online, substituir este arquivo por fixture versionada do backend de
 * contratos e bloquear qualquer exposição de dados simulados em produção.
 */
window.CPROEIS_CONTRATOS_SIMULADOS = {
  convenios: [
    'Galeao',
    'Maracana Eventos',
    'Porto Seguro Rio',
    'Hospital Municipal Central',
    'Shopping Metropolitano',
    'Aeroporto Executivo',
    'Centro Administrativo RJ',
    'Terminal Rodoviario Novo Rio',
    'Complexo Esportivo Estadual',
    'Museu da Cidade'
  ],
  responsaveisConvenio: [
    'Roberto Almeida Nogueira',
    'Luciana Ferreira Campos',
    'Marcelo Henrique Duarte',
    'Patricia Gomes de Oliveira',
    'Eduardo Martins Ribeiro',
    'Carolina Azevedo Lima',
    'Ricardo Souza Monteiro',
    'Fernanda Castro Barbosa',
    'Alexandre Pereira Cardoso',
    'Vanessa Rocha Teixeira'
  ]
};
