# Cafecito feliz

## ¿Qué es el proyecto?

Punto de venta para una cafetería. El vendedor busca al cliente por teléfono o correo (o lo registra), arma la orden, el backend calcula el total con el descuento de cliente frecuente y registra la venta descontando el stock. El administrador, además, ve el stock en la caja y tiene la sección **Gestión** para administrar productos, stock y clientes (con su historial de compras).

Todo se guarda en MongoDB a través del backend; el frontend no tiene datos de prueba propios.

- `backend/` — API REST con Express 5 y Mongoose 9 (módulos ES). Login con contraseñas hasheadas (scrypt) y token JWT.
- `frontend/` — React 19 con Vite y React Router. Pruebas end-to-end con Cypress.

Guías de estudio: [GUIA-BACKEND.md](GUIA-BACKEND.md) y [GUIA-FRONTEND.md](GUIA-FRONTEND.md).

### Requisitos

- Node.js 22 o superior (incluye npm).
- MongoDB corriendo en local (por defecto en `mongodb://127.0.0.1:27017`).

## ¿Dónde configurar las variables?

Cada parte tiene su propio archivo `.env`, que **no se sube a GitHub**. Créalo copiando el `.env.example` que está en la misma carpeta y ajusta los valores:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### `backend/.env`

| Variable               | Ejemplo                                           | Para qué sirve                                                          |
| ---------------------- | ------------------------------------------------- | ----------------------------------------------------------------------- |
| `PORT`                 | `3000`                                            | Puerto donde escucha la API.                                            |
| `NODE_ENV`             | `development`                                     | Entorno de ejecución.                                                   |
| `DB_CONNECTION_STRING` | `mongodb://127.0.0.1:27017/cafecito-feliz-db`     | Conexión a MongoDB (servidor y nombre de la base).                      |
| `JWT_SECRET`           | `una-cadena-larga-y-aleatoria`                    | Firma los tokens de sesión. **Obligatoria:** sin ella la API no arranca. |

Genera un `JWT_SECRET` seguro con:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### `frontend/.env`

| Variable       | Ejemplo                     | Para qué sirve                                   |
| -------------- | --------------------------- | ------------------------------------------------ |
| `VITE_API_URL` | `http://localhost:3000/api` | URL base de la API a la que llama el frontend.   |

> En Vite solo llegan al navegador las variables que empiezan con `VITE_` (equivalente al prefijo `REACT_APP_` de Create React App). Si cambias el `.env`, reinicia `npm run dev`.

## ¿Cómo levantar el backend?

```bash
cd backend
npm install
```

Con el `backend/.env` ya creado (ver arriba), carga los datos de ejemplo (usuarios, productos y clientes):

```bash
npm run seed
```

> **Cuidado:** `npm run seed` **borra todo el contenido** de la base de datos indicada en `DB_CONNECTION_STRING` (productos, clientes, ventas y usuarios) antes de cargar los datos de ejemplo.

Levanta la API con nodemon (se reinicia sola al guardar cambios):

```bash
npm run dev
```

La API queda en `http://localhost:3000/api` (puedes comprobarla en `http://localhost:3000/api/health`). Para correrla sin nodemon usa `npm start`.

## ¿Cómo levantar el frontend?

Con el backend corriendo, en otra terminal:

```bash
cd frontend
npm install
```

Con el `frontend/.env` ya creado (ver arriba), levanta la aplicación:

```bash
npm run dev
```

Abre `http://127.0.0.1:5173`.

Otros comandos:

- `npm run lint` — revisa el código con oxlint.
- `npm run build` — genera la versión de producción en `frontend/dist`.
- `npm run preview` — sirve localmente la versión generada con `build`.

### Usuarios de prueba

| Rol           | Usuario    | Contraseña    | Qué puede hacer                                                       |
| ------------- | ---------- | ------------- | --------------------------------------------------------------------- |
| Vendedor      | `vendedor` | `cafecito123` | Buscar y registrar clientes, vender. Solo ve los productos con stock. |
| Administrador | `admin`    | `admin123`    | Todo lo anterior, ve el stock y los agotados, y entra a **Gestión**.  |

Clientes de ejemplo: María López (`449 123 4567`, `maria.lopez@correo.com`, 12 compras, 10 % de descuento), Carlos Ruiz (`carlos.ruiz@correo.com`) y Ana Torres (`449 555 0199`).

Descuento de cliente frecuente: 5 % desde 5 compras, 10 % desde 10 y 15 % desde 20.

### Pruebas end-to-end (Cypress)

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

## ¿Dónde reportar errores?

Reporta los errores en la sección **Issues** del repositorio: <https://github.com/BurlyAxe/Cafecito-Feliz/issues>.

Antes de abrir uno, revisa que no exista ya un issue igual. Para que sea fácil reproducirlo, incluye:

- Qué hiciste (pasos), qué esperabas que pasara y qué pasó en realidad.
- Con qué usuario estabas (vendedor o administrador).
- El mensaje de error de la consola del navegador o de la terminal del backend, si lo hay.
- Tu sistema operativo y versión de Node.js (`node -v`).

**No pegues** el contenido de tus archivos `.env` (en especial `JWT_SECRET`) ni contraseñas reales en el issue.
