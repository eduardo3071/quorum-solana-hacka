/**
 * O app sem as credenciais do banco.
 *
 * Aparece quando `VITE_SUPABASE_URL` ou `VITE_SUPABASE_PUBLISHABLE_KEY` não
 * chegaram ao build. É o estado de quem acabou de importar o projeto e ainda
 * não preencheu as variáveis — e antes desta tela era uma página vazia, que
 * não diz o que fazer.
 */
export function FaltaConfigurar({ faltando }: { faltando: string[] }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col justify-center gap-4 px-4 py-10">
      <header>
        <p className="t-rotulo text-ink-3">Tesouraria estudantil</p>
        <h1 className="t-hero mt-2 text-ink">Quórum</h1>
      </header>

      <section className="rounded-card bg-amber-tint p-4">
        <h2 className="t-item text-ink">Falta configurar o acesso ao banco</h2>
        <p className="t-desc mt-2 text-pretty text-ink-2">
          O app não recebeu as credenciais públicas do Supabase. Elas são
          públicas por natureza — quem protege os dados é a política de acesso
          do banco, não o segredo da chave.
        </p>
        <ul className="mt-3 flex flex-col gap-1.5">
          {faltando.map((v) => (
            <li
              key={v}
              className="rounded-tile-sm bg-ground/30 px-3 py-2 font-mono text-[11.5px] leading-none text-ink"
            >
              {v}
            </li>
          ))}
        </ul>
      </section>

      <p className="t-meta text-pretty text-ink-3">
        Defina as duas nas variáveis de ambiente do projeto e publique de novo.
        Os valores estão no painel do Supabase, em Settings → API.
      </p>
    </main>
  );
}
