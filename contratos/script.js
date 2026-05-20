const STORAGE_VALORES = 'cproeis_contratos_valores';
const STORAGE_CONVENIOS = 'cproeis_contratos_convenios';
const STORAGE_RESPONSAVEIS = 'cproeis_contratos_responsaveis';
const STORAGE_HISTORICOS = 'cproeis_contratos_historicos';
const STORAGE_SCHEMA_VERSION = 'cproeis_contratos_schema_version';
const CURRENT_SCHEMA_VERSION = '2026-05-15-endereco-separado';

window.CPROEIS_CONTRATOS_STORAGE = {
  valores: STORAGE_VALORES,
  convenios: STORAGE_CONVENIOS,
  responsaveis: STORAGE_RESPONSAVEIS,
  historicos: STORAGE_HISTORICOS,
  schemaVersion: STORAGE_SCHEMA_VERSION
};

if (localStorage.getItem(STORAGE_SCHEMA_VERSION) !== CURRENT_SCHEMA_VERSION) {
  [
    STORAGE_VALORES,
    STORAGE_CONVENIOS,
    STORAGE_RESPONSAVEIS,
    STORAGE_HISTORICOS
  ].forEach((key) => localStorage.removeItem(key));

  localStorage.setItem(STORAGE_SCHEMA_VERSION, CURRENT_SCHEMA_VERSION);
}

const gruposClasse = {
  A: 'Oficiais superiores',
  B: 'Oficiais intermediários e subalternos',
  C: 'Praças subtenentes e sargentos',
  D: 'Cabos e soldados'
};

const responsavelFuncoesColumns = [
  { label: 'Gerar vagas', value: 'Gerar vagas' },
  { label: 'Chefe Operacional', value: 'Ordena - Chefe Operacional' },
  { label: 'Despachante', value: 'Ordena - Despachante' },
  { label: 'Mapa', value: 'Ordena - Visualização de Mapa' },
  { label: 'Outra', value: 'Outra' }
];

const dinheiro = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const today = new Date().toISOString().slice(0, 10);

const tabs = document.querySelectorAll('.tab-button');
const views = document.querySelectorAll('.view');
const form = document.getElementById('convenio-form');
const editingId = document.getElementById('editing-id');
const formTitle = document.getElementById('form-title');
const submitButton = document.getElementById('submit-button');
const clearButton = document.getElementById('clear-button');
const cancelButton = document.getElementById('cancel-button');
const contratosBody = document.getElementById('contratos-body');
const contractsCount = document.getElementById('contracts-count');
const detailsEmpty = document.getElementById('details-empty');
const detailsPanel = document.getElementById('details-panel');
const detailsHeading = document.getElementById('details-heading');
const detailsSubtitle = document.getElementById('details-subtitle');
const detailsContent = document.getElementById('details-content');
const closeDetails = document.getElementById('close-details');
const responsaveisFormBody = document.getElementById('responsaveis-form-body');
const addResponsavelButton = document.getElementById('add-responsavel');
const clearResponsavelButton = document.getElementById('clear-responsavel');
const responsavelFuncaoInputs = document.querySelectorAll('input[name="responsavel-funcoes"]');

const fields = {
  nome: document.getElementById('nome'),
  cnpj: document.getElementById('cnpj'),
  enderecoCep: document.getElementById('endereco-cep'),
  enderecoLogradouro: document.getElementById('endereco-logradouro'),
  enderecoNumero: document.getElementById('endereco-numero'),
  enderecoComplemento: document.getElementById('endereco-complemento'),
  enderecoBairro: document.getElementById('endereco-bairro'),
  enderecoCidade: document.getElementById('endereco-cidade'),
  enderecoUf: document.getElementById('endereco-uf'),
  numero: document.getElementById('numero'),
  diarioData: document.getElementById('diario-data'),
  diarioPagina: document.getElementById('diario-pagina'),
  valorContrato: document.getElementById('valor-contrato'),
  inicio: document.getElementById('inicio'),
  fim: document.getElementById('fim'),
  valorPassagem: document.getElementById('valor-passagem'),
  valorAlimentacao: document.getElementById('valor-alimentacao'),
  responsavelNome: document.getElementById('responsavel-nome'),
  responsavelCpf: document.getElementById('responsavel-cpf'),
  responsavelEmail: document.getElementById('responsavel-email'),
  responsavelTelefone: document.getElementById('responsavel-telefone'),
  responsavelInicio: document.getElementById('responsavel-inicio'),
  responsavelFim: document.getElementById('responsavel-fim')
};

const valueInputs = {
  A: {
    servico12: document.getElementById('valor-a-12'),
    servico8: document.getElementById('valor-a-8'),
    servico6: document.getElementById('valor-a-6')
  },
  B: {
    servico12: document.getElementById('valor-b-12'),
    servico8: document.getElementById('valor-b-8'),
    servico6: document.getElementById('valor-b-6')
  },
  C: {
    servico12: document.getElementById('valor-c-12'),
    servico8: document.getElementById('valor-c-8'),
    servico6: document.getElementById('valor-c-6')
  },
  D: {
    servico12: document.getElementById('valor-d-12'),
    servico8: document.getElementById('valor-d-8'),
    servico6: document.getElementById('valor-d-6')
  }
};

const validationRules = {
  nome: {
    message: 'Informe o nome oficial do convênio, com pelo menos 3 caracteres.',
    validate: () => normalizeText(fields.nome.value).length >= 3
  },
  cnpj: {
    message: 'Digite os 14 números do CNPJ. A pontuação será aplicada automaticamente.',
    validate: () => onlyDigits(fields.cnpj.value).length === 14
  },
  enderecoCep: {
    message: 'Digite os 8 números do CEP ou deixe em branco se não houver informação.',
    validate: () => !fields.enderecoCep.value.trim() || onlyDigits(fields.enderecoCep.value).length === 8
  },
  enderecoLogradouro: {
    message: 'Informe o logradouro completo, como rua, avenida ou praça.',
    validate: () => normalizeText(fields.enderecoLogradouro.value).length >= 3
  },
  enderecoNumero: {
    message: 'Informe o número do endereço ou S/N quando não houver numeração.',
    validate: () => normalizeText(fields.enderecoNumero.value).length >= 1
  },
  enderecoComplemento: {
    message: 'Use este campo apenas para bloco, sala, andar ou outra referência complementar.',
    validate: () => true
  },
  enderecoBairro: {
    message: 'Informe o bairro do endereço cadastrado.',
    validate: () => normalizeText(fields.enderecoBairro.value).length >= 2
  },
  enderecoCidade: {
    message: 'Informe a cidade do endereço cadastrado.',
    validate: () => normalizeText(fields.enderecoCidade.value).length >= 2
  },
  enderecoUf: {
    message: 'Digite a UF com 2 letras, por exemplo RJ.',
    validate: () => /^[A-Z]{2}$/.test(normalizeText(fields.enderecoUf.value).toUpperCase())
  },
  numero: {
    message: 'Digite os 16 números do SEI. O sistema aplicará o formato SEI-000000/000000/0000.',
    validate: () => onlyDigits(fields.numero.value).length === 16
  },
  diarioData: {
    message: 'Informe a data de publicação no Diário Oficial.',
    validate: () => Boolean(fields.diarioData.value)
  },
  diarioPagina: {
    message: 'Informe a página do Diário Oficial usando apenas letras, números e separadores simples.',
    validate: () => normalizeText(fields.diarioPagina.value).length >= 1
  },
  valorContrato: {
    message: 'Informe um valor de contrato igual ou maior que zero.',
    validate: () => isValidCurrencyInput(fields.valorContrato)
  },
  inicio: {
    message: 'Informe a data de início da vigência.',
    validate: () => Boolean(fields.inicio.value)
  },
  fim: {
    message: 'Informe uma data final igual ou posterior ao início da vigência.',
    validate: () => Boolean(fields.fim.value) && (!fields.inicio.value || fields.fim.value >= fields.inicio.value)
  },
  valorPassagem: {
    message: 'Informe um valor de passagem igual ou maior que zero, ou deixe em branco.',
    validate: () => isValidOptionalCurrencyInput(fields.valorPassagem)
  },
  valorAlimentacao: {
    message: 'Informe um valor de alimentação igual ou maior que zero, ou deixe em branco.',
    validate: () => isValidOptionalCurrencyInput(fields.valorAlimentacao)
  },
  responsavelNome: {
    message: 'Informe o nome do responsável com pelo menos 3 caracteres.',
    validate: () => !hasResponsavelDraft() || normalizeText(fields.responsavelNome.value).length >= 3
  },
  responsavelCpf: {
    message: 'Digite os 11 números do CPF ou deixe em branco.',
    validate: () => !fields.responsavelCpf.value.trim() || onlyDigits(fields.responsavelCpf.value).length === 11
  },
  responsavelEmail: {
    message: 'Informe um email válido ou deixe em branco.',
    validate: () => !fields.responsavelEmail.value.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.responsavelEmail.value.trim())
  },
  responsavelTelefone: {
    message: 'Digite DDD e telefone com 10 ou 11 números, ou deixe em branco.',
    validate: () => !fields.responsavelTelefone.value.trim() || [10, 11].includes(onlyDigits(fields.responsavelTelefone.value).length)
  },
  responsavelInicio: {
    message: 'Informe o início de atuação ou deixe em branco.',
    validate: () => true
  },
  responsavelFim: {
    message: 'A data final deve ser igual ou posterior ao início de atuação.',
    validate: () => !fields.responsavelInicio.value || !fields.responsavelFim.value || fields.responsavelFim.value >= fields.responsavelInicio.value
  }
};

const valueValidationRules = Object.values(valueInputs).flatMap((group) => Object.values(group));
const currencyInputs = [
  fields.valorContrato,
  fields.valorPassagem,
  fields.valorAlimentacao,
  ...valueValidationRules
];
const validationHints = {};
const valueValidationHints = new Map();
const activeValidationFields = new Set();

let selectedConvenioId = '';
let responsaveisState = [];

function loadList(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    return [];
  }
}

function saveList(key, list) {
  localStorage.setItem(key, JSON.stringify(list));
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function onlyDigits(value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Remove qualquer caractere que não seja número para validar e mascarar documentos,
   * CEP e telefones com base apenas nos dígitos informados pelo usuário.
   * PARÂMETROS E RETORNO: Recebe value como string ou número e retorna string contendo somente dígitos.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava dados; trabalha apenas com o valor recebido em memória.
   * TODO: Em produção, reaproveitar esta normalização antes de enviar dados para APIs de cadastro.
   */
  return String(value || '').replace(/\D/g, '');
}

function normalizeText(value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Remove espaços duplicados e aparas externas para padronizar textos livres antes
   * de validar, salvar e exibir informações em tabelas e detalhes.
   * PARÂMETROS E RETORNO: Recebe value como string e retorna string normalizada.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; apenas prepara conteúdo vindo do DOM.
   * TODO: Em produção, complementar com regras de saneamento no backend para impedir divergência entre clientes.
   */
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function titleCaseText(value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Padroniza nomes e endereços com capitalização legível, preservando conectores
   * comuns em minúsculas para melhorar a apresentação na tabela e nos detalhes.
   * PARÂMETROS E RETORNO: Recebe uma string livre e retorna string formatada para exibição.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não acessa localStorage; o retorno é usado depois na montagem do payload.
   * TODO: Em produção, manter nomes oficiais exatamente como retornados por cadastros externos quando houver integração.
   */
  const connectors = ['da', 'de', 'di', 'do', 'das', 'dos', 'e'];

  return normalizeText(value)
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      if (!word) return '';
      if (index > 0 && connectors.includes(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

function formatCnpj(value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Aplica máscara de CNPJ para armazenar e apresentar o documento no padrão brasileiro.
   * PARÂMETROS E RETORNO: Recebe string/número, considera até 14 dígitos e retorna texto no formato 00.000.000/0000-00.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados diretamente; o resultado é usado em payloads, tabelas e datalist.
   * TODO: Em produção, validar existência e situação cadastral do CNPJ em serviço oficial ou base corporativa.
   */
  const digits = onlyDigits(value).slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function formatCpf(value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Aplica máscara de CPF para responsáveis do convênio, garantindo leitura padronizada.
   * PARÂMETROS E RETORNO: Recebe string/número, considera até 11 dígitos e retorna texto no formato 000.000.000-00.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; o retorno é usado no estado local de responsáveis.
   * TODO: Em produção, validar CPF por dígito verificador e por regras do cadastro corporativo.
   */
  const digits = onlyDigits(value).slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

function formatCep(value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Aplica máscara de CEP para endereços de convênios.
   * PARÂMETROS E RETORNO: Recebe string/número, considera até 8 dígitos e retorna texto no formato 00000-000.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; o retorno alimenta o DOM e o payload do endereço.
   * TODO: Em produção, consultar o CEP em API externa e tratar falhas de rede antes de preencher endereço.
   */
  return onlyDigits(value).slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');
}

function formatContractNumber(value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Aplica a máscara oficial do processo SEI do contrato, permitindo digitação apenas
   * numérica e exibindo o padrão SEI-000000/000000/0000 durante o preenchimento.
   * PARÂMETROS E RETORNO: Recebe string/número, considera até 16 dígitos e retorna texto formatado.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados diretamente; o retorno é usado no DOM e no payload salvo em localStorage.
   * TODO: Em produção, validar duplicidade e existência do contrato em base oficial antes de persistir.
   */
  const digits = onlyDigits(value).slice(0, 16);
  if (!digits) return '';

  const first = digits.slice(0, 6);
  const second = digits.slice(6, 12);
  const year = digits.slice(12, 16);
  const formatted = [`SEI-${first}`, second, year].filter(Boolean).join('/');

  return formatted;
}

function formatCurrencyInput(value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Converte dígitos em moeda brasileira para exibir R$ e vírgula dentro do input
   * enquanto o usuário digita.
   * PARÂMETROS E RETORNO: Recebe string/número e retorna texto no padrão R$ 0,00.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; o valor numérico é extraído depois por parseCurrencyValue.
   * TODO: Em produção, centralizar máscaras monetárias para todos os módulos financeiros do sistema.
   */
  const digits = onlyDigits(value);
  if (!digits) return '';

  const cents = Number(digits) / 100;
  return `R$ ${cents.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function parseCurrencyValue(value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Extrai o valor numérico de um campo monetário mascarado em reais para cálculo,
   * gravação em localStorage e renderização posterior nas tabelas.
   * PARÂMETROS E RETORNO: Recebe string/número e retorna número decimal em reais.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; apenas transforma valor de input para o payload.
   * TODO: Em produção, considerar biblioteca de moeda para evitar diferenças de arredondamento em integrações contábeis.
   */
  const digits = onlyDigits(value);
  return digits ? Number(digits) / 100 : 0;
}

function formatPhone(value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Formata telefone do responsável com DDD para melhorar a leitura em tabelas e detalhes.
   * PARÂMETROS E RETORNO: Recebe string/número e retorna telefone com máscara para 10 ou 11 dígitos.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; o resultado é salvo apenas quando usado na montagem do payload.
   * TODO: Em produção, validar DDDs aceitos e permitir ramais se o cadastro corporativo exigir.
   */
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
  }
  return digits.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
}

function isValidCurrencyInput(input) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Confirma que um campo monetário obrigatório contém número válido e não negativo.
   * PARÂMETROS E RETORNO: Recebe um elemento input e retorna booleano de validade.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê somente o valor atual do DOM; não grava em localStorage.
   * TODO: Em produção, validar limites contratuais no backend para evitar valores fora da política vigente.
   */
  return onlyDigits(input.value).length > 0 && Number.isFinite(parseCurrencyValue(input.value));
}

function isValidOptionalCurrencyInput(input) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Valida campo monetário opcional, permitindo vazio ou número não negativo.
   * PARÂMETROS E RETORNO: Recebe um elemento input e retorna booleano.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê somente o DOM e não persiste dados.
   * TODO: Em produção, diferenciar valor ausente de valor zero conforme regra contábil do contrato.
   */
  return input.value === '' || Number.isFinite(parseCurrencyValue(input.value));
}

function numberValue(input) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Lê campos monetários mascarados e devolve número decimal para persistência e cálculos.
   * PARÂMETROS E RETORNO: Recebe um input HTML e retorna Number em reais.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê somente o valor atual do DOM; quem grava é collectPayload/syncRelatedStorage.
   * TODO: Em produção, migrar valores monetários para centavos inteiros no backend para precisão contábil.
   */
  return parseCurrencyValue(input.value);
}

function formatDate(value) {
  if (!value) return 'Sem fim';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

function formatDateOrDash(value) {
  return value ? formatDate(value) : '-';
}

function formatPeriod(start, end) {
  return start || end ? `${formatDateOrDash(start)} até ${formatDate(end)}` : '-';
}

function getEnderecoFromFields() {
  return {
    cep: formatCep(fields.enderecoCep.value),
    logradouro: titleCaseText(fields.enderecoLogradouro.value),
    numero: normalizeText(fields.enderecoNumero.value).toUpperCase(),
    complemento: titleCaseText(fields.enderecoComplemento.value),
    bairro: titleCaseText(fields.enderecoBairro.value),
    cidade: titleCaseText(fields.enderecoCidade.value),
    uf: normalizeText(fields.enderecoUf.value).toUpperCase().slice(0, 2)
  };
}

function formatEndereco(endereco, legado = '') {
  if (!endereco) return legado || '';

  const linha1 = [endereco.logradouro, endereco.numero].filter(Boolean).join(', ');
  const linha2 = [endereco.complemento, endereco.bairro].filter(Boolean).join(' - ');
  const linha3 = [endereco.cidade, endereco.uf].filter(Boolean).join('/');
  const linha4 = endereco.cep ? `CEP ${endereco.cep}` : '';

  return [linha1, linha2, linha3, linha4].filter(Boolean).join('\n');
}

function setEnderecoFields(convenio) {
  const endereco = convenio.enderecoDados || {};

  fields.enderecoCep.value = endereco.cep || '';
  fields.enderecoLogradouro.value = endereco.logradouro || convenio.endereco || '';
  fields.enderecoNumero.value = endereco.numero || '';
  fields.enderecoComplemento.value = endereco.complemento || '';
  fields.enderecoBairro.value = endereco.bairro || '';
  fields.enderecoCidade.value = endereco.cidade || '';
  fields.enderecoUf.value = endereco.uf || '';
}

function previousDate(value) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
}

function getConvenios() {
  return loadList(STORAGE_CONVENIOS);
}

function getValores() {
  return loadList(STORAGE_VALORES);
}

function getResponsaveis() {
  return loadList(STORAGE_RESPONSAVEIS);
}

function setActiveView(viewId) {
  tabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.view === viewId));
  views.forEach((view) => view.classList.toggle('active', view.id === viewId));
}

function getSituacao(convenio) {
  if (convenio.inicio && today < convenio.inicio) {
    return { label: 'Aguardando', active: false, className: 'warning' };
  }

  if (convenio.fim && today > convenio.fim) {
    return { label: 'Encerrado', active: false, className: 'inactive' };
  }

  return { label: 'Ativo', active: true, className: '' };
}

function getClientContracts(cnpj) {
  const formattedCnpj = formatCnpj(cnpj);
  return getConvenios()
    .filter((item) => item.cnpj && formatCnpj(item.cnpj) === formattedCnpj)
    .sort((a, b) => (b.inicio || '').localeCompare(a.inicio || ''));
}

function getLatestByCnpj(cnpj, ignoreId = '') {
  return getClientContracts(cnpj).find((item) => item.id !== ignoreId);
}

function getContractValues(convenio) {
  if (convenio.valores?.length) return convenio.valores;
  return getValores().filter((item) => item.convenioId === convenio.id);
}

function getContractResponsaveis(convenio) {
  if (convenio.responsaveis?.length) return convenio.responsaveis;
  return getResponsaveis().filter((item) => item.convenioId === convenio.id);
}

function getValueRows(convenioId) {
  return ['A', 'B', 'C', 'D'].map((classe) => ({
    id: `${convenioId}-classe-${classe}`,
    convenioId,
    classe,
    grupo: gruposClasse[classe],
    servico12: numberValue(valueInputs[classe].servico12),
    servico8: numberValue(valueInputs[classe].servico8),
    servico6: numberValue(valueInputs[classe].servico6),
    passagem: numberValue(fields.valorPassagem),
    alimentacao: numberValue(fields.valorAlimentacao),
    decreto: '',
    inicio: '',
    fim: '',
    publicacao: '',
    status: 'Vigente'
  }));
}

function createFieldHints() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Cria automaticamente os textos de orientação abaixo dos inputs e textareas do
   * formulário de convênios, incluindo valores por classe, mantendo o mesmo padrão visual usado no cadastro de policiais.
   * PARÂMETROS E RETORNO: Não recebe parâmetros nem retorna valores; percorre validationRules e insere elementos small.
   * ARMAZENAMENTO E PERSISTÊNCIA: Grava apenas referências em validationHints e altera o DOM; não usa localStorage.
   * TODO: Em produção, carregar mensagens de validação de uma camada compartilhada para manter consistência entre telas.
   */
  Object.entries(validationRules).forEach(([key, rule]) => {
    const field = fields[key];
    if (!field || validationHints[key]) return;

    const hint = document.createElement('small');
    hint.className = 'field-hint hidden';
    hint.id = `${field.id}-hint`;
    hint.textContent = rule.message;
    field.insertAdjacentElement('afterend', hint);
    validationHints[key] = hint;
  });

  valueValidationRules.forEach((input) => {
    if (valueValidationHints.has(input)) return;

    const hint = document.createElement('small');
    hint.className = 'field-hint hidden';
    hint.textContent = 'Informe valor igual ou maior que zero, ou deixe em branco.';
    input.insertAdjacentElement('afterend', hint);
    valueValidationHints.set(input, hint);
  });
}

function runValueValidation(input, options = {}) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Valida campos monetários opcionais de serviço por classe e controla a mensagem
   * fixa exibida abaixo de cada input.
   * PARÂMETROS E RETORNO: Recebe o input HTML e options.showAll como booleano; retorna true quando válido.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê o valor do DOM e alterna classes/mensagens; não grava localStorage.
   * TODO: Em produção, buscar limites de valores por classe em tabela oficial versionada.
   */
  const isValid = isValidOptionalCurrencyInput(input);
  const hint = valueValidationHints.get(input);
  const shouldShowError = !isValid && (options.showAll || input.value !== '');

  input.classList.toggle('invalid', shouldShowError);
  if (hint) hint.classList.toggle('hidden', !shouldShowError);
  return isValid;
}

function hasResponsavelDraft() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Identifica se o usuário começou a preencher o bloco de responsáveis para decidir
   * quando validar campos opcionais desse subcadastro.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e retorna booleano.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê somente os campos do DOM; não grava arrays nem localStorage.
   * TODO: Em produção, separar responsável como entidade com validação própria e feedback de API.
   */
  return [
    fields.responsavelNome,
    fields.responsavelCpf,
    fields.responsavelEmail,
    fields.responsavelTelefone,
    fields.responsavelInicio,
    fields.responsavelFim
  ].some((field) => normalizeText(field.value)) || getSelectedResponsavelFuncoes().length > 0;
}

function getSelectedResponsavelFuncoes() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Lê as funções/permissões marcadas para o responsável, permitindo múltiplas
   * opções por usuário.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e retorna array de strings com os valores selecionados.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê somente os checkboxes do DOM; a persistência ocorre no payload do responsável.
   * TODO: Em produção, substituir valores fixos por perfis de acesso carregados de API.
   */
  return Array.from(responsavelFuncaoInputs)
    .filter((input) => input.checked && !input.disabled)
    .map((input) => input.value);
}

function setSelectedResponsavelFuncoes(funcoes = []) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Marca no formulário as funções salvas para edição de um responsável.
   * PARÂMETROS E RETORNO: Recebe array de strings ou texto legado separado por vírgula; não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Altera apenas o estado checked dos inputs no DOM; não grava localStorage.
   * TODO: Em produção, mapear permissões por identificador estável em vez de texto exibido.
   */
  const selected = Array.isArray(funcoes)
    ? funcoes
    : String(funcoes || '').split(',').map((item) => normalizeText(item));

  responsavelFuncaoInputs.forEach((input) => {
    input.checked = selected.includes(input.value);
  });
}

function formatResponsavelFuncoes(responsavel) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Converte as funções de acesso do responsável em texto legível para tabelas e detalhes.
   * PARÂMETROS E RETORNO: Recebe o objeto responsavel e retorna string formatada.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava dados; apenas formata array salvo ou campo legado.
   * TODO: Em produção, exibir nomes de perfis a partir da tabela oficial de permissões.
   */
  const funcoes = Array.isArray(responsavel.funcoes)
    ? responsavel.funcoes
    : String(responsavel.funcao || '').split(',').map((item) => normalizeText(item)).filter(Boolean);

  return funcoes.length ? funcoes.join(', ') : '-';
}

function hasResponsavelFuncao(responsavel, funcao) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Verifica se uma função/permissão específica está cadastrada para o responsável.
   * PARÂMETROS E RETORNO: Recebe o objeto responsavel e funcao como string; retorna booleano.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; lê apenas o array salvo em memória ou campo legado de compatibilidade.
   * TODO: Em produção, trocar comparação textual por identificadores de permissão persistidos no banco.
   */
  const funcoes = Array.isArray(responsavel.funcoes)
    ? responsavel.funcoes
    : String(responsavel.funcao || '').split(',').map((item) => normalizeText(item)).filter(Boolean);

  return funcoes.includes(funcao);
}

function permissionMark(isEnabled) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Renderiza o marcador visual de permissão com V para função cadastrada e X para
   * função não cadastrada.
   * PARÂMETROS E RETORNO: Recebe booleano e retorna string HTML segura, sem dados externos.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava dados; apenas compõe a célula da tabela de detalhes.
   * TODO: Em produção, substituir marcadores por componente acessível com aria-label descritivo.
   */
  const className = isEnabled ? 'yes' : 'no';
  return `<span class="permission-mark ${className}">${isEnabled ? 'V' : 'X'}</span>`;
}

function formatDateOrBlank(value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Formata uma data para a tabela de responsáveis e deixa vazio quando não houver
   * data final informada.
   * PARÂMETROS E RETORNO: Recebe string no formato yyyy-mm-dd e retorna data pt-BR ou string vazia.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não acessa localStorage; apenas formata dado já carregado.
   * TODO: Em produção, centralizar formatos de data em utilitário compartilhado do sistema.
   */
  return value ? formatDate(value) : '';
}

function setCurrencyFieldValue(input, value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Preenche inputs monetários com máscara de reais a partir de números salvos no
   * localStorage ou valores legados do formulário.
   * PARÂMETROS E RETORNO: Recebe um input HTML e value numérico/string; não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Escreve somente no DOM; não altera localStorage.
   * TODO: Em produção, usar componentes monetários reutilizáveis para evitar duplicidade entre módulos.
   */
  const amount = typeof value === 'number' ? value : parseCurrencyValue(value);
  input.value = amount > 0 ? formatCurrencyInput(String(Math.round(amount * 100))) : '';
}

function runFieldValidation(key, options = {}) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Executa a regra de validação de um campo, mostra ou esconde a mensagem fixa e
   * marca visualmente o input quando o conteúdo não respeita o tipo esperado.
   * PARÂMETROS E RETORNO: Recebe key como string e options.showAll como booleano; retorna true quando válido.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê valores atuais do DOM e alterna classes CSS; não grava em localStorage.
   * TODO: Em produção, combinar regras locais com respostas assíncronas do servidor.
   */
  const field = fields[key];
  const hint = validationHints[key];
  const rule = validationRules[key];
  if (!field || !hint || !rule) return true;

  const isValid = rule.validate();
  const shouldShowError = !isValid && (options.showAll || activeValidationFields.has(key) || normalizeText(field.value));

  field.classList.toggle('invalid', shouldShowError);
  hint.classList.toggle('hidden', !shouldShowError);
  return isValid;
}

function validateContractForm(options = {}) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Valida todos os campos principais do convênio e os valores de serviço antes do
   * salvamento, impedindo persistência local de informações incompatíveis com cada label.
   * PARÂMETROS E RETORNO: Recebe options.showAll como booleano e retorna booleano geral do formulário.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê DOM e atualiza classes/mensagens; não grava localStorage nem arrays.
   * TODO: Em produção, espelhar esta validação no backend para impedir gravação inválida por requisições diretas.
   */
  const mainKeys = [
    'nome',
    'cnpj',
    'enderecoCep',
    'enderecoLogradouro',
    'enderecoNumero',
    'enderecoComplemento',
    'enderecoBairro',
    'enderecoCidade',
    'enderecoUf',
    'numero',
    'diarioData',
    'diarioPagina',
    'valorContrato',
    'inicio',
    'fim',
    'valorPassagem',
    'valorAlimentacao'
  ];
  const areMainFieldsValid = mainKeys
    .map((key) => runFieldValidation(key, options))
    .every(Boolean);
  const areValuesValid = valueValidationRules.map((input) => runValueValidation(input, options)).every(Boolean);

  return areMainFieldsValid && areValuesValid;
}

function validateResponsavelDraft(options = {}) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Valida o subformulário de responsáveis antes de incluir o registro na lista temporária.
   * PARÂMETROS E RETORNO: Recebe options.showAll como booleano e retorna booleano.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê o DOM e altera feedback visual; não grava em responsaveisState nem localStorage.
   * TODO: Em produção, validar responsáveis por CPF/email em serviço centralizado para evitar duplicidade global.
   */
  const keys = [
    'responsavelNome',
    'responsavelCpf',
    'responsavelEmail',
    'responsavelTelefone',
    'responsavelInicio',
    'responsavelFim'
  ];

  return keys.map((key) => runFieldValidation(key, options)).every(Boolean);
}

function normalizeFieldValue(key) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Aplica máscara e padronização textual no campo editado para melhorar a qualidade
   * do dado antes de salvar e antes de reaproveitar cadastros existentes.
   * PARÂMETROS E RETORNO: Recebe key como string e não retorna valores.
   * ARMAZENAMENTO E PERSISTÊNCIA: Altera somente o valor do input/textarea no DOM; não grava localStorage.
   * TODO: Em produção, substituir normalizações locais por DTOs compartilhados com validação do servidor.
   */
  const field = fields[key];
  if (!field) return;

  if (key === 'cnpj') field.value = formatCnpj(field.value);
  if (key === 'enderecoCep') field.value = formatCep(field.value);
  if (key === 'numero') field.value = formatContractNumber(field.value);
  if (key === 'responsavelCpf') field.value = formatCpf(field.value);
  if (key === 'responsavelTelefone') field.value = formatPhone(field.value);
  if (currencyInputs.includes(field)) field.value = formatCurrencyInput(field.value);
  if (key === 'enderecoUf') field.value = normalizeText(field.value).toUpperCase().slice(0, 2);
  if (key === 'responsavelEmail') field.value = normalizeText(field.value).toLowerCase();

  if (['nome', 'enderecoLogradouro', 'enderecoComplemento', 'enderecoBairro', 'enderecoCidade', 'responsavelNome'].includes(key)) {
    field.value = titleCaseText(field.value);
  }

  if (['diarioPagina', 'enderecoNumero'].includes(key)) {
    field.value = normalizeText(field.value);
  }
}

function clearResponsavelFields() {
  fields.responsavelNome.value = '';
  fields.responsavelCpf.value = '';
  fields.responsavelEmail.value = '';
  fields.responsavelTelefone.value = '';
  fields.responsavelInicio.value = '';
  fields.responsavelFim.value = '';
  setSelectedResponsavelFuncoes([]);
  [
    'responsavelNome',
    'responsavelCpf',
    'responsavelEmail',
    'responsavelTelefone',
    'responsavelInicio',
    'responsavelFim'
  ].forEach((key) => {
    activeValidationFields.delete(key);
    runFieldValidation(key);
  });
}

function renderResponsaveisForm() {
  if (!responsaveisState.length) {
    responsaveisFormBody.innerHTML = '<tr><td class="empty" colspan="5">Nenhum responsável adicionado.</td></tr>';
    return;
  }

  responsaveisFormBody.innerHTML = responsaveisState.map((responsavel) => `
    <tr>
      <td><strong>${escapeHtml(titleCaseText(responsavel.nome))}</strong></td>
      <td>${escapeHtml(formatCpf(responsavel.cpf) || '-')}</td>
      <td>${escapeHtml(normalizeText(responsavel.email).toLowerCase() || '-')}${responsavel.telefone ? `<br><small>${escapeHtml(formatPhone(responsavel.telefone))}</small>` : ''}</td>
      <td>${escapeHtml(formatResponsavelFuncoes(responsavel))}</td>
      <td>
        <div class="actions">
          <button type="button" data-action="edit-form-responsavel" data-id="${responsavel.id}">Editar</button>
          <button type="button" class="danger" data-action="remove-form-responsavel" data-id="${responsavel.id}">Remover</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function addResponsavelFromFields() {
  [
    'responsavelNome',
    'responsavelCpf',
    'responsavelEmail',
    'responsavelTelefone',
    'responsavelInicio',
    'responsavelFim'
  ].forEach((key) => {
    activeValidationFields.add(key);
    normalizeFieldValue(key);
  });

  if (normalizeText(fields.responsavelNome.value).length < 3) {
    fields.responsavelNome.classList.add('invalid');
    validationHints.responsavelNome?.classList.remove('hidden');
    return;
  }

  if (!validateResponsavelDraft({ showAll: true })) return;

  const cpf = formatCpf(fields.responsavelCpf.value);
  const existing = cpf
    ? responsaveisState.find((item) => item.cpf === cpf)
    : null;

  const payload = {
    id: existing?.id || makeId(),
    nome: titleCaseText(fields.responsavelNome.value),
    cpf,
    email: normalizeText(fields.responsavelEmail.value).toLowerCase(),
    telefone: formatPhone(fields.responsavelTelefone.value),
    funcoes: getSelectedResponsavelFuncoes(),
    funcao: getSelectedResponsavelFuncoes().join(', '),
    inicio: fields.responsavelInicio.value,
    fim: fields.responsavelFim.value
  };

  responsaveisState = existing
    ? responsaveisState.map((item) => item.id === existing.id ? payload : item)
    : [...responsaveisState, payload];

  clearResponsavelFields();
  renderResponsaveisForm();
}

function collectPayload() {
  const id = editingId.value || makeId();
  const valores = getValueRows(id);
  const responsaveis = responsaveisState.map((responsavel) => ({ ...responsavel, convenioId: id }));
  const enderecoDados = getEnderecoFromFields();

  return {
    id,
    nome: titleCaseText(fields.nome.value),
    cnpj: formatCnpj(fields.cnpj.value),
    endereco: formatEndereco(enderecoDados),
    enderecoDados,
    numero: formatContractNumber(fields.numero.value),
    diarioData: fields.diarioData.value,
    diarioPagina: normalizeText(fields.diarioPagina.value).toUpperCase(),
    valorContrato: numberValue(fields.valorContrato),
    inicio: fields.inicio.value,
    fim: fields.fim.value,
    classeA: 0,
    classeB: 0,
    classeC: 0,
    classeD: 0,
    valores,
    responsaveis
  };
}

function syncRelatedStorage(convenioId, valores, responsaveis) {
  saveList(STORAGE_VALORES, [
    ...getValores().filter((item) => item.convenioId !== convenioId),
    ...valores
  ]);

  saveList(STORAGE_RESPONSAVEIS, [
    ...getResponsaveis().filter((item) => item.convenioId !== convenioId),
    ...responsaveis
  ]);
}

function resetForm() {
  form.reset();
  editingId.value = '';
  responsaveisState = [];
  renderResponsaveisForm();
  formTitle.textContent = 'Cadastrar convênio';
  submitButton.textContent = 'Salvar convênio';
  activeValidationFields.clear();
  Object.keys(validationRules).forEach((key) => runFieldValidation(key));
  valueValidationRules.forEach((input) => runValueValidation(input));
}

function applyClientData(convenio) {
  fields.nome.value = convenio.nome || '';
  setEnderecoFields(convenio);

  const valores = getContractValues(convenio);
  valores.forEach((valor) => {
    if (!valueInputs[valor.classe]) return;
    setCurrencyFieldValue(valueInputs[valor.classe].servico12, valor.servico12 ?? valor.valor ?? 0);
    setCurrencyFieldValue(valueInputs[valor.classe].servico8, valor.servico8 ?? valor.valor ?? 0);
    setCurrencyFieldValue(valueInputs[valor.classe].servico6, valor.servico6 ?? valor.valor ?? 0);
  });

  const valorBase = valores[0] || {};
  setCurrencyFieldValue(fields.valorPassagem, valorBase.passagem || 0);
  setCurrencyFieldValue(fields.valorAlimentacao, valorBase.alimentacao || 0);

  responsaveisState = getContractResponsaveis(convenio).map((responsavel) => ({ ...responsavel, id: makeId() }));
  renderResponsaveisForm();
}

function fillForm(convenio) {
  resetForm();
  editingId.value = convenio.id;
  fields.nome.value = convenio.nome || '';
  fields.cnpj.value = convenio.cnpj || '';
  setEnderecoFields(convenio);
  fields.numero.value = formatContractNumber(convenio.numero || '');
  fields.diarioData.value = convenio.diarioData || '';
  fields.diarioPagina.value = convenio.diarioPagina || convenio.diario || '';
  setCurrencyFieldValue(fields.valorContrato, convenio.valorContrato ?? convenio.valorMensal ?? 0);
  fields.inicio.value = convenio.inicio || '';
  fields.fim.value = convenio.fim || '';
  applyClientData({ ...convenio, responsaveis: getContractResponsaveis(convenio), valores: getContractValues(convenio) });
  responsaveisState = getContractResponsaveis(convenio).map((responsavel) => ({ ...responsavel }));
  renderResponsaveisForm();
  formTitle.textContent = 'Editar convênio';
  submitButton.textContent = 'Atualizar convênio';
  setActiveView('cadastro-view');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renewContract(convenio) {
  const endedContract = {
    ...convenio,
    fim: previousDate(today)
  };

  saveList(STORAGE_CONVENIOS, getConvenios().map((item) => item.id === convenio.id ? endedContract : item));

  resetForm();
  fields.nome.value = convenio.nome || '';
  fields.cnpj.value = convenio.cnpj || '';
  setEnderecoFields(convenio);
  setCurrencyFieldValue(fields.valorContrato, convenio.valorContrato ?? convenio.valorMensal ?? 0);
  fields.classeA && (fields.classeA.value = convenio.classeA || 0);
  fields.classeB && (fields.classeB.value = convenio.classeB || 0);
  fields.classeC && (fields.classeC.value = convenio.classeC || 0);
  fields.classeD && (fields.classeD.value = convenio.classeD || 0);
  applyClientData({ ...convenio, responsaveis: getContractResponsaveis(convenio), valores: getContractValues(convenio) });

  formTitle.textContent = 'Renovar contrato';
  submitButton.textContent = 'Salvar novo contrato';
  selectedConvenioId = convenio.id;
  renderAll();
  setActiveView('cadastro-view');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Lê os filtros preenchidos na tabela de contratos e normaliza os valores para comparação.
 *
 * PARÂMETROS E RETORNO:
 * @returns {object} Filtros atuais de texto, situação e intervalo de início de vigência.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa LocalStorage; lê somente campos do DOM usados para filtrar a lista já carregada.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: enviar filtros para API quando a listagem de contratos for paginada em ambiente online.
 */
function getContractTableFilters() {
  return {
    text: normalizeText(document.getElementById('contract-filter-text')?.value || '').toLowerCase(),
    status: document.getElementById('contract-filter-status')?.value || '',
    startFrom: document.getElementById('contract-filter-start-from')?.value || '',
    startTo: document.getElementById('contract-filter-start-to')?.value || ''
  };
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Aplica filtros sobre os contratos carregados antes da renderização da tabela única.
 *
 * PARÂMETROS E RETORNO:
 * @param {Array<object>} convenios - Contratos carregados do armazenamento local.
 * @returns {Array<object>} Contratos compatíveis com os filtros selecionados.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; filtra em memória os registros lidos da chave de convênios no LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: mover busca textual e filtros de vigência para o backend para evitar carregar todos os contratos no navegador.
 */
function applyContractTableFilters(convenios) {
  const filters = getContractTableFilters();

  return convenios.filter((convenio) => {
    const situacao = getSituacao(convenio);
    const searchable = [
      convenio.nome,
      formatCnpj(convenio.cnpj),
      onlyDigits(convenio.cnpj),
      convenio.numero
    ].filter(Boolean).join(' ').toLowerCase();

    if (filters.text && !searchable.includes(filters.text)) return false;
    if (filters.status === 'active' && !situacao.active) return false;
    if (filters.status === 'inactive' && situacao.active) return false;
    if (filters.startFrom && (convenio.inicio || '') < filters.startFrom) return false;
    if (filters.startTo && (convenio.inicio || '') > filters.startTo) return false;
    return true;
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Ordena a tabela única colocando contratos ativos primeiro e, em seguida, os mais antigos pela data de início.
 *
 * PARÂMETROS E RETORNO:
 * @param {Array<object>} convenios - Contratos filtrados para ordenação.
 * @returns {Array<object>} Nova lista ordenada para renderização.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa armazenamento; cria uma cópia ordenada da lista recebida.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: alinhar esta ordenação com índices do banco de dados quando houver persistência online.
 */
function sortContractsForTable(convenios) {
  return [...convenios].sort((a, b) => {
    const activeDiff = Number(getSituacao(b).active) - Number(getSituacao(a).active);
    if (activeDiff) return activeDiff;
    const startDiff = (a.inicio || '').localeCompare(b.inicio || '');
    if (startDiff) return startDiff;
    return (a.nome || '').localeCompare(b.nome || '');
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Configura os eventos dos filtros da tabela de contratos para atualizar a lista em tempo real.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; dispara nova renderização lendo filtros do DOM e contratos do LocalStorage.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: adicionar debounce na busca textual quando os filtros consultarem uma API.
 */
function bindContractTableFilters() {
  const filterIds = ['contract-filter-text', 'contract-filter-status', 'contract-filter-start-from', 'contract-filter-start-to'];

  filterIds.forEach((id) => {
    const input = document.getElementById(id);
    if (!input || input.dataset.filterBound === 'true') return;

    input.dataset.filterBound = 'true';
    input.addEventListener('input', renderTables);
    input.addEventListener('change', renderTables);
  });

  const clearButton = document.getElementById('clear-contract-filters');
  if (clearButton && clearButton.dataset.filterBound !== 'true') {
    clearButton.dataset.filterBound = 'true';
    clearButton.addEventListener('click', () => {
      filterIds.forEach((id) => {
        const input = document.getElementById(id);
        if (input) input.value = '';
      });
      renderTables();
    });
  }
}

function renderTableRows(target, convenios) {
  if (!convenios.length) {
    target.innerHTML = '<tr><td class="empty" colspan="7">Nenhum contrato encontrado para os filtros selecionados.</td></tr>';
    return;
  }

  target.innerHTML = convenios.map((convenio) => {
    const situacao = getSituacao(convenio);

    return `
      <tr>
        <td><strong>${escapeHtml(titleCaseText(convenio.nome))}</strong></td>
        <td>${escapeHtml(formatCnpj(convenio.cnpj) || '-')}</td>
        <td>${escapeHtml(convenio.numero || '-')}</td>
        <td>${dinheiro.format(Number(convenio.valorContrato ?? convenio.valorMensal ?? 0))}</td>
        <td>${formatPeriod(convenio.inicio, convenio.fim)}</td>
        <td><span class="badge ${situacao.className}">${situacao.label}</span></td>
        <td>
          <div class="actions">
            <button type="button" data-action="details" data-id="${convenio.id}">Detalhes</button>
            ${situacao.active ? `<button type="button" data-action="renew" data-id="${convenio.id}">Renovar</button>` : ''}
            <button type="button" data-action="edit" data-id="${convenio.id}">Editar</button>
            <button type="button" class="danger" data-action="delete" data-id="${convenio.id}">Excluir</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderTables() {
  if (!contratosBody) return;

  const convenios = getConvenios();
  const filtrados = sortContractsForTable(applyContractTableFilters(convenios));
  const total = convenios.length;

  if (contractsCount) contractsCount.textContent = filtrados.length === 1
    ? `1 contrato exibido de ${total} cadastrado.`
    : `${filtrados.length} contratos exibidos de ${total} cadastrados.`;
  renderTableRows(contratosBody, filtrados);
}

function detailItem(label, value) {
  return `<div class="detail-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value || '-')}</strong></div>`;
}

function removeContract(id) {
  saveList(STORAGE_CONVENIOS, getConvenios().filter((item) => item.id !== id));
  saveList(STORAGE_VALORES, getValores().filter((item) => item.convenioId !== id));
  saveList(STORAGE_RESPONSAVEIS, getResponsaveis().filter((item) => item.convenioId !== id));

  if (selectedConvenioId === id) {
    selectedConvenioId = '';
    detailsPanel.hidden = true;
    detailsEmpty.hidden = false;
  }

  renderAll();
}

function renderDetails(id) {
  const convenio = getConvenios().find((item) => item.id === id);
  if (!convenio) return;

  selectedConvenioId = id;
  const valores = getContractValues(convenio);
  const responsaveis = getContractResponsaveis(convenio);
  const historicoContratos = getClientContracts(convenio.cnpj);
  const situacao = getSituacao(convenio);

  detailsHeading.textContent = titleCaseText(convenio.nome) || 'Detalhes do convênio';
  detailsSubtitle.textContent = `Contrato ${convenio.numero || '-'} | ${situacao.label}`;

  const valoresHtml = valores.length ? `
    <h3 class="section-title">Valores por classe</h3>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Classe</th>
            <th>Grupo</th>
            <th>12h</th>
            <th>8h</th>
            <th>6h</th>
            <th>Passagem</th>
            <th>Alimentação</th>
          </tr>
        </thead>
        <tbody>
          ${valores.map((valor) => `
            <tr>
              <td>Classe ${escapeHtml(valor.classe)}</td>
              <td>${escapeHtml(valor.grupo || gruposClasse[valor.classe])}</td>
              <td>${dinheiro.format(Number(valor.servico12 || 0))}</td>
              <td>${dinheiro.format(Number(valor.servico8 || 0))}</td>
              <td>${dinheiro.format(Number(valor.servico6 || 0))}</td>
              <td>${dinheiro.format(Number(valor.passagem || 0))}</td>
              <td>${dinheiro.format(Number(valor.alimentacao || 0))}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  ` : '';

  const responsaveisHtml = responsaveis.length ? `
    <h3 class="section-title">Responsáveis</h3>
    <div class="table-wrap">
      <table class="compact-table responsaveis-details-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>CPF</th>
            <th>Email</th>
            <th>Telefone</th>
            <th>Início</th>
            <th>Fim</th>
            ${responsavelFuncoesColumns.map((funcao) => `<th class="permission-heading">${escapeHtml(funcao.label)}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${responsaveis.map((responsavel) => `
            <tr>
              <td><strong>${escapeHtml(titleCaseText(responsavel.nome))}</strong></td>
              <td>${escapeHtml(formatCpf(responsavel.cpf) || '-')}</td>
              <td>${escapeHtml(normalizeText(responsavel.email).toLowerCase() || '-')}</td>
              <td>${escapeHtml(formatPhone(responsavel.telefone) || '-')}</td>
              <td>${formatDateOrBlank(responsavel.inicio)}</td>
              <td>${formatDateOrBlank(responsavel.fim)}</td>
              ${responsavelFuncoesColumns.map((funcao) => `<td class="permission-cell">${permissionMark(hasResponsavelFuncao(responsavel, funcao.value))}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  ` : '';

  const historicoHtml = historicoContratos.length > 1 ? `
    <h3 class="section-title">Histórico de contratos do cliente</h3>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Contrato</th>
            <th>Valor</th>
            <th>Vigência</th>
            <th>Diário Oficial</th>
            <th>Situação</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${historicoContratos.map((item) => {
            const itemSituacao = getSituacao(item);

            return `
              <tr>
                <td>${escapeHtml(item.numero || '-')}</td>
                <td>${dinheiro.format(Number(item.valorContrato ?? item.valorMensal ?? 0))}</td>
                <td>${formatPeriod(item.inicio, item.fim)}</td>
                <td>${formatDateOrDash(item.diarioData)}${item.diarioPagina ? `<br><small>Página ${escapeHtml(item.diarioPagina)}</small>` : ''}</td>
                <td><span class="badge ${itemSituacao.className}">${itemSituacao.label}</span></td>
                <td>
                  <div class="actions">
                    <button type="button" data-action="edit-history" data-id="${item.id}">Editar</button>
                    <button type="button" class="danger" data-action="delete-history" data-id="${item.id}">Apagar</button>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  ` : '';

  detailsContent.innerHTML = `
    <h3 class="section-title">Dados do convênio</h3>
    <div class="details-grid">
      ${detailItem('Nome', titleCaseText(convenio.nome))}
      ${detailItem('CNPJ', formatCnpj(convenio.cnpj))}
      ${detailItem('Situação pela vigência', situacao.label)}
      ${detailItem('Endereço', formatEndereco(convenio.enderecoDados, convenio.endereco))}
      ${detailItem('Nº do contrato', convenio.numero)}
      ${detailItem('Valor do contrato', dinheiro.format(Number(convenio.valorContrato ?? convenio.valorMensal ?? 0)))}
      ${detailItem('Publicação no Diário Oficial', `${formatDateOrDash(convenio.diarioData)}\nPágina ${convenio.diarioPagina || '-'}`)}
      ${detailItem('Vigência', formatPeriod(convenio.inicio, convenio.fim))}
    </div>
    ${valoresHtml}
    ${responsaveisHtml}
    ${historicoHtml}
  `;

  detailsEmpty.hidden = true;
  detailsPanel.hidden = false;
  setActiveView('detalhes-view');
}

function renderAll() {
  renderTables();

  if (selectedConvenioId && getConvenios().some((item) => item.id === selectedConvenioId)) {
    renderDetails(selectedConvenioId);
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  Object.keys(validationRules).forEach((key) => {
    activeValidationFields.add(key);
    normalizeFieldValue(key);
  });

  if (!validateContractForm({ showAll: true })) return;

  const payload = collectPayload();
  const convenios = getConvenios();
  const next = editingId.value
    ? convenios.map((item) => item.id === payload.id ? payload : item)
    : [...convenios, payload];

  saveList(STORAGE_CONVENIOS, next);
  syncRelatedStorage(payload.id, payload.valores, payload.responsaveis);
  selectedConvenioId = payload.id;
  resetForm();
  renderAll();
  setActiveView('tabela-view');
});

Object.keys(validationRules).forEach((key) => {
  const field = fields[key];
  if (!field) return;

  field.addEventListener('input', () => {
    /*
     * DESCRIÇÃO DO BLOCO: Revalida o campo enquanto o usuário digita para mostrar feedback imediato sem
     * aguardar o salvamento do formulário.
     * PARÂMETROS E RETORNO: O listener recebe o evento do navegador e não retorna valores.
     * ARMAZENAMENTO E PERSISTÊNCIA: Lê e altera apenas classes no DOM; não grava localStorage.
     * TODO: Em produção, aplicar debounce para validações que dependam de consulta remota.
     */
    if (['cnpj', 'enderecoCep', 'numero', 'responsavelCpf', 'responsavelTelefone', 'enderecoUf'].includes(key) || currencyInputs.includes(field)) {
      normalizeFieldValue(key);
    }
    runFieldValidation(key);
    if (key === 'inicio') runFieldValidation('fim');
    if (key === 'responsavelInicio') runFieldValidation('responsavelFim');
  });

  field.addEventListener('blur', () => {
    /*
     * DESCRIÇÃO DO BLOCO: Marca o campo como visitado e normaliza o texto quando o usuário sai do input,
     * garantindo que a tabela receba dados padronizados.
     * PARÂMETROS E RETORNO: O listener recebe evento de foco e não retorna valores.
     * ARMAZENAMENTO E PERSISTÊNCIA: Atualiza somente o DOM; a gravação acontece no submit.
     * TODO: Em produção, persistir rascunhos com controle de sessão se o formulário crescer.
     */
    activeValidationFields.add(key);
    normalizeFieldValue(key);
    runFieldValidation(key);
    if (key === 'inicio') runFieldValidation('fim');
    if (key === 'responsavelInicio') runFieldValidation('responsavelFim');
  });
});

valueValidationRules.forEach((input) => {
  input.addEventListener('input', () => {
    input.value = formatCurrencyInput(input.value);
    runValueValidation(input);
  });
});

addResponsavelButton.addEventListener('click', addResponsavelFromFields);
clearResponsavelButton.addEventListener('click', clearResponsavelFields);
clearButton.addEventListener('click', resetForm);
cancelButton.addEventListener('click', resetForm);

closeDetails.addEventListener('click', () => {
  detailsPanel.hidden = true;
  detailsEmpty.hidden = false;
  selectedConvenioId = '';
});

tabs.forEach((tab) => {
  tab.addEventListener('click', () => setActiveView(tab.dataset.view));
});

bindContractTableFilters();

document.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  if (button.dataset.action === 'edit-form-responsavel') {
    const responsavel = responsaveisState.find((item) => item.id === button.dataset.id);
    if (!responsavel) return;

    fields.responsavelNome.value = responsavel.nome || '';
    fields.responsavelCpf.value = responsavel.cpf || '';
    fields.responsavelEmail.value = responsavel.email || '';
    fields.responsavelTelefone.value = responsavel.telefone || '';
    setSelectedResponsavelFuncoes(responsavel.funcoes || responsavel.funcao || []);
    fields.responsavelInicio.value = responsavel.inicio || '';
    fields.responsavelFim.value = responsavel.fim || '';
    responsaveisState = responsaveisState.filter((item) => item.id !== responsavel.id);
    renderResponsaveisForm();
    return;
  }

  if (button.dataset.action === 'remove-form-responsavel') {
    responsaveisState = responsaveisState.filter((item) => item.id !== button.dataset.id);
    renderResponsaveisForm();
    return;
  }

  const convenio = getConvenios().find((item) => item.id === button.dataset.id);
  if (!convenio) return;

  if (button.dataset.action === 'details') renderDetails(convenio.id);
  if (button.dataset.action === 'renew') renewContract(convenio);
  if (button.dataset.action === 'edit' || button.dataset.action === 'edit-history') fillForm(convenio);
  if ((button.dataset.action === 'delete' || button.dataset.action === 'delete-history') && confirm('Excluir este contrato e seus dados vinculados?')) {
    removeContract(convenio.id);
  }
});

createFieldHints();
renderResponsaveisForm();
renderAll();
