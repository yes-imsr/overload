/**
 * Expo public env vars (committed — `expo-env.d.ts` is gitignored by Expo default).
 */
declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_SUPABASE_URL?: string;
    EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
  }
}

declare const process: {
  env: NodeJS.ProcessEnv;
};
