const P1_SERVICOS_LIST_KEYS = {
  servicos: 'cproeis_p1_unidade_servicos'
};

/**
 * DESCRIÇÃO DA FUNÇÃO: Lê serviços da P/1 salvos no LocalStorage.
 * PARÂMETROS E RETORNO: Recebe `key` (string) e retorna Array<object>.
 * ARMAZENAMENTO E PERSISTÊNCIA: Lê cproeis_p1_unidade_servicos no LocalStorage.
 * TODO: Em produção, substituir por API paginada e filtrada por unidade.
 */
function p1ServicosReadList(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    return [];
  }
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Escapa valores antes de renderizar a tabela de serviços.
 * PARÂMETROS E RETORNO: Recebe `value` (qualquer valor simples) e retorna string segura.
 * ARMAZENAMENTO E PERSISTÊNCIA: Não lê nem grava dados; protege apenas renderização.
 * TODO: Em produção, manter sanitização no backend e política CSP.
 */
function p1ServicosEscapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/**
 * DESCRIÇÃO DA FUNÇÃO: Renderiza os serviços da unidade logada na tabela.
 * PARÂMETROS E RETORNO: Não recebe parâmetros nem retorna valor.
 * ARMAZENAMENTO E PERSISTÊNCIA: Lê cproeis_p1_unidade_servicos e sessão P/1 no LocalStorage.
 * TODO: Em produção, adicionar filtros, paginação e ações de edição/exclusão auditáveis.
 */
function p1ServicosRender() {
  const context = p1UnitResolveSession();
  const body = document.getElementById('p1-servicos-body');
  const count = document.getElementById('p1-servicos-count');
  if (!body || !count) return;

  if (!context) {
    count.textContent = 'Acesso P/1 não autorizado.';
    body.innerHTML = '<tr><td class="empty-row" colspan="5">Selecione um responsável P/1 ativo para listar serviços.</td></tr>';
    return;
  }

  const servicos = p1ServicosReadList(P1_SERVICOS_LIST_KEYS.servicos)
    .filter((servico) => servico.unidade === context.acesso.unidade)
    .sort((a, b) => String(a.nomeServico || '').localeCompare(String(b.nomeServico || ''), 'pt-BR'));

  count.textContent = `${servicos.length} serviços cadastrados para a unidade.`;

  if (!servicos.length) {
    body.innerHTML = '<tr><td class="empty-row" colspan="5">Nenhum serviço cadastrado para a unidade.</td></tr>';
    return;
  }

  body.innerHTML = servicos.map((servico) => `
    <tr>
      <td><strong>${p1ServicosEscapeHtml(servico.nomeServico)}</strong></td>
      <td>${p1ServicosEscapeHtml(servico.localServico || '-')}</td>
      <td>${p1ServicosEscapeHtml(servico.classePadrao || '-')}</td>
      <td>${p1ServicosEscapeHtml(servico.status || '-')}</td>
      <td><a class="login-action" href="criar-vagas.html?id=${encodeURIComponent(p1UnitGetPolicialKeys(context.policial)[0] || context.acesso.policialId || '')}&unidade=${encodeURIComponent(context.acesso.unidade || '')}&servico=${encodeURIComponent(servico.id)}">Criar vagas</a></td>
    </tr>
  `).join('');
}

document.addEventListener('DOMContentLoaded', p1ServicosRender);
