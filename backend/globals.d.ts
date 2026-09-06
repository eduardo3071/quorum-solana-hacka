declare module '*.css';

interface ImportMetaEnv {
  readonly [chave: string]: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
