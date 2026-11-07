# Design

## Context

Ver `proposal.md`. Esta é a terceira etapa, posterior a `add-modular-shell` e `add-cloud-library`. Hoje existem documentos, não implementações dessas bases. Ao iniciar, conferir as evidências de publicação, testes e homologação das duas etapas, e consumir os contratos que elas tiverem entregue.

## Goals / Non-Goals

**Goals:** Entregar o valor de negócio da biblioteca de mangás; concentrar nesta etapa a experiência visual e a ergonomia dos formulários; preservar dados e contratos já homologados.

**Non-Goals:** Recriar React, CI/CD, OAuth, adaptador Drive ou tela técnica de diagnóstico; adicionar histórico por capítulo, catálogo externo, prazos, notificações ou edição offline.

## Decisions

### Versão e fluxo de entrega

A versão aprovada desta change é `1.0.0`. Conferir `dev` antes de editar e atualizar `package.json` e os campos de versão correspondentes do lockfile no PR de `dev` para `main`. Reutilizar o workflow dev para checks obrigatórios de lint, tipos, testes, build e coerência de versão. Após o merge, o workflow prod valida o commit final, cria `v1.0.0` com a versão do pacote e publica o mesmo artefato, sem incrementar versão nem criar commits em `main`.

Conferir versão alvo, pacote, lockfile, tag, SHA e identificação pública, comparando somente as changes da entrega atual. Tag existente só é reutilizável no mesmo commit; divergência falha sem sobrescrita. A publicação automática segue separada da homologação explícita do usuário.

A versão `1.0.0` marca a conclusão do MVP por decisão do usuário; não exige por si só alterar a versão 1 do formato de dados já homologado.

### Módulo sobre contratos existentes

Acrescentar `src/modules/mangas` e registrar a rota `#/mangas` no shell. O módulo recebe sessão e contrato de armazenamento compartilhados. Não importar a biblioteca Google nas regras de leitura. Estados de carregamento, erro, divergência e reconexão são consumidos da etapa 2, com apresentação apropriada ao formulário.

A seção `modules.mangas` do envelope versão 1 contém os registros. Ausência dessa seção significa biblioteca de mangás vazia, não ausência do documento inteiro. Ao salvar, preservar `diagnostics` e seções compatíveis existentes. Incluir validador da seção de domínio usando o mecanismo de armazenamento existente, sem alterar o schema global sem necessidade.

### Modelo de leitura

Cada registro possui `id` UUID estável, `title`, `lastChapter`, `lastReadOn` e `updatedAt`. Capítulo é texto obrigatório para aceitar “12.5” e “Extra 1”; título não é identificador único. Validar trim de título e capítulo e exigir data válida não futura no dia local.

Guardar `lastReadOn` como `YYYY-MM-DD`, um dia civil sem horário e sem conversão para UTC. `updatedAt` é um instante técnico e não determina quando a obra foi lida. Cadastro começa com hoje selecionado, sempre editável para registros retroativos. A edição mantém a data até uma mudança explícita, inclusive ao corrigir título ou capítulo.

Alternativas: capítulo inteiro restringiria extras; usar `updatedAt` como leitura falsificaria o tempo ao corrigir metadados; um histórico completo de leituras amplia o escopo sem necessidade nesta etapa.

### Tempo decorrido como informação

Calcular dias por diferença de dias civis, meses e anos por períodos completos de calendário. Usar aniversário ajustado ao último dia do mês quando necessário: 31/01 a 28/02 num ano não bissexto completa um mês, e 29/02/2024 a 28/02/2025 completa um ano. Mostrar a maior unidade completa, singular/plural e data absoluta em `dd/MM/yyyy`.

Recalcular ao abrir, recuperar foco e virar o dia local. Não dividir milissegundos por 24 horas para calcular dias civis. Se uma mudança de fuso tornar uma data existente aparentemente futura, mostrar a data e uma indicação neutra para conferência, sem tempo negativo ou alteração automática.

A referência global de seis meses ou um ano continua sendo um critério do leitor. Não persistir prazo por obra nem criar configuração de retorno, vencimento, filtros ou afirmação sobre capítulos publicados.

### Aparência definida e homologada nesta etapa

O shell inicial fornece a base funcional; o trabalho visual do módulo ocorre agora. Preparar uma prévia navegável para revisar hierarquia, formulário e estados da listagem, e refinar a aparência com o usuário durante esta etapa. Preferências de cor, tipografia e composição permanecem abertas; não são dependências para implementar CI/CD ou segurança.

O resultado precisa atender celular e computador, rótulos e foco visíveis, operação por teclado e mensagens compreensíveis. Oferecer estado vazio com cadastro e informação de salvamento remoto confirmado. Não inventar capa, busca externa, métricas ou componentes de domínio adicionais para preencher o layout.

### Confirmação de gravação e correção

Gerar identidade estável antes da primeira tentativa e usar o contrato de persistência da etapa 2. Atualizar a biblioteca apresentada como salva apenas após confirmação. Em falha ou divergência, preservar o formulário e apresentar as ações fornecidas pelo armazenamento; não reimplementar sincronização dentro do módulo. Correção preserva a identificação e altera somente os valores confirmados.

## Risks / Trade-offs

- [Mudanças visuais prejudicam campos e mensagens] → Testar interação por teclado, celular e computador e homologar a versão publicada.
- [Datas relativas erradas por fuso ou calendário] → Usar dias civis e testes com relógio controlado, fim de mês e ano bissexto.
- [Gravação apaga diagnóstico ou outro módulo] → Atualizar somente a seção de mangás e testar preservação do envelope.
- [Defeito na base reaparece no uso de negócio] → Corrigir o contrato responsável e repetir suas verificações antes de concluir a homologação do módulo.

## Delivery and Homologation

Iniciar somente depois das duas etapas anteriores publicadas, testadas e explicitamente homologadas. Testar regras e interação com adaptador em memória, depois com a integração real homologada. Publicar pelo pipeline existente e conferir cadastro retroativo, correção, mensagens de tempo, reabertura em outro dispositivo e revisão visual no endereço de produção.

Registrar versão, URL, commit, execução, resultados e homologação em `docs/releases/1.0.0.md`. Rollback usa o procedimento existente e não remove o arquivo do Drive. Como o módulo adiciona somente sua seção ao envelope compatível, manter dados extras preservados ao voltar a um frontend anterior. Testar essa preservação antes da entrega.

## Open Questions

- Nome amigável final do produto e preferências de cor, tipografia e composição, a refinar com uma prévia durante esta etapa sem ampliar os campos ou fluxos especificados.
