document.getElementById('current-date').textContent = new Date().getFullYear();

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
