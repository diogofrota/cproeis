const P1_SERVICO_KEYS = {
  servicos: 'cproeis_p1_unidade_servicos'
};

/**
 * DESCRIÇÃO DA FUNÇÃO: Lê uma lista JSON do LocalStorage para o cadastro de serviços da P/1.
 * PARÂMETROS E RETORNO: Recebe `key` (string) e retorna Array<object>.
 * ARMAZENAMENTO E PERSISTÊNCIA: Lê cproeis_p1_unidade_servicos no LocalStorage.
 * TODO: Em produção, substituir por chamada autenticada para API de serviços RAS por unidade.
 */
function p1ServicoReadList(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    return [];
  }
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Salva a lista de serviços cadastrados pela P/1 Unidade.
 * PARÂMETROS E RETORNO: Recebe `key` (string) e `records` (Array<object>); não retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Grava cproeis_p1_unidade_servicos no LocalStorage.
 * TODO: Em produção, trocar por endpoint transacional com validação da unidade e auditoria.
 */
function p1ServicoSaveList(key, records) {
  localStorage.setItem(key, JSON.stringify(records));
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Normaliza campos textuais do serviço antes de validar e persistir.
 * PARÂMETROS E RETORNO: Recebe `value` (string) e retorna string sem espaços duplicados.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava dados; trata valores vindos do DOM.
 * TODO: Em produção, repetir a normalização no backend para consistência entre usuários.
 */
function p1ServicoNormalize(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Retorna apenas os dígitos de um valor textual para validar CEP.
 * PARÂMETROS E RETORNO: Recebe `value` (string) e retorna string somente com números.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava dados; normaliza valor de input em memória.
 * TODO: Em produção, reaproveitar normalizadores de documento/endereço em módulo compartilhado.
 */
function p1ServicoOnlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Aplica máscara de CEP no padrão 00000-000.
 * PARÂMETROS E RETORNO: Recebe `value` (string) e retorna string mascarada ou parcial.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; o retorno atualiza o input e o payload local.
 * TODO: Em produção, centralizar máscaras em componente oficial de formulário.
 */
function p1ServicoFormatCep(value) {
  const digits = p1ServicoOnlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Garante mensagens auxiliares abaixo dos campos obrigatórios do serviço.
 * PARÂMETROS E RETORNO: Não recebe parâmetros nem retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava LocalStorage; cria elementos temporários no DOM.
 * TODO: Em produção, mover hints para componente compartilhado com acessibilidade completa.
 */
function p1ServicoEnsureFieldHints() {
  [
    'nome-servico',
    'local-servico',
    'classe-padrao',
    'servico-cep',
    'servico-logradouro',
    'servico-numero',
    'servico-bairro',
    'servico-cidade',
    'servico-uf'
  ].forEach((id) => {
    const input = document.getElementById(id);
    const label = input?.closest('label');
    if (!input || !label || label.querySelector(`[data-field-hint="${id}"]`)) return;

    const hint = document.createElement('span');
    hint.className = 'field-hint hidden';
    hint.dataset.fieldHint = id;
    label.appendChild(hint);
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Atualiza destaque vermelho e mensagem de erro de um campo do serviço.
 * PARÂMETROS E RETORNO: Recebe `id` (string), `valid` (boolean) e `message` (string); não retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; altera classes e texto no DOM.
 * TODO: Em produção, padronizar mensagens de erro vindas da validação server-side.
 */
function p1ServicoSetFieldState(id, valid, message = '') {
  const input = document.getElementById(id);
  const hint = document.querySelector(`[data-field-hint="${id}"]`);
  if (!input || !hint) return;

  input.classList.toggle('invalid', !valid);
  hint.textContent = valid ? '' : message;
  hint.dataset.status = valid ? '' : 'error';
  hint.classList.toggle('hidden', valid);
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Atualiza mensagem auxiliar do CEP para consulta, sucesso ou falha.
 * PARÂMETROS E RETORNO: Recebe `message` (string) e `status` (string); não retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; altera apenas o hint do CEP no DOM.
 * TODO: Em produção, registrar falhas de consulta externa e permitir retentativa controlada.
 */
function p1ServicoSetCepStatus(message = '', status = '') {
  const hint = document.querySelector('[data-field-hint="servico-cep"]');
  const input = document.getElementById('servico-cep');
  if (!hint || !input) return;

  hint.textContent = message;
  hint.dataset.status = status;
  hint.classList.toggle('hidden', !message);
  input.classList.toggle('invalid', status === 'error');
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Consulta o ViaCEP e retorna endereço normalizado para preencher o formulário.
 * PARÂMETROS E RETORNO: Recebe `cep` (string com ou sem máscara) e retorna Promise<object|null>.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; faz GET em https://viacep.com.br/ws/{cep}/json/.
 * TODO: Em produção, realizar consulta de CEP no backend para controlar disponibilidade e logs.
 */
async function p1ServicoLookupCep(cep) {
  const digits = p1ServicoOnlyDigits(cep);
  if (digits.length !== 8) return null;

  const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
  if (!response.ok) throw new Error('Falha ao consultar CEP.');
  const data = await response.json();
  if (data.erro) return null;

  return {
    cep: p1ServicoFormatCep(data.cep || digits),
    logradouro: data.logradouro || '',
    complemento: data.complemento || '',
    bairro: data.bairro || '',
    cidade: data.localidade || '',
    uf: data.uf || ''
  };
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Preenche os campos de endereço com o retorno da consulta de CEP.
 * PARÂMETROS E RETORNO: Recebe `address` (object); não retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não grava LocalStorage; altera apenas inputs do DOM.
 * TODO: Em produção, confirmar endereço oficial e permitir auditoria de alteração manual.
 */
function p1ServicoFillAddress(address) {
  const mapping = {
    'servico-cep': address.cep,
    'servico-logradouro': address.logradouro,
    'servico-complemento': address.complemento,
    'servico-bairro': address.bairro,
    'servico-cidade': address.cidade,
    'servico-uf': address.uf
  };

  Object.entries(mapping).forEach(([id, value]) => {
    const input = document.getElementById(id);
    if (input && value) {
      input.value = value;
      p1ServicoSetFieldState(id, true);
    }
  });
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Orquestra a consulta do CEP ao sair do campo ou completar oito dígitos.
 * PARÂMETROS E RETORNO: Não recebe parâmetros nem retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Lê input de CEP e preenche campos no DOM; não grava LocalStorage.
 * TODO: Em produção, tratar indisponibilidade do serviço externo com fallback do backend.
 */
async function p1ServicoHandleCepLookup() {
  const cepInput = document.getElementById('servico-cep');
  const digits = p1ServicoOnlyDigits(cepInput?.value);

  if (!digits) {
    p1ServicoSetCepStatus('');
    return;
  }

  if (digits.length !== 8) {
    p1ServicoSetCepStatus('Digite os 8 números do CEP.', 'error');
    return;
  }

  try {
    p1ServicoSetCepStatus('Consultando endereço pelo CEP...', 'loading');
    const address = await p1ServicoLookupCep(digits);
    if (!address) {
      p1ServicoSetCepStatus('CEP não encontrado. Preencha o endereço manualmente.', 'error');
      return;
    }

    p1ServicoFillAddress(address);
    p1ServicoSetCepStatus('Endereço preenchido automaticamente pelo CEP.', 'success');
  } catch (error) {
    p1ServicoSetCepStatus('Não foi possível consultar o CEP. Preencha manualmente.', 'error');
  }
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Cria identificador local para o serviço da P/1.
 * PARÂMETROS E RETORNO: Não recebe parâmetros; retorna string única.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; o retorno é persistido pelo submit do formulário.
 * TODO: Em produção, usar ID gerado pelo banco de dados.
 */
function p1ServicoCreateId() {
  return `p1-servico-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Coleta os campos do formulário de serviço da P/1 e monta o payload local.
 * PARÂMETROS E RETORNO: Recebe `context` (object) com policial/unidade e retorna object.
 * ARMAZENAMENTO E PERSISTÊNCIA: Lê valores do DOM; ainda não grava LocalStorage.
 * TODO: Em produção, incluir validação oficial de evento, endereço e autorização GSI no servidor.
 */
function p1ServicoCollect(context) {
  const now = new Date().toISOString();

  return {
    id: p1ServicoCreateId(),
    unidade: context.acesso.unidade,
    responsavelP1Id: p1UnitGetPolicialKeys(context.policial)[0] || context.acesso.policialId || '',
    responsavelP1Nome: p1UnitGetPolicialName(context.policial),
    nomeServico: p1ServicoNormalize(document.getElementById('nome-servico')?.value),
    localServico: p1ServicoNormalize(document.getElementById('local-servico')?.value),
    classePadrao: document.getElementById('classe-padrao')?.value || '',
    enderecoDados: {
      cep: p1ServicoFormatCep(document.getElementById('servico-cep')?.value),
      logradouro: p1ServicoNormalize(document.getElementById('servico-logradouro')?.value),
      numero: p1ServicoNormalize(document.getElementById('servico-numero')?.value),
      complemento: p1ServicoNormalize(document.getElementById('servico-complemento')?.value),
      bairro: p1ServicoNormalize(document.getElementById('servico-bairro')?.value),
      cidade: p1ServicoNormalize(document.getElementById('servico-cidade')?.value),
      uf: p1ServicoNormalize(document.getElementById('servico-uf')?.value).slice(0, 2).toUpperCase()
    },
    pontoReferencia: p1ServicoNormalize(document.getElementById('ponto-referencia')?.value),
    status: 'ativo',
    origem: 'P1_RAS',
    criadoEm: now,
    atualizadoEm: now
  };
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Valida campos mínimos para salvar o serviço da P/1.
 * PARÂMETROS E RETORNO: Recebe `servico` (object) e retorna boolean.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não acessa armazenamento; valida dados em memória.
 * TODO: Em produção, validar duplicidade, endereço oficial e vínculo da unidade no backend.
 */
function p1ServicoValidate(servico) {
  const cepDigits = p1ServicoOnlyDigits(servico.enderecoDados.cep);
  const required = {
    'nome-servico': { valid: servico.nomeServico.length >= 3, message: 'Informe um nome com pelo menos 3 caracteres.' },
    'local-servico': { valid: servico.localServico.length >= 3, message: 'Informe o local de apresentação.' },
    'classe-padrao': { valid: ['A', 'B', 'C/D'].includes(servico.classePadrao), message: 'Selecione a classe do serviço.' },
    'servico-cep': { valid: !cepDigits || cepDigits.length === 8, message: 'Digite os 8 números do CEP ou deixe em branco.' },
    'servico-logradouro': { valid: servico.enderecoDados.logradouro.length >= 3, message: 'Informe o logradouro.' },
    'servico-numero': { valid: servico.enderecoDados.numero.length >= 1, message: 'Informe o número.' },
    'servico-bairro': { valid: servico.enderecoDados.bairro.length >= 3, message: 'Informe o bairro com pelo menos 3 caracteres.' },
    'servico-cidade': { valid: servico.enderecoDados.cidade.length >= 3, message: 'Informe a cidade.' },
    'servico-uf': { valid: /^[A-Z]{2}$/.test(servico.enderecoDados.uf), message: 'Informe a UF com 2 letras.' }
  };

  Object.entries(required).forEach(([id, result]) => {
    p1ServicoSetFieldState(id, result.valid, result.message);
  });

  return Object.values(required).every((result) => result.valid);
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Inicializa o formulário de cadastro de serviço da P/1.
 * PARÂMETROS E RETORNO: Não recebe parâmetros nem retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Lê sessão P/1 e grava novos registros em cproeis_p1_unidade_servicos.
 * TODO: Em produção, enviar payload para API e tratar erros de rede/autorização.
 */
function p1ServicoInit() {
  const form = document.getElementById('servico-form');
  const status = document.getElementById('servico-status');
  const context = p1UnitResolveSession();

  if (!form || !status) return;
  p1ServicoEnsureFieldHints();

  document.getElementById('servico-cep')?.addEventListener('input', (event) => {
    event.target.value = p1ServicoFormatCep(event.target.value);
    if (p1ServicoOnlyDigits(event.target.value).length === 8) {
      p1ServicoHandleCepLookup();
    }
  });

  document.getElementById('servico-cep')?.addEventListener('blur', p1ServicoHandleCepLookup);

  document.getElementById('servico-uf')?.addEventListener('input', (event) => {
    event.target.value = p1ServicoNormalize(event.target.value).replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase();
  });

  if (!context) {
    form.querySelectorAll('input, select, textarea, button').forEach((field) => {
      field.disabled = true;
    });
    status.textContent = 'Acesso bloqueado. Selecione um responsável P/1 ativo.';
    return;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const servico = p1ServicoCollect(context);

    if (!p1ServicoValidate(servico)) {
      status.textContent = 'Preencha os campos destacados em vermelho.';
      return;
    }

    const servicos = p1ServicoReadList(P1_SERVICO_KEYS.servicos);
    p1ServicoSaveList(P1_SERVICO_KEYS.servicos, [...servicos, servico]);
    window.location.href = document.getElementById('voltar-servicos-link')?.href || 'servicos.html';
  });
}

document.addEventListener('DOMContentLoaded', p1ServicoInit);
