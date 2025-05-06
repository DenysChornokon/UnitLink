# server/run.py
import os
import click
import random
import uuid
import datetime # Потрібен для DeviceStatusHistory
from app import create_app, socketio, db # Імпортуємо все необхідне з app

# Імпортуємо всі моделі та Enum'и, що використовуються в seed та context
from app.models import (
    User, UserRole, RegistrationRequest, RegistrationRequestStatus,
    Device, UnitType, DeviceStatus, DeviceStatusHistory,
    ConnectionLog, LogEventType, Alert, AlertSeverity
)

# Визначаємо конфігурацію
config_name = os.getenv('FLASK_ENV', 'default')
# Створюємо екземпляр додатку
app = create_app(config_name)

# Контекст для 'flask shell'
@app.shell_context_processor
def make_shell_context():
    """Додає змінні до контексту flask shell."""
    # Повертаємо словник з усіма моделями та db
    return {
        'db': db,
        'User': User, 'UserRole': UserRole,
        'RegistrationRequest': RegistrationRequest, 'RegistrationRequestStatus': RegistrationRequestStatus,
        'Device': Device, 'UnitType': UnitType, 'DeviceStatus': DeviceStatus,
        'DeviceStatusHistory': DeviceStatusHistory,
        'ConnectionLog': ConnectionLog, 'LogEventType': LogEventType,
        'Alert': Alert, 'AlertSeverity': AlertSeverity
    }

# Команда для заповнення бази даних тестовими даними
@app.cli.command("seed")
def seed():
    """Заповнює базу даних тестовими підрозділами."""
    print("Seeding database with test devices...")
    try:
        # Знаходимо першого адміна для прив'язки added_by_user_id
        admin = User.query.filter_by(role=UserRole.ADMIN).first()
        if not admin:
            # Якщо адміна немає, можна створити його тут або просто не прив'язувати
            print("WARNING: Admin user not found. Devices will be added without an 'adder'.")
            admin_id = None
        else:
            admin_id = admin.id
            print(f"Found admin user: {admin.username} ({admin.id})")

        # Створення тестових підрозділів
        units_data = [
            # --- Центр / Київщина (Приклади) ---
            {'name': 'КП "Столиця"', 'type': UnitType.COMMAND_POST, 'lat': 50.45, 'lon': 30.52,
             'desc': 'Основний КП, м. Київ'},
            {'name': 'ВЗ "Либідь"', 'type': UnitType.COMMUNICATION_HUB, 'lat': 50.43, 'lon': 30.51,
             'desc': 'Вузол зв\'язку #1, Київ'},
            {'name': 'Резерв "Щит"', 'type': UnitType.FIELD_UNIT, 'lat': 50.35, 'lon': 30.75,
             'desc': 'Підрозділ резерву'},
            {'name': 'Склад "Каштан"', 'type': UnitType.LOGISTICS, 'lat': 50.6, 'lon': 30.3,
             'desc': 'Логістичний склад'},
            {'name': 'ТехБаза "Дніпро"', 'type': UnitType.TECHNICAL, 'lat': 50.28, 'lon': 30.95,
             'desc': 'Обслуговування техніки'},
            {'name': 'КП "Фаворит" (БЦ)', 'type': UnitType.COMMAND_POST, 'lat': 49.80, 'lon': 30.11,
             'desc': 'КП, Біла Церква'},
            {'name': 'СП "Сокіл" (БЦ)', 'type': UnitType.OBSERVATION_POST, 'lat': 49.75, 'lon': 30.05,
             'desc': 'Спостереження, район БЦ'},
            {'name': 'ВЗ "Рось" (БЦ)', 'type': UnitType.COMMUNICATION_HUB, 'lat': 49.78, 'lon': 30.15,
             'desc': 'Вузол зв\'язку, БЦ'},

            # --- Схід (Узагальнені приклади) ---
            {'name': 'КП "Слобода"', 'type': UnitType.COMMAND_POST, 'lat': 49.99, 'lon': 36.23,
             'desc': 'КП, р-н Харкова'},
            {'name': 'Група "Схід-1"', 'type': UnitType.FIELD_UNIT, 'lat': 49.80, 'lon': 37.50,
             'desc': 'Польовий підрозділ (Сх)'},
            {'name': 'СП "Зірниця"', 'type': UnitType.OBSERVATION_POST, 'lat': 48.8, 'lon': 37.8,
             'desc': 'Спостереження (Сх)'},
            {'name': 'ВЗ "Мережа-С"', 'type': UnitType.COMMUNICATION_HUB, 'lat': 49.5, 'lon': 36.8,
             'desc': 'Вузол зв\'язку (Сх)'},
            {'name': 'Логістика "Схід"', 'type': UnitType.LOGISTICS, 'lat': 49.2, 'lon': 37.2,
             'desc': 'Пункт забезпечення (Сх)'},
            {'name': 'Медпункт "Польовий-С"', 'type': UnitType.MEDICAL, 'lat': 49.0, 'lon': 36.5,
             'desc': 'Медична допомога (Сх)'},

            # --- Південний Схід / Південь (Узагальнені приклади) ---
            {'name': 'КП "Степ"', 'type': UnitType.COMMAND_POST, 'lat': 47.83, 'lon': 35.14,
             'desc': 'КП, р-н Запоріжжя'},
            {'name': 'ВЗ "Хортиця"', 'type': UnitType.COMMUNICATION_HUB, 'lat': 47.80, 'lon': 35.05,
             'desc': 'Вузол зв\'язку (Пд-Сх)'},
            {'name': 'Група "Південь-3"', 'type': UnitType.FIELD_UNIT, 'lat': 47.5, 'lon': 36.0,
             'desc': 'Польовий підрозділ (Пд-Сх)'},
            {'name': 'СП "Стежка"', 'type': UnitType.OBSERVATION_POST, 'lat': 46.9, 'lon': 35.5,
             'desc': 'Спостереження (Пд-Сх)'},
            {'name': 'База "Чайка"', 'type': UnitType.LOGISTICS, 'lat': 46.6, 'lon': 32.6,
             'desc': 'Пункт забезпечення, р-н Херсону'},
            {'name': 'КП "Порт"', 'type': UnitType.COMMAND_POST, 'lat': 46.48, 'lon': 30.72, 'desc': 'КП, р-н Одеси'},
            {'name': 'ПП "Варта"', 'type': UnitType.CHECKPOINT, 'lat': 47.1, 'lon': 33.5,
             'desc': 'Контрольний пункт (Пд)'},

            # --- Захід (Приклади) ---
            {'name': 'КП "Галичина"', 'type': UnitType.COMMAND_POST, 'lat': 49.84, 'lon': 24.03,
             'desc': 'КП, м. Львів'},
            {'name': 'Навч. Центр "Захід"', 'type': UnitType.OTHER, 'lat': 50.0, 'lon': 24.5,
             'desc': 'Навчальний центр'},
            {'name': 'Склад "Карпати"', 'type': UnitType.LOGISTICS, 'lat': 49.5, 'lon': 23.5, 'desc': 'Тиловий склад'},
            {'name': 'ВЗ "Сигнал-З"', 'type': UnitType.COMMUNICATION_HUB, 'lat': 49.9, 'lon': 25.0,
             'desc': 'Вузол зв\'язку (Зх)'},
        ]

        count_added = 0
        count_skipped = 0
        for data in units_data:
             # Перевіряємо, чи існує пристрій з таким іменем
             if not Device.query.filter_by(name=data['name']).first():
                 # Вибираємо випадковий статус зв'язку для різноманіття
                 random_status = random.choice([DeviceStatus.ONLINE, DeviceStatus.OFFLINE, DeviceStatus.UNSTABLE, DeviceStatus.UNKNOWN])
                 device = Device(
                     name=data['name'],
                     description=data.get('desc'),
                     location_lat=data['lat'],
                     location_lon=data['lon'],
                     unit_type=data['type'],
                     status=random_status,
                     # Встановлюємо last_seen, якщо статус не UNKNOWN/OFFLINE
                     last_seen=datetime.datetime.now(datetime.timezone.utc) if random_status in [DeviceStatus.ONLINE, DeviceStatus.UNSTABLE] else None,
                     added_by_user_id=admin_id # Використовуємо ID адміна або None
                 )
                 db.session.add(device)
                 count_added += 1
             else:
                  count_skipped +=1
                  print(f"Skipping device '{data['name']}' as it already exists.")

        # Зберігаємо всі додані пристрої
        db.session.commit()
        print("-" * 30)
        print(f"Seeding complete.")
        print(f"Added {count_added} new devices.")
        print(f"Skipped {count_skipped} existing devices.")
        print("-" * 30)
    except Exception as e:
        db.session.rollback() # Відкат у разі помилки
        print(f"An error occurred during seeding: {e}")
        import traceback
        traceback.print_exc()
# -----------------------------

# Точка входу для запуску додатку
if __name__ == '__main__':
    print(f"--- Starting UnitLink Server in {config_name} mode ---")
    # Використовуємо socketio.run для підтримки WebSocket
    socketio.run(app, host='0.0.0.0', port=5000, debug=app.debug,
                 use_reloader=app.debug, allow_unsafe_werkzeug=True if app.debug else False)