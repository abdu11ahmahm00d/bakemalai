document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('.navbar');
    if (nav) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                nav.classList.add('scrolled');
            } else {
                nav.classList.remove('scrolled');
            }
        });
    }

    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const animateObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const animateElements = document.querySelectorAll('[data-animate="fadeInUp"]');
    animateElements.forEach(el => animateObserver.observe(el));

    const bmCards = document.querySelectorAll('.bm-card');
    bmCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -8;
            const rotateY = ((x - centerX) / centerX) * 8;
            card.style.transform = `perspective(1000px) translateY(-6px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            card.style.transition = 'none';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
            card.style.transition = 'transform 0.4s ease-out, box-shadow 0.4s ease-out';
            setTimeout(() => { card.style.transition = ''; }, 400);
        });
    });

    const filterBtns = document.querySelectorAll('.filter-btn-group .btn');
    const galleryItems = document.querySelectorAll('.masonry-item');

    if (filterBtns.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => {
                    b.style.backgroundColor = 'var(--color-caramel)';
                    b.style.color = '#fff';
                    b.classList.remove('active');
                });
                btn.style.backgroundColor = 'var(--color-candy-pink)';
                btn.style.color = '#fff';
                btn.classList.add('active');

                const filterValue = btn.getAttribute('data-category');

                galleryItems.forEach(item => {
                    if (filterValue === 'all') {
                        item.classList.remove('d-none');
                    } else if (item.classList.contains(`item-${filterValue}`)) {
                        item.classList.remove('d-none');
                    } else {
                        item.classList.add('d-none');
                    }
                });
                
                setTimeout(resizeAllMasonryItems, 50);
            });
        });
    }

    const grid = document.querySelector('.masonry-gallery');

    function resizeAllMasonryItems() {
        const grid = document.querySelector('.masonry-gallery');
        if (!grid) return;
        
        const allItems = Array.from(document.querySelectorAll('.masonry-item:not(.d-none)'));
        const rowGap = parseInt(window.getComputedStyle(grid).getPropertyValue('grid-row-gap')) || 8;
        const rowHeight = parseInt(window.getComputedStyle(grid).getPropertyValue('grid-auto-rows')) || 8;

        // Batch Read: Get all heights first
        const heights = allItems.map(item => {
            const img = item.querySelector('img');
            let contentHeight = img ? img.getBoundingClientRect().height : 250;
            if (contentHeight === 0) contentHeight = 250;
            return contentHeight;
        });

        // Batch Write: Apply all styles next
        allItems.forEach((item, index) => {
            const rowSpan = Math.ceil((heights[index] + rowGap) / (rowHeight + rowGap));
            item.style.gridRowEnd = 'span ' + rowSpan;
        });
    }

    function resizeMasonryItem(item) {
        // Individual resize still uses the same logic but we prefer the batched version for bulk updates
        const grid = document.querySelector('.masonry-gallery');
        if (!grid) return;
        const rowGap = parseInt(window.getComputedStyle(grid).getPropertyValue('grid-row-gap')) || 8;
        const rowHeight = parseInt(window.getComputedStyle(grid).getPropertyValue('grid-auto-rows')) || 8;
        const img = item.querySelector('img');
        const contentHeight = img && img.getBoundingClientRect().height > 0 ? img.getBoundingClientRect().height : 250;
        const rowSpan = Math.ceil((contentHeight + rowGap) / (rowHeight + rowGap));
        item.style.gridRowEnd = 'span ' + rowSpan;
    }
    
    if (grid) {
        const masonryObserver = new ResizeObserver(() => {
            resizeAllMasonryItems();
        });
        masonryObserver.observe(grid);
        
        const allImgs = document.querySelectorAll('.masonry-item img');
        allImgs.forEach(img => {
            if (img.complete) {
                resizeMasonryItem(img.closest('.masonry-item'));
            } else {
                img.addEventListener('load', () => resizeMasonryItem(img.closest('.masonry-item')));
            }
        });
        
        setTimeout(resizeAllMasonryItems, 200);
    }
});
