export const raf = () => new Promise(r => requestAnimationFrame(r))
export const sleep = (ms) => new Promise(r => setTimeout(r, ms))
