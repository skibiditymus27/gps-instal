document.addEventListener('DOMContentLoaded', () => {
  const sections = document.querySelectorAll('section');
  sections.forEach((sec, i) => {
    setTimeout(() => {
      sec.classList.add('reveal');
    }, 500 * i);
  });

  window.addEventListener('scroll', () => {
    sections.forEach(sec => {
      const top = sec.getBoundingClientRect().top;
      if (top < window.innerHeight - 100) sec.classList.add('reveal');
    });
  });

  const form = document.querySelector('form');
  const modal = document.getElementById('modal');
  const closeBtn = document.getElementById('closeModal');

  function showModal() {
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.add('show'), 20);
  }

  function hideModal() {
    modal.classList.remove('show');
    setTimeout(() => modal.classList.add('hidden'), 300);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (form.checkValidity()) {
      showModal();
      form.reset();
    }
  });

  closeBtn.addEventListener('click', hideModal);
  window.addEventListener('click', (e) => { if (e.target === modal) hideModal(); });
});
