// ===============================
// FUNCȚIE NORMALIZARE TEXT
// ===============================
function norm(txt) {
  if (!txt) return '';
  return txt
    .toString()
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// ===============================
// INIȚIALIZARE HARTĂ
// ===============================
const map = L.map('map').setView([45.9, 24.9], 7);

let layerJudete = null;
let layerUAT = null;

const backBtn = document.getElementById('backBtn');

// ===============================
// BUTON ÎNAPOI
// ===============================
backBtn.onclick = () => {
  if (layerUAT) {
    map.removeLayer(layerUAT);
    layerUAT = null;
  }

  if (layerJudete) {
    layerJudete.addTo(map);
  }

  map.setView([45.9, 24.9], 7);
  backBtn.style.display = 'none';
};

// ===============================
// JUDEȚE
// ===============================
fetch('judete.geojson')
  .then(r => r.json())
  .then(data => {

    layerJudete = L.geoJSON(data, {
      style: {
        color: '#fff',          // CONTUR ALB
        weight: 1.2,
        fillColor: '#6fa8dc',
        fillOpacity: 0.85
      },

      onEachFeature: (feature, layer) => {

        // LABEL JUDEȚ
        layer.bindTooltip(feature.properties.Judet, {
          permanent: true,
          direction: 'center',
          className: 'label-judet'
        });

        // HOVER
        layer.on('mouseover', () => {
          layer.setStyle({
            fillOpacity: 1,
            weight: 2
          });
        });

        layer.on('mouseout', () => {
          layer.setStyle({
            fillOpacity: 0.85,
            weight: 1.2
          });
        });

        // CLICK JUDEȚ
        layer.on('click', () => {
          map.fitBounds(layer.getBounds(), { padding: [20, 20] });
          afiseazaUAT(feature.properties.Judet);
        });
      }
    }).addTo(map);

  })
  .catch(err => {
    console.error('Eroare la încărcarea județelor:', err);
  });

// ===============================
// UAT
// ===============================
function afiseazaUAT(judetSelectat) {

  if (layerJudete) {
    map.removeLayer(layerJudete);
  }

  if (layerUAT) {
    map.removeLayer(layerUAT);
    layerUAT = null;
  }

  fetch('uat.geojson')
    .then(r => r.json())
    .then(data => {

      layerUAT = L.geoJSON(data, {
        filter: f => norm(f.properties.Judet) === norm(judetSelectat),

        style: {
          color: '#000',        // CONTUR NEGRU
          weight: 0.7,
          fillColor: '#ffe599',
          fillOpacity: 0.85
        },

        onEachFeature: (feature, layer) => {

          // LABEL UAT (permanent, dar controlat din zoom)
          layer.bindTooltip(feature.properties.UAT, {
            permanent: true,
            direction: 'center',
            className: 'label-uat'
          });

          // HOVER
          layer.on('mouseover', () => {
            layer.setStyle({
              fillOpacity: 1,
              weight: 1.2
            });
          });

          layer.on('mouseout', () => {
            layer.setStyle({
              fillOpacity: 0.85,
              weight: 0.7
            });
          });

          // CLICK → URL
          layer.on('click', () => {
            if (feature.properties.URL) {
              window.location.href = feature.properties.URL;
            }
          });
        }
      }).addTo(map);

      backBtn.style.display = 'block';

      // === CONTROL LABEL UAT LA ZOOM ===
      toggleUATLabels();
    })
    .catch(err => {
      console.error('Eroare la încărcarea UAT:', err);
    });
}

// ===============================
// ZOOMEND – CONTROL LABEL UAT
// ===============================
map.on('zoomend', () => {
  toggleUATLabels();
});

function toggleUATLabels() {
  if (!layerUAT) return;

  const show = map.getZoom() >= 9;

  layerUAT.eachLayer(layer => {
    const tooltip = layer.getTooltip();
    if (!tooltip) return;

    if (show) {
      layer.openTooltip();
    } else {
      layer.closeTooltip();
    }
  });
}
