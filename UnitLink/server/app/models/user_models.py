import enum
import datetime
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID # Можна використовувати UUID для ID
import uuid
import bcrypt
from app import db # Імпортуємо db з головного __init__.py додатку

class UserRole(enum.Enum):
    ADMIN = 'admin'
    OPERATOR = 'operator'
    # Можна додати інші ролі, наприклад, 'Viewer'

class User(db.Model):
    __tablename__ = 'users' # Явно вказуємо ім'я таблиці

    # Використання UUID як первинного ключа - краще для розподілених систем
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(128), nullable=False) # Збільшена довжина для хешу bcrypt
    role = db.Column(db.Enum(UserRole), nullable=False, default=UserRole.OPERATOR)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    last_login_at = db.Column(db.DateTime(timezone=True), nullable=True)

    # Зв'язки (приклади, додамо конкретні при необхідності)
    # devices_added = db.relationship('Device', backref='adder', lazy=True, foreign_keys='Device.added_by_user_id')
    # alerts_acknowledged = db.relationship('Alert', backref='acknowledger', lazy=True, foreign_keys='Alert.acknowledged_by_user_id')
    # registration_requests_reviewed = db.relationship('RegistrationRequest', backref='reviewer', lazy=True, foreign_keys='RegistrationRequest.reviewed_by_user_id')

    def set_password(self, password):
        """Хешує пароль за допомогою bcrypt."""
        # Важливо декодувати пароль і хеш для зберігання як рядки
        pwhash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        self.password_hash = pwhash.decode('utf-8')

    def check_password(self, password):
        """Перевіряє наданий пароль проти збереженого хешу."""
        if self.password_hash is None:
            return False
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))

    def __repr__(self):
        return f'<User {self.username} ({self.role.name})>'

class RegistrationRequestStatus(enum.Enum):
    PENDING = 'pending'
    APPROVED = 'approved'
    REJECTED = 'rejected'

class RegistrationRequest(db.Model):
    __tablename__ = 'registration_requests'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    requested_username = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), nullable=False, index=True) # Додамо індекс для email
    full_name = db.Column(db.String(150), nullable=False) # <--- Нове поле: ПІБ
    rank = db.Column(db.String(100), nullable=True)      # <--- Нове поле: Звання (опціонально)
    reason = db.Column(db.Text, nullable=True)
    status = db.Column(db.Enum(RegistrationRequestStatus), nullable=False, default=RegistrationRequestStatus.PENDING, index=True) # Індекс для статусу
    requested_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    reviewed_by_user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=True)
    reviewed_at = db.Column(db.DateTime(timezone=True), nullable=True)

    reviewer = db.relationship('User', backref=db.backref('registration_requests_reviewed', lazy=True), foreign_keys=[reviewed_by_user_id])

    def __repr__(self):
        # Оновимо repr для наочності
        return f'<RegistrationRequest {self.email} - {self.full_name} ({self.status.name})>'