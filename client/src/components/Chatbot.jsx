import React, { useState } from 'react';

function Chatbot({ open, onToggle }) {
  const [messages, setMessages] = useState([{ text: "Hi! How can I help with our services?", from: 'bot' }]);
  const [input, setInput] = useState('');

  const send = () => {
    if (!input.trim()) return;
    setMessages([...messages, { text: input, from: 'user' }]);
    const lower = input.toLowerCase();
    let reply = "I can help with our services, pricing, and booking. What would you like to know?";
    if (lower.includes('price') || lower.includes('cost')) reply = "Mobile Detailing starts at $89, Gutter Cleaning at $119, Residential at $299. Use our calculator for exact quotes!";
    if (lower.includes('book') || lower.includes('schedule')) reply = "Use our booking form above or call (720) 813-8057 to schedule!";
    if (lower.includes('mobile') || lower.includes('detail')) reply = "Our mobile detailing includes exterior & interior cleaning, starting at $89. Want to book?";
    if (lower.includes('gutter')) reply = "Professional gutter cleaning with inspection, starting at $119. Interested?";
    setTimeout(() => setMessages(m => [...m, { text: reply, from: 'bot' }]), 500);
    setInput('');
  };

  return (
    <>
      <button onClick={onToggle} className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform z-50">
        💬
      </button>
      {open && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl z-50">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-2xl flex justify-between items-center">
            <span className="font-semibold">GO HAM Assistant</span>
            <button onClick={onToggle} className="text-2xl">×</button>
          </div>
          <div className="h-96 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl ${m.from === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && send()} placeholder="Type message..." className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
            <button onClick={send} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Send</button>
          </div>
        </div>
      )}
    </>
  );
}

export default Chatbot;