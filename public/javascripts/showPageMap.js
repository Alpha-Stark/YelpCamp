mapboxgl.accessToken = mapToken; //created the mapToken variable on show.ejs page just before this script is referenced.
// mapboxgl.accessToken = process.env.MAPBOX_TOKEN; //This does not work.
const map = new mapboxgl.Map({
  container: "map", // container ID
  style: "mapbox://styles/mapbox/outdoors-v12", // style URL = satellite-streets-v11, navigation-day-v1, light-v11
  center: campground.geometry.coordinates, // starting position [lng, lat]
  zoom: 11, // starting zoom
});

map.addControl(new mapboxgl.NavigationControl());

// Create a default Marker and add it to the map.
new mapboxgl.Marker()
  .setLngLat(campground.geometry.coordinates)
  .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<h4>${campground.title}</h4><p>${campground.location}</p>`))
  .addTo(map);
//For Popup, refer the link (https://docs.mapbox.com/mapbox-gl-js/api/markers/#popup)
