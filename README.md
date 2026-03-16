# Caelis Web — Progressive Web App

Repositorio **privado** — PWA instalable de Caelis Engine con lectura IA del Atacir.

Motor astronómico: [HermeticaLabs/caelis-engine](https://github.com/HermeticaLabs/caelis-engine) (público)

---

## Diferencia con el monolito y el APK

| | Monolito / APK | Webapp (este repo) |
|---|---|---|
| Base | `caelis_engine_1_5.html` idéntico | Fork del monolito con extensiones |
| Offline | ✅ Total | Motor offline, IA requiere conexión |
| Lectura IA | ❌ No | ✅ Sí — via Cloudflare Worker |
| Plataforma | Web + Android | iOS + desktop + Android |
| Sync | Copia exacta | Solo motor matemático |

**Regla fundamental:** el monolito y el APK son siempre idénticos.
La webapp comparte el motor pero tiene una capa IA que ellos no tienen.

---

## Estructura

```
caelis-web/
├── public/
│   ├── index.html          ← monolito extendido (base = caelis_engine_1_5.html)
│   ├── manifest.json       ← PWA config iOS/desktop
│   ├── sw.js               ← service worker
│   └── assets/
│       └── icons/          ← icon-192.png, icon-512.png
├── worker/
│   └── index.js            ← Cloudflare Worker proxy API Anthropic
├── package.json
└── .gitignore
```

---

## Requisitos

- Node.js v24+
- Cuenta Cloudflare (gratis) para el Worker
- API key de Anthropic (variable de entorno — nunca en el código)

---

## Flujo de trabajo

### Sincronizar motor desde caelis-engine
```powershell
npm run sync
```

### Desarrollo local
```powershell
npm run dev
```

### Deploy del Worker (cuando esté listo)
```powershell
npm run worker:deploy
```

---

## Instalación como PWA

**iOS (Safari):**
1. Abrir la URL en Safari
2. Botón compartir → "Añadir a pantalla de inicio"

**Android (Chrome):**
1. Abrir la URL en Chrome
2. Banner automático o menú → "Instalar app"

**Desktop (Chrome/Edge):**
1. Ícono de instalación en la barra de direcciones

---

*© 2024–2026 Cristian Valeria Bravo / Hermetica Labs — Privado*
