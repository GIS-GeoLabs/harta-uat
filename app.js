// 1. Inițializăm harta
const map = L.map('map').setView([45.9, 24.9], 7);

// 2. Variabilă pentru layer
let layerJudete;
let layerUAT;

// 3. Încărcăm GeoJSON-ul cu județe
fetch('judete.geojson')
  .then(r => r.json())
  .then(data => {

    layerJudete = L.geoJSON(data, {
      style: {
        color: '#000',
        weight: 1,
        fillColor: '#4da3ff',
        fillOpacity: 0.7
      },
      onEachFeature: (feature, layer) => {
        layer.on('click', () => {
          afiseazaUAT(feature.properties.Judet);
        });
      }
    }).addTo(map);

  });

function afiseazaUAT(judetSelectat) {

  // scoatem județele
  if (layerJudete) {
    map.removeLayer(layerJudete);
  }

  // scoatem UAT-urile vechi (dacă există)
  if (layerUAT) {
    map.removeLayer(layerUAT);
  }

  // încărcăm UAT-urile
  fetch('uat.geojson')
    .then(r => r.json())
    .then(data => {

      layerUAT = L.geoJSON(data, {
        filter: f => f.properties.Judet === judetSelectat,
        style: {
          color: '#333',
          weight: 0.8,
          fillColor: '#ffcc66',
          fillOpacity: 0.7
        },
        onEachFeature: (feature, layer) => {

          // CLICK pe UAT → redirect la URL
          layer.on('click', () => {
            window.location.href = feature.properties.URL;
          });

        }
      }).addTo(map);

    });
}

