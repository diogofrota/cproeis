const STORAGE_CONVENIOS = 'cproeis_contratos_convenios';
const STORAGE_VAGAS = 'cproeis_convenios_vagas';
const STORAGE_CONVENIO_ATUAL = 'cproeis_convenio_atual';
const STORAGE_CONVENIO_RESPONSAVEL_ATUAL = 'cproeis_convenio_responsavel_atual';
const today = new Date().toISOString().slice(0, 10);
const currentMonth = today.slice(0, 7);
const dinheiro = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const gruposClasse = {
  A: 'Classe A',
  B: 'Classe B',
  C: 'Classe C',
  D: 'Classe D',
  'C/D': 'Classe C/D'
};

/*
 * DESCRIÇÃO DO BLOCO: Define as classes que o responsável pode escolher ao criar vagas.
 * Para criação operacional, a classe D não é disponibilizada isoladamente; praças de C e D
 * entram pela opção agregada C/D.
 * PARÂMETROS E RETORNO: Não recebe parâmetros; fornece array de strings usado na montagem do DOM.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; limita apenas as opções que serão persistidas
 * em cproeis_convenios_vagas durante a criação.
 * TODO: Na FOPAG, calcular pagamento individual por graduação: Soldado/Cabo usam valor cadastrado
 * da classe D; Sargento/Subtenente usam valor cadastrado da classe C, mesmo quando a vaga foi criada como C/D.
 */
const classesDisponiveis = ['A', 'B', 'C/D'];
const classesCriacaoPermitidas = new Set(classesDisponiveis);
const descricoesClasseCriacao = {
  A: 'Coronel e Tenente-Coronel',
  B: 'Major, Capitão, Tenente e Aspirante',
  'C/D': 'Subtenente, Sargento, Cabo e Soldado'
};

const tiposServico = {
  servico12: 'Serviço 12h',
  servico8: 'Serviço 8h',
  servico6: 'Serviço 6h'
};

const turnosServico = {
  turno6: { label: '6 horas', tipoServico: 'servico6', inicio: '08:00', fim: '14:00', horas: 6 },
  turno8: { label: '8 horas', tipoServico: 'servico8', inicio: '08:00', fim: '16:00', horas: 8 },
  turno12: { label: '12 horas', tipoServico: 'servico12', inicio: '08:00', fim: '20:00', horas: 12 }
};

const cursosDisponiveis = [
  { value: '', label: 'Sem curso específico' },
  { value: 'curso-futuro-1', label: 'Curso a cadastrar 1' },
  { value: 'curso-futuro-2', label: 'Curso a cadastrar 2' }
];

const mesesAno = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
];

const selectedCalendarDates = new Set();
const creationDateState = {
  selectedDates: selectedCalendarDates,
  mode: '',
  month: currentMonth
};
const customDatePickerState = {
  fieldId: '',
  month: currentMonth,
  convenio: null
};
const creationStepIds = [
  'date-selection-card',
  'service-name-card',
  'service-info-card',
  'class-selection-card'
];
let selectedConvenioCache = null;

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Lê uma lista JSON persistida no navegador e devolve um array seguro para uso da tela.
 * Isso evita quebra da página caso a chave não exista ou tenha conteúdo inválido.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} key - Chave do LocalStorage que deve ser consultada.
 * @returns {Array<object>} Lista de objetos gravados na chave informada ou array vazio.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Os dados são lidos diretamente do LocalStorage do navegador.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: substituir a leitura direta do LocalStorage por chamada assíncrona a uma API com tratamento de erro e controle de autenticação.
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
 * Persiste uma lista de objetos no navegador, mantendo a tela operacional independente do cadastro de contratos.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} key - Chave do LocalStorage onde a lista será gravada.
 * @param {Array<object>} list - Lista serializável que será armazenada.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Os dados são gravados no LocalStorage do navegador.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: migrar a gravação para uma API transacional para impedir perda de dados e permitir auditoria em produção.
 */
function saveList(key, list) {
  localStorage.setItem(key, JSON.stringify(list));
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Cria um identificador simples para novas vagas locais, reduzindo colisões em operações sequenciais.
 *
 * PARÂMETROS E RETORNO:
 * @returns {string} Identificador composto por timestamp e trecho aleatório hexadecimal.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não lê nem grava dados; o ID gerado será persistido junto da vaga quando o formulário for salvo.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: usar IDs gerados pelo banco de dados ou UUIDs fornecidos pelo backend quando houver ambiente online.
 */
function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Escapa conteúdo exibido em HTML dinâmico para reduzir risco de injeção de marcação na página.
 *
 * PARÂMETROS E RETORNO:
 * @param {unknown} value - Valor que será convertido para texto seguro.
 * @returns {string} Texto com caracteres HTML sensíveis substituídos por entidades.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa armazenamento; protege apenas a renderização de dados vindos do LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: manter sanitização no backend e aplicar políticas de segurança de conteúdo em produção.
 */
function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Remove caracteres não numéricos de campos que devem aceitar somente números.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} value - Texto digitado pelo usuário.
 * @returns {string} Texto contendo apenas dígitos.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não lê nem grava dados; normaliza valores antes de exibir e persistir no LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: reaproveitar esta normalização em validações de backend quando os cadastros forem online.
 */
function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Reduz o nome do responsável ao primeiro nome para exibição na página de acesso do convênio.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} nome - Nome completo salvo no cadastro de contratos.
 * @returns {string} Primeiro nome normalizado ou hífen quando não houver nome.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; apenas trata texto lido do LocalStorage antes de renderizar no DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: aplicar regras de privacidade por perfil quando houver autenticação real de usuários.
 */
function getResponsavelDisplayName(nome) {
  const firstName = normalizeTextInput(nome).split(' ').filter(Boolean)[0] || '';
  return firstName || '-';
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Mascara CPF na tela preservando apenas os três primeiros dígitos para reduzir exposição de dado pessoal.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} value - CPF completo ou parcial salvo no cadastro.
 * @returns {string} CPF mascarado no padrão 000.***.***-** ou hífen.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não altera LocalStorage; o CPF completo continua disponível para identificação interna e login.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: centralizar mascaramento de documentos em módulo compartilhado e auditar acessos ao valor completo.
 */
function maskCpfForDisplay(value) {
  const digits = onlyDigits(value);
  if (digits.length < 3) return digits ? `${digits}***` : '-';
  return `${digits.slice(0, 3)}.***.***-**`;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Padroniza espaços em campos textuais do formulário de criação de vagas.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} value - Texto livre informado no input.
 * @returns {string} Texto sem espaços duplicados e sem espaços nas extremidades.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa armazenamento; prepara o texto antes de compor o payload local da vaga.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: aplicar regras de normalização equivalentes na API para garantir consistência multiusuário.
 */
function normalizeTextInput(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Formata CEP no padrão brasileiro 00000-000 enquanto mantém somente números na entrada.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} value - Valor digitado no campo CEP.
 * @returns {string} CEP formatado ou parcial, limitado a oito dígitos.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; o resultado será usado no DOM e depois salvo junto da vaga no LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: consultar serviço externo de CEP e preencher endereço automaticamente quando houver backend.
 */
function formatCepInput(value) {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Normaliza um campo de serviço específico conforme seu tipo esperado pela criação de vagas.
 *
 * PARÂMETROS E RETORNO:
 * @param {HTMLInputElement|null} input - Campo que será tratado.
 * @returns {string} Valor normalizado aplicado ao campo.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava LocalStorage; atualiza somente o valor visual do input antes da coleta do formulário.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: substituir tratamentos locais por validação compartilhada com o backend em produção.
 */
function normalizeServiceField(input) {
  if (!input) return '';

  if (input.id === 'servico-cep') {
    input.value = formatCepInput(input.value);
    return input.value;
  }

  if (input.id === 'servico-uf') {
    input.value = normalizeTextInput(input.value).replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase();
    return input.value;
  }

  input.value = normalizeTextInput(input.value);
  return input.value;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Aplica tratamento leve enquanto o usuário digita, preservando espaços em campos textuais compostos.
 *
 * PARÂMETROS E RETORNO:
 * @param {HTMLInputElement|null} input - Campo em edição.
 * @returns {string} Valor tratado no próprio input.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; mantém a digitação preparada para validação e posterior gravação no LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: mover máscaras e normalização para componente reutilizável quando houver frontend modular.
 */
function normalizeServiceFieldOnInput(input) {
  if (!input) return '';

  if (input.id === 'servico-cep' || input.id === 'servico-uf') {
    return normalizeServiceField(input);
  }

  input.value = String(input.value || '').replace(/\s{2,}/g, ' ');
  return input.value;
}

const serviceFieldMessages = {
  'nome-servico': 'Informe um nome de serviço com pelo menos 3 caracteres.',
  'local-servico': 'Informe o local de apresentação com pelo menos 3 caracteres.',
  'servico-cep': 'Digite o CEP com 8 números ou deixe em branco.',
  'servico-logradouro': 'Informe o logradouro do serviço.',
  'servico-numero': 'Informe o número do endereço.',
  'servico-bairro': 'Informe o bairro.',
  'servico-cidade': 'Informe a cidade.',
  'servico-uf': 'Digite a UF com 2 letras, por exemplo RJ.'
};

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Atualiza a mensagem auxiliar do CEP para indicar consulta, sucesso ou falha da API sem bloquear o formulário.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} message - Texto que será exibido abaixo do campo CEP.
 * @param {string} status - Estado visual da consulta: loading, success ou error.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não lê nem grava LocalStorage; altera somente o texto e atributo visual do hint no DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: centralizar feedback de integrações externas em componente compartilhado quando houver frontend modular.
 */
function setCepLookupStatus(message = '', status = '') {
  const hint = document.querySelector('[data-field-hint="servico-cep"]');
  if (!hint) return;

  hint.textContent = message || serviceFieldMessages['servico-cep'];
  hint.dataset.status = status;
  hint.classList.toggle('hidden', !message);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Consulta o ViaCEP para obter endereço a partir do CEP informado na criação de vagas.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} cep - CEP com ou sem máscara.
 * @returns {Promise<object|null>} Endereço normalizado ou null quando o CEP não for encontrado.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; realiza requisição GET para `https://viacep.com.br/ws/{cep}/json/`.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: mover a consulta para backend com cache e tratamento de indisponibilidade da API pública.
 */
async function fetchCepAddress(cep) {
  const digits = onlyDigits(cep);
  if (digits.length !== 8) return null;

  const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
  if (!response.ok) throw new Error('Falha ao consultar CEP.');
  const data = await response.json();
  if (data.erro) return null;

  return {
    cep: data.cep || digits,
    logradouro: data.logradouro || '',
    complemento: data.complemento || '',
    bairro: data.bairro || '',
    cidade: data.localidade || '',
    uf: data.uf || ''
  };
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Preenche os campos de endereço da criação de vagas com o retorno do ViaCEP.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} address - Objeto com CEP, logradouro, complemento, bairro, cidade e UF.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Escreve somente nos inputs do DOM; a persistência continua acontecendo apenas ao criar as vagas.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: registrar a origem do endereço e permitir validação geográfica quando o sistema operar online.
 */
function applyCepAddress(address) {
  const mapping = {
    'servico-cep': address.cep ? formatCepInput(address.cep) : '',
    'servico-logradouro': address.logradouro || '',
    'servico-complemento': address.complemento || '',
    'servico-bairro': address.bairro || '',
    'servico-cidade': address.cidade || '',
    'servico-uf': address.uf || ''
  };

  Object.entries(mapping).forEach(([id, value]) => {
    const input = document.getElementById(id);
    if (!input || !value) return;
    input.value = value;
    normalizeServiceField(input);
    validateServiceField(id, false);
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Orquestra a consulta de CEP quando o usuário sai do campo, preenchendo automaticamente o endereço.
 *
 * PARÂMETROS E RETORNO:
 * @returns {Promise<void>}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê o valor do campo `servico-cep`, consulta a API e atualiza os inputs de endereço; não grava LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: adicionar cancelamento/debounce para múltiplas consultas e tratamento centralizado de logs.
 */
async function autofillServiceAddressByCep() {
  const cepInput = document.getElementById('servico-cep');
  const cep = onlyDigits(cepInput?.value || '');
  if (cep.length !== 8) return;

  setCepLookupStatus('Consultando endereço pelo CEP...', 'loading');
  try {
    const address = await fetchCepAddress(cep);
    if (!address) {
      setCepLookupStatus('CEP não encontrado. Preencha o endereço manualmente.', 'error');
      return;
    }

    applyCepAddress(address);
    setCepLookupStatus('Endereço preenchido automaticamente pelo CEP.', 'success');
    hideCreationSummaryModal(false);
  } catch (error) {
    setCepLookupStatus('Não foi possível consultar o CEP. Preencha manualmente.', 'error');
  }
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Cria espaços fixos de mensagem abaixo dos campos de criação de vagas, evitando desalinhamento do formulário.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; cria elementos visuais no DOM da página de criação de vagas.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: migrar mensagens para componente reutilizável quando o frontend for modularizado.
 */
function ensureServiceFieldHints() {
  Object.keys(serviceFieldMessages).forEach((id) => {
    const input = document.getElementById(id);
    const label = input?.closest('label');
    if (!input || !label || label.querySelector(`[data-field-hint="${id}"]`)) return;

    const hint = document.createElement('small');
    hint.className = 'field-hint hidden';
    hint.dataset.fieldHint = id;
    hint.textContent = serviceFieldMessages[id];
    label.appendChild(hint);
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Valida um campo do bloco de serviço/endereço e alterna a mensagem visual correspondente.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} id - ID do input validado.
 * @param {boolean} showMessage - Define se a mensagem de erro deve aparecer imediatamente.
 * @param {boolean} mutateValue - Define se o valor normalizado deve ser aplicado no input.
 * @returns {boolean} Verdadeiro quando o campo está válido para criação da vaga.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; lê e ajusta somente o DOM do formulário antes da persistência local.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: retornar códigos de erro padronizados pela API quando a criação for online.
 */
function validateServiceField(id, showMessage = false, mutateValue = true) {
  const input = document.getElementById(id);
  if (!input) return true;

  const value = mutateValue ? normalizeServiceField(input) : normalizeTextInput(input.value);
  let valid = true;

  if (id === 'servico-cep') {
    valid = !value || onlyDigits(value).length === 8;
  } else if (id === 'servico-uf') {
    valid = /^[A-Z]{2}$/.test(value);
  } else {
    valid = value.length >= (id === 'servico-numero' ? 1 : 3);
  }

  const hint = document.querySelector(`[data-field-hint="${id}"]`);
  input.classList.toggle('invalid', !valid);
  hint?.classList.toggle('hidden', valid || !showMessage);
  return valid;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Valida todos os campos obrigatórios do serviço antes de revisar ou salvar a criação de vagas.
 *
 * PARÂMETROS E RETORNO:
 * @param {boolean} showMessages - Define se todos os erros devem ficar visíveis.
 * @returns {boolean} Verdadeiro quando serviço e endereço estão completos.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; usa os inputs do DOM e prepara a interface para persistência em LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: substituir esta validação local por validação transacional no backend.
 */
function validateServiceFields(showMessages = false) {
  ensureServiceFieldHints();
  return Object.keys(serviceFieldMessages)
    .map((id) => validateServiceField(id, showMessages))
    .every(Boolean);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Controla a etapa visível do assistente de criação de vagas para manter a tela limpa e progressiva.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} stepId - ID do card que deve ficar visível.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; altera somente classes de exibição dos cards no DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: persistir etapa atual como rascunho do operador quando houver sessão autenticada.
 */
function showCreationStep(stepId) {
  const activeIndex = creationStepIds.indexOf(stepId);

  creationStepIds.forEach((id) => {
    const card = document.getElementById(id);
    const index = creationStepIds.indexOf(id);
    card?.classList.toggle('is-hidden', activeIndex === -1 || index > activeIndex);
    card?.classList.toggle('is-complete', activeIndex !== -1 && index < activeIndex);
  });

  document.getElementById(stepId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Abre ou fecha o modal de resumo da criação de vagas sem alterar a etapa atual do assistente.
 * Isso mantém o quarto card visível e transforma a revisão em uma confirmação isolada.
 *
 * PARÂMETROS E RETORNO:
 * @param {boolean} visible - Indica se o modal deve ser exibido (`true`) ou ocultado (`false`).
 * @param {boolean} restoreFocus - Indica se o foco deve voltar para o botão Avançar ao fechar.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; altera apenas classes CSS e estado de acessibilidade no DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: substituir o modal local por componente compartilhado quando o sistema tiver biblioteca de UI padronizada.
 */
function toggleCreationSummaryModal(visible, restoreFocus = true) {
  const modal = document.getElementById('creation-summary-modal');
  if (!modal) return;

  modal.classList.toggle('is-hidden', !visible);
  document.body.classList.toggle('modal-open', visible);
  modal.setAttribute('aria-hidden', String(!visible));

  if (visible) {
    document.getElementById('submit-button')?.focus();
  } else if (restoreFocus) {
    document.getElementById('preview-button')?.focus();
  }
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Fecha o modal de resumo quando qualquer campo que impacta a criação é alterado.
 * Evita que o operador confirme uma prévia visual que já não corresponde ao formulário.
 *
 * PARÂMETROS E RETORNO:
 * @param {boolean} restoreFocus - Indica se o foco deve voltar para o botão Avançar ao fechar.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; apenas oculta o modal no DOM e mantém os valores atuais nos inputs.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: controlar versão de rascunho no backend para invalidar confirmações concorrentes em ambiente online.
 */
function hideCreationSummaryModal(restoreFocus = true) {
  toggleCreationSummaryModal(false, restoreFocus);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Liga eventos de fechamento do modal de resumo por clique no fundo e tecla Escape.
 * Garante que a revisão em popup tenha comportamento previsível sem descartar o formulário.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; registra listeners no DOM e preserva os campos já preenchidos no formulário.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: centralizar atalhos e foco de modais em um gerenciador acessível quando houver componentes reutilizáveis.
 */
function bindCreationSummaryModalEvents() {
  const modal = document.getElementById('creation-summary-modal');
  if (!modal || modal.dataset.modalBound === 'true') return;

  modal.dataset.modalBound = 'true';
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      hideCreationSummaryModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.classList.contains('is-hidden')) {
      hideCreationSummaryModal();
    }
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Valida apenas a etapa atual antes de liberar o próximo card do assistente.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} stepId - ID da etapa atual.
 * @param {object|null} convenio - Convênio selecionado para validar datas e valores.
 * @returns {boolean} Verdadeiro quando o usuário pode avançar para o próximo card.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; lê inputs do DOM antes da persistência final em LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: trocar alertas por mensagens de validação vindas de serviço de domínio no backend.
 */
function validateCreationStep(stepId, convenio) {
  if (stepId === 'date-selection-card') {
    document.getElementById('date-mode').value = 'period';
    if (!validatePeriodSelection(convenio)) {
      alert('Informe uma data inicial e uma data final válidas dentro da vigência do convênio.');
      return false;
    }
  }

  if (stepId === 'service-name-card' && !validateServiceField('nome-servico', true)) {
    alert('Informe o nome do serviço antes de continuar.');
    return false;
  }

  if (stepId === 'service-info-card') {
    const requiredAddressFields = ['local-servico', 'servico-cep', 'servico-logradouro', 'servico-numero', 'servico-bairro', 'servico-cidade', 'servico-uf'];
    const validAddress = requiredAddressFields
      .map((id) => validateServiceField(id, true))
      .every(Boolean);

    if (!validAddress) {
      alert('Corrija os campos destacados do local de apresentação antes de continuar.');
      return false;
    }
  }

  if (stepId === 'class-selection-card') {
    const selectedClasses = [...document.querySelectorAll('[data-class-enabled]:checked')];
    const quantity = Number(document.querySelector('[data-class-quantity]')?.value || 0);

    if (selectedClasses.length !== 1 || quantity <= 0) {
      syncClassConfig(convenio);
      alert('Selecione uma classe e informe uma quantidade de vagas maior que zero.');
      return false;
    }
  }

  return true;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Valida o período específico usado para criar vagas, garantindo início, fim, ordem cronológica e vigência.
 *
 * PARÂMETROS E RETORNO:
 * @param {object|null} convenio - Convênio selecionado para comparar a vigência contratual.
 * @returns {boolean} Verdadeiro quando o período pode gerar vagas.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; lê apenas os inputs de data do DOM antes de gerar payloads para LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: validar o período no backend para evitar criação fora da vigência em requisições diretas.
 */
function validatePeriodSelection(convenio) {
  const startInput = document.getElementById('data-inicio');
  const endInput = document.getElementById('data-fim');
  const startDisplay = document.getElementById('data-inicio-display');
  const endDisplay = document.getElementById('data-fim-display');
  const start = startInput?.value || '';
  const end = endInput?.value || '';
  const valid = Boolean(start && end && start >= today && start <= end && isDateInsideContract(convenio, start) && isDateInsideContract(convenio, end));

  startInput?.classList.toggle('invalid', !valid);
  endInput?.classList.toggle('invalid', !valid);
  startDisplay?.classList.toggle('invalid', !valid);
  endDisplay?.classList.toggle('invalid', !valid);
  return valid;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Formata uma data ISO do campo date para o padrão brasileiro usado nas tabelas.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} value - Data no formato YYYY-MM-DD.
 * @returns {string} Data no formato DD/MM/YYYY ou hífen quando vazia.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não lê nem grava dados; somente transforma valor recebido.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: centralizar formatação de datas com timezone definido pela API para evitar divergências regionais.
 */
function formatDate(value) {
  if (!value) return '-';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Converte uma data digitada ou exibida no padrão brasileiro para o formato ISO usado internamente.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} value - Data no formato DD/MM/YYYY.
 * @returns {string} Data no formato YYYY-MM-DD ou string vazia quando inválida.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; apenas prepara o valor visual antes de atualizar inputs ocultos do formulário.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: substituir por parser de datas compartilhado quando houver camada frontend modular.
 */
function parseDisplayDate(value) {
  const match = String(value || '').trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return '';

  const [, day, month, year] = match;
  const iso = `${year}-${month}-${day}`;
  const parsed = parseLocalDate(iso);
  const valid = parsed.getFullYear() === Number(year)
    && parsed.getMonth() + 1 === Number(month)
    && parsed.getDate() === Number(day);

  return valid ? iso : '';
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Mantém os campos visuais de data sincronizados com os campos ocultos em ISO.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa LocalStorage; lê inputs ocultos do DOM e grava somente nos inputs visuais da tela.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: centralizar essa sincronização em componente de formulário quando houver framework frontend.
 */
function syncDateDisplayFields() {
  const pairs = [
    ['data-inicio', 'data-inicio-display'],
    ['data-fim', 'data-fim-display']
  ];

  pairs.forEach(([hiddenId, displayId]) => {
    const hidden = document.getElementById(hiddenId);
    const display = document.getElementById(displayId);
    if (hidden && display) {
      display.value = formatDate(hidden.value);
    }
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Formata uma data ISO em texto completo com dia da semana, dia, mês e ano.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} value - Data no formato YYYY-MM-DD.
 * @returns {string} Descrição amigável da data ou texto padrão quando vazia.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa armazenamento; apenas transforma o valor exibido nos inputs de data.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: centralizar internacionalização de datas quando o sistema tiver configurações por usuário.
 */
function formatDateDescription(value) {
  if (!value) return 'Selecione uma data';

  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(parseLocalDate(value));
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Formata uma data curta com dia, mês por extenso e ano para cards de semana.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} value - Data no formato YYYY-MM-DD.
 * @returns {string} Texto no formato "12 de maio de 2026".
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa armazenamento; apenas formata datas exibidas no seletor semanal.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: centralizar formatos de data quando houver camada compartilhada de UI.
 */
function formatLongDate(value) {
  if (!value) return '-';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(parseLocalDate(value));
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Converte uma data ISO em objeto Date local no início do dia, evitando deslocamentos de timezone.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} value - Data no formato YYYY-MM-DD.
 * @returns {Date} Objeto Date criado no fuso local.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não lê nem grava dados; trabalha somente com o valor recebido.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: usar datas normalizadas pelo backend quando a escala passar a operar em ambiente online.
 */
function parseLocalDate(value) {
  return new Date(`${value}T00:00:00`);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Formata um objeto Date para o padrão ISO usado pelos inputs de data e pela persistência local.
 *
 * PARÂMETROS E RETORNO:
 * @param {Date} date - Data que será convertida.
 * @returns {string} Data no formato YYYY-MM-DD.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa armazenamento; padroniza valores antes de exibir ou gravar.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: substituir por utilitário central de datas quando o sistema tiver backend e testes automatizados.
 */
function toDateInputValue(date) {
  return date.toISOString().slice(0, 10);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Soma dias a uma data ISO e devolve nova data ISO, usada para semana e montagem de calendário.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} value - Data inicial no formato YYYY-MM-DD.
 * @param {number} days - Quantidade de dias que será somada.
 * @returns {string} Nova data no formato YYYY-MM-DD.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não lê nem grava dados; cálculo feito em memória.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: validar feriados e dias permitidos do contrato no servidor quando houver regra operacional definida.
 */
function addDays(value, days) {
  const date = parseLocalDate(value);
  date.setDate(date.getDate() + days);
  return toDateInputValue(date);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Gera uma lista sequencial de datas entre início e fim, incluindo as extremidades.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} start - Data inicial no formato YYYY-MM-DD.
 * @param {string} end - Data final no formato YYYY-MM-DD.
 * @returns {Array<string>} Datas ordenadas no formato YYYY-MM-DD.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa LocalStorage; a lista gerada é usada para criar vagas em lote.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: permitir filtros por dias da semana e exceções oficiais quando o contrato exigir escala recorrente refinada.
 */
function getDatesBetween(start, end) {
  if (!start || !end) return [];

  const dates = [];
  let cursor = start <= end ? start : end;
  const limit = start <= end ? end : start;

  while (cursor <= limit) {
    dates.push(cursor);
    cursor = addDays(cursor, 1);
  }

  return dates;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Calcula a duração do serviço em horas, aceitando turnos que cruzam a meia-noite.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} start - Horário inicial no formato HH:MM.
 * @param {string} end - Horário final no formato HH:MM.
 * @returns {number} Duração em horas.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa armazenamento; valida apenas campos do formulário.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: migrar validação para regra de domínio no backend e bloquear conflitos de escala por policial.
 */
function getHourDuration(start, end) {
  if (!start || !end) return 0;

  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);
  const startTotal = startHour * 60 + startMinute;
  let endTotal = endHour * 60 + endMinute;

  if (endTotal <= startTotal) {
    endTotal += 24 * 60;
  }

  return (endTotal - startTotal) / 60;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Soma horas a um horário inicial e devolve o horário final no padrão HH:MM.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} start - Horário inicial no formato HH:MM.
 * @param {number} hours - Quantidade de horas que será adicionada.
 * @returns {string} Horário final calculado no formato HH:MM.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa armazenamento; calcula o horário final usado nos cards de classe.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: considerar regras especiais de jornada e virada de escala vindas do backend em produção.
 */
function addHoursToTime(start, hours) {
  const [startHour, startMinute] = (start || '00:00').split(':').map(Number);
  const totalMinutes = (startHour * 60 + startMinute + hours * 60) % (24 * 60);
  const hour = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const minute = String(totalMinutes % 60).padStart(2, '0');

  return `${hour}:${minute}`;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Retorna a segunda-feira da semana da data informada para seleção semanal padronizada.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} value - Data no formato YYYY-MM-DD.
 * @returns {string} Data da segunda-feira no formato YYYY-MM-DD.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; calcula intervalo semanal em memória.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: permitir configuração de início da semana se a regra operacional mudar.
 */
function getMonday(value) {
  const date = parseLocalDate(value);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return toDateInputValue(date);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Verifica se uma data está dentro da vigência do contrato selecionado.
 *
 * PARÂMETROS E RETORNO:
 * @param {object|null} convenio - Convênio selecionado com início e fim de vigência.
 * @param {string} dateValue - Data no formato YYYY-MM-DD.
 * @returns {boolean} Verdadeiro quando a data é hoje ou futura e está dentro da vigência.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa armazenamento; valida datas com base na data atual e no contrato carregado do LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: centralizar essa validação no backend para impedir criação fora de vigência via requisição direta.
 */
function isDateInsideContract(convenio, dateValue) {
  if (!dateValue) return true;
  if (dateValue < today) return false;
  if (!convenio) return true;
  if (convenio.inicio && dateValue < convenio.inicio) return false;
  if (convenio.fim && dateValue > convenio.fim) return false;
  return true;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Verifica se uma competência mensal possui pelo menos um dia futuro dentro da vigência do contrato.
 *
 * PARÂMETROS E RETORNO:
 * @param {object|null} convenio - Convênio selecionado.
 * @param {string} month - Competência no formato YYYY-MM.
 * @returns {boolean} Verdadeiro quando algum dia do mês está disponível para criação.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; usa a data atual e as datas do contrato carregadas do LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: usar consulta de calendário operacional do backend quando houver aditivos e bloqueios por competência.
 */
function isMonthInsideContract(convenio, month) {
  if (!month) return true;

  const [year, monthNumber] = month.split('-').map(Number);
  const monthStart = `${month}-01`;
  const monthEnd = toDateInputValue(new Date(year, monthNumber, 0));

  if (monthEnd < today) return false;
  if (!convenio) return true;
  if (convenio.fim && monthStart > convenio.fim) return false;
  if (convenio.inicio && monthEnd < convenio.inicio) return false;
  return true;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Gera a lista de competências mensais disponíveis dentro da vigência contratual.
 *
 * PARÂMETROS E RETORNO:
 * @param {object|null} convenio - Convênio selecionado com datas de início e fim.
 * @param {string} fallbackMonth - Competência de referência quando não houver convênio completo.
 * @returns {Array<string>} Lista de meses no formato YYYY-MM, do início ao fim da vigência.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; deriva as competências a partir do contrato carregado do LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: substituir por calendário de competências retornado pela API quando houver regras de bloqueio por mês.
 */
function getContractMonthsList(convenio, fallbackMonth = currentMonth) {
  if (!convenio?.inicio || !convenio?.fim) {
    return mesesAno.map((_, index) => `${fallbackMonth.slice(0, 4)}-${String(index + 1).padStart(2, '0')}`)
      .filter((month) => isMonthInsideContract(convenio, month));
  }

  const months = [];
  const start = parseLocalDate(`${convenio.inicio.slice(0, 7)}-01`);
  const end = parseLocalDate(`${convenio.fim.slice(0, 7)}-01`);
  let cursor = start;

  while (cursor <= end) {
    months.push(cursor.toISOString().slice(0, 7));
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }

  return months;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Retorna todos os meses dos anos cobertos pela vigência, mantendo meses fora do contrato para exibição desabilitada.
 *
 * PARÂMETROS E RETORNO:
 * @param {object|null} convenio - Convênio selecionado com vigência.
 * @param {string} fallbackMonth - Competência de referência quando não houver contrato completo.
 * @returns {Array<string>} Lista com 12 meses para cada ano exibido.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; prepara a grade visual completa de meses com base na vigência do contrato.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: substituir por calendário anual vindo da API quando houver bloqueios por competência.
 */
function getDisplayMonthsList(convenio, fallbackMonth = currentMonth) {
  const startYear = Number((convenio?.inicio || fallbackMonth).slice(0, 4));
  const endYear = Number((convenio?.fim || fallbackMonth).slice(0, 4));
  const months = [];

  for (let year = startYear; year <= endYear; year += 1) {
    mesesAno.forEach((_, index) => {
      months.push(`${year}-${String(index + 1).padStart(2, '0')}`);
    });
  }

  return months;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Ajusta uma data para não ficar antes de hoje e para respeitar a vigência do contrato.
 *
 * PARÂMETROS E RETORNO:
 * @param {object|null} convenio - Convênio selecionado.
 * @param {string} dateValue - Data no formato YYYY-MM-DD.
 * @returns {string} Data limitada ao dia atual e ao intervalo de vigência.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; corrige campos visuais antes da criação das vagas.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: exibir mensagem de validação mais detalhada quando a API rejeitar datas fora de vigência.
 */
function clampDateToContract(convenio, dateValue) {
  if (!dateValue) return dateValue;
  if (dateValue < today) return today;
  if (!convenio) return dateValue;
  if (convenio.inicio && dateValue < convenio.inicio) return convenio.inicio;
  if (convenio.fim && dateValue > convenio.fim) return convenio.fim;
  return dateValue;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Formata o endereço de apresentação a partir dos campos do formulário de criação.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} endereco - Dados estruturados de endereço do serviço.
 * @returns {string} Endereço em múltiplas linhas para resumo e persistência local.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; prepara texto derivado dos campos que serão armazenados junto da vaga.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: integrar CEP e geocodificação via API oficial quando o sistema operar online.
 */
function formatServiceAddress(endereco) {
  const linha1 = [endereco.logradouro, endereco.numero].filter(Boolean).join(', ');
  const linha2 = [endereco.complemento, endereco.bairro].filter(Boolean).join(' - ');
  const linha3 = [endereco.cidade, endereco.uf].filter(Boolean).join('/');
  const linha4 = endereco.cep ? `CEP ${endereco.cep}` : '';

  return [linha1, linha2, linha3, linha4].filter(Boolean).join('\n');
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Calcula a quantidade de meses cobertos pelo contrato para estimar o limite financeiro mensal.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} start - Início da vigência no formato YYYY-MM-DD.
 * @param {string} end - Fim da vigência no formato YYYY-MM-DD.
 * @returns {number} Total mínimo de 1 mês, arredondado para cima quando houver fração.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa armazenamento; usa apenas as datas do convênio recebido.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: validar regras contratuais oficiais para contratos com vigência parcial, aditivos ou prorrogações.
 */
function getContractMonths(start, end) {
  if (!start || !end) return 1;

  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  const baseMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + endDate.getMonth() - startDate.getMonth();
  const monthDiff = endDate.getDate() >= startDate.getDate()
    ? baseMonths + 1
    : baseMonths;

  return Math.max(1, monthDiff);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Define se o convênio está dentro do prazo de vigência e pode aparecer na área operacional.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} convenio - Convênio vindo do cadastro de contratos.
 * @returns {boolean} Verdadeiro quando a data atual está entre início e fim da vigência.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; usa objeto lido da chave de contratos no LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: calcular vigência no servidor para impedir manipulação pela data local do navegador.
 */
function isConvenioVigente(convenio) {
  if (convenio.inicio && today < convenio.inicio) return false;
  if (convenio.fim && today > convenio.fim) return false;
  return true;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Obtém todos os convênios cadastrados no módulo de contratos.
 *
 * PARÂMETROS E RETORNO:
 * @returns {Array<object>} Lista completa de convênios cadastrados.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê a chave `cproeis_contratos_convenios` no LocalStorage, compartilhada com o módulo de contratos.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: substituir por endpoint de consulta paginada e filtrada por perfil de acesso.
 */
function getConvenios() {
  return loadList(STORAGE_CONVENIOS);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Obtém todas as vagas operacionais criadas para convênios.
 *
 * PARÂMETROS E RETORNO:
 * @returns {Array<object>} Lista de vagas persistidas localmente.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê a chave `cproeis_convenios_vagas` no LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: migrar para tabela própria no banco, vinculada a contrato, escala, policial e histórico de alterações.
 */
function getVagas() {
  return loadList(STORAGE_VAGAS);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Calcula o limite financeiro mensal dividindo o valor total do contrato pela vigência em meses.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} convenio - Convênio com valor total e datas de vigência.
 * @returns {number} Valor mensal estimado permitido para geração de vagas.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; usa os dados contratuais lidos do LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: permitir regras específicas por contrato, como limites mensais variáveis, saldo acumulado ou bloqueios por empenho.
 */
function getLimiteMensal(convenio) {
  const valorContrato = Number(convenio.valorContrato ?? convenio.valorMensal ?? 0);
  return valorContrato / getContractMonths(convenio.inicio, convenio.fim);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Localiza a linha de valores da classe informada dentro do convênio.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} convenio - Convênio com array `valores` cadastrado em contratos.
 * @param {string} classe - Classe da vaga: A, B ou C/D.
 * @returns {object} Objeto de valores da classe ou objeto vazio quando não houver cadastro.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa armazenamento diretamente; usa dados do contrato já carregados.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: validar no backend se a classe está liberada para o convênio antes de autorizar a criação da vaga.
 */
function getValorClasse(convenio, classe) {
  if (classe === 'C/D') {
    return (convenio.valores || []).find((valor) => valor.classe === 'C/D')
      || (convenio.valores || []).find((valor) => valor.classe === 'C')
      || (convenio.valores || []).find((valor) => valor.classe === 'D')
      || {};
  }

  return (convenio.valores || []).find((valor) => valor.classe === classe) || {};
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Calcula o custo unitário de uma vaga conforme classe e tipo de serviço.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} convenio - Convênio selecionado.
 * @param {string} classe - Classe da vaga: A, B ou C/D.
 * @param {string} tipoServico - Chave do tipo: servico12, servico8 ou servico6.
 * @returns {number} Soma do valor do serviço, passagem e alimentação.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; usa valores contratuais persistidos no cadastro de contratos.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: versionar valores por data do serviço para preservar cálculos quando houver reajustes no contrato.
 */
function getValorUnitario(convenio, classe, tipoServico) {
  const valorClasse = getValorClasse(convenio, classe);
  const servico = Number(valorClasse[tipoServico] || 0);
  const passagem = Number(valorClasse.passagem || 0);
  const alimentacao = Number(valorClasse.alimentacao || 0);

  return servico + passagem + alimentacao;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Atualiza os horários e o tipo de serviço de acordo com o turno selecionado pelo operador.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; altera apenas os campos visíveis do formulário.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: buscar turnos permitidos em tabela configurável por convênio quando houver gestão online.
 */
function applyTurnoToFields() {
  const turno = turnosServico[document.getElementById('turno')?.value];
  if (!turno) return;

  document.getElementById('tipo-servico').value = turno.tipoServico;
  document.getElementById('hora-inicio').value = turno.inicio;
  document.getElementById('hora-fim').value = turno.fim;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Atualiza o campo somente leitura com o valor unitário calculado para classe e tipo selecionados.
 *
 * PARÂMETROS E RETORNO:
 * @param {object|null} convenio - Convênio selecionado para a operação.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; calcula a partir dos valores contratuais carregados do LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: exibir composição detalhada do valor quando houver fonte oficial de rubricas no backend.
 */
function updateValorPreview(convenio) {
  const preview = document.getElementById('valor-unitario-preview');
  if (!preview || !convenio) return;

  const classe = document.getElementById('classe').value;
  const tipoServico = document.getElementById('tipo-servico').value;
  preview.value = dinheiro.format(getValorUnitario(convenio, classe, tipoServico));
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Valida se os horários informados correspondem à duração do tipo de serviço selecionado.
 *
 * PARÂMETROS E RETORNO:
 * @returns {boolean} Verdadeiro quando a duração bate com 12h, 8h ou 6h.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa armazenamento; valida somente os campos `hora-inicio`, `hora-fim` e `tipo-servico`.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: permitir exceções autorizadas por perfil administrativo em produção.
 */
function validateHorarioByTipo() {
  const tipoServico = document.getElementById('tipo-servico').value;
  const horaInicio = document.getElementById('hora-inicio').value;
  const horaFim = document.getElementById('hora-fim').value;
  const expectedHours = Number(tipoServico.replace('servico', ''));
  const duration = getHourDuration(horaInicio, horaFim);

  return duration === expectedHours;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Renderiza os cards de configuração por classe, com seleção visual, turno, horário, quantidade e curso.
 *
 * PARÂMETROS E RETORNO:
 * @param {object|null} convenio - Convênio selecionado para calcular prévia de valor por classe.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; monta campos no DOM com base nos valores contratuais já carregados do LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: carregar classes e cursos permitidos por convênio a partir da API de configuração operacional.
 */
function renderClassConfigCards(convenio) {
  const container = document.getElementById('class-choice-grid');
  if (!container || !convenio) return;

  const courseOptions = cursosDisponiveis
    .map((curso) => `<option value="${escapeHtml(curso.value)}">${escapeHtml(curso.label)}</option>`)
    .join('');

  container.innerHTML = `
    <div class="class-picker" aria-label="Selecionar classe">
      ${classesDisponiveis.map((classe, index) => `
        <label class="class-pill">
          <input type="radio" name="classe-operacional" value="${escapeHtml(classe)}" data-class-enabled="${escapeHtml(classe)}"${index === 0 ? ' checked' : ''}>
          <span class="class-pill-copy">
            <strong>${escapeHtml(gruposClasse[classe])}</strong>
            <small>${escapeHtml(descricoesClasseCriacao[classe] || '')}</small>
          </span>
        </label>
      `).join('')}
    </div>

    <section class="class-config-panel" data-class-card>
      <div class="class-config-grid compact">
        <label>
          Turno
          <select id="classe-turno" data-class-turno>
            <option value="turno6">6 horas</option>
            <option value="turno8">8 horas</option>
            <option value="turno12" selected>12 horas</option>
          </select>
        </label>
        <label>
          Início
          <input id="classe-inicio" type="time" data-class-start value="${turnosServico.turno12.inicio}">
        </label>
        <label>
          Término
          <input id="classe-fim" type="time" data-class-end value="${turnosServico.turno12.fim}" readonly>
        </label>
        <label>
          Vagas
          <input id="classe-vagas" type="number" min="1" step="1" value="1" data-class-quantity>
          <small class="quantity-alert is-hidden" data-class-quantity-alert>Informe uma quantidade maior que zero.</small>
        </label>
        <label>
          Curso
          <select id="classe-curso" data-class-course>${courseOptions}</select>
        </label>
      </div>
    </section>
  `;

  syncClassConfig(convenio);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Sincroniza horário final, tipo de serviço e valor previsto de um card de classe.
 *
 * PARÂMETROS E RETORNO:
 * @param {object|null} convenio - Convênio selecionado para cálculo de valor.
 * @param {string} classe - Classe configurada no card: A, B ou C/D.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; atualiza apenas campos e prévia de valor no DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: validar turnos permitidos por classe no backend quando houver regras por contrato.
 */
function syncClassConfig(convenio) {
  const card = document.querySelector('[data-class-card]');
  const turnoInput = document.querySelector('[data-class-turno]');
  const startInput = document.querySelector('[data-class-start]');
  const endInput = document.querySelector('[data-class-end]');
  const quantityInput = document.querySelector('[data-class-quantity]');
  const quantityAlert = document.querySelector('[data-class-quantity-alert]');
  if (!card || !turnoInput || !startInput || !endInput || !quantityInput || !quantityAlert) return;

  const turno = turnosServico[turnoInput.value] || turnosServico.turno12;
  if (!startInput.value) {
    startInput.value = turno.inicio;
  }

  endInput.value = addHoursToTime(startInput.value, turno.horas);
  const hasQuantityError = Number(quantityInput.value || 0) <= 0;
  card.classList.toggle('quantity-error', hasQuantityError);
  quantityAlert.classList.toggle('is-hidden', !hasQuantityError);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Coleta os dados de endereço e apresentação do serviço informados no terceiro card.
 *
 * PARÂMETROS E RETORNO:
 * @returns {object} Dados estruturados de serviço, endereço e referência.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava diretamente; o objeto retornado será incorporado às vagas persistidas no LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: validar endereço e salvar ponto de apresentação em tabela própria quando houver backend.
 */
function collectServiceInfo() {
  const enderecoDados = {
    cep: normalizeServiceField(document.getElementById('servico-cep')) || '',
    logradouro: normalizeServiceField(document.getElementById('servico-logradouro')) || '',
    numero: normalizeServiceField(document.getElementById('servico-numero')) || '',
    complemento: normalizeServiceField(document.getElementById('servico-complemento')) || '',
    bairro: normalizeServiceField(document.getElementById('servico-bairro')) || '',
    cidade: normalizeServiceField(document.getElementById('servico-cidade')) || '',
    uf: normalizeServiceField(document.getElementById('servico-uf')) || ''
  };

  return {
    nomeServico: normalizeServiceField(document.getElementById('nome-servico')) || '',
    localServico: normalizeServiceField(document.getElementById('local-servico')) || '',
    enderecoDados,
    enderecoServico: formatServiceAddress(enderecoDados),
    pontoReferencia: normalizeServiceField(document.getElementById('ponto-referencia')) || ''
  };
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Coleta as classes selecionadas com turno, quantidade, curso, horário e valor unitário.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} convenio - Convênio selecionado para cálculo de valor.
 * @returns {Array<object>} Configurações selecionadas para criação de vagas.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; lê inputs dos cards de classe e prepara os dados para persistência posterior.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: validar no backend se a combinação classe/turno/curso está autorizada para o convênio.
 */
function getSelectedClassConfigs(convenio) {
  const selectedInput = document.querySelector('[data-class-enabled]:checked');
  const classe = selectedInput?.value || selectedInput?.dataset.classEnabled || '';
  if (!classe || !classesCriacaoPermitidas.has(classe)) return [];

  const turnoKey = document.querySelector('[data-class-turno]')?.value || 'turno12';
  const turno = turnosServico[turnoKey] || turnosServico.turno12;
  const horaInicio = document.querySelector('[data-class-start]')?.value || turno.inicio;
  const horaFim = addHoursToTime(horaInicio, turno.horas);
  const quantidade = Number(document.querySelector('[data-class-quantity]')?.value || 0);
  const curso = document.querySelector('[data-class-course]')?.value || '';

  return [{
    classe,
    turno: turnoKey,
    tipoServico: turno.tipoServico,
    horaInicio,
    horaFim,
    quantidade,
    preenchidas: 0,
    curso,
    valorUnitario: getValorUnitario(convenio, classe, turno.tipoServico)
  }].filter((config) => config.quantidade > 0);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Valida os dados mínimos do assistente antes de exibir resumo ou criar as vagas.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} convenio - Convênio selecionado para validar datas e classes.
 * @returns {boolean} Verdadeiro quando o fluxo está pronto para revisão/criação.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; lê campos do DOM e dados contratuais carregados do LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: migrar validação para serviço de domínio no backend quando houver criação online de vagas.
 */
function validateCreationWizard(convenio) {
  document.getElementById('date-mode').value = 'period';

  if (!validatePeriodSelection(convenio) || !getCreationDates(convenio).length) {
    alert('Informe uma data inicial e uma data final válidas dentro da vigência do convênio.');
    return false;
  }

  if (!validateServiceFields(true)) {
    alert('Corrija os campos destacados antes de revisar ou criar as vagas.');
    return false;
  }

  const selectedClasses = [...document.querySelectorAll('[data-class-enabled]:checked')];
  if (selectedClasses.length !== 1) {
    alert('Selecione exatamente uma classe para gerar as vagas.');
    syncClassConfig(convenio);
    return false;
  }

  const hasSelectedClassWithZero = Number(document.querySelector('[data-class-quantity]')?.value || 0) <= 0;

  if (hasSelectedClassWithZero) {
    syncClassConfig(convenio);
    alert('Informe uma quantidade de vagas maior que zero para a classe selecionada.');
    return false;
  }

  return true;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Renderiza o resumo final da criação para conferência antes da persistência.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} convenio - Convênio selecionado para cálculo de datas e valores.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; usa dados coletados do formulário para montar prévia visual no DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: incluir validação de disponibilidade por dia no backend antes de confirmar criação em lote.
 */
function renderCreationSummary(convenio) {
  const target = document.getElementById('creation-summary');
  const summaryModal = document.getElementById('creation-summary-modal');
  if (!target || !summaryModal) return;

  const dates = getCreationDates(convenio);
  const serviceInfo = collectServiceInfo();
  const configs = getSelectedClassConfigs(convenio);
  const totalVagas = dates.length * configs.reduce((total, config) => total + config.quantidade, 0);
  const firstDate = dates[0] || document.getElementById('data-inicio')?.value || '';
  const lastDate = dates[dates.length - 1] || document.getElementById('data-fim')?.value || firstDate;
  const selectedConfig = configs[0] || {};
  const quantityLabel = `${selectedConfig.quantidade || 0} ${(selectedConfig.quantidade || 0) === 1 ? 'vaga' : 'vagas'} por dia`;

  target.innerHTML = `
    <div class="summary-grid creation-summary-grid">
      <div class="summary-box"><span>Data de início</span><strong>${formatDate(firstDate)}</strong></div>
      <div class="summary-box"><span>Data de término</span><strong>${formatDate(lastDate)}</strong></div>
      <div class="summary-box"><span>Total de vagas</span><strong>${totalVagas}</strong></div>
      <div class="summary-box wide"><span>Serviço</span><strong>${escapeHtml(serviceInfo.nomeServico)}</strong></div>
      <div class="summary-box wide"><span>Apresentação</span><strong>${escapeHtml(`${serviceInfo.localServico}\n${serviceInfo.enderecoServico}`)}</strong></div>
      <div class="summary-box wide"><span>Ponto de referência</span><strong>${escapeHtml(serviceInfo.pontoReferencia || '-')}</strong></div>
      <div class="summary-box summary-class-box"><span>Classe selecionada</span><strong>${escapeHtml(gruposClasse[selectedConfig.classe] || '-')}</strong></div>
      <div class="summary-box summary-class-box"><span>Quantidade diária</span><strong>${escapeHtml(quantityLabel)}</strong></div>
      <div class="summary-box summary-class-box"><span>Turno</span><strong>${escapeHtml(turnosServico[selectedConfig.turno]?.label || '-')}</strong></div>
      <div class="summary-box summary-class-box"><span>Horário de início</span><strong>${escapeHtml(selectedConfig.horaInicio || '--:--')}</strong></div>
      <div class="summary-box summary-class-box"><span>Horário de término</span><strong>${escapeHtml(selectedConfig.horaFim || '--:--')}</strong></div>
    </div>
  `;

  toggleCreationSummaryModal(true);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Filtra vagas de um convênio para a competência mensal atual ou da data editada.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} convenioId - Identificador do convênio selecionado.
 * @param {string} month - Competência no formato YYYY-MM.
 * @returns {Array<object>} Vagas do convênio dentro do mês informado.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê todas as vagas do LocalStorage e filtra em memória.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: consultar a API já filtrando por contrato e competência para melhorar desempenho com grande volume de vagas.
 */
function getVagasDoMes(convenioId, month) {
  return getVagas().filter((vaga) => vaga.convenioId === convenioId && (vaga.dataServico || '').startsWith(month));
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Filtra todas as vagas vinculadas a um convênio, sem limitar por competência mensal.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} convenioId - Identificador do convênio selecionado.
 * @returns {Array<object>} Todas as vagas do convênio informado.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê a lista completa de vagas do LocalStorage e filtra em memória pelo convênio.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: substituir por endpoint paginado com filtros no backend quando o volume histórico crescer.
 */
function getTodasVagasDoConvenio(convenioId) {
  return getVagas().filter((vaga) => vaga.convenioId === convenioId);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Lê os filtros preenchidos pelo operador na página de vagas criadas.
 *
 * PARÂMETROS E RETORNO:
 * @returns {object} Filtros atuais de busca, data, classe, tipo, oferta e policial escalado.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa LocalStorage; lê apenas os campos de filtro no DOM antes de filtrar a lista em memória.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: enviar filtros para a API quando a listagem passar a ser paginada no backend.
 */
function getVagaFilters() {
  return {
    text: normalizeTextInput(document.getElementById('vaga-filter-text')?.value || '').toLowerCase(),
    date: document.getElementById('vaga-filter-date')?.value || '',
    classe: document.getElementById('vaga-filter-class')?.value || '',
    tipo: document.getElementById('vaga-filter-type')?.value || '',
    oferta: document.getElementById('vaga-filter-offer')?.value || '',
    policial: document.getElementById('vaga-filter-policial')?.value || ''
  };
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Aplica os filtros visuais sobre as vagas já carregadas do convênio.
 *
 * PARÂMETROS E RETORNO:
 * @param {Array<object>} vagas - Vagas do convênio já filtradas do LocalStorage.
 * @returns {Array<object>} Vagas compatíveis com busca, data, classe, tipo, oferta e policial selecionados.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; filtra em memória registros obtidos de `cproeis_convenios_vagas`.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: mover filtros para consulta de backend para suportar grande volume e múltiplas competências.
 */
function applyVagaFilters(vagas) {
  const filters = getVagaFilters();

  return vagas.filter((vaga) => {
    const offerStatus = getVagaOfferStatus(vaga);
    const policialText = formatPolicialEscalado(vaga);
    const hasPolicial = policialText !== 'Sem policial';
    const searchable = [
      vaga.nomeServico,
      formatDate(vaga.dataServico),
      gruposClasse[vaga.classe] || vaga.classe,
      tiposServico[vaga.tipoServico] || vaga.tipoServico,
      vaga.horaInicio,
      vaga.horaFim,
      offerStatus.label,
      offerStatus.note,
      policialText
    ].map((value) => normalizeTextInput(value || '').toLowerCase()).join(' ');

    if (filters.text && !searchable.includes(filters.text)) return false;
    if (filters.date && vaga.dataServico !== filters.date) return false;
    if (filters.classe && vaga.classe !== filters.classe) return false;
    if (filters.tipo && vaga.tipoServico !== filters.tipo) return false;
    if (filters.oferta && offerStatus.filterValue !== filters.oferta) return false;
    if (filters.policial === 'com' && !hasPolicial) return false;
    if (filters.policial === 'sem' && hasPolicial) return false;
    return true;
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Soma quantidades e valores de vagas ofertadas e vagas com policiais escalados.
 *
 * PARÂMETROS E RETORNO:
 * @param {Array<object>} vagas - Vagas que serão totalizadas.
 * @returns {object} Totais de quantidade ofertada, quantidade escalada, valor ofertado e valor escalado.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa armazenamento; processa o array recebido, normalmente vindo do LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: separar valor reservado, valor confirmado e valor liquidado quando existir fluxo real de escala e pagamento.
 */
function summarizeVagas(vagas) {
  return vagas.reduce((totals, vaga) => {
    const quantidade = Number(vaga.quantidade || 0);
    const preenchidas = Number(vaga.preenchidas || 0);
    const valorUnitario = Number(vaga.valorUnitario || 0);

    totals.quantidadeOfertada += quantidade;
    totals.quantidadeEscalada += preenchidas;
    totals.valorOfertado += quantidade * valorUnitario;
    totals.valorEscalado += preenchidas * valorUnitario;

    return totals;
  }, {
    quantidadeOfertada: 0,
    quantidadeEscalada: 0,
    valorOfertado: 0,
    valorEscalado: 0
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Verifica se um responsável está dentro do período de atuação cadastrado no convênio.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} responsavel - Responsável cadastrado no contrato/convênio.
 * @returns {boolean} Verdadeiro quando o responsável pode aparecer na tela de login operacional.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa LocalStorage; usa apenas o objeto de responsável já carregado do convênio.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: validar acesso em sessão autenticada no servidor, considerando perfil, status do usuário e vínculo ativo.
 */
function isResponsavelAtivo(responsavel) {
  if (responsavel.inicio && today < responsavel.inicio) return false;
  if (responsavel.fim && today > responsavel.fim) return false;
  return true;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Retorna a lista de responsáveis ativos de um convênio vigente, preservando compatibilidade com registros
 * antigos que ainda tenham responsáveis embutidos no objeto principal.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} convenio - Convênio vigente vindo do LocalStorage compartilhado com contratos.
 * @returns {Array<object>} Responsáveis aptos a logar no módulo operacional.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; lê a propriedade `responsaveis` já persistida dentro do convênio.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: consultar responsáveis por endpoint próprio quando o cadastro sair do LocalStorage.
 */
function getResponsaveisAtivosDoConvenio(convenio) {
  return (convenio.responsaveis || [])
    .filter((responsavel) => responsavel.nome && isResponsavelAtivo(responsavel));
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Formata as funções de acesso do responsável em pequenos marcadores para facilitar leitura na tabela.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} responsavel - Responsável com array `funcoes` ou campo legado `funcao`.
 * @returns {string} HTML com as funções escapadas e separadas em chips visuais.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa armazenamento; apenas formata dados já carregados.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: trocar textos por permissões identificadas por código quando existir controle real de acesso.
 */
function formatResponsavelFuncoes(responsavel) {
  const funcoes = Array.isArray(responsavel.funcoes)
    ? responsavel.funcoes
    : String(responsavel.funcao || '').split(',').map((item) => item.trim()).filter(Boolean);

  if (!funcoes.length) return '-';

  return `<div class="role-list">${funcoes.map((funcao) => `<span class="role-chip">${escapeHtml(funcao)}</span>`).join('')}</div>`;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Retorna as funções de um responsável em formato de array para filtros e exibição.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} responsavel - Responsável com array `funcoes` ou campo legado `funcao`.
 * @returns {Array<string>} Lista de funções normalizadas sem itens vazios.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa armazenamento; transforma dados já carregados do LocalStorage pela lista de convênios.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: substituir textos livres por permissões estáveis vindas do backend.
 */
function getResponsavelFuncoes(responsavel) {
  return Array.isArray(responsavel.funcoes)
    ? responsavel.funcoes.filter(Boolean)
    : String(responsavel.funcao || '').split(',').map((item) => item.trim()).filter(Boolean);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Monta a lista plana de responsáveis com acesso operacional a partir dos convênios vigentes.
 *
 * PARÂMETROS E RETORNO:
 * @returns {Array<object>} Lista com pares `{ convenio, responsavel }` aptos para login operacional.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê convênios persistidos no LocalStorage e filtra os responsáveis ativos em memória.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: carregar esta listagem de endpoint autenticado para respeitar permissões por usuário.
 */
function getAcessosOperacionais() {
  return getConvenios()
    .filter(isConvenioVigente)
    .sort((a, b) => (a.nome || '').localeCompare(b.nome || ''))
    .flatMap((convenio) => getResponsaveisAtivosDoConvenio(convenio)
      .map((responsavel) => ({ convenio, responsavel })));
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Preenche os selects de filtro de convênio e função sem duplicar opções.
 *
 * PARÂMETROS E RETORNO:
 * @param {Array<object>} acessos - Pares de convênio e responsável exibíveis na tabela.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; usa a lista em memória para atualizar opções no DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: receber opções de filtro do backend quando a listagem for paginada no servidor.
 */
function populateAccessFilters(acessos) {
  const convenioSelect = document.getElementById('access-filter-convenio');
  const funcaoSelect = document.getElementById('access-filter-funcao');

  if (convenioSelect && convenioSelect.dataset.optionsLoaded !== 'true') {
    const convenios = [...new Map(acessos.map(({ convenio }) => [convenio.id, convenio])).values()];
    convenioSelect.innerHTML = '<option value="">Todos</option>'
      + convenios.map((convenio) => `<option value="${escapeHtml(convenio.id)}">${escapeHtml(convenio.nome || '-')}</option>`).join('');
    convenioSelect.dataset.optionsLoaded = 'true';
  }

  if (funcaoSelect && funcaoSelect.dataset.optionsLoaded !== 'true') {
    const funcoes = [...new Set(acessos.flatMap(({ responsavel }) => getResponsavelFuncoes(responsavel)))].sort((a, b) => a.localeCompare(b));
    funcaoSelect.innerHTML = '<option value="">Todas</option>'
      + funcoes.map((funcao) => `<option value="${escapeHtml(funcao)}">${escapeHtml(funcao)}</option>`).join('');
    funcaoSelect.dataset.optionsLoaded = 'true';
  }
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Lê os filtros preenchidos na listagem de responsáveis operacionais.
 *
 * PARÂMETROS E RETORNO:
 * @returns {object} Filtros atuais de responsável, convênio e função.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa LocalStorage; lê somente campos de filtro existentes no DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: persistir preferências de filtro por usuário quando houver login real.
 */
function getAccessFilters() {
  return {
    text: normalizeTextInput(document.getElementById('access-filter-text')?.value || '').toLowerCase(),
    convenioId: document.getElementById('access-filter-convenio')?.value || '',
    funcao: document.getElementById('access-filter-funcao')?.value || ''
  };
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Aplica os filtros da tabela de responsáveis sem alterar os dados persistidos.
 *
 * PARÂMETROS E RETORNO:
 * @param {Array<object>} acessos - Pares `{ convenio, responsavel }` carregados da base local.
 * @returns {Array<object>} Acessos compatíveis com os filtros selecionados.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; filtra em memória registros vindos do LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: mover filtro para consulta server-side quando houver muitos responsáveis.
 */
function applyAccessFilters(acessos) {
  const filters = getAccessFilters();

  return acessos.filter(({ convenio, responsavel }) => {
    const nomeResponsavel = normalizeTextInput(responsavel.nome || '').toLowerCase();
    const funcoes = getResponsavelFuncoes(responsavel);

    if (filters.text && !nomeResponsavel.includes(filters.text)) return false;
    if (filters.convenioId && convenio.id !== filters.convenioId) return false;
    if (filters.funcao && !funcoes.includes(filters.funcao)) return false;
    return true;
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Configura os eventos dos filtros da listagem de responsáveis operacionais.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; dispara nova renderização lendo filtros do DOM e convênios do LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: adicionar debounce no campo de busca quando houver consulta remota.
 */
function bindAccessFilterEvents() {
  const filterIds = ['access-filter-text', 'access-filter-convenio', 'access-filter-funcao'];

  filterIds.forEach((id) => {
    const input = document.getElementById(id);
    if (!input || input.dataset.filterBound === 'true') return;

    input.dataset.filterBound = 'true';
    input.addEventListener('input', renderConveniosList);
    input.addEventListener('change', renderConveniosList);
  });

  const clearButton = document.getElementById('clear-access-filters');
  if (clearButton && clearButton.dataset.filterBound !== 'true') {
    clearButton.dataset.filterBound = 'true';
    clearButton.addEventListener('click', () => {
      filterIds.forEach((id) => {
        const input = document.getElementById(id);
        if (input) input.value = '';
      });
      renderConveniosList();
    });
  }
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Renderiza a tela inicial com responsáveis aptos a logar em convênios vigentes.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê convênios da chave de contratos no LocalStorage e usa os responsáveis vinculados ao contrato.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: substituir a lista local por autenticação real do responsável com usuário e senha.
 */
function renderConveniosList() {
  const body = document.getElementById('convenios-body');
  if (!body) return;

  /*
   * DESCRIÇÃO DO BLOCO:
   * Carrega todos os responsáveis operacionais diretamente, sem aplicar filtros visuais na tela inicial.
   *
   * PARÂMETROS E RETORNO:
   * Não recebe parâmetros e não retorna valor; apenas alimenta o HTML da tabela.
   *
   * ARMAZENAMENTO E PERSISTÊNCIA:
   * Lê dados via getAcessosOperacionais(), que consulta os convênios persistidos no LocalStorage.
   *
   * NOTAS DE EXPANSÃO:
   * TODO: quando houver backend, substituir a listagem local por paginação e busca server-side.
   */
  const acessos = getAcessosOperacionais();

  if (!acessos.length) {
    body.innerHTML = '<tr><td class="empty" colspan="7">Nenhum responsável operacional encontrado.</td></tr>';
    return;
  }

  body.innerHTML = acessos.map(({ convenio, responsavel }) => `
    <tr>
      <td><strong>${escapeHtml(getResponsavelDisplayName(responsavel.nome))}</strong></td>
      <td>${escapeHtml(convenio.nome || '-')}</td>
      <td>${escapeHtml(maskCpfForDisplay(responsavel.cpf))}</td>
      <td>${escapeHtml(responsavel.email || '-')}</td>
      <td>${escapeHtml(responsavel.telefone || '-')}</td>
      <td>${formatResponsavelFuncoes(responsavel)}</td>
      <td>
        <div class="actions">
          <a class="login-action" href="criar-vagas.html?id=${encodeURIComponent(convenio.id)}&responsavel=${encodeURIComponent(responsavel.id || responsavel.cpf || responsavel.nome || '')}">Logar</a>
        </div>
      </td>
    </tr>
  `).join('');
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Busca na URL o convênio selecionado para a tela operacional.
 *
 * PARÂMETROS E RETORNO:
 * @returns {object|null} Convênio vigente encontrado ou nulo quando o parâmetro for inválido.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê contratos do LocalStorage e usa o parâmetro `id` da URL.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: validar o acesso do usuário no servidor antes de carregar dados sensíveis do convênio.
 */
function getSelectedConvenio() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Resolve o convênio ativo da operação, priorizando o ID da URL
   * quando o responsável acabou de clicar em Logar e reaproveitando a sessão local nas páginas internas.
   * PARÂMETROS E RETORNO: Não recebe parâmetros; retorna o convênio vigente encontrado ou null.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê URL, LocalStorage de convênios e grava cproeis_convenio_atual
   * para manter o convênio selecionado durante a navegação do protótipo.
   * TODO: Em produção, substituir por sessão autenticada do responsável com validação de permissão no backend.
   */
  const params = new URLSearchParams(window.location.search);
  const urlId = params.get('id') || '';
  const storedId = localStorage.getItem(STORAGE_CONVENIO_ATUAL) || '';
  const id = urlId || storedId;
  const convenio = getConvenios().find((item) => item.id === id && isConvenioVigente(item)) || null;

  if (convenio && urlId) {
    localStorage.setItem(STORAGE_CONVENIO_ATUAL, convenio.id);
  }

  return convenio;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Busca o responsável selecionado no login operacional a partir do parâmetro `responsavel` da URL.
 *
 * PARÂMETROS E RETORNO:
 * @param {object|null} convenio - Convênio vigente selecionado.
 * @returns {object|null} Responsável encontrado no convênio ou nulo quando não houver correspondência.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; lê somente a URL atual e o array de responsáveis já carregado do convênio.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: substituir parâmetro de URL por sessão autenticada quando existir login real em produção.
 */
function getSelectedResponsavel(convenio) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Resolve o responsável ativo do convênio usando a URL no login e
   * LocalStorage como fallback nas páginas internas do módulo.
   * PARÂMETROS E RETORNO: Recebe convenio (object|null) e retorna o responsável encontrado ou null.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê URL e cproeis_convenio_responsavel_atual; grava o identificador
   * atual quando houver responsável válido vindo da URL.
   * TODO: Em produção, vincular responsável à sessão autenticada e validar funções autorizadas no backend.
   */
  if (!convenio) return null;

  const responsavelParam = new URLSearchParams(window.location.search).get('responsavel') || '';
  const storedResponsavel = localStorage.getItem(STORAGE_CONVENIO_RESPONSAVEL_ATUAL) || '';
  const activeResponsavel = responsavelParam || storedResponsavel;
  if (!activeResponsavel) return null;

  const selected = (convenio.responsaveis || []).find((responsavel) => {
    const identifiers = [responsavel.id, responsavel.cpf, responsavel.nome].filter(Boolean).map(String);
    return identifiers.includes(activeResponsavel);
  }) || null;

  if (selected && responsavelParam) {
    localStorage.setItem(STORAGE_CONVENIO_RESPONSAVEL_ATUAL, selected.id || selected.cpf || selected.nome || '');
  }

  return selected;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Obtém o identificador de vaga informado na URL para edição em outra página do módulo.
 *
 * PARÂMETROS E RETORNO:
 * @returns {string} Identificador da vaga presente no parâmetro `vaga`, ou string vazia.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa LocalStorage; lê apenas os parâmetros da URL atual.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: trocar parâmetros simples por rotas autenticadas quando houver controle de sessão no backend.
 */
function getSelectedVagaId() {
  return new URLSearchParams(window.location.search).get('vaga') || '';
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Atualiza links do menu e botões de navegação para manter o convênio selecionado entre páginas.
 *
 * PARÂMETROS E RETORNO:
 * @param {object|null} convenio - Convênio selecionado pela URL.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; altera somente atributos `href` no DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: substituir passagem de ID via query string por roteamento protegido em ambiente online.
 */
function updateConvenioLinks(convenio) {
  if (!convenio) return;

  const selectedResponsavel = getSelectedResponsavel(convenio);
  const responsavelId = selectedResponsavel ? (selectedResponsavel.id || selectedResponsavel.cpf || selectedResponsavel.nome || '') : '';
  const idParam = `id=${encodeURIComponent(convenio.id)}${responsavelId ? `&responsavel=${encodeURIComponent(responsavelId)}` : ''}`;
  const links = {
    'menu-criar-vagas': `criar-vagas.html?${idParam}`,
    'menu-acompanhamento': `acompanhamento.html?${idParam}`,
    'menu-vagas': `vagas.html?${idParam}`,
    'menu-criar-curso': `criar-curso.html?${idParam}`,
    'menu-historico-curso': `historico-curso.html?${idParam}`,
    'menu-detalhes-convenio': `../contratos/detalhes-convenio.html?${idParam}`,
    'back-menu-link': `operacao.html?${idParam}`
  };

  Object.entries(links).forEach(([elementId, href]) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.href = href;
    }
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Preenche a página operacional com o nome do convênio e bloqueia a tela caso o contrato não esteja vigente.
 *
 * PARÂMETROS E RETORNO:
 * @param {object|null} convenio - Convênio selecionado pela URL.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; apenas mostra em tela dados lidos do LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: criar uma página de erro autenticada quando o contrato estiver vencido ou o usuário não tiver permissão.
 */
function renderOperationalHeader(convenio) {
  const title = document.getElementById('page-title');
  const subtitle = document.getElementById('page-subtitle');
  const form = document.getElementById('vaga-form');

  if (!title || !subtitle) return;

  if (!convenio) {
    title.textContent = 'Convênio não disponível';
    subtitle.textContent = 'O convênio informado não existe ou está fora do prazo de vigência.';
    if (form) {
      form.querySelectorAll('input, select, textarea, button').forEach((element) => {
        element.disabled = true;
      });
    }
    return;
  }

  title.textContent = 'Acesso do Convênio';
  const selectedResponsavel = getSelectedResponsavel(convenio);
  const responsavelText = selectedResponsavel?.nome ? `Responsável: ${selectedResponsavel.nome}` : 'Responsável não informado';
  subtitle.textContent = `${convenio.nome || 'Convênio sem nome'} | Contrato ${convenio.numero || '-'} | Vigência de ${formatDate(convenio.inicio)} até ${formatDate(convenio.fim)} | ${responsavelText}`;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Renderiza um alerta de vencimento do contrato quando faltam 120 dias ou menos para o fim da vigência.
 *
 * PARÂMETROS E RETORNO:
 * @param {object|null} convenio - Convênio selecionado, contendo a data final em `fim`.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; lê a data de fim do convênio carregada do LocalStorage e atualiza apenas o DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: mover o limite de 120 dias para configuração administrativa e gerar notificações persistentes por usuário.
 */
function renderContractExpirationAlert(convenio) {
  const alertBox = document.getElementById('contract-expiration-alert');
  if (!alertBox) return;

  alertBox.classList.add('is-hidden');
  alertBox.innerHTML = '';

  if (!convenio?.fim) return;

  const endDate = parseLocalDate(convenio.fim);
  const currentDate = parseLocalDate(today);
  if (Number.isNaN(endDate.getTime()) || Number.isNaN(currentDate.getTime())) return;

  const daysUntilExpiration = Math.ceil((endDate - currentDate) / 86400000);
  if (daysUntilExpiration > 120) return;

  const expired = daysUntilExpiration < 0;
  const dayLabel = Math.abs(daysUntilExpiration) === 1 ? 'dia' : 'dias';
  const message = expired
    ? `O contrato venceu há ${Math.abs(daysUntilExpiration)} ${dayLabel}, em ${formatDate(convenio.fim)}.`
    : `Faltam ${daysUntilExpiration} ${dayLabel} para o vencimento do contrato, em ${formatDate(convenio.fim)}.`;

  alertBox.innerHTML = `
    <strong>${expired ? 'Contrato vencido' : 'Atenção ao vencimento do contrato'}</strong>
    <span>${message} Verifique a renovação ou o planejamento das próximas vagas.</span>
  `;
  alertBox.classList.remove('is-hidden');
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Atualiza os cards de controle financeiro mensal da operação do convênio.
 *
 * PARÂMETROS E RETORNO:
 * @param {object|null} convenio - Convênio selecionado.
 * @param {string} month - Competência no formato YYYY-MM.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê vagas do LocalStorage para comparar a utilização mensal com o limite do contrato.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: considerar bloqueio automático de criação quando a utilização ofertada ultrapassar o limite mensal aprovado.
 */
function renderFinancialCards(convenio, month) {
  const limitCard = document.getElementById('limit-card');
  if (!convenio) return;

  const monthLabel = document.getElementById('month-label');
  if (monthLabel) {
    monthLabel.textContent = `Competência ${month.slice(5, 7)}/${month.slice(0, 4)}.`;
  }

  if (!limitCard) return;

  const vagasMes = getVagasDoMes(convenio.id, month);
  const resumo = summarizeVagas(vagasMes);
  const limiteMensal = getLimiteMensal(convenio);
  const diasDoMes = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate();
  const mediaOfertada = resumo.valorOfertado / diasDoMes;
  const mediaEscalada = resumo.valorEscalado / diasDoMes;
  const percentual = limiteMensal ? (resumo.valorOfertado / limiteMensal) * 100 : 0;

  limitCard.classList.remove('ok', 'warning', 'danger');
  limitCard.classList.add(percentual > 100 ? 'danger' : percentual >= 85 ? 'warning' : 'ok');

  document.getElementById('limit-status').textContent = percentual > 100 ? 'Limite mensal ultrapassado' : 'Dentro do limite mensal';
  document.getElementById('limit-detail').textContent = `${percentual.toFixed(1).replace('.', ',')}% do limite mensal utilizado em vagas ofertadas.`;
  document.getElementById('limite-mensal').textContent = dinheiro.format(limiteMensal);
  document.getElementById('total-ofertado').textContent = dinheiro.format(resumo.valorOfertado);
  document.getElementById('total-escalado').textContent = dinheiro.format(resumo.valorEscalado);
  document.getElementById('media-ofertada').textContent = dinheiro.format(mediaOfertada);
  document.getElementById('media-escalada').textContent = dinheiro.format(mediaEscalada);
  document.getElementById('quantidade-ofertada').textContent = resumo.quantidadeOfertada;
  document.getElementById('quantidade-escalada').textContent = resumo.quantidadeEscalada;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Agrupa vagas por uma chave calculada e soma quantidade ofertada, quantidade escalada e valores financeiros.
 *
 * PARÂMETROS E RETORNO:
 * @param {Array<object>} vagas - Vagas que serão agrupadas.
 * @param {Function} keyGetter - Função que recebe uma vaga e retorna a chave textual do grupo.
 * @returns {Array<object>} Grupos ordenados pelo maior valor ofertado.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa armazenamento diretamente; processa dados já lidos do LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: mover agregações para consultas no backend quando houver banco de dados e grande volume operacional.
 */
function groupVagas(vagas, keyGetter) {
  const groups = new Map();

  vagas.forEach((vaga) => {
    const key = keyGetter(vaga);
    const quantidade = Number(vaga.quantidade || 0);
    const preenchidas = Number(vaga.preenchidas || 0);
    const valorUnitario = Number(vaga.valorUnitario || 0);
    const current = groups.get(key) || {
      label: key,
      quantidadeOfertada: 0,
      quantidadeEscalada: 0,
      valorOfertado: 0,
      valorEscalado: 0
    };

    current.quantidadeOfertada += quantidade;
    current.quantidadeEscalada += preenchidas;
    current.valorOfertado += quantidade * valorUnitario;
    current.valorEscalado += preenchidas * valorUnitario;
    groups.set(key, current);
  });

  return [...groups.values()].sort((a, b) => b.valorOfertado - a.valorOfertado);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Identifica a semana de uma data dentro do mês para montar o painel de vagas por semana.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} dateValue - Data no formato YYYY-MM-DD.
 * @returns {string} Rótulo da semana dentro da competência.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa armazenamento; calcula em memória a partir da data da vaga.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: alinhar o conceito de semana com regra oficial do relatório quando existir calendário de competência no backend.
 */
function getWeekLabel(dateValue) {
  const date = parseLocalDate(dateValue);
  const week = Math.ceil(date.getDate() / 7);
  return `${week}ª semana`;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Cria o HTML de uma lista ranqueada para uso nos painéis do dashboard.
 *
 * PARÂMETROS E RETORNO:
 * @param {Array<object>} items - Itens agregados para exibição.
 * @param {string} emptyText - Texto exibido quando não houver dados.
 * @param {Function} valueFormatter - Função que transforma o item em texto de valor.
 * @returns {string} HTML seguro para inserir no painel.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa armazenamento; apenas formata agregações calculadas.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: substituir HTML por componentes reutilizáveis quando o frontend migrar para arquitetura modular.
 */
function renderRankItems(items, emptyText, valueFormatter) {
  if (!items.length) {
    return `<div class="rank-item"><span>${escapeHtml(emptyText)}</span><strong>-</strong></div>`;
  }

  return items.map((item) => `
    <div class="rank-item">
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(valueFormatter(item))}</strong>
    </div>
  `).join('');
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Cria barras horizontais proporcionais para indicadores semanais do dashboard.
 *
 * PARÂMETROS E RETORNO:
 * @param {Array<object>} items - Itens agregados por semana.
 * @returns {string} HTML com barras proporcionais por quantidade ofertada.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa LocalStorage; usa grupos calculados a partir das vagas já carregadas.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: evoluir para gráfico acessível com filtros por competência, classe e turno.
 */
function renderBarItems(items) {
  if (!items.length) {
    return '<div class="bar-item"><span>Nenhuma semana com vaga</span><strong>-</strong></div>';
  }

  const maxQuantity = Math.max(...items.map((item) => item.quantidadeOfertada), 1);

  return items.map((item) => {
    const width = Math.min(100, (item.quantidadeOfertada / maxQuantity) * 100);

    return `
      <div class="bar-item">
        <span>${escapeHtml(item.label)}</span>
        <strong>${item.quantidadeOfertada} vagas | ${dinheiro.format(item.valorOfertado)}</strong>
        <div class="bar-track"><div class="bar-fill" style="width: ${width}%"></div></div>
      </div>
    `;
  }).join('');
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Prepara um canvas para desenho em alta definição respeitando o tamanho real exibido na tela.
 *
 * PARÂMETROS E RETORNO:
 * @param {HTMLCanvasElement|null} canvas - Elemento canvas que será usado no gráfico.
 * @returns {CanvasRenderingContext2D|null} Contexto 2D pronto para desenho ou nulo quando o canvas não existir.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não lê nem grava dados persistentes; atua somente no DOM/canvas da página atual.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: substituir por biblioteca de gráficos padronizada se o dashboard ganhar filtros avançados e interações complexas.
 */
function prepareChartCanvas(canvas) {
  if (!canvas) return null;

  const ratio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width * ratio));
  const height = Math.max(1, Math.round(rect.height * ratio));

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, rect.width, rect.height);

  return context;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Desenha uma mensagem discreta quando não existem dados suficientes para renderizar um gráfico.
 *
 * PARÂMETROS E RETORNO:
 * @param {HTMLCanvasElement|null} canvas - Canvas alvo.
 * @param {string} message - Texto exibido no centro do gráfico.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa armazenamento; apenas desenha no canvas.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: criar estado visual compartilhado para loading, vazio e erro quando os dados vierem de API.
 */
function drawEmptyChart(canvas, message) {
  const context = prepareChartCanvas(canvas);
  if (!context || !canvas) return;

  const { width, height } = canvas.getBoundingClientRect();
  context.fillStyle = '#64748b';
  context.font = '700 13px Arial, Helvetica, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(message, width / 2, height / 2);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Desenha um gráfico de rosca para indicar a utilização do limite mensal.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} canvasId - ID do canvas que receberá o gráfico.
 * @param {number} percent - Percentual de uso do limite.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa armazenamento; usa valores calculados no dashboard.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: adicionar tooltip e comparação com competências anteriores em uma versão online.
 */
function drawDonutChart(canvasId, percent) {
  const canvas = document.getElementById(canvasId);
  const context = prepareChartCanvas(canvas);
  if (!context || !canvas) return;

  const { width, height } = canvas.getBoundingClientRect();
  const radius = Math.min(width, height) * 0.32;
  const centerX = width / 2;
  const centerY = height / 2;
  const safePercent = Math.max(0, percent);
  const cappedPercent = Math.min(100, safePercent);
  const color = safePercent > 100 ? '#b42318' : safePercent >= 85 ? '#ca8a04' : '#15803d';

  context.lineWidth = 18;
  context.strokeStyle = '#e2e8f0';
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  context.stroke();

  context.strokeStyle = color;
  context.lineCap = 'round';
  context.beginPath();
  context.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * cappedPercent / 100));
  context.stroke();

  context.fillStyle = '#1f2a8a';
  context.font = '700 28px Arial, Helvetica, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(`${safePercent.toFixed(1).replace('.', ',')}%`, centerX, centerY - 6);
  context.fillStyle = '#64748b';
  context.font = '700 12px Arial, Helvetica, sans-serif';
  context.fillText('do limite', centerX, centerY + 24);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Desenha gráfico de barras verticais para comparar quantidades por período.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} canvasId - ID do canvas que receberá o gráfico.
 * @param {Array<object>} items - Itens com `label` e `quantidadeOfertada`.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; renderiza agregações calculadas em memória.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: adicionar seleção de barras para filtrar a tabela detalhada quando houver estado compartilhado.
 */
function drawVerticalBarChart(canvasId, items) {
  const canvas = document.getElementById(canvasId);
  const context = prepareChartCanvas(canvas);
  if (!context || !canvas) return;

  if (!items.length) {
    drawEmptyChart(canvas, 'Sem dados no mês');
    return;
  }

  const { width, height } = canvas.getBoundingClientRect();
  const padding = { top: 18, right: 12, bottom: 34, left: 30 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(...items.map((item) => item.quantidadeOfertada), 1);
  const barGap = 10;
  const barWidth = Math.max(18, (chartWidth - barGap * (items.length - 1)) / items.length);

  context.strokeStyle = '#e2e8f0';
  context.beginPath();
  context.moveTo(padding.left, padding.top);
  context.lineTo(padding.left, padding.top + chartHeight);
  context.lineTo(padding.left + chartWidth, padding.top + chartHeight);
  context.stroke();

  items.forEach((item, index) => {
    const barHeight = (item.quantidadeOfertada / maxValue) * chartHeight;
    const x = padding.left + index * (barWidth + barGap);
    const y = padding.top + chartHeight - barHeight;

    context.fillStyle = '#1f2a8a';
    context.fillRect(x, y, barWidth, barHeight);
    context.fillStyle = '#1f2937';
    context.font = '700 12px Arial, Helvetica, sans-serif';
    context.textAlign = 'center';
    context.fillText(String(item.quantidadeOfertada), x + barWidth / 2, y - 6);
    context.fillStyle = '#64748b';
    context.font = '700 11px Arial, Helvetica, sans-serif';
    context.fillText(item.label.replace(' semana', ''), x + barWidth / 2, height - 10);
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Desenha barras horizontais para distribuição de vagas por tipo de serviço.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} canvasId - ID do canvas que receberá o gráfico.
 * @param {Array<object>} items - Itens com `label`, `quantidadeOfertada` e `valorOfertado`.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa LocalStorage; usa dados agregados recebidos por parâmetro.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: permitir alternar a métrica do gráfico entre quantidade, valor ofertado e valor escalado.
 */
function drawHorizontalBarChart(canvasId, items) {
  const canvas = document.getElementById(canvasId);
  const context = prepareChartCanvas(canvas);
  if (!context || !canvas) return;

  if (!items.length) {
    drawEmptyChart(canvas, 'Sem tipos no mês');
    return;
  }

  const { width, height } = canvas.getBoundingClientRect();
  const maxValue = Math.max(...items.map((item) => item.quantidadeOfertada), 1);
  const rowHeight = Math.min(42, (height - 20) / items.length);
  const labelWidth = 92;

  items.forEach((item, index) => {
    const y = 14 + index * rowHeight;
    const availableWidth = width - labelWidth - 26;
    const barWidth = (item.quantidadeOfertada / maxValue) * availableWidth;

    context.fillStyle = '#64748b';
    context.font = '700 11px Arial, Helvetica, sans-serif';
    context.textAlign = 'left';
    context.fillText(item.label, 8, y + 16);
    context.fillStyle = '#e2e8f0';
    context.fillRect(labelWidth, y, availableWidth, 18);
    context.fillStyle = '#1f2a8a';
    context.fillRect(labelWidth, y, barWidth, 18);
    context.fillStyle = '#1f2937';
    context.textAlign = 'right';
    context.fillText(String(item.quantidadeOfertada), width - 8, y + 16);
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Desenha uma linha com preenchimento para evolução de valor ofertado por dia no mês.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} canvasId - ID do canvas que receberá o gráfico.
 * @param {Array<object>} items - Itens diários com `label` e `valorOfertado`.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; transforma agregações diárias em visualização canvas.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: adicionar média móvel e projeção visual quando houver histórico de várias competências.
 */
function drawLineChart(canvasId, items) {
  const canvas = document.getElementById(canvasId);
  const context = prepareChartCanvas(canvas);
  if (!context || !canvas) return;

  if (!items.length) {
    drawEmptyChart(canvas, 'Sem gasto diário no mês');
    return;
  }

  const { width, height } = canvas.getBoundingClientRect();
  const padding = { top: 18, right: 18, bottom: 24, left: 42 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(...items.map((item) => item.valorOfertado), 1);
  const points = items.map((item, index) => ({
    x: padding.left + (items.length === 1 ? chartWidth / 2 : (index / (items.length - 1)) * chartWidth),
    y: padding.top + chartHeight - (item.valorOfertado / maxValue) * chartHeight,
    item
  }));

  context.strokeStyle = '#e2e8f0';
  context.beginPath();
  context.moveTo(padding.left, padding.top);
  context.lineTo(padding.left, padding.top + chartHeight);
  context.lineTo(padding.left + chartWidth, padding.top + chartHeight);
  context.stroke();

  context.beginPath();
  points.forEach((point, index) => {
    if (index === 0) {
      context.moveTo(point.x, point.y);
    } else {
      context.lineTo(point.x, point.y);
    }
  });
  context.strokeStyle = '#1f2a8a';
  context.lineWidth = 3;
  context.stroke();

  context.lineTo(points[points.length - 1].x, padding.top + chartHeight);
  context.lineTo(points[0].x, padding.top + chartHeight);
  context.closePath();
  context.fillStyle = 'rgba(31, 42, 138, 0.12)';
  context.fill();

  points.forEach((point) => {
    context.beginPath();
    context.arc(point.x, point.y, 4, 0, Math.PI * 2);
    context.fillStyle = '#1f2a8a';
    context.fill();
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Renderiza o dashboard profissional do convênio com indicadores financeiros, semanais e operacionais.
 *
 * PARÂMETROS E RETORNO:
 * @param {object|null} convenio - Convênio selecionado.
 * @param {string} month - Competência no formato YYYY-MM.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê vagas do LocalStorage por meio de `getVagasDoMes` e usa dados do contrato carregado para calcular limite e saldo.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: adicionar filtros de competência, exportação e indicadores oficiais de pagamento quando houver backend.
 */
function renderDashboard(convenio, month) {
  const progress = document.getElementById('uso-progress');
  if (!progress || !convenio) return;

  const vagasMes = getVagasDoMes(convenio.id, month);
  const vagasContrato = getVagas().filter((vaga) => vaga.convenioId === convenio.id);
  const vagasHoje = vagasContrato.filter((vaga) => vaga.dataServico === today);
  const resumo = summarizeVagas(vagasMes);
  const resumoContrato = summarizeVagas(vagasContrato);
  const resumoHoje = summarizeVagas(vagasHoje);
  const limiteMensal = getLimiteMensal(convenio);
  const valorContrato = Number(convenio.valorContrato ?? convenio.valorMensal ?? 0);
  const saldoRestante = limiteMensal - resumo.valorOfertado;
  const saldoTotalContrato = valorContrato - resumoContrato.valorOfertado;
  const daysInMonth = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate();
  const elapsedDays = month === currentMonth ? Number(today.slice(8, 10)) : daysInMonth;
  const projectedValue = elapsedDays ? (resumo.valorOfertado / elapsedDays) * daysInMonth : 0;
  const availableDailyValue = Math.max(0, saldoRestante) / Math.max(1, daysInMonth - elapsedDays + 1);
  const usagePercent = limiteMensal ? (resumo.valorOfertado / limiteMensal) * 100 : 0;
  const fillPercent = Math.min(100, usagePercent);
  const pendingSlots = Math.max(0, resumo.quantidadeOfertada - resumo.quantidadeEscalada);
  const fillRate = resumo.quantidadeOfertada ? (resumo.quantidadeEscalada / resumo.quantidadeOfertada) * 100 : 0;
  const byType = groupVagas(vagasMes, (vaga) => tiposServico[vaga.tipoServico] || vaga.tipoServico || 'Sem tipo');
  const byWeek = groupVagas(vagasMes, (vaga) => getWeekLabel(vaga.dataServico));
  const byDay = groupVagas(vagasMes, (vaga) => formatDate(vaga.dataServico)).slice(0, 5);
  const dailyChartItems = groupVagas(vagasMes, (vaga) => formatDate(vaga.dataServico))
    .sort((a, b) => {
      const [dayA, monthA, yearA] = a.label.split('/');
      const [dayB, monthB, yearB] = b.label.split('/');
      return `${yearA}-${monthA}-${dayA}`.localeCompare(`${yearB}-${monthB}-${dayB}`);
    });

  progress.style.width = `${fillPercent}%`;
  progress.classList.remove('warning', 'danger');
  if (usagePercent > 100) {
    progress.classList.add('danger');
  } else if (usagePercent >= 85) {
    progress.classList.add('warning');
  }

  document.getElementById('dashboard-competencia').textContent = `Competência ${month.slice(5, 7)}/${month.slice(0, 4)}`;
  document.getElementById('uso-percentual').textContent = `${usagePercent.toFixed(1).replace('.', ',')}%`;
  document.getElementById('saldo-restante').textContent = dinheiro.format(saldoRestante);
  document.getElementById('projecao-mensal').textContent = dinheiro.format(projectedValue);
  document.getElementById('valor-diario-disponivel').textContent = dinheiro.format(availableDailyValue);
  document.getElementById('saldo-total-contrato').textContent = dinheiro.format(saldoTotalContrato);
  document.getElementById('valor-gasto-hoje').textContent = dinheiro.format(resumoHoje.valorOfertado);
  document.getElementById('tipos-vagas-list').innerHTML = renderRankItems(
    byType,
    'Nenhum tipo de vaga criado',
    (item) => `${item.quantidadeOfertada} vagas | ${dinheiro.format(item.valorOfertado)}`
  );
  document.getElementById('semanas-list').innerHTML = renderBarItems(byWeek);
  document.getElementById('dias-custo-list').innerHTML = renderRankItems(
    byDay,
    'Nenhum dia com custo',
    (item) => `${dinheiro.format(item.valorOfertado)} | ${item.quantidadeOfertada} vagas`
  );
  document.getElementById('taxa-preenchimento').textContent = `${fillRate.toFixed(1).replace('.', ',')}%`;
  document.getElementById('vagas-pendentes').textContent = pendingSlots;

  drawDonutChart('uso-limite-chart', usagePercent);
  drawLineChart('gasto-diario-chart', dailyChartItems);
  drawHorizontalBarChart('tipos-vagas-chart', byType);
  drawVerticalBarChart('semanas-chart', byWeek);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Renderiza um calendário mensal clicável para seleção rápida de dias de criação de vagas.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} month - Competência no formato YYYY-MM.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; usa o Set `selectedCalendarDates` mantido em memória durante a sessão da página.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: persistir preferências de seleção e destacar feriados/indisponibilidades vindos da API.
 */
function renderCalendar(month, convenio = null) {
  const calendar = document.getElementById('calendar-grid');
  const counter = document.getElementById('selected-dates-count');
  if (!calendar || !month) return;

  const mode = document.getElementById('date-mode')?.value || '';
  const [year, monthNumber] = month.split('-').map(Number);
  const firstDate = new Date(year, monthNumber - 1, 1);
  const lastDate = new Date(year, monthNumber, 0);
  const startOffset = firstDate.getDay();
  const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const cells = weekdays.map((day) => `<div class="calendar-weekday">${day}</div>`);

  for (let index = 0; index < startOffset; index += 1) {
    cells.push('<div class="calendar-day outside"></div>');
  }

  for (let day = 1; day <= lastDate.getDate(); day += 1) {
    const date = toDateInputValue(new Date(year, monthNumber - 1, day));
    if (!isDateInsideContract(convenio, date)) {
      cells.push('<div class="calendar-day outside"></div>');
      continue;
    }

    const selected = selectedCalendarDates.has(date) ? ' selected' : '';
    cells.push(`<button type="button" class="calendar-day${selected}" data-calendar-date="${date}">${day}</button>`);
  }

  calendar.innerHTML = cells.join('');
  counter.textContent = selectedCalendarDates.size;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Renderiza botões de meses para facilitar a troca de competência sem usar navegação anterior/próximo.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} month - Competência selecionada no formato YYYY-MM.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; cria botões no DOM usando o ano da competência selecionada.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: bloquear meses fora da vigência do contrato quando a validação estiver centralizada no backend.
 */
function renderMonthSelector(month, convenio = null) {
  const target = document.getElementById('month-selector');
  if (!target || !month) return;

  const groupedByYear = getDisplayMonthsList(convenio, month).reduce((groups, value) => {
    const year = value.slice(0, 4);
    groups[year] = groups[year] || [];
    groups[year].push(value);
    return groups;
  }, {});

  target.innerHTML = Object.entries(groupedByYear).map(([yearGroup, months]) => `
    <section class="month-group">
      <h4>${yearGroup}</h4>
      <div class="month-group-grid">
        ${months.map((value) => {
    const [year, monthNumber] = value.split('-').map(Number);
    const label = mesesAno[monthNumber - 1];
    const disabled = !isMonthInsideContract(convenio, value);

    const classNames = [
      value === month ? 'current-month' : '',
      [...selectedCalendarDates].some((date) => date.startsWith(value)) ? 'has-selection' : '',
      disabled ? 'disabled-month' : ''
    ].filter(Boolean).join(' ');
    const classAttribute = classNames ? ` class="${classNames}"` : '';
    const disabledAttribute = disabled ? ' disabled' : '';

          return `<button type="button"${classAttribute}${disabledAttribute} data-calendar-month="${value}">${label}</button>`;
        }).join('')}
      </div>
    </section>
  `).join('');
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Fecha o calendário customizado usado pelos campos de período específico.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; apenas oculta o componente visual no DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: transformar este controle em componente reutilizável para outras telas com seleção de data.
 */
function closeCustomDatePicker() {
  const picker = document.getElementById('custom-date-picker');
  picker?.classList.add('is-hidden');
  customDatePickerState.fieldId = '';
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Renderiza o calendário customizado de um mês para seleção de data inicial ou final.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava LocalStorage; lê estado temporário do datepicker, vigência do convênio e valores atuais do DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: carregar feriados, bloqueios operacionais e indisponibilidades por API quando houver backend.
 */
function renderCustomDatePicker() {
  const picker = document.getElementById('custom-date-picker');
  const fieldId = customDatePickerState.fieldId;
  const month = customDatePickerState.month || currentMonth;
  const convenio = customDatePickerState.convenio;
  if (!picker || !fieldId) return;

  const [year, monthNumber] = month.split('-').map(Number);
  const selectedDate = document.getElementById(fieldId)?.value || '';
  const firstWeekDay = new Date(year, monthNumber - 1, 1).getDay();
  const daysInMonth = new Date(year, monthNumber, 0).getDate();
  const previousMonth = toDateInputValue(new Date(year, monthNumber - 2, 1)).slice(0, 7);
  const nextMonth = toDateInputValue(new Date(year, monthNumber, 1)).slice(0, 7);
  const dayCells = [];

  for (let i = 0; i < firstWeekDay; i += 1) {
    dayCells.push('<span class="custom-date-empty"></span>');
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = `${month}-${String(day).padStart(2, '0')}`;
    const disabled = !isDateInsideContract(convenio, date);
    const selected = selectedDate === date;
    const todayClass = date === today ? ' is-today' : '';
    const selectedClass = selected ? ' is-selected' : '';
    const disabledClass = disabled ? ' is-disabled' : '';
    const disabledAttribute = disabled ? ' disabled' : '';

    dayCells.push(`
      <button type="button" class="custom-date-day${todayClass}${selectedClass}${disabledClass}" data-picker-date="${date}"${disabledAttribute}>
        ${day}
      </button>
    `);
  }

  picker.innerHTML = `
    <div class="custom-date-header">
      <button type="button" aria-label="Mês anterior" data-picker-month="${previousMonth}">‹</button>
      <strong>${mesesAno[monthNumber - 1]} ${year}</strong>
      <button type="button" aria-label="Próximo mês" data-picker-month="${nextMonth}">›</button>
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
 * Abre o calendário customizado abaixo dos campos de início/fim e posiciona o mês de referência.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} fieldId - ID do input oculto que será atualizado (`data-inicio` ou `data-fim`).
 * @param {object|null} convenio - Convênio selecionado para bloquear datas fora da vigência.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados persistentes; atualiza estado temporário do datepicker e exibe o componente no DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: gerenciar foco e navegação por teclado completos para acessibilidade avançada.
 */
function openCustomDatePicker(fieldId, convenio) {
  const picker = document.getElementById('custom-date-picker');
  const dateModeFields = document.getElementById('date-mode-fields');
  const trigger = document.getElementById(`${fieldId}-display`);
  const value = document.getElementById(fieldId)?.value || document.getElementById('data-inicio')?.value || today;
  if (!picker || !dateModeFields || !trigger) return;

  customDatePickerState.fieldId = fieldId;
  customDatePickerState.month = value.slice(0, 7);
  customDatePickerState.convenio = convenio;
  dateModeFields.appendChild(picker);
  const pickerWidth = Math.min(430, dateModeFields.clientWidth);
  const maxLeft = Math.max(0, dateModeFields.clientWidth - pickerWidth);
  const left = Math.min(trigger.offsetLeft, maxLeft);
  picker.style.setProperty('--picker-left', `${left}px`);
  picker.style.setProperty('--picker-top', `${trigger.offsetTop + trigger.offsetHeight + 10}px`);
  picker.classList.remove('is-hidden');
  renderCustomDatePicker();
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Aplica a data escolhida no calendário customizado ao fluxo de criação por período específico.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} date - Data selecionada no formato YYYY-MM-DD.
 * @param {object|null} convenio - Convênio selecionado para revalidar o período.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava LocalStorage; atualiza inputs do DOM e dispara nova renderização da tela operacional.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: validar disponibilidade da data no backend antes de confirmar seleção em produção.
 */
function selectCustomDate(date, convenio) {
  const fieldId = customDatePickerState.fieldId;
  const startInput = document.getElementById('data-inicio');
  const endInput = document.getElementById('data-fim');
  if (!fieldId || !startInput || !endInput || !isDateInsideContract(convenio, date)) return;

  document.getElementById('date-mode').value = 'period';
  document.getElementById(fieldId).value = date;

  if (fieldId === 'data-inicio' && (!endInput.value || endInput.value < date)) {
    endInput.value = date;
  }

  if (fieldId === 'data-fim' && (!startInput.value || startInput.value > date)) {
    startInput.value = date;
  }

  document.getElementById('calendar-month').value = startInput.value.slice(0, 7);
  document.querySelectorAll('[data-date-mode-option]').forEach((item) => item.classList.toggle('active', item.dataset.dateModeOption === 'period'));
  closeCustomDatePicker();
  renderOperationalView(convenio);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Renderiza opções de semanas completas, de segunda a domingo, para a competência selecionada.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} month - Competência no formato YYYY-MM.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; usa campos do formulário para destacar a semana atualmente selecionada.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: validar semanas permitidas pela vigência do contrato no backend.
 */
function renderWeekOptions(month, convenio = null) {
  const target = document.getElementById('week-grid');
  if (!target || !month) return;

  const [year, monthNumber] = month.split('-').map(Number);
  const firstDay = `${month}-01`;
  const lastDay = toDateInputValue(new Date(year, monthNumber, 0));
  let cursor = getMonday(firstDay);
  const selectedStart = document.getElementById('data-inicio')?.value || '';
  const weeks = [];

  while (cursor <= lastDay) {
    const start = cursor;
    const end = addDays(start, 6);
    const visibleDates = getDatesBetween(start, end).filter((date) => isDateInsideContract(convenio, date));
    if (!visibleDates.length) {
      cursor = addDays(cursor, 7);
      continue;
    }

    const selected = start === selectedStart ? ' selected' : '';
    weeks.push(`
      <button class="week-option${selected}" type="button" data-week-start="${start}" data-week-end="${end}">
        ${formatLongDate(visibleDates[0])} até ${formatLongDate(visibleDates[visibleDates.length - 1])}
      </button>
    `);
    cursor = addDays(cursor, 7);
  }

  target.innerHTML = weeks.join('');
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Renderiza a tabela de meses do ano para criação por competência mensal.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} month - Competência usada para definir o ano exibido.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa LocalStorage; cria botões de mês em memória no DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: bloquear meses fora da vigência do contrato quando houver regra online centralizada.
 */
function renderMonthOptions(month, convenio = null) {
  const target = document.getElementById('month-grid');
  if (!target || !month) return;

  const selectedMonth = document.getElementById('calendar-month')?.value || month;

  const groupedByYear = getDisplayMonthsList(convenio, month).reduce((groups, value) => {
    const year = value.slice(0, 4);
    groups[year] = groups[year] || [];
    groups[year].push(value);
    return groups;
  }, {});

  target.innerHTML = Object.entries(groupedByYear).map(([yearGroup, months]) => `
    <section class="month-group">
      <h4>${yearGroup}</h4>
      <div class="month-group-grid">
        ${months.map((value) => {
    const [year, monthNumber] = value.split('-').map(Number);
    const label = mesesAno[monthNumber - 1];
    const disabled = !isMonthInsideContract(convenio, value);

    const selected = value === selectedMonth ? ' selected' : '';
    const disabledClass = disabled ? ' disabled-month' : '';
    const disabledAttribute = disabled ? ' disabled' : '';

          return `
            <button class="month-option${selected}${disabledClass}" type="button"${disabledAttribute} data-month-option="${value}">
              ${label}
            </button>
          `;
        }).join('')}
      </div>
    </section>
  `).join('');
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Controla qual seletor de datas aparece no segundo card conforme o tipo de criação escolhido.
 *
 * PARÂMETROS E RETORNO:
 * @param {object|null} convenio - Convênio selecionado para sincronizar datas quando necessário.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; alterna classes de exibição e renderiza calendário, semanas ou meses.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: separar esse controle em componente próprio quando o módulo tiver arquitetura frontend modular.
 */
function renderDateSelectionMode(convenio) {
  const mode = document.getElementById('date-mode')?.value || '';
  const month = document.getElementById('calendar-month')?.value || currentMonth;
  const calendar = document.getElementById('calendar-grid');
  const weeks = document.getElementById('week-grid');
  const months = document.getElementById('month-grid');
  const calendarTitle = document.getElementById('calendar-title');
  const dateCard = document.getElementById('date-selection-card');
  const endInput = document.getElementById('data-fim')?.closest('label');
  const startInput = document.getElementById('data-inicio')?.closest('label');
  const monthInput = document.getElementById('calendar-month');
  if (!calendar || !weeks || !months || !monthInput || !startInput || !endInput) return;

  creationDateState.mode = mode;
  creationDateState.month = month;
  renderMonthSelector(month, convenio);
  calendar.classList.toggle('is-hidden', mode !== 'selected');
  calendarTitle?.classList.toggle('is-hidden', mode !== 'selected');
  weeks.classList.toggle('is-hidden', mode !== 'week');
  months.classList.toggle('is-hidden', mode !== 'month');
  dateCard?.classList.toggle('period-mode', mode === 'period');
  startInput.classList.toggle('is-hidden', mode === 'selected' || mode === 'week' || mode === 'month');
  endInput.classList.toggle('is-hidden', mode !== 'period');
  document.getElementById('month-selector')?.classList.toggle('is-hidden', mode === 'period' || mode === 'month');
  document.getElementById('selected-dates-box')?.classList.add('is-hidden');

  if (mode === 'selected') renderCalendar(month, convenio);
  if (mode === 'selected' && calendarTitle) {
    const [year, monthNumber] = month.split('-').map(Number);
    calendarTitle.textContent = `${mesesAno[monthNumber - 1]} ${year}`;
  }
  if (mode === 'week') renderWeekOptions(month, convenio);
  if (mode === 'month') renderMonthOptions(month, convenio);

  updateSelectedDatesCount(convenio);
  updateDateDescriptions();
  syncDateDisplayFields();
  moveSelectedDatesBox(mode);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Move o contador de dias selecionados para a linha dos inputs quando o modo é período específico.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} mode - Modo atual de criação de datas.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; reorganiza o elemento visual no DOM conforme o modo ativo.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: substituir movimentação manual por layout baseado em componentes quando houver frontend modular.
 */
function moveSelectedDatesBox(mode) {
  const dateModeFields = document.getElementById('date-mode-fields');
  const dateCard = document.getElementById('date-selection-card');
  const selectedBox = document.getElementById('selected-dates-box');
  if (!dateModeFields || !dateCard || !selectedBox) return;

  if (mode === 'period' && selectedBox.parentElement !== dateModeFields) {
    dateModeFields.appendChild(selectedBox);
  }

  if (mode !== 'period' && selectedBox.parentElement === dateModeFields) {
    dateCard.appendChild(selectedBox);
  }
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Atualiza os textos auxiliares dos inputs de data com dia da semana, mês e ano.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; lê os inputs de data no DOM e atualiza descrições visuais.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: reaproveitar esse helper em outras telas que usem seleção de período.
 */
function updateDateDescriptions() {
  const startDescription = document.getElementById('data-inicio-descricao');
  const endDescription = document.getElementById('data-fim-descricao');
  const startValue = document.getElementById('data-inicio')?.value || '';
  const endValue = document.getElementById('data-fim')?.value || '';

  if (startDescription) {
    startDescription.textContent = formatDateDescription(startValue);
  }

  if (endDescription) {
    endDescription.textContent = formatDateDescription(endValue);
  }
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Atualiza o contador de datas que serão efetivamente usadas na criação das vagas.
 *
 * PARÂMETROS E RETORNO:
 * @param {object|null} convenio - Convênio selecionado, usado para contar o modo contrato todo.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; lê o estado atual do formulário e atualiza o DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: exibir uma prévia paginada das datas antes de confirmar grandes criações em lote.
 */
function updateSelectedDatesCount(convenio) {
  const counter = document.getElementById('selected-dates-count');
  if (!counter) return;

  counter.textContent = getCreationDates(convenio).length;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Sincroniza campos de período conforme o modo de criação escolhido pelo operador.
 *
 * PARÂMETROS E RETORNO:
 * @param {object|null} convenio - Convênio selecionado, usado para preencher período de contrato inteiro.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; preenche inputs de data e seleção em memória.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: restringir automaticamente a datas operacionais permitidas quando o contrato trouxer calendário próprio.
 */
function syncDateModeFields(convenio) {
  const mode = document.getElementById('date-mode')?.value || 'period';
  const startInput = document.getElementById('data-inicio');
  const endInput = document.getElementById('data-fim');
  if (!startInput || !endInput) return;

  if (!startInput.value) {
    startInput.value = today;
  }

  startInput.value = clampDateToContract(convenio, startInput.value);

  if (mode === 'single' || mode === 'selected') {
    endInput.value = startInput.value;
  }

  if (mode === 'week') {
    startInput.value = getMonday(startInput.value);
    endInput.value = addDays(startInput.value, 6);
  }

  if (mode === 'month') {
    const monthValue = document.getElementById('calendar-month')?.value || startInput.value.slice(0, 7);
    const [year, monthNumber] = monthValue.split('-').map(Number);
    startInput.value = clampDateToContract(convenio, `${monthValue}-01`);
    endInput.value = clampDateToContract(convenio, toDateInputValue(new Date(year, monthNumber, 0)));
  }

  if (mode === 'contract' && convenio) {
    startInput.value = clampDateToContract(convenio, convenio.inicio || today);
    endInput.value = convenio.fim || startInput.value;
  }

  endInput.value = clampDateToContract(convenio, endInput.value || startInput.value);
  if (endInput.value < startInput.value) {
    endInput.value = startInput.value;
  }
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Configura os valores iniciais da tela operacional para evitar campos vazios e reduzir cliques.
 *
 * PARÂMETROS E RETORNO:
 * @param {object|null} convenio - Convênio selecionado para limitar datas iniciais ao contrato quando disponível.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava LocalStorage; inicializa apenas campos e seleção em memória.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: recuperar última competência e último turno usados pelo operador quando existir autenticação.
 */
function initializeOperationalDefaults(convenio) {
  if (!document.getElementById('vaga-form')) return;

  const start = convenio?.inicio && today < convenio.inicio ? convenio.inicio : today;
  const validStart = clampDateToContract(convenio, start);
  document.getElementById('calendar-month').value = validStart.slice(0, 7);
  document.getElementById('data-inicio').value = validStart;
  document.getElementById('data-fim').value = validStart;
  document.getElementById('date-mode').value = 'period';
  showCreationStep('date-selection-card');
  document.querySelectorAll('[data-date-mode-option]').forEach((button) => {
    button.classList.toggle('active', button.dataset.dateModeOption === 'period');
  });
  selectedCalendarDates.clear();
  selectedCalendarDates.add(validStart);
  applyTurnoToFields();
  ensureServiceFieldHints();
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Retorna as datas que serão usadas para criar vagas de acordo com calendário ou período selecionado.
 *
 * PARÂMETROS E RETORNO:
 * @param {object|null} convenio - Convênio selecionado, necessário para modo contrato todo.
 * @returns {Array<string>} Datas únicas e ordenadas no formato YYYY-MM-DD.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê apenas campos do formulário e o Set local de datas marcadas; não grava LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: executar esta expansão de recorrência no backend para evitar divergência entre navegadores.
 */
function getCreationDates(convenio) {
  const mode = document.getElementById('date-mode')?.value || 'period';
  const start = document.getElementById('data-inicio')?.value || today;
  const end = document.getElementById('data-fim')?.value || start;

  if (mode === 'selected') {
    return [...selectedCalendarDates].filter((date) => isDateInsideContract(convenio, date)).sort();
  }

  if (mode === 'single') {
    return isDateInsideContract(convenio, start) ? [start] : [];
  }

  if (mode === 'week') {
    return getDatesBetween(start, addDays(start, 6)).filter((date) => isDateInsideContract(convenio, date));
  }

  if (mode === 'month') {
    return getDatesBetween(start, end).filter((date) => isDateInsideContract(convenio, date));
  }

  if (mode === 'contract' && convenio) {
    return getDatesBetween(convenio.inicio || start, convenio.fim || end).filter((date) => isDateInsideContract(convenio, date));
  }

  return getDatesBetween(start, end).filter((date) => isDateInsideContract(convenio, date));
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Calcula a quinta-feira em que a vaga deve ser disponibilizada aos policiais.
 * A regra libera, toda quinta-feira, as vagas da próxima semana operacional de segunda a domingo.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} dataServico - Data do serviço no formato YYYY-MM-DD.
 * @returns {Date|null} Data de liberação automática ou nulo quando a data é inválida.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não lê nem grava dados; calcula a regra em memória a partir da data da vaga.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: mover esta regra para o backend/GSI para evitar divergência de calendário e permitir exceções oficiais.
 */
function getAutomaticOfferDeadline(dataServico) {
  if (!dataServico) return null;

  const monday = parseLocalDate(getMonday(dataServico));
  monday.setDate(monday.getDate() - 4);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Verifica se uma vaga já pode ser ofertada automaticamente aos policiais.
 * A vaga precisa ter sido criada antes da quinta-feira de liberação e a data atual precisa estar dentro ou após essa janela.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} vaga - Vaga persistida no LocalStorage com data de serviço e data de criação.
 * @returns {boolean} Verdadeiro quando a vaga pode ser ofertada sem autorização especial do GSI.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê apenas propriedades do objeto em memória; não altera LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: considerar protocolo de autorização GSI e auditoria de liberação quando a regra estiver online.
 */
function isVagaAutomaticallyOffered(vaga) {
  const releaseAt = getAutomaticOfferDeadline(vaga.dataServico);
  const createdAt = vaga.createdAt ? new Date(vaga.createdAt) : new Date(0);
  return Boolean(releaseAt && createdAt <= releaseAt && new Date() >= releaseAt);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Formata o intervalo semanal de segunda a domingo de uma vaga para explicar a liberação ao operador.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} dataServico - Data do serviço no formato YYYY-MM-DD.
 * @returns {string} Intervalo da semana operacional formatado para exibição.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; calcula o intervalo somente em memória.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: permitir semanas operacionais configuráveis por convênio quando houver parametrização no backend.
 */
function formatServiceWeekRange(dataServico) {
  if (!dataServico) return '-';

  const start = getMonday(dataServico);
  const end = addDays(start, 6);
  return `${formatDate(start)} a ${formatDate(end)}`;
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Monta os dados de status de oferta exibidos na tabela de vagas criadas.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} vaga - Vaga persistida localmente.
 * @returns {object} Estado visual da oferta, incluindo liberação, destaque e texto.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; lê a vaga em memória e deriva o status apresentado ao operador.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: substituir status local por retorno de workflow real do GSI com aprovação, reprovação e motivo.
 */
function getVagaOfferStatus(vaga) {
  const releaseAt = getAutomaticOfferDeadline(vaga.dataServico);
  const releaseDate = releaseAt ? toDateInputValue(releaseAt) : '';
  const createdAt = vaga.createdAt ? new Date(vaga.createdAt) : new Date(0);
  const now = new Date();
  const createdAfterRelease = Boolean(releaseAt && createdAt > releaseAt);
  const automatic = isVagaAutomaticallyOffered(vaga);
  const approvedByGsi = vaga.permissaoGsiStatus === 'aprovada';
  const requested = vaga.permissaoGsiStatus === 'solicitada';

  if (approvedByGsi) {
    return {
      offered: true,
      late: false,
      requested: false,
      needsPermission: false,
      className: 'authorized',
      filterValue: 'autorizada-gsi',
      label: 'Autorizada GSI',
      note: `Semana ${formatServiceWeekRange(vaga.dataServico)}`,
      icon: 'V'
    };
  }

  if (createdAfterRelease) {
    return {
      offered: false,
      late: true,
      requested,
      needsPermission: true,
      className: 'pending',
      filterValue: requested ? 'aguardando-gsi' : 'fora-prazo',
      label: requested ? 'Aguardando GSI' : 'Fora do prazo',
      note: `Liberação era ${formatDate(releaseDate)}`,
      icon: '△'
    };
  }

  if (automatic) {
    return {
      offered: true,
      late: false,
      requested: false,
      needsPermission: false,
      className: 'offered',
      filterValue: 'liberada',
      label: 'Liberada',
      note: `Semana ${formatServiceWeekRange(vaga.dataServico)}`,
      icon: 'V'
    };
  }

  const daysUntilRelease = releaseAt ? Math.ceil((releaseAt - now) / 86400000) : 0;
  const scheduledSoon = daysUntilRelease <= 7;

  return {
    offered: false,
    late: false,
    requested: false,
    needsPermission: false,
    className: scheduledSoon ? 'scheduled' : 'queued',
    filterValue: scheduledSoon ? 'programada' : 'aguardando-proxima',
    label: scheduledSoon ? 'Programada' : 'Aguardando próxima liberação',
    note: `Libera em ${formatDate(releaseDate)}`,
    icon: scheduledSoon ? '○' : '□'
  };
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Formata a situação de policiais escalados para a coluna operacional da tabela.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} vaga - Vaga persistida localmente.
 * @returns {string} Nome do policial, contador preenchido ou texto de ausência de escala.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; lê somente campos existentes da vaga em memória.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: vincular esta coluna a uma tabela real de escalas com identificação funcional do policial.
 */
function formatPolicialEscalado(vaga) {
  if (vaga.policialEscalado) return vaga.policialEscalado;
  if (Number(vaga.preenchidas || 0) > 0) return `${vaga.preenchidas}/${vaga.quantidade || 1} escalado(s)`;
  return 'Sem policial';
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Coleta os dados do formulário de vaga e calcula o valor unitário no momento da criação.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} convenio - Convênio selecionado.
 * @param {string} dataServico - Data da vaga que será criada no formato YYYY-MM-DD.
 * @param {object} classConfig - Configuração da classe selecionada, com turno, horário, quantidade e valor.
 * @param {object} serviceInfo - Dados do serviço e endereço de apresentação.
 * @returns {object} Payload pronto para persistência local.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava diretamente; prepara dados que serão salvos em `cproeis_convenios_vagas`.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: validar saldo e regras de negócio no backend antes de gravar a vaga em produção.
 */
function collectVagaPayload(convenio, dataServico, classConfig, serviceInfo) {
  const editingId = document.getElementById('editing-id').value;

  return {
    id: editingId || makeId(),
    convenioId: convenio.id,
    dataServico,
    nomeServico: serviceInfo.nomeServico,
    classe: classConfig.classe,
    turno: classConfig.turno,
    tipoServico: classConfig.tipoServico,
    horaInicio: classConfig.horaInicio,
    horaFim: classConfig.horaFim,
    quantidade: classConfig.quantidade,
    preenchidas: classConfig.preenchidas,
    curso: classConfig.curso,
    valorUnitario: classConfig.valorUnitario,
    localServico: serviceInfo.localServico,
    enderecoServico: serviceInfo.enderecoServico,
    enderecoDados: serviceInfo.enderecoDados,
    pontoReferencia: serviceInfo.pontoReferencia,
    observacoes: '',
    createdAt: new Date().toISOString()
  };
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Monta todos os payloads de vagas que serão persistidos a partir de uma seleção de datas.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} convenio - Convênio selecionado para a operação.
 * @returns {Array<object>} Lista de vagas prontas para gravação local.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava diretamente; lê campos do formulário e prepara objetos para `cproeis_convenios_vagas`.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: enviar a criação em lote para endpoint transacional, com retorno individual de falhas por data.
 */
function collectVagaPayloads(convenio) {
  const editingId = document.getElementById('editing-id').value;
  const dates = editingId
    ? [document.getElementById('data-inicio').value]
    : getCreationDates(convenio);
  const serviceInfo = collectServiceInfo();
  const classConfigs = getSelectedClassConfigs(convenio);

  return dates.flatMap((date) => classConfigs.map((config) => collectVagaPayload(convenio, date, config, serviceInfo)));
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Limpa o formulário de vagas e restaura o estado de cadastro.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não altera LocalStorage; modifica apenas os campos de formulário em memória/DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: preservar rascunhos no servidor se a criação de vagas passar a ter múltiplas etapas.
 */
function resetVagaForm() {
  const form = document.getElementById('vaga-form');
  if (!form) return;

  form.reset();
  selectedCalendarDates.clear();
  document.getElementById('editing-id').value = '';
  document.getElementById('calendar-month').value = currentMonth;
  document.getElementById('data-inicio').value = today;
  document.getElementById('data-fim').value = today;
  document.getElementById('date-mode').value = 'period';
  showCreationStep('date-selection-card');
  hideCreationSummaryModal(false);
  document.getElementById('submit-button').textContent = 'Criar vagas';
  document.querySelectorAll('[data-date-mode-option]').forEach((button) => {
    button.classList.toggle('active', button.dataset.dateModeOption === 'period');
  });
  document.querySelectorAll('.field-hint').forEach((hint) => hint.classList.add('hidden'));
  document.querySelectorAll('.invalid').forEach((input) => input.classList.remove('invalid'));
  selectedConvenioCache && renderClassConfigCards(selectedConvenioCache);
  renderDateSelectionMode(selectedConvenioCache);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Carrega uma vaga existente no formulário para edição.
 *
 * PARÂMETROS E RETORNO:
 * @param {object} vaga - Vaga persistida localmente.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; copia informações do objeto carregado do LocalStorage para o DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: registrar trilha de auditoria ao editar vagas que já tenham policiais escalados.
 */
function fillVagaForm(vaga) {
  document.getElementById('editing-id').value = vaga.id;
  selectedCalendarDates.clear();
  document.getElementById('date-mode').value = 'single';
  document.getElementById('data-inicio').value = vaga.dataServico || '';
  document.getElementById('data-fim').value = vaga.dataServico || '';
  document.getElementById('calendar-month').value = (vaga.dataServico || today).slice(0, 7);
  document.getElementById('nome-servico').value = vaga.nomeServico || '';
  document.getElementById('local-servico').value = vaga.localServico || '';
  document.getElementById('servico-cep').value = vaga.enderecoDados?.cep || '';
  document.getElementById('servico-logradouro').value = vaga.enderecoDados?.logradouro || '';
  document.getElementById('servico-numero').value = vaga.enderecoDados?.numero || '';
  document.getElementById('servico-complemento').value = vaga.enderecoDados?.complemento || '';
  document.getElementById('servico-bairro').value = vaga.enderecoDados?.bairro || '';
  document.getElementById('servico-cidade').value = vaga.enderecoDados?.cidade || '';
  document.getElementById('servico-uf').value = vaga.enderecoDados?.uf || '';
  document.getElementById('ponto-referencia').value = vaga.pontoReferencia || '';
  document.getElementById('submit-button').textContent = 'Atualizar vagas';
  const classInput = document.querySelector(`[data-class-enabled="${vaga.classe}"]`) || document.querySelector('[data-class-enabled]');
  const turno = document.querySelector('[data-class-turno]');
  const start = document.querySelector('[data-class-start]');
  const quantity = document.querySelector('[data-class-quantity]');
  const course = document.querySelector('[data-class-course]');

  if (classInput) classInput.checked = true;
  if (turno) turno.value = vaga.turno || 'turno12';
  if (start) start.value = vaga.horaInicio || turnosServico.turno12.inicio;
  if (quantity) quantity.value = vaga.quantidade || 1;
  if (course) course.value = vaga.curso || '';

  syncClassConfig(selectedConvenioCache);
  renderCalendar((vaga.dataServico || today).slice(0, 7), selectedConvenioCache);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Renderiza a tabela mensal de vagas criadas para o convênio selecionado.
 *
 * PARÂMETROS E RETORNO:
 * @param {object|null} convenio - Convênio selecionado.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê as vagas persistidas no LocalStorage e exibe todas as vagas do convênio informado.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: implementar paginação e filtros por local, classe e situação da escala quando o volume crescer.
 */
function renderVagasTable(convenio) {
  const body = document.getElementById('vagas-body');
  if (!body || !convenio) return;

  const monthLabel = document.getElementById('month-label');
  if (monthLabel) {
    monthLabel.textContent = 'Exibindo todas as vagas do convênio.';
  }

  const vagas = applyVagaFilters(getTodasVagasDoConvenio(convenio.id))
    .sort((a, b) => (a.dataServico || '').localeCompare(b.dataServico || ''));

  if (!vagas.length) {
    body.innerHTML = '<tr><td class="empty" colspan="9">Nenhuma vaga encontrada para os filtros selecionados.</td></tr>';
    return;
  }

  body.innerHTML = vagas.map((vaga) => {
    const offerStatus = getVagaOfferStatus(vaga);
    const rowClass = offerStatus.late ? ' class="permission-pending-row"' : '';
    const permissionButton = offerStatus.needsPermission
      ? `<button type="button" class="warning-action" data-action="request-gsi-permission" data-id="${vaga.id}"${offerStatus.requested ? ' disabled' : ''}>${offerStatus.requested ? 'Permissão solicitada' : 'Selecionar permissão'}</button>`
      : '';

    return `
      <tr${rowClass}>
        <td>${formatDate(vaga.dataServico)}</td>
        <td>${escapeHtml(vaga.nomeServico || '-')}</td>
        <td>${escapeHtml(gruposClasse[vaga.classe] || vaga.classe)}</td>
        <td>${escapeHtml(tiposServico[vaga.tipoServico] || vaga.tipoServico)}</td>
        <td>${escapeHtml(vaga.horaInicio || '-')}</td>
        <td>${escapeHtml(vaga.horaFim || '-')}</td>
        <td>
          <span class="offer-status ${offerStatus.className}">
            <span aria-hidden="true">${offerStatus.icon}</span>
            <span class="offer-status-text">
              <strong>${escapeHtml(offerStatus.label)}</strong>
              <small>${escapeHtml(offerStatus.note)}</small>
            </span>
          </span>
        </td>
        <td>${escapeHtml(formatPolicialEscalado(vaga))}</td>
        <td>
          <div class="actions">
            ${permissionButton}
            <button type="button" data-action="edit-vaga" data-id="${vaga.id}">Editar</button>
            <button type="button" class="danger" data-action="delete-vaga" data-id="${vaga.id}">Excluir</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Reprocessa todos os componentes da tela operacional após criação, edição ou exclusão de vagas.
 *
 * PARÂMETROS E RETORNO:
 * @param {object|null} convenio - Convênio selecionado.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê vagas do LocalStorage para atualizar cards e tabela.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: substituir renderização completa por atualização orientada a estado quando o frontend evoluir para framework.
 */
function renderOperationalView(convenio) {
  selectedConvenioCache = convenio;
  const monthSource = document.getElementById('data-inicio')?.value?.slice(0, 7) || document.getElementById('calendar-month')?.value || currentMonth;

  updateConvenioLinks(convenio);
  renderOperationalHeader(convenio);
  renderContractExpirationAlert(convenio);
  renderFinancialCards(convenio, monthSource);
  renderDashboard(convenio, monthSource);
  renderVagasTable(convenio);
  renderDateSelectionMode(convenio);
  updateValorPreview(convenio);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Liga máscaras e validação gradual aos campos de serviço/endereço da tela de criação de vagas.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; trata apenas valores em memória no DOM antes da criação em `cproeis_convenios_vagas`.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: substituir validações locais por validação compartilhada com API quando houver autenticação e backend.
 */
function bindServiceFieldValidation() {
  ensureServiceFieldHints();

  Object.keys(serviceFieldMessages).forEach((id) => {
    const input = document.getElementById(id);
    if (!input || input.dataset.validationBound === 'true') return;

    input.dataset.validationBound = 'true';
    input.addEventListener('input', () => {
      normalizeServiceFieldOnInput(input);
      validateServiceField(id, false, false);
      hideCreationSummaryModal(false);
    });
    input.addEventListener('blur', () => {
      validateServiceField(id, Boolean(input.value));
      if (id === 'servico-cep') {
        autofillServiceAddressByCep();
      }
    });
  });

  ['servico-complemento', 'ponto-referencia'].forEach((id) => {
    const input = document.getElementById(id);
    if (!input || input.dataset.normalizationBound === 'true') return;

    input.dataset.normalizationBound = 'true';
    input.addEventListener('blur', () => {
      normalizeServiceField(input);
      hideCreationSummaryModal(false);
    });
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Conecta os campos visuais de data ao calendário customizado da criação de vagas.
 *
 * PARÂMETROS E RETORNO:
 * @param {object|null} convenio - Convênio selecionado para limitar datas disponíveis.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava LocalStorage; registra listeners no DOM e atualiza inputs ocultos de data durante a interação.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: extrair este datepicker para módulo compartilhado com testes unitários quando houver build frontend.
 */
function bindCustomDatePickerEvents(convenio) {
  const picker = document.getElementById('custom-date-picker');
  if (!picker || picker.dataset.pickerBound === 'true') return;

  picker.dataset.pickerBound = 'true';

  document.getElementById('data-inicio-display')?.addEventListener('click', () => openCustomDatePicker('data-inicio', convenio));
  document.getElementById('data-fim-display')?.addEventListener('click', () => openCustomDatePicker('data-fim', convenio));

  picker.addEventListener('click', (event) => {
    event.stopPropagation();

    const monthButton = event.target.closest('[data-picker-month]');
    const dateButton = event.target.closest('[data-picker-date]');

    if (monthButton) {
      customDatePickerState.month = monthButton.dataset.pickerMonth;
      renderCustomDatePicker();
      return;
    }

    if (dateButton) {
      selectCustomDate(dateButton.dataset.pickerDate, convenio);
    }
  });

  document.addEventListener('click', (event) => {
    if (picker.classList.contains('is-hidden')) return;
    if (event.target.closest('#custom-date-picker') || event.target.closest('.date-display-input')) return;
    closeCustomDatePicker();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeCustomDatePicker();
    }
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Configura eventos dos filtros da tabela de vagas criadas para atualizar a listagem em tempo real.
 *
 * PARÂMETROS E RETORNO:
 * @param {object|null} convenio - Convênio selecionado para recarregar a tabela filtrada.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; relê os filtros do DOM e a lista de vagas persistida em LocalStorage via renderização.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: adicionar debounce e filtros persistidos por usuário quando houver autenticação.
 */
function bindVagaFilterEvents(convenio) {
  const filterIds = ['vaga-filter-text', 'vaga-filter-date', 'vaga-filter-class', 'vaga-filter-type', 'vaga-filter-offer', 'vaga-filter-policial'];
  if (!document.getElementById('vagas-body')) return;

  const rerender = () => renderVagasTable(convenio);

  filterIds.forEach((id) => {
    const input = document.getElementById(id);
    if (!input || input.dataset.filterBound === 'true') return;

    input.dataset.filterBound = 'true';
    input.addEventListener('input', rerender);
    input.addEventListener('change', rerender);
  });

  const clearButton = document.getElementById('clear-vaga-filters');
  if (clearButton && clearButton.dataset.filterBound !== 'true') {
    clearButton.dataset.filterBound = 'true';
    clearButton.addEventListener('click', () => {
      filterIds.forEach((id) => {
        const input = document.getElementById(id);
        if (input) input.value = '';
      });
      rerender();
    });
  }
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Configura eventos da tela operacional para salvar, editar e excluir vagas.
 *
 * PARÂMETROS E RETORNO:
 * @param {object|null} convenio - Convênio selecionado pela URL.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Grava alterações na chave `cproeis_convenios_vagas` do LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: mover regras de autorização, limite financeiro e vínculo com policiais para endpoints seguros no backend.
 */
function bindOperationalEvents(convenio) {
  const form = document.getElementById('vaga-form');
  if (!convenio) return;

  bindVagaFilterEvents(convenio);

  if (form) {
    bindServiceFieldValidation();
    bindCreationSummaryModalEvents();
    bindCustomDatePickerEvents(convenio);

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      if (!validateCreationWizard(convenio)) return;

      const payloads = collectVagaPayloads(convenio);
      const vagas = getVagas();
      const editing = document.getElementById('editing-id').value;
      const next = document.getElementById('editing-id').value
        ? vagas.map((vaga) => vaga.id === editing ? payloads[0] : vaga)
        : [...vagas, ...payloads];

      saveList(STORAGE_VAGAS, next);
      hideCreationSummaryModal(false);
      resetVagaForm();
      renderOperationalView(convenio);
    });

    document.getElementById('preview-button')?.addEventListener('click', () => {
      if (validateCreationStep('class-selection-card', convenio) && validateCreationWizard(convenio)) {
        renderCreationSummary(convenio);
      }
    });

    document.getElementById('edit-summary-button')?.addEventListener('click', () => {
      hideCreationSummaryModal();
    });

    document.querySelectorAll('[data-step-next]').forEach((button) => {
      button.addEventListener('click', () => {
        const currentCard = button.closest('.wizard-card');
        if (!currentCard || !validateCreationStep(currentCard.id, convenio)) return;
        showCreationStep(button.dataset.stepNext);
      });
    });

    document.querySelectorAll('[data-step-back]').forEach((button) => {
      button.addEventListener('click', () => {
        showCreationStep(button.dataset.stepBack);
      });
    });

    document.getElementById('creation-type-options')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-date-mode-option]');
      if (!button) return;

      document.querySelectorAll('[data-date-mode-option]').forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      document.getElementById('creation-type-card')?.classList.remove('attention-card');
      document.getElementById('date-mode').value = 'period';
      document.getElementById('date-selection-card').classList.remove('is-hidden');
      syncDateModeFields(convenio);
      renderOperationalView(convenio);
      document.getElementById('date-selection-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    document.getElementById('calendar-month').addEventListener('change', () => {
      syncDateModeFields(convenio);
      renderOperationalView(convenio);
    });

    document.getElementById('month-selector').addEventListener('click', (event) => {
      const button = event.target.closest('[data-calendar-month]');
      if (!button) return;

      if (!isMonthInsideContract(convenio, button.dataset.calendarMonth)) return;
      document.getElementById('calendar-month').value = button.dataset.calendarMonth;
      syncDateModeFields(convenio);
      renderOperationalView(convenio);
    });

    document.getElementById('data-inicio').addEventListener('change', () => {
      document.getElementById('date-mode').value = 'period';
      syncDateModeFields(convenio);
      const startValue = document.getElementById('data-inicio').value;
      if (startValue) {
        document.getElementById('calendar-month').value = startValue.slice(0, 7);
      }
      renderOperationalView(convenio);
    });

    document.getElementById('data-fim').addEventListener('change', () => {
      document.getElementById('date-mode').value = 'period';
      document.querySelectorAll('[data-date-mode-option]').forEach((item) => item.classList.toggle('active', item.dataset.dateModeOption === 'period'));
      const startValue = document.getElementById('data-inicio').value;
      if (startValue) {
        document.getElementById('calendar-month').value = startValue.slice(0, 7);
      }
      renderOperationalView(convenio);
    });

    document.getElementById('calendar-grid').addEventListener('click', (event) => {
      const button = event.target.closest('[data-calendar-date]');
      if (!button) return;

      const date = button.dataset.calendarDate;
      if (!isDateInsideContract(convenio, date)) return;
      if (document.getElementById('date-mode').value === 'period') {
        const startInput = document.getElementById('data-inicio');
        const endInput = document.getElementById('data-fim');

        if (!startInput.value || (startInput.value && endInput.value)) {
          startInput.value = date;
          endInput.value = date;
        } else {
          endInput.value = date;
        }

        renderOperationalView(convenio);
        return;
      }

      if (selectedCalendarDates.has(date)) {
        selectedCalendarDates.delete(date);
      } else {
        selectedCalendarDates.add(date);
      }

      document.getElementById('date-mode').value = 'selected';
      document.getElementById('data-inicio').value = date;
      document.getElementById('data-fim').value = date;
      renderOperationalView(convenio);
    });

    document.getElementById('week-grid').addEventListener('click', (event) => {
      const button = event.target.closest('[data-week-start]');
      if (!button) return;

      document.getElementById('data-inicio').value = clampDateToContract(convenio, button.dataset.weekStart);
      document.getElementById('data-fim').value = clampDateToContract(convenio, button.dataset.weekEnd);
      selectedCalendarDates.clear();
      getDatesBetween(document.getElementById('data-inicio').value, document.getElementById('data-fim').value)
        .filter((date) => isDateInsideContract(convenio, date))
        .forEach((date) => selectedCalendarDates.add(date));
      renderOperationalView(convenio);
    });

    document.getElementById('month-grid').addEventListener('click', (event) => {
      const button = event.target.closest('[data-month-option]');
      if (!button) return;

      if (!isMonthInsideContract(convenio, button.dataset.monthOption)) return;
      document.getElementById('calendar-month').value = button.dataset.monthOption;
      syncDateModeFields(convenio);
      renderOperationalView(convenio);
    });

    document.getElementById('class-choice-grid').addEventListener('change', (event) => {
      const enabled = event.target.closest('[data-class-enabled]');
      const turno = event.target.closest('[data-class-turno]');
      const start = event.target.closest('[data-class-start]');
      const quantity = event.target.closest('[data-class-quantity]');
      const course = event.target.closest('[data-class-course]');

      if (!enabled && !turno && !start && !quantity && !course) return;
      syncClassConfig(convenio);
      hideCreationSummaryModal(false);
    });
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const vaga = getVagas().find((item) => item.id === button.dataset.id && item.convenioId === convenio.id);
    if (!vaga) return;

    if (button.dataset.action === 'edit-vaga') {
      if (form) {
        fillVagaForm(vaga);
        renderOperationalView(convenio);
      } else {
        window.location.href = `criar-vagas.html?id=${encodeURIComponent(convenio.id)}&vaga=${encodeURIComponent(vaga.id)}`;
      }
    }

    if (button.dataset.action === 'delete-vaga' && confirm('Excluir esta vaga?')) {
      saveList(STORAGE_VAGAS, getVagas().filter((item) => item.id !== vaga.id));
      renderOperationalView(convenio);
    }

    if (button.dataset.action === 'request-gsi-permission') {
      const updated = getVagas().map((item) => item.id === vaga.id
        ? {
            ...item,
            permissaoGsiStatus: 'solicitada',
            permissaoGsiSolicitadaAt: new Date().toISOString()
          }
        : item);

      saveList(STORAGE_VAGAS, updated);
      renderOperationalView(convenio);
    }
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Inicializa o módulo de convênios identificando se a página atual é listagem ou operação.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Na listagem, lê contratos e vagas do LocalStorage; na operação, também grava vagas conforme eventos do usuário.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: carregar configuração inicial do usuário autenticado, permissões e competência padrão a partir da API.
 */
function init() {
  if (document.getElementById('convenios-body')) {
    renderConveniosList();
    return;
  }

  const convenio = getSelectedConvenio();
  selectedConvenioCache = convenio;
  initializeOperationalDefaults(convenio);
  renderClassConfigCards(convenio);
  if (document.getElementById('vaga-form') && getSelectedVagaId()) {
    const vaga = getVagas().find((item) => item.id === getSelectedVagaId() && item.convenioId === convenio?.id);
    if (vaga) {
      fillVagaForm(vaga);
    }
  }
  renderOperationalView(convenio);
  bindOperationalEvents(convenio);
}

init();

window.addEventListener('resize', () => {
  if (document.getElementById('uso-progress') && selectedConvenioCache) {
    const monthSource = document.getElementById('data-inicio')?.value?.slice(0, 7) || currentMonth;
    renderDashboard(selectedConvenioCache, monthSource);
  }
});

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
function inicializarMenuHamburgerConveniosCriarVagas() {
  const moduleHeader = document.querySelector('.module-header');
  const menuToggle = document.querySelector('.menu-toggle');
  const moduleMenu = document.querySelector('.module-menu');

  if (!moduleHeader || !menuToggle || !moduleMenu) {
    return;
  }

  function definirEstadoMenu(shouldOpen) {
    menuToggle.setAttribute('aria-expanded', String(shouldOpen));
    menuToggle.setAttribute('aria-label', shouldOpen ? 'Fechar menu do convênio' : 'Abrir menu do convênio');
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

inicializarMenuHamburgerConveniosCriarVagas();
