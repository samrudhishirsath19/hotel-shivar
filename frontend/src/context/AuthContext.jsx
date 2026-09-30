import { createContext, useContext, useState, useEffect } from "react";
const AuthContext = createContext();
const defaultUsers = [
  { id: 1, username: "superadmin", password: "admin@123", role: "superadmin", name: "Super Admin" },
  { id: 2, username: "kitchen", password: "kitchen@123", role: "chef", name: "Kitchen Staff" },
  { id: 3, username: "manager", password: "manager@123", role: "manager", name: "Manager" },
];
export function AuthProvider({ children }) {
  const [users, setUsers] = useState(() => { const s = localStorage.getItem("shivar_users"); return s? JSON.parse(s) : defaultUsers; });
  const [currentUser, setCurrentUser] = useState(() => { const s = localStorage.getItem("shivar_currentUser"); return s? JSON.parse(s) : null; });
  useEffect(()=>{localStorage.setItem("shivar_users",JSON.stringify(users))},[users]);
  useEffect(()=>{localStorage.setItem("shivar_currentUser",JSON.stringify(currentUser))},[currentUser]);
  const login = (u,p) => { const f = users.find(x=>x.username===u && x.password===p); if(f){setCurrentUser(f); return true;} return false; };
  const logout = () => setCurrentUser(null);
  const createUser = (newUser) => setUsers([...users, {id: Date.now(),...newUser}]);
  const deleteUser = (id) => setUsers(users.filter(u=>u.id!==id));
  return <AuthContext.Provider value={{users,currentUser,login,logout,createUser,deleteUser}}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);