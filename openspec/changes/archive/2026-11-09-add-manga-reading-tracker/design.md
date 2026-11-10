# Design

## Context

Ver `proposal.md`. Shell `0.1.0`, Drive `0.2.2` e login `0.3.1` já foram publicados e homologados, conforme `docs/releases/`. Consumir `Hub`, `CloudSession.stageSection`/`sync`, operações idempotentes e `DriveFileLink`, sem outra fila ou conexão Drive; o patch 0.4.6 persiste a sessão de dados localmente por conta.

## Goals / Non-Goals

**Goals:** Entregar o valor de negócio da biblioteca de mangás; concentrar nesta etapa a experiência visual e a ergonomia dos formulários; preservar dados e contratos já homologados.

**Non-Goals:** Recriar React, CI/CD, OAuth, adaptador Drive ou tela técnica de diagnóstico; adicionar histórico por capítulo, catálogo externo, prazos ou notificações.

## Decisions

### Versão e fluxo de entrega

Após abrir o PR, fornecer comandos de execução local e aguardar a avaliação do usuário. Cada fix que ele relatar incrementa o patch e atualiza pacote, lockfile e versão alvo desta change no mesmo PR. A versão indicada inicialmente é a base; a tag e a identificação pública usam a versão final revisada. O usuário realiza o merge pelo GitHub nas próximas entregas; não executar merge ou auto-merge por ele.

A base aprovada foi `0.4.0`; o patch atual desta change é `0.4.6` após revisão do titular. Conferir `dev` antes de editar e atualizar `package.json` e os campos de versão correspondentes do lockfile no PR de `dev` para `main`. Reutilizar o workflow dev para checks obrigatórios de lint, tipos, testes, build e coerência de versão. Após o merge, o workflow prod valida o commit final, cria `v0.4.6` com a versão do pacote e publica o mesmo artefato, sem incrementar versão nem criar commits em `main`.

Conferir versão alvo, pacote, lockfile, tag, SHA e identificação pública, comparando somente as changes da entrega atual. Tag existente só é reutilizável no mesmo commit; divergência falha sem sobrescrita. A publicação automática segue separada da homologação explícita do usuário.

A versão `0.4.6` substitui a previsão anterior `1.0.0` por decisão do usuário; o formato global dos dados permanece na versão 1.

### Módulo sobre contratos existentes

Acrescentar `src/modules/mangas` e registrar a rota `#/mangas` no shell. O módulo recebe sessão e contrato de armazenamento compartilhados. Não importar a biblioteca Google nas regras de leitura. Estados de carregamento, erro, divergência e reconexão são consumidos da etapa 2, com apresentação apropriada ao formulário.

A seção `modules.mangas` do envelope versão 1 é um objeto com `items`, uma lista dos registros. Propriedades extras da seção e dos registros são preservadas. Ausência dessa seção significa biblioteca de mangás vazia, não ausência do documento inteiro. Ao salvar, preservar `diagnostics` e seções compatíveis existentes. Incluir validador da seção de domínio usando o mecanismo de armazenamento existente, sem alterar o schema global sem necessidade.

### Modelo de leitura

Cada registro possui `id` UUID estável, `title`, `englishTitle` opcional, `lastChapter`, `lastReadOn`, `updatedAt` e os campos opcionais `scanUrl`, `scanName` (nome/label da origem) e `coverUrl` (capa HTTPS direta sem credenciais). Ausência da capa é compatível com registros existentes; campo vazio remove o endereço e nenhuma imagem binária é persistida. Links aceitam somente HTTP/HTTPS absolutos sem credenciais; registros antigos sem link ou nome permanecem compatíveis. Nome vazio usa o hostname como label; remover o link remove seu nome associado. Capítulo é texto obrigatório para aceitar “12.5” e “Extra 1”; título não é identificador único. Validar trim de título e capítulo e exigir data válida não futura no dia local.

Guardar `lastReadOn` como `YYYY-MM-DD`, um dia civil sem horário e sem conversão para UTC. `updatedAt` é um instante técnico e não determina quando a obra foi lida. Cadastro começa com hoje selecionado, sempre editável para registros retroativos. A edição mantém a data até uma mudança explícita, inclusive ao corrigir título ou capítulo.

Alternativas: capítulo inteiro restringiria extras; usar `updatedAt` como leitura falsificaria o tempo ao corrigir metadados; um histórico completo de leituras amplia o escopo sem necessidade nesta etapa.

### Tempo decorrido como informação

Calcular dias por diferença de dias civis, meses e anos por períodos completos de calendário. Usar aniversário ajustado ao último dia do mês quando necessário: 31/01 a 28/02 num ano não bissexto completa um mês, e 29/02/2024 a 28/02/2025 completa um ano. Calcular meses completos totais pelo aniversário do dia original ajustado ao último dia do mês; dividi-los em anos e meses e calcular os dias civis restantes desde esse aniversário. Mostrar sempre anos, meses e dias, inclusive zeros, com singular/plural natural e data absoluta em `dd/MM/yyyy`. Exemplo: 25/07/2024 a 09/11/2026 → “Lido há 2 anos 3 meses 15 dias”. Hoje resulta em “Lido há 0 anos 0 meses 0 dias”.

Recalcular ao abrir, recuperar foco e virar o dia local. Não dividir milissegundos por 24 horas para calcular dias civis. Se uma mudança de fuso tornar uma data existente aparentemente futura, mostrar a data e uma indicação neutra para conferência, sem tempo negativo ou alteração automática.

A referência global de seis meses ou um ano continua sendo um critério do leitor. Não persistir prazo por obra nem criar configuração de retorno, vencimento ou afirmação sobre capítulos publicados.

### Aparência definida e homologada nesta etapa

O shell inicial fornece a base funcional; o trabalho visual do módulo ocorre agora. Preparar uma prévia navegável para revisar hierarquia, formulário e estados da listagem, e refinar a aparência com o usuário durante esta etapa. Preferências de cor, tipografia e composição permanecem abertas; não são dependências para implementar CI/CD ou segurança.

O resultado precisa atender celular e computador, rótulos e foco visíveis, operação por teclado e mensagens compreensíveis. Oferecer estado vazio somente após leitura remota válida ou restauração de cache válido, cadastro e distinção entre alteração pendente e salvamento remoto confirmado. Não inventar busca externa, métricas ou componentes de domínio adicionais para preencher o layout.

### Confirmação de gravação e correção

Gerar identidade estável antes da primeira tentativa. Preparar a seção por `stageSection` após leitura remota ou cache válido, apresentando os valores como pendentes de envio. O módulo apresenta somente estado e Sincronizar. Conectar, reconectar, reler comparando as datas e gerenciar o arquivo ficam na página Conexão. Desconexão, expiração ou erro mostram alerta com acesso a essa página e bloqueiam envio até reconexão; cache válido permite consulta e edição. Todas as operações de mangás são marcadas como manuais na fila compartilhada, inclusive se o automático estiver habilitado em Conexão; preparar, cadastrar, corrigir, buscar e ordenar não fazem requisições ao Drive. Somente a releitura de confirmação permite apresentar a alteração como salva no Drive. Salvar leitura válida prepara a operação, fecha o formulário, limpa a busca para exibir o registro e move o foco para a obra; isso não confirma gravação remota. Entrada inválida mantém o formulário aberto. Em falha de sincronização, preservar pendências e qualquer formulário aberto, sem outra fila. Correção preserva identificação e campos extras. Atualizar ou desconectar preserva o cache e as pendências. Sair/trocar conta remove os dados visíveis da sessão; o cache isolado só volta após validar o login correspondente. Falha no localStorage mantém dados em memória e avisa para sincronizar antes de recarregar. A rota exige login e a conexão Drive é independente, sem popup ao abrir.

### Consulta local e link da scan (patch 0.4.3)

Busca pelo título principal ou pelo nome em inglês sem distinguir caixa ou acentos e ordenação por título A–Z/Z–A ou data de leitura mais antiga/recente. A ordenação padrão é título A–Z; empates usam título e UUID. Filtrar e ordenar não mudam a seção persistida ou a fila. Resultado vazio de busca é distinto de biblioteca vazia.

A listagem usa o nome opcional da scan como texto do link, com hostname como alternativa para registros antigos. Abre em nova aba sem referenciador; não executa fetch, HEAD, polling ou consulta de status. O patch 0.4.2 removeu por solicitação do titular a verificação entregue em 0.4.1; a capa 0.4.3 é somente exibição de imagem, sem restaurar consultas de status.

### Feedback e movimento

Ao salvar, destacar a obra e mostrar confirmação textual de salvamento local com pendência de sincronização, seguida do estado de confirmação remota somente após envio validado. Animar discretamente entrada do formulário, feedback, destaque da obra e interação dos botões. `prefers-reduced-motion: reduce` desativa animações/transições. Erros não fecham o formulário e não dependem só de cor. Foco visível permanece no registro após salvar e retorna ao cadastro ao cancelar.


### Capas e biblioteca paginada (patch 0.4.3)

Aceitar `coverUrl` opcional como HTTPS absoluto sem usuário/senha, editável/removível e compatível com registros sem capa. Renderizar `<img>` diretamente, sem `crossorigin`, fetch, canvas, cópia ou consulta HEAD. Usar dimensões reservadas, `loading="lazy"`, `decoding="async"` e `referrerPolicy="no-referrer"`. Imagens de terceiros podem recusar hotlink ou falhar; mostrar alternativa visual acessível sem repetir tentativas em loop. Trocar a URL permite nova tentativa. Apenas URLs são sincronizadas, sem Storage/Firebase adicional.

Após busca e ordenação, apresentar 12 obras por página e controles anterior/próxima/números com página atual, total e intervalo de registros. Para 126 obras, são 11 páginas, a última com 6. Navegação é local e monta imagens somente dos registros da página. Busca/ordem reiniciam na primeira página; salvar limpa a busca e abre a página que contém a obra, preservando fechamento/foco/feedback. Limitar a página quando a lista diminuir, sem tela vazia indevida. Trocar de página move o foco para o título da biblioteca. Paginação não modifica a ordem/dados persistidos, não faz chamadas Drive e não cria pendências.

### Edição e nome em inglês (patch 0.4.4)

`englishTitle` é um texto opcional informado pelo leitor, com trim, editável e removido ao esvaziar. Registros anteriores sem o campo continuam válidos. Mostrar abaixo do título principal, com estilo secundário e quebra para textos longos. Buscar inclui os dois nomes sem duplicar obras, ignorando caixa e acentos; ordenação continua usando título principal/data e a paginação permanece posterior ao filtro. Não traduzir nem consultar catálogos/serviços externos. Salvar preserva UUID, data, capa, scan e propriedades extras.

A ação visível Editar fica no rodapé de cada card, alinhada ao link da scan e à direita, com nome acessível incluindo a obra. O rodapé permanece com Editar quando não há scan. Em celular, permitir quebra de rótulos longos sem rolagem horizontal, mantendo alcance por teclado e estados de habilitação existentes. A edição mantém fechamento, foco, feedback e sincronização manual.

### Grade de capas (patch 0.4.5)

A referência visual fornecida pelo titular inspira a composição dos cards: capa vertical dominante 3:4, cantos arredondados e grade responsiva, seguida de título principal e inglês secundário em até duas linhas (texto completo no formulário/atributo de título), capítulo/data e tempo completo com os três níveis. Preservar a identidade visual e a navegação existentes. A referência não acrescenta novos comportamentos de biblioteca.

Em computador, distribuir cards por colunas conforme a largura disponível; em celular usar duas colunas e uma em telas muito estreitas. Reservar a área da imagem mesmo sem capa ou em falha, manter nomes longos legíveis e ações no rodapé. O rodapé com scan/Edit deve permanecer alinhado e sem cortes; permitir quebra do texto do link e priorizar seu nome em espaços estreitos. Cards da mesma linha alinham seus rodapés. Movimento sutil de hover somente quando há ponteiro e sem preferência por movimento reduzido.

O PR #4 da versão 0.4.4 já foi integrado pelo titular; o fix visual 0.4.5 segue em PR de continuação dev → main da mesma change, sem arquivamento ou nova funcionalidade inferida da imagem. A alteração é de apresentação: não muda dados, formato, cálculos, busca, paginação de 12, envio manual ou custos. Validar geometria das capas/colunas e os fluxos já existentes em desktop/celular.

### Cache por conta e resolução por data (patch 0.4.6)

`BrowserLibraryCache` persiste snapshot confirmado, fila existente (com UUID, data e política manual) e última sincronização sob `my-hub:library:v1:<Google subject>`. Restaurar somente depois do login validado da mesma identidade. Não guardar token Drive/OAuth ou sessão Firebase nesse cache. Nenhuma chamada Drive ocorre ao consultar, restaurar, buscar, ordenar ou paginar. Login de até 30 dias continua independente da autorização Drive volátil.

Cache válido permite consultar e preparar edições sem reconectar o Drive. Pendências sobrevivem a refresh, saída e desconexão, sem virar confirmação remota. Logout/troca/expiração do login limpam o estado privado em memória; caches permanecem separados por identidade. Primeira carga sem cache exige Conexão. JSON/schema inválido e localStorage bloqueado/sem espaço não criam biblioteca vazia nem apagam pendências; mostrar aviso e manter fallback em memória. Formulário ainda não salvo permanece volátil. Não avisar descarte ao recarregar pendências já persistidas com sucesso.

Cada operação recebe `updatedAt` ISO no instante da edição e o envelope recebe essa mesma data ao aplicar a operação; não usar o dia de leitura nem atualizar a data ao ler/enviar novamente. A lista de arquivos Drive inclui `modifiedTime` como fallback para arquivos legados sem data no envelope. Na leitura/reconexão, comparar a data da edição local mais recente com a remota: local estritamente maior mantém as pendências, caso contrário o remoto substitui as pendências. Mesmo sem pendências, se a biblioteca de mangás confirmada no cache tiver data maior, manter sua seção como pendência manual com a data original; outras seções permanecem remotas. UUID/valor já confirmado recupera resposta perdida sem escrita duplicada. Reler usa a mesma comparação, sem descarte cego.

Na escrita manual, o adaptador relê antes de gravar: se o remoto ganhou por data, retorná-lo sem PATCH/POST; se o local é mais recente, aplicar a seção pendente sobre a cópia remota para preservar diagnóstico, extras e outros módulos. Operações antigas sem data mantêm detecção conservadora de conflito. A confirmação continua por releitura e comparação de conteúdo. Ausência de arquivo só é aceita após busca válida; falha de rede não significa ausência.

A estratégia é last-write-wins e não mescla alterações concorrentes da mesma seção. Datas dependem de relógios coerentes entre dispositivos; empate favorece o Drive. Usar um dispositivo/aba por vez durante edições. localStorage é limitado à origem/navegador e pode ser apagado pelo usuário; o Drive continua sendo a cópia entre dispositivos. Nenhum serviço ou cota pagos são adicionados.

### Três faixas de tempo decorrido

Menos de 6 meses completos: texto discreto; de 6 meses até menos de 12: destaque intermediário; a partir de 12 meses: destaque forte. Usar contraste legível, peso e fundo junto à cor. Indicar os cortes na interface; os valores completos continuam explícitos para não depender apenas de cor. Nenhum prazo, agendamento ou rótulo de atraso é persistido. As faixas e o texto são recalculados com o dia local e preservam a data original.

## Risks / Trade-offs

- [Mudanças visuais prejudicam campos e mensagens] → Testar interação por teclado, celular e computador e homologar a versão publicada.
- [Datas relativas erradas por fuso ou calendário] → Usar dias civis e testes com relógio controlado, fim de mês e ano bissexto.
- [Gravação apaga diagnóstico ou outro módulo] → Atualizar somente a seção de mangás e testar preservação do envelope.
- [Defeito na base reaparece no uso de negócio] → Corrigir o contrato responsável e repetir suas verificações antes de concluir a homologação do módulo.

## Delivery and Homologation

Iniciar somente depois das etapas anteriores publicadas, testadas e explicitamente homologadas. Testar regras e interação com adaptador em memória, depois com a integração real homologada. Publicar pelo pipeline existente e conferir cadastro retroativo, correção, mensagens de tempo, reabertura em outro dispositivo e revisão visual no endereço de produção.

Registrar versão, URL, commit, execução, resultados e homologação em `docs/releases/0.4.6.md`. Rollback usa o procedimento existente e não remove o arquivo do Drive. Como o módulo adiciona somente sua seção ao envelope compatível, manter dados extras preservados ao voltar a um frontend anterior. Testar essa preservação antes da entrega.

## Open Questions

- Nome amigável final do produto e preferências de cor, tipografia e composição, a refinar com uma prévia durante esta etapa sem ampliar os campos ou fluxos especificados.
