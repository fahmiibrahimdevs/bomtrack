import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "bomtrack.db")

SAMPLE_MATERIALS = [
    # ================= MIKROKONTROLER & IC =================
    {
        "name": "ESP32 NodeMCU V1 30-Pin Type-C CP2102 Wifi Bluetooth",
        "variant_name": "Type-C 30 Pin",
        "category": "Mikrokontroler & IC",
        "unit_price": 46000.0,
        "quantity": 1,
        "shop_name": "CNC Store Bandung",
        "shop_location": "Bandung",
        "marketplace": "Tokopedia",
        "product_url": "https://www.tokopedia.com/cncstorebandung/esp32-nodemcu-cp2102-type-c",
        "notes": "Chip ESP-WROOM-32D, flash 4MB, driver CP2102 plug and play",
        "is_purchased": 0
    },
    {
        "name": "ESP32-S3 DevKit N16R8 Dual Type-C 16MB Flash 8MB PSRAM",
        "variant_name": "N16R8 Header Solder",
        "category": "Mikrokontroler & IC",
        "unit_price": 75000.0,
        "quantity": 1,
        "shop_name": "Jakarta Robotika",
        "shop_location": "Jakarta Barat",
        "marketplace": "Shopee",
        "product_url": "https://shopee.co.id/ESP32-S3-N16R8-Dual-Type-C-DevBoard",
        "notes": "Cocok untuk AI/ML on Edge, Computer Vision (ESP32-CAM), LCD RGB",
        "is_purchased": 0
    },
    {
        "name": "ESP8266 NodeMCU Lolin V3 CH340 Wifi IoT Board",
        "variant_name": "NodeMCU V3 Lua",
        "category": "Mikrokontroler & IC",
        "unit_price": 28500.0,
        "quantity": 1,
        "shop_name": "Depok Elektronik",
        "shop_location": "Depok",
        "marketplace": "Tokopedia",
        "product_url": "https://www.tokopedia.com/depokelektronik/nodemcu-v3-esp8266-ch340",
        "notes": "Micro USB, 802.11 b/g/n, ESP-12E module",
        "is_purchased": 0
    },
    {
        "name": "Arduino Nano V3 ATmega328P Type-C 5V 16MHz CH340G",
        "variant_name": "Type-C + Pin Header",
        "category": "Mikrokontroler & IC",
        "unit_price": 32000.0,
        "quantity": 1,
        "shop_name": "CNC Store Bandung",
        "shop_location": "Bandung",
        "marketplace": "Tokopedia",
        "product_url": "https://www.tokopedia.com/cncstorebandung/arduino-nano-type-c-ch340",
        "notes": "Port USB Type-C terbaru, ATmega328P 16MHz",
        "is_purchased": 0
    },
    {
        "name": "Arduino Uno R3 ATmega328P DIP IC Socket + Kabel USB",
        "variant_name": "DIP Version + Cable",
        "category": "Mikrokontroler & IC",
        "unit_price": 58000.0,
        "quantity": 1,
        "shop_name": "Toko Maker Surabaya",
        "shop_location": "Surabaya",
        "marketplace": "Tokopedia",
        "product_url": "https://www.tokopedia.com/tokomaker/arduino-uno-r3-dip-atmega328p",
        "notes": "Board standar edukasi & prototyping, chip DIP mudah diganti",
        "is_purchased": 0
    },
    {
        "name": "Raspberry Pi Pico W RP2040 Dual Core WiFi Bluetooth",
        "variant_name": "Pico W Original",
        "category": "Mikrokontroler & IC",
        "unit_price": 95000.0,
        "quantity": 1,
        "shop_name": "DigiWare Store",
        "shop_location": "Surabaya",
        "marketplace": "Tokopedia",
        "product_url": "https://www.tokopedia.com/digiware/raspberry-pi-pico-w-rp2040",
        "notes": "Dual ARM Cortex-M0+, WiFi CYW43439, MicroPython / C++",
        "is_purchased": 0
    },
    {
        "name": "STM32F103C8T6 ARM STM32 Minimum System Board Blue Pill",
        "variant_name": "Blue Pill C8T6",
        "category": "Mikrokontroler & IC",
        "unit_price": 27000.0,
        "quantity": 1,
        "shop_name": "Jakarta Robotika",
        "shop_location": "Jakarta Barat",
        "marketplace": "Shopee",
        "product_url": "https://shopee.co.id/STM32F103C8T6-Blue-Pill-Board",
        "notes": "ARM Cortex-M3 72MHz, 64KB Flash, 20KB SRAM",
        "is_purchased": 0
    },
    {
        "name": "IC Timer NE555 NE555P Precision Timer DIP-8",
        "variant_name": "DIP-8 Original TI",
        "category": "Mikrokontroler & IC",
        "unit_price": 2500.0,
        "quantity": 10,
        "shop_name": "Depok Elektronik",
        "shop_location": "Depok",
        "marketplace": "Tokopedia",
        "product_url": "https://www.tokopedia.com/depokelektronik/ic-ne555-dip-8",
        "notes": "IC oscilator / pulse generator / timing circuit",
        "is_purchased": 0
    },
    {
        "name": "IC Shift Register 74HC595 8-Bit Serial-in Parallel-out DIP-16",
        "variant_name": "DIP-16",
        "category": "Mikrokontroler & IC",
        "unit_price": 3500.0,
        "quantity": 5,
        "shop_name": "CNC Store Bandung",
        "shop_location": "Bandung",
        "marketplace": "Tokopedia",
        "product_url": "https://www.tokopedia.com/cncstorebandung/ic-74hc595-dip16",
        "notes": "Ekspansi pin output mikrokontroler (LED matrix, 7-segment)",
        "is_purchased": 0
    },
    {
        "name": "IC Optocoupler PC817 Sharp 1 Channel Isolator DIP-4",
        "variant_name": "DIP-4",
        "category": "Mikrokontroler & IC",
        "unit_price": 1500.0,
        "quantity": 10,
        "shop_name": "Depok Elektronik",
        "shop_location": "Depok",
        "marketplace": "Tokopedia",
        "product_url": "https://www.tokopedia.com/depokelektronik/ic-pc817-dip-4",
        "notes": "Isolasi tegangan tinggi & sinyal kontrol mikrokontroler",
        "is_purchased": 0
    },

    # ================= SENSOR & MODUL =================
    {
        "name": "BME280 Modul Sensor Suhu, Kelembaban, dan Tekanan Barometer I2C",
        "variant_name": "3.3V / 5V Module",
        "category": "Sensor & Modul",
        "unit_price": 35000.0,
        "quantity": 1,
        "shop_name": "CNC Store Bandung",
        "shop_location": "Bandung",
        "marketplace": "Tokopedia",
        "product_url": "https://www.tokopedia.com/cncstorebandung/sensor-bme280-barometer-i2c",
        "notes": "Sensor presisi tinggi Bosch Sensortec untuk weather station",
        "is_purchased": 0
    },
    {
        "name": "DHT22 / AM2302 Sensor Suhu & Kelembaban Udara Digital Presisi",
        "variant_name": "Modul + Kabel",
        "category": "Sensor & Modul",
        "unit_price": 38000.0,
        "quantity": 1,
        "shop_name": "Jakarta Robotika",
        "shop_location": "Jakarta Barat",
        "marketplace": "Shopee",
        "product_url": "https://shopee.co.id/Sensor-DHT22-AM2302-Digital",
        "notes": "Akurasi lebih tinggi dari DHT11 (rentang -40 s/d 80 C)",
        "is_purchased": 0
    },
    {
        "name": "DS18B20 Sensor Suhu Waterproof Stainless Probe Kabel 1 Meter",
        "variant_name": "Probe 1M",
        "category": "Sensor & Modul",
        "unit_price": 18500.0,
        "quantity": 1,
        "shop_name": "CNC Store Bandung",
        "shop_location": "Bandung",
        "marketplace": "Tokopedia",
        "product_url": "https://www.tokopedia.com/cncstorebandung/sensor-suhu-ds18b20-waterproof",
        "notes": "Protokol 1-Wire, anti-air untuk cairan & akuarium",
        "is_purchased": 0
    },
    {
        "name": "HC-SR04 Ultrasonic Distance Sensor Jarak 5V 2cm - 400cm",
        "variant_name": "HC-SR04 Standard",
        "category": "Sensor & Modul",
        "unit_price": 12000.0,
        "quantity": 1,
        "shop_name": "Depok Elektronik",
        "shop_location": "Depok",
        "marketplace": "Tokopedia",
        "product_url": "https://www.tokopedia.com/depokelektronik/sensor-jarak-ultrasonic-hc-sr04",
        "notes": "Sensor sonar ultrasonik deteksi halangan robot",
        "is_purchased": 0
    },
    {
        "name": "VL53L0X Time-of-Flight (ToF) Laser Distance Sensor I2C",
        "variant_name": "GY-VL53L0X",
        "category": "Sensor & Modul",
        "unit_price": 32000.0,
        "quantity": 1,
        "shop_name": "Jakarta Robotika",
        "shop_location": "Jakarta Barat",
        "marketplace": "Shopee",
        "product_url": "https://shopee.co.id/VL53L0X-Laser-Distance-Sensor-ToF",
        "notes": "Sensor jarak laser ToF presisi milimeter hingga 2 meter",
        "is_purchased": 0
    },
    {
        "name": "MPU-6050 3-Axis Gyroscope + 3-Axis Accelerometer Module I2C",
        "variant_name": "GY-521 Module",
        "category": "Sensor & Modul",
        "unit_price": 17500.0,
        "quantity": 1,
        "shop_name": "CNC Store Bandung",
        "shop_location": "Bandung",
        "marketplace": "Tokopedia",
        "product_url": "https://www.tokopedia.com/cncstorebandung/modul-gy-521-mpu6050-gyro-accel",
        "notes": "6 DOF Motion tracking, integrasi DMP (Digital Motion Processor)",
        "is_purchased": 0
    },
    {
        "name": "Load Cell 5KG + Modul ADC 24-Bit HX711 Timbangan Digital",
        "variant_name": "5KG + HX711 Board",
        "category": "Sensor & Modul",
        "unit_price": 28000.0,
        "quantity": 1,
        "shop_name": "Depok Elektronik",
        "shop_location": "Depok",
        "marketplace": "Tokopedia",
        "product_url": "https://www.tokopedia.com/depokelektronik/load-cell-5kg-hx711-timbangan",
        "notes": "Paket sensor berat/timbangan IoT lengkap dengan modul penguat",
        "is_purchased": 0
    },
    {
        "name": "MQ-2 Gas Sensor Module Smoke LPG Methane Butane Hydrogen",
        "variant_name": "MQ-2 Modul",
        "category": "Sensor & Modul",
        "unit_price": 16000.0,
        "quantity": 1,
        "shop_name": "Toko Maker Surabaya",
        "shop_location": "Surabaya",
        "marketplace": "Tokopedia",
        "product_url": "https://www.tokopedia.com/tokomaker/mq2-smoke-lpg-gas-sensor",
        "notes": "Deteksi kebocoran gas LPG dan asap kebakaran (Output Analog & Digital)",
        "is_purchased": 0
    },
    {
        "name": "PZEM-004T V3.0 AC Digital Multifunction Power Meter + CT Split Core 100A",
        "variant_name": "Split Core 100A",
        "category": "Sensor & Modul",
        "unit_price": 98000.0,
        "quantity": 1,
        "shop_name": "Jakarta Robotika",
        "shop_location": "Jakarta Barat",
        "marketplace": "Shopee",
        "product_url": "https://shopee.co.id/PZEM-004T-V3.0-100A-CT-Split-Core",
        "notes": "Sensor daya AC: Tegangan, Arus, Daya (Watt), Energi (kWh), Frekuensi & Power Factor",
        "is_purchased": 0
    },
    {
        "name": "DS3231 AT24C32 High Precision Real Time Clock RTC Module I2C",
        "variant_name": "DS3231 + Baterai LIR2032",
        "category": "Sensor & Modul",
        "unit_price": 19500.0,
        "quantity": 1,
        "shop_name": "CNC Store Bandung",
        "shop_location": "Bandung",
        "marketplace": "Tokopedia",
        "product_url": "https://www.tokopedia.com/cncstorebandung/rtc-ds3231-high-precision-i2c",
        "notes": "RTC akurasi tinggi dengan TCXO built-in (tidak mudah geser jamnya)",
        "is_purchased": 0
    },
    {
        "name": "Display OLED 0.96 Inch I2C 128x64 SSD1306 Biru-Kuning",
        "variant_name": "I2C 4-Pin Biru Kuning",
        "category": "Sensor & Modul",
        "unit_price": 28500.0,
        "quantity": 1,
        "shop_name": "CNC Store Bandung",
        "shop_location": "Bandung",
        "marketplace": "Tokopedia",
        "product_url": "https://www.tokopedia.com/cncstorebandung/oled-0-96-i2c-128x64-ssd1306",
        "notes": "Layar grafis hemat daya, interface I2C (hanya butuh 2 pin SDA & SCL)",
        "is_purchased": 0
    },
    {
        "name": "LCD 1602 16x2 Karakter Biru dengan Modul I2C Backpack Terpasang",
        "variant_name": "Blue Backlight + I2C",
        "category": "Sensor & Modul",
        "unit_price": 27000.0,
        "quantity": 1,
        "shop_name": "Depok Elektronik",
        "shop_location": "Depok",
        "marketplace": "Tokopedia",
        "product_url": "https://www.tokopedia.com/depokelektronik/lcd-1602-i2c-biru",
        "notes": "LCD 16 karakter 2 baris hemat pin dengan adaptor I2C PCF8574",
        "is_purchased": 0
    },
    {
        "name": "RFID Reader RC522 13.56MHz Module Kit + Kartu S50 & Keychain Tag",
        "variant_name": "RC522 Kit Lengkap",
        "category": "Sensor & Modul",
        "unit_price": 19000.0,
        "quantity": 1,
        "shop_name": "Jakarta Robotika",
        "shop_location": "Jakarta Barat",
        "marketplace": "Shopee",
        "product_url": "https://shopee.co.id/RC522-RFID-Module-Kit-13.56MHz",
        "notes": "Mifare 13.56MHz reader/writer interface SPI untuk smart doorlock/absen",
        "is_purchased": 0
    },

    # ================= BATERAI & POWER =================
    {
        "name": "Baterai Li-ion 18650 3.7V 2500mAh 20A Flat Top Original",
        "variant_name": "2500mAh 20A Flat Top",
        "category": "Baterai & Power",
        "unit_price": 26000.0,
        "quantity": 2,
        "shop_name": "CNC Store Bandung",
        "shop_location": "Bandung",
        "marketplace": "Tokopedia",
        "product_url": "https://www.tokopedia.com/cncstorebandung/baterai-18650-3-7v-2500mah",
        "notes": "Cell baterai lithium rechargeable kapasitas murni untuk IoT & powerbank",
        "is_purchased": 0
    },
    {
        "name": "Modul TP4056 Charger Baterai 18650 Type-C dengan Proteksi DW01",
        "variant_name": "Type-C + Protection",
        "category": "Baterai & Power",
        "unit_price": 4500.0,
        "quantity": 4,
        "shop_name": "Depok Elektronik",
        "shop_location": "Depok",
        "marketplace": "Tokopedia",
        "product_url": "https://www.tokopedia.com/depokelektronik/tp4056-type-c-charger-protection",
        "notes": "Overcharge & Overdischarge protection (Port Type-C 1A CC/CV)",
        "is_purchased": 0
    },
    {
        "name": "BMS 3S 20A 12.6V 18650 Li-ion Battery Protection Board",
        "variant_name": "3S 20A Standard",
        "category": "Baterai & Power",
        "unit_price": 14000.0,
        "quantity": 1,
        "shop_name": "Jakarta Robotika",
        "shop_location": "Jakarta Barat",
        "marketplace": "Shopee",
        "product_url": "https://shopee.co.id/BMS-3S-20A-12.6V-Protection-Board",
        "notes": "Proteksi rangkaian seri 3 baterai 18650 output 11.1V - 12.6V",
        "is_purchased": 0
    },
    {
        "name": "LM2596S DC-DC Step Down Buck Converter Module Adjustable 3A",
        "variant_name": "LM2596S Standar",
        "category": "Baterai & Power",
        "unit_price": 11500.0,
        "quantity": 2,
        "shop_name": "CNC Store Bandung",
        "shop_location": "Bandung",
        "marketplace": "Tokopedia",
        "product_url": "https://www.tokopedia.com/cncstorebandung/lm2596s-step-down-dc-dc",
        "notes": "Input 4V-35V, Output 1.25V-30V adjustable via trimpot",
        "is_purchased": 0
    },
    {
        "name": "XL4015 5A DC-DC Step Down Buck Converter Constant Current Constant Voltage",
        "variant_name": "XL4015 CC CV Module",
        "category": "Baterai & Power",
        "unit_price": 22000.0,
        "quantity": 1,
        "shop_name": "Toko Maker Surabaya",
        "shop_location": "Surabaya",
        "marketplace": "Tokopedia",
        "product_url": "https://www.tokopedia.com/tokomaker/xl4015-5a-buck-cc-cv-module",
        "notes": "Dapat mengatur batas arus & tegangan, sangat baik untuk charger baterai",
        "is_purchased": 0
    },
    {
        "name": "MT3608 DC-DC Step Up Boost Converter Module 2A Micro USB / Solder",
        "variant_name": "MT3608 2A",
        "category": "Baterai & Power",
        "unit_price": 7500.0,
        "quantity": 2,
        "shop_name": "Depok Elektronik",
        "shop_location": "Depok",
        "marketplace": "Tokopedia",
        "product_url": "https://www.tokopedia.com/depokelektronik/step-up-mt3608-boost-converter",
        "notes": "Menaikkan tegangan 3.7V baterai menjadi 5V/9V/12V hingga 28V",
        "is_purchased": 0
    },
    {
        "name": "Power Supply Switching Jaring 12V 5A 60W Adaptor LED CCTV",
        "variant_name": "12V 5A 60W",
        "category": "Baterai & Power",
        "unit_price": 48000.0,
        "quantity": 1,
        "shop_name": "Jakarta Robotika",
        "shop_location": "Jakarta Barat",
        "marketplace": "Shopee",
        "product_url": "https://shopee.co.id/Power-Supply-Switching-12V-5A-Jaring",
        "notes": "Casing jaring alumunium pembuang panas, input AC 110V/220V",
        "is_purchased": 0
    },
    {
        "name": "Holder Baterai 18650 2 Slot Seri 7.4V dengan Kabel",
        "variant_name": "2 Slot Seri (7.4V)",
        "category": "Baterai & Power",
        "unit_price": 6000.0,
        "quantity": 2,
        "shop_name": "CNC Store Bandung",
        "shop_location": "Bandung",
        "marketplace": "Tokopedia",
        "product_url": "https://www.tokopedia.com/cncstorebandung/holder-baterai-18650-2-slot-seri",
        "notes": "Bahan ABS solid dengan kabel merah (+) dan hitam (-)",
        "is_purchased": 0
    },

    # ================= MEKANIK & RANGKA (MOTOR & RELAY) =================
    {
        "name": "Modul Relay 1 Channel 5V dengan Optocoupler High/Low Trigger",
        "variant_name": "1 Channel 5V Opto",
        "category": "Mekanik & Rangka",
        "unit_price": 8500.0,
        "quantity": 2,
        "shop_name": "CNC Store Bandung",
        "shop_location": "Bandung",
        "marketplace": "Tokopedia",
        "product_url": "https://www.tokopedia.com/cncstorebandung/modul-relay-1-channel-5v-opto",
        "notes": "Beban saklar hingga 10A 250VAC / 30VDC, trigger jumper selektor",
        "is_purchased": 0
    },
    {
        "name": "Modul Relay 4 Channel 5V dengan Optocoupler Isolasi",
        "variant_name": "4 Channel 5V",
        "category": "Mekanik & Rangka",
        "unit_price": 24500.0,
        "quantity": 1,
        "shop_name": "Depok Elektronik",
        "shop_location": "Depok",
        "marketplace": "Tokopedia",
        "product_url": "https://www.tokopedia.com/depokelektronik/modul-relay-4-channel-5v",
        "notes": "Relay 4 kanal untuk kontrol multi-lampu / perangkat AC",
        "is_purchased": 0
    },
    {
        "name": "Micro Servo Motor SG90 9g 180 Derajat Tower Pro",
        "variant_name": "SG90 9g 180 Deg",
        "category": "Mekanik & Rangka",
        "unit_price": 15500.0,
        "quantity": 2,
        "shop_name": "CNC Store Bandung",
        "shop_location": "Bandung",
        "marketplace": "Tokopedia",
        "product_url": "https://www.tokopedia.com/cncstorebandung/servo-sg90-9g-towerpro",
        "notes": "Include 3 buah arm/sayap horn servo dan set baut",
        "is_purchased": 0
    },
    {
        "name": "MG996R Metal Gear High Torque Digital Servo Motor 180 Derajat",
        "variant_name": "MG996R Metal Gear",
        "category": "Mekanik & Rangka",
        "unit_price": 49000.0,
        "quantity": 1,
        "shop_name": "Jakarta Robotika",
        "shop_location": "Jakarta Barat",
        "marketplace": "Shopee",
        "product_url": "https://shopee.co.id/MG996R-Metal-Gear-High-Torque-Servo",
        "notes": "Gear logam tahan aus, torsi tinggi hingga 11kg/cm pada 6V",
        "is_purchased": 0
    },
    {
        "name": "NEMA 17 Stepper Motor 42HS40 1.5A 0.45Nm 4-Lead + Kabel 1M",
        "variant_name": "NEMA 17 42HS40",
        "category": "Mekanik & Rangka",
        "unit_price": 78000.0,
        "quantity": 1,
        "shop_name": "Toko Maker Surabaya",
        "shop_location": "Surabaya",
        "marketplace": "Tokopedia",
        "product_url": "https://www.tokopedia.com/tokomaker/nema-17-stepper-motor-42hs40",
        "notes": "Motor stepper presisi 1.8 derajat step angle untuk 3D printer / CNC",
        "is_purchased": 0
    },
    {
        "name": "A4988 Stepper Motor Driver Module + Heatsink Pendingin",
        "variant_name": "A4988 Merah + Heatsink",
        "category": "Mekanik & Rangka",
        "unit_price": 12500.0,
        "quantity": 2,
        "shop_name": "CNC Store Bandung",
        "shop_location": "Bandung",
        "marketplace": "Tokopedia",
        "product_url": "https://www.tokopedia.com/cncstorebandung/driver-stepper-a4988-heatsink",
        "notes": "Microstepping hingga 1/16 step, arus adjustable trimpot",
        "is_purchased": 0
    },
    {
        "name": "L298N Dual H-Bridge DC Stepper Motor Driver Controller Board",
        "variant_name": "L298N Modul",
        "category": "Mekanik & Rangka",
        "unit_price": 21000.0,
        "quantity": 1,
        "shop_name": "Depok Elektronik",
        "shop_location": "Depok",
        "marketplace": "Tokopedia",
        "product_url": "https://www.tokopedia.com/depokelektronik/l298n-dual-h-bridge-motor-driver",
        "notes": "Kontrol 2 motor DC dengan pengatur arah dan kecepatan PWM",
        "is_purchased": 0
    },
    {
        "name": "Mini Submersible Pump Pompa Air Celup DC 3V - 5V USB / Kabel",
        "variant_name": "Pompa Mini 5V",
        "category": "Mekanik & Rangka",
        "unit_price": 14000.0,
        "quantity": 1,
        "shop_name": "CNC Store Bandung",
        "shop_location": "Bandung",
        "marketplace": "Tokopedia",
        "product_url": "https://www.tokopedia.com/cncstorebandung/pompa-air-celup-mini-dc-3v-5v",
        "notes": "Pompa air otomatis mini untuk proyek siram tanaman IoT",
        "is_purchased": 0
    },
    {
        "name": "Solenoid Valve Air 12V DC Drat 1/2 Inch Normally Closed (NC)",
        "variant_name": "12V DC 1/2 Inch NC",
        "category": "Mekanik & Rangka",
        "unit_price": 38000.0,
        "quantity": 1,
        "shop_name": "Jakarta Robotika",
        "shop_location": "Jakarta Barat",
        "marketplace": "Shopee",
        "product_url": "https://shopee.co.id/Solenoid-Valve-Air-12V-DC-1-2-Inch",
        "notes": "Kran air elektrik 12V, terbuka saat diberi tegangan listrik",
        "is_purchased": 0
    },

    # ================= KABEL & KONEKTOR =================
    {
        "name": "Kabel Jumper Dupont 20cm 40 Pin Male to Female (M-F)",
        "variant_name": "Male to Female 20cm (40P)",
        "category": "Kabel & Konektor",
        "unit_price": 9500.0,
        "quantity": 1,
        "shop_name": "CNC Store Bandung",
        "shop_location": "Bandung",
        "marketplace": "Tokopedia",
        "product_url": "https://www.tokopedia.com/cncstorebandung/kabel-jumper-dupont-20cm-mf-40pin",
        "notes": "Kabel pita jumper 40 jalur bisa dipisah per helai",
        "is_purchased": 0
    },
    {
        "name": "Kabel Jumper Dupont 20cm 40 Pin Male to Male (M-M)",
        "variant_name": "Male to Male 20cm (40P)",
        "category": "Kabel & Konektor",
        "unit_price": 9500.0,
        "quantity": 1,
        "shop_name": "CNC Store Bandung",
        "shop_location": "Bandung",
        "marketplace": "Tokopedia",
        "product_url": "https://www.tokopedia.com/cncstorebandung/kabel-jumper-dupont-20cm-mm-40pin",
        "notes": "Kabel jumper untuk breadboard prototyping",
        "is_purchased": 0
    },
    {
        "name": "Kabel Jumper Dupont 20cm 40 Pin Female to Female (F-F)",
        "variant_name": "Female to Female 20cm (40P)",
        "category": "Kabel & Konektor",
        "unit_price": 9500.0,
        "quantity": 1,
        "shop_name": "Depok Elektronik",
        "shop_location": "Depok",
        "marketplace": "Tokopedia",
        "product_url": "https://www.tokopedia.com/depokelektronik/kabel-jumper-dupont-20cm-ff-40pin",
        "notes": "Kabel jumper modul ke board ESP32/Arduino",
        "is_purchased": 0
    },
    {
        "name": "Header Pin Male 1x40 Pin 2.54mm Straight Pitch Hitam",
        "variant_name": "1x40 Male Straight (Pack 5 Pcs)",
        "category": "Kabel & Konektor",
        "unit_price": 6000.0,
        "quantity": 1,
        "shop_name": "Depok Elektronik",
        "shop_location": "Depok",
        "marketplace": "Tokopedia",
        "product_url": "https://www.tokopedia.com/depokelektronik/header-pin-male-1x40-2-54mm",
        "notes": "Pin header male standar PCB, mudah dipotong sesuai jumlah pin",
        "is_purchased": 0
    },
    {
        "name": "Terminal Block Screw KF301-2P 5.08mm 2 Pin Biru PCB",
        "variant_name": "KF301 2-Pin (Isi 10 Pcs)",
        "category": "Kabel & Konektor",
        "unit_price": 8000.0,
        "quantity": 1,
        "shop_name": "CNC Store Bandung",
        "shop_location": "Bandung",
        "marketplace": "Tokopedia",
        "product_url": "https://www.tokopedia.com/cncstorebandung/terminal-block-kf301-2p-pcb",
        "notes": "Konektor terminal baut kabel power AC/DC ke PCB",
        "is_purchased": 0
    },
    {
        "name": "Konektor DC Jack Male & Female 5.5 x 2.1mm Baut Screw Terminal",
        "variant_name": "Sepasang (1 Male + 1 Female)",
        "category": "Kabel & Konektor",
        "unit_price": 5000.0,
        "quantity": 2,
        "shop_name": "Depok Elektronik",
        "shop_location": "Depok",
        "marketplace": "Tokopedia",
        "product_url": "https://www.tokopedia.com/depokelektronik/dc-jack-male-female-screw-terminal",
        "notes": "Konektor adaptor power 12V tanpa perlu solder",
        "is_purchased": 0
    },
    {
        "name": "Kabel AWG 24 Silicone Lentur Fleksibel Tahan Panas 5 Meter Hitam & Merah",
        "variant_name": "Set 5M Merah + 5M Hitam",
        "category": "Kabel & Konektor",
        "unit_price": 18000.0,
        "quantity": 1,
        "shop_name": "Jakarta Robotika",
        "shop_location": "Jakarta Barat",
        "marketplace": "Shopee",
        "product_url": "https://shopee.co.id/Kabel-Silicone-AWG24-Lentur-5M",
        "notes": "Kabel serabut tembaga lapis timah (tinned copper), isolasi silikon",
        "is_purchased": 0
    },

    # ================= BAUT & FASTENER =================
    {
        "name": "Baut Kepala Bulat M3 x 10mm Stainless Steel 304 + Mur Nut (Isi 50 Set)",
        "variant_name": "M3 x 10mm + Mur (50 Pcs)",
        "category": "Baut & Fastener",
        "unit_price": 15000.0,
        "quantity": 1,
        "shop_name": "CNC Store Bandung",
        "shop_location": "Bandung",
        "marketplace": "Tokopedia",
        "product_url": "https://www.tokopedia.com/cncstorebandung/baut-m3x10mm-mur-stainless-304",
        "notes": "Material SUS304 anti-karat untuk mounting PCB dan casing",
        "is_purchased": 0
    },
    {
        "name": "Spacer Kuningan Hexagonal M3 x 10mm + 6mm Male-Female Stand-off (Isi 20 Pcs)",
        "variant_name": "M3 x 10mm Male-Female (20 Pcs)",
        "category": "Baut & Fastener",
        "unit_price": 18000.0,
        "quantity": 1,
        "shop_name": "Depok Elektronik",
        "shop_location": "Depok",
        "marketplace": "Tokopedia",
        "product_url": "https://www.tokopedia.com/depokelektronik/spacer-kuningan-m3x10mm-male-female",
        "notes": "Tiang penyangga PCB kuningan dengan drat baut",
        "is_purchased": 0
    },
    {
        "name": "Spacer Nylon PCB M3 x 10mm Female-Female Isolator Plastik (Isi 50 Pcs)",
        "variant_name": "M3 x 10mm Nylon Putih (50 Pcs)",
        "category": "Baut & Fastener",
        "unit_price": 12000.0,
        "quantity": 1,
        "shop_name": "Jakarta Robotika",
        "shop_location": "Jakarta Barat",
        "marketplace": "Shopee",
        "product_url": "https://shopee.co.id/Spacer-Nylon-M3-10mm-Putih-50pcs",
        "notes": "Penyangga isolator non-konduktif mencegah korsleting antar layer PCB",
        "is_purchased": 0
    },

    # ================= ELEKTRONIK & PASIF =================
    {
        "name": "Breadboard MB-102 830 Titik Lubang Solderless Tie-Point Prototyping",
        "variant_name": "MB-102 830 Point",
        "category": "Elektronik",
        "unit_price": 16500.0,
        "quantity": 1,
        "shop_name": "CNC Store Bandung",
        "shop_location": "Bandung",
        "marketplace": "Tokopedia",
        "product_url": "https://www.tokopedia.com/cncstorebandung/breadboard-mb102-830-titik",
        "notes": "Papan percobaan sirkuit tanpa solder dilengkapi jalur power rel ganda",
        "is_purchased": 0
    },
    {
        "name": "PCB Matrix Stripboard Lubang Donat 5x7cm Double Sided FR4 Fiber",
        "variant_name": "5x7cm Double Sided (Pack 5 Pcs)",
        "category": "Elektronik",
        "unit_price": 14500.0,
        "quantity": 1,
        "shop_name": "Depok Elektronik",
        "shop_location": "Depok",
        "marketplace": "Tokopedia",
        "product_url": "https://www.tokopedia.com/depokelektronik/pcb-lubang-5x7cm-fr4-double-side",
        "notes": "Papan PCB lubang bahan fiber FR4 kuat untuk prototipe permanen",
        "is_purchased": 0
    },
    {
        "name": "Kit Resistor 1/4W 1% Metal Film 30 Nilai (Total 600 Pcs)",
        "variant_name": "Kit 30 Nilai (600 Pcs)",
        "category": "Elektronik",
        "unit_price": 28000.0,
        "quantity": 1,
        "shop_name": "CNC Store Bandung",
        "shop_location": "Bandung",
        "marketplace": "Tokopedia",
        "product_url": "https://www.tokopedia.com/cncstorebandung/kit-resistor-1-4w-metal-film-600pcs",
        "notes": "Nilai lengkap dari 10 Ohm hingga 1M Ohm toleransi presisi 1%",
        "is_purchased": 0
    },
    {
        "name": "Kit Kapasitor Elektrolit Elco 16V-50V 10 Nilai 0.1uF - 1000uF (Isi 100 Pcs)",
        "variant_name": "Kit Elco 100 Pcs Box",
        "category": "Elektronik",
        "unit_price": 32000.0,
        "quantity": 1,
        "shop_name": "Jakarta Robotika",
        "shop_location": "Jakarta Barat",
        "marketplace": "Shopee",
        "product_url": "https://shopee.co.id/Kit-Elco-Kapasitor-Elektrolit-100pcs",
        "notes": "Koleksi elco untuk peredam ripple power supply & filter audio",
        "is_purchased": 0
    },
    {
        "name": "LED 5mm Diffuse 5 Warna (Merah, Hijau, Biru, Kuning, Putih) Isi 50 Pcs",
        "variant_name": "5 Warna Campur (50 Pcs)",
        "category": "Elektronik",
        "unit_price": 12000.0,
        "quantity": 1,
        "shop_name": "Depok Elektronik",
        "shop_location": "Depok",
        "marketplace": "Tokopedia",
        "product_url": "https://www.tokopedia.com/depokelektronik/led-5mm-diffuse-5-warna-50pcs",
        "notes": "Dioda LED indikator warna-warni 20mA",
        "is_purchased": 0
    },
    {
        "name": "Push Button Tactile Switch 6x6x5mm 4-Pin PCB + Tutup Cap Warna (Isi 20 Pcs)",
        "variant_name": "20 Pcs Switch + 20 Cap",
        "category": "Elektronik",
        "unit_price": 10000.0,
        "quantity": 1,
        "shop_name": "CNC Store Bandung",
        "shop_location": "Bandung",
        "marketplace": "Tokopedia",
        "product_url": "https://www.tokopedia.com/cncstorebandung/tactile-switch-6x6x5mm-cap-warna",
        "notes": "Tombol momentary tactile klik empuk untuk input mikrokontroler",
        "is_purchased": 0
    },
    {
        "name": "Potensiometer Rotary Mono 10K Ohm B10K 3-Pin + Knob Putar",
        "variant_name": "10K Ohm B10K + Knob (5 Set)",
        "category": "Elektronik",
        "unit_price": 12500.0,
        "quantity": 1,
        "shop_name": "Depok Elektronik",
        "shop_location": "Depok",
        "marketplace": "Tokopedia",
        "product_url": "https://www.tokopedia.com/depokelektronik/potensiometer-b10k-mono-knob",
        "notes": "Resistor variabel linear untuk pengatur volume atau input ADC analog",
        "is_purchased": 0
    },

    # ================= TOOLS & AKSESORIS =================
    {
        "name": "Solder Listrik Adjustable Temperature 60W 220V 200-450C",
        "variant_name": "Solder 60W Temp Control",
        "category": "Tools & Aksesoris",
        "unit_price": 42000.0,
        "quantity": 1,
        "shop_name": "CNC Store Bandung",
        "shop_location": "Bandung",
        "marketplace": "Tokopedia",
        "product_url": "https://www.tokopedia.com/cncstorebandung/solder-listrik-adjustable-temp-60w",
        "notes": "Suhu dapat disesuaikan untuk komponen sensitif / SMD",
        "is_purchased": 0
    },
    {
        "name": "Timah Solder Paragon 0.8mm 60/40 Rosin Core Alloy High Quality 10 Meter",
        "variant_name": "Paragon 0.8mm (10M)",
        "category": "Tools & Aksesoris",
        "unit_price": 17500.0,
        "quantity": 1,
        "shop_name": "Depok Elektronik",
        "shop_location": "Depok",
        "marketplace": "Tokopedia",
        "product_url": "https://www.tokopedia.com/depokelektronik/timah-solder-paragon-0-8mm-10m",
        "notes": "Timah leleh sempurna dengan flux rosin inti",
        "is_purchased": 0
    },
    {
        "name": "Tang Potong Micro Nipper Plato 170 Pemotong Kaki Komponen & Kabel",
        "variant_name": "Plato 170 Original",
        "category": "Tools & Aksesoris",
        "unit_price": 14000.0,
        "quantity": 1,
        "shop_name": "CNC Store Bandung",
        "shop_location": "Bandung",
        "marketplace": "Tokopedia",
        "product_url": "https://www.tokopedia.com/cncstorebandung/tang-potong-plato-170-micro-nipper",
        "notes": "Mata potong presisi flush cut untuk merapikan solderan kaki PCB",
        "is_purchased": 0
    },
    {
        "name": "Heat Shrink Selongsong Bakar Isolasi Bakar Set 127 Pcs Campur Ukuran",
        "variant_name": "Set 127 Pcs Tube",
        "category": "Tools & Aksesoris",
        "unit_price": 16000.0,
        "quantity": 1,
        "shop_name": "Jakarta Robotika",
        "shop_location": "Jakarta Barat",
        "marketplace": "Shopee",
        "product_url": "https://shopee.co.id/Heat-Shrink-Tube-127pcs-Set",
        "notes": "Isolasi sambungan kabel rapi dan aman dari korsleting",
        "is_purchased": 0
    },
    {
        "name": "Filament 3D Printer PLA+ 1.75mm eSUN 1Kg Hitam Black",
        "variant_name": "PLA+ 1.75mm Black 1KG",
        "category": "Tools & Aksesoris",
        "unit_price": 165000.0,
        "quantity": 1,
        "shop_name": "Toko Maker Surabaya",
        "shop_location": "Surabaya",
        "marketplace": "Tokopedia",
        "product_url": "https://www.tokopedia.com/tokomaker/filamen-esun-pla-plus-1-75mm-black",
        "notes": "Filamen cetak casing & enclosure IoT kuat dan minim warping",
        "is_purchased": 0
    }
]

def seed_database():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if items already exist
    cursor.execute("SELECT COUNT(*) FROM bom_items")
    count = cursor.fetchone()[0]
    
    print(f"Current items in bom_items: {count}")
    
    inserted = 0
    for item in SAMPLE_MATERIALS:
        # Check duplicate by name + variant
        cursor.execute("SELECT id FROM bom_items WHERE name = ? AND variant_name = ?", (item["name"], item["variant_name"]))
        if cursor.fetchone():
            continue
            
        total_price = item["unit_price"] * item["quantity"]
        cursor.execute("""
        INSERT INTO bom_items (
            project_id, name, variant_name, category, unit_price, quantity, total_price,
            shop_name, shop_location, marketplace, product_url, image_url, notes, is_purchased
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            1, item["name"], item["variant_name"], item["category"],
            item["unit_price"], item["quantity"], total_price,
            item["shop_name"], item["shop_location"], item["marketplace"],
            item["product_url"], "", item["notes"], item["is_purchased"]
        ))
        inserted += 1
        
    conn.commit()
    
    cursor.execute("SELECT COUNT(*) FROM bom_items")
    total = cursor.fetchone()[0]
    conn.close()
    
    print(f"Successfully seeded {inserted} new items. Total items in database: {total}")

if __name__ == "__main__":
    seed_database()
