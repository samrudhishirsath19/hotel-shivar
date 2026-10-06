import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";

import Navbar from "./components/Navbar";
import BookingModal from "./components/BookingModal";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import SectionGate from "./components/SectionGate";
import { CartProvider } from "./context/CartContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DEPARTMENTS, homeFor } from "./roles";

import Home from "./pages/Home";
import Rooms from "./pages/Rooms";
import Gallery from "./pages/Gallery";
import Restaurant from "./pages/Restaurant";
import Banquet from "./pages/Banquet";
import Offers from "./pages/Offers";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";

import SuperAdminLayout from "./pages/superadmin/SuperAdminLayout";
import Overview from "./pages/superadmin/Overview";
import KotPage from "./pages/superadmin/KotPage";
import TablesPage from "./pages/superadmin/TablesPage";
import ReservationPage from "./pages/superadmin/ReservationPage";
import BillingPage from "./pages/superadmin/BillingPage";
import InventoryPage from "./pages/superadmin/InventoryPage";
import PurchasePage from "./pages/superadmin/PurchasePage";
import StaffPage from "./pages/superadmin/StaffPage";
<<<<<<< Updated upstream
import MenuTab from "./pages/admin/MenuTab";
=======
import StockOverview from "./pages/superadmin/StockOverview";
import MenuPage from "./pages/superadmin/MenuPage";
>>>>>>> Stashed changes
import SalesTab from "./pages/admin/SalesTab";
import UsersTab from "./pages/admin/UsersTab";
import RoomsTab from "./pages/admin/RoomsTab";
import { PageTitle } from "./pages/superadmin/ui";

// Every department except the super admin
const STAFF_ROLES = DEPARTMENTS.map((d) => d.value).filter((v) => v !== "SUPER_ADMIN");

// Old /manager address: send each person to their own dashboard
function GoHome() {
  const { user } = useAuth();
  return <Navigate to={homeFor(user.role)} replace />;
}

// A page of the panel; SectionGate decides which departments may open it (same rules as the sidebar).
const gate = (id, page) => <SectionGate id={id}>{page}</SectionGate>;

// The panel pages. The super admin sees all of them under /super-admin; the other departments
// use /panel and only the pages that belong to their department.
const panelPages = (
  <>
    <Route index element={<Overview />} />
    <Route path="sales" element={gate("sales", <><PageTitle title="Sales report" sub="Day-wise sales of food items and rooms" /><SalesTab /></>)} />
    <Route path="kot" element={gate("kot", <KotPage />)} />
    <Route path="menu" element={gate("menu", <MenuPage />)} />
    <Route path="tables" element={gate("tables", <TablesPage />)} />
    <Route path="reservation" element={gate("reservation", <ReservationPage />)} />
    <Route path="rooms" element={gate("rooms", <><PageTitle title="Rooms" sub="Add rooms (with a photo from this device), edit or hide them" /><RoomsTab /></>)} />
    <Route path="billing" element={gate("billing", <BillingPage />)} />
    <Route path="inventory" element={gate("inventory", <InventoryPage />)} />
    <Route path="stock" element={gate("stock", <><PageTitle title="Inventory" sub="Stock in hand and purchases (view only)" /><StockOverview /></>)} />
    <Route path="purchase" element={gate("purchase", <PurchasePage />)} />
    <Route path="staff" element={gate("staff", <StaffPage />)} />
    <Route path="users" element={gate("users", <><PageTitle title="Users" sub="Create logins for each department" /><UsersTab /></>)} />
  </>
);

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

// The footer is shown only on these pages.
const FOOTER_PATHS = ["/", "/rooms", "/gallery", "/restaurant", "/banquet", "/offers", "/about"];

// The public website: navbar on top, booking window, page below.
function SiteLayout({ bookingOpen, setBookingOpen, selectedRoom, openBooking }) {
  const { pathname } = useLocation();
  const showFooter = FOOTER_PATHS.includes(pathname.replace(/\/+$/, "") || "/");
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onBookNow={() => openBooking()} />
      <main className="pt-16 flex-1">
        <Outlet />
      </main>
      {showFooter && <Footer />}
      <BookingModal isOpen={bookingOpen} onClose={() => setBookingOpen(false)} roomName={selectedRoom} />
    </div>
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
              {/* old address of the manager page */}
              <Route path="/manager" element={<ProtectedRoute><GoHome /></ProtectedRoute>} />
              <Route path="*" element={<div className="text-center pt-20">Page not found</div>} />
            </Route>

            {/* ---------- super admin panel: sidebar layout, super admin only ---------- */}
            <Route path="/super-admin" element={<ProtectedRoute roles={["SUPER_ADMIN"]}><SuperAdminLayout /></ProtectedRoute>}>
<<<<<<< Updated upstream
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
=======
              {panelPages}
            </Route>
            {/* ---------- every other department: the same panel with only its own pages ---------- */}
            <Route path="/panel" element={<ProtectedRoute roles={STAFF_ROLES}><SuperAdminLayout /></ProtectedRoute>}>
              {panelPages}
>>>>>>> Stashed changes
            </Route>
            {/* old address */}
            <Route path="/admin" element={<Navigate to="/super-admin" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
