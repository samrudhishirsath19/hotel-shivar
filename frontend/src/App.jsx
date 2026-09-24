import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import About from './pages/About'
import Rooms from './pages/Rooms'
import Services from './pages/Services'
import Gallery from './pages/Gallery'
import Restaurant from './pages/Restaurant'
import Banquet from './pages/Banquet'
import Offers from './pages/Offers'
import Contact from './pages/Contact'
import Location from './pages/Location'

function App(){
  return(
    <BrowserRouter>
      <Navbar/>
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/about" element={<About/>}/>
        <Route path="/rooms" element={<Rooms/>}/>
        <Route path="/services" element={<Services/>}/>
        <Route path="/gallery" element={<Gallery/>}/>
        <Route path="/restaurant" element={<Restaurant/>}/>
        <Route path="/banquet" element={<Banquet/>}/>
        <Route path="/offers" element={<Offers/>}/>
        <Route path="/contact" element={<Contact/>}/>
        <Route path="/location" element={<Location/>}/>
      </Routes>
      <Footer/>
    </BrowserRouter>
  )
}
export default App