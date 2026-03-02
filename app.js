function norm(txt) {
  var s = txt.toString().trim().toUpperCase().normalize("NFD");
  var result = '';
  for (var i = 0; i < s.length; i++) {
    var code = s.charCodeAt(i);
    if (code < 768 || code > 879) result += s[i];
  }
  return result;
}

function getLargestPolygonRings(coords) {
  var best = null, maxArea = -1;
  for (var i = 0; i < coords.length; i++) {
    var ring = coords[i][0], area = 0;
    for (var j = 0; j < ring.length - 1; j++) {
      area += ring[j][0] * ring[j + 1][1];
      area -= ring[j + 1][0] * ring[j][1];
    }
    area = Math.abs(area / 2);
    if (area > maxArea) { maxArea = area; best = coords[i]; }
  }
  return best;
}

function getLabelLatLng(feature, layer) {
  var rings = null;
  if (feature.geometry.type === 'Polygon') {
    rings = feature.geometry.coordinates;
  } else if (feature.geometry.type === 'MultiPolygon') {
    rings = getLargestPolygonRings(feature.geometry.coordinates);
  }
  if (!rings) return layer.getBounds().getCenter();
  try {
    var pt = polylabel(rings, 0.0001);
    return L.latLng(pt[1], pt[0]);
  } catch (e) {
    return layer.getBounds().getCenter();
  }
}

var map = L.map('map').setView([45.9, 24.9], 7);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap',
  maxZoom: 19,
  updateWhenIdle: true,
  updateWhenZooming: false,
  keepBuffer: 2
}).addTo(map);

var MIN_UAT_LABEL_ZOOM = 10;
map.on('zoomend', function() {
  var c = map.getContainer();
  if (map.getZoom() >= MIN_UAT_LABEL_ZOOM) {
    c.classList.remove('labels-hidden');
  } else {
    c.classList.add('labels-hidden');
  }
});

var layerJudete = null, layerUAT = null, uatLabels = [];
var backBtn = document.getElementById('backBtn');

backBtn.onclick = function() {
  if (layerUAT) map.removeLayer(layerUAT);
  for (var i = 0; i < uatLabels.length; i++) map.removeLayer(uatLabels[i]);
  uatLabels = [];
  if (layerJudete) layerJudete.addTo(map);
  map.setView([45.9, 24.9], 7);
  backBtn.style.display = 'none';
};

fetch('judete.geojson')
  .then(function(r) { return r.json(); })
  .then(function(data) {
    layerJudete = L.geoJSON(data, {
      style: { color: '#ffffff', weight: 1.3, fillColor: '#6fa8dc', fillOpacity: 0.9 },
      onEachFeature: function(feature, layer) {
        layer.bindTooltip(feature.properties.Judet, {
          permanent: true, direction: 'center', className: 'label-judet'
        });
        layer.on('mouseover', function() { layer.setStyle({ fillColor: '#3d85c6' }); });
        layer.on('mouseout',  function() { layer.setStyle({ fillColor: '#6fa8dc' }); });
        layer.on('click', function() {
          map.fitBounds(layer.getBounds(), { padding: [20, 20] });
          afiseazaUAT(feature.properties.Judet);
        });
      }
    }).addTo(map);
  });

function afiseazaUAT(judetSelectat) {
  if (layerJudete) map.removeLayer(layerJudete);
  if (layerUAT) map.removeLayer(layerUAT);
  for (var i = 0; i < uatLabels.length; i++) map.removeLayer(uatLabels[i]);
  uatLabels = [];

  fetch('uat.geojson')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var canvasRenderer = L.canvas({ padding: 0.5 });

      layerUAT = L.geoJSON(data, {
        renderer: canvasRenderer,
        filter: function(f) {
          return norm(f.properties.Judet) === norm(judetSelectat);
        },
        style: { color: '#000', weight: 0.8, fillColor: '#ffe599', fillOpacity: 0.9 },
        onEachFeature: function(feature, layer) {
          var latlng = getLabelLatLng(feature, layer);

          var label = L.tooltip({
            permanent: true,
            direction: 'center',
            className: 'label-uat'
          })
            .setContent(feature.properties.UAT)
            .setLatLng(latlng)
            .addTo(map);

          uatLabels.push(label);

          layer.on('mouseover', function() {
            layer.setStyle({ fillColor: '#f1c232' });
            if (label.getElement()) label.getElement().classList.add('label-hover');
          });
          layer.on('mouseout', function() {
            layer.setStyle({ fillColor: '#ffe599' });
            if (label.getElement()) label.getElement().classList.remove('label-hover');
          });
          layer.on('click', function() {
            if (feature.properties.URL) window.open(feature.properties.URL, '_blank');
          });
        }
      }).addTo(map);

      backBtn.style.display = 'block';
    });
}
