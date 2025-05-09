// src/pages/MapPage/MapPage.jsx
import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from "react-leaflet";
import axios from "axios"; // Для GeoJSON
import L from "leaflet"; // Імпорт Leaflet для L.icon
import unitService from "../../services/unitService"; // Імпорт сервісу підрозділів
import "./MapPage.scss";

// --- Функція для створення Leaflet іконок (тепер для SVG) ---
const createLeafletIcon = (fileNameStem) => {
  const basePath = "/icons/"; // Шлях до іконок у папці public
  // Іконка за замовчуванням, ТАКОЖ МАЄ БУТИ SVG
  const defaultIconFileName = "default.svg"; // Або 'other.svg', якщо такий файл є

  // Формуємо ім'я файлу, тепер з розширенням .svg
  const iconFileName = fileNameStem
    ? `${fileNameStem.toLowerCase()}.svg`
    : defaultIconFileName;

  return L.icon({
    iconUrl: `${basePath}${iconFileName}`, // <--- ВИПРАВЛЕНО: Правильний template literal
    iconSize: [20, 20], // Розмір іконки [ширина, висота] - підберіть під ваші SVG
    iconAnchor: [15, 30], // Точка прив'язки [x, y] (зазвичай центр знизу іконки)
    popupAnchor: [0, -30], // Зміщення Popup відносно iconAnchor [x, y]
  });
};

// Мапінг типів підрозділів (ключі - як з бекенду, у ВЕРХНЬОМУ РЕГІСТРІ)
// на основи імен файлів іконок (у нижньому регістрі, без розширення)
const unitTypeToIconFileStem = {
  COMMAND_POST: "command_post",
  OBSERVATION_POST: "observation_post",
  COMMUNICATION_HUB: "communication_hub",
  FIELD_UNIT: "field_unit",
  LOGISTICS: "logistics",
  CHECKPOINT: "checkpoint",
  MEDICAL: "medical",
  TECHNICAL: "technical",
  OTHER: "other",
};

// Створюємо об'єкт з готовими Leaflet іконками
const unitIcons = {};
for (const type in unitTypeToIconFileStem) {
  unitIcons[type] = createLeafletIcon(unitTypeToIconFileStem[type]);
}
// Іконка за замовчуванням для невідомих типів або якщо тип не вказано
unitIcons["DEFAULT"] = createLeafletIcon(null); // createLeafletIcon використає defaultIconFileName
// ----------------------------------------------------

const MapPage = () => {
  const initialPosition = [49.8397, 29.0297]; // Центр України (приблизно)
  const initialZoom = 6;

  // Стани для кордонів
  const [ukraineBorders, setUkraineBorders] = useState(null);
  const [errorLoadingBorders, setErrorLoadingBorders] = useState(null);

  // Стани для підрозділів
  const [units, setUnits] = useState([]);
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);
  const [errorLoadingUnits, setErrorLoadingUnits] = useState(null);

  // Завантаження GeoJSON даних кордонів
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

  // Завантаження підрозділів з API
  useEffect(() => {
    const fetchUnits = async () => {
      setIsLoadingUnits(true);
      setErrorLoadingUnits(null);
      try {
        const fetchedUnits = await unitService.getUnits();
        console.log("Fetched units from API:", fetchedUnits);
        setUnits(fetchedUnits || []); // Гарантуємо, що встановлюємо масив
      } catch (error) {
        setErrorLoadingUnits(error.message || "Failed to load units.");
        console.error("Unit loading error:", error);
      } finally {
        setIsLoadingUnits(false);
      }
    };
    fetchUnits();
  }, []);

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

            // Отримуємо іконку (unit.unit_type з бекенду - це рядок, напр. "COMMAND_POST")
            const iconToUse = unitIcons[unit.unit_type] || unitIcons.DEFAULT;

            return (
              <Marker
                key={unit.id}
                position={unit.position}
                icon={iconToUse} // Застосовуємо кастомну іконку
              >
                <Popup>
                  <h4>{unit.name}</h4>
                  {/* Перевіряємо наявність полів перед відображенням */}
                  {unit.unit_type && (
                    <p>
                      <strong>Тип:</strong>{" "}
                      {unit.unit_type.replace("_", " ").toLowerCase()}
                    </p>
                  )}
                  {unit.status && (
                    <p>
                      <strong>Статус зв'язку:</strong>{" "}
                      {unit.status.toLowerCase()}
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
