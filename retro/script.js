(function () {
    var titleScreen = document.getElementById('title-screen');
    var panels = document.querySelectorAll('.panel');
    var barFills = document.querySelectorAll('.pixel-bar-fill');

    // Title screen click - scroll to game
    titleScreen.addEventListener('click', function () {
        document.getElementById('game-screen').scrollIntoView({ behavior: 'smooth' });
    });

    // Panel reveal on scroll
    var panelObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                panelObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    panels.forEach(function (p) { panelObserver.observe(p); });

    // Stat bar fill on scroll
    var barObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                var fill = entry.target;
                fill.style.setProperty('--pct', fill.dataset.pct + '%');
                fill.classList.add('filled');
                barObserver.unobserve(fill);
            }
        });
    }, { threshold: 0.3 });

    barFills.forEach(function (f) { barObserver.observe(f); });
})();
