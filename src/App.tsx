import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ListingDetails from './pages/ListingDetails';
import CreateListing from './pages/CreateListing';
import Profile from './pages/Profile';
import MyListings from './pages/MyListings';
import Favorites from './pages/Favorites';
import Messages from './pages/Messages';
import AdminDashboard from './pages/AdminDashboard';
import CategoryPage from './pages/CategoryPage';
import MapSearch from './pages/MapSearch';
import * as Static from './pages/StaticPages';

const AppContent = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium italic">Загрузка ВРуки...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Header />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/listing/:id" element={<ListingDetails />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/listings/new" element={<CreateListing />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/my-listings" element={<MyListings />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/admin/*" element={<AdminDashboard />} />
          <Route path="/map" element={<MapSearch />} />
          
          {/* Static Pages */}
          <Route path="/about" element={<Static.About />} />
          <Route path="/contacts" element={<Static.Contacts />} />
          <Route path="/rules" element={<Static.Rules />} />
          <Route path="/how-to-buy" element={<Static.HowToBuy />} />
          <Route path="/safety" element={<Static.Safety />} />
          <Route path="/help" element={<Static.Help />} />
          <Route path="/pro" element={<Static.Pro />} />
          <Route path="/tariffs" element={<Static.Tariffs />} />
          <Route path="/privacy" element={<Static.Privacy />} />
          <Route path="/terms" element={<Static.Terms />} />
          <Route path="/cookies" element={<Static.CookiesPolicy />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
