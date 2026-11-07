# Proposal

## Version

`0.3.0` — versão definida pelo usuário para login Google e navegação condicionada à sessão. A versão da aplicação permanece `0.2.2` durante o planejamento.

## Why

O hub já possui autorização Google para armazenamento, mas exibe a tela Conexão sem uma sessão de login global. Separar identidade de autorização organiza a entrada no aplicativo e estabelece um contrato para apresentar Conexão e os futuros módulos pessoais somente após login.

## What Changes

- Adicionar entrada explícita “Entrar com Google” e menu de conta no cabeçalho, mantendo Início público.
- Criar sessão de identidade compartilhada, distinta da autorização `drive.file`, com entrada, saída, expiração e troca de conta.
- Ocultar entradas pessoais sem login e verificar a sessão também ao abrir diretamente suas rotas; preservar destino interno válido para o retorno após login.
- Reutilizar a biblioteca GIS, o client ID público e o armazenamento existente, solicitando autorização do Drive apenas quando o usuário escolher conectar o armazenamento.
- Conferir que a conta autorizada no Drive corresponde à identidade do login, sem misturar documentos, links ou operações entre contas.
- Preparar o contrato de navegação para o futuro módulo de mangás, sem implementar nem antecipar sua liberação.
- Manter arquitetura estática no Pages, sem backend, banco ou serviço pago. A restrição de rotas organiza a experiência; o pacote estático permanece público e os dados privados continuam protegidos pelo Google.

## Capabilities

### New Capabilities

- `google-sign-in`: Identidade Google e ciclo de sessão no navegador, independentes da autorização de armazenamento, com correspondência entre contas e limpeza de dados.

### Modified Capabilities

- `modular-shell`: Navegação extensível passa a declarar acesso público ou dependente de login, com verificação de endereço direto e retorno ao destino interno.

## Impact

- `src/app/App.tsx` e `navigation.ts`: cabeçalho de conta, sessão compartilhada e política por rota/módulo; preservar HashRouter, acessibilidade e identificação pública.
- Integração Google: compartilhar carregamento/configuração GIS, acrescentar Sign in with Google e verificação de identidade; adaptar autorização do Drive para conferir o mesmo identificador OIDC.
- `CloudSession` permanece responsável por documento, revisão, tentativas e credencial do Drive; login coordena sua limpeza em saída/troca de conta.
- Acrescentar testes de identidade, navegação e integração no navegador, documentação de configuração e evidências da futura entrega `0.3.0`.
- Implementar em `dev` somente após publicação, testes em produção e homologação explícita de `add-cloud-library` (versão final revisada `0.2.2`). O usuário autorizou planejar esta etapa antes de mangás; sua implementação será solicitada separadamente.
- No futuro PR da implementação, atualizar pacote/lockfile e selecionar esta change na release. CI permanece sem deploy; usuário testa e faz o merge. Cada fix de revisão incrementa patch. Prod cria tag e publica o commit validado, sem alterar versões em `main`.

## Sequence and Acceptance

Sequência proposta aprovada na conversa: shell → cloud library → login Google → mangás. A aplicação de login aguarda homologação da biblioteca; mangás aguardam também publicação e homologação do login. Não agrupar implementações de versões diferentes.

Esta proposta exige login sem consentimento Drive, acesso direto bloqueado sem sessão, retorno seguro, recusa/cancelamento, identidade inválida/expirada, autorização Drive recusada ou expirada sem perda do login válido, divergência de contas e limpeza no logout. Homologar no endereço real em desktop e celular, registrando versão, SHA, execução e resultados sem dados privados.
