function Navigation({ scrolled, activeSection, scrollToSection, mobileMenuOpen, setMobileMenuOpen }) {
  const sections = ['home', 'services', 'calculator', 'booking', 'admin', 'contact'];
  
  return (
    <nav className={`fixed top-0 w-full z-50 transition-all ${scrolled ? 'bg-white shadow-lg' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">💧</div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">GO HAM PRO</span>
          </div>
          
          <div className="hidden md:flex space-x-8">
            {sections.map(s => (
              <button key={s} onClick={() => scrollToSection(s)} className={`font-medium transition ${activeSection === s ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'}`}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100">
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
        
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t pb-2">
            {sections.map(s => (
              <button key={s} onClick={() => scrollToSection(s)} className="block w-full text-left px-4 py-3 hover:bg-blue-50 rounded">
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navigation;