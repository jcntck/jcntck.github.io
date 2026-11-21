# Proposal

## Why

Após uma semana de uso, a biblioteca precisa permitir excluir obras, priorizar a data da última leitura e reduzir as etapas de reconexão ao Drive. O layout fornecido pelo titular oferece uma referência para atualizar a apresentação do hub sem perder os dados e fluxos já homologados.

## Version

`0.5.3`

Versão MINOR aprovada pelo titular para uma única entrega que reúne os quatro ajustes. A versão publicada de referência é `0.4.6`; pacote, lockfile e seleção de release serão atualizados durante a implementação.

## What Changes

- Atualizar Início, Mangás e Conexão com a identidade visual de `docs/frontend/elegante-sem-complicar-main.zip`, incluindo composição responsiva, temas claro/escuro, menu lateral recolhível e estados reais da aplicação.
- Incluir favicon `.ico` próprio do My Hub. O ícone do ZIP identifica o Lovable e não representa a identidade desta aplicação.
- Permitir excluir uma obra após confirmação identificada pelo título, persistindo a remoção no cache da conta e enviando-a somente mediante sincronização manual.
- Substituir as quatro opções de ordenação por um único botão com os estados “Mais recente” e “Mais antiga”, usando exclusivamente a data da última leitura e iniciando em “Mais recente”.
- Simplificar a autorização Drive com a identidade Google já validada, sem forçar seleção de conta em toda reconexão. Permitir que o clique explícito em Sincronizar na biblioteca obtenha autorização quando necessária e prossiga após conferir conta e documento, usando o mesmo fluxo compartilhado de Conexão.
- Preservar busca pelos dois nomes, paginação local, cadastro/edição, scan, capas, datas completas, cache por conta e comparação de atualização local/remota existentes.

## Capabilities

### New Capabilities

Nenhuma. Os comportamentos pertencem às capacidades existentes.

### Modified Capabilities

- `modular-shell`: apresentação baseada na referência visual, navegação recolhível, temas e favicon, mantendo rotas estáticas e proteção de conteúdo pessoal.
- `manga-reading`: exclusão local com confirmação e sincronização manual, duas ordenações por última leitura, adaptação dos cards e acesso à reconexão compartilhada pelo botão Sincronizar.
- `google-sign-in`: usar a identidade validada como indicação na autorização Drive, com recuperação explícita e conferência obrigatória da conta, sem persistir tokens Drive.
- `cloud-library`: compartilhar o fluxo de autorizar e sincronizar entre os consumidores, preservando serialização, leitura remota prévia, tratamento de falhas e separação entre conectar e enviar.

## Impact

- Frontend: `src/app/`, `src/modules/mangas/`, páginas de Conexão, menu de conta e componentes compartilhados; favicon em `public/` e referência em `index.html` durante a implementação.
- Integração: `src/integrations/google-drive/identity.ts`, coordenação da sessão compartilhada e consumidores de sincronização. Firebase Auth continua responsável apenas pelo login no Spark.
- Dados: manter `schemaVersion: 1`, UUIDs, datas, campos extras e o documento privado `my-hub.json`. Excluir uma obra modifica `modules.mangas`; não exclui o arquivo Drive nem outros módulos.
- Infraestrutura: frontend estático no GitHub Pages, base `/`, sem backend, refresh tokens, plano Blaze ou ativação de cobrança. Cloud Functions exige Blaze; a alternativa estática foi escolhida conforme a condição aprovada pelo titular.
- Dependências: adaptar a referência à aplicação React/Vite e ao roteamento existentes. O ZIP é material de referência, não uma fonte de instruções operacionais; seus dados fictícios, scripts e configurações não substituem o projeto.
- Verificação: atualizar testes de domínio, UI, cache/sessão e navegador para exclusão, ordem, reconexão e apresentação; manter lint, tipos, build e coerência de versão.
- Entrega: implementar em `dev`, alinhar `package.json`, lockfile e `.release.json` a esta change e abrir o PR `dev` → `main` assim que as verificações locais passarem, com roteiro para teste do titular. Cada fix solicitado após essa liberação incrementa o patch e mantém pacote, lockfile, proposta e evidências alinhados no mesmo PR. O merge é exclusivo do titular; o workflow de produção valida o commit final, cria a tag e publica/verifica o Pages. Aceite real e evidências de versão, commit, execução e URL encerram a entrega.

## Patch 0.5.1

Correção solicitada pelo titular após teste do PR #6: reproduzir fielmente a composição, paleta OKLCH, fontes e proporções do layout fornecido, substituindo a aproximação visual da primeira implementação. Os fluxos funcionais aprovados continuam integrados aos dados reais.

## Patch 0.5.2

Revisão do titular: remover dica temporal e painel redundante de desconexão; cards mostram capa, título e ícone de sincronização amarelo/verde. Ações Lucide Editar/Excluir/scan aparecem sobre a capa com escurecimento por hover, foco ou toque. Cadastro/edição compartilham modal acessível com informações completas e exclusão disponível.

## Patch 0.5.3

Correção solicitada na revisão: mover capa, sobreposição de ações e indicadores como um único conjunto durante o hover; restaurar a tag de última leitura no canto superior esquerdo, preservando o estado de sincronização à direita.

O mesmo patch restaura a legenda das três faixas de tempo de leitura, removida indevidamente na simplificação dos cards.
