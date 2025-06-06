import requests
import json
import time
import random
import uuid

# --- КОНФІГУРАЦІЯ ЕМУЛЯТОРА ---
BACKEND_URL = "http://localhost:5000/api/devices"
EMULATOR_API_KEY = '}Tg4[n~a@7G7g"1w,W_!1^)h_c9>a1'

DEVICE_IDS_TO_SIMULATE = [
    "2934aa60-9e0c-498b-b6ab-9a3aced153b3",
    "e581b1bb-b017-449b-976b-cc95d7e8ea6e",
    "f514c5ac-75f8-4b01-89b0-5f83f23cc9db",
    "8e3a6ed9-ae7a-4266-82e2-9fafa453ba3a",
    "3b60e7be-934d-444a-bd7e-693f4a0f5f58",
    "ab4474c5-c68f-41c4-aecc-390639929975",
    "68b0a27a-b865-4fb1-aea0-276e7b547a65",
    "9fd1d24f-793e-44a4-b7c7-6170843b21b8",
    "1c9e8e79-a67a-4469-a83b-97fd06bb02a5",
    "a04b7133-d751-43cc-92ef-a045b858af80",
    "274642d2-e7d4-4446-8d73-17498369e5fa",
    "a250f6d5-4fe1-43e1-ae45-4947d7641a24",
    "11eb8495-6e2d-4030-81d2-479fa58c1f9e",
    "b2428136-29f9-43f1-a0c4-2e137bdae03b",
    "239ecdde-e97a-4198-b6d8-bf29ae4a9d99",
    "239ecdde-e97a-4198-b6d8-bf29ae4a9d99",
    "51e8c82d-fe6c-4c74-8511-7b69a46fb578",
    "1dc60fac-c84f-4da5-b36c-2909a5f3a8b2",
    "db998d42-49a9-45ff-b945-0842a5e2437c",
    "c668c2c4-e415-45ee-ac82-c443e4ef4665",
    "2f6b9b48-9601-4421-8159-86c4ef753166",
    "058c9eb3-3d6f-4260-ad32-c19c79e1e317",
    "0e6a7646-8251-41e7-8c1c-000089de2a2e",
    "c88f420e-7bfe-4bf9-8f09-0d2a4f632e4b",
    "55aed58a-63cf-4619-95f9-76b9047726e0",
]

UPDATE_INTERVAL_SECONDS = 15


# ------------------------------

def generate_status_data(status_type):
    """Генерує дані стану для підрозділу залежно від заданого типу."""
    signal_rssi = None
    latency_ms = None
    packet_loss_percent = None

    if status_type == "ONLINE":
        signal_rssi = random.randint(-85, -40)
        latency_ms = random.randint(20, 150)
        packet_loss_percent = round(random.uniform(0, 2.5), 2)
    elif status_type == "UNSTABLE":
        signal_rssi = random.randint(-100, -70)
        latency_ms = random.randint(100, 500)
        packet_loss_percent = round(random.uniform(1, 10), 2)
    elif status_type == "OFFLINE":
        pass

    # Іноді робимо деякі параметри None навіть для ONLINE/UNSTABLE
    if status_type != "OFFLINE":
        if random.random() < 0.05: signal_rssi = None
        if random.random() < 0.05: latency_ms = None
        if random.random() < 0.05: packet_loss_percent = None

    return {
        "status": status_type,
        "signal_rssi": signal_rssi,
        "latency_ms": latency_ms,
        "packet_loss_percent": packet_loss_percent
    }


def send_status_update(device_id, data):
    """Надсилає оновлення статусу на бекенд."""
    url = f"{BACKEND_URL}/{device_id}/status"
    headers = {
        'Content-Type': 'application/json',
        'X-Device-Api-Key': EMULATOR_API_KEY
    }
    try:
        response = requests.post(url, headers=headers, data=json.dumps(data), timeout=10)
        print(
            f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Device {device_id}: Sent {data['status']}, Response: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Device {device_id}: Error sending update: {e}")


if __name__ == "__main__":
    if not DEVICE_IDS_TO_SIMULATE or "your_first_device_uuid_here" in DEVICE_IDS_TO_SIMULATE:
        print("ПОПЕРЕДЖЕННЯ: Будь ласка, відредагуйте DEVICE_IDS_TO_SIMULATE, вказавши реальні UUID.")
        exit()

    num_devices = len(DEVICE_IDS_TO_SIMULATE)
    if num_devices == 0:
        print("Не вказано жодного ID пристрою для симуляції.")
        exit()

    print("Starting device emulator...")
    print(f"Simulating {num_devices} devices.")
    print(f"Update interval: {UPDATE_INTERVAL_SECONDS} seconds.")
    print(f"API Key: ...{EMULATOR_API_KEY[-5:]}")  # Показуємо тільки останні 5 символів ключа
    print("Press Ctrl+C to stop.")

    while True:
        # Робимо копію списку ID і перемішуємо її для випадкового вибору
        shuffled_device_ids = random.sample(DEVICE_IDS_TO_SIMULATE, num_devices)

        # 1. Гарантовано один OFFLINE
        offline_device_id = shuffled_device_ids.pop()
        status_data = generate_status_data("OFFLINE")
        send_status_update(offline_device_id, status_data)
        time.sleep(random.uniform(0.1, 0.5))

        # 2. Можливо один UNSTABLE (якщо залишились пристрої)
        if shuffled_device_ids:  # Перевіряємо, чи є ще пристрої
            # З певною ймовірністю робимо один UNSTABLE, або 0-1, якщо мало пристроїв
            num_unstable = 0
            if num_devices <= 2:  # Якщо всього 1-2 пристрої, то нестабільного може і не бути
                if random.random() < 0.5 and shuffled_device_ids:  # 50% шанс для нестабільного
                    num_unstable = 1
            elif num_devices > 2:  # Якщо більше 2-х пристроїв, то 1 нестабільний (можна змінити)
                num_unstable = 3

            for _ in range(num_unstable):
                if not shuffled_device_ids: break  # Якщо пристрої закінчились
                unstable_device_id = shuffled_device_ids.pop()
                status_data = generate_status_data("UNSTABLE")
                send_status_update(unstable_device_id, status_data)
                time.sleep(random.uniform(0.1, 0.5))

        # 3. Всі решта - ONLINE
        for online_device_id in shuffled_device_ids:
            status_data = generate_status_data("ONLINE")
            send_status_update(online_device_id, status_data)
            time.sleep(random.uniform(0.1, 0.5))

        print(f"--- Update batch sent. Waiting {UPDATE_INTERVAL_SECONDS} seconds ---")
        time.sleep(UPDATE_INTERVAL_SECONDS)