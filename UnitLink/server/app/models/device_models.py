import enum
import datetime
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID, JSONB  # JSONB краще для індексації JSON в Postgres
import uuid
from app import db


# from .user_models import User # Імпортуємо User для зв'язків


class DeviceStatus(enum.Enum):
    ONLINE = 'online'
    OFFLINE = 'offline'
    UNSTABLE = 'unstable'
    UNKNOWN = 'unknown'  # Початковий або невизначений статус


class UnitType(enum.Enum):
    COMMAND_POST = 'command_post'           # КП (Командний Пункт)
    OBSERVATION_POST = 'observation_post'   # СП (Спостережний Пункт)
    COMMUNICATION_HUB = 'communication_hub' # ВЗ (Вузол Зв'язку)
    FIELD_UNIT = 'field_unit'               # Польовий підрозділ (загальний)
    LOGISTICS = 'logistics'                 # Логістика/Склад
    CHECKPOINT = 'checkpoint'               # Блокпост/Контрольна точка
    MEDICAL = 'medical'                     # Медичний пункт
    TECHNICAL = 'technical'                 # Технічний пункт/Ремонт
    OTHER = 'other'                         # Інше


class Device(db.Model):
    __tablename__ = 'devices'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(100), unique=True, nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    # Зберігаємо координати як числа з плаваючою комою
    # З міркувань безпеки реальні координати можуть не зберігатися або шифруватися
    location_lat = db.Column(db.Float, nullable=True)
    location_lon = db.Column(db.Float, nullable=True)
    status = db.Column(db.Enum(DeviceStatus), nullable=False, default=DeviceStatus.UNKNOWN)
    last_seen = db.Column(db.DateTime(timezone=True), nullable=True)  # Коли останній раз надходили дані
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())

    unit_type = db.Column(db.Enum(UnitType), nullable=False, default=UnitType.OTHER, index=True)


    # Зв'язок з користувачем, який додав пристрій (якщо потрібно)
    added_by_user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=True)
    adder = db.relationship('User', backref=db.backref('devices_added', lazy=True), foreign_keys=[added_by_user_id])

    # Зв'язок з історією статусів та логами
    status_history = db.relationship('DeviceStatusHistory', backref='device', lazy='dynamic',
                                     cascade="all, delete-orphan")
    connection_logs = db.relationship('ConnectionLog', backref='device', lazy='dynamic', cascade="all, delete-orphan")
    alerts = db.relationship('Alert', backref='device', lazy='dynamic', cascade="all, delete-orphan")

    def __repr__(self):
        return f'<Device {self.name} ({self.unit_type.name})>'

    def to_dict(self):
        return {
            'id': str(self.id),
            'name': self.name,
            'description': self.description,
            'position': [self.location_lat, self.location_lon],  # Повертаємо як масив [lat, lon]
            'status': self.status.name,  # Статус зв'язку
            'unit_type': self.unit_type.name,  # Тип підрозділу
            'last_seen': self.last_seen.isoformat() if self.last_seen else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'added_by_user_id': str(self.added_by_user_id) if self.added_by_user_id else None
        }


# Модель для зберігання часових рядів параметрів зв'язку
# Для великих об'ємів даних розгляньте TimescaleDB розширення для PostgreSQL
class DeviceStatusHistory(db.Model):
    __tablename__ = 'device_status_history'

    id = db.Column(db.BigInteger, primary_key=True)  # Використовуємо BigInteger для потенційно великих таблиць
    device_id = db.Column(UUID(as_uuid=True), db.ForeignKey('devices.id', ondelete='CASCADE'), nullable=False,
                          index=True)
    timestamp = db.Column(db.DateTime(timezone=True), default=func.now(), nullable=False, index=True)
    signal_rssi = db.Column(db.Integer, nullable=True)  # Рівень сигналу
    latency_ms = db.Column(db.Integer, nullable=True)  # Затримка
    packet_loss_percent = db.Column(db.Float, nullable=True)  # Відсоток втрати пакетів

    # Можна додати інші параметри: bandwith, noise_level тощо.
    # Можна використовувати JSONB для зберігання довільних параметрів:
    # parameters = db.Column(JSONB, nullable=True)

    def __repr__(self):
        return f'<StatusHistory Device {self.device_id} @ {self.timestamp}>'
