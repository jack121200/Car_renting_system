// Booking modal and payment simulation
import { API } from './modules/api.js';
import { DOMUtils } from './modules/domUtils.js';
import { DatePicker } from './modules/datePicker.js';

class BookingManager {
    constructor() {
        this.currentCar = null;
        this.bookingData = {};
        this.paymentModal = null;
        this.confettiElements = [];
        this.init();
    }

    init() {
        this.createBookingModal();
        this.createPaymentModal();
        this.createSuccessModal();
        this.setupEventListeners();
    }

    createBookingModal() {
        const modal = DOMUtils.createElement('div', {
            className: 'modal booking-modal',
            id: 'booking-modal'
        });

        modal.innerHTML = `
            <div class="modal-content booking-content">
                <div class="modal-header">
                    <h2 class="modal-title">Complete Your Booking</h2>
                    <button class="close-modal" aria-label="Close">×</button>
                </div>
                <div class="modal-body">
                    <div class="booking-layout">
                        <div class="booking-details">
                            <div class="car-summary">
                                <img class="car-summary-image" src="" alt="">
                                <div class="car-summary-info">
                                    <h3 class="car-summary-name"></h3>
                                    <p class="car-summary-type"></p>
                                    <div class="car-summary-rating">
                                        <div class="rating-stars"></div>
                                        <span class="rating-text"></span>
                                    </div>
                                </div>
                            </div>

                            <div class="booking-form">
                                <h4>Rental Details</h4>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="pickup-date">Pickup Date</label>
                                        <input type="text" id="pickup-date" class="date-picker" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="return-date">Return Date</label>
                                        <input type="text" id="return-date" class="date-picker" required>
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="pickup-time">Pickup Time</label>
                                        <select id="pickup-time" required>
                                            ${this.generateTimeOptions()}
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label for="return-time">Return Time</label>
                                        <select id="return-time" required>
                                            ${this.generateTimeOptions()}
                                        </select>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="pickup-location">Pickup Location</label>
                                    <select id="pickup-location" required>
                                        <option value="">Select pickup location</option>
                                        <option value="airport">Airport Terminal</option>
                                        <option value="downtown">Downtown Office</option>
                                        <option value="hotel">Hotel Delivery</option>
                                        <option value="custom">Custom Location</option>
                                    </select>
                                </div>

                                <div class="extras-section">
                                    <h4>Optional Extras</h4>
                                    <div class="extras-grid">
                                        <label class="extra-item">
                                            <input type="checkbox" value="gps" data-price="10">
                                            <div class="extra-info">
                                                <div class="extra-icon">🗺️</div>
                                                <div>
                                                    <strong>GPS Navigation</strong>
                                                    <span>$10/day</span>
                                                </div>
                                            </div>
                                        </label>
                                        <label class="extra-item">
                                            <input type="checkbox" value="insurance" data-price="25">
                                            <div class="extra-info">
                                                <div class="extra-icon">🛡️</div>
                                                <div>
                                                    <strong>Full Coverage Insurance</strong>
                                                    <span>$25/day</span>
                                                </div>
                                            </div>
                                        </label>
                                        <label class="extra-item">
                                            <input type="checkbox" value="child-seat" data-price="15">
                                            <div class="extra-info">
                                                <div class="extra-icon">👶</div>
                                                <div>
                                                    <strong>Child Safety Seat</strong>
                                                    <span>$15/day</span>
                                                </div>
                                            </div>
                                        </label>
                                        <label class="extra-item">
                                            <input type="checkbox" value="wifi" data-price="8">
                                            <div class="extra-info">
                                                <div class="extra-icon">📶</div>
                                                <div>
                                                    <strong>Mobile WiFi Hotspot</strong>
                                                    <span>$8/day</span>
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="booking-summary">
                            <h4>Booking Summary</h4>
                            <div class="summary-details">
                                <div class="summary-row">
                                    <span>Rental Period:</span>
                                    <span class="rental-days">0 days</span>
                                </div>
                                <div class="summary-row">
                                    <span>Daily Rate:</span>
                                    <span class="daily-rate">$0</span>
                                </div>
                                <div class="summary-row">
                                    <span>Subtotal:</span>
                                    <span class="subtotal">$0</span>
                                </div>
                                <div class="summary-row extras-total" style="display: none;">
                                    <span>Extras:</span>
                                    <span class="extras-cost">$0</span>
                                </div>
                                <div class="summary-row">
                                    <span>Taxes & Fees:</span>
                                    <span class="taxes">$0</span>
                                </div>
                                <hr>
                                <div class="summary-row total-row">
                                    <span><strong>Total:</strong></span>
                                    <span class="total-cost"><strong>$0</strong></span>
                                </div>
                            </div>
                            <button class="btn btn-primary proceed-payment">
                                <i data-feather="credit-card"></i>
                                Proceed to Payment
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        feather.replace();
    }

    createPaymentModal() {
        const modal = DOMUtils.createElement('div', {
            className: 'modal payment-modal',
            id: 'payment-modal'
        });

        modal.innerHTML = `
            <div class="modal-content payment-content">
                <div class="modal-header">
                    <h2 class="modal-title">Secure Payment</h2>
                    <button class="close-modal" aria-label="Close">×</button>
                </div>
                <div class="modal-body">
                    <div class="payment-layout">
                        <div class="payment-form">
                            <div class="payment-tabs">
                                <button class="tab-btn active" data-tab="card">Credit Card</button>
                                <button class="tab-btn" data-tab="paypal">PayPal</button>
                                <button class="tab-btn" data-tab="apple">Apple Pay</button>
                            </div>

                            <div class="payment-tab-content" id="card-tab">
                                <div class="form-group">
                                    <label for="card-number">Card Number</label>
                                    <input type="text" id="card-number" placeholder="1234 5678 9012 3456" maxlength="19">
                                    <div class="card-icons">
                                        <i class="fab fa-cc-visa"></i>
                                        <i class="fab fa-cc-mastercard"></i>
                                        <i class="fab fa-cc-amex"></i>
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="card-expiry">Expiry Date</label>
                                        <input type="text" id="card-expiry" placeholder="MM/YY" maxlength="5">
                                    </div>
                                    <div class="form-group">
                                        <label for="card-cvv">CVV</label>
                                        <input type="text" id="card-cvv" placeholder="123" maxlength="4">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="card-name">Cardholder Name</label>
                                    <input type="text" id="card-name" placeholder="John Doe">
                                </div>
                            </div>

                            <div class="payment-tab-content" id="paypal-tab" style="display: none;">
                                <div class="paypal-section">
                                    <div class="paypal-logo">PayPal</div>
                                    <p>You will be redirected to PayPal to complete your payment securely.</p>
                                    <button class="btn paypal-btn">Continue with PayPal</button>
                                </div>
                            </div>

                            <div class="payment-tab-content" id="apple-tab" style="display: none;">
                                <div class="apple-pay-section">
                                    <div class="apple-pay-logo">🍎 Pay</div>
                                    <p>Use Touch ID or Face ID to pay with Apple Pay.</p>
                                    <button class="btn apple-pay-btn">Pay with Apple Pay</button>
                                </div>
                            </div>

                            <div class="billing-address">
                                <h4>Billing Address</h4>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="billing-first-name">First Name</label>
                                        <input type="text" id="billing-first-name" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="billing-last-name">Last Name</label>
                                        <input type="text" id="billing-last-name" required>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="billing-address">Address</label>
                                    <input type="text" id="billing-address" required>
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="billing-city">City</label>
                                        <input type="text" id="billing-city" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="billing-zip">ZIP Code</label>
                                        <input type="text" id="billing-zip" required>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="payment-summary">
                            <h4>Order Summary</h4>
                            <div class="order-details">
                                <div class="order-car">
                                    <img class="order-car-image" src="" alt="">
                                    <div>
                                        <strong class="order-car-name"></strong>
                                        <p class="order-dates"></p>
                                    </div>
                                </div>
                                <div class="order-breakdown">
                                    <div class="breakdown-row">
                                        <span>Rental Cost:</span>
                                        <span class="rental-cost">$0</span>
                                    </div>
                                    <div class="breakdown-row extras-breakdown" style="display: none;">
                                        <span>Extras:</span>
                                        <span class="extras-breakdown-cost">$0</span>
                                    </div>
                                    <div class="breakdown-row">
                                        <span>Taxes & Fees:</span>
                                        <span class="taxes-breakdown">$0</span>
                                    </div>
                                    <hr>
                                    <div class="breakdown-row total-breakdown">
                                        <span><strong>Total:</strong></span>
                                        <span class="total-breakdown-cost"><strong>$0</strong></span>
                                    </div>
                                </div>
                            </div>
                            <button class="btn btn-primary pay-now-btn">
                                <div class="btn-content">
                                    <i data-feather="lock"></i>
                                    <span>Pay Now</span>
                                </div>
                                <div class="loading-spinner" style="display: none;"></div>
                            </button>
                            <div class="security-info">
                                <i data-feather="shield"></i>
                                <span>Your payment is secured with 256-bit SSL encryption</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        feather.replace();
    }

    createSuccessModal() {
        const modal = DOMUtils.createElement('div', {
            className: 'modal success-modal',
            id: 'success-modal'
        });

        modal.innerHTML = `
            <div class="modal-content success-content">
                <div class="success-animation">
                    <div class="success-checkmark">
                        <div class="check-icon">
                            <span class="icon-line line-tip"></span>
                            <span class="icon-line line-long"></span>
                            <div class="icon-circle"></div>
                            <div class="icon-fix"></div>
                        </div>
                    </div>
                </div>
                <div class="success-message">
                    <h2>Booking Confirmed!</h2>
                    <p>Your car rental has been successfully booked. You will receive a confirmation email shortly.</p>
                </div>
                <div class="booking-details">
                    <div class="detail-item">
                        <span class="detail-label">Booking ID:</span>
                        <span class="detail-value booking-id"></span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Car:</span>
                        <span class="detail-value car-name"></span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Pickup:</span>
                        <span class="detail-value pickup-info"></span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Return:</span>
                        <span class="detail-value return-info"></span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Total:</span>
                        <span class="detail-value total-amount"></span>
                    </div>
                </div>
                <div class="success-actions">
                    <button class="btn btn-primary" onclick="window.location.href='user-dashboard.html'">
                        View My Bookings
                    </button>
                    <button class="btn btn-secondary close-modal">
                        Continue Browsing
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    setupEventListeners() {
        // Book now buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('.book-now-btn, .rent-btn, .rent-now-btn')) {
                this.openBookingModal(e.target);
            }
        });

        // Date pickers
        document.addEventListener('DOMContentLoaded', () => {
            const pickupInput = document.getElementById('pickup-date');
            const returnInput = document.getElementById('return-date');
            
            if (pickupInput) {
                new DatePicker(pickupInput, {
                    minDate: new Date(),
                    maxDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                });
            }
            
            if (returnInput) {
                new DatePicker(returnInput, {
                    minDate: new Date(),
                    maxDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                });
            }
        });

        // Booking form changes
        document.addEventListener('change', (e) => {
            if (e.target.matches('#pickup-date, #return-date, .extras-section input[type="checkbox"]')) {
                this.updateBookingSummary();
            }
        });

        // Payment tabs
        document.addEventListener('click', (e) => {
            if (e.target.matches('.tab-btn')) {
                this.switchPaymentTab(e.target);
            }
        });

        // Form validation and formatting
        document.addEventListener('input', (e) => {
            if (e.target.id === 'card-number') {
                this.formatCardNumber(e.target);
            } else if (e.target.id === 'card-expiry') {
                this.formatExpiry(e.target);
            } else if (e.target.id === 'card-cvv') {
                this.formatCVV(e.target);
            }
        });

        // Payment processing
        document.addEventListener('click', (e) => {
            if (e.target.matches('.proceed-payment')) {
                this.proceedToPayment();
            } else if (e.target.matches('.pay-now-btn')) {
                this.processPayment();
            }
        });

        // Modal management
        document.addEventListener('click', (e) => {
            if (e.target.matches('.close-modal') || e.target.matches('.modal')) {
                this.closeAllModals();
            }
        });
    }

    async openBookingModal(button) {
        const carId = button.dataset.carId || button.closest('[data-car-id]')?.dataset.carId;
        
        if (!carId) {
            console.error('Car ID not found');
            return;
        }

        try {
            this.currentCar = await API.getCarById(parseInt(carId));
            this.populateCarSummary();
            this.showModal('booking-modal');
            this.updateBookingSummary();
        } catch (error) {
            console.error('Error loading car details:', error);
            alert('Error loading car details. Please try again.');
        }
    }

    populateCarSummary() {
        if (!this.currentCar) return;

        const modal = document.getElementById('booking-modal');
        const image = modal.querySelector('.car-summary-image');
        const name = modal.querySelector('.car-summary-name');
        const type = modal.querySelector('.car-summary-type');
        const stars = modal.querySelector('.rating-stars');
        const ratingText = modal.querySelector('.rating-text');

        image.src = this.currentCar.image;
        image.alt = this.currentCar.name;
        name.textContent = this.currentCar.name;
        type.textContent = this.currentCar.type.charAt(0).toUpperCase() + this.currentCar.type.slice(1);
        
        stars.innerHTML = this.generateStars(this.currentCar.rating);
        ratingText.textContent = `${this.currentCar.rating} (${this.currentCar.reviewCount} reviews)`;
    }

    generateStars(rating) {
        let starsHTML = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                starsHTML += '<i class="star filled" data-feather="star"></i>';
            } else {
                starsHTML += '<i class="star empty" data-feather="star"></i>';
            }
        }
        return starsHTML;
    }

    generateTimeOptions() {
        let options = '<option value="">Select time</option>';
        for (let hour = 8; hour <= 20; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                const display = hour >= 12 ? 
                    `${hour > 12 ? hour - 12 : hour}:${minute.toString().padStart(2, '0')} PM` :
                    `${hour}:${minute.toString().padStart(2, '0')} AM`;
                options += `<option value="${time}">${display}</option>`;
            }
        }
        return options;
    }

    updateBookingSummary() {
        if (!this.currentCar) return;

        const pickupDate = document.getElementById('pickup-date').value;
        const returnDate = document.getElementById('return-date').value;
        
        if (!pickupDate || !returnDate) return;

        const pickup = new Date(pickupDate);
        const returnDay = new Date(returnDate);
        const days = Math.ceil((returnDay - pickup) / (1000 * 60 * 60 * 24));

        if (days <= 0) return;

        const dailyRate = this.currentCar.price;
        const subtotal = dailyRate * days;
        
        // Calculate extras
        const extrasCheckboxes = document.querySelectorAll('.extras-section input[type="checkbox"]:checked');
        let extrasTotal = 0;
        extrasCheckboxes.forEach(checkbox => {
            extrasTotal += parseInt(checkbox.dataset.price) * days;
        });

        const taxes = Math.round((subtotal + extrasTotal) * 0.12); // 12% tax
        const total = subtotal + extrasTotal + taxes;

        // Update summary
        document.querySelector('.rental-days').textContent = `${days} day${days > 1 ? 's' : ''}`;
        document.querySelector('.daily-rate').textContent = `$${dailyRate}`;
        document.querySelector('.subtotal').textContent = `$${subtotal}`;
        document.querySelector('.taxes').textContent = `$${taxes}`;
        document.querySelector('.total-cost').textContent = `$${total}`;

        // Show/hide extras
        const extrasRow = document.querySelector('.extras-total');
        if (extrasTotal > 0) {
            extrasRow.style.display = 'flex';
            document.querySelector('.extras-cost').textContent = `$${extrasTotal}`;
        } else {
            extrasRow.style.display = 'none';
        }

        // Store booking data
        this.bookingData = {
            car: this.currentCar,
            pickupDate,
            returnDate,
            days,
            dailyRate,
            subtotal,
            extrasTotal,
            taxes,
            total,
            extras: Array.from(extrasCheckboxes).map(cb => ({
                type: cb.value,
                price: parseInt(cb.dataset.price)
            }))
        };
    }

    proceedToPayment() {
        const form = document.querySelector('.booking-form');
        const formData = new FormData(form);
        
        // Validate required fields
        const required = ['pickup-date', 'return-date', 'pickup-time', 'return-time', 'pickup-location'];
        for (const field of required) {
            if (!formData.get(field)) {
                alert(`Please fill in ${field.replace('-', ' ')}`);
                return;
            }
        }

        this.populatePaymentSummary();
        this.closeModal('booking-modal');
        this.showModal('payment-modal');
    }

    populatePaymentSummary() {
        const modal = document.getElementById('payment-modal');
        const image = modal.querySelector('.order-car-image');
        const name = modal.querySelector('.order-car-name');
        const dates = modal.querySelector('.order-dates');
        
        image.src = this.currentCar.image;
        image.alt = this.currentCar.name;
        name.textContent = this.currentCar.name;
        dates.textContent = `${this.bookingData.pickupDate} - ${this.bookingData.returnDate}`;

        // Update breakdown
        modal.querySelector('.rental-cost').textContent = `$${this.bookingData.subtotal}`;
        modal.querySelector('.taxes-breakdown').textContent = `$${this.bookingData.taxes}`;
        modal.querySelector('.total-breakdown-cost').textContent = `$${this.bookingData.total}`;

        if (this.bookingData.extrasTotal > 0) {
            modal.querySelector('.extras-breakdown').style.display = 'flex';
            modal.querySelector('.extras-breakdown-cost').textContent = `$${this.bookingData.extrasTotal}`;
        }
    }

    switchPaymentTab(button) {
        const tabs = document.querySelectorAll('.tab-btn');
        const contents = document.querySelectorAll('.payment-tab-content');
        
        tabs.forEach(tab => tab.classList.remove('active'));
        contents.forEach(content => content.style.display = 'none');
        
        button.classList.add('active');
        document.getElementById(`${button.dataset.tab}-tab`).style.display = 'block';
    }

    formatCardNumber(input) {
        let value = input.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
        if (formattedValue !== input.value) {
            input.value = formattedValue;
        }
    }

    formatExpiry(input) {
        let value = input.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        input.value = value;
    }

    formatCVV(input) {
        input.value = input.value.replace(/\D/g, '').substring(0, 4);
    }

    async processPayment() {
        const button = document.querySelector('.pay-now-btn');
        const content = button.querySelector('.btn-content');
        const spinner = button.querySelector('.loading-spinner');
        
        // Show loading state
        content.style.display = 'none';
        spinner.style.display = 'block';
        button.disabled = true;

        try {
            // Simulate payment processing
            const result = await API.processPayment({
                amount: this.bookingData.total,
                cardNumber: document.getElementById('card-number').value,
                carId: this.currentCar.id
            });

            // Create booking
            const currentUser = API.getCurrentUser();
            if (!currentUser) {
                throw new Error('Please log in to complete booking');
            }

            const booking = await API.createBooking({
                userId: currentUser.email,
                car: this.currentCar,
                pickupDate: this.bookingData.pickupDate,
                returnDate: this.bookingData.returnDate,
                totalDays: this.bookingData.days,
                totalPrice: this.bookingData.total,
                extras: this.bookingData.extras,
                paymentId: result.transactionId
            });

            this.showSuccess(booking);

        } catch (error) {
            console.error('Payment failed:', error);
            alert('Payment failed: ' + error.message);
        } finally {
            // Reset button state
            content.style.display = 'flex';
            spinner.style.display = 'none';
            button.disabled = false;
        }
    }

    showSuccess(booking) {
        this.closeModal('payment-modal');
        
        // Populate success modal
        const modal = document.getElementById('success-modal');
        modal.querySelector('.booking-id').textContent = booking.id;
        modal.querySelector('.car-name').textContent = this.currentCar.name;
        modal.querySelector('.pickup-info').textContent = this.bookingData.pickupDate;
        modal.querySelector('.return-info').textContent = this.bookingData.returnDate;
        modal.querySelector('.total-amount').textContent = `$${this.bookingData.total}`;

        this.showModal('success-modal');
        this.triggerConfetti();
    }

    triggerConfetti() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'];
        const confettiCount = 50;

        for (let i = 0; i < confettiCount; i++) {
            setTimeout(() => {
                this.createConfettiPiece(colors[Math.floor(Math.random() * colors.length)]);
            }, i * 30);
        }
    }

    createConfettiPiece(color) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: fixed;
            width: 10px;
            height: 10px;
            background: ${color};
            top: -10px;
            left: ${Math.random() * window.innerWidth}px;
            z-index: 10000;
            border-radius: 50%;
            pointer-events: none;
            animation: confetti-fall 3s linear forwards;
        `;

        document.body.appendChild(confetti);
        
        setTimeout(() => {
            confetti.remove();
        }, 3000);
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }

    closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.classList.remove('show');
        });
        document.body.style.overflow = '';
    }
}

// Add confetti animation CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes confetti-fall {
        0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
        }
        100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
        }
    }

    .success-checkmark {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        display: block;
        stroke-width: 2;
        stroke: #4bb71b;
        stroke-miterlimit: 10;
        margin: 10% auto;
        box-shadow: inset 0px 0px 0px #4bb71b;
        animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s both;
        position: relative;
    }

    .success-checkmark .check-icon {
        width: 56px;
        height: 56px;
        position: relative;
        border-radius: 50%;
        border: 2px solid #4bb71b;
        background: #4bb71b;
        margin: 12px auto;
    }

    .success-checkmark .check-icon::after {
        content: '';
        width: 16px;
        height: 32px;
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%) rotate(45deg);
        border: solid white;
        border-width: 0 4px 4px 0;
        animation: checkmark .6s ease-in-out 1.2s forwards;
        opacity: 0;
    }

    @keyframes fill {
        100% {
            box-shadow: inset 0px 0px 0px 30px #4bb71b;
        }
    }

    @keyframes scale {
        0%, 100% {
            transform: none;
        }
        50% {
            transform: scale3d(1.1, 1.1, 1);
        }
    }

    @keyframes checkmark {
        100% {
            opacity: 1;
        }
    }

    .booking-modal .modal-content {
        max-width: 1000px;
        width: 95%;
    }

    .booking-layout {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 40px;
        align-items: start;
    }

    .car-summary {
        display: flex;
        gap: 20px;
        padding: 20px;
        background: var(--bg-secondary);
        border-radius: var(--border-radius);
        margin-bottom: 30px;
    }

    .car-summary-image {
        width: 120px;
        height: 80px;
        object-fit: cover;
        border-radius: var(--border-radius);
    }

    .car-summary-name {
        font-size: 1.3rem;
        font-weight: 700;
        margin-bottom: 5px;
    }

    .car-summary-type {
        color: var(--text-muted);
        margin-bottom: 10px;
        text-transform: capitalize;
    }

    .extras-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
        margin-top: 20px;
    }

    .extra-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 15px;
        border: 2px solid var(--border-color);
        border-radius: var(--border-radius);
        cursor: pointer;
        transition: all var(--transition-fast);
    }

    .extra-item:hover {
        border-color: var(--primary-color);
        background: var(--bg-secondary);
    }

    .extra-item input:checked + .extra-info {
        border-color: var(--primary-color);
    }

    .extra-info {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
    }

    .extra-icon {
        font-size: 1.5rem;
    }

    .booking-summary {
        background: var(--glass-bg);
        backdrop-filter: blur(20px);
        border: 1px solid var(--glass-border);
        border-radius: var(--border-radius-lg);
        padding: 30px;
        position: sticky;
        top: 20px;
    }

    .summary-details {
        margin: 20px 0;
    }

    .summary-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
        padding: 8px 0;
    }

    .summary-row hr {
        border: none;
        border-top: 1px solid var(--border-color);
        margin: 15px 0;
    }

    .total-row {
        font-size: 1.2rem;
        border-top: 2px solid var(--border-color);
        padding-top: 15px;
        margin-top: 15px;
    }

    .payment-layout {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 40px;
        align-items: start;
    }

    .payment-tabs {
        display: flex;
        border-bottom: 2px solid var(--border-color);
        margin-bottom: 30px;
    }

    .tab-btn {
        flex: 1;
        padding: 15px;
        background: none;
        border: none;
        font-weight: 600;
        cursor: pointer;
        transition: all var(--transition-fast);
        border-bottom: 3px solid transparent;
    }

    .tab-btn.active {
        color: var(--primary-color);
        border-bottom-color: var(--primary-color);
    }

    .card-icons {
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        display: flex;
        gap: 5px;
    }

    .form-group {
        position: relative;
        margin-bottom: 20px;
    }

    .security-info {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.9rem;
        color: var(--text-muted);
        margin-top: 15px;
        justify-content: center;
    }

    .success-content {
        max-width: 500px;
        text-align: center;
        padding: 50px 40px;
    }

    .success-message h2 {
        font-size: 2rem;
        color: var(--success-color);
        margin-bottom: 15px;
    }

    .booking-details {
        background: var(--bg-secondary);
        border-radius: var(--border-radius);
        padding: 25px;
        margin: 30px 0;
        text-align: left;
    }

    .detail-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 12px;
        padding: 8px 0;
        border-bottom: 1px solid var(--border-color);
    }

    .detail-item:last-child {
        border-bottom: none;
        font-weight: 700;
        font-size: 1.1rem;
    }

    .success-actions {
        display: flex;
        gap: 15px;
        justify-content: center;
        margin-top: 30px;
    }

    @media (max-width: 768px) {
        .booking-layout,
        .payment-layout {
            grid-template-columns: 1fr;
            gap: 30px;
        }

        .booking-summary {
            position: static;
            order: -1;
        }

        .car-summary {
            flex-direction: column;
            text-align: center;
        }

        .extras-grid {
            grid-template-columns: 1fr;
        }

        .success-actions {
            flex-direction: column;
        }
    }
`;
document.head.appendChild(style);

// Initialize booking manager
document.addEventListener('DOMContentLoaded', () => {
    new BookingManager();
});

export { BookingManager };