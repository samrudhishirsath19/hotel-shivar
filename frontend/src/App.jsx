import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import Navbar from "./components/Navbar";
import BookingModal from "./components/BookingModal";

import Home from "./pages/Home";
import Rooms from "./pages/Rooms";
import Gallery from "./pages/Gallery";
import Restaurant from "./pages/Restaurant";
import Banquet from "./pages/Banquet";
import Offers from "./pages/Offers";
import About from "./pages/About";
import Contact from "./pages/Contact";

// Scrolls to top whenever the route changes
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="font-serif text-4xl text-[#1F3B2D] mb-3">Page not found</h1>
      <p className="text-gray-600">Use the menu above to find your way back.</p>
    </div>
  );
}

export default function App() {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState("");

  const openBooking = (roomName = "") => {
    setSelectedRoom(roomName);
    setBookingOpen(true);
  };

  return (
    <BrowserRouter>
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <BookingModal
        isOpen={bookingOpen}
        onClose={() => setBookingOpen(false)}
        roomName={selectedRoom}
      />
    </BrowserRouter>
  );
}
