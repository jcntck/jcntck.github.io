# Design

## Context

O shell usa React e HashRouter. `ConnectionPage` possui uma instância de `CloudSession`, cujo token Drive vive somente em memória; por isso o refresh desconecta. Não existe login global. A biblioteca `0.2.2` está publicada, homologada e arquivada; seu adaptador preserva schema 1, revisão, isolamento de contas e repetição após resposta perdida.

O usuário decidiu manter login por até 30 dias e tratar Drive separadamente. Deseja controlar o envio de alterações do futuro módulo de mangás, preferencialmente com botão de sincronização e possibilidade de automação enquanto houver autorização.

## Goals / Non-Goals

**Goals:** Restaurar identidade entre visitas, coordenar estado global sem misturar contas e oferecer contrato explícito de sincronização com Drive independente.

**Non-Goals:** Backend próprio, renovação offline de tokens Drive, serviços pagos, migração da hospedagem ou dos documentos, Firestore/Functions, sessão inviolável por código do próprio navegador, sincronização em navegador fechado, edição offline durável, implementação de mangás ou mudança do schema 1.

## Decisions

### Login persistente por Firebase Authentication

Usar o SDK modular Firebase Auth com provedor Google no plano Spark gratuito, escolha autorizada explicitamente pelo usuário. Isso acrescenta um serviço gerenciado de identidade, sem servidor próprio. Usar o projeto Google existente quando compatível, habilitar apenas autenticação Google e cadastrar os domínios autorizados de produção/local. Documentar criação do app Web, configuração pública e vínculo do provedor antes de qualquer provisionamento. Não ativar cobrança ou outros serviços. Conferir as cotas vigentes na configuração e documentar sua consulta no console. Ao atingir uma cota, informar indisponibilidade temporária e preservar o estado aplicável, sem migrar automaticamente para Blaze ou contratar capacidade.

O SDK cuida do login e da renovação das credenciais da aplicação. O hub não implementa verificação JOSE ou renovação manual de um ID token Google. Login não pede escopo Drive, não lê documentos e não reutiliza como credencial Drive qualquer token retornado pelo provedor de login.

Configurar persistência local suportada pelo SDK, preferindo IndexedDB, e usar os observadores do Auth. A persistência é por origem: localhost e Pages não compartilham sessão. Se armazenamento persistente estiver indisponível, informar que a entrada será temporária e usar memória, sem afirmar que sobreviverá ao refresh. Nenhum `isLoggedIn` ou perfil salvo pela aplicação é fonte de autenticação.

A credencial Firebase persistida pelo SDK é uma exceção explícita à proposta anterior de memória exclusiva. Não copiar esse estado para outra store ou logs. Google Drive access tokens e credenciais Google do provedor não são persistidos manualmente. `client_secret`, contas de serviço e chaves privadas nunca entram no frontend. Configuração pública Firebase identifica o projeto; não equivale a segredo.

Alternativas: GIS puro mantém login curto ou revalidação dependente do navegador e não assegura a experiência de 30 dias. Backend de refresh do Drive amplia a arquitetura e foi descartado pela decisão de manter conexão independente. Guardar apenas perfil/booleano por 30 dias simula login sem verificar identidade.

### Prazo absoluto de 30 dias

A aplicação permite a sessão restaurada por no máximo 30 × 24 horas desde a autenticação inicial, sem renovação deslizante. Usar o instante de autenticação fornecido pela sessão Firebase (`authTime`/`auth_time`), e não o instante de emissão de cada ID token ou um prazo livre alterável no storage.

Na inicialização, aguardar restauração e revalidar a sessão com o serviço via SDK antes de liberar rotas pessoais. Conferir conta, provedor Google, autenticidade pelo serviço e prazo. Não aceitar JWT decodificado isoladamente nem um usuário em cache como prova suficiente. Resposta inválida ou revogação efetivamente detectada encerra a sessão; falha transitória de rede mantém estado de verificação/erro recuperável sem exibir conteúdo pessoal como autenticado nem apagar imediatamente a credencial restaurável.

Recalcular o prazo no timer, retorno à aba e antes de ação pessoal. Como proteção contra relógio local atrasado, usar também o instante de emissão retornado na renovação pelo serviço; a política local não fornece garantia de prazo contra um navegador deliberadamente adulterado. Não interpretar renovação de token como nova entrada. Ao atingir o limite, executar saída pelo SDK, limpar Drive, dados privados e tentativas e pedir nova entrada explícita. Encerramento antecipado por logout, conta desabilitada ou sessão inválida tem prioridade.

Sair encerra a sessão deste aplicativo na origem e propaga o resultado às abas. Não desconecta a conta Google do navegador nem afirma revogar o consentimento Drive. Nova autenticação explícita começa um novo período.

### Estado global independente por responsabilidade

Usar um provedor React compartilhado no shell, com reducers/assinaturas e controladores injetáveis, sem introduzir uma biblioteca adicional de estado apenas para este caso. Estado de login: `restoring`, `anonymous`, `signing-in`, `signed-in`, `error`. Drive mantém seu estado e token volátil. Sincronização expõe `idle`, `pending`, `syncing`, `synced`, `error`, `conflict`, junto à disponibilidade da conexão.

Apenas Firebase Auth persiste o login. Estado remoto, base/revisão e tentativas de escrita permanecem em memória, por conta. O coordenador possui uma instância de `CloudSession` compartilhada por Conexão e módulos futuros. Observadores Auth invalidam gerações e limpam imediatamente documentos, links, rascunhos e operações ao sair/trocar de conta, inclusive quando isso ocorre em outra aba. Callbacks antigos nunca restauram estado ou usam credenciais de uma geração nova.

Refresh: restaurar e verificar login → montar a rota permitida → mostrar Drive desconectado. Não recuperar token Drive de storage, não abrir popup automaticamente e não criar/gravar documento. Desconectar ou expirar somente Drive preserva login; a tentativa dessa conta pode continuar na aba até decisão de descartar ou reconectar. Recarregar/fechar a página descarta tentativas em memória, mesmo que o login seja restaurado.

### Conferência da mesma conta no Drive

Manter GIS `google.accounts.oauth2` e o client ID público da integração existente para consentimento `drive.file` e `openid` por clique. Antes de `about`, busca de arquivo ou gravação, obter o `sub` do UserInfo Google com access token em cabeçalho e compará-lo à identidade Google associada ao usuário Firebase, obtida do provedor `google.com` (`providerData.uid`). Não comparar `sub` com o UID interno Firebase ou com `permissionId` do Drive; nomes/emails são apenas apresentação.

Ausência de vínculo Google, falha de UserInfo ou conta diferente impedem acesso aos documentos. Descartar a credencial divergente e oferecer conectar a mesma conta ou trocar login explicitamente. O login Firebase restaurado não implica permissão Drive, e o login não será trocado silenciosamente a partir de um consentimento de armazenamento.

### Contrato de sincronização manual e automática

Expor pelo estado compartilhado a operação de preparar uma alteração de seção e a ação `sync`, sem fazer consumidores dependerem diretamente de GIS/fetch. Separar alteração local pendente de gravação remota confirmada. Guardar conta, base/revisão e identidade estável da operação; retries usam a mesma identidade. Não criar uma segunda fila durável ou substituir o mecanismo de conflito/repetição da biblioteca.

A ação principal “Sincronizar” é explícita. Sem token válido, o clique pode oferecer reconexão naquela interação, conferir a mesma conta e reler antes de enviar; login sozinho não libera escrita. Não dizer “salvo no Drive” ao apenas preparar a alteração. Estado mostra pendência, envio, confirmação, erro ou conflito, além de última confirmação remota somente quando houve sucesso.

Nesta change, exercitar o contrato pela amostra técnica: preparar uma amostra identificável e enviá-la por “Sincronizar”, com releitura e link do arquivo mantidos. Se não houver pendência, a ação pode fazer leitura explícita para conferir os dados; não gerar outra amostra nem criar arquivo vazio. Testar a extensibilidade com consumidor de teste, sem acrescentar campos de mangás.

O modo padrão é manual. A automação exige habilitação explícita na sessão e volta ao padrão após reload/logout/troca de conta. Ela é uma tentativa com pequeno debounce após nova alteração pendente na aba ativa, somente com identidade válida, conta Drive já conferida e token válido. Não há polling periódico sem alterações, cron, service worker ou gravação ao restaurar login. O mesmo contrato serializa tentativas manuais e automáticas. Falha, conflito ou expiração interrompem automação e preservam tentativa na aba; não ficam repetindo requests nem abrem consentimento sem gesto. Logout/troca cancelam agendamentos. Alteração feita durante um envio deve continuar identificada como pendente após a confirmação anterior, sem ser descartada ou marcada como salva prematuramente.

Para mangás, reconciliar primeiro seus artefatos `1.0.0`: trocar a equivalência atual entre salvar formulário e salvar remotamente por confirmação local pendente e envio pelo contrato. Oferecer botão “Sincronizar” como base, informação de última sincronização e uso da mesma automação se habilitada no contrato. Esta proposta não implementa esse módulo, cache de biblioteca offline ou sincronização em segundo plano fechado.

### Navegação durante restauração

Preservar HashRouter, Início público, 404 e política `public | signed-in` por módulo, com pessoal como padrão. Menu e montagem da rota usam a mesma identidade validada. Durante `restoring`, mostrar estado de verificação sem renderizar conteúdo privado e sem redirecionar prematuramente para login. Se a sessão for restaurada válida dentro do prazo, manter a rota atual; se inválida/expirada, levar à entrada preservando um destino interno registrado em memória.

Após login, consumir uma vez esse destino. Nunca aceitar URL externa, esquema/host ou rota inexistente como retorno. Preservar foco/teclado e mensagens acessíveis. O pacote estático segue público; autorização efetiva dos documentos é aplicada pelo Google.

### Versão e entrega

A revisão é somente planejamento da mesma versão `0.3.0`. Pacote, lockfile e `.release.json` ficam em `0.2.2` até implementação autorizada. Depois, implementar em `dev`, selecionar só esta change para a entrega e abrir PR para `main`. Cada fix relatado após abertura incrementa patch e alinha pacote, lockfile, proposta e evidências. Usuário testa e realiza o merge; CI Dev não publica.

Prod valida o commit final, cria a tag da versão final e publica o mesmo artefato; sem commits de versão em `main` ou movimentação de tag. Registrar configuração pública, custo/plano, URL, SHA, execução, verificações reais e homologação em `docs/releases/0.3.0.md` (ou versão final revisada). Não iniciar mangás antes da homologação do login e reconciliação do plano de sincronização.

## Risks / Trade-offs

- [Novo serviço de identidade] → Firebase Auth somente, Spark sem cartão/cobrança; documentar configuração, limites e erro recuperável sem migrar dados Drive.
- [Credencial persistida acessível ao SDK no navegador] → Usar persistência oficial, código confiável, sem duplicação/logging e limpeza entre abas; não prometer isolamento contra JavaScript malicioso.
- [Confiar em login local adulterado] → Restaurar pelo SDK e conferir com o serviço antes de liberar rotas; prazo desde autenticação, sem JWT decodificado como prova.
- [Login restaurado, Drive desconectado] → Estados e mensagens separados; reconexão por clique somente quando necessária para sincronizar.
- [Automação sobrescrever alterações ou repetir erros] → Mesma serialização/revisão da biblioteca, operação estável, pausa em erro/conflito e manutenção da edição criada durante envio.
- [Refresh perder rascunhos] → Login persistente não é fila offline; informar pendências e avisar antes de saída quando possível, sem afirmar recuperação após fechar a aba.

## Migration Plan

1. Conferir evidências já homologadas de cloud library `0.2.2` e manter o schema dos documentos.
2. Na implementação, documentar e configurar Firebase Auth Google/Spark e domínios autorizados, com links oficiais. Não provisionar nem pedir credenciais privadas como parte deste planejamento.
3. Introduzir provedor de estado, persistência SDK, prazo e verificação de rotas; adaptar Drive e amostra técnica ao contrato de sincronização.
4. Testar prazo com relógio controlado, SDK simulado e serviço real em localhost/Pages. Validar restauração, logout entre abas e consentimento Drive independente em desktop/celular.
5. Entregar PR próprio e homologar produção. Rollback republica frontend identificado, sem remover documentos Drive; documentar limpeza da persistência de login ao voltar para um frontend anterior que não a consome.

## References

- [Firebase: persistência de autenticação](https://firebase.google.com/docs/auth/web/auth-state-persistence).
- [Firebase: login Google](https://firebase.google.com/docs/auth/web/google-signin).
- [Firebase: ciclo de sessão](https://firebase.google.com/docs/auth/admin/manage-sessions).
- [Firebase: plano Spark e limites](https://firebase.google.com/pricing).
- [GIS: autorização temporária por token](https://developers.google.com/identity/oauth2/web/guides/use-token-model).
