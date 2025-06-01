// src/pages/MapPage/MapPage.jsx
import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from "react-leaflet";
import axios from "axios"; // Для GeoJSON
import L from "leaflet"; // Імпорт Leaflet для L.icon та L.DivIcon
import ReactDOMServer from "react-dom/server"; // Для рендерингу React компонентів в HTML рядок
import unitService from "../../services/unitService"; // Імпорт сервісу підрозділів
import io from "socket.io-client"; // Імпорт Socket.IO клієнта
import "./MapPage.scss";

// --- Імпорт ваших SVG іконок як React Компонентів ---
// Переконайтесь, що шлях правильний і файли існують в src/assets/icons/
// Якщо якогось файлу немає, замініть на DefaultSvg або створіть файл
import { ReactComponent as CommandPostSvg } from "../../assets/icons/command_post.svg";
import { ReactComponent as ObservationPostSvg } from "../../assets/icons/observation_post.svg";
import { ReactComponent as CommunicationHubSvg } from "../../assets/icons/communication_hub.svg";
import { ReactComponent as FieldUnitSvg } from "../../assets/icons/field_unit.svg";
import { ReactComponent as LogisticsSvg } from "../../assets/icons/logistics.svg";
import { ReactComponent as CheckpointSvg } from "../../assets/icons/checkpoint.svg";
import { ReactComponent as MedicalSvg } from "../../assets/icons/medical.svg";
import { ReactComponent as TechnicalSvg } from "../../assets/icons/technical.svg";
import { ReactComponent as OtherSvg } from "../../assets/icons/other.svg";
import { ReactComponent as DefaultSvg } from "../../assets/icons/default.svg";

// Мапінг типів підрозділів (з бекенду) на відповідні SVG React Компоненти
const unitTypeToSvgComponent = {
  COMMAND_POST: CommandPostSvg,
  OBSERVATION_POST: ObservationPostSvg,
  COMMUNICATION_HUB: CommunicationHubSvg,
  FIELD_UNIT: FieldUnitSvg,
  LOGISTICS: LogisticsSvg,
  CHECKPOINT: CheckpointSvg,
  MEDICAL: MedicalSvg,
  TECHNICAL: TechnicalSvg,
  OTHER: OtherSvg,
  DEFAULT: DefaultSvg, // Для невідомих типів
};

// Мапінг статусів на кольори
const statusToColor = {
  ONLINE: "#28a745", // Зелений
  OFFLINE: "#dc3545", // Червоний
  UNSTABLE: "#ffc107", // Жовтий
  UNKNOWN: "#6c757d", // Сірий
  DEFAULT: "#6c757d", // Колір за замовчуванням
};

const ICON_BASE_FILL_COLOR = 'transparent';
const ICON_STROKE_WIDTH = 2; // Товщина обводки в пікселях

// Константи для розмірів іконок (для L.DivIcon)
const ICON_CONTAINER_SIZE = [32, 32]; // Розмір div-контейнера іконки (ширина, висота)
const ICON_ANCHOR = [16, 32]; // Точка прив'язки (x: половина ширини, y: повна висота = центр знизу)
const POPUP_ANCHOR = [0, -32]; // Зміщення Popup відносно iconAnchor (над іконкою)

const MapPage = () => {
  const initialPosition = [49.0, 32.0]; // Географічний центр України (приблизно, Черкаська обл.)
  const initialZoom = 6; // Масштаб, щоб бачити більшу частину країни

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
        const response = await axios.get("/ukraine_borders.geojson"); // Переконайтесь, що файл тут
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

  // Завантаження початкового списку підрозділів з API
  useEffect(() => {
    const fetchUnits = async () => {
      setIsLoadingUnits(true);
      setErrorLoadingUnits(null);
      try {
        const fetchedUnits = await unitService.getUnits();
        console.log("Fetched units from API:", fetchedUnits);
        setUnits(fetchedUnits || []);
      } catch (error) {
        setErrorLoadingUnits(error.message || "Failed to load units.");
        console.error("Unit loading error:", error);
      } finally {
        setIsLoadingUnits(false);
      }
    };
    fetchUnits();
  }, []);

  // Ефект для WebSocket з'єднання та обробки оновлень
  useEffect(() => {
    const socket = io(
      process.env.REACT_APP_API_BASE_URL || "http://localhost:5000"
    );

    socket.on("connect", () => {
      console.log("Socket.IO Connected to server!");
    });
    socket.on("connect_error", (err) => {
      console.error("Socket.IO Connection Error:", err);
    });

    socket.on("unit_status_update", (updatedUnitData) => {
      console.log(
        "Received unit_status_update via WebSocket:",
        updatedUnitData
      );
      setUnits((prevUnits) => {
        const existingUnitIndex = prevUnits.findIndex(
          (unit) => unit.id === updatedUnitData.id
        );
        if (existingUnitIndex !== -1) {
          // Оновлюємо існуючий підрозділ
          return prevUnits.map((unit) =>
            unit.id === updatedUnitData.id
              ? { ...unit, ...updatedUnitData } // Об'єднуємо старі та нові дані
              : unit
          );
        } else {
          // Додаємо новий (малоймовірно для оновлень, але можливо)
          return [...prevUnits, updatedUnitData];
        }
      });
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket.IO Disconnected:", reason);
    });

    // Очистка при розмонтуванні компонента
    return () => {
      console.log("Disconnecting Socket.IO...");
      socket.disconnect();
    };
  }, []); // Пустий масив залежностей для одноразового виконання

  // Стиль для відображення кордонів GeoJSON
  const borderStyle = {
    color: "#567a9e", // Приглушений синьо-сірий
    weight: 1.5, // Трохи товща лінія
    opacity: 0.6,
    fillOpacity: 0.0, // Без заливки
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

        {units &&
          units.map((unit) => {
            // Перевірка валідності координат
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
              return null;
            }

            // Вибір SVG компонента та кольору
            const UnitSpecificSvgComponent =
              unitTypeToSvgComponent[unit.unit_type] ||
              unitTypeToSvgComponent.DEFAULT;
            const iconColor =
              statusToColor[unit.status] || statusToColor.DEFAULT;

            // Рендеринг SVG в HTML рядок
            const iconHtml = ReactDOMServer.renderToStaticMarkup(
              <UnitSpecificSvgComponent
                style={{
                  stroke: iconColor,
                  strokeWidth: ICON_STROKE_WIDTH,
                  fill: ICON_BASE_FILL_COLOR,
                  width: "100%",
                  height: "100%",
                }}
              />
            );

            // Створення L.DivIcon
            const customUnitIcon = L.divIcon({
              html: iconHtml,
              className: "custom-unit-div-icon", // Для CSS стилізації контейнера іконки
              iconSize: ICON_CONTAINER_SIZE,
              iconAnchor: ICON_ANCHOR,
              popupAnchor: POPUP_ANCHOR,
            });

            return (
              <Marker
                key={unit.id}
                position={unit.position}
                icon={customUnitIcon}
              >
                <Popup>
                  <h4>{unit.name}</h4>
                  {unit.unit_type && (
                    <p>
                      <strong>Тип:</strong>{" "}
                      {unit.unit_type.replace("_", " ").toLowerCase()}
                    </p>
                  )}
                  {unit.status && (
                    <p>
                      <strong>Статус зв'язку:</strong>{" "}
                      <span style={{ color: iconColor, fontWeight: "bold" }}>
                        {unit.status.toLowerCase()}
                      </span>
                    </p>
                  )}
                  {unit.latest_telemetry && (
                    <>
                      <hr style={{ margin: "5px 0" }} />
                      <p style={{ marginTop: "5px" }}>
                        <u>Останні дані:</u>
                      </p>
                      {unit.latest_telemetry.signal_rssi !== null && (
                        <p>Сигнал: {unit.latest_telemetry.signal_rssi} dBm</p>
                      )}
                      {unit.latest_telemetry.latency_ms !== null && (
                        <p>Затримка: {unit.latest_telemetry.latency_ms} ms</p>
                      )}
                      {unit.latest_telemetry.packet_loss_percent !== null && (
                        <p>
                          Втрати: {unit.latest_telemetry.packet_loss_percent}%
                        </p>
                      )}
                      {unit.latest_telemetry.timestamp && (
                        <p>
                          <small>
                            Оновлено:{" "}
                            {new Date(
                              unit.latest_telemetry.timestamp
                            ).toLocaleTimeString()}
                          </small>
                        </p>
                      )}
                    </>
                  )}
                  {unit.description && (
                    <p
                      style={{
                        marginTop: unit.latest_telemetry ? "10px" : "5px",
                      }}
                    >
                      <strong>Інфо:</strong> {unit.description}
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
          <div className="error-overlay">
            Error loading units: {errorLoadingUnits}
          </div>
        )}
        {errorLoadingBorders && (
          <div className="error-overlay">
            Error loading borders: {errorLoadingBorders}
          </div>
        )}
      </MapContainer>
    </div>
  );
};

export default MapPage;
