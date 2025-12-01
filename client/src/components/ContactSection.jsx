function ContactSection() {
  return (
    <section id="contact" className="py-20 px-4 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl font-bold mb-12">Contact Us</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <div className="text-4xl mb-4">📧</div>
            <h3 className="font-semibold mb-2">Email</h3>
            <a href="mailto:dwayne@go-ham.com" className="text-blue-600">dwayne@go-ham.com</a>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <div className="text-4xl mb-4">📞</div>
            <h3 className="font-semibold mb-2">Phone</h3>
            <a href="tel:7208138057" className="text-blue-600">(720) 813-8057</a>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <div className="text-4xl mb-4">📍</div>
            <h3 className="font-semibold mb-2">Address</h3>
            <p className="text-gray-600 text-sm">24241 E Mexico Ave<br/>Aurora, CO 80018</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContactSection;