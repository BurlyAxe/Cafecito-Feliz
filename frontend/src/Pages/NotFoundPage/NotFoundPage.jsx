import { Link } from 'react-router'
import '../../Styles/pages/not-found-page.css'

function NotFoundPage() {
  return (
    <main className="page not-found">
      <h1>Página no encontrada</h1>
      <p>La dirección que buscas no existe.</p>
      <Link to="/">Volver al inicio</Link>
    </main>
  )
}

export default NotFoundPage
