# Autos Colombia - Gestion Operativa de Parqueadero

Aplicacion full-stack para operar parqueadero por mensualidad con:

- Registro de entrada y salida de vehiculos.
- Registro de usuarios y vehiculos.
- Gestion de 100 celdas.
- Registro de novedades por vehiculo.
- Registro de pagos mensuales y pagos en salida.
- Dashboard visual operativo inspirado en la interfaz solicitada.

## Stack Tecnologico

- Backend: Node.js + Express
- ORM: Sequelize
- Base de datos: SQLite (`sqlite3`)
- Frontend: HTML + CSS + JavaScript (SPA ligera)
- Testing: `node:test` + `supertest`

## Arquitectura

- `src/models/*.model.js`: modelos ORM por entidad.
- `src/services/*.service.js`: logica de negocio por modulo.
- `src/controllers/*.controller.js`: capa HTTP desacoplada de persistencia.
- `src/routes/*.routes.js`: definicion de endpoints.
- `src/config/bootstrap.js`: inicializacion de esquema y seed de 100 celdas.
- `src/middlewares/error.middleware.js`: manejo de errores consistente para toda la API.
- `public/*`: interfaz operativa consumiendo API real.
- `test/api.test.js`: pruebas de integracion end-to-end API.
- `scripts/manual-test-endpoints.ps1`: prueba manual automatizada de todos los endpoints.

## Instalacion

```bash
npm install
```

## Ejecutar Proyecto

```bash
npm run dev
```

Aplicacion web: `http://localhost:3000`

## Ejecutar Pruebas Automatizadas

```bash
npm test
```

## Pruebas Manuales de Endpoints

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\manual-test-endpoints.ps1
```

## Despliegue en Render (desde GitHub)

Este repo incluye `render.yaml` para crear el servicio automaticamente.

1. En Render, crea un nuevo servicio usando **Blueprint** y conecta este repositorio.
2. Render detectara `render.yaml` y creara un Web Service Node con:
   - `startCommand`: `npm start`
   - Health check: `/api/v1/health`
   - Disco persistente montado en `/var/data`
   - `DB_PATH=/var/data/parking.db`
3. Haz deploy y espera estado **Live**.
4. Valida:
   - `GET /api/v1/health`
   - apertura de la raiz `/` para la interfaz web.

Notas:
- Para SQLite en produccion necesitas disco persistente. En Render esto requiere plan con disk (no Free).
- No definas `PORT`; Render lo inyecta automaticamente.

## Endpoints Principales

- `GET /api/v1/health`
- `POST|GET|PUT /api/v1/users`
- `POST|GET|PUT /api/v1/vehicles`
- `GET|PUT /api/v1/cells`
- `POST /api/v1/stays/entry`
- `POST /api/v1/stays/exit`
- `GET /api/v1/stays/active`
- `GET /api/v1/stays/history`
- `POST|GET /api/v1/incidents`
- `POST|GET /api/v1/payments`
