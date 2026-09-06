/**
 * CORS para os endpoints do cofre.
 *
 * Existe porque a interface passou a morar em outro domínio (Lovable) e o
 * navegador só deixa uma página falar com outra origem se a resposta disser,
 * explicitamente, que aquela origem é bem-vinda.
 *
 * A lista é fechada e vem do ambiente, nunca `*`. Com `*` qualquer página da
 * internet poderia disparar uma execução no cofre a partir do navegador de
 * quem estivesse logado — e o navegador é justamente quem não deve decidir
 * isso.
 *
 * Roda no middleware, que é edge: nada de API de Node aqui.
 *
 * Aviso honesto: CORS protege o NAVEGADOR de terceiros, não o endpoint. Um
 * `curl` ignora tudo isto. Os endpoints do cofre são de demonstração e mexem
 * só em devnet; se um dia mexerem em valor real, precisam de autenticação
 * própria, não de CORS.
 */

/** `https://app.exemplo.com`, ou `https://*.lovable.app` para subdomínios. */
function permitidas(): string[] {
  const doAmbiente = (process.env.ORIGENS_PERMITIDAS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  // Em desenvolvimento o front local precisa falar com a API local sem que
  // ninguém configure nada. Em produção, só o que estiver na variável.
  if (process.env.NODE_ENV !== 'production') {
    return [...doAmbiente, 'http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080'];
  }
  return doAmbiente;
}

function combina(origem: string, padrao: string): boolean {
  if (padrao === origem) return true;

  // `https://*.lovable.app` casa com `https://qualquer-coisa.lovable.app`, e
  // com mais nada: o ponto antes do domínio é obrigatório, senão
  // `https://*.lovable.app` aceitaria `https://malicioso-lovable.app`.
  const i = padrao.indexOf('://*.');
  if (i === -1) return false;

  const esquema = padrao.slice(0, i + 3);
  const dominio = padrao.slice(i + 5);
  return (
    origem.startsWith(esquema) &&
    origem.endsWith(`.${dominio}`) &&
    origem.length > `${esquema}.${dominio}`.length
  );
}

export function origemPermitida(origem: string | null): string | null {
  if (!origem) return null;
  return permitidas().some((p) => combina(origem, p)) ? origem : null;
}

/**
 * Carimba a resposta para a origem que perguntou.
 *
 * `Vary: Origin` não é detalhe: sem ele um cache guardaria a resposta com o
 * cabeçalho de uma origem e serviria para outra, e aí ou vaza ou quebra.
 */
export function comCors(resposta: Response, origem: string | null): Response {
  resposta.headers.set('Vary', 'Origin');

  const liberada = origemPermitida(origem);
  if (!liberada) return resposta;

  resposta.headers.set('Access-Control-Allow-Origin', liberada);
  resposta.headers.set('Access-Control-Allow-Credentials', 'true');
  return resposta;
}

/** A resposta ao `OPTIONS` que o navegador manda antes do POST. */
export function respostaPreflight(origem: string | null): Response {
  const resposta = new Response(null, { status: 204 });
  resposta.headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  resposta.headers.set('Access-Control-Allow-Headers', 'content-type,authorization');
  resposta.headers.set('Access-Control-Max-Age', '86400');
  return comCors(resposta, origem);
}
