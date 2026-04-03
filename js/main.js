// Bakemalai Javascript
document.addEventListener('DOMContentLoaded', () => {
    // --- Gallery Filter Logic ---
    const filterBtns = document.querySelectorAll('.filter-btn-group .btn');
    const galleryItems = document.querySelectorAll('.masonry-item');

    if (filterBtns.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Toggle active states
                filterBtns.forEach(b => {
                    b.classList.remove('btn-candy-pulse', 'active');
                    if (!b.classList.contains('btn-outline-chocolate')) {
                        b.classList.add('btn-outline-chocolate');
                    }
                });
                btn.classList.add('btn-candy-pulse', 'active');
                btn.classList.remove('btn-outline-chocolate');

                const filterValue = btn.getAttribute('data-filter');

                // Filter items
                galleryItems.forEach(item => { // Make sure vanilla JS handles class hiding
                    if (filterValue === 'all') {
                        item.classList.remove('d-none');
                    } else if (item.classList.contains(`item-${filterValue}`)) {
                        item.classList.remove('d-none');
                    } else {
                        item.classList.add('d-none');
                    }
                });
                
                // Recalculate Masonry immediately after display tweak
                setTimeout(resizeAllMasonryItems, 50);
            });
        });
    }

    // --- Vanilla JS Masonry (Grid Row Auto-Calculation) ---
    function resizeMasonryItem(item) {
        const grid = document.querySelector('.masonry-gallery');
        if (!grid) return;
        
        const rowGap = parseInt(window.getComputedStyle(grid).getPropertyValue('grid-row-gap')) || 15;
        const rowHeight = parseInt(window.getComputedStyle(grid).getPropertyValue('grid-auto-rows')) || 10;
        
        const img = item.querySelector('img');
        if (!img) return;

        // Give a slight dummy variable if the image is missing height to test styling
        let contentHeight = img.getBoundingClientRect().height;
        if(contentHeight === 0) contentHeight = 250 + Math.floor(Math.random() * 150); // fake height for placeholders

        // CSS Grid spans are calculated by taking total height and dividing by row base height
        const rowSpan = Math.ceil((contentHeight + rowGap) / (rowHeight + rowGap));
        item.style.gridRowEnd = 'span ' + rowSpan;
    }

    function resizeAllMasonryItems() {
        const allItems = document.querySelectorAll('.masonry-item:not(.d-none)');
        allItems.forEach(resizeMasonryItem);
    }
    
    // Bind listeners
    const masonryGallery = document.querySelector('.masonry-gallery');
    if (masonryGallery) {
        window.addEventListener('resize', resizeAllMasonryItems);
        
        // Wait for images
        const allImgs = document.querySelectorAll('.masonry-item img');
        allImgs.forEach(img => {
            if (img.complete) {
                resizeMasonryItem(img.closest('.masonry-item'));
            } else {
                img.addEventListener('load', () => resizeMasonryItem(img.closest('.masonry-item')));
            }
        });
        
        // Final fallback layout recalculation
        setTimeout(resizeAllMasonryItems, 200);
    }
});
