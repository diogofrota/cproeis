const CAL_STORAGE_VAGAS = 'cproeis_convenios_vagas';
const CAL_STORAGE_CONVENIOS = 'cproeis_contratos_convenios';
const CAL_STORAGE_CONVENIO_ATUAL = 'cproeis_convenio_atual';

let calendarMonth = new Date();
calendarMonth.setDate(1);
let selectedCalendarDay = new Date().toISOString().slice(0, 10);

/*
  DESCRIÇÃO DA FUNÇÃO: Lê uma lista JSON do LocalStorage com fallback seguro para array vazio.
  PARÂMETROS E RETORNO: Recebe key (string) e retorna Array<object>.
  ARMAZENAMENTO E PERSISTÊNCIA: Lê LocalStorage e não grava dados.
  TODO: Em produção, substituir por API autenticada filtrada por convênio e competência.
*/
function calReadList(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    return [];
  }
}

/*
  DESCRIÇÃO DA FUNÇÃO: Escapa valores antes de inserir texto em HTML dinâmico.
  PARÂMETROS E RETORNO: Recebe value (qualquer tipo) e retorna string segura para HTML.
  ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava dados; transforma somente o valor recebido.
  TODO: Em produção, sanitizar no backend todo texto operacional persistido.
*/
function calEscape(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/*
  DESCRIÇÃO DA FUNÇÃO: Formata data ISO para DD/MM/YYYY.
  PARÂMETROS E RETORNO: Recebe value (string YYYY-MM-DD) e retorna string formatada ou hífen.
  ARMAZENAMENTO E PERSISTÊNCIA: Não acessa armazenamento.
  TODO: Centralizar formatação de datas em utilitário comum do sistema.
*/
function calFormatDate(value) {
  if (!value) return '-';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

/*
  DESCRIÇÃO DA FUNÇÃO: Formata a carga horária da vaga como número, mantendo consistência com
  a tabela de vagas criadas.
  PARÂMETROS E RETORNO: Recebe vaga (object) e retorna string com a carga horária numérica ou hífen.
  ARMAZENAMENTO E PERSISTÊNCIA: Não acessa LocalStorage; usa somente campos da vaga recebida.
  TODO: Em produção, normalizar carga horária como campo numérico no cadastro da vaga.
*/
function calFormatCargaHoraria(vaga) {
  const source = String(vaga.turno || vaga.tipoServico || '');
  const match = source.match(/\d+/);
  return match ? match[0] : '-';
}

/*
  DESCRIÇÃO DA FUNÇÃO: Converte uma data ISO em Date local para evitar deslocamento de fuso no
  cálculo de liberação automática das vagas.
  PARÂMETROS E RETORNO: Recebe value (string YYYY-MM-DD) e retorna Date.
  ARMAZENAMENTO E PERSISTÊNCIA: Não acessa LocalStorage; apenas transforma o valor recebido.
  TODO: Em produção, centralizar regras de data no backend com calendário oficial do GSI.
*/
function calParseLocalDate(value) {
  return new Date(`${value}T00:00:00`);
}

/*
  DESCRIÇÃO DA FUNÇÃO: Converte Date para o formato ISO usado nas vagas.
  PARÂMETROS E RETORNO: Recebe date (Date) e retorna string YYYY-MM-DD.
  ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava dados.
  TODO: Substituir por utilitário compartilhado quando houver camada comum de datas.
*/
function calToDateInputValue(date) {
  return date.toISOString().slice(0, 10);
}

/*
  DESCRIÇÃO DA FUNÇÃO: Calcula a segunda-feira da semana operacional de uma vaga.
  PARÂMETROS E RETORNO: Recebe value (string YYYY-MM-DD) e retorna string YYYY-MM-DD.
  ARMAZENAMENTO E PERSISTÊNCIA: Não acessa armazenamento; cálculo em memória.
  TODO: Permitir início de semana configurável se a regra operacional mudar.
*/
function calGetMonday(value) {
  const date = calParseLocalDate(value);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return calToDateInputValue(date);
}

/*
  DESCRIÇÃO DA FUNÇÃO: Retorna a quinta-feira de liberação automática da semana operacional da vaga.
  PARÂMETROS E RETORNO: Recebe dataServico (string YYYY-MM-DD) e retorna Date|null.
  ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; usa somente a data da vaga.
  TODO: Migrar a regra de liberação para serviço do GSI quando houver backend.
*/
function calGetAutomaticOfferDeadline(dataServico) {
  if (!dataServico) return null;
  const monday = calParseLocalDate(calGetMonday(dataServico));
  monday.setDate(monday.getDate() - 4);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/*
  DESCRIÇÃO DA FUNÇÃO: Retorna o primeiro dia do mês atual do calendário em formato ISO.
  PARÂMETROS E RETORNO: Não recebe parâmetros e retorna string YYYY-MM-DD.
  ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava dados; usa apenas `calendarMonth` em memória.
  TODO: Em produção, centralizar manipulação de competência em utilitário de datas.
*/
function calFirstDayOfCurrentMonth() {
  return `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}-01`;
}

/*
  DESCRIÇÃO DA FUNÇÃO: Retorna o título textual do mês exibido no calendário.
  PARÂMETROS E RETORNO: Recebe date (Date) e retorna string com mês/ano em português.
  ARMAZENAMENTO E PERSISTÊNCIA: Não acessa LocalStorage.
  TODO: Migrar para camada de internacionalização se houver múltiplos idiomas.
*/
function calMonthTitle(date) {
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

/*
  DESCRIÇÃO DA FUNÇÃO: Resolve o convênio ativo a partir da URL ou da sessão local.
  PARÂMETROS E RETORNO: Não recebe parâmetros; retorna object|null com o convênio encontrado.
  ARMAZENAMENTO E PERSISTÊNCIA: Lê URL, `cproeis_convenio_atual` e `cproeis_contratos_convenios`;
  grava `cproeis_convenio_atual` quando a URL traz um convênio válido.
  TODO: Em produção, trocar por sessão autenticada com autorização por responsável.
*/
function calGetConvenio() {
  const params = new URLSearchParams(window.location.search);
  const urlId = params.get('id') || '';
  const storedId = localStorage.getItem(CAL_STORAGE_CONVENIO_ATUAL) || '';
  const convenioId = urlId || storedId;
  const convenio = calReadList(CAL_STORAGE_CONVENIOS).find((item) => item.id === convenioId) || null;

  if (convenio && urlId) {
    localStorage.setItem(CAL_STORAGE_CONVENIO_ATUAL, convenio.id);
  }

  return convenio;
}

/*
  DESCRIÇÃO DA FUNÇÃO: Normaliza a lista de escalados de uma vaga para leitura no quadro diário.
  PARÂMETROS E RETORNO: Recebe vaga (object) e retorna Array<object> com policiais escalados.
  ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; lê somente campos da vaga carregada do LocalStorage.
  TODO: Em produção, ler escalas de entidade própria com ID funcional, presença e status de pagamento.
*/
function calGetEscalados(vaga) {
  const escalados = Array.isArray(vaga.escalados) ? vaga.escalados : [];
  if (escalados.length) return escalados;
  if (!vaga.policialEscaladoId && !vaga.policialEscalado) return [];
  return [{
    policialId: vaga.policialEscaladoId || '',
    nome: vaga.policialEscalado || ''
  }];
}

/*
  DESCRIÇÃO DA FUNÇÃO: Verifica se a vaga tem policial escalado ou quantidade preenchida.
  PARÂMETROS E RETORNO: Recebe vaga (object) e retorna boolean.
  ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; lê campos da vaga carregada do LocalStorage.
  TODO: Em produção, consultar entidade de escala oficial para não depender de campos legados.
*/
function calHasPolicialEscalado(vaga) {
  return Boolean(calGetEscalados(vaga).length || Number(vaga.preenchidas || 0) > 0);
}

/*
  DESCRIÇÃO DA FUNÇÃO: Classifica a vaga para aplicar cor no calendário do convênio.
  PARÂMETROS E RETORNO: Recebe vaga (object) e retorna object com classe visual e rótulo.
  ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; deriva status a partir de campos da vaga.
  TODO: Substituir por status oficial do workflow GSI quando a autorização for online.
*/
function calGetCalendarStatus(vaga) {
  if (calHasPolicialEscalado(vaga)) {
    return { className: 'is-filled', label: 'Vaga preenchida' };
  }

  const releaseAt = calGetAutomaticOfferDeadline(vaga.dataServico);
  const createdAt = vaga.createdAt ? new Date(vaga.createdAt) : new Date(0);
  const createdAfterRelease = Boolean(releaseAt && createdAt > releaseAt);
  const needsGsiAuthorization = vaga.permissaoGsiStatus === 'solicitada' || createdAfterRelease;

  if (needsGsiAuthorization && vaga.permissaoGsiStatus !== 'aprovada') {
    return { className: 'is-warning', label: 'Precisa de autorização do GSI' };
  }

  return { className: 'is-clear', label: 'Liberada ou programada' };
}

/*
  DESCRIÇÃO DA FUNÇÃO: Retorna todas as vagas criadas para o convênio logado.
  PARÂMETROS E RETORNO: Recebe convenio (object|null) e retorna Array<object> ordenado por data/hora.
  ARMAZENAMENTO E PERSISTÊNCIA: Lê `cproeis_convenios_vagas` no LocalStorage.
  TODO: Em produção, consultar endpoint já filtrado por convênio e mês.
*/
function calGetVagasConvenio(convenio) {
  if (!convenio) return [];
  return calReadList(CAL_STORAGE_VAGAS)
    .filter((vaga) => vaga.convenioId === convenio.id)
    .sort((a, b) => (
      String(a.dataServico || '').localeCompare(String(b.dataServico || '')) ||
      String(a.horaInicio || '').localeCompare(String(b.horaInicio || ''))
    ));
}

/*
  DESCRIÇÃO DA FUNÇÃO: Agrupa vagas por data de serviço para renderização do calendário.
  PARÂMETROS E RETORNO: Recebe vagas (Array<object>) e retorna Map<string, Array<object>>.
  ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; agrupa em memória vagas lidas do LocalStorage.
  TODO: Em produção, receber agregados diários prontos da API para reduzir processamento no navegador.
*/
function calGroupByDate(vagas) {
  const grouped = new Map();
  vagas.forEach((vaga) => {
    if (!grouped.has(vaga.dataServico)) grouped.set(vaga.dataServico, []);
    grouped.get(vaga.dataServico).push(vaga);
  });
  return grouped;
}

/*
  DESCRIÇÃO DA FUNÇÃO: Renderiza o quadro inferior com as vagas do dia selecionado no calendário.
  PARÂMETROS E RETORNO: Recebe dateIso (string YYYY-MM-DD) e vagas (Array<object>); não retorna valores.
  ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; atualiza DOM com vagas já carregadas do LocalStorage.
  TODO: Em produção, abrir detalhes operacionais da vaga por rota com permissões e auditoria.
*/
function calRenderSelectedDay(dateIso, vagas) {
  const title = document.getElementById('selected-day-title');
  const subtitle = document.getElementById('selected-day-subtitle');
  const details = document.getElementById('selected-day-details');
  if (!title || !subtitle || !details) return;

  const items = vagas.filter((vaga) => vaga.dataServico === dateIso);
  title.textContent = `Vagas de ${calFormatDate(dateIso)}`;
  subtitle.textContent = items.length
    ? `${items.length} vaga(s) criada(s) para este dia.`
    : 'Nenhuma vaga criada para este dia.';

  if (!items.length) {
    details.innerHTML = '<div class="calendar-empty">Clique em outro dia ou crie novas vagas para visualizar aqui.</div>';
    return;
  }

  details.innerHTML = items.map((vaga) => {
    const escalados = calGetEscalados(vaga);
    const escalaTexto = escalados.length
      ? escalados.map((item) => item.nome || item.policialId || 'Policial').join(', ')
      : 'Sem policial escalado';

    return `
      <article class="calendar-vaga-card">
        <div>
          <strong>${calEscape(vaga.nomeServico || 'Serviço')}</strong>
          <span>${calEscape(vaga.localServico || vaga.enderecoServico || 'Local não informado')}</span>
        </div>
        <div>
          <strong>${calEscape(escalaTexto)}</strong>
          <span>Policial escalado</span>
        </div>
        <div>
          <strong>${calEscape(vaga.classe || '-')}</strong>
          <span>Classe</span>
        </div>
        <div>
          <strong>${calEscape(calFormatCargaHoraria(vaga))}</strong>
          <span>Carga horária</span>
        </div>
        <div>
          <strong>${calEscape(vaga.quantidade || 1)}</strong>
          <span>Vagas</span>
        </div>
        <div>
          <strong>${calEscape(vaga.horaInicio || '-')} até ${calEscape(vaga.horaFim || '-')}</strong>
          <span>Horário</span>
        </div>
      </article>
    `;
  }).join('');
}

/*
  DESCRIÇÃO DA FUNÇÃO: Renderiza o calendário mensal com marcações nos dias que possuem vagas.
  PARÂMETROS E RETORNO: Recebe vagas (Array<object>) e não retorna valores.
  ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; usa a lista em memória e atualiza o DOM.
  TODO: Em produção, permitir filtros por status, classe e serviço diretamente na consulta mensal.
*/
function calRenderCalendar(vagas) {
  const calendar = document.getElementById('service-calendar');
  const title = document.getElementById('calendar-title');
  if (!calendar || !title) return;

  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const leading = (firstDay.getDay() + 6) % 7;
  const todayIso = new Date().toISOString().slice(0, 10);
  const byDate = calGroupByDate(vagas);

  title.textContent = calMonthTitle(calendarMonth);
  calendar.innerHTML = '';

  for (let index = 0; index < leading; index += 1) {
    const blank = document.createElement('div');
    blank.className = 'calendar-day is-muted';
    calendar.appendChild(blank);
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    const dateIso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const items = byDate.get(dateIso) || [];
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = `calendar-day${items.length ? ' has-vagas' : ''}${dateIso === todayIso ? ' is-today' : ''}${dateIso === selectedCalendarDay ? ' is-selected' : ''}`;
    cell.dataset.date = dateIso;
    cell.innerHTML = `<span class="day-number">${day}</span>`;

    items.slice(0, 3).forEach((vaga) => {
      const status = calGetCalendarStatus(vaga);
      const item = document.createElement('div');
      item.className = `calendar-service ${status.className}`;
      item.title = status.label;
      item.innerHTML = `
        <span>${calEscape(vaga.horaInicio || '--:--')} ${calEscape(vaga.nomeServico || 'Serviço')}</span>
        <strong>${calEscape(vaga.quantidade || 1)}</strong>
      `;
      cell.appendChild(item);
    });

    if (items.length > 3) {
      const more = document.createElement('div');
      more.className = 'calendar-more';
      more.textContent = `+${items.length - 3} vaga(s)`;
      cell.appendChild(more);
    }

    cell.addEventListener('click', () => {
      selectedCalendarDay = dateIso;
      calRenderCalendar(vagas);
      calRenderSelectedDay(dateIso, vagas);
    });

    calendar.appendChild(cell);
  }
}

/*
  DESCRIÇÃO DA FUNÇÃO: Inicializa a página de calendário de vagas do convênio logado.
  PARÂMETROS E RETORNO: Não recebe parâmetros nem retorna valores.
  ARMAZENAMENTO E PERSISTÊNCIA: Lê convênio e vagas do LocalStorage; não grava dados.
  TODO: Em produção, recarregar a competência por API ao navegar entre meses.
*/
function inicializarVagasCalendarioConvenio() {
  const convenio = calGetConvenio();
  const vagas = calGetVagasConvenio(convenio);
  const count = document.getElementById('calendar-count');

  if (count) {
    count.textContent = convenio
      ? `${vagas.length} vaga(s) criada(s) pelo convênio.`
      : 'Nenhum convênio ativo foi encontrado para consulta.';
  }

  calRenderCalendar(vagas);
  calRenderSelectedDay(selectedCalendarDay, vagas);

  document.getElementById('calendar-prev')?.addEventListener('click', () => {
    calendarMonth.setMonth(calendarMonth.getMonth() - 1);
    selectedCalendarDay = calFirstDayOfCurrentMonth();
    calRenderCalendar(vagas);
    calRenderSelectedDay(selectedCalendarDay, vagas);
  });

  document.getElementById('calendar-next')?.addEventListener('click', () => {
    calendarMonth.setMonth(calendarMonth.getMonth() + 1);
    selectedCalendarDay = calFirstDayOfCurrentMonth();
    calRenderCalendar(vagas);
    calRenderSelectedDay(selectedCalendarDay, vagas);
  });

  document.getElementById('calendar-today')?.addEventListener('click', () => {
    calendarMonth = new Date();
    calendarMonth.setDate(1);
    selectedCalendarDay = new Date().toISOString().slice(0, 10);
    calRenderCalendar(vagas);
    calRenderSelectedDay(selectedCalendarDay, vagas);
  });
}

inicializarVagasCalendarioConvenio();
