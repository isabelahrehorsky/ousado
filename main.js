// Make the map, with a satellite imagery basemap
const map = new maplibregl.Map({
  container: 'map',
  style: {
    version: 8,
    sources: {
      imagery: {
        type: 'raster',
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256,
        attribution: 'Imagery © Esri'
      }
    },
    layers: [{ id: 'imagery', type: 'raster', source: 'imagery' }]
  },
  center: [-56.69, -17.28],
  zoom: 11
});

let points = []; // Ousado's GPS points (the file is already in time order)


// load the points and add the layers
map.on('load', () => {
  fetch('ousado.geojson')
    .then(response => response.json())
    .then(data => {
      points = data.features;

      // Home range: white shape
      map.addSource('range', { type: 'geojson', data: turf.featureCollection([]) });
      map.addLayer({ id: 'range', type: 'fill', source: 'range',
        paint: { 'fill-color': '#ffffff', 'fill-opacity': 0.3 } });

      // Points so far: small gold dots
      map.addSource('points', { type: 'geojson', data: turf.featureCollection([]) });
      map.addLayer({ id: 'points', type: 'circle', source: 'points',
        paint: { 'circle-radius': 3, 'circle-color': '#f2b134' } });

      // Where he is now: big gold dot
      map.addSource('now', { type: 'geojson', data: points[0] });
      map.addLayer({ id: 'now', type: 'circle', source: 'now',
        paint: { 'circle-radius': 8, 'circle-color': '#f2b134',
                 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 3 } });

      // The slider has one step per GPS point
      const slider = document.getElementById('slider');
      slider.max = points.length - 1;
      slider.addEventListener('input', () => update(Number(slider.value)));

      update(0);
    });
});


// Redraw the map for slider position i
function update(i) {
  const soFar = points.slice(0, i + 1); // all points up to now

  map.getSource('points').setData(turf.featureCollection(soFar));
  map.getSource('now').setData(points[i]);

  // Home range = the smallest shape around all points so far (needs 3+ points)
  let area = 0;
  if (soFar.length >= 3) {
    const range = turf.convex(turf.featureCollection(soFar));
    map.getSource('range').setData(range);
    area = turf.area(range) / 1000000; // square metres -> km²
  }

  // Date (first 10 characters of the timestamp) and home range size
  const date = points[i].properties.timestamp.slice(0, 10);
  document.getElementById('label').textContent =
    date + '  |  Home range so far: ' + area.toFixed(1) + ' km²';
}
