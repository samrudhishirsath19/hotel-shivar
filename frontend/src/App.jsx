import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import Navbar from "./components/Navbar";
import BookingModal from "./components/BookingModal";
import { CartProvider } from "./context/CartContext";
import { TableProvider } from "./context/TableContext";

import Home from "./pages/Home";
import Rooms from "./pages/Rooms";
import Gallery from "./pages/Gallery";
import Restaurant from "./pages/Restaurant";
import Banquet from "./pages/Banquet";
import Offers from "./pages/Offers";
import About from "./pages/About";
import Contact from "./pages/Contact";
import ManagerDashboard from "./pages/ManagerDashboard";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState("");
  const openBooking = (roomName = "") => { setSelectedRoom(roomName); setBookingOpen(true); };

  return (
    <BrowserRouter>
      <TableProvider>
        <CartProvider>
          <ScrollToTop />
          <Navbar onBookNow={() => openBooking()} />
          <main className="pt-16">
            <Routes>
              <Route path="/" element={<Home onBookNow={openBooking} />} />
              <Route path="/rooms" element={<Rooms onBookNow={openBooking} />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/restaurant" element={<Restaurant />} />
              <Route path="/banquet" element={<Banquet />} />
              <Route path="/offers" element={<Offers onBookNow={openBooking} />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/manager" element={<ManagerDashboard />} />
              <Route path="*" element={<div className="text-center pt-20">Page not found</div>} />
            </Routes>
          </main>
          <BookingModal isOpen={bookingOpen} onClose={() => setBookingOpen(false)} roomName={selectedRoom} />
        </CartProvider>
      </TableProvider>
    </BrowserRouter>
  );
}