import os
from app import create_app, socketio, db
from app.models import (  # Імпортуємо всі моделі
    User, UserRole, RegistrationRequest, RegistrationRequestStatus,
    Device, DeviceStatus, DeviceStatusHistory,
    ConnectionLog, LogEventType, Alert, AlertSeverity
)

config_name = os.getenv('FLASK_ENV', 'default')
app = create_app(config_name)


@app.shell_context_processor
def make_shell_context():
    # Додаємо моделі до контексту flask shell
    return {
        'db': db,
        'User': User, 'UserRole': UserRole,
        'RegistrationRequest': RegistrationRequest, 'RegistrationRequestStatus': RegistrationRequestStatus,
        'Device': Device, 'DeviceStatus': DeviceStatus, 'DeviceStatusHistory': DeviceStatusHistory,
        'ConnectionLog': ConnectionLog, 'LogEventType': LogEventType,
        'Alert': Alert, 'AlertSeverity': AlertSeverity
    }


if __name__ == '__main__':
    print(f"--- Starting UnitLink Server in {config_name} mode ---")
    socketio.run(app, host='0.0.0.0', port=5000, debug=app.debug,
                 use_reloader=app.debug, allow_unsafe_werkzeug=True if app.debug else False)
