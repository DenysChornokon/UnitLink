// src/pages/MapPage/MapPage.jsx
import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from "react-leaflet";
import axios from "axios";
import L from "leaflet";
import ReactDOMServer from "react-dom/server";
import { useUnits } from "../../contexts/UnitContext"; // <-- Головна зміна: імпорт нашого хука
import "./MapPage.scss";
import DeviceHistoryModal from "../../components/DeviceHistoryModal/DeviceHistoryModal";

// Імпорти SVG іконок (без змін)
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

// Мапінги та константи (без змін)
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
  DEFAULT: DefaultSvg,
};

const statusToColor = {
  ONLINE: "#28a745",
  OFFLINE: "#dc3545",
  UNSTABLE: "#ffc107",
  UNKNOWN: "#6c757d",
  DEFAULT: "#6c757d",
};

const ICON_BASE_FILL_COLOR = "transparent";
const ICON_STROKE_WIDTH = 2;
const ICON_CONTAINER_SIZE = [32, 32];
const ICON_ANCHOR = [16, 32];
const POPUP_ANCHOR = [0, -32];

const MapPage = () => {
  const initialPosition = [49.0, 32.0];
  const initialZoom = 6;

  // --- ОТРИМАННЯ ДАНИХ З КОНТЕКСТУ ---
  // Вся логіка отримання підрозділів і оновлень тепер тут, в одному рядку!
  const {
    units,
    isLoading: isLoadingUnits,
    error: errorLoadingUnits,
  } = useUnits();

  // Логіка для кордонів залишається специфічною для цієї сторінки, тому вона тут
  const [ukraineBorders, setUkraineBorders] = useState(null);
  const [errorLoadingBorders, setErrorLoadingBorders] = useState(null);

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

  const borderStyle = {
    color: "#567a9e",
    weight: 1.5,
    opacity: 0.6,
    fillOpacity: 0.0,
  };

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedUnitForHistory, setSelectedUnitForHistory] = useState(null);

  const handleOpenHistoryModal = (unit) => {
    setSelectedUnitForHistory(unit);
    setIsHistoryModalOpen(true);
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

        {/* Рендеримо маркери на основі даних з контексту */}
        {units.map((unit) => {
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

          // Вибір SVG компонента та кольору (без змін)
          const UnitSpecificSvgComponent =
            unitTypeToSvgComponent[unit.unit_type] ||
            unitTypeToSvgComponent.DEFAULT;
          const iconColor = statusToColor[unit.status] || statusToColor.DEFAULT;

          // Рендеринг SVG в HTML рядок (без змін)
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

          // Створення L.DivIcon (без змін)
          const customUnitIcon = L.divIcon({
            html: iconHtml,
            className: "custom-unit-div-icon",
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
                <button
                  className="history-btn"
                  onClick={() => handleOpenHistoryModal(unit)}
                >
                  Історія
                </button>
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
      <DeviceHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        unit={selectedUnitForHistory}
      />
    </div>
  );
};


export default MapPage;
