from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_socketio import SocketIO
from flask_jwt_extended import JWTManager
from flask_cors import CORS # Імпортуємо CORS
from flask_mail import Mail
from config import config # Імпортуємо словник конфігурацій

# Ініціалізуємо розширення без прив'язки до додатку
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
cors = CORS() # Ініціалізуємо CORS
# Налаштовуємо асинхронний режим для SocketIO, якщо планується інтенсивна робота
# 'threading', 'eventlet', 'gevent', 'gevent_uwsgi'
# Для початку 'threading' достатньо
socketio = SocketIO(async_mode='threading')
mail = Mail()


def create_app(config_name='default'):
    app = Flask(__name__)
    app_config = config[config_name]
    app.config.from_object(app_config)

    app.url_map.strict_slashes = False

    db.init_app(app)
    migrate.init_app(app, db) # Переконайтесь, що migrate тут ініціалізовано
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app_config.CORS_ORIGINS}})
    socketio.init_app(app, cors_allowed_origins=app_config.CORS_ORIGINS.split(',') if app_config.CORS_ORIGINS else '*')
    mail.init_app(app)


    # --- Імпорт моделей ---
    # Це важливо зробити тут, щоб моделі були зареєстровані в SQLAlchemy та Flask-Migrate
    from . import models

    # --- Реєстрація блюпринтів ---
    from .routes.auth_routes import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    from .routes.device_routes import device_bp
    app.register_blueprint(device_bp, url_prefix='/api/devices')
    from .routes.admin_routes import admin_bp
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    from .routes.log_routes import log_bp
    app.register_blueprint(log_bp, url_prefix='/api/logs')
    from .routes.alert_routes import alert_bp
    app.register_blueprint(alert_bp, url_prefix='/api/alerts')

    # --- Імпорт обробників SocketIO ---
    from . import socket_handlers

    @app.route('/ping')
    def ping():
        return 'Pong!'

    return app