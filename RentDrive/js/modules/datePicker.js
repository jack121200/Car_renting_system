// Custom date picker implementation
export class DatePicker {
    constructor(input, options = {}) {
        this.input = input;
        this.options = {
            format: 'MM/DD/YYYY',
            minDate: null,
            maxDate: null,
            startDate: null,
            closeOnSelect: true,
            ...options
        };
        
        this.currentDate = new Date();
        this.selectedDate = null;
        this.isVisible = false;
        this.calendar = null;
        
        this.init();
    }

    init() {
        this.input.setAttribute('autocomplete', 'off');
        this.input.setAttribute('readonly', 'true');
        this.setupEventListeners();
        this.createCalendar();
        
        // Set initial value if provided
        if (this.options.startDate) {
            this.setDate(this.options.startDate);
        }
    }

    setupEventListeners() {
        // Show calendar on input focus/click
        this.input.addEventListener('click', (e) => {
            e.preventDefault();
            this.show();
        });

        this.input.addEventListener('focus', (e) => {
            e.preventDefault();
            this.show();
        });

        // Hide calendar on outside click
        document.addEventListener('click', (e) => {
            if (!this.input.contains(e.target) && !this.calendar?.contains(e.target)) {
                this.hide();
            }
        });

        // Handle keyboard navigation
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hide();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                this.show();
            }
        });
    }

    createCalendar() {
        this.calendar = document.createElement('div');
        this.calendar.className = 'date-picker-calendar';
        this.calendar.innerHTML = `
            <div class="calendar-header">
                <button type="button" class="nav-btn prev-month" aria-label="Previous month">
                    <i data-feather="chevron-left"></i>
                </button>
                <div class="month-year"></div>
                <button type="button" class="nav-btn next-month" aria-label="Next month">
                    <i data-feather="chevron-right"></i>
                </button>
            </div>
            <div class="calendar-weekdays">
                <div class="weekday">Su</div>
                <div class="weekday">Mo</div>
                <div class="weekday">Tu</div>
                <div class="weekday">We</div>
                <div class="weekday">Th</div>
                <div class="weekday">Fr</div>
                <div class="weekday">Sa</div>
            </div>
            <div class="calendar-days"></div>
        `;

        // Position calendar relative to input
        this.calendar.style.position = 'absolute';
        this.calendar.style.zIndex = '1000';
        this.calendar.style.display = 'none';

        // Add to DOM
        document.body.appendChild(this.calendar);

        // Setup calendar navigation
        this.calendar.querySelector('.prev-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.updateCalendar();
        });

        this.calendar.querySelector('.next-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.updateCalendar();
        });

        // Initialize feather icons
        if (window.feather) {
            window.feather.replace();
        }

        this.updateCalendar();
    }

    updateCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Update month/year display
        const monthYear = this.calendar.querySelector('.month-year');
        monthYear.textContent = new Intl.DateTimeFormat('en-US', {
            month: 'long',
            year: 'numeric'
        }).format(this.currentDate);

        // Clear days
        const daysContainer = this.calendar.querySelector('.calendar-days');
        daysContainer.innerHTML = '';

        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        // Add empty cells for days before first day of month
        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            daysContainer.appendChild(emptyDay);
        }

        // Add days of month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;
            dayElement.setAttribute('data-date', `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);

            const dayDate = new Date(year, month, day);

            // Check if day is disabled
            const isDisabled = this.isDayDisabled(dayDate);
            if (isDisabled) {
                dayElement.classList.add('disabled');
            } else {
                // Check if day is selected
                if (this.selectedDate && this.isSameDay(dayDate, this.selectedDate)) {
                    dayElement.classList.add('selected');
                }

                // Check if day is today
                if (this.isSameDay(dayDate, new Date())) {
                    dayElement.classList.add('today');
                }

                // Add click handler
                dayElement.addEventListener('click', () => {
                    this.selectDate(dayDate);
                });
            }

            daysContainer.appendChild(dayElement);
        }
    }

    isDayDisabled(date) {
        if (this.options.minDate && date < this.options.minDate) {
            return true;
        }
        if (this.options.maxDate && date > this.options.maxDate) {
            return true;
        }
        return false;
    }

    isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    selectDate(date) {
        this.selectedDate = new Date(date);
        this.setInputValue();
        this.updateCalendar();

        // Trigger change event
        const changeEvent = new Event('change', { bubbles: true });
        this.input.dispatchEvent(changeEvent);

        if (this.options.closeOnSelect) {
            this.hide();
        }
    }

    setInputValue() {
        if (this.selectedDate) {
            this.input.value = this.formatDate(this.selectedDate);
        }
    }

    formatDate(date) {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();

        switch (this.options.format) {
            case 'YYYY-MM-DD':
                return `${year}-${month}-${day}`;
            case 'DD/MM/YYYY':
                return `${day}/${month}/${year}`;
            case 'MM/DD/YYYY':
            default:
                return `${month}/${day}/${year}`;
        }
    }

    setDate(date) {
        this.selectedDate = new Date(date);
        this.currentDate = new Date(date);
        this.setInputValue();
        this.updateCalendar();
    }

    getDate() {
        return this.selectedDate;
    }

    show() {
        if (this.isVisible) return;

        this.positionCalendar();
        this.calendar.style.display = 'block';
        this.isVisible = true;

        // Add show class for animation
        requestAnimationFrame(() => {
            this.calendar.classList.add('show');
        });
    }

    hide() {
        if (!this.isVisible) return;

        this.calendar.classList.remove('show');
        
        // Wait for animation to complete
        setTimeout(() => {
            this.calendar.style.display = 'none';
            this.isVisible = false;
        }, 200);
    }

    positionCalendar() {
        const inputRect = this.input.getBoundingClientRect();
        const calendarRect = this.calendar.getBoundingClientRect();
        
        let top = inputRect.bottom + window.scrollY + 5;
        let left = inputRect.left + window.scrollX;

        // Adjust if calendar would go off screen
        if (left + calendarRect.width > window.innerWidth) {
            left = window.innerWidth - calendarRect.width - 10;
        }

        if (top + calendarRect.height > window.innerHeight + window.scrollY) {
            top = inputRect.top + window.scrollY - calendarRect.height - 5;
        }

        this.calendar.style.top = `${Math.max(10, top)}px`;
        this.calendar.style.left = `${Math.max(10, left)}px`;
    }

    destroy() {
        if (this.calendar && this.calendar.parentNode) {
            this.calendar.parentNode.removeChild(this.calendar);
        }
        this.calendar = null;
        this.selectedDate = null;
    }
}

// Add CSS styles for date picker
const style = document.createElement('style');
style.textContent = `
    .date-picker-calendar {
        background: var(--bg-primary, #ffffff);
        border: 1px solid var(--border-color, #e0e0e0);
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        padding: 20px;
        font-family: inherit;
        min-width: 280px;
        opacity: 0;
        transform: translateY(-10px);
        transition: all 0.2s ease-out;
    }

    .date-picker-calendar.show {
        opacity: 1;
        transform: translateY(0);
    }

    .calendar-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    }

    .calendar-header .month-year {
        font-weight: 600;
        font-size: 1.1rem;
        color: var(--text-primary, #333);
    }

    .nav-btn {
        background: none;
        border: none;
        padding: 8px;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .nav-btn:hover {
        background: var(--bg-secondary, #f5f5f5);
    }

    .calendar-weekdays {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 2px;
        margin-bottom: 10px;
    }

    .weekday {
        text-align: center;
        font-weight: 600;
        font-size: 0.9rem;
        color: var(--text-muted, #666);
        padding: 8px 4px;
    }

    .calendar-days {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 2px;
    }

    .calendar-day {
        aspect-ratio: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 0.9rem;
        position: relative;
    }

    .calendar-day:hover:not(.disabled):not(.empty) {
        background: var(--primary-color, #007bff);
        color: white;
    }

    .calendar-day.selected {
        background: var(--primary-color, #007bff);
        color: white;
        font-weight: 600;
    }

    .calendar-day.today:not(.selected) {
        background: var(--bg-secondary, #f5f5f5);
        font-weight: 600;
        color: var(--primary-color, #007bff);
    }

    .calendar-day.disabled {
        color: var(--text-muted, #ccc);
        cursor: not-allowed;
    }

    .calendar-day.empty {
        cursor: default;
    }

    /* Dark theme support */
    [data-theme="dark"] .date-picker-calendar {
        background: var(--bg-primary, #2a2a2a);
        border-color: var(--border-color, #404040);
        color: var(--text-primary, #fff);
    }

    [data-theme="dark"] .nav-btn:hover {
        background: var(--bg-secondary, #404040);
    }

    [data-theme="dark"] .calendar-day.today:not(.selected) {
        background: var(--bg-secondary, #404040);
    }
`;

// Add styles to document head
if (!document.querySelector('#date-picker-styles')) {
    style.id = 'date-picker-styles';
    document.head.appendChild(style);
}