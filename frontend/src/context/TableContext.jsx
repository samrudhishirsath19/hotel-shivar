import { createContext, useState, useContext, useEffect } from "react";
const TableContext = createContext();
export const useTables = () => useContext(TableContext);

export function TableProvider({ children }) {
  const [tables, setTables] = useState(() => {
    try { const s = localStorage.getItem("shivar_tables"); return s? JSON.parse(s) : {1:{orders:[],status:"available"},2:{orders:[],status:"available"},3:{orders:[],status:"available"},4:{orders:[],status:"available"},5:{orders:[],status:"available"}}; } catch { return {1:{orders:[],status:"available"},2:{orders:[],status:"available"},3:{orders:[],status:"available"},4:{orders:[],status:"available"},5:{orders:[],status:"available"}}; }
  });
  const [rooms, setRooms] = useState(() => {
    try { const s = localStorage.getItem("shivar_rooms"); return s? JSON.parse(s) : {101:{orders:[],status:"available"},102:{orders:[],status:"available"},103:{orders:[],status:"available"},104:{orders:[],status:"available"},105:{orders:[],status:"available"}}; } catch { return {101:{orders:[],status:"available"},102:{orders:[],status:"available"},103:{orders:[],status:"available"},104:{orders:[],status:"available"},105:{orders:[],status:"available"}}; }
  });

  useEffect(() => { localStorage.setItem("shivar_tables", JSON.stringify(tables)); }, [tables]);
  useEffect(() => { localStorage.setItem("shivar_rooms", JSON.stringify(rooms)); }, [rooms]);

  // He 2 tab la sync karayla - Manager ne clear kela ki Restaurant la 0 disel
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "shivar_tables") setTables(JSON.parse(e.newValue));
      if (e.key === "shivar_rooms") setRooms(JSON.parse(e.newValue));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const addOrderToTable = (no, items) => {
    setTables(prev => {
      const cur = prev[no] || { orders: [], status: "available" };
      let newOrders = [...cur.orders];
      items.forEach(it => {
        const ex = newOrders.find(o => o.id === it.id);
        if (ex) newOrders = newOrders.map(o => o.id === it.id? {...o, qty: o.qty + (it.qty||1)} : o);
        else newOrders.push({...it, qty: it.qty||1});
      });
      return {...prev, [no]: { orders: newOrders, status: "occupied" } };
    });
  };
  const decreaseTableQty = (no, itemId) => {
    setTables(prev => {
      const cur = prev[no]; if(!cur) return prev;
      const newOrders = cur.orders.map(o => o.id===itemId? {...o, qty: o.qty-1} : o).filter(o => o.qty>0);
      return {...prev, [no]: { orders: newOrders, status: newOrders.length>0?"occupied":"available" } };
    });
  };
  const addOrderToRoom = (no, items) => {
    setRooms(prev => {
      const cur = prev[no] || { orders: [], status: "available" };
      let newOrders = [...cur.orders];
      items.forEach(it => {
        const ex = newOrders.find(o => o.id === it.id);
        if (ex) newOrders = newOrders.map(o => o.id === it.id? {...o, qty: o.qty + (it.qty||1)} : o);
        else newOrders.push({...it, qty: it.qty||1});
      });
      return {...prev, [no]: { orders: newOrders, status: "occupied" } };
    });
  };
  const decreaseRoomQty = (no, itemId) => {
    setRooms(prev => {
      const cur = prev[no]; if(!cur) return prev;
      const newOrders = cur.orders.map(o => o.id===itemId? {...o, qty: o.qty-1} : o).filter(o => o.qty>0);
      return {...prev, [no]: { orders: newOrders, status: newOrders.length>0?"occupied":"available" } };
    });
  };
  const clearTable = (no) => setTables(prev => ({...prev, [no]: { orders: [], status: "available" }}));
  const clearRoom = (no) => setRooms(prev => ({...prev, [no]: { orders: [], status: "available" }}));

  return (
    <TableContext.Provider value={{ tables, rooms, addOrderToTable, addOrderToRoom, decreaseTableQty, decreaseRoomQty, clearTable, clearRoom }}>
      {children}
    </TableContext.Provider>
  );
}