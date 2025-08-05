// Car listing page functionality
import { Utils } from './main.js';

class CarListingManager {
    constructor() {
        this.cars = [];
        this.filteredCars = [];
        this.currentFilters = {
            type: '',
            maxPrice: 500,
            minRating: 0,
            features: []
        };
        this.currentSort = 'name';
        this.init();
    }

    async init() {
        await this.loadCars();
        this.setupFilters();
        this.setupSorting();
        this.setupSearch();
        this.applyUrlFilters();
        this.renderCars();
    }

    async loadCars() {
        try {
            const response = await fetch('data/cars.json');
            this.cars = await response.json();
            this.filteredCars = [...this.cars];
        } catch (error) {
            console.error('Failed to load cars:', error);
            this.showError('Failed to load car data');
        }
    }

    setupFilters() {
        // Car type filter
        const typeFilter = document.getElementById('car-type');
        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                this.currentFilters.type = e.target.value;
                this.applyFilters();
            });
        }

        // Price range filter
        const priceRange = document.getElementById('price-range');
        const priceDisplay = document.getElementById('price-value');
        if (priceRange && priceDisplay) {
            priceRange.addEventListener('input', (e) => {
                const value = e.target.value;
                priceDisplay.textContent = value;
                this.currentFilters.maxPrice = parseInt(value);
                this.debounceFilter();
            });
        }

        // Rating filter
        this.setupRatingFilter();

        // Features filter
        const featureFilters = document.querySelectorAll('.feature-filter');
        featureFilters.forEach(filter => {
            filter.addEventListener('change', () => {
                this.updateFeatureFilters();
                this.applyFilters();
            });
        });

        // Clear filters button
        const clearBtn = document.getElementById('clear-filters');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }
    }

    setupRatingFilter() {
        const ratingStars = document.querySelectorAll('.star-rating .star');
        ratingStars.forEach((star, index) => {
            star.addEventListener('click', () => {
                const rating = index + 1;
                this.currentFilters.minRating = rating;
                
                // Update visual state
                ratingStars.forEach((s, i) => {
                    s.classList.toggle('active', i < rating);
                });
                
                this.applyFilters();
            });

            star.addEventListener('mouseenter', () => {
                ratingStars.forEach((s, i) => {
                    s.style.color = i <= index ? '#f59e0b' : '#64748b';
                });
            });
        });

        const ratingContainer = document.querySelector('.star-rating');
        if (ratingContainer) {
            ratingContainer.addEventListener('mouseleave', () => {
                this.updateRatingDisplay();
            });
        }
    }

    updateRatingDisplay() {
        const stars = document.querySelectorAll('.star-rating .star');
        stars.forEach((star, index) => {
            const isActive = index < this.currentFilters.minRating;
            star.style.color = isActive ? '#f59e0b' : '#64748b';
        });
    }

    updateFeatureFilters() {
        const checkedFeatures = document.querySelectorAll('.feature-filter:checked');
        this.currentFilters.features = Array.from(checkedFeatures).map(input => input.value);
    }

    setupSorting() {
        const sortSelect = document.getElementById('sort-by');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.sortAndRender();
            });
        }
    }

    setupSearch() {
        const searchInput = document.getElementById('car-search');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.currentFilters.search = e.target.value.toLowerCase();
                this.applyFilters();
            }, 300));
        }
    }

    applyUrlFilters() {
        const urlParams = new URLSearchParams(window.location.search);
        
        // Apply filters from URL parameters
        if (urlParams.has('type')) {
            this.currentFilters.type = urlParams.get('type');
            const typeSelect = document.getElementById('car-type');
            if (typeSelect) typeSelect.value = this.currentFilters.type;
        }

        if (urlParams.has('maxPrice')) {
            this.currentFilters.maxPrice = parseInt(urlParams.get('maxPrice'));
            const priceRange = document.getElementById('price-range');
            const priceDisplay = document.getElementById('price-value');
            if (priceRange) priceRange.value = this.currentFilters.maxPrice;
            if (priceDisplay) priceDisplay.textContent = this.currentFilters.maxPrice;
        }

        // Store search location for booking
        if (urlParams.has('location')) {
            sessionStorage.setItem('searchLocation', urlParams.get('location'));
            sessionStorage.setItem('searchDate', urlParams.get('pickupDate') || '');
            sessionStorage.setItem('searchTime', urlParams.get('pickupTime') || '');
        }
    }

    debounceFilter = Utils.debounce(() => {
        this.applyFilters();
    }, 300);

    applyFilters() {
        this.showLoading(true);
        
        setTimeout(() => {
            this.filteredCars = this.cars.filter(car => {
                const matchesType = !this.currentFilters.type || car.type === this.currentFilters.type;
                const matchesPrice = car.price <= this.currentFilters.maxPrice;
                const matchesRating = car.rating >= this.currentFilters.minRating;
                const matchesFeatures = this.currentFilters.features.length === 0 || 
                    this.currentFilters.features.every(feature => car.features.includes(feature));
                const matchesSearch = !this.currentFilters.search || 
                    car.name.toLowerCase().includes(this.currentFilters.search) ||
                    car.brand.toLowerCase().includes(this.currentFilters.search) ||
                    car.type.toLowerCase().includes(this.currentFilters.search);
                
                return matchesType && matchesPrice && matchesRating && matchesFeatures && matchesSearch;
            });

            this.sortAndRender();
            this.showLoading(false);
        }, 500); // Simulate loading time
    }

    sortAndRender() {
        // Sort filtered cars
        this.filteredCars.sort((a, b) => {
            switch (this.currentSort) {
                case 'price-low':
                    return a.price - b.price;
                case 'price-high':
                    return b.price - a.price;
                case 'rating':
                    return b.rating - a.rating;
                case 'name':
                default:
                    return a.name.localeCompare(b.name);
            }
        });

        this.renderCars();
    }

    renderCars() {
        const container = document.getElementById('cars-grid');
        const resultsCount = document.getElementById('results-count');
        const noResults = document.getElementById('no-results');

        if (!container) return;

        // Update results count
        if (resultsCount) {
            resultsCount.textContent = `${this.filteredCars.length} cars found`;
        }

        if (this.filteredCars.length === 0) {
            container.style.display = 'none';
            if (noResults) noResults.style.display = 'block';
            return;
        }

        container.style.display = 'grid';
        if (noResults) noResults.style.display = 'none';

        container.innerHTML = this.filteredCars.map(car => `
            <div class="car-card glass" data-car-id="${car.id}">
                <img src="${car.image}" alt="${car.name}" class="car-image">
                <div class="car-info">
                    <h3>${car.name}</h3>
                    <p class="car-brand">${car.brand}</p>
                    <div class="car-specs">
                        <span><i data-feather="users"></i> ${car.seats} seats</span>
                        <span><i data-feather="settings"></i> ${car.transmission}</span>
                        <span><i data-feather="zap"></i> ${car.fuelType}</span>
                    </div>
                    <div class="car-rating">
                        <div class="stars">${this.generateStars(car.rating)}</div>
                        <span>(${car.rating})</span>
                    </div>
                    <div class="car-features">
                        ${car.features.slice(0, 3).map(feature => `
                            <span class="feature-tag">${feature}</span>
                        `).join('')}
                    </div>
                    <div class="car-price">$${car.price}/day</div>
                    <div class="car-actions">
                        <button class="rent-btn ripple-btn" onclick="location.href='details.html?id=${car.id}'">
                            View Details
                        </button>
                        <button class="quick-book-btn" onclick="carListing.showBookingModal(${car.id})">
                            Quick Book
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        // Re-initialize feather icons
        feather.replace();

        // Add hover effects and animations
        this.addCardAnimations();
    }

    generateStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        return '★'.repeat(fullStars) + 
               (hasHalfStar ? '☆' : '') + 
               '☆'.repeat(emptyStars);
    }

    addCardAnimations() {
        const cards = document.querySelectorAll('.car-card');
        cards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
            card.classList.add('slide-in-up');
        });
    }

    showBookingModal(carId) {
        const car = this.cars.find(c => c.id === carId);
        if (!car) return;

        const modal = document.getElementById('booking-modal');
        const modalBody = document.getElementById('booking-modal-body');

        if (!modal || !modalBody) return;

        // Pre-fill with search data if available
        const searchLocation = sessionStorage.getItem('searchLocation') || '';
        const searchDate = sessionStorage.getItem('searchDate') || '';
        const searchTime = sessionStorage.getItem('searchTime') || '';

        modalBody.innerHTML = `
            <div class="booking-form">
                <div class="car-summary">
                    <img src="${car.image}" alt="${car.name}" class="booking-car-image">
                    <div class="car-info">
                        <h4>${car.name}</h4>
                        <p class="car-price">$${car.price}/day</p>
                    </div>
                </div>
                
                <form id="quick-booking-form">
                    <div class="form-group">
                        <label for="pickup-location">Pickup Location</label>
                        <input type="text" id="pickup-location" value="${searchLocation}" required>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="pickup-date">Pickup Date</label>
                            <input type="date" id="pickup-date" value="${searchDate}" required min="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="form-group">
                            <label for="pickup-time">Pickup Time</label>
                            <input type="time" id="pickup-time" value="${searchTime}" required>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="return-date">Return Date</label>
                            <input type="date" id="return-date" required>
                        </div>
                        <div class="form-group">
                            <label for="return-time">Return Time</label>
                            <input type="time" id="return-time" required>
                        </div>
                    </div>
                    
                    <div class="booking-summary">
                        <div class="summary-row">
                            <span>Duration:</span>
                            <span id="booking-duration">-</span>
                        </div>
                        <div class="summary-row">
                            <span>Daily Rate:</span>
                            <span>$${car.price}</span>
                        </div>
                        <div class="summary-row total">
                            <span>Total:</span>
                            <span id="booking-total">$0</span>
                        </div>
                    </div>
                    
                    <div class="modal-actions">
                        <button type="button" class="btn-secondary" onclick="carListing.closeBookingModal()">Cancel</button>
                        <button type="submit" class="btn-primary">Continue to Payment</button>
                    </div>
                </form>
            </div>
        `;

        modal.style.display = 'block';
        this.setupBookingForm(car);
    }

    setupBookingForm(car) {
        const form = document.getElementById('quick-booking-form');
        const pickupDate = document.getElementById('pickup-date');
        const returnDate = document.getElementById('return-date');
        
        // Calculate total when dates change
        const updateTotal = () => {
            if (pickupDate.value && returnDate.value) {
                const days = Utils.calculateDaysBetween(pickupDate.value, returnDate.value);
                const total = days * car.price;
                
                document.getElementById('booking-duration').textContent = `${days} day${days !== 1 ? 's' : ''}`;
                document.getElementById('booking-total').textContent = `$${total}`;
            }
        };

        pickupDate.addEventListener('change', updateTotal);
        returnDate.addEventListener('change', updateTotal);

        // Set minimum return date
        pickupDate.addEventListener('change', (e) => {
            returnDate.min = e.target.value;
            if (returnDate.value && returnDate.value < e.target.value) {
                returnDate.value = e.target.value;
            }
            updateTotal();
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.processBooking(car, new FormData(form));
        });

        // Initial calculation
        updateTotal();
    }

    processBooking(car, formData) {
        // Check if user is logged in
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            Utils.showToast('Please log in to book a car', 'warning');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            return;
        }

        // Create booking data
        const pickupDate = document.getElementById('pickup-date').value;
        const returnDate = document.getElementById('return-date').value;
        const days = Utils.calculateDaysBetween(pickupDate, returnDate);
        
        const bookingData = {
            userId: currentUser.email,
            car: car,
            pickupDate: pickupDate,
            returnDate: returnDate,
            pickupTime: document.getElementById('pickup-time').value,
            returnTime: document.getElementById('return-time').value,
            pickupLocation: document.getElementById('pickup-location').value,
            totalDays: days,
            totalPrice: days * car.price
        };

        // Store booking data for payment
        sessionStorage.setItem('pendingBooking', JSON.stringify(bookingData));
        
        // Navigate to payment or show payment modal
        this.showPaymentModal(bookingData);
    }

    showPaymentModal(bookingData) {
        // Close booking modal
        this.closeBookingModal();
        
        // Show payment simulation
        setTimeout(() => {
            const success = Math.random() > 0.2; // 80% success rate
            
            if (success) {
                // Create booking
                window.AppManagers.booking.createBooking(bookingData);
                Utils.showToast('Booking confirmed successfully!', 'success');
                
                setTimeout(() => {
                    window.location.href = 'user-dashboard.html';
                }, 2000);
            } else {
                Utils.showToast('Payment failed. Please try again.', 'error');
            }
        }, 2000);
        
        Utils.showToast('Processing payment...', 'info');
    }

    closeBookingModal() {
        const modal = document.getElementById('booking-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    clearAllFilters() {
        // Reset filter values
        this.currentFilters = {
            type: '',
            maxPrice: 500,
            minRating: 0,
            features: []
        };

        // Reset UI elements
        const typeFilter = document.getElementById('car-type');
        if (typeFilter) typeFilter.value = '';

        const priceRange = document.getElementById('price-range');
        const priceDisplay = document.getElementById('price-value');
        if (priceRange) priceRange.value = 500;
        if (priceDisplay) priceDisplay.textContent = '500';

        // Reset rating stars
        const stars = document.querySelectorAll('.star-rating .star');
        stars.forEach(star => star.classList.remove('active'));

        // Reset feature checkboxes
        const featureFilters = document.querySelectorAll('.feature-filter');
        featureFilters.forEach(filter => filter.checked = false);

        // Reset search
        const searchInput = document.getElementById('car-search');
        if (searchInput) searchInput.value = '';

        this.applyFilters();
        Utils.showToast('Filters cleared', 'info');
    }

    showLoading(show) {
        const spinner = document.getElementById('loading-spinner');
        const container = document.getElementById('cars-grid');
        
        if (spinner) {
            spinner.style.display = show ? 'flex' : 'none';
        }
        if (container) {
            container.style.opacity = show ? '0.5' : '1';
        }
    }

    showError(message) {
        const container = document.getElementById('cars-grid');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <i data-feather="alert-triangle"></i>
                    <h3>Error</h3>
                    <p>${message}</p>
                    <button onclick="location.reload()" class="btn-primary">Retry</button>
                </div>
            `;
            feather.replace();
        }
    }
}

// Modal close handlers
document.addEventListener('DOMContentLoaded', function() {
    // Close modal when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });

    // Close modal buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('close-modal')) {
            const modal = e.target.closest('.modal');
            if (modal) modal.style.display = 'none';
        }
    });
});

// Initialize car listing manager
const carListing = new CarListingManager();

// Make it globally accessible for onclick handlers
window.carListing = carListing;
