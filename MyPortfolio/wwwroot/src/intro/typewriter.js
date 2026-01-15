// wwwroot/src/intro/typewriter.js
import { sleep } from '../utils/timing.js'
import { prefersReducedMotion } from '../utils/motion.js'

export function markHeroTypewriterTargets() {
    document
        .querySelectorAll('#A .section-inner p, #A .section-inner blockquote')
        .forEach(el => el.classList.add('tw-type'))
}

async function typewriteInto(fromNode, intoParent, opts) {
    const { cps = 40 } = opts
    const msPerChar = Math.max(5, Math.floor(1000 / cps))

    for (const node of Array.from(fromNode.childNodes)) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent || ''
            if (!text) continue

            const out = document.createTextNode('')
            intoParent.appendChild(out)

            for (let i = 0; i < text.length; i++) {
                out.textContent += text[i]
                await sleep(msPerChar)
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node
            const clone = el.cloneNode(false)
            intoParent.appendChild(clone)
            await typewriteInto(el, clone, opts)
        }
    }
}

async function typewriteElement(el, opts) {
    if (!el || el.dataset.twDone === '1') return

    if (prefersReducedMotion()) {
        el.dataset.twDone = '1'
        el.classList.add('tw-visible')
        return
    }

    el.classList.remove('tw-visible')

    const h = el.getBoundingClientRect().height
    if (h > 0) el.style.minHeight = `${Math.ceil(h)}px`

    const original = el.cloneNode(true)
    el.textContent = ''
    el.dataset.twDone = '1'

    await sleep(opts.startDelay ?? 200)

    el.classList.add('tw-visible')

    await typewriteInto(original, el, opts)
    el.style.minHeight = ''
}

export async function runHeroTypewriterOnce() {
    const a = document.getElementById('A')
    if (!a || a.dataset.twRun === '1') return
    a.dataset.twRun = '1'

    const targets = a.querySelectorAll('.section-inner p, .section-inner blockquote')
    const opts = { cps: 110, startDelay: 50 }

    for (const el of targets) {
        await typewriteElement(el, opts)
        await sleep(100)
    }
}
