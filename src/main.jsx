import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  ArrowUpRight,
  Code2,
  Contact,
  Facebook,
  Github,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Plus,
} from 'lucide-react'
import './styles.css'

const socials = [
  { label: 'Facebook', href: 'https://www.facebook.com/tomjerald.ferrer.7/', Icon: Facebook },
  { label: 'Instagram', href: 'https://www.instagram.com/frrrtom/', Icon: Instagram },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/tom-jerald-ferrer-6b7b37301/', Icon: Linkedin },
  { label: 'GitHub', href: 'https://github.com/Nozen-Limit', Icon: Github },
]

const phases = [
  { title: <>Tom Jerald<br />Ferrer.</>, description: 'Aspiring developer', className: 'intro' },
  { title: 'Find me online.', description: '', className: 'socials' },
  { title: 'Let’s connect.', description: '0997 243 3478', className: 'connect' },
  { title: <>Connection<br />is wealth.</>, description: 'One tap. A new connection. Make your introduction with Dampitag.', className: 'product' },
]

function DetailButton({ kind, icon: Icon, children, active, onSelect }) {
  return (
    <button
      type="button"
      id={kind === 'work' ? 'ns-primary' : 'ns-contact'}
      className="cursor-interaction"
      aria-expanded={active}
      aria-controls={`ns-${kind}-detail`}
      onClick={() => onSelect(active ? null : kind)}
      onMouseEnter={() => onSelect(kind)}
      onFocus={(event) => {
        if (event.currentTarget.matches(':focus-visible')) onSelect(kind)
      }}
    >
      <Icon aria-hidden="true" />{children}<Plus aria-hidden="true" />
    </button>
  )
}

function App() {
  const rootRef = useRef(null)
  const [phase, setPhase] = useState(0)
  const [detail, setDetail] = useState(null)

  useEffect(() => {
    let disposed = false
    let cleanup
    import('./scene.js').then(({ mountCardScene }) => {
      if (!disposed) cleanup = mountCardScene(rootRef.current, setPhase)
    }).catch(() => {
      const loader = rootRef.current?.querySelector('.ns-loader')
      if (loader) loader.textContent = 'The 3D card could not load. Please refresh the page.'
    })
    return () => { disposed = true; cleanup?.() }
  }, [])
  useEffect(() => setDetail(null), [phase])

  const current = phases[phase]
  return (
    <main id="signature-card-dissolve" ref={rootRef} aria-label="Tom Jerald Ferrer NFC portfolio">
      <div className="ns-scroller" role="region" aria-label="Scroll to explore the NFC card">
        <section className="ns-stage">
          <canvas aria-label="Interactive three-dimensional NFC card. Drag in any direction to rotate." />
          <div className="ns-grid" aria-hidden="true"><span /><span /><span /><span /><span /></div>

          <div className={`ns-copy ${current.className}`}>
            <h1>{current.title}</h1>
            <p className="ns-desc">{current.description}</p>

            <div className="ns-socials" aria-label="Social profiles">
              {socials.map(({ label, href, Icon }) => (
                <a className="cursor-interaction" key={label} href={href} target="_blank" rel="noopener noreferrer">
                  <Icon aria-hidden="true" /><span>{label}</span><ArrowUpRight aria-hidden="true" />
                </a>
              ))}
            </div>

            <div className="ns-actions">
              <DetailButton kind="work" icon={Code2} active={detail === 'work'} onSelect={setDetail}>My work</DetailButton>
              <DetailButton kind="contact" icon={Contact} active={detail === 'contact'} onSelect={setDetail}>Contact</DetailButton>
              <a id="ns-business" href="https://leon.omnexis.systems/dampitag#products" target="_blank" rel="noopener noreferrer">Want one? Visit Dampitag <ArrowUpRight aria-hidden="true" /></a>
            </div>

            <div className="ns-inline-details">
              <section id="ns-work-detail" hidden={detail !== 'work'} aria-label="My work">
                <div className="ns-detail-heading">Selected work <small>Sample projects</small></div>
                <div className="ns-project-line"><span>Personal portfolio</span><small>Web design</small></div>
                <div className="ns-project-line"><span>Student task tracker</span><small>Development</small></div>
              </section>
              <section id="ns-contact-detail" hidden={detail !== 'contact'} aria-label="Contact details">
                <a href="tel:+639972433478"><Phone aria-hidden="true" />0997 243 3478<ArrowUpRight aria-hidden="true" /></a>
                <a href="mailto:Tomjeraldsf@gmail.com"><Mail aria-hidden="true" />Tomjeraldsf@gmail.com<ArrowUpRight aria-hidden="true" /></a>
                <p><MapPin aria-hidden="true" />Cabanatuan City, Nueva Ecija</p>
              </section>
            </div>
          </div>

          <p className="ns-tagline">Building systems<br />that last.</p>
          <div className="ns-card-hit" aria-hidden="true" />
          <div className="ns-loader" role="status">Preparing the 3D card…</div>
        </section>
        <div className="ns-track" aria-hidden="true" />
      </div>
    </main>
  )
}

createRoot(document.getElementById('root')).render(<App />)
