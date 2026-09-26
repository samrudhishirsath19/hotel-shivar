import { useState } from "react";

const menu = [
  { id: 1, name: "Misal Pav", price: 120, type: "veg", cat: "Breakfast", desc: "Spicy Kamshet special misal with pav & farsan.", img: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=500" },
  { id: 2, name: "Cutting Chai", price: 20, type: "veg", cat: "Breakfast", desc: "Kadak Pimpri special cutting chai.", img: "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=500" },

 { id: 3, name: "Samosa Chaat", price: 150, type: "veg", cat: "Starter", desc: "Crushed samosa with chole & chutney.", img: "/images/Samosa chat.jpg" },
  { id: 4, name: "Chicken Crispy", price: 350, type: "nonveg", cat: "Starter", desc: "Crispy fried chicken with spicy dip.", img: "https://images.unsplash.com/photo-1562967914-608f82629710?w=500" },
  { id: 5, name: "Paneer Tikka", price: 320, type: "veg", cat: "Veg Bhaji", desc: "Cottage cheese marinated in hung curd, charred in tandoor.", img: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500" },
  { id: 6, name: "Dal Makhani", price: 260, type: "veg", cat: "Veg Bhaji", desc: "Black lentils simmered overnight with butter.", img: "/images/Dal makhani.jpg" },
  { id: 7, name: "Veg Kolhapuri", price: 280, type: "veg", cat: "Veg Bhaji", desc: "Spicy mixed veg Kolhapuri style with gravy.", img: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500" },

  { id: 8, name: "Veg Biryani", price: 300, type: "veg", cat: "Veg Rice", desc: "Long grain basmati with veggies & raita.", img: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500" },
  { id: 9, name: "Jeera Rice", price: 200, type: "veg", cat: "Veg Rice", desc: "Steamed basmati with jeera tadka.", img: "/images/Jeera rice.jpg" },

  // === NEW SEPARATE CATEGORY ===
    // === Roti / Chapati - CORRECT PHOTOS ===
  { id: 10, name: "Chapati / Roti", price: 30, type: "veg", cat: "Roti / Chapati", desc: "Soft phulka roti made with wheat (per piece).", img: "/images/Soft phulka roti made with wheat.jpg" },
  { id: 11, name: "Butter Roti", price: 40, type: "veg", cat: "Roti / Chapati", desc: "Phulka roti with butter topping.", img: "/images/Phulka roti with butter topping.jpg" },
  { id: 12, name: "Butter Naan", price: 50, type: "veg", cat: "Roti / Chapati", desc: "Tandoor baked naan with butter.", img: "/images/Tandoor baked naan with butter.jpg" },
  { id: 13, name: "Tandoor Roti", price: 35, type: "veg", cat: "Roti / Chapati", desc: "Tandoor baked crispy roti.", img: "/images/Tandoor baked crispy roti.jpg" },
  { id: 14, name: "Jwarichi Bhakri", price: 40, type: "veg", cat: "Roti / Chapati", desc: "Maharashtrian special jowar bhakri.", img: "/images/Maharashtrian special jowar bhakri.jpg" },

  { id: 15, name: "Butter Chicken", price: 380, type: "nonveg", cat: "Non-Veg Bhaji", desc: "Tandoori chicken in tomato butter gravy.", img: "/images/Butter chicken.jpg" },
  { id: 16, name: "Chicken Handi", price: 400, type: "nonveg", cat: "Non-Veg Bhaji", desc: "Boneless chicken cooked in handi with rich gravy.", img: "/images/Chicken handi.jpg" },
  { id: 17, name: "Mutton Curry", price: 480, type: "nonveg", cat: "Non-Veg Bhaji", desc: "Maharashtrian style spicy mutton curry.", img: "/images/Mutton curry.jpg" },

  { id: 18, name: "Hyderabadi Chicken Biryani", price: 420, type: "nonveg", cat: "Non-Veg Rice", desc: "Dum biryani with saffron rice, raita & salan.", img: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500" },
  { id: 19, name: "Chicken Fried Rice", price: 350, type: "nonveg", cat: "Non-Veg Rice", desc: "Wok tossed rice with chicken & veggies.", img: "/images/Chicken fried rice.jpg" },
  { id: 20, name: "Mutton Biryani", price: 520, type: "nonveg", cat: "Non-Veg Rice", desc: "Special mutton biryani slow cooked.", img: "/images/Mutton biryani.jpg" },

  { id: 21, name: "Chocolate Brownie", price: 160, type: "veg", cat: "Dessert", desc: "Hot brownie with chocolate sauce.", img: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500" },
  { id: 22, name: "Vanilla Ice Cream", price: 120, type: "veg", cat: "Dessert", desc: "3 scoops vanilla with choco chips.", img: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500" },
  { id: 23, name: "Chikki Kulfi", price: 180, type: "veg", cat: "Dessert", desc: "Malai kulfi topped with peanut chikki.", img: "https://images.unsplash.com/photo-1488900128323-21503983a07e?w=500" },
];

const cats = ["All", "Breakfast", "Starter", "Veg Bhaji", "Veg Rice", "Non-Veg Bhaji", "Non-Veg Rice", "Roti / Chapati", "Dessert"];

export default function Restaurant() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("All");

  const filtered = menu.filter(m => {
    const typeOk = typeFilter === "all"? true : m.type === typeFilter;
    const catOk = catFilter === "All"? true : m.cat === catFilter;
    return typeOk && catOk;
  });

  const orderNow = (item) => {
    const msg = `Hi Hotel Shivar, I want to order: ${item.name} - ₹${item.price}`;
    window.open(`https://wa.me/919999999999?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="bg-[#FFFBF5] min-h-screen pb-10">
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6">
        <h1 className="font-serif text-4xl text-[#1F3B2D]">Our Menu</h1>
        <div className="flex gap-3 mt-6">
          <button onClick={()=>setTypeFilter("all")} className={`px-5 py-2 rounded-full text-sm font-semibold border ${typeFilter==="all"? "bg-[#1F3B2D] text-white" : "bg-white"}`}>All</button>
          <button onClick={()=>setTypeFilter("veg")} className={`px-5 py-2 rounded-full text-sm font-semibold border ${typeFilter==="veg"? "bg-green-600 text-white" : "bg-white"}`}>🟩 Veg Only</button>
          <button onClick={()=>setTypeFilter("nonveg")} className={`px-5 py-2 rounded-full text-sm font-semibold border ${typeFilter==="nonveg"? "bg-red-600 text-white" : "bg-white"}`}>🟥 Non-Veg</button>
        </div>
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
          {cats.map(c => (
            <button key={c} onClick={()=>setCatFilter(c)} className={`whitespace-nowrap px-4 py-2 rounded-full text-[13px] font-medium border ${catFilter===c? "bg-[#B8893C] text-white border-[#B8893C]" : "bg-white text-gray-600"}`}>{c}</button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 grid md:grid-cols-2 gap-5">
        {filtered.map(item => (
          <div key={item.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border flex">
            <img src={item.img} className="w-36 h-36 object-cover" alt={item.name} onError={(e)=> e.target.src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500"} />
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between">
                  <h3 className="font-serif text-[#1F3B2D] text-[15px]">{item.name}</h3>
                  <span className="text-[#B8893C] font-bold text-sm">₹{item.price}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                <p className="text-[10px] text-gray-400 mt-1 uppercase">{item.cat}</p>
              </div>
              <button onClick={()=>orderNow(item)} className="mt-3 w-full bg-[#1F3B2D] text-white text-xs font-semibold py-2 rounded-lg hover:bg-black">Order Now</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}