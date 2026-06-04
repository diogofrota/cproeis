const P1_ACCESS_KEYS = {
  policiais: 'cproeis_cadastro_policiais',
  acessosP1: 'cproeis_ras_acessos_p1'
};

/**
 * DESCRIÇÃO DA FUNÇÃO: Lê listas do LocalStorage necessárias para a tela administrativa da P/1.
 * PARÂMETROS E RETORNO: Recebe `key` (string) e retorna Array<object>.
 * ARMAZENAMENTO E PERSISTÊNCIA: Lê cproeis_cadastro_policiais e cproeis_ras_acessos_p1 no
 * LocalStorage; não grava dados.
 * TODO: Em produção, trocar por API autenticada com paginação e controle de perfil administrativo.
 */
function p1AccessReadList(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    return [];
  }
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Escapa valores antes de renderizar a tabela de vínculos P/1 RAS.
 * PARÂMETROS E RETORNO: Recebe `value` (qualquer valor simples) e retorna string segura para HTML.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava dados; apenas protege a renderização.
 * TODO: Em produção, manter codificação também nas respostas retornadas pela API.
 */
function p1AccessEscapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Retorna identificador local do policial para cruzar cadastro e vínculo.
 * PARÂMETROS E RETORNO: Recebe `policial` (object) e retorna string.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não acessa armazenamento; usa objeto carregado em memória.
 * TODO: Em produção, usar chave primária oficial do banco de dados.
 */
function p1AccessGetPolicialId(policial) {
  return String(policial?.id || policial?.rg || policial?.matricula || policial?.nomeCompleto || '').trim();
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Monta todas as chaves locais possíveis para encontrar um policial no
 * cadastro, mantendo compatibilidade com registros antigos que gravaram RG em vez de ID.
 * PARÂMETROS E RETORNO: Recebe `policial` (object) e retorna Array<string> sem valores vazios.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava dados; utiliza apenas o objeto já carregado em memória.
 * TODO: Em produção, substituir esta compatibilidade por chave estrangeira única no banco de dados.
 */
function p1AccessGetPolicialKeys(policial) {
  return [policial?.id, policial?.rg, policial?.matricula, policial?.nomeCompleto, policial?.nomeGuerra]
    .filter(Boolean)
    .map((value) => String(value).trim());
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Busca o policial do cadastro relacionado ao vínculo ativo.
 * PARÂMETROS E RETORNO: Recebe `policiais` (Array<object>) e `acesso` (object); retorna object|null.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava dados; cruza arrays carregados do LocalStorage.
 * TODO: Em produção, retornar essa relação já resolvida pelo backend.
 */
function p1AccessFindPolicial(policiais, acesso) {
  const accessKeys = [acesso?.policialId, acesso?.rg, acesso?.nomePolicial]
    .filter(Boolean)
    .map((value) => String(value).trim());

  return policiais.find((policial) => (
    p1AccessGetPolicialKeys(policial).some((key) => accessKeys.includes(key))
  )) || null;
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Formata data ISO para exibição na tabela de vínculos ativos.
 * PARÂMETROS E RETORNO: Recebe `dateValue` (string) e retorna data local ou hífen.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não acessa armazenamento; transforma apenas valor recebido.
 * TODO: Em produção, centralizar timezone e formatação em utilitário compartilhado.
 */
function p1AccessFormatDate(dateValue) {
  if (!dateValue) return '-';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleDateString('pt-BR');
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Renderiza a lista de policiais com vínculo ativo para login administrativo
 * na operação RAS da P/1.
 * PARÂMETROS E RETORNO: Não recebe parâmetros nem retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Lê cproeis_ras_acessos_p1 e cproeis_cadastro_policiais no
 * LocalStorage; não grava dados.
 * TODO: Em produção, validar login administrativo por credencial própria, registrar auditoria e
 * não depender de query string para autorização.
 */
function p1AccessRender() {
  const body = document.getElementById('p1-access-body');
  const count = document.getElementById('p1-access-count');
  const policiais = p1AccessReadList(P1_ACCESS_KEYS.policiais);
  const acessos = p1AccessReadList(P1_ACCESS_KEYS.acessosP1)
    .filter((acesso) => acesso.status === 'ativo' && !acesso.dataSaida)
    .sort((a, b) => String(a.unidade || '').localeCompare(String(b.unidade || ''), 'pt-BR'));

  count.textContent = `${acessos.length} vínculos ativos encontrados.`;

  if (!acessos.length) {
    body.innerHTML = '<tr><td class="empty-row" colspan="6">Nenhum policial vinculado à P/1 RAS.</td></tr>';
    return;
  }

  body.innerHTML = acessos.map((acesso) => {
    const policial = p1AccessFindPolicial(policiais, acesso);
    const id = encodeURIComponent(policial?.id || acesso.policialId || '');
    const unidade = encodeURIComponent(acesso.unidade || policial?.unidade || '');

    return `
      <tr>
        <td><strong>${p1AccessEscapeHtml(acesso.unidade || '-')}</strong></td>
        <td>${p1AccessEscapeHtml(acesso.nomePolicial || policial?.nomeCompleto || policial?.nomeGuerra || '-')}</td>
        <td>${p1AccessEscapeHtml(acesso.rg || policial?.rg || '-')}</td>
        <td>${p1AccessEscapeHtml(acesso.postoGraduacao || policial?.postoGraduacao || '-')}</td>
        <td>${p1AccessEscapeHtml(p1AccessFormatDate(acesso.dataEntrada || acesso.criadoEm))}</td>
        <td><a class="login-action" href="operacao.html?id=${id}&unidade=${unidade}">Logar</a></td>
      </tr>
    `;
  }).join('');
}

document.addEventListener('DOMContentLoaded', p1AccessRender);
