/* global firebase */

// Database Integration Service
// Supports multiple database providers with automatic fallback to localStorage
import 'regenerator-runtime/runtime';

class DatabaseService {
    constructor(config = {}) {
        this.provider = config.provider || 'localStorage';
        this.connectionString = config.connectionString || null;
        this.firebaseConfig = config.firebaseConfig || null;
        this.isConnected = false;
        this.client = null;
        
        this.schema = {
            workers: {
                id: 'INTEGER PRIMARY KEY',
                name: 'TEXT NOT NULL',
                email: 'TEXT UNIQUE NOT NULL',
                phone: 'TEXT NOT NULL',
                services: 'JSON',
                zone: 'TEXT',
                isActive: 'BOOLEAN DEFAULT 1',
                rating: 'REAL DEFAULT 4.0',
                experienceYears: 'INTEGER',
                createdAt: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
                updatedAt: 'DATETIME DEFAULT CURRENT_TIMESTAMP'
            },
            customers: {
                id: 'INTEGER PRIMARY KEY',
                name: 'TEXT NOT NULL',
                email: 'TEXT UNIQUE NOT NULL',
                phone: 'TEXT NOT NULL',
                address: 'TEXT',
                segment: 'TEXT DEFAULT "new"',
                totalBookings: 'INTEGER DEFAULT 0',
                totalSpent: 'REAL DEFAULT 0.0',
                lastBookingDate: 'DATETIME',
                createdAt: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
                updatedAt: 'DATETIME DEFAULT CURRENT_TIMESTAMP'
            },
            bookings: {
                id: 'INTEGER PRIMARY KEY',
                customerId: 'INTEGER',
                workerId: 'INTEGER',
                serviceType: 'TEXT NOT NULL',
                date: 'DATE NOT NULL',
                time: 'TIME NOT NULL',
                address: 'TEXT NOT NULL',
                instructions: 'TEXT',
                status: 'TEXT DEFAULT "pending"',
                totalCost: 'REAL',
                rating: 'INTEGER',
                review: 'TEXT',
                calendarEventId: 'TEXT',
                createdAt: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
                updatedAt: 'DATETIME DEFAULT CURRENT_TIMESTAMP'
            },
            alertLogs: {
                id: 'INTEGER PRIMARY KEY',
                bookingId: 'INTEGER',
                workersNotified: 'JSON',
                emailsSent: 'INTEGER DEFAULT 0',
                smsSent: 'INTEGER DEFAULT 0',
                status: 'TEXT DEFAULT "sent"',
                errorMessage: 'TEXT',
                createdAt: 'DATETIME DEFAULT CURRENT_TIMESTAMP'
            },
            workerSchedules: {
                id: 'INTEGER PRIMARY KEY',
                workerId: 'INTEGER',
                date: 'DATE',
                startTime: 'DATETIME',
                endTime: 'DATETIME',
                bookingId: 'INTEGER',
                status: 'TEXT DEFAULT "scheduled"',
                createdAt: 'DATETIME DEFAULT CURRENT_TIMESTAMP'
            },
            campaigns: {
                id: 'INTEGER PRIMARY KEY',
                name: 'TEXT NOT NULL',
                type: 'TEXT NOT NULL',
                subject: 'TEXT',
                content: 'TEXT',
                targetSegment: 'TEXT',
                status: 'TEXT DEFAULT "draft"',
                sentCount: 'INTEGER DEFAULT 0',
                failedCount: 'INTEGER DEFAULT 0',
                createdAt: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
                sentAt: 'DATETIME'
            }
        };

        this.initialize();
    }

    async initialize() {
        try {
            switch (this.provider) {
                case 'mongodb':
                    await this.initMongoDB();
                    break;
                case 'firebase':
                    await this.initFirebase();
                    break;
                default:
                    await this.initLocalStorage();
                    break;
            }

            await this.createTables();
            await this.seedData();
            this.isConnected = true;
            console.log(`📊 Database connected (${this.provider})`);

        } catch (error) {
            console.error('Database initialization failed:', error);
            console.log('Falling back to localStorage...');
            await this.initLocalStorage();
            this.isConnected = true;
        }
    }

    async initMongoDB() {
        // MongoDB is not available in browser environment - always use localStorage fallback
        console.log('📦 MongoDB not available in browser - using localStorage fallback');
        await this.initLocalStorage();
    }

    async initFirebase() {
        try {
            // Browser Firebase only
            const firebaseConfig = this.firebaseConfig;

            // Initialize Firebase (assumes Firebase SDK is loaded)
            if (typeof firebase !== 'undefined') {
                if (!firebase.apps.length) {
                    firebase.initializeApp(firebaseConfig);
                }
                this.client = firebase.firestore();
                console.log('✅ Firebase Firestore connected (browser)');
            } else {
                throw new Error('Firebase SDK not loaded');
            }
        } catch (error) {
            throw new Error('Firebase connection failed: ' + error.message);
        }
    }

    async initLocalStorage() {
        this.provider = 'localStorage';
        this.client = {
            // Simulate database operations with localStorage
            query: this.localStorageQuery.bind(this),
            insert: this.localStorageInsert.bind(this),
            update: this.localStorageUpdate.bind(this),
            delete: this.localStorageDelete.bind(this)
        };
        console.log('📦 Using localStorage as database');
    }

    async createTables() {
        if (this.provider === 'localStorage') {
            // Initialize localStorage tables
            Object.keys(this.schema).forEach(tableName => {
                if (!localStorage.getItem(tableName)) {
                    localStorage.setItem(tableName, JSON.stringify([]));
                }
            });
            return;
        }

        if (this.provider === 'mongodb') {
            // MongoDB doesn't require explicit schema creation
            return;
        }

        if (this.provider === 'firebase') {
            // Firestore doesn't require explicit schema creation
            return;
        }

        // SQL databases
        for (const [tableName, columns] of Object.entries(this.schema)) {
            const columnDefinitions = Object.entries(columns)
                .map(([colName, colType]) => `${colName} ${colType}`)
                .join(', ');
            
            const createTableSQL = `CREATE TABLE IF NOT EXISTS ${tableName} (${columnDefinitions})`;
            
            try {
                if (this.provider === 'postgresql') {
                    await this.client.query(createTableSQL);
                } else if (this.provider === 'mysql') {
                    await this.client.execute(createTableSQL);
                } else if (this.provider === 'sqlite') {
                    await this.client.exec(createTableSQL);
                }
            } catch (error) {
                console.error(`Error creating table ${tableName}:`, error);
            }
        }
    }

    async seedData() {
        // Check if data already exists
        const existingWorkers = await this.getAllWorkers();
        if (existingWorkers.length > 0) {
            return; // Data already seeded
        }

        const seedWorkers = [
            {
                name: 'Mike Johnson',
                email: 'mike@gohampro.com',
                phone: '+15550101',
                services: JSON.stringify(['mobile-detailing', 'house-washing']),
                zone: 'north',
                isActive: true,
                rating: 4.9,
                experienceYears: 5
            },
            {
                name: 'Sarah Davis',
                email: 'sarah@gohampro.com',
                phone: '+15550102',
                services: JSON.stringify(['gutter-cleaning', 'commercial-washing']),
                zone: 'south',
                isActive: true,
                rating: 4.8,
                experienceYears: 7
            },
            {
                name: 'Carlos Rodriguez',
                email: 'carlos@gohampro.com',
                phone: '+15550103',
                services: JSON.stringify(['mobile-detailing', 'gutter-cleaning', 'house-washing']),
                zone: 'central',
                isActive: true,
                rating: 4.7,
                experienceYears: 3
            },
            {
                name: 'Jennifer Wang',
                email: 'jennifer@gohampro.com',
                phone: '+15550104',
                services: JSON.stringify(['commercial-washing', 'building-restoration']),
                zone: 'north',
                isActive: true,
                rating: 4.9,
                experienceYears: 8
            }
        ];

        for (const worker of seedWorkers) {
            await this.insertWorker(worker);
        }

        console.log('🌱 Database seeded with initial data');
    }

    // Generic CRUD operations
    async insert(table, data) {
        try {
            if (this.provider === 'localStorage') {
                return this.localStorageInsert(table, data);
            } else if (this.provider === 'mongodb') {
                const result = await this.db.collection(table).insertOne(data);
                return { id: result.insertedId, ...data };
            } else if (this.provider === 'firebase') {
                const docRef = await this.client.collection(table).add(data);
                return { id: docRef.id, ...data };
            }
        } catch (error) {
            console.error(`Error inserting into ${table}:`, error);
            throw error;
        }
    }

    async findById(table, id) {
        try {
            if (this.provider === 'localStorage') {
                const items = JSON.parse(localStorage.getItem(table) || '[]');
                return items.find(item => item.id === id) || null;
            } else if (this.provider === 'mongodb') {
                return await this.db.collection(table).findOne({ _id: id });
            } else if (this.provider === 'firebase') {
                const doc = await this.client.collection(table).doc(id).get();
                return doc.exists ? { id: doc.id, ...doc.data() } : null;
            }
        } catch (error) {
            console.error(`Error finding ${table} by ID:`, error);
            throw error;
        }
    }

    async findAll(table, conditions = {}) {
        try {
            if (this.provider === 'localStorage') {
                const items = JSON.parse(localStorage.getItem(table) || '[]');

                if (Object.keys(conditions).length === 0) {
                    return items;
                }

                return items.filter(item => {
                    return Object.entries(conditions).every(([key, value]) => item[key] === value);
                });
            } else if (this.provider === 'mongodb') {
                return await this.db.collection(table).find(conditions).toArray();
            } else if (this.provider === 'firebase') {
                let query = this.client.collection(table);

                Object.entries(conditions).forEach(([field, value]) => {
                    query = query.where(field, '==', value);
                });

                const snapshot = await query.get();
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            }
        } catch (error) {
            console.error(`Error finding all from ${table}:`, error);
            throw error;
        }
    }

    async update(table, id, data) {
        try {
            if (this.provider === 'localStorage') {
                const items = JSON.parse(localStorage.getItem(table) || '[]');
                const index = items.findIndex(item => item.id === id);

                if (index !== -1) {
                    items[index] = { ...items[index], ...data, updatedAt: new Date().toISOString() };
                    localStorage.setItem(table, JSON.stringify(items));
                    return items[index];
                }
                return null;
            } else if (this.provider === 'mongodb') {
                const result = await this.db.collection(table).updateOne(
                    { _id: id },
                    { $set: { ...data, updatedAt: new Date() } }
                );
                return result.matchedCount > 0;
            } else if (this.provider === 'firebase') {
                await this.client.collection(table).doc(id).update({
                    ...data,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                return true;
            }
        } catch (error) {
            console.error(`Error updating ${table}:`, error);
            throw error;
        }
    }

    // Specific methods for each entity
    async insertWorker(workerData) {
        return this.insert('workers', {
            ...workerData,
            createdAt: new Date().toISOString()
        });
    }

    async getAllWorkers() {
        const workers = await this.findAll('workers');
        return workers.map(worker => ({
            ...worker,
            services: typeof worker.services === 'string' ? JSON.parse(worker.services) : worker.services
        }));
    }

    async insertCustomer(customerData) {
        return this.insert('customers', {
            ...customerData,
            createdAt: new Date().toISOString()
        });
    }

    async getCustomer(customerId) {
        return this.findById('customers', customerId);
    }

    async getAllCustomers() {
        return this.findAll('customers');
    }

    async insertBooking(bookingData) {
        // Auto-assign customer ID or create new customer
        if (!bookingData.customerId) {
            const existingCustomer = await this.findAll('customers', { email: bookingData.email });
            
            if (existingCustomer.length > 0) {
                bookingData.customerId = existingCustomer[0].id;
            } else {
                const newCustomer = await this.insertCustomer({
                    name: bookingData.name,
                    email: bookingData.email,
                    phone: bookingData.phone,
                    address: bookingData.address
                });
                bookingData.customerId = newCustomer.id;
            }
        }

        return this.insert('bookings', {
            ...bookingData,
            createdAt: new Date().toISOString()
        });
    }

    async getCustomerBookings(customerId) {
        return this.findAll('bookings', { customerId });
    }

    async getWorkerBookings(workerId, startDate, endDate) {
        // For simplicity in localStorage, we'll filter after retrieval
        const allBookings = await this.findAll('bookings', { workerId });
        
        return allBookings.filter(booking => {
            const bookingDate = new Date(booking.date);
            return bookingDate >= startDate && bookingDate <= endDate;
        });
    }

    async insertAlertLog(logData) {
        return this.insert('alertLogs', {
            ...logData,
            workersNotified: typeof logData.workersNotified === 'object' ? 
                JSON.stringify(logData.workersNotified) : logData.workersNotified,
            createdAt: new Date().toISOString()
        });
    }

    async getAlertLogs() {
        const logs = await this.findAll('alertLogs');
        return logs.map(log => ({
            ...log,
            workersNotified: typeof log.workersNotified === 'string' ? 
                JSON.parse(log.workersNotified) : log.workersNotified
        }));
    }

    // localStorage-specific implementations
    localStorageInsert(table, data) {
        const items = JSON.parse(localStorage.getItem(table) || '[]');
        const newItem = {
            ...data,
            id: Date.now() + Math.random(), // Simple ID generation
            createdAt: new Date().toISOString()
        };
        items.push(newItem);
        localStorage.setItem(table, JSON.stringify(items));
        return newItem;
    }

    localStorageQuery(query, params = []) {
        // Basic query simulation for localStorage
        // This is a simplified implementation
        return [];
    }

    localStorageUpdate(table, id, data) {
        const items = JSON.parse(localStorage.getItem(table) || '[]');
        const index = items.findIndex(item => item.id === id);
        
        if (index !== -1) {
            items[index] = { ...items[index], ...data, updatedAt: new Date().toISOString() };
            localStorage.setItem(table, JSON.stringify(items));
            return items[index];
        }
        return null;
    }

    localStorageDelete(table, id) {
        const items = JSON.parse(localStorage.getItem(table) || '[]');
        const filteredItems = items.filter(item => item.id !== id);
        localStorage.setItem(table, JSON.stringify(filteredItems));
        return filteredItems.length < items.length;
    }

    // Utility methods
    async backup() {
        const backup = {};
        
        for (const tableName of Object.keys(this.schema)) {
            backup[tableName] = await this.findAll(tableName);
        }
        
        const backupData = {
            timestamp: new Date().toISOString(),
            provider: this.provider,
            data: backup
        };
        
        // Save backup to localStorage regardless of main provider
        localStorage.setItem('goham_backup_' + Date.now(), JSON.stringify(backupData));
        
        return backupData;
    }

    async restore(backupData) {
        for (const [tableName, tableData] of Object.entries(backupData.data)) {
            // Clear existing data (implement based on provider)
            // Insert backup data
            for (const item of tableData) {
                await this.insert(tableName, item);
            }
        }
    }

    async healthCheck() {
        try {
            if (this.provider === 'localStorage') {
                // Check if localStorage is available and working
                const testKey = 'health_check_' + Date.now();
                localStorage.setItem(testKey, 'test');
                const testValue = localStorage.getItem(testKey);
                localStorage.removeItem(testKey);
                
                return {
                    status: testValue === 'test' ? 'healthy' : 'unhealthy',
                    provider: this.provider,
                    timestamp: new Date().toISOString()
                };
            }
            
            // Add health checks for other providers
            return {
                status: 'healthy',
                provider: this.provider,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                provider: this.provider,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

// Export for Node.js and browser environments
export { DatabaseService };

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DatabaseService;
} else {
    window.DatabaseService = DatabaseService;
}

export default DatabaseService;