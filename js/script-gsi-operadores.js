const GSI_OPERATOR_ACCESS_CONFIG = {
  sistema: {
    storage: 'cproeis_gsi_operadores_sistema',
    removedStorage: 'cproeis_gsi_operadores_removidos',
    singular: 'usuário administrativo',
    plural: 'usuários administrativos',
    emptyMessage: 'Nenhum usuário administrativo cadastrado pelo GSI.',
    successCreate: 'Usuário administrativo cadastrado pelo GSI.',
    successRemove: 'Usuário administrativo removido da lista ativa.',
    duplicateMessage: 'Já existe usuário administrativo cadastrado com este CPF, email ou login.',
    selectLabel: 'Selecione o usuário administrativo',
    accessType: 'Sistema administrativo',
    requiresContract: false
  },
  convenio: {
    storage: 'cproeis_gsi_usuarios_contrato',
    removedStorage: 'cproeis_gsi_usuarios_contrato_removidos',
    singular: 'usuário vinculado a contrato',
    plural: 'usuários vinculados a contrato',
    emptyMessage: 'Nenhum usuário vinculado a contrato cadastrado pelo GSI.',
    successCreate: 'Usuário vinculado a contrato cadastrado pelo GSI.',
    successRemove: 'Usuário vinculado a contrato removido da lista ativa.',
    duplicateMessage: 'Já existe usuário vinculado a este contrato com este CPF ou email.',
    selectLabel: 'Selecione o usuário vinculado a contrato',
    accessType: 'Contrato',
    requiresContract: true
  }
};

const GSI_CONTRACTS_STORAGE = 'cproeis_contratos_convenios';
const GSI_POLICE_STORAGE = 'cproeis_cadastro_policiais';
const GSI_OPERATION_DONE_STORAGE = 'cproeis_gsi_operacao_concluida';

function gsiOperatorGetAccessConfig() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Resolve qual cadastro de acesso a página atual está manipulando.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e retorna um objeto de configuração com chaves
   * de LocalStorage, rótulos e mensagens da tela.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê apenas o atributo `data-gsi-access-scope` do body; não grava dados.
   * TODO: Em produção, substituir esta seleção por rotas autenticadas e permissões vindas do backend.
   */
  const scope = document.body?.dataset.gsiAccessScope || 'sistema';
  return GSI_OPERATOR_ACCESS_CONFIG[scope] || GSI_OPERATOR_ACCESS_CONFIG.sistema;
}

function gsiOperatorLoadList(key) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Lê uma lista JSON usada pela gestão de usuários de acesso do GSI.
   * PARÂMETROS E RETORNO: Recebe key como string e retorna array de objetos; em erro retorna array vazio.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê LocalStorage na chave informada; não grava dados.
   * TODO: Em produção, substituir leitura local por endpoint paginado com autenticação e tratamento de erro.
   */
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    return [];
  }
}

function gsiOperatorSaveList(key, value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Persiste uma lista da gestão de usuários de acesso do GSI.
   * PARÂMETROS E RETORNO: Recebe key como string e value como array; não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Grava LocalStorage na chave informada.
   * TODO: Em produção, trocar por API transacional com auditoria, controle de concorrência e criptografia.
   */
  localStorage.setItem(key, JSON.stringify(value));
}

function gsiOperatorSaveOperationDone(payload) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Salva o resumo da operação finalizada para a tela de confirmação do GSI.
   * PARÂMETROS E RETORNO: Recebe payload como objeto e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Grava sessionStorage em `cproeis_gsi_operacao_concluida`.
   * TODO: Em produção, substituir por protocolo retornado pela API após commit transacional.
   */
  sessionStorage.setItem(GSI_OPERATION_DONE_STORAGE, JSON.stringify(payload));
}

function gsiOperatorOnlyDigits(value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Remove caracteres não numéricos de CPF e telefone.
   * PARÂMETROS E RETORNO: Recebe value como string/número e retorna string somente com dígitos.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava dados; transforma valor em memória.
   * TODO: Em produção, repetir normalização e validação no backend.
   */
  return String(value || '').replace(/\D/g, '');
}

function gsiOperatorNormalizeText(value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Normaliza espaços em textos digitados nos formulários de usuários de acesso.
   * PARÂMETROS E RETORNO: Recebe value como string e retorna string sem espaços duplicados.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não acessa LocalStorage; atua somente em memória.
   * TODO: Em produção, padronizar normalização em serviço compartilhado entre frontend e backend.
   */
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function gsiOperatorTitleCase(value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Padroniza nomes e unidades com primeira letra maiúscula por palavra.
   * PARÂMETROS E RETORNO: Recebe value como string e retorna texto formatado para exibição.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; o retorno pode ser persistido no cadastro.
   * TODO: Em produção, respeitar grafias oficiais vindas de diretório corporativo.
   */
  return gsiOperatorNormalizeText(value).toLowerCase().replace(/(^|\s)(\S)/g, (match) => match.toUpperCase());
}

function gsiOperatorFormatCpf(value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Aplica máscara visual de CPF.
   * PARÂMETROS E RETORNO: Recebe value como string/número e retorna CPF no padrão 000.000.000-00
   * quando houver 11 dígitos; caso contrário retorna o valor original.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; usado para exibição e normalização de input.
   * TODO: Em produção, validar CPF oficialmente no backend antes de conceder acesso.
   */
  const digits = gsiOperatorOnlyDigits(value).slice(0, 11);
  if (digits.length !== 11) return digits;
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function gsiOperatorFormatPhone(value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Aplica máscara visual simples de telefone brasileiro.
   * PARÂMETROS E RETORNO: Recebe value como string/número e retorna telefone formatado quando
   * houver 10 ou 11 dígitos.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; usado para exibição do contato.
   * TODO: Em produção, validar DDD e canais oficiais de contato em cadastro centralizado.
   */
  const digits = gsiOperatorOnlyDigits(value).slice(0, 11);
  if (digits.length === 11) return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  if (digits.length === 10) return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  return digits;
}

function gsiOperatorEscapeHtml(value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Escapa conteúdo textual antes de inserir nas tabelas de usuários de acesso.
   * PARÂMETROS E RETORNO: Recebe value como string/número e retorna string segura para HTML.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava dados; reduz risco de marcação indevida no DOM.
   * TODO: Em produção, manter sanitização também no backend e usar templates seguros.
   */
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function gsiOperatorFormatDateTime(value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Formata data ISO de cadastro ou remoção para leitura administrativa.
   * PARÂMETROS E RETORNO: Recebe value como string ISO e retorna data/hora pt-BR ou hífen.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; usa valor já persistido no LocalStorage.
   * TODO: Em produção, exibir fuso oficial do servidor e operador executor da ação.
   */
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function gsiOperatorCreateId() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Gera identificador local para usuário de acesso cadastrado no protótipo.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e retorna string única o suficiente para LocalStorage.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; o ID é persistido posteriormente no usuário de acesso.
   * TODO: Em produção, usar identificador gerado pelo banco ou provedor de identidade.
   */
  return `gsi-operator-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function gsiOperatorGetPoliceLabel(policial) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Monta o rótulo do policial usado no select de ativação de usuário administrativo.
   * PARÂMETROS E RETORNO: Recebe objeto de policial e retorna string com nome, identificação funcional
   * e unidade quando disponíveis.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; lê apenas o objeto vindo de `cproeis_cadastro_policiais`.
   * TODO: Em produção, buscar policiais por API com paginação e filtro por situação funcional.
   */
  const name = policial.nomeCompleto || policial.nomeGuerra || 'Policial sem nome';
  const identifier = policial.idFuncional || policial.rg || policial.cpf || '';
  const unit = policial.unidade || '';
  return [name, identifier, unit].filter(Boolean).join(' - ');
}

function gsiOperatorApplySelectedPolice() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Copia os dados do policial selecionado para campos ocultos/automáticos
   * do cadastro de usuário administrativo.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valor; usa o select do DOM.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê `cproeis_cadastro_policiais` e escreve somente em inputs do DOM;
   * a gravação em LocalStorage ocorre apenas no submit do cadastro.
   * TODO: Em produção, consultar os dados atualizados do policial no backend antes de ativar acesso.
   */
  const select = document.getElementById('gsi-operator-police');
  if (!select) return;

  const policiais = gsiOperatorLoadList(GSI_POLICE_STORAGE);
  const selected = policiais.find((policial) => (policial.id || policial.idFuncional || policial.rg) === select.value) || null;
  const mappings = {
    'gsi-operator-name': selected?.nomeCompleto || selected?.nomeGuerra || '',
    'gsi-operator-cpf': selected?.cpf || selected?.rg || selected?.idFuncional || '',
    'gsi-operator-email': selected?.email || '',
    'gsi-operator-phone': selected?.telefone || '',
    'gsi-operator-unit': selected?.unidade || ''
  };

  Object.entries(mappings).forEach(([id, value]) => {
    const field = document.getElementById(id);
    if (field) field.value = value;
  });

  const summary = document.getElementById('gsi-operator-selected-summary');
  if (summary) {
    summary.innerHTML = selected
      ? `
        <strong class="gsi-summary-name">${gsiOperatorEscapeHtml(selected.nomeCompleto || selected.nomeGuerra || 'Policial selecionado')}</strong>
        <span><b>Identificação</b>${gsiOperatorEscapeHtml(selected.rg || selected.idFuncional || '-')}</span>
        <span><b>Email</b>${gsiOperatorEscapeHtml(selected.email || '-')}</span>
        <span><b>Telefone</b>${gsiOperatorEscapeHtml(selected.telefone || '-')}</span>
        <span><b>Unidade</b>${gsiOperatorEscapeHtml(selected.unidade || '-')}</span>
      `
      : 'Selecione um policial para conferir os dados antes de ativar o acesso.';
  }
}

function gsiOperatorRenderPoliceOptions() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Preenche o select de policiais para ativação de usuário administrativo,
   * exibindo somente policiais lotados no CPROEIS.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê `cproeis_cadastro_policiais` no LocalStorage e escreve opções no DOM.
   * TODO: Em produção, substituir por busca remota que consulte a lotação vigente em tabela oficial.
   */
  const select = document.getElementById('gsi-operator-police');
  if (!select) return;

  const policiais = gsiOperatorLoadList(GSI_POLICE_STORAGE)
    .filter((policial) => gsiOperatorNormalizeText(policial.unidade).toUpperCase() === 'CPROEIS');
  select.innerHTML = '<option value="">Selecione o policial</option>';
  if (!policiais.length) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Nenhum policial lotado no CPROEIS';
    select.appendChild(option);
    gsiOperatorApplySelectedPolice();
    return;
  }
  policiais.forEach((policial) => {
    const option = document.createElement('option');
    option.value = policial.id || policial.idFuncional || policial.rg || '';
    option.textContent = gsiOperatorGetPoliceLabel(policial);
    select.appendChild(option);
  });

  select.addEventListener('change', gsiOperatorApplySelectedPolice);
}

function gsiOperatorBuildGeneratedLogin(name, fallback) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Gera um login inicial para usuário administrativo a partir do nome do policial.
   * PARÂMETROS E RETORNO: Recebe name e fallback como strings e retorna login em minúsculas sem acentos.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; o retorno é salvo no cadastro de acesso no submit.
   * TODO: Em produção, delegar geração/validação de login ao provedor de identidade com regra de unicidade.
   */
  const normalized = gsiOperatorNormalizeText(name)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s.]/g, '')
    .split(/\s+/)
    .filter(Boolean);
  const login = normalized.length > 1
    ? `${normalized[0]}.${normalized[normalized.length - 1]}`
    : normalized[0] || gsiOperatorOnlyDigits(fallback) || `acesso${Date.now()}`;
  return login;
}

function gsiOperatorBuildTemporaryPassword() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Gera senha temporária local para ativação de acesso sem digitação manual.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e retorna string alfanumérica simples para protótipo.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; o retorno é salvo no LocalStorage junto do acesso.
   * TODO: Em produção, gerar senha/token temporário no backend, com expiração e envio por canal seguro.
   */
  return `CPROEIS${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function gsiOperatorGetContractLabel(contract) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Monta o rótulo do contrato usado no cadastro de usuários vinculados.
   * PARÂMETROS E RETORNO: Recebe um objeto de contrato e retorna string com nome do conveniado
   * e número do contrato, quando disponíveis.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; lê apenas o objeto em memória vindo de
   * `cproeis_contratos_convenios`.
   * TODO: Em produção, receber este rótulo pronto da API de contratos para evitar regra duplicada no frontend.
   */
  const name = contract.nome || contract.identificacao?.nome || 'Contrato sem nome';
  const number = contract.numero || contract.contrato?.numero || '';
  return [name, number].filter(Boolean).join(' - ');
}

function gsiOperatorRenderContractOptions() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Preenche o select de contratos no cadastro de usuário vinculado.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê `cproeis_contratos_convenios` no LocalStorage e escreve
   * opções no DOM; não grava dados.
   * TODO: Em produção, buscar contratos ativos por API, com filtro por vigência e permissão do GSI.
   */
  const select = document.getElementById('gsi-operator-contract');
  if (!select) return;

  const contracts = gsiOperatorLoadList(GSI_CONTRACTS_STORAGE);
  select.innerHTML = '<option value="">Selecione o contrato</option>';
  contracts.forEach((contract) => {
    const option = document.createElement('option');
    option.value = contract.id || '';
    option.textContent = gsiOperatorGetContractLabel(contract);
    select.appendChild(option);
  });
}

function gsiOperatorGetFilteredOperators() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Aplica filtros da tabela de usuários de acesso do GSI, carregando
   * ativos por padrão e consultando inativos somente quando a situação selecionada exigir.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e retorna array filtrado.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê a chave LocalStorage definida pelo escopo da página,
   * a chave de removidos somente para "Todos" ou "Inativos", e campos do DOM.
   * TODO: Em produção, mover filtros para consulta paginada no servidor.
   */
  const config = gsiOperatorGetAccessConfig();
  const search = gsiOperatorNormalizeText(document.getElementById('gsi-operator-search')?.value || '').toLowerCase();
  const profile = document.getElementById('gsi-operator-profile-filter')?.value || '';
  const status = document.getElementById('gsi-operator-status-filter')?.value || '';
  const shouldLoadActive = status !== 'Inativo';
  const shouldLoadInactive = !config.requiresContract && status !== 'Ativo';
  const activeOperators = shouldLoadActive
    ? gsiOperatorLoadList(config.storage).map((operator) => ({
      ...operator,
      situacao: 'Ativo',
      removidoEm: '',
      motivo: ''
    }))
    : [];
  const removedOperators = shouldLoadInactive
    ? gsiOperatorLoadList(config.removedStorage).map((operator) => ({
      ...operator,
      situacao: 'Inativo'
    }))
    : [];
  const operators = [...activeOperators, ...removedOperators];

  return operators.filter((operator) => {
    const haystack = [
      operator.nome,
      operator.cpf,
      operator.email,
      operator.telefone,
      operator.perfil,
      operator.contratoNome,
      operator.unidade,
      operator.situacao,
      operator.motivo
    ].join(' ').toLowerCase();
    const matchesSearch = !search || haystack.includes(search);
    const matchesProfile = !profile || operator.perfil === profile;
    const matchesStatus = !status || operator.situacao === status;
    return matchesSearch && matchesProfile && matchesStatus;
  });
}

function gsiOperatorGetTableTotalByStatus(config) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Calcula o total da tabela respeitando a situação selecionada, sem
   * consultar registros inativos quando a tela está filtrada por ativos.
   * PARÂMETROS E RETORNO: Recebe config como objeto do escopo atual e retorna número total.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê `cproeis_gsi_operadores_sistema` quando a situação é
   * Ativo/Todos e lê a chave de removidos somente para Todos/Inativos.
   * TODO: Em produção, retornar esse total do endpoint paginado conforme o filtro de situação.
   */
  const status = document.getElementById('gsi-operator-status-filter')?.value || '';
  if (status === 'Ativo' || config.requiresContract) return gsiOperatorLoadList(config.storage).length;
  if (status === 'Inativo') return gsiOperatorLoadList(config.removedStorage).length;
  return gsiOperatorLoadList(config.storage).length + gsiOperatorLoadList(config.removedStorage).length;
}

function gsiOperatorEnsureDefaultStatusFilter() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Garante que tabelas com filtro de situação iniciem exibindo somente
   * usuários ativos.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não acessa LocalStorage; altera apenas o valor inicial do select no DOM.
   * TODO: Em produção, refletir o filtro padrão em query params para consultas paginadas.
   */
  const statusFilter = document.getElementById('gsi-operator-status-filter');
  if (statusFilter && !statusFilter.value) statusFilter.value = 'Ativo';
}

function gsiOperatorRenderTable() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Renderiza a tabela de acessos cadastrados pelo GSI, exibindo ativos e
   * inativos na mesma listagem administrativa.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê as chaves LocalStorage de ativos e removidos do escopo atual;
   * escreve somente no DOM.
   * TODO: Em produção, adicionar paginação, ordenação oficial e trilha de auditoria por alteração.
   */
  const body = document.getElementById('gsi-operator-table-body');
  const count = document.getElementById('gsi-operator-count');
  if (!body) return;

  const config = gsiOperatorGetAccessConfig();
  const filteredOperators = gsiOperatorGetFilteredOperators();
  const total = gsiOperatorGetTableTotalByStatus(config);
  if (count) count.textContent = `${filteredOperators.length} ${config.singular}(s) exibido(s) de ${total} cadastrado(s).`;

  if (!filteredOperators.length) {
    body.innerHTML = `<tr><td class="empty" colspan="${config.requiresContract ? 5 : 11}">${gsiOperatorEscapeHtml(config.emptyMessage)}</td></tr>`;
    return;
  }

  if (config.requiresContract) {
    body.innerHTML = filteredOperators.map((operator) => `
      <tr>
        <td><strong>${gsiOperatorEscapeHtml(operator.nome)}</strong></td>
        <td>${gsiOperatorEscapeHtml(operator.cpf)}</td>
        <td>${gsiOperatorEscapeHtml(operator.email)}</td>
        <td>${gsiOperatorEscapeHtml(operator.contratoNome || '-')}</td>
        <td>${gsiOperatorEscapeHtml(operator.dataInicioAcesso || '-')}</td>
      </tr>
    `).join('');
    return;
  }

  body.innerHTML = filteredOperators.map((operator) => `
    <tr>
      <td><strong>${gsiOperatorEscapeHtml(operator.nome)}</strong></td>
      <td>${gsiOperatorEscapeHtml(operator.cpf)}</td>
      <td>${gsiOperatorEscapeHtml(operator.login)}</td>
      <td>${gsiOperatorEscapeHtml(operator.email)}</td>
      <td>${gsiOperatorEscapeHtml(operator.telefone || '-')}</td>
      <td><span class="badge">${gsiOperatorEscapeHtml(operator.perfil)}</span></td>
      ${config.requiresContract ? `<td>${gsiOperatorEscapeHtml(operator.contratoNome || '-')}</td>` : ''}
      <td>${gsiOperatorEscapeHtml(operator.unidade || '-')}</td>
      <td>${gsiOperatorEscapeHtml(gsiOperatorFormatDateTime(operator.criadoEm))}</td>
      <td><span class="badge">${gsiOperatorEscapeHtml(operator.situacao || 'Ativo')}</span></td>
      <td>${gsiOperatorEscapeHtml(gsiOperatorFormatDateTime(operator.removidoEm))}</td>
      <td>${gsiOperatorEscapeHtml(operator.motivo || '-')}</td>
    </tr>
  `).join('');
}

function gsiOperatorHandleSubmit(event) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Cadastra acesso ativo sob responsabilidade do GSI.
   * PARÂMETROS E RETORNO: Recebe SubmitEvent e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê campos do DOM e grava na chave LocalStorage do escopo atual.
   * TODO: Em produção, criar o usuário via provedor de identidade, enviar senha temporária e registrar auditoria.
   */
  event.preventDefault();

  const feedback = document.getElementById('gsi-operator-feedback');
  const config = gsiOperatorGetAccessConfig();
  const operators = gsiOperatorLoadList(config.storage);
  const rawIdentifier = document.getElementById('gsi-operator-cpf')?.value || '';
  const cpf = gsiOperatorFormatCpf(rawIdentifier);
  const email = gsiOperatorNormalizeText(document.getElementById('gsi-operator-email')?.value || '').toLowerCase();
  const accessStart = document.getElementById('gsi-operator-access-start')?.value || '';
  const loginInput = document.getElementById('gsi-operator-login');
  const passwordInput = document.getElementById('gsi-operator-password');
  const generatedName = document.getElementById('gsi-operator-name')?.value || '';
  const generatedIdentifier = document.getElementById('gsi-operator-cpf')?.value || '';
  const login = loginInput
    ? gsiOperatorNormalizeText(loginInput.value || '').toLowerCase()
    : gsiOperatorBuildGeneratedLogin(generatedName, generatedIdentifier);
  const password = passwordInput?.value || gsiOperatorBuildTemporaryPassword();
  const contractSelect = document.getElementById('gsi-operator-contract');
  const policeSelect = document.getElementById('gsi-operator-police');
  /*
   * DESCRIÇÃO DO BLOCO: Captura a senha temporária apenas para simular a criação de credencial
   * do usuário de acesso no protótipo local.
   * PARÂMETROS E RETORNO: Usa o valor textual do input de senha; não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: A senha temporária é gravada no LocalStorage junto do usuário
   * apenas nesta versão local.
   * TODO: Em produção, nunca salvar senha em texto puro; criar credencial em provedor de identidade
   * com hash seguro, expiração, MFA e troca obrigatória no primeiro acesso.
   */

  if (config.requiresContract && gsiOperatorOnlyDigits(cpf).length !== 11) {
    if (feedback) feedback.textContent = 'Informe um CPF com 11 dígitos.';
    return;
  }

  if (!config.requiresContract && !gsiOperatorNormalizeText(rawIdentifier)) {
    if (feedback) feedback.textContent = 'Selecione um policial com identificação cadastrada.';
    return;
  }

  if (!config.requiresContract && password.length < 6) {
    if (feedback) feedback.textContent = 'Informe uma senha temporária com pelo menos 6 caracteres.';
    return;
  }

  if (!config.requiresContract && policeSelect && !policeSelect.value) {
    if (feedback) feedback.textContent = 'Selecione o policial que terá o acesso administrativo ativado.';
    return;
  }

  if (config.requiresContract && !contractSelect?.value) {
    if (feedback) feedback.textContent = 'Selecione o contrato vinculado a este usuário.';
    return;
  }

  if (config.requiresContract && !accessStart) {
    if (feedback) feedback.textContent = 'Informe a data de início do acesso.';
    return;
  }

  const duplicated = operators.some((operator) => {
    /*
     * DESCRIÇÃO DO BLOCO: Impede credenciais duplicadas no cadastro local de usuários de acesso.
     * PARÂMETROS E RETORNO: Usa cada usuário da lista em memória e retorna booleano para o `some`.
     * ARMAZENAMENTO E PERSISTÊNCIA: Lê apenas o array `operators`; não grava dados neste bloco.
     * TODO: Em produção, validar CPF, email e login no backend com índice único transacional.
     */
    const sameCredentials = operator.cpf === cpf
      || operator.email.toLowerCase() === email
      || (!config.requiresContract && String(operator.login || '').toLowerCase() === login);
    if (!config.requiresContract) return sameCredentials;
    return sameCredentials && operator.contratoId === contractSelect.value;
  });
  if (duplicated) {
    if (feedback) feedback.textContent = config.duplicateMessage;
    return;
  }

  const operator = {
    id: gsiOperatorCreateId(),
    nome: gsiOperatorTitleCase(document.getElementById('gsi-operator-name')?.value || ''),
    cpf,
    email,
    tipoAcesso: config.accessType,
    policialId: !config.requiresContract && policeSelect ? policeSelect.value : '',
    policialOrigem: !config.requiresContract && policeSelect ? policeSelect.options[policeSelect.selectedIndex]?.textContent || '' : '',
    contratoId: config.requiresContract ? contractSelect.value : '',
    contratoNome: config.requiresContract ? contractSelect.options[contractSelect.selectedIndex]?.textContent || '' : '',
    podeGerarVagas: Boolean(config.requiresContract),
    permissoes: config.requiresContract ? ['gerar_vagas'] : [],
    escopoContrato: config.requiresContract ? contractSelect.value : '',
    dataInicioAcesso: config.requiresContract ? accessStart : '',
    criadoEm: new Date().toISOString()
  };

  if (!config.requiresContract) {
    operator.login = login;
    operator.senhaTemporaria = password;
    operator.telefone = gsiOperatorFormatPhone(document.getElementById('gsi-operator-phone')?.value || '');
    operator.perfil = document.getElementById('gsi-operator-profile')?.value || '';
    operator.unidade = gsiOperatorTitleCase(document.getElementById('gsi-operator-unit')?.value || '');
    operator.observacoes = gsiOperatorNormalizeText(document.getElementById('gsi-operator-notes')?.value || '');
  }

  operators.push(operator);
  gsiOperatorSaveList(config.storage, operators);
  gsiOperatorSaveOperationDone({
    title: config.requiresContract ? 'Usuário do contrato adicionado' : 'Acesso administrativo ativado',
    message: config.requiresContract
      ? `${operator.nome} foi autorizado a gerar vagas para ${operator.contratoNome}.`
      : `${operator.nome} foi gravado com sucesso.`,
    primaryHref: config.requiresContract ? 'tabela-acessos-convenio.html' : 'tabela-operadores.html',
    primaryText: config.requiresContract ? 'Ver usuários do contrato' : 'Ver usuários administrativos'
  });
  window.location.href = `operacao-concluida.html?tipo=${config.requiresContract ? 'usuario_contrato_adicionado' : 'usuario_administrativo_adicionado'}`;
}

function gsiOperatorRenderRemoveOptions() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Preenche o select de remoção com acessos ativos cadastrados pelo GSI
   * e atualiza o resumo lateral do usuário selecionado.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê a chave LocalStorage do escopo atual e escreve opções/resumo no DOM.
   * TODO: Em produção, consultar acessos ativos por API e exigir confirmação forte antes de remover.
  */
  const select = document.getElementById('gsi-operator-remove-id');
  if (!select) return;

  const config = gsiOperatorGetAccessConfig();
  const currentValue = select.value;
  const search = gsiOperatorNormalizeText(document.getElementById('gsi-operator-remove-search')?.value || '').toLowerCase();
  const operators = gsiOperatorLoadList(config.storage).filter((operator) => {
    /*
     * DESCRIÇÃO DO BLOCO: Filtra a remoção pelo texto digitado pelo GSI, priorizando nome e
     * identificação funcional/RG, mas aceitando login e email como apoio.
     * PARÂMETROS E RETORNO: Usa cada usuário em memória e retorna booleano para manter/remover da lista.
     * ARMAZENAMENTO E PERSISTÊNCIA: Lê apenas a lista ativa do LocalStorage já carregada; não grava dados.
     * TODO: Em produção, consultar no backend com busca indexada e paginação para bases grandes.
     */
    const haystack = [
      operator.nome,
      operator.cpf,
      operator.policialOrigem,
      operator.login,
      operator.email,
      operator.unidade
    ].join(' ').toLowerCase();
    return !search || haystack.includes(search);
  });
  select.innerHTML = `<option value="">${gsiOperatorEscapeHtml(config.selectLabel)}</option>`;
  operators.forEach((operator) => {
    const option = document.createElement('option');
    option.value = operator.id;
    option.textContent = config.requiresContract
      ? [operator.nome, operator.cpf, operator.contratoNome].filter(Boolean).join(' - ')
      : [operator.nome, operator.login || operator.cpf, operator.contratoNome, operator.perfil].filter(Boolean).join(' - ');
    select.appendChild(option);
  });
  select.value = operators.some((operator) => operator.id === currentValue) ? currentValue : '';
  gsiOperatorApplyRemoveSummary();
}

function gsiOperatorApplyRemoveSummary() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Exibe em card os dados do usuário administrativo selecionado para remoção,
   * usando o mesmo padrão visual do cadastro por seleção.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê `cproeis_gsi_operadores_sistema` ou a chave do escopo atual;
   * não grava dados.
   * TODO: Em produção, buscar o registro por ID no backend e exibir status de sessão ativa antes da remoção.
   */
  const select = document.getElementById('gsi-operator-remove-id');
  const summary = document.getElementById('gsi-operator-remove-summary');
  if (!select || !summary) return;

  const config = gsiOperatorGetAccessConfig();
  const selected = gsiOperatorLoadList(config.storage).find((operator) => operator.id === select.value) || null;

  summary.innerHTML = selected
    ? `
      <strong class="gsi-summary-name">${gsiOperatorEscapeHtml(selected.nome || 'Usuário selecionado')}</strong>
      <span><b>Identificação</b>${gsiOperatorEscapeHtml(selected.cpf || '-')}</span>
      <span><b>Email</b>${gsiOperatorEscapeHtml(selected.email || '-')}</span>
      <span><b>Perfil</b>${gsiOperatorEscapeHtml(selected.perfil || selected.tipoAcesso || '-')}</span>
      <span><b>Unidade</b>${gsiOperatorEscapeHtml(selected.unidade || '-')}</span>
    `
    : 'Selecione um usuário administrativo para conferir os dados antes de remover.';
}

function gsiOperatorRenderRemovedHistory() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Renderiza o histórico local de usuários de acesso removidos pelo GSI.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê a chave de removidos do escopo atual; escreve somente no DOM.
   * TODO: Em produção, substituir por trilha de auditoria imutável no servidor.
   */
  const body = document.getElementById('gsi-operator-removed-body');
  const count = document.getElementById('gsi-operator-removed-count');
  if (!body) return;

  const config = gsiOperatorGetAccessConfig();
  const removed = gsiOperatorLoadList(config.removedStorage);
  if (count) count.textContent = `${removed.length} remoção(ões) registrada(s).`;

  if (!removed.length) {
    body.innerHTML = `<tr><td class="empty" colspan="${config.requiresContract ? 6 : 7}">Nenhuma remoção registrada.</td></tr>`;
    return;
  }

  if (config.requiresContract) {
    body.innerHTML = removed.map((entry) => `
      <tr>
        <td><strong>${gsiOperatorEscapeHtml(entry.nome)}</strong></td>
        <td>${gsiOperatorEscapeHtml(entry.cpf)}</td>
        <td>${gsiOperatorEscapeHtml(entry.email)}</td>
        <td>${gsiOperatorEscapeHtml(entry.contratoNome || '-')}</td>
        <td>${gsiOperatorEscapeHtml(gsiOperatorFormatDateTime(entry.removidoEm))}</td>
        <td>${gsiOperatorEscapeHtml(entry.motivo || '-')}</td>
      </tr>
    `).join('');
    return;
  }

  body.innerHTML = removed.map((entry) => `
    <tr>
      <td><strong>${gsiOperatorEscapeHtml(entry.nome)}</strong></td>
      <td>${gsiOperatorEscapeHtml(entry.cpf)}</td>
      <td>${gsiOperatorEscapeHtml(entry.login || '-')}</td>
      <td>${gsiOperatorEscapeHtml(entry.email)}</td>
      <td>${gsiOperatorEscapeHtml(entry.perfil)}</td>
      ${config.requiresContract ? `<td>${gsiOperatorEscapeHtml(entry.contratoNome || '-')}</td>` : ''}
      <td>${gsiOperatorEscapeHtml(gsiOperatorFormatDateTime(entry.removidoEm))}</td>
      <td>${gsiOperatorEscapeHtml(entry.motivo || '-')}</td>
    </tr>
  `).join('');
}

function gsiOperatorHandleRemove(event) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Remove um usuário de acesso da lista ativa e registra histórico local da remoção.
   * PARÂMETROS E RETORNO: Recebe SubmitEvent e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Atualiza a lista ativa e o histórico de removidos do escopo atual no LocalStorage.
   * TODO: Em produção, inativar usuário via backend sem apagar o registro principal e registrar executor.
   */
  event.preventDefault();

  const feedback = document.getElementById('gsi-operator-remove-feedback');
  const selectedId = document.getElementById('gsi-operator-remove-id')?.value || '';
  const reason = gsiOperatorNormalizeText(document.getElementById('gsi-operator-remove-reason')?.value || '');
  const config = gsiOperatorGetAccessConfig();
  const operators = gsiOperatorLoadList(config.storage);
  const selectedOperator = operators.find((operator) => operator.id === selectedId);

  if (!selectedOperator) {
    if (feedback) feedback.textContent = `Selecione um ${config.singular} cadastrado.`;
    return;
  }

  const removed = gsiOperatorLoadList(config.removedStorage);
  removed.unshift({
    ...selectedOperator,
    motivo: reason,
    removidoEm: new Date().toISOString()
  });

  gsiOperatorSaveList(config.storage, operators.filter((operator) => operator.id !== selectedId));
  gsiOperatorSaveList(config.removedStorage, removed);
  gsiOperatorSaveOperationDone({
    title: config.requiresContract ? 'Usuário do contrato removido' : 'Acesso administrativo removido',
    message: `${selectedOperator.nome} foi removido da lista ativa.`,
    primaryHref: config.requiresContract ? 'tabela-acessos-convenio.html' : 'tabela-operadores.html',
    primaryText: config.requiresContract ? 'Ver usuários do contrato' : 'Ver usuários administrativos'
  });
  window.location.href = `operacao-concluida.html?tipo=${config.requiresContract ? 'usuario_contrato_removido' : 'usuario_administrativo_removido'}`;
}

function gsiOperatorInitPage() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Inicializa a página atual de usuários de acesso do GSI conforme o atributo
   * `data-gsi-operator-page` presente no body.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Conecta eventos do DOM; as funções chamadas leem/gravam LocalStorage.
   * TODO: Em produção, trocar roteamento por aplicação autenticada com guarda de permissão por página.
   */
  const page = document.body?.dataset.gsiOperatorPage || '';

  if (page === 'cadastro') {
    gsiOperatorRenderPoliceOptions();
    gsiOperatorRenderContractOptions();
    document.getElementById('gsi-operator-form')?.addEventListener('submit', gsiOperatorHandleSubmit);
    document.getElementById('gsi-operator-cpf')?.addEventListener('blur', (event) => {
      event.target.value = gsiOperatorFormatCpf(event.target.value);
    });
    document.getElementById('gsi-operator-phone')?.addEventListener('blur', (event) => {
      event.target.value = gsiOperatorFormatPhone(event.target.value);
    });
  }

  if (page === 'tabela') {
    gsiOperatorEnsureDefaultStatusFilter();
    ['gsi-operator-search', 'gsi-operator-profile-filter', 'gsi-operator-status-filter'].forEach((id) => {
      document.getElementById(id)?.addEventListener('input', gsiOperatorRenderTable);
      document.getElementById(id)?.addEventListener('change', gsiOperatorRenderTable);
    });
    gsiOperatorRenderTable();
  }

  if (page === 'remover') {
    document.getElementById('gsi-operator-remove-form')?.addEventListener('submit', gsiOperatorHandleRemove);
    document.getElementById('gsi-operator-remove-search')?.addEventListener('input', gsiOperatorRenderRemoveOptions);
    document.getElementById('gsi-operator-remove-id')?.addEventListener('change', gsiOperatorApplyRemoveSummary);
    gsiOperatorRenderRemoveOptions();
    gsiOperatorRenderRemovedHistory();
  }
}

gsiOperatorInitPage();
