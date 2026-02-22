(function () {
    var tiles = document.querySelectorAll('.tile');

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                var delay = parseInt(entry.target.dataset.delay || '0', 10);
                setTimeout(function () {
                    entry.target.classList.add('visible');
                }, delay * 80);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.05 });

    tiles.forEach(function (tile) { observer.observe(tile); });
})();
