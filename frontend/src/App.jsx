import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";

import Navbar from "./components/Navbar";
import BookingModal from "./components/BookingModal";
import ProtectedRoute from "./components/ProtectedRoute";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";

import Home from "./pages/Home";
import Rooms from "./pages/Rooms";
import Gallery from "./pages/Gallery";
import Restaurant from "./pages/Restaurant";
import Banquet from "./pages/Banquet";
import Offers from "./pages/Offers";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import ManagerDashboard from "./pages/ManagerDashboard";

import SuperAdminLayout from "./pages/superadmin/SuperAdminLayout";
import Overview from "./pages/superadmin/Overview";
import KotPage from "./pages/superadmin/KotPage";
import TablesPage from "./pages/superadmin/TablesPage";
import ReservationPage from "./pages/superadmin/ReservationPage";
import BillingPage from "./pages/superadmin/BillingPage";
import InventoryPage from "./pages/superadmin/InventoryPage";
import PurchasePage from "./pages/superadmin/PurchasePage";
import StaffPage from "./pages/superadmin/StaffPage";
import MenuTab from "./pages/admin/MenuTab";
import SalesTab from "./pages/admin/SalesTab";
import UsersTab from "./pages/admin/UsersTab";
import { PageTitle } from "./pages/superadmin/ui";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

// The public website: navbar on top, booking window, page below.
function SiteLayout({ bookingOpen, setBookingOpen, selectedRoom, openBooking }) {
  return (
    <>
      <Navbar onBookNow={() => openBooking()} />
      <main className="pt-16">
        <Outlet />
      </main>
      <BookingModal isOpen={bookingOpen} onClose={() => setBookingOpen(false)} roomName={selectedRoom} />
    </>
  );
}

export default function App() {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState("");
  const openBooking = (roomName = "") => { setSelectedRoom(roomName); setBookingOpen(true); };

  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ScrollToTop />
          <Routes>
            {/* ---------- public website (+ login and manager page) ---------- */}
            <Route element={<SiteLayout bookingOpen={bookingOpen} setBookingOpen={setBookingOpen} selectedRoom={selectedRoom} openBooking={openBooking} />}>
              <Route path="/" element={<Home onBookNow={openBooking} />} />
              <Route path="/rooms" element={<Rooms onBookNow={openBooking} />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/restaurant" element={<Restaurant />} />
              <Route path="/banquet" element={<Banquet />} />
              <Route path="/offers" element={<Offers onBookNow={openBooking} />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              {/* any staff login: manager / reception / restaurant / kitchen (super admin too) */}
              <Route path="/manager" element={<ProtectedRoute><ManagerDashboard /></ProtectedRoute>} />
              <Route path="*" element={<div className="text-center pt-20">Page not found</div>} />
            </Route>

            {/* ---------- super admin panel: sidebar layout, super admin only ---------- */}
            <Route path="/super-admin" element={<ProtectedRoute roles={["SUPER_ADMIN"]}><SuperAdminLayout /></ProtectedRoute>}>
              <Route index element={<Overview />} />
              <Route path="sales" element={<><PageTitle title="Sales report" sub="Day-wise sales of food items and rooms" /><SalesTab /></>} />
              <Route path="kot" element={<KotPage />} />
              <Route path="menu" element={<><PageTitle title="Menu" sub="Add, edit, hide or delete the items customers see" /><MenuTab /></>} />
              <Route path="tables" element={<TablesPage />} />
              <Route path="reservation" element={<ReservationPage />} />
              <Route path="billing" element={<BillingPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="purchase" element={<PurchasePage />} />
              <Route path="staff" element={<StaffPage />} />
              <Route path="users" element={<><PageTitle title="Users" sub="Create logins for each department" /><UsersTab /></>} />
            </Route>
            {/* old address */}
            <Route path="/admin" element={<Navigate to="/super-admin" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
