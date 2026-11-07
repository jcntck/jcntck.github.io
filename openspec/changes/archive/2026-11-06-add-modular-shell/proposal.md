# Proposal

## Version

`0.1.0` — primeira entrega publicada do shell; tag automática `v0.1.0`.

## Why

Precisamos validar a base web e o processo real de entrega antes de integrar serviços e regras de negócio. Publicar um shell pequeno como versão 0.1 permite testar CI/CD, navegação, rastreabilidade e recuperação de falhas em produção de forma independente.

## What Changes

- Criar uma aplicação React, TypeScript e Vite em um único repositório, organizada para receber módulos internos.
- Entregar uma página inicial simples, navegação extensível e identificação da versão publicada, sem módulo de mangás ou integração Google.
- Desenvolver em `dev` e entregar exclusivamente por PR para `main`, mantendo sua proteção.
- Implementar o workflow dev ao abrir, atualizar ou reabrir PR para `main`, com instalação reproduzível, lint, tipos, testes, build e validação de origem e versão; configurar checks obrigatórios para merge.
- Implementar o workflow prod após o merge, pelo evento `push` em `main`: validar e gerar o build do commit final, criar automaticamente a tag da versão e publicar no Pages na mesma execução.
- Criar `package.json` e lockfile com versão `0.1.0` em `dev`; produção lê essa versão sem gerar commits de incremento na branch protegida.
- Verificar o site real após a publicação e exercitar recuperação da versão estática anterior quando houver uma disponível.
- Encerrar a etapa apenas com evidências de produção e homologação do usuário, antes de iniciar `add-cloud-library`.

## Capabilities

### New Capabilities

- `modular-shell`: Navegação extensível e distribuição estática versionada, com verificações de entrega e identificação da publicação.

### Modified Capabilities

Nenhuma. O projeto ainda não possui aplicação ou especificações duráveis.

## Impact

- Introduzir `src/app`, ponto de entrada de módulos, estrutura compartilhada mínima, configuração Vite, dependências e workflows de CI/CD.
- Usar o repositório `jcntck/jcntck.github.io`, com publicação em `https://jcntck.github.io/` e base `/`, sem banco, servidor ou domínio contratado.
- Verificar a configuração do Pages via Actions já informada pelo usuário e configurar os checks obrigatórios e permissões mínimas durante a implementação, com evidências de validação.
- Aparência nesta etapa é uma estrutura funcional e legível. Identidade visual definitiva e experiência do módulo ficam para `add-manga-reading-tracker`.
- OAuth, chamadas Google, biblioteca em nuvem, formulários de leitura e componentes especulativos estão fora desta etapa.

## Sequence and Acceptance

Etapa 1 de 3: `add-modular-shell` → `add-cloud-library` → `add-manga-reading-tracker`.

A entrega inclui PR de `dev` para `main` aprovado pelos checks, tag automática `v0.1.0` apontando ao commit integrado, versão `0.1.0` coerente no pacote, lockfile e site, e evidências com URL, commit, execução e resultados de produção. A homologação é uma decisão explícita do usuário registrada após os testes; checks verdes isoladamente não a substituem. Somente então a etapa 2 pode começar.
