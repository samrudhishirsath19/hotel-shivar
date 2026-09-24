export default function Home(){
  return(
    <div>
      <div style={{height:'80vh', background:`linear-gradient(rgba(0,0,0,0.5),rgba(0,0,0,0.5)), url(https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070) center/cover`, display:'flex', alignItems:'center', padding:'0 5%', color:'#fff'}}>
        <div><h1 style={{fontSize:'48px', margin:0}}>Hotel Shivar</h1><p>Luxury Stay</p><button style={{background:'#d4b779', border:'none', padding:'10px 20px', borderRadius:'4px', fontWeight:700, marginTop:'10px'}}>Book Now</button></div>
      </div>
      <div style={{padding:'40px 5%'}}><h2>Welcome!</h2><p>Hotel Shivar</p></div>
    </div>
  )
}