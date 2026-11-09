# Spec Delta

## MODIFIED Requirements

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

### Requirement: Abrir arquivo confirmado no Google Drive
O sistema SHALL exibir link para o documento confirmado da conta atual após leitura ou restauração de cache válido. O componente MUST ser reutilizável, abrir em nova aba sem tokens e respeitar as permissões existentes. Logout/troca de conta MUST remover o link da sessão anterior; desconectar o Drive SHALL permitir mantê-lo para a mesma conta autenticada.

#### Scenario: Inspecionar o documento
- **WHEN** leitura ou cache válido identifica o documento da conta autenticada
- **THEN** a tela oferece abrir o visualizador, inclusive com autorização Drive desconectada
- **AND** sair ou trocar a conta remove o link anterior da UI

## ADDED Requirements

### Requirement: Persistir biblioteca e operações localmente
O sistema SHALL persistir snapshot confirmado e fila compartilhada no localStorage por identidade Google, mantendo UUID, data e política manual. Refresh/desconexão MUST preservar dados e pendências sem envio ou consulta Drive. Falhas de cache MUST manter fallback em memória com aviso explícito; cache inválido MUST NOT substituir dados válidos por vazio.

#### Scenario: Reabrir com pendência
- **WHEN** o usuário recarrega com login válido e cache da mesma conta
- **THEN** encontra biblioteca e edições pendentes sem autorizar ou acessar Drive
- **AND** sincronização manual continua necessária e tokens Drive não são restaurados

#### Scenario: Cota ou bloqueio local
- **WHEN** o cache não pode ser lido ou gravado
- **THEN** a UI informa a limitação, mantém dados em memória e orienta sincronizar antes de recarregar pendências não persistidas
