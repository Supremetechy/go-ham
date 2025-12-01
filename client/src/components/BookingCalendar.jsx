import React from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios';

const BookingCalendar = ({ userId, userType }) => {
    const fetchBookings = async (info, successCallback, failureCallback) => {
        try {
            const response = await axios.get(`/api/bookings/user/${userId}?type=${userType}`);
            const events = response.data.map(booking => ({
                title: `${booking.serviceType} - $${booking.price}`,
                start: booking.date,
                end: booking.endDate,
                extendedProps: {
                    status: booking.status,
                    areaSize: booking.areaSize,
                },
            }));
            successCallback(events);
        } catch (error) {
            console.error('Error fetching bookings:', error);
            failureCallback(error);
        }
    };

    return (
        <FullCalendar
            plugins={[timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            events={fetchBookings}
            headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'timeGridWeek,timeGridDay',
            }}
            height="auto"
        />
    );
};

export default BookingCalendar;