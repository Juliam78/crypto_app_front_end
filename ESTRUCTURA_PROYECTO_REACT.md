# CryptoAppProject

CryptoAppProject es una aplicacion academica para consultar precios de criptomonedas, simular compras y ventas en dolares, registrar movimientos por usuario y administrar informacion basica de usuarios, errores y operaciones.

El proyecto esta construido con React, TypeScript, Vite, Tailwind CSS, Supabase, React Hook Form y Zod. Consume datos de mercado desde CoinGecko y usa Supabase como backend para usuarios, precios, movimientos, errores y avatares.

## Que Hace El Proyecto

La aplicacion permite:

- Iniciar sesion y registrar usuarios.
- Consultar el top de criptomonedas usando CoinGecko.
- Ver detalle de una moneda y grafico externo con TradingView.
- Comprar o vender cripto usando montos en USD.
- Convertir el monto USD a cantidad de cripto segun el precio actual.
- Validar ventas contra el balance disponible.
- Consultar historial de movimientos.
- Calcular ganancia o perdida realizada en ventas.
- Administrar usuarios desde una vista de administrador.
- Registrar errores de la aplicacion para revision.
- Subir avatar de usuario a Supabase Storage.

La aplicacion trabaja solo con USD para reducir complejidad contable y evitar inconsistencias entre monedas.

## Tecnologias Usadas

### React

Se usa para construir la interfaz por componentes.

Ventajas:

- Permite dividir la UI en piezas reutilizables.
- Encaja bien con formularios, estados y vistas condicionales.
- Tiene ecosistema amplio.

Desventajas:

- Si no se separan responsabilidades, componentes como `App.tsx` pueden crecer demasiado.
- El manejo manual de estado asincrono puede volverse repetitivo sin una libreria de cache.

Decision:

React es adecuado porque la app tiene varias vistas interactivas: mercado, detalle, historial, perfil y administracion.

### TypeScript

Se usa para tipar entidades como usuarios, monedas, movimientos, roles y formularios.

Ventajas:

- Reduce errores por contratos inconsistentes.
- Ayuda al refactorizar carpetas e imports.
- Hace mas clara la comunicacion entre servicios, componentes y librerias.

Desventajas:

- Exige mantener tipos sincronizados con Supabase y APIs externas.
- Puede agregar friccion inicial si los contratos cambian rapido.

Decision:

TypeScript aporta seguridad en una app donde hay calculos financieros, roles y respuestas externas.

### Vite

Se usa como herramienta de desarrollo y build.

Ventajas:

- Arranque rapido del servidor local.
- Build simple para aplicaciones React.
- Buena integracion con TypeScript y Tailwind.

Desventajas:

- El build actual muestra advertencia de chunk mayor a 500 kB.
- Para escalar, conviene aplicar code splitting por vistas.

Decision:

Vite es suficiente y practico para este alcance academico.

### Tailwind CSS

Se usa para estilos directamente en componentes mediante clases utilitarias.

Ventajas:

- Rapido para construir interfaces sin crear muchos archivos CSS.
- Facil mantener consistencia visual con clases repetibles.
- Evita CSS global excesivo.

Desventajas:

- Las clases pueden hacer que el JSX sea largo.
- Si se repiten patrones visuales, conviene extraer componentes compartidos.

Decision:

Tailwind permite avanzar rapido y mantener la UI dentro de cada componente. Los elementos reutilizables viven en `src/components/shared`.

### Supabase

Se usa como backend para:

- Usuarios.
- Movimientos de compra y venta.
- Precios guardados.
- Logs de errores.
- Storage de avatares.
- Funciones RPC para operaciones sensibles.

Ventajas:

- Reduce la necesidad de crear un backend desde cero.
- Incluye base de datos PostgreSQL, Storage y RPC.
- Facil integracion desde frontend.

Desventajas:

- Usar Supabase directo desde frontend requiere mucho cuidado con politicas RLS.
- Las reglas sensibles no deben depender solo del cliente.
- El esquema debe mantenerse sincronizado con el codigo.

Decision:

Supabase se eligio por rapidez y porque permite persistencia real. Las operaciones de cambio de rol y registro de trades se movieron a RPC para no construir datos sensibles completamente desde el cliente.

### CoinGecko

Se usa para obtener precios y datos de mercado de criptomonedas.

Ventajas:

- API publica conocida para informacion cripto.
- Permite obtener precios, volumen, capitalizacion y variacion 24h.

Desventajas:

- Puede fallar por rate limits o problemas de red.
- El precio consultado desde cliente puede cambiar entre consulta y operacion.

Decision:

CoinGecko es una buena fuente para una app academica. El proyecto implementa reintentos incrementales en `src/services/coingecko.ts`.

### React Hook Form

Se usa para formularios de login, registro, perfil y trade.

Ventajas:

- Manejo eficiente de formularios.
- Menos renders que formularios totalmente controlados.
- Buena integracion con validaciones.

Desventajas:

- Algunas APIs como `watch` requieren cuidado con hooks y memoizacion.
- La logica puede mezclarse en componentes si no se extraen helpers.

Decision:

Se usa porque los formularios son simples pero necesitan validacion clara y buen rendimiento.

### Zod

Se usa para definir esquemas de validacion.

Ventajas:

- Permite validar datos de entrada.
- Genera tipos TypeScript desde los schemas.
- Centraliza reglas de formularios.

Desventajas:

- Si se duplica validacion en cliente y servidor, hay que mantener ambas.
- No reemplaza validaciones server-side.

Decision:

Los schemas compartidos estan en `src/lib/validation.ts` para mantener validaciones consistentes en la UI.

## Estructura Actual

```txt
src/
  app/
    App.tsx
    types.ts
  components/
    shared/
      index.tsx
  features/
    admin/
      AdminViews.tsx
    auth/
      LoginScreen.tsx
    history/
      HistoryView.tsx
    market/
      DetailView.tsx
      MarketView.tsx
      TradingViewWidget.tsx
    profile/
      ProfileView.tsx
    index.ts
  lib/
    auth.ts
    format.ts
    portfolio.ts
    supabase.ts
    trade.ts
    validation.ts
  services/
    coingecko.ts
    storage.ts
  shared/
    types.ts
  index.css
  main.tsx
supabase/
  schema.sql
```

## Criterio De Ubicacion

### `src/app`

Contiene el ensamblaje principal de la aplicacion.

- `App.tsx`: maneja estado global local, seleccion de vista, carga de datos y coordinacion entre servicios y componentes.
- `types.ts`: tipos propios de la capa de app, como `View`, `Toast` y `TradeResult`.

Decision:

`App.tsx` no debe contener componentes grandes ni logica pura compleja. Por eso las vistas viven en `features/` y los calculos en `lib/`.

### `src/features`

Agrupa funcionalidades de negocio.

- `auth`: pantalla de login/registro.
- `market`: mercado, detalle de moneda y widget de TradingView.
- `history`: historial de movimientos.
- `profile`: perfil de usuario.
- `admin`: vistas administrativas de usuarios y errores.

Decision:

Se usa organizacion por feature porque escala mejor que tener todos los componentes juntos. Si en el futuro se elimina o cambia una funcionalidad, el impacto queda mas localizado.

### `src/components/shared`

Contiene componentes visuales reutilizables que no pertenecen a una feature concreta.

Ejemplos:

- `NavButton`
- `ToastMessage`
- `Avatar`
- `Skeleton`
- `Metric`

Decision:

Solo se colocan aqui componentes genericos. Si un componente conoce reglas de mercado, usuario, trade o historial, debe vivir en una feature.

### `src/lib`

Contiene utilidades, integraciones base y logica pura reutilizable.

- `auth.ts`: hashing de contrasenas con Web Crypto.
- `format.ts`: formato de moneda y fechas.
- `portfolio.ts`: calculo de PnL y costo promedio.
- `supabase.ts`: cliente base de Supabase.
- `trade.ts`: calculos de cotizacion y disponibilidad.
- `validation.ts`: schemas Zod y tipos derivados.

Decision:

`lib/` no debe ser una carpeta para cualquier cosa. Se usa para piezas compartidas, puras o de infraestructura base.

### `src/services`

Contiene acceso a datos externos.

- `coingecko.ts`: consumo de CoinGecko.
- `storage.ts`: operaciones con Supabase, usuarios, movimientos, precios, errores y avatares.

Decision:

Los componentes no llaman directamente a Supabase ni a CoinGecko. Esa responsabilidad queda en servicios.

### `src/shared`

Contiene tipos compartidos por todo el proyecto.

- `types.ts`: entidades globales como `AppUser`, `Coin`, `Movement`, `Currency`, `Role`.

Decision:

Los tipos transversales no viven dentro de una feature para evitar dependencias circulares.

### `supabase`

Contiene el esquema SQL.

- Tablas: `app_users`, `crypto_prices`, `movements`, `app_errors`.
- Storage bucket: `avatars`.
- Funciones RPC:
  - `set_user_role`
  - `register_trade_movement`

Decision:

Las operaciones sensibles se trasladaron parcialmente a RPC para reducir manipulacion desde cliente.

## Toma De Decisiones

### 1. Trabajar Solo Con USD

Se elimino soporte de EUR y otras monedas.

Ventajas:

- Reduce errores contables.
- Simplifica historiales y PnL.
- Evita mezclar balances en distintas monedas.

Desventajas:

- Menos flexible para usuarios internacionales.
- Si se requiere multimoneda, habra que introducir conversiones y normalizacion.

### 2. Organizacion Por Feature

Se prefirio `features/` en lugar de dejar todos los componentes en `components/`.

Ventajas:

- Mejor separacion por responsabilidad.
- Menos acoplamiento entre pantallas.
- Escala mejor cuando crecen las funcionalidades.

Desventajas:

- Puede parecer mas compleja para proyectos pequenos.
- Requiere disciplina para ubicar archivos correctamente.

### 3. Servicios Separados De Componentes

Los servicios encapsulan llamadas externas.

Ventajas:

- Componentes mas faciles de leer.
- Menor acoplamiento con Supabase y CoinGecko.
- Facilita cambiar proveedores en el futuro.

Desventajas:

- Agrega una capa adicional.
- Si los servicios crecen mucho, habra que dividirlos en repositorios por dominio.

### 4. Validacion Con Zod

Los formularios validan con schemas centralizados.

Ventajas:

- Reglas declarativas.
- Tipos derivados desde los schemas.
- Menos validaciones duplicadas en componentes.

Desventajas:

- No reemplaza validacion en base de datos o backend.
- Si una regla vive tambien en SQL/RPC, hay que mantener coherencia.

### 5. RPC Para Operaciones Sensibles

El cambio de rol y el registro de trades usan funciones SQL.

Ventajas:

- Evita que el cliente construya completamente datos sensibles.
- Permite validar saldo y rol cerca de la base de datos.
- Mejora consistencia de operaciones.

Desventajas:

- Aumenta dependencia con Supabase/PostgreSQL.
- La logica de negocio queda repartida entre frontend y SQL.

### 6. Hash De Contrasena

Se reemplazo el almacenamiento de contrasenas planas por `password_hash`.

Ventajas:

- Evita guardar contrasenas directamente.
- Reduce riesgo frente a lectura accidental de datos.

Desventajas:

- SHA-256 en cliente es una mejora academica, pero no reemplaza autenticacion real.
- Para produccion deberia usarse Supabase Auth o hashing server-side con sal y algoritmo especializado.

## Ventajas Del Diseno Actual

- Separacion clara entre app, features, servicios, shared y lib.
- Menor concentracion de codigo en `App.tsx`.
- Tipado centralizado de entidades.
- Validaciones reutilizables.
- Operaciones de trade mas seguras que una insercion directa desde UI.
- Uso de USD unico simplifica calculos.
- Build y lint pasan correctamente.

## Desventajas Y Riesgos Actuales

- Las politicas RLS siguen permisivas y deben endurecerse antes de produccion.
- No hay tests unitarios ni de integracion.
- La autenticacion sigue siendo academica; lo ideal es Supabase Auth.
- `storage.ts` concentra muchas responsabilidades de Supabase y podria dividirse.
- El chunk principal supera 500 kB y conviene aplicar lazy loading.
- El precio de CoinGecko puede cambiar entre lectura y operacion.
- Algunas validaciones existen tanto en cliente como en RPC, lo que exige mantenerlas sincronizadas.

## Mejoras Futuras Recomendadas

1. Endurecer politicas RLS.
2. Migrar autenticacion a Supabase Auth.
3. Dividir `storage.ts` en repositorios:
   - `userRepository.ts`
   - `movementRepository.ts`
   - `priceRepository.ts`
   - `errorRepository.ts`
   - `avatarRepository.ts`
4. Crear hooks de aplicacion:
   - `useAuth`
   - `useMarketData`
   - `useMovements`
   - `useTrade`
   - `useAdminData`
5. Agregar React Router si las vistas deben tener URLs reales.
6. Agregar TanStack Query para cache, reintentos y estado de servidor.
7. Agregar tests unitarios para `portfolio.ts`, `trade.ts` y `validation.ts`.
8. Agregar tests de integracion para compra, venta, roles y login.
9. Aplicar code splitting por feature para reducir el chunk inicial.
10. Crear migraciones SQL versionadas en lugar de un unico `schema.sql`.

## Regla Practica Para Nuevos Archivos

- Pantalla o componente de una funcionalidad: `src/features/<feature>/`.
- Componente visual reutilizable: `src/components/shared/`.
- Tipo global: `src/shared/types.ts`.
- Validacion compartida: `src/lib/validation.ts`.
- Logica pura compartida: `src/lib/`.
- Cliente o integracion base: `src/lib/`.
- Acceso a API externa o Supabase: `src/services/`.
- Ensamblaje general de la app: `src/app/`.

Esta estructura busca mantener el proyecto entendible, escalable y con responsabilidades claras sin sobredisenar mas de lo necesario para su alcance actual.
