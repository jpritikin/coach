document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll<HTMLElement>('span.hover-swap').forEach(el => {
    const original = el.textContent ?? '';
    const alternate = el.dataset.hover ?? '';
    const href = el.dataset.href;
    el.addEventListener('mouseenter', () => { el.textContent = alternate; });
    el.addEventListener('mouseleave', () => { el.textContent = original; });
    if (href) {
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => { window.location.href = href; });
    }
  });
});
