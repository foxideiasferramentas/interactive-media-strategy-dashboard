import { Navigate, Outlet } from "react-router";
import { useStore } from "../data/store";

export function AuthGuard() {
  const { isAuthenticated } = useStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
