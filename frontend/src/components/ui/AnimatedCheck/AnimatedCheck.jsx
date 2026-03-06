import './AnimatedCheck.css'

function AnimatedCheck() {
  return (
    <div className="animated-check-wrapper">
      <svg className="animated-check" viewBox="0 0 52 52">
        <circle
          className="animated-check__circle"
          cx="26"
          cy="26"
          r="24"
          fill="none"
        />
        <path
          className="animated-check__check"
          fill="none"
          d="M14 27l7.8 7.8L38 17"
        />
      </svg>
    </div>
  )
}

export default AnimatedCheck
