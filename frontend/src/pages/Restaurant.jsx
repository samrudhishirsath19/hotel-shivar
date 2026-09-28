import { useState } from "react";
import { useCart } from "../context/CartContext";
import { useTables } from "../context/TableContext";

const menu = [
  { id: 1, name: "Misal Pav", price: 120, type: "veg", cat: "Breakfast", desc: "Spicy Kamshet special misal with pav & farsan.", img: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=500" },
  { id: 2, name: "Cutting Chai", price: 20, type: "veg", cat: "Breakfast", desc: "Kadak Pimpri special cutting chai.", img: "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=500" },
  { id: 3, name: "Samosa Chaat", price: 150, type: "veg", cat: "Starter", desc: "Crushed samosa with chole & chutney.", img: "/images/Samosa chat.jpg" },
  { id: 4, name: "Chicken Crispy", price: 350, type: "nonveg", cat: "Starter", desc: "Crispy fried chicken with spicy dip.", img: "https://images.unsplash.com/photo-1562967914-608f82629710?w=500" },
  { id: 5, name: "Paneer Tikka", price: 320, type: "veg", cat: "Veg Bhaji", desc: "Cottage cheese marinated in hung curd.", img: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500" },
  { id: 6, name: "Dal Makhani", price: 260, type: "veg", cat: "Veg Bhaji", desc: "Black lentils with butter.", img: "/images/Dal makhani.jpg" },
  { id: 7, name: "Veg Kolhapuri", price: 280, type: "veg", cat: "Veg Bhaji", desc: "Spicy mixed veg Kolhapuri style.", img: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500" },
  { id: 8, name: "Veg Biryani", price: 300, type: "veg", cat: "Veg Rice", desc: "Long grain basmati with veggies.", img: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500" },
  { id: 9, name: "Jeera Rice", price: 200, type: "veg", cat: "Veg Rice", desc: "Steamed basmati with jeera tadka.", img: "/images/Jeera rice.jpg" },
  { id: 10, name: "Chapati / Roti", price: 30, type: "veg", cat: "Roti / Chapati", desc: "Soft phulka roti.", img: "/images/Soft phulka roti made with wheat.jpg" },
  { id: 11, name: "Butter Roti", price: 40, type: "veg", cat: "Roti / Chapati", desc: "Phulka roti with butter.", img: "/images/Phulka roti with butter topping.jpg" },
  { id: 12, name: "Butter Naan", price: 50, type: "veg", cat: "Roti / Chapati", desc: "Tandoor baked naan with butter.", img: "/images/Tandoor baked naan with butter.jpg" },
  { id: 13, name: "Tandoor Roti", price: 35, type: "veg", cat: "Roti / Chapati", desc: "Tandoor baked crispy roti.", img: "/images/Tandoor baked crispy roti.jpg" },
  { id: 14, name: "Jwarichi Bhakri", price: 40, type: "veg", cat: "Roti / Chapati", desc: "Maharashtrian special jowar bhakri.", img: "/images/Maharashtrian special jowar bhakri.jpg" },
  { id: 15, name: "Butter Chicken", price: 380, type: "nonveg", cat: "Non-Veg Bhaji", desc: "Tandoori chicken in butter gravy.", img: "/images/Butter chicken.jpg" },
  { id: 16, name: "Chicken Handi", price: 400, type: "nonveg", cat: "Non-Veg Bhaji", desc: "Boneless chicken in handi.", img: "/images/Chicken handi.jpg" },
  { id: 17, name: "Mutton Curry", price: 480, type: "nonveg", cat: "Non-Veg Bhaji", desc: "Maharashtrian spicy mutton curry.", img: "/images/Mutton curry.jpg" },
  { id: 18, name: "Hyderabadi Chicken Biryani", price: 420, type: "nonveg", cat: "Non-Veg Rice", desc: "Dum biryani with raita.", img: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500" },
  { id: 19, name: "Chicken Fried Rice", price: 350, type: "nonveg", cat: "Non-Veg Rice", desc: "Wok tossed rice with chicken.", img: "/images/Chicken fried rice.jpg" },
  { id: 20, name: "Mutton Biryani", price: 520, type: "nonveg", cat: "Non-Veg Rice", desc: "Special mutton biryani slow cooked.", img: "/images/Mutton biryani.jpg" },
  { id: 21, name: "Chocolate Brownie", price: 160, type: "veg", cat: "Dessert", desc: "Hot brownie with chocolate sauce.", img: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500" },
  { id: 22, name: "Vanilla Ice Cream", price: 120, type: "veg", cat: "Dessert", desc: "3 scoops vanilla with choco chips.", img: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500" },
  { id: 23, name: "Chikki Kulfi", price: 180, type: "veg", cat: "Dessert", desc: "Malai kulfi with peanut chikki.", img: "https://images.unsplash.com/photo-1488900128323-21503983a07e?w=500" },
  { id: 24, name: "Water Bottle 1L", price: 20, type: "common", cat: "Water Bottle", desc: "Bisleri Mineral Water 1 Litre.", img: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=500" },
  { id: 25, name: "Water Bottle 500ml", price: 10, type: "common", cat: "Water Bottle", desc: "Bisleri 500ml.", img: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=500" },
];

const cats = ["All", "Breakfast", "Starter", "Veg Bhaji", "Veg Rice", "Non-Veg Bhaji", "Non-Veg Rice", "Roti / Chapati", "Dessert", "Water Bottle"];

export default function Restaurant() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("All");
  const [qty, setQty] = useState({});

  // NEW - Room + Table
  const [orderType, setOrderType] = useState("table"); // table | room
  const [selectedTable, setSelectedTable] = useState(1);
  const [selectedRoom, setSelectedRoom] = useState(101);

  const { addToCart } = useCart();
  const { tables, rooms, addOrderToTable, addOrderToRoom } = useTables();

  const visibleCats = cats.filter(c => {
    if (["Water Bottle", "Roti / Chapati", "Dessert"].includes(c)) return true;
    if (typeFilter === 'veg' && c.includes('Non-Veg')) return false;
    if (typeFilter === 'nonveg' && (c === 'Veg Bhaji' || c === 'Veg Rice' || c === 'Breakfast')) return false;
    return true;
  });

  const filtered = menu.filter(m => {
    const isCommonCat = ["Water Bottle", "Roti / Chapati", "Dessert"].includes(m.cat);
    const typeOk = isCommonCat || m.type === "common"? true : typeFilter === "all"? true : m.type === typeFilter;
    const catOk = catFilter === "All"? true : m.cat === catFilter;
    return typeOk && catOk;
  });

  const updateQty = (id, delta) => {
    setQty(prev => ({...prev, [id]: Math.max(0, (prev[id] || 0) + delta) }));
  };

  const handleAdd = (item) => {
    const quantity = qty[item.id] || 1;
    addToCart(item, quantity);
    if(orderType === "table"){
      addOrderToTable(selectedTable, [{...item, qty: quantity}]);
    } else {
      addOrderToRoom(selectedRoom, [{...item, qty: quantity}]);
    }
    setQty(prev=>({...prev, [item.id]:0}));
  };

  return (
    <div className="bg-[#FFFBF5] min-h-screen pb-10">
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-20">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <h1 className="font-serif text-3xl text-[#1F3B2D]">Our Menu</h1>

          {/* NEW SELECTOR - TABLE + ROOM */}
          <div className="flex flex-col gap-2 bg-white border rounded-2xl px-4 py-3 shadow-sm min-w-[280px]">
            <div className="flex gap-2">
              <button onClick={()=>setOrderType("table")} className={`flex-1 px-3 py-1.5 rounded-full text-xs font-bold ${orderType==="table"?"bg-[#1F3B2D] text-white":"bg-gray-100 text-gray-600"}`}>🍽️ Table Order</button>
              <button onClick={()=>setOrderType("room")} className={`flex-1 px-3 py-1.5 rounded-full text-xs font-bold ${orderType==="room"?"bg-[#B8893C] text-white":"bg-gray-100 text-gray-600"}`}>🛎️ Room Service</button>
            </div>
            {orderType==="table"? (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] font-bold text-gray-500">Table:</span>
                {[1,2,3,4,5].map(n=>(
                  <button key={n} onClick={()=>setSelectedTable(n)} className={`w-8 h-8 rounded-full text-xs font-bold border ${selectedTable===n? 'bg-[#1F3B2D] text-white border-[#1F3B2D]' : tables[n]?.status==='occupied'? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-white text-gray-600'}`}>{n}</button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] font-bold text-gray-500">Room:</span>
                {[101,102,103,104,105].map(n=>(
                  <button key={n} onClick={()=>setSelectedRoom(n)} className={`w-10 h-8 rounded-full text-xs font-bold border ${selectedRoom===n? 'bg-[#B8893C] text-white border-[#B8893C]' : rooms[n]?.status==='occupied'? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-white text-gray-600'}`}>{n}</button>
                ))}
              </div>
            )}
            <span className="text-[10px] text-gray-400 text-center">{orderType==="table"? `Now ordering for Table ${selectedTable}` : `Now ordering for Room ${selectedRoom}`}</span>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={()=>{setTypeFilter("all"); setCatFilter("All")}} className={`px-5 py-2 rounded-full text-sm font-semibold border ${typeFilter==="all"? "bg-[#1F3B2D] text-white" : "bg-white"}`}>All</button>
          <button onClick={()=>{setTypeFilter("veg"); setCatFilter("All")}} className={`px-5 py-2 rounded-full text-sm font-semibold border ${typeFilter==="veg"? "bg-green-600 text-white" : "bg-white"}`}>🟩 Veg Only</button>
          <button onClick={()=>{setTypeFilter("nonveg"); setCatFilter("All")}} className={`px-5 py-2 rounded-full text-sm font-semibold border ${typeFilter==="nonveg"? "bg-red-600 text-white" : "bg-white"}`}>🟥 Non-Veg</button>
          <a href="/manager" className="ml-auto px-4 py-2 rounded-full text-xs font-bold bg-[#B8893C] text-white">Manager View →</a>
        </div>
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
          {visibleCats.map(c => (
            <button key={c} onClick={()=>setCatFilter(c)} className={`whitespace-nowrap px-4 py-2 rounded-full text-[13px] font-medium border ${catFilter===c? "bg-[#B8893C] text-white border-[#B8893C]" : "bg-white text-gray-600"}`}>{c}</button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(item => (
          <div key={item.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border flex flex-col">
            <img src={item.img} className="w-full h-40 object-cover" alt={item.name} onError={(e)=> e.target.src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500"} />
            <div className="p-3 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="font-serif text-[#1F3B2D] text-[15px]">{item.name} <span className="text-[10px]">{item.type==='veg'? '🟩' : item.type==='nonveg'? '🟥' : '💧'}</span></h3>
                  <span className="text-[#B8893C] font-bold text-sm">₹{item.price}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
              </div>
              <div className="flex items-center justify-between mt-3 gap-2">
                <div className="flex items-center border rounded-lg">
                  <button onClick={()=>updateQty(item.id, -1)} className="px-3 py-1 font-bold">-</button>
                  <span className="px-2 text-sm w-6 text-center">{qty[item.id] || 0}</span>
                  <button onClick={()=>updateQty(item.id, 1)} className="px-3 py-1 font-bold">+</button>
                </div>
                <button onClick={()=>handleAdd(item)} className={`flex-1 text-white text-xs font-semibold py-2 rounded-lg ${orderType==="table"?"bg-[#1F3B2D]":"bg-[#B8893C]"}`}>
                  {orderType==="table"? `Add to T${selectedTable}` : `Add to R${selectedRoom}`}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
