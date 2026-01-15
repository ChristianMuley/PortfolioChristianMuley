// wwwroot/src/intro/introFlow.js
import { raf } from '../utils/timing.js'
import { setCookie, getCookie, delCookie } from '../utils/cookies.js'

function radiusToCoverRect(rect, cx, cy, pad = 24) {
    const dx1 = rect.left - cx, dy1 = rect.top - cy
    const dx2 = rect.right - cx, dy2 = rect.top - cy
    const dx3 = rect.right - cx, dy3 = rect.bottom - cy
    const dx4 = rect.left - cx, dy4 = rect.bottom - cy
    const r2 = Math.max(
        dx1 * dx1 + dy1 * dy1,
        dx2 * dx2 + dy2 * dy2,
        dx3 * dx3 + dy3 * dy3,
        dx4 * dx4 + dy4 * dy4
    )
    return Math.sqrt(r2) + pad
}

export function initIntroFlow({
                                  gsap,
                                  uiState,

                                  intro,
                                  introContent,
                                  snapRoot,
                                  scanNav,
                                  replayLink,
                                  header,
                                  footer,
                                  sections,

                                  initialPanelIndex,

                                  enforceOnlyCurrentVisible,
                                  onStartAccordion,
                              }) {
    const revealSnapRoot = () => {
        if (!snapRoot) return
        snapRoot.style.visibility = 'visible'
        document.getElementById('critical-hide')?.remove()
    }

    const buildIntroUI = () => {
        const uiWrap = document.createElement('div')
        uiWrap.className = 'intro-ui mt-5 w-full flex flex-col items-center justify-center gap-3'

        const enterBtn = document.createElement('button')
        enterBtn.type = 'button'
        enterBtn.textContent = 'Enter'
        enterBtn.className =
            'intro-enter inline-flex items-center justify-center rounded-full px-8 py-3 font-semibold tracking-wide shadow hover:shadow-md transition'

        const skipWrap = document.createElement('label')
        skipWrap.className = 'intro-skip flex items-center gap-2 text-xs'

        const skipCb = document.createElement('input')
        skipCb.type = 'checkbox'
        skipCb.className = 'accent-accent'

        skipWrap.append(skipCb, document.createTextNode('Tick this to skip intro next time'))
        uiWrap.append(enterBtn, skipWrap)

        if (introContent) introContent.appendChild(uiWrap)

        if (introContent) {
            introContent.style.transform = `translateY(-8px)`
            gsap.set(introContent, { autoAlpha: 0 })
            gsap.to(introContent, { autoAlpha: 1, duration: 0.4, ease: 'power2.out', delay: 0.02 })
            introContent.style.transform = `translateY(0px)`
        }

        const startIntro = () => {
            if (skipCb.checked) setCookie('skipIntro', '1')

            enforceOnlyCurrentVisible(0)

            const aSec = sections[0]
            const aRect = aSec ? aSec.getBoundingClientRect() : snapRoot.getBoundingClientRect()
            const cx = aRect.left + aRect.width / 2
            const cy = aRect.top + aRect.height / 2
            const maxR = radiusToCoverRect(aRect, cx, cy)

            snapRoot.style.clipPath = `circle(0px at ${cx}px ${cy}px)`
            document.body.style.overflow = 'hidden'

            revealSnapRoot()

            gsap.timeline({ defaults: { ease: 'power2.inOut' } })
                .to({ rad: 0 }, {
                    rad: maxR,
                    duration: 0.9,
                    onUpdate() {
                        snapRoot.style.clipPath = `circle(${this.targets()[0].rad}px at ${cx}px ${cy}px)`
                    }
                })
                .to('#intro .text-center', { autoAlpha: 0, duration: 0.55, ease: 'power2.out' }, '<')
                .to(intro, {
                    autoAlpha: 0,
                    duration: 0.5,
                    onComplete: () => {
                        intro.style.display = 'none'
                        snapRoot.style.clipPath = 'none'
                        document.body.style.overflow = 'hidden'
                        onStartAccordion(initialPanelIndex)
                    }
                }, '>-0.04')
        }

        enterBtn.addEventListener('click', startIntro)
        document.addEventListener('keydown', (e) => { if (e.key === 'Enter') startIntro() })
    }

    if (replayLink) {
        replayLink.addEventListener('click', (e) => {
            e.preventDefault()
            delCookie('skipIntro')
            location.reload()
        })
    }

    if (getCookie('skipIntro') === '1') {
        if (intro) intro.style.display = 'none'
        snapRoot.style.clipPath = 'none'
        document.body.style.overflow = 'hidden'

        enforceOnlyCurrentVisible(initialPanelIndex)
        revealSnapRoot()
        onStartAccordion(initialPanelIndex)
        return
    }

    // Default: show intro overlay
    snapRoot.style.clipPath = 'circle(0px at 50% 50%)'
    document.body.style.overflow = 'hidden'
    buildIntroUI()
}
