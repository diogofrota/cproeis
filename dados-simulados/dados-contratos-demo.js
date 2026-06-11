/**
 * DESCRIÇÃO DO BLOCO:
 * Base sintética exclusiva do módulo de contratos usada pelo botão "Carregar contratos" da
 * página inicial. Cada convênio está organizado na mesma ordem visual do cadastro de contrato
 * e no mesmo desenho lógico que será enviado para a API de contratos.
 *
 * PARÂMETROS E RETORNO:
 * Não recebe parâmetros e não retorna valores. Ele expõe `window.CPROEIS_CONTRATOS_SIMULADOS`
 * para consumo por `js/script-index-demo-data.js`.
 *
 * ARMAZENAMENTO E PERSISTÊNCIA:
 * Não grava dados diretamente. Os objetos ficam em memória no navegador até o usuário clicar
 * em "Carregar contratos", quando o script principal persiste as informações em LocalStorage.
 * A massa demo deve se ajustar ao contrato esperado pela camada `CPROEISContratosJsonApi`,
 * mantendo a tela livre de adaptações para formatos divergentes.
 *
 * NOTAS DE EXPANSÃO:
 * TODO: Em homologação online, substituir este arquivo por fixture versionada do backend de
 * contratos, validada pelo mesmo schema da API, e bloquear qualquer exposição de dados
 * simulados em produção.
 */
window.CPROEIS_CONTRATOS_SIMULADOS = {
  convenios: [
    {
      identificacao: {
        nome: 'Prefeitura Municipal de Angra dos Reis',
        cnpj: '29.000.000/0001-44',
        tipoConveniado: 'Município'
      },
      endereco: {
        cep: '23900-000',
        logradouro: 'Rua Coronel Carvalho',
        numero: '465',
        complemento: 'Centro Administrativo',
        bairro: 'Centro',
        cidade: 'Angra dos Reis',
        uf: 'RJ'
      },
      contrato: {
        numero: 'SEI-260001/123456/2026',
        valorContrato: 1250000
      },
      publicacao: {
        data: '2026-06-10',
        pagina: 'Página 42'
      },
      vigencia: {
        inicio: '2026-01-15',
        fim: '2027-06-30'
      },
      beneficios: {
        passagem: 18,
        alimentacao: 32
      },
      valoresPorClasse: [
        { classe: 'A', grupo: 'Oficiais superiores', servico6: 420, servico8: 540, servico12: 780 },
        { classe: 'B', grupo: 'Oficiais intermediários e subalternos', servico6: 360, servico8: 480, servico12: 680 },
        { classe: 'C', grupo: 'Praças subtenentes e sargentos', servico6: 300, servico8: 390, servico12: 560 },
        { classe: 'D', grupo: 'Cabos e soldados', servico6: 260, servico8: 340, servico12: 480 }
      ],
      limitesVagasDiarias: [
        { classe: 'A', grupo: 'Oficiais superiores', servico6: 1, servico8: 2, servico12: 2 },
        { classe: 'B', grupo: 'Oficiais intermediários e subalternos', servico6: 2, servico8: 3, servico12: 4 },
        { classe: 'C/D', grupo: 'Subtenentes, sargentos, cabos e soldados', servico6: 12, servico8: 16, servico12: 20 }
      ],
      diasSelecionados: ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'],
      responsaveis: [
        {
          nome: 'Mariana Costa Almeida',
          cpf: '123.456.789-09',
          email: 'mariana.almeida@angra.rj.gov.br',
          telefone: '(21) 98888-7777'
        }
      ]
    },
    {
      identificacao: {
        nome: 'Prefeitura Municipal de Niterói',
        cnpj: '30.000.000/0001-55',
        tipoConveniado: 'Município'
      },
      endereco: {
        cep: '24020-206',
        logradouro: 'Rua Visconde de Sepetiba',
        numero: '987',
        complemento: 'Paço Municipal',
        bairro: 'Centro',
        cidade: 'Niterói',
        uf: 'RJ'
      },
      contrato: {
        numero: 'SEI-260001/223456/2026',
        valorContrato: 980000
      },
      publicacao: {
        data: '2026-06-12',
        pagina: 'Página 18'
      },
      vigencia: {
        inicio: '2026-02-01',
        fim: '2027-07-04'
      },
      beneficios: {
        passagem: 19,
        alimentacao: 32
      },
      valoresPorClasse: [
        { classe: 'A', grupo: 'Oficiais superiores', servico6: 430, servico8: 550, servico12: 790 },
        { classe: 'B', grupo: 'Oficiais intermediários e subalternos', servico6: 370, servico8: 490, servico12: 690 },
        { classe: 'C', grupo: 'Praças subtenentes e sargentos', servico6: 310, servico8: 400, servico12: 570 },
        { classe: 'D', grupo: 'Cabos e soldados', servico6: 270, servico8: 350, servico12: 490 }
      ],
      limitesVagasDiarias: [
        { classe: 'A', grupo: 'Oficiais superiores', servico6: 2, servico8: 2, servico12: 2 },
        { classe: 'B', grupo: 'Oficiais intermediários e subalternos', servico6: 2, servico8: 4, servico12: 4 },
        { classe: 'C/D', grupo: 'Subtenentes, sargentos, cabos e soldados', servico6: 13, servico8: 17, servico12: 20 }
      ],
      diasSelecionados: ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'],
      responsaveis: [
        {
          nome: 'Roberto Almeida Nogueira',
          cpf: '234.567.890-10',
          email: 'roberto.nogueira@niteroi.rj.gov.br',
          telefone: '(21) 97777-6611'
        }
      ]
    },
    {
      identificacao: {
        nome: 'Concessionária MetrôRio',
        cnpj: '31.000.000/0001-66',
        tipoConveniado: 'Concessionária'
      },
      endereco: {
        cep: '20210-031',
        logradouro: 'Avenida Presidente Vargas',
        numero: '2000',
        complemento: 'Centro de Operações',
        bairro: 'Centro',
        cidade: 'Rio de Janeiro',
        uf: 'RJ'
      },
      contrato: {
        numero: 'SEI-260001/323456/2026',
        valorContrato: 1460000
      },
      publicacao: {
        data: '2026-06-15',
        pagina: 'Página 27'
      },
      vigencia: {
        inicio: '2026-02-15',
        fim: '2027-07-09'
      },
      beneficios: {
        passagem: 20,
        alimentacao: 33
      },
      valoresPorClasse: [
        { classe: 'A', grupo: 'Oficiais superiores', servico6: 440, servico8: 560, servico12: 800 },
        { classe: 'B', grupo: 'Oficiais intermediários e subalternos', servico6: 380, servico8: 500, servico12: 700 },
        { classe: 'C', grupo: 'Praças subtenentes e sargentos', servico6: 320, servico8: 410, servico12: 580 },
        { classe: 'D', grupo: 'Cabos e soldados', servico6: 280, servico8: 360, servico12: 500 }
      ],
      limitesVagasDiarias: [
        { classe: 'A', grupo: 'Oficiais superiores', servico6: 2, servico8: 3, servico12: 3 },
        { classe: 'B', grupo: 'Oficiais intermediários e subalternos', servico6: 3, servico8: 4, servico12: 5 },
        { classe: 'C/D', grupo: 'Subtenentes, sargentos, cabos e soldados', servico6: 14, servico8: 19, servico12: 23 }
      ],
      diasSelecionados: ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'],
      responsaveis: [
        {
          nome: 'Luciana Ferreira Campos',
          cpf: '345.678.901-11',
          email: 'luciana.campos@metrorio.com.br',
          telefone: '(21) 96666-5522'
        }
      ]
    },
    {
      identificacao: {
        nome: 'CCR Barcas',
        cnpj: '32.000.000/0001-77',
        tipoConveniado: 'Concessionária'
      },
      endereco: {
        cep: '20010-010',
        logradouro: 'Praça XV de Novembro',
        numero: '34',
        complemento: 'Estação das Barcas',
        bairro: 'Centro',
        cidade: 'Rio de Janeiro',
        uf: 'RJ'
      },
      contrato: {
        numero: 'SEI-260001/423456/2026',
        valorContrato: 1320000
      },
      publicacao: {
        data: '2026-06-18',
        pagina: 'Página 31'
      },
      vigencia: {
        inicio: '2026-03-01',
        fim: '2027-07-14'
      },
      beneficios: {
        passagem: 20,
        alimentacao: 34
      },
      valoresPorClasse: [
        { classe: 'A', grupo: 'Oficiais superiores', servico6: 450, servico8: 570, servico12: 810 },
        { classe: 'B', grupo: 'Oficiais intermediários e subalternos', servico6: 390, servico8: 510, servico12: 710 },
        { classe: 'C', grupo: 'Praças subtenentes e sargentos', servico6: 330, servico8: 420, servico12: 590 },
        { classe: 'D', grupo: 'Cabos e soldados', servico6: 290, servico8: 370, servico12: 510 }
      ],
      limitesVagasDiarias: [
        { classe: 'A', grupo: 'Oficiais superiores', servico6: 2, servico8: 3, servico12: 2 },
        { classe: 'B', grupo: 'Oficiais intermediários e subalternos', servico6: 3, servico8: 4, servico12: 4 },
        { classe: 'C/D', grupo: 'Subtenentes, sargentos, cabos e soldados', servico6: 16, servico8: 19, servico12: 20 }
      ],
      diasSelecionados: ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'],
      responsaveis: [
        {
          nome: 'Marcelo Henrique Duarte',
          cpf: '456.789.012-12',
          email: 'marcelo.duarte@ccrbarcas.com.br',
          telefone: '(21) 95555-4433'
        }
      ]
    },
    {
      identificacao: {
        nome: 'DETRAN-RJ',
        cnpj: '33.000.000/0001-88',
        tipoConveniado: 'Órgão Público'
      },
      endereco: {
        cep: '20071-004',
        logradouro: 'Avenida Presidente Vargas',
        numero: '817',
        complemento: 'Sede Administrativa',
        bairro: 'Centro',
        cidade: 'Rio de Janeiro',
        uf: 'RJ'
      },
      contrato: {
        numero: 'SEI-260001/523456/2026',
        valorContrato: 1110000
      },
      publicacao: {
        data: '2026-06-20',
        pagina: 'Página 15'
      },
      vigencia: {
        inicio: '2026-08-01',
        fim: '2027-07-31'
      },
      beneficios: {
        passagem: 18,
        alimentacao: 35
      },
      valoresPorClasse: [
        { classe: 'A', grupo: 'Oficiais superiores', servico6: 460, servico8: 580, servico12: 820 },
        { classe: 'B', grupo: 'Oficiais intermediários e subalternos', servico6: 400, servico8: 520, servico12: 720 },
        { classe: 'C', grupo: 'Praças subtenentes e sargentos', servico6: 340, servico8: 430, servico12: 600 },
        { classe: 'D', grupo: 'Cabos e soldados', servico6: 300, servico8: 380, servico12: 520 }
      ],
      limitesVagasDiarias: [
        { classe: 'A', grupo: 'Oficiais superiores', servico6: 1, servico8: 2, servico12: 2 },
        { classe: 'B', grupo: 'Oficiais intermediários e subalternos', servico6: 2, servico8: 3, servico12: 3 },
        { classe: 'C/D', grupo: 'Subtenentes, sargentos, cabos e soldados', servico6: 13, servico8: 15, servico12: 17 }
      ],
      diasSelecionados: ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'],
      responsaveis: [
        {
          nome: 'Patrícia Gomes de Oliveira',
          cpf: '567.890.123-13',
          email: 'patricia.oliveira@detran.rj.gov.br',
          telefone: '(21) 94444-3344'
        }
      ]
    },
    {
      identificacao: {
        nome: 'Secretaria de Estado de Saúde do Rio de Janeiro',
        cnpj: '34.000.000/0001-99',
        tipoConveniado: 'Órgão Público'
      },
      endereco: {
        cep: '20031-142',
        logradouro: 'Rua México',
        numero: '128',
        complemento: 'Edifício Sede',
        bairro: 'Centro',
        cidade: 'Rio de Janeiro',
        uf: 'RJ'
      },
      contrato: {
        numero: 'SEI-260001/623456/2026',
        valorContrato: 1540000
      },
      publicacao: {
        data: '2026-06-22',
        pagina: 'Página 36'
      },
      vigencia: {
        inicio: '2026-03-15',
        fim: '2027-08-04'
      },
      beneficios: {
        passagem: 19,
        alimentacao: 35
      },
      valoresPorClasse: [
        { classe: 'A', grupo: 'Oficiais superiores', servico6: 470, servico8: 590, servico12: 830 },
        { classe: 'B', grupo: 'Oficiais intermediários e subalternos', servico6: 410, servico8: 530, servico12: 730 },
        { classe: 'C', grupo: 'Praças subtenentes e sargentos', servico6: 350, servico8: 440, servico12: 610 },
        { classe: 'D', grupo: 'Cabos e soldados', servico6: 310, servico8: 390, servico12: 530 }
      ],
      limitesVagasDiarias: [
        { classe: 'A', grupo: 'Oficiais superiores', servico6: 2, servico8: 3, servico12: 3 },
        { classe: 'B', grupo: 'Oficiais intermediários e subalternos', servico6: 3, servico8: 4, servico12: 5 },
        { classe: 'C/D', grupo: 'Subtenentes, sargentos, cabos e soldados', servico6: 16, servico8: 21, servico12: 25 }
      ],
      diasSelecionados: ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'],
      responsaveis: [
        {
          nome: 'Eduardo Martins Ribeiro',
          cpf: '678.901.234-14',
          email: 'eduardo.ribeiro@saude.rj.gov.br',
          telefone: '(21) 93333-2255'
        }
      ]
    },
    {
      identificacao: {
        nome: 'Associação Comercial do Rio de Janeiro',
        cnpj: '35.000.000/0001-10',
        tipoConveniado: 'Outros'
      },
      endereco: {
        cep: '20091-020',
        logradouro: 'Rua da Candelária',
        numero: '9',
        complemento: 'Centro Empresarial',
        bairro: 'Centro',
        cidade: 'Rio de Janeiro',
        uf: 'RJ'
      },
      contrato: {
        numero: 'SEI-260001/723456/2026',
        valorContrato: 740000
      },
      publicacao: {
        data: '2026-06-25',
        pagina: 'Página 21'
      },
      vigencia: {
        inicio: '2026-04-01',
        fim: '2027-08-09'
      },
      beneficios: {
        passagem: 18,
        alimentacao: 32
      },
      valoresPorClasse: [
        { classe: 'A', grupo: 'Oficiais superiores', servico6: 430, servico8: 550, servico12: 790 },
        { classe: 'B', grupo: 'Oficiais intermediários e subalternos', servico6: 370, servico8: 490, servico12: 690 },
        { classe: 'C', grupo: 'Praças subtenentes e sargentos', servico6: 310, servico8: 400, servico12: 570 },
        { classe: 'D', grupo: 'Cabos e soldados', servico6: 270, servico8: 350, servico12: 490 }
      ],
      limitesVagasDiarias: [
        { classe: 'A', grupo: 'Oficiais superiores', servico6: 1, servico8: 1, servico12: 1 },
        { classe: 'B', grupo: 'Oficiais intermediários e subalternos', servico6: 1, servico8: 2, servico12: 2 },
        { classe: 'C/D', grupo: 'Subtenentes, sargentos, cabos e soldados', servico6: 9, servico8: 11, servico12: 13 }
      ],
      diasSelecionados: ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'],
      responsaveis: [
        {
          nome: 'Carolina Azevedo Lima',
          cpf: '789.012.345-15',
          email: 'carolina.lima@acrj.org.br',
          telefone: '(21) 92222-1166'
        }
      ]
    },
    {
      identificacao: {
        nome: 'Federação de Futebol do Estado do Rio de Janeiro',
        cnpj: '36.000.000/0001-21',
        tipoConveniado: 'Outros'
      },
      endereco: {
        cep: '20271-130',
        logradouro: 'Rua Radialista Waldir Amaral',
        numero: '20',
        complemento: 'Maracanã',
        bairro: 'Maracanã',
        cidade: 'Rio de Janeiro',
        uf: 'RJ'
      },
      contrato: {
        numero: 'SEI-260001/823456/2026',
        valorContrato: 880000
      },
      publicacao: {
        data: '2026-06-28',
        pagina: 'Página 44'
      },
      vigencia: {
        inicio: '2026-04-15',
        fim: '2027-08-14'
      },
      beneficios: {
        passagem: 20,
        alimentacao: 34
      },
      valoresPorClasse: [
        { classe: 'A', grupo: 'Oficiais superiores', servico6: 450, servico8: 570, servico12: 810 },
        { classe: 'B', grupo: 'Oficiais intermediários e subalternos', servico6: 390, servico8: 510, servico12: 710 },
        { classe: 'C', grupo: 'Praças subtenentes e sargentos', servico6: 330, servico8: 420, servico12: 590 },
        { classe: 'D', grupo: 'Cabos e soldados', servico6: 290, servico8: 370, servico12: 510 }
      ],
      limitesVagasDiarias: [
        { classe: 'A', grupo: 'Oficiais superiores', servico6: 2, servico8: 2, servico12: 2 },
        { classe: 'B', grupo: 'Oficiais intermediários e subalternos', servico6: 2, servico8: 3, servico12: 4 },
        { classe: 'C/D', grupo: 'Subtenentes, sargentos, cabos e soldados', servico6: 12, servico8: 16, servico12: 20 }
      ],
      diasSelecionados: ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'],
      responsaveis: [
        {
          nome: 'Ricardo Souza Monteiro',
          cpf: '890.123.456-16',
          email: 'ricardo.monteiro@fferj.com.br',
          telefone: '(21) 91111-0077'
        }
      ]
    }
  ]
};
