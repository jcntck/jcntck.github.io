# Spec Delta

## ADDED Requirements

### Requirement: Reaproveitar a identidade validada na autorização Drive
O sistema SHALL usar a identidade Google validada do login como indicação ao solicitar autorização Drive, sem forçar escolha de conta ou novo consentimento em toda reconexão. A autorização SHALL começar somente por ação explícita. A indicação MUST NOT substituir a conferência da conta retornada nem ampliar os escopos existentes. A UI MUST admitir que o Google ainda pode exigir interação.

#### Scenario: Reconectar a conta conhecida
- **WHEN** o usuário com login válido solicita conectar ou sincronizar com Drive e já concedeu os escopos necessários
- **THEN** a solicitação identifica a conta esperada e não força seleção de conta nem novo consentimento
- **AND** se o Google devolver autorização válida, a conta retornada é conferida antes de consultar o documento ou habilitar escrita

#### Scenario: Google exigir interação adicional
- **WHEN** o Google exige seleção, entrada ou consentimento apesar da indicação da conta
- **THEN** o usuário pode concluir essa interação ou cancelar, sem promessa de acesso silencioso ou permanente
- **AND** cancelar mantém login válido e pendências locais, sem enviar alterações ao Drive

#### Scenario: Receber uma conta diferente da indicada
- **WHEN** o login pertence a A e a autorização obtida pertence a B
- **THEN** a credencial é descartada antes de consultar documentos ou enviar pendências
- **AND** dados e operações de A não são apresentados nem enviados como pertencentes a B

#### Scenario: Reabrir a aplicação ou restaurar o login
- **WHEN** o usuário recarrega o site, retorna à aba ou tem o login restaurado
- **THEN** nenhuma autorização Drive é aberta automaticamente e nenhum token Drive é recuperado de armazenamento
- **AND** login, cache da biblioteca e autorização Drive conservam seus ciclos de vida separados

### Requirement: Recuperar a reconexão sem perder a sessão válida
O sistema SHALL permitir repetir uma autorização Drive não concluída e oferecer escolha explícita de conta na página Conexão quando a indicação não resolver. MUST manter a verificação da mesma identidade do login e preservar o cache e pendências da conta autenticada. Logout, troca ou expiração do login MUST invalidar uma autorização em andamento e seus resultados tardios.

#### Scenario: Popup bloqueado ou autorização recusada
- **WHEN** o popup não abre, o usuário o fecha, recusa acesso ou a biblioteca de autorização não carrega
- **THEN** a UI explica a falha e oferece nova tentativa explícita, sem repetir popups em ciclo
- **AND** não encerra um login ainda válido nem descarta alterações locais por causa da falha de autorização

#### Scenario: Escolher conta para recuperar o acesso
- **WHEN** o usuário solicita explicitamente escolher uma conta em Conexão após uma falha de indicação
- **THEN** pode usar a seleção do Google e concluir a conexão somente com a identidade do login atual
- **AND** para usar outra identidade no hub, utiliza a troca de login existente

#### Scenario: Encerrar login durante a autorização
- **WHEN** o login é encerrado, trocado ou expira enquanto o Google processa a autorização
- **THEN** callbacks e respostas da sessão anterior não restauram a conexão nem iniciam leitura ou envio de documentos
- **AND** nenhum token obtido é persistido ou reutilizado pela nova conta
