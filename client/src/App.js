import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import HeroSection from './components/HeroSection';
import BookingSection from './components/BookingSection';
import Chatbot from './components/Chatbot';
import ServicesSection from './components/ServiceSection';
import PriceCalculator from './components/PriceCalculator';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';


import './global.css';

// Import enterprise integration system
import './enterprise-integration.js';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  const [activeSection, setActiveSection] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Initialize enterprise system if not already done
  useEffect(() => {
    const initializeEnterprise = async () => {
      if (!window.enterpriseSystem && window.initializeEnterpriseSystem) {
        try {
          await window.initializeEnterpriseSystem();
          console.log('Enterprise system initialized in React app');
        } catch (error) {
          console.error('Failed to initialize enterprise system in React app:', error);
        }
      }
    };

    // Small delay to ensure scripts are loaded
    setTimeout(initializeEnterprise, 100);
  }, []);

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setActiveSection(id);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Navigation scrolled={scrolled} activeSection={activeSection} scrollToSection={scrollToSection} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
      <HeroSection scrollToSection={scrollToSection} />
      <ServicesSection scrollToSection={scrollToSection} />
      <PriceCalculator />
      <BookingSection />
      <ContactSection />
      <AdminDashboard  />
      <Chatbot open={chatOpen} onToggle={() => setChatOpen(!chatOpen)} />
      <Footer />
    </div>
  );
}

