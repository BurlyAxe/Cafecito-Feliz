# Cafecito Feliz — Guía del frontend

La caja de la cafetería: el vendedor inicia sesión, busca al cliente (o lo registra), arma
la orden tocando productos y cobra. El administrador además ve el stock y entra a
**Gestión** para administrar productos y clientes.

**Stack:** React 19 + Vite 8 + React Router 7. Pruebas end-to-end con Cypress 13. Sin
librerías de UI, sin Redux, sin axios: `fetch`, Context y CSS propio.

---

## 1. Vite, explicado desde Create React App

Vite hace lo mismo que `react-scripts` de CRA, pero con la configuración a la vista y un
servidor de desarrollo que no empaqueta nada: le sirve al navegador los módulos tal cual,
así que arranca al instante. CRA está deprecado desde 2025; Vite es el reemplazo estándar.

| Concepto | En CRA | En este proyecto (Vite) |
|---|---|---|
Levantar en desarrollo | `npm start` | `npm run dev` |
Puerto | 3000 | 5173 (fijo, con `strictPort`) |
Build de producción | `npm run build` → `build/` | `npm run build` → `dist/` |
Probar el build | `npx serve -s build` | `npm run preview` |
El HTML | `public/index.html` | `index.html` **en la raíz** de `frontend/` |
Entrada de JS | `src/index.js` | `src/main.jsx` |
Variable de entorno | `REACT_APP_API_URL` | `VITE_API_URL` |
Leerla | `process.env.REACT_APP_API_URL` | `import.meta.env.VITE_API_URL` |
Configuración | escondida en webpack; para verla, `eject` | `vite.config.js`, 8 líneas |
SVG | `import { ReactComponent as Cup } from './cup.svg'` | `import.meta.glob('./svg/*.svg', { query: '?raw' })` |
JSX | funciona en `.js` | tiene que estar en `.jsx` |
Lint | ESLint dentro de `react-scripts` | `oxlint` (`npm run lint`) |
Router | `react-router-dom` | `react-router` (la v7 unificó los paquetes) |
Proxy al backend | `"proxy"` en `package.json` | no hace falta: el backend tiene `cors()` |

**El `index.html` en la raíz** es la entrada de Vite: en CRA webpack inyectaba el script
en `public/index.html`; acá está escrito (`<script type="module" src="/src/main.jsx">`).
**El puerto 5173** tiene una ventaja concreta: el backend usa el 3000, y con CRA los dos
pelearían por el mismo puerto. **Las variables de entorno** se comportan igual que en CRA:
solo se exponen las del prefijo, se **pegan en el bundle al compilar** (no son secretas) y
si cambiás el `.env` reiniciás el servidor. Se leen en un solo lugar, `client.js`:
`import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'`.

---

## 2. Estructura de carpetas

```
frontend/
  index.html             entrada de Vite (en CRA: public/index.html)
  vite.config.js         config del dev server
  cypress.config.js      config de Cypress + tarea resetDb
  cypress/e2e/           7 specs, 61 pruebas
  src/
    main.jsx             createRoot + StrictMode + CSS globales
    App.jsx              las rutas
    Api/                 TODO lo que habla con el backend
    Components/          reutilizables, una carpeta por componente
      Icons/             Icon.jsx + svg/ con 13 iconos
    Pages/               una carpeta por pantalla, con sus piezas privadas
    Styles/              variables.css, global.css, components/, pages/
```

| Carpeta | Qué va | Qué NO va |
|---|---|---|
`Api/` | `fetch`, sesión, traducción de errores, formatos de plata y teléfono, validaciones, constantes, y `useCatalog`, el hook que carga el catálogo para la caja y Gestión | JSX |
`Components/` | lo que usa más de una pantalla o no sabe nada del negocio (`Button`, `Modal`, `CartPanel`) | llamadas al backend |
`Pages/` | la pantalla y lo que solo ella usa (`cartReducer.js`, `CheckoutModal.jsx`, `useCartQuote.js`) | piezas que otra pantalla necesite |

**¿Por qué `useCatalog` está en `Api/` si es un hook?** Lo usan dos pantallas (la caja y
Gestión → Productos), así que no puede vivir dentro de una. Tampoco es un componente: no
tiene JSX. Lo que hace es pedirle el catálogo al backend y guardar la respuesta, y eso es
justo lo que va en `Api/`. Antes había dos copias casi idénticas (`useCatalog` en la caja
y `useProducts` en Gestión); ahora es uno con la opción `includeOutOfStock`.
`Styles/` | un `.css` por componente o página + variables | colores (todavía; ver sección 10) |

**La regla de oro:** ningún componente llama a `fetch`. Todos pasan por `Api/`, y `Api/`
pasa por una sola función, `request()`. Si mañana cambia la URL o la autenticación, se
toca un archivo. Por eso `authApi.js`, `productsApi.js`, `customersApi.js` y
`salesApi.js` son una función corta por endpoint.

---

## 3. El camino de un clic hasta MongoDB

María está seleccionada y el vendedor toca el **+** del Latte:

```
ProductCard                 boton "Agregar Latte"
    |
PointOfSalePage.handleAdd   si es admin, canAddMore() corta en el stock conocido
    |
cartReducer (ADD)           carrito nuevo: [{ productId, name, price, quantity }]
    |                       useEffect -> saveCart() en sessionStorage
useCartQuote                cambia la clave -> quoting: true ("Actualizando…")
    |                       espera 250 ms; si hay otro toque, cancela y vuelve a esperar
salesApi.quoteCart          { customerId, items: [{ productId, quantity }] }
    |
client.request              Content-Type + Authorization: Bearer <token>, fetch, traduce errores
    |
POST /api/sales/cart        saleRoutes -> SaleController.previewCart
    |
saleService.quoteCart       precios de la base, descuento por purchasesCount, centavos
    |
MongoDB                     solo LECTURAS de Customer y Product. No escribe nada.
```

La vuelta: `{ data: { items, subtotal, discountPercent, discountAmount, total,
canCheckout } }` → `useCartQuote` lo guarda → `CartPanel` muestra **Subtotal $161.00 /
Descuento (10%) −$16.10 / Total $144.90**. Números reales: 2 Latte de $58 + 1 Croissant
de $45 = $161, y María tiene 12 compras, le toca 10%. Es lo que verifica `full-flow.cy.js`.

**Fijate qué viaja:** solo `productId` y `quantity`. El precio que el carrito tiene en
memoria es para mostrar; nunca se envía.

---

## 4. Sesión y roles

### 4.1 El login es real

`POST /api/auth/login` busca el `User` en Mongo y compara la contraseña con **scrypt**
(`node:crypto`), con sal aleatoria y `timingSafeEqual`. El seed guarda `salt:hash`, nunca
la contraseña. El usuario se normaliza (`trim` + minúsculas): `" ADMIN "` también entra.
Si sale bien, el backend devuelve `{ name, username, role, token }`. El `token` es un
**JWT** firmado por el backend con el rol adentro y vence en 8 horas (detalle en la
sección 5 de la guía del backend).

### 4.2 Qué se guarda y dónde

`src/Api/session.js` maneja tres claves de `sessionStorage`:

| Clave | Contenido | Se limpia con |
|---|---|---|
`cafecito.session` | `{ name, username, role, token }` | "Salir" o token rechazado |
`cafecito.customer` | el cliente de la venta en curso | "Salir" o "Atender a otro cliente" |
`cafecito.cart` | `[{ productId, name, price, quantity }]` | "Salir"; queda vacío al cobrar |

Cada lectura va en `try/catch` y los datos **se validan al leerlos**: `getCart()` descarta
todo item sin `productId` string, `price` finito o `quantity` entera positiva, y
`getSession()` ignora una sesión sin `token`. Si alguien edita el storage a mano, la app no
se rompe.

**¿Por qué `sessionStorage` y no `localStorage`?** Vive **por pestaña** y se borra al
cerrarla: en una caja compartida, cerrar el navegador cierra la sesión (con
`localStorage` el próximo que abra la compu entra como vos). Dos pestañas son dos cajas
independientes. Y sobrevive a un F5 y a ir de `/venta` a `/clientes` y volver, que es lo
que hacía falta.

### 4.3 SessionProvider y useSession

Un Context con `user` y `customer`, que arrancan leyendo el storage
(`useState(() => getSession())`), y `sessionExpired`. Expone `user`, `customer`,
`isAdmin`, `sessionExpired`, `signIn`, `signOut`, `selectCustomer` y `clearCustomer`, con
el `value` en `useMemo` para no re-renderizar a los consumidores de gusto.

**Sesión vencida.** Si el backend responde 401 a un pedido que llevaba token (venció o lo
editaron), `client.js` dispara el evento `cafecito:session-expired` en `window`. El
provider lo escucha con un `useEffect`, llama a `signOut()` y marca `sessionExpired`;
`ProtectedRoute` manda a `/login`, que muestra "Tu sesión expiró. Vuelve a iniciar
sesión.". ¿Por qué un evento? Porque `client.js` es JavaScript común y no puede usar
hooks ni el Context; el evento es el puente. Context, provider y hook están en **tres
archivos** porque Fast Refresh (la recarga en caliente, igual que en CRA) solo funciona si
un `.jsx` exporta únicamente componentes; la regla `react/only-export-components` de
oxlint lo avisa.

### 4.4 ProtectedRoute

```js
if (!user) return <Navigate to="/login" replace />
if (roles && !roles.includes(user.role)) return <Navigate to="/venta" replace />
if (requireCustomer && !customer) return <Navigate to="/clientes" replace />
return <Outlet />
```

`/clientes` pide sesión, `/venta` pide sesión **y** cliente elegido, `/gestion` pide rol
admin. Un vendedor que escribe `/gestion` va a `/venta`, y sin cliente elegido de ahí a
`/clientes`: la prueba de humo espera justamente `/clientes`.

### 4.5 Qué ve cada rol

| | Vendedor | Administrador |
|---|---|---|
Catálogo en la caja | solo con stock (15 de 16) | todo, agotados incluidos (16) |
Stock en las tarjetas | no | "40 en stock", "Quedan 4", "Agotado" |
Aviso de poco stock | no | "3 productos con poco stock" |
Agregar más que el stock | lo deja; la cotización avisa "Solo hay 3 disponibles" | el botón deja de sumar |
Link **Gestión** | no aparece | sí |

> **Si preguntan por seguridad:** con las DevTools cualquiera puede cambiar `"role":
> "seller"` por `"admin"` en el `sessionStorage`, y el front le va a mostrar el link de
> Gestión. Pero el backend no mira ese campo: lee el rol **del token firmado**, así que lo
> sigue tratando como vendedor (borrar un cliente da 403, los agotados no aparecen, borrar
> un producto solo lo deja en stock 0). Y si edita el rol dentro del token, la
> firma deja de coincidir: 401 y vuelve al login. Ocultar el link es **UX, no seguridad**;
> la seguridad está en el backend. Lo que falta, honestamente: el token no se puede
> revocar antes de que venza, y en `sessionStorage` lo podría leer un script inyectado
> (XSS), cosa que React evita escapando todo lo que muestra.

---

## 5. El total lo calcula el backend, nunca el front

Subtotal, descuento, total y el "Cobrar $X" salen de `/sales/cart`. El ticket sale de la
respuesta de `POST /sales`. El front **no suma precios ni aplica descuentos**, por tres
razones: lo que corre en el navegador se puede editar (alguien podría cobrar $0); hay una
sola fuente de verdad para precios y escalones; y el backend calcula en centavos enteros,
así que repetirlo en JS arriesga diferencias de un centavo entre pantalla y cobro.

**Una excepción, por si te la marcan:** antes de la primera cotización cada línea muestra
`precio × cantidad` como provisorio (`getLineTotal` en `CartPanel`). No se envía ni se
cobra. El "Descuento de cliente frecuente: 10%" de la tarjeta del cliente tampoco se
calcula acá: viene del backend como `discountPercent` dentro del cliente, así que los
escalones existen en un solo lugar.

### Falta de stock: 200 al cotizar, 409 al cobrar

| Momento | Respuesta | Qué hace la UI |
|---|---|---|
Cotizar | **200**, línea con `hasEnoughStock: false`, `canCheckout: false` | "Solo hay 3 disponibles", "Cobrar" deshabilitado, **los totales se siguen viendo** |
Cobrar | **409** "Insufficient stock" | el modal dice "No hay stock suficiente" y "Stock insuficiente de "Chai latte": pediste 3, hay 1"; recarga catálogo y cotización |

¿Cómo falla al cobrar si la cotización estaba bien? Porque **entre cotizar y cobrar otra
caja vendió**. La prueba "explains a stock shortage found at checkout" lo simula quitando
stock por la API antes de cobrar. Por eso `handleCheckoutFailed` llama a `reload()` del
catálogo y a `refresh()` de la cotización: los avisos del carrito se ponen al día solos.

---

## 6. La cotización en vivo (`useCartQuote`)

Cada cambio del carrito o del cliente pide una cotización. Tocar "+" cinco veces seguidas
**no** manda cinco pedidos:

```js
useEffect(() => {
  if (!requestKey) return undefined
  const controller = new AbortController()
  const timer = setTimeout(async () => {
    try {
      const { data } = await quoteCart(
        { customerId, items: JSON.parse(itemsKey) },
        { signal: controller.signal },
      )
      setState({ quote: data, quoting: false, error: null })
    } catch (error) {
      if (error?.name === 'AbortError') return
      setState((current) => ({ ...current, quoting: false, error }))
    }
  }, QUOTE_DELAY_MS)

  return () => {
    clearTimeout(timer)
    controller.abort()
  }
}, [requestKey, customerId, itemsKey])
```

1. **Debounce de 250 ms** (`QUOTE_DELAY_MS`). Si el carrito cambia antes, el cleanup
   cancela el `setTimeout` y se espera de nuevo. Sale un solo pedido.
2. **AbortController.** Si había un pedido en vuelo, se aborta. Sin esto, una respuesta
   vieja y lenta podría llegar **después** de la nueva y pisar el total (condición de
   carrera).
3. **Se conserva la última cotización buena.** Al cambiar la clave el estado pasa a
   `quoting: true` sin borrar `quote`: se siguen viendo los totales anteriores con un
   "Actualizando…", en vez de parpadear a $0.
4. **`requestKey`** = cliente + items + `version`. Carrito vacío → clave vacía → no se
   pide nada. `refresh()` sube `version` para forzar otra cotización.

"Cobrar" solo se habilita con items, sin cotización en curso, sin error y con
`canCheckout: true` del backend.

> **Por qué importa el cleanup:** en desarrollo `StrictMode` monta, desmonta y vuelve a
> montar cada componente (igual que en CRA). El cleanup aborta el primer pedido.

---

## 7. Manejo de errores

### 7.1 Un solo `request()`

`src/Api/client.js` (70 líneas) es el único lugar con `fetch`. Pone `Content-Type` solo si
hay body, agrega `Authorization: Bearer <token>` leyendo la sesión, y convierte todo error
en un `ApiError` con `status`, `message` y `details` **ya traducidos**:

```js
if (!response.ok) {
  // The backend rejected the token (expired or tampered with): the session is over
  if (response.status === 401 && token) notifySessionExpired()
  throw new ApiError(
    response.status,
    translateMessage(payload?.message) ?? 'Ocurrió un error inesperado.',
    translateDetails(payload?.errors ?? []),
  )
}
```

Si `fetch` revienta con `TypeError` (backend apagado, sin red), lanza
`ApiError(0, 'No se pudo conectar con el servidor. Revisa que el backend esté encendido.')`.
Un `AbortError` se relanza tal cual para que el hook lo ignore.

> **Esto es lo que te van a preguntar:** `fetch` **no** falla con un 404 ni con un 500.
> Solo falla si no hay conexión. Por eso hay que mirar `response.ok` a mano (axios sí
> lanzaba en 4xx/5xx).

Como todas las pantallas reciben el mismo `ApiError`, todas lo muestran igual:
`<Alert tone="error" messages={error.details ?? []}>{error.message}</Alert>`.

### 7.2 Traducir el inglés del backend

El backend responde en inglés: es una API, sus mensajes son contrato y logs. El idioma es
asunto de la interfaz, así que la traducción vive en `src/Api/errorMessages.js`:

- `MESSAGES`, un diccionario exacto: `'Invalid credentials'` → "Usuario o contraseña incorrectos".
- Lo que empiece con `'Failed to'` (los 500) → "Ocurrió un error en el servidor. Intenta de nuevo."
- `DETAIL_PATTERNS`, regex para los detalles que traen datos adentro:

```js
[
  /^Insufficient stock for "(.+)": requested (\d+), available (\d+)$/,
  (_, name, requested, available) =>
    `Stock insuficiente de "${name}": pediste ${requested}, hay ${available}`,
],
```

Los grupos capturan producto y números y se reacomodan en español. También cubre errores
de Mongoose: ``Path `price` (-1) is less than minimum allowed value (0).`` → "El campo
precio no puede ser negativo". Un mensaje desconocido se muestra tal cual: mejor en
inglés que escondido.

---

## 8. Las pantallas y los componentes

**LoginPage (`/login`).** Valida vacíos **antes** de llamar al backend ("Escribe tu
usuario"); una prueba verifica con `cy.intercept` que no sale ningún request. Con sesión
abierta, redirige a `/clientes`.

**CustomerLookupPage (`/clientes`).** Busca por teléfono o correo, normalizando primero:

```js
export function normalizeSearchTerm(value) {
  const trimmed = String(value ?? '').trim()
  if (/[a-z@]/i.test(trimmed)) return trimmed.toLowerCase()
  return trimmed.replace(/\D/g, '')
}
```

Con letras o `@` es correo → minúsculas. Si no, es teléfono → solo dígitos:
`"449 123 4567"` → `"4491234567"`, como está guardado. Menos de 10 dígitos se rechaza sin
ir al backend. **Un** resultado → tarjeta con compras, descuento y producto favorito;
**varios** → lista para elegir; **ninguno** → alta precargada con lo que buscaste. Si hay
una venta en curso, ofrece "Continuar venta".

**PointOfSalePage (`/venta`).** Catálogo (`useCatalog({ includeOutOfStock: isAdmin })`,
de `Api/`) con pestañas por categoría,
carrito con `useReducer(cartReducer, undefined, getCart)` (arranca desde el storage) y
`CartPanel`. El reducer tiene cinco acciones (`ADD`, `INCREMENT`, `DECREMENT`, `REMOVE`,
`CLEAR`) en un archivo de 41 líneas: toda la lógica del carrito en una función pura.
`CheckoutModal` tiene dos pasos: método de pago → ticket con folio. Después, "Nueva venta
(mismo cliente)" o "Atender a otro cliente".

**ManagementPage (`/gestion`, solo admin).** La pestaña vive en la URL (`?tab=clientes`,
con `useSearchParams`), así un F5 no te devuelve a Productos.

- **Productos:** el mismo `useCatalog`, con `includeOutOfStock: true`. Filtra en el
  navegador por nombre **sin acentos** (`normalizeText`: "te" encuentra "Té verde") y por
  categoría. Crear, editar, ajustar stock, eliminar. Un nombre repetido ("LATTE") → 409 →
  "Ya existe un producto con ese nombre". El stock solo se escribe al crear; después se
  mueve con `PATCH /stock` y un `delta` (+7, −5), nunca pisándolo con un `PUT`, porque se
  perdería una venta hecha en otra caja.
- **Clientes:** búsqueda y paginación **en el servidor** (10 por página; el backend ignora
  acentos: "maria lopez" encuentra a "María López"), historial con los snapshots (si el
  Latte sube a $99, el ticket viejo sigue en $58), editar y eliminar. Eliminar uno con
  ventas → 409 → "No se puede eliminar un cliente que tiene ventas registradas", dentro
  del mismo diálogo.

### Componentes reutilizables

| Componente | Props principales | Dónde se usa |
|---|---|---|
`Button` | `variant`, `size`, `icon`, `loading`, `fullWidth` | en todas las pantallas |
`Input` / `Select` | `label`, `error`, `hint`, `options` | login, búsqueda, todos los formularios |
`Alert` | `tone` (`error`/`success`/`info`), `messages` | todas las pantallas |
`Badge` | `tone` | `ProductCard`, aviso de poco stock, tabla de productos |
`Modal` | `open`, `title`, `onClose`, `footer` | `ConfirmDialog`, cobro, modales de Gestión |
`ConfirmDialog` | `title`, `message`, `onConfirm`, `loading`, `error` | eliminar producto y cliente |
`AppHeader` | `showCustomer` | `/clientes`, `/venta`, `/gestion` |
`CategoryTabs` | `options`, `value`, `onChange` | categorías de la caja, pestañas de Gestión |
`ProductCard` | `product`, `showStock`, `disabled`, `onAdd` | catálogo de la caja |
`CartPanel` | `items`, `quote`, `quoting`, `error`, callbacks | caja |
`QuantityStepper` | `value`, `itemName`, `onIncrement`, `onDecrement` | cada línea del carrito |
`ProtectedRoute` | `roles`, `requireCustomer` | `App.jsx` |
`Icon` | `name`, `size`, `label` | botones, header, alertas, tarjetas |

Detalles de React 19 que suman: `Input` y `Select` reciben `ref` como prop común (ya no
hace falta `forwardRef`) y usan `useId` para enlazar `label`, error y `aria-describedby`.
`Modal` usa `createPortal`, cierra con Escape, mantiene el foco adentro con Tab y lo
devuelve al botón que lo abrió.

---

## 9. Íconos

```js
// src/Components/Icons/Icon.jsx
const svgFiles = import.meta.glob('./svg/*.svg', { query: '?raw', import: 'default', eager: true })
```

`import.meta.glob` es de Vite: importa **todos** los archivos que coinciden, al compilar.
`?raw` pide el contenido como texto (no una URL) y `eager` los trae ya cargados. Queda un
objeto `{ cup: '<svg…>', plus: '<svg…>', … }` y el componente inyecta el texto con
`dangerouslySetInnerHTML`. **En CRA** harías `import { ReactComponent as Cup } from
'./cup.svg'`, un import por ícono, o `require.context` de webpack para traerlos todos.

**¿`dangerouslySetInnerHTML` no es peligroso?** Con contenido del usuario o del backend, sí.
Acá sale de 13 archivos nuestros leídos al compilar; nada externo pasa por ahí.

**Ojo con el glob:** como importa **todos** los `.svg` de la carpeta, un ícono que nadie usa
igual viaja en el bundle. Por eso se borró `user.svg`, que no usaba ninguna pantalla.

**Por qué importa `currentColor`:** los 13 SVG dibujan con `stroke="currentColor"`, o sea,
toman el color del texto que los rodea. Dentro de un botón rojo el ícono va a ser rojo sin
tocar un SVG. Hoy no tienen color; cuando llegue la paleta lo van a tener solos.

**Agregar un ícono:** soltar `nombre.svg` en `Icons/svg/` (con `currentColor`) y usar
`<Icon name="nombre" />`. No hay que importar nada. Ojo: un nombre que no existe devuelve
`null` sin avisar. Sin `label` el ícono es decorativo (`aria-hidden`); los botones de solo
ícono llevan `aria-label` ("Agregar Latte"), que las pruebas usan para encontrarlos.

---

## 10. Estilos

**Un `.css` por componente o página** (11 en `components/`, 5 en `pages/`, más
`variables.css` y `global.css`), y cada componente importa el suyo, igual que en CRA:
`import '../../Styles/components/button.css'`. **Nombres estilo BEM**
(`cart-panel__row--total`): el CSS es global, sin CSS Modules, y el prefijo del componente
evita choques. **`variables.css`** tiene espaciados (`--space-1` a `--space-6`), radios,
tamaños de letra, alto del header y ancho del carrito.

### Por qué no hay colores todavía

La paleta está pendiente, y no hay **ni un color** en los 18 archivos: los bordes son
`border: 1px solid;` sin color (en CSS eso es `currentColor`) y los íconos también usan
`currentColor`. Primero estructura y comportamiento; la paleta después, en un solo lugar.

Las clases que van a recibir color **ya están en el JSX** y todavía no tienen regla:
`button--primary`, `button--secondary`, `button--danger`, `badge--success`,
`badge--warning`, `alert--error`, `alert--success`. Son los ganchos. Cómo se agrega:

```css
:root { --color-bg: …; --color-text: …; --color-primary: …; }      /* variables.css */
body { background: var(--color-bg); color: var(--color-text); }    /* global.css */
.button--primary { background: var(--color-primary); }             /* button.css */
```

Bordes e íconos heredan el `color` solos. Cambiar la paleta después es editar un archivo.

---

## 11. Pruebas con Cypress

**E2E (end-to-end):** Cypress abre un navegador de verdad contra el front, el backend y
MongoDB de verdad, y hace clic y escribe como una persona. No prueba funciones sueltas
(eso son pruebas unitarias, que en CRA hacías con Jest): prueba que **la historia
completa funciona**.

| Spec | Pruebas | Qué cubre |
|---|---|---|
`smoke.cy.js` | 5 | redirige sin sesión, vendedor fuera de Gestión, 404, `/api/health` |
`login.cy.js` | 10 | los dos roles (y que se guarda el token), contraseña mala, vacíos sin request, salir, backend caído |
`auth.cy.js` | 6 | 401 sin token o con el viejo `x-user-role`, token con el rol editado, token vencido, 403 por rol, sesión vencida → login, sesión sin token |
`customer-lookup.cy.js` | 11 | teléfono con espacios, correo en mayúsculas, varios resultados, alta, correo duplicado |
`point-of-sale.cy.js` | 14 | qué ve cada rol, descuento, stepper, ticket, falta de stock, producto borrado, F5 |
`management.cy.js` | 14 | filtros sin acentos, CRUD, nombre repetido, ajuste de stock, búsqueda de clientes sin acentos, teléfono rechazado por el backend, paginación, historial, snapshots |
`full-flow.cy.js` | 1 | la historia entera solo por la UI: vende el vendedor, revisa el admin |
**Total** | **61** | |

Se corren con `npm run test:e2e` (sin ventana) o `npm run cy:open` (con interfaz), con
backend y frontend levantados.

**Comandos propios** (`cypress/support/commands.js`): **`cy.resetDb()`** corre el seed
antes de cada spec o prueba (base limpia y conocida; **borra los datos**).
**`cy.visitAs(path, { role, customerEmail })`** se loguea por la API real, busca al
cliente y escribe sesión y cliente en `sessionStorage` en `onBeforeLoad`, antes de que
cargue la app: cada prueba arranca donde le interesa sin repetir el login por la UI, que
ya se prueba en `login.cy.js` y `full-flow`. **`cy.apiRequest(options, role)`** es un
`cy.request` con el token de un login real (`auth: { bearer }`), para preparar datos por la
API (quitar stock, registrar una venta). Y la tarea **`createExpiredToken`** firma un token
ya vencido con la librería y el `JWT_SECRET` del backend, para probar el vencimiento sin
esperar 8 horas.

**¿Por qué `cy.task` y no `cy.exec`?** `cy.exec` corre el comando con la shell del
usuario; acá es Git Bash, instalado en `C:\Program Files\Git`, y el espacio de "Program
Files" rompía la invocación. `cy.task` corre en el proceso de Node de Cypress:

```js
// cypress.config.js
on('task', {
  resetDb() {
    execSync('npm run seed', { cwd: backendDir, stdio: 'ignore' })
    return null
  },
  createExpiredToken(role) { … },   // jwt.sign con exp en el pasado
})
```

### Dos pruebas inestables y lo que enseñaron

> **Esto es lo que impresiona contar:** una prueba que a veces pasa y a veces no casi
> nunca es mala suerte; es una causa real que todavía no encontraste.

**(a) IPv6 vs IPv4.** Vite escuchaba en `localhost` y Node lo resolvía a `::1` (IPv6);
Cypress resolvía `localhost` a `127.0.0.1` (IPv4). Mismo nombre, dos direcciones: a veces
"connection refused". Solución, fijar la dirección en los dos lados:

```js
server: { host: '127.0.0.1', port: 5173, strictPort: true },   // vite.config.js
baseUrl: 'http://127.0.0.1:5173',                              // cypress.config.js
```

Y `strictPort`: si el 5173 está ocupado, Vite **falla** en vez de mudarse al 5174 en
silencio y dejar a Cypress probando contra nada.

**(b) `node --watch` reiniciaba el backend.** En Windows, NTFS actualiza la "fecha de
último acceso" de un archivo cuando se lee, y el watcher lo tomaba como un cambio: el
backend se reiniciaba **en medio de una prueba**. Solución: `nodemon`
(`"dev": "nodemon index.js"`), que no se dispara con eso.

**(c) Bonus, `ELECTRON_RUN_AS_NODE`.** VS Code es Electron y define esa variable en su
terminal. Cypress también es Electron, la hereda y arranca como Node pelado: no abre. Hay
que quitarla antes: `unset ELECTRON_RUN_AS_NODE` (Git Bash) o
`Remove-Item Env:ELECTRON_RUN_AS_NODE` (PowerShell).

---

## 12. Demo en vivo (copiá y pegá)

Requiere MongoDB corriendo en local.

```bash
# terminal 1: datos de ejemplo (BORRA la base) y backend
cd backend && npm run seed && npm run dev

# terminal 2: frontend (en CRA esto era npm start)
cd frontend && npm run dev
```

Abrí `http://127.0.0.1:5173`. Usuarios: **vendedor / cafecito123** y **admin / admin123**.

1. Entrá con `vendedor` / `incorrecta` → **"Usuario o contraseña incorrectos"**.
2. Entrá con `vendedor` / `cafecito123`. No hay link **Gestión**; escribí `/gestion` en la
   barra → te saca.
3. Buscá `449 123 4567` → María López, 12 compras, descuento 10%. **Iniciar venta**.
4. Tocá 2 Latte y 1 Croissant: "Actualizando…" y total **$144.90** (subtotal $161.00,
   descuento −$16.10). Explicá que lo calculó el backend.
5. Tocá 4 veces **Muffin de arándano** → "Solo hay 3 disponibles", "Cobrar" se apaga.
   Quitalo con el tacho.
6. F5 → el carrito sigue ahí (`sessionStorage`).
7. **Cobrar** → Efectivo → ticket con folio → **Atender a otro cliente**.
8. Buscá `4490000000` → no existe → alta. Poné `maria.lopez@correo.com` → **"Ya existe un
   cliente con ese correo"**.
9. **Salir**, entrá como `admin` / `admin123` y elegí a María: ahora ves el stock, el
   Matcha helado "Agotado" y "3 productos con poco stock".
10. **Gestión → Productos**: el Latte quedó en 28. **Clientes**: María con 13 compras;
    "Ver compras" muestra el ticket de recién.
11. Eliminá a María → **"No se puede eliminar un cliente que tiene ventas registradas"**.
12. En **Clientes** buscá `maria lopez` (sin acentos) → aparece María López. En
    **Productos**, creá uno llamado `LATTE` → **"Ya existe un producto con ese nombre"**.
13. DevTools → Application → Session Storage → `cafecito.session`: mostrá el `token` y
    pegalo en jwt.io (se lee el rol, pero no se puede cambiar sin el secreto). Borrale un
    carácter al final del token y buscá un cliente → vuelve al login con **"Tu sesión
    expiró. Vuelve a iniciar sesión."**
14. (Opcional) Apagá el backend e intentá entrar → **"No se pudo conectar con el
    servidor"**.

---

## 13. Preguntas probables y respuestas cortas

**¿Por qué Vite y no Create React App?**
CRA está deprecado. Vite arranca al instante porque en desarrollo no empaqueta, y su
configuración son 8 líneas a la vista en vez de webpack escondido.

**¿Por qué el carrito se guarda en `sessionStorage`?**
Para que sobreviva a un F5 y a ir a cambiar de cliente y volver. Y no en `localStorage`
porque muere al cerrar la pestaña: en una caja compartida no queda nada colgado.

**¿Por qué no calculás el total en el front?**
Porque lo que corre en el navegador se puede editar. El front manda `productId` y
`quantity` y muestra lo que el backend calcula con los precios de la base.

**¿Qué pasa si dos cajeros venden lo último?**
Gana uno: el backend descuenta con un update condicional atómico. El otro recibe 409, ve
"Stock insuficiente de … pediste 3, hay 1", y la UI recarga catálogo y cotización y deja
"Cobrar" deshabilitado hasta que ajuste el carrito.

**¿Cómo sabe la app qué rol tengo?**
El login devuelve `{ name, username, role, token }`, se guarda en `sessionStorage` y lo
expone el `SessionProvider`. El front usa `role` solo para decidir qué mostrar;
`request()` manda el `token` en `Authorization: Bearer`, y el backend saca el rol de ahí,
verificando la firma. Editar el `role` del storage cambia la pantalla, no los permisos.

**¿Qué pasa cuando vence la sesión?**
El backend responde 401, `client.js` avisa con un evento, el `SessionProvider` cierra la
sesión y la app vuelve al login con "Tu sesión expiró". Lo prueba `auth.cy.js` con un
token vencido de verdad.

**¿Por qué Context y no Redux?**
Hay dos datos globales: el usuario y el cliente elegido. Redux sería una dependencia y
mucho código para dos valores. El carrito ni siquiera es global: solo lo usa la caja, así
que vive en `PointOfSalePage` con `useReducer`.

**¿Para qué el debounce y el AbortController?**
El debounce evita un pedido por toque; el AbortController cancela el anterior para que una
respuesta vieja no pise el total nuevo.

**¿El vendedor no entra a Gestión solo porque ocultaste el link?**
No: la ruta tiene `ProtectedRoute roles={[ROLES.ADMIN]}` y el backend responde 403 a lo que
el rol del token no permite. Ocultar el link es UX; la protección real está en el backend.

**¿Por qué `useCatalog` está en `Api/`?**
Porque lo usan dos pantallas y su trabajo es traer datos del backend. Antes eran dos hooks
casi iguales, uno por pantalla; tener uno solo evita que se desincronicen.

**¿Cómo lo probaste? ¿Qué le falta?**
61 pruebas E2E con Cypress contra el sistema completo, una de ellas solo por la UI. Faltan
colores, pruebas unitarias (Vitest, el equivalente de Jest) y lo de la sección 14.

---

## 14. Limitaciones y próximos pasos (sé honesto)

| Limitación | Por qué pasa | Cómo se arregla |
|---|---|---|
El token no se puede revocar | un JWT vale hasta que vence (8 h); "Salir" solo lo borra del navegador | lista de tokens revocados en el backend, o tokens cortos + renovación |
Token en `sessionStorage` | un script inyectado (XSS) podría leerlo | cookie `httpOnly`; hoy React escapa todo lo que muestra |
Sin colores | paleta pendiente | `variables.css` + las clases que ya existen |
Catálogo hasta 100 productos | `fetchProducts` pide `limit: 100`, el backend topea en 100; la cafetería tiene 16 | paginar o buscar en el servidor (el endpoint ya acepta `search` y `page`) |
Sin pruebas unitarias | todo está cubierto con E2E | Vitest para `cartReducer`, `normalizeSearchTerm`, `errorMessages` |

**Ya resueltas, por si te preguntan:** el rol viajaba en un header falsificable y ahora
viaja en un JWT firmado; la búsqueda de clientes ignora
acentos; los nombres de producto son únicos sin importar mayúsculas (409 traducido); el
backend valida los 10 dígitos del teléfono; y los escalones de descuento ya no están
duplicados en el front.

---

## 15. Resumen en 30 segundos

Frontend en React 19 con Vite y React Router para la caja de una cafetería. El vendedor
inicia sesión, busca al cliente por teléfono o correo, arma la orden y cobra; el
administrador además ve el stock y administra productos y clientes.

Lo interesante son tres cosas: el front **nunca calcula plata**, cada cambio del carrito
pide una cotización al backend con debounce y cancelación del pedido anterior, y mientras
espera mantiene el último total bueno; todo el contacto con el backend pasa por una sola
función que agrega el token firmado, detecta el backend caído y la sesión vencida, y
traduce los errores a español; y sesión, cliente y carrito viven en `sessionStorage`, así
sobreviven a un F5 pero no al cierre de la pestaña. Lo cubren 61 pruebas end-to-end en
Cypress contra el sistema completo. Lo que falta, y lo sé: colores, pruebas unitarias y
poder revocar un token antes de que venza.
