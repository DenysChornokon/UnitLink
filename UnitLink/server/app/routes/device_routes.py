# server/app/routes/device_routes.py
import datetime
from app.models import Device, UnitType, DeviceStatus, User, DeviceStatusHistory, ConnectionLog, LogEventType
from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
import uuid # Потрібно для конвертації UUID

from app import db, socketio
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
# @jwt_required() # Поки що залишаємо без JWT для емуляторів/пристроїв
# TODO: Реалізувати безпечний механізм автентифікації для цього ендпоінта (напр., API ключі)
def update_device_status(device_id):
    """Оновлює статус зв'язку, параметри пристрою та надсилає сповіщення через WebSocket."""
    device = Device.query.get_or_404(device_id)
    data = request.get_json()

    if not data:
        current_app.logger.warning(f"Update status for device {device_id} failed: No JSON data received.")
        return jsonify(message="Request must be JSON"), 400

    current_time = datetime.datetime.now(datetime.timezone.utc)
    updated_fields = [] # Список оновлених полів для логування

    # Оновлюємо статус зв'язку
    new_status_str = data.get('status')
    if new_status_str:
        try:
            new_status_enum = DeviceStatus[new_status_str.upper()]
            # Зберігаємо старий статус перед зміною
            old_status = device.status
            if old_status != new_status_enum:
                device.status = new_status_enum
                updated_fields.append(f"status changed from {old_status.name} to {new_status_enum.name}")

                # --- ЛОГІКА ЗАПИСУ В ConnectionLog ---
                log_message = ""
                log_event_type = None

                # Подія: втрата зв'язку (був онлайн -> став офлайн)
                if old_status == DeviceStatus.ONLINE and new_status_enum == DeviceStatus.OFFLINE:
                    log_event_type = LogEventType.DISCONNECTED
                    log_message = f"Device '{device.name}' lost connection."

                # Подія: відновлення зв'язку (був офлайн -> став онлайн)
                elif old_status == DeviceStatus.OFFLINE and new_status_enum == DeviceStatus.ONLINE:
                    log_event_type = LogEventType.CONNECTED
                    log_message = f"Device '{device.name}' connection restored."

                # Подія: загальна зміна статусу (напр., на UNSTABLE)
                elif old_status != new_status_enum:
                    log_event_type = LogEventType.STATUS_CHANGE
                    log_message = f"Device '{device.name}' status changed to {new_status_enum.name}."

                if log_event_type:
                    log_entry = ConnectionLog(
                        device_id=device.id,
                        event_type=log_event_type,
                        message=log_message,
                        details={  # Зберігаємо трохи контексту
                            'from_status': old_status.name,
                            'to_status': new_status_enum.name
                        }
                    )
                    db.session.add(log_entry)
                # -----------------------------------

        except KeyError:
            current_app.logger.warning(
                f"Update status for device {device_id} failed: Invalid status value '{new_status_str}'.")
            return jsonify(
                message=f"Invalid status '{new_status_str}'. Valid are: {[s.name for s in DeviceStatus]}"), 400

    # Оновлюємо час останнього контакту
    device.last_seen = current_time
    updated_fields.append(f"last_seen to {current_time.isoformat()}")


    # Отримуємо та зберігаємо параметри в історію
    signal_rssi = data.get('signal_rssi')
    latency_ms = data.get('latency_ms')
    packet_loss_percent = data.get('packet_loss_percent')

    # Конвертуємо у відповідні типи, обробляючи None
    try:
        signal_rssi_val = int(signal_rssi) if signal_rssi is not None else None
        latency_ms_val = int(latency_ms) if latency_ms is not None else None
        packet_loss_percent_val = float(packet_loss_percent) if packet_loss_percent is not None else None
    except ValueError:
        current_app.logger.warning(f"Update status for device {device_id} failed: Invalid parameter format.")
        return jsonify(message="Invalid parameter format. RSSI and Latency must be integers, Packet Loss must be a number."), 400


    # Створюємо запис в історії, якщо хоча б один параметр передано
    if any(p is not None for p in [signal_rssi_val, latency_ms_val, packet_loss_percent_val]):
        history_entry = DeviceStatusHistory(
            device_id=device.id,
            timestamp=current_time,
            signal_rssi=signal_rssi_val,
            latency_ms=latency_ms_val,
            packet_loss_percent=packet_loss_percent_val
        )
        db.session.add(history_entry)
        updated_fields.append(f"history_entry (RSSI:{signal_rssi_val}, Latency:{latency_ms_val}, Loss:{packet_loss_percent_val})")

    try:
        db.session.commit()
        current_app.logger.info(f"Device {device_id} status updated: {', '.join(updated_fields)}.")

        # ---> НАДСИЛАЄМО ПОДІЮ WEBSOCKET <---
        # Перетворюємо оновлений об'єкт device на словник для передачі
        updated_device_data = device.to_dict()
        # Додаємо актуальні параметри, якщо вони щойно надійшли (в to_dict їх немає)
        # to_dict() повертає загальний стан пристрою, а не останній запис історії
        # Для фронтенду може бути корисно мати останні дані телеметрії разом з оновленням
        updated_device_data['latest_telemetry'] = {
            'signal_rssi': signal_rssi_val,
            'latency_ms': latency_ms_val,
            'packet_loss_percent': packet_loss_percent_val,
            'timestamp': current_time.isoformat()
        }

        # `room=None` означає, що повідомлення буде надіслано всім підключеним клієнтам
        # У майбутньому можна використовувати кімнати для більш таргетованих оновлень
        socketio.emit('unit_status_update', updated_device_data, room=None)
        current_app.logger.info(f"Emitted 'unit_status_update' for device {device_id}.")
        # --------------------------------------

        return jsonify(message="Device status updated successfully."), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error committing status update for device {device_id}: {e}")
        import traceback
        current_app.logger.error(traceback.format_exc())
        return jsonify(message="Internal server error updating status."), 500
