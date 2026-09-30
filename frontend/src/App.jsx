import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import BookingModal from "./components/BookingModal";
import { CartProvider } from "./context/CartContext";
import { TableProvider } from "./context/TableContext";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Home from "./pages/Home";
import Rooms from "./pages/Rooms";
import Gallery from "./pages/Gallery";
import Restaurant from "./pages/Restaurant";
import Banquet from "./pages/Banquet";
import Offers from "./pages/Offers";
import About from "./pages/About";
import Contact from "./pages/Contact";
import ManagerDashboard from "./pages/ManagerDashboard";
import SuperAdmin from "./pages/SuperAdmin";
import Login from "./pages/Login";
import Kitchen from "./pages/Kitchen";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  const location = useLocation();
  // Login page and home are public, but website needs login first time
  if (!currentUser && location.pathname.startsWith("/home")) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function Layout() {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState("");
  const openBooking = (roomName = "") => { setSelectedRoom(roomName); setBookingOpen(true); };
  const location = useLocation();

  // Hide website navbar on login and all dashboards
  const isDashboard = location.pathname === "/" || location.pathname === "/login" || location.pathname.startsWith("/super-admin") || location.pathname.startsWith("/kitchen") || location.pathname.startsWith("/manager");

  return (
    <>
      <ScrollToTop />
      {!isDashboard && <Navbar onBookNow={() => openBooking()} />}
      <main className={!isDashboard? "pt-16" : ""}>
        <Routes>
          {/* STARTING PAGE = LOGIN */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />

          {/* WEBSITE - Accessible only after login via View Website */}
          <Route path="/home" element={<ProtectedRoute><Home onBookNow={openBooking} /></ProtectedRoute>} />
          <Route path="/rooms" element={<ProtectedRoute><Rooms onBookNow={openBooking} /></ProtectedRoute>} />
          <Route path="/gallery" element={<ProtectedRoute><Gallery /></ProtectedRoute>} />
          <Route path="/restaurant" element={<ProtectedRoute><Restaurant /></ProtectedRoute>} />
          <Route path="/banquet" element={<ProtectedRoute><Banquet /></ProtectedRoute>} />
          <Route path="/offers" element={<ProtectedRoute><Offers onBookNow={openBooking} /></ProtectedRoute>} />
          <Route path="/about" element={<ProtectedRoute><About /></ProtectedRoute>} />
          <Route path="/contact" element={<ProtectedRoute><Contact /></ProtectedRoute>} />

          <Route path="/manager" element={<ManagerDashboard />} />
          <Route path="/super-admin" element={<SuperAdmin />} />
          <Route path="/kitchen" element={<Kitchen />} />
        </Routes>
      </main>
      {!isDashboard && <BookingModal isOpen={bookingOpen} onClose={() => setBookingOpen(false)} roomName={selectedRoom} />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TableProvider>
          <CartProvider>
            <Layout />
          </CartProvider>
        </TableProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}