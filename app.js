// ================== UTILS ==================
function norm(txt) {
  return txt.toString().trim().toUpperCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// ================== LARGEST POLYGON (fix MultiPolygon) ==================
function getLargestPolygonRings(multiPolygonCoords) {
  let maxArea = -1;
  let bestRings = null;

  multiPolygonCoords.forEach(polygonRings => {
    const ring = polygonRings[0]; // exterior ring
    // Shoelace formula pentru arie aproximativă
    let area = 0;
    for (let i = 0; i < ring.length - 1; i++) {
      area += ring[i][0] * ring[i + 1][1];
      area -= ring[i + 1][0] * ring[i][1];
    }
    area = Math.abs(area / 2);

    if (area > maxArea) {
      maxArea = area;
      bestRings = polygonRings; // toate ring-urile poligonului câștigător
    }
  });

  return bestRings;
}

// ================== MAP ==================
const map = L.map('map', {
  preferCanvas: true   // ← performanță mai bună cu multe features
}).setView([45.9, 24.9], 7);

// TILE LAYER – cu opțiuni de performanță
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap',
  maxZoom: 19,
  updateWhenIdle: true,      // ← încarcă tiles doar după ce harta s-a oprit
  updateWhenZooming: false,  // ← nu reîncarca la fiecare frame de zoom
  keepBuffer: 2
}).addTo(map);

let layerJudete = null;
let layerUAT = null;
let uatLabels = [];

const backBtn = document.getElementById('backBtn');

// ================== RESET ==================
backBtn.onclick = () => {
  if (layerUAT) map.removeLayer(layerUAT);
  uatLabels.forEach(l => map.removeLayer(l));
  uatLabels = [];

  if (layerJudete) layerJudete.addTo(map);

  map.setView([45.9, 24.9], 7);
  backBtn.style.display = 'none';
};

// ================== JUDEȚE ==================
fetch('judete.geojson')
  .then(r => r.json())
  .then(data => {
    layerJudete = L.geoJSON(data, {
      style: {
        color: '#ffffff', weight: 1.3,
        fillColor: '#6fa8dc', fillOpacity: 0.9
      },
      onEachFeature: (feature, layer) => {
        layer.bindTooltip(feature.properties.Judet, {
          permanent: true, direction: 'center', className: 'label-judet'
        });

        layer.on('mouseover', () => layer.setStyle({ fillColor: '#3d85c6' }));
        layer.on('mouseout',  () => layer.setStyle({ fillColor: '#6fa8dc' }));
        layer.on('click', () => {
          map.fitBounds(layer.getBounds(), { padding: [20, 20] });
          afiseazaUAT(feature.properties.Judet);
        });
      }
    }).addTo(map);
  });

// ================== UAT ==================
function afiseazaUAT(judetSelectat) {
  if (layerJudete) map.removeLayer(layerJudete);
  if (layerUAT)    map.removeLayer(layerUAT);
  uatLabels.forEach(l => map.removeLayer(l));
  uatLabels = [];

  fetch('uat.geojson')
    .then(r => r.json())
    .then(data => {
      layerUAT = L.geoJSON(data, {
        filter: f => norm(f.properties.Judet) === norm(judetSelectat),

        style: {
          color: '#000', weight: 0.8,
          fillColor: '#ffe599', fillOpacity: 0.9
        },

        onEachFeature: (feature, layer) => {
          let labelLatLng;

          // ================== POLYLABEL cu fix MultiPolygon ==================
          try {
            let rings = null;

            if (feature.geometry.type === 'Polygon') {
              rings = feature.geometry.coordinates;

            } else if (feature.geometry.type === 'MultiPolygon') {
              // ← FIX: găsește cel mai mare poligon, nu primul
              rings = getLargestPolygonRings(feature.geometry.coordinates);
            }

            if (rings) {
              const [x, y] = polylabel(rings, 1.0);
              labelLatLng = L.latLng(y, x);
            }
          } catch (e) {
            console.warn('polylabel failed:', feature.properties.UAT);
          }

          if (!labelLatLng) labelLatLng = layer.getBounds().getCenter();

          const label = L.tooltip({
            permanent: true, direction: 'center', className: 'label-uat'
          })
            .setContent(feature.properties.UAT)
            .setLatLng(labelLatLng)
            .addTo(map);

          uatLabels.push(label);

          layer.on('mouseover', () => {
            layer.setStyle({ fillColor: '#f1c232' });
            label.getElement()?.classList.add('label-hover');
          });
          layer.on('mouseout', () => {
            layer.setStyle({ fillColor: '#ffe599' });
            label.getElement()?.classList.remove('label-hover');
          });
          layer.on('click', () => {
            if (feature.properties.URL) window.open(feature.properties.URL, '_blank');
          });
        }
      }).addTo(map);

      backBtn.style.display = 'block';
    });
}
