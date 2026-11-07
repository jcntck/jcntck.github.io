# Design

## Context

Ver `proposal.md`. O estado observado ainda é apenas planejamento; o shell descrito em `add-modular-shell` é uma dependência futura, não software já disponível. Antes de implementar esta mudança, conferir release `v0.1.0` publicada, verificações em produção e homologação explícita registradas. Não iniciar integração Google para contornar uma homologação pendente.

## Goals / Non-Goals

**Goals:** Validar o armazenamento e a segurança de forma independente do domínio; disponibilizar um contrato estável para os futuros módulos; produzir evidências reais no domínio do Pages.

**Non-Goals:** Implementar mangás, fórmulas de tempo desde a leitura, tema definitivo, servidor OAuth, compartilhamento público, fila offline ou colaboração transacional.

## Decisions

### Versão e fluxo de entrega

A versão aprovada desta change é `0.2.0`. Conferir `dev` antes de editar e atualizar `package.json` e os campos de versão correspondentes do lockfile no PR de `dev` para `main`. Reutilizar o workflow dev para checks obrigatórios de lint, tipos, testes, build e coerência de versão. Após o merge, o workflow prod valida o commit final, cria `v0.2.0` com a versão do pacote e publica o mesmo artefato, sem incrementar versão nem criar commits em `main`.

Conferir versão alvo, pacote, lockfile, tag, SHA e identificação pública, comparando somente as changes da entrega atual. Tag existente só é reutilizável no mesmo commit; divergência falha sem sobrescrita. A publicação automática segue separada da homologação explícita do usuário.

### Integração compartilhada sobre o shell homologado

Adicionar `src/integrations/google-drive`, `src/shared/storage` e uma entrada “Conexão” no shell. O domínio futuro consumirá um contrato de carregar e salvar uma seção com base numa revisão conhecida; não dependerá diretamente de GIS ou `fetch`. Reutilizar navegação, build e publicação já entregues. Não recriar projeto React ou CI/CD nesta etapa.

### Sessão Google no navegador

Usar Google Identity Services com o modelo de token documentado para chamadas na presença do usuário. Solicitar `drive.file` por ação explícita e confirmar a permissão concedida. Configurar cliente OAuth web e origens HTTPS exatas de produção e de desenvolvimento. Client ID é público; `client_secret` não pertence à SPA. Tokens ficam somente em memória e seguem em cabeçalhos HTTPS para o Google, nunca em URLs, logs ou armazenamento persistente.

Identificar a conta por identificador estável retornado pelo Google antes de associar dados ou retomar operações. Ao expirar ou revogar, oferecer reconexão por clique e conferir novamente conta e documento; ao trocar de conta, limpar dados e alterações pendentes da anterior. Desconexão local limpa a sessão; disponibilizar revogação quando apropriado sem afirmar que uma simples limpeza local revogou consentimento no Google.

A proteção é aplicada pelo Google aos dados, não por ocultar rotas ou comparar emails no React. A página permanece pública. O código da aplicação e todos os módulos executam no mesmo ambiente de confiança, sem isolamento entre pastas. Evitar HTML não confiável e dependências desnecessárias, manter versões fixadas e inspecionar o build.

Alternativas: `appDataFolder` oculta o arquivo do titular, enquanto `drive.file` permite baixar o JSON diretamente. Um backend com modelo de autorização por código permite outras propriedades de sessão, mas foge da arquitetura estática. Não implementar um fluxo OAuth manual nem inserir segredos no navegador para simular servidor.

### Documento neutro e contrato estável

Usar arquivo privado `my-hub.json` descoberto por `appProperties`, sem depender apenas do nome ou de ID armazenado no dispositivo. Criar o arquivo somente na primeira gravação solicitada, após consulta bem-sucedida confirmando ausência. Múltiplos candidatos são um erro explícito, não uma escolha arbitrária.

O envelope versão 1 contém `schemaVersion`, `revision`, `diagnostics` e `modules`. Nesta etapa `modules` pode ser vazio; nenhum campo de mangá existe. Preservar seções e campos compatíveis desconhecidos. Formato inválido ou versão incompatível bloqueiam a gravação sem substituir o arquivo.

A revisão é um UUID novo por alteração confirmada. Uma operação guarda sua identidade durante tentativas para reconhecer resultado já persistido. O contrato retorna sucesso, erro, expiração ou divergência, deixando o consumidor preservar uma alteração em memória; a etapa 3 não deve reconstruir esse mecanismo.

### Tela técnica para homologação independente

A tela “Conexão” mostra conta conectada, estado de carregamento e resultado da última operação, sem expor credenciais. Ações explícitas: conectar/desconectar, gravar amostra e reler do Drive. “Gravar amostra” escreve somente `diagnostics.probe` com UUID e instante técnico; “Reler” faz uma nova requisição e exibe a amostra retornada. Isso prova persistência sem introduzir formulário genérico de edição de arquivos ou regras de mangás.

Não gravar automaticamente ao conectar ou abrir a página. Ao usar outro dispositivo com a mesma conta, a amostra deve ser a mesma. A interface de diagnóstico pode continuar em configurações para revalidações futuras; não inventar um segundo módulo de negócio.

### Falhas, repetição e divergências

Diferenciar desconectado, autorizando, carregando, pronto, salvando e erro. Não habilitar escrita antes de conhecer o documento remoto. Serializar gravações da mesma sessão; antes de salvar, reler e comparar revisão e conteúdo com a base. Divergência conhecida interrompe a gravação e pede decisão de recarregar, preservando o estado local enquanto a página está aberta.

Uma resposta perdida exige conferir o arquivo e a identidade da operação antes de repetir. Ler seguido de escrever não é transação: duas sessões ainda podem gravar simultaneamente entre essas operações. Documentar edição em um dispositivo por vez. Não prometer resolução absoluta de conflitos, armazenamento offline durável ou recuperação do estado da aba depois de fechá-la.

## Risks / Trade-offs

- [Token disponível ao JavaScript da sessão] → Escopo limitado, código confiável, dependências reduzidas e nenhuma persistência ou logging de tokens.
- [Configuração local passa, origem de produção falha] → Homologar consentimento, gravação e reconexão no endereço real do Pages.
- [Mistura de contas ao reconectar] → Conferir identidade antes de reutilizar estado e testar A/B com dados distintos.
- [Dois editores simultâneos] → Detectar divergência anterior e documentar a limitação de concorrência.
- [Arquivo alterado ou apagado manualmente] → Validar o envelope e recusar substituir dados desconhecidos.
- [Cotas e condições mudam] → Não habilitar serviços pagos e não fazer polling; apresentar erro recuperável.

## Delivery and Homologation

Conferir a homologação da etapa 1. Configurar uma conta de teste e cliente OAuth; testar localmente com adaptador simulado e com integração real. Publicar uma nova versão pelo pipeline existente e testar a tela técnica no endereço final, em computador e celular. Validar recusa, cancelamento, expiração ou revogação, rede interrompida, desconexão e conta diferente, além de inspecionar pacote e armazenamento do navegador.

Registrar URL, commit, tag, execução, resultados e decisão de homologação em `docs/releases/0.2.0.md`, sem incluir tokens ou dados pessoais. Só depois da homologação explícita do usuário liberar `add-manga-reading-tracker`. Testes automatizados não substituem essa decisão.

Rollback republica um frontend anterior pelo procedimento do shell, sem remover o arquivo do Drive. Preservar schema versão 1 e dados; nenhuma migração destrutiva faz parte desta etapa. A release alvo é `v0.2.0`, sem alterar a tag `v0.1.0` já homologada.

## References

- [Modelo de token do GIS](https://developers.google.com/identity/oauth2/web/guides/use-token-model).
- [Modelo por código e backend](https://developers.google.com/identity/oauth2/web/guides/use-code-model).
- [Escopos Drive](https://developers.google.com/workspace/drive/api/guides/api-specific-auth).
- [Variáveis públicas do Vite](https://vite.dev/guide/env-and-mode).
