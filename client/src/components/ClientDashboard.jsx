// client/src/components/ClientDashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Stripe from 'stripe';
import BookingCard from './BookingCard';
import BookingCalendar from './BookingCalendar';
//import { socket } from '../../../../backend/socket';


const ClientDashboard = () => {
    const userId = localStorage.getItem('userId'); // Assuming userId is obtained from auth or props
    const [bookings, setBookings] = useState([]);
    const [elements, setElements] = useState(null);

    useEffect(() => {
        getBookings();
        loadStripe();

        /*socket.on('bookingUpdated', (bookingData) => {
            const updatedBooking = bookings.find(b => b._id === bookingData.id);
            if (updatedBooking) {
                updatedBooking.status = bookingData.status;
                setBookings([...bookings]);
            }
        });*/
    }, []);
    
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://js.stripe.com/v3/';
        script.async = true;
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        };
    }, []);
    
    async function getBookings() {
        if (!userId) {
            console.error('User ID not found. Please log in.');
            return;
        }
        try {
            const response = await axios.get('/api/bookings/user/' + userId + '?type=client');
            setBookings(response.data);
        } catch (error) {
            console.error('Error fetching bookings:', error);
        }
    }

    // Frontend integration
    async function processPayment() {
        const stripe = Stripe(process.env.STRIPE_PUBLIC_KEY);
        
        const { error, paymentMethod } = await stripe.createPaymentMethod({
            type: 'card',
            card: elements.getElement('card')
        });
    
        if (error) {
            console.error('[Error]:', error);
            return;
        }
    }

    async function loadStripe() {
        const stripe = Stripe(process.env.STRIPE_PUBLIC_KEY);
        const { error, paymentMethod } = await stripe.createPaymentMethod({
            type: 'card',
            card: elements.getElement('card')
        });
    }

    return (
        <div className="mb-4 p-4 border rounded">
            <h2 className="text-2xl font-bold mb-4">Your Bookings</h2>
            <BookingCalendar />
            
            {/* Booking list */}
            {bookings.map(booking => (
                <BookingCard key={booking._id} booking={booking} />
            ))}

            <button 
                onClick={getBookings} 
                className="cta-button bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
                Load Bookings
            </button>
            {bookings.map(booking => (
                <div key={booking._id}>
                    <p>Worker: {booking.worker.name}</p>
                    <p>Status: {booking.status}</p>
                    <p>Service Type: {booking.serviceType}</p>
                    <p>Area Size: {booking.areaSize} m²</p>
                    <p>Price: ${booking.price}</p>
                </div>
            ))}

            
        </div>
    );
};

export default ClientDashboard;