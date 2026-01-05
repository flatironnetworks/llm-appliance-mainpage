// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar scroll effect
const navbar = document.querySelector('.navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
});

// Mobile menu toggle
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        mobileMenuToggle.classList.toggle('active');
    });
}

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (navLinks && !navLinks.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
        navLinks.classList.remove('active');
        mobileMenuToggle.classList.remove('active');
    }
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.feature-card, .problem-card, .use-case-card, .step-item').forEach(el => {
    observer.observe(el);
});

// Form submission handler
const contactForm = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData);
        
        // Get Turnstile token
        const turnstileToken = document.querySelector('[name="cf-turnstile-response"]')?.value;
        if (!turnstileToken) {
            alert('Please complete the security verification.');
            return;
        }
        data['cf-turnstile-response'] = turnstileToken;
        
        // Send form data to Cloudflare Worker
        // Worker URL - using custom domain
        const workerUrl = 'https://form.llmappliance.com';
        
        if (workerUrl.includes('YOUR_WORKER_URL')) {
            alert('Worker URL not configured. Please update script.js with your Worker URL.');
            console.error('Worker URL not set. Deploy the worker and update script.js');
            return;
        }
        
        try {
            const response = await fetch(workerUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                // Hide form and show success message
                contactForm.style.display = 'none';
                formSuccess.style.display = 'block';
                
                // Scroll to success message
                formSuccess.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                
                // Reset form for potential future use
                contactForm.reset();
            } else {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                console.error('Form submission error:', errorData);
                console.error('Response status:', response.status);
                console.error('Response statusText:', response.statusText);
                alert('There was an error submitting the form. Please try again or contact us directly.');
            }
        } catch (error) {
            console.error('Network error:', error);
            console.error('Error details:', error.message);
            console.error('Worker URL:', workerUrl);
            alert('There was a network error. Please check your connection and try again. Check browser console (F12) for details.');
        }
    });
}

// Add parallax effect to hero background orbs
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const orbs = document.querySelectorAll('.gradient-orb');
    
    orbs.forEach((orb, index) => {
        const speed = 0.5 + (index * 0.1);
        orb.style.transform = `translateY(${scrolled * speed}px)`;
    });
});

// Add hover effect to feature cards
document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-8px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Animate stats on scroll
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statNumber = entry.target.querySelector('.stat-number');
            if (statNumber && !statNumber.classList.contains('animated')) {
                statNumber.classList.add('animated');
                animateValue(statNumber, 0, parseInt(statNumber.textContent.replace(/[^0-9]/g, '')), 1000);
            }
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-item').forEach(stat => {
    statsObserver.observe(stat);
});

// Simple number animation function
function animateValue(element, start, end, duration) {
    const text = element.textContent;
    const isPercent = text.includes('%');
    const isTime = text.includes('hour');
    
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const current = Math.floor(progress * (end - start) + start);
        
        if (isPercent) {
            element.textContent = current + '%';
        } else if (isTime) {
            element.textContent = '<' + current + ' hour';
        } else {
            element.textContent = current;
        }
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Add loading animation
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});

// Console message (fun easter egg)
console.log('%c⚡ LLM Appliance', 'font-size: 20px; font-weight: bold; color: #6366f1;');
console.log('%cSelf-Hosted LLM with Zero Data Retention', 'font-size: 12px; color: #6b7280;');
console.log('%cInterested in learning more? Visit our contact form!', 'font-size: 12px; color: #10b981;');
