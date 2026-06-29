# CryptoApp — Front-End (React + TypeScript)

Cliente web de **CryptoApp**, una aplicación académica de **simulación de trading de
criptomonedas**. Este repositorio contiene exclusivamente la **SPA** (Single Page Application):
una interfaz construida con **React 19 + TypeScript + Vite + Tailwind CSS** que consume la API
REST del back-end.

> El servidor (API REST en .NET con arquitectura hexagonal) vive en un repositorio separado:
> **[crypto_app_back_end](https://github.com/Juliam78/crypto_app_back_end)**.

---

## 🎯 Propósito

Ofrecer la experiencia de usuario completa de la simulación de trading:

- **Autenticación** — inicio de sesión y registro, con persistencia de sesión.
- **Mercado** — tabla de criptomonedas con precios en tiempo real (refresco por *polling*).
- **Detalle y trading** — gráfico de la moneda, formulario de compra/venta con validaciones y
  cantidad estimada.
- **Historial** — movimientos del usuario con cálculo de PnL realizado.
- **Perfil** — edición de datos y carga de avatar.
- **Administración** — gestión de usuarios/roles y consulta de errores registrados.

La SPA es **delgada**: delega la lógica pesada (caché de precios, tokens, persistencia) al
back-end y se centra en presentación, validación en cliente y estado de la interfaz.

---

## 🧰 Tecnologías

- **React 19** + **React DOM**
- **TypeScript** (modo estricto: `noUnusedLocals`, `noUnusedParameters`, sin `any`)
- **Vite** — build tool y servidor de desarrollo
- **Tailwind CSS 4** (vía `@tailwindcss/vite`, sin PostCSS)
- **React Router** — enrutamiento SPA sin recarga del navegador
- **react-hook-form** + **Zod** — formularios y validación de esquemas en cliente

---

## 🗂️ Estructura del repositorio

```
crypto_app_front_end/
├── src/
│   ├── app/
│   │   └── App.tsx              # Composición de rutas y estado global
│   ├── features/               # Organización por dominio
│   │   ├── auth/               # LoginScreen
│   │   ├── market/             # MarketView, DetailView, TradingViewWidget
│   │   ├── history/            # HistoryView
│   │   ├── profile/            # ProfileView
│   │   └── admin/              # ErrorsView, UsersAdminView
│   ├── lib/                    # Lógica pura y utilidades
│   │   ├── api.ts              # Cliente HTTP centralizado (fetch + manejo de errores)
│   │   ├── session.ts          # Sesión en localStorage (token Bearer)
│   │   ├── portfolio.ts        # Cálculo de costo promedio y PnL realizado
│   │   ├── trade.ts            # Construcción de cotizaciones de trade
│   │   ├── format.ts           # Formato de dinero/fechas (Intl)
│   │   └── validation.ts       # Esquemas Zod
│   ├── services/               # Capa de servicios (abstracción de la API)
│   │   ├── storage.ts          # Auth, usuarios, movimientos, errores
│   │   └── coingecko.ts        # Datos de mercado
│   ├── components/shared/      # NavLink/NavButton, Toast, Avatar, Skeleton, Metric
│   ├── shared/types.ts         # Interfaces TS compartidas (AppUser, Coin, Movement)
│   ├── main.tsx                # Punto de entrada
│   └── index.css               # Tailwind + estilos globales
├── .env                        # VITE_API_URL
├── vite.config.ts
├── tsconfig*.json
└── .gitignore
```

---

## 🧩 Patrones y decisiones de diseño

- **Organización por *features*** — cada dominio (auth, market, history, profile, admin) agrupa
  sus vistas; `lib/` contiene lógica pura y `services/` la comunicación con la API.
- **Enrutamiento con React Router** — navegación declarativa por rutas, con protección de las
  vistas de administración según el rol del usuario.
- **Cliente HTTP centralizado** (`lib/api.ts`) — todas las peticiones pasan por `apiFetch`, que
  serializa JSON, adjunta el token y normaliza errores (`ApiError` con código de estado).
- **Consumo de API con `async/await` + `try/catch`** — manejo de errores explícito en los
  servicios.
- **Tipado fuerte** — interfaces TypeScript para todas las respuestas del backend; se evita `any`.
- **Validación en cliente** — `react-hook-form` + `Zod` validan los formularios antes de enviar.
- **Estado y ciclo de vida** — `useState` para estado local y `useEffect` para cargas iniciales
  y *polling* de precios.
- **Cálculos en cliente** — el portafolio y el PnL realizado se derivan de los movimientos.

---

## ▶️ Cómo ejecutar

### Requisitos
- [Node.js](https://nodejs.org/) (LTS recomendado)
- El back-end **[crypto_app_back_end](https://github.com/Juliam78/crypto_app_back_end)** en
  ejecución.

### Pasos

```bash
# 1. Clonar
git clone https://github.com/Juliam78/crypto_app_front_end.git
cd crypto_app_front_end

# 2. Instalar dependencias
npm install

# 3. Configurar la URL del back-end en .env
#    VITE_API_URL=http://localhost:5243

# 4. Levantar el servidor de desarrollo
npm run dev        # http://localhost:5173
```

### Scripts disponibles
| Comando | Acción |
|---------|--------|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Verificación de tipos (`tsc -b`) + build de producción |
| `npm run preview` | Previsualización local del build |
| `npm run lint` | Análisis estático con ESLint |

---

## 🔗 Comunicación con el back-end

- La SPA apunta al back-end mediante la variable de entorno **`VITE_API_URL`** (`.env`).
- La autenticación usa **token Bearer** guardado en `localStorage`; al refrescar la página la
  sesión se restaura con `GET /api/auth/me`.
- Contratos esperados desde la API: `id` como **string**, rol `"admin"`/`"user"`, tipo de
  movimiento `"buy"`/`"sell"`, fechas en **ISO 8601**.
