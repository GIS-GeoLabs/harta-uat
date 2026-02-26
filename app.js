// 1. Inițializăm harta
const map = L.map('map', {
  zoomControl: true
}).setView([45.9, 24.9], 7);

// Layer-e
let layerJudete;
let layerUAT;

const backBtn = document.getElementById('backBtn');

// Reset la județe
backBtn.onclick = () => {
  if (layerUAT) map.removeLayer(layerUAT);
  if (layerJudete) layerJudete.addTo(map);
  map.setView([45.9, 24.9], 7);
  backBtn.style.display = 'none';
};

// === JUDEȚE ===
fetch('judete.geojson')
  .then(r => r.json())
  .then(data => {

    layerJudete = L.geoJSON(data, {

      style: {
        color: '#333',
        weight: 1,
        fillColor: '#6fa8dc',
        fillOpacity: 0.7
      },

      onEachFeature: (feature, layer) => {

        // LABEL PERMANENT JUDEȚ
        layer.bindTooltip(
          feature.properties.Judet,
          {
            permanent: true,
            direction: 'center',
            className: 'label-judet'
          }
        );

        // HOVER JUDEȚ
        layer.on('mouseover', () => {
          layer.setStyle({
            fillColor: '#3d85c6',
            fillOpacity: 0.9
          });
        });

        layer.on('mouseout', () => {
          layer.setStyle({
            fillColor: '#6fa8dc',
            fillOpacity: 0.7
          });
        });

        // CLICK JUDEȚ
        layer.on('click', () => {
          map.fitBounds(layer.getBounds());
          afiseazaUAT(feature.properties.Judet);
        });

      }

    }).addTo(map);

  });


// === UAT ===
function afiseazaUAT(judetSelectat) {

  if (layerJudete) map.removeLayer(layerJudete);
  if (layerUAT) map.removeLayer(layerUAT);

  fetch('uat.geojson')
    .then(r => r.json())
    .then(data => {

      layerUAT = L.geoJSON(data, {

        filter: f => f.properties.Judet === judetSelectat,

        style: {
          color: '#666',
          weight: 0.6,
          fillColor: '#ffe599',
          fillOpacity: 0.75
        },

        onEachFeature: (feature, layer) => {

          // LABEL PERMANENT UAT
          layer.bindTooltip(
            feature.properties.UAT,
            {
              permanent: true,
              direction: 'center',
              className: 'label-uat'
            }
          );

          // HOVER UAT
          layer.on('mouseover', () => {
            layer.setStyle({
              fillColor: '#f1c232',
              fillOpacity: 0.95
            });
          });

          layer.on('mouseout', () => {
            layer.setStyle({
              fillColor: '#ffe599',
              fillOpacity: 0.75
            });
          });

          // CLICK → URL
          layer.on('click', () => {
            window.location.href = feature.properties.URL;
          });

        }

      }).addTo(map);

      backBtn.style.display = 'block';

    });
}
