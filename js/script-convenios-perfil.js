const CONVENIO_PROFILE_CONTRACTS = 'cproeis_contratos_convenios';
const CONVENIO_PROFILE_CURRENT = 'cproeis_convenio_atual';
const CONVENIO_PROFILE_CURRENT_RESPONSAVEL = 'cproeis_convenio_responsavel_atual';

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Lê listas JSON do LocalStorage com retorno seguro para array vazio.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} key - Chave do LocalStorage consultada.
 * @returns {Array<object>} Lista persistida ou array vazio.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê LocalStorage; não grava dados.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: substituir por endpoint autenticado do responsável quando o módulo estiver online.
 */
function convenioProfileLoadList(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    return [];
  }
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Escapa valores renderizados em HTML na ficha do responsável.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} value - Valor que será exibido.
 * @returns {string} Texto seguro para interpolação.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não lê nem grava dados; apenas transforma o valor recebido.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: manter escape também em dados vindos da API para defesa em profundidade.
 */
function convenioProfileEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Formata datas ISO e valores vazios para a ficha somente leitura.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} value - Valor textual ou data YYYY-MM-DD.
 * @returns {string} Valor pronto para exibição.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não acessa armazenamento; apenas formata o valor recebido.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: centralizar formatação de data em utilitário compartilhado.
 */
function convenioProfileFormat(value) {
  if (!value) return '-';
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [year, month, day] = value.slice(0, 10).split('-');
    return `${day}/${month}/${year}`;
  }
  return String(value);
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Aplica máscara simples de CPF para visualização do responsável.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} value - CPF com ou sem pontuação.
 * @returns {string} CPF formatado ou hífen.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; usa apenas o valor recebido.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: validar documento no backend e aplicar mascaramento conforme perfil de acesso.
 */
function convenioProfileFormatCpf(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 11);
  if (!digits) return '-';
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Aplica máscara simples de telefone para visualização.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} value - Telefone com ou sem pontuação.
 * @returns {string} Telefone formatado ou hífen.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; transforma o valor recebido.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: permitir ramais e validações corporativas no cadastro online.
 */
function convenioProfileFormatPhone(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 11);
  if (!digits) return '-';
  if (digits.length <= 10) {
    return digits.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
  }
  return digits.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Resolve o convênio e o responsável logado no acesso do convênio.
 *
 * PARÂMETROS E RETORNO:
 * @returns {{convenio: object|null, responsavel: object|null}} Dados ativos da sessão local.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê URL, `cproeis_convenio_atual`, `cproeis_convenio_responsavel_atual` e `cproeis_contratos_convenios`.
 * Grava a sessão local quando a URL traz identificadores válidos.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: trocar esta resolução por sessão autenticada e autorização no backend.
 */
function convenioProfileGetSession() {
  const params = new URLSearchParams(window.location.search);
  const urlConvenioId = params.get('id') || '';
  const urlResponsavel = params.get('responsavel') || '';
  const convenioId = urlConvenioId || localStorage.getItem(CONVENIO_PROFILE_CURRENT) || '';
  const responsavelId = urlResponsavel || localStorage.getItem(CONVENIO_PROFILE_CURRENT_RESPONSAVEL) || '';
  const convenio = convenioProfileLoadList(CONVENIO_PROFILE_CONTRACTS).find((item) => item.id === convenioId) || null;
  const responsavel = (convenio?.responsaveis || []).find((item) => {
    const ids = [item.id, item.cpf, item.nome].filter(Boolean).map(String);
    return ids.includes(responsavelId);
  }) || null;

  if (convenio && urlConvenioId) localStorage.setItem(CONVENIO_PROFILE_CURRENT, convenio.id);
  if (responsavel && urlResponsavel) {
    localStorage.setItem(CONVENIO_PROFILE_CURRENT_RESPONSAVEL, responsavel.id || responsavel.cpf || responsavel.nome || '');
  }

  return { convenio, responsavel };
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Renderiza uma ficha no padrão textual dos detalhes do policial.
 *
 * PARÂMETROS E RETORNO:
 * @param {string} targetId - ID do contêiner de destino.
 * @param {Array<Array<string>>} fields - Pares de rótulo e valor.
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados; escreve somente no DOM.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: transformar este padrão em componente compartilhado para perfis e contratos.
 */
function convenioProfileRenderDetails(targetId, fields) {
  const target = document.getElementById(targetId);
  if (!target) return;

  target.innerHTML = fields.map(([label, value]) => `
    <div class="detail-item">
      <span>${convenioProfileEscape(label)}</span>
      <strong>${convenioProfileEscape(convenioProfileFormat(value))}</strong>
    </div>
  `).join('');
}

/**
 * DESCRIÇÃO DA FUNÇÃO:
 * Inicializa o perfil somente leitura do responsável do convênio.
 *
 * PARÂMETROS E RETORNO:
 * @returns {void}
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Lê convênio e responsável do LocalStorage/URL; não altera o contrato nem o usuário.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: carregar foto, matrícula corporativa e trilha de acesso quando houver autenticação real.
 */
function convenioProfileInit() {
  const { convenio, responsavel } = convenioProfileGetSession();
  const hint = document.getElementById('responsavel-profile-hint');

  if (!convenio || !responsavel) {
    if (hint) hint.textContent = 'Responsável não encontrado. Acesse novamente pelo login do convênio.';
    convenioProfileRenderDetails('responsavel-profile-grid', [['Status', 'Responsável não encontrado']]);
    convenioProfileRenderDetails('responsavel-contract-grid', [['Convênio', convenio?.nome || '-']]);
    return;
  }

  convenioProfileRenderDetails('responsavel-profile-grid', [
    ['Nome', responsavel.nome],
    ['CPF', convenioProfileFormatCpf(responsavel.cpf)],
    ['E-mail', String(responsavel.email || '').toLowerCase()],
    ['Telefone', convenioProfileFormatPhone(responsavel.telefone)],
    ['Funções de acesso', Array.isArray(responsavel.funcoes) ? responsavel.funcoes.join(', ') : responsavel.funcao],
    ['Início do vínculo', responsavel.inicio],
    ['Fim do vínculo', responsavel.fim],
    ['Situação', responsavel.fim && responsavel.fim < new Date().toISOString().slice(0, 10) ? 'Vencido' : 'Ativo']
  ]);

  convenioProfileRenderDetails('responsavel-contract-grid', [
    ['Convênio', convenio.nome],
    ['Contrato', convenio.numero],
    ['Vigência do contrato', `${convenioProfileFormat(convenio.inicio)} até ${convenioProfileFormat(convenio.fim)}`],
    ['Tipo de conveniado', convenio.tipoConveniado],
    ['CNPJ', convenio.cnpj],
    ['Responsável logado', responsavel.nome]
  ]);
}

convenioProfileInit();
