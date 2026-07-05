import { onMounted, onActivated, onDeactivated, nextTick } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';

export function useScrollReveal() {
  let observer: IntersectionObserver | null = null;

  const setup = () => {
    if (observer) observer.disconnect();
    observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        } else {
          const rect = entry.target.getBoundingClientRect();
          // Remove class when element goes below the viewport to allow re-triggering animation when scrolling down again
          if (rect.top > window.innerHeight * 0.8) {
            entry.target.classList.remove('is-visible');
          }
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(el => observer.observe(el));
  };

  const reset = () => {
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(el => {
      el.classList.remove('is-visible');
    });
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  };

  onMounted(() => {
    nextTick(() => {
      setTimeout(setup, 100);
    });
  });

  onActivated(() => {
    reset(); // reset first just in case
    nextTick(() => {
      setTimeout(setup, 100);
    });
  });

  onDeactivated(() => {
    reset();
  });

  onBeforeRouteLeave(() => {
    // 离开页面时立刻剥离 is-visible，触发 CSS 散开/消失动画
    reset();
  });

  return { setup, reset };
}
