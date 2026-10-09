const GENERIC_SERVER_ERROR = 'Ocurrió un error en el servidor. Intenta de nuevo.'

const FIELD_NAMES = {
  name: 'nombre',
  phone: 'teléfono',
  email: 'correo',
  price: 'precio',
  stock: 'stock',
  category: 'categoría',
  description: 'descripción',
  username: 'usuario',
  password: 'contraseña',
}

const MESSAGES = {
  'Invalid credentials': 'Usuario o contraseña incorrectos',
  Forbidden: 'No tienes permiso para realizar esta acción',
  'Invalid data': 'Revisa los datos ingresados',
  'Customer not found': 'No se encontró al cliente',
  'Product not found': 'No se encontró el producto',
  'Sale not found': 'No se encontró la venta',
  'A customer with that email already exists': 'Ya existe un cliente con ese correo',
  'The product already exists': 'Ya existe un producto con ese nombre',
  'Insufficient stock': 'No hay stock suficiente',
  'Cannot delete a customer with registered sales':
    'No se puede eliminar un cliente que tiene ventas registradas',
  'Malformed JSON body': 'La solicitud no tiene un formato válido',
  'Endpoint not found': 'No se encontró el recurso solicitado',
  'Internal server error': GENERIC_SERVER_ERROR,
  'Invalid customer ID': 'El identificador del cliente no es válido',
  'Invalid product ID': 'El identificador del producto no es válido',
  'Invalid sale ID': 'El identificador de la venta no es válido',
  'Login successful': 'Inicio de sesión exitoso',
  'Customer created': 'Cliente registrado',
  'Customer updated': 'Cliente actualizado',
  'Customer deleted': 'Cliente eliminado',
  'Product created': 'Producto creado',
  'Product updated': 'Producto actualizado',
  'Product deleted': 'Producto eliminado',
  'Product removed from the catalog': 'Producto retirado del catálogo',
  'Stock updated': 'Stock actualizado',
  'Sale registered': 'Venta registrada',
}

export function translateMessage(message) {
  if (typeof message !== 'string') return message
  if (MESSAGES[message]) return MESSAGES[message]
  if (message.startsWith('Failed to')) return GENERIC_SERVER_ERROR
  return message
}

const fieldName = (field) => FIELD_NAMES[field] ?? field

const DETAIL_PATTERNS = [
  [
    /^Insufficient stock for "(.+)": requested (\d+), available (\d+)$/,
    (_, name, requested, available) =>
      `Stock insuficiente de "${name}": pediste ${requested}, hay ${available}`,
  ],
  [
    /^Cannot remove (\d+) units: only (\d+) available$/,
    (_, removed, available) => `No puedes quitar ${removed} unidades: solo hay ${available}`,
  ],
  [/^Path `(\w+)` is required\.?$/, (_, field) => `El campo ${fieldName(field)} es obligatorio`],
  [/^Email format is not valid$/, () => 'El correo no tiene un formato válido'],
  [
    /^`(.+)` is not a valid enum value for path `(\w+)`\.?$/,
    (_, value, field) => `El valor "${value}" no es válido para ${fieldName(field)}`,
  ],
  [
    /^Path `(\w+)` \((.+)\) is less than minimum allowed value \((.+)\)\.?$/,
    (_, field, value, min) =>
      Number(min) === 0
        ? `El campo ${fieldName(field)} no puede ser negativo`
        : `El campo ${fieldName(field)} no puede ser menor a ${min}`,
  ],
  [
    /^Cast to Number failed for value .* at path "(\w+)".*$/,
    (_, field) => `El campo ${fieldName(field)} debe ser un número`,
  ],
  [/^Stock must be an integer$/, () => 'El stock debe ser un número entero'],
  [/^Quantity must be an integer$/, () => 'La cantidad debe ser un número entero'],
  [/^delta must be a non-zero integer$/, () => 'El ajuste debe ser un número entero distinto de cero'],
  [
    /^Product \w+ does not exist$/,
    () => 'Uno de los productos ya no existe en el catálogo; quítalo de la orden',
  ],
  [/^username is required$/, () => 'El usuario es obligatorio'],
  [/^password is required$/, () => 'La contraseña es obligatoria'],
  [/^customerId is required$/, () => 'Debes seleccionar un cliente'],
  [/^customerId is not a valid ID$/, () => 'El cliente seleccionado no es válido'],
  [/^paymentMethod is required$/, () => 'Debes elegir un método de pago'],
  [/^paymentMethod must be one of: .+$/, () => 'El método de pago no es válido'],
  [/^items is required$/, () => 'Agrega al menos un producto al carrito'],
  [/^items must be a non-empty array$/, () => 'Agrega al menos un producto al carrito'],
  [/^items\[\d+\] must be an object$/, () => 'Hay un producto del carrito con datos no válidos'],
  [/^items\[\d+\]\.productId is required$/, () => 'Hay un producto del carrito sin identificador'],
  [/^items\[\d+\]\.productId is not a valid ID$/, () => 'Hay un producto del carrito que no es válido'],
  [
    /^items\[\d+\]\.quantity must be a positive integer$/,
    () => 'La cantidad de cada producto debe ser un número entero mayor a cero',
  ],
]

function translateDetail(detail) {
  if (typeof detail !== 'string') return detail
  for (const [pattern, build] of DETAIL_PATTERNS) {
    const match = detail.match(pattern)
    if (match) return build(...match)
  }
  return detail
}

export function translateDetails(errors) {
  return (Array.isArray(errors) ? errors : []).map(translateDetail)
}
