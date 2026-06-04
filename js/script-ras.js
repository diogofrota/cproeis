const RAS_STORAGE_KEYS = {
  policiais: 'cproeis_cadastro_policiais',
  contratos: 'cproeis_ras_contratos',
  liberacoes: 'cproeis_ras_liberacoes',
  eventos: 'cproeis_ras_eventos',
  acessosP1: 'cproeis_ras_acessos_p1'
};

const RAS_CURRENCY = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

const RAS_ACCESS_FILTER_IDS = [
  'ras-access-filter-text',
  'ras-access-filter-unit',
  'ras-access-filter-status'
];

const RAS_CONTRACT_CLASSES = [
  { classe: 'A', grupo: 'Oficiais superiores' },
  { classe: 'B', grupo: 'Oficiais intermediários e subalternos' },
  { classe: 'C', grupo: 'Praças subtenentes e sargentos' },
  { classe: 'D', grupo: 'Cabos e soldados' }
];

const RAS_SERVICE_HOURS = ['24', '12', '8', '6'];

/**
 * DESCRIÇÃO DA FUNÇÃO: Lê uma lista JSON do LocalStorage e normaliza falhas para array vazio,
 * mantendo o módulo RAS funcionando mesmo quando a chave ainda não existe ou foi corrompida.
 * PARÂMETROS E RETORNO: Recebe `key` (string) com o nome da chave local; retorna Array<object>.
 * ARMAZENAMENTO E PERSISTÊNCIA: Lê somente LocalStorage nas chaves cproeis_ras_*.
 * TODO: Em produção, substituir esta leitura local por endpoint autenticado com tratamento de
 * erro, paginação e trilha de auditoria por perfil.
 */
function rasReadList(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    return [];
  }
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Persiste uma lista de registros do módulo RAS no navegador, simulando
 * a base de dados do fluxo enquanto o sistema ainda é um protótipo local.
 * PARÂMETROS E RETORNO: Recebe `key` (string) e `records` (Array<object>); não retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Grava LocalStorage nas chaves cproeis_ras_contratos,
 * cproeis_ras_liberacoes ou cproeis_ras_eventos.
 * TODO: Em produção, trocar por requisição assíncrona ao backend com validação server-side,
 * controle transacional e registro do usuário responsável pela alteração.
 */
function rasSaveList(key, records) {
  localStorage.setItem(key, JSON.stringify(records));
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Cria um identificador local único para relacionar contratos, liberações
 * e eventos sem depender de um banco de dados real.
 * PARÂMETROS E RETORNO: Não recebe parâmetros; retorna string com timestamp e trecho aleatório.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não acessa armazenamento; o ID retornado é gravado depois nos
 * arrays persistidos pelo chamador.
 * TODO: Em produção, usar identificadores gerados pelo banco ou serviço de domínio para evitar
 * colisões e facilitar auditoria distribuída.
 */
function rasCreateId() {
  return `ras-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Calcula o saldo disponível para uma unidade específica antes da P/1
 * cadastrar novo evento RAS.
 * PARÂMETROS E RETORNO: Recebe `unit` (string), `liberacoes` (Array<object>) e `eventos`
 * (Array<object>); retorna number com o saldo da unidade.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não acessa LocalStorage diretamente; usa arrays já carregados.
 * TODO: Em produção, validar este saldo no servidor no momento da criação para bloquear corrida
 * entre múltiplos usuários da mesma unidade.
 */
function rasGetUnitBalance(unit, liberacoes, eventos) {
  const normalizedUnit = unit.trim().toLowerCase();
  const approved = liberacoes
    .filter((liberacao) => liberacao.unidade.trim().toLowerCase() === normalizedUnit)
    .reduce((total, liberacao) => total + Number(liberacao.quantidade || 0), 0);
  const used = eventos
    .filter((evento) => evento.unidade.trim().toLowerCase() === normalizedUnit)
    .reduce((total, evento) => total + Number(evento.quantidade || 0), 0);

  return approved - used;
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Escapa textos exibidos na tabela RAS para impedir que valores digitados
 * em formulários sejam interpretados como HTML.
 * PARÂMETROS E RETORNO: Recebe `value` (qualquer tipo simples) e retorna string segura para
 * interpolação em innerHTML.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava dados; apenas transforma valores em memória.
 * TODO: Em produção, manter sanitização no frontend e aplicar validação/codificação também no
 * backend antes de persistir ou devolver dados para múltiplos usuários.
 */
function rasEscapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Normaliza texto para comparação em filtros, removendo diferenças de
 * caixa, acentos e espaços excedentes.
 * PARÂMETROS E RETORNO: Recebe `value` (qualquer valor simples) e retorna string normalizada.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava dados; transforma apenas valores em memória.
 * TODO: Em produção, mover filtros textuais para o backend com normalização equivalente no banco.
 */
function rasNormalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Retorna um identificador estável do policial cadastrado para vincular
 * acesso P/1 RAS sem permitir cadastro manual fora da base de dados.
 * PARÂMETROS E RETORNO: Recebe `policial` (object) e retorna string com id, RG, matrícula ou
 * nome como último recurso.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não acessa armazenamento; trabalha com objeto carregado de
 * cproeis_cadastro_policiais.
 * TODO: Em produção, usar chave primária imutável da base oficial de efetivo em vez de fallback
 * por campos textuais.
 */
function rasGetPolicialId(policial) {
  return String(policial.id || policial.rg || policial.matricula || policial.nomeCompleto || '').trim();
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Formata o nome do policial para opções e tabelas do controle de acesso
 * P/1 RAS.
 * PARÂMETROS E RETORNO: Recebe `policial` (object) e retorna string com nome completo, nome de
 * guerra ou identificador disponível.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava dados; usa somente o objeto em memória.
 * TODO: Em produção, padronizar apresentação do efetivo por componente compartilhado com a base
 * de dados de policiais.
 */
function rasGetPolicialName(policial) {
  return policial.nomeCompleto || policial.nomeGuerra || policial.nome || rasGetPolicialId(policial) || 'Policial sem nome';
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Localiza um policial da base cadastrada pelo identificador selecionado
 * no formulário de acesso P/1 RAS.
 * PARÂMETROS E RETORNO: Recebe `policiais` (Array<object>) e `id` (string); retorna object ou
 * undefined quando não encontra correspondência.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não acessa LocalStorage diretamente; valida em memória dados
 * vindos de cproeis_cadastro_policiais.
 * TODO: Em produção, validar a existência do policial no backend no momento da concessão do
 * perfil, evitando vínculo com registro removido ou inativo.
 */
function rasFindPolicialById(policiais, id) {
  return policiais.find((policial) => rasGetPolicialId(policial) === id);
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Extrai as unidades existentes na base de policiais para servir como
 * lista autorizada de vínculo P/1 RAS.
 * PARÂMETROS E RETORNO: Recebe `policiais` (Array<object>) e retorna Array<string> ordenado
 * com unidades únicas.
 * ARMAZENAMENTO E PERSISTÊNCIA: Lê somente objetos em memória carregados de
 * cproeis_cadastro_policiais; não grava dados.
 * TODO: Em produção, substituir esta derivação por uma tabela oficial de unidades ativa no
 * backend, com validação de unidade extinta, agregada ou renomeada.
 */
function rasGetRegisteredUnits(policiais) {
  return [...new Set(policiais.map((policial) => String(policial.unidade || '').trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Cria um mapa de acessos por policial para localizar rapidamente se cada
 * linha da tabela já está vinculada ao RAS.
 * PARÂMETROS E RETORNO: Recebe `acessos` (Array<object>) e retorna Map onde a chave é policialId.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não acessa LocalStorage; usa dados já carregados de
 * cproeis_ras_acessos_p1.
 * TODO: Em produção, carregar vínculos já agregados por policial via API para evitar recomputar
 * estados grandes no navegador.
 */
function rasGetAccessMap(acessos) {
  return new Map(acessos.map((acesso) => [acesso.policialId, acesso]));
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Lê os filtros da tabela de acessos P/1 RAS, seguindo o padrão da tabela
 * de contratos com pesquisa textual e selects estruturados.
 * PARÂMETROS E RETORNO: Não recebe parâmetros; retorna object com `text`, `unit` e `status`.
 * ARMAZENAMENTO E PERSISTÊNCIA: Lê apenas valores atuais do DOM; não grava LocalStorage.
 * TODO: Em produção, refletir filtros na URL ou estado de rota para permitir auditoria e retorno
 * à mesma consulta após navegação.
 */
function rasGetAccessFilters() {
  return {
    text: rasNormalizeText(document.getElementById('ras-access-filter-text')?.value || ''),
    unit: document.getElementById('ras-access-filter-unit')?.value || '',
    status: document.getElementById('ras-access-filter-status')?.value || ''
  };
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Atualiza o filtro de unidade usando somente unidades encontradas na base
 * de policiais cadastrados.
 * PARÂMETROS E RETORNO: Recebe `policiais` (Array<object>); não retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Lê array em memória derivado de cproeis_cadastro_policiais e
 * escreve opções no DOM; não grava dados.
 * TODO: Em produção, consumir catálogo oficial de unidades e aplicar permissão para limitar a
 * visão do gestor às unidades sob sua responsabilidade.
 */
function rasRenderAccessUnitFilter(policiais) {
  const select = document.getElementById('ras-access-filter-unit');
  if (!select) return;

  const currentValue = select.value;
  const units = rasGetRegisteredUnits(policiais);
  select.innerHTML = '<option value="">Todas</option>' + units
    .map((unit) => `<option value="${rasEscapeHtml(unit)}">${rasEscapeHtml(unit)}</option>`)
    .join('');

  if (units.includes(currentValue)) select.value = currentValue;
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Aplica os filtros da tabela de acessos sobre todos os policiais cadastrados.
 * PARÂMETROS E RETORNO: Recebe `policiais` (Array<object>) e `acessos` (Array<object>); retorna
 * Array<object> com os policiais visíveis.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava LocalStorage; filtra em memória dados carregados
 * de cproeis_cadastro_policiais e cproeis_ras_acessos_p1.
 * TODO: Em produção, executar essa filtragem no backend com paginação para bases grandes.
 */
function rasGetFilteredAccessPoliciais(policiais, acessos) {
  const filters = rasGetAccessFilters();
  const accessMap = rasGetAccessMap(acessos);

  return policiais.filter((policial) => {
    const policialId = rasGetPolicialId(policial);
    const linked = accessMap.has(policialId);
    const searchable = [
      rasGetPolicialName(policial),
      policial.rg,
      policial.idFuncional,
      policial.postoGraduacao,
      policial.unidade
    ].map(rasNormalizeText).join(' ');

    if (filters.text && !searchable.includes(filters.text)) return false;
    if (filters.unit && policial.unidade !== filters.unit) return false;
    if (filters.status === 'linked' && !linked) return false;
    if (filters.status === 'unlinked' && linked) return false;
    return true;
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Monta a tabela consolidada de registros RAS, permitindo conferir a ordem
 * operacional contrato -> liberação GSI -> evento P/1.
 * PARÂMETROS E RETORNO: Recebe arrays de contratos, liberações e eventos; não retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; lê arrays fornecidos e escreve linhas no DOM.
 * TODO: Em produção, separar a listagem em consultas paginadas e filtros por exercício, unidade,
 * status de liberação e tipo de escala.
 */
function rasRenderRecords(contratos, liberacoes, eventos) {
  const body = document.getElementById('ras-records-body');
  const rows = [
    ...contratos.map((contrato) => ({
      tipo: 'Contrato',
      unidade: 'Estado',
      descricao: `${contrato.exercicio} - ${contrato.numeroContrato || 'Contrato anual'} - ${RAS_CURRENCY.format(contrato.valorAnual)}`,
      classe: '-',
      quantidade: '-',
      status: 'Orçamento cadastrado'
    })),
    ...liberacoes.map((liberacao) => ({
      tipo: 'Liberação GSI',
      unidade: liberacao.unidade,
      descricao: liberacao.fonte,
      classe: liberacao.classe,
      quantidade: liberacao.quantidade,
      status: 'Liberado para P/1'
    })),
    ...eventos.map((evento) => ({
      tipo: 'Evento P/1',
      unidade: evento.unidade,
      descricao: `${evento.nome} - ${evento.data} - escala ${evento.tipoEscala}`,
      classe: evento.classe,
      quantidade: evento.quantidade,
      status: 'Criado'
    }))
  ];

  if (!rows.length) {
    body.innerHTML = '<tr><td class="empty-row" colspan="6">Nenhum registro RAS cadastrado.</td></tr>';
    return;
  }

  body.innerHTML = rows.map((row) => `
    <tr>
      <td>${rasEscapeHtml(row.tipo)}</td>
      <td>${rasEscapeHtml(row.unidade)}</td>
      <td>${rasEscapeHtml(row.descricao)}</td>
      <td>${rasEscapeHtml(row.classe)}</td>
      <td>${rasEscapeHtml(row.quantidade)}</td>
      <td>${rasEscapeHtml(row.status)}</td>
    </tr>
  `).join('');
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Renderiza a tabela completa de policiais para gestão de acesso P/1 RAS,
 * mostrando vínculo atual, seletor de unidade e ações de vincular/desvincular por linha.
 * PARÂMETROS E RETORNO: Recebe `policiais` (Array<object>) e `acessos` (Array<object>); não
 * retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; cruza cproeis_cadastro_policiais com
 * cproeis_ras_acessos_p1 em memória e escreve linhas no DOM.
 * TODO: Em produção, adicionar paginação, ordenação server-side e política de exibição por
 * perfil para evitar listar efetivo fora da responsabilidade do gestor.
 */
function rasRenderAccessTable(policiais, acessos) {
  const body = document.getElementById('ras-access-body');
  const count = document.getElementById('ras-access-count');
  const filteredPoliciais = rasGetFilteredAccessPoliciais(policiais, acessos);
  const accessMap = rasGetAccessMap(acessos);
  const units = rasGetRegisteredUnits(policiais);

  if (count) {
    count.textContent = `${filteredPoliciais.length} policiais exibidos de ${policiais.length} cadastrados.`;
  }

  if (!policiais.length) {
    body.innerHTML = '<tr><td class="empty-row" colspan="7">Nenhum policial cadastrado na Base de Dados.</td></tr>';
    return;
  }

  if (!filteredPoliciais.length) {
    body.innerHTML = '<tr><td class="empty-row" colspan="7">Nenhum policial encontrado para os filtros informados.</td></tr>';
    return;
  }

  body.innerHTML = filteredPoliciais.map((policial) => {
    const policialId = rasGetPolicialId(policial);
    const acesso = accessMap.get(policialId);
    const selectedUnit = acesso?.unidade || policial.unidade || '';
    const unitOptions = units.map((unit) => `
      <option value="${rasEscapeHtml(unit)}" ${unit === selectedUnit ? 'selected' : ''}>${rasEscapeHtml(unit)}</option>
    `).join('');

    return `
      <tr>
        <td><strong>${rasEscapeHtml(rasGetPolicialName(policial))}</strong></td>
        <td>${rasEscapeHtml(policial.rg || '-')}</td>
        <td>${rasEscapeHtml(policial.postoGraduacao || '-')}</td>
        <td>${rasEscapeHtml(policial.unidade || '-')}</td>
        <td>${rasEscapeHtml(acesso?.unidade || 'Sem vínculo')}</td>
        <td>
          <select class="inline-unit-select" data-unit-select="${rasEscapeHtml(policialId)}" ${units.length ? '' : 'disabled'}>
            <option value="">Selecione</option>
            ${unitOptions}
          </select>
        </td>
        <td>
          <div class="row-actions">
            <button type="button" class="action-button link-action" data-ras-action="link" data-policial-id="${rasEscapeHtml(policialId)}">Vincular</button>
            <button type="button" class="action-button unlink-action" data-ras-action="unlink" data-policial-id="${rasEscapeHtml(policialId)}" ${acesso ? '' : 'disabled'}>Desvincular</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Recarrega o estado do RAS a partir do LocalStorage e sincroniza resumo,
 * tabela e mensagens de validação da tela.
 * PARÂMETROS E RETORNO: Não recebe parâmetros; retorna object com arrays carregados para uso
 * pelos manipuladores de formulário.
 * ARMAZENAMENTO E PERSISTÊNCIA: Lê cproeis_cadastro_policiais, cproeis_ras_contratos,
 * cproeis_ras_liberacoes, cproeis_ras_eventos e cproeis_ras_acessos_p1 no LocalStorage;
 * não grava dados.
 * TODO: Em produção, substituir por camada de estado alimentada por APIs e permissões de perfil.
 */
function rasRefreshView() {
  const policiais = rasReadList(RAS_STORAGE_KEYS.policiais);
  const contratos = rasReadList(RAS_STORAGE_KEYS.contratos);
  const liberacoes = rasReadList(RAS_STORAGE_KEYS.liberacoes);
  const eventos = rasReadList(RAS_STORAGE_KEYS.eventos);
  const acessosP1 = rasReadList(RAS_STORAGE_KEYS.acessosP1);

  rasRenderRecords(contratos, liberacoes, eventos);
  if (document.getElementById('ras-access-body')) {
    rasRenderAccessUnitFilter(policiais);
    rasRenderAccessTable(policiais, acessosP1);
  }

  return { policiais, contratos, liberacoes, eventos, acessosP1 };
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Registra o contrato/orçamento anual do RAS, etapa anterior às liberações
 * por unidade e aos eventos criados pela P/1.
 * PARÂMETROS E RETORNO: Recebe `event` (SubmitEvent) do formulário; não retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Lê inputs do DOM e grava novo objeto em cproeis_ras_contratos.
 * TODO: Em produção, validar duplicidade por exercício no backend e vincular arquivo/documento
 * SEI oficial ao registro do orçamento anual.
 */
function rasHandleContractSubmit(event) {
  event.preventDefault();

  const contratos = rasReadList(RAS_STORAGE_KEYS.contratos);
  contratos.push({
    id: rasCreateId(),
    exercicio: document.getElementById('ras-contract-year').value,
    numeroContrato: document.getElementById('ras-contract-number').value.trim(),
    valorAnual: Number(document.getElementById('ras-contract-budget').value || 0),
    publicacao: {
      data: document.getElementById('ras-publication-date').value,
      paginaDiarioOficial: document.getElementById('ras-publication-page').value.trim()
    },
    vigencia: {
      inicio: document.getElementById('ras-contract-start').value,
      fim: document.getElementById('ras-contract-end').value
    },
    valores: RAS_CONTRACT_CLASSES.map((item) => ({
      classe: item.classe,
      grupo: item.grupo,
      servico24: Number(document.getElementById(`ras-value-${item.classe}-24`)?.value || 0),
      servico12: Number(document.getElementById(`ras-value-${item.classe}-12`)?.value || 0),
      servico8: Number(document.getElementById(`ras-value-${item.classe}-8`)?.value || 0),
      servico6: Number(document.getElementById(`ras-value-${item.classe}-6`)?.value || 0)
    })),
    beneficios: {
      passagem: Number(document.getElementById('ras-value-passage')?.value || 0),
      alimentacao: Number(document.getElementById('ras-value-food')?.value || 0)
    },
    observacao: document.getElementById('ras-contract-note').value.trim(),
    criadoEm: new Date().toISOString()
  });

  rasSaveList(RAS_STORAGE_KEYS.contratos, contratos);
  event.target.reset();
  rasRefreshView();
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Registra a decisão do GSI que libera uma quantidade de serviços extras
 * para determinada unidade, com classe operacional A, B ou C/D.
 * PARÂMETROS E RETORNO: Recebe `event` (SubmitEvent) do formulário; não retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Lê inputs do DOM e grava novo objeto em cproeis_ras_liberacoes.
 * TODO: Em produção, exigir autenticação GSI, anexar evidência SEI/mensagem e registrar decisão
 * assinada com histórico de alterações.
 */
function rasHandleReleaseSubmit(event) {
  event.preventDefault();

  const liberacoes = rasReadList(RAS_STORAGE_KEYS.liberacoes);
  liberacoes.push({
    id: rasCreateId(),
    unidade: document.getElementById('ras-release-unit').value.trim(),
    quantidade: Number(document.getElementById('ras-release-quantity').value || 0),
    classe: document.getElementById('ras-release-class').value,
    fonte: document.getElementById('ras-release-source').value.trim(),
    parecer: document.getElementById('ras-release-note').value.trim(),
    status: 'liberado',
    criadoEm: new Date().toISOString()
  });

  rasSaveList(RAS_STORAGE_KEYS.liberacoes, liberacoes);
  event.target.reset();
  rasRefreshView();
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Cria um evento ou serviço RAS da P/1 somente quando há saldo liberado
 * pelo GSI para a unidade informada.
 * PARÂMETROS E RETORNO: Recebe `event` (SubmitEvent) do formulário; não retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Lê inputs do DOM, consulta cproeis_ras_liberacoes e
 * cproeis_ras_eventos, e grava o novo evento em cproeis_ras_eventos quando validado.
 * TODO: Em produção, integrar seleção de policiais voluntários/compulsórios, validar perfil P/1
 * e impedir criação concorrente acima do saldo por transação no backend.
 */
function rasHandleEventSubmit(event) {
  event.preventDefault();

  const feedback = document.getElementById('ras-event-feedback');
  const unidade = document.getElementById('ras-event-unit').value.trim();
  const quantidade = Number(document.getElementById('ras-event-quantity').value || 0);
  const { liberacoes, eventos } = rasRefreshView();
  const saldoUnidade = rasGetUnitBalance(unidade, liberacoes, eventos);

  if (quantidade > saldoUnidade) {
    feedback.textContent = `A unidade possui saldo de ${Math.max(saldoUnidade, 0)} serviço(s) liberado(s) pelo GSI.`;
    feedback.classList.remove('ok');
    return;
  }

  eventos.push({
    id: rasCreateId(),
    unidade,
    nome: document.getElementById('ras-event-name').value.trim(),
    data: document.getElementById('ras-event-date').value,
    quantidade,
    classe: document.getElementById('ras-event-class').value,
    tipoEscala: document.getElementById('ras-event-scale').value,
    observacao: document.getElementById('ras-event-note').value.trim(),
    status: 'criado',
    criadoEm: new Date().toISOString()
  });

  rasSaveList(RAS_STORAGE_KEYS.eventos, eventos);
  event.target.reset();
  feedback.textContent = 'Evento RAS criado dentro do saldo liberado pelo GSI.';
  feedback.classList.add('ok');
  rasRefreshView();
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Lê a unidade selecionada na linha do policial antes de vincular o perfil
 * P/1 RAS.
 * PARÂMETROS E RETORNO: Recebe `policialId` (string) e retorna string com a unidade selecionada
 * no select da linha, ou string vazia quando não encontra o campo.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava LocalStorage; consulta apenas o DOM renderizado.
 * TODO: Em produção, substituir o select por componente controlado com estado próprio para reduzir
 * dependência de busca direta no DOM.
 */
function rasGetSelectedRowUnit(policialId) {
  const select = [...document.querySelectorAll('[data-unit-select]')]
    .find((element) => element.dataset.unitSelect === policialId);
  return select?.value || '';
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Vincula um policial já cadastrado a uma unidade P/1 RAS ou remove o vínculo
 * existente diretamente pelos botões da tabela.
 * PARÂMETROS E RETORNO: Recebe `event` (MouseEvent) da tabela; não retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Lê cproeis_cadastro_policiais para validar o policial, usa as
 * unidades cadastradas nesses policiais como lista válida e grava/remove registros em
 * cproeis_ras_acessos_p1 no LocalStorage.
 * TODO: Em produção, mover vinculação/desvinculação para endpoint transacional com auditoria,
 * perfil autorizador e validação contra cadastro oficial de unidades.
 */
function rasHandleAccessTableClick(event) {
  const button = event.target.closest('[data-ras-action]');
  if (!button) return;

  const feedback = document.getElementById('ras-access-feedback');
  const action = button.dataset.rasAction;
  const policialId = button.dataset.policialId;
  const policiais = rasReadList(RAS_STORAGE_KEYS.policiais);
  const policial = rasFindPolicialById(policiais, policialId);

  if (!policial) {
    feedback.textContent = 'Este policial não foi encontrado na Base de Dados.';
    feedback.classList.remove('ok');
    return;
  }

  const acessosP1 = rasReadList(RAS_STORAGE_KEYS.acessosP1);
  const existingIndex = acessosP1.findIndex((acesso) => acesso.policialId === policialId);

  if (action === 'unlink') {
    if (existingIndex >= 0) {
      acessosP1.splice(existingIndex, 1);
      rasSaveList(RAS_STORAGE_KEYS.acessosP1, acessosP1);
    }

    feedback.textContent = 'Vínculo P/1 RAS removido.';
    feedback.classList.add('ok');
    rasRefreshView();
    return;
  }

  const unidade = rasGetSelectedRowUnit(policialId);
  const units = rasGetRegisteredUnits(policiais);

  if (!unidade || !units.includes(unidade)) {
    feedback.textContent = 'Selecione uma unidade cadastrada na Base de Dados antes de vincular.';
    feedback.classList.remove('ok');
    return;
  }

  const payload = {
    id: existingIndex >= 0 ? acessosP1[existingIndex].id : rasCreateId(),
    policialId,
    rg: policial.rg || '',
    nomePolicial: rasGetPolicialName(policial),
    postoGraduacao: policial.postoGraduacao || '',
    unidade,
    status: 'ativo',
    atualizadoEm: new Date().toISOString()
  };

  if (existingIndex >= 0) {
    acessosP1[existingIndex] = payload;
  } else {
    acessosP1.push({ ...payload, criadoEm: payload.atualizadoEm });
  }

  rasSaveList(RAS_STORAGE_KEYS.acessosP1, acessosP1);
  feedback.textContent = 'Policial vinculado ao perfil P/1 RAS.';
  feedback.classList.add('ok');
  rasRefreshView();
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Inicializa filtros e ações da tabela de acessos P/1 RAS.
 * PARÂMETROS E RETORNO: Não recebe parâmetros nem retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados diretamente; dispara rerenderizações que leem
 * LocalStorage e conecta botões que podem alterar cproeis_ras_acessos_p1.
 * TODO: Em produção, preservar filtros por usuário e aplicar debounce em buscas remotas.
 */
function rasBindAccessTableControls() {
  RAS_ACCESS_FILTER_IDS.forEach((id) => {
    const input = document.getElementById(id);
    if (!input) return;
    input.addEventListener('input', rasRefreshView);
    input.addEventListener('change', rasRefreshView);
  });

  document.getElementById('ras-access-clear-filters')?.addEventListener('click', () => {
    RAS_ACCESS_FILTER_IDS.forEach((id) => {
      const input = document.getElementById(id);
      if (input) input.value = '';
    });
    rasRefreshView();
  });

  document.getElementById('ras-access-body')?.addEventListener('click', rasHandleAccessTableClick);
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Inicializa os formulários e a renderização do módulo RAS quando a página
 * termina de carregar.
 * PARÂMETROS E RETORNO: Não recebe parâmetros nem retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Indiretamente lê e grava LocalStorage por meio dos handlers
 * conectados aos formulários.
 * TODO: Em produção, carregar permissões do usuário antes de exibir ações de GSI ou P/1 e
 * bloquear no servidor qualquer operação sem perfil autorizado.
 */
function rasInit() {
  const contractYear = document.getElementById('ras-contract-year');
  if (contractYear) contractYear.value = new Date().getFullYear();
  const today = new Date().toISOString().slice(0, 10);
  const publicationDate = document.getElementById('ras-publication-date');
  const contractStart = document.getElementById('ras-contract-start');
  const contractEnd = document.getElementById('ras-contract-end');
  if (publicationDate && !publicationDate.value) publicationDate.value = today;
  if (contractStart && !contractStart.value) contractStart.value = `${contractYear?.value || new Date().getFullYear()}-01-01`;
  if (contractEnd && !contractEnd.value) contractEnd.value = `${contractYear?.value || new Date().getFullYear()}-12-31`;
  contractYear?.addEventListener('change', () => {
    const year = contractYear.value || new Date().getFullYear();
    if (contractStart) contractStart.value = `${year}-01-01`;
    if (contractEnd) contractEnd.value = `${year}-12-31`;
  });
  if (document.getElementById('ras-access-body')) rasBindAccessTableControls();
  document.getElementById('ras-contract-form')?.addEventListener('submit', rasHandleContractSubmit);
  document.getElementById('ras-release-form')?.addEventListener('submit', rasHandleReleaseSubmit);
  document.getElementById('ras-event-form')?.addEventListener('submit', rasHandleEventSubmit);
  rasRefreshView();
}

document.addEventListener('DOMContentLoaded', rasInit);
