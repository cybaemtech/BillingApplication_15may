import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { accessApi } from "@/lib/api";

export function useAccessContext() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["access_context"],
    queryFn: accessApi.context,
    enabled: !!user,
    retry: false,
  });
}
