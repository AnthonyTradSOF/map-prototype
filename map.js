window.addEventListener("load", function() {
    
    // 1. Safety verification catch
    if (typeof L === 'undefined') {
        console.error("Leaflet failed to load from unpkg. Check network access or firewall.");
        return;
    }

    // 2. Initialize map and eliminate mobile touch latency glitches
    const map = L.map('map', {
        zoomControl: false,
        tap: false 
    }).setView([49.2827, -123.1207], 13);
    
    L.control.zoom({
        position: 'topright'
    }).addTo(map);
    
    L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
        maxZoom: 20
    }).addTo(map);

    const vancouverBounds = [
        [49.2720, -123.1350], 
        [49.2920, -123.1050]  
    ];
    
    const overlayUrl = 'https://unsplash.com';
    
    L.imageOverlay(overlayUrl, vancouverBounds, {
        opacity: 0.5,
        interactive: true
    }).addTo(map);

    // =================================================================
    // RESPONSIVE FEATURE: INJECT PULL-TAB INJECTOR MECHANICS
    // =================================================================
    const sidebar = document.getElementById('sidebar');
    
    const toggleHandle = document.createElement('div');
    toggleHandle.className = 'drawer-toggle';
    sidebar.insertBefore(toggleHandle, sidebar.firstChild);

    toggleHandle.addEventListener('click', function() {
        sidebar.classList.toggle('collapsed');
    });

    const listContainer = document.getElementById('location-list');

    // =================================================================
    // FULL-PAGE INTERACTIVE DETAIL OVERLAY CAPTURING LOGIC
    // =================================================================
    const detailOverlay = document.getElementById('detail-overlay');
    const closeOverlayBtn = document.getElementById('overlay-close-btn');
    const overlayImg = document.getElementById('overlay-img');
    const overlayTitle = document.getElementById('overlay-title');
    const overlayDesc = document.getElementById('overlay-description');
    const overlayLink = document.getElementById('overlay-external-link');

    let localDataStorageArray = [];

    // Global intercept method to map, cache, and fire overlay window transitions
    window.launchFullScreenOverlay = function(index) {
        const selectedPoint = localDataStorageArray[index];
        if (!selectedPoint) return;

        overlayTitle.innerText = selectedPoint.title;
        overlayDesc.innerText = selectedPoint.overlay_copy; // Populates dedicated unique text block
        overlayImg.src = selectedPoint.image;
        overlayLink.href = selectedPoint.url;

        detailOverlay.style.display = 'flex';
        // Minor timeout ensures layout registers before applying opacity transitions
        setTimeout(() => {
            detailOverlay.classList.add('active');
        }, 15);
    };

    // Close trigger tracking with clean transition teardown math
    closeOverlayBtn.addEventListener('click', function() {
        detailOverlay.classList.remove('active');
        setTimeout(() => {
            detailOverlay.style.display = 'none';
        }, 400); // 400ms match duration time for fading out CSS sheet completely
    });

    // =================================================================
    // FEATURE 3: ASYNC FETCH DATA ENGINE & VERTICAL CENTER ROUTING
    // =================================================================
    fetch('locations.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP network error fetching JSON: ${response.status}`);
            }
            return response.json();
        })
        .then(locations => {
            localDataStorageArray = locations; // Populate structural storage arrays safely

            locations.forEach((loc, index) => {
                // Fixed index routing prevents string breakdown inside the loop template
                const popupHTML = `
                    <div class="popup-content">
                        <h3>${loc.title}</h3>
                        <p>${loc.description}</p>
                        <button class="learn-more-btn" onclick="window.launchFullScreenOverlay(${index})">Learn More</button>
                    </div>
                `;

                const marker = L.circleMarker(loc.coords, {
                    radius: 12,
                    fillColor: loc.color,
                    color: "#ffffff",
                    weight: 3,
                    fillOpacity: 0.95
                })
                .bindPopup(popupHTML)
                .addTo(map);

                const listItem = document.createElement('li');
                listItem.className = 'list-item';
                listItem.style.borderLeftColor = loc.color;

                const colorDot = document.createElement('span');
                colorDot.className = 'item-color-dot';
                colorDot.style.backgroundColor = loc.color;

                const textLabel = document.createTextNode(loc.title);

                listItem.appendChild(colorDot);
                listItem.appendChild(textLabel);

                listItem.addEventListener('click', function() {
                    if (window.innerWidth <= 768) {
                        map.setView(loc.coords, 14, { animate: false });

                        const drawerHeight = sidebar.offsetHeight;
                        const pullTabHeight = 28;
                        const activeDrawerPixels = sidebar.classList.contains('collapsed') ? pullTabHeight : drawerHeight;

                        const yOffset = activeDrawerPixels / 2;
                        map.panBy([0, yOffset], { animate: true, duration: 0.4 });

                    } else {
                        map.setView(loc.coords, 14, { animate: true, duration: 0.5 });
                    }
                    
                    setTimeout(() => {
                        marker.openPopup();
                    }, 400);
                });

                listContainer.appendChild(listItem);
            });
        })
        .catch(error => {
            console.error("Could not load map configuration points:", error);
            listContainer.innerHTML = `<li style="color: red; padding: 10px;">Error loading data asset</li>`;
        });
});
