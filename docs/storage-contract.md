# Contrato compartilhado de biblioteca (schema 1)

`src/shared/storage/library.ts` define `Envelope`, `Snapshot`, `Operation` e `LibraryStorage`. `CloudSession` oferece a sessão em memória para consumidores sem dependência direta de GIS ou fetch: conectar, carregar (`reload`), preparar seção (`stageSection`) e sincronizar (`sync`). A interface `getSnapshot`/`subscribe` informa fase, conta, base remota, tentativa pendente e permissão de gravação. A tela e futuros módulos devem compartilhar a mesma instância de sessão.

O envelope JSON exige `schemaVersion: 1`, `revision` não vazia, objetos `diagnostics` e `modules`. Cada alteração recebe UUID em `revision`; a operação usa esse mesmo UUID durante todas as tentativas. Campos extras e seções alheias são preservados. `stageSection('modules', moduleId, jsonValue)` prepara a substituição de somente a seção daquele módulo. Não incluir segredos nos dados de módulos.

`load()` descobre `my-hub.json` por `appProperties.myHubDocument = library-v1` e retorna `Snapshot` ou `null` somente depois de ausência confirmada. Nunca cria arquivo. `save(base, operation)` relê, compara ID, revisão e conteúdo, preserva campos e envia atualização ou criação multipart. Depois relê para confirmar conteúdo. Resposta perdida é recuperável por nova leitura que reconhece UUID e valor da operação antes de tentar nova escrita. Revogar acesso ou perder rede não equivale a documento ausente.

Erros tipados: `invalid`, `expired`, `network`, `remote`, `ambiguous`, `conflict`, `disconnected`. O consumidor preserva a tentativa na aba e oferece reconexão/conferência da mesma conta ou releitura explícita que a descarta. Nenhuma tentativa de A é reaproveitada em B. Operações antigas não podem usar uma credencial de uma geração posterior da sessão. Chamadas de escrita são serializadas pela sessão.

A revisão detecta divergências anteriores à escrita, sem garantir exclusão mútua no Drive. Trabalhar em um dispositivo por vez. Não há armazenamento offline ou recuperação após fechar aba. Schema incompatível bloqueia gravação; não há migração destrutiva automática.

`Snapshot.webViewLink` é metadado opcional retornado pelo Drive, fora do envelope persistido. `src/shared/components/DriveFileLink.tsx` aceita `fileId`, `webViewLink` opcional e rótulo opcional em `children`. Prefere o link HTTPS do Drive retornado pela API; se ausente ou inválido, monta o endereço do visualizador pelo ID. Abre em nova aba sem token na URL e sem alterar compartilhamento. Usar apenas snapshots da conta atualmente conectada.

## Estado compartilhado e sincronização (0.3.0)

Consumidores usam `useHub()` dentro de `HubProvider`: identidade em `hub.auth` e uma única sessão de documento em `hub.cloud`. `stageSection(target, key, value)` prepara uma operação em memória sem gravar; `sync()` envia a pendência ou faz leitura explícita quando não há alteração. Observar `syncPhase`, `pending`, `queued` e `lastSynced` por `getSnapshot`/`subscribe`. Uma nova edição durante envio é mantida separadamente; a confirmação não a descarta. O chamador nunca confirma persistência só por preparar uma alteração.

O modo manual é padrão. `setAutomatic(true)` habilita tentativas com debounce de 750 ms somente com autorização válida e aba ativa; falha/conflito/expiração pausam a automação até decisão do usuário. `resumeAutomatic()` pode reagendar depois do retorno à aba. Conta/revisão/ID da operação continuam conferidos no contrato existente. Logout/troca limpam ambas as sessões e pendências. Recarregar restaura só o login Firebase; token Drive, estado remoto e rascunhos continuam voláteis.

A autenticação SDK guarda exclusivamente sua própria sessão, por até 30 dias desde o authTime. Documentos de negócio não são movidos para Firebase. Mangás consomem este contrato sem uma segunda fila de sincronização.

## Mangás (0.4.1)

`modules.mangas` é um objeto `{ items: Manga[] }`. Cada registro contém `id` UUID estável, `title`, `lastChapter` textual, `lastReadOn` como dia civil `YYYY-MM-DD` e `updatedAt` como instante técnico ISO e `scanUrl` HTTP/HTTPS opcional sem credenciais. Registros antigos sem link continuam válidos; esvaziar o campo remove o link. Ausência da seção, depois de leitura válida, significa lista vazia. Uma seção inválida bloqueia edição, sem substituição por vazio. Campos extras do registro, da seção, do envelope e outros módulos são preservados.

`src/modules/mangas/model.ts` valida e atualiza exclusivamente essa seção. Datas remotas aparentemente futuras são mantidas e apresentadas para conferência; entradas do formulário não aceitam datas futuras. O cálculo de tempo usa aniversários completos, ajustados ao último dia de mês/ano, e dias civis sem divisão de intervalos locais de 24 horas. Foco, visibilidade e meia-noite local atualizam as mensagens.

`CloudSession.pendingSection(target, key)` projeta o valor mais recente da seção em toda a fila existente, inclusive alterações aguardando uma operação em voo. Não cria cache ou fila adicional. A listagem distingue o conteúdo pendente da base remota confirmada. `DrivePanel` compartilha os controles de sincronização e o link do arquivo entre Conexão e Mangás. Reler/Desconectar com pendências exige confirmação de descarte.

No patch 0.4.1, Mangás usa `stageSection(..., { manual: true })`. Essa política acompanha a operação em memória, inclusive na fila, retry e reconexão, e impede o agendamento automático mesmo se outro consumidor tiver habilitado o modo automático da sessão. Somente `sync()` solicitado pelo leitor envia as pendências de mangás; múltiplas edições preparadas antes do envio são consolidadas na mesma seção. A política manual não é persistida no envelope. O controle automático permanece disponível para a amostra da tela Conexão.

Busca e ordenação usam somente os registros em memória. O resultado da verificação HEAD da scan é volátil, por clique, com timeout de 8 s, sem credenciais/referrer e sem fallback ou polling. CORS/rede/conteúdo misto/resposta opaca são inconclusivos; erro HTTP observável mostra o código, sem afirmar que o site caiu. Não há proxy, backend ou gravação desse status no Drive. Referência: [Fetch/CORS (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch).
