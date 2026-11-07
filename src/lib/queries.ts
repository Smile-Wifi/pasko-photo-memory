import { queryOptions } from "@tanstack/react-query";
import { getSiteData } from "@/lib/api/orders.functions";

export const siteDataQuery = queryOptions({
  queryKey: ["site-data"],
  queryFn: () => getSiteData(),
  staleTime: 60_000,
});
