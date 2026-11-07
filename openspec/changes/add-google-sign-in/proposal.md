# Proposal

## Version

`0.3.0` — versão definida pelo usuário para login Google, estado global e sessão persistente por até 30 dias. A aplicação permanece `0.2.2` durante o planejamento.

## Why

Hoje o refresh descarta a conexão em memória e não existe uma sessão global de login. O usuário deseja manter a entrada no hub entre visitas, deixando a autorização Drive independente e tornando explícito quando os futuros módulos enviam alterações à nuvem.

## What Changes

- Adicionar “Entrar com Google” e menu de conta, mantendo Início público e verificando identidade nas rotas pessoais.
- Adotar estado global compartilhado para identidade, autorização Drive e situação da sincronização, com restauração de login antes de decidir a navegação.
- Usar Firebase Authentication com provedor Google no plano gratuito Spark, autorizado pelo usuário para persistir/renovar a sessão do aplicativo, com limite absoluto de 30 dias desde a entrada, sem estender o prazo a cada refresh. Logout, sessão inválida ou revogada podem encerrá-la antes.
- Restaurar o login após refresh/reabertura sem conectar automaticamente o Drive. Credenciais Firebase ficam sob persistência do SDK; tokens Google usados para Drive continuam exclusivamente em memória.
- Manter autorização `drive.file` explícita e independente, sem renovação offline ou backend de tokens Drive; conferir que login e Drive correspondem à mesma conta.
- Expor contrato de alterações pendentes/sincronização para futuros módulos, com operação manual “Sincronizar”, confirmação remota e estados de erro/conflito. Nesta entrega validar o contrato com a amostra técnica, sem cadastrar mangás.
- Definir sincronização automática como reação a alterações pendentes enquanto a aplicação estiver aberta, a conta conferida e o token Drive válido; ela não abre consentimento nem executa em navegador fechado. Login, refresh e restauração não enviam alterações automaticamente.
- Preparar mangás para usar esse contrato em sua change própria, com sincronização manual como base e sem prometer edição offline durável.

## Capabilities

### New Capabilities

- `google-sign-in`: Identidade persistente do hub, limite de sessão, coordenação de estado separada da autorização Drive.

### Modified Capabilities

- `modular-shell`: Navegação pública/pessoal, espera pela restauração do login e retorno seguro ao destino interno.
- `cloud-library`: Persistência de login gerenciada pelo SDK como exceção explícita, mantendo tokens Drive em memória, e contrato de alterações pendentes/sincronização manual ou automática autorizada.

## Impact

- A escolha de BaaS está autorizada pelo usuário enquanto houver cota gratuita: manter Spark sem cobrança, conferir limites antes da implementação e documentar acompanhamento de uso. Esgotar a cota deve resultar em mensagem recuperável, sem troca automática para plano pago.
- Adicionar SDK modular Firebase Auth e configuração pública; provisionamento/configuração no console será manual e documentado antes dos testes reais. Não contratar plano pago, Firestore, Functions ou Firebase Hosting.
- Reutilizar o frontend no GitHub Pages, o cliente GIS do Drive e o armazenamento schema 1. Não criar backend próprio ou mover dados de negócio para Firebase.
- `App`, catálogo de módulos e provedores comuns passam a compartilhar identidade/Drive/sincronização. `ConnectionPage` deixa de possuir uma sessão isolada e consome esse estado.
- Ajustar a regra de inspeção: é esperada persistência gerenciada de credenciais Firebase para o login; tokens Google Drive, client secret e dados privados do documento não podem ser persistidos pelo hub nem incluídos no pacote, URLs ou logs.
- O controle de rotas organiza a experiência da SPA; o pacote estático continua público e os documentos seguem protegidos pelo Drive.
- A biblioteca `0.2.2` já foi publicada, homologada e arquivada. A implementação desta proposta será solicitada separadamente, sempre em `dev` e entregue em PR para `main`.
- Na implementação, alinhar pacote/lockfile e seleção da release a `0.3.0`. Usuário testa e faz o merge; cada fix de revisão incrementa patch. CI valida sem publicar; Prod cria a tag da versão final e publica o commit validado sem alterar versão em `main`.

## Sequence and Acceptance

Ordem: shell → cloud library → login/estado global → mangás. Não agrupar implementações de versões diferentes. Mangás precisam ter seus artefatos reconciliados com o contrato de sincronização antes de implementar `1.0.0` e aguardar a homologação do login.

Verificar restauração após refresh/reabertura, ausência de flash de conta anterior, logout entre abas, saída no limite de 30 dias sem renovação deslizante, armazenamento bloqueado, falhas de autenticação, login sem Drive, reconexão Drive sem perder login, conta divergente, alterações pendentes, sincronização manual/automática autorizada, conflitos e confirmação remota. Testar prazo com relógio controlado e cenários reais no Pages; registrar limitações, versão, SHA, execução e homologação sem dados privados.
