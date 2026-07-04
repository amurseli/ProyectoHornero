import { useEffect, useRef } from "react"
import fragmentShaderSource from "$pages/Home/sections/shaders/hero-bg.frag.glsl?raw"
import vertexShaderSource from "$pages/Home/sections/shaders/quad.vert.glsl?raw"

// Fondo animado (Perlin/fbm) que reacciona al mouse. Es el mismo shader del hero de la
// página de inicio, extraído para poder reutilizarlo. El canvas cubre a su contenedor,
// que debe tener position distinta de static (relative/absolute).
// scale controla la frecuencia del ruido: >1 = ondas más pequeñas.
function ShaderBackground({ className = "", scale = 1 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext("webgl")
    if (!gl) {
      console.warn("WebGL no soportado")
      return
    }

    const fragSource = `#define U_SCALE ${scale.toFixed(4)}\n${fragmentShaderSource}`

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
    const fs = compile(fragSource, gl.FRAGMENT_SHADER)
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
      const parent = canvas.parentElement
      if (!parent) return
      const dpr = Math.min(window.devicePixelRatio, 2)
      canvas.width  = parent.offsetWidth  * dpr
      canvas.height = parent.offsetHeight * dpr
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    resize()
    window.addEventListener("resize", resize)

    // El contenedor puede cambiar de alto sin que la ventana cambie (contenido async).
    const resizeObserver = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(resize)
      : null
    if (resizeObserver && canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement)
    }

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
      if (resizeObserver) resizeObserver.disconnect()
      gl.deleteProgram(program)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      gl.deleteBuffer(buffer)
    }
  }, [scale])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
    />
  )
}

export default ShaderBackground
