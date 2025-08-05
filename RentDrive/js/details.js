// Car details page functionality
import { Utils } from './main.js';

class CarDetailsManager {
    constructor() {
        this.car = null;
        this.currentImageIndex = 0;
        this.reviews = [];
        this.init();
    }

    async init() {
        const urlParams = new URLSearchParams(window.location.search);
        const carId = urlParams.get('id');
        
        if (!carId) {
            this.showError('Car not found');
            return;
        }

        await this.loadCarDetails(carId);
        this.setupImageGallery();
        this.setupBookingModal();
        this.loadReviews();
    }

    async loadCarDetails(carId) {
        try {
            const response = await fetch('data/cars.json');
            const cars = await response.json();
            this.car = cars.find(car => car.id === parseInt(carId));
            
            if (!this.car) {
                this.showError('Car not found');
                return;
            }

            this.renderCarDetails();
            this.updateBreadcrumb();
        } catch (error) {
            console.error('Failed to load car details:', error);
            this.showError('Failed to load car details');
        }
    }

    renderCarDetails() {
        const container = document.getElementById('car-details-content');
        if (!container) return;

        container.innerHTML = `
            <div class="car-details-grid">
                <div class="car-gallery">
                    <img src="${this.car.image}" alt="${this.car.name}" class="main-image" id="main-image">
                    <div class="gallery-thumbnails">
                        ${this.car.gallery ? this.car.gallery.map((img, index) => `
                            <img src="${img}" alt="${this.car.name} ${index + 1}" 
                                 class="thumbnail ${index === 0 ? 'active' : ''}" 
                                 data-index="${index}">
                        `).join('') : `<img src="${this.car.image}" alt="${this.car.name}" class="thumbnail active" data-index="0">`}
                    </div>
                </div>

                <div class="car-info glass">
                    <h1 class="car-title">${this.car.name}</h1>
                    <p class="car-brand">${this.car.brand} • ${this.car.type}</p>
                    <div class="car-price-display">$${this.car.price}/day</div>
                    
                    <div class="car-rating-display">
                        <div class="rating-stars">${this.generateStars(this.car.rating)}</div>
                        <span class="rating-text">(${this.car.rating}/5 - ${this.car.reviewCount || 0} reviews)</span>
                    </div>

                    <div class="specs-grid">
                        <div class="spec-item">
                            <i data-feather="users"></i>
                            <span>${this.car.seats} Seats</span>
                        </div>
                        <div class="spec-item">
                            <i data-feather="settings"></i>
                            <span>${this.car.transmission}</span>
                        </div>
                        <div class="spec-item">
                            <i data-feather="zap"></i>
                            <span>${this.car.fuelType}</span>
                        </div>
                        <div class="spec-item">
                            <i data-feather="shield"></i>
                            <span>Insurance Included</span>
                        </div>
                    </div>

                    <div class="features-list">
                        <h4>Features & Amenities</h4>
                        <div class="features-grid">
                            ${this.car.features.map(feature => `
                                <div class="feature-item">
                                    <i data-feather="check"></i>
                                    <span>${this.capitalizeFirst(feature)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <button class="book-now-btn ripple-btn" id="book-now-btn">
                        <i data-feather="calendar"></i>
                        Book Now
                    </button>
                </div>
            </div>

            <div class="car-description glass">
                <h3>About This Car</h3>
                <p>${this.car.description || `Experience luxury and comfort with the ${this.car.name}. This ${this.car.type} offers exceptional performance, style, and reliability for your journey. Perfect for ${this.car.seats} passengers with modern amenities and safety features.`}</p>
            </div>

            <div class="car-reviews glass">
                <h3>Customer Reviews</h3>
                <div class="reviews-container" id="reviews-container">
                    <!-- Reviews will be loaded here -->
                </div>
            </div>
        `;

        // Initialize feather icons
        feather.replace();

        // Setup book now button
        document.getElementById('book-now-btn').addEventListener('click', () => {
            this.showBookingModal();
        });
    }

    updateBreadcrumb() {
        const breadcrumb = document.getElementById('car-name-breadcrumb');
        if (breadcrumb && this.car) {
            breadcrumb.textContent = this.car.name;
        }
    }

    setupImageGallery() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('main-image')) {
                this.openGalleryModal();
            }

            if (e.target.classList.contains('thumbnail')) {
                const index = parseInt(e.target.dataset.index);
                this.changeMainImage(index);
            }
        });
    }

    changeMainImage(index) {
        const mainImage = document.getElementById('main-image');
        const thumbnails = document.querySelectorAll('.thumbnail');
        
        if (this.car.gallery && this.car.gallery[index]) {
            mainImage.src = this.car.gallery[index];
        } else if (index === 0) {
            mainImage.src = this.car.image;
        }

        thumbnails.forEach(thumb => thumb.classList.remove('active'));
        thumbnails[index]?.classList.add('active');
        
        this.currentImageIndex = index;
    }

    openGalleryModal() {
        const modal = document.getElementById('gallery-modal');
        const galleryImage = document.getElementById('gallery-image');
        const thumbnailsContainer = document.getElementById('gallery-thumbnails');
        
        if (!modal) return;

        // Set initial image
        const images = this.car.gallery || [this.car.image];
        galleryImage.src = images[this.currentImageIndex];

        // Create thumbnails
        thumbnailsContainer.innerHTML = images.map((img, index) => `
            <img src="${img}" alt="${this.car.name} ${index + 1}" 
                 class="thumbnail ${index === this.currentImageIndex ? 'active' : ''}" 
                 onclick="carDetails.setGalleryImage(${index})">
        `).join('');

        modal.style.display = 'block';
        this.setupGalleryNavigation(images);
    }

    setupGalleryNavigation(images) {
        const prevBtn = document.getElementById('gallery-prev');
        const nextBtn = document.getElementById('gallery-next');

        prevBtn.onclick = () => {
            this.currentImageIndex = this.currentImageIndex > 0 ? this.currentImageIndex - 1 : images.length - 1;
            this.setGalleryImage(this.currentImageIndex);
        };

        nextBtn.onclick = () => {
            this.currentImageIndex = this.currentImageIndex < images.length - 1 ? this.currentImageIndex + 1 : 0;
            this.setGalleryImage(this.currentImageIndex);
        };

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (document.getElementById('gallery-modal').style.display === 'block') {
                if (e.key === 'ArrowLeft') prevBtn.click();
                if (e.key === 'ArrowRight') nextBtn.click();
                if (e.key === 'Escape') this.closeGalleryModal();
            }
        });
    }

    setGalleryImage(index) {
        const images = this.car.gallery || [this.car.image];
        const galleryImage = document.getElementById('gallery-image');
        const thumbnails = document.querySelectorAll('#gallery-thumbnails .thumbnail');

        galleryImage.src = images[index];
        thumbnails.forEach(thumb => thumb.classList.remove('active'));
        thumbnails[index]?.classList.add('active');
        
        this.currentImageIndex = index;
    }

    closeGalleryModal() {
        const modal = document.getElementById('gallery-modal');
        if (modal) modal.style.display = 'none';
    }

    loadReviews() {
        // Generate sample reviews based on car rating
        const reviewCount = this.car.reviewCount || Math.floor(Math.random() * 50) + 10;
        const reviews = this.generateSampleReviews(reviewCount);
        
        const container = document.getElementById('reviews-container');
        if (!container) return;

        if (reviews.length === 0) {
            container.innerHTML = `
                <div class="empty-reviews">
                    <i data-feather="message-circle"></i>
                    <p>No reviews yet. Be the first to review this car!</p>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="reviews-summary">
                    <div class="rating-breakdown">
                        <div class="overall-rating">
                            <span class="rating-number">${this.car.rating}</span>
                            <div class="rating-stars">${this.generateStars(this.car.rating)}</div>
                            <p>${reviewCount} reviews</p>
                        </div>
                    </div>
                </div>
                <div class="reviews-list">
                    ${reviews.slice(0, 5).map(review => `
                        <div class="review-item">
                            <div class="review-header">
                                <div class="reviewer-info">
                                    <div class="reviewer-avatar">
                                        ${review.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h5>${review.name}</h5>
                                        <div class="review-rating">${this.generateStars(review.rating)}</div>
                                    </div>
                                </div>
                                <span class="review-date">${review.date}</span>
                            </div>
                            <p class="review-text">${review.text}</p>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        feather.replace();
    }

    generateSampleReviews(count) {
        const reviewTemplates = [
            "Great car, very comfortable and clean. Highly recommend!",
            "Excellent service and the car was in perfect condition.",
            "Smooth ride and great fuel efficiency. Will book again.",
            "Perfect for our family trip. Spacious and reliable.",
            "Good value for money. The car exceeded our expectations.",
            "Very satisfied with the booking process and the car quality.",
            "Clean, comfortable, and exactly as described. Great experience!",
            "Excellent customer service and a fantastic vehicle.",
            "The car was well-maintained and a pleasure to drive.",
            "Perfect choice for our vacation. Highly recommended!"
        ];

        const names = [
            "John Smith", "Sarah Johnson", "Mike Chen", "Emma Davis",
            "David Wilson", "Lisa Brown", "Tom Anderson", "Amy Taylor",
            "Chris Martinez", "Jennifer Garcia", "Robert Miller", "Maria Rodriguez"
        ];

        const reviews = [];
        for (let i = 0; i < Math.min(count, 12); i++) {
            const rating = Math.random() > 0.3 ? 
                Math.floor(Math.random() * 2) + 4 : // Mostly 4-5 stars
                Math.floor(Math.random() * 3) + 2;   // Some 2-4 stars

            const daysAgo = Math.floor(Math.random() * 365);
            const date = new Date();
            date.setDate(date.getDate() - daysAgo);

            reviews.push({
                name: names[i % names.length],
                rating: rating,
                text: reviewTemplates[i % reviewTemplates.length],
                date: date.toLocaleDateString()
            });
        }

        return reviews.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    setupBookingModal() {
        // Modal close handlers
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close-modal')) {
                const modal = e.target.closest('.modal');
                if (modal) modal.style.display = 'none';
            }
        });

        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    showBookingModal() {
        const modal = document.getElementById('booking-modal');
        const modalBody = document.getElementById('booking-modal-body');

        if (!modal || !modalBody || !this.car) return;

        // Pre-fill with search data if available
        const searchLocation = sessionStorage.getItem('searchLocation') || '';
        const searchDate = sessionStorage.getItem('searchDate') || '';
        const searchTime = sessionStorage.getItem('searchTime') || '10:00';

        modalBody.innerHTML = `
            <div class="booking-form">
                <div class="car-summary">
                    <img src="${this.car.image}" alt="${this.car.name}" class="booking-car-image">
                    <div class="car-info">
                        <h4>${this.car.name}</h4>
                        <p class="car-price">$${this.car.price}/day</p>
                        <div class="car-rating">
                            ${this.generateStars(this.car.rating)} (${this.car.rating})
                        </div>
                    </div>
                </div>
                
                <form id="booking-form">
                    <div class="form-group">
                        <label for="pickup-location">Pickup Location</label>
                        <div class="input-group">
                            <i data-feather="map-pin"></i>
                            <input type="text" id="pickup-location" value="${searchLocation}" required>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="pickup-date">Pickup Date</label>
                            <div class="input-group">
                                <i data-feather="calendar"></i>
                                <input type="date" id="pickup-date" value="${searchDate}" required min="${new Date().toISOString().split('T')[0]}">
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="pickup-time">Pickup Time</label>
                            <div class="input-group">
                                <i data-feather="clock"></i>
                                <input type="time" id="pickup-time" value="${searchTime}" required>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="return-date">Return Date</label>
                            <div class="input-group">
                                <i data-feather="calendar"></i>
                                <input type="date" id="return-date" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="return-time">Return Time</label>
                            <div class="input-group">
                                <i data-feather="clock"></i>
                                <input type="time" id="return-time" value="${searchTime}" required>
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="driver-age">Driver Age</label>
                        <div class="input-group">
                            <i data-feather="user"></i>
                            <select id="driver-age" required>
                                <option value="">Select Age Range</option>
                                <option value="21-24">21-24 years</option>
                                <option value="25-64">25-64 years</option>
                                <option value="65+">65+ years</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="extras-section">
                        <h4>Add Extras</h4>
                        <div class="extras-list">
                            <label class="checkbox-label">
                                <input type="checkbox" name="extras" value="gps" data-price="5">
                                <span class="checkmark"></span>
                                GPS Navigation (+$5/day)
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" name="extras" value="insurance" data-price="15">
                                <span class="checkmark"></span>
                                Full Coverage Insurance (+$15/day)
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" name="extras" value="child-seat" data-price="8">
                                <span class="checkmark"></span>
                                Child Safety Seat (+$8/day)
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" name="extras" value="wifi" data-price="3">
                                <span class="checkmark"></span>
                                WiFi Hotspot (+$3/day)
                            </label>
                        </div>
                    </div>
                    
                    <div class="booking-summary">
                        <div class="summary-row">
                            <span>Duration:</span>
                            <span id="booking-duration">-</span>
                        </div>
                        <div class="summary-row">
                            <span>Car Rental (${this.car.price}/day):</span>
                            <span id="car-total">$0</span>
                        </div>
                        <div class="summary-row">
                            <span>Extras:</span>
                            <span id="extras-total">$0</span>
                        </div>
                        <div class="summary-row">
                            <span>Taxes & Fees:</span>
                            <span id="tax-total">$0</span>
                        </div>
                        <div class="summary-row total">
                            <span>Total Amount:</span>
                            <span id="booking-total">$0</span>
                        </div>
                    </div>
                    
                    <div class="modal-actions">
                        <button type="button" class="btn-secondary" onclick="carDetails.closeBookingModal()">Cancel</button>
                        <button type="submit" class="btn-primary ripple-btn">Continue to Payment</button>
                    </div>
                </form>
            </div>
        `;

        feather.replace();
        modal.style.display = 'block';
        this.setupBookingForm();
    }

    setupBookingForm() {
        const form = document.getElementById('booking-form');
        const pickupDate = document.getElementById('pickup-date');
        const returnDate = document.getElementById('return-date');
        const extrasCheckboxes = document.querySelectorAll('input[name="extras"]');
        
        // Update total when dates or extras change
        const updateTotal = () => {
            if (pickupDate.value && returnDate.value) {
                const pickup = new Date(pickupDate.value);
                const returnD = new Date(returnDate.value);
                
                if (returnD <= pickup) {
                    return;
                }

                const days = Utils.calculateDaysBetween(pickupDate.value, returnDate.value);
                const carTotal = days * this.car.price;
                
                // Calculate extras
                let extrasTotal = 0;
                extrasCheckboxes.forEach(checkbox => {
                    if (checkbox.checked) {
                        extrasTotal += parseInt(checkbox.dataset.price) * days;
                    }
                });

                const taxRate = 0.12; // 12% tax
                const taxTotal = Math.round((carTotal + extrasTotal) * taxRate);
                const total = carTotal + extrasTotal + taxTotal;
                
                document.getElementById('booking-duration').textContent = `${days} day${days !== 1 ? 's' : ''}`;
                document.getElementById('car-total').textContent = `$${carTotal}`;
                document.getElementById('extras-total').textContent = `$${extrasTotal}`;
                document.getElementById('tax-total').textContent = `$${taxTotal}`;
                document.getElementById('booking-total').textContent = `$${total}`;
            }
        };

        // Event listeners
        pickupDate.addEventListener('change', (e) => {
            returnDate.min = e.target.value;
            if (returnDate.value && returnDate.value <= e.target.value) {
                const nextDay = new Date(e.target.value);
                nextDay.setDate(nextDay.getDate() + 1);
                returnDate.value = nextDay.toISOString().split('T')[0];
            }
            updateTotal();
        });

        returnDate.addEventListener('change', updateTotal);
        extrasCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', updateTotal);
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.processBooking(new FormData(form));
        });

        // Initial calculation
        updateTotal();
    }

    processBooking(formData) {
        // Check if user is logged in
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            Utils.showToast('Please log in to book a car', 'warning');
            setTimeout(() => {
                window.location.href = `login.html?redirect=${encodeURIComponent(window.location.href)}`;
            }, 2000);
            return;
        }

        // Validate form
        const pickupDate = document.getElementById('pickup-date').value;
        const returnDate = document.getElementById('return-date').value;
        const driverAge = document.getElementById('driver-age').value;

        if (!pickupDate || !returnDate || !driverAge) {
            Utils.showToast('Please fill in all required fields', 'error');
            return;
        }

        const days = Utils.calculateDaysBetween(pickupDate, returnDate);
        if (days <= 0) {
            Utils.showToast('Return date must be after pickup date', 'error');
            return;
        }

        // Calculate totals
        const carTotal = days * this.car.price;
        let extrasTotal = 0;
        const selectedExtras = [];

        document.querySelectorAll('input[name="extras"]:checked').forEach(checkbox => {
            const extraCost = parseInt(checkbox.dataset.price) * days;
            extrasTotal += extraCost;
            selectedExtras.push({
                name: checkbox.value,
                dailyPrice: parseInt(checkbox.dataset.price),
                totalPrice: extraCost
            });
        });

        const taxTotal = Math.round((carTotal + extrasTotal) * 0.12);
        const total = carTotal + extrasTotal + taxTotal;

        // Create booking data
        const bookingData = {
            userId: currentUser.email,
            car: this.car,
            pickupDate: pickupDate,
            returnDate: returnDate,
            pickupTime: document.getElementById('pickup-time').value,
            returnTime: document.getElementById('return-time').value,
            pickupLocation: document.getElementById('pickup-location').value,
            driverAge: driverAge,
            extras: selectedExtras,
            totalDays: days,
            carTotal: carTotal,
            extrasTotal: extrasTotal,
            taxTotal: taxTotal,
            totalPrice: total
        };

        // Store booking data for payment
        sessionStorage.setItem('pendingBooking', JSON.stringify(bookingData));
        
        // Show payment modal
        this.showPaymentModal(bookingData);
    }

    showPaymentModal(bookingData) {
        const modal = document.getElementById('payment-modal');
        const modalBody = document.getElementById('payment-modal-body');

        if (!modal || !modalBody) return;

        modalBody.innerHTML = `
            <div class="payment-form">
                <div class="booking-summary-final">
                    <h4>Booking Summary</h4>
                    <div class="summary-item">
                        <span>${bookingData.car.name}</span>
                        <span>$${bookingData.carTotal}</span>
                    </div>
                    ${bookingData.extras.map(extra => `
                        <div class="summary-item">
                            <span>${this.capitalizeFirst(extra.name.replace('-', ' '))}</span>
                            <span>$${extra.totalPrice}</span>
                        </div>
                    `).join('')}
                    <div class="summary-item">
                        <span>Taxes & Fees</span>
                        <span>$${bookingData.taxTotal}</span>
                    </div>
                    <div class="summary-item total">
                        <span>Total</span>
                        <span>$${bookingData.totalPrice}</span>
                    </div>
                </div>

                <form id="payment-form">
                    <h4>Payment Information</h4>
                    
                    <div class="payment-methods">
                        <label class="payment-method active">
                            <input type="radio" name="payment-method" value="card" checked>
                            <div class="method-content">
                                <i data-feather="credit-card"></i>
                                <span>Credit/Debit Card</span>
                            </div>
                        </label>
                        <label class="payment-method">
                            <input type="radio" name="payment-method" value="paypal">
                            <div class="method-content">
                                <i data-feather="smartphone"></i>
                                <span>PayPal</span>
                            </div>
                        </label>
                    </div>

                    <div class="card-details" id="card-details">
                        <div class="form-group">
                            <label for="card-number">Card Number</label>
                            <div class="input-group">
                                <i data-feather="credit-card"></i>
                                <input type="text" id="card-number" placeholder="1234 5678 9012 3456" maxlength="19" required>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="expiry">Expiry Date</label>
                                <div class="input-group">
                                    <i data-feather="calendar"></i>
                                    <input type="text" id="expiry" placeholder="MM/YY" maxlength="5" required>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="cvv">CVV</label>
                                <div class="input-group">
                                    <i data-feather="shield"></i>
                                    <input type="text" id="cvv" placeholder="123" maxlength="4" required>
                                </div>
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="cardholder-name">Cardholder Name</label>
                            <div class="input-group">
                                <i data-feather="user"></i>
                                <input type="text" id="cardholder-name" value="${bookingData.userId}" required>
                            </div>
                        </div>
                    </div>

                    <div class="payment-actions">
                        <button type="button" class="btn-secondary" onclick="carDetails.closePaymentModal()">Cancel</button>
                        <button type="submit" class="btn-primary ripple-btn" id="pay-now-btn">
                            <i data-feather="lock"></i>
                            Pay $${bookingData.totalPrice}
                        </button>
                    </div>
                </form>
            </div>
        `;

        feather.replace();
        this.closeBookingModal();
        modal.style.display = 'block';
        this.setupPaymentForm(bookingData);
    }

    setupPaymentForm(bookingData) {
        const form = document.getElementById('payment-form');
        const cardNumber = document.getElementById('card-number');
        const expiry = document.getElementById('expiry');
        const cvv = document.getElementById('cvv');

        // Format card number input
        if (cardNumber) {
            cardNumber.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
                let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
                e.target.value = formattedValue;
            });
        }

        // Format expiry input
        if (expiry) {
            expiry.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length >= 2) {
                    value = value.substring(0,2) + '/' + value.substring(2,4);
                }
                e.target.value = value;
            });
        }

        // CVV input validation
        if (cvv) {
            cvv.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, '');
            });
        }

        // Payment method selection
        document.querySelectorAll('input[name="payment-method"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                document.querySelectorAll('.payment-method').forEach(method => {
                    method.classList.remove('active');
                });
                e.target.closest('.payment-method').classList.add('active');

                const cardDetails = document.getElementById('card-details');
                cardDetails.style.display = e.target.value === 'card' ? 'block' : 'none';
            });
        });

        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.processPayment(bookingData);
        });
    }

    processPayment(bookingData) {
        const payButton = document.getElementById('pay-now-btn');
        const originalText = payButton.innerHTML;
        
        // Show processing state
        payButton.innerHTML = '<div class="spinner"></div> Processing...';
        payButton.disabled = true;

        // Simulate payment processing
        setTimeout(() => {
            const success = Math.random() > 0.15; // 85% success rate
            
            if (success) {
                // Create booking
                const booking = window.AppManagers.booking.createBooking(bookingData);
                
                // Show success
                Utils.showToast('Payment successful! Booking confirmed.', 'success');
                
                // Close modal and redirect
                this.closePaymentModal();
                setTimeout(() => {
                    window.location.href = `user-dashboard.html?booking=${booking.id}`;
                }, 2000);
            } else {
                // Show error
                Utils.showToast('Payment failed. Please check your card details and try again.', 'error');
                payButton.innerHTML = originalText;
                payButton.disabled = false;
            }
        }, 3000);
    }

    closeBookingModal() {
        const modal = document.getElementById('booking-modal');
        if (modal) modal.style.display = 'none';
    }

    closePaymentModal() {
        const modal = document.getElementById('payment-modal');
        if (modal) modal.style.display = 'none';
    }

    generateStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        return '★'.repeat(fullStars) + 
               (hasHalfStar ? '☆' : '') + 
               '☆'.repeat(emptyStars);
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    showError(message) {
        const container = document.getElementById('car-details-content');
        if (container) {
            container.innerHTML = `
                <div class="error-state glass">
                    <i data-feather="alert-triangle"></i>
                    <h3>Error</h3>
                    <p>${message}</p>
                    <div class="error-actions">
                        <button onclick="location.href='listing.html'" class="btn-primary">Browse All Cars</button>
                        <button onclick="location.reload()" class="btn-secondary">Try Again</button>
                    </div>
                </div>
            `;
            feather.replace();
        }
    }
}

// Initialize car details manager
const carDetails = new CarDetailsManager();

// Make it globally accessible for onclick handlers
window.carDetails = carDetails;
