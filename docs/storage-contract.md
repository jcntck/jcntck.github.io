# Contrato compartilhado de biblioteca (schema 1)

`src/shared/storage/library.ts` define `Envelope`, `Snapshot`, `Operation` e `LibraryStorage`. `CloudSession` oferece a sessão em memória para consumidores sem dependência direta de GIS ou fetch: conectar, carregar (`reload`) e salvar seção (`saveSection`). A interface `getSnapshot`/`subscribe` informa fase, conta, base remota, tentativa pendente e permissão de gravação. A tela e futuros módulos devem compartilhar a mesma instância de sessão.

O envelope JSON exige `schemaVersion: 1`, `revision` não vazia, objetos `diagnostics` e `modules`. Cada alteração recebe UUID em `revision`; a operação usa esse mesmo UUID durante todas as tentativas. Campos extras e seções alheias são preservados. `saveSection('modules', moduleId, jsonValue)` substitui somente a seção daquele módulo. Não incluir segredos nos dados de módulos.

`load()` descobre `my-hub.json` por `appProperties.myHubDocument = library-v1` e retorna `Snapshot` ou `null` somente depois de ausência confirmada. Nunca cria arquivo. `save(base, operation)` relê, compara ID, revisão e conteúdo, preserva campos e envia atualização ou criação multipart. Depois relê para confirmar conteúdo. Resposta perdida é recuperável por nova leitura que reconhece UUID e valor da operação antes de tentar nova escrita. Revogar acesso ou perder rede não equivale a documento ausente.

Erros tipados: `invalid`, `expired`, `network`, `remote`, `ambiguous`, `conflict`, `disconnected`. O consumidor preserva a tentativa na aba e oferece reconexão/conferência da mesma conta ou releitura explícita que a descarta. Nenhuma tentativa de A é reaproveitada em B. Operações antigas não podem usar uma credencial de uma geração posterior da sessão. Chamadas de escrita são serializadas pela sessão.

A revisão detecta divergências anteriores à escrita, sem garantir exclusão mútua no Drive. Trabalhar em um dispositivo por vez. Não há armazenamento offline ou recuperação após fechar aba. Schema incompatível bloqueia gravação; não há migração destrutiva automática.

`Snapshot.webViewLink` é metadado opcional retornado pelo Drive, fora do envelope persistido. `src/shared/components/DriveFileLink.tsx` aceita `fileId`, `webViewLink` opcional e rótulo opcional em `children`. Prefere o link HTTPS do Drive retornado pela API; se ausente ou inválido, monta o endereço do visualizador pelo ID. Abre em nova aba sem token na URL e sem alterar compartilhamento. Usar apenas snapshots da conta atualmente conectada.
