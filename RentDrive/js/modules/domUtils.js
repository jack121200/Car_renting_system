// DOM manipulation utilities
export class DOMUtils {
    /**
     * Create a DOM element with attributes
     * @param {string} tagName - The tag name for the element
     * @param {object} attributes - Object containing attributes to set
     * @param {string} textContent - Text content for the element
     * @returns {HTMLElement}
     */
    static createElement(tagName, attributes = {}, textContent = '') {
        const element = document.createElement(tagName);
        
        // Set attributes
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'innerHTML') {
                element.innerHTML = value;
            } else if (key.startsWith('data-')) {
                element.setAttribute(key, value);
            } else {
                element[key] = value;
            }
        });
        
        // Set text content if provided
        if (textContent) {
            element.textContent = textContent;
        }
        
        return element;
    }

    /**
     * Find element by selector with optional parent
     * @param {string} selector - CSS selector
     * @param {HTMLElement} parent - Parent element to search within
     * @returns {HTMLElement|null}
     */
    static findElement(selector, parent = document) {
        return parent.querySelector(selector);
    }

    /**
     * Find all elements by selector with optional parent
     * @param {string} selector - CSS selector
     * @param {HTMLElement} parent - Parent element to search within
     * @returns {NodeList}
     */
    static findElements(selector, parent = document) {
        return parent.querySelectorAll(selector);
    }

    /**
     * Add event listener with optional delegation
     * @param {HTMLElement|string} target - Element or selector
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     * @param {HTMLElement} parent - Parent for event delegation
     */
    static addEventHandler(target, event, handler, parent = document) {
        if (typeof target === 'string') {
            // Event delegation
            parent.addEventListener(event, (e) => {
                if (e.target.matches(target)) {
                    handler(e);
                }
            });
        } else {
            // Direct event binding
            target.addEventListener(event, handler);
        }
    }

    /**
     * Remove element from DOM
     * @param {HTMLElement} element - Element to remove
     */
    static removeElement(element) {
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    }

    /**
     * Toggle class on element
     * @param {HTMLElement} element - Target element
     * @param {string} className - Class name to toggle
     * @param {boolean} force - Force add/remove
     */
    static toggleClass(element, className, force) {
        if (element) {
            element.classList.toggle(className, force);
        }
    }

    /**
     * Add class to element
     * @param {HTMLElement} element - Target element
     * @param {string} className - Class name to add
     */
    static addClass(element, className) {
        if (element) {
            element.classList.add(className);
        }
    }

    /**
     * Remove class from element
     * @param {HTMLElement} element - Target element
     * @param {string} className - Class name to remove
     */
    static removeClass(element, className) {
        if (element) {
            element.classList.remove(className);
        }
    }

    /**
     * Check if element has class
     * @param {HTMLElement} element - Target element
     * @param {string} className - Class name to check
     * @returns {boolean}
     */
    static hasClass(element, className) {
        return element ? element.classList.contains(className) : false;
    }

    /**
     * Get element's offset position
     * @param {HTMLElement} element - Target element
     * @returns {object} Object with top and left properties
     */
    static getOffset(element) {
        if (!element) return { top: 0, left: 0 };
        
        const rect = element.getBoundingClientRect();
        return {
            top: rect.top + window.pageYOffset,
            left: rect.left + window.pageXOffset,
            width: rect.width,
            height: rect.height
        };
    }

    /**
     * Animate element with CSS transitions
     * @param {HTMLElement} element - Target element
     * @param {object} properties - CSS properties to animate
     * @param {number} duration - Animation duration in ms
     * @returns {Promise}
     */
    static animate(element, properties, duration = 300) {
        return new Promise((resolve) => {
            if (!element) {
                resolve();
                return;
            }

            const originalTransition = element.style.transition;
            element.style.transition = `all ${duration}ms ease-in-out`;

            // Apply properties
            Object.entries(properties).forEach(([prop, value]) => {
                element.style[prop] = value;
            });

            // Restore original transition after animation
            setTimeout(() => {
                element.style.transition = originalTransition;
                resolve();
            }, duration);
        });
    }

    /**
     * Fade in element
     * @param {HTMLElement} element - Target element
     * @param {number} duration - Animation duration in ms
     * @returns {Promise}
     */
    static fadeIn(element, duration = 300) {
        if (!element) return Promise.resolve();
        
        element.style.opacity = '0';
        element.style.display = 'block';
        
        return this.animate(element, { opacity: '1' }, duration);
    }

    /**
     * Fade out element
     * @param {HTMLElement} element - Target element
     * @param {number} duration - Animation duration in ms
     * @returns {Promise}
     */
    static fadeOut(element, duration = 300) {
        if (!element) return Promise.resolve();
        
        return this.animate(element, { opacity: '0' }, duration).then(() => {
            element.style.display = 'none';
        });
    }

    /**
     * Slide down element
     * @param {HTMLElement} element - Target element
     * @param {number} duration - Animation duration in ms
     * @returns {Promise}
     */
    static slideDown(element, duration = 300) {
        if (!element) return Promise.resolve();
        
        element.style.height = '0';
        element.style.overflow = 'hidden';
        element.style.display = 'block';
        
        const height = element.scrollHeight;
        return this.animate(element, { height: `${height}px` }, duration).then(() => {
            element.style.height = '';
            element.style.overflow = '';
        });
    }

    /**
     * Slide up element
     * @param {HTMLElement} element - Target element
     * @param {number} duration - Animation duration in ms
     * @returns {Promise}
     */
    static slideUp(element, duration = 300) {
        if (!element) return Promise.resolve();
        
        element.style.overflow = 'hidden';
        
        return this.animate(element, { height: '0' }, duration).then(() => {
            element.style.display = 'none';
            element.style.height = '';
            element.style.overflow = '';
        });
    }

    /**
     * Debounce function calls
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in ms
     * @returns {Function}
     */
    static debounce(func, wait) {
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

    /**
     * Throttle function calls
     * @param {Function} func - Function to throttle
     * @param {number} limit - Limit time in ms
     * @returns {Function}
     */
    static throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Check if element is in viewport
     * @param {HTMLElement} element - Target element
     * @param {number} threshold - Threshold percentage (0-1)
     * @returns {boolean}
     */
    static isInViewport(element, threshold = 0) {
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const windowWidth = window.innerWidth || document.documentElement.clientWidth;
        
        const vertInView = (rect.top <= windowHeight) && ((rect.top + rect.height) >= 0);
        const horInView = (rect.left <= windowWidth) && ((rect.left + rect.width) >= 0);
        
        return (vertInView && horInView);
    }

    /**
     * Scroll to element smoothly
     * @param {HTMLElement} element - Target element
     * @param {object} options - Scroll options
     */
    static scrollToElement(element, options = {}) {
        if (!element) return;
        
        const defaultOptions = {
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
        };
        
        element.scrollIntoView({ ...defaultOptions, ...options });
    }

    /**
     * Load image with promise
     * @param {string} src - Image source URL
     * @returns {Promise<HTMLImageElement>}
     */
    static loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
            img.src = src;
        });
    }

    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     * @returns {Promise<boolean>}
     */
    static async copyToClipboard(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                const success = document.execCommand('copy');
                textArea.remove();
                return success;
            }
        } catch (error) {
            console.error('Failed to copy text:', error);
            return false;
        }
    }

    /**
     * Format date for display
     * @param {Date|string} date - Date to format
     * @param {object} options - Intl.DateTimeFormat options
     * @returns {string}
     */
    static formatDate(date, options = {}) {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        
        return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(dateObj);
    }

    /**
     * Format currency for display
     * @param {number} amount - Amount to format
     * @param {string} currency - Currency code
     * @returns {string}
     */
    static formatCurrency(amount, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }
}