# Spec Delta

## MODIFIED Requirements

### Requirement: Proteger credenciais e sessões
O sistema MUST manter tokens Google usados para acessar o Drive apenas na memória da sessão, sem incluí-los em URLs, logs, armazenamento persistente ou artefatos públicos. A sessão de login do hub SHALL permitir persistência gerenciada por seu SDK de autenticação, sem cópias adicionais pelo aplicativo. A publicação MUST NOT conter credenciais de usuário, segredos OAuth ou dados privados da conta.

#### Scenario: Inspecionar navegador e publicação
- **WHEN** são inspecionados o pacote publicado, URLs, logs e armazenamento persistente do navegador
- **THEN** URLs, logs e artefatos públicos não contêm credenciais de usuário ou segredos OAuth
- **AND** o armazenamento persistente pode conter somente a credencial de login gerenciada pelo SDK, sem tokens Drive nem cópias adicionais feitas pelo hub
- **AND** o pacote estático não contém os dados privados armazenados no Drive

## ADDED Requirements

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

