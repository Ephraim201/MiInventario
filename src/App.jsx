import { useEffect, useRef, useState } from 'react'
import QrScanner from 'qr-scanner'
import './App.css'

const PRODUCTOS = {
  BCN001: {
    nombre: 'Llet semidesnatada 1L',
    supermercado: 'Mercadona',
    foto:
      'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=900&q=80',
  },
  BCN002: {
    nombre: 'Pa de pagès',
    supermercado: 'Bonpreu',
    foto:
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80',
  },
  BCN003: {
    nombre: 'Tomàquet triturat 400g',
    supermercado: 'Condis',
    foto:
      'https://images.unsplash.com/photo-1592841200221-7f0f8ef5f63b?auto=format&fit=crop&w=900&q=80',
  },
}

function App() {
  const videoRef = useRef(null)
  const scannerRef = useRef(null)

  const [escaneando, setEscaneando] = useState(false)
  const [codigoDetectado, setCodigoDetectado] = useState('')
  const [producto, setProducto] = useState(null)
  const [error, setError] = useState('')

  const resolverProducto = (codigo) => {
    const clave = codigo.trim().toUpperCase()
    const encontrado = PRODUCTOS[clave] || null
    setProducto(encontrado)
    setCodigoDetectado(clave)
    if (!encontrado) {
      setError(`No se encontró el producto para el código "${clave}".`)
    } else {
      setError('')
    }
  }

  const iniciarEscaneo = async () => {
    setError('')
    if (!videoRef.current) return

    try {
      const scanner = new QrScanner(
        videoRef.current,
        (result) => {
          const data = typeof result === 'string' ? result : result?.data
          if (!data) return
          resolverProducto(data)
          detenerEscaneo()
        },
        {
          preferredCamera: 'environment',
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
        },
      )

      scannerRef.current = scanner
      await scanner.start()
      setEscaneando(true)
    } catch {
      setError(
        'No se pudo acceder a la cámara. Revisa permisos del navegador o usa HTTPS en móvil.',
      )
      setEscaneando(false)
    }
  }

  const detenerEscaneo = () => {
    if (scannerRef.current) {
      scannerRef.current.stop()
      scannerRef.current.destroy()
      scannerRef.current = null
    }
    setEscaneando(false)
  }

  useEffect(() => {
    return () => {
      detenerEscaneo()
    }
  }, [])

  return (
    <main className="app">
      <header className="card">
        <h1>Escáner QR de supermercado</h1>
        <p>
          App demo para Barcelona, España. Escanea un QR y te mostrará nombre y
          foto del producto.
        </p>
      </header>

      <section className="card">
        <video ref={videoRef} className="preview" muted playsInline />
        <div className="actions">
          {!escaneando ? (
            <button onClick={iniciarEscaneo}>Iniciar escaneo</button>
          ) : (
            <button className="secondary" onClick={detenerEscaneo}>
              Detener escaneo
            </button>
          )}
        </div>
      </section>

      <section className="card">
        <h2>Resultado</h2>
        {codigoDetectado ? (
          <p className="code">
            Código detectado: <strong>{codigoDetectado}</strong>
          </p>
        ) : (
          <p>Aún no se ha detectado ningún código.</p>
        )}

        {error && <p className="error">{error}</p>}

        {producto && (
          <article className="producto">
            <img src={producto.foto} alt={producto.nombre} />
            <div>
              <h3>{producto.nombre}</h3>
              <p>Supermercado: {producto.supermercado}</p>
            </div>
          </article>
        )}
      </section>
    </main>
  )
}

export default App
