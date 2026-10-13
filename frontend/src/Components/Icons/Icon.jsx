// import.meta.glob loads every svg in the svg/ folder as text at build time
// Adding a new icon only means dropping a new .svg file in the svg/ folder
const svgFiles = import.meta.glob('./svg/*.svg', { query: '?raw', import: 'default', eager: true })

const icons = Object.fromEntries(
  Object.entries(svgFiles).map(([path, markup]) => [path.replace('./svg/', '').replace('.svg', ''), markup]),
)

function Icon({ name, size = 20, className = '', label }) {
  const markup = icons[name]
  if (!markup) return null
  return (
    <span
      className={`icon ${className}`.trim()}
      style={{ width: size, height: size }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  )
}

export default Icon
