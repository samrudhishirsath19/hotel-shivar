import { Link } from 'react-router-dom'
export default function Navbar(){
  return(
    <header style={{background:'#1a2a44', color:'#fff', padding:'14px 4%', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:50}}>
      <div style={{fontWeight:800}}>🏨 HOTEL SHIVAR</div>
      <nav style={{display:'flex', gap:'10px', fontSize:'12px'}}>
        <Link to="/" style={{color:'#fff', textDecoration:'none'}}>Home</Link>
        <Link to="/about" style={{color:'#fff', textDecoration:'none'}}>About</Link>
        <Link to="/rooms" style={{color:'#fff', textDecoration:'none'}}>Rooms</Link>
        <Link to="/services" style={{color:'#fff', textDecoration:'none'}}>Services</Link>
        <Link to="/gallery" style={{color:'#fff', textDecoration:'none'}}>Gallery</Link>
        <Link to="/restaurant" style={{color:'#fff', textDecoration:'none'}}>Restaurant</Link>
        <Link to="/banquet" style={{color:'#fff', textDecoration:'none'}}>Banquet</Link>
        <Link to="/offers" style={{color:'#fff', textDecoration:'none'}}>Offers</Link>
        <Link to="/contact" style={{color:'#fff', textDecoration:'none'}}>Contact</Link>
        <Link to="/location" style={{color:'#fff', textDecoration:'none'}}>Location</Link>
      </nav>
      <Link to="/contact" style={{background:'#d4b779', padding:'6px 12px', borderRadius:'4px', color:'#000', textDecoration:'none', fontWeight:700, fontSize:'12px'}}>Book Now</Link>
    </header>
  )
}