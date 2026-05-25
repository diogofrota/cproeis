const TABELA_SERVICO_STORAGE_POLICIAIS = 'cproeis_cadastro_policiais';
const TABELA_SERVICO_STORAGE_VAGAS = 'cproeis_convenios_vagas';
const TABELA_SERVICO_STORAGE_CONVENIOS = 'cproeis_contratos_convenios';
const TABELA_SERVICO_STORAGE_POLICIAL_ATUAL = 'cproeis_acesso_policial_atual';

const tabelaServicoTipos = {
  servico12: 'Serviço 12h',
  servico8: 'Serviço 8h',
  servico6: 'Serviço 6h'
};

const tabelaServicoClasses = {
  A: 'Classe A',
  B: 'Classe B',
  C: 'Classe C',
  D: 'Classe D',
  'C/D': 'Classe C/D'
};

let tabelaServicoLista = [];

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Lê listas JSON do LocalStorage com fallback seguro para array vazio.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} key - Chave do LocalStorage consultada.
 * @returns {Array<object>} Lista encontrada ou array vazio quando o dado não existir/estiver inválido.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê LocalStorage; não grava dados.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Substituir por chamada autenticada a API com tratamento de erro e expiração de sessão.
 */
function tabelaServicoLoadList(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    return [];
  }
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Escapa texto antes de renderizar conteúdo vindo do LocalStorage no HTML.
 *
 * PARÂMETROS E RETORNO:
 * @param {unknown} value - Valor a ser apresentado na tela.
 * @returns {string} Texto seguro para inserção em HTML.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não lê nem grava dados; apenas transforma valores em memória.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Usar camada de templates/componentes que escape automaticamente dados vindos de API.
 */
function tabelaServicoEscape(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Formata datas ISO ou timestamps para o padrão brasileiro usado nas tabelas do sistema.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} value - Data em YYYY-MM-DD ou timestamp ISO.
 * @returns {string} Data em DD/MM/YYYY ou hífen quando ausente.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa armazenamento; trabalha apenas sobre o valor recebido.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Centralizar formatação de datas em utilitário compartilhado para evitar duplicidade.
 */
function tabelaServicoFormatDate(value) {
  if (!value) return '-';
  const normalized = String(value).slice(0, 10);
  const [year, month, day] = normalized.split('-');
  if (!year || !month || !day) return '-';
  return `${day}/${month}/${year}`;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Localiza o policial logado pela URL ou pela sessão salva localmente.
 *
 * PARÂMETROS E RETORNO:
 * @returns {object|null} Policial encontrado ou null quando a sessão não puder ser resolvida.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê `cproeis_cadastro_policiais` e `cproeis_acesso_policial_atual`; grava o ID atual quando
 * a página recebe um ID válido pela URL.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Trocar a sessão local por autenticação real com token, perfil e expiração controlada.
 */
function tabelaServicoGetPolicial() {
  const params = new URLSearchParams(window.location.search);
  const urlId = params.get('id') || '';
  const storedId = localStorage.getItem(TABELA_SERVICO_STORAGE_POLICIAL_ATUAL) || '';
  const id = urlId || storedId;
  const policial = tabelaServicoLoadList(TABELA_SERVICO_STORAGE_POLICIAIS)
    .find((item) => item.id === id) || null;

  if (policial && urlId) {
    localStorage.setItem(TABELA_SERVICO_STORAGE_POLICIAL_ATUAL, policial.id);
  }

  return policial;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Normaliza a lista de escalados de uma vaga, preservando compatibilidade com registros antigos.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} vaga - Vaga persistida pelo módulo de convênios.
 * @returns {Array<object>} Lista de escalados associados à vaga.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; lê apenas campos em memória de vagas carregadas do LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Migrar escalas para entidade própria com presença, pagamento e auditoria de alterações.
 */
function tabelaServicoGetEscalados(vaga) {
  const escalados = Array.isArray(vaga.escalados) ? vaga.escalados : [];
  if (escalados.length) return escalados;
  if (!vaga.policialEscaladoId && !vaga.policialEscalado) return [];
  return [{
    policialId: vaga.policialEscaladoId || '',
    nome: vaga.policialEscalado || '',
    acceptedAt: vaga.updatedAt || vaga.createdAt || ''
  }];
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Retorna a escala do policial ativo dentro de uma vaga específica.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} vaga - Vaga analisada.
 * @param {object|null} policial - Policial ativo da sessão.
 * @returns {object|null} Escala correspondente ao policial ou null.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; cruza em memória a vaga e o policial lidos do LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Consultar a escala por chave de policial no backend, evitando varrer todas as vagas.
 */
function tabelaServicoGetEscalaDoPolicial(vaga, policial) {
  if (!policial) return null;
  return tabelaServicoGetEscalados(vaga).find((escala) => (
    escala.policialId === policial.id ||
    escala.idFuncional === policial.idFuncional ||
    escala.nome === policial.nomeCompleto
  )) || null;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Deriva a situação de presença exibida para cada serviço assumido pelo policial.
 *
 * PARÂMETROS E RETORNO:
 * @param {object|null} escala - Registro de escala do policial na vaga.
 * @returns {{label: string, note: string, className: string}} Estado textual e classe visual.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; lê `presencaConfirmadaAt` do objeto de escala carregado do LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Tratar presença como workflow assinado pelo convênio, com data, usuário e comprovante.
 */
function tabelaServicoGetPresenca(escala) {
  if (escala?.presencaConfirmadaAt) {
    return {
      label: 'Confirmada',
      note: `Em ${tabelaServicoFormatDate(escala.presencaConfirmadaAt)}`,
      className: 'confirmed'
    };
  }

  return {
    label: 'Aguardando',
    note: 'Convênio ainda não confirmou.',
    className: 'pending'
  };
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Monta a lista detalhada de serviços assumidos pelo policial com dados do convênio agregados.
 *
 * PARÂMETROS E RETORNO:
 * @param {object|null} policial - Policial ativo.
 * @returns {Array<object>} Serviços assumidos ordenados por data e horário.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê `cproeis_convenios_vagas` e `cproeis_contratos_convenios` no LocalStorage; não grava dados.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Expor endpoint próprio para histórico tabular com filtros server-side e paginação.
 */
function tabelaServicoGetServicos(policial) {
  const convenioMap = new Map(
    tabelaServicoLoadList(TABELA_SERVICO_STORAGE_CONVENIOS).map((convenio) => [convenio.id, convenio])
  );

  return tabelaServicoLoadList(TABELA_SERVICO_STORAGE_VAGAS)
    .map((vaga) => ({
      ...vaga,
      convenio: convenioMap.get(vaga.convenioId) || {},
      escala: tabelaServicoGetEscalaDoPolicial(vaga, policial)
    }))
    .filter((vaga) => Boolean(vaga.escala))
    .sort((a, b) => (
      String(a.dataServico || '').localeCompare(String(b.dataServico || '')) ||
      String(a.horaInicio || '').localeCompare(String(b.horaInicio || ''))
    ));
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Aplica os filtros da tela sobre a lista já restrita ao policial logado.
 *
 * PARÂMETROS E RETORNO:
 * @param {Array<object>} servicos - Serviços assumidos pelo policial.
 * @returns {Array<object>} Serviços filtrados por texto e período.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; lê somente valores temporários dos campos de filtro no DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Migrar filtros para query string/API quando a listagem for paginada no servidor.
 */
function tabelaServicoApplyFilters(servicos) {
  const text = (document.getElementById('service-table-filter')?.value || '').trim().toLowerCase();
  const start = document.getElementById('service-table-start')?.value || '';
  const end = document.getElementById('service-table-end')?.value || '';

  return servicos.filter((vaga) => {
    const presenca = tabelaServicoGetPresenca(vaga.escala);
    const searchable = [
      tabelaServicoFormatDate(vaga.dataServico),
      vaga.convenio.nome,
      vaga.convenio.numero,
      vaga.nomeServico,
      tabelaServicoClasses[vaga.classe] || vaga.classe,
      tabelaServicoTipos[vaga.tipoServico] || vaga.tipoServico,
      vaga.horaInicio,
      vaga.horaFim,
      vaga.localServico,
      vaga.enderecoServico,
      presenca.label,
      presenca.note
    ].join(' ').toLowerCase();

    if (text && !searchable.includes(text)) return false;
    if (start && String(vaga.dataServico || '') < start) return false;
    if (end && String(vaga.dataServico || '') > end) return false;
    return true;
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Renderiza a tabela detalhada dos serviços assumidos pelo policial.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; escreve as linhas no DOM usando a lista carregada de LocalStorage em memória.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Adicionar paginação, ordenação por coluna e exportação do histórico individual.
 */
function tabelaServicoRender() {
  const body = document.getElementById('tabela-servico-body');
  const count = document.getElementById('tabela-servico-count');
  if (!body) return;

  const filtered = tabelaServicoApplyFilters(tabelaServicoLista);
  if (count) {
    count.textContent = filtered.length
      ? `${filtered.length} serviço(s) assumido(s) encontrado(s).`
      : 'Nenhum serviço assumido encontrado para os filtros atuais.';
  }

  body.innerHTML = '';
  if (!filtered.length) {
    const row = body.insertRow();
    const cell = row.insertCell();
    cell.className = 'empty';
    cell.colSpan = 9;
    cell.textContent = 'Nenhum serviço assumido por este policial.';
    return;
  }

  filtered.forEach((vaga) => {
    const row = body.insertRow();
    const presenca = tabelaServicoGetPresenca(vaga.escala);
    const values = [
      tabelaServicoFormatDate(vaga.dataServico),
      vaga.convenio.nome || vaga.convenio.numero || '-',
      vaga.nomeServico || '-',
      tabelaServicoClasses[vaga.classe] || vaga.classe || '-',
      tabelaServicoTipos[vaga.tipoServico] || vaga.tipoServico || '-',
      `${vaga.horaInicio || '-'} até ${vaga.horaFim || '-'}`,
      vaga.localServico || vaga.enderecoServico || '-'
    ];

    values.forEach((value) => {
      row.insertCell().textContent = value;
    });

    const presencaCell = row.insertCell();
    presencaCell.innerHTML = `
      <span class="presence-badge ${presenca.className}">${tabelaServicoEscape(presenca.label)}</span>
      <span class="status-note">${tabelaServicoEscape(presenca.note)}</span>
    `;

    const statusCell = row.insertCell();
    statusCell.innerHTML = '<span class="service-badge active">Escalado</span>';
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Inicializa a página de tabela de serviço, carregando dados e registrando filtros.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê LocalStorage para obter policial, vagas e convênios; não grava dados nesta tela.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Recarregar dados por API com permissões do policial e auditoria de consulta.
 */
function inicializarTabelaServicoPolicial() {
  const policial = tabelaServicoGetPolicial();
  tabelaServicoLista = tabelaServicoGetServicos(policial);
  tabelaServicoRender();

  document.getElementById('service-table-filter')?.addEventListener('input', tabelaServicoRender);
  document.getElementById('service-table-start')?.addEventListener('change', tabelaServicoRender);
  document.getElementById('service-table-end')?.addEventListener('change', tabelaServicoRender);
}

inicializarTabelaServicoPolicial();
