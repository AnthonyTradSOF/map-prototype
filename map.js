window.addEventListener("load", function() {
    
    // 1. Safety verification catch
    if (typeof L === 'undefined') {
        console.error("Leaflet failed to load from unpkg. Check network access or firewall.");
        return;
    }

    // 2. Initialize map and eliminate mobile touch latency glitches
    const map = L.map('map', {
        zoomControl: false,
        tap: false // Resolves native touch event delay frameworks on mobile
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
    
    // Programmatically insert the drawer toggle handle at the absolute top of the sidebar
    const toggleHandle = document.createElement('div');
    toggleHandle.className = 'drawer-toggle';
    sidebar.insertBefore(toggleHandle, sidebar.firstChild);

    // Toggle collapse state when a mobile user clicks or taps the toggle handle
    toggleHandle.addEventListener('click', function() {
        sidebar.classList.toggle('collapsed');
    });

    const listContainer = document.getElementById('location-list');

    // =================================================================
    // FEATURE 3: ASYNC FETCH DATA ENGINE & DYNAMIC VERTICAL CENTERING
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
                const popupHTML = `
                    <div class="popup-content">
                        <h3>${loc.title}</h3>
                        <p>${loc.description}</p>
                        <a href="${loc.url}" target="_blank" rel="noopener noreferrer">Learn More</a>
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

                // Create a colored circular icon indicator inside the item
                const colorDot = document.createElement('span');
                colorDot.className = 'item-color-dot';
                colorDot.style.backgroundColor = loc.color;

                // Create a text node container for the location title
                const textLabel = document.createTextNode(loc.title);

                // Construct the node tree hierarchy
                listItem.appendChild(colorDot);
                listItem.appendChild(textLabel);

                // Handle responsive layout centering calculations on click
                listItem.addEventListener('click', function() {
                    if (window.innerWidth <= 768) {
                        
                        // 1. Instantly center the map on the raw coordinates at our target zoom
                        map.setView(loc.coords, 14, { animate: false });

                        // 2. Figure out how much space the drawer takes up on screen right now
                        const drawerHeight = sidebar.offsetHeight;
                        const pullTabHeight = 28;
                        const activeDrawerPixels = sidebar.classList.contains('collapsed') ? pullTabHeight : drawerHeight;

                        // 3. Shift the camera downward by half the drawer's height
                        const yOffset = activeDrawerPixels / 2;
                        map.panBy([0, yOffset], { animate: true, duration: 0.4 });

                    } else {
                        // Standard absolute centering for desktop monitors
                        map.setView(loc.coords, 14, { animate: true, duration: 0.5 });
                    }
                    
                    // Fire the marker popup right as the camera animation finishes
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
