import enum
import datetime
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from app import db
# from .user_models import User
# from .device_models import Device

class LogEventType(enum.Enum):
    CONNECTED = 'connected'
    DISCONNECTED = 'disconnected'
    STATUS_CHANGE = 'status_change' # Зміна online/offline/unstable
    PARAMETER_THRESHOLD = 'parameter_threshold' # Перевищення порогу параметрів
    CONFIG_UPDATE = 'config_update' # Зміна конфігурації пристрою
    USER_ACTION = 'user_action' # Дія користувача (логін, зміна налаштувань)

class ConnectionLog(db.Model):
    """Логування значущих подій системи та пристроїв."""
    __tablename__ = 'connection_logs'

    id = db.Column(db.BigInteger, primary_key=True)
    timestamp = db.Column(db.DateTime(timezone=True), server_default=func.now(), index=True)
    event_type = db.Column(db.Enum(LogEventType), nullable=False)
    message = db.Column(db.Text, nullable=False) # Детальний опис події

    # Опціональні зв'язки
    # З пристроєм, до якого відноситься подія
    device_id = db.Column(UUID(as_uuid=True), db.ForeignKey('devices.id', ondelete='SET NULL'), nullable=True, index=True)
    # З користувачем, якщо подія ініційована користувачем
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    # Додаткові деталі у форматі JSON
    details = db.Column(JSONB, nullable=True)

    # Зв'язок з пристроєм для отримання імені
    # device = db.relationship('Device', backref=db.backref('connection_logs', lazy='dynamic'))

    def to_dict(self):
        """Перетворює об'єкт логу в словник для JSON-серіалізації."""
        return {
            'id': self.id,
            'timestamp': self.timestamp.isoformat(),
            'event_type': self.event_type.name,  # 'CONNECTED', 'DISCONNECTED', etc.
            'message': self.message,
            'details': self.details,
            'device_id': str(self.device_id) if self.device_id else None,
            # Додаємо ім'я пристрою, якщо він існує
            'device_name': self.device.name if self.device else "N/A",
            'user_id': str(self.user_id) if self.user_id else None,
            'user_name': self.user.username if self.user else None
        }

    # Відносини (не обов'язково завантажувати при кожному запиті логу)
    # device = db.relationship('Device', backref=db.backref('connection_logs', lazy='dynamic')) # Перенесено в Device
    user = db.relationship('User', backref=db.backref('connection_logs', lazy='dynamic'))

    def __repr__(self):
        return f'<Log {self.timestamp} [{self.event_type.name}]>'

class AlertSeverity(enum.Enum):
    INFO = 'info'
    WARNING = 'warning'
    CRITICAL = 'critical'

class Alert(db.Model):
    """Сповіщення про критичні події."""
    __tablename__ = 'alerts'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    timestamp = db.Column(db.DateTime(timezone=True), server_default=func.now(), index=True)
    severity = db.Column(db.Enum(AlertSeverity), nullable=False, default=AlertSeverity.WARNING)
    message = db.Column(db.Text, nullable=False)
    is_acknowledged = db.Column(db.Boolean, default=False, nullable=False, index=True)
    acknowledged_at = db.Column(db.DateTime(timezone=True), nullable=True)

    # Зв'язки
    device_id = db.Column(UUID(as_uuid=True), db.ForeignKey('devices.id', ondelete='CASCADE'), nullable=True, index=True) # Може бути NULL для системних алертів
    acknowledged_by_user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=True)

    # device = db.relationship('Device', backref=db.backref('alerts', lazy=True)) # Перенесено в Device
    acknowledger = db.relationship('User', backref=db.backref('alerts_acknowledged', lazy=True), foreign_keys=[acknowledged_by_user_id])

    def __repr__(self):
         return f'<Alert [{self.severity.name}] {self.message[:50]}>'