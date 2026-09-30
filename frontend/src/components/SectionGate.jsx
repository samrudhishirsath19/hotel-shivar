import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { canSee, panelBase } from "../roles";

// A panel page that only some departments may open. Anyone else is sent back to their own dashboard.
export default function SectionGate({ id, children }) {
  const { user } = useAuth();
  if (!user) return null;
  return canSee(user.role, id) ? children : <Navigate to={panelBase(user.role)} replace />;
}
