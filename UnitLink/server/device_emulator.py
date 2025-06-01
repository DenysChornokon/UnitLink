import requests # Для надсилання HTTP-запитів
import json
import time
import random
import uuid # Може знадобитися, якщо ви генеруєте ID тут, але краще брати існуючі

# --- КОНФІГУРАЦІЯ ЕМУЛЯТОРА ---
BACKEND_URL = "http://localhost:5000/api/devices" # Базовий URL для API пристроїв

DEVICE_IDS_TO_SIMULATE = [
    "0e6a7646-8251-41e7-8c1c-000089de2a2e",
    "058c9eb3-3d6f-4260-ad32-c19c79e1e317",
    "55aed58a-63cf-4619-95f9-76b9047726e0",
    "2f6b9b48-9601-4421-8159-86c4ef753166",
    "c88f420e-7bfe-4bf9-8f09-0d2a4f632e4b",
]

UPDATE_INTERVAL_SECONDS = 15 # Як часто надсилати оновлення (в секундах)

POSSIBLE_STATUSES = ["ONLINE", "OFFLINE", "UNSTABLE"]
# ------------------------------

def generate_random_status_data():
    """Генерує випадкові дані стану для підрозділу."""
    status = random.choice(POSSIBLE_STATUSES)

    signal_rssi = None
    latency_ms = None
    packet_loss_percent = None

    if status == "ONLINE":
        signal_rssi = random.randint(-85, -40) # Сильний/середній сигнал
        latency_ms = random.randint(20, 150)    # Низька/середня затримка
        packet_loss_percent = round(random.uniform(0, 2.5), 2) # Невеликі втрати
    elif status == "UNSTABLE":
        signal_rssi = random.randint(-100, -70) # Слабкий сигнал
        latency_ms = random.randint(100, 500)   # Висока затримка
        packet_loss_percent = round(random.uniform(1, 10), 2) # Помітні втрати
    # Для OFFLINE параметри зв'язку не мають сенсу (залишаться None)

    # Іноді робимо деякі параметри None навіть для ONLINE/UNSTABLE для тестування
    if random.random() < 0.1: signal_rssi = None
    if random.random() < 0.1: latency_ms = None
    if random.random() < 0.1: packet_loss_percent = None

    return {
        "status": status,
        "signal_rssi": signal_rssi,
        "latency_ms": latency_ms,
        "packet_loss_percent": packet_loss_percent
    }

def send_status_update(device_id, data):
    """Надсилає оновлення статусу на бекенд."""
    url = f"{BACKEND_URL}/{device_id}/status"
    headers = {'Content-Type': 'application/json'}
    try:
        response = requests.post(url, headers=headers, data=json.dumps(data), timeout=10)
        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Device {device_id}: Sent {data}, Response: {response.status_code} {response.text[:200]}")
        # Обмеження довжини тексту відповіді для читабельності
    except requests.exceptions.RequestException as e:
        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Device {device_id}: Error sending update: {e}")

if __name__ == "__main__":
    if not DEVICE_IDS_TO_SIMULATE or "your_first_device_uuid_here" in DEVICE_IDS_TO_SIMULATE:
        print("ПОПЕРЕДЖЕННЯ: Будь ласка, відредагуйте DEVICE_IDS_TO_SIMULATE у скрипті, "
              "вказавши реальні UUID підрозділів з вашої бази даних.")
        exit()

    print("Starting device emulator...")
    print(f"Simulating {len(DEVICE_IDS_TO_SIMULATE)} devices.")
    print(f"Update interval: {UPDATE_INTERVAL_SECONDS} seconds.")
    print("Press Ctrl+C to stop.")

    while True:
        for device_id in DEVICE_IDS_TO_SIMULATE:
            status_data = generate_random_status_data()
            send_status_update(device_id, status_data)
            time.sleep(random.uniform(0.5, 2.0)) # Невеликий розсинхрон між запитами

        print(f"--- Waiting {UPDATE_INTERVAL_SECONDS} seconds for next batch ---")
        time.sleep(UPDATE_INTERVAL_SECONDS)