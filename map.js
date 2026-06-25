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
    });
    
    L.control.zoom({ position: 'topright' }).addTo(map);
    L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', { maxZoom: 20 }).addTo(map);

    // Asset definitions
    const overlayUrl = 'https://unsplash.com';
    let imageOverlayInstance = null;

    // Helper function to dynamically calculate a bounding box around any point
    function createDynamicBounds(lat, lng, offset = 0.01) {
        return [
            [lat - offset, lng - offset], // Southwest corner
            [lat + offset, lng + offset]  // Northeast corner
        ];
    }

   // TIGHT STATIC OVERLAY & VIEW GENERATION (SOUTHERN CORRIDOR)
// 1. Set a very tight view focused on the southern populated corridor
const defaultLat = 50.8000;   // Shifted further south
const defaultLng = -117.5000;  // Centered between Southern BC and Calgary/Edmonton
map.setView([defaultLat, defaultLng], 7); // Tighter zoom level 

// 2. Define highly restrictive southern bounds
const extraTightSouthernBounds = [
    // Southwest corner: Strict mainland focus, cuts out all major islands
    [49.0000, -123.5000], 
    // Northeast corner: Just north of Edmonton, ends at Saskatchewan border
    [54.5000, -110.0000]  
];

// 3. Project the image overlay across the tightened southern region
imageOverlayInstance = L.imageOverlay(overlayUrl, extraTightSouthernBounds, {
    opacity: 0.5,
    interactive: true
}).addTo(map);

    // Fire browser prompt request for target location tracking
    map.locate({ setView: true, maxZoom: 11 });

    // RESPONSIVE FEATURE: INJECT PULL-TAB INJECTOR MECHANICS
    const sidebar = document.getElementById('sidebar');
    const toggleHandle = document.createElement('div');
    toggleHandle.className = 'drawer-toggle';
    sidebar.insertBefore(toggleHandle, sidebar.firstChild);

    toggleHandle.addEventListener('click', function() {
        sidebar.classList.toggle('collapsed');
    });

    const listContainer = document.getElementById('location-list');

    // FULL-PAGE INTERACTIVE DETAIL OVERLAY CAPTURING LOGIC
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

    // FEATURE 3: ASYNC FETCH DATA ENGINE & VERTICAL CENTER ROUTING
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
                const popupHTML = `
                    <div class="popup-content">
                        <h3>${loc.title}</h3>
                        <p>${loc.description}</p>
                        <button class="learn-more-btn" onclick="window.launchFullScreenOverlay(${index})">Learn More</button>
                    </div>`;

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

                        setTimeout(() => {
                            marker.openPopup();
                        }, 400);
                    } else {
                        // 1. Calculate physical distance in meters between current map center and target marker
                        const currentCenter = map.getCenter();
                        const targetLatLng = L.latLng(loc.coords);
                        const distanceInMeters = currentCenter.distanceTo(targetLatLng);

                        // 2. Set an threshold (e.g., 80 kilometers = 80000 meters)
                        const thresholdMeters = 80000; 

                        if (distanceInMeters > thresholdMeters) {
                            // Cut instantly if too far away to prevent browser tile-loading lag
                            map.setView(loc.coords, 14, { animate: false });
                            marker.openPopup();
                            return; // Exit function immediately
                        } else {
                            // Execute the smooth flyover for nearby local points
                            map.flyTo(loc.coords, 14, {
                                animate: true, 
                                duration: 1.2, // Snappier timing reduces rendering overhead
                                easeLinearity: 0.25
                            });

                            setTimeout(() => {
                                marker.openPopup();
                            }, 1200);
                        }
                    }
                });

                listContainer.appendChild(listItem);
            });
        })
        .catch(error => {
            listContainer.innerHTML = `<li style="color: red; padding: 10px;">Error loading data asset</li>`;
        });
});
