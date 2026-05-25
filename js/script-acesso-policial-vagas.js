const STORAGE_POLICIAIS = 'cproeis_cadastro_policiais';
const STORAGE_VAGAS = 'cproeis_convenios_vagas';
const STORAGE_CONVENIOS = 'cproeis_contratos_convenios';
const STORAGE_POLICIAL_ATUAL = 'cproeis_acesso_policial_atual';

const tiposServico = {
  servico12: 'Serviço 12h',
  servico8: 'Serviço 8h',
  servico6: 'Serviço 6h'
};
const mesesAno = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const vagaDatePickerState = { month: '' };

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Lê listas JSON salvas no navegador e devolve sempre um array seguro para uso nas telas.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} key - Chave do LocalStorage que será consultada.
 * @returns {Array<object>} Lista persistida ou array vazio em caso de ausência/erro.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê dados do LocalStorage e não realiza gravação.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: substituir leituras locais por API autenticada com tratamento de erro e sessão do policial.
 */
function loadList(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    return [];
  }
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Persiste uma lista JSON no LocalStorage, usada para atualizar as vagas após aceite do policial.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} key - Chave do LocalStorage que receberá os dados.
 * @param {Array<object>} value - Lista que será serializada em JSON.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Grava a chave recebida no LocalStorage do navegador atual.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, substituir esta gravação local por endpoint transacional com bloqueio de concorrência.
 */
function saveList(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Formata data ISO simples para exibição brasileira nas tabelas.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} value - Data no formato YYYY-MM-DD.
 * @returns {string} Data no formato DD/MM/YYYY ou hífen quando ausente.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa armazenamento; transforma somente o valor recebido.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: centralizar formatação de datas em componente compartilhado do sistema.
 */
function formatDate(value) {
  if (!value) return '-';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Converte uma data ISO em objeto Date local no início do dia para renderização do calendário customizado.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} value - Data no formato YYYY-MM-DD.
 * @returns {Date} Objeto Date em horário local.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não lê nem grava dados; processa apenas o valor recebido.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: migrar para utilitário de datas compartilhado entre módulos para evitar lógica duplicada.
 */
function parseLocalDate(value) {
  return new Date(`${value}T00:00:00`);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Formata um objeto Date para ISO local (YYYY-MM-DD), padrão usado no filtro de data da página.
 *
 * PARÂMETROS E RETORNO:
 * @param {Date} date - Data que será convertida para string ISO local.
 * @returns {string} Data no formato YYYY-MM-DD.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não usa LocalStorage; apenas transforma a data em memória.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: padronizar timezone do frontend com o backend quando houver API de agenda oficial.
 */
function toDateInputValue(date) {
  return [
    String(date.getFullYear()),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Sincroniza o campo visual de data com o valor ISO usado internamente pelo filtro de vagas.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados persistentes; lê o input ISO e atualiza apenas o input visual no DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: reutilizar este sincronismo em um componente de datepicker comum ao sistema.
 */
function syncVagaDateDisplay() {
  const hiddenInput = document.getElementById('vaga-date-filter');
  const displayInput = document.getElementById('vaga-date-filter-display');
  if (!hiddenInput || !displayInput) return;

  displayInput.value = hiddenInput.value ? formatDate(hiddenInput.value) : '';
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Fecha o calendário customizado do filtro de data da página de vagas do policial.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa LocalStorage; altera somente estado visual temporário no DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: adicionar gerenciamento de foco para navegação completa por teclado em produção.
 */
function closeVagaDatePicker() {
  document.getElementById('vaga-custom-date-picker')?.classList.add('is-hidden');
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Renderiza o calendário customizado mensal usando o mesmo padrão visual do criar vagas do convênio.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava LocalStorage; lê apenas valor atual do filtro de data e estado temporário do month picker.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: permitir bloqueios de datas por calendário operacional oficial quando houver backend.
 */
function renderVagaDatePicker() {
  const picker = document.getElementById('vaga-custom-date-picker');
  const dateInput = document.getElementById('vaga-date-filter');
  if (!picker || !dateInput) return;

  const today = toDateInputValue(new Date());
  const month = vagaDatePickerState.month || (dateInput.value || today).slice(0, 7);
  const [year, monthNumber] = month.split('-').map(Number);
  const selectedDate = dateInput.value || '';
  const firstWeekDay = parseLocalDate(`${month}-01`).getDay();
  const daysInMonth = new Date(year, monthNumber, 0).getDate();
  const previousMonth = toDateInputValue(new Date(year, monthNumber - 2, 1)).slice(0, 7);
  const nextMonth = toDateInputValue(new Date(year, monthNumber, 1)).slice(0, 7);
  const dayCells = [];

  for (let i = 0; i < firstWeekDay; i += 1) {
    dayCells.push('<span class="custom-date-empty"></span>');
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = `${month}-${String(day).padStart(2, '0')}`;
    const todayClass = date === today ? ' is-today' : '';
    const selectedClass = selectedDate === date ? ' is-selected' : '';

    dayCells.push(`
      <button type="button" class="custom-date-day${todayClass}${selectedClass}" data-vaga-picker-date="${date}">
        ${day}
      </button>
    `);
  }

  picker.innerHTML = `
    <div class="custom-date-header">
      <button type="button" aria-label="Mês anterior" data-vaga-picker-month="${previousMonth}">‹</button>
      <strong>${mesesAno[monthNumber - 1]} ${year}</strong>
      <button type="button" aria-label="Próximo mês" data-vaga-picker-month="${nextMonth}">›</button>
    </div>
    <div class="custom-date-weekdays">
      <span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span>
    </div>
    <div class="custom-date-grid">
      ${dayCells.join('')}
    </div>
  `;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Abre o calendário customizado do filtro de vagas posicionando o mês da data atual selecionada.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados persistentes; usa o valor atual do filtro de data apenas em memória.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: exibir indicador de competência mensal quando o calendário oficial estiver disponível.
 */
function openVagaDatePicker() {
  const picker = document.getElementById('vaga-custom-date-picker');
  const dateInput = document.getElementById('vaga-date-filter');
  if (!picker || !dateInput) return;

  const today = toDateInputValue(new Date());
  const baseDate = dateInput.value || today;
  vagaDatePickerState.month = baseDate.slice(0, 7);
  picker.classList.remove('is-hidden');
  renderVagaDatePicker();
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Aplica a data selecionada no calendário customizado ao filtro da tabela de vagas.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} date - Data escolhida no calendário, no formato YYYY-MM-DD.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava LocalStorage; atualiza somente os inputs de filtro no DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: sincronizar seleção de data com query string quando houver compartilhamento de filtros.
 */
function selectVagaDate(date) {
  const hiddenInput = document.getElementById('vaga-date-filter');
  if (!hiddenInput) return;
  hiddenInput.value = date;
  syncVagaDateDisplay();
  closeVagaDatePicker();
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Conecta o filtro de data da página ao calendário customizado, replicando o padrão do convênio.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava LocalStorage; registra listeners no DOM e mantém estado temporário do datepicker.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: extrair este datepicker para módulo compartilhado entre Convênio e Policial.
 */
function bindVagaDatePickerEvents() {
  const picker = document.getElementById('vaga-custom-date-picker');
  const hiddenInput = document.getElementById('vaga-date-filter');
  const displayInput = document.getElementById('vaga-date-filter-display');
  if (!picker || !hiddenInput || !displayInput || picker.dataset.pickerBound === 'true') return;

  picker.dataset.pickerBound = 'true';

  if (!hiddenInput.value) {
    hiddenInput.value = toDateInputValue(new Date());
  }
  syncVagaDateDisplay();

  displayInput.addEventListener('click', () => openVagaDatePicker());
  displayInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openVagaDatePicker();
    }
  });
  hiddenInput.addEventListener('change', syncVagaDateDisplay);

  picker.addEventListener('click', (event) => {
    event.stopPropagation();

    const monthButton = event.target.closest('[data-vaga-picker-month]');
    if (monthButton) {
      vagaDatePickerState.month = monthButton.dataset.vagaPickerMonth;
      renderVagaDatePicker();
      return;
    }

    const dateButton = event.target.closest('[data-vaga-picker-date]');
    if (dateButton) {
      selectVagaDate(dateButton.dataset.vagaPickerDate);
    }
  });

  document.addEventListener('click', (event) => {
    if (picker.classList.contains('is-hidden')) return;
    if (event.target.closest('#vaga-custom-date-picker') || event.target.closest('#vaga-date-filter-display')) return;
    closeVagaDatePicker();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeVagaDatePicker();
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Busca o policial selecionado na URL para montar menu e filtros individuais.
 *
 * PARÂMETROS E RETORNO:
 * @returns {object|null} Policial encontrado no cadastro local ou nulo quando o ID é inválido.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê o parâmetro `id` da URL e consulta `cproeis_cadastro_policiais` no LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: trocar query string por token de sessão autenticado quando existir login real do policial.
 */
function getSelectedPolicial() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Recupera o policial em sessão local, priorizando o ID da URL quando
   * o usuário acabou de clicar em Logar e mantendo esse ID nas navegações internas do menu.
   * PARÂMETROS E RETORNO: Não recebe parâmetros; retorna o objeto do policial encontrado ou null.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê o parâmetro id da URL, lê a lista de policiais em LocalStorage
   * e grava o ID atual em cproeis_acesso_policial_atual para manter a sessão local do protótipo.
   * TODO: Em produção, substituir esta sessão local por autenticação real com expiração e logout seguro.
   */
  const params = new URLSearchParams(window.location.search);
  const urlId = params.get('id') || '';
  const storedId = localStorage.getItem(STORAGE_POLICIAL_ATUAL) || '';
  const id = urlId || storedId;
  const policial = loadList(STORAGE_POLICIAIS).find((item) => item.id === id) || null;

  if (policial && urlId) {
    localStorage.setItem(STORAGE_POLICIAL_ATUAL, policial.id);
  }

  return policial;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Define as classes de vaga compatíveis com o posto/graduação do policial.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} policial - Registro cadastral do policial.
 * @returns {Array<string>} Classes de vaga permitidas para o perfil funcional.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não lê nem grava dados; calcula a elegibilidade em memória a partir de `postoGraduacao`.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: substituir esta tabela local por regra oficial parametrizada pelo GSI/CPROEIS em banco de dados.
 */
function getEligibleClasses(policial) {
  const posto = policial?.postoGraduacao || '';
  const classeA = ['Major', 'Tenente-Coronel', 'Coronel'];
  const classeB = ['Aspirante', '2º Tenente', '1º Tenente', 'Capitão'];
  const classeCD = ['Soldado', 'Cabo', '3º Sargento', '2º Sargento', '1º Sargento', 'Subtenente'];

  if (classeA.includes(posto)) return ['A'];
  if (classeB.includes(posto)) return ['B'];
  if (classeCD.includes(posto)) return ['C/D', 'C', 'D'];
  return [];
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Verifica se o policial está apto para visualizar vagas operacionais.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} policial - Registro cadastral do policial.
 * @returns {boolean} Verdadeiro quando o policial está ativo e com condição sanitária compatível.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa armazenamento; usa apenas campos já lidos do LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: consultar impedimentos, bloqueios e escalas conflitantes em serviços do backend.
 */
function isPolicialOperationallyEligible(policial) {
  const statusOk = policial?.situacaoFuncional === 'Ativo' || policial?.situacaoFuncional === 'Adido';
  const sanitaryOk = ['APTO_A', 'APTO_B'].includes(policial?.situacaoSanitaria);
  return Boolean(statusOk && sanitaryOk);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Calcula a quinta-feira de liberação automática da vaga, igual à regra usada pelo módulo de convênios.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} dataServico - Data da vaga no formato YYYY-MM-DD.
 * @returns {Date|null} Data de liberação automática ou nulo quando inválida.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não lê nem grava dados; calcula em memória.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: centralizar esta regra em serviço único para evitar divergência entre convênio, GSI e policial.
 */
function getAutomaticOfferDeadline(dataServico) {
  if (!dataServico) return null;
  const date = new Date(`${dataServico}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  date.setDate(date.getDate() - 4);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Indica se uma vaga já foi liberada para o policial, seja por prazo automático ou por autorização do GSI.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} vaga - Vaga persistida pelo módulo de convênios.
 * @returns {boolean} Verdadeiro quando a vaga pode aparecer no acesso do policial.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; lê campos da vaga já carregada do LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: validar disponibilidade em API, considerando saldo de vagas e bloqueios em tempo real.
 */
function isVagaLiberada(vaga) {
  if (vaga.permissaoGsiStatus === 'aprovada' || vaga.liberadaParaPolicial === true) return true;

  const releaseAt = getAutomaticOfferDeadline(vaga.dataServico);
  const createdAt = vaga.createdAt ? new Date(vaga.createdAt) : new Date(0);
  return Boolean(releaseAt && createdAt <= releaseAt && new Date() >= releaseAt);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Verifica se uma vaga é compatível com o cadastro funcional do policial.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} vaga - Vaga persistida pelo convênio.
 * @param {object} policial - Policial selecionado na URL.
 * @returns {boolean} Verdadeiro quando a vaga deve ser exibida ao policial.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; cruza em memória as vagas e o cadastro lidos do LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: incluir cursos concluídos, impedimentos administrativos e regras de escala quando essas tabelas forem criadas.
 */
function isVagaCompativelComPolicial(vaga, policial) {
  if (!isPolicialOperationallyEligible(policial)) return false;
  if (!isVagaLiberada(vaga)) return false;
  if (Number(vaga.preenchidas || 0) >= Number(vaga.quantidade || 0)) return false;

  const allowedClasses = getEligibleClasses(policial);
  return allowedClasses.includes(vaga.classe);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Retorna a lista normalizada de policiais já escalados em uma vaga.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} vaga - Registro de vaga persistido no LocalStorage.
 * @returns {Array<object>} Lista de escalados vinculados à vaga.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; lê apenas campos do objeto em memória, incluindo compatibilidade com o campo legado
 * `policialEscalado`.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Manter escalas em entidade própria no backend, com status, auditoria e histórico de alterações.
 */
function getEscaladosDaVaga(vaga) {
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
 * Verifica se o policial já está escalado em determinada vaga.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} vaga - Vaga analisada.
 * @param {object} policial - Policial ativo da sessão.
 * @returns {boolean} Verdadeiro quando o policial já assumiu a vaga.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não lê nem grava LocalStorage; usa os objetos carregados em memória.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Validar duplicidade por chave de escala no servidor para evitar corrida entre navegadores.
 */
function isPolicialEscaladoNaVaga(vaga, policial) {
  return getEscaladosDaVaga(vaga).some((escala) => (
    escala.policialId === policial?.id ||
    escala.idFuncional === policial?.idFuncional ||
    escala.nome === policial?.nomeCompleto
  ));
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Identifica conflito de agenda quando o policial tenta pegar outra vaga no mesmo intervalo.
 *
 * PARÂMETROS E RETORNO:
 * @param {Array<object>} vagas - Todas as vagas persistidas no sistema.
 * @param {object} targetVaga - Vaga que o policial quer assumir.
 * @param {object} policial - Policial ativo da sessão.
 * @returns {boolean} Verdadeiro quando já existe escala do mesmo policial no mesmo dia e horário.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; percorre a lista de vagas carregada de `cproeis_convenios_vagas`.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: No backend, validar sobreposição de horários considerando deslocamento, descanso e regras oficiais.
 */
function hasScheduleConflict(vagas, targetVaga, policial) {
  return vagas.some((vaga) => (
    vaga.id !== targetVaga.id &&
    vaga.dataServico === targetVaga.dataServico &&
    vaga.horaInicio === targetVaga.horaInicio &&
    vaga.horaFim === targetVaga.horaFim &&
    isPolicialEscaladoNaVaga(vaga, policial)
  ));
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Registra o aceite da vaga pelo policial, atualizando a vaga e removendo-a da lista de disponíveis.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} vagaId - Identificador da vaga escolhida.
 * @param {object|null} policial - Policial ativo da sessão.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê e grava `cproeis_convenios_vagas` no LocalStorage, adicionando o policial em `escalados` e
 * incrementando `preenchidas`.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Transformar o aceite em operação transacional no backend, bloqueando a vaga durante a confirmação.
 */
function pegarVaga(vagaId, policial) {
  if (!policial) {
    alert('Selecione um policial antes de pegar uma vaga.');
    return;
  }

  const vagas = loadList(STORAGE_VAGAS);
  const target = vagas.find((vaga) => vaga.id === vagaId);
  if (!target || !isVagaCompativelComPolicial(target, policial)) {
    alert('Esta vaga não está mais disponível para este policial.');
    renderVagasDisponiveis(policial);
    return;
  }

  if (isPolicialEscaladoNaVaga(target, policial)) {
    alert('Este policial já está escalado nesta vaga.');
    renderVagasDisponiveis(policial);
    return;
  }

  if (hasScheduleConflict(vagas, target, policial)) {
    alert('O policial já possui escala neste mesmo dia e horário.');
    return;
  }

  const now = new Date().toISOString();
  const updated = vagas.map((vaga) => {
    if (vaga.id !== vagaId) return vaga;

    const escalados = getEscaladosDaVaga(vaga);
    const nextEscalados = [...escalados, {
      policialId: policial.id,
      idFuncional: policial.idFuncional,
      nome: policial.nomeCompleto || policial.nomeGuerra || 'Policial',
      postoGraduacao: policial.postoGraduacao || '',
      unidade: policial.unidade || '',
      acceptedAt: now
    }];

    return {
      ...vaga,
      escalados: nextEscalados,
      preenchidas: nextEscalados.length,
      policialEscalado: nextEscalados.map((item) => item.nome).join(', '),
      policialEscaladoId: nextEscalados.length === 1 ? policial.id : '',
      updatedAt: now
    };
  });

  saveList(STORAGE_VAGAS, updated);
  renderVagasDisponiveis(policial);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Renderiza a tabela inicial de policiais com botão de login por registro.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê `cproeis_cadastro_policiais` do LocalStorage e escreve linhas no DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: substituir a listagem pública por autenticação individual e busca protegida por credenciais.
 */
function renderPoliciaisAccessTable() {
  const body = document.getElementById('policiais-body');
  if (!body) return;

  const filter = String(document.getElementById('policial-filter')?.value || '').trim().toLowerCase();
  const policiais = loadList(STORAGE_POLICIAIS)
    .filter((policial) => {
      const searchable = [
        policial.rg,
        policial.idFuncional,
        policial.nomeCompleto,
        policial.nomeGuerra,
        policial.postoGraduacao,
        policial.unidade,
        policial.situacaoFuncional,
        policial.situacaoSanitaria
      ].join(' ').toLowerCase();
      return !filter || searchable.includes(filter);
    })
    .sort((a, b) => String(a.nomeCompleto || '').localeCompare(String(b.nomeCompleto || '')));

  document.getElementById('table-count').textContent = policiais.length
    ? `${policiais.length} policial(is) encontrado(s).`
    : 'Nenhum policial encontrado.';

  body.innerHTML = '';
  if (!policiais.length) {
    const row = body.insertRow();
    const cell = row.insertCell();
    cell.className = 'empty';
    cell.colSpan = 8;
    cell.textContent = 'Nenhum policial cadastrado para acesso.';
    return;
  }

  policiais.forEach((policial) => {
    const row = body.insertRow();
    [
      policial.rg,
      policial.idFuncional,
      policial.nomeCompleto,
      policial.postoGraduacao,
      policial.unidade,
      policial.situacaoSanitaria,
      policial.situacaoFuncional
    ].forEach((value) => {
      row.insertCell().textContent = value || '-';
    });

    const actionCell = row.insertCell();
    const actions = document.createElement('div');
    actions.className = 'actions';
    const link = document.createElement('a');
    link.className = 'login-action';
    link.href = `vagas.html?id=${encodeURIComponent(policial.id)}`;
    link.textContent = 'Logar';
    actions.appendChild(link);
    actionCell.appendChild(actions);
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Preenche o cabeçalho e os links internos das páginas do policial selecionado.
 *
 * PARÂMETROS E RETORNO:
 * @param {object|null} policial - Policial selecionado pela URL.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; altera textos e hrefs no DOM com base no cadastro local.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: carregar identidade do policial pela sessão autenticada e não por parâmetro de URL.
 */
function hydratePolicialPage(policial) {
  const title = document.getElementById('page-title');
  const subtitle = document.getElementById('page-subtitle');
  if (!title || !subtitle) return;

  if (!policial) {
    title.textContent = 'Policial não encontrado';
    subtitle.textContent = 'Retorne à lista e selecione um policial cadastrado.';
    return;
  }

  title.textContent = 'Acesso do Policial';
  subtitle.textContent = [
    policial.nomeCompleto || policial.nomeGuerra || 'Policial sem nome',
    policial.postoGraduacao || '-',
    policial.unidade || '-',
    policial.situacaoSanitaria || '-',
    policial.situacaoFuncional || '-'
  ].join(' | ');

  const idParam = `id=${encodeURIComponent(policial.id)}`;
  const internalLinks = {
    'vagas.html': `vagas.html?${idParam}`,
    'historico-servico.html': `historico-servico.html?${idParam}`,
    'tabela-servico.html': `tabela-servico.html?${idParam}`,
    'pagamentos.html': `pagamentos.html?${idParam}`,
    'cursos.html': `cursos.html?${idParam}`
  };

  Object.entries(internalLinks).forEach(([baseHref, nextHref]) => {
    const link = document.querySelector(`.module-menu a[href="${baseHref}"]`);
    if (link) link.href = nextHref;
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Extrai somente o número de horas da carga horária de uma vaga para exibir na tabela.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} vaga - Vaga carregada do LocalStorage de vagas dos convênios.
 * @returns {string} Número de horas da carga horária, como "6", "8" ou "12"; retorna hífen se não houver dado.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não lê nem grava dados; usa apenas o objeto de vaga recebido em memória.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, persistir a carga horária como campo numérico oficial para evitar inferência por texto.
 */
function getCargaHorariaLabel(vaga) {
  const source = tiposServico[vaga.tipoServico] || vaga.tipoServico || vaga.cargaHoraria || '';
  const match = String(source).match(/\d+/);
  return match ? match[0] : '-';
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Cria um objeto de leitura com todos os textos exibidos nas colunas da tabela de vagas.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} vaga - Vaga persistida pelo módulo de convênios.
 * @param {object} convenio - Convênio relacionado à vaga.
 * @returns {object} Registro normalizado para filtros e renderização.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; agrega campos já carregados de `cproeis_convenios_vagas` e
 * `cproeis_contratos_convenios`.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Trazer estes campos já normalizados pela API para evitar duplicar regra de exibição no navegador.
 */
function buildVagaDisponivelRecord(vaga, convenio) {
  const horario = `${vaga.horaInicio || '-'} até ${vaga.horaFim || '-'}`;
  const cargaHoraria = getCargaHorariaLabel(vaga);
  return {
    vaga,
    data: vaga.dataServico || '',
    dataLabel: formatDate(vaga.dataServico),
    convenio: convenio.nome || convenio.numero || '-',
    servico: vaga.nomeServico || '-',
    classe: vaga.classe || '-',
    cargaHoraria,
    horario,
    inicio: vaga.horaInicio || '-',
    termino: vaga.horaFim || '-'
  };
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Preenche um select de filtro com valores únicos existentes na listagem de vagas.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} selectId - ID do select no DOM.
 * @param {Array<string>} values - Valores disponíveis para a coluna.
 * @param {string} defaultLabel - Texto da opção vazia.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não usa LocalStorage; altera somente opções temporárias no DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Para tabelas maiores, buscar opções de filtro paginadas/agrupadas no backend.
 */
function setVagaFilterOptions(selectId, values, defaultLabel = 'Todos') {
  const select = document.getElementById(selectId);
  if (!select) return;

  const currentValue = select.value;
  const uniqueValues = [...new Set(values.filter((value) => value && value !== '-'))]
    .sort((a, b) => {
      const numberA = Number(a);
      const numberB = Number(b);
      if (Number.isFinite(numberA) && Number.isFinite(numberB)) {
        return numberA - numberB;
      }
      return String(a).localeCompare(String(b), 'pt-BR');
    });

  select.innerHTML = '';
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = defaultLabel;
  select.appendChild(defaultOption);

  uniqueValues.forEach((value) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });

  select.value = uniqueValues.includes(currentValue) ? currentValue : '';
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Atualiza os filtros de coluna usando os valores existentes nas vagas disponíveis ao policial.
 *
 * PARÂMETROS E RETORNO:
 * @param {Array<object>} records - Registros normalizados de vagas disponíveis.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; escreve opções de filtro no DOM com base na lista carregada do LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Preservar metadados de filtro por perfil quando houver usuário autenticado.
 */
function updateVagaColumnFilters(records) {
  setVagaFilterOptions('vaga-convenio-filter', records.map((record) => record.convenio));
  setVagaFilterOptions('vaga-servico-filter', records.map((record) => record.servico));
  setVagaFilterOptions('vaga-tipo-filter', records.map((record) => record.cargaHoraria));
  setVagaFilterOptions('vaga-horario-filter', records.map((record) => record.horario));
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Lê os filtros ativos por coluna da página de vagas disponíveis.
 *
 * PARÂMETROS E RETORNO:
 * @returns {object} Objeto com data, convênio, serviço, carga horária e horário.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não lê nem grava LocalStorage; consulta apenas os campos de filtro no DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Sincronizar filtros com query string para permitir compartilhamento de consultas.
 */
function getVagaFilters() {
  return {
    date: document.getElementById('vaga-date-filter')?.value || '',
    convenio: document.getElementById('vaga-convenio-filter')?.value || '',
    servico: document.getElementById('vaga-servico-filter')?.value || '',
    cargaHoraria: document.getElementById('vaga-tipo-filter')?.value || '',
    horario: document.getElementById('vaga-horario-filter')?.value || ''
  };
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Aplica filtros específicos por coluna sobre as vagas disponíveis.
 *
 * PARÂMETROS E RETORNO:
 * @param {Array<object>} records - Registros de vaga já normalizados para exibição.
 * @returns {Array<object>} Registros que atendem aos filtros atuais.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; usa valores temporários do DOM e dados carregados do LocalStorage em memória.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Mover filtragem para API quando a consulta envolver grande volume de vagas.
 */
function filterVagaRecords(records) {
  const filters = getVagaFilters();

  return records.filter((record) => {
    if (filters.date && record.data !== filters.date) return false;
    if (filters.convenio && record.convenio !== filters.convenio) return false;
    if (filters.servico && record.servico !== filters.servico) return false;
    if (filters.cargaHoraria && record.cargaHoraria !== filters.cargaHoraria) return false;
    if (filters.horario && record.horario !== filters.horario) return false;
    return true;
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Renderiza vagas liberadas e compatíveis com o policial selecionado.
 *
 * PARÂMETROS E RETORNO:
 * @param {object|null} policial - Policial selecionado pela URL.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê `cproeis_convenios_vagas` e `cproeis_contratos_convenios` no LocalStorage; não grava dados.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: quando houver aceite de vaga, gravar candidatura/escala em tabela própria para impedir duplicidade.
 */
function renderVagasDisponiveis(policial) {
  const body = document.getElementById('vagas-body');
  if (!body) return;

  const convenioMap = new Map(loadList(STORAGE_CONVENIOS).map((convenio) => [convenio.id, convenio]));

  const baseRecords = loadList(STORAGE_VAGAS)
    .filter((vaga) => isVagaCompativelComPolicial(vaga, policial))
    .filter((vaga) => !isPolicialEscaladoNaVaga(vaga, policial))
    .map((vaga) => buildVagaDisponivelRecord(vaga, convenioMap.get(vaga.convenioId) || {}));

  updateVagaColumnFilters(baseRecords);

  const vagas = filterVagaRecords(baseRecords)
    .sort((a, b) => (
      String(a.vaga.dataServico || '').localeCompare(String(b.vaga.dataServico || '')) ||
      String(a.vaga.horaInicio || '').localeCompare(String(b.vaga.horaInicio || ''))
    ));

  document.getElementById('vagas-count').textContent = vagas.length
    ? `${vagas.length} vaga(s) disponível(is) para o perfil.`
    : 'Nenhuma vaga disponível para o perfil no momento.';

  body.innerHTML = '';
  if (!vagas.length) {
    const row = body.insertRow();
    const cell = row.insertCell();
    cell.className = 'empty';
    cell.colSpan = 8;
    cell.textContent = 'Nenhuma vaga liberada e compatível com este policial.';
    return;
  }

  vagas.forEach((record) => {
    const vaga = record.vaga;
    const row = body.insertRow();
    [
      record.dataLabel,
      record.convenio,
      record.servico,
      record.classe,
      record.cargaHoraria,
      record.inicio,
      record.termino
    ].forEach((value) => {
      row.insertCell().textContent = value;
    });

    const actionCell = row.insertCell();
    const actions = document.createElement('div');
    actions.className = 'actions';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'take-vaga-action';
    button.dataset.vagaId = vaga.id;
    button.textContent = 'Pegar vaga';
    actions.appendChild(button);
    actionCell.appendChild(actions);
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Inicializa a página correta do módulo de acesso do policial conforme os elementos presentes no DOM.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Coordena leituras de LocalStorage e eventos de filtro; não grava dados nesta etapa inicial.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: separar scripts por página quando o módulo ganhar candidatura, pagamentos e histórico real de serviços.
 */
function init() {
  if (document.getElementById('policiais-body')) {
    renderPoliciaisAccessTable();
    document.getElementById('policial-filter')?.addEventListener('input', renderPoliciaisAccessTable);
    return;
  }

  const policial = getSelectedPolicial();
  hydratePolicialPage(policial);

  if (document.getElementById('vagas-body')) {
    bindVagaDatePickerEvents();
    renderVagasDisponiveis(policial);
    [
      'vaga-convenio-filter',
      'vaga-servico-filter',
      'vaga-tipo-filter',
      'vaga-horario-filter'
    ].forEach((id) => {
      const field = document.getElementById(id);
      field?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          renderVagasDisponiveis(policial);
        }
      });
    });
    document.getElementById('vaga-apply-filters')?.addEventListener('click', () => renderVagasDisponiveis(policial));
    document.getElementById('vagas-body')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-vaga-id]');
      if (button) pegarVaga(button.dataset.vagaId, policial);
    });
  }
}

init();

/*
  DESCRIÇÃO DA FUNÇÃO: Inicializa o menu hamburger padronizado desta página, conectando
  o botão do cabeçalho ao bloco de navegação em linha.
  PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valores; atua sobre elementos
  DOM marcados com .module-header, .menu-toggle e .module-menu.
  ARMAZENAMENTO E PERSISTÊNCIA: Lê e grava apenas atributos/classes temporários no DOM
  (aria-expanded, aria-hidden e is-open); não utiliza LocalStorage, arrays persistentes ou APIs.
  TODO: Em produção, centralizar este comportamento em componente compartilhado e sincronizar
  o item ativo com o roteamento autenticado.
*/
function inicializarMenuHamburgerAcessoPolicialVagas() {
  const moduleHeader = document.querySelector('.module-header');
  const menuToggle = document.querySelector('.menu-toggle');
  const moduleMenu = document.querySelector('.module-menu');

  if (!moduleHeader || !menuToggle || !moduleMenu) {
    return;
  }

  function definirEstadoMenu(shouldOpen) {
    menuToggle.setAttribute('aria-expanded', String(shouldOpen));
    menuToggle.setAttribute('aria-label', shouldOpen ? 'Fechar menu do policial' : 'Abrir menu do policial');
    moduleMenu.setAttribute('aria-hidden', String(!shouldOpen));
    moduleHeader.classList.toggle('is-open', shouldOpen);
  }

  menuToggle.addEventListener('click', () => {
    definirEstadoMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
  });

  moduleMenu.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      definirEstadoMenu(false);
    }
  });

  document.addEventListener('click', (event) => {
    if (!moduleHeader.contains(event.target)) {
      definirEstadoMenu(false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      definirEstadoMenu(false);
      menuToggle.focus();
    }
  });
}

inicializarMenuHamburgerAcessoPolicialVagas();
