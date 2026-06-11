const GSI_OPERATION_DONE_STORAGE = 'cproeis_gsi_operacao_concluida';

function gsiOperationDoneReadPayload() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Recupera os dados da última operação de acesso finalizada no GSI.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e retorna objeto JSON ou null.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê sessionStorage em `cproeis_gsi_operacao_concluida`.
   * TODO: Em produção, ler o protocolo retornado pela API e buscar o resumo oficial no backend.
   */
  try {
    return JSON.parse(sessionStorage.getItem(GSI_OPERATION_DONE_STORAGE)) || null;
  } catch (error) {
    return null;
  }
}

function gsiOperationDoneRender() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Renderiza a tela de confirmação de ativação ou remoção de acesso.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê sessionStorage e escreve apenas no DOM.
   * TODO: Em produção, exibir número de protocolo, operador executor e data/hora do servidor.
   */
  const payload = gsiOperationDoneReadPayload() || {};
  const title = document.getElementById('gsi-success-title');
  const message = document.getElementById('gsi-success-message');
  const primaryLink = document.getElementById('gsi-success-primary-link');

  if (title) title.textContent = payload.title || 'Operação concluída';
  if (message) message.textContent = payload.message || 'Os dados foram gravados com sucesso.';
  if (primaryLink) {
    primaryLink.href = payload.primaryHref || 'tabela-operadores.html';
    primaryLink.textContent = payload.primaryText || 'Ver tabela';
  }
}

gsiOperationDoneRender();
