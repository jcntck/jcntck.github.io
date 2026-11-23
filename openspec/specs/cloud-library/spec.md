# cloud-library Specification

## Purpose

Conectar a aplicação à conta Google e persistir dados privados compartilhados pelos módulos, permitindo verificar a integração em produção antes de acrescentar regras de negócio.

## Requirements

### Requirement: Autorizar acesso privado ao armazenamento
O sistema SHALL solicitar autorização Google por ação do usuário antes de acessar o Drive e limitar o acesso aos arquivos usados pelo aplicativo. Os dados MUST permanecer privados, salvo compartilhamento externo feito pelo próprio titular.

#### Scenario: Autorizar a conexão
- **WHEN** o usuário conecta o Drive e autoriza o acesso
- **THEN** o sistema acessa somente os dados da conta autorizada dentro do escopo solicitado
- **AND** não solicita acesso geral a todos os arquivos do Drive

#### Scenario: Recusar ou cancelar autorização
- **WHEN** o usuário recusa ou cancela o consentimento
- **THEN** o sistema informa que a conexão não foi concluída, permite tentar novamente e não cria ou altera arquivos

### Requirement: Carregar dados antes de permitir gravação
O sistema SHALL carregar um documento remoto ou cache local válido da conta autenticada antes de permitir edição. Envio ao Drive MUST exigir conta/autorização conferidas e nova consulta remota. Ausência confirmada SHALL resultar em estado vazio; cache inexistente, erros, conteúdo inválido ou arquivos ambíguos MUST NOT ser tratados como ausência de dados.

#### Scenario: Primeiro acesso
- **WHEN** não existe cache e uma consulta Drive bem-sucedida confirma ausência do documento
- **THEN** o sistema indica ausência e só cria arquivo após sincronização explícita com pendência

#### Scenario: Cache disponível
- **WHEN** o login é validado e há cache válido da mesma identidade Google
- **THEN** o sistema restaura biblioteca e pendências sem chamadas Drive, permitindo consulta e edição local
- **AND** sincronização remota exige reconexão explícita e conferência da conta

#### Scenario: Falha ou ambiguidade de carregamento
- **WHEN** cache ou documento remoto são inválidos ou o Drive retorna vários candidatos
- **THEN** o sistema informa o problema sem criar substituto nem sobrescrever dados desconhecidos

### Requirement: Verificar persistência sem módulo de negócio
O sistema SHALL oferecer uma tela de conexão que permita gravar uma amostra técnica identificável e relê-la do Drive por ações explícitas. Essa verificação MUST funcionar sem cadastro de mangás e MUST preservar os demais dados do documento.

#### Scenario: Gravar e reler amostra
- **WHEN** o usuário conectado solicita gravar uma amostra e depois solicita relê-la
- **THEN** a tela apresenta o mesmo identificador obtido numa nova leitura remota
- **AND** a confirmação de gravação ocorre somente após sucesso do Drive

#### Scenario: Consultar em outro dispositivo
- **WHEN** o usuário conecta a mesma conta em outro dispositivo e solicita carregar os dados
- **THEN** encontra a mesma amostra técnica persistida

### Requirement: Confirmar gravação e permitir repetição segura
O sistema SHALL indicar gravação em andamento e confirmar salvamento somente após sucesso remoto. Falhas MUST preservar a alteração na página aberta e permitir nova tentativa sem duplicar a operação já concluída no Drive.

#### Scenario: Falha de gravação
- **WHEN** a gravação falha ou sua resposta não chega ao navegador
- **THEN** o sistema não afirma que salvou e mantém os dados da tentativa enquanto a página permanecer aberta

#### Scenario: Resposta perdida após sucesso remoto
- **WHEN** uma operação já gravada é repetida após perda de resposta
- **THEN** o sistema reconhece a identificação e os dados da operação e evita duplicá-la

### Requirement: Detectar divergência conhecida antes de salvar
O sistema SHALL consultar a versão remota antes de salvar. Mangás SHALL usar a mescla por obra; as demais seções SHALL usar a data técnica de edição para operações com updatedAt. Nas demais seções, a atualização local SHALL prevalecer somente quando estritamente posterior à remota; versão remota mais recente ou empatada SHALL ser adotada sem escrita. Arquivos legados sem data no envelope SHALL usar modifiedTime. Operações antigas sem data MUST manter a detecção conservadora de conflito.

#### Scenario: Sessão desatualizada
- **WHEN** uma seção diferente de mangás tem cópia remota mais recente ou empatada com a edição local
- **THEN** o sistema atualiza o cache e remove as pendências superadas, sem PATCH/POST

#### Scenario: Local mais recente
- **WHEN** uma seção diferente de mangás tem edição local mais recente e o usuário solicita sincronização
- **THEN** a seção local é aplicada sobre a versão remota preservando outras seções e extras e confirmada por releitura
- **AND** consultar, restaurar ou repetir envio não muda a data de edição

### Requirement: Reconectar sem misturar contas
O sistema SHALL permitir reconexão após expiração ou revogação. Desconectar o Drive MUST remover a credencial em memória e preservar a cópia local da conta autenticada. Logout, troca ou expiração do login MUST remover os dados privados visíveis da sessão. Caches SHALL ser separados por identidade Google e restaurados somente após validar o login correspondente. Operações pendentes MUST ser retomadas somente na mesma conta, após conferência remota e comparação por data.

#### Scenario: Expiração durante operação
- **WHEN** o Drive rejeita uma operação por autorização expirada
- **THEN** o sistema preserva a alteração local e oferece reconexão por ação do usuário
- **AND** a biblioteca continua consultável com login válido

#### Scenario: Trocar de conta
- **WHEN** o login muda de A para B
- **THEN** a tela apresenta somente dados/cache de B e não transfere operações de A
- **AND** o cache de A só volta à UI depois de login validado de A

### Requirement: Proteger credenciais e sessões
O sistema MUST manter tokens Drive apenas em memória, sem URLs, logs, armazenamento persistente ou artefatos públicos. A sessão de login SHALL usar persistência gerenciada pelo SDK, sem cópias de credenciais pelo hub. O cache local SHALL conter somente dados da biblioteca, operações e metadados, separado por identidade. A publicação MUST NOT conter credenciais de usuário, segredos OAuth ou dados privados da conta.

#### Scenario: Inspecionar navegador e publicação
- **WHEN** são inspecionados pacote publicado, URLs, logs e persistência do navegador
- **THEN** não há tokens Drive, segredos OAuth ou cópias adicionais de credenciais de login feitas pelo hub
- **AND** somente o navegador guarda cache de biblioteca por conta e o SDK guarda sua própria sessão de login
- **AND** o pacote estático não contém dados privados da biblioteca

### Requirement: Preservar formato e dados dos módulos
O sistema SHALL usar um documento com formato versionado e preservar campos e seções compatíveis ao gravar outra seção. Um formato incompatível MUST ser recusado sem substituição automática.

#### Scenario: Atualizar somente a amostra técnica
- **WHEN** o documento possui seções de módulos e o usuário grava uma nova amostra
- **THEN** as seções existentes permanecem com os mesmos dados

#### Scenario: Formato incompatível
- **WHEN** o documento usa uma versão não suportada
- **THEN** o sistema informa incompatibilidade e não modifica o arquivo

### Requirement: Abrir arquivo confirmado no Google Drive
O sistema SHALL exibir link para o documento confirmado da conta atual após leitura ou restauração de cache válido. O componente MUST ser reutilizável, abrir em nova aba sem tokens e respeitar as permissões existentes. Logout/troca de conta MUST remover o link da sessão anterior; desconectar o Drive SHALL permitir mantê-lo para a mesma conta autenticada.

#### Scenario: Inspecionar o documento
- **WHEN** leitura ou cache válido identifica o documento da conta autenticada
- **THEN** a tela oferece abrir o visualizador, inclusive com autorização Drive desconectada
- **AND** sair ou trocar a conta remove o link anterior da UI

### Requirement: Coordenar sincronização com estado compartilhado
O sistema SHALL compartilhar identidade, conexão Drive e sincronização entre shell e consumidores, distinguindo pendência de sucesso remoto. Sincronizar SHALL obter autorização quando necessária, conferir conta e documento e só confirmar sucesso após conclusão remota. Sem pendência, SHALL apenas reler, sem criar arquivo ou alteração. Falha de autorização ou leitura MUST impedir envio e preservar pendências não superadas pela política de atualização.

#### Scenario: Preparar e enviar amostra técnica
- **WHEN** o usuário prepara uma amostra e depois escolhe sincronizar
- **THEN** a alteração passa por pendente, envio e confirmação remota, sem confirmar gravação ao apenas preparar
- **AND** a releitura retorna o mesmo identificador, preservando as demais seções

#### Scenario: Sincronizar sem conexão
- **WHEN** o usuário logado solicita Sincronizar sem autorização Drive válida
- **THEN** esse clique inicia a reconexão compartilhada e, se concluída com a mesma conta e documento válido, prossegue com a sincronização solicitada
- **AND** mantém o login e não envia dados antes de conferir conta e documento

#### Scenario: Falha ou divergência
- **WHEN** a sincronização falha ou detecta revisão remota divergente
- **THEN** o estado informa erro ou conflito e mantém a tentativa não superada pela política de atualização até nova ação explícita
- **AND** obras são mescladas pela data individual, preservando títulos exclusivos; uma versão remota mais recente ou empatada da mesma obra é adotada sem declarar enviada uma alteração local superada

#### Scenario: Editar durante envio
- **WHEN** uma nova alteração é preparada enquanto a anterior está sendo enviada
- **THEN** a confirmação da anterior não descarta a nova alteração nem a apresenta como já salva

#### Scenario: Cancelar autorização ou falhar na leitura
- **WHEN** a autorização solicitada por Sincronizar é cancelada, recusada, retorna outra conta ou não permite carregar um documento válido
- **THEN** nenhuma escrita é feita e as pendências locais permanecem recuperáveis
- **AND** a interface distingue falha de autorização/leitura de sincronização confirmada e permite nova tentativa explícita

#### Scenario: Sincronizar sem alterações pendentes
- **WHEN** o usuário solicita Sincronizar sem pendências, inclusive após obter nova autorização
- **THEN** a aplicação apresenta o resultado da leitura remota sem criar documento vazio ou nova operação
- **AND** não anuncia gravação de uma alteração que não foi enviada

### Requirement: Limitar sincronização automática à sessão autorizada
O sistema SHALL oferecer sincronização manual por padrão. A automação, habilitada explicitamente na sessão, MUST executar apenas para alterações pendentes com aplicação aberta, conta conferida e token Drive válido. MUST serializar operações, pausar em falha/expiração/conflito e não abrir consentimento automaticamente.

#### Scenario: Automação habilitada
- **WHEN** há nova alteração pendente e a automação foi habilitada com a conta Drive válida
- **THEN** o sistema agenda uma tentativa sem criar gravações concorrentes ou operações duplicadas

#### Scenario: Sem credencial ou aplicação fechada
- **WHEN** o token Drive expira, a sessão termina ou a aplicação é fechada
- **THEN** não há promessa de sincronização agendada em segundo plano
- **AND** reconexão exige ação explícita do usuário

### Requirement: Persistir biblioteca e operações localmente
O sistema SHALL persistir snapshot confirmado e fila compartilhada no localStorage por identidade Google, mantendo UUID, data e política manual. Refresh/desconexão MUST preservar dados e pendências sem envio ou consulta Drive. Falhas de cache MUST manter fallback em memória com aviso explícito; cache inválido MUST NOT substituir dados válidos por vazio.

#### Scenario: Reabrir com pendência
- **WHEN** o usuário recarrega com login válido e cache da mesma conta
- **THEN** encontra biblioteca e edições pendentes sem autorizar ou acessar Drive
- **AND** sincronização manual continua necessária e tokens Drive não são restaurados

#### Scenario: Cota ou bloqueio local
- **WHEN** o cache não pode ser lido ou gravado
- **THEN** a UI informa a limitação, mantém dados em memória e orienta sincronizar antes de recarregar pendências não persistidas

### Requirement: Compartilhar a retomada explícita de autorização
O sistema SHALL oferecer o mesmo fluxo de autorização e sincronização aos consumidores do armazenamento. Conectar ou Reconectar isoladamente MUST apenas conferir a conta e carregar o documento, sem enviar pendências. Sincronizar SHALL obter autorização se necessário e continuar o envio solicitado somente após conferência remota bem-sucedida. O fluxo MUST serializar autorizações e envios.

#### Scenario: Conectar sem enviar alterações
- **WHEN** o usuário conecta ou reconecta o Drive em Conexão com alterações pendentes
- **THEN** a conta e o documento são conferidos e as pendências ainda aplicáveis permanecem aguardando sincronização
- **AND** a conexão isolada não faz gravação mesmo se havia automação habilitada

#### Scenario: Solicitar sincronização durante autorização ou envio
- **WHEN** o usuário repete Sincronizar ou outro consumidor solicita a ação enquanto já há autorização ou envio em andamento
- **THEN** a aplicação não abre popups nem inicia gravações concorrentes para a mesma sessão
- **AND** os consumidores exibem um estado compartilhado coerente de progresso e conclusão

#### Scenario: Carregar o serviço de autorização
- **WHEN** o usuário precisa autorizar, mas o serviço Google ainda está carregando ou falhou
- **THEN** a interface informa o estado e oferece uma ação explícita utilizável quando o serviço estiver pronto
- **AND** concluir o carregamento não abre um popup sem novo acionamento do usuário

### Requirement: Distinguir confirmações temporárias de atenção persistente
Confirmações de conexão, leitura e sincronização sem pendências ou problemas SHALL aparecer em verde por três segundos. Progresso SHALL usar estilo neutro. Pendências, cache indisponível, erros e conflitos SHALL permanecer visíveis enquanto aplicáveis. Nova confirmação SHALL reaparecer e reiniciar seu prazo; renderizações alheias MUST NOT prolongá-lo. Descartar o aviso MUST NOT alterar a fila ou a conexão.

#### Scenario: Concluir e dispensar uma confirmação
- **WHEN** uma operação termina com sucesso sem pendências ou problemas
- **THEN** a confirmação verde desaparece após três segundos e os controles permanecem disponíveis

#### Scenario: Exigir atenção após um sucesso
- **WHEN** uma pendência, falha ou conflito substitui a confirmação
- **THEN** o estado de atenção fica visível e o timer anterior não o remove

### Requirement: Mesclar biblioteca por obra
O sistema SHALL mesclar mangás por UUID ou título normalizado, preservando obras exclusivas apesar da data global. Repetições SHALL usar o registro completo de maior updatedAt, com empate a favor do Drive. A regra SHALL valer ao conectar, reler e enviar antes de substituir conteúdo local. Dados incompatíveis SHALL bloquear a mescla sem descartar pendências. Outros módulos SHALL ser preservados.

#### Scenario: Bibliotecas divergentes e documento remoto mais recente
- **WHEN** cache contém A e B e Drive contém uma versão mais recente de A e uma obra C, com documento remoto mais recente
- **THEN** a biblioteca mesclada contém A atualizada, B e C
- **AND** conectar mantém a mescla pendente sem gravar; sincronizar grava e confirma a união por releitura

#### Scenario: Título repetido com IDs diferentes
- **WHEN** duas obras possuem o mesmo título após normalizar maiúsculas e espaços, com UUIDs diferentes
- **THEN** apenas a versão com updatedAt mais recente é apresentada; em empate prevalece Drive

#### Scenario: Exclusão explícita e cópia antiga
- **WHEN** uma exclusão datada é mesclada com registro anterior da mesma obra
- **THEN** a obra permanece excluída e o marcador é preservado no cache e no Drive
- **AND** ausência em um arquivo sem marcador não apaga obras exclusivas da outra cópia

#### Scenario: Resposta perdida ou fila posterior
- **WHEN** uma gravação mesclada perde a resposta ou há edição posterior em fila
- **THEN** a releitura recupera o resultado confirmado e mantém edições posteriores sem descartar obras independentes ou duplicar títulos
