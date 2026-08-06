import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ErrorBoundary from './components/ErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'

import Home from './pages/Home'
import Stay from './pages/Stay'
import Experiences from './pages/Experiences'
import Cafe from './pages/Cafe'
import Gallery from './pages/Gallery'
import Journal from './pages/Journal'
import About from './pages/About'
import Contact from './pages/Contact'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/stay" element={<Stay />} />
            <Route path="/experiences" element={<Experiences />} />
            <Route path="/cafe" element={<Cafe />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            {/* Example of a session-gated route, per the auth architecture */}
            <Route
              path="/my-bookings"
              element={
                <ProtectedRoute>
                  <div className="max-w-3xl mx-auto px-6 py-20">
                    <h1 className="font-serif text-3xl">Your bookings</h1>
                  </div>
                </ProtectedRoute>
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
