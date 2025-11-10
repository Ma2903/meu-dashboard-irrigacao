# 🌿 Dashboard de Irrigação Inteligente (ESP32 + React)

Este projeto é um sistema de monitoramento de horta inteligente que combina hardware (ESP32 simulado no Wokwi) com um dashboard web moderno (React).

Os dados dos sensores são lidos pelo ESP32, publicados em um tópico MQTT e exibidos em tempo real no dashboard.

## Monitoramento em Tempo Real

O dashboard exibe os seguintes dados diretamente dos sensores:
* 🌡️ **Temperatura do Ar:** Em graus Celsius.
* 💧 **Umidade do Ar:** Em porcentagem.
* 🌱 **Umidade do Solo:** Em porcentagem.
* 🧪 **Nível de pH do Solo:** Em uma escala de 0 a 14.
* 💡 **Status da Bomba:** LIGADA ou DESLIGADA (controlada automaticamente pela umidade do solo).

## 🛠️ Tecnologias Utilizadas

Este projeto é dividido em duas partes principais:

### 1. Hardware (Simulação no Wokwi)
* **Placa:** ESP32
* **Sensores:** DHT22 (Temperatura e Umidade do Ar), Sensor de Umidade do Solo (Potenciômetro), Sensor de pH (Potenciômetro).
* **Protocolo:** MQTT (usando o broker público `broker.hivemq.com`)
* **Bibliotecas:**
    * `PubSubClient` (para MQTT)
    * `ArduinoJson` (para formatar os dados)
    * `LiquidCrystal_I2C` (para o display LCD)
    * `DHT.h`

### 2. Frontend (Dashboard Web)
* **Framework:** [React](https://reactjs.org/) (via [Vite](https://vitejs.dev/))
* **Linguagem:** JavaScript (JSX)
* **Comunicação:** [MQTT.js](https://github.com/mqttjs) (para se inscrever no tópico MQTT via WebSockets)
* **Estilo:** CSS puro (`App.css`)

## 🚀 Como Rodar

Você precisará rodar as duas partes simultaneamente.

### 1. Rodar o Wokwi (Hardware)
1.  Abra o projeto da simulação no Wokwi:[ [Link para o projeto no Wokwi]](https://wokwi.com/projects/446985665374773249)
2.  Inicie a simulação (botão verde).
3.  Abra o "Serial Monitor" para confirmar que ele conectou ao Wi-Fi e ao MQTT.

### 2. Rodar o Dashboard (React)
1.  Clone este repositório:
    ```bash
    git clone 
    ```
2.  Entre na pasta e instale as dependências:
    ```bash
    cd meu-dashboard-irrigacao
    npm install
    ```
3.  Inicie o servidor de desenvolvimento:
    ```bash
    npm run dev
    ```
4.  Abra [http://localhost:5173](http://localhost:5173) (ou o link que aparecer no terminal) no seu navegador.
