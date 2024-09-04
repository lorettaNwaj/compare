const mapStyle = {
  version: 8,
  glyphs: "http://localhost:8001/glyphs/{fontstack}/{range}.pbf",
  sources: {
    esriWorldPhysical: {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 10,
      attribution: "Esri",
    },
  },
  layers: [
    {
      id: "esriWorldPhysical-layer",
      type: "raster",
      source: "esriWorldPhysical",
      minzoom: 0,
      maxzoom: 10,
      paint: {
        "raster-opacity": 0.2,
      },
    },
  ],
};

const map1 = new maplibregl.Map({
  container: "map1",
  style: mapStyle,
  center: [-98.35, 39.5],
  zoom: 3,
  maxZoom: 10,
});

const map2 = new maplibregl.Map({
  container: "map2",
  style: mapStyle,
  center: [-98.35, 39.5],
  zoom: 3,
  maxZoom: 10,
});

// Create a custom control for the north arrow
class NorthArrowControl {
  onAdd(map) {
    this._map = map;
    this._container = document.createElement("div");
    this._container.className = "north-arrow";
    this._container.innerHTML = `<img src="northarrow.svg" style="width: 50px;" alt="North Arrow">`;
    this._map.on("rotate", () => {
      const bearing = this._map.getBearing();
      this._container.querySelector(
        "img"
      ).style.transform = `rotate(${-bearing}deg)`;
    });
    return this._container;
  }

  onRemove() {
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
  }
}

// Add scale control and north arrow to map1
map1.addControl(new maplibregl.ScaleControl({ position: "bottom-left" }));
map1.addControl(new NorthArrowControl(), "top-right");

// Add scale control and north arrow to map2
map2.addControl(new maplibregl.ScaleControl({ position: "bottom-left" }));
map2.addControl(new NorthArrowControl(), "top-right");

const geojsonFiles = [
  {
    name: "PopDensity 1800",
    file: "POP_JSON/choropleth_1800.geojson",
    topic: "Population",
    legend: "density",
  },
  {
    name: "PopDensity 1810",
    file: "POP_JSON/choropleth_1810.geojson",
    topic: "Population",
    legend: "density",
  },
  {
    name: "PopDensity 1820",
    file: "POP_JSON/choropleth_1820.geojson",
    topic: "Population",
    legend: "density",
  },
  {
    name: "PopDensity 1830",
    file: "POP_JSON/choropleth_1830.geojson",
    topic: "Population",
    legend: "density",
  },
  {
    name: "PopDensity 1840",
    file: "POP_JSON/choropleth_1840.geojson",
    topic: "Population",
    legend: "density",
  },
  {
    name: "PopDensity 1850",
    file: "POP_JSON/choropleth_1850.geojson",
    topic: "Population",
    legend: "density",
  },
  {
    name: "Migration 1800",
    file: "migration_1800.geojson",
    topic: "Migration",
    legend: "migration",
  },
  {
    name: "Migration 1810",
    file: "migration_1810.geojson",
    topic: "Migration",
    legend: "migration",
  },
  {
    name: "Migration 1820",
    file: "migration_1820.geojson",
    topic: "Migration",
    legend: "migration",
  },
  {
    name: "Migration 1830",
    file: "migration_1830.geojson",
    topic: "Migration",
    legend: "migration",
  },
  {
    name: "Migration 1840",
    file: "migration_1840.geojson",
    topic: "Migration",
    legend: "migration",
  },
  {
    name: "Migration 1850",
    file: "migration_1850.geojson",
    topic: "Migration",
    legend: "migration",
  },
  // Add more files as needed
];

const fieldsToHide = [
  "OBJECTID",
  "NHGISST",
  "NHGISCTY",
  "ICPSRSTI",
  "ICPSRCTY",
  "ICPSRFIP",
  "STATE",
  "ICPSRNAM",
  "Y_CENTROID",
  "X_CENTROID",
  "PID",
  "COUNTY",
  "ICPSRST",
  "GISJOIN",
  "GISJOIN2",
  "SHAPE_AREA",
  "COMPOSITE_",
  "AREA_SQM",
  "color",
  "SHAPE_LENG",
  "ICPSRCTYI",
  "SHAPE_LEN",
  "id",
  "DECADE",
  "rootsid",
  "STATE_ABBR",
  "Year",
];

const fieldMappings = {
  popDensity: "Population Density",
  STATENAM: "State Name",
  POP_TOTAL: "Total Population",
  NHGISNAM: "County Name",
  Netflow_Ratio: "Migration Efficiency",
};

function injectInitialMessage(tableId, message) {
  const tableContainer = document.querySelector(`#${tableId}`).parentElement;
  const messageDiv = document.createElement("div");
  messageDiv.id = `initial-message-${tableId}`;
  messageDiv.className = "initial-message";
  messageDiv.textContent = message;
  tableContainer.insertBefore(messageDiv, tableContainer.firstChild);
}

function removeInitialMessage(tableId) {
  const messageDiv = document.getElementById(`initial-message-${tableId}`);
  if (messageDiv) {
    messageDiv.parentElement.removeChild(messageDiv);
  }
}

function unloadMapData(map) {
  if (map.getSource("data")) {
    map.removeLayer("data-layer");
    map.removeLayer("hover-layer");
    map.removeSource("data");
  }
  if (map.getSource("highlight")) {
    map.removeLayer("highlight-layer");
    map.removeSource("highlight");
  }
}

function highlightTableRow(tableId, featureIndex) {
  // Remove previous highlights
  document.querySelectorAll(`#${tableId}-body tr`).forEach((row) => {
    row.classList.remove("highlighted-row"); // Remove the highlight class
  });

  // Highlight the corresponding row
  const row = document.getElementById(`${tableId}-row-${featureIndex}`);
  if (row) {
    row.classList.add("highlighted-row"); // Add the highlight class
  }
}

function loadGeoJSON(map, url, tableId, infoId) {
  fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Network response was not ok ${response.statusText}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("GeoJSON data loaded:", data);

      unloadMapData(map);

      map.addSource("data", {
        type: "geojson",
        data: data,
      });
      map.addLayer({
        id: "data-layer",
        type: "fill",
        source: "data",
        layout: {},
        paint: {
          "fill-color": ["get", "color"],
          "fill-opacity": 0.7,
          "fill-outline-color": "rgba(200, 200, 200, 0.5)",
        },
      });
      map.addLayer({
        id: "hover-layer",
        type: "line",
        source: "data",
        layout: {},
        paint: {
          "line-color": "grey",
          "line-width": 0.5,
        },
        filter: ["==", "OBJECTID", ""], // Initially no feature is highlighted
      });

      // Re-initialize the DataTable each time new data is loaded
      if ($.fn.DataTable.isDataTable(`#${tableId}`)) {
        $(`#${tableId}`).DataTable().clear().destroy();
      }

      populateTable(data, tableId, map);
      addMapHover(map, data, infoId);

      // Add click event to highlight the corresponding table row
      map.on("click", "data-layer", (e) => {
        if (e.features.length > 0) {
          const feature = e.features[0];
          highlightTableRow(tableId, feature.properties.OBJECTID);
        }
      });
    })
    .catch((error) => {
      console.error("Error loading GeoJSON:", error);
    });
}

function populateTable(data, tableId, map) {
  const headerRow = document.getElementById(`${tableId}-header`);
  const body = document.getElementById(`${tableId}-body`);

  // Clear existing content
  headerRow.innerHTML = "";
  body.innerHTML = "";

  if (data.features.length > 0) {
    // Remove initial message
    removeInitialMessage(tableId);

    // Create header row
    const headers = Object.keys(data.features[0].properties)
      .filter((header) => !fieldsToHide.includes(header))
      .map((header) => fieldMappings[header] || header);
    headers.forEach((header) => {
      const th = document.createElement("th");
      th.textContent = header;
      headerRow.appendChild(th);
    });

    // Create body rows
    data.features.forEach((feature, index) => {
      const tr = document.createElement("tr");
      tr.classList.add("clickable-row");
      tr.dataset.featureIndex = index; // Store feature index in dataset
      tr.id = `${tableId}-row-${index}`; // Add id to each row
      headers.forEach((header) => {
        const fieldName = Object.keys(fieldMappings).find(
          (key) => fieldMappings[key] === header
        );
        const fieldValue =
          feature.properties[fieldName] || feature.properties[header];
        const td = document.createElement("td");
        td.textContent = fieldValue || ""; // Display empty string if property is missing
        tr.appendChild(td);
      });
      body.appendChild(tr);
    });

    // Initialize DataTable AFTER the rows have been added
    $(`#${tableId}`).DataTable({
      pageLength: 10, // Show 10 entries per page
    });

    // Click event listener for zooming to feature
    $(`#${tableId} tbody`).on("click", "tr", function () {
      const row = $(this).closest("tr");
      const featureIndex = row.data("featureIndex");
      const feature = data.features[featureIndex];
      const coordinates = feature.geometry.coordinates;

      // Handle different geometry types (Polygon, MultiPolygon)
      let bounds = new maplibregl.LngLatBounds();
      if (feature.geometry.type === "Polygon") {
        coordinates[0].forEach((coord) => {
          bounds.extend(coord);
        });
      } else if (feature.geometry.type === "MultiPolygon") {
        coordinates.forEach((polygon) => {
          polygon[0].forEach((coord) => {
            bounds.extend(coord);
          });
        });
      }

      // Highlight the feature
      const highlightSource = map.getSource("highlight");
      if (highlightSource) {
        highlightSource.setData(feature);
      } else {
        map.addSource("highlight", {
          type: "geojson",
          data: feature,
        });
        map.addLayer({
          id: "highlight-layer",
          type: "line",
          source: "highlight",
          paint: {
            "line-color": "red",
            "line-width": 0.5,
          },
        });
      }

      map.fitBounds(bounds, {
        padding: 20,
      });

      // Highlight the row
      highlightTableRow(tableId, featureIndex);
    });
  } else {
    // If no data is available, show a message or handle accordingly
    body.innerHTML = `<tr><td colspan="${headerRow.children.length}">No data available</td></tr>`;
  }
}

function addMapHover(map, data, infoId) {
  const infoDiv = document.getElementById(infoId);

  map.on("mousemove", "data-layer", (e) => {
    if (e.features.length > 0) {
      map.getCanvas().style.cursor = "pointer";

      const feature = e.features[0];
      const properties = feature.properties;

      let infoContent = "";
      for (const key in properties) {
        if (!fieldsToHide.includes(key)) {
          const displayKey = fieldMappings[key] || key;
          infoContent += `<strong>${displayKey}:</strong> ${properties[key]}<br>`;
        }
      }

      infoDiv.innerHTML = infoContent;
      infoDiv.style.display = "block"; // Display the info box

      // Highlight the hovered feature
      map.setFilter("hover-layer", [
        "==",
        "OBJECTID",
        feature.properties.OBJECTID,
      ]);
    }
  });

  map.on("mouseleave", "data-layer", () => {
    map.getCanvas().style.cursor = "";
    infoDiv.style.display = "none"; // Hide the info box

    // Reset the hover filter
    map.setFilter("hover-layer", ["==", "OBJECTID", ""]);
  });
}

function handleMapSelectChange(mapId, tableId, infoId) {
  const selectElement = document.getElementById(`${mapId}-select`);
  const sliderElement = document.getElementById(`${mapId}-slider`);
  const selectedTopic = selectElement.value;
  const selectedYear = sliderElement.value;

  if (selectedTopic === "Select a Topic") {
    unloadMapData(mapId === "map1" ? map1 : map2);
    return;
  }

  const selectedFile = geojsonFiles.find(
    (file) => file.topic === selectedTopic && file.name.includes(selectedYear)
  )?.file;

  if (selectedFile) {
    console.log(`Loading file: ${selectedFile} for map: ${mapId}`);
    const map = mapId === "map1" ? map1 : map2;
    if (map.loaded()) {
      loadGeoJSON(map, selectedFile, tableId, infoId);
    } else {
      map.on("load", () => loadGeoJSON(map, selectedFile, tableId, infoId));
    }

    // Display the appropriate legend
    const selectedGeojson = geojsonFiles.find(
      (file) => file.file === selectedFile
    );
    if (selectedGeojson) {
      displayLegend(mapId, selectedGeojson.legend);
    }
  }
}

function displayLegend(mapId, legendType) {
  const densityLegend = document.getElementById(`density-legend-${mapId}`);
  const migrationLegend = document.getElementById(`migration-legend-${mapId}`);

  if (legendType === "density") {
    densityLegend.style.display = "block";
    migrationLegend.style.display = "none";
  } else if (legendType === "migration") {
    densityLegend.style.display = "none";
    migrationLegend.style.display = "block";
  } else {
    densityLegend.style.display = "none";
    migrationLegend.style.display = "none";
  }
}

document.getElementById("map1-select").addEventListener("change", () => {
  handleMapSelectChange("map1", "table1", "map1-info");
});

document.getElementById("map2-select").addEventListener("change", () => {
  handleMapSelectChange("map2", "table2", "map2-info");
});

document.getElementById("map1-slider").addEventListener("input", function () {
  document.getElementById("map1-year").textContent = this.value;
  handleMapSelectChange("map1", "table1", "map1-info");
});

document.getElementById("map2-slider").addEventListener("input", function () {
  document.getElementById("map2-year").textContent = this.value;
  handleMapSelectChange("map2", "table2", "map2-info");
});

// Inject initial messages
injectInitialMessage("table1", "Pick a map from the dropdown above.");
injectInitialMessage("table2", "Choose a map to compare.");

// Toggle legend content visibility
document.querySelectorAll(".toggle-legend").forEach((button) => {
  button.addEventListener("click", function () {
    const legendContent = this.parentElement.nextElementSibling;
    const legendLabel = this.nextElementSibling;
    if (legendContent.style.display === "block") {
      legendContent.style.display = "none";
      legendLabel.style.display = "inline";
      this.textContent = "+";
    } else {
      legendContent.style.display = "block";
      legendLabel.style.display = "none";
      this.textContent = "-";
    }
  });
});

// Show/Hide attribute table
document.getElementById("show-table").addEventListener("click", () => {
  document.getElementById("tables-container").style.display = "flex";
  document.getElementById("show-table").style.display = "none";
  document.getElementById("hide-table").style.display = "block";
  document.getElementById("container").style.height = "60%";
});

document.getElementById("hide-table").addEventListener("click", () => {
  document.getElementById("tables-container").style.display = "none";
  document.getElementById("show-table").style.display = "block";
  document.getElementById("hide-table").style.display = "none";
  document.getElementById("container").style.height = "100%";
});

document
  .getElementById("toggle-control-box")
  .addEventListener("click", function () {
    const controlBoxContent = document.getElementById("control-box-content");
    if (
      controlBoxContent.style.display === "block" ||
      controlBoxContent.style.display === ""
    ) {
      controlBoxContent.style.display = "none";
      this.textContent = "Show Controls";
    } else {
      controlBoxContent.style.display = "block";
      this.textContent = "Hide Controls";
    }
  });
