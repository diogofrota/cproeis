const P1_VAGAS_KEYS = {
  servicos: 'cproeis_p1_unidade_servicos',
  vagas: 'cproeis_ras_vagas',
  policiais: 'cproeis_cadastro_policiais'
};

const P1_VAGAS_CLASSES = ['A', 'B', 'C/D'];
const P1_VAGAS_CLASS_LABELS = {
  A: 'Classe A',
  B: 'Classe B',
  'C/D': 'Classe C/D'
};
const P1_VAGAS_CLASS_HINTS = {
  A: 'Coronel e Tenente-Coronel',
  B: 'Major, Capitão, Tenente e Aspirante',
  'C/D': 'Subtenente, Sargento, Cabo e Soldado'
};
const P1_VAGAS_TURNOS = {
  turno6: { label: '6 horas', inicio: '08:00', fim: '14:00', horas: 6 },
  turno8: { label: '8 horas', inicio: '08:00', fim: '16:00', horas: 8 },
  turno12: { label: '12 horas', inicio: '08:00', fim: '20:00', horas: 12 },
  turno24: { label: '24 horas', inicio: '08:00', fim: '08:00', horas: 24 }
};

let p1VagasSelectedService = null;

/**
 * DESCRIÇÃO DA FUNÇÃO: Lê uma lista JSON do LocalStorage usada na criação de vagas da P/1.
 * PARÂMETROS E RETORNO: Recebe `key` (string) e retorna Array<object>.
 * ARMAZENAMENTO E PERSISTÊNCIA: Lê cproeis_p1_unidade_servicos, cproeis_ras_vagas ou
 * cproeis_cadastro_policiais no LocalStorage.
 * TODO: Em produção, substituir por chamadas autenticadas com paginação e tratamento de erro.
 */
function p1VagasReadList(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    return [];
  }
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Grava lista de vagas RAS criadas pela P/1.
 * PARÂMETROS E RETORNO: Recebe `key` (string) e `records` (Array<object>); não retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Grava cproeis_ras_vagas no LocalStorage.
 * TODO: Em produção, enviar criação em lote para backend com transação e auditoria.
 */
function p1VagasSaveList(key, records) {
  localStorage.setItem(key, JSON.stringify(records));
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Escapa texto dinâmico renderizado no wizard de vagas.
 * PARÂMETROS E RETORNO: Recebe `value` (qualquer valor simples) e retorna string segura.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava dados; protege a renderização.
 * TODO: Em produção, manter sanitização também nas respostas da API.
 */
function p1VagasEscapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Cria identificador local para cada vaga RAS gerada pela P/1.
 * PARÂMETROS E RETORNO: Não recebe parâmetros; retorna string única.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados diretamente; o ID é persistido junto da vaga.
 * TODO: Em produção, usar ID do banco de dados.
 */
function p1VagasCreateId() {
  return `p1-ras-vaga-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Formata data ISO simples em dd/mm/aaaa para exibição.
 * PARÂMETROS E RETORNO: Recebe `value` (string yyyy-mm-dd) e retorna string formatada.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não acessa armazenamento.
 * TODO: Em produção, centralizar timezone/formatação em utilitário compartilhado.
 */
function p1VagasFormatDate(value) {
  if (!value) return '-';
  const [year, month, day] = value.split('-');
  return day && month && year ? `${day}/${month}/${year}` : value;
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Retorna uma lista de datas entre início e fim, inclusive.
 * PARÂMETROS E RETORNO: Recebe `start` e `end` (strings yyyy-mm-dd) e retorna Array<string>.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava dados; calcula em memória.
 * TODO: Em produção, validar calendário, feriados e bloqueios operacionais no backend/GSI.
 */
function p1VagasBuildDateRange(start, end) {
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${(end || start)}T00:00:00`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate < startDate) return [];

  const dates = [];
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Define o status inicial da vaga conforme disponibilidade e fluxo do GSI.
 * PARÂMETROS E RETORNO: Recebe `payload` (object) e retorna object com status/label.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; o resultado compõe a vaga salva no LocalStorage.
 * TODO: Em produção, chamar workflow do GSI para aprovar, reprovar ou liberar exceção antes de
 * disponibilizar a vaga ao policial.
 */
function p1VagasResolveGsiStatus(payload) {
  const hasService = Boolean(payload.servicoId);
  const hasQuantity = Number(payload.quantidade || 0) > 0;
  const hasDate = Boolean(payload.dataServico);

  if (!hasService || !hasQuantity || !hasDate) {
    return { status: 'ras_incompleta', label: 'Pendente de dados' };
  }

  return { status: 'pendente_gsi', label: 'Aguardando GSI' };
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Retorna policiais cadastrados na unidade para escala compulsória.
 * PARÂMETROS E RETORNO: Recebe `unidade` (string) e retorna Array<object>.
 * ARMAZENAMENTO E PERSISTÊNCIA: Lê cproeis_cadastro_policiais no LocalStorage.
 * TODO: Em produção, buscar efetivo elegível por API considerando bloqueios e disponibilidade.
 */
function p1VagasGetPoliciaisUnidade(unidade) {
  return p1VagasReadList(P1_VAGAS_KEYS.policiais)
    .filter((policial) => policial.unidade === unidade)
    .sort((a, b) => p1UnitGetPolicialName(a).localeCompare(p1UnitGetPolicialName(b), 'pt-BR'));
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Carrega serviços cadastrados pela P/1 para a unidade logada.
 * PARÂMETROS E RETORNO: Recebe `context` (object) e retorna Array<object>.
 * ARMAZENAMENTO E PERSISTÊNCIA: Lê cproeis_p1_unidade_servicos no LocalStorage.
 * TODO: Em produção, carregar serviços ativos por unidade via API.
 */
function p1VagasGetServicos(context) {
  return p1VagasReadList(P1_VAGAS_KEYS.servicos)
    .filter((servico) => servico.unidade === context.acesso.unidade && servico.status !== 'inativo')
    .sort((a, b) => String(a.nomeServico || '').localeCompare(String(b.nomeServico || ''), 'pt-BR'));
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Preenche o seletor de serviços cadastrados pela P/1.
 * PARÂMETROS E RETORNO: Recebe `context` (object); não retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Lê serviços no LocalStorage e escreve opções no DOM.
 * TODO: Em produção, aplicar filtros por autorização GSI e quantidade liberada por unidade.
 */
function p1VagasRenderServiceOptions(context) {
  const select = document.getElementById('servico-cadastrado');
  const params = new URLSearchParams(window.location.search);
  const requestedService = params.get('servico') || '';
  const servicos = p1VagasGetServicos(context);

  select.innerHTML = servicos.length
    ? '<option value="">Selecione</option>' + servicos.map((servico) => `<option value="${p1VagasEscapeHtml(servico.id)}">${p1VagasEscapeHtml(servico.nomeServico)} - ${p1VagasEscapeHtml(servico.localServico)}</option>`).join('')
    : '<option value="">Nenhum serviço cadastrado</option>';

  if (requestedService && servicos.some((servico) => servico.id === requestedService)) {
    select.value = requestedService;
  }

  p1VagasSyncSelectedService(context);
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Atualiza o preview do serviço selecionado e campos ocultos de referência.
 * PARÂMETROS E RETORNO: Recebe `context` (object); não retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Lê serviços no LocalStorage; altera apenas DOM e variável local.
 * TODO: Em produção, buscar detalhes completos do serviço por ID no backend antes de criar vagas.
 */
function p1VagasSyncSelectedService(context) {
  const select = document.getElementById('servico-cadastrado');
  const preview = document.getElementById('selected-service-preview');
  const servicos = p1VagasGetServicos(context);
  p1VagasSelectedService = servicos.find((servico) => servico.id === select.value) || null;

  if (!p1VagasSelectedService) {
    preview.innerHTML = '<strong>Nenhum serviço selecionado</strong><span>Cadastre um serviço para usar nome, local e endereço nas vagas.</span>';
    return;
  }

  const endereco = p1VagasSelectedService.enderecoDados || {};
  preview.innerHTML = `
    <strong>${p1VagasEscapeHtml(p1VagasSelectedService.nomeServico)}</strong>
    <span>${p1VagasEscapeHtml(p1VagasSelectedService.localServico || '-')} | Classe ${p1VagasEscapeHtml(p1VagasSelectedService.classePadrao || '-')} | ${p1VagasEscapeHtml(endereco.logradouro || '-')}, ${p1VagasEscapeHtml(endereco.numero || '-')}</span>
  `;

  p1VagasApplyServiceClassRestriction();
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Restringe a classe da vaga RAS à classe definida no serviço da P/1.
 * PARÂMETROS E RETORNO: Não recebe parâmetros nem retorna valor; usa o serviço selecionado em memória.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; lê `p1VagasSelectedService` carregado de
 * cproeis_p1_unidade_servicos e altera apenas radios no DOM.
 * TODO: Em produção, validar no backend que a vaga criada usa a mesma classe do serviço autorizado.
 */
function p1VagasApplyServiceClassRestriction() {
  const classePadrao = p1VagasSelectedService?.classePadrao || '';
  if (classePadrao && P1_VAGAS_CLASSES.includes(classePadrao)) {
    const input = document.querySelector(`input[name="classe-vaga"][value="${classePadrao}"]`);
    if (input) input.checked = true;
  }
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Renderiza os cartões de classe, turno, quantidade e tipo de escala.
 * PARÂMETROS E RETORNO: Recebe `context` (object); não retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Lê policiais da unidade no LocalStorage para opções compulsórias.
 * TODO: Em produção, filtrar policiais por disponibilidade real, afastamentos e conflito de serviço.
 */
function p1VagasRenderClassChoices(context) {
  const container = document.getElementById('class-choice-grid');
  const policiais = p1VagasGetPoliciaisUnidade(context.acesso.unidade);
  const policialOptions = '<option value="">Selecione para compulsória</option>' + policiais.map((policial) => `
    <option value="${p1VagasEscapeHtml(p1UnitGetPolicialKeys(policial)[0] || '')}">${p1VagasEscapeHtml(p1UnitGetPolicialName(policial))} - RG ${p1VagasEscapeHtml(policial.rg || '-')}</option>
  `).join('');

  container.innerHTML = `
    <div class="class-picker is-hidden" aria-hidden="true">
      ${P1_VAGAS_CLASSES.map((classe, index) => `
        <input type="radio" name="classe-vaga" value="${classe}" ${index === 0 ? 'checked' : ''}>
      `).join('')}
    </div>
    <div class="service-grid wide class-detail-grid">
      <label>
        Turno
        <select id="turno-vaga">
          ${Object.entries(P1_VAGAS_TURNOS).map(([value, turno]) => `<option value="${value}">${turno.label}</option>`).join('')}
        </select>
      </label>
      <label>
        Quantidade
        <input id="quantidade-vaga" type="number" min="1" value="1" required>
      </label>
      <label>
        Tipo de escala
        <select id="tipo-escala-vaga">
          <option value="normal">Normal</option>
          <option value="compulsoria">Compulsória</option>
        </select>
      </label>
      <label>
        Policial compulsório
        <select id="policial-compulsorio-vaga" disabled>${policialOptions}</select>
      </label>
    </div>
  `;

  p1VagasApplyServiceClassRestriction();
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Alterna o seletor de policial compulsório conforme tipo de escala.
 * PARÂMETROS E RETORNO: Não recebe parâmetros nem retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não acessa armazenamento; altera apenas DOM.
 * TODO: Em produção, aplicar autorização e justificativa para escala compulsória no backend.
 */
function p1VagasSyncCompulsoryField() {
  const isCompulsory = document.getElementById('tipo-escala-vaga')?.value === 'compulsoria';
  const select = document.getElementById('policial-compulsorio-vaga');
  if (!select) return;
  select.disabled = !isCompulsory;
  if (!isCompulsory) select.value = '';
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Avança ou volta os cartões do wizard de criação de vagas.
 * PARÂMETROS E RETORNO: Recebe `targetId` (string); não retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não acessa armazenamento; controla apenas classes no DOM.
 * TODO: Em produção, manter estado do wizard em componente de frontend testável.
 */
function p1VagasShowStep(targetId) {
  const steps = ['service-selection-card', 'class-selection-card', 'date-selection-card'];
  const targetIndex = steps.indexOf(targetId);

  steps.forEach((id, index) => {
    const shouldShow = targetIndex >= 0 && index <= targetIndex;
    document.getElementById(id)?.classList.toggle('is-hidden', !shouldShow);
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Monta resumo de criação antes de salvar as vagas RAS da P/1.
 * PARÂMETROS E RETORNO: Não recebe parâmetros; retorna object com payload parcial e datas.
 * ARMAZENAMENTO E PERSISTÊNCIA: Lê valores do DOM; não grava dados.
 * TODO: Em produção, solicitar pré-validação do GSI e disponibilidade antes da confirmação.
 */
function p1VagasBuildSummaryPayload() {
  const classe = document.querySelector('input[name="classe-vaga"]:checked')?.value || 'A';
  const turno = P1_VAGAS_TURNOS[document.getElementById('turno-vaga')?.value] || P1_VAGAS_TURNOS.turno6;
  const tipoEscala = document.getElementById('tipo-escala-vaga')?.value || 'normal';
  const quantidade = Number(document.getElementById('quantidade-vaga')?.value || 0);
  const dataInicio = document.getElementById('data-inicio')?.value || '';
  const dataFim = document.getElementById('data-fim')?.value || dataInicio;
  const dates = p1VagasBuildDateRange(dataInicio, dataFim);

  return { classe, turno, tipoEscala, quantidade, dataInicio, dataFim, dates };
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Exibe modal de resumo com quantidade de vagas que serão enviadas ao GSI.
 * PARÂMETROS E RETORNO: Não recebe parâmetros nem retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; escreve resumo no DOM.
 * TODO: Em produção, incluir retorno de disponibilidade oficial e saldo liberado na prévia.
 */
function p1VagasPreviewCreation() {
  const payload = p1VagasBuildSummaryPayload();
  const summary = document.getElementById('creation-summary');
  const modal = document.getElementById('creation-summary-modal');

  if (!p1VagasSelectedService || !payload.dates.length || payload.quantidade < 1) {
    alert('Selecione serviço, quantidade e período válido antes de avançar.');
    return;
  }

  if (payload.tipoEscala === 'compulsoria' && !document.getElementById('policial-compulsorio-vaga')?.value) {
    alert('Selecione o policial para a escala compulsória.');
    return;
  }

  summary.innerHTML = `
    <div class="summary">
      <div class="summary-item"><span>Serviço</span><strong>${p1VagasEscapeHtml(p1VagasSelectedService.nomeServico)}</strong></div>
      <div class="summary-item"><span>Classe</span><strong>${p1VagasEscapeHtml(P1_VAGAS_CLASS_LABELS[payload.classe])}</strong></div>
      <div class="summary-item"><span>Período</span><strong>${p1VagasEscapeHtml(p1VagasFormatDate(payload.dataInicio))} até ${p1VagasEscapeHtml(p1VagasFormatDate(payload.dataFim))}</strong></div>
      <div class="summary-item"><span>Total</span><strong>${payload.dates.length * payload.quantidade} vaga(s)</strong></div>
      <div class="summary-item"><span>Fluxo</span><strong>Aguardando GSI</strong></div>
    </div>
  `;
  modal.classList.remove('is-hidden');
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Cria vagas RAS da P/1 e marca o fluxo inicial para análise do GSI.
 * PARÂMETROS E RETORNO: Recebe `event` (SubmitEvent) e `context` (object); não retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Lê formulário/LocalStorage e grava registros em cproeis_ras_vagas.
 * TODO: Em produção, substituir gravação local por envio ao workflow do GSI com critérios de
 * disponibilidade, aprovação e auditoria.
 */
function p1VagasHandleSubmit(event, context) {
  event.preventDefault();
  const payload = p1VagasBuildSummaryPayload();
  const unitPoliciais = p1VagasGetPoliciaisUnidade(context.acesso.unidade);
  const policialCompulsorioId = document.getElementById('policial-compulsorio-vaga')?.value || '';
  const policialCompulsorio = unitPoliciais.find((policial) => p1UnitGetPolicialKeys(policial).includes(policialCompulsorioId)) || null;
  const now = new Date().toISOString();
  const vagas = p1VagasReadList(P1_VAGAS_KEYS.vagas);
  const novasVagas = [];

  payload.dates.forEach((dataServico) => {
    for (let index = 0; index < payload.quantidade; index += 1) {
      const base = {
        id: p1VagasCreateId(),
        origem: 'P1_RAS',
        unidade: context.acesso.unidade,
        responsavelP1Id: p1UnitGetPolicialKeys(context.policial)[0] || context.acesso.policialId || '',
        responsavelP1Nome: p1UnitGetPolicialName(context.policial),
        servicoId: p1VagasSelectedService.id,
        nomeServico: p1VagasSelectedService.nomeServico,
        localServico: p1VagasSelectedService.localServico,
        enderecoServico: p1VagasSelectedService.enderecoDados || {},
        dataServico,
        classe: payload.classe,
        quantidade: 1,
        horaInicio: payload.turno.inicio,
        horaTermino: payload.turno.fim,
        cargaHoraria: payload.turno.horas,
        tipoEscala: payload.tipoEscala,
        policialCompulsorioId: policialCompulsorio ? p1UnitGetPolicialKeys(policialCompulsorio)[0] || '' : '',
        policialCompulsorioNome: policialCompulsorio ? p1UnitGetPolicialName(policialCompulsorio) : '',
        criadoEm: now,
        atualizadoEm: now
      };
      const gsi = p1VagasResolveGsiStatus(base);
      novasVagas.push({ ...base, status: gsi.status, statusLabel: gsi.label });
    }
  });

  p1VagasSaveList(P1_VAGAS_KEYS.vagas, [...vagas, ...novasVagas]);
  window.location.href = document.querySelector('[href^="vagas.html"]')?.href || 'vagas.html';
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Inicializa a página de criação de vagas da P/1 Unidade.
 * PARÂMETROS E RETORNO: Não recebe parâmetros nem retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Lê sessão/serviços/policiais no LocalStorage e conecta submit
 * que grava em cproeis_ras_vagas.
 * TODO: Em produção, carregar dados iniciais via API e validar todas as etapas no servidor.
 */
function p1VagasInit() {
  const context = p1UnitResolveSession();
  const form = document.getElementById('vaga-form');

  if (!form) return;

  if (!context) {
    form.querySelectorAll('input, select, button').forEach((field) => {
      field.disabled = true;
    });
    return;
  }

  p1VagasRenderServiceOptions(context);
  p1VagasRenderClassChoices(context);
  p1VagasSyncCompulsoryField();

  document.getElementById('servico-cadastrado')?.addEventListener('change', () => p1VagasSyncSelectedService(context));
  document.getElementById('tipo-escala-vaga')?.addEventListener('change', p1VagasSyncCompulsoryField);
  document.querySelectorAll('[data-step-next]').forEach((button) => {
    button.addEventListener('click', () => {
      if (button.dataset.stepNext === 'class-selection-card' && !p1VagasSelectedService) {
        alert('Selecione um serviço cadastrado antes de avançar.');
        return;
      }
      p1VagasShowStep(button.dataset.stepNext);
    });
  });
  document.querySelectorAll('[data-step-back]').forEach((button) => {
    button.addEventListener('click', () => p1VagasShowStep(button.dataset.stepBack));
  });
  document.getElementById('preview-button')?.addEventListener('click', p1VagasPreviewCreation);
  document.getElementById('edit-summary-button')?.addEventListener('click', () => {
    document.getElementById('creation-summary-modal')?.classList.add('is-hidden');
  });
  form.addEventListener('submit', (event) => p1VagasHandleSubmit(event, context));
}

document.addEventListener('DOMContentLoaded', p1VagasInit);
