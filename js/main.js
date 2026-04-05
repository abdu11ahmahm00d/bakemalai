document.addEventListener('DOMContentLoaded', () => {
    const filterBtns = document.querySelectorAll('.filter-btn-group .btn');
    const galleryItems = document.querySelectorAll('.masonry-item');

    if (filterBtns.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => {
                    b.classList.remove('btn-candy-pulse', 'active');
                    if (!b.classList.contains('btn-outline-chocolate')) {
                        b.classList.add('btn-outline-chocolate');
                    }
                });
                btn.classList.add('btn-candy-pulse', 'active');
                btn.classList.remove('btn-outline-chocolate');

                const filterValue = btn.getAttribute('data-filter');

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

    function resizeMasonryItem(item) {
        const grid = document.querySelector('.masonry-gallery');
        if (!grid) return;
        
        const rowGap = parseInt(window.getComputedStyle(grid).getPropertyValue('grid-row-gap')) || 15;
        const rowHeight = parseInt(window.getComputedStyle(grid).getPropertyValue('grid-auto-rows')) || 10;
        
        const img = item.querySelector('img');
        if (!img) return;

        let contentHeight = img.getBoundingClientRect().height;
        if(contentHeight === 0) contentHeight = 250 + Math.floor(Math.random() * 150);

        const rowSpan = Math.ceil((contentHeight + rowGap) / (rowHeight + rowGap));
        item.style.gridRowEnd = 'span ' + rowSpan;
    }

    function resizeAllMasonryItems() {
        const allItems = document.querySelectorAll('.masonry-item:not(.d-none)');
        allItems.forEach(resizeMasonryItem);
    }
    
    const masonryGallery = document.querySelector('.masonry-gallery');
    if (masonryGallery) {
        window.addEventListener('resize', resizeAllMasonryItems);
        
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
