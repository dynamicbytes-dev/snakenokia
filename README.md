# 🐍 Nokia Snake Retro (Snake 3310)

Recreación nostálgica y moderna del legendario juego **Snake** del icónico **Nokia 3310**, desarrollado con **React**, **Vite**, **Tailwind CSS** y empaquetado para dispositivos móviles con **Capacitor**.

![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/React-18.3.1-blue.svg)
![Vite](https://img.shields.io/badge/Vite-5.4.8-purple.svg)
![Capacitor](https://img.shields.io/badge/Capacitor-6.2.2-blueviolet.svg)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.13-38bdf8.svg)

---

## 📱 Descripción del Proyecto

Este proyecto rinde homenaje a uno de los juegos más emblemáticos de la historia de la telefonía móvil. Ofrece una experiencia visual y auditiva idéntica a la del teléfono Nokia 3310 original, combinando:

- **Estética Retro Auténtica**: Carcasa mate, marco con bisel, pantalla LCD monocromática en tono verdoso clásico (`#949f76` / `#2d381c`) con textura de scanlines y botones físicos simulados con sombras 3D realistas.
- **Audio 8-Bit Sintetizado**: Efectos de sonido nostálgicos (comer, chocar, movimiento) generados dinámicamente en tiempo real mediante la **Web Audio API** nativa (sin archivos de audio externos).
- **Récords y Persistencia Offline**: Sistema de puntuaciones altas (*Hall of Fame* Top 5) persistido localmente en el dispositivo utilizando **IndexedDB** (`NokiaSnakeDB`).
- **Niveles de Dificultad**:
  - **Fácil**: Velocidad relajada (150 ms/paso, +5 pts).
  - **Normal**: Velocidad clásica (100 ms/paso, +10 pts).
  - **Difícil**: Velocidad acelerada (70 ms/paso, +15 pts).
- **Controles Multiplataforma**:
  - **Teclado (PC)**: Flechas de dirección o teclas `W`, `A`, `S`, `D`. Pausa con `P` o `Escape`.
  - **D-Pad Táctil (Móvil)**: Botones direccionales táctiles ergonómicos con respuesta háptica visual (`active:translate-y-0.5`).
- **Resiliencia Móvil**: Auto-pausa automática si la aplicación se minimiza o si el usuario cambia de pestaña/ventana en el navegador.

---

## 🛠️ Tecnologías Utilizadas

| Tecnología | Propósito |
| :--- | :--- |
| **[React 18](https://react.dev/)** | Interfaz de usuario declarativa basada en componentes y hooks (`useState`, `useEffect`, `useRef`, `useCallback`). |
| **[Vite](https://vitejs.dev/)** | Entorno de desarrollo ultrarrápido y empaquetador para producción. |
| **[Tailwind CSS](https://tailwindcss.com/)** | Estilos utilitarios personalizados con paleta retro Nokia y diseño responsivo. |
| **[Capacitor 6](https://capacitorjs.com/)** | Puente nativo para compilar y ejecutar la aplicación como app nativa en Android. |
| **[Web Audio API](https://developer.mozilla.org/es/docs/Web/API/Web_Audio_API)** | Síntesis acústica de ondas cuadradas y diente de sierra para SFX retro. |
| **[IndexedDB](https://developer.mozilla.org/es/docs/Web/API/IndexedDB_API)** | Base de datos transaccional en el navegador para almacenamiento permanente de puntajes. |

---

## 📂 Estructura del Proyecto

```text
snake/
├── android/                   # Proyecto nativo de Android generado por Capacitor
│   ├── app/                   # Módulo principal de la aplicación Android
│   └── gradlew                # Gradle wrapper para compilación de APK
├── src/
│   ├── services/
│   │   ├── audio.js           # Generador de efectos de sonido con Web Audio API
│   │   └── db.js              # Gestor asíncrono de IndexedDB para puntajes
│   ├── App.jsx                # Componente principal (Lógica del juego, UI y D-pad)
│   ├── index.css              # Estilos base, texturas LCD y utilidades táctiles
│   └── main.jsx               # Punto de entrada de React
├── capacitor.config.json      # Configuración de Capacitor (App ID, nombre, splash)
├── index.html                 # Plantilla HTML con metaetiquetas viewport y tema
├── package.json               # Dependencias y scripts de ejecución
├── tailwind.config.js         # Configuración de temas, colores retro y sombras
└── vite.config.js             # Configuración de Vite con plugin de React
```

---

## 🚀 Instalación y Puesta en Marcha

### Prerrequisitos

- **Node.js** (versión 18 o superior recomendada)
- **npm** o gestor de paquetes de su preferencia
- *(Opcional para Android)*: **Android Studio** y **JDK 17+**

### 1. Clonar el Repositorio

```bash
git clone git@github.com:dynamicbytes-dev/snakenokia.git
cd snakenokia
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Ejecutar en Modo Desarrollo

Inicia el servidor local de Vite con soporte para red local (para probar desde el móvil en la misma red Wi-Fi):

```bash
npm run dev
```

Abre en tu navegador la URL indicada (habitualmente `http://localhost:5173`).

---

## 📱 Compilación para Android (Capacitor)

El proyecto incluye soporte listo para Android a través de Capacitor:

### Sincronizar Cambios Web con Android

Cada vez que realices cambios en el código web (`src/`), compila y sincroniza:

```bash
npm run cap:sync
```

### Abrir en Android Studio

Para depurar, ejecutar en emuladores o conectar un dispositivo físico:

```bash
npm run cap:open
```

### Generar APK de Depuración Directamente

Si tienes configurado el SDK de Android y variables de entorno:

```bash
npm run apk:debug
```

El APK resultante se generará en:
`android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🎮 Controles del Juego

| Acción | Teclado PC | Controles Táctiles (Pantalla) |
| :--- | :--- | :--- |
| **Mover Arriba** | `▲` (Flecha Arriba) / `W` | Botón ▲ del D-pad |
| **Mover Abajo** | `▼` (Flecha Abajo) / `S` | Botón ▼ del D-pad |
| **Mover Izquierda** | `◀` (Flecha Izquierda) / `A` | Botón ◀ del D-pad |
| **Mover Derecha** | `▶` (Flecha Derecha) / `D` | Botón ▶ del D-pad |
| **Pausa / Reanudar** | `P` o `Escape` | Botón superior `PAUSA` |
| **Mutear Sonido** | - | Botón `SFX / MUTE` en la barra superior |

---

## 📜 Scripts Disponibles

En el archivo `package.json`:

- `npm run dev`: Inicia el servidor de desarrollo Vite expuesto a la red local.
- `npm run build`: Genera el bundle optimizado para producción en `dist/`.
- `npm run preview`: Previsualiza localmente el build de producción.
- `npm run cap:add`: Agrega la plataforma Android a Capacitor (ya configurada).
- `npm run cap:sync`: Compila la app web y sincroniza los assets con la carpeta nativa `android/`.
- `npm run cap:open`: Abre el proyecto en Android Studio.
- `npm run apk:debug`: Compila, sincroniza y genera el archivo APK debug mediante Gradle.

---

## 📄 Licencia

Este proyecto está bajo la Licencia [MIT](LICENSE).

---

Desarrollado con ❤️ por [dynamicbytes-dev](https://github.com/dynamicbytes-dev).
