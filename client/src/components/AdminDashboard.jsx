import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Search, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { bookingsAPI, workersAPI, clientsAPI } from '../api';
import { setDemoAuthToken, hasAuthToken, clearAuthToken, getAuthToken } from '../utils/auth';
import auth from '../utils/auth';

export default function AdminDashboard() {
  // Core State
  const [workers, setWorkers] = useState([]);
  const [clients, setClients] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [alertLogs, setAlertLogs] = useState([]);
  const [campaigns, setCampaigns] = useState([
    { id: 1, name: 'Summer Special 20% Off', type: 'discount', status: 'active', sent: 45, opened: 32, created: '2025-11-15' },
    { id: 2, name: 'Birthday Wishes', type: 'birthday', status: 'active', sent: 12, opened: 10, created: '2025-11-01' }
  ]);
  const [coupons, setCoupons] = useState([
    { id: 1, code: 'SUMMER20', discount: 20, type: 'percentage', expiryDate: '2025-12-31', usageLimit: 100, usageCount: 23, isActive: true },
    { id: 2, code: 'WELCOME15', discount: 15, type: 'percentage', expiryDate: '2026-01-31', usageLimit: 50, usageCount: 8, isActive: true },
    { id: 3, code: 'BDAY25', discount: 25, type: 'fixed', expiryDate: '2025-12-31', usageLimit: null, usageCount: 5, isActive: true }
  ]);

  // UI State
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'worker', 'client', 'booking'
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [editingItem, setEditingItem] = useState(null);
  const [marketingModalOpen, setMarketingModalOpen] = useState(false);
  const [marketingAction, setMarketingAction] = useState(''); // 'email', 'coupon', 'birthday', 'campaign'
  const [selectedClients, setSelectedClients] = useState([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingItemType, setDeletingItemType] = useState('');
  const [deletingItemId, setDeletingItemId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});

  // Available services and zones
  const availableServices = [
    'House Washing',
    'Mobile Detailing',
    'Gutter Cleaning',
    'Commercial Washing',
    'Pressure Washing',
    'Window Cleaning',
    'Deck Cleaning'
  ];

  const availableZones = ['North', 'South', 'East', 'West'];

  // Statistics
  const stats = {
    totalBookings: bookings.length,
    pendingBookings: bookings.filter(b => b.status === 'pending').length,
    activeWorkers: workers.filter(w => w.isActive).length,
    totalClients: clients.length,
    alertsSent: alertLogs.length,
    responseRate: Math.round(85 + Math.random() * 14)
  };

  // Load data from API on mount
  useEffect(() => {
    // Set demo auth token if none exists
    if (!hasAuthToken()) {
     setDemoAuthToken();
    }
    loadAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load all data in parallel
      const [bookingsRes, workersRes, clientsRes] = await Promise.all([
        bookingsAPI.getAll(),
        workersAPI.getAll(),
        clientsAPI.getAll()
      ]);
      
      setBookings(bookingsRes.data);
      setWorkers(workersRes.data);
      setClients(clientsRes.data);
      
      console.log('✅ Data loaded from API:', {
        bookings: bookingsRes.data.length,
        workers: workersRes.data.length,
        clients: clientsRes.data.length
      });
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load data from server. Using offline mode.');
      showNotification('⚠️ Could not connect to server. Some features may be limited.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Notification Helper
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Validation Functions
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone) => {
    const re = /^\+?1?\d{10,15}$/;
    return re.test(phone.replace(/[\s-()]/g, ''));
  };

  const validateWorkerForm = (data) => {
    const errors = {};
    
    if (!data.name || data.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    
    if (!data.email || !validateEmail(data.email)) {
      errors.email = 'Valid email is required';
    }
    
    if (!data.phone || !validatePhone(data.phone)) {
      errors.phone = 'Valid phone number is required (10-15 digits)';
    }
    
    if (!data.zone) {
      errors.zone = 'Zone is required';
    }
    
    if (!data.services || data.services.length === 0) {
      errors.services = 'At least one service is required';
    }
    
    return errors;
  };

  const validateClientForm = (data) => {
    const errors = {};
    
    if (!data.name || data.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    
    if (!data.email || !validateEmail(data.email)) {
      errors.email = 'Valid email is required';
    }
    
    if (!data.phone || !validatePhone(data.phone)) {
      errors.phone = 'Valid phone number is required';
    }
    
    if (!data.address || data.address.trim().length < 5) {
      errors.address = 'Address must be at least 5 characters';
    }

    if (data.birthday && new Date(data.birthday) > new Date()) {
      errors.birthday = 'Birthday cannot be in the future';
    }
    
    return errors;
  };

  const validateBookingForm = (data) => {
    const errors = {};
    
    if (!data.clientId) {
      errors.clientId = 'Client is required';
    }
    
    if (!data.serviceType) {
      errors.serviceType = 'Service type is required';
    }
    
    if (!data.date) {
      errors.date = 'Date is required';
    } else {
      const bookingDate = new Date(data.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (bookingDate < today) {
        errors.date = 'Date cannot be in the past';
      }
    }
    
    if (!data.time) {
      errors.time = 'Time is required';
    }
    
    if (!data.address || data.address.trim().length < 5) {
      errors.address = 'Address is required';
    }
    
    return errors;
  };

  // CRUD Operations - Workers
  const addWorker = async (workerData) => {
    const errors = validateWorkerForm(workerData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return false;
    }

    try {
      const response = await workersAPI.create(workerData);
      setWorkers([...workers, response.data]);
      showNotification('✅ Worker added successfully!');
      return true;
    } catch (error) {
      console.error('Failed to add worker:', error);
      showNotification('❌ Failed to add worker', 'error');
      return false;
    }
  };

  const updateWorker = async (id, workerData) => {
    const errors = validateWorkerForm(workerData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return false;
    }

    try {
      const response = await workersAPI.update(id, workerData);
      setWorkers(workers.map(w => w.id === id ? response.data : w));
      showNotification('✅ Worker updated successfully!');
      return true;
    } catch (error) {
      console.error('Failed to update worker:', error);
      showNotification('❌ Failed to update worker', 'error');
      return false;
    }
  };

  const deleteWorker = async (id) => {
    if (window.confirm('Are you sure you want to delete this worker?')) {
      try {
        await workersAPI.delete(id);
        setWorkers(workers.filter(w => w.id !== id));
        showNotification('🗑️ Worker deleted successfully!');
      } catch (error) {
        console.error('Failed to delete worker:', error);
        showNotification('❌ Failed to delete worker', 'error');
      }
    }
  };

  const toggleWorkerStatus = async (id) => {
    try {
      const response = await workersAPI.toggleStatus(id);
      setWorkers(workers.map(w => w.id === id ? response.data : w));
      showNotification('✅ Worker status updated!');
    } catch (error) {
      console.error('Failed to toggle worker status:', error);
      showNotification('❌ Failed to update worker status', 'error');
    }
  };

  // CRUD Operations - Clients
  const addClient = async (clientData) => {
    const errors = validateClientForm(clientData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return false;
    }

    try {
      const response = await clientsAPI.create(clientData);
      setClients([...clients, response.data]);
      showNotification('✅ Client added successfully!');
      return true;
    } catch (error) {
      console.error('Failed to add client:', error);
      showNotification('❌ Failed to add client', 'error');
      return false;
    }
  };

  const updateClient = async (id, clientData) => {
    const errors = validateClientForm(clientData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return false;
    }

    try {
      const response = await clientsAPI.update(id, clientData);
      setClients(clients.map(c => c.id === id ? response.data : c));
      showNotification('✅ Client updated successfully!');
      return true;
    } catch (error) {
      console.error('Failed to update client:', error);
      showNotification('❌ Failed to update client', 'error');
      return false;
    }
  };

  const deleteClient = async (id) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        await clientsAPI.delete(id);
        setClients(clients.filter(c => c.id !== id));
        showNotification('🗑️ Client deleted successfully!');
      } catch (error) {
        console.error('Failed to delete client:', error);
        showNotification('❌ Failed to delete client', 'error');
      }
    }
  };

  // Marketing Functions
  const sendEmail = (clientIds, subject, message, template = 'general') => {
    const recipients = clients.filter(c => clientIds.includes(c.id));
    
    // Simulate email sending
    setTimeout(() => {
      const log = {
        type: 'email',
        subject,
        recipients: recipients.length,
        template,
        timestamp: new Date().toISOString(),
        status: 'sent'
      };
      
      showNotification(`✅ Email sent to ${recipients.length} client(s)!`);
      console.log('Email sent:', log, 'Recipients:', recipients);
    }, 500);
  };

  const sendBirthdayCards = () => {
    const today = new Date();
    const birthdayClients = clients.filter(client => {
      if (!client.birthday) return false;
      const bday = new Date(client.birthday);
      return bday.getMonth() === today.getMonth() && bday.getDate() === today.getDate();
    });

    if (birthdayClients.length === 0) {
      showNotification('ℹ️ No birthdays today!', 'info');
      return;
    }

    sendEmail(
      birthdayClients.map(c => c.id),
      '🎂 Happy Birthday!',
      'Wishing you a wonderful birthday! Enjoy 25% off your next service!',
      'birthday'
    );
  };

  const toggleCoupon = (id) => {
    setCoupons(coupons.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c));
    showNotification('✅ Coupon status updated!');
  };

  const sendCouponToClients = (couponId, clientIds) => {
    const coupon = coupons.find(c => c.id === couponId);
    
    sendEmail(
      clientIds,
      `Special Offer: ${coupon.code}`,
      `Use code ${coupon.code} for ${coupon.type === 'percentage' ? coupon.discount + '%' : '$' + coupon.discount} off your next service!`,
      'coupon'
    );
  };

  const createCoupon = (couponData) => {
    const newCoupon = {
      ...couponData,
      id: Math.max(0, ...coupons.map(c => c.id)) + 1,
      usageCount: 0,
      isActive: true,
      created: new Date().toISOString(),
      status: 'active'
    };
    setCoupons([...coupons, newCoupon]);
    showNotification('✅ Coupon created successfully!');
  };

  const sendMarketingCampaign = (campaignData) => {
    const newCampaign = {
      ...campaignData,
      id: Math.max(0, ...campaigns.map(c => c.id)) + 1,
      sent: campaignData.recipients.length,
      opened: 0,
      created: new Date().toISOString(),
      status: 'active'
    };
    
    setCampaigns([...campaigns, newCampaign]);
    sendEmail(campaignData.recipients, campaignData.subject, campaignData.message, 'campaign');
  };

  // Async version for API calls (available for future use)
  // eslint-disable-next-line no-unused-vars
  const segmentClients = async (segmentType) => {
    try {
      // Try to use API first
      const response = await clientsAPI.segment(segmentType);
      return response.data;
    } catch (error) {
      // Fallback to local filtering
      console.log('Using local client segmentation');
      switch(segmentType) {
        case 'vip':
          return clients.filter(c => c.totalSpent > 300);
        case 'new':
          return clients.filter(c => c.tags?.includes('New Customer'));
        case 'inactive':
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
          return clients.filter(c => new Date(c.lastService) < threeMonthsAgo);
        case 'all':
        default:
          return clients;
      }
    }
  };

  // Sync version for immediate UI needs
  const segmentClientsSync = (segmentType) => {
    switch(segmentType) {
      case 'vip':
        return clients.filter(c => c.totalSpent > 300);
      case 'new':
        return clients.filter(c => c.tags?.includes('New Customer'));
      case 'inactive':
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        return clients.filter(c => new Date(c.lastService) < threeMonthsAgo);
      case 'all':
      default:
        return clients;
    }
  };

  const confirmDelete = () => {
    if (deletingItemType === 'worker') {
      deleteWorker(deletingItemId);
    } else if (deletingItemType === 'client') {
      deleteClient(deletingItemId);
    } else if (deletingItemType === 'booking') {
      deleteBooking(deletingItemId);
    }
    setDeleteModalOpen(false);
    setDeletingItemId(null);
    setDeletingItemType('');
  };

  // CRUD Operations - Bookings
  const addBooking = async (bookingData) => {
    const errors = validateBookingForm(bookingData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return false;
    }

    try {
      const response = await bookingsAPI.create(bookingData);
      setBookings([...bookings, response.data]);
      
      // Create alert log
      const log = {
        bookingId: response.data.id,
        service: response.data.serviceType,
        customer: clients.find(c => c.id === response.data.clientId)?.name || 'Unknown',
        timestamp: new Date().toISOString(),
        workersNotified: workers.filter(w => w.isActive).slice(0, 3).map(w => ({ name: w.name, phone: w.phone })),
        status: 'success'
      };
      setAlertLogs([...alertLogs, log]);
      
      showNotification('✅ Booking created and workers notified!');
      return true;
    } catch (error) {
      console.error('Failed to create booking:', error);
      showNotification('❌ Failed to create booking', 'error');
      return false;
    }
  };

  const updateBooking = async (id, bookingData) => {
    const errors = validateBookingForm(bookingData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return false;
    }

    try {
      const response = await bookingsAPI.update(id, bookingData);
      setBookings(bookings.map(b => b.id === id ? response.data : b));
      showNotification('✅ Booking updated successfully!');
      return true;
    } catch (error) {
      console.error('Failed to update booking:', error);
      showNotification('❌ Failed to update booking', 'error');
      return false;
    }
  };

  const deleteBooking = async (id) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        await bookingsAPI.delete(id);
        setBookings(bookings.filter(b => b.id !== id));
        showNotification('🗑️ Booking deleted successfully!');
      } catch (error) {
        console.error('Failed to delete booking:', error);
        showNotification('❌ Failed to delete booking', 'error');
      }
    }
  };

  const updateBookingStatus = async (id, status) => {
    try {
      const response = await bookingsAPI.updateStatus(id, status);
      setBookings(bookings.map(b => b.id === id ? response.data : b));
      showNotification(`✅ Booking ${status}!`);
    } catch (error) {
      console.error('Failed to update booking status:', error);
      showNotification('❌ Failed to update booking status', 'error');
    }
  };

  // Modal Handlers
  const openAddModal = (type) => {
    setModalType(type);
    setModalMode('add');
    setEditingItem(null);
    setFormData(getEmptyFormData(type));
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (type, item) => {
    setModalType(type);
    setModalMode('edit');
    setEditingItem(item);
    setFormData(item);
    setFormErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setFormData({});
    setFormErrors({});
    setEditingItem(null);
  };

  const getEmptyFormData = (type) => {
    switch(type) {
      case 'worker':
        return { name: '', email: '', phone: '', zone: '', services: [], isActive: true };
      case 'client':
        return { name: '', email: '', phone: '', address: '', notes: '', birthday: '', tags: [], totalSpent: 0, lastService: '' };
      case 'booking':
        return { clientId: '', workerId: '', serviceType: '', date: '', time: '', address: '', instructions: '', status: 'pending', price: 0 };
      default:
        return {};
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let success = false;

    if (modalMode === 'add') {
      if (modalType === 'worker') success = addWorker(formData);
      else if (modalType === 'client') success = addClient(formData);
      else if (modalType === 'booking') success = addBooking(formData);
    } else {
      if (modalType === 'worker') success = updateWorker(editingItem.id, formData);
      else if (modalType === 'client') success = updateClient(editingItem.id, formData);
      else if (modalType === 'booking') success = updateBooking(editingItem.id, formData);
    }

    if (success) closeModal();
  };

  // Export Data
  const exportData = () => {
    const data = {
      workers,
      clients,
      bookings,
      alertLogs,
      exportDate: new Date().toISOString()
    };
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `goham-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification('📥 Data exported successfully!');
  };

  // Filter data based on search
  const filterData = (data, searchFields) => {
    if (!searchTerm) return data;
    return data.filter(item => 
      searchFields.some(field => 
        String(item[field] || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  };

  const filteredWorkers = filterData(workers, ['name', 'email', 'zone']);
  const filteredClients = filterData(clients, ['name', 'email', 'phone']);
  const filteredBookings = bookings.filter(b => {
    if (!searchTerm) return true;
    const client = clients.find(c => c.id === b.clientId);
    const worker = workers.find(w => w.id === b.workerId);
    return (
      b.serviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Show loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading dashboard...</p>
          <p className="text-sm text-gray-500 mt-2">Connecting to server...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-6 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">🔧 GO HAM PRO - Admin Dashboard</h1>
              <p className="text-blue-100">Complete System Management & Worker Alert System</p>
            </div>
            {error && (
              <div className="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm">
                ⚠️ Offline Mode
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-xl ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white flex items-center space-x-3 animate-fade-in`}>
          {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-2 hover:scale-110 transition">
            <X size={20} />
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: 'Total Bookings', value: stats.totalBookings, icon: '📋', color: 'blue' },
            { label: 'Pending', value: stats.pendingBookings, icon: '⏳', color: 'yellow' },
            { label: 'Active Workers', value: stats.activeWorkers, icon: '👷', color: 'green' },
            { label: 'Total Clients', value: stats.totalClients, icon: '👥', color: 'purple' },
            { label: 'Alerts Sent', value: stats.alertsSent, icon: '📨', color: 'orange' },
            { label: 'Response Rate', value: `${stats.responseRate}%`, icon: '📈', color: 'teal' }
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
              <div className="text-xs text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b overflow-x-auto">
            {[
              { id: 'overview', label: '📊 Overview' },
              { id: 'workers', label: '👷 Workers' },
              { id: 'clients', label: '👥 Clients' },
              { id: 'bookings', label: '📋 Bookings' },
              { id: 'marketing', label: '📧 Marketing' },
              { id: 'logs', label: '📝 Alert Logs' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-semibold whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">System Overview</h2>
                <button
                  onClick={exportData}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                >
                  <Download size={18} />
                  Export All Data
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Recent Bookings */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-bold mb-4">📋 Recent Bookings</h3>
                  <div className="space-y-2">
                    {bookings.slice(-5).reverse().map(booking => {
                      const client = clients.find(c => c.id === booking.clientId);
                      return (
                        <div key={booking.id} className="p-3 bg-gray-50 rounded border-l-4 border-blue-500">
                          <div className="font-semibold">{client?.name || 'Unknown Client'}</div>
                          <div className="text-sm text-gray-600">{booking.serviceType} - {booking.date}</div>
                          <div className={`text-xs mt-1 inline-block px-2 py-1 rounded ${
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            booking.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {booking.status}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Active Workers */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-bold mb-4">👷 Active Workers</h3>
                  <div className="space-y-2">
                    {workers.filter(w => w.isActive).map(worker => (
                      <div key={worker.id} className="p-3 bg-gray-50 rounded border-l-4 border-green-500">
                        <div className="font-semibold">{worker.name}</div>
                        <div className="text-sm text-gray-600">Zone: {worker.zone}</div>
                        <div className="text-xs text-gray-500 mt-1">{worker.services.join(', ')}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Workers Tab */}
          {activeTab === 'workers' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Workers Management</h2>
                <button
                  onClick={() => openAddModal('worker')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                >
                  <Plus size={18} />
                  Add Worker
                </button>
              </div>

              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search workers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Zone</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Contact</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Services</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredWorkers.map(worker => (
                      <tr key={worker.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-semibold">{worker.name}</td>
                        <td className="px-4 py-3">{worker.zone}</td>
                        <td className="px-4 py-3">
                          <div className="text-sm">{worker.email}</div>
                          <div className="text-xs text-gray-500">{worker.phone}</div>
                        </td>
                        <td className="px-4 py-3 text-sm">{worker.services.join(', ')}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleWorkerStatus(worker.id)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              worker.isActive 
                                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                          >
                            {worker.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditModal('worker', worker)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => deleteWorker(worker.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Clients Tab */}
          {activeTab === 'clients' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Clients Management</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setMarketingAction('quickEmail');
                      setMarketingModalOpen(true);
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
                  >
                    📧 Send Email
                  </button>
                  <button
                    onClick={() => openAddModal('client')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Add Client
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Client Segments Quick Actions */}
              <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                <h3 className="font-semibold text-purple-900 mb-3">📊 Customer Segments</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      const vipClients = segmentClientsSync('vip');
                      setSelectedClients(vipClients.map(c => c.id));
                      showNotification(`Selected ${vipClients.length} VIP clients (spent >$300)`, 'success');
                    }}
                    className="px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 text-sm font-semibold"
                  >
                    💎 VIP Clients ({segmentClientsSync('vip').length})
                  </button>
                  <button
                    onClick={() => {
                      const newClients = segmentClientsSync('new');
                      setSelectedClients(newClients.map(c => c.id));
                      showNotification(`Selected ${newClients.length} new clients`, 'success');
                    }}
                    className="px-3 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 text-sm font-semibold"
                  >
                    🌟 New Customers ({segmentClientsSync('new').length})
                  </button>
                  <button
                    onClick={() => {
                      const inactiveClients = segmentClientsSync('inactive');
                      setSelectedClients(inactiveClients.map(c => c.id));
                      showNotification(`Selected ${inactiveClients.length} inactive clients`, 'success');
                    }}
                    className="px-3 py-2 bg-orange-100 text-orange-800 rounded-lg hover:bg-orange-200 text-sm font-semibold"
                  >
                    ⏰ Inactive 3mo+ ({segmentClientsSync('inactive').length})
                  </button>
                  <button
                    onClick={sendBirthdayCards}
                    className="px-3 py-2 bg-pink-100 text-pink-800 rounded-lg hover:bg-pink-200 text-sm font-semibold"
                  >
                    🎂 Send Birthday Cards
                  </button>
                  {selectedClients.length > 0 && (
                    <>
                      <button
                        onClick={() => setSelectedClients([])}
                        className="px-3 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 text-sm font-semibold"
                      >
                        ✕ Clear Selection ({selectedClients.length})
                      </button>
                      <button
                        onClick={() => {
                          setMarketingAction('quickEmail');
                          setMarketingModalOpen(true);
                        }}
                        className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 text-sm font-semibold"
                      >
                        📧 Email Selected
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedClients.length === filteredClients.length && filteredClients.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedClients(filteredClients.map(c => c.id));
                            } else {
                              setSelectedClients([]);
                            }
                          }}
                          className="rounded"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Contact</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Address</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Stats</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tags</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredClients.map(client => (
                      <tr key={client.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedClients.includes(client.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedClients([...selectedClients, client.id]);
                              } else {
                                setSelectedClients(selectedClients.filter(id => id !== client.id));
                              }
                            }}
                            className="rounded"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold">{client.name}</div>
                          {client.birthday && (
                            <div className="text-xs text-gray-500">🎂 {new Date(client.birthday).toLocaleDateString()}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">{client.email}</div>
                          <div className="text-xs text-gray-500">{client.phone}</div>
                        </td>
                        <td className="px-4 py-3 text-sm">{client.address}</td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-semibold text-green-600">${client.totalSpent || 0}</div>
                          <div className="text-xs text-gray-500">Last: {client.lastService ? new Date(client.lastService).toLocaleDateString() : 'Never'}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {client.tags?.map((tag, i) => (
                              <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditModal('client', client)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => deleteClient(client.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Bookings Management</h2>
                <button
                  onClick={() => openAddModal('booking')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                >
                  <Plus size={18} />
                  Add Booking
                </button>
              </div>

              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search bookings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Client</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Service</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date & Time</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Worker</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredBookings.map(booking => {
                      const client = clients.find(c => c.id === booking.clientId);
                      const worker = workers.find(w => w.id === booking.workerId);
                      return (
                        <tr key={booking.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-semibold">{client?.name || 'Unknown'}</td>
                          <td className="px-4 py-3">{booking.serviceType}</td>
                          <td className="px-4 py-3">
                            <div className="text-sm">{booking.date}</div>
                            <div className="text-xs text-gray-500">{booking.time}</div>
                          </td>
                          <td className="px-4 py-3">{worker?.name || 'Unassigned'}</td>
                          <td className="px-4 py-3">
                            <select
                              value={booking.status}
                              onChange={(e) => updateBookingStatus(booking.id, e.target.value)}
                              className={`px-3 py-1 rounded-full text-xs font-semibold border-0 ${
                                booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                booking.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                'bg-red-100 text-red-800'
                              }`}
                            >
                              <option value="pending">Pending</option>
                              <option value="accepted">Accepted</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => openEditModal('booking', booking)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => deleteBooking(booking.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Marketing Tab */}
          {activeTab === 'marketing' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Marketing & Customer Engagement</h2>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* Quick Actions */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border-2 border-purple-200">
                  <h3 className="text-lg font-bold text-purple-900 mb-4">🚀 Quick Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        setMarketingAction('email');
                        setMarketingModalOpen(true);
                      }}
                      className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold text-left flex items-center gap-3"
                    >
                      <span className="text-2xl">📧</span>
                      <div>
                        <div>Send Email Campaign</div>
                        <div className="text-xs text-purple-100">Create and send promotional emails</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => {
                        setMarketingAction('coupon');
                        setMarketingModalOpen(true);
                      }}
                      className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold text-left flex items-center gap-3"
                    >
                      <span className="text-2xl">🎟️</span>
                      <div>
                        <div>Create Coupon</div>
                        <div className="text-xs text-green-100">Generate discount codes</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={sendBirthdayCards}
                      className="w-full px-4 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition font-semibold text-left flex items-center gap-3"
                    >
                      <span className="text-2xl">🎂</span>
                      <div>
                        <div>Send Birthday Cards</div>
                        <div className="text-xs text-pink-100">Auto-send to today's birthdays</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Marketing Stats */}
                <div className="bg-white rounded-lg p-6 border-2 border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Marketing Performance</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="font-semibold text-gray-700">Total Campaigns</span>
                      <span className="text-2xl font-bold text-blue-600">{campaigns.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="font-semibold text-gray-700">Active Coupons</span>
                      <span className="text-2xl font-bold text-green-600">{coupons.filter(c => c.isActive).length}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span className="font-semibold text-gray-700">Total Emails Sent</span>
                      <span className="text-2xl font-bold text-purple-600">{campaigns.reduce((sum, c) => sum + c.sent, 0)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                      <span className="font-semibold text-gray-700">Avg Open Rate</span>
                      <span className="text-2xl font-bold text-orange-600">
                        {campaigns.length > 0 ? Math.round((campaigns.reduce((sum, c) => sum + c.opened, 0) / campaigns.reduce((sum, c) => sum + c.sent, 0)) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Coupons */}
              <div className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800">🎟️ Active Coupons</h3>
                  <button
                    onClick={() => {
                      setMarketingAction('coupon');
                      setMarketingModalOpen(true);
                    }}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm flex items-center gap-2"
                  >
                    <Plus size={16} />
                    New Coupon
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Code</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Discount</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Expiry</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Usage</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {coupons.map(coupon => (
                        <tr key={coupon.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-bold text-green-600">{coupon.code}</td>
                          <td className="px-4 py-3">
                            {coupon.type === 'percentage' ? `${coupon.discount}%` : `${coupon.discount}`}
                          </td>
                          <td className="px-4 py-3 text-sm">{new Date(coupon.expiryDate).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-sm">
                            {coupon.usageCount} / {coupon.usageLimit || '∞'}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toggleCoupon(coupon.id)}
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                coupon.isActive 
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                  : 'bg-red-100 text-red-700 hover:bg-red-200'
                              }`}
                            >
                              {coupon.isActive ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => {
                                setEditingItem(coupon);
                                setMarketingAction('sendCoupon');
                                setMarketingModalOpen(true);
                              }}
                              className="px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 text-sm font-semibold"
                            >
                              📧 Send to Clients
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Campaign History */}
              <div className="bg-white rounded-lg p-6 border-2 border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4">📈 Campaign History</h3>
                <div className="space-y-3">
                  {campaigns.slice().reverse().map(campaign => (
                    <div key={campaign.id} className="p-4 border-l-4 border-purple-500 bg-purple-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-gray-800">{campaign.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Type: <span className="font-semibold capitalize">{campaign.type}</span> | 
                            Created: {new Date(campaign.created).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          campaign.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {campaign.status}
                        </span>
                      </div>
                      <div className="mt-3 flex gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">Sent:</span>
                          <span className="font-bold text-blue-600">{campaign.sent}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">Opened:</span>
                          <span className="font-bold text-green-600">{campaign.opened}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">Open Rate:</span>
                          <span className="font-bold text-purple-600">
                            {campaign.sent > 0 ? Math.round((campaign.opened / campaign.sent) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Alert Logs Tab */}
          {activeTab === 'logs' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Alert Logs</h2>
                <button
                  onClick={() => setAlertLogs([])}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                >
                  <Trash2 size={18} />
                  Clear Logs
                </button>
              </div>

              <div className="space-y-3">
                {alertLogs.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-lg">No alerts logged yet</p>
                  </div>
                ) : (
                  alertLogs.slice().reverse().map((log, i) => (
                    <div key={i} className={`p-4 rounded-lg border-l-4 ${
                      log.status === 'error' ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">
                            {new Date(log.timestamp).toLocaleString()}
                          </div>
                          <div className="font-bold text-gray-800">
                            Booking #{log.bookingId} - {log.service}
                          </div>
                          <div className="text-sm text-gray-700 mt-1">
                            Customer: {log.customer}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            Workers notified: {log.workersNotified?.length || 0}
                          </div>
                        </div>
                      </div>
                      {log.workersNotified?.length > 0 && (
                        <details className="mt-3">
                          <summary className="cursor-pointer text-sm text-green-600 hover:text-green-700 font-semibold">
                            View Notified Workers
                          </summary>
                          <ul className="mt-2 ml-4 text-sm text-gray-600 space-y-1">
                            {log.workersNotified.map((w, idx) => (
                              <li key={idx}>• {w.name} ({w.phone})</li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">
                  {modalMode === 'add' ? 'Add' : 'Edit'} {modalType.charAt(0).toUpperCase() + modalType.slice(1)}
                </h3>
                <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Worker Form */}
                {modalType === 'worker' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Name *</label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          formErrors.name ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Email *</label>
                      <input
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          formErrors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Phone *</label>
                      <input
                        type="tel"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="+15551234567"
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          formErrors.phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Zone *</label>
                      <select
                        value={formData.zone || ''}
                        onChange={(e) => setFormData({...formData, zone: e.target.value})}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          formErrors.zone ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select Zone</option>
                        {availableZones.map(zone => (
                          <option key={zone} value={zone}>{zone}</option>
                        ))}
                      </select>
                      {formErrors.zone && <p className="text-red-500 text-xs mt-1">{formErrors.zone}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Services *</label>
                      <div className="grid grid-cols-2 gap-2">
                        {availableServices.map(service => (
                          <label key={service} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={(formData.services || []).includes(service)}
                              onChange={(e) => {
                                const services = formData.services || [];
                                if (e.target.checked) {
                                  setFormData({...formData, services: [...services, service]});
                                } else {
                                  setFormData({...formData, services: services.filter(s => s !== service)});
                                }
                              }}
                              className="rounded text-blue-600"
                            />
                            <span className="text-sm">{service}</span>
                          </label>
                        ))}
                      </div>
                      {formErrors.services && <p className="text-red-500 text-xs mt-1">{formErrors.services}</p>}
                    </div>
                  </>
                )}

                {/* Client Form */}
                {modalType === 'client' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Name *</label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          formErrors.name ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Email *</label>
                      <input
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          formErrors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Phone *</label>
                      <input
                        type="tel"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="+15551234567"
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          formErrors.phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Address *</label>
                      <input
                        type="text"
                        value={formData.address || ''}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          formErrors.address ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {formErrors.address && <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
                      <textarea
                        value={formData.notes || ''}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Birthday (Optional)</label>
                      <input
                        type="date"
                        value={formData.birthday || ''}
                        onChange={(e) => setFormData({...formData, birthday: e.target.value})}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          formErrors.birthday ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {formErrors.birthday && <p className="text-red-500 text-xs mt-1">{formErrors.birthday}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Tags (Optional)</label>
                      <input
                        type="text"
                        value={(formData.tags || []).join(', ')}
                        onChange={(e) => setFormData({...formData, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)})}
                        placeholder="VIP, New Customer, etc."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
                    </div>
                  </>
                )}

                {modalType === 'client' && (
                    <><div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                      <input
                        type="password"
                        value={formData.password || ''}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          formErrors.password ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {formErrors.password && <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>}
                    </div>
                    </>
                )}}

                {/* Booking Form */}
                {modalType === 'booking' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Client *</label>
                      <select
                        value={formData.clientId || ''}
                        onChange={(e) => {
                          const client = clients.find(c => c.id === parseInt(e.target.value));
                          setFormData({...formData, clientId: parseInt(e.target.value), address: client?.address || ''});
                        }}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          formErrors.clientId ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select Client</option>
                        {clients.map(client => (
                          <option key={client.id} value={client.id}>{client.name}</option>
                        ))}
                      </select>
                      {formErrors.clientId && <p className="text-red-500 text-xs mt-1">{formErrors.clientId}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Worker (Optional)</label>
                      <select
                        value={formData.workerId || ''}
                        onChange={(e) => setFormData({...formData, workerId: e.target.value ? parseInt(e.target.value) : null})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Unassigned</option>
                        {workers.filter(w => w.isActive).map(worker => (
                          <option key={worker.id} value={worker.id}>{worker.name} - {worker.zone}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Service Type *</label>
                      <select
                        value={formData.serviceType || ''}
                        onChange={(e) => setFormData({...formData, serviceType: e.target.value})}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          formErrors.serviceType ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select Service</option>
                        {availableServices.map(service => (
                          <option key={service} value={service}>{service}</option>
                        ))}
                      </select>
                      {formErrors.serviceType && <p className="text-red-500 text-xs mt-1">{formErrors.serviceType}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Date *</label>
                        <input
                          type="date"
                          value={formData.date || ''}
                          onChange={(e) => setFormData({...formData, date: e.target.value})}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                            formErrors.date ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {formErrors.date && <p className="text-red-500 text-xs mt-1">{formErrors.date}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Time *</label>
                        <input
                          type="time"
                          value={formData.time || ''}
                          onChange={(e) => setFormData({...formData, time: e.target.value})}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                            formErrors.time ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {formErrors.time && <p className="text-red-500 text-xs mt-1">{formErrors.time}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Address *</label>
                      <input
                        type="text"
                        value={formData.address || ''}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          formErrors.address ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {formErrors.address && <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Special Instructions</label>
                      <textarea
                        value={formData.instructions || ''}
                        onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                  >
                    {modalMode === 'add' ? 'Add' : 'Update'} {modalType.charAt(0).toUpperCase() + modalType.slice(1)}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Delete {deletingItemType.charAt(0).toUpperCase() + deletingItemType.slice(1)}</h3>
                <button onClick={() => setDeleteModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>

              <p className="text-gray-700 mb-6">
                Are you sure you want to delete this {deletingItemType}? This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
                >
                  Delete {deletingItemType.charAt(0).toUpperCase() + deletingItemType.slice(1)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Marketing Modal */}
      {marketingModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">
                  {marketingAction === 'email' && '📧 Create Email Campaign'}
                  {marketingAction === 'quickEmail' && '📧 Send Quick Email'}
                  {marketingAction === 'coupon' && '🎟️ Create New Coupon'}
                  {marketingAction === 'sendCoupon' && '📧 Send Coupon to Clients'}
                </h3>
                <button onClick={() => setMarketingModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>

              {/* Email Campaign Form */}
              {(marketingAction === 'email' || marketingAction === 'quickEmail') && (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const recipients = selectedClients.length > 0 ? selectedClients : clients.map(c => c.id);
                  
                  if (marketingAction === 'email') {
                    sendMarketingCampaign({
                      name: formData.get('campaignName'),
                      subject: formData.get('subject'),
                      message: formData.get('message'),
                      type: formData.get('type'),
                      recipients
                    });
                  } else {
                    sendEmail(recipients, formData.get('subject'), formData.get('message'));
                  }
                  
                  setMarketingModalOpen(false);
                  setSelectedClients([]);
                }} className="space-y-4">
                  
                  {marketingAction === 'email' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Campaign Name</label>
                      <input
                        type="text"
                        name="campaignName"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="e.g., Spring Sale 2025"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Recipients: {selectedClients.length > 0 ? `${selectedClients.length} selected` : `All clients (${clients.length})`}
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                      {selectedClients.length > 0 
                        ? clients.filter(c => selectedClients.includes(c.id)).map(c => c.name).join(', ')
                        : 'All clients will receive this email'
                      }
                    </div>
                  </div>

                  {marketingAction === 'email' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Campaign Type</label>
                      <select
                        name="type"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="promotional">Promotional</option>
                        <option value="newsletter">Newsletter</option>
                        <option value="announcement">Announcement</option>
                        <option value="discount">Discount Offer</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email Subject</label>
                    <input
                      type="text"
                      name="subject"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g., 20% Off All Services This Week!"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Message</label>
                    <textarea
                      name="message"
                      required
                      rows={6}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Write your email message here..."
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">💡 Email Templates Available:</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      <div>• <strong>Promotional:</strong> Special offers and discounts</div>
                      <div>• <strong>Newsletter:</strong> Company updates and tips</div>
                      <div>• <strong>Birthday:</strong> Personalized birthday greetings</div>
                      <div>• <strong>Re-engagement:</strong> Win back inactive customers</div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setMarketingModalOpen(false)}
                      className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
                    >
                      📧 Send Email
                    </button>
                  </div>
                </form>
              )}

              {/* Coupon Creation Form */}
              {marketingAction === 'coupon' && (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  createCoupon({
                    code: formData.get('code').toUpperCase(),
                    discount: parseFloat(formData.get('discount')),
                    type: formData.get('type'),
                    expiryDate: formData.get('expiryDate'),
                    usageLimit: formData.get('usageLimit') ? parseInt(formData.get('usageLimit')) : null
                  });
                  setMarketingModalOpen(false);
                }} className="space-y-4">
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Coupon Code</label>
                    <input
                      type="text"
                      name="code"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 uppercase"
                      placeholder="e.g., SUMMER20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Discount Type</label>
                      <select
                        name="type"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount ($)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Discount Value</label>
                      <input
                        type="number"
                        name="discount"
                        required
                        min="1"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder="e.g., 20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Expiry Date</label>
                      <input
                        type="date"
                        name="expiryDate"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Usage Limit (Optional)</label>
                      <input
                        type="number"
                        name="usageLimit"
                        min="1"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder="Leave empty for unlimited"
                      />
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-2">✅ Coupon Best Practices:</h4>
                    <div className="text-sm text-green-800 space-y-1">
                      <div>• Use clear, memorable codes (e.g., SAVE20, WELCOME15)</div>
                      <div>• Set realistic expiry dates</div>
                      <div>• Consider usage limits for high-value discounts</div>
                      <div>• Track coupon performance in Marketing tab</div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setMarketingModalOpen(false)}
                      className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
                    >
                      🎟️ Create Coupon
                    </button>
                  </div>
                </form>
              )}

              {/* Send Coupon to Clients */}
              {marketingAction === 'sendCoupon' && editingItem && (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const recipients = selectedClients.length > 0 ? selectedClients : clients.map(c => c.id);
                  sendCouponToClients(editingItem.id, recipients);
                  setMarketingModalOpen(false);
                  setSelectedClients([]);
                }} className="space-y-4">
                  
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                    <h4 className="font-bold text-green-900 text-lg mb-2">Coupon: {editingItem.code}</h4>
                    <div className="text-sm text-green-800">
                      <div>Discount: {editingItem.type === 'percentage' ? `${editingItem.discount}%` : `${editingItem.discount}`}</div>
                      <div>Expires: {new Date(editingItem.expiryDate).toLocaleDateString()}</div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Recipients: {selectedClients.length > 0 ? `${selectedClients.length} selected` : `All clients (${clients.length})`}
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600 max-h-40 overflow-y-auto">
                      {selectedClients.length > 0 
                        ? clients.filter(c => selectedClients.includes(c.id)).map(c => c.name).join(', ')
                        : 'All clients will receive this coupon'
                      }
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      📧 An email will be sent to the selected clients with the coupon code and instructions on how to use it.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setMarketingModalOpen(false)}
                      className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
                    >
                      📧 Send Coupon
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
