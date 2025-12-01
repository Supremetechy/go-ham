// Real-time Notifications System
// WebSockets, Push Notifications, and Live Dashboard Updates

class RealTimeNotificationSystem {
    constructor() {
        this.websocket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.subscriptions = new Map();
        this.pushManager = new PushNotificationManager();
        this.eventHandlers = new Map();
        
        this.initialize();
    }

    async initialize() {
        try {
            // Initialize WebSocket connection
            await this.connectWebSocket();
            
            // Initialize Push Notifications
            await this.pushManager.initialize();
            
            // Setup event listeners
            this.setupEventHandlers();
            
            console.log('🔄 Real-time notification system initialized');
        } catch (error) {
            console.error('Failed to initialize real-time notifications:', error);
            this.startPolling(); // Fallback to polling
        }
    }

    async connectWebSocket() {
        return new Promise((resolve, reject) => {
            try {
                // In production, this would be your WebSocket server URL
                const wsUrl = process.env.WS_URL || 'ws://localhost:8001';
                this.websocket = new WebSocket(wsUrl);

                this.websocket.onopen = () => {
                    console.log('🔌 WebSocket connected');
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    this.sendAuthentication();
                    resolve();
                };

                this.websocket.onmessage = (event) => {
                    this.handleWebSocketMessage(event);
                };

                this.websocket.onclose = () => {
                    console.log('🔌 WebSocket disconnected');
                    this.isConnected = false;
                    this.attemptReconnect();
                };

                this.websocket.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    reject(error);
                };

                // Timeout for connection
                setTimeout(() => {
                    if (!this.isConnected) {
                        reject(new Error('WebSocket connection timeout'));
                    }
                }, 5000);

            } catch (error) {
                reject(error);
            }
        });
    }

    sendAuthentication() {
        // Send authentication token for worker/admin identification
        const authData = {
            type: 'auth',
            token: localStorage.getItem('authToken') || 'demo-token',
            userType: this.getUserType(),
            userId: this.getUserId()
        };
        
        this.send(authData);
    }

    handleWebSocketMessage(event) {
        try {
            const message = JSON.parse(event.data);
            
            switch (message.type) {
                case 'booking_alert':
                    this.handleBookingAlert(message.data);
                    break;
                case 'worker_response':
                    this.handleWorkerResponse(message.data);
                    break;
                case 'booking_update':
                    this.handleBookingUpdate(message.data);
                    break;
                case 'system_notification':
                    this.handleSystemNotification(message.data);
                    break;
                case 'dashboard_update':
                    this.handleDashboardUpdate(message.data);
                    break;
                default:
                    console.log('Unknown message type:', message.type);
            }
        } catch (error) {
            console.error('Error handling WebSocket message:', error);
        }
    }

    handleBookingAlert(alertData) {
        // Real-time booking alert for workers
        if (this.getUserType() === 'worker') {
            this.showWorkerAlert(alertData);
            this.pushManager.sendPushNotification({
                title: `🔔 New ${alertData.serviceType} Booking`,
                body: `Customer: ${alertData.customerName} at ${alertData.time}`,
                icon: '/icons/booking-alert.png',
                badge: '/icons/badge.png',
                data: alertData,
                actions: [
                    { action: 'accept', title: 'Accept Job' },
                    { action: 'decline', title: 'Decline' }
                ]
            });
        }
        
        // Update admin dashboard
        if (this.getUserType() === 'admin') {
            this.updateAdminDashboard('new_booking', alertData);
        }
    }

    handleWorkerResponse(responseData) {
        if (this.getUserType() === 'admin') {
            this.showAdminNotification({
                type: responseData.accepted ? 'success' : 'warning',
                title: `Worker ${responseData.accepted ? 'Accepted' : 'Declined'} Job`,
                message: `${responseData.workerName} ${responseData.accepted ? 'accepted' : 'declined'} booking #${responseData.bookingId}`,
                timestamp: new Date().toISOString()
            });
            
            this.updateBookingStatus(responseData.bookingId, responseData.accepted ? 'assigned' : 'unassigned');
        }
    }

    handleBookingUpdate(updateData) {
        // Update all relevant dashboards
        this.triggerEvent('booking_updated', updateData);
        
        if (this.getUserType() === 'admin') {
            this.updateAdminDashboard('booking_update', updateData);
        }
    }

    handleSystemNotification(notificationData) {
        this.showSystemNotification(notificationData);
        
        // Send push notification for critical alerts
        if (notificationData.priority === 'critical') {
            this.pushManager.sendPushNotification({
                title: '🚨 System Alert',
                body: notificationData.message,
                icon: '/icons/alert.png',
                requireInteraction: true
            });
        }
    }

    handleDashboardUpdate(updateData) {
        // Real-time dashboard updates
        this.triggerEvent('dashboard_update', updateData);
        this.updateLiveDashboard(updateData);
    }

    showWorkerAlert(alertData) {
        // Create floating worker alert
        const alertElement = document.createElement('div');
        alertElement.className = 'worker-alert floating';
        alertElement.innerHTML = `
            <div class="alert-header">
                <h3>🔔 New Job Alert!</h3>
                <div class="countdown" id="countdown-${alertData.bookingId}">15:00</div>
            </div>
            <div class="alert-body">
                <div class="service-info">
                    <h4>${alertData.serviceType}</h4>
                    <p><strong>Customer:</strong> ${alertData.customerName}</p>
                    <p><strong>Time:</strong> ${alertData.date} at ${alertData.time}</p>
                    <p><strong>Location:</strong> ${alertData.address}</p>
                    <p><strong>Phone:</strong> <a href="tel:${alertData.customerPhone}">${alertData.customerPhone}</a></p>
                </div>
                
                ${alertData.instructions ? `
                    <div class="instructions">
                        <strong>Instructions:</strong> ${alertData.instructions}
                    </div>
                ` : ''}
                
                <div class="alert-actions">
                    <button class="btn btn-accept" onclick="acceptJob('${alertData.bookingId}')">
                        ✅ Accept Job
                    </button>
                    <button class="btn btn-decline" onclick="declineJob('${alertData.bookingId}')">
                        ❌ Decline
                    </button>
                    <button class="btn btn-call" onclick="window.open('tel:${alertData.customerPhone}')">
                        📞 Call Customer
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(alertElement);
        
        // Start countdown timer
        this.startAlertCountdown(alertData.bookingId, 15 * 60); // 15 minutes
        
        // Auto-remove after response time
        setTimeout(() => {
            if (alertElement.parentNode) {
                alertElement.remove();
            }
        }, 15 * 60 * 1000);
    }

    startAlertCountdown(bookingId, seconds) {
        const countdownElement = document.getElementById(`countdown-${bookingId}`);
        if (!countdownElement) return;
        
        const countdown = setInterval(() => {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            
            countdownElement.textContent = 
                `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
            
            if (seconds <= 60) {
                countdownElement.style.color = '#ef4444'; // Red for last minute
            }
            
            if (seconds <= 0) {
                clearInterval(countdown);
                countdownElement.textContent = 'Expired';
                this.expireAlert(bookingId);
            }
            
            seconds--;
        }, 1000);
    }

    acceptJob(bookingId) {
        this.send({
            type: 'worker_response',
            bookingId: bookingId,
            accepted: true,
            workerId: this.getUserId(),
            timestamp: new Date().toISOString()
        });
        
        this.removeAlert(bookingId);
        this.showSuccessMessage('Job accepted! Customer will be notified.');
    }

    declineJob(bookingId) {
        this.send({
            type: 'worker_response',
            bookingId: bookingId,
            accepted: false,
            workerId: this.getUserId(),
            timestamp: new Date().toISOString()
        });
        
        this.removeAlert(bookingId);
        this.showInfoMessage('Job declined. Other workers will be notified.');
    }

    removeAlert(bookingId) {
        const alerts = document.querySelectorAll('.worker-alert');
        alerts.forEach(alert => {
            if (alert.innerHTML.includes(bookingId)) {
                alert.remove();
            }
        });
    }

    updateAdminDashboard(updateType, data) {
        // Update dashboard counters and lists
        switch (updateType) {
            case 'new_booking':
                this.incrementCounter('totalBookings');
                this.addToRecentActivity({
                    type: 'booking',
                    message: `New ${data.serviceType} booking from ${data.customerName}`,
                    timestamp: new Date().toISOString()
                });
                break;
                
            case 'worker_response':
                this.addToRecentActivity({
                    type: data.accepted ? 'accept' : 'decline',
                    message: `${data.workerName} ${data.accepted ? 'accepted' : 'declined'} booking #${data.bookingId}`,
                    timestamp: new Date().toISOString()
                });
                break;
                
            case 'booking_update':
                this.updateBookingInList(data);
                break;

            default:
                console.log('Unknown admin dashboard update type:', updateType);
        }
    }

    updateLiveDashboard(updateData) {
        // Real-time dashboard updates
        if (updateData.metrics) {
            Object.entries(updateData.metrics).forEach(([metric, value]) => {
                const element = document.getElementById(metric);
                if (element) {
                    element.textContent = value;
                    element.classList.add('updated');
                    setTimeout(() => element.classList.remove('updated'), 1000);
                }
            });
        }
        
        if (updateData.charts) {
            this.updateDashboardCharts(updateData.charts);
        }
    }

    send(data) {
        if (this.isConnected && this.websocket) {
            this.websocket.send(JSON.stringify(data));
        } else {
            console.warn('WebSocket not connected, queuing message');
            // Queue message for when connection is restored
        }
    }

    subscribe(channel, callback) {
        if (!this.subscriptions.has(channel)) {
            this.subscriptions.set(channel, new Set());
        }
        this.subscriptions.get(channel).add(callback);
        
        // Subscribe to channel on server
        this.send({
            type: 'subscribe',
            channel: channel
        });
    }

    unsubscribe(channel, callback) {
        if (this.subscriptions.has(channel)) {
            this.subscriptions.get(channel).delete(callback);
        }
    }

    triggerEvent(eventName, data) {
        if (this.eventHandlers.has(eventName)) {
            this.eventHandlers.get(eventName).forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Error in event handler for ${eventName}:`, error);
                }
            });
        }
    }

    addEventListener(eventName, handler) {
        if (!this.eventHandlers.has(eventName)) {
            this.eventHandlers.set(eventName, new Set());
        }
        this.eventHandlers.get(eventName).add(handler);
    }

    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            
            setTimeout(() => {
                this.connectWebSocket().catch(() => {
                    // Reconnection failed, will try again
                });
            }, this.reconnectDelay * this.reconnectAttempts);
        } else {
            console.log('Max reconnection attempts reached, falling back to polling');
            this.startPolling();
        }
    }

    startPolling() {
        // Fallback polling when WebSocket is not available
        setInterval(async () => {
            try {
                const response = await fetch('/api/notifications/poll', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    }
                });
                
                if (response.ok) {
                    const text = await response.text();
                    if (text) {
                        try {
                            const notifications = JSON.parse(text);
                            if (Array.isArray(notifications)) {
                                notifications.forEach(notification => {
                                    this.handlePolledNotification(notification);
                                });
                            }
                        } catch (jsonError) {
                            console.error('Failed to parse notifications JSON:', jsonError, 'Response:', text);
                        }
                    }
                } else {
                    console.warn(`Polling failed with status ${response.status}`);
                }
            } catch (error) {
                console.error('Polling error:', error);
            }
        }, 5000); // Poll every 5 seconds
    }

    setupEventHandlers() {
        // Setup global event handlers
        window.acceptJob = (bookingId) => this.acceptJob(bookingId);
        window.declineJob = (bookingId) => this.declineJob(bookingId);
        
        // Handle browser visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && !this.isConnected) {
                this.connectWebSocket();
            }
        });
        
        // Handle online/offline events
        window.addEventListener('online', () => {
            if (!this.isConnected) {
                this.connectWebSocket();
            }
        });
    }

    getUserType() {
        return localStorage.getItem('userType') || 'admin';
    }

    getUserId() {
        return localStorage.getItem('userId') || 'demo-user';
    }

    showSuccessMessage(message) {
        this.showNotification(message, 'success');
    }

    showInfoMessage(message) {
        this.showNotification(message, 'info');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type} realtime`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

class PushNotificationManager {
    constructor() {
        this.isSupported = 'Notification' in window && 'serviceWorker' in navigator;
        this.permission = null;
        this.registration = null;
    }

    async initialize() {
        if (!this.isSupported) {
            console.warn('Push notifications not supported');
            return false;
        }

        try {
            // Register service worker
            this.registration = await navigator.serviceWorker.register('/sw.js');
            
            // Request notification permission
            await this.requestPermission();
            
            // Subscribe to push notifications
            if (this.permission === 'granted') {
                await this.subscribeToPush();
            }
            
            console.log('📱 Push notifications initialized');
            return true;
        } catch (error) {
            console.error('Push notification initialization failed:', error);
            return false;
        }
    }

    async requestPermission() {
        if (this.permission) {
            return this.permission;
        }

        this.permission = await Notification.requestPermission();
        
        if (this.permission === 'granted') {
            console.log('✅ Notification permission granted');
        } else {
            console.warn('❌ Notification permission denied');
        }
        
        return this.permission;
    }

    async subscribeToPush() {
        try {
            const subscription = await this.registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(
                    process.env.VAPID_PUBLIC_KEY || 'demo-vapid-key'
                )
            });

            // Send subscription to server
            await this.sendSubscriptionToServer(subscription);
            
            console.log('📱 Push subscription created');
            return subscription;
        } catch (error) {
            console.error('Push subscription failed:', error);
            throw error;
        }
    }

    async sendSubscriptionToServer(subscription) {
        try {
            await fetch('/api/push-subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({
                    subscription: subscription,
                    userType: localStorage.getItem('userType'),
                    userId: localStorage.getItem('userId')
                })
            });
        } catch (error) {
            console.error('Failed to send subscription to server:', error);
        }
    }

    async sendPushNotification(notificationData) {
        if (this.permission !== 'granted') {
            console.warn('Cannot send push notification: permission not granted');
            return;
        }

        try {
            // Show local notification immediately
            const notification = new Notification(notificationData.title, {
                body: notificationData.body,
                icon: notificationData.icon || '/icons/default.png',
                badge: notificationData.badge || '/icons/badge.png',
                data: notificationData.data,
                requireInteraction: notificationData.requireInteraction || false,
                actions: notificationData.actions || []
            });

            // Handle notification clicks
            notification.onclick = (event) => {
                event.preventDefault();
                window.focus();
                
                if (notificationData.data && notificationData.data.bookingId) {
                    // Navigate to booking details
                    window.location.hash = `#booking/${notificationData.data.bookingId}`;
                }
                
                notification.close();
            };

            // Auto-close after delay
            setTimeout(() => {
                notification.close();
            }, 10000);

        } catch (error) {
            console.error('Failed to show notification:', error);
        }
    }

    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }

        return outputArray;
    }
}

class LiveDashboard {
    constructor() {
        this.charts = new Map();
        this.metrics = new Map();
        this.updateInterval = 30000; // 30 seconds
        this.isActive = false;
    }

    initialize() {
        this.setupDashboardElements();
        this.startLiveUpdates();
        this.isActive = true;
        
        console.log('📊 Live dashboard initialized');
    }

    setupDashboardElements() {
        // Add live indicators to dashboard elements
        document.querySelectorAll('[data-live-metric]').forEach(element => {
            const metric = element.dataset.liveMetric;
            this.metrics.set(metric, element);
            
            // Add live indicator
            const indicator = document.createElement('span');
            indicator.className = 'live-indicator';
            indicator.innerHTML = '🔴'; // Red dot for live
            element.appendChild(indicator);
        });
    }

    updateMetric(metricName, value, trend = null) {
        const element = this.metrics.get(metricName);
        if (element) {
            // Animate value change
            element.classList.add('updating');
            
            setTimeout(() => {
                element.textContent = value;
                element.classList.remove('updating');
                element.classList.add('updated');
                
                // Add trend indicator
                if (trend !== null) {
                    this.addTrendIndicator(element, trend);
                }
                
                setTimeout(() => {
                    element.classList.remove('updated');
                }, 1000);
            }, 200);
        }
    }

    addTrendIndicator(element, trend) {
        let existing = element.querySelector('.trend-indicator');
        if (existing) {
            existing.remove();
        }
        
        const indicator = document.createElement('span');
        indicator.className = 'trend-indicator';
        
        if (trend > 0) {
            indicator.innerHTML = '📈';
            indicator.style.color = '#10b981';
        } else if (trend < 0) {
            indicator.innerHTML = '📉';
            indicator.style.color = '#ef4444';
        } else {
            indicator.innerHTML = '➡️';
            indicator.style.color = '#6b7280';
        }
        
        element.appendChild(indicator);
    }

    startLiveUpdates() {
        setInterval(() => {
            if (this.isActive && !document.hidden) {
                this.fetchLiveData();
            }
        }, this.updateInterval);
    }

    async fetchLiveData() {
        try {
            const response = await fetch('/api/live-metrics', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.updateDashboard(data);
            }
        } catch (error) {
            console.error('Failed to fetch live data:', error);
        }
    }

    updateDashboard(data) {
        // Update all metrics
        Object.entries(data.metrics || {}).forEach(([metric, value]) => {
            this.updateMetric(metric, value, data.trends?.[metric]);
        });
        
        // Update charts if present
        if (data.charts) {
            this.updateCharts(data.charts);
        }
        
        // Update activity feed
        if (data.recentActivity) {
            this.updateActivityFeed(data.recentActivity);
        }
    }

    updateCharts(chartData) {
        Object.entries(chartData).forEach(([chartId, data]) => {
            const chart = this.charts.get(chartId);
            if (chart) {
                chart.update(data);
            }
        });
    }

    updateActivityFeed(activities) {
        const feedElement = document.getElementById('activity-feed');
        if (!feedElement) return;
        
        activities.forEach(activity => {
            const activityElement = document.createElement('div');
            activityElement.className = 'activity-item new';
            activityElement.innerHTML = `
                <div class="activity-icon">${this.getActivityIcon(activity.type)}</div>
                <div class="activity-content">
                    <div class="activity-message">${activity.message}</div>
                    <div class="activity-time">${this.formatTime(activity.timestamp)}</div>
                </div>
            `;
            
            feedElement.insertBefore(activityElement, feedElement.firstChild);
            
            // Remove the 'new' class after animation
            setTimeout(() => {
                activityElement.classList.remove('new');
            }, 1000);
        });
        
        // Keep only last 10 activities
        const items = feedElement.querySelectorAll('.activity-item');
        if (items.length > 10) {
            Array.from(items).slice(10).forEach(item => item.remove());
        }
    }

    getActivityIcon(type) {
        const icons = {
            'booking': '📋',
            'accept': '✅',
            'decline': '❌',
            'complete': '✅',
            'payment': '💰',
            'alert': '🚨'
        };
        
        return icons[type] || '📌';
    }

    formatTime(timestamp) {
        return new Date(timestamp).toLocaleTimeString();
    }

    pause() {
        this.isActive = false;
    }

    resume() {
        this.isActive = true;
    }
}

// Export classes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        RealTimeNotificationSystem, 
        PushNotificationManager, 
        LiveDashboard 
    };
} else {
    window.RealTimeNotificationSystem = RealTimeNotificationSystem;
    window.PushNotificationManager = PushNotificationManager;
    window.LiveDashboard = LiveDashboard;
}