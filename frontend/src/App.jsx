import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ErrorBoundary from './components/ErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import ProfilePrompt from './components/ProfilePrompt'

import Home from './pages/Home'
import Stay from './pages/Stay'
import RoomDetail from './pages/RoomDetail'
import Experiences from './pages/Experiences'
import Cafe from './pages/Cafe'
import Gallery from './pages/Gallery'
import Journal from './pages/Journal'
import JournalDetail from './pages/JournalDetail'
import About from './pages/About'
import Contact from './pages/Contact'
import MyBookings from './pages/MyBookings'
import Checkout from './pages/Checkout'
import AdminLayout from './pages/AdminLayout'
import Admin from './pages/Admin'
import AdminToday from './pages/AdminToday'
import AdminBookingDetail from './pages/AdminBookingDetail'
import AdminTripDetail from './pages/AdminTripDetail'
import AdminMessages from './pages/AdminMessages'
import AdminSubscribers from './pages/AdminSubscribers'
import CompleteProfile from './pages/CompleteProfile'
import Invoice from './pages/Invoice'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <ProfilePrompt />
      <main className="flex-1">
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/stay" element={<Stay />} />
            <Route path="/stay/:id" element={<RoomDetail />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/experiences" element={<Experiences />} />
            <Route path="/cafe" element={<Cafe />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/journal/:slug" element={<JournalDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route
              path="/my-bookings"
              element={
                <ProtectedRoute>
                  <MyBookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/complete-profile"
              element={
                <ProtectedRoute>
                  <CompleteProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoice/booking/:id"
              element={
                <ProtectedRoute>
                  <Invoice />
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoice/trip/:groupId"
              element={
                <ProtectedRoute>
                  <Invoice />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<Admin />} />
              <Route path="today" element={<AdminToday />} />
              <Route path="messages" element={<AdminMessages />} />
              <Route path="subscribers" element={<AdminSubscribers />} />
            </Route>
            <Route
              path="/admin/bookings/:id"
              element={
                <AdminRoute>
                  <AdminBookingDetail />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/trips/:groupId"
              element={
                <AdminRoute>
                  <AdminTripDetail />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/invoice/booking/:id"
              element={
                <AdminRoute>
                  <Invoice admin />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/invoice/trip/:groupId"
              element={
                <AdminRoute>
                  <Invoice admin />
                </AdminRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  )
}
