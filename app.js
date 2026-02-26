// 1) Inițializăm harta
const map = L.map('map').setView([45.9, 24.9], 7);

// 2) Grup pentru UAT (îl golim la fiecare click pe județ)
const layerUAT = L.featureGroup().addTo(map);

// 3) Încărcăm ambele GeoJSON-uri o singură dată
let uatData = null;

Promise.all([
  fetch('./judete.geojson').then(r => r.json()),
  fetch('./uat.geojson').then(r => r.json()),
]).then(([judeteData, uat]) => {
  uatData = uat;

  // 4) Desenăm județele
  L.geoJSON(judeteData, {
    style: {
      color: '#444',
      weight: 1,
      fillColor: '#9ecae1',
      fillOpacity: 0.7
    },
    onEachFeature: (feature, layer) => {
      layer.on('click', () => {
        const judet = feature.properties.Judet;
        showUATForJudet(judet);
      });
    }
  }).addTo(map);
});

function showUATForJudet(judet) {
  // 5) Ștergem UAT-urile vechi
  layerUAT.clearLayers();

  // 6) Adăugăm doar UAT-urile din județul selectat (filter)
  const uatLayer = L.geoJSON(uatData, {
    filter: (f) => f.properties.Judet === judet,
    style: {
      color: '#d94801',
      weight: 1,
      fillColor: '#fd8d3c',
      fillOpacity: 0.6
    },
    onEachFeature: (f, l) => {
      l.on('click', () => {
        const url = f.properties.URL;
        if (url) window.open(url, '_blank');
        else alert('Lipsește proprietatea URL la acest UAT.');
      });
    }
  });

  layerUAT.addLayer(uatLayer);

  // 7) Zoom pe UAT-urile din județ (dacă există)
  if (layerUAT.getLayers().length > 0) {
    map.fitBounds(layerUAT.getBounds(), { padding: [10, 10] });
  } else {
    alert('Nu am găsit UAT-uri pentru județul selectat.');
  }
}
