// Admin dashboard functionality
import { Utils } from './main.js';
import { AuthManager } from './auth.js';

class AdminDashboardManager {
    constructor() {
        this.cars = [];
        this.bookings = [];
        this.users = [];
        this.currentEditingCar = null;
        this.init();
    }

    async init() {
        // Check admin authentication
        if (!this.checkAdminAuth()) {
            return;
        }

        await this.loadData();
        this.setupNavigation();
        this.setupEventListeners();
        this.renderOverview();
    }

    checkAdminAuth() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        if (!currentUser || currentUser.role !== 'admin') {
            Utils.showToast('Admin access required', 'error');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            return false;
        }
        return true;
    }

    async loadData() {
        try {
            // Load cars
            const carsResponse = await fetch('data/cars.json');
            this.cars = await carsResponse.json();

            // Load bookings from localStorage
            this.bookings = JSON.parse(localStorage.getItem('userBookings') || '[]');

            // Load users from localStorage
            this.users = JSON.parse(localStorage.getItem('users') || '[]');

        } catch (error) {
            console.error('Error loading admin data:', error);
            Utils.showToast('Error loading dashboard data', 'error');
        }
    }

    setupNavigation() {
        const navButtons = document.querySelectorAll('.admin-nav .nav-btn');
        const tabContents = document.querySelectorAll('.admin-tab');

        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;

                // Update active states
                navButtons.forEach(b => b.classList.remove('active'));
                tabContents.forEach(t => t.classList.remove('active'));

                btn.classList.add('active');
                const targetTab = document.getElementById(tabId + '-tab');
                if (targetTab) {
                    targetTab.classList.add('active');
                    this.loadTabContent(tabId);
                }
            });
        });

        // Logout functionality
        const logoutBtn = document.getElementById('admin-logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('currentUser');
                window.location.href = 'index.html';
            });
        }
    }

    setupEventListeners() {
        // Add car button
        const addCarBtn = document.getElementById('add-car-btn');
        if (addCarBtn) {
            addCarBtn.addEventListener('click', () => {
                this.showCarModal();
            });
        }

        // Modal close handlers
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close-modal')) {
                const modal = e.target.closest('.modal');
                if (modal) modal.style.display = 'none';
            }

            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });

        // Car form handlers
        const carForm = document.getElementById('car-form');
        if (carForm) {
            carForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveCar(new FormData(carForm));
            });
        }

        const cancelCarBtn = document.getElementById('cancel-car-form');
        if (cancelCarBtn) {
            cancelCarBtn.addEventListener('click', () => {
                document.getElementById('car-modal').style.display = 'none';
            });
        }

        // Search and filter handlers
        const carSearch = document.getElementById('car-search');
        if (carSearch) {
            carSearch.addEventListener('input', Utils.debounce(() => {
                this.filterCars();
            }, 300));
        }

        const carTypeFilter = document.getElementById('car-type-filter');
        if (carTypeFilter) {
            carTypeFilter.addEventListener('change', () => {
                this.filterCars();
            });
        }

        // Booking filters
        const bookingStatusFilter = document.getElementById('admin-booking-status-filter');
        if (bookingStatusFilter) {
            bookingStatusFilter.addEventListener('change', () => {
                this.filterBookings();
            });
        }

        const bookingDateFilter = document.getElementById('booking-date-filter');
        if (bookingDateFilter) {
            bookingDateFilter.addEventListener('change', () => {
                this.filterBookings();
            });
        }
    }

    loadTabContent(tabId) {
        switch (tabId) {
            case 'overview':
                this.renderOverview();
                break;
            case 'cars':
                this.renderCarsManagement();
                break;
            case 'bookings':
                this.renderBookingsManagement();
                break;
            case 'users':
                this.renderUsersManagement();
                break;
            case 'settings':
                this.renderSettings();
                break;
        }
    }

    renderOverview() {
        // Update stats
        document.getElementById('total-cars').textContent = this.cars.length;
        document.getElementById('total-bookings-admin').textContent = this.bookings.length;
        document.getElementById('total-users').textContent = this.users.length;
        
        const totalRevenue = this.bookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);
        document.getElementById('total-revenue').textContent = `$${totalRevenue.toLocaleString()}`;

        // You could add chart rendering here using Chart.js or similar
        this.renderOverviewCharts();
    }

    renderOverviewCharts() {
        // Placeholder for charts - in a real app, you'd use Chart.js or similar
        const chartCards = document.querySelectorAll('.chart-card .chart-placeholder');
        chartCards.forEach(card => {
            if (card.innerHTML.includes('Booking Trends')) {
                card.innerHTML = `
                    <div class="simple-chart">
                        <div class="chart-bar" style="height: 40%;" title="January"></div>
                        <div class="chart-bar" style="height: 60%;" title="February"></div>
                        <div class="chart-bar" style="height: 45%;" title="March"></div>
                        <div class="chart-bar" style="height: 80%;" title="April"></div>
                        <div class="chart-bar" style="height: 65%;" title="May"></div>
                        <div class="chart-bar" style="height: 90%;" title="June"></div>
                    </div>
                    <small>Booking trends over the last 6 months</small>
                `;
            }
        });
    }

    renderCarsManagement() {
        this.filterCars();
    }

    filterCars() {
        const searchTerm = document.getElementById('car-search')?.value.toLowerCase() || '';
        const typeFilter = document.getElementById('car-type-filter')?.value || '';

        let filteredCars = this.cars.filter(car => {
            const matchesSearch = !searchTerm || 
                car.name.toLowerCase().includes(searchTerm) ||
                car.brand.toLowerCase().includes(searchTerm);
            const matchesType = !typeFilter || car.type === typeFilter;
            
            return matchesSearch && matchesType;
        });

        this.renderCarsTable(filteredCars);
    }

    renderCarsTable(cars) {
        const tbody = document.getElementById('cars-table-body');
        if (!tbody) return;

        tbody.innerHTML = cars.map(car => `
            <tr>
                <td>
                    <div class="car-table-info">
                        <img src="${car.image}" alt="${car.name}" class="car-table-image">
                        <div>
                            <strong>${car.name}</strong>
                            <div>${car.brand}</div>
                        </div>
                    </div>
                </td>
                <td>${car.type}</td>
                <td>$${car.price}</td>
                <td>
                    <span class="status-badge ${car.available !== false ? 'active' : 'cancelled'}">
                        ${car.available !== false ? 'Available' : 'Unavailable'}
                    </span>
                </td>
                <td>
                    <div class="rating-display">
                        ${this.generateStars(car.rating)} (${car.rating})
                    </div>
                </td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn edit-btn" onclick="adminDashboard.editCar(${car.id})" title="Edit">
                            <i data-feather="edit"></i>
                        </button>
                        <button class="action-btn view-btn" onclick="window.open('details.html?id=${car.id}', '_blank')" title="View">
                            <i data-feather="eye"></i>
                        </button>
                        <button class="action-btn delete-btn" onclick="adminDashboard.deleteCar(${car.id})" title="Delete">
                            <i data-feather="trash-2"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        feather.replace();
    }

    renderBookingsManagement() {
        this.filterBookings();
    }

    filterBookings() {
        const statusFilter = document.getElementById('admin-booking-status-filter')?.value || 'all';
        const dateFilter = document.getElementById('booking-date-filter')?.value || '';

        let filteredBookings = this.bookings.filter(booking => {
            const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
            const matchesDate = !dateFilter || booking.pickupDate === dateFilter;
            
            return matchesStatus && matchesDate;
        });

        this.renderBookingsTable(filteredBookings);
    }

    renderBookingsTable(bookings) {
        const tbody = document.getElementById('bookings-table-body');
        if (!tbody) return;

        tbody.innerHTML = bookings.map(booking => `
            <tr>
                <td><strong>${booking.id}</strong></td>
                <td>
                    <div>
                        ${this.getUserName(booking.userId)}
                        <div style="font-size: 0.8em; color: var(--text-muted);">${booking.userId}</div>
                    </div>
                </td>
                <td>
                    <div>
                        ${booking.car.name}
                        <div style="font-size: 0.8em; color: var(--text-muted);">${booking.car.brand}</div>
                    </div>
                </td>
                <td>
                    <div>
                        <strong>${booking.pickupDate}</strong> to <strong>${booking.returnDate}</strong>
                        <div style="font-size: 0.8em; color: var(--text-muted);">${booking.totalDays} days</div>
                    </div>
                </td>
                <td><strong>$${booking.totalPrice}</strong></td>
                <td>
                    <span class="status-badge ${booking.status}">
                        ${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                </td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn view-btn" onclick="adminDashboard.viewBooking('${booking.id}')" title="View Details">
                            <i data-feather="eye"></i>
                        </button>
                        ${booking.status === 'active' ? `
                            <button class="action-btn delete-btn" onclick="adminDashboard.cancelBooking('${booking.id}')" title="Cancel">
                                <i data-feather="x"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');

        feather.replace();
    }

    renderUsersManagement() {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;

        tbody.innerHTML = this.users.map(user => {
            const userBookings = this.bookings.filter(b => b.userId === user.email);
            const totalSpent = userBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

            return `
                <tr>
                    <td>
                        <div>
                            <strong>${user.firstName} ${user.lastName}</strong>
                            <div style="font-size: 0.8em; color: var(--text-muted);">
                                Joined ${new Date(user.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                    </td>
                    <td>${user.email}</td>
                    <td>${user.phone || 'N/A'}</td>
                    <td>
                        <strong>${userBookings.length}</strong>
                        <div style="font-size: 0.8em; color: var(--text-muted);">
                            ${userBookings.filter(b => b.status === 'active').length} active
                        </div>
                    </td>
                    <td><strong>$${totalSpent.toLocaleString()}</strong></td>
                    <td>
                        <div class="action-btns">
                            <button class="action-btn view-btn" onclick="adminDashboard.viewUser('${user.email}')" title="View Profile">
                                <i data-feather="user"></i>
                            </button>
                            <button class="action-btn edit-btn" onclick="adminDashboard.contactUser('${user.email}')" title="Contact">
                                <i data-feather="mail"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        feather.replace();
    }

    renderSettings() {
        // Settings are already rendered in HTML, just add functionality
        const maintenanceToggle = document.getElementById('maintenance-mode');
        const registrationsToggle = document.getElementById('allow-registrations');
        const minBookingHours = document.getElementById('min-booking-hours');
        const maxAdvanceDays = document.getElementById('max-advance-days');

        // Load current settings
        const settings = JSON.parse(localStorage.getItem('adminSettings') || '{}');
        
        if (maintenanceToggle) maintenanceToggle.checked = settings.maintenanceMode || false;
        if (registrationsToggle) registrationsToggle.checked = settings.allowRegistrations !== false;
        if (minBookingHours) minBookingHours.value = settings.minBookingHours || 24;
        if (maxAdvanceDays) maxAdvanceDays.value = settings.maxAdvanceDays || 365;

        // Save settings on change
        [maintenanceToggle, registrationsToggle, minBookingHours, maxAdvanceDays].forEach(input => {
            if (input) {
                input.addEventListener('change', () => {
                    this.saveSettings();
                });
            }
        });
    }

    saveSettings() {
        const settings = {
            maintenanceMode: document.getElementById('maintenance-mode')?.checked || false,
            allowRegistrations: document.getElementById('allow-registrations')?.checked !== false,
            minBookingHours: parseInt(document.getElementById('min-booking-hours')?.value) || 24,
            maxAdvanceDays: parseInt(document.getElementById('max-advance-days')?.value) || 365
        };

        localStorage.setItem('adminSettings', JSON.stringify(settings));
        Utils.showToast('Settings saved successfully', 'success');
    }

    showCarModal(carId = null) {
        const modal = document.getElementById('car-modal');
        const title = document.getElementById('car-modal-title');
        const form = document.getElementById('car-form');

        if (!modal || !form) return;

        this.currentEditingCar = carId;

        if (carId) {
            // Edit mode
            const car = this.cars.find(c => c.id === carId);
            if (!car) return;

            title.textContent = 'Edit Car';
            this.populateCarForm(car);
        } else {
            // Add mode
            title.textContent = 'Add New Car';
            form.reset();
        }

        modal.style.display = 'block';
    }

    populateCarForm(car) {
        document.getElementById('car-name').value = car.name || '';
        document.getElementById('car-brand').value = car.brand || '';
        document.getElementById('car-type-select').value = car.type || '';
        document.getElementById('car-price').value = car.price || '';
        document.getElementById('car-image').value = car.image || '';
        document.getElementById('car-description').value = car.description || '';
        document.getElementById('car-seats').value = car.seats || '';
        document.getElementById('car-transmission').value = car.transmission || '';

        // Set features checkboxes
        document.querySelectorAll('input[name="features"]').forEach(checkbox => {
            checkbox.checked = car.features && car.features.includes(checkbox.value);
        });
    }

    saveCar(formData) {
        const carData = {
            name: formData.get('name').trim(),
            brand: formData.get('brand').trim(),
            type: formData.get('type'),
            price: parseInt(formData.get('price')),
            image: formData.get('image').trim(),
            description: formData.get('description').trim(),
            seats: parseInt(formData.get('seats')),
            transmission: formData.get('transmission'),
            features: formData.getAll('features'),
            fuelType: 'Gasoline', // Default
            rating: 4.5, // Default
            available: true
        };

        // Validation
        if (!carData.name || !carData.brand || !carData.type || !carData.price || !carData.image) {
            Utils.showToast('Please fill in all required fields', 'error');
            return;
        }

        if (carData.price < 1) {
            Utils.showToast('Price must be greater than 0', 'error');
            return;
        }

        if (this.currentEditingCar) {
            // Edit existing car
            const carIndex = this.cars.findIndex(c => c.id === this.currentEditingCar);
            if (carIndex !== -1) {
                this.cars[carIndex] = { ...this.cars[carIndex], ...carData };
                Utils.showToast('Car updated successfully', 'success');
            }
        } else {
            // Add new car
            carData.id = Math.max(...this.cars.map(c => c.id), 0) + 1;
            carData.featured = false;
            this.cars.push(carData);
            Utils.showToast('Car added successfully', 'success');
        }

        // In a real app, this would save to a backend
        // For demo purposes, we'll save to localStorage
        localStorage.setItem('adminCars', JSON.stringify(this.cars));

        document.getElementById('car-modal').style.display = 'none';
        this.renderCarsManagement();
    }

    editCar(carId) {
        this.showCarModal(carId);
    }

    deleteCar(carId) {
        if (!confirm('Are you sure you want to delete this car?')) {
            return;
        }

        const carIndex = this.cars.findIndex(c => c.id === carId);
        if (carIndex !== -1) {
            this.cars.splice(carIndex, 1);
            localStorage.setItem('adminCars', JSON.stringify(this.cars));
            Utils.showToast('Car deleted successfully', 'success');
            this.renderCarsManagement();
        }
    }

    viewBooking(bookingId) {
        const booking = this.bookings.find(b => b.id === bookingId);
        if (!booking) return;

        const details = `
            Booking ID: ${booking.id}
            Customer: ${this.getUserName(booking.userId)}
            Car: ${booking.car.name}
            Pickup: ${booking.pickupDate} at ${booking.pickupTime}
            Return: ${booking.returnDate} at ${booking.returnTime}
            Location: ${booking.pickupLocation}
            Total: $${booking.totalPrice}
            Status: ${booking.status}
        `;

        alert(details);
    }

    cancelBooking(bookingId) {
        if (!confirm('Are you sure you want to cancel this booking?')) {
            return;
        }

        const bookingIndex = this.bookings.findIndex(b => b.id === bookingId);
        if (bookingIndex !== -1) {
            this.bookings[bookingIndex].status = 'cancelled';
            localStorage.setItem('userBookings', JSON.stringify(this.bookings));
            Utils.showToast('Booking cancelled successfully', 'success');
            this.renderBookingsManagement();
        }
    }

    viewUser(userEmail) {
        const user = this.users.find(u => u.email === userEmail);
        if (!user) return;

        const userBookings = this.bookings.filter(b => b.userId === userEmail);
        const totalSpent = userBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

        const details = `
            Name: ${user.firstName} ${user.lastName}
            Email: ${user.email}
            Phone: ${user.phone || 'N/A'}
            Joined: ${new Date(user.createdAt).toLocaleDateString()}
            Total Bookings: ${userBookings.length}
            Total Spent: $${totalSpent}
        `;

        alert(details);
    }

    contactUser(userEmail) {
        const user = this.users.find(u => u.email === userEmail);
        if (!user) return;

        // In a real app, this would open an email client or messaging system
        const subject = encodeURIComponent('Message from Vrooom Car Rental');
        const body = encodeURIComponent(`Dear ${user.firstName},\n\n`);
        
        window.open(`mailto:${userEmail}?subject=${subject}&body=${body}`);
    }

    getUserName(userEmail) {
        const user = this.users.find(u => u.email === userEmail);
        return user ? `${user.firstName} ${user.lastName}` : userEmail;
    }

    generateStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        return '★'.repeat(fullStars) + 
               (hasHalfStar ? '☆' : '') + 
               '☆'.repeat(emptyStars);
    }
}

// Initialize admin dashboard
const adminDashboard = new AdminDashboardManager();

// Make it globally accessible for onclick handlers
window.adminDashboard = adminDashboard;

// Add some CSS for the simple chart
const style = document.createElement('style');
style.textContent = `
    .simple-chart {
        display: flex;
        align-items: end;
        justify-content: space-around;
        height: 100px;
        margin: 1rem 0;
    }
    
    .chart-bar {
        width: 20px;
        background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
        border-radius: 4px 4px 0 0;
        transition: all 0.3s ease;
        cursor: pointer;
    }
    
    .chart-bar:hover {
        opacity: 0.8;
        transform: scale(1.05);
    }
    
    .rating-display {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.9rem;
    }
`;
document.head.appendChild(style);
