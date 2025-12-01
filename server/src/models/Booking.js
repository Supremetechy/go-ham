// models/Booking.js
const mongoose = require('mongoose');

const bookingSchema =new mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    worker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Worker'
    },
    serviceType: {
        type: String,
        required: true, // e.g., "House", "Driveway", "Garden"
        enum: ['House', 'Driveway', 'Garden']
    },
    areaSize: {
        type: Number, // in square meters
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        default: 'pending',
        enum: ['pending', 'accepted', 'completed']
    }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
