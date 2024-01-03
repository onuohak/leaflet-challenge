// Define a color gradient function based on earthquake depth
function getDepthColor(depth) {
  if (depth < 10) return "#00FF00";
  if (depth < 30) return "greenyellow";
  if (depth < 50) return "yellow";
  if (depth < 70) return "orange";
  if (depth < 90) return "orangered";
  return "#FF0000";
}

// Function to create tile layers
function generateTileLayer(style) {
    return L.tileLayer(`https://api.mapbox.com/styles/v1/{style}/tiles/{z}/{x}/{y}?access_token=${api_key}`, {
        attribution: "© <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> ",
        style: style,
        access_token: api_key
    });
}

// Function to create the map with multiple layers
function setupMap(earthquakes, tectonicPlates) {
  const satelliteLayer = generateTileLayer('mapbox/satellite-v9');
  const grayscaleLayer = generateTileLayer('mapbox/light-v11');
  const outdoorsLayer = generateTileLayer('mapbox/outdoors-v12');

  // Add tectonic plates layer to the map
  tectonicPlates.addTo(tectonicPlates);

  // Define base maps
  const baseMaps = {
    "Satellite": satelliteLayer,
    "Grayscale": grayscaleLayer,
    "Outdoors": outdoorsLayer
  };

  // Define overlay maps
  const overlayMaps = {
    "Earthquakes": earthquakes,
    "Tectonic Plates": tectonicPlates
  };

  // Create the map with all three layers: satellite, earthquakes, tectonicPlates
  const myMap = L.map("map", {
    center: [37.820217, -97.806737], // Centered on Kansas
    zoom: 4.5,
    layers: [satelliteLayer, earthquakes, tectonicPlates]
  });

  // Add a legend to the bottom right of the map
  const legend = L.control({ position: "bottomright" });
  legend.onAdd = function () {
    const div = L.DomUtil.create("div", "info legend");
    const depthValues = [-10, 10, 30, 50, 70, 90];
    div.innerHTML += "<h3 style='text-align: center'>Depth</h3>";
    for (let i = 0; i < depthValues.length; i++) {
      div.innerHTML += `<i style="background:${getDepthColor(depthValues[i] + 1)}"></i> ${depthValues[i]}${depthValues[i + 1] ? '&ndash;' + depthValues[i + 1] + '<br>' : '+'}`;
    }
    return div;
  };
  legend.addTo(myMap);

  // Create a layer control with baseMaps and overlayMaps, then add to myMap
  L.control.layers(baseMaps, overlayMaps, {
    collapsed: false
  }).addTo(myMap);
}

// Function to create features for earthquakes
function generateEarthquakeFeatures(earthquakeData) {
  function onEachEarthquakeFeature(feature, layer) {
    const popupContent = `<h3>Location: ${feature.properties.place}</h3><hr><p>Date: ${new Date(feature.properties.time)}</p><p>Magnitude: ${feature.properties.mag}</p><p>Depth: ${feature.geometry.coordinates[2]}</p>`;
    layer.bindPopup(popupContent);
  }

  const earthquakes = L.geoJSON(earthquakeData, {
    onEachFeature: onEachEarthquakeFeature,
    pointToLayer: function (feature, latlng) {
      const markerOptions = {
        radius: feature.properties.mag * 20000,
        fillColor: getDepthColor(feature.geometry.coordinates[2]),
        fillOpacity: 0.7,
        color: "black",
        weight: 0.5
      };
      return L.circle(latlng, markerOptions);
    }
  });

  const tectonicPlates = new L.layerGroup();
  d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json").then(function (plates) {
    L.geoJSON(plates, {
      color: "orange",
      weight: 2
    }).addTo(tectonicPlates);

    setupMap(earthquakes, tectonicPlates);
  });
}

// Fetch earthquake data from the USGS API for the last 7 days
const usgsQueryURL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";

// Make a GET request to the USGS API
d3.json(usgsQueryURL).then(generateEarthquakeFeatures);
