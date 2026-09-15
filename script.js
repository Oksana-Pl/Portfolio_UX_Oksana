(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches || !('IntersectionObserver' in window)) return;

  const cardSelector = '.card, .education-card, .reference-card, .process-card, .learning-card, .case-study__media, .case-split__media, .case-hero__scroll';
  const cards = [...document.querySelectorAll(cardSelector)];
  const blocks = [...document.querySelectorAll('main h1, main h2, main h3, main p, .case-feature-list li')]
    .filter(block => !block.closest(cardSelector));

  function measureWords(block) {
    let previousTop = null, line = -1, wordInLine = 0;
    block.querySelectorAll('.reveal-word').forEach(word => {
      const top = word.getBoundingClientRect().top;
      if (previousTop === null || Math.abs(top - previousTop) > 3) {
        line++;
        wordInLine = 0;
        previousTop = top;
      }
      word.style.transitionDelay = `${line * .14 + wordInLine++ * .022}s`;
    });
  }

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const element = entry.target;
      if (element.classList.contains('reveal-card')) element.classList.add('is-visible');
      else {
        measureWords(element);
        element.classList.add('text-visible');
      }
      observer.unobserve(element);
    }
  }, { threshold: .08 });

  blocks.forEach(block => {
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const fragment = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(word => {
        if (!word.trim()) fragment.append(document.createTextNode(word));
        else {
          const span = document.createElement('span');
          span.className = 'reveal-word';
          span.textContent = word;
          fragment.append(span);
        }
      });
      node.replaceWith(fragment);
    });
    observer.observe(block);
  });

  function measureCards() {
    const rows = new Map();
    cards.forEach(card => {
      const top = card.offsetTop;
      const previous = rows.get(card.parentElement);
      const column = previous && Math.abs(top - previous.top) <= 3 ? previous.column + 1 : 0;
      card.style.setProperty('--reveal-delay', `${column * .12}s`);
      rows.set(card.parentElement, { top, column });
    });
  }
  measureCards();
  cards.forEach(card => {
    card.classList.add('reveal-card');
    observer.observe(card);
  });
  window.addEventListener('resize', measureCards, { passive: true });
  if (document.fonts) document.fonts.ready.then(measureCards);

  // Keyboard navigation should never focus an invisible card.
  document.addEventListener('focusin', event => {
    const card = event.target.closest('.reveal-card');
    if (card) {
      card.classList.add('is-visible');
      observer.unobserve(card);
    }
  });
  motion.addEventListener('change', event => {
    if (!event.matches) return;
    observer.disconnect();
    blocks.forEach(block => block.classList.add('text-visible'));
    cards.forEach(card => card.classList.add('is-visible'));
  });
})();
