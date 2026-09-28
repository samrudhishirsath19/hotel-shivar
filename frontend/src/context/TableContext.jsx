import { createContext, useState, useContext, useEffect } from "react";
const TableContext = createContext();
export const useTables = () => useContext(TableContext);

export function TableProvider({ children }) {
  const [tables, setTables] = useState(()=>{
    const saved = localStorage.getItem("shivar_tables");
    if(saved) return JSON.parse(saved);
    return {
      1: { orders: [], status: "available" },
      2: { orders: [], status: "available" },
      3: { orders: [], status: "available" },
      4: { orders: [], status: "available" },
      5: { orders: [], status: "available" },
    };
  });

  const [rooms, setRooms] = useState(()=>{
    const saved = localStorage.getItem("shivar_rooms_order");
    if(saved) return JSON.parse(saved);
    return {
      101: { orders: [], status: "available" },
      102: { orders: [], status: "available" },
      103: { orders: [], status: "available" },
      104: { orders: [], status: "available" },
      105: { orders: [], status: "available" },
    };
  });

  useEffect(()=>{ localStorage.setItem("shivar_tables", JSON.stringify(tables)); },[tables]);
  useEffect(()=>{ localStorage.setItem("shivar_rooms_order", JSON.stringify(rooms)); },[rooms]);

  const addOrderToTable = (no, items) => {
    setTables(prev => {
      let newOrders = [...prev[no].orders];
      items.forEach(it=>{
        const ex = newOrders.find(o=>o.id===it.id);
        if(ex) newOrders = newOrders.map(o=>o.id===it.id?{...o, qty:o.qty+it.qty}:o);
        else newOrders.push({...it, time: new Date().toLocaleTimeString(), source: `Table ${no}`});
      });
      return {...prev, [no]: { orders: newOrders, status: "occupied" } };
    });
  };

  const addOrderToRoom = (no, items) => {
    setRooms(prev => {
      let newOrders = [...prev[no].orders];
      items.forEach(it=>{
        const ex = newOrders.find(o=>o.id===it.id);
        if(ex) newOrders = newOrders.map(o=>o.id===it.id?{...o, qty:o.qty+it.qty}:o);
        else newOrders.push({...it, time: new Date().toLocaleTimeString(), source: `Room ${no}`});
      });
      return {...prev, [no]: { orders: newOrders, status: "occupied" } };
    });
  };

  const clearTable = (no) => setTables(prev => ({...prev, [no]: { orders: [], status: "available" } }));
  const clearRoom = (no) => setRooms(prev => ({...prev, [no]: { orders: [], status: "available" } }));

  return (
    <TableContext.Provider value={{ tables, rooms, addOrderToTable, addOrderToRoom, clearTable, clearRoom }}>
      {children}
    </TableContext.Provider>
  );
}