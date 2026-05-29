import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

/** Loosened client type so service-role and user-scoped clients share one Edge adapter signature. */
export type AdminClient = SupabaseClient<any, "public", any>;
