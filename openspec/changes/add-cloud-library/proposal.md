# Proposal

## Version

`0.2.0` — integração Google e segurança; tag automática `v0.2.0`.

## Why

Com o shell já publicado e homologado, precisamos validar acesso privado ao Google Drive sem misturar a integração com regras de mangás. Uma entrega técnica independente permite testar consentimento, isolamento entre contas, persistência e recuperação de falhas no endereço real de produção.

## What Changes

- Integrar Google Identity Services e Google Drive API à estrutura existente, com credencial temporária em memória e escopo limitado `drive.file`.
- Criar o contrato compartilhado de armazenamento e um arquivo JSON privado versionado, independente de qualquer módulo de negócio.
- Oferecer uma tela de conexão com ação explícita de gravar e reler uma amostra técnica, permitindo homologar persistência entre dispositivos sem cadastrar mangás.
- Tratar autorização recusada ou expirada, troca de conta, falha de rede, arquivo inválido e divergência conhecida antes de gravar.
- Publicar essa integração pelo CI/CD da etapa 1 e validar segurança e persistência no endereço de produção.
- Registrar resultados e obter homologação explícita antes de iniciar `add-manga-reading-tracker`.

## Capabilities

### New Capabilities

- `cloud-library`: Conexão Google, armazenamento privado compartilhado e verificação independente de gravação e leitura no Drive.

### Modified Capabilities

Nenhuma. A integração acrescenta uma entrada ao shell extensível sem redefinir seu contrato.

## Impact

- Implementar em `dev`, atualizando `package.json` e lockfile para `0.2.0` no PR para `main`. Após o merge, o workflow prod valida o commit, cria `v0.2.0` e publica sem commits automáticos de versão.
- Acrescentar `src/integrations/google-drive`, contrato de biblioteca compartilhada e tela técnica de conexão.
- Configurar projeto OAuth, escopos e origens exatas de desenvolvimento e produção; manter identificadores públicos e segredos separados.
- Reutilizar os workflows e o procedimento de entrega de `add-modular-shell`, sem reconstruí-los.
- Não introduzir dados de mangás, cálculo de tempo de leitura, identidade visual definitiva ou serviços pagos.
- A segurança depende do código da sessão e das permissões do Google; a página continua pública e esta etapa não promete edição simultânea transacional.

## Sequence and Acceptance

Etapa 2 de 3. Pré-condição de implementação: `add-modular-shell` publicado como `v0.1.0` e homologado, com evidências consultáveis. A disponibilidade de artefatos no OpenSpec não substitui essa condição.

A saída exige publicação identificada, demonstração real de gravação e leitura da amostra na mesma conta em outro dispositivo, validação de troca de conta, expiração ou revogação, erros e privacidade. Registrar URL, commit, execução, resultados e homologação do usuário antes de liberar a etapa 3.
