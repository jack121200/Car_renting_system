// API utilities and localStorage wrappers
export class API {
    static async fetchJSON(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        }
    }

    // Car-related API methods
    static async getAllCars() {
        try {
            return await this.fetchJSON('./data/cars.json');
        } catch (error) {
            console.error('Error loading cars:', error);
            // Return fallback data if JSON fails to load
            return this.getFallbackCars();
        }
    }

    static async getCarById(id) {
        const cars = await this.getAllCars();
        return cars.find(car => car.id === id);
    }

    static getFallbackCars() {
        return [
            {
                id: 1,
                name: "Tesla Model S",
                type: "luxury",
                price: 120,
                image: "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&h=600&fit=crop",
                rating: 4.9,
                reviewCount: 128,
                features: ["Autopilot", "Premium Sound", "Supercharging", "Glass Roof"]
            },
            {
                id: 2,
                name: "BMW X5",
                type: "suv",
                price: 95,
                image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=600&fit=crop",
                rating: 4.7,
                reviewCount: 89,
                features: ["All-Wheel Drive", "Panoramic Roof", "Navigation", "Heated Seats"]
            },
            {
                id: 3,
                name: "Porsche 911",
                type: "sports",
                price: 200,
                image: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&h=600&fit=crop",
                rating: 4.8,
                reviewCount: 156,
                features: ["Sport Mode", "Carbon Fiber", "Track Package", "Premium Audio"]
            }
        ];
    }

    static setLocal(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('localStorage set error:', error);
            return false;
        }
    }

    static getLocal(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('localStorage get error:', error);
            return defaultValue;
        }
    }

    static removeLocal(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('localStorage remove error:', error);
            return false;
        }
    }

    static clearLocal() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('localStorage clear error:', error);
            return false;
        }
    }

    // Authentication methods
    static getCurrentUser() {
        return this.getLocal('currentUser');
    }

    static setCurrentUser(user) {
        return this.setLocal('currentUser', user);
    }

    static logout() {
        this.removeLocal('currentUser');
        return true;
    }

    static async login(email, password) {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simple validation for demo
        if (email && password.length >= 6) {
            const user = {
                id: Date.now(),
                email: email,
                name: email.split('@')[0],
                loginTime: new Date().toISOString()
            };
            this.setCurrentUser(user);
            return { success: true, user };
        }
        
        throw new Error('Invalid credentials');
    }

    static async register(userData) {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const { email, password, firstName, lastName } = userData;
        
        if (email && password && firstName && lastName) {
            const user = {
                id: Date.now(),
                email: email,
                name: `${firstName} ${lastName}`,
                firstName,
                lastName,
                registrationTime: new Date().toISOString()
            };
            this.setCurrentUser(user);
            return { success: true, user };
        }
        
        throw new Error('Registration failed');
    }

    // Booking methods
    static getBookings() {
        return this.getLocal('bookings', []);
    }

    static async createBooking(bookingData) {
        const bookings = this.getBookings();
        const newBooking = {
            id: `BK${Date.now()}`,
            ...bookingData,
            createdAt: new Date().toISOString(),
            status: 'confirmed'
        };
        
        bookings.push(newBooking);
        this.setLocal('bookings', bookings);
        
        return newBooking;
    }

    static async processPayment(paymentData) {
        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 90% success rate for demo
        if (Math.random() > 0.1) {
            return {
                success: true,
                transactionId: `TXN${Date.now()}`,
                amount: paymentData.amount,
                timestamp: new Date().toISOString()
            };
        } else {
            throw new Error('Payment failed. Please try again.');
        }
    }

    // Simulate API delay for realistic feel
    static async delay(ms = 1000) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Mock API endpoints
    static async getCars() {
        await this.delay(500);
        return await this.fetchJSON('/data/cars.json');
    }

    static async getCarById(id) {
        const cars = await this.getCars();
        return cars.find(car => car.id === parseInt(id));
    }

    static async createBooking(bookingData) {
        await this.delay(1000);
        
        const bookings = this.getLocal('userBookings', []);
        const newBooking = {
            id: Date.now().toString(),
            ...bookingData,
            createdAt: new Date().toISOString(),
            status: 'active'
        };
        
        bookings.push(newBooking);
        this.setLocal('userBookings', bookings);
        
        return newBooking;
    }

    static async getUserBookings(userId) {
        await this.delay(300);
        const bookings = this.getLocal('userBookings', []);
        return bookings.filter(booking => booking.userId === userId);
    }

    static async updateBooking(bookingId, updates) {
        await this.delay(500);
        
        const bookings = this.getLocal('userBookings', []);
        const index = bookings.findIndex(b => b.id === bookingId);
        
        if (index !== -1) {
            bookings[index] = { ...bookings[index], ...updates };
            this.setLocal('userBookings', bookings);
            return bookings[index];
        }
        
        throw new Error('Booking not found');
    }

    static async cancelBooking(bookingId) {
        return await this.updateBooking(bookingId, { 
            status: 'cancelled',
            cancelledAt: new Date().toISOString()
        });
    }

    // User management
    static async createUser(userData) {
        await this.delay(800);
        
        const users = this.getLocal('users', []);
        const newUser = {
            id: Date.now(),
            ...userData,
            createdAt: new Date().toISOString(),
            verified: true
        };
        
        users.push(newUser);
        this.setLocal('users', users);
        
        return newUser;
    }

    static async authenticateUser(email, password) {
        await this.delay(600);
        
        const users = this.getLocal('users', []);
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            const userWithoutPassword = { ...user };
            delete userWithoutPassword.password;
            return userWithoutPassword;
        }
        
        throw new Error('Invalid credentials');
    }

    static getCurrentUser() {
        return this.getLocal('currentUser');
    }

    static setCurrentUser(user) {
        this.setLocal('currentUser', user);
    }

    static logout() {
        this.removeLocal('currentUser');
    }

    // Payment simulation
    static async processPayment(paymentData) {
        await this.delay(2000);
        
        // Simulate 90% success rate
        const success = Math.random() > 0.1;
        
        if (success) {
            return {
                success: true,
                transactionId: `TXN${Date.now()}`,
                amount: paymentData.amount,
                timestamp: new Date().toISOString()
            };
        } else {
            throw new Error('Payment failed. Please try again.');
        }
    }
}