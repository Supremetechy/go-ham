function ServicesSection({ scrollToSection }) {
  const services = [
    { icon: '🚗', title: 'Mobile Detailing', desc: 'Professional mobile vehicle detailing at your location.', price: '$89+' },
    { icon: '🏠', title: 'Gutter Cleaning', desc: 'Thorough cleaning to protect from water damage.', price: '$119+' },
    { icon: '🏡', title: 'Residential Washing', desc: 'Complete exterior cleaning including driveways.', price: '$299+' },
    { icon: '🏢', title: 'Commercial Cleaning', desc: 'Large-scale pressure washing for businesses.', price: 'Custom' }
  ];

  return (
    <section id="services" className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12">Our Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((s, i) => (
            <div key={i} onClick={() => scrollToSection('calculator')} className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-2xl cursor-pointer hover:shadow-xl transform hover:-translate-y-2 transition-all">
              <div className="text-5xl mb-4">{s.icon}</div>
              <h3 className="text-xl font-bold mb-2">{s.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{s.desc}</p>
              <div className="text-blue-600 font-semibold">Starting at {s.price}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
export default ServicesSection;
