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
O sistema SHALL carregar o documento existente antes de permitir alterações. Ausência confirmada SHALL resultar em estado vazio; erros, conteúdo inválido ou arquivos candidatos ambíguos MUST NOT ser tratados como ausência de dados.

#### Scenario: Primeiro acesso
- **WHEN** a consulta bem-sucedida confirma que ainda não existe documento do aplicativo
- **THEN** o sistema indica ausência de dados e aguarda uma ação explícita antes de criar o arquivo

#### Scenario: Falha ou ambiguidade de carregamento
- **WHEN** a consulta falha, o arquivo é inválido ou há mais de um candidato
- **THEN** o sistema informa o problema e não cria substituto nem sobrescreve dados desconhecidos

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
O sistema SHALL consultar a versão remota antes de salvar dados previamente carregados. Alteração remota detectada MUST impedir a sobrescrita automática e permitir recarregar após decisão explícita, preservando a alteração local enquanto o usuário decide.

#### Scenario: Sessão desatualizada
- **WHEN** um dispositivo tenta salvar com base numa versão anterior à já gravada por outro
- **THEN** o sistema informa a divergência, não sobrescreve e preserva a alteração local até a decisão de recarregar

### Requirement: Reconectar sem misturar contas
O sistema SHALL permitir reconexão após expiração ou revogação. Dados e credenciais da conta anterior MUST ser removidos ao desconectar ou trocar de conta. Uma operação pendente MUST ser retomada somente na mesma conta, após nova conferência dos dados remotos.

#### Scenario: Expiração durante operação
- **WHEN** o Drive rejeita uma operação por autorização expirada
- **THEN** o sistema preserva a alteração na página e oferece reconexão por ação do usuário
- **AND** confere conta e versão remota antes de retomar a operação

#### Scenario: Trocar de conta
- **WHEN** o usuário desconecta A e conecta B
- **THEN** a tela apresenta somente os dados de B e não transfere alterações pendentes de A

### Requirement: Proteger credenciais e sessões
O sistema MUST manter tokens Google usados para acessar o Drive apenas na memória da sessão, sem incluí-los em URLs, logs, armazenamento persistente ou artefatos públicos. A sessão de login do hub SHALL permitir persistência gerenciada por seu SDK de autenticação, sem cópias adicionais pelo aplicativo. A publicação MUST NOT conter credenciais de usuário, segredos OAuth ou dados privados da conta.

#### Scenario: Inspecionar navegador e publicação
- **WHEN** são inspecionados o pacote publicado, URLs, logs e armazenamento persistente do navegador
- **THEN** URLs, logs e artefatos públicos não contêm credenciais de usuário ou segredos OAuth
- **AND** o armazenamento persistente pode conter somente a credencial de login gerenciada pelo SDK, sem tokens Drive nem cópias adicionais feitas pelo hub
- **AND** o pacote estático não contém os dados privados armazenados no Drive

### Requirement: Preservar formato e dados dos módulos
O sistema SHALL usar um documento com formato versionado e preservar campos e seções compatíveis ao gravar outra seção. Um formato incompatível MUST ser recusado sem substituição automática.

#### Scenario: Atualizar somente a amostra técnica
- **WHEN** o documento possui seções de módulos e o usuário grava uma nova amostra
- **THEN** as seções existentes permanecem com os mesmos dados

#### Scenario: Formato incompatível
- **WHEN** o documento usa uma versão não suportada
- **THEN** o sistema informa incompatibilidade e não modifica o arquivo

### Requirement: Abrir arquivo confirmado no Google Drive
O sistema SHALL exibir um link para abrir no Drive o documento da conta conectada após criação confirmada ou leitura. O componente MUST ser reutilizável por módulos futuros, abrir em nova aba sem tokens na URL e desaparecer quando o documento da conta anterior for removido da sessão. O acesso MUST respeitar as permissões existentes do arquivo.

#### Scenario: Inspecionar o documento
- **WHEN** a gravação ou leitura confirma um documento da conta atual
- **THEN** a tela oferece abrir o visualizador do Drive para esse arquivo
- **AND** desconectar remove esse link junto com os dados da conta

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
