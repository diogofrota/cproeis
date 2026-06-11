const GSI_USERS_STORAGE = 'cproeis_gsi_usuarios_sistema';
const GSI_REMOVED_USERS_STORAGE = 'cproeis_gsi_usuarios_removidos';

function gsiUserLoadList(key) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Lê uma lista JSON usada pela gestão de usuários do GSI.
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

function gsiUserSaveList(key, value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Persiste uma lista da gestão de usuários do GSI.
   * PARÂMETROS E RETORNO: Recebe key como string e value como array; não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Grava LocalStorage na chave informada.
   * TODO: Em produção, trocar por API transacional com auditoria, controle de concorrência e criptografia.
   */
  localStorage.setItem(key, JSON.stringify(value));
}

function gsiUserOnlyDigits(value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Remove caracteres não numéricos de CPF e telefone.
   * PARÂMETROS E RETORNO: Recebe value como string/número e retorna string somente com dígitos.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava dados; transforma valor em memória.
   * TODO: Em produção, repetir normalização e validação no backend.
   */
  return String(value || '').replace(/\D/g, '');
}

function gsiUserNormalizeText(value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Normaliza espaços em textos digitados nos formulários de usuários.
   * PARÂMETROS E RETORNO: Recebe value como string e retorna string sem espaços duplicados.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não acessa LocalStorage; atua somente em memória.
   * TODO: Em produção, padronizar normalização em serviço compartilhado entre frontend e backend.
   */
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function gsiUserTitleCase(value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Padroniza nomes e unidades com primeira letra maiúscula por palavra.
   * PARÂMETROS E RETORNO: Recebe value como string e retorna texto formatado para exibição.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; o retorno pode ser persistido no cadastro.
   * TODO: Em produção, respeitar grafias oficiais vindas de diretório corporativo.
   */
  return gsiUserNormalizeText(value).toLowerCase().replace(/(^|\s)(\S)/g, (match) => match.toUpperCase());
}

function gsiUserFormatCpf(value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Aplica máscara visual de CPF.
   * PARÂMETROS E RETORNO: Recebe value como string/número e retorna CPF no padrão 000.000.000-00
   * quando houver 11 dígitos; caso contrário retorna o valor original.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; usado para exibição e normalização de input.
   * TODO: Em produção, validar CPF oficialmente no backend antes de conceder acesso.
   */
  const digits = gsiUserOnlyDigits(value).slice(0, 11);
  if (digits.length !== 11) return digits;
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function gsiUserFormatPhone(value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Aplica máscara visual simples de telefone brasileiro.
   * PARÂMETROS E RETORNO: Recebe value como string/número e retorna telefone formatado quando
   * houver 10 ou 11 dígitos.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; usado para exibição do contato.
   * TODO: Em produção, validar DDD e canais oficiais de contato em cadastro centralizado.
   */
  const digits = gsiUserOnlyDigits(value).slice(0, 11);
  if (digits.length === 11) return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  if (digits.length === 10) return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  return digits;
}

function gsiUserEscapeHtml(value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Escapa conteúdo textual antes de inserir na tabela de usuários.
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

function gsiUserFormatDateTime(value) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Formata data ISO de cadastro ou remoção para leitura administrativa.
   * PARÂMETROS E RETORNO: Recebe value como string ISO e retorna data/hora pt-BR ou hífen.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; usa valor já persistido no LocalStorage.
   * TODO: Em produção, exibir fuso oficial do servidor e usuário executor da ação.
   */
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function gsiUserCreateId() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Gera identificador local para usuário cadastrado no protótipo.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e retorna string única o suficiente para LocalStorage.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não grava dados; o ID é persistido posteriormente no usuário.
   * TODO: Em produção, usar identificador gerado pelo banco ou provedor de identidade.
   */
  return `gsi-user-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function gsiUserGetFilteredUsers() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Aplica filtros da tabela de usuários do GSI.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e retorna array filtrado.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê `cproeis_gsi_usuarios_sistema` no LocalStorage e campos do DOM.
   * TODO: Em produção, mover filtros para consulta paginada no servidor.
   */
  const users = gsiUserLoadList(GSI_USERS_STORAGE);
  const search = gsiUserNormalizeText(document.getElementById('gsi-user-search')?.value || '').toLowerCase();
  const profile = document.getElementById('gsi-user-profile-filter')?.value || '';
  const module = document.getElementById('gsi-user-module-filter')?.value || '';

  return users.filter((user) => {
    const haystack = [
      user.nome,
      user.cpf,
      user.email,
      user.telefone,
      user.perfil,
      user.modulo,
      user.unidade
    ].join(' ').toLowerCase();
    const matchesSearch = !search || haystack.includes(search);
    const matchesProfile = !profile || user.perfil === profile;
    const matchesModule = !module || user.modulo === module;
    return matchesSearch && matchesProfile && matchesModule;
  });
}

function gsiUserRenderTable() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Renderiza a tabela de usuários ativos cadastrados pelo GSI.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê `cproeis_gsi_usuarios_sistema`; escreve somente no DOM.
   * TODO: Em produção, adicionar paginação, ordenação oficial e trilha de auditoria por alteração.
   */
  const body = document.getElementById('gsi-user-table-body');
  const count = document.getElementById('gsi-user-count');
  if (!body) return;

  const filteredUsers = gsiUserGetFilteredUsers();
  const total = gsiUserLoadList(GSI_USERS_STORAGE).length;
  if (count) count.textContent = `${filteredUsers.length} usuário(s) exibido(s) de ${total} cadastrado(s).`;

  if (!filteredUsers.length) {
    body.innerHTML = '<tr><td class="empty" colspan="8">Nenhum usuário cadastrado pelo GSI.</td></tr>';
    return;
  }

  body.innerHTML = filteredUsers.map((user) => `
    <tr>
      <td><strong>${gsiUserEscapeHtml(user.nome)}</strong></td>
      <td>${gsiUserEscapeHtml(user.cpf)}</td>
      <td>${gsiUserEscapeHtml(user.email)}</td>
      <td>${gsiUserEscapeHtml(user.telefone || '-')}</td>
      <td><span class="badge">${gsiUserEscapeHtml(user.perfil)}</span></td>
      <td>${gsiUserEscapeHtml(user.modulo)}</td>
      <td>${gsiUserEscapeHtml(user.unidade || '-')}</td>
      <td>${gsiUserEscapeHtml(gsiUserFormatDateTime(user.criadoEm))}</td>
    </tr>
  `).join('');
}

function gsiUserHandleSubmit(event) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Cadastra usuário ativo para acesso ao sistema sob responsabilidade do GSI.
   * PARÂMETROS E RETORNO: Recebe SubmitEvent e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê campos do DOM e grava `cproeis_gsi_usuarios_sistema` no LocalStorage.
   * TODO: Em produção, criar usuário via provedor de identidade, enviar senha temporária e registrar auditoria.
   */
  event.preventDefault();

  const feedback = document.getElementById('gsi-user-feedback');
  const users = gsiUserLoadList(GSI_USERS_STORAGE);
  const cpf = gsiUserFormatCpf(document.getElementById('gsi-user-cpf')?.value || '');
  const email = gsiUserNormalizeText(document.getElementById('gsi-user-email')?.value || '').toLowerCase();

  if (gsiUserOnlyDigits(cpf).length !== 11) {
    if (feedback) feedback.textContent = 'Informe um CPF com 11 dígitos.';
    return;
  }

  const duplicated = users.some((user) => user.cpf === cpf || user.email.toLowerCase() === email);
  if (duplicated) {
    if (feedback) feedback.textContent = 'Já existe usuário cadastrado com este CPF ou email.';
    return;
  }

  const user = {
    id: gsiUserCreateId(),
    nome: gsiUserTitleCase(document.getElementById('gsi-user-name')?.value || ''),
    cpf,
    email,
    telefone: gsiUserFormatPhone(document.getElementById('gsi-user-phone')?.value || ''),
    perfil: document.getElementById('gsi-user-profile')?.value || '',
    modulo: document.getElementById('gsi-user-module')?.value || '',
    unidade: gsiUserTitleCase(document.getElementById('gsi-user-unit')?.value || ''),
    observacoes: gsiUserNormalizeText(document.getElementById('gsi-user-notes')?.value || ''),
    criadoEm: new Date().toISOString()
  };

  users.push(user);
  gsiUserSaveList(GSI_USERS_STORAGE, users);
  event.target.reset();
  if (feedback) feedback.textContent = 'Usuário cadastrado pelo GSI.';
}

function gsiUserRenderRemoveOptions() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Preenche o select de remoção com usuários ativos cadastrados pelo GSI.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê `cproeis_gsi_usuarios_sistema` e escreve opções no DOM.
   * TODO: Em produção, consultar usuários ativos por API e exigir confirmação forte antes de remover.
   */
  const select = document.getElementById('gsi-user-remove-id');
  if (!select) return;

  const users = gsiUserLoadList(GSI_USERS_STORAGE);
  select.innerHTML = '<option value="">Selecione o usuário</option>';
  users.forEach((user) => {
    const option = document.createElement('option');
    option.value = user.id;
    option.textContent = `${user.nome} - ${user.cpf} - ${user.perfil}`;
    select.appendChild(option);
  });
}

function gsiUserRenderRemovedHistory() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Renderiza o histórico local de usuários removidos pelo GSI.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê `cproeis_gsi_usuarios_removidos`; escreve somente no DOM.
   * TODO: Em produção, substituir por trilha de auditoria imutável no servidor.
   */
  const body = document.getElementById('gsi-user-removed-body');
  const count = document.getElementById('gsi-user-removed-count');
  if (!body) return;

  const removed = gsiUserLoadList(GSI_REMOVED_USERS_STORAGE);
  if (count) count.textContent = `${removed.length} remoção(ões) registrada(s).`;

  if (!removed.length) {
    body.innerHTML = '<tr><td class="empty" colspan="6">Nenhuma remoção registrada.</td></tr>';
    return;
  }

  body.innerHTML = removed.map((entry) => `
    <tr>
      <td><strong>${gsiUserEscapeHtml(entry.nome)}</strong></td>
      <td>${gsiUserEscapeHtml(entry.cpf)}</td>
      <td>${gsiUserEscapeHtml(entry.email)}</td>
      <td>${gsiUserEscapeHtml(entry.perfil)}</td>
      <td>${gsiUserEscapeHtml(gsiUserFormatDateTime(entry.removidoEm))}</td>
      <td>${gsiUserEscapeHtml(entry.motivo || '-')}</td>
    </tr>
  `).join('');
}

function gsiUserHandleRemove(event) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Remove um usuário da lista ativa e registra histórico local da remoção.
   * PARÂMETROS E RETORNO: Recebe SubmitEvent e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Atualiza `cproeis_gsi_usuarios_sistema` e grava histórico em
   * `cproeis_gsi_usuarios_removidos` no LocalStorage.
   * TODO: Em produção, inativar usuário via backend sem apagar o registro principal e registrar executor.
   */
  event.preventDefault();

  const feedback = document.getElementById('gsi-user-remove-feedback');
  const selectedId = document.getElementById('gsi-user-remove-id')?.value || '';
  const reason = gsiUserNormalizeText(document.getElementById('gsi-user-remove-reason')?.value || '');
  const users = gsiUserLoadList(GSI_USERS_STORAGE);
  const selectedUser = users.find((user) => user.id === selectedId);

  if (!selectedUser) {
    if (feedback) feedback.textContent = 'Selecione um usuário cadastrado.';
    return;
  }

  const removed = gsiUserLoadList(GSI_REMOVED_USERS_STORAGE);
  removed.unshift({
    ...selectedUser,
    motivo: reason,
    removidoEm: new Date().toISOString()
  });

  gsiUserSaveList(GSI_USERS_STORAGE, users.filter((user) => user.id !== selectedId));
  gsiUserSaveList(GSI_REMOVED_USERS_STORAGE, removed);
  event.target.reset();
  if (feedback) feedback.textContent = 'Usuário removido da lista ativa.';
  gsiUserRenderRemoveOptions();
  gsiUserRenderRemovedHistory();
}

function gsiUserInitPage() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Inicializa a página atual de usuários do GSI conforme o atributo
   * `data-gsi-user-page` presente no body.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Conecta eventos do DOM; as funções chamadas leem/gravam LocalStorage.
   * TODO: Em produção, trocar roteamento por aplicação autenticada com guarda de permissão por página.
   */
  const page = document.body?.dataset.gsiUserPage || '';

  if (page === 'cadastro') {
    document.getElementById('gsi-user-form')?.addEventListener('submit', gsiUserHandleSubmit);
    document.getElementById('gsi-user-cpf')?.addEventListener('blur', (event) => {
      event.target.value = gsiUserFormatCpf(event.target.value);
    });
    document.getElementById('gsi-user-phone')?.addEventListener('blur', (event) => {
      event.target.value = gsiUserFormatPhone(event.target.value);
    });
  }

  if (page === 'tabela') {
    ['gsi-user-search', 'gsi-user-profile-filter', 'gsi-user-module-filter'].forEach((id) => {
      document.getElementById(id)?.addEventListener('input', gsiUserRenderTable);
      document.getElementById(id)?.addEventListener('change', gsiUserRenderTable);
    });
    gsiUserRenderTable();
  }

  if (page === 'remover') {
    document.getElementById('gsi-user-remove-form')?.addEventListener('submit', gsiUserHandleRemove);
    gsiUserRenderRemoveOptions();
    gsiUserRenderRemovedHistory();
  }
}

gsiUserInitPage();
