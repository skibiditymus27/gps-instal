function isPhoneValid(value) {
  return /^[+]?\d[\d\s-]{6,}$/.test(value);
}

function initPage() {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return;
  }

  const observedSections = document.querySelectorAll('[data-observe]');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const raf = window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : (cb) => setTimeout(cb, 16);

  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.18 });

    observedSections.forEach(section => sectionObserver.observe(section));
  } else {
    observedSections.forEach(section => section.classList.add('reveal'));
  }

  const form = document.getElementById('contact-form');
  const modal = document.getElementById('modal');
  const closeBtn = document.getElementById('closeModal');
  const formFeedback = document.getElementById('formFeedback');
  const phoneInput = document.getElementById('phone');
  const focusableSelectors = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
  let lastFocusedElement = null;
  let focusableModalElements = [];

  function setFeedback(message, type = 'success') {
    if (!formFeedback) return;
    formFeedback.textContent = message;
    formFeedback.classList.remove('error', 'success');
    formFeedback.classList.add(type);
  }

  function resetFeedback() {
    if (!formFeedback) return;
    formFeedback.textContent = '';
    formFeedback.classList.remove('error', 'success');
  }

  function trapFocus(event) {
    if (!modal || !modal.classList.contains('show') || !focusableModalElements.length) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      hideModal();
      return;
    }

    if (event.key !== 'Tab') return;

    const firstElement = focusableModalElements[0];
    const lastElement = focusableModalElements[focusableModalElements.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
      return;
    }

    if (document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  function showModal() {
    if (!modal) return;
    lastFocusedElement = document.activeElement;
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');

    raf(() => {
      modal.classList.add('show');
      focusableModalElements = Array.from(modal.querySelectorAll(focusableSelectors));
      const firstElement = focusableModalElements[0];
      if (firstElement && typeof firstElement.focus === 'function') {
        firstElement.focus();
      }
    });

    document.addEventListener('keydown', trapFocus);
  }

  function hideModal() {
    if (!modal) return;
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    setTimeout(() => {
      modal.classList.add('hidden');
      modal.classList.remove('show');
    }, 300);
    document.removeEventListener('keydown', trapFocus);
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    }
  }

  if (phoneInput) {
    phoneInput.addEventListener('input', () => {
      phoneInput.setCustomValidity('');
    });
  }

  if (form) {
    form.addEventListener('submit', event => {
      event.preventDefault();
      resetFeedback();

      if (phoneInput && !isPhoneValid(phoneInput.value.trim())) {
        phoneInput.setCustomValidity('Podaj poprawny numer telefonu.');
      }

      if (!form.reportValidity()) {
        setFeedback('Sprawdź wprowadzone dane i spróbuj ponownie.', 'error');
        return;
      }

      const formData = {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim(),
        city: form.city.value.trim(),
        message: form.message.value.trim(),
        company: form.company.value.trim(),
      };

      if (formData.company) {
        form.reset();
        setFeedback('Dziękujemy! Formularz został wysłany.', 'success');
        showModal();
        return;
      }

      if (window.location.protocol === 'file:') {
        setFeedback('Dziękujemy! Formularz został wysłany.', 'success');
        form.reset();
        showModal();
        return;
      }

      fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData),
      })
        .then(response => {
          if (!response.ok) {
            throw new Error('Błąd podczas wysyłania formularza.');
          }
          return response.json();
        })
        .then(() => {
          setFeedback('Dziękujemy! Formularz został wysłany.', 'success');
          form.reset();
          showModal();
        })
        .catch(error => {
          console.error(error);
          setFeedback('Wystąpił problem z przesłaniem formularza. Spróbuj ponownie później.', 'error');
        });
    });
  }

  if (modal && closeBtn) {
    closeBtn.addEventListener('click', () => {
      hideModal();
    });

    modal.addEventListener('click', event => {
      if (event.target === modal) {
        hideModal();
      }
    });
  }

  // Custom smooth scroll for navigation links
  document.querySelectorAll('header nav a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      if (!targetElement) return;

      const header = document.querySelector('header');
      const headerOffset = header ? header.offsetHeight : 0;
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset - 24;
      const startPosition = window.pageYOffset;
      const distance = offsetPosition - startPosition;
      const duration = 600; // 0.6 second scroll duration
      let startTime = null;

      function animation(currentTime) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const run = ease(timeElapsed, startPosition, distance, duration);
        window.scrollTo(0, run);
        if (timeElapsed < duration) requestAnimationFrame(animation);
      }

      // Ease-in-out quadratic function
      function ease(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
      }

      requestAnimationFrame(animation);
    });
  });

  return {
    showModal,
    hideModal
  };
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', initPage);
}

if (typeof module !== 'undefined') {
  module.exports = { isPhoneValid, initPage };
}
