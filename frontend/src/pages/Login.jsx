import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
export default function Login(){
  const [u,setU]=useState(""); const [p,setP]=useState("");
  const {login}=useAuth(); const nav=useNavigate();
  const handle=()=>{
    if(login(u,p)){
      const all=JSON.parse(localStorage.getItem("shivar_users")||"[]");
      const user=all.find(x=>x.username===u);
      if(user?.role==="superadmin") nav("/super-admin");
      else if(user?.role==="chef") nav("/kitchen");
      else nav("/manager");
    } else alert("Wrong ID Password");
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFBF5]">
      <div className="bg-white p-8 rounded-2xl shadow border w-[350px]">
        <h1 className="font-bold text-xl mb-6 text-center">Staff Login</h1>
        <input value={u} onChange={e=>setU(e.target.value)} placeholder="Username" className="w-full border p-2.5 rounded-lg mb-3"/>
        <input value={p} onChange={e=>setP(e.target.value)} type="password" placeholder="Password" className="w-full border p-2.5 rounded-lg mb-4"/>
        <button onClick={handle} className="w-full bg-[#1F3B2D] text-white py-2.5 rounded-lg font-bold">Login</button>
      </div>
    </div>
  );
}