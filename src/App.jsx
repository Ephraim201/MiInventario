import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType, NotFoundException } from '@zxing/library'
import './App.css'

const PRODUCTOS = {
  '8480000000017': {
    nombre: 'Leche entera 1L',
    supermercado: 'Mercadona',
    foto:
      'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=900&q=80',
  },
  '8410000000024': {
    nombre: 'Pan de molde integral',
    supermercado: 'Carrefour',
    foto:
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80',
  },
  '8430000000031': {
    nombre: 'Tomate frito 350g',
    supermercado: 'Bonpreu',
    foto:
      'https://images.unsplash.com/photo-1592841200221-7f0f8ef5f63b?auto=format&fit=crop&w=900&q=80',
  },
}

function App() {
  const videoRef = useRef(null)
  const controlsRef = useRef(null)
  const readerRef = useRef(null)

  const [escaneando, setEscaneando] = useState(false)
  const [codigoDetectado, setCodigoDetectado] = useState('')
  const [producto, setProducto] = useState(null)
  const [error, setError] = useState('')

  const resolverProducto = (codigo) => {
    const clave = codigo.trim()
    const encontrado = PRODUCTOS[clave] || null
    setCodigoDetectado(clave)
    setProducto(encontrado)

    if (!encontrado) {
      setError(`No se encontró el producto para el código ${clave}.`)
    } else {
      setError('')
    }
  }

  const iniciarEscaneo = async () => {
    setError('')

    if (!videoRef.current) return

    try {
      const hints = new Map()
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
      ])

      const reader = new BrowserMultiFormatReader(hints)
      readerRef.current = reader

      const controls = await reader.decodeFromConstraints(
        {
          audio: false,
          video: {
            facingMode: { ideal: 'environment' },
          },
        },
        videoRef.current,
        (result, err) => {
          if (result) {
            resolverProducto(result.getText())
            detenerEscaneo()
            return
          }

          if (err && !(err instanceof NotFoundException)) {
            setError('Error al leer el código de barras.')
          }
        },
      )

      controlsRef.current = controls
      setEscaneando(true)
    } catch {
      setError(
        'No se pudo acceder a la cámara. Revisa permisos del navegador y usa HTTPS en móvil.',
      )
      setEscaneando(false)
    }
  }

  const detenerEscaneo = () => {
    if (controlsRef.current) {
      controlsRef.current.stop()
      controlsRef.current = null
    }

    if (readerRef.current) {
      readerRef.current.reset()
      readerRef.current = null
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
        <h1>Escáner de código de barras</h1>
        <p>
          App demo para Barcelona, España. Escanea el código de barras de un
          producto y verás su nombre y foto.
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
