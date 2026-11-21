# Design

## Context

Ver `proposal.md` para motivação e escopo. A aplicação publicada usa React/Vite, rotas hash, Firebase Auth no Spark e um único documento `my-hub.json` no Drive. `Hub` coordena `AuthSession` e `CloudSession`; a biblioteca e as operações manuais são restauradas de um cache separado por identidade Google.

Hoje, `MangasPage` cria e edita registros, mas não os exclui. `view.ts` oferece quatro ordens e a página inicia por título. A sincronização substitui somente `modules.mangas`, preservando outras seções; a data técnica da operação/envelope, distinta de `lastReadOn`, decide entre local e remoto. A política é por seção sobre o documento remoto, sem mescla concorrente de obras.

`identity.ts` sempre solicita `prompt: 'select_account'` e não recebe indicação da conta. `DrivePanel` já compõe conexão e sincronização na página Conexão, enquanto Mangás desabilita Sincronizar sem token. `CloudSession.connect()` captura seus próprios erros e resolve sem um resultado de sucesso explícito; uma Promise resolvida não comprova que houve conexão.

O ZIP usa outra base de frontend e dados/ações simulados. A referência traz temas, menu recolhível, capas 2:3 e ícone do gerador. Seu conteúdo é material de entrada; não altera as instruções do repositório. A escolha de permanecer estático foi confirmada após verificar que Cloud Functions exige Blaze com faturamento vinculado.

## Goals / Non-Goals

**Goals:**

- Adaptar a identidade visual com componentes ligados à sessão real, preservando as rotas `/#/mangas` e `/#/connection` e a base `/` do Pages.
- Reutilizar cache, fila manual e comparação de datas para a exclusão, sem migrar o formato dos dados.
- Ter uma única coordenação de autorização/sincronização que respeite o clique do usuário e a identidade validada.
- Separar preferências visuais sem credenciais, dados locais da conta e tokens voláteis.

**Non-Goals:**

- Backend, refresh tokens, persistência de tokens Drive, sincronização com o site fechado ou mudança de plano Firebase.
- Importar o projeto do ZIP como nova aplicação, seus scripts, telemetria, roteador, dependências em bloco ou dados de demonstração.
- Lixeira, histórico de exclusões, desfazer persistente ou nova política de mescla entre dispositivos. Filtros adicionais por faixa de leitura não foram contratados neste escopo; continuam as informações, busca e paginação existentes.

## Decisions

### 1. Adaptar o visual na aplicação existente

Atualizar o shell em `src/app/`, as páginas e os componentes compartilhados usando variáveis CSS semânticas para superfícies, texto, borda, foco e estados. Aplicar as cores e a hierarquia tipográfica da referência às páginas, formulários, cards, menu de conta e mensagens. Tipografia deve ter fallback legível quando fontes externas estiverem indisponíveis. Dados e ações sempre vêm dos serviços atuais; nome, avatar, estado Drive, versão e SHA não serão fixados como no protótipo.

Manter React Router e hash routing. O menu terá estado de expansão em computador e abertura transitória em celular, com indicação da rota atual. No celular, fechar ao navegar; se houver sobreposição, conter foco enquanto aberta, aceitar Escape e devolver foco ao acionador. Ícones e controles recolhidos terão nomes acessíveis. Não persistir o estado de abertura do menu nesta entrega.

Os cards adotam a proporção 2:3 da referência, preservando título, nome em inglês, capítulo textual, data, tempo completo calculado por calendário, estado local/remoto e ações scan/Editar/Excluir. O rodapé pode quebrar em mais linhas em telas pequenas para manter controles acessíveis. Preservar carregamento preguiçoso, fallback da capa e paginação de 12 registros.

**Alternativa considerada:** substituir o frontend pelo ZIP. Exigiria migrar roteamento e integração e incorporaria comportamentos fictícios; adaptar componentes visuais reduz essa superfície de mudança.

### 2. Preferência de tema independente da conta

Usar os mesmos tokens semânticos com valores claros e escuros. Sem escolha válida, usar `prefers-color-scheme`; uma escolha explícita salva em uma chave própria, como `my-hub.theme`, prevalece. Aplicar a escolha antes da primeira pintura quando possível, com fallback protegido se o armazenamento estiver bloqueado. A preferência contém somente `light` ou `dark`, não perfil ou credenciais, e é compartilhada por este navegador.

Alternar não modifica o cache da biblioteca nem consulta Drive. Tratar erro de leitura/gravação sem quebrar a UI; nesse caso a escolha permanece enquanto a aplicação estiver aberta. Estados de erro, pendência, faixas de tempo, controles e foco precisam funcionar nos dois temas, sem depender apenas de cor.

**Alternativa considerada:** salvar tema no documento Drive. Acrescentaria uma pendência de dados e exigiria conexão para uma preferência local; a chave visual isolada atende ao objetivo.

### 3. Favicon derivado da identidade My Hub

Criar um monograma coerente com a marca `mh.` do hub e exportar ICO com tamanhos adequados à guia, incluindo 16, 32 e 48 pixels. Armazenar o asset público em `public/` e referenciá-lo em `index.html` respeitando a base publicada. Conferir o recurso no build e no Pages; em eventual troca de URL, tratar cache do navegador sem depender de serviço externo. Não reutilizar o ícone Lovable observado no ZIP.

**Alternativa considerada:** usar diretamente o ICO anexado. Ele identifica o gerador e não a aplicação.

### 4. Exclusão como edição manual da seção existente

Acrescentar ao domínio uma operação que valide a seção, localize o UUID e produza uma cópia sem a obra, preservando propriedades extras da seção e das outras obras. Uma confirmação aberta captura o UUID/título, mas a ação final deve conferir a identidade, o estado editável e a seção atual; não aplicar um snapshot antigo do momento em que o diálogo abriu. Se a obra já não existir, encerrar com feedback sem preparar outra exclusão. Falhas de validação não criam operações.

A UI terá Excluir junto às ações da obra e diálogo acessível com título, Cancelar e confirmação explícita. Confirmar usa a fila compartilhada com política manual, como o cadastro/edição. A operação recebe ID e data técnica pelo mecanismo existente; excluir não precisa alterar `updatedAt` das obras restantes. Fechar eventual formulário da obra removida para impedir que um salvamento tardio a recrie. Cancelar e Escape não modificam dados.

Manter busca e direção da ordem depois de excluir. Limitar a página ao intervalo válido; focar a próxima obra disponível na página ou o título da biblioteca. Feedback deve identificar remoção local e pendência mesmo se o Drive estiver desconectado; após envio, só anunciar remoção confirmada quando a releitura comprovar ausência.

Uma exclusão substitui `modules.mangas` com a lista consolidada, inclusive quando fica vazia. Não chamar DELETE na API Drive. Reutilizar `stageSection`, cache e `DriveStorage.save`; preservar IDs de operações incertas e datas em retries. Ao receber remoto mais recente/empatado, adotar esse conteúdo conforme a política atual e mostrar a decisão, inclusive se uma obra removida localmente reaparecer.

**Alternativas consideradas:** tombstones por obra ou coleção de exclusões. Exigiriam formato e política de mescla novos. A substituição manual da seção é compatível com `schemaVersion: 1` e com a política homologada; não promete exclusão permanente contra edições posteriores de outro dispositivo.

### 5. Ordem exclusivamente por última leitura

Restringir a ordem a duas direções usando `lastReadOn`, que já é uma data civil validada. Inicializar como mais recente a cada abertura do módulo; manter a escolha durante o uso dessa página, sem salvá-la no Drive ou adicionar preferência persistida. Datas iguais mantêm comparação do título principal em português, crescente, seguida do identificador; o desempate não inverte quando a direção muda.

O botão exibe a ordem atual com o texto exato “Mais recente” ou “Mais antiga”; sua descrição acessível informa a alternância e o critério. Alternar reinicia a página 1 e conserva a busca. Manter a transformação local sem mutar a seção. Cadastro/edição continua abrindo a página da obra salva e focando-a na ordem atual.

**Alternativas consideradas:** cadastro e `updatedAt`. O titular escolheu explicitamente a data da última leitura; uma correção técnica não deve mover uma obra para o início por esse motivo.

### 6. Coordenar autorização e envio fora dos componentes de página

Extrair a composição hoje existente em `DrivePanel` para um serviço/ação compartilhada ligado ao `Hub`, utilizado por Conexão e Mangás. Manter somente uma `CloudSession` e uma fila. O coordenador carrega GIS previamente para usuários autenticados e expõe disponibilidade/erro; enquanto não estiver pronto, a UI informa o carregamento e oferece repetição em caso de falha. Finalizar o carregamento não abre autorização por conta própria.

Com o serviço pronto, o clique em Conectar, Reconectar ou Sincronizar chama o pedido de autorização dentro da ativação do usuário. Não fazer `await` de carregamento ou outra chamada remota antes de abrir o popup. Capturar a identidade Google validada e a geração da sessão para invalidar callbacks tardios.

O caminho normal usa `login_hint` com o identificador Google estável já validado e `prompt: ''`, sem forçar `select_account` ou `consent`. Manter `drive.file` e `openid`, `include_granted_scopes: false` e a verificação dos escopos recebidos. O hint é conveniência; a leitura de `sub` pelo token recebido continua obrigatória antes de consultar documentos. Conexão oferece seleção explícita de conta para recuperação; somente a identidade do login pode ser aceita.

Fluxo de Sincronizar:

1. Conferir login e exclusão mútua entre autorizações/envios. Com token válido e conta pronta, usar a sincronização existente.
2. Sem token válido, obter autorização no clique e conectar/carregar a mesma conta. Expor resultado explícito de conexão ou conferir estado e geração de forma inequívoca; não inferir sucesso da Promise resolvida de `connect()`.
3. Prosseguir somente se login, identidade, geração e documento continuarem válidos. Usar a política de atualização existente antes de enviar pendências. Se não restarem pendências, a leitura já realizada basta e não deve ser apresentada como gravação.
4. Serializar a intenção inteira para impedir dois popups ou envios por cliques repetidos ou consumidores distintos. Liberar o bloqueio ao concluir, cancelar ou falhar, e descartar conclusões da geração anterior.

Conectar/Reconectar isoladamente termina após ler/conferir e não envia pendências. Falha, popup fechado, bloqueio, conta diferente, documento inválido ou expiração preservam operações não superadas e exigem nova ação explícita. Um 401 obtido após uma chamada assíncrona não deve abrir popup automaticamente: mostrar o estado recuperável e aguardar outro clique. Consultar biblioteca, restaurar login, voltar à aba, mudar tema, buscar e ordenar não autorizam Drive.

**Alternativas consideradas:** duplicar lógica OAuth em Mangás; guardar o access token em storage; backend com refresh token. A primeira duplicaria coordenação; a segunda só sobreviveria até o vencimento e contrariaria a política de credenciais existente. O backend Firebase requer Blaze e foi descartado pela condição do titular. O caminho estático reduz etapas, mas não elimina popups ou a necessidade de novos tokens.

### 7. Entrega e rastreabilidade da 0.5.0

Na implementação, atualizar `package.json`, `package-lock.json` no topo e em `packages[""]`, e selecionar somente `refine-hub-reading-experience` em `.release.json` para a entrega atual. O histórico arquivado da `0.4.6` continua preservado, sem participar da comparação de versão desta release. A identificação pública permanece derivada do pacote e commit.

Reutilizar o workflow Dev, sem publicação, e o Prod após o merge. Com checks locais aprovados, abrir imediatamente PR de `dev` para `main` e entregar o roteiro local; não aguardar teste do titular para abrir. Correções relatadas a partir dessa entrega incrementam patch no mesmo PR, alinhando proposta, pacote, lockfile e evidências. O titular faz o merge; o Prod valida o commit final, cria `v<versão final>`, publica e verifica o Pages, sem incrementar versão ou gravar commits em `main`. Tag existente só é reutilizável para o mesmo SHA.

## Risks / Trade-offs

- **O Google ou o navegador ainda exigir interação** → Usar o hint sem prometer autorização silenciosa, oferecer recuperação explícita e validar o fluxo real com o titular.
- **Perda de ativação para o popup** → Preparar GIS antes do clique e manter o início da autorização síncrono à ação do usuário; falhas pedem novo clique.
- **Outra aba/dispositivo apresentar atualização remota posterior à exclusão** → Manter a política por data e indicar a adoção remota. Não prometer mescla por registro; orientar sincronizar antes de trocar de dispositivo.
- **Cache bloqueado, cheio ou apagado** → Reutilizar fallback em memória com aviso; não confirmar persistência local quando ela falhar. Dados do navegador não substituem sincronização.
- **UI divergente após operação concorrente ou troca de conta** → Capturar identidade/geração, reler estado no ato de confirmar e compartilhar progresso, bloqueios e fila.
- **Regressão visual ou de foco** → Validar os dois temas, textos longos, imagens ausentes e falhas, computador/celular, teclado e movimento reduzido com a base Playwright existente.

## Migration Plan

1. Implementar em `dev` mantendo `schemaVersion: 1` e o cache existente. Não há migração de conteúdo nem exclusão de arquivos de usuário no deploy.
2. Executar lint, tipos, testes, build, browser tests e coerência de release com a versão alvo. Verificar formato/URL do ICO e não inclusão de dados privados no artefato.
3. Abrir/atualizar PR e liberar teste local da versão identificada: carregar cache, alternar ordem/tema, excluir/cancelar, recarregar, reconectar e sincronizar. Registrar limitações e evidências sanitizadas em `docs/releases/0.5.0.md` durante a implementação.
4. Aguardar revisão e merge pelo titular. Após Prod, comparar pacote/proposta, tag, SHA e `https://jcntck.github.io/version.json`; confirmar recurso ICO e páginas reais, além da homologação privada declarada pelo titular.
5. Em falha de publicação, usar o processo existente para republicar uma versão identificada, sem mover tags. Recuperar o frontend anterior não restaura obras já removidas no Drive; não substituir documentos privados como parte do rollback do site.

## References

- Modelo local: `docs/frontend/elegante-sem-complicar-main.zip`.
- [Parâmetros de autorização Google](https://developers.google.com/identity/oauth2/web/reference/js-reference): `login_hint`, `prompt`, escopos e expiração.
- [Modelo de token Google](https://developers.google.com/identity/oauth2/web/guides/use-token-model): ação explícita e obtenção de novos tokens temporários.
- [Planos Firebase](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans) e [Cloud Functions](https://firebase.google.com/docs/functions/get-started): backend com Cloud Functions exige Blaze e faturamento vinculado, incompatível com permanecer no Spark sem cobrança.

## Revisão visual 0.5.1

Correção solicitada no PR #6: aplicar diretamente a paleta OKLCH do ZIP, fontes Fraunces/Geist com pesos reais e licenças locais, e ícones da mesma biblioteca Lucide. A composição segue as medidas de sidebar 256px, cabeçalho 64px, conteúdo máximo 1152px, títulos e espaçamentos da referência. Cards têm capa dominante sem caixa exterior, badge sobre a imagem e grade 2/3/4/5 colunas conforme os breakpoints do modelo. Os dados completos e ações da biblioteca continuam abaixo. Resumos visuais mostram apenas contagens derivadas da seção local válida, com rótulos neutros para as faixas existentes.

Menu de conta usa acionador com avatar/chevron e opções recolhidas. Menu móvel usa sobreposição, foco contido, Escape e retorno de foco. Conexão usa cabeçalho identificado, ações com Lucide, switch e amostra recolhível com cópia explícita. A revisão não importa autenticação fictícia, referências privadas ou scripts do gerador.

## Revisão de interação 0.5.2

O titular substituiu a apresentação detalhada dos cards por capa/título e status no canto superior direito (amarelo pendente, check verde confirmado, com nomes acessíveis). Remover a dica temporal e o painel de desconexão; o botão Sincronizar é o caminho de reconexão. Erros de dados/cache continuam explícitos. A sobreposição de ações Lucide escurece a capa no hover ou foco e abre por toque no celular. Os demais campos, data e tempo completo aparecem no modal compartilhado de cadastro/edição. O modal contém opção de excluir com a confirmação existente, Escape, foco contido e retorno ao acionador ou à biblioteca depois de salvar/excluir. Nenhuma alteração no formato, cache ou política de sincronização.

## Revisão 0.5.3

Aplicar a transformação de hover ao contêiner comum da capa, em vez de à imagem isolada. Sobreposição, acionador e badges passam a acompanhar a mesma geometria em toda a animação. Restaurar o badge resumido de última leitura à esquerda, com data/tempo completo acessíveis e as faixas já existentes. Usar o dia reativo da página para recalcular o badge na virada do dia, sem alterar registros. Manter espaço reservado para o indicador de sincronização à direita e respeitar movimento reduzido.

A legenda visível das faixas (menos de 6 meses, 6 a 11 meses, 1 ano ou mais) acompanha as cores das tags restauradas e permanece junto à biblioteca.
