function HeroSection({ scrollToSection }) {
  return (
    <section id="home" className="pt-32 pb-20 px-4 text-center">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Professional Pressure Washing Services
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Transform your property with our expert high-pressure cleaning solutions
        </p>
        <button onClick={() => scrollToSection('calculator')} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-xl transform hover:-translate-y-1 transition-all">
          Get A Quote
        </button>
      </div>
    </section>
  );
}

export default HeroSection