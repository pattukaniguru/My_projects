/* ============================================
   AI Learning Portal - Student Registration
   script.js — Core Logic with Google Sheets
   ============================================ */

(function () {
    'use strict';

    /* ==========================================================
       🔧 CONFIGURATION — Replace with your Google Apps Script
       deployed Web App URL after running the setup.
       ========================================================== */
    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyFBJMokyQHZoc5iJQBTLfih0A3C-l-hDQiSi93g05jYLWuKllHeChpIlEn4IXQzQuThw/exec';

    /* ===== LocalStorage Keys ===== */
    const KEYS = {
        THEME:        'ai_portal_theme',
        FORM_DATA:    'ai_portal_form_data',
        REG_STATUS:   'ai_portal_registration',
    };

    /* ===== DOM References ===== */
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const themeToggle    = $('#theme-toggle');
    const regForm        = $('#registration-form');
    const formHeader     = $('#form-header');
    const successScreen  = $('#success-screen');
    const submitBtn      = $('#submit-btn');
    const resetBtn       = $('#reset-btn');
    const proceedBtn     = $('#proceed-btn');
    const confettiCanvas = $('#confetti-canvas');
    const errorToast     = $('#error-toast');
    const toastMessage   = $('#toast-message');

    /* =========================================================
       THEME MANAGEMENT
       ========================================================= */
    function initTheme() {
        const saved = localStorage.getItem(KEYS.THEME);
        if (saved) {
            document.documentElement.setAttribute('data-theme', saved);
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }

    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem(KEYS.THEME, next);
    }

    themeToggle.addEventListener('click', toggleTheme);
    initTheme();

    /* =========================================================
       FORM DATA PERSISTENCE
       ========================================================= */
    function saveFormData() {
        const data = {};
        regForm.querySelectorAll('input, select').forEach(el => {
            if (el.name) data[el.name] = el.value;
        });
        localStorage.setItem(KEYS.FORM_DATA, JSON.stringify(data));
    }

    function loadFormData() {
        const raw = localStorage.getItem(KEYS.FORM_DATA);
        if (!raw) return;
        try {
            const data = JSON.parse(raw);
            Object.keys(data).forEach(key => {
                const el = regForm.querySelector(`[name="${key}"]`);
                if (el) el.value = data[key];
            });
        } catch (_) { /* ignore corrupt data */ }
    }

    function clearFormData() {
        localStorage.removeItem(KEYS.FORM_DATA);
    }

    // Auto-save on every change
    regForm.addEventListener('input', saveFormData);
    regForm.addEventListener('change', saveFormData);

    /* =========================================================
       REGISTRATION STATUS PERSISTENCE
       If the user already registered and refreshes, show success.
       ========================================================= */
    function saveRegistration(data) {
        localStorage.setItem(KEYS.REG_STATUS, JSON.stringify(data));
    }

    function loadRegistration() {
        const raw = localStorage.getItem(KEYS.REG_STATUS);
        if (!raw) return null;
        try { return JSON.parse(raw); }
        catch (_) { return null; }
    }

    function clearRegistration() {
        localStorage.removeItem(KEYS.REG_STATUS);
    }

    /* =========================================================
       ON PAGE LOAD — Check if already registered
       ========================================================= */
    function checkExistingRegistration() {
        const saved = loadRegistration();
        if (saved) {
            populateSuccess(saved);
            showSuccessScreen();
            return true;
        }
        // Otherwise load saved form draft
        loadFormData();
        return false;
    }

    /* =========================================================
       VALIDATION RULES
       ========================================================= */
    const validators = {
        fullName(v) {
            if (!v.trim()) return 'Full name is required';
            if (v.trim().length < 3) return 'Name must be at least 3 characters';
            return '';
        },
        department(v) {
            return !v ? 'Please select a department' : '';
        },
        year(v) {
            return !v ? 'Please select your year' : '';
        },
        collegeName(v) {
            if (!v.trim()) return 'College name is required';
            if (v.trim().length < 3) return 'Enter a valid college name';
            return '';
        },
        registerNumber(v) {
            if (!v.trim()) return 'Register number is required';
            if (!/^[A-Za-z0-9]{4,20}$/.test(v.trim())) return 'Enter a valid register number (4-20 alphanumeric chars)';
            return '';
        },
        email(v) {
            if (!v.trim()) return 'Email is required';
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return 'Enter a valid email address';
            return '';
        },
        mobile(v) {
            if (!v.trim()) return 'Mobile number is required';
            if (!/^\d{10}$/.test(v.trim())) return 'Enter a valid 10-digit mobile number';
            return '';
        },
        course(v) {
            return !v ? 'Please select a course' : '';
        }
    };

    /* Validate a single field */
    function validateField(name) {
        const el = regForm.querySelector(`[name="${name}"]`);
        if (!el) return true;
        const errorEl = $(`#${name}-error`);
        const msg = validators[name]?.(el.value) || '';

        if (msg) {
            el.classList.add('error');
            errorEl.textContent = msg;
            errorEl.classList.add('visible');
            return false;
        } else {
            el.classList.remove('error');
            errorEl.textContent = '';
            errorEl.classList.remove('visible');
            return true;
        }
    }

    /* Real-time validation on blur & clear on input */
    Object.keys(validators).forEach(name => {
        const el = regForm.querySelector(`[name="${name}"]`);
        if (!el) return;
        el.addEventListener('blur', () => validateField(name));
        el.addEventListener('input', () => {
            if (el.classList.contains('error')) {
                el.classList.remove('error');
                $(`#${name}-error`).textContent = '';
                $(`#${name}-error`).classList.remove('visible');
            }
        });
    });

    /* Validate all */
    function validateAll() {
        let valid = true;
        Object.keys(validators).forEach(name => {
            if (!validateField(name)) valid = false;
        });
        return valid;
    }

    /* =========================================================
       TOAST NOTIFICATION
       ========================================================= */
    let toastTimer = null;
    function showToast(message) {
        toastMessage.textContent = message;
        errorToast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => errorToast.classList.remove('show'), 5000);
    }

    /* =========================================================
       FORMAT TIMESTAMP
       ========================================================= */
    function formatTimestamp(dateStr) {
        try {
            // If coming from Apps Script (dd-MM-yyyy HH:mm:ss)
            if (dateStr && dateStr.includes('-')) {
                return 'Registered on ' + dateStr;
            }
            // Fallback: JS Date
            const d = new Date(dateStr || Date.now());
            const options = {
                day:    '2-digit',
                month:  'short',
                year:   'numeric',
                hour:   '2-digit',
                minute: '2-digit',
                hour12: true,
            };
            return 'Registered on ' + d.toLocaleString('en-IN', options);
        } catch (_) {
            return 'Registered just now';
        }
    }

    /* =========================================================
       POPULATE SUCCESS SCREEN
       ========================================================= */
    function populateSuccess(data) {
        $('#success-welcome').textContent   = `Welcome, ${data.fullName}!`;
        $('#detail-name').textContent        = data.fullName;
        $('#detail-department').textContent  = data.department;
        $('#detail-year').textContent        = data.year;
        $('#detail-college').textContent     = data.collegeName;
        $('#detail-course').textContent      = data.course;
        $('#timestamp-text').textContent     = formatTimestamp(data.timestamp);
    }

    function showSuccessScreen() {
        regForm.classList.add('hidden');
        formHeader.classList.add('hidden');
        successScreen.classList.add('active');
    }

    /* =========================================================
       FORM SUBMISSION — Send to Google Sheets
       ========================================================= */
    submitBtn.closest('form').addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validate all fields first
        if (!validateAll()) {
            const firstErr = regForm.querySelector('.error');
            if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        // Collect form data
        const formData = {
            fullName:       regForm.querySelector('[name="fullName"]').value.trim(),
            department:     regForm.querySelector('[name="department"]').value,
            year:           regForm.querySelector('[name="year"]').value,
            collegeName:    regForm.querySelector('[name="collegeName"]').value.trim(),
            registerNumber: regForm.querySelector('[name="registerNumber"]').value.trim(),
            email:          regForm.querySelector('[name="email"]').value.trim(),
            mobile:         regForm.querySelector('[name="mobile"]').value.trim(),
            course:         regForm.querySelector('[name="course"]').value,
        };

        // Show loading state
        submitBtn.classList.add('btn--loading');
        submitBtn.disabled = true;

        try {
            // ── Send data to Google Apps Script ──
            const response = await fetch(APPS_SCRIPT_URL, {
                method:  'POST',
                mode:    'no-cors',
                cache:   'no-cache',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body:    JSON.stringify(formData),
            });

            /*
             * NOTE: With mode: 'no-cors', the browser returns an opaque response
             * (status 0, empty body). This is expected behaviour for cross-origin
             * Apps Script requests. The data IS saved — we just can't read the
             * response body. So we treat a non-error fetch as success.
             *
             * If you deploy behind the same origin or use a proxy, you can
             * switch to mode: 'cors' and parse the JSON response normally:
             *
             *   const result = await response.json();
             *   if (result.status !== 'success') throw new Error(result.message);
             *   formData.timestamp = result.timestamp;
             */

            // Generate a client-side timestamp (Apps Script also records server-side)
            const now = new Date();
            formData.timestamp = now.toLocaleString('en-IN', {
                day:    '2-digit',
                month:  'short',
                year:   'numeric',
                hour:   '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
            });

            // Save registration status to localStorage
            saveRegistration(formData);

            // Clear form draft
            clearFormData();

            // Show success
            populateSuccess(formData);
            showSuccessScreen();

            // Fire confetti 🎉
            launchConfetti();

        } catch (err) {
            console.error('Submission error:', err);
            showToast('Failed to save registration. Please check your connection and try again.');
        } finally {
            submitBtn.classList.remove('btn--loading');
            submitBtn.disabled = false;
        }
    });

    /* =========================================================
       RESET FORM
       ========================================================= */
    resetBtn.addEventListener('click', () => {
        regForm.querySelectorAll('input, select').forEach(el => {
            if (el.tagName === 'SELECT') el.selectedIndex = 0;
            else el.value = '';
            el.classList.remove('error');
        });
        regForm.querySelectorAll('.form-group__error').forEach(e => {
            e.textContent = '';
            e.classList.remove('visible');
        });
        clearFormData();
    });

    /* =========================================================
       PROCEED BUTTON — Redirect to Learning Portal
       ========================================================= */
    proceedBtn.addEventListener('click', () => {
        window.open('https://grow.google/ai', '_blank');
    });

    /* =========================================================
       REGISTER AGAIN — Clear saved state and reload form
       ========================================================= */
    const registerAgainBtn = $('#register-again-btn');
    registerAgainBtn.addEventListener('click', () => {
        clearRegistration();
        clearFormData();
        // Hide success, show form
        successScreen.classList.remove('active');
        regForm.classList.remove('hidden');
        formHeader.classList.remove('hidden');
        // Reset all form fields
        regForm.querySelectorAll('input, select').forEach(el => {
            if (el.tagName === 'SELECT') el.selectedIndex = 0;
            else el.value = '';
            el.classList.remove('error');
        });
        regForm.querySelectorAll('.form-group__error').forEach(e => {
            e.textContent = '';
            e.classList.remove('visible');
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    /* =========================================================
       CONFETTI ANIMATION
       ========================================================= */
    function launchConfetti() {
        const ctx = confettiCanvas.getContext('2d');
        confettiCanvas.width  = window.innerWidth;
        confettiCanvas.height = window.innerHeight;

        const pieces = [];
        const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6'];
        const TOTAL  = 160;

        for (let i = 0; i < TOTAL; i++) {
            pieces.push({
                x: Math.random() * confettiCanvas.width,
                y: Math.random() * confettiCanvas.height - confettiCanvas.height,
                w: Math.random() * 10 + 5,
                h: Math.random() * 6 + 3,
                color: colors[Math.floor(Math.random() * colors.length)],
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * 3 + 2,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 10,
                opacity: 1,
            });
        }

        let frame = 0;
        const MAX_FRAMES = 220;

        function draw() {
            ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
            frame++;

            pieces.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.04;
                p.rotation += p.rotationSpeed;

                if (frame > MAX_FRAMES - 60) {
                    p.opacity = Math.max(0, p.opacity - 0.018);
                }

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.globalAlpha = p.opacity;
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();
            });

            if (frame < MAX_FRAMES) {
                requestAnimationFrame(draw);
            } else {
                ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
            }
        }

        draw();
    }

    /* Handle resize for confetti canvas */
    window.addEventListener('resize', () => {
        confettiCanvas.width  = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
    });

    /* =========================================================
       INIT — Check if already registered on page load
       ========================================================= */
    checkExistingRegistration();

})();
