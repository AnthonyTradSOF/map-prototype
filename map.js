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
    // FULL-PAGE MODAL CONTROLLERS & INTERCEPTOR BINDINGS
    // =================================================================
    const detailOverlay = document.getElementById('detail-overlay');
    const closeOverlayBtn = document.getElementById('overlay-close-btn');
    const overlayImg = document.getElementById('overlay-img');
    const overlayTitle = document.getElementById('overlay-title');
    const overlayDesc = document.getElementById('overlay-description');
    const overlayLink = document.getElementById('overlay-external-link');

    // Secure click binding wrapper for modern overlay deployments
    function openDetailOverlay(title, longCopy, imageUrl, externalUrl) {
        overlayTitle.innerText = title;
        overlayDesc.innerText = longCopy;
        overlayImg.src = imageUrl;
        overlayLink.href = externalUrl;
        
        detailOverlay.classList.add('active');
    }

    closeOverlayBtn.addEventListener('click', function() {
        detailOverlay.classList.remove('active');
    });

    // =================================================================
    // FEATURE 3: ASYNC FETCH DATA ENGINE & MARKER EVENT LISTENERS
    // =================================================================
    fetch('locations.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP network error fetching JSON: ${response.status}`);
            }
            return response.json();
        })
        .then(locations => {
            locations.forEach(loc => {
                // Base layout wrapper inside map pin bubble contents
                const popupHTML = `
                    <div class="popup-content">
                        <h3>${loc.title}</h3>
                        <p>${loc.description}</p>
                        <button class="learn-more-btn" id="btn-${loc.title.replace(/\s+/g, '-')}">Learn More</button>
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

                // Safe event targeting for asynchronously appended popup content layers
                marker.on('popupopen', function() {
                    const targetBtn = document.getElementById(`btn-${loc.title.replace(/\s+/g, '-')}`);
                    if (targetBtn) {
                        targetBtn.addEventListener('click', function() {
                            openDetailOverlay(loc.title, loc.overlay_copy, loc.image, loc.url);
                        });
                    }
                });

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
