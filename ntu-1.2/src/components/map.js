// components/Map.js
import { useEffect, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useSelectedType } from "../context/SelectedTypeContext"; 

const buildIssuePointGeoJson = (points = []) => ({
  type: "FeatureCollection",
  features: points
    .filter((point) => Array.isArray(point.coordinates) && point.coordinates.length === 2)
    .map((point) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: point.coordinates,
      },
      properties: {
        id: point.id,
        title: point.title,
        description: point.description,
        issue: point.issue,
        severity: point.severity,
        source: point.source,
        sourceUrl: point.sourceUrl,
        videoUrl: point.videoUrl,
        cover: point.cover,
        detailSource: point.detailSource,
      },
    })),
});

const Map = ({ isCollapsed, issuePoints = [], hideBatasLine = false, focusedPoint = null, onIssuePointClick = null }) => {
  const [map, setMap] = useState(null); // State untuk menyimpan instansi peta
  const [selectedStyle, setSelectedStyle] = useState("streets"); // State untuk gaya peta
  const [issueSourceReady, setIssueSourceReady] = useState(0);
  const { setSelectedType } = useSelectedType();

  useEffect(() => {
    const initializeMap = async () => {
      const mapInstance = new maplibregl.Map({
        container: "map", // ID elemen div tempat peta ditampilkan
        style: getStyle(selectedStyle), // Memilih gaya peta sesuai dengan pilihan
        center: [107.77045, -6.92808], // Koordinat pusat peta di Kampus ITB Jatinangor (longitude, latitude)
        zoom: 16, // Level zoom, bisa disesuaikan
        pitch: 60, // Sudut kemiringan untuk efek 3D
        bearing: 0, // Sudut pandang
        antialias: true, // Anti-aliasing untuk kualitas peta lebih baik
      });

      // Aktifkan efek 3D (termasuk bangunan 3D)
      mapInstance.on("load", async () => {
        if (!mapInstance.hasImage("blue-location-pin")) {
          const size = 96;
          const canvas = document.createElement("canvas");
          canvas.width = size;
          canvas.height = size;
          const context = canvas.getContext("2d");

          context.fillStyle = "#43B8F0";
          context.beginPath();
          context.arc(48, 36, 30, Math.PI, 0, false);
          context.bezierCurveTo(78, 59, 58, 77, 48, 92);
          context.bezierCurveTo(38, 77, 18, 59, 18, 36);
          context.arc(48, 36, 30, Math.PI, 0, false);
          context.closePath();
          context.fill();

          context.globalCompositeOperation = "destination-out";
          context.beginPath();
          context.arc(48, 36, 15, 0, Math.PI * 2);
          context.fill();

          context.globalCompositeOperation = "source-over";
          mapInstance.addImage("blue-location-pin", context.getImageData(0, 0, size, size), { pixelRatio: 2 });
        }


        // Fetch GeoJSON data
        const response = await fetch("/map/pipeline.geojson");
        const geojsonData = await response.json();

        // Tambahkan sumber data GeoJSON
        mapInstance.addSource("geojson-data", {
          type: "geojson",
          data: geojsonData,
        });

        // Tambahkan layer untuk polyline dengan style berbeda berdasarkan type
        mapInstance.addLayer({
          id: "pipeline",
          type: "line",
          source: "geojson-data",
          paint: {
            "line-color": [
              "match",
              ["get", "type"],
              "8",
              "#FF0000", // Merah untuk type 8
              "6",
              "#0000FF", // Biru untuk type 6
              "4",
              "#000000", // Hitam untuk type 4
              "2",
              "#000000", // Hitam untuk type 2
              "#888888", // Default color
            ],
            "line-width": [
              "match",
              ["get", "type"],
              "8",
              4, // Tebal untuk type 8
              "6",
              3, // Sedang untuk type 6
              "4",
              2, // Tipis untuk type 4
              "2",
              1, // Lebih tipis untuk type 2
              1, // Default width
            ],
          },
        });

        if (!hideBatasLine) {
          // Fetch GeoJSON data for BatasLine
          const batasLineResponse = await fetch("/map/BatasLine.geojson");
          const batasLineGeojsonData = await batasLineResponse.json();

          // Tambahkan sumber data GeoJSON untuk BatasLine
          mapInstance.addSource("batasline-data", {
            type: "geojson",
            data: batasLineGeojsonData,
          });

          // Tambahkan layer untuk BatasLine
          mapInstance.addLayer({
            id: "batasline",
            type: "line",
            source: "batasline-data",
            paint: {
              "line-color": "#FF00FF", // Warna untuk BatasLine
              "line-width": 2, // Lebar garis untuk BatasLine
            },
          });
        }

        // Fetch GeoJSON data for Polygon
        const polygonResponse = await fetch("/map/Polygon.geojson");
        const polygonGeojsonData = await polygonResponse.json();

        // Tambahkan sumber data GeoJSON untuk Polygon
        mapInstance.addSource("polygon-data", {
          type: "geojson",
          data: polygonGeojsonData,
        });

        // Tambahkan layer untuk Polygon dengan warna berdasarkan nama
        mapInstance.addLayer({
          id: "polygon",
          type: "fill",
          source: "polygon-data",
          paint: {
            "fill-color": [
              "match",
              ["get", "name"],
              "Situ",
              "#0000FF", // Biru untuk "Situ"
              "WTP",
              "#FF0000", // Merah untuk "WTP"
              "OuterTank",
              "#00FF00", // Hijau untuk "OuterTank"
              "RumahPompa",
              "#FFFF00", // Kuning untuk "RumahPompa"
              "GWT",
              "#FF00FF", // Magenta untuk "GWT"
              "Asrama 1",
              "#A52A2A", // Cyan untuk "Asrama 1"
              "Asrama 2",
              "#A52A2A", // Oranye untuk "Asrama 2"
              "Asrama 3",
              "#A52A2A", // Ungu untuk "Asrama 3"
              "Asrama 4",
              "#A52A2A", // Hijau tua untuk "Asrama 4"
              "Water Tank Asrama 1",
              "#4B5563", // Dark Grey untuk "Water Tank Asrama 1"
              "Water Tank 2",
              "#4B5563", // Dark Grey untuk "Water Tank 2"
              "Water Tank Asrama 3",
              "#4B5563", // Dark Grey untuk "Water Tank Asrama 3"
              "Water Tanka Asrama 4",
              "#4B5563", // Dark Grey untuk "Water Tanka Asrama 4"
              "pre treatment",
              "#000080", // Biru tua untuk "pre treatment"
              "#888888", // Default color
            ],
            "fill-opacity": 0.8, // Opasitas untuk Polygon
          },
        });

        mapInstance.addSource("issue-points", {
          type: "geojson",
          data: buildIssuePointGeoJson(issuePoints),
        });

        mapInstance.addLayer({
          id: "issue-points",
          type: "symbol",
          source: "issue-points",
          layout: {
            "icon-image": "blue-location-pin",
            "icon-size": 0.55,
            "icon-anchor": "bottom",
            "icon-allow-overlap": true,
            "icon-ignore-placement": true,
          },
        });

        mapInstance.addLayer({
          id: "issue-point-labels",
          type: "symbol",
          source: "issue-points",
          layout: {
            "text-field": ["get", "title"],
            "text-size": 12,
            "text-offset": [0, 0.9],
            "text-anchor": "top",
          },
          paint: {
            "text-color": "#0f172a",
            "text-halo-color": "#ffffff",
            "text-halo-width": 1.5,
          },
        });
        setIssueSourceReady((current) => current + 1);

        // Tambahkan interaktivitas untuk menampilkan popup saat garis atau titik diklik
        const handleClick = (e) => {
          const layerId = e.features[0].layer.id;
          const coordinates = e.lngLat;
          const properties = e.features[0].properties;
          console.log("ini layer:", layerId);
          console.log("ini properti:", properties);
          
          // Kirim tipe ke parent via onTypeChange
          if (layerId === "pipeline") {
            setSelectedType("pipeline");
          } else if (layerId === "polygon") {
            setSelectedType("polygon");
          } else {
            setSelectedType(null);
          }

          let popupHtml = "";
          let descriptionArray = [];

          if (layerId === "polygon") {
            descriptionArray = [
              {
                name: "Sensor Turbidity",
                merk: "Rika",
                type: "RK500-07SS Turbidity Sensor",
                unit: "1",
                status: "OK",
              },
              {
                name: "Sensor pH",
                merk: "Renke",
                type: "RS-PH-N01-3-204T pH Sensor",
                unit: "1",
                status: "OK",
              },
              {
                name: "Water Level",
                merk: "MaxBotic",
                type: "DC 24V Water Level Transmitter 4-20mA",
                unit: "1",
                status: "OK",
              }
            ];

            const itemsHtml = descriptionArray.map(item => `
              <div style="margin-bottom:12px; padding-bottom:12px; border-bottom:1px solid #e2e8f0;">
                <strong style="color: #0f172a; font-size: 14px; display: block; margin-bottom: 4px;">${item.name}</strong>
                <div style="color: #475569; font-size: 12px; line-height: 1.4;">
                  Merk: <span style="color: #334155;">${item.merk}</span><br>
                  Tipe: <span style="color: #334155;">${item.type}</span><br>
                  Unit: <span style="color: #334155;">${item.unit}</span><br>
                  Status: <span style="color: #10b981; font-weight: 600;">${item.status}</span>
                </div>
              </div>
            `).join("");

            popupHtml = `
              <div style="background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #dbeafe; box-shadow: 0 20px 45px -20px rgba(15,23,42,0.25); min-width: 280px; font-family: sans-serif; color: #0f172a;">
                <div style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0;">
                  <h3 style="margin: 0; font-size: 15px; font-weight: 800; color: #0f172a; letter-spacing: 0.3px;">Detail Fasilitas</h3>
                </div>
                <div style="padding: 16px 20px;">
                  ${itemsHtml}
                </div>
              </div>
            `;
          } else if (layerId === "pipeline") {
            // misal tetap objek tunggal
            let descriptionObj = {
              name: "Flowmeter",
              merk: "Ultrasonic Flow Meter",
              type: "TUF2000M",
              unit: "1",
              status: "Ok"
            };

            popupHtml = `
              <div style="background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #dbeafe; box-shadow: 0 20px 45px -20px rgba(15,23,42,0.25); min-width: 250px; font-family: sans-serif; color: #0f172a;">
                <div style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0;">
                  <h3 style="margin: 0; font-size: 15px; font-weight: 800; color: #0f172a; letter-spacing: 0.3px;">Detail Jalur Pipa</h3>
                </div>
                <div style="padding: 16px 20px;">
                  <strong style="color: #0f172a; font-size: 14px; display: block; margin-bottom: 8px;">${descriptionObj.name}</strong>
                  <div style="color: #475569; font-size: 12px; line-height: 1.6;">
                    Merk: <span style="color: #334155;">${descriptionObj.merk}</span><br>
                    Tipe: <span style="color: #334155;">${descriptionObj.type}</span><br>
                    Unit: <span style="color: #334155;">${descriptionObj.unit}</span><br>
                    Status: <span style="color: #10b981; font-weight: 600;">${descriptionObj.status}</span>
                  </div>
                </div>
              </div>
            `;
          } else if (layerId === "issue-points") {
            if (typeof onIssuePointClick === "function") {
              onIssuePointClick({
                id: properties.id,
                title: properties.title,
                description: properties.description,
                issue: properties.issue,
                severity: properties.severity,
                source: properties.source,
                sourceUrl: properties.sourceUrl,
                videoUrl: properties.videoUrl,
                cover: properties.cover,
                detailSource: properties.detailSource,
                coordinates: [coordinates.lng, coordinates.lat],
              });
            }

            const isTikTok = properties.sourceUrl && properties.sourceUrl.includes("tiktok.com");
            const sourceHtml = properties.sourceUrl 
              ? `<a href="${properties.sourceUrl}" target="_blank" rel="noopener noreferrer" style="color: ${isTikTok ? "#ff0050" : "#0284c7"}; text-decoration: none; font-weight: 700; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s; background: #f0f9ff; padding: 4px 10px; border-radius: 8px; border: 1px solid #bae6fd;">
                  ${isTikTok ? `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z"/></svg>` : ""}
                  ${properties.source || "Lihat Sumber"} 
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                 </a>`
              : `<span style="color: #64748b;">${properties.source || "Laporan Warga"}</span>`;
            const videoHtml = properties.videoUrl
              ? `<div style="padding: 14px 16px 0 16px;">
                  <video controls playsinline preload="metadata" poster="${properties.cover || ""}" style="width: 100%; max-height: 280px; border-radius: 14px; background: #020617; display: block; border: 1px solid #dbeafe;">
                    <source src="${properties.videoUrl}" type="video/mp4" />
                    Browser tidak mendukung pemutar video.
                  </video>
                 </div>`
              : "";

            popupHtml = `
              <div style="background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #dbeafe; box-shadow: 0 20px 45px -20px rgba(15,23,42,0.25); min-width: 320px; max-width: 360px; font-family: sans-serif; color: #0f172a;">
                ${videoHtml}
                <div style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0;">
                  <h3 style="margin: 0; font-size: 15px; font-weight: 800; color: #0f172a; letter-spacing: 0.3px; line-height: 1.4;">
                    ${properties.sourceUrl 
                      ? `<a href="${properties.sourceUrl}" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none; border-bottom: 1px solid #bae6fd; padding-bottom: 2px; transition: all 0.2s; display: inline-block;" onmouseover="this.style.borderBottomColor='#38bdf8'; this.style.color='#0284c7'; this.style.backgroundColor='#f0f9ff'" onmouseout="this.style.borderBottomColor='#bae6fd'; this.style.color='#0f172a'; this.style.backgroundColor='transparent'">
                          ${properties.title || "Lokasi Air"}
                         </a>`
                      : (properties.title || "Lokasi Air")
                    }
                  </h3>
                  <p style="margin: 6px 0 0 0; font-size: 12px; font-weight: 700; text-transform: uppercase; color: ${properties.severity === "critical" ? "#f87171" : properties.severity === "warning" ? "#fb923c" : "#38bdf8"}; letter-spacing: 0.5px;">${properties.issue || "Permasalahan Air"}</p>
                  <p style="margin: 8px 0 0 0; font-size: 11px; color: #64748b; font-style: italic;">
                    Sumber: ${sourceHtml}
                  </p>
                </div>
                <div style="padding: 16px 20px;">
                  <p style="margin: 0; font-size: 12.5px; color: #334155; line-height: 1.6; font-weight: 400;">${properties.description || "Tidak ada deskripsi."}</p>
                  <div style="display: flex; gap: 8px; margin-top: 14px;">
                    <span style="display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: white; background: ${properties.severity === "critical" ? "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)" : properties.severity === "warning" ? "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" : "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)"}; border: 1px solid rgba(255,255,255,0.1);">${properties.severity || "info"}</span>
                    <span style="display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #047857; background: #ecfdf5; border: 1px solid #a7f3d0;">Jatinangor</span>
                  </div>
                </div>
              </div>
            `;
          }

          new maplibregl.Popup()
            .setLngLat(coordinates)
            .setHTML(popupHtml)
            .addTo(mapInstance);
        };

        mapInstance.on("click", "pipeline", handleClick);
        mapInstance.on("click", "polygon", handleClick);
        mapInstance.on("click", "issue-points", handleClick);

        // Ubah kursor menjadi pointer saat berada di atas garis atau titik
        mapInstance.on("mouseenter", "pipeline", () => {
          mapInstance.getCanvas().style.cursor = "pointer";
        });
        mapInstance.on("mouseenter", "polygon", () => {
          mapInstance.getCanvas().style.cursor = "pointer";
        });
        mapInstance.on("mouseenter", "issue-points", () => {
          mapInstance.getCanvas().style.cursor = "pointer";
        });

        // Kembalikan kursor ke default saat tidak berada di atas garis atau titik
        mapInstance.on("mouseleave", "pipeline", () => {
          mapInstance.getCanvas().style.cursor = "";
        });
        mapInstance.on("mouseleave", "polygon", () => {
          mapInstance.getCanvas().style.cursor = "";
        });
        mapInstance.on("mouseleave", "issue-points", () => {
          mapInstance.getCanvas().style.cursor = "";
        });
      });

      setMap(mapInstance);
    };

    initializeMap();

    return () => {
      if (map) {
        map.remove();
      }
    };
  }, [selectedStyle]); // Gunakan selectedStyle sebagai dependensi untuk merender ulang peta saat berganti gaya

  useEffect(() => {
    if (!map) return;

    const issueSource = map.getSource("issue-points");
    if (!issueSource || typeof issueSource.setData !== "function") return;

    issueSource.setData(buildIssuePointGeoJson(issuePoints));
  }, [issuePoints, issueSourceReady, map]);

  useEffect(() => {
    if (!map || !focusedPoint?.coordinates) return;

    const [longitude, latitude] = focusedPoint.coordinates;
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return;

    map.flyTo({
      center: [longitude, latitude],
      zoom: Math.max(map.getZoom(), 18),
      pitch: 60,
      bearing: map.getBearing(),
      duration: 900,
      essential: true,
    });
  }, [focusedPoint, map]);

  // Fungsi untuk mendapatkan URL gaya berdasarkan pilihan
  const getStyle = (style) => {
    switch (style) {
      case "satellite":
        return "https://api.maptiler.com/maps/hybrid/style.json?key=YzmnrQXnDXAN6xgm6Y8i";
      case "streets":
      default:
        return "https://api.maptiler.com/maps/streets-v2/style.json?key=YzmnrQXnDXAN6xgm6Y8i";
    }
  };

  // Fungsi untuk mengubah gaya peta
  const handleStyleChange = (event) => {
    setSelectedStyle(event.target.value); // Mengubah gaya peta berdasarkan pilihan
  };

  return (
    <div className="h-full w-full bg-[#F3FAFF]">
      {/* Dropdown untuk memilih layer peta */}
      <select 
        onChange={handleStyleChange} 
        value={selectedStyle} 
        className={`fixed bottom-24 ${isCollapsed ? "left-20" : "left-[290px]"} z-30 rounded-xl border border-sky-100 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-900 shadow-lg shadow-sky-100/70 backdrop-blur-md transition-all duration-300 hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-400`}
      >
        <option value="streets">Street View</option>
        <option value="satellite">Satellite View</option>
      </select>

      <div
        id="map"
        style={{ width: "100%", height: "100%" }} // Ukuran peta
      ></div>
    </div>
  );
};

export default Map;
