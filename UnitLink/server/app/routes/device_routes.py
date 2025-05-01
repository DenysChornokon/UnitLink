from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity # Імпортуємо jwt_required та get_jwt_identity
# from app import socketio # Можна імпортувати для надсилання повідомлень
from app.models import Device # Імпортуємо модель Device

device_bp = Blueprint('devices', __name__)

@device_bp.route('/', methods=['GET'])
@jwt_required() # <--- ДОДАНО: Цей декоратор вимагає дійсний access_token
def get_devices_status():
    # Отримуємо ID користувача з токена (збереженого як рядок UUID)
    current_user_id = get_jwt_identity()
    print(f"User {current_user_id} requested device status.") # Логування для перевірки

    # TODO: Отримати реальний список пристроїв та їх статус з БД
    # Можливо, фільтрувати пристрої за правами доступу користувача (якщо потрібно)
    devices_from_db = Device.query.order_by(Device.name).all() # Приклад запиту

    # Форматуємо дані для фронтенду
    output_devices = [
        {
            "id": str(device.id), # Конвертуємо UUID в рядок
            "name": device.name,
            "description": device.description,
            "status": device.status.name, # Використовуємо .name для рядкового представлення Enum
            "signal": -75 if device.status == DeviceStatus.ONLINE else None, # Приклад фейкових даних
            "last_ping": device.last_seen.isoformat() if device.last_seen else None # Використовуємо ISO формат
        } for device in devices_from_db
    ]

    # Приклад відповіді з реальними даними (якщо вони є)
    # dummy_devices = [
    #     {"id": "1", "name": "Node Alpha", "status": "online", "signal": -75, "last_ping": "2025-05-01T14:30:00Z"},
    #     {"id": "2", "name": "Node Beta", "status": "offline", "signal": None, "last_ping": "2025-05-01T14:00:00Z"}
    # ]
    # return jsonify(devices=dummy_devices), 200
    return jsonify(devices=output_devices), 200

# Тут будуть маршрути для отримання історії, логів, можливо, для надсилання команд
# Всі вони, скоріш за все, також потребуватимуть @jwt_required()