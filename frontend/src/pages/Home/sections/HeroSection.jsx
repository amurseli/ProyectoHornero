import { useEffect, useRef } from "react"
import { SearchBar } from "../../../components/features"
import fragmentShaderSource from "./shaders/hero-bg.frag.glsl?raw"
import vertexShaderSource from "./shaders/quad.vert.glsl?raw"

function HeroSection({ search }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext("webgl")
    if (!gl) {
      console.warn("WebGL no soportado")
      return
    }

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
      const section = canvas.closest(".hero-section") || canvas.parentElement
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
    <section className="hero-section">
      <canvas ref={canvasRef} className="hero-canvas" aria-hidden="true" />

      <div className="hero-content-wrapper">
        <p className="hero-eyebrow">La comunidad creativa</p>
        <h1 className="hero-title">
          Aquí comienzan<br />las ideas
        </h1>
        <p className="hero-description">
          Explorá miles de proyectos innovadores y apoyá a creadores de todo el mundo
        </p>
        <SearchBar search={search} />
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');

        .hero-section {
          position: relative;
          width: 100%;
          min-height: 24rem;
          overflow: hidden;
          border-bottom: 1px solid var(--color-border);
          padding: 4.5rem 0 3.5rem;
          background: #f7f2ed;
        }

        .hero-canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: block;
        }

        .hero-content-wrapper {
          position: relative;
          z-index: 1;
          max-width: var(--max-width);
          margin: 0 auto;
          padding: 0 var(--space-xl);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 1.125rem;
        }

        .hero-eyebrow {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--color-primary);
          opacity: 0.7;
          margin: 0;
        }

        .hero-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(2.75rem, 6.5vw, 4.75rem);
          font-weight: 800;
          line-height: 1.04;
          letter-spacing: -0.035em;
          color: var(--color-text-primary);
          margin: 0;
        }

        .hero-description {
          font-size: var(--font-size-lg);
          color: var(--color-text-secondary);
          line-height: 1.65;
          max-width: 38rem;
          margin: 0;
          opacity: 0.8;
        }

        @media (max-width: 768px) {
          .hero-section { padding: var(--space-xl) 0 var(--space-lg); }
          .hero-content-wrapper { padding: 0 var(--space-md); }
        }
      `}</style>
    </section>
  )
}

export default HeroSection