const OPERACAO_CONCLUIDA_STORAGE = 'cproeis_contratos_operacao_concluida';

const successHeaderText = document.getElementById('success-header-text');
const successTitle = document.getElementById('success-title');
const successMessage = document.getElementById('success-message');
const successPrimaryLink = document.getElementById('success-primary-link');

function operacaoConcluidaGetPayload() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Recupera a última confirmação gravada pela tela de revisão para
   * personalizar a página de retorno.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e retorna objeto JSON ou null.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê sessionStorage em `cproeis_contratos_operacao_concluida`.
   * TODO: Em produção, buscar o resultado por protocolo retornado pela API, não por sessionStorage.
   */
  try {
    return JSON.parse(sessionStorage.getItem(OPERACAO_CONCLUIDA_STORAGE)) || null;
  } catch (error) {
    return null;
  }
}

function operacaoConcluidaGetFallback(tipo, id) {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Define mensagens padrão quando a página é aberta sem payload salvo.
   * PARÂMETROS E RETORNO: Recebe tipo e id como strings vindas da URL; retorna objeto de mensagem.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não acessa armazenamento; apenas monta dados em memória.
   * TODO: Em produção, padronizar estes textos a partir de catálogo de mensagens do backend.
   */
  const messages = {
    convenio: {
      title: 'Convênio cadastrado',
      message: 'O cadastro do convênio foi confirmado e os dados já estão disponíveis para consulta.',
      primaryHref: 'tabela-convenios.html',
      primaryText: 'Ver contratos cadastrados'
    },
    responsavel_adicionado: {
      title: 'Responsável adicionado',
      message: 'O responsável foi vinculado ao convênio após a conferência dos dados.',
      primaryHref: id ? `detalhes-convenio.html?id=${encodeURIComponent(id)}` : 'tabela-convenios.html',
      primaryText: 'Ver detalhes do convênio'
    },
    responsavel_retirado: {
      title: 'Responsável retirado',
      message: 'A data final do responsável foi registrada no contrato.',
      primaryHref: id ? `detalhes-convenio.html?id=${encodeURIComponent(id)}` : 'tabela-convenios.html',
      primaryText: 'Ver detalhes do convênio'
    }
  };

  return messages[tipo] || {
    title: 'Operação concluída',
    message: 'A solicitação foi processada com sucesso.',
    primaryHref: 'index.html',
    primaryText: 'Página inicial de contratos'
  };
}

function operacaoConcluidaRender() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Renderiza os textos e links da página de conclusão conforme a ação
   * confirmada pelo usuário.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valor.
   * ARMAZENAMENTO E PERSISTÊNCIA: Lê sessionStorage e parâmetros da URL; escreve somente no DOM.
   * TODO: Em produção, exibir número de protocolo e horário oficial do servidor.
   */
  const params = new URLSearchParams(window.location.search);
  const tipo = params.get('tipo') || '';
  const id = params.get('id') || '';
  const payload = operacaoConcluidaGetPayload();
  const payloadMatchesUrl = payload && (!tipo || payload.tipo === tipo);
  const fallback = operacaoConcluidaGetFallback(tipo, id);
  const result = {
    ...fallback,
    ...(payloadMatchesUrl ? payload : {})
  };

  if (successHeaderText) successHeaderText.textContent = 'A ação foi finalizada e os dados foram gravados.';
  if (successTitle) successTitle.textContent = result.title;
  if (successMessage) successMessage.textContent = result.message;
  if (successPrimaryLink) {
    successPrimaryLink.href = result.primaryHref || fallback.primaryHref;
    successPrimaryLink.textContent = result.primaryText || fallback.primaryText;
  }
}

operacaoConcluidaRender();
