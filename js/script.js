document.getElementById('current-date').textContent = new Date().getFullYear();

const navToggle = document.querySelector('.nav-toggle');
const primaryNavigation = document.getElementById('primary-navigation');

if (navToggle && primaryNavigation) {
    const closeNavigation = () => {
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Otwórz menu');
        navToggle.setAttribute('title', 'Otwórz menu');
        navToggle.closest('nav').classList.remove('is-open');
    };

    navToggle.addEventListener('click', () => {
        const shouldExpand = navToggle.getAttribute('aria-expanded') !== 'true';
        navToggle.setAttribute('aria-expanded', String(shouldExpand));
        navToggle.setAttribute('aria-label', shouldExpand ? 'Zamknij menu' : 'Otwórz menu');
        navToggle.setAttribute('title', shouldExpand ? 'Zamknij menu' : 'Otwórz menu');
        navToggle.closest('nav').classList.toggle('is-open', shouldExpand);
    });

    primaryNavigation.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeNavigation);
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') {
            closeNavigation();
            navToggle.focus();
        }
    });

    window.matchMedia('(min-width: 601px)').addEventListener('change', closeNavigation);
}

        const logoMark = document.querySelector('.logo-mark');
        if (logoMark) {
            logoMark.addEventListener('mouseenter', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        const contactForm = document.getElementById('contact-form');
        const contactStatus = document.getElementById('contact-form-status');

        function setContactStatus(message, type) {
            if (!contactStatus) return;
            contactStatus.textContent = message;
            contactStatus.className = `form-status ${type}`;
        }

        if (contactForm) {
            contactForm.addEventListener('submit', async function (event) {
                event.preventDefault();
                setContactStatus('', '');

                const formData = new FormData(contactForm);
                const payload = {
                    name: (formData.get('name') || '').toString().trim(),
                    email: (formData.get('email') || '').toString().trim(),
                    subject: (formData.get('subject') || '').toString().trim(),
                    message: (formData.get('message') || '').toString().trim()
                };

                if (!payload.name || !payload.email || !payload.subject || !payload.message) {
                    setContactStatus('Uzupełnij wszystkie pola formularza.', 'error');
                    return;
                }

                try {
                    const response = await fetch('/api/contact', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    });

                    const result = await response.json();

                    if (!response.ok) {
                        throw new Error(result.error || 'Nie udało się wysłać wiadomości.');
                    }

                    contactForm.reset();
                    setContactStatus('Wiadomość została wysłana poprawnie.', 'success');
                } catch (error) {
                    setContactStatus(error.message || 'Nie udało się wysłać wiadomości.', 'error');
                }
            });
        }
