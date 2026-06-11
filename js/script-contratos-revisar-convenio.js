const REVIEW_STORAGE_CONVENIOS = 'cproeis_contratos_convenios';
const REVIEW_STORAGE_VALORES = 'cproeis_contratos_valores';
const REVIEW_STORAGE_RESPONSAVEIS = 'cproeis_contratos_responsaveis';
const REVIEW_STORAGE_LIMITES_VAGAS = 'cproeis_contratos_limites_vagas';
const REVIEW_STORAGE_DRAFT = 'cproeis_contratos_revisao_convenio';
const REVIEW_STORAGE_SUCCESS = 'cproeis_contratos_operacao_concluida';
const REVIEW_JSON_API = window.CPROEISContratosJsonApi || null;

const reviewContent = document.getElementById('review-content');
const reviewEmpty = document.getElementById('review-empty');
const reviewStatus = document.getElementById('review-status');
const reviewConfirm = document.getElementById('review-confirm');
const reviewEdit = document.getElementById('review-edit');
const reviewPanel = document.querySelector('.review-panel');

const reviewMoney = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function reviewLoadList(key) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Lê uma lista JSON do LocalStorage usada pelo módulo de contratos.
   * PARÂMETROS E RETORNO: Recebe key como string e retorna array; em erro retorna array vazio.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê LocalStorage, mas não grava dados.
   * TODO: Em produção, substituir por consulta de API com tratamento de erro e autenticação.
   */
  if (REVIEW_JSON_API?.readJsonList) return REVIEW_JSON_API.readJsonList(key);
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    return [];
  }
}

function reviewSaveList(key, list) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Persiste uma lista do módulo de contratos no LocalStorage.
   * PARÂMETROS E RETORNO: Recebe key como string e list como array; não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Grava LocalStorage na chave informada.
   * TODO: Em produção, substituir esta gravação local por POST/PUT transacional no backend.
   */
  if (REVIEW_JSON_API?.writeJsonList) {
    REVIEW_JSON_API.writeJsonList(key, list);
    return;
  }
  localStorage.setItem(key, JSON.stringify(list));
}

function reviewEscapeHtml(value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Escapa texto antes de montar HTML de revisão, evitando interpretar
   * caracteres digitados como marcação.
   * PARÂMETROS E RETORNO: Recebe value como string/número e retorna string segura para HTML.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava dados; apenas transforma valor em memória.
   * TODO: Em produção, manter sanitização também no backend e na camada de template.
   */
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function reviewFormatDate(value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Converte data ISO yyyy-mm-dd para apresentação brasileira na revisão.
   * PARÂMETROS E RETORNO: Recebe value como string e retorna dd/mm/yyyy ou "-".
   * ARMAZENAMENTO E PERSISTÊNCIA: Não acessa armazenamento; formata dado já carregado.
   * TODO: Em produção, centralizar formatos de data em utilitário comum do sistema.
   */
  if (!value) return '-';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

function reviewField(label, value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Monta uma célula textual de conferência com rótulo e valor.
   * PARÂMETROS E RETORNO: Recebe label e value como strings e retorna HTML.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; usa valores em memória do rascunho.
   * TODO: Em produção, permitir sinalizar campos obrigatórios ou pendentes na revisão.
   */
  return `<div class="review-field"><span>${reviewEscapeHtml(label)}</span><strong>${reviewEscapeHtml(value || '-')}</strong></div>`;
}

function reviewSection(title, content) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Agrupa blocos de conferência por assunto para melhorar leitura antes
   * do envio ao banco.
   * PARÂMETROS E RETORNO: Recebe title como string e content como HTML; retorna HTML da seção.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava dados.
   * TODO: Em produção, adicionar trilha de aprovação por seção quando houver workflow formal.
   */
  return `<section class="review-section"><h3>${reviewEscapeHtml(title)}</h3>${content}</section>`;
}

function reviewTable(headers, rows) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Renderiza dados repetitivos da revisão em tabela compacta para
   * melhorar comparação entre classes, turnos e responsáveis.
   * PARÂMETROS E RETORNO: Recebe headers como array de strings e rows como array de arrays;
   * retorna string HTML da tabela.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não acessa armazenamento; renderiza dados já preparados
   * em memória.
   * TODO: Em produção, substituir por componente de tabela compartilhado com acessibilidade completa.
   */
  return `
    <div class="review-table-wrap">
      <table class="review-table">
        <thead>
          <tr>${headers.map((header) => `<th>${reviewEscapeHtml(header)}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr>${row.map((cell) => `<td>${reviewEscapeHtml(cell)}</td>`).join('')}</tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function reviewGetDraft() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Recupera o rascunho enviado pelo formulário de cadastro para a etapa
   * de revisão.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e retorna objeto com payload ou null.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê sessionStorage na chave `cproeis_contratos_revisao_convenio`.
   * TODO: Em produção, buscar o rascunho em endpoint temporário com expiração e dono autenticado.
   */
  if (REVIEW_JSON_API?.readSessionJson) return REVIEW_JSON_API.readSessionJson(REVIEW_STORAGE_DRAFT);
  try {
    return JSON.parse(sessionStorage.getItem(REVIEW_STORAGE_DRAFT)) || null;
  } catch (error) {
    return null;
  }
}

function reviewCreateEmptyPayload() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Cria um payload vazio apenas para renderizar o formato completo da
   * página de revisão mesmo quando ainda não há cadastro pendente.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e retorna objeto com as mesmas chaves esperadas
   * pelo payload real do cadastro de convênio.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava armazenamento; fornece somente dados vazios
   * em memória para apresentação.
   * TODO: Em produção, derivar este modelo dos metadados oficiais dos campos do contrato.
   */
  const classesValores = [
    ['A', 'Oficiais superiores'],
    ['B', 'Oficiais intermediários e subalternos'],
    ['C', 'Praças subtenentes e sargentos'],
    ['D', 'Cabos e soldados']
  ];
  const classesLimites = [
    ['A', 'Oficiais superiores'],
    ['B', 'Oficiais intermediários e subalternos'],
    ['C/D', 'Subtenentes, sargentos, cabos e soldados']
  ];

  return {
    nome: '',
    cnpj: '',
    tipoConveniado: '',
    endereco: '',
    enderecoDados: {
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      uf: ''
    },
    numero: '',
    diarioData: '',
    diarioPagina: '',
    valorContrato: null,
    inicio: '',
    fim: '',
    limitesVagasSemana: {
      dias: [
        { key: 'segunda', label: 'Segunda-feira', ativo: false },
        { key: 'terca', label: 'Terça-feira', ativo: false },
        { key: 'quarta', label: 'Quarta-feira', ativo: false },
        { key: 'quinta', label: 'Quinta-feira', ativo: false },
        { key: 'sexta', label: 'Sexta-feira', ativo: false },
        { key: 'sabado', label: 'Sábado', ativo: false },
        { key: 'domingo', label: 'Domingo', ativo: false }
      ]
    },
    limitesVagasDiarias: classesLimites.map(([classe, grupo]) => ({
      classe,
      grupo,
      servico6: null,
      servico8: null,
      servico12: null
    })),
    valores: classesValores.map(([classe, grupo]) => ({
      classe,
      grupo,
      servico6: null,
      servico8: null,
      servico12: null,
      passagem: null,
      alimentacao: null
    })),
    responsaveis: []
  };
}

function reviewFormatMoneyOrBlank(value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Formata valores monetários quando preenchidos e mantém um traço
   * visual quando a página está apenas mostrando o modelo vazio.
   * PARÂMETROS E RETORNO: Recebe value como número/string e retorna string formatada.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não acessa armazenamento; apenas formata valor em memória.
   * TODO: Em produção, diferenciar valor zero real de campo ainda não informado por metadado.
   */
  if (value === null || value === undefined || value === '') return '-';
  return reviewMoney.format(Number(value || 0));
}

function reviewRenderPayload(payload) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Renderiza todos os dados do convênio em formato textual de conferência,
   * evitando controles de edição na própria página.
   * PARÂMETROS E RETORNO: Recebe payload como objeto de convênio e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê somente o objeto em memória vindo do sessionStorage; escreve
   * HTML no DOM.
   * TODO: Em produção, destacar divergências automáticas antes da confirmação final.
   */
  const valores = payload.valores || [];
  const limites = payload.limitesVagasDiarias || [];
  const responsaveis = payload.responsaveis || [];
  const valorBase = valores[0] || {};
  const endereco = payload.enderecoDados || {};
  const logradouroNumero = [endereco.logradouro, endereco.numero].filter(Boolean).join(', ');
  const enderecoCompleto = [logradouroNumero, endereco.complemento].filter(Boolean).join(' - ');
  const cidadeUf = [endereco.cidade, endereco.uf].filter(Boolean).join('/');

  const identificacaoHtml = `
    <div class="review-grid">
      ${reviewField('Nome do convênio', payload.nome)}
      ${reviewField('CNPJ', payload.cnpj)}
      ${reviewField('Tipo de conveniado', payload.tipoConveniado || 'Não informado')}
    </div>
  `;

  const enderecoHtml = `
    <div class="review-grid">
      ${reviewField('Endereço', enderecoCompleto)}
      ${reviewField('Bairro', endereco.bairro)}
      ${reviewField('Cidade/UF', cidadeUf)}
      ${reviewField('CEP', endereco.cep)}
    </div>
  `;

  const contratoHtml = `
    <div class="review-grid">
      ${reviewField('Nº do contrato', payload.numero)}
      ${reviewField('Data da publicação', reviewFormatDate(payload.diarioData))}
      ${reviewField('Página do Diário Oficial', payload.diarioPagina)}
      ${reviewField('Valor do contrato', reviewFormatMoneyOrBlank(payload.valorContrato))}
    </div>
  `;

  const vigenciaHtml = `
    <div class="review-grid">
      ${reviewField('Início da vigência', reviewFormatDate(payload.inicio))}
      ${reviewField('Fim da vigência', reviewFormatDate(payload.fim))}
    </div>
  `;

  const weekdayShortLabels = {
    segunda: 'Segunda',
    terca: 'Terça',
    quarta: 'Quarta',
    quinta: 'Quinta',
    sexta: 'Sexta',
    sabado: 'Sábado',
    domingo: 'Domingo'
  };
  const diasHtml = `
    <p class="hint">Dias marcados no cadastro para uso da quantidade diária informada.</p>
    <div class="review-weekdays">${(payload.limitesVagasSemana?.dias || []).map((dia) => `
      <span class="review-chip ${dia.ativo ? 'active' : 'inactive'}">${dia.ativo ? reviewEscapeHtml(weekdayShortLabels[dia.key] || dia.label || dia.key) : '&nbsp;'}</span>
    `).join('')}</div>
  `;

  const limitesHtml = limites.length
    ? reviewTable(
      ['Classe', 'Grupo', '6h por dia', '8h por dia', '12h por dia'],
      limites.map((item) => [
        `Classe ${item.classe}`,
        item.grupo || '-',
        item.servico6 ?? '-',
        item.servico8 ?? '-',
        item.servico12 ?? '-'
      ])
    )
    : '<p class="hint">Nenhum limite diário informado.</p>';

  const valoresHtml = valores.length
    ? reviewTable(
      ['Classe', 'Grupo', 'Serviço 6h', 'Serviço 8h', 'Serviço 12h'],
      valores.map((item) => [
        `Classe ${item.classe}`,
        item.grupo || '-',
        reviewFormatMoneyOrBlank(item.servico6),
        reviewFormatMoneyOrBlank(item.servico8),
        reviewFormatMoneyOrBlank(item.servico12)
      ])
    )
    : '<p class="hint">Nenhum valor por classe informado.</p>';

  const beneficiosHtml = `
    <div class="review-grid">
      ${reviewField('Passagem', reviewFormatMoneyOrBlank(valorBase.passagem))}
      ${reviewField('Alimentação', reviewFormatMoneyOrBlank(valorBase.alimentacao))}
    </div>
  `;

  const responsaveisHtml = responsaveis.length
    ? reviewTable(
      ['Nome', 'CPF', 'Email', 'Telefone'],
      responsaveis.map((item) => [
        item.nome || '-',
        item.cpf || '-',
        item.email || '-',
        item.telefone || '-'
      ])
    )
    : reviewTable(['Nome', 'CPF', 'Email', 'Telefone'], [['-', '-', '-', '-']]);

  reviewContent.innerHTML = [
    reviewSection('Identificação do conveniado', identificacaoHtml),
    reviewSection('Endereço', enderecoHtml),
    reviewSection('Contrato e publicação', contratoHtml),
    reviewSection('Vigência do contrato', vigenciaHtml),
    reviewSection('Valores por classe', valoresHtml),
    reviewSection('Passagem e alimentação', beneficiosHtml),
    reviewSection('Total diário de vagas por classe e turno', limitesHtml),
    reviewSection('Dias de funcionamento do contrato', diasHtml),
    reviewSection('Responsáveis', responsaveisHtml)
  ].join('');
}

function reviewPersistPayload(payload) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Confirma o cadastro revisado e grava o convênio com seus dados
   * dependentes nas chaves locais do módulo de contratos.
   * PARÂMETROS E RETORNO: Recebe payload como objeto de convênio e retorna booleano de sucesso.
   * ARMAZENAMENTO E PERSISTÊNCIA: Grava LocalStorage nas chaves de convênios, valores,
   * responsáveis e limites de vagas; remove o rascunho de sessionStorage ao final.
   * TODO: Em produção, trocar por chamada única de API transacional para evitar gravação parcial.
   */
  if (REVIEW_JSON_API?.confirmarCadastroConvenio) {
    /*
     * DESCRIÇÃO DO BLOCO: Envia o payload completo do convênio para a camada JSON local,
     * mantendo a tela desacoplada do mecanismo físico de gravação.
     * PARÂMETROS E RETORNO: Usa payload como objeto de convênio e recebe resposta JSON com
     * ok/message/data; não retorna valor para a interface.
     * ARMAZENAMENTO E PERSISTÊNCIA: A camada `CPROEISContratosJsonApi` grava LocalStorage agora.
     * TODO: Em produção, essa chamada deverá virar POST/PUT para API real e tratar erros de rede.
     */
    const response = REVIEW_JSON_API.confirmarCadastroConvenio(payload);
    if (!response.ok) {
      if (reviewStatus) reviewStatus.textContent = response.message || 'Não foi possível confirmar o cadastro.';
      return false;
    }
    REVIEW_JSON_API.removeSessionJson(REVIEW_STORAGE_DRAFT);
    return true;
  }

  const convenios = reviewLoadList(REVIEW_STORAGE_CONVENIOS);
  const exists = convenios.some((item) => item.id === payload.id);
  const nextConvenios = exists
    ? convenios.map((item) => item.id === payload.id ? payload : item)
    : [...convenios, payload];

  reviewSaveList(REVIEW_STORAGE_CONVENIOS, nextConvenios);
  reviewSaveList(REVIEW_STORAGE_VALORES, [
    ...reviewLoadList(REVIEW_STORAGE_VALORES).filter((item) => item.convenioId !== payload.id),
    ...(payload.valores || [])
  ]);
  reviewSaveList(REVIEW_STORAGE_RESPONSAVEIS, [
    ...reviewLoadList(REVIEW_STORAGE_RESPONSAVEIS).filter((item) => item.convenioId !== payload.id),
    ...(payload.responsaveis || [])
  ]);
  reviewSaveList(REVIEW_STORAGE_LIMITES_VAGAS, [
    ...reviewLoadList(REVIEW_STORAGE_LIMITES_VAGAS).filter((item) => item.convenioId !== payload.id),
    ...(payload.limitesVagasDiarias || [])
  ]);

  sessionStorage.removeItem(REVIEW_STORAGE_DRAFT);
  return true;
}

function reviewSetSavingState(message) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Bloqueia a tela de revisão durante a gravação e exibe mensagem
   * visível para o usuário aguardar.
   * PARÂMETROS E RETORNO: Recebe message como string e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; altera apenas DOM, texto e estado dos botões.
   * TODO: Em produção, controlar este estado a partir da Promise da API real e exibir falhas.
   */
  if (reviewStatus) reviewStatus.textContent = message;
  if (reviewConfirm) {
    reviewConfirm.disabled = true;
    reviewConfirm.textContent = 'Gravando...';
  }
  if (reviewEdit) reviewEdit.disabled = true;
  reviewPanel?.classList.add('is-saving');

  if (reviewPanel && !reviewPanel.querySelector('.review-saving-message')) {
    const saving = document.createElement('div');
    saving.className = 'review-saving-message';
    saving.textContent = message;
    reviewPanel.querySelector('.review-actions')?.before(saving);
  }
}

function reviewSaveSuccessMessage(payload) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Salva o resultado textual da confirmação para a página padrão de
   * operação concluída.
   * PARÂMETROS E RETORNO: Recebe payload do convênio e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Grava sessionStorage em `cproeis_contratos_operacao_concluida`.
   * TODO: Em produção, substituir por protocolo de retorno vindo da API de gravação.
   */
  const message = {
    tipo: 'convenio',
    title: 'Convênio cadastrado',
    message: `${payload.nome || 'O convênio'} foi gravado com sucesso. Os dados já podem ser consultados na tabela de contratos.`,
    primaryHref: 'tabela-convenios.html',
    primaryText: 'Ver contratos cadastrados'
  };

  if (REVIEW_JSON_API?.writeSessionJson) {
    REVIEW_JSON_API.writeSessionJson(REVIEW_STORAGE_SUCCESS, message);
    return;
  }
  sessionStorage.setItem(REVIEW_STORAGE_SUCCESS, JSON.stringify(message));
}

function reviewInit() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Inicializa a página de revisão, renderizando o rascunho ou mostrando
   * aviso quando não houver cadastro pendente.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê sessionStorage e configura eventos que podem gravar
   * LocalStorage ao confirmar.
   * TODO: Em produção, validar permissão do usuário antes de permitir confirmação final.
   */
  const draft = reviewGetDraft();
  const payload = draft?.payload;

  if (!payload) {
    reviewRenderPayload(reviewCreateEmptyPayload());
    if (reviewEmpty) reviewEmpty.hidden = true;
    if (reviewContent) reviewContent.hidden = false;
    if (reviewConfirm) reviewConfirm.disabled = true;
    if (reviewStatus) reviewStatus.textContent = 'Modelo de conferência. Os dados digitados no cadastro aparecerão nestes campos.';
    return;
  }

  reviewRenderPayload(payload);

  reviewConfirm?.addEventListener('click', () => {
    reviewSetSavingState('Gravando os dados do convênio. Aguarde a confirmação antes de sair da página.');
    window.setTimeout(() => {
      if (reviewPersistPayload(payload)) {
        reviewSaveSuccessMessage(payload);
        window.location.href = `operacao-concluida.html?tipo=convenio&id=${encodeURIComponent(payload.id || '')}`;
      } else if (reviewConfirm) {
        reviewConfirm.disabled = false;
        reviewConfirm.textContent = 'Confirmar e enviar';
        if (reviewEdit) reviewEdit.disabled = false;
      }
    }, 500);
  });

  reviewEdit?.addEventListener('click', () => {
    window.location.href = 'cadastrar-convenio.html?draft=1';
  });
}

reviewInit();
