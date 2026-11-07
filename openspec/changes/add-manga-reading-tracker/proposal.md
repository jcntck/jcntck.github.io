# Proposal

## Version

`1.0.0` — conclusão do MVP com o módulo de mangás; tag automática `v1.0.0`.

## Why

Com publicação, autenticação e persistência em nuvem já homologadas, podemos concentrar a entrega no valor para o leitor. O módulo precisa registrar onde e quando a leitura parou e apresentar o tempo decorrido para apoiar a decisão pessoal de retomar uma obra.

## What Changes

- Adicionar o módulo “Mangás” à navegação do shell existente.
- Permitir cadastrar e corrigir título, último capítulo lido e data da leitura, usando o armazenamento já validado.
- Mostrar data absoluta e mensagens como “Lido há 18 dias”, “Lido há 7 meses” e “Lido há 2 anos”.
- Preservar seis meses ou um ano como referência global do leitor, sem intervalos individuais, data de retorno ou cobrança por atraso.
- Definir e refinar a aparência do módulo nesta etapa, com formulários acessíveis e listagem legível em celular e computador.
- Publicar pelo CI/CD existente e homologar o fluxo real de leitura, incluindo persistência entre dispositivos.

## Capabilities

### New Capabilities

- `manga-reading`: Cadastro e correção do ponto e da data de leitura, com listagem do tempo decorrido e experiência visual do módulo.

### Modified Capabilities

Nenhuma. O módulo consome os contratos existentes de navegação e armazenamento.

## Impact

- Implementar em `dev`, atualizando `package.json` e lockfile para `1.0.0` no PR para `main`. Após o merge, o workflow prod valida o commit, cria `v1.0.0` e publica sem commits automáticos de versão.
- Acrescentar `src/modules/mangas`, modelo de leitura e sua seção no documento compartilhado, preservando dados existentes.
- Reutilizar shell, sessão Google, tratamento de armazenamento e processo de entrega das etapas anteriores.
- Não reconstruir CI/CD, OAuth ou adaptador Drive; defeitos nesses contratos devem ser corrigidos e revalidados antes de continuar a homologação do módulo.
- Nome definitivo e preferências estéticas não estão fixados; serão trabalhados na etapa visual, sem ampliar os comportamentos funcionais.
- Catálogo externo, histórico por capítulo, notificações, calendário de retorno e edição offline continuam fora do MVP.

## Sequence and Acceptance

Etapa 3 de 3. Implementar somente após `add-modular-shell` (`0.1.0`) e `add-cloud-library` (`0.2.0`) publicados, testados em produção e homologados. A disponibilidade dos documentos no OpenSpec não implica liberação antecipada.

Concluir com cadastro de leitura retroativa, correção sem mudança implícita da data, mensagens de tempo corretas, reabertura em outro dispositivo e revisão visual no site publicado. Registrar versão, URL, commit, execução, resultados e homologação explícita do usuário.
