import { createContext, useContext } from "react";

// base = "/super-admin" for the super admin, "/panel" for every other department.
export const PanelContext = createContext({ base: "/super-admin", role: "SUPER_ADMIN" });
export const usePanel = () => useContext(PanelContext);
