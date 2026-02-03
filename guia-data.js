window.GUIDE_DATA = {
  meta: {
    title: "Guia Oficial — Formação Dev (Zero ao Flutter)",
    lessonDurationMinutes: 90,
    structure: [
      "0–10 Check-in (recuperação)",
      "10–25 Conceito (1 ideia por vez)",
      "25–40 Exemplo resolvido",
      "40–75 Lab guiado (entrega)",
      "75–85 Desafio individual",
      "85–90 Checklist + tarefa"
    ]
  },
  modules: [
    {
      id: "mod-logica",
      title: "Módulo 1 — Lógica & Algoritmos (sem código)",
      outcomes: [
        "Escrever algoritmos precisos e testáveis",
        "Construir fluxogramas sem ambiguidades",
        "Transformar regras em SE/SENÃO com casos de borda",
        "Criar repetição com condição de parada",
        "Modelar menu completo em pseudocódigo"
      ],
      lessons: [
        {
          id: "LOG-01",
          title: "Precisão: Robô burro + algoritmo testável",
          deliverable: "Algoritmo v2 (12 passos) + 3 ambiguidades corrigidas",
          objectives: [
            "Entender literalidade do computador",
            "Escrever passos executáveis sem contexto",
            "Testar no papel e refinar"
          ],
          timeline: [
            {time:"0–10", label:"Check-in", detail:"3 perguntas + microexercício 2 min (3 passos para abrir app)"},
            {time:"10–25", label:"Conceito", detail:"Computador é literal; instrução vaga vira bug; erro é feedback"},
            {time:"25–40", label:"Exemplo resolvido", detail:"Sanduíche: exemplo ruim ? exemplo bom em 12 passos"},
            {time:"40–75", label:"Lab guiado", detail:"Duplas Piloto/Robô: tarefa (lavar mãos/amarrar tênis) ? v2"},
            {time:"75–85", label:"Desafio", detail:"Algoritmo caixa eletrônico (decisão + repetição + erro)"},
            {time:"85–90", label:"Checklist + tarefa", detail:"Checklist de precisão + tarefa: algoritmo de cadastro em app"}
          ],
          student: {
            summary: "Você vai aprender a escrever instruções sem ambiguidades e testar no papel.",
            labSteps: [
              "Escolha uma tarefa (lavar mãos ou amarrar tênis).",
              "Escreva 12 passos detalhados.",
              "Troque com um colega que executará literalmente (robô).",
              "Marque 3 ambiguidades e corrija gerando a versão v2.",
              "Entregue v2 + lista de ambiguidades."
            ],
            challenge: {
              prompt: "Escreva um algoritmo para sacar dinheiro no caixa eletrônico com 3 tentativas de senha e tratamento de saldo insuficiente.",
              expected: "Contador de tentativas + loop até 3; se senha correta, pedir valor; se valor<=saldo, sucesso; senão erro."
            },
            homework: "Escrever algoritmo de cadastro em aplicativo (mín. 10 passos) + listar 3 erros possíveis."
          },
          teacher: {
            talkTrack: [
              "Computador não entende intenção, só instrução.",
              "Se você não especifica, você aceita qualquer coisa.",
              "Programar é reduzir o espaço de dúvida."
            ],
            facilitationNotes: [
              "Provoque ambiguidades intencionalmente (ex.: 'pegue o pão' — qual pão?).",
              "Normalize o erro como feedback."
            ],
            commonMistakes: [
              "Passos subjetivos ('com cuidado')",
              "Pular pré-condições",
              "Não definir começo/fim"
            ],
            scoring: {checkin:2, lab:5, challenge:3}
          }
        },

        {
          id:"LOG-02",
          title:"EPS (Entrada/Processo/Saída) + variáveis conceituais",
          deliverable:"EPS completo do OrderHub com 8+ entradas, 8+ processos, 6+ saídas e 3+ erros",
          objectives:["Decompor sistemas com clareza","Distinguir regra de interface","Mapear erros reais"],
          timeline:[
            {time:"0–10", label:"Check-in", detail:"Ambiguidade, pré-condição, erro em cadastro"},
            {time:"10–25", label:"Conceito", detail:"Entrada vs Processo vs Saída; variáveis conceituais"},
            {time:"25–40", label:"Exemplo resolvido", detail:"EPS da média de notas (com validação)"},
            {time:"40–75", label:"Lab guiado", detail:"Tabela EPS do OrderHub no quadro + erros previstos"},
            {time:"75–85", label:"Desafio", detail:"EPS do sistema de biblioteca"},
            {time:"85–90", label:"Checklist + tarefa", detail:"Revisar EPS com foco em regras e erros"}
          ],
          student:{
            summary:"Você vai aprender a decompor qualquer sistema em entradas, regras e saídas.",
            labSteps:[
              "Liste 8 entradas do OrderHub.",
              "Liste 8 processos (regras), sem falar de telas.",
              "Liste 6 saídas (resultados).",
              "Inclua 3 erros previstos e como o sistema responde."
            ],
            challenge:{prompt:"Monte EPS de um sistema de biblioteca (livro, usuário, empréstimo).", expected:"Entradas (dados), processos (validar, emprestar, devolver), saídas (comprovante/listas) e erros (livro indisponível)."},
            homework:"Criar EPS de 'lanchonete': pedidos, pagamentos, troco, itens indisponíveis."
          },
          teacher:{
            talkTrack:["EPS é o esqueleto do sistema.","Processo é regra, não tela.","Erro previsto vira qualidade."],
            commonMistakes:["Confundir processo com tela","Saída virar 'ação'","Faltar erros"],
            scoring:{checkin:2, lab:5, challenge:3}
          }
        },

        {
          id:"LOG-03",
          title:"Decisão (SE/SENÃO) + casos de borda",
          deliverable:"4 regras do OrderHub em SE/SENÃO + 2 casos de borda cada",
          objectives:["Escrever condições claras","Tratar bordas (zero/vazio/limite)","Ordenar condições corretamente"],
          timeline:[
            {time:"0–10", label:"Check-in", detail:"Caso de borda; > vs >="},
            {time:"10–25", label:"Conceito", detail:"Condição booleana; ordem; bordas"},
            {time:"25–40", label:"Exemplo resolvido", detail:"Cadastro produto: nome>=3 e preço>0 + mensagens"},
            {time:"40–75", label:"Lab guiado", detail:"4 regras (email, preço, pedido com itens, qtd>=1) + bordas"},
            {time:"75–85", label:"Desafio", detail:"Desconto por faixa (>=100, >=50)"},
            {time:"85–90", label:"Checklist + tarefa", detail:"Revisar ordem e bordas; escrever 2 regras novas"}
          ],
          student:{
            labSteps:[
              "Escreva regra de email válido (contém @ e .).",
              "Escreva regra de preço > 0.",
              "Escreva regra: pedido precisa ter pelo menos 1 item.",
              "Escreva regra: quantidade do item >= 1.",
              "Para cada regra, crie 2 casos de borda e a mensagem de erro."
            ],
            challenge:{prompt:"Implemente a regra de desconto por faixa (>=100 ?10%, >=50?5%, senão 0).", expected:"Testar faixa maior primeiro, depois menor."},
            homework:"Criar regras para: telefone (somente números) e nome (>=3), com mensagens e bordas."
          },
          teacher:{
            commonMistakes:["Ordem errada (testa >=50 antes de >=100)","Falta bordas","Mensagem genérica"],
            scoring:{checkin:2, lab:5, challenge:3}
          }
        },

        {
          id:"LOG-04",
          title:"Repetição (loops) + condição de parada",
          deliverable:"Pseudocódigo do menu principal do OrderHub com opção inválida",
          objectives:["Criar loop com saída clara","Evitar loop infinito","Aplicar repetição em menus"],
          student:{
            labSteps:[
              "Escreva pseudocódigo do menu: mostrar opções; ler; executar; repetir até 0.",
              "Inclua tratamento de opção inválida.",
              "Inclua pelo menos 1 submenu (Clientes/Produtos)."
            ],
            challenge:{prompt:"Somar números até o usuário digitar 0.", expected:"Acumulador soma; loop lê n; se n==0 sai; senão soma."},
            homework:"Criar um menu no papel para 'biblioteca': cadastrar livro, listar, emprestar, devolver."
          },
          teacher:{commonMistakes:["Sem condição de parada","Não atualiza opção","Mistura tudo em um bloco só"], scoring:{checkin:2, lab:5, challenge:3}}
        },

        {
          id:"LOG-05",
          title:"Modularização no papel (funções/blocos)",
          deliverable:"Mapa de funções do OrderHub + pseudocódigo chamando blocos",
          objectives:["Separar responsabilidades","Criar nomes claros","Reutilizar validações"],
          student:{
            labSteps:[
              "Liste blocos/funções: menuClientes, menuProdutos, menuPedidos.",
              "Liste validações reutilizáveis: validarEmail, validarPreco, validarNome.",
              "Reescreva o menu chamando blocos ao invés de um 'monolito'."
            ],
            challenge:{prompt:"Crie uma validação reutilizável e mostre onde ela é chamada em 2 fluxos.", expected:"Ex.: validarEmail é usado em cadastrar cliente e editar cliente."},
            homework:"Refinar pseudocódigo removendo duplicações e melhorando nomes."
          },
          teacher:{scoring:{checkin:2, lab:5, challenge:3}}
        },

        {
          id:"LOG-06",
          title:"Projeto Final — Lógica completa + cenários de teste",
          deliverable:"Fluxograma do menu + pseudocódigo completo + 10 cenários de teste",
          objectives:["Integrar decisões+loops+modularização","Produzir testes de sucesso e erro","Preparar para virar código"],
          student:{
            labSteps:[
              "Finalize o fluxograma do menu principal.",
              "Finalize pseudocódigo (clientes, produtos, pedidos).",
              "Escreva 10 cenários de teste (5 sucesso, 5 erro)."
            ],
            challenge:{prompt:"Adicionar um fluxo alternativo (erro) para 'criar pedido sem itens'.", expected:"Sistema deve impedir salvar e mostrar erro."},
            homework:"Organizar tudo em um documento único (PDF/Doc) para virar base do Python."
          },
          teacher:{
            rubric:[
              "40 pts: correção lógica",
              "20 pts: casos de borda/erro",
              "20 pts: clareza e organização",
              "20 pts: qualidade dos testes"
            ],
            scoring:{checkin:2, lab:5, challenge:3}
          }
        }
      ]
    },

    {
      id: "mod-analise",
      title: "Módulo 2 — Análise de Sistemas (sem código)",
      outcomes: [
        "Definir stakeholders, escopo e fora do escopo",
        "Escrever RF/RNF com critérios testáveis",
        "Criar user stories e backlog",
        "Montar caso de uso com fluxos alternativos",
        "Desenhar wireframes e especificar validações",
        "Especificar cenários de teste"
      ],
      lessons: [
        {
          id:"ANA-01",
          title:"Stakeholders + escopo / fora do escopo",
          deliverable:"Mapa do problema do OrderHub (template completo)",
          student:{
            labSteps:[
              "Defina persona principal (admin/atendente).",
              "Liste 4 stakeholders.",
              "Escreva objetivo em 1 frase (Permitir que ___ faça ___ para ___).",
              "Liste 6 itens dentro do escopo e 6 fora do escopo."
            ],
            challenge:{prompt:"Faça o mesmo para um sistema de lanchonete.", expected:"Escopo com verbos; fora do escopo remove extras."},
            homework:"Revisar escopo e remover itens 'vagos' (ex.: 'melhorar desempenho' sem critério)."
          },
          teacher:{scoring:{checkin:2, lab:5, challenge:3}}
        },

        {
          id:"ANA-02",
          title:"Requisitos RF/RNF + critérios testáveis",
          deliverable:"10 requisitos (8 RF + 2 RNF) com critérios",
          student:{
            labSteps:[
              "Escreva 8 requisitos funcionais (cadastrar/listar/editar/remover/criar pedido).",
              "Escreva 2 requisitos não-funcionais (mensagem de erro clara; validação por campo).",
              "Para cada RF, crie 2 critérios de aceitação (passa/falha)."
            ],
            challenge:{prompt:"Transforme 'sistema deve ser fácil' em critérios testáveis.", expected:"Mensagens por campo; validação em tempo de ação; texto claro."},
            homework:"Criar 2 RF extras e critérios para 'relatórios'."
          },
          teacher:{commonMistakes:["Critérios subjetivos","Misturar 3 ações em 1 requisito"], scoring:{checkin:2, lab:5, challenge:3}}
        },

        {
          id:"ANA-03",
          title:"User Stories + backlog + priorização",
          deliverable:"Backlog com 8 stories (Must/Should/Could) + critérios",
          student:{
            labSteps:[
              "Crie 4 Must, 3 Should, 1 Could.",
              "Para cada story, crie 2–3 critérios.",
              "Garanta que 2 stories incluam caso de erro."
            ],
            challenge:{prompt:"Crie uma story para impedir produto com preço inválido.", expected:"Critérios: preço>0, mensagem de erro, não salvar."},
            homework:"Revisar backlog e garantir que prioridades fazem sentido para o MVP."
          },
          teacher:{scoring:{checkin:2, lab:5, challenge:3}}
        },

        {
          id:"ANA-04",
          title:"Caso de uso + fluxos alternativos",
          deliverable:"Caso de uso 'Criar Pedido' com 3 fluxos alternativos",
          student:{
            labSteps:[
              "Preencha: ator, pré-condições, fluxo principal (6–10 passos).",
              "Crie 3 alternativos: cliente inexistente, produto inexistente, pedido sem itens.",
              "Defina pós-condição."
            ],
            challenge:{prompt:"Caso de uso 'Editar Produto' com 2 erros.", expected:"Erro de validação (nome curto, preço<=0) e produto inexistente."},
            homework:"Criar mais 2 casos de uso curtos (Cadastrar Cliente, Remover Produto) com 1 erro cada."
          },
          teacher:{scoring:{checkin:2, lab:5, challenge:3}}
        },

        {
          id:"ANA-05",
          title:"Wireframes + tabela de campos/validações",
          deliverable:"Wireframe de lista + cadastro + tabela de campos",
          student:{
            labSteps:[
              "Desenhe wireframe de lista (clientes ou produtos) com ações editar/remover.",
              "Desenhe wireframe de cadastro com campos e botões.",
              "Preencha tabela: campo, tipo, obrigatório, validação, mensagem."
            ],
            challenge:{prompt:"Escreva 5 mensagens de erro curtas e úteis.", expected:"Ex.: 'Nome precisa ter 3+ letras'."},
            homework:"Refinar mensagens e adicionar estado vazio na lista."
          },
          teacher:{scoring:{checkin:2, lab:5, challenge:3}}
        },

        {
          id:"ANA-06",
          title:"Projeto Final — Mini-PRD + cenários de teste",
          deliverable:"Documento final: escopo + requisitos + backlog + caso de uso + wireframes + 10 testes",
          student:{
            labSteps:[
              "Organize tudo em 1 documento (1–3 páginas).",
              "Inclua 10 cenários de teste (Given/When/Then), 5 sucesso e 5 erro.",
              "Revise clareza: outra pessoa consegue entender?"
            ],
            challenge:{prompt:"Adicione 2 testes novos cobrindo erro de email e pedido sem itens.", expected:"Testes com passo e resultado esperado."},
            homework:"Preparar o pacote para virar base do Python (próximo módulo)."
          },
          teacher:{
            rubric:[
              "25 pts: clareza e estrutura",
              "25 pts: requisitos e critérios",
              "25 pts: fluxos alternativos",
              "25 pts: testes"
            ],
            scoring:{checkin:2, lab:5, challenge:3}
          }
        }
      ]
    }
  ],

  templates: [
    {
      id:"tpl-eps",
      title:"Template EPS (Entrada/Processo/Saída)",
      content:
"EPS — [Nome do Sistema]\\n\\nEntradas:\\n- ...\\n\\nProcessos (regras):\\n- ...\\n\\nSaídas:\\n- ...\\n\\nErros previstos (mín. 3):\\n- ..."
    },
    {
      id:"tpl-requisitos",
      title:"Template Requisitos RF/RNF + Critérios",
      content:
"Requisitos Funcionais (RF)\\n- RF-01: ...\\n  Critérios:\\n  - ...\\n  - ...\\n\\nRequisitos Não-Funcionais (RNF)\\n- RNF-01: ...\\n  Critérios:\\n  - ..."
    },
    {
      id:"tpl-stories",
      title:"Template User Stories + Prioridade",
      content:
"Backlog\\nMust:\\n- ...\\nShould:\\n- ...\\nCould:\\n- ...\\n\\nStory:\\nComo [usuário], quero [ação] para [benefício].\\nCritérios:\\n- ...\\n- ..."
    },
    {
      id:"tpl-caso-uso",
      title:"Template Caso de Uso",
      content:
"Nome:\\nAtor:\\nPré-condições:\\n\\nFluxo principal:\\n1) ...\\n\\nFluxos alternativos (erros):\\nA1) ...\\nA2) ...\\n\\nPós-condição:"
    },
    {
      id:"tpl-wireframe",
      title:"Template Wireframe + Campos",
      content:
"Wireframe (desenho simples)\\n\\nTabela de Campos:\\nCampo | Tipo | Obrigatório | Validação | Mensagem\\n..."
    },
    {
      id:"tpl-testes",
      title:"Template Cenários de Teste (Given/When/Then)",
      content:
"CT-01: [nome]\\nDado que ...\\nQuando ...\\nEntão ..."
    },
    {
      id:"tpl-pseudocodigo",
      title:"Template Pseudocódigo",
      content:
"INÍCIO\\n  declarar variáveis\\n  ENQUANTO condição\\n    ler entrada\\n    SE condição\\n      ação\\n    SENÃO\\n      erro\\n  FIM_ENQUANTO\\nFIM"
    },
    {
      id:"tpl-rubrica",
      title:"Template Rubrica (100 pontos)",
      content:
"Rubrica (100)\\n- 40: correção/funcionalidade\\n- 20: casos de erro e borda\\n- 20: clareza/organização\\n- 20: testes/critério"
    }
  ]
};

