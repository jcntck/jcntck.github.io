# Spec Delta

## Purpose

Conectar a aplicação à conta Google e persistir dados privados compartilhados pelos módulos, permitindo verificar a integração em produção antes de acrescentar regras de negócio.

## ADDED Requirements

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
O sistema MUST manter tokens apenas na memória da sessão e MUST NOT incluí-los em URLs, logs, armazenamento persistente ou artefatos públicos. A publicação MUST NOT conter segredos OAuth, senhas ou dados privados da conta.

#### Scenario: Inspecionar navegador e publicação
- **WHEN** são inspecionados o pacote publicado, URLs, logs e armazenamento persistente do navegador
- **THEN** não contêm tokens de usuário ou segredos OAuth
- **AND** o pacote estático não contém os dados privados armazenados no Drive

### Requirement: Preservar formato e dados dos módulos
O sistema SHALL usar um documento com formato versionado e preservar campos e seções compatíveis ao gravar outra seção. Um formato incompatível MUST ser recusado sem substituição automática.

#### Scenario: Atualizar somente a amostra técnica
- **WHEN** o documento possui seções de módulos e o usuário grava uma nova amostra
- **THEN** as seções existentes permanecem com os mesmos dados

#### Scenario: Formato incompatível
- **WHEN** o documento usa uma versão não suportada
- **THEN** o sistema informa incompatibilidade e não modifica o arquivo
