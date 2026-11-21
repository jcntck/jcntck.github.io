# Tasks

## 1. Preparação da entrega

- [x] 1.1 Conferir branch `dev`, versão alvo aprovada `0.5.0` e encerramento homologado da `0.4.6`; verificar com `git branch --show-current`, `proposal.md` e `docs/releases/0.4.6.md`, preservando alterações locais existentes.
- [x] 1.2 Alinhar `package.json`, versões do topo e de `packages[""]` do lockfile e seleção de `.release.json` a esta change; verificar `npm run check:release` sem incluir a change arquivada da `0.4.6` na entrega atual.

## 2. Identidade visual, navegação e temas

- [x] 2.1 Adaptar os tokens visuais, hierarquia e composição de Início, Mangás e Conexão à referência, mantendo React Router, rotas hash e sessão reais; verificar os testes existentes de App/Conexão e a apresentação sem dados fictícios, versão/SHA fixos ou dependências do gerador.
- [x] 2.2 Implementar menu recolhível em computador e abertura transitória em celular; verificar em testes de UI a rota ativa, nomes acessíveis, fechamento ao navegar, Escape/devolução de foco quando aplicável e ocultação das rotas pessoais sem login.
- [x] 2.3 Implementar tema claro/escuro com preferência visual isolada, padrão do sistema e fallback sem storage; verificar preferência inicial, restauração, valor inválido, bloqueio de leitura/gravação e alternância sem alterar biblioteca ou requisitar Drive.
- [x] 2.4 Criar favicon ICO próprio do My Hub, incluindo tamanhos de guia, e referenciá-lo no documento; verificar formato/conteúdo, inclusão no build e resposta bem-sucedida da URL no preview, inclusive ao atualizar rotas internas.
- [x] 2.5 Adaptar os cards para capas 2:3 e aplicar os dois temas aos formulários, mensagens e rodapés; verificar imagens ausentes/falhas, nomes longos, data e tempo completos, capítulos textuais, scan e edição nos testes de UI e na revisão visual local.
- [x] 2.6 Registrar no documento de entrega o comportamento de temas/menu, a referência visual e o favicon próprio; verificar que o roteiro descreve uso em celular/computador e persistência visual sem confundir tema com sessão de conta.

## 3. Exclusão de obras

- [x] 3.1 Implementar remoção por UUID sobre a seção atual validada; verificar em testes de domínio a preservação de outras obras/campos extras, lista vazia, seção incompatível e obra já ausente sem recriação ou nova pendência desnecessária.
- [x] 3.2 Adicionar Excluir e confirmação acessível com título, Cancelar e Escape; verificar em testes de UI que cancelar não muda dados/fila, confirmar exige login e edição válidos e o formulário de uma obra removida não permite recriá-la por salvamento tardio.
- [x] 3.3 Preparar remoções como operações manuais na fila/cache da conta; verificar exclusão desconectada, obra ainda não enviada, preservação de outras edições, refresh, isolamento entre contas e fallback com aviso quando o cache falha, sem envio pelo automático.
- [x] 3.4 Ajustar paginação, foco e feedback depois de excluir; verificar remoção do último item da página, último resultado de busca e última obra, distinguindo vazio/busca vazia e remoção local/confirmação Drive.
- [x] 3.5 Verificar a sincronização da seção com exclusão em testes de sessão/Drive, cobrindo preservação de diagnóstico/extras/outros módulos, resposta perdida com retry estável e remoto mais recente/empatado, sem DELETE do documento ou alteração de schema.
- [x] 3.6 Atualizar `docs/storage-contract.md` e o roteiro de entrega para explicar exclusão local, confirmação remota e política existente de atualização; verificar que o texto contempla a possível adoção de uma cópia remota e não promete lixeira ou mescla por obra.

## 4. Ordenação por última leitura

- [x] 4.1 Restringir a transformação local às duas direções por `lastReadOn`, com título crescente e identificador como desempate nas duas; verificar em `view.test.ts` datas iguais, nomes em inglês, datas de edição/cadastro diferentes e ausência de mutação dos registros.
- [x] 4.2 Substituir o seletor por um único botão “Mais recente”/“Mais antiga”, iniciando em “Mais recente” a cada abertura; verificar em testes de UI a alternância, retorno à página 1, preservação de busca e página/foco da obra após salvar, sem requisições Drive ou pendências novas.
- [x] 4.3 Atualizar o roteiro de entrega com o critério explícito de última leitura e retirar instruções das ordens alfabéticas; conferir correspondência dos textos documentados com o botão e seus nomes acessíveis.

## 5. Reconexão e sincronização compartilhadas

- [x] 5.1 Adaptar o pedido normal de autorização para `login_hint` da identidade validada e `prompt: ''`, mantendo escopos e opção explícita de escolher conta em Conexão; verificar em `identity.test.ts` parâmetros normais/de recuperação e rejeição de escopos insuficientes, sem persistir tokens.
- [x] 5.2 Centralizar a composição de autorizar/conectar/sincronizar no Hub compartilhado e preparar GIS antes da interação; verificar que o popup é solicitado no clique, carregamento concluído não abre popup, falhas permitem repetição e uma Promise de conexão resolvida com erro não inicia envio.
- [x] 5.3 Expor o fluxo às ações de Sincronizar de Mangás e Conexão; verificar em testes de UI e sessão autorização seguida de conferência/envio no mesmo comando, token já válido, leitura sem pendências e Conectar/Reconectar isoladamente sem envio, mantendo uma fila e estado compartilhados.
- [x] 5.4 Serializar a intenção completa e invalidar resultados após logout/troca/expiração; verificar cliques repetidos, consumidores concorrentes, conta diferente da indicada, callbacks tardios e edição durante envio sem duplicação ou mistura de contas.
- [x] 5.5 Verificar cancelamento, recusa, popup bloqueado, falha de carregamento, documento inválido, 401 e erro de rede; os testes devem comprovar login válido preservado, pendências recuperáveis, ausência de confirmação falsa e nenhum popup automático depois de resposta assíncrona.
- [x] 5.6 Atualizar `docs/google-drive-setup.md`, `docs/firebase-setup.md` e o roteiro da entrega para reconexão simplificada e cache atual; conferir limites explícitos de token temporário, interação Google ainda possível, Firebase Spark e ausência de backend/cobrança.

## 6. Verificação integrada

- [x] 6.1 Com a versão alinhada, executar instalação pelo lockfile no Node indicado em `.nvmrc`, lint, tipos, testes Vitest/scripts, build e `npm run check:release`; verificar conclusão bem-sucedida e identificação pública derivada de pacote/commit.
- [x] 6.2 Executar a suíte Playwright e atualizar os cenários integrados de desktop/celular para os dois temas, menu, favicon, exclusão após refresh/sincronização e ordem; cobrir também 126 obras, teclado, textos longos, movimento reduzido e reconexão compartilhada sem envio por consulta/edição.
- [x] 6.3 Inspecionar artefato, URLs/logs e persistência usando contas sintéticas nos testes; verificar ausência de tokens Drive, segredos e dados privados no pacote, mantendo somente login gerenciado pelo SDK, cache por conta e preferência visual onde cabível.
- [x] 6.4 Executar `openspec validate refine-hub-reading-experience --strict` e revisão de diff; verificar cobertura das quatro capacidades, coerência entre artefatos e ausência de alterações alheias à entrega.

## 7. PR e liberação para teste

- [x] 7.1 Finalizar o registro de entrega `docs/releases/0.5.0.md` com resultados locais e roteiro executável: Node da `.nvmrc`, `npm ci`, `npm run dev -- --host localhost` e rotas de Mangás/Conexão; conferir que a avaliação inclui cancelamento/exclusão, refresh, duas ordens e autorização real sem registrar credenciais.
- [x] 7.2 Assim que os checks locais passarem, enviar os commits em `dev` e abrir imediatamente o PR `dev` → `main`; verificar URL/origem do PR, execução do CI obrigatório e disponibilização das instruções de teste ao titular, sem merge ou auto-merge pelo agente.
- [ ] 7.3 Tratar cada fix solicitado após a liberação como incremento patch no mesmo PR, alinhando pacote, lockfile, versão alvo e evidências antes de enviar; verificar os checks pertinentes e de versão a cada patch, sem criar tag antecipada.

## 8. Publicação e homologação

- [ ] 8.1 Acompanhar o merge realizado exclusivamente pelo titular e o workflow Prod; verificar validação do commit final, criação da tag `v<versão final>`, deploy e resultado da verificação real, sem commits de incremento em `main` ou movimento de tags.
- [ ] 8.2 Conferir coerência de versão alvo, pacote, lockfile, identificação em `version.json`, tag e SHA do merge; registrar versão, URL, commit e execução da entrega correspondente sem dados privados.
- [ ] 8.3 Obter e registrar a homologação explícita do titular dos fluxos privados e do visual em produção; verificar que testes simulados estão distinguidos das declarações de uso real e que eventuais problemas retornam ao ciclo de correção autorizado.

## Workflow follow-up

- Após homologação e mediante solicitação do titular, sincronizar os deltas com as specs principais e arquivar a change pelo fluxo OpenSpec correspondente.
- Validar as specs sincronizadas e conferir a referência da proposta arquivada na seleção de release, sem alterar conteúdo ou tag da versão publicada.

## 9. Patch visual 0.5.1

- [x] 9.1 Alinhar proposta, pacote e lockfile à 0.5.1 e substituir a aproximação por paleta, fontes e composição da referência; verificar build e comparação das capturas de desktop/celular com os componentes do ZIP.
- [x] 9.2 Usar ícones Lucide reais em navegação, conta, tema, busca e ações, incluindo Conexão; verificar lint, tipos e testes de navegação, conta e operações existentes.
- [x] 9.3 Concluir validação local, registrar evidências visuais e enviar a 0.5.1 ao mesmo PR #6; verificar suíte completa, identificação da versão e execução do CI no head enviado.

## 10. Patch de interação 0.5.2

- [x] 10.1 Compactar cards e revelar ações por hover/foco/toque com status acessível; verificar cenários de computador/celular.
- [x] 10.2 Compartilhar modal de cadastro/edição com exclusão, Escape e foco; verificar salvar, cancelar e excluir no modal.
- [ ] 10.3 Alinhar versão 0.5.2, validar os checks e atualizar o mesmo PR #6 com roteiro e evidências.
