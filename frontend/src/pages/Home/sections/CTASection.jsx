import { useEffect, useRef } from "react"
import { useNavigate } from 'react-router-dom'
import { Button } from '$components/ui'
import fragmentShaderSource from "./shaders/hero-bg.frag.glsl?raw"
import vertexShaderSource from "./shaders/quad.vert.glsl?raw"

function CTASection() {
  const navigate = useNavigate()
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext("webgl")
    if (!gl) return

    function compile(source, type) {
      const shader = gl.createShader(type)
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader))
      }
      return shader
    }

    const vs = compile(vertexShaderSource, gl.VERTEX_SHADER)
    const fs = compile(fragmentShaderSource, gl.FRAGMENT_SHADER)
    const program = gl.createProgram()
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    gl.useProgram(program)

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]),
      gl.STATIC_DRAW
    )
    const positionLoc = gl.getAttribLocation(program, "a_position")
    gl.enableVertexAttribArray(positionLoc)
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0)

    const resolutionLoc = gl.getUniformLocation(program, "u_resolution")
    const timeLoc       = gl.getUniformLocation(program, "u_time")
    const mouseLoc      = gl.getUniformLocation(program, "u_mousepos")

    let mouseX = -9999
    let mouseY = -9999

    function handleMouseMove(e) {
      const rect = canvas.getBoundingClientRect()
      const dpr  = Math.min(window.devicePixelRatio, 2)
      mouseX = (e.clientX - rect.left)   * dpr
      mouseY = (rect.bottom - e.clientY) * dpr
    }
    window.addEventListener("mousemove", handleMouseMove)

    function resize() {
      const section = canvas.closest(".cta-section") || canvas.parentElement
      if (!section) return
      const dpr = Math.min(window.devicePixelRatio, 2)
      canvas.width  = section.offsetWidth  * dpr
      canvas.height = section.offsetHeight * dpr
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    resize()
    window.addEventListener("resize", resize)

    let rafId = 0
    const start = performance.now()

    function render() {
      const elapsed = (performance.now() - start) / 1000
      gl.uniform2f(resolutionLoc, canvas.width, canvas.height)
      gl.uniform1f(timeLoc, elapsed)
      gl.uniform4f(mouseLoc, mouseX, mouseY, 0, 0)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
      rafId = requestAnimationFrame(render)
    }
    render()

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener("resize", resize)
      window.removeEventListener("mousemove", handleMouseMove)
      gl.deleteProgram(program)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      gl.deleteBuffer(buffer)
    }
  }, [])

  return (
    <section className="cta-section">
      <canvas ref={canvasRef} className="cta-canvas" aria-hidden="true" />

      <div className="cta-content">
        <p className="cta-eyebrow">Para creadores</p>
        <h2 className="cta-title">
          ¿Tenés una idea<br />que vale la pena?
        </h2>
        <p className="cta-description">
          Creá tu campaña en minutos y empezá a recibir apoyo de la comunidad.
        </p>
        <Button variant="primary" size="lg" onClick={() => navigate('/for-creators')}>
          Crear campaña
        </Button>
      </div>

      <style>{`
        .cta-section {
          position: relative;
          width: 100%;
          overflow: hidden;
          padding: 5.5rem 0;
          background: #f7f2ed;
        }

        .cta-canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: block;
        }

        .cta-content {
          position: relative;
          z-index: 1;
          max-width: var(--max-width);
          margin: 0 auto;
          padding: 0 var(--space-xl);
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.375rem;
        }

        .cta-eyebrow {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--color-primary);
          opacity: 0.7;
          margin: 0;
        }

        .cta-title {
          font-family: var(--font-sans);
          font-size: clamp(2.25rem, 5.5vw, 3.75rem);
          font-weight: 800;
          color: var(--color-text-primary);
          line-height: 1.08;
          letter-spacing: -0.03em;
          margin: 0;
        }

        .cta-description {
          font-size: var(--font-size-lg);
          color: var(--color-text-secondary);
          line-height: 1.65;
          margin: 0;
          max-width: 34rem;
          opacity: 0.8;
        }

        @media (max-width: 768px) {
          .cta-section { padding: var(--space-xl) 0; }
          .cta-content { padding: 0 var(--space-md); }
        }
      `}</style>
    </section>
  )
}

export default CTASection