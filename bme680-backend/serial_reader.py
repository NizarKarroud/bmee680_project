# serial_reader.py
import re
import threading
import httpx
import serial
import serial.tools.list_ports
from datetime import datetime, timezone


SERIAL_PORT  = "COM4"        
BAUD_RATE    = 115200
INGEST_URL   = "http://localhost:8000/sensor/data/ingest"

PATTERNS = {
    "temperature":    re.compile(r"Temp:\s*([\d.]+)"),
    "humidity":       re.compile(r"Hum:\s*([\d.]+)"),
    "pressure":       re.compile(r"Pres:\s*([\d.]+)"),
    "gas_resistance": re.compile(r"Gas:\s*([\d.]+)"),
}


def parse_block(lines: list[str]) -> dict | None:
    """
    Tente d'extraire les 4 grandeurs depuis un bloc de lignes.
    Retourne None si le bloc est incomplet.
    """
    reading = {}
    for line in lines:
        for key, pattern in PATTERNS.items():
            match = pattern.search(line)
            if match:
                reading[key] = float(match.group(1))

    if len(reading) < 3:   
        return None

    # gas_resistance optionnel : si absent, on envoie 0 (filtré côté backend)
    reading.setdefault("gas_resistance", 0.0)
    reading["timestamp"] = datetime.now(timezone.utc).isoformat()
    return reading



def serial_reader_loop():
    print(f"[serial] Connecting to {SERIAL_PORT} @ {BAUD_RATE} baud...")

    try:
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=2)
    except serial.SerialException as e:
        print(f"[serial] ERROR: {e}")
        print("[serial] Available ports:")
        for p in serial.tools.list_ports.comports():
            print(f"  {p.device} — {p.description}")
        return

    print(f"[serial] Connected.")
    buffer = []

    with httpx.Client() as client:
        while True:
            try:
                raw = ser.readline()
                if not raw:
                    continue

                line = raw.decode("utf-8", errors="ignore").strip()

                if line.startswith("---"):
                    if buffer:
                        reading = parse_block(buffer)
                        if reading:
                            try:
                                resp = client.post(INGEST_URL, json=reading, timeout=5)
                                print(f"[serial] → ingest {resp.status_code} | "
                                      f"T={reading.get('temperature')} "
                                      f"H={reading.get('humidity')} "
                                      f"P={reading.get('pressure')} "
                                      f"G={reading.get('gas_resistance')}")
                            except httpx.RequestError as e:
                                print(f"[serial] ingest failed: {e}")
                        buffer = []
                else:
                    buffer.append(line)

            except serial.SerialException as e:
                print(f"[serial] Connection lost: {e}. Retrying in 5s...")
                import time; time.sleep(5)
                try:
                    ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=2)
                except Exception:
                    pass


def start_serial_reader():
    t = threading.Thread(target=serial_reader_loop, daemon=True)
    t.start()