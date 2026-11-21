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
O sistema SHALL consultar a versão remota antes de salvar e usar a data técnica de edição para operações com updatedAt. A atualização local SHALL prevalecer somente quando estritamente posterior à remota; versão remota mais recente ou empatada SHALL ser adotada sem escrita. Arquivos legados sem data no envelope SHALL usar modifiedTime. Operações antigas sem data MUST manter a detecção conservadora de conflito.

#### Scenario: Sessão desatualizada
- **WHEN** a cópia remota é mais recente ou empatada com a edição local
- **THEN** o sistema atualiza o cache e remove as pendências superadas, sem PATCH/POST

#### Scenario: Local mais recente
- **WHEN** a edição local é mais recente e o usuário solicita sincronização
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
O sistema SHALL compartilhar os estados de identidade, conexão Drive e sincronização entre shell e consumidores, distinguindo alteração pendente de sucesso remoto. A ação “Sincronizar” MUST usar a conta conferida e confirmar conclusão somente após sucesso remoto; sem pendência, uma leitura explícita não cria arquivo nem nova alteração.

#### Scenario: Preparar e enviar amostra técnica
- **WHEN** o usuário prepara uma amostra e depois escolhe sincronizar
- **THEN** a alteração passa por pendente, envio e confirmação remota, sem confirmar gravação ao apenas preparar
- **AND** a releitura retorna o mesmo identificador, preservando as demais seções

#### Scenario: Sincronizar sem conexão
- **WHEN** o usuário solicita sincronização sem autorização Drive válida
- **THEN** recebe ação explícita de reconexão sem perder o login e sem enviar dados antes de conferir conta e documento

#### Scenario: Falha ou divergência
- **WHEN** a sincronização falha ou detecta revisão remota divergente
- **THEN** o estado informa erro ou conflito e mantém a tentativa na aba até repetir ou descartar explicitamente

#### Scenario: Editar durante envio
- **WHEN** uma nova alteração é preparada enquanto a anterior está sendo enviada
- **THEN** a confirmação da anterior não descarta a nova alteração nem a apresenta como já salva

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
