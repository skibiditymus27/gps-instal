document.addEventListener('DOMContentLoaded', () => {
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

  function isPhoneValid(value) {
    return /^[+]?\d[\d\s-]{6,}$/.test(value);
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
      firstElement?.focus();
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

      setFeedback('Dziękujemy! Formularz został wysłany.', 'success');
      form.reset();
      showModal();
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
});
