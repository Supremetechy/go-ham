// client/src/components/WorkerDashboard.js
import React, { useState } from 'react';
import axios from 'axios';

const WorkerDashboard = () => {
    const userId = localStorage.getItem('userId'); // Assuming userId is obtained from auth or props
    const [bookings, setBookings] = useState([]);
    const acceptBooking = async (bookingId) => {
        try {
            await axios.post(`/api/bookings/${bookingId}/accept`);
            // Update bookings state or refetch bookings
            getPendingBookings();
        } catch (error) {
            console.error('Error accepting booking:', error);
        }
    };

    const rejectBooking = async (bookingId) => {
        try {
            await axios.post(`/api/bookings/${bookingId}/reject`);
            // Update bookings state or refetch bookings
            getPendingBookings();
        } catch (error) {
            console.error('Error rejecting booking:', error);
        }
    };

    async function getPendingBookings() {
        try {
            const response = await axios.get('/api/bookings/user/' + userId + '?type=worker');
            setBookings(response.data);
        } catch (error) {
            console.error('Error fetching bookings:', error);
        }
    }

    return (
        <div>
            <h2>Pending Bookings</h2>
            {bookings.map(booking => (
                <div key={booking._id}>
                    <p>Client: {booking.client.name}</p>
                    <button onClick={() => acceptBooking(booking._id)}>Accept</button>
                    <button onClick={() => rejectBooking(booking._id)}>Reject</button>
                </div>
            ))}
        </div>
    );
};

export default WorkerDashboard;