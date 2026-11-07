import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

// Daily retention job: deletes expired orders and their photos.
export const Route = createFileRoute("/api/public/jobs/cleanup")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authFailure = await authenticateCronRequest(request);
        if (authFailure) return authFailure;
        const { cleanupExpiredOrders } = await import("@/server/storage.server");
        const removed = await cleanupExpiredOrders();
        return Response.json({ success: true, removed });
      },
    },
  },
});
