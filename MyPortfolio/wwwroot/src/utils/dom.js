export const setT = (el, px) => { if (el) el.style.transform = `translateY(${px | 0}px)` }

export const showEl = (el) => {
    if (!el) return
    el.style.visibility = 'visible'
    el.style.pointerEvents = 'auto'
}

export const hideEl = (el) => {
    if (!el) return
    el.style.visibility = 'hidden'
    el.style.pointerEvents = 'none'
}
