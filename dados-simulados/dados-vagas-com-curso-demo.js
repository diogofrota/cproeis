/**
 * DESCRIÇÃO DO BLOCO:
 * Configuração sintética para vagas futuras que exigem curso, habilitação ou capacitação concluída.
 * A massa é separada da geração mensal comum para testar somente requisitos operacionais.
 *
 * PARÂMETROS E RETORNO:
 * Não recebe parâmetros e não retorna valores. Expõe `window.CPROEIS_VAGAS_COM_CURSO_SIMULADAS`
 * para consumo por `js/script-index-demo-data.js`.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados diretamente; os requisitos ficam em memória até o usuário clicar em
 * "Criar vagas com curso".
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em produção, vincular requisitos a uma tabela oficial de regras da vaga, validada pelo GSI
 * e aplicada também no backend antes da inscrição do policial.
 */
window.CPROEIS_VAGAS_COM_CURSO_SIMULADAS = {
  periodoDias: 14,
  requisitos: [
    {
      tipo: 'curso-gsi',
      id: 'gsi-patrulha-escolar',
      nome: 'Patrulha Escolar',
      convenioId: 'conv-demo-6',
      classe: 'C/D',
      tipoServico: 'servico8',
      horaInicio: '08:00',
      horaFim: '16:00',
      quantidade: 2,
      nomeServico: 'Patrulha Escolar - Aeroporto Executivo'
    },
    {
      tipo: 'habilitacao-moto',
      id: 'moto-categoria-a',
      nome: 'Habilitação de moto categoria A',
      convenioId: 'conv-demo-6',
      classe: 'C/D',
      tipoServico: 'servico6',
      horaInicio: '14:00',
      horaFim: '20:00',
      quantidade: 2,
      nomeServico: 'Motopatrulhamento - Aeroporto Executivo'
    },
    {
      tipo: 'curso-convenio',
      id: 'curso-conv-atendimento-passageiro-demo',
      nome: 'Atendimento operacional',
      convenioId: 'conv-demo-6',
      classe: 'C/D',
      tipoServico: 'servico12',
      horaInicio: '08:00',
      horaFim: '20:00',
      quantidade: 3,
      nomeServico: 'Apoio ao passageiro - Aeroporto Executivo'
    },
    {
      tipo: 'curso-convenio',
      id: 'curso-conv-eventos-esportivos-demo',
      nome: 'Segurança em eventos',
      convenioId: 'conv-demo-2',
      classe: 'C/D',
      tipoServico: 'servico8',
      horaInicio: '10:00',
      horaFim: '18:00',
      quantidade: 4,
      nomeServico: 'Eventos esportivos - Maracanã'
    }
  ]
};
