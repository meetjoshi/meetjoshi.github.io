(function () {
    var progressBar = document.getElementById('progress-bar');
    var chapters = document.querySelectorAll('.chapter');
    var navDots = document.querySelectorAll('.nav-dot');
    var letters = document.querySelectorAll('.letter');
    var craftBars = document.querySelectorAll('.craft-bar');
    var counterEl = document.querySelector('.counter');
    var counterDone = false;

    // Scroll progress bar
    function updateProgress() {
        var scrollTop = window.scrollY;
        var docHeight = document.documentElement.scrollHeight - window.innerHeight;
        var pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        progressBar.style.width = pct + '%';
    }

    // Chapter nav dot tracking
    var chapterObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                var idx = Array.from(chapters).indexOf(entry.target);
                navDots.forEach(function (dot, i) {
                    dot.classList.toggle('active', i === idx);
                });
            }
        });
    }, { threshold: 0.3 });

    chapters.forEach(function (ch) { chapterObserver.observe(ch); });

    // Nav dot click
    navDots.forEach(function (dot) {
        dot.addEventListener('click', function () {
            var idx = parseInt(dot.dataset.chapter, 10);
            chapters[idx].scrollIntoView({ behavior: 'smooth' });
        });
    });

    // Reveal animations
    var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right').forEach(function (el) {
        revealObserver.observe(el);
    });

    // Hero letters staggered reveal
    function revealLetters() {
        letters.forEach(function (letter, i) {
            setTimeout(function () {
                letter.classList.add('visible');
            }, 120 * i);
        });
    }

    var introObserver = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
            revealLetters();
            introObserver.disconnect();
        }
    }, { threshold: 0.5 });

    introObserver.observe(document.getElementById('ch-intro'));

    // Skill bars fill on scroll
    var barObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                var bar = entry.target;
                var w = bar.dataset.width;
                bar.style.setProperty('--bar-w', w + '%');
                bar.classList.add('filled');
                barObserver.unobserve(bar);
            }
        });
    }, { threshold: 0.3 });

    craftBars.forEach(function (bar) { barObserver.observe(bar); });

    // Counter animation
    function animateCounter(target) {
        if (counterDone) return;
        counterDone = true;
        var current = 0;
        var duration = 800;
        var start = performance.now();
        function tick(now) {
            var elapsed = now - start;
            var progress = Math.min(elapsed / duration, 1);
            current = Math.round(progress * target);
            counterEl.textContent = current;
            if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    var counterObserver = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
            var target = parseInt(entries[0].target.dataset.target, 10);
            animateCounter(target);
            counterObserver.disconnect();
        }
    }, { threshold: 0.5 });

    var counterWrap = document.querySelector('.win-counter');
    if (counterWrap) counterObserver.observe(counterWrap);

    // Path line fill on scroll
    var pathLine = document.getElementById('path-line');
    var pathSection = document.getElementById('ch-path');
    if (pathLine && pathSection) {
        function updatePathLine() {
            var rect = pathSection.getBoundingClientRect();
            var scrolled = -rect.top;
            var range = rect.height - window.innerHeight;
            var pct = Math.max(0, Math.min(100, (scrolled / range) * 100));
            pathLine.style.background =
                'linear-gradient(to bottom, var(--accent) ' + pct + '%, var(--border) ' + pct + '%)';
        }
        window.addEventListener('scroll', updatePathLine, { passive: true });
    }

    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
})();
