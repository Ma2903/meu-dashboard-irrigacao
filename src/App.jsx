import { useState, useEffect } from 'react';
import mqtt from 'mqtt';
import './App.css';

const MQTT_BROKER_URL = 'wss://broker.hivemq.com:8884/mqtt'; 
const MQTT_TOPIC = 'wokwi/jardim/dados';

function App() {
  const [sensorData, setSensorData] = useState({
    temperatura: 0,
    umidadeAr: 0,
    umidadeSolo: 0,
    ph: 0,
    bomba: false,
  });
  const [connectionStatus, setConnectionStatus] = useState('Desconectado');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [dataHistory, setDataHistory] = useState([]);

  useEffect(() => {
    console.log('Conectando ao broker MQTT...');
    
    const options = {
      keepalive: 60,
      clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
      protocolId: 'MQTT',
      protocolVersion: 4,
      clean: true,
      reconnectPeriod: 1000,
      connectTimeout: 30 * 1000,
      rejectUnauthorized: false
    };

    const client = mqtt.connect(MQTT_BROKER_URL, options);

    client.on('connect', () => {
      console.log('✅ Conectado ao Broker MQTT!');
      setConnectionStatus('Conectado');
      
      client.subscribe(MQTT_TOPIC, { qos: 0 }, (err) => {
        if (err) {
          console.error('❌ Erro ao assinar o tópico:', err);
        } else {
          console.log(`✅ Assinatura ao tópico "${MQTT_TOPIC}" bem-sucedida!`);
        }
      });
    });

    client.on('message', (topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('📨 Dados recebidos:', data);
        setSensorData(data);
        setLastUpdate(new Date());
        setDataHistory(prev => [...prev.slice(-19), { ...data, timestamp: new Date() }]);
      } catch (e) {
        console.error('❌ Erro ao processar a mensagem JSON:', e);
      }
    });

    client.on('reconnect', () => {
      console.log('🔄 Tentando reconectar...');
      setConnectionStatus('Reconectando...');
    });

    client.on('error', (err) => {
      console.error('❌ Erro de conexão:', err);
      setConnectionStatus('Erro');
    });

    client.on('offline', () => {
      console.log('📴 Cliente offline');
      setConnectionStatus('Offline');
    });

    client.on('close', () => {
      console.log('🔌 Conexão fechada');
      setConnectionStatus('Desconectado');
    });

    return () => {
      if (client) {
        client.end(true);
        console.log('👋 Desconectando do broker...');
      }
    };
  }, []);

  const [relativeTime, setRelativeTime] = useState('');
  
  useEffect(() => {
    if (!lastUpdate) return;
    
    const updateRelativeTime = () => {
      const seconds = Math.floor((new Date() - lastUpdate) / 1000);
      if (seconds < 60) {
        setRelativeTime(`${seconds}s atrás`);
      } else if (seconds < 3600) {
        setRelativeTime(`${Math.floor(seconds / 60)}min atrás`);
      } else {
        setRelativeTime(`${Math.floor(seconds / 3600)}h atrás`);
      }
    };
    
    updateRelativeTime();
    const interval = setInterval(updateRelativeTime, 1000);
    return () => clearInterval(interval);
  }, [lastUpdate]);

  const getLevel = (value, thresholds) => {
    if (value < thresholds.low) return { class: 'level-low', width: (value / thresholds.max) * 100 };
    if (value < thresholds.medium) return { class: 'level-medium', width: (value / thresholds.max) * 100 };
    return { class: 'level-good', width: (value / thresholds.max) * 100 };
  };

  const getTempStatus = (temp) => {
    if (temp < 15) return 'Frio';
    if (temp < 25) return 'Ideal';
    if (temp < 30) return 'Quente';
    return 'Muito Quente';
  };

  const getSoilStatus = (umidade) => {
    if (umidade < 30) return 'Solo Seco';
    if (umidade < 60) return 'Umidade Adequada';
    return 'Solo Úmido';
  };

  const getPhStatus = (ph) => {
    if (ph < 6.0) return 'Ácido';
    if (ph < 7.5) return 'Neutro - Ideal';
    return 'Alcalino';
  };

  const getTrend = (current, history, key) => {
    if (history.length < 3) return 'stable';
    const recent = history.slice(-3).map(h => h[key]);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    if (current > avg * 1.02) return 'up';
    if (current < avg * 0.98) return 'down';
    return 'stable';
  };

  const umidadeArLevel = getLevel(sensorData.umidadeAr, { low: 40, medium: 60, max: 100 });
  const umidadeSoloLevel = getLevel(sensorData.umidadeSolo, { low: 30, medium: 60, max: 100 });

  const tempTrend = getTrend(sensorData.temperatura, dataHistory, 'temperatura');
  const umidadeArTrend = getTrend(sensorData.umidadeAr, dataHistory, 'umidadeAr');
  const umidadeSoloTrend = getTrend(sensorData.umidadeSolo, dataHistory, 'umidadeSolo');

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <h1>🌿 Dashboard da Horta Inteligente</h1>
          <p className="header-subtitle">Monitoramento em Tempo Real</p>
        </div>
        
        <div className="status-container">
          <div 
            className={`status-badge ${
              connectionStatus === 'Conectado' ? 'connected' : 
              connectionStatus === 'Erro' || connectionStatus === 'Offline' ? 'error' : 
              connectionStatus === 'Reconectando...' ? 'reconnecting' : ''
            }`}
            role="status"
            aria-live="polite"
          >
            <span className="status-indicator" aria-hidden="true"></span>
            <span>Status: <strong>{connectionStatus}</strong></span>
          </div>
          
          {lastUpdate && (
            <div className="last-update">
              <span className="update-icon">🕐</span>
              <span>Atualizado {relativeTime}</span>
            </div>
          )}
        </div>
        
        <div className="dashboard-grid">
          <article className="card card-temperatura" role="region" aria-label="Temperatura">
            <div className="card-header">
              <span className="card-icon" role="img" aria-label="Ícone de temperatura">🌡️</span>
              <h2>Temperatura</h2>
              <span className={`trend-indicator trend-${tempTrend}`}>
                {tempTrend === 'up' ? '↗' : tempTrend === 'down' ? '↘' : '→'}
              </span>
            </div>
            <div className="card-value">
              <p>{sensorData.temperatura.toFixed(1)}</p>
              <span>°C</span>
            </div>
            <div className="card-status" aria-label={`Status: ${getTempStatus(sensorData.temperatura)}`}>
              {getTempStatus(sensorData.temperatura)}
            </div>
            <div className="card-footer">
              <span className="card-label">Ambiente</span>
            </div>
          </article>

          <article className="card card-umidade-ar" role="region" aria-label="Umidade do Ar">
            <div className="card-header">
              <span className="card-icon" role="img" aria-label="Ícone de umidade do ar">💧</span>
              <h2>Umidade do Ar</h2>
              <span className={`trend-indicator trend-${umidadeArTrend}`}>
                {umidadeArTrend === 'up' ? '↗' : umidadeArTrend === 'down' ? '↘' : '→'}
              </span>
            </div>
            <div className="card-value">
              <p>{sensorData.umidadeAr.toFixed(0)}</p>
              <span>%</span>
            </div>
            <div 
              className="level-indicator" 
              role="progressbar" 
              aria-valuenow={sensorData.umidadeAr} 
              aria-valuemin="0" 
              aria-valuemax="100"
              aria-label="Nível de umidade do ar"
            >
              <div className={`level-bar ${umidadeArLevel.class}`} style={{ width: `${umidadeArLevel.width}%` }}></div>
            </div>
            <div className="card-footer">
              <span className="card-label">Atmosfera</span>
            </div>
          </article>

          <article className="card card-umidade-solo" role="region" aria-label="Umidade do Solo">
            <div className="card-header">
              <span className="card-icon" role="img" aria-label="Ícone de umidade do solo">🌱</span>
              <h2>Umidade do Solo</h2>
              <span className={`trend-indicator trend-${umidadeSoloTrend}`}>
                {umidadeSoloTrend === 'up' ? '↗' : umidadeSoloTrend === 'down' ? '↘' : '→'}
              </span>
            </div>
            <div className="card-value">
              <p>{sensorData.umidadeSolo}</p>
              <span>%</span>
            </div>
            <div 
              className="level-indicator" 
              role="progressbar" 
              aria-valuenow={sensorData.umidadeSolo} 
              aria-valuemin="0" 
              aria-valuemax="100"
              aria-label="Nível de umidade do solo"
            >
              <div className={`level-bar ${umidadeSoloLevel.class}`} style={{ width: `${umidadeSoloLevel.width}%` }}></div>
            </div>
            <div className="card-status" aria-label={`Status: ${getSoilStatus(sensorData.umidadeSolo)}`}>
              {getSoilStatus(sensorData.umidadeSolo)}
            </div>
            <div className="card-footer">
              <span className="card-label">Substrato</span>
            </div>
          </article>

          <article className="card card-ph" role="region" aria-label="pH do Solo">
            <div className="card-header">
              <span className="card-icon" role="img" aria-label="Ícone de pH">🧪</span>
              <h2>pH do Solo</h2>
            </div>
            <div className="card-value">
              <p>{sensorData.ph.toFixed(1)}</p>
            </div>
            <div className="ph-scale">
              <div className="ph-marker" style={{ left: `${(sensorData.ph / 14) * 100}%` }}>
                <div className="ph-marker-dot"></div>
              </div>
            </div>
            <div className="card-status" aria-label={`Status: ${getPhStatus(sensorData.ph)}`}>
              {getPhStatus(sensorData.ph)}
            </div>
            <div className="card-footer">
              <span className="card-label">Acidez</span>
            </div>
          </article>

          <article 
            className={`card card-bomba ${sensorData.bomba ? 'bomba-on' : 'bomba-off'}`}
            role="region" 
            aria-label="Bomba de Água"
          >
            <div className="card-header">
              <span className="card-icon" role="img" aria-label="Ícone de bomba">💦</span>
              <h2>Bomba de Água</h2>
            </div>
            <div className="card-value">
              <p>{sensorData.bomba ? 'ON' : 'OFF'}</p>
            </div>
            {sensorData.bomba && (
              <div className="pump-waves">
                <div className="wave"></div>
                <div className="wave"></div>
                <div className="wave"></div>
              </div>
            )}
            <div 
              className="card-status" 
              role="status"
              aria-live="polite"
              aria-label={`Bomba ${sensorData.bomba ? 'ligada' : 'desligada'}`}
            >
              {sensorData.bomba ? '⚡ Sistema Ativo' : '⏸️ Em Espera'}
            </div>
            <div className="card-footer">
              <span className="card-label">Irrigação</span>
            </div>
          </article>
        </div>

        <footer className="dashboard-footer">
          <div className="footer-content">
            <div className="footer-item">
              <span className="footer-icon">📊</span>
              <span>{dataHistory.length} leituras registradas</span>
            </div>
            <div className="footer-item">
              <span className="footer-icon">🌐</span>
              <span>Broker HiveMQ</span>
            </div>
            <div className="footer-item">
              <span className="footer-icon">⚡</span>
              <span>Tempo Real</span>
            </div>
          </div>
        </footer>
      </header>
    </div>
  );
}

export default App;
