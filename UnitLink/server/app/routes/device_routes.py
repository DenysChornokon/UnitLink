# server/app/routes/device_routes.py
import datetime

from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
import uuid # Потрібно для конвертації UUID

from app import db
# Імпортуємо всі необхідні моделі та Enum'и
from app.models import Device, UnitType, DeviceStatus, User, DeviceStatusHistory
from app.decorators import admin_required # Імпортуємо декоратор адміна

# Створюємо Blueprint
device_bp = Blueprint('devices', __name__)

@device_bp.route('/', methods=['GET'])
@jwt_required() # Захищено для будь-якого авторизованого користувача
def get_all_devices():
    """Повертає список всіх підрозділів/пристроїв."""
    current_user_id = get_jwt_identity()
    current_app.logger.info(f"User {current_user_id} requesting device list.")
    try:
        devices = Device.query.order_by(Device.name).all()
        # Використовуємо to_dict() для перетворення об'єктів у словники
        return jsonify(devices=[device.to_dict() for device in devices]), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching devices: {e}")
        return jsonify(message="Error fetching device list."), 500

@device_bp.route('/<uuid:device_id>', methods=['GET'])
@jwt_required() # Захищено
def get_device_details(device_id):
    """Повертає деталі конкретного підрозділу."""
    current_user_id = get_jwt_identity()
    current_app.logger.info(f"User {current_user_id} requesting details for device {device_id}.")
    try:
        # Використовуємо get_or_404 для автоматичної відповіді 404, якщо ID не знайдено
        device = Device.query.get_or_404(device_id)
        return jsonify(device=device.to_dict()), 200
    except Exception as e:
        # Логуємо помилку, якщо вона не 404 (get_or_404 обробляє 404)
        current_app.logger.error(f"Error fetching device {device_id}: {e}")
        # Якщо це не 404, то це інша помилка сервера
        return jsonify(message="Error fetching device details."), 500

@device_bp.route('/', methods=['POST'])
@admin_required() # Тільки адмін може додавати
def add_device():
    """Додає новий підрозділ/пристрій."""
    admin_user_id = get_jwt_identity()
    current_app.logger.info(f"Admin {admin_user_id} attempting to add a device.")
    data = request.get_json()
    if not data:
        return jsonify(message="Request must be JSON"), 400

    # Отримуємо дані з запиту
    name = data.get('name')
    lat_str = data.get('latitude') # Отримуємо як рядок або число
    lon_str = data.get('longitude')
    unit_type_str = data.get('unit_type') # Очікуємо рядок, напр. 'COMMAND_POST' або 'command_post'
    description = data.get('description')

    # Валідація обов'язкових полів
    if not all([name, lat_str is not None, lon_str is not None, unit_type_str]):
        return jsonify(message="Missing required fields: name, latitude, longitude, unit_type"), 400

    # Конвертація координат та валідація типу
    try:
        lat = float(lat_str)
        lon = float(lon_str)
    except (ValueError, TypeError):
         return jsonify(message="Invalid latitude or longitude format. Must be numbers."), 400

    try:
        # Намагаємось знайти Enum за іменем (у верхньому регістрі)
        unit_type_enum = UnitType[unit_type_str.upper()]
    except KeyError:
         valid_types = [t.name for t in UnitType]
         return jsonify(message=f"Invalid unit_type '{unit_type_str}'. Valid types are: {valid_types}"), 400

    # Перевірка на унікальність імені (позивного)
    if Device.query.filter_by(name=name).first():
        return jsonify(message=f"Device with name '{name}' already exists."), 409 # Conflict

    # Створення нового об'єкта Device
    new_device = Device(
        name=name,
        description=description,
        location_lat=lat,
        location_lon=lon,
        unit_type=unit_type_enum,
        status=DeviceStatus.UNKNOWN, # Встановлюємо початковий статус зв'язку
        added_by_user_id=admin_user_id # Зберігаємо ID адміна, що додав
    )

    db.session.add(new_device)
    try:
        db.session.commit()
        current_app.logger.info(f"Admin {admin_user_id} successfully added device {new_device.id} ('{new_device.name}').")
        # Повертаємо створений об'єкт
        return jsonify(message="Device added successfully.", device=new_device.to_dict()), 201 # Created
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error adding device by admin {admin_user_id}: {e}")
        return jsonify(message="Internal server error. Failed to add device."), 500

@device_bp.route('/<uuid:device_id>', methods=['PUT'])
@admin_required() # Тільки адмін може редагувати
def update_device(device_id):
    """Оновлює існуючий підрозділ."""
    admin_user_id = get_jwt_identity()
    current_app.logger.info(f"Admin {admin_user_id} attempting to update device {device_id}.")

    device = Device.query.get_or_404(device_id)
    data = request.get_json()
    if not data:
        return jsonify(message="Request must be JSON"), 400

    updated = False # Прапорець, чи були зміни

    # Оновлюємо поля, якщо вони передані в запиті
    if 'name' in data:
        new_name = data['name']
        if new_name != device.name:
            # Перевірка унікальності нового імені
            if Device.query.filter(Device.id != device_id, Device.name == new_name).first():
                 return jsonify(message=f"Device name '{new_name}' is already taken."), 409
            device.name = new_name
            updated = True

    if 'description' in data:
        if device.description != data.get('description'):
             device.description = data.get('description')
             updated = True

    # Оновлення координат
    new_lat, new_lon = None, None
    if data.get('latitude') is not None:
        try:
            new_lat = float(data['latitude'])
            if device.location_lat != new_lat:
                 device.location_lat = new_lat
                 updated = True
        except (ValueError, TypeError):
             return jsonify(message="Invalid latitude format."), 400
    if data.get('longitude') is not None:
         try:
            new_lon = float(data['longitude'])
            if device.location_lon != new_lon:
                device.location_lon = new_lon
                updated = True
         except (ValueError, TypeError):
             return jsonify(message="Invalid longitude format."), 400

    # Оновлення типу підрозділу
    if 'unit_type' in data:
        unit_type_str = data['unit_type']
        try:
            new_unit_type_enum = UnitType[unit_type_str.upper()]
            if device.unit_type != new_unit_type_enum:
                 device.unit_type = new_unit_type_enum
                 updated = True
        except KeyError:
            valid_types = [t.name for t in UnitType]
            return jsonify(message=f"Invalid unit_type '{unit_type_str}'. Valid types are: {valid_types}"), 400

    # Якщо були зміни, зберігаємо і повертаємо оновлений об'єкт
    if updated:
        try:
            db.session.commit()
            current_app.logger.info(f"Admin {admin_user_id} successfully updated device {device_id}.")
            return jsonify(message="Device updated successfully.", device=device.to_dict()), 200
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error updating device {device_id} by admin {admin_user_id}: {e}")
            return jsonify(message="Internal server error. Failed to update device."), 500
    else:
        # Якщо змін не було передано або вони не відрізняються
        return jsonify(message="No changes detected or provided.", device=device.to_dict()), 200


@device_bp.route('/<uuid:device_id>', methods=['DELETE'])
@admin_required() # Тільки адмін може видаляти
def delete_device(device_id):
    """Видаляє підрозділ."""
    admin_user_id = get_jwt_identity()
    current_app.logger.info(f"Admin {admin_user_id} attempting to delete device {device_id}.")

    device = Device.query.get_or_404(device_id)
    try:
        db.session.delete(device)
        db.session.commit()
        current_app.logger.info(f"Admin {admin_user_id} successfully deleted device {device_id} ('{device.name}').")
        # Повертаємо 204 No Content або 200 OK з повідомленням
        # return '', 204
        return jsonify(message="Device deleted successfully."), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting device {device_id} by admin {admin_user_id}: {e}")
        return jsonify(message="Internal server error. Failed to delete device."), 500

# --- Ендпоінт для Оновлення Статусу Зв'язку (Приклад) ---
# Цей ендпоінт може бути викликаний емуляторами або реальними пристроями
# Метод автентифікації тут може бути іншим (API ключ, токен пристрою)
# Або його можна викликати з фронтенду (напр., примусовий пінг) - тоді @jwt_required()

@device_bp.route('/<uuid:device_id>/status', methods=['POST'])
# @jwt_required() # Можливо, не потрібен, якщо викликається пристроєм
# Або потрібна інша автентифікація (напр., перевірка API ключа в заголовку)
def update_device_status(device_id):
    """Оновлює статус зв'язку та параметри пристрою."""
    # TODO: Реалізувати автентифікацію/авторизацію для цього ендпоінта, якщо потрібно
    device = Device.query.get_or_404(device_id)
    data = request.get_json()
    if not data:
        return jsonify(message="Request must be JSON"), 400

    current_time = datetime.datetime.now(datetime.timezone.utc) # Поточний час UTC

    # Оновлюємо статус зв'язку
    new_status_str = data.get('status') # 'ONLINE', 'OFFLINE', 'UNSTABLE'
    if new_status_str:
        try:
            new_status_enum = DeviceStatus[new_status_str.upper()]
            if device.status != new_status_enum:
                 device.status = new_status_enum
                 # TODO: Записати зміну статусу в ConnectionLog
        except KeyError:
            return jsonify(message=f"Invalid status '{new_status_str}'."), 400

    # Оновлюємо час останнього контакту
    device.last_seen = current_time

    # Отримуємо та зберігаємо параметри в історію
    signal = data.get('signal_rssi')
    latency = data.get('latency_ms')
    packet_loss = data.get('packet_loss_percent')

    # Створюємо запис в історії (навіть якщо параметри NULL)
    # Можна додати логіку, щоб не писати, якщо всі параметри NULL
    if any(p is not None for p in [signal, latency, packet_loss]):
        history_entry = DeviceStatusHistory(
            device_id=device.id,
            timestamp=current_time,
            signal_rssi=int(signal) if signal is not None else None,
            latency_ms=int(latency) if latency is not None else None,
            packet_loss_percent=float(packet_loss) if packet_loss is not None else None
        )
        db.session.add(history_entry)

    try:
        db.session.commit()
        return jsonify(message="Device status updated successfully."), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating status for device {device_id}: {e}")
        return jsonify(message="Internal server error updating status."), 500