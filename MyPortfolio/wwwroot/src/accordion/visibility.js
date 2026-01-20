import { setT, showEl, hideEl } from '../utils/dom.js'

export function preHideNonFirst(sections, gsap) {
    sections.forEach((sec, i) => {
        const inner = sec.querySelector('.section-inner')
        const head = sec.querySelector('.panel-head-full')
        if (!inner) return

        if (i === 0) {
            inner.style.visibility = 'visible'
            inner.style.pointerEvents = 'auto'
            setT(inner, 0)
            gsap.set(inner, { autoAlpha: 1 })
            if (head) head.style.opacity = '1'
        } else {
            inner.style.visibility = 'hidden'
            inner.style.pointerEvents = 'none'
            setT(inner, -16)
            gsap.set(inner, { autoAlpha: 0 })
            if (head) head.style.opacity = '0'
        }
    })
}

export function enforceOnlyCurrentVisible(sections, idx, gsap) {
    sections.forEach((sec, i) => {
        const inner = sec.querySelector('.section-inner')
        const head = sec.querySelector('.panel-head-full')
        if (!inner) return

        if (i === idx) {
            showEl(inner)
            gsap.set(inner, { autoAlpha: 1, clearProps: 'transform' })
            if (head) head.style.opacity = '1'
        } else {
            hideEl(inner)
            gsap.set(inner, { autoAlpha: 0, y: -16 })
            if (head) head.style.opacity = '0'
        }
    })
}
