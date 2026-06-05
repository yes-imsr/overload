import { useMutation } from "@tanstack/react-query";
import type { DeleteAccountRequestBody } from "@/lib/delete-account";
import { supabase } from "@/lib/supabase";

export function useDeleteAccount() {
  return useMutation({
    mutationFn: async (body: DeleteAccountRequestBody) => {
      if (!supabase) {
        throw new Error("Supabase is not configured");
      }

      const { data, error } = await supabase.functions.invoke("delete-account", {
        body,
      });

      if (error) {
        throw error;
      }

      if (data && typeof data === "object" && "error" in data && data.error) {
        throw new Error(String(data.error));
      }

      return data as { deleted: true };
    },
  });
}
