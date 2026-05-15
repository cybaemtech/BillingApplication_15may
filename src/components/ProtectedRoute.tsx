import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { useAccessContext } from "@/hooks/useAccessContext";
import { hasFeatureAccess } from "@/lib/access-control";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const { data: accessContext, isLoading: accessLoading } = useAccessContext();

  if (loading || (user && accessLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!hasFeatureAccess(accessContext, location.pathname)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
