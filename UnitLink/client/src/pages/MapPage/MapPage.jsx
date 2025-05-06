// src/pages/MapPage/MapPage.jsx
import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from "react-leaflet";
import axios from "axios"; // Для GeoJSON
import L from "leaflet"; // <--- Імпорт Leaflet для L.icon
import unitService from "../../services/unitService"; // <--- Імпорт сервісу підрозділів
import "./MapPage.scss";

// --- Функція для створення кастомних іконок Leaflet ---
const createUnitIcon = (iconName) => {
  const basePath = "/icons/";
  const defaultIcon = "default.png"; // Переконайтесь, що цей файл існує в public/icons
  let iconFileName = defaultIcon; // За замовчуванням

  // Простий мапінг назв типів на імена файлів (переконайтесь, що файли існують)
  const iconMap = {
    command_post: "command_post.png",
    observation_post: "observation_post.png",
    communication_hub: "communication_hub.png", // або antenna.png
    field_unit: "field_unit.png",
    logistics: "logistics.png", // або truck.png
    checkpoint: "checkpoint.png", // або barrier.png
    medical: "medical.png", // або cross.png
    technical: "technical.png", // або wrench.png
    other: "other.png", // або default.png
  };

  if (iconName && iconMap[iconName.toLowerCase()]) {
    iconFileName = iconMap[iconName.toLowerCase()];
  } else if (iconName) {
    // Спробувати використати ім'я типу як ім'я файлу, якщо немає в мапінгу
    // (Потребує відповідності імен файлів і значень Enum)
    // iconFileName = `${iconName.toLowerCase()}.png`;
    console.warn(
      `Icon mapping for type "${iconName}" not found, using default.`
    );
  }

  return L.icon({
    iconUrl: `${basePath}${iconFileName}`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
};

// Створюємо іконки для кожного типу заздалегідь
// Ключі мають відповідати значенням Enum UnitType у ВЕРХНЬОМУ РЕГІСТРІ
const unitIcons = {
  COMMAND_POST: createUnitIcon("command_post"),
  OBSERVATION_POST: createUnitIcon("observation_post"),
  COMMUNICATION_HUB: createUnitIcon("communication_hub"),
  FIELD_UNIT: createUnitIcon("field_unit"),
  LOGISTICS: createUnitIcon("logistics"),
  CHECKPOINT: createUnitIcon("checkpoint"),
  MEDICAL: createUnitIcon("medical"),
  TECHNICAL: createUnitIcon("technical"),
  OTHER: createUnitIcon("other"),
  DEFAULT: createUnitIcon("default"), // Іконка за замовчуванням
};
// ----------------------------------------------------

const MapPage = () => {
  const initialPosition = [49.8397, 29.0297];
  const initialZoom = 6;

  // Стани для кордонів
  const [ukraineBorders, setUkraineBorders] = useState(null);
  const [errorLoadingBorders, setErrorLoadingBorders] = useState(null);

  // ---> ДОДАНО НАЗАД: Стани для підрозділів <---
  const [units, setUnits] = useState([]); // Початковий стан - порожній масив
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);
  const [errorLoadingUnits, setErrorLoadingUnits] = useState(null);
  // -----------------------------------------------

  // Завантаження кордонів
  useEffect(() => {
    const fetchBorders = async () => {
      try {
        const response = await axios.get("/ukraine_borders.geojson");
        if (response.data && response.data.features) {
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
  }, []);

  // ---> ДОДАНО НАЗАД: Завантаження підрозділів з API <---
  useEffect(() => {
    const fetchUnits = async () => {
      setIsLoadingUnits(true);
      setErrorLoadingUnits(null);
      try {
        const fetchedUnits = await unitService.getUnits();
        console.log("Fetched units from API:", fetchedUnits); // Лог для перевірки
        setUnits(fetchedUnits || []); // Переконуємось, що встановлюємо масив
      } catch (error) {
        setErrorLoadingUnits(error.message || "Failed to load units.");
        console.error("Unit loading error:", error);
      } finally {
        setIsLoadingUnits(false);
      }
    };
    fetchUnits();
  }, []); // Викликаємо один раз при монтуванні
  // -----------------------------------------------------

  // Стиль для кордонів
  const borderStyle = {
    color: "#567a9e",
    weight: 1,
    opacity: 0.7,
    fillOpacity: 0.0,
  };

  // Лог перед рендерингом для діагностики
  // console.log("Current 'units' state:", units);
  // console.log("Is loading units:", isLoadingUnits);
  // console.log("Units loading error:", errorLoadingUnits);

  return (
    <div className="map-wrapper">
      <MapContainer
        center={initialPosition}
        zoom={initialZoom}
        scrollWheelZoom={true}
        className="leaflet-container"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />

        {ukraineBorders && (
          <GeoJSON data={ukraineBorders} style={borderStyle} />
        )}

        {/* Відображення підрозділів зі стану 'units' */}
        {units &&
          units.map((unit) => {
            // <--- Використовуємо 'units'
            // Перевірка координат перед рендерингом маркера
            if (
              !Array.isArray(unit.position) ||
              unit.position.length !== 2 ||
              typeof unit.position[0] !== "number" ||
              typeof unit.position[1] !== "number"
            ) {
              console.error(
                `Invalid or missing position for unit ${unit.name || unit.id}:`,
                unit.position
              );
              return null; // Не рендеримо маркер з невалідними координатами
            }

            // Отримуємо іконку (з перевіркою на null/undefined тип)
            const unitIcon =
              unitIcons[unit.unit_type?.toUpperCase()] || unitIcons.DEFAULT;

            return (
              <Marker
                key={unit.id}
                position={unit.position}
                icon={unitIcon} // Застосовуємо кастомну іконку
              >
                <Popup>
                  <h4>{unit.name}</h4>
                  {/* Перевіряємо наявність полів перед відображенням */}
                  {unit.unit_type && (
                    <p>
                      <strong>Тип:</strong> {unit.unit_type}
                    </p>
                  )}
                  {unit.status && (
                    <p>
                      <strong>Статус зв'язку:</strong> {unit.status}
                    </p>
                  )}
                  {unit.description && (
                    <p>
                      <strong>Інфо:</strong> {unit.description}
                    </p>
                  )}
                  {unit.last_seen && (
                    <p>
                      <strong>Останній раз на зв'язку:</strong>{" "}
                      {new Date(unit.last_seen).toLocaleString()}
                    </p>
                  )}
                </Popup>
              </Marker>
            );
          })}

        {/* Індикатори завантаження/помилок */}
        {isLoadingUnits && (
          <div className="loading-overlay">Loading units...</div>
        )}
        {errorLoadingUnits && (
          <div className="error-overlay">Error: {errorLoadingUnits}</div>
        )}
        {errorLoadingBorders && (
          <div className="error-overlay">Error: {errorLoadingBorders}</div>
        )}
      </MapContainer>
    </div>
  );
};

export default MapPage;
