// src/pages/MapPage/MapPage.jsx
import React, { useState, useEffect } from "react"; // Додано useState, useEffect
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from "react-leaflet"; // Додано GeoJSON
import axios from "axios"; // Імпортуємо axios для завантаження файлу
import "./MapPage.scss";

const MapPage = () => {
  const initialPosition = [50.45, 30.52];
  const initialZoom = 6; // Можливо, 6 краще для огляду кордонів

  // Стан для зберігання GeoJSON даних кордонів
  const [ukraineBorders, setUkraineBorders] = useState(null);
  const [errorLoadingBorders, setErrorLoadingBorders] = useState(null);

  // Завантаження GeoJSON даних при монтуванні компонента
  useEffect(() => {
    const fetchBorders = async () => {
      try {
        // Шлях до файлу в папці public
        const response = await axios.get("/ukraine_borders.geojson");
        if (response.data && response.data.features) {
          // Проста перевірка формату
          setUkraineBorders(response.data);
        } else {
          throw new Error("Invalid GeoJSON format received");
        }
      } catch (error) {
        console.error("Error loading Ukraine borders GeoJSON:", error);
        setErrorLoadingBorders("Could not load border data.");
      }
    };

    fetchBorders();
  }, []); // Пустий масив залежностей - виконається один раз при монтуванні

  // Стиль для відображення кордонів
  const borderStyle = {
    color: "#567a9e", // Приглушений синьо-сірий
    weight: 1,
    opacity: 0.7,
    fillOpacity: 0.0,
  };

  return (
    <div className="map-wrapper">
      <MapContainer
        center={initialPosition}
        zoom={initialZoom}
        scrollWheelZoom={true}
        className="leaflet-container"
      >
        {/* Базовий шар карти (CARTO Voyager) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />

        {/* Шар з коректними кордонами України */}
        {/* Відображаємо тільки якщо дані успішно завантажені */}
        {ukraineBorders && (
          <GeoJSON
            data={ukraineBorders}
            style={borderStyle} // Застосовуємо стиль
            // Можна додати інтерактивність, наприклад, Popup при кліку
            // onEachFeature={(feature, layer) => {
            //    layer.bindPopup(`Це міжнародно визнаний кордон України.`);
            // }}
          />
        )}

        {/* Маркер (можна залишити або прибрати) */}
        <Marker position={initialPosition}>
          <Popup>Приблизний центр карти.</Popup>
        </Marker>

        {/* Повідомлення про помилку завантаження кордонів */}
        {errorLoadingBorders && (
          <div className="error-overlay">
            {" "}
            {/* Додайте стилі для цього класу */}
            <p>Error: {errorLoadingBorders}</p>
          </div>
        )}
      </MapContainer>
    </div>
  );
};

export default MapPage;
