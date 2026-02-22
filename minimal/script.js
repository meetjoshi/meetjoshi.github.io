(function() {
    const nav = document.getElementById('nav');
    const lightbox = document.getElementById('lightbox');
    const lbImg = document.getElementById('lb-img');
    const lbCaption = document.getElementById('lb-caption');
    const galleryImages = document.querySelectorAll('.gallery-grid img');
    const navLinks = document.querySelectorAll('.nav-links a');
    const sections = document.querySelectorAll('.section');
    let currentImgIdx = 0;
    const imgList = Array.from(galleryImages);

    // Scroll-triggered fade-in
    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                fadeObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.fade-in').forEach((el) => fadeObserver.observe(el));

    // Nav background on scroll
    window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 50);
    }, { passive: true });

    // Active nav link tracking
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                navLinks.forEach((a) => {
                    a.classList.toggle('active', a.getAttribute('href') === '#' + id);
                });
            }
        });
    }, { threshold: 0.3 });

    sections.forEach((s) => sectionObserver.observe(s));

    // Lightbox
    function openLightbox(idx) {
        currentImgIdx = idx;
        const img = imgList[idx];
        lbImg.src = img.src;
        lbCaption.textContent = img.dataset.caption || '';
        lightbox.classList.add('active');
        document.body.classList.add('lb-open');
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.classList.remove('lb-open');
    }

    function showImg(idx) {
        currentImgIdx = ((idx % imgList.length) + imgList.length) % imgList.length;
        const img = imgList[currentImgIdx];
        lbImg.src = img.src;
        lbCaption.textContent = img.dataset.caption || '';
    }

    galleryImages.forEach((img, i) => {
        img.addEventListener('click', () => openLightbox(i));
    });

    document.getElementById('lb-close').addEventListener('click', closeLightbox);
    document.getElementById('lb-prev').addEventListener('click', () => showImg(currentImgIdx - 1));
    document.getElementById('lb-next').addEventListener('click', () => showImg(currentImgIdx + 1));

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        else if (e.key === 'ArrowLeft') showImg(currentImgIdx - 1);
        else if (e.key === 'ArrowRight') showImg(currentImgIdx + 1);
    });

    // Swipe support
    let touchX = 0;
    lightbox.addEventListener('touchstart', (e) => {
        touchX = e.changedTouches[0].clientX;
    }, { passive: true });
    lightbox.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 50) showImg(currentImgIdx + (dx < 0 ? 1 : -1));
    }, { passive: true });
})();
