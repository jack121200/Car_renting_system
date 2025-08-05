// Authentication system with OTP verification
import { Utils } from './main.js';

class AuthManager {
    constructor() {
        this.currentOTP = null;
        this.otpExpiry = null;
        this.tempUserData = null;
        this.init();
    }

    init() {
        this.setupSignupForm();
        this.setupLoginForm();
        this.setupOTPForms();
        this.setupPasswordToggles();
        this.setupSocialAuth();
    }

    setupSignupForm() {
        const signupForm = document.getElementById('signup-form');
        if (!signupForm) return;

        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSignup(new FormData(signupForm));
        });

        // Real-time validation
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirm-password');

        if (passwordInput && confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', () => {
                this.validatePasswordMatch(passwordInput.value, confirmPasswordInput.value);
            });
        }

        // Email validation
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.addEventListener('blur', () => {
                this.validateEmail(emailInput.value);
            });
        }

        // Phone validation
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                this.formatPhoneNumber(e.target);
            });
        }
    }

    setupLoginForm() {
        const loginForm = document.getElementById('login-form');
        if (!loginForm) return;

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin(new FormData(loginForm));
        });
    }

    setupOTPForms() {
        // Signup OTP form
        const otpForm = document.getElementById('otp-form');
        if (otpForm) {
            otpForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.verifySignupOTP();
            });

            // OTP input handling
            this.setupOTPInputs('otp-');
        }

        // Login OTP form
        const loginOtpForm = document.getElementById('login-otp-form');
        if (loginOtpForm) {
            loginOtpForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.verifyLoginOTP();
            });

            // OTP input handling
            this.setupOTPInputs('login-otp-');
        }

        // Resend OTP buttons
        const resendBtn = document.getElementById('resend-otp');
        const resendLoginBtn = document.getElementById('resend-login-otp');

        if (resendBtn) {
            resendBtn.addEventListener('click', () => this.resendOTP('signup'));
        }

        if (resendLoginBtn) {
            resendLoginBtn.addEventListener('click', () => this.resendOTP('login'));
        }
    }

    setupOTPInputs(prefix) {
        const inputs = [];
        for (let i = 1; i <= 6; i++) {
            const input = document.getElementById(`${prefix}${i}`);
            if (input) inputs.push(input);
        }

        inputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                const value = e.target.value;
                
                // Only allow numbers
                if (!/^\d*$/.test(value)) {
                    e.target.value = '';
                    return;
                }

                // Move to next input
                if (value.length === 1 && index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }
            });

            input.addEventListener('keydown', (e) => {
                // Move to previous input on backspace
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    inputs[index - 1].focus();
                }
            });

            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const paste = e.clipboardData.getData('text');
                const digits = paste.replace(/\D/g, '').slice(0, 6);
                
                digits.split('').forEach((digit, i) => {
                    if (inputs[i]) inputs[i].value = digit;
                });

                if (inputs[Math.min(digits.length, 5)]) {
                    inputs[Math.min(digits.length, 5)].focus();
                }
            });
        });
    }

    setupPasswordToggles() {
        const toggleButtons = document.querySelectorAll('.password-toggle');
        
        toggleButtons.forEach(button => {
            button.addEventListener('click', () => {
                const input = button.parentElement.querySelector('input[type="password"], input[type="text"]');
                const icon = button.querySelector('i');
                
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.setAttribute('data-feather', 'eye-off');
                } else {
                    input.type = 'password';
                    icon.setAttribute('data-feather', 'eye');
                }
                
                feather.replace();
            });
        });
    }

    setupSocialAuth() {
        const googleBtn = document.querySelector('.google-btn');
        if (googleBtn) {
            googleBtn.addEventListener('click', () => {
                this.handleSocialAuth('google');
            });
        }
    }

    async handleSignup(formData) {
        const submitBtn = document.getElementById('signup-btn');
        const spinner = submitBtn.querySelector('.loading-spinner');
        const span = submitBtn.querySelector('span');

        try {
            // Show loading state
            spinner.style.display = 'block';
            span.style.display = 'none';
            submitBtn.disabled = true;

            // Validate form data
            const userData = {
                firstName: formData.get('firstName').trim(),
                lastName: formData.get('lastName').trim(),
                email: formData.get('email').trim().toLowerCase(),
                phone: formData.get('phone').trim(),
                password: formData.get('password'),
                confirmPassword: formData.get('confirmPassword')
            };

            // Validation
            if (!this.validateSignupData(userData)) {
                return;
            }

            // Check if user already exists
            const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
            if (existingUsers.find(user => user.email === userData.email)) {
                Utils.showToast('An account with this email already exists', 'error');
                return;
            }

            // Store temporary user data
            this.tempUserData = userData;

            // Generate and send OTP
            this.generateOTP();
            this.showOTPModal('signup');

            Utils.showToast('OTP sent to your email', 'success');

        } catch (error) {
            console.error('Signup error:', error);
            Utils.showToast('An error occurred during signup', 'error');
        } finally {
            // Reset button state
            spinner.style.display = 'none';
            span.style.display = 'block';
            submitBtn.disabled = false;
        }
    }

    async handleLogin(formData) {
        const submitBtn = document.getElementById('login-btn');
        const spinner = submitBtn.querySelector('.loading-spinner');
        const span = submitBtn.querySelector('span');

        try {
            // Show loading state
            spinner.style.display = 'block';
            span.style.display = 'none';
            submitBtn.disabled = true;

            const email = formData.get('email').trim().toLowerCase();
            const password = formData.get('password');

            // Validate inputs
            if (!email || !password) {
                Utils.showToast('Please fill in all fields', 'error');
                return;
            }

            if (!Utils.validateEmail(email)) {
                Utils.showToast('Please enter a valid email address', 'error');
                return;
            }

            // Check user credentials
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const user = users.find(u => u.email === email && u.password === password);

            if (!user) {
                Utils.showToast('Invalid email or password', 'error');
                return;
            }

            // Store user for OTP verification
            this.tempUserData = user;

            // Generate OTP for 2FA
            this.generateOTP();
            this.showOTPModal('login');

            Utils.showToast('OTP sent for verification', 'success');

        } catch (error) {
            console.error('Login error:', error);
            Utils.showToast('An error occurred during login', 'error');
        } finally {
            // Reset button state
            spinner.style.display = 'none';
            span.style.display = 'block';
            submitBtn.disabled = false;
        }
    }

    validateSignupData(userData) {
        if (!userData.firstName || userData.firstName.length < 2) {
            Utils.showToast('First name must be at least 2 characters', 'error');
            return false;
        }

        if (!userData.lastName || userData.lastName.length < 2) {
            Utils.showToast('Last name must be at least 2 characters', 'error');
            return false;
        }

        if (!Utils.validateEmail(userData.email)) {
            Utils.showToast('Please enter a valid email address', 'error');
            return false;
        }

        if (!Utils.validatePhone(userData.phone)) {
            Utils.showToast('Please enter a valid phone number', 'error');
            return false;
        }

        if (userData.password.length < 6) {
            Utils.showToast('Password must be at least 6 characters', 'error');
            return false;
        }

        if (userData.password !== userData.confirmPassword) {
            Utils.showToast('Passwords do not match', 'error');
            return false;
        }

        if (!document.getElementById('terms')?.checked) {
            Utils.showToast('Please accept the terms and conditions', 'error');
            return false;
        }

        return true;
    }

    validatePasswordMatch(password, confirmPassword) {
        const confirmInput = document.getElementById('confirm-password');
        if (!confirmInput) return;

        if (confirmPassword && password !== confirmPassword) {
            confirmInput.setCustomValidity('Passwords do not match');
            confirmInput.style.borderColor = '#ef4444';
        } else {
            confirmInput.setCustomValidity('');
            confirmInput.style.borderColor = '';
        }
    }

    validateEmail(email) {
        const emailInput = document.getElementById('email');
        if (!emailInput) return;

        if (email && !Utils.validateEmail(email)) {
            emailInput.setCustomValidity('Please enter a valid email address');
            emailInput.style.borderColor = '#ef4444';
        } else {
            emailInput.setCustomValidity('');
            emailInput.style.borderColor = '';
        }
    }

    formatPhoneNumber(input) {
        let value = input.value.replace(/\D/g, '');
        
        if (value.length > 0) {
            if (value.length <= 3) {
                value = `(${value}`;
            } else if (value.length <= 6) {
                value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
            } else {
                value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
            }
        }
        
        input.value = value;
    }

    generateOTP() {
        this.currentOTP = Math.floor(100000 + Math.random() * 900000).toString();
        this.otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes

        // In a real app, this would be sent via email/SMS
        console.log('Generated OTP:', this.currentOTP);
    }

    showOTPModal(type) {
        const modalId = type === 'signup' ? 'otp-modal' : 'login-otp-modal';
        const displayId = type === 'signup' ? 'generated-otp-display' : 'generated-login-otp-display';
        
        const modal = document.getElementById(modalId);
        const display = document.getElementById(displayId);
        
        if (modal) {
            modal.style.display = 'block';
        }
        
        if (display) {
            display.textContent = this.currentOTP;
        }

        // Clear any existing OTP inputs
        for (let i = 1; i <= 6; i++) {
            const input = document.getElementById(`${type === 'signup' ? 'otp' : 'login-otp'}-${i}`);
            if (input) input.value = '';
        }

        // Focus on first input
        const firstInput = document.getElementById(`${type === 'signup' ? 'otp' : 'login-otp'}-1`);
        if (firstInput) firstInput.focus();
    }

    async verifySignupOTP() {
        const enteredOTP = this.getEnteredOTP('otp-');
        
        if (!this.validateOTP(enteredOTP)) return;

        try {
            // Save user to localStorage
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const newUser = {
                id: Date.now(),
                ...this.tempUserData,
                createdAt: new Date().toISOString(),
                verified: true
            };
            
            // Remove password confirmation before saving
            delete newUser.confirmPassword;
            
            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));

            // Set as current user
            const currentUser = { ...newUser };
            delete currentUser.password; // Don't store password in current user
            localStorage.setItem('currentUser', JSON.stringify(currentUser));

            Utils.showToast('Account created successfully!', 'success');

            // Close modal and redirect
            document.getElementById('otp-modal').style.display = 'none';
            
            setTimeout(() => {
                const redirect = new URLSearchParams(window.location.search).get('redirect');
                window.location.href = redirect || 'user-dashboard.html';
            }, 2000);

        } catch (error) {
            console.error('Error creating account:', error);
            Utils.showToast('Error creating account', 'error');
        }
    }

    async verifyLoginOTP() {
        const enteredOTP = this.getEnteredOTP('login-otp-');
        
        if (!this.validateOTP(enteredOTP)) return;

        try {
            // Set as current user
            const currentUser = { ...this.tempUserData };
            delete currentUser.password; // Don't store password in current user
            localStorage.setItem('currentUser', JSON.stringify(currentUser));

            // Update last login
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const userIndex = users.findIndex(u => u.email === this.tempUserData.email);
            if (userIndex !== -1) {
                users[userIndex].lastLogin = new Date().toISOString();
                localStorage.setItem('users', JSON.stringify(users));
            }

            Utils.showToast('Login successful!', 'success');

            // Close modal and redirect
            document.getElementById('login-otp-modal').style.display = 'none';
            
            setTimeout(() => {
                const redirect = new URLSearchParams(window.location.search).get('redirect');
                window.location.href = redirect || 'user-dashboard.html';
            }, 2000);

        } catch (error) {
            console.error('Error logging in:', error);
            Utils.showToast('Error logging in', 'error');
        }
    }

    getEnteredOTP(prefix) {
        let otp = '';
        for (let i = 1; i <= 6; i++) {
            const input = document.getElementById(`${prefix}${i}`);
            if (input) otp += input.value;
        }
        return otp;
    }

    validateOTP(enteredOTP) {
        if (enteredOTP.length !== 6) {
            Utils.showToast('Please enter all 6 digits', 'error');
            return false;
        }

        if (Date.now() > this.otpExpiry) {
            Utils.showToast('OTP has expired. Please request a new one.', 'error');
            return false;
        }

        if (enteredOTP !== this.currentOTP) {
            Utils.showToast('Invalid OTP. Please try again.', 'error');
            return false;
        }

        return true;
    }

    resendOTP(type) {
        if (Date.now() - (this.otpExpiry - 5 * 60 * 1000) < 30000) {
            Utils.showToast('Please wait 30 seconds before requesting a new OTP', 'warning');
            return;
        }

        this.generateOTP();
        
        const displayId = type === 'signup' ? 'generated-otp-display' : 'generated-login-otp-display';
        const display = document.getElementById(displayId);
        if (display) {
            display.textContent = this.currentOTP;
        }

        Utils.showToast('New OTP sent', 'success');
    }

    handleSocialAuth(provider) {
        // Simulate social authentication
        Utils.showToast(`${provider} authentication is not implemented in this demo`, 'info');
        
        // In a real app, this would integrate with the provider's OAuth
        if (provider === 'google') {
            // Simulate successful Google login
            setTimeout(() => {
                const demoUser = {
                    id: Date.now(),
                    firstName: 'Demo',
                    lastName: 'User',
                    email: 'demo@gmail.com',
                    phone: '(555) 123-4567',
                    createdAt: new Date().toISOString(),
                    verified: true,
                    provider: 'google'
                };

                localStorage.setItem('currentUser', JSON.stringify(demoUser));
                Utils.showToast('Signed in with Google!', 'success');
                
                setTimeout(() => {
                    const redirect = new URLSearchParams(window.location.search).get('redirect');
                    window.location.href = redirect || 'user-dashboard.html';
                }, 2000);
            }, 1500);
        }
    }

    // Admin login helper (for admin dashboard access)
    static loginAsAdmin() {
        const adminUser = {
            id: 'admin',
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@vrooom.com',
            role: 'admin',
            createdAt: new Date().toISOString()
        };

        localStorage.setItem('currentUser', JSON.stringify(adminUser));
        return adminUser;
    }

    // Check if current user is admin
    static isAdmin() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        return currentUser && currentUser.role === 'admin';
    }
}

// Initialize auth manager
document.addEventListener('DOMContentLoaded', () => {
    new AuthManager();

    // Handle admin access (for development)
    if (window.location.pathname.includes('admin-dashboard.html')) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        if (!currentUser || currentUser.role !== 'admin') {
            // For demo purposes, allow admin access with a secret key combination
            let adminSequence = '';
            document.addEventListener('keydown', (e) => {
                adminSequence += e.key;
                if (adminSequence.includes('admin123')) {
                    AuthManager.loginAsAdmin();
                    location.reload();
                }
                if (adminSequence.length > 10) {
                    adminSequence = '';
                }
            });
            
            // Show admin login info
            setTimeout(() => {
                Utils.showToast('Press "admin123" to access admin dashboard (demo only)', 'info');
            }, 1000);
        }
    }
});

export { AuthManager };
