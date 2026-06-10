(function initContratosCadastroTeste() {
  /*
   * DESCRIÇÃO DA FUNÇÃO: Instala um preenchimento temporário de dados simulados no formulário
   * de cadastro de convênio para apresentações e testes locais.
   * PARÂMETROS E RETORNO: Não recebe parâmetros e não retorna valor; conecta o botão
   * `fill-test-convenio` aos campos do DOM.
   * ARMAZENAMENTO E PERSISTÊNCIA: Não grava LocalStorage nem sessionStorage; apenas preenche
   * inputs/checkboxes do formulário. A persistência só ocorre se o usuário seguir o fluxo normal.
   * TODO: Manter este arquivo apenas como massa simulada; remover a chamada no HTML antes da
   * publicação em produção.
   */
  const fillButton = document.getElementById('fill-test-convenio');
  if (!fillButton) return;

  const setValue = (id, value, eventType = 'input') => {
    /*
     * DESCRIÇÃO DO BLOCO: Preenche um campo e dispara evento para reaproveitar máscaras,
     * validações e normalizações já cadastradas no script principal da tela.
     * PARÂMETROS E RETORNO: Recebe id como string, value como string e eventType como string;
     * não retorna valor.
     * ARMAZENAMENTO E PERSISTÊNCIA: Escreve somente no input do DOM; não grava dados persistentes.
     * TODO: Em produção, excluir este helper junto com o script temporário de dados simulados.
     */
    const field = document.getElementById(id);
    if (!field) return;
    field.value = value;
    field.dispatchEvent(new Event(eventType, { bubbles: true }));
  };

  const setCurrency = (id, cents) => setValue(id, String(cents));
  const setNumber = (id, value) => setValue(id, String(value));

  fillButton.addEventListener('click', () => {
    /*
     * DESCRIÇÃO DO BLOCO: Preenche uma massa sintética completa de convênio, contrato,
     * valores, limites, dias de funcionamento e responsável para apresentação.
     * PARÂMETROS E RETORNO: O listener recebe evento de clique e não retorna valor.
     * ARMAZENAMENTO E PERSISTÊNCIA: Altera somente campos do DOM; não grava no banco local até
     * o usuário clicar em Cadastrar convênio e confirmar a revisão.
     * TODO: Remover toda esta rotina antes da migração para produção.
     */
    setValue('nome', 'Prefeitura Municipal de Angra dos Reis');
    setValue('cnpj', '29000000000144');
    setValue('tipo-conveniado', 'Município', 'change');
    setValue('endereco-cep', '23900000');
    setValue('endereco-logradouro', 'Rua Coronel Carvalho');
    setValue('endereco-numero', '465');
    setValue('endereco-complemento', 'Centro Administrativo');
    setValue('endereco-bairro', 'Centro');
    setValue('endereco-cidade', 'Angra dos Reis');
    setValue('endereco-uf', 'RJ');

    setValue('numero', '2600011234562026');
    setValue('diario-data', '2026-06-10', 'change');
    setValue('diario-pagina', '42');
    setCurrency('valor-contrato', 125000000);
    setValue('inicio', '2026-07-01', 'change');
    setValue('fim', '2027-06-30', 'change');

    setCurrency('valor-a-6', 42000);
    setCurrency('valor-a-8', 54000);
    setCurrency('valor-a-12', 78000);
    setCurrency('valor-b-6', 36000);
    setCurrency('valor-b-8', 48000);
    setCurrency('valor-b-12', 68000);
    setCurrency('valor-c-6', 30000);
    setCurrency('valor-c-8', 39000);
    setCurrency('valor-c-12', 56000);
    setCurrency('valor-d-6', 26000);
    setCurrency('valor-d-8', 34000);
    setCurrency('valor-d-12', 48000);
    setCurrency('valor-passagem', 1800);
    setCurrency('valor-alimentacao', 3200);

    setNumber('limite-a-6', 1);
    setNumber('limite-a-8', 2);
    setNumber('limite-a-12', 2);
    setNumber('limite-b-6', 2);
    setNumber('limite-b-8', 3);
    setNumber('limite-b-12', 4);
    setNumber('limite-c-6', 4);
    setNumber('limite-c-8', 6);
    setNumber('limite-c-12', 8);
    setNumber('limite-d-6', 8);
    setNumber('limite-d-8', 10);
    setNumber('limite-d-12', 12);

    document.querySelectorAll('input[name="weekday-operacao"]').forEach((checkbox) => {
      checkbox.checked = false;
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    });

    ['segunda', 'terca', 'quarta', 'quinta', 'sexta'].forEach((day) => {
      const checkbox = document.querySelector(`input[name="weekday-operacao"][value="${day}"]`);
      if (!checkbox) return;
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    });

    setValue('responsavel-nome', 'Mariana Costa Almeida');
    setValue('responsavel-cpf', '12345678909');
    setValue('responsavel-email', 'mariana.almeida@angra.rj.gov.br');
    setValue('responsavel-telefone', '21988887777');

    const includeResponsavelButton = document.querySelector('[data-action="include-responsavel-draft"]');
    if (includeResponsavelButton) {
      /*
       * DESCRIÇÃO DO BLOCO: Inclui automaticamente o responsável simulado na lista local do
       * formulário para que o submit avance diretamente para a página de revisão.
       * PARÂMETROS E RETORNO: Não recebe parâmetros diretos e não retorna valor; aciona o clique
       * do botão de inclusão já existente na tela.
       * ARMAZENAMENTO E PERSISTÊNCIA: Atualiza apenas o estado local do formulário; não grava
       * LocalStorage nem sessionStorage nesta etapa.
       * TODO: Remover este atalho junto com os dados simulados antes de produção.
       */
      includeResponsavelButton.click();
    }
  });
})();
