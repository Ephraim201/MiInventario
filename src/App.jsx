import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType, NotFoundException } from '@zxing/library'
import './App.css'

const PRODUCTOS_FALLBACK = {
  '8480000000017': {
    nombre: 'Leche entera 1L',
    marca: 'Hacendado',
    categorias: 'Lácteos, Leche',
    foto:
      'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=900&q=80',
    fuente: 'Catálogo local (demo)',
  },
  '8410000000024': {
    nombre: 'Pan de molde integral',
    marca: 'Carrefour',
    categorias: 'Panadería',
    foto:
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80',
    fuente: 'Catálogo local (demo)',
  },
  '8430000000031': {
    nombre: 'Tomate frito 350g',
    marca: 'Orlando',
    categorias: 'Conservas, Salsas',
    foto:
      'https://images.unsplash.com/photo-1592841200221-7f0f8ef5f63b?auto=format&fit=crop&w=900&q=80',
    fuente: 'Catálogo local (demo)',
  },
}

function normalizarProductoOpenFoodFacts(data) {
  return {
    nombre: data.product_name || data.product_name_es || 'Producto sin nombre',
    marca: data.brands || 'Marca desconocida',
    categorias: data.categories || 'Sin categorías',
    foto: data.image_url || data.image_front_url || '',
    fuente: 'Open Food Facts',
  }
}

async function buscarProductoPorCodigo(codigo) {
  const endpoint = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
    codigo,
  )}.json`

  const response = await fetch(endpoint)
  if (!response.ok) {
    throw new Error('No se pudo consultar la base de datos pública.')
  }

  const payload = await response.json()

  if (payload?.status === 1 && payload?.product) {
    return normalizarProductoOpenFoodFacts(payload.product)
  }

  return null
}

function App() {
  const videoRef = useRef(null)
  const controlsRef = useRef(null)
  const readerRef = useRef(null)

  const [escaneando, setEscaneando] = useState(false)
  const [buscando, setBuscando] = useState(false)
  const [codigoDetectado, setCodigoDetectado] = useState('')
  const [producto, setProducto] = useState(null)
  const [error, setError] = useState('')

  const resolverProducto = async (codigo) => {
    const clave = codigo.trim()
    setCodigoDetectado(clave)
    setProducto(null)
    setError('')
    setBuscando(true)

    try {
      const remoto = await buscarProductoPorCodigo(clave)
      if (remoto) {
        setProducto(remoto)
        return
      }

      const local = PRODUCTOS_FALLBACK[clave] || null
      if (local) {
        setProducto(local)
        return
      }

      setError(
        `No se encontró información para el código ${clave}. Intenta con otro producto.`,
      )
    } catch {
      const local = PRODUCTOS_FALLBACK[clave] || null
      if (local) {
        setProducto(local)
        setError('No hubo conexión con Open Food Facts. Mostrando resultado local.')
      } else {
        setError(
          'Error consultando Open Food Facts. Revisa tu conexión e inténtalo de nuevo.',
        )
      }
    } finally {
      setBuscando(false)
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
            const code = result.getText()
            detenerEscaneo()
            resolverProducto(code)
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
          App para Barcelona, España. Escanea un EAN/UPC y consulta Open Food
          Facts para mostrar nombre e imagen del producto.
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

        {buscando && <p className="info">Buscando producto en base de datos…</p>}
        {error && <p className="error">{error}</p>}

        {producto && (
          <article className="producto">
            {producto.foto ? (
              <img src={producto.foto} alt={producto.nombre} />
            ) : (
              <div className="placeholder">Sin imagen</div>
            )}
            <div>
              <h3>{producto.nombre}</h3>
              <p>Marca: {producto.marca}</p>
              <p>Categorías: {producto.categorias}</p>
              <p className="fuente">Fuente: {producto.fuente}</p>
            </div>
          </article>
        )}
      </section>
    </main>
  )
}

export default App
