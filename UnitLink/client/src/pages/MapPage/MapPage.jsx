// src/pages/MapPage/MapPage.jsx
import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "./MapPage.scss"; // Підключаємо оновлені стилі

const MapPage = () => {
  const initialPosition = [50.45, 30.52];
  const initialZoom = 7;

  // Тепер рендеримо MapContainer безпосередньо
  return (
    <MapContainer
      center={initialPosition}
      zoom={initialZoom}
      scrollWheelZoom={true}
      className="leaflet-container" // Клас для застосування абсолютного позиціонування
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={19}
      />
      <Marker position={initialPosition}>
        <Popup>
          Приблизний центр карти. <br /> Стиль CARTO Voyager.
        </Popup>
      </Marker>
    </MapContainer>
  );
};

export default MapPage;
