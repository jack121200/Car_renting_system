// Main application entry point
import { API } from './modules/api.js';
import { DOMUtils } from './modules/domUtils.js';
import { DatePicker } from './modules/datePicker.js';

class App {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadFeaturedCars();
        this.setupThemeToggle();
        this.setupMobileMenu();
        this.setupTestimonialsSlider();
        this.setupDatePickers();
        this.setupSearchForm();
    }

    setupEventListeners() {
        // Navigation
        document.addEventListener('click', (e) => {
            if (e.target.matches('.nav-logo h2, .nav-logo')) {
                window.location.href = 'index.html';
            }
        });

        // Smooth scrolling for anchor links
        document.addEventListener('click', (e) => {
            if (e.target.matches('a[href^="#"]')) {
                e.preventDefault();
                const target = document.querySelector(e.target.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });

        // Search functionality
        document.getElementById('hero-search-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSearch(e.target);
        });
    }

    async loadFeaturedCars() {
        const container = document.getElementById('featured-cars-grid');
        if (!container) return;

        try {
            // Show loading state
            container.innerHTML = this.getLoadingTemplate();
            
            const cars = await API.getAllCars();
            const featuredCars = cars.slice(0, 3); // Show first 3 cars as featured

            container.innerHTML = '';
            featuredCars.forEach((car, index) => {
                const carCard = this.createFeaturedCarCard(car, index);
                container.appendChild(carCard);
            });

            // Initialize feather icons for new content
            feather.replace();

        } catch (error) {
            console.error('Error loading featured cars:', error);
            container.innerHTML = '<p class="error-message">Error loading featured cars. Please try again later.</p>';
        }
    }

    createFeaturedCarCard(car, index) {
        const card = DOMUtils.createElement('div', {
            className: 'featured-car',
            'data-car-id': car.id
        });

        card.innerHTML = `
            <div class="car-image-container">
                <img src="${car.image}" alt="${car.name}" class="car-image" loading="lazy">
                <div class="car-badge">${car.type.charAt(0).toUpperCase() + car.type.slice(1)}</div>
            </div>
            <div class="car-details">
                <h3 class="car-name">${car.name}</h3>
                <p class="car-type">${car.type}</p>
                <div class="car-features">
                    ${car.features.slice(0, 3).map(feature => 
                        `<span class="feature-tag">${feature}</span>`
                    ).join('')}
                </div>
                <div class="car-footer">
                    <div class="car-price">
                        $${car.price}<span>/day</span>
                    </div>
                    <button class="rent-btn" data-car-id="${car.id}">
                        <i data-feather="truck"></i>
                        Rent Now
                    </button>
                </div>
            </div>
        `;

        return card;
    }

    getLoadingTemplate() {
        return Array(3).fill().map(() => `
            <div class="featured-car loading">
                <div class="car-image-container">
                    <div class="car-image loading-skeleton"></div>
                </div>
                <div class="car-details">
                    <div class="car-name loading-skeleton"></div>
                    <div class="car-type loading-skeleton"></div>
                    <div class="car-features">
                        <span class="feature-tag loading-skeleton"></span>
                        <span class="feature-tag loading-skeleton"></span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        if (!themeToggle) return;

        // Apply saved theme immediately
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(themeToggle, savedTheme);

        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            this.updateThemeIcon(themeToggle, newTheme);
        });
    }

    updateThemeIcon(button, theme) {
        const icon = button.querySelector('i');
        if (icon) {
            icon.setAttribute('data-feather', theme === 'light' ? 'moon' : 'sun');
            feather.replace();
        }
    }

    setupMobileMenu() {
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');
        
        if (!hamburger || !navMenu) return;

        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });

        // Close menu when clicking on a link
        navMenu.addEventListener('click', (e) => {
            if (e.target.matches('a')) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    }

    setupTestimonialsSlider() {
        const testimonials = document.querySelectorAll('.testimonial');
        const dots = document.querySelectorAll('.slider-dot');
        
        if (testimonials.length === 0 || dots.length === 0) return;

        let currentSlide = 0;
        const totalSlides = testimonials.length;

        const showSlide = (index) => {
            // Hide all testimonials
            testimonials.forEach((testimonial, i) => {
                testimonial.classList.toggle('active', i === index);
            });

            // Update dots
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
        };

        // Add click handlers to dots
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                currentSlide = index;
                showSlide(currentSlide);
            });
        });

        // Auto-advance slides
        setInterval(() => {
            currentSlide = (currentSlide + 1) % totalSlides;
            showSlide(currentSlide);
        }, 5000);
    }

    setupDatePickers() {
        const dateInputs = document.querySelectorAll('.date-picker');
        dateInputs.forEach(input => {
            new DatePicker(input, {
                minDate: new Date(),
                maxDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
                format: 'MM/DD/YYYY'
            });
        });
    }

    setupSearchForm() {
        const searchForm = document.getElementById('hero-search-form');
        if (!searchForm) return;

        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSearch(searchForm);
        });
    }

    handleSearch(form) {
        const formData = new FormData(form);
        const searchParams = {
            location: formData.get('location'),
            pickupDate: formData.get('pickup-date'),
            pickupTime: formData.get('pickup-time')
        };

        // Validate required fields
        if (!searchParams.location || !searchParams.pickupDate || !searchParams.pickupTime) {
            this.showToast('Please fill in all search fields', 'error');
            return;
        }

        // Store search params and redirect to listing
        sessionStorage.setItem('searchParams', JSON.stringify(searchParams));
        window.location.href = 'listing.html';
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        if (!toast) return;

        toast.textContent = message;
        toast.className = `toast ${type} show`;

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new App();
});

// Navigation functionality for all pages
class Navigation {
    constructor() {
        this.init();
    }

    init() {
        this.updateActiveNavItem();
        this.setupUserMenu();
    }

    updateActiveNavItem() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('.nav-menu a');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPage || (currentPage === '' && href === 'index.html')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    setupUserMenu() {
        const user = API.getCurrentUser();
        const loginBtn = document.querySelector('.nav-menu a[href="login.html"]');
        
        if (user && loginBtn) {
            // Replace login button with user menu
            const userMenu = this.createUserMenu(user);
            loginBtn.parentNode.replaceChild(userMenu, loginBtn);
        }
    }

    createUserMenu(user) {
        const userItem = DOMUtils.createElement('li', { className: 'user-menu' });
        userItem.innerHTML = `
            <button class="user-btn">
                <i data-feather="user"></i>
                ${user.name || user.email}
            </button>
            <div class="user-dropdown">
                <a href="user-dashboard.html">
                    <i data-feather="layout"></i>
                    Dashboard
                </a>
                <a href="#" id="logout-btn">
                    <i data-feather="log-out"></i>
                    Logout
                </a>
            </div>
        `;

        // Add dropdown functionality
        const userBtn = userItem.querySelector('.user-btn');
        const dropdown = userItem.querySelector('.user-dropdown');
        
        userBtn.addEventListener('click', () => {
            dropdown.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!userItem.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });

        // Handle logout
        userItem.querySelector('#logout-btn').addEventListener('click', (e) => {
            e.preventDefault();
            API.logout();
            window.location.href = 'index.html';
        });

        return userItem;
    }
}

// Initialize navigation
document.addEventListener('DOMContentLoaded', () => {
    new Navigation();
});

export { App, Navigation };

// Utils export for compatibility
export const Utils = {
    formatPrice: (price) => `$${price.toFixed(2)}`,
    formatDate: (date) => new Date(date).toLocaleDateString(),
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};