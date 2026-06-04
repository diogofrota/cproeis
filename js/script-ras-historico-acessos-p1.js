const RAS_P1_HISTORY_KEY = 'cproeis_ras_acessos_p1';
let rasP1HistoryUnit = '';

/**
 * DESCRIÇÃO DA FUNÇÃO: Normaliza registros do histórico P/1 RAS para manter compatibilidade com
 * dados antigos e atuais gravados no LocalStorage.
 * PARÂMETROS E RETORNO: Recebe `records` (Array<object>) e retorna Array<object> com dataEntrada,
 * dataSaida e status padronizados.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; ajusta em memória os registros lidos de
 * cproeis_ras_acessos_p1.
 * TODO: Em produção, substituir por migration/versionamento de schema no banco de dados.
 */
function rasP1HistoryNormalizeRecords(records) {
  return records.map((record) => {
    const dataEntrada = record.dataEntrada || record.criadoEm || record.atualizadoEm || '';
    const dataSaida = record.dataSaida || '';
    const status = dataSaida ? 'encerrado' : (record.status || 'ativo');

    return {
      ...record,
      dataEntrada,
      dataSaida,
      status
    };
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Lê o histórico de responsáveis P/1 RAS gravado localmente.
 * PARÂMETROS E RETORNO: Não recebe parâmetros; retorna Array<object>.
 * ARMAZENAMENTO E PERSISTÊNCIA: Lê cproeis_ras_acessos_p1 no LocalStorage.
 * TODO: Em produção, trocar este ponto por repository/API paginada de auditoria com tratamento
 * de erro e filtros server-side.
 */
function rasP1HistoryRead() {
  try {
    return rasP1HistoryNormalizeRecords(JSON.parse(localStorage.getItem(RAS_P1_HISTORY_KEY)) || []);
  } catch (error) {
    return [];
  }
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Normaliza texto para busca no histórico.
 * PARÂMETROS E RETORNO: Recebe `value` (qualquer valor simples) e retorna string normalizada.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não acessa armazenamento; transforma apenas dados em memória.
 * TODO: Em produção, alinhar esta normalização aos índices de busca do backend.
 */
function rasP1HistoryNormalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Escapa valores exibidos na tabela de histórico.
 * PARÂMETROS E RETORNO: Recebe `value` (qualquer valor simples) e retorna string segura para HTML.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava dados; protege renderização no DOM.
 * TODO: Em produção, manter codificação também nas respostas da API.
 */
function rasP1HistoryEscapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Formata datas ISO do histórico para exibição.
 * PARÂMETROS E RETORNO: Recebe `dateValue` (string) e retorna data pt-BR ou hífen.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não acessa armazenamento; apenas formata o valor recebido.
 * TODO: Em produção, padronizar timezone conforme configuração global do sistema.
 */
function rasP1HistoryFormatDate(dateValue) {
  if (!dateValue) return '-';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleDateString('pt-BR');
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Resolve a unidade recebida pela URL para que a página mostre somente
 * o histórico da linha escolhida na tabela de responsáveis.
 * PARÂMETROS E RETORNO: Não recebe parâmetros; retorna string com a unidade decodificada ou vazia.
 * ARMAZENAMENTO E PERSISTÊNCIA: Lê somente window.location.search; não grava LocalStorage.
 * TODO: Em produção, validar a unidade por ID oficial de batalhão/unidade em vez de nome textual.
 */
function rasP1HistoryGetUrlUnit() {
  const params = new URLSearchParams(window.location.search);
  return params.get('unidade') || '';
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Filtra registros exclusivamente pela unidade aberta a partir da linha.
 * PARÂMETROS E RETORNO: Recebe `records` (Array<object>) e retorna Array<object> filtrado.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; filtra em memória registros de cproeis_ras_acessos_p1.
 * TODO: Em produção, consultar a API por id de unidade e impedir histórico cruzado entre unidades.
 */
function rasP1HistoryFilterByUnit(records) {
  const targetUnit = rasP1HistoryNormalize(rasP1HistoryUnit);

  if (!targetUnit) return [];
  return records.filter((record) => rasP1HistoryNormalize(record.unidade) === targetUnit);
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Renderiza a tabela de histórico de mudanças P/1 RAS.
 * PARÂMETROS E RETORNO: Não recebe parâmetros nem retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Lê cproeis_ras_acessos_p1 no LocalStorage e escreve linhas no DOM.
 * TODO: Em produção, incluir usuário responsável, motivo e identificador do processo de alteração.
 */
function rasP1HistoryRender() {
  const body = document.getElementById('ras-access-history-body');
  const count = document.getElementById('ras-access-history-count');
  const title = document.getElementById('ras-access-history-title');
  const records = rasP1HistoryRead();
  const filtered = rasP1HistoryFilterByUnit(records)
    .sort((a, b) => String(b.dataEntrada || '').localeCompare(String(a.dataEntrada || '')));

  if (title && rasP1HistoryUnit) title.textContent = `Histórico de mudanças - ${rasP1HistoryUnit}`;
  count.textContent = rasP1HistoryUnit
    ? `${filtered.length} registro(s) da unidade ${rasP1HistoryUnit}.`
    : 'Abra o histórico pelo botão da unidade na tabela de responsáveis.';

  if (!rasP1HistoryUnit) {
    body.innerHTML = '<tr><td class="empty-row" colspan="6">Selecione uma unidade na página P/1 Unidade.</td></tr>';
    return;
  }

  if (!records.length) {
    body.innerHTML = '<tr><td class="empty-row" colspan="6">Nenhuma mudança registrada para esta unidade.</td></tr>';
    return;
  }

  if (!filtered.length) {
    body.innerHTML = '<tr><td class="empty-row" colspan="6">Nenhuma mudança registrada para esta unidade.</td></tr>';
    return;
  }

  body.innerHTML = filtered.map((record) => `
    <tr>
      <td>${rasP1HistoryEscapeHtml(record.unidade)}</td>
      <td>${rasP1HistoryEscapeHtml(record.nomePolicial)}</td>
      <td>${rasP1HistoryEscapeHtml(record.rg || '-')}</td>
      <td>${rasP1HistoryEscapeHtml(rasP1HistoryFormatDate(record.dataEntrada))}</td>
      <td>${rasP1HistoryEscapeHtml(rasP1HistoryFormatDate(record.dataSaida))}</td>
      <td>${rasP1HistoryEscapeHtml(record.status || '-')}</td>
    </tr>
  `).join('');
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Inicializa a página de histórico de responsáveis P/1 RAS.
 * PARÂMETROS E RETORNO: Não recebe parâmetros nem retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Lê cproeis_ras_acessos_p1 para renderização inicial.
 * TODO: Em produção, carregar dados somente após validar permissões de auditoria.
 */
function rasP1HistoryInit() {
  rasP1HistoryUnit = rasP1HistoryGetUrlUnit();
  rasP1HistoryRender();
}

document.addEventListener('DOMContentLoaded', rasP1HistoryInit);
