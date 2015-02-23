/*
    Preview trays which holds previews and screenshots.
    On mobile, uses Flipsnap which enables touch-drag.
    On desktop, adds prev/next buttons to navigate images.
*/
define('previews',
    ['flipsnap', 'log', 'capabilities', 'shothandles', 'z'],
    function(flipsnap, log, caps, handles, z) {
    var logger = log('previews');

    // Padded size of preview images (in pixels).
    var dimensions = {
        thumb: 160,
        full: 550,
        breakpoint: 1050,  // Width when desktop trays appear.
        contentWidth: 1070,  // Max width of desktop content.
        // Technically the left margin of each preview in tray.
        padding: 10
    };

    var mediaSwitch = '(min-width:' + dimensions.breakpoint + 'px)';
    var sliders = [];
    var winWidth = z.win.width();
    var isDesktop = !!(caps.device_type() == 'desktop');
    var isDesktopInitialized = false;

    function setActiveBar($bars, position) {
        $bars.filter('.current').removeClass('current');
        $bars.eq(position).addClass('current');
    }

    function initUpdatePosition($bars, slider) {
        // Listener to update the colored bar position.
        slider.element.addEventListener('fsmoveend', function() {
            setActiveBar($bars, slider.currentPoint);
        }, false);

        setActiveBar($bars, slider.currentPoint);
    }

    function refreshDesktopTray() {
        winWidth = z.win.width();
        $('.previews-tray').css({
            // Resize tray to winWidth then shift left by half the margin.
            left: -(winWidth - dimensions.contentWidth) / 2 + 'px',
            width: winWidth + 'px'
        });
        logger.log('resized');
    }

    function isDesktopDetail() {
        return $('[data-page-type~="detail"]').length &&
                window.matchMedia(mediaSwitch).matches;
    }

    function initTrays() {
        var $tray = $(this);
        var numPreviews = $tray.find('.screenshot').length;
        var $previewsContent = $tray.find('.previews-content');
        var $bars = $tray.find('.previews-bars b');
        var slider = {};

        $previewsContent.css({
            width: numPreviews * dimensions.thumb - dimensions.padding + 'px'
        });

        // Init Flipsnap itself!
        slider = flipsnap($previewsContent[0], {distance: dimensions.thumb});

        // Expose slider on the tray node. Used for arrow navigation.
        this.slider = slider;

        initUpdatePosition($bars, slider);
        sliders.push(slider);

        if (isDesktop) {
            handles.attachHandles(slider, $tray.find('.previews-slider'));
        }
    }

    function initDesktopDetailsTray() {
        var $tray = $(this);
        var numPreviews = $tray.find('.screenshot').length;
        var $previewsContent = $tray.find('.previews-content');
        var $bars = $tray.find('.previews-bars b');
        var slider = {};
        var $desktopContent = $('<ul class="previews-desktop-content">');
        var $slider = $tray.find('.previews-slider');

        refreshDesktopTray();

        // Populate the new desktop content in memory.
        $previewsContent.find('li').each(function(i, elm) {
            var imageSrc = elm.querySelector('a').href;
            var $newShot = $(elm).clone();
            $newShot.find('img').removeClass('deferred').attr('src', imageSrc);
            $desktopContent.append($newShot);
        });

        $desktopContent.css({
            width: numPreviews * dimensions.full - dimensions.padding + 'px'
        });

        // Add new content to the DOM.
        $slider.append($desktopContent);

        isDesktopInitialized = true;

        // Single preview tray. No need to init flipsnap.
        if (numPreviews === 1) {
            return;
        }

        // Init Flipsnap itself!
        slider = flipsnap($desktopContent[0], {distance: dimensions.full});

        // Expose slider on the tray node. Used for arrow navigation.
        this.slider = slider;

        initUpdatePosition($bars, slider);
        sliders.push(slider);
        if (isDesktop) {
            handles.attachHandles(slider, $slider);
        }
    }

    // Reinitialize Flipsnap positions on resize.
    z.doc.on('saferesize.tray', function() {
        for (var i = 0, e; e = sliders[i++];) {
            e.refresh();
        }
        if (isDesktopDetail()) {
            // If the desktop tray exists only refresh its position and size.
            // Otherwise create the desktop tray.
            if (isDesktopInitialized) {
                refreshDesktopTray();
            } else {
                $('.previews-tray:not(.single-preview)').each(initDesktopDetailsTray);
            }
        } else {
            $('.previews-tray').attr('style', '');
        }
    });

    // We're leaving the page, so destroy Flipsnap.
    z.win.on('unloading.tray', function() {
        for (var i = 0, e; e = sliders[i++];) {
            e.destroy();
        }
        sliders = [];
    });

    z.page.on('populatetray', function() {
        logger.log('Initializing trays');

        if (isDesktopDetail()) {
            $('.previews-tray').each(initDesktopDetailsTray);
        } else {
            $('.expanded .previews-tray:not(.single-preview)').each(initTrays);
        }
    });
});
