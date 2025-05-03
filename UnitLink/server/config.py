import datetime
import os
from dotenv import load_dotenv

# Визначаємо базову директорію проекту (папка 'server')
basedir = os.path.abspath(os.path.dirname(__file__))
# Завантажуємо змінні середовища з .env файлу
load_dotenv(os.path.join(basedir, '.env'))


class Config:
    """Базовий клас конфігурації."""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'you-should-really-change-this'
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or SECRET_KEY
    JWT_ACCESS_TOKEN_EXPIRES = datetime.timedelta(seconds=30)
    JWT_REFRESH_TOKEN_EXPIRES = datetime.timedelta(days=30)
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    # За замовчуванням використовуємо SQLite, якщо DATABASE_URL не встановлено
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(basedir, 'app.db') # Використовуємо app.db в папці server
    # Налаштування CORS (Cross-Origin Resource Sharing)
    # Дозволяємо запити з React dev server (за замовчуванням порт 3000)
    # У продакшені вкажіть реальний домен фронтенду
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS') or "http://localhost:3000"
    FRONTEND_URL = 'http://localhost:3000'

    # Конфігурація Flask-Mail
    MAIL_SERVER = os.environ.get('MAIL_SERVER')  # Напр., smtp.googlemail.com
    MAIL_PORT = int(os.environ.get('MAIL_PORT') or 587)  # 587 для TLS, 465 для SSL
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'true').lower() in ['true', 'on', '1']
    MAIL_USE_SSL = os.environ.get('MAIL_USE_SSL', 'false').lower() in ['true', 'on', '1']
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')  # Ваша пошта для відправки
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')  # Пароль додатка або основний пароль
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER') or MAIL_USERNAME


class DevelopmentConfig(Config):
    """Конфігурація для розробки."""
    DEBUG = True
    # Можна перевизначити DATABASE_URL для розробки, якщо потрібно
    # SQLALCHEMY_DATABASE_URI = os.environ.get('DEV_DATABASE_URL') or Config.SQLALCHEMY_DATABASE_URI

class ProductionConfig(Config):
    """Конфігурація для продакшену."""
    DEBUG = False
    # Переконайтесь, що DATABASE_URL встановлено в середовищі продакшену
    # SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') # Обов'язково для продакшену!
    if not Config.SQLALCHEMY_DATABASE_URI or 'sqlite' in Config.SQLALCHEMY_DATABASE_URI:
         print("WARNING: Production environment is using default or SQLite database!")
    # Важливо встановити конкретні CORS_ORIGINS для продакшену
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS') # Обов'язково для продакшену!


# Словник для доступу до конфігурацій за іменем
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}