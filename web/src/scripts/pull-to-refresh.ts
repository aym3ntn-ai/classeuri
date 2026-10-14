// Pull-to-refresh for the installed app. A home-screen app on iOS has no Safari
// controls, so pulling down only bounces the page; here pulling past a threshold
// reloads it. Browsers keep their own gesture, so this runs only when installed.

const indicator = document.querySelector<HTMLElement>('[data-ptr]');
const label = indicator?.querySelector<HTMLElement>('[data-ptr-label]');
const standalone =
  matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;

if (indicator && label && standalone) {
  const strings = JSON.parse(indicator.dataset.ptr!) as { pull: string; release: string; refreshing: string };
  /** Finger travel, in px, that triggers a refresh. */
  const THRESHOLD = 80;
  const MAX = 130;
  let startY: number | null = null;
  let distance = 0;
  let refreshing = false;

  document.documentElement.classList.add('ptr-enabled');

  const render = () => {
    const shown = Math.min(distance, MAX) * 0.6;
    indicator.style.transform = `translate(-50%, ${shown - 60}px)`;
    indicator.style.opacity = String(Math.min(1, distance / THRESHOLD));
    indicator.classList.toggle('ready', distance >= THRESHOLD);
    indicator.style.setProperty('--turn', `${Math.min(distance / THRESHOLD, 1) * 270}deg`);
    label.textContent = distance >= THRESHOLD ? strings.release : strings.pull;
  };

  const reset = () => {
    startY = null;
    distance = 0;
    indicator.style.transition = 'transform .2s ease, opacity .2s ease';
    render();
  };

  window.addEventListener(
    'touchstart',
    (event) => {
      if (refreshing || window.scrollY > 0 || event.touches.length !== 1) return;
      startY = event.touches[0]!.clientY;
      indicator.style.transition = 'none';
    },
    { passive: true },
  );

  window.addEventListener(
    'touchmove',
    (event) => {
      if (startY === null) return;
      if (window.scrollY > 0) return reset();
      distance = Math.max(0, event.touches[0]!.clientY - startY);
      render();
    },
    { passive: true },
  );

  window.addEventListener('touchend', () => {
    if (startY === null) return;
    if (distance < THRESHOLD) return reset();
    refreshing = true;
    startY = null;
    indicator.style.transition = 'transform .2s ease';
    indicator.style.transform = 'translate(-50%, 18px)';
    indicator.style.opacity = '1';
    indicator.classList.add('spinning');
    label.textContent = strings.refreshing;
    location.reload();
  });

  window.addEventListener('touchcancel', reset);
}
