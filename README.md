# Cafecito feliz

Punto de venta para una cafetería. El vendedor busca al cliente por teléfono o correo (o lo registra), arma la orden, el backend calcula el total con el descuento de cliente frecuente y registra la venta descontando el stock. El administrador, además, ve el stock en la caja y tiene la sección **Gestión** para administrar productos, stock y clientes (con su historial de compras).

Todo se guarda en MongoDB a través del backend; el frontend no tiene datos de prueba propios.

## Estructura

- `backend/` — API REST con Express 5 y Mongoose 9 (módulos ES).
- `frontend/` — React 19 con Vite y React Router. Pruebas end-to-end con Cypress.

## Requisitos

- Node.js 22 o superior (incluye npm).
- MongoDB corriendo en local (por defecto en `mongodb://127.0.0.1:27017`).

## Puesta en marcha

### 1. Backend

```bash
cd backend
npm install
```

Crea el archivo `backend/.env` a partir de `backend/.env.example`:

```env
PORT=3000
NODE_ENV=development
DB_CONNECTION_STRING=mongodb://127.0.0.1:27017/cafecito-feliz-db
```

Carga los datos de ejemplo (usuarios, productos y clientes):

```bash
npm run seed
```

> **Cuidado:** `npm run seed` **borra todo el contenido** de la base de datos indicada en `DB_CONNECTION_STRING` (productos, clientes, ventas y usuarios) antes de cargar los datos de ejemplo.

Levanta la API con nodemon (se reinicia sola al guardar cambios):

```bash
npm run dev
```

La API queda en `http://localhost:3000/api` (puedes comprobarla en `http://localhost:3000/api/health`).

### 2. Frontend

En otra terminal:

```bash
cd frontend
npm install
```

Crea el archivo `frontend/.env` a partir de `frontend/.env.example`:

```env
VITE_API_URL=http://localhost:3000/api
```

Levanta la aplicación:

```bash
npm run dev
```

Abre `http://127.0.0.1:5173`.

## Usuarios de prueba

| Rol           | Usuario    | Contraseña    | Qué puede hacer                                                                 |
| ------------- | ---------- | ------------- | ------------------------------------------------------------------------------- |
| Vendedor      | `vendedor` | `cafecito123` | Buscar y registrar clientes, vender. Solo ve los productos con stock.            |
| Administrador | `admin`    | `admin123`    | Todo lo anterior, ve el stock y los agotados, y entra a **Gestión**.             |

Clientes de ejemplo: María López (`449 123 4567`, `maria.lopez@correo.com`, 12 compras, 10 % de descuento), Carlos Ruiz (`carlos.ruiz@correo.com`) y Ana Torres (`449 555 0199`).

Descuento de cliente frecuente: 5 % desde 5 compras, 10 % desde 10 y 15 % desde 20.

## Pruebas end-to-end (Cypress)

Las pruebas usan la base de datos real: cada archivo ejecuta el seed, así que **borran los datos** de la base configurada en `backend/.env`.

1. Deja corriendo el backend (`npm run dev` en `backend/`) y el frontend (`npm run dev` en `frontend/`).
2. En otra terminal:

```bash
cd frontend
npm run test:e2e
```

Para abrir la interfaz de Cypress: `npm run cy:open`.

> **Terminal de VS Code:** VS Code define la variable `ELECTRON_RUN_AS_NODE`, que impide que Cypress arranque. Si ves un error al iniciarlo, quítala antes de correr las pruebas:
>
> - Bash / Git Bash: `unset ELECTRON_RUN_AS_NODE`
> - PowerShell: `Remove-Item Env:ELECTRON_RUN_AS_NODE`

## Otros comandos del frontend

- `npm run lint` — revisa el código con oxlint.
- `npm run build` — genera la versión de producción en `frontend/dist`.
