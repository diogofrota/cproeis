const RAS_P1_KEYS = {
  policiais: 'cproeis_cadastro_policiais',
  acessosP1: 'cproeis_ras_acessos_p1'
};

const RAS_P1_FILTER_IDS = [
  'ras-access-filter-text',
  'ras-access-filter-status'
];

let rasP1ModalState = {
  unidade: '',
  policial: null
};

/**
 * DESCRIÇÃO DA FUNÇÃO: Normaliza registros antigos e atuais de responsáveis P/1 RAS para garantir
 * que todos tenham campos de entrada, saída e status antes da renderização ou nova gravação.
 * PARÂMETROS E RETORNO: Recebe `records` (Array<object>) e retorna Array<object> com campos
 * `dataEntrada`, `dataSaida`, `status`, `criadoEm` e `atualizadoEm` preservados ou preenchidos.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados diretamente; prepara registros lidos de
 * cproeis_ras_acessos_p1 para que o chamador decida se deve persistir a normalização.
 * TODO: Em produção, transformar esta normalização em migration de banco versionada, executada
 * no backend antes de expor os dados para a interface.
 */
function rasP1NormalizeAccessRecords(records) {
  return records.map((record) => {
    const dataEntrada = record.dataEntrada || record.criadoEm || record.atualizadoEm || '';
    const dataSaida = record.dataSaida || '';
    const status = dataSaida ? 'encerrado' : (record.status || 'ativo');

    return {
      ...record,
      dataEntrada,
      dataSaida,
      status,
      criadoEm: record.criadoEm || dataEntrada,
      atualizadoEm: record.atualizadoEm || dataEntrada
    };
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Lê uma lista JSON do LocalStorage para alimentar a página de responsáveis
 * P/1 RAS.
 * PARÂMETROS E RETORNO: Recebe `key` (string) e retorna Array<object>.
 * ARMAZENAMENTO E PERSISTÊNCIA: Lê cproeis_cadastro_policiais ou cproeis_ras_acessos_p1 no
 * LocalStorage.
 * TODO: Em produção, este é um dos pontos de troca por repository/API autenticada com tratamento
 * de erro, paginação e migration server-side.
 */
function rasP1ReadList(key) {
  try {
    const records = JSON.parse(localStorage.getItem(key)) || [];
    return key === RAS_P1_KEYS.acessosP1 ? rasP1NormalizeAccessRecords(records) : records;
  } catch (error) {
    return [];
  }
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Grava a lista de histórico de responsáveis P/1 RAS no armazenamento local.
 * PARÂMETROS E RETORNO: Recebe `key` (string) e `records` (Array<object>); não retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Grava cproeis_ras_acessos_p1 no LocalStorage.
 * TODO: Em produção, este é o ponto de substituição por endpoint transacional que registre
 * auditoria, usuário responsável e evite concorrência entre duas alterações na mesma unidade.
 */
function rasP1SaveList(key, records) {
  const nextRecords = key === RAS_P1_KEYS.acessosP1 ? rasP1NormalizeAccessRecords(records) : records;
  localStorage.setItem(key, JSON.stringify(nextRecords));
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Cria identificador local para registros de histórico da página P/1 RAS.
 * PARÂMETROS E RETORNO: Não recebe parâmetros; retorna string única baseada em timestamp e trecho
 * aleatório.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava dados; o ID é salvo pelo chamador no histórico.
 * TODO: Em produção, usar identificador gerado pelo banco de dados ou serviço de domínio.
 */
function rasP1CreateId() {
  return `ras-p1-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Normaliza texto para filtros e comparação de RG.
 * PARÂMETROS E RETORNO: Recebe `value` (qualquer valor simples) e retorna string sem acentos,
 * em caixa baixa e sem espaços nas pontas.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não acessa armazenamento; transforma apenas valores em memória.
 * TODO: Em produção, alinhar a normalização com índices de busca do backend.
 */
function rasP1Normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Remove caracteres não numéricos do RG para permitir busca com ou sem ponto.
 * PARÂMETROS E RETORNO: Recebe `value` (string) e retorna apenas dígitos.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava dados; usado para comparação local.
 * TODO: Em produção, aplicar máscara oficial e validação no backend.
 */
function rasP1OnlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Escapa conteúdo textual antes de inserir linhas de tabela via innerHTML.
 * PARÂMETROS E RETORNO: Recebe `value` (qualquer valor simples) e retorna string segura para HTML.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava dados; apenas protege renderização no DOM.
 * TODO: Em produção, manter sanitização no frontend e também codificar respostas no backend.
 */
function rasP1EscapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Retorna o identificador local do policial cadastrado.
 * PARÂMETROS E RETORNO: Recebe `policial` (object) e retorna string com id, RG ou nome.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não acessa armazenamento; usa objeto carregado de
 * cproeis_cadastro_policiais.
 * TODO: Em produção, usar chave imutável da base oficial de efetivo.
 */
function rasP1GetPolicialId(policial) {
  return String(policial.id || policial.rg || policial.matricula || policial.nomeCompleto || '').trim();
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Formata nome do policial para tabelas e confirmação da janela de vínculo.
 * PARÂMETROS E RETORNO: Recebe `policial` (object) e retorna string de exibição.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava dados; usa objeto em memória.
 * TODO: Em produção, compartilhar esta formatação com o módulo de Base de Dados.
 */
function rasP1GetPolicialName(policial) {
  return policial.nomeCompleto || policial.nomeGuerra || policial.nome || rasP1GetPolicialId(policial) || 'Policial sem nome';
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Lista as unidades existentes nos policiais cadastrados, formando a base
 * da tabela por batalhão.
 * PARÂMETROS E RETORNO: Recebe `policiais` (Array<object>) e retorna Array<string> ordenado.
 * ARMAZENAMENTO E PERSISTÊNCIA: Lê apenas objetos em memória vindos de cproeis_cadastro_policiais.
 * TODO: Em produção, substituir por tabela oficial de unidades com status ativo/inativo.
 */
function rasP1GetUnits(policiais) {
  return [...new Set(policiais.map((policial) => String(policial.unidade || '').trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Localiza o responsável ativo de uma unidade, respeitando a regra de apenas
 * um policial ativo por unidade.
 * PARÂMETROS E RETORNO: Recebe `acessos` (Array<object>) e `unidade` (string); retorna object ou
 * undefined.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não acessa LocalStorage diretamente; usa histórico carregado de
 * cproeis_ras_acessos_p1.
 * TODO: Em produção, impor esta unicidade por constraint no banco de dados.
 */
function rasP1GetActiveAccess(acessos, unidade) {
  return acessos.find((acesso) => acesso.unidade === unidade && acesso.status === 'ativo' && !acesso.dataSaida);
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Busca um policial pelo RG digitado na janela de vínculo.
 * PARÂMETROS E RETORNO: Recebe `policiais` (Array<object>) e `rg` (string); retorna object ou
 * undefined quando não existe na base.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; consulta array carregado de cproeis_cadastro_policiais.
 * TODO: Em produção, buscar por endpoint seguro e bloquear registros inativos ou sem permissão.
 */
function rasP1FindPolicialByRg(policiais, rg) {
  const target = rasP1OnlyDigits(rg);
  return policiais.find((policial) => rasP1OnlyDigits(policial.rg) === target);
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Formata uma data ISO para leitura em tabela.
 * PARÂMETROS E RETORNO: Recebe `dateValue` (string ISO ou yyyy-mm-dd) e retorna string pt-BR.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não acessa armazenamento; apenas formata valor recebido.
 * TODO: Em produção, usar serviço de data/hora padronizado e timezone oficial do sistema.
 */
function rasP1FormatDate(dateValue) {
  if (!dateValue) return '-';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleDateString('pt-BR');
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Lê os filtros atuais da tabela por unidade.
 * PARÂMETROS E RETORNO: Não recebe parâmetros; retorna object com texto e situação.
 * ARMAZENAMENTO E PERSISTÊNCIA: Lê somente campos do DOM; não grava LocalStorage.
 * TODO: Em produção, refletir filtros na URL para preservar navegação e auditoria de consultas.
 */
function rasP1GetFilters() {
  return {
    text: rasP1Normalize(document.getElementById('ras-access-filter-text')?.value || ''),
    status: document.getElementById('ras-access-filter-status')?.value || ''
  };
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Filtra unidades da tabela por texto e existência de responsável ativo.
 * PARÂMETROS E RETORNO: Recebe `units`, `acessos` e `policiais`; retorna Array<string>.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; filtra em memória dados carregados de LocalStorage.
 * TODO: Em produção, mover filtros para API paginada quando houver muitas unidades.
 */
function rasP1FilterUnits(units, acessos, policiais) {
  const filters = rasP1GetFilters();

  return units.filter((unit) => {
    const active = rasP1GetActiveAccess(acessos, unit);
    const linked = Boolean(active);
    const searchable = [
      unit,
      active?.nomePolicial,
      active?.rg,
      active?.postoGraduacao,
      ...policiais
        .filter((policial) => policial.unidade === unit)
        .flatMap((policial) => [policial.nomeCompleto, policial.nomeGuerra, policial.rg])
    ].map(rasP1Normalize).join(' ');

    if (filters.text && !searchable.includes(filters.text)) return false;
    if (filters.status === 'linked' && !linked) return false;
    if (filters.status === 'unlinked' && linked) return false;
    return true;
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Renderiza a tabela principal por batalhão/unidade.
 * PARÂMETROS E RETORNO: Recebe `policiais` e `acessos` como arrays; não retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; escreve linhas no DOM a partir de
 * cproeis_cadastro_policiais e cproeis_ras_acessos_p1.
 * TODO: Em produção, exibir paginação, ordenação e status oficial da unidade.
 */
function rasP1RenderUnitTable(policiais, acessos) {
  const body = document.getElementById('ras-access-body');
  const count = document.getElementById('ras-access-count');
  const units = rasP1GetUnits(policiais);
  const filteredUnits = rasP1FilterUnits(units, acessos, policiais);

  count.textContent = `${filteredUnits.length} unidades exibidas de ${units.length} cadastradas.`;

  if (!units.length) {
    body.innerHTML = '<tr><td class="empty-row" colspan="6">Nenhuma unidade encontrada na Base de Dados.</td></tr>';
    return;
  }

  if (!filteredUnits.length) {
    body.innerHTML = '<tr><td class="empty-row" colspan="6">Nenhuma unidade encontrada para os filtros informados.</td></tr>';
    return;
  }

  body.innerHTML = filteredUnits.map((unit) => {
    const active = rasP1GetActiveAccess(acessos, unit);

    return `
      <tr>
        <td><strong>${rasP1EscapeHtml(unit)}</strong></td>
        <td>${rasP1EscapeHtml(active?.nomePolicial || 'Sem responsável')}</td>
        <td>${rasP1EscapeHtml(active?.rg || '-')}</td>
        <td>${rasP1EscapeHtml(active?.postoGraduacao || '-')}</td>
        <td>${rasP1EscapeHtml(rasP1FormatDate(active?.dataEntrada))}</td>
        <td>
          <div class="row-actions">
            <button type="button" class="action-button link-action" data-open-link-modal="${rasP1EscapeHtml(unit)}">${active ? 'Trocar vinculação' : 'Vincular'}</button>
            <button type="button" class="action-button unlink-action" data-close-access="${rasP1EscapeHtml(unit)}" ${active ? '' : 'disabled'}>Desvincular</button>
            <a class="action-button history-action" href="historico-acessos-p1.html?unidade=${encodeURIComponent(unit)}">Histórico</a>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Recarrega a página com dados atuais de policiais e histórico de responsáveis.
 * PARÂMETROS E RETORNO: Não recebe parâmetros; retorna object com arrays carregados.
 * ARMAZENAMENTO E PERSISTÊNCIA: Lê cproeis_cadastro_policiais e cproeis_ras_acessos_p1.
 * TODO: Em produção, sincronizar estado por API e tratar falhas de rede com feedback operacional.
 */
function rasP1RefreshView() {
  const policiais = rasP1ReadList(RAS_P1_KEYS.policiais);
  const acessos = rasP1ReadList(RAS_P1_KEYS.acessosP1);

  rasP1RenderUnitTable(policiais, acessos);

  return { policiais, acessos };
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Abre a janela de vínculo para uma unidade específica.
 * PARÂMETROS E RETORNO: Recebe `unidade` (string); não retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; prepara estado temporário no DOM e em variável local.
 * TODO: Em produção, carregar contexto da unidade pelo backend antes de permitir alteração.
 */
function rasP1OpenModal(unidade) {
  rasP1ModalState = { unidade, policial: null };
  document.getElementById('ras-access-modal-unit').value = unidade;
  document.getElementById('ras-access-modal-subtitle').textContent = `Unidade: ${unidade}`;
  document.getElementById('ras-access-modal-rg').value = '';
  document.getElementById('ras-access-found-police').hidden = true;
  document.getElementById('ras-access-found-police').innerHTML = '';
  document.getElementById('ras-access-modal-feedback').textContent = '';
  document.getElementById('ras-access-confirm-link').disabled = true;
  document.getElementById('ras-access-modal').hidden = false;
  document.getElementById('ras-access-modal-rg').focus();
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Fecha a janela de vínculo e limpa estado temporário.
 * PARÂMETROS E RETORNO: Não recebe parâmetros nem retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava LocalStorage; altera somente DOM e variável local.
 * TODO: Em produção, descartar também qualquer estado assíncrono pendente da busca.
 */
function rasP1CloseModal() {
  rasP1ModalState = { unidade: '', policial: null };
  document.getElementById('ras-access-modal').hidden = true;
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Busca o RG digitado na Base de Dados e exibe o nome antes de liberar
 * o botão de vínculo.
 * PARÂMETROS E RETORNO: Não recebe parâmetros nem retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Lê cproeis_cadastro_policiais; não grava dados.
 * TODO: Em produção, validar situação funcional e unidade do policial antes de permitir vínculo.
 */
function rasP1SearchRg() {
  const feedback = document.getElementById('ras-access-modal-feedback');
  const foundCard = document.getElementById('ras-access-found-police');
  const rg = document.getElementById('ras-access-modal-rg').value;
  const policial = rasP1FindPolicialByRg(rasP1ReadList(RAS_P1_KEYS.policiais), rg);

  if (!policial) {
    rasP1ModalState.policial = null;
    foundCard.hidden = true;
    foundCard.innerHTML = '';
    document.getElementById('ras-access-confirm-link').disabled = true;
    feedback.textContent = 'RG não encontrado na Base de Dados.';
    feedback.classList.remove('ok');
    return;
  }

  rasP1ModalState.policial = policial;
  foundCard.hidden = false;
  foundCard.innerHTML = `
    <strong>${rasP1EscapeHtml(rasP1GetPolicialName(policial))}</strong>
    <span>RG ${rasP1EscapeHtml(policial.rg || '-')} | ${rasP1EscapeHtml(policial.postoGraduacao || '-')} | ${rasP1EscapeHtml(policial.unidade || '-')}</span>
  `;
  document.getElementById('ras-access-confirm-link').disabled = false;
  feedback.textContent = 'Policial encontrado. Confirme para vincular.';
  feedback.classList.add('ok');
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Confirma o vínculo do policial encontrado como responsável ativo da unidade,
 * encerrando automaticamente eventual responsável anterior.
 * PARÂMETROS E RETORNO: Recebe `event` (SubmitEvent); não retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Lê e grava cproeis_ras_acessos_p1 no LocalStorage, registrando
 * dataEntrada para o novo responsável e dataSaida para o anterior.
 * TODO: Em produção, fazer esta substituição em transação no backend para garantir um único ativo.
 */
function rasP1ConfirmLink(event) {
  event.preventDefault();

  const feedback = document.getElementById('ras-access-modal-feedback');
  const policial = rasP1ModalState.policial;
  const unidade = rasP1ModalState.unidade;

  if (!policial || !unidade) {
    feedback.textContent = 'Busque um RG válido antes de vincular.';
    feedback.classList.remove('ok');
    return;
  }

  const now = new Date().toISOString();
  const acessos = rasP1ReadList(RAS_P1_KEYS.acessosP1).map((acesso) => {
    if (acesso.unidade === unidade && acesso.status === 'ativo' && !acesso.dataSaida) {
      return { ...acesso, status: 'encerrado', dataSaida: now, atualizadoEm: now };
    }
    return acesso;
  });

  acessos.push({
    id: rasP1CreateId(),
    policialId: rasP1GetPolicialId(policial),
    rg: policial.rg || '',
    nomePolicial: rasP1GetPolicialName(policial),
    postoGraduacao: policial.postoGraduacao || '',
    unidade,
    status: 'ativo',
    dataEntrada: now,
    dataSaida: '',
    criadoEm: now,
    atualizadoEm: now
  });

  rasP1SaveList(RAS_P1_KEYS.acessosP1, acessos);
  rasP1CloseModal();
  document.getElementById('ras-access-feedback').textContent = 'Responsável P/1 RAS vinculado com data de entrada registrada.';
  document.getElementById('ras-access-feedback').classList.add('ok');
  rasP1RefreshView();
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Registra a data de saída do responsável ativo da unidade.
 * PARÂMETROS E RETORNO: Recebe `unidade` (string); não retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Atualiza cproeis_ras_acessos_p1 no LocalStorage, marcando status
 * encerrado e dataSaida.
 * TODO: Em produção, exigir confirmação, motivo de saída e usuário autenticado.
 */
function rasP1CloseAccess(unidade) {
  const now = new Date().toISOString();
  const acessos = rasP1ReadList(RAS_P1_KEYS.acessosP1).map((acesso) => {
    if (acesso.unidade === unidade && acesso.status === 'ativo' && !acesso.dataSaida) {
      return { ...acesso, status: 'encerrado', dataSaida: now, atualizadoEm: now };
    }
    return acesso;
  });

  rasP1SaveList(RAS_P1_KEYS.acessosP1, acessos);
  document.getElementById('ras-access-feedback').textContent = 'Saída do responsável P/1 RAS registrada.';
  document.getElementById('ras-access-feedback').classList.add('ok');
  rasP1RefreshView();
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Trata cliques da tabela por unidade, abrindo a janela de vínculo ou registrando
 * desvinculação do responsável ativo.
 * PARÂMETROS E RETORNO: Recebe `event` (MouseEvent); não retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: A abertura da janela não grava dados; a desvinculação chama
 * rasP1CloseAccess e atualiza cproeis_ras_acessos_p1 no LocalStorage.
 * TODO: Em produção, usar componentes de ação com confirmação e logs de auditoria.
 */
function rasP1HandleTableClick(event) {
  const openButton = event.target.closest('[data-open-link-modal]');
  const closeButton = event.target.closest('[data-close-access]');

  if (openButton) rasP1OpenModal(openButton.dataset.openLinkModal);
  if (closeButton && !closeButton.disabled) rasP1CloseAccess(closeButton.dataset.closeAccess);
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Liga filtros, botões e eventos da janela de vínculo.
 * PARÂMETROS E RETORNO: Não recebe parâmetros nem retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados diretamente; conecta eventos que leem e atualizam
 * LocalStorage conforme a ação do usuário.
 * TODO: Em produção, adicionar debounce na busca e mensagens de erro vindas da API.
 */
function rasP1BindEvents() {
  RAS_P1_FILTER_IDS.forEach((id) => {
    const input = document.getElementById(id);
    input?.addEventListener('input', rasP1RefreshView);
    input?.addEventListener('change', rasP1RefreshView);
  });

  document.getElementById('ras-access-clear-filters')?.addEventListener('click', () => {
    RAS_P1_FILTER_IDS.forEach((id) => {
      const input = document.getElementById(id);
      if (input) input.value = '';
    });
    rasP1RefreshView();
  });

  document.getElementById('ras-access-body')?.addEventListener('click', rasP1HandleTableClick);
  document.getElementById('ras-access-modal-close')?.addEventListener('click', rasP1CloseModal);
  document.getElementById('ras-access-search-rg')?.addEventListener('click', rasP1SearchRg);
  document.getElementById('ras-access-modal-rg')?.addEventListener('input', () => {
    rasP1ModalState.policial = null;
    document.getElementById('ras-access-confirm-link').disabled = true;
    document.getElementById('ras-access-found-police').hidden = true;
  });
  document.getElementById('ras-access-modal-form')?.addEventListener('submit', rasP1ConfirmLink);
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Inicializa a página de responsáveis P/1 RAS.
 * PARÂMETROS E RETORNO: Não recebe parâmetros nem retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Lê LocalStorage para renderização inicial e conecta ações que
 * gravam cproeis_ras_acessos_p1.
 * TODO: Em produção, aguardar carregamento autenticado das permissões antes de renderizar ações.
 */
function rasP1Init() {
  rasP1BindEvents();
  rasP1RefreshView();
}

document.addEventListener('DOMContentLoaded', rasP1Init);
