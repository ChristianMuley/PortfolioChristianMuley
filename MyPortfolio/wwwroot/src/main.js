// wwwroot/src/main.js
import './styles.css'
import gsap from 'gsap'

document.addEventListener('DOMContentLoaded', () => {
    const intro = document.getElementById('intro')
    const introContent =
        document.querySelector('#introControlsMount') ||
        document.querySelector('#intro .text-center') ||
        document.querySelector('#intro')

    const snapRoot = document.getElementById('snapRoot')
    const scanNav = document.getElementById('scanNav')
    const replayLink = document.getElementById('replayIntro')
    const sections = Array.from(document.querySelectorAll('.section'))
    const header = document.querySelector('header')
    const footer = document.querySelector('footer.footer')

    // Prevent flash-then-delete: mark Hero A text as typewriter targets immediately
    document
        .querySelectorAll('#A .section-inner p, #A .section-inner blockquote')
        .forEach(el => el.classList.add('tw-type'))

    const setT = (el, px) => { if (el) el.style.transform = `translateY(${px | 0}px)` }
    const showEl = (el) => { if (el) { el.style.visibility = 'visible'; el.style.pointerEvents = 'auto' } }
    const hideEl = (el) => { if (el) { el.style.visibility = 'hidden'; el.style.pointerEvents = 'none' } }

    const raf = () => new Promise(r => requestAnimationFrame(r))
    const sleep = (ms) => new Promise(r => setTimeout(r, ms))

    let modalOpen = false

    const revealSnapRoot = () => {
        if (!snapRoot) return
        snapRoot.style.visibility = 'visible'
        document.getElementById('critical-hide')?.remove()
    }

    const prefersReducedMotion = () =>
        window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

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

    async function runHeroTypewriterOnce() {
        const a = document.getElementById('A')
        if (!a || a.dataset.twRun === '1') return
        a.dataset.twRun = '1'

        const targets = a.querySelectorAll('.section-inner p, .section-inner blockquote')
        const opts = { cps: 55, startDelay: 250 }

        for (const el of targets) {
            await typewriteElement(el, opts)
            await sleep(180)
        }
    }

    if (scanNav) scanNav.classList.add('show')

    if (!snapRoot || !sections.length) {
        setupAdobeGallery()
        return
    }

    const panelMeta = [
        { id: 'A', title: 'Intro / About' },
        { id: 'B', title: 'Skills' },
        { id: 'C', title: 'Projects' },
        { id: 'Contact', title: 'CV + Contact' }
    ]

    sections.forEach((sec, i) => {
        const tone = (i % 2 === 0) ? 'dark' : 'light'
        sec.dataset.panelTone = tone
        sec.classList.toggle('tone-dark', tone === 'dark')
        sec.classList.toggle('tone-light', tone === 'light')
    })

    const setCookie = (n, v, d) => {
        const days = typeof d === 'number' ? d : 365
        const t = new Date()
        t.setTime(t.getTime() + days * 864e5)
        document.cookie = `${n}=${encodeURIComponent(v)};expires=${t.toUTCString()};path=/;SameSite=Lax`
    }
    const delCookie = (n) => { document.cookie = `${n}=; Max-Age=0; path=/;SameSite=Lax` }
    const getCookie = (n) => {
        const hit = document.cookie.split('; ').find(r => r.startsWith(n + '='))
        return hit ? decodeURIComponent(hit.split('=')[1] || '') : null
    }

    // ─────────────────────────────────────────────────────────────
    // URL ↔ Panel sync (deep link + Back/Forward)
    // ─────────────────────────────────────────────────────────────
    function panelIndexFromHash() {
        const raw = (location.hash || '').replace('#', '').trim()
        if (!raw) return 0
        const idx = sections.findIndex(s => s.id.toLowerCase() === raw.toLowerCase())
        return idx >= 0 ? idx : 0
    }

    function writePanelToUrl(panelId, { replace = false } = {}) {
        const hash = `#${panelId}`
        try {
            const st = { panel: panelId }
            if (replace) history.replaceState(st, '', hash)
            else history.pushState(st, '', hash)
        } catch {
            location.hash = hash
        }
    }

    const initialPanelIndex = panelIndexFromHash()

    function preHideNonFirst() {
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

    function enforceOnlyCurrentVisible(idx) {
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

    preHideNonFirst()
    setupAdobeGallery()
    initProjectDrawer()
    initContactForm()

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

        setT(introContent, -8)
        gsap.set(introContent, { autoAlpha: 0 })
        gsap.to(introContent, { autoAlpha: 1, duration: 0.4, ease: 'power2.out', delay: 0.02 })
        setT(introContent, 0)

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
                    rad: maxR, duration: 0.9,
                    onUpdate() {
                        snapRoot.style.clipPath = `circle(${this.targets()[0].rad}px at ${cx}px ${cy}px)`
                    }
                })
                .to('#intro .text-center', { autoAlpha: 0, duration: 0.55, ease: 'power2.out' }, '<')
                .to(intro, {
                    autoAlpha: 0, duration: 0.5, onComplete: () => {
                        intro.style.display = 'none'
                        snapRoot.style.clipPath = 'none'
                        document.body.style.overflow = 'hidden'
                        initAccordion(initialPanelIndex)
                        if (initialPanelIndex === 0) runHeroTypewriterOnce()
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
        initAccordion(initialPanelIndex)
        if (initialPanelIndex === 0) runHeroTypewriterOnce()
        return
    }

    snapRoot.style.clipPath = 'circle(0px at 50% 50%)'
    document.body.style.overflow = 'hidden'
    buildIntroUI()

    function initAccordion(initialIndex = 0) {
        let current = Math.max(0, Math.min(sections.length - 1, initialIndex))
        let lock = false
        let initialSpinePlayed = false

        // URL sync queue (if Back/Forward happens mid-animation)
        let pendingNav = null

        const COLLAPSED_H = 20

        const TOP_PILL_OFFSET = 90
        const BOTTOM_PILL_OFFSET = 6
        const PREV_FADE_DURATION = 0.55

        const PANEL_HEIGHT_DUR = 0.85
        const PANEL_HEIGHT_EASE = 'power2.inOut'
        const INNER_FADE_IN_DUR = 0.55
        const INNER_FADE_EASE = 'power2.out'

        // Neon themes per panel (color + glow)
        const SPINE_THEMES = {
            A: { color: '#ff2b2b', glow: '0 0 18px rgba(255,43,43,0.60), 0 0 44px rgba(255,43,43,0.32)' },
            B: { color: '#22d3ee', glow: '0 0 18px rgba(34,211,238,0.55), 0 0 42px rgba(34,211,238,0.30)' },
            C: { color: '#39ff14', glow: '0 0 18px rgba(57,255,20,0.55), 0 0 46px rgba(57,255,20,0.30)' },
            Contact: { color: '#c026ff', glow: '0 0 18px rgba(192,38,255,0.58), 0 0 46px rgba(192,38,255,0.32)' }
        }

        const SPINE_DROP_EXTRA = 20
        const SPINE_DROP_EXTRA_FIRST = 0
        const SPINE_HUG_HEIGHT = 10
        const SPINE_HUG_HEIGHT_FIRST = 16
        const SPINE_DROP_INFLATE = 8

        // Edge forks thickness + right fork push-in (moves it left from the edge)
        const SPINE_FORK_THICKNESS = 10
        const SPINE_FORK_INSET = 0
        const SPINE_FORK_RIGHT_PUSH_IN = 0 // tweak: 10–20 looks good

        const SPINE_FORK_LEN_MIN = 10
        const SPINE_FORK_LEN_MIN_FIRST = 11
        const SPINE_FORK_LEN_PCT = 0.4
        const SPINE_FORK_LEN_PCT_FIRST = 0.4

        const ACTIVE_NAV_SLIDE_PX = 3
        const ACTIVE_NAV_SLIDE_DURATION = 0.65

        const SPINE_HUG_START_DELAY = 0.18
        const SPINE_FORK_START_DELAY = 0.12

        const headerH = () => header?.getBoundingClientRect?.().height || 0
        const footerH = () => footer?.getBoundingClientRect?.().height || 0
        const rootH = () => snapRoot?.getBoundingClientRect?.().height || (window.innerHeight - headerH() - footerH())
        const openHeight = () => Math.max(0, rootH() - (COLLAPSED_H * 2))

        // ─────────────────────────────────────────────────────────────
        // Mobile/Small screens: make the OPEN panel scrollable
        // (otherwise tall content gets clipped by fixed openHeight)
        // ─────────────────────────────────────────────────────────────
        const INNER_SCROLL_PAD_BOTTOM = 110 // keeps content above the bottom pill / safe area

        function applyPanelScrollability(activeIdx) {
            sections.forEach((sec, i) => {
                const inner = sec.querySelector('.section-inner')
                if (!inner) return

                if (i === activeIdx) {
                    // make only the active panel scrollable
                    inner.classList.add('panel-scroll')
                    inner.style.overflowY = 'auto'
                    inner.style.overflowX = 'hidden'
                    inner.style.webkitOverflowScrolling = 'touch'
                    inner.style.overscrollBehavior = 'contain'

                    // give it a hard height so scrolling works reliably
                    inner.style.maxHeight = `${openHeight()}px`

                    // keep stuff reachable above the bottom pill + iOS safe area
                    inner.style.paddingBottom = `${INNER_SCROLL_PAD_BOTTOM}px`
                } else {
                    // other panels should not be scroll targets
                    inner.classList.remove('panel-scroll')
                    inner.style.overflowY = 'hidden'
                    inner.style.overflowX = 'hidden'
                    inner.style.maxHeight = ''
                    inner.style.paddingBottom = ''
                    inner.scrollTop = 0
                }
            })
        }


        function requestGoTo(idx, opts = {}) {
            if (lock) { pendingNav = { idx, opts }; return }
            goTo(idx, opts)
        }

        function syncFromUrl() {
            const idx = panelIndexFromHash()
            if (idx === current) return
            requestGoTo(idx, { skipUrl: true })
        }

        window.addEventListener('popstate', () => { if (!modalOpen) syncFromUrl() })
        window.addEventListener('hashchange', () => { if (!modalOpen) syncFromUrl() })

        const spineDrop = document.createElement('div')
        spineDrop.id = 'navSpineDrop'
        Object.assign(spineDrop.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '0',
            height: '0',
            background: 'white',
            zIndex: '91',
            pointerEvents: 'none',
            opacity: '0'
        })

        const spineHug = document.createElement('div')
        spineHug.id = 'navSpineHug'
        Object.assign(spineHug.style, {
            position: 'fixed',
            left: '0',
            top: '0',
            width: '100vw',
            height: `${SPINE_HUG_HEIGHT}px`,
            background: 'white',
            transform: 'scaleX(0)',
            transformOrigin: '50% 0%',
            zIndex: '90',
            pointerEvents: 'none',
            opacity: '0',
            willChange: 'transform'
        })

        const spineForkL = document.createElement('div')
        spineForkL.id = 'navSpineForkL'
        Object.assign(spineForkL.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: `${SPINE_FORK_THICKNESS}px`,
            height: '0',
            background: 'white',
            opacity: '0',
            pointerEvents: 'none',
            zIndex: '88'
        })

        // Right fork uses right: anchoring so thickness changes don't mess position
        const spineForkR = document.createElement('div')
        spineForkR.id = 'navSpineForkR'
        Object.assign(spineForkR.style, {
            position: 'fixed',
            top: '0',
            right: '0',
            left: 'auto',
            width: `${SPINE_FORK_THICKNESS}px`,
            height: '0',
            background: 'white',
            opacity: '0',
            pointerEvents: 'none',
            zIndex: '88'
        })

        document.body.append(spineDrop, spineHug, spineForkL, spineForkR)

        const navLabel = document.createElement('div')
        navLabel.id = 'navSpineLabel'
        Object.assign(navLabel.style, {
            position: 'fixed',
            left: '0',
            top: '0',
            width: '0',
            height: '0',
            pointerEvents: 'none',
            opacity: '0',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            willChange: 'transform, opacity'
        })
        document.body.appendChild(navLabel)

        function cancelSpineNow() {
            gsap.killTweensOf([spineDrop, spineHug, spineForkL, spineForkR, navLabel])

            gsap.set([spineDrop, spineHug, spineForkL, spineForkR], { opacity: 0 })
            gsap.set([spineForkL, spineForkR], { height: 0 })
            gsap.set(navLabel, { autoAlpha: 0 })

            spineDrop.style.height = '0px'
            spineHug.style.transform = 'scaleX(0)'
            spineForkL.style.height = '0px'
            spineForkR.style.height = '0px'

            spineDrop.style.boxShadow = 'none'
            spineHug.style.boxShadow = 'none'
            spineForkL.style.boxShadow = 'none'
            spineForkR.style.boxShadow = 'none'
        }

        function setSpineZAboveNav() {
            const anchor = scanNav || header || document.documentElement
            const raw = getComputedStyle(anchor).zIndex
            const navZ = Number.isFinite(parseInt(raw)) ? parseInt(raw) : 0
            const baseZ = navZ > 0 ? navZ : 9999
            spineDrop.style.zIndex = String(baseZ + 20)
            spineHug.style.zIndex = String(baseZ + 19)
            spineForkL.style.zIndex = String(baseZ + 18)
            spineForkR.style.zIndex = String(baseZ + 18)
            navLabel.style.zIndex = String(baseZ + 21)
        }
        setSpineZAboveNav()
        window.addEventListener('resize', setSpineZAboveNav)

        const prevPill = document.createElement('button')
        Object.assign(prevPill.style, {
            position: 'fixed',
            top: `calc(${headerH()}px + ${TOP_PILL_OFFSET}px)`,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '0.4rem 1.1rem',
            borderRadius: '9999px',
            background: 'rgba(17,24,39,0.45)',
            border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(8px)',
            display: 'none',
            gap: '0.4rem',
            alignItems: 'center',
            fontSize: '0.7rem',
            fontWeight: '600',
            color: '#fff',
            boxShadow: '0 8px 28px rgba(15,23,42,0.35)',
            zIndex: '140'
        })
        const prevText = document.createElement('span')
        const prevIcon = document.createElement('span')
        prevIcon.textContent = '↑'
        prevIcon.style.opacity = '0.6'
        prevPill.append(prevText, prevIcon)
        document.body.appendChild(prevPill)

        const nextPill = document.createElement('button')
        Object.assign(nextPill.style, {
            position: 'fixed',
            bottom: `calc(${footerH()}px + ${BOTTOM_PILL_OFFSET}px)`,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '0.4rem 1.1rem',
            borderRadius: '9999px',
            background: 'rgba(17,24,39,0.45)',
            border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            gap: '0.4rem',
            alignItems: 'center',
            fontSize: '0.7rem',
            fontWeight: '600',
            color: '#fff',
            boxShadow: '0 8px 28px rgba(15,23,42,0.35)',
            zIndex: '140'
        })
        const nextText = document.createElement('span')
        const nextIcon = document.createElement('span')
        nextIcon.textContent = '↓'
        nextPill.append(nextText, nextIcon)
        document.body.appendChild(nextPill)

        const dotRail = buildDotRail()
        document.body.appendChild(dotRail.el)

        const skillsGate = (() => {
            const skillsSection = document.getElementById('B')
            if (!skillsSection) return null

            const accordion = skillsSection.querySelector('[data-skill-accordion]')
            if (!accordion) return null

            const cards = Array.from(accordion.querySelectorAll('[data-skill-card]'))
            if (!cards.length) return null

            let activeIndex = Math.max(0, cards.findIndex(c => c.classList.contains('is-active')))
            if (activeIndex === -1) activeIndex = 0

            function setActive(index) {
                const i = Math.max(0, Math.min(cards.length - 1, index))
                activeIndex = i
                cards.forEach((card, idx) => card.classList.toggle('is-active', idx === i))
            }

            function toFirst() { setActive(0) }
            function toLast() { setActive(cards.length - 1) }

            setActive(activeIndex)

            cards.forEach((card, idx) => {
                card.addEventListener('click', () => setActive(idx))
            })

            function consumeWheel(deltaY, e) {
                if (Math.abs(deltaY) < 6) return false
                const dir = deltaY > 0 ? 1 : -1

                if (dir > 0 && activeIndex < cards.length - 1) {
                    e.preventDefault()
                    setActive(activeIndex + 1)
                    return true
                }
                if (dir < 0 && activeIndex > 0) {
                    e.preventDefault()
                    setActive(activeIndex - 1)
                    return true
                }
                return false
            }

            function consumeKey(e) {
                const down = (e.key === 'ArrowDown' || e.key === 'PageDown')
                const up = (e.key === 'ArrowUp' || e.key === 'PageUp')
                if (!down && !up) return false

                const dir = down ? 1 : -1

                if (dir > 0 && activeIndex < cards.length - 1) {
                    e.preventDefault()
                    setActive(activeIndex + 1)
                    return true
                }
                if (dir < 0 && activeIndex > 0) {
                    e.preventDefault()
                    setActive(activeIndex - 1)
                    return true
                }
                return false
            }

            return { toFirst, toLast, consumeWheel, consumeKey }
        })()

        sections.forEach((sec) => {
            sec.style.transition = 'none'
            sec.style.overflow = 'hidden'
        })

        sections.forEach((sec, i) => {
            const inner = sec.querySelector('.section-inner')
            const head = sec.querySelector('.panel-head-full')

            if (i === current) {
                sec.style.height = `${openHeight()}px`
                sec.style.pointerEvents = 'auto'
                sec.dataset.isOpen = '1'
                if (inner) { showEl(inner); setT(inner, 0); gsap.set(inner, { autoAlpha: 1 }) }
                if (head) head.style.opacity = '1'
            } else if (i === current - 1 || i === current + 1) {
                sec.style.height = `${COLLAPSED_H}px`
                sec.style.pointerEvents = 'auto'
                sec.dataset.isOpen = '0'
                if (inner) { hideEl(inner); setT(inner, -16); gsap.set(inner, { autoAlpha: 0 }) }
                if (head) head.style.opacity = '0'
            } else {
                sec.style.height = '0px'
                sec.style.pointerEvents = 'none'
                sec.dataset.isOpen = '0'
                if (inner) { hideEl(inner); setT(inner, -16); gsap.set(inner, { autoAlpha: 0 }) }
                if (head) head.style.opacity = '0'
            }
        })

        enforceOnlyCurrentVisible(current)
        setCurrentClass(current)
        updateNavAndPills(current)
        applyPanelScrollability(current)
        initMediaLightbox()

        // Normalize URL to the current panel without adding history entries
        writePanelToUrl(sections[current].id, { replace: true })

        // Play the spine on first panel the first time (wait for layout + fonts so it fully resolves)
        ; (async () => {
            if (initialSpinePlayed) return
            initialSpinePlayed = true

            cancelSpineNow()
            await raf()
            await raf()

            try { await document.fonts?.ready } catch { }
            await raf()

            updateSpine(current, { instant: false })
        })()

        let wheelSum = 0
        let wheelTimer = null

        window.addEventListener('wheel', (e) => {
            if (lock) return
            if (modalOpen) return

            const currentId = sections[current]?.id

            if (currentId === 'B' && skillsGate) {
                const consumed = skillsGate.consumeWheel(e.deltaY, e)
                if (consumed) return
            }

            if (canScrollVert(e.target, e.deltaY)) return

            e.preventDefault()
            wheelSum += e.deltaY

            clearTimeout(wheelTimer)
            wheelTimer = setTimeout(() => { wheelSum = 0 }, 110)

            if (Math.abs(wheelSum) >= 120) {
                wheelSum > 0 ? goNext() : goPrev()
                wheelSum = 0
            }
        }, { passive: false })

        document.addEventListener('keydown', (e) => {
            if (lock) return
            if (modalOpen) return

            const tag = (e.target && e.target.tagName) || ''
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return

            const currentId = sections[current]?.id

            if (currentId === 'B' && skillsGate) {
                if (skillsGate.consumeKey(e)) return
            }

            if (e.key === 'PageDown' || e.key === 'ArrowDown' || e.key === ' ') {
                e.preventDefault()
                goNext()
            } else if (e.key === 'PageUp' || e.key === 'ArrowUp') {
                e.preventDefault()
                goPrev()
            }
        })

        let startY = null
        window.addEventListener('touchstart', (e) => { startY = e.touches[0].clientY }, { passive: true })
        window.addEventListener('touchmove', (e) => {
            if (startY == null || lock) return
            const dy = startY - e.touches[0].clientY
            if (canScrollVert(e.target, dy)) return
            if (Math.abs(dy) > 40) { dy > 0 ? goNext() : goPrev(); startY = null }
        }, { passive: true })
        window.addEventListener('touchend', () => { startY = null }, { passive: true })

        // Panel body deep-links (About panel + any in-panel links like #B/#C/#Contact)
        document.addEventListener('click', (e) => {
            const a = e.target.closest('a[href^="#"]')
            if (!a) return

            const href = a.getAttribute('href')
            if (!href || href === '#') return

            const id = href.slice(1)
            const targetIndex = sections.findIndex(s => s.id === id)
            if (targetIndex === -1) return

            e.preventDefault()
            if (lock || modalOpen) return
            requestGoTo(targetIndex)
        })

        prevPill.addEventListener('click', () => { goPrev() })
        nextPill.addEventListener('click', () => { goNext() })

        window.addEventListener('resize', () => {
            sections.forEach((sec, i) => {
                if (i === current) sec.style.height = `${openHeight()}px`
                else if (i === current - 1 || i === current + 1) sec.style.height = `${COLLAPSED_H}px`
                else sec.style.height = '0px'
            })
            prevPill.style.top = `calc(${headerH()}px + ${TOP_PILL_OFFSET}px)`
            nextPill.style.bottom = `calc(${footerH()}px + ${BOTTOM_PILL_OFFSET}px)`

            cancelSpineNow()
            updateSpine(current, { instant: true })
            applyPanelScrollability(current)

        })

        document.addEventListener('panelScrollFromLightbox', (e) => {
            const dir = e.detail?.dir || 0
            if (dir > 0) goNext()
            else if (dir < 0) goPrev()
        })

        function goNext() { requestGoTo(Math.min(sections.length - 1, current + 1)) }
        function goPrev() { requestGoTo(Math.max(0, current - 1)) }

        function setCurrentClass(idx) {
            sections.forEach((sec, i) => {
                sec.classList.toggle('is-current', i === idx)
            })
        }

        function findNavAnchor(panelId) {
            return (
                document.querySelector(`.panel-nav[data-panel="${panelId}"]`) ||
                document.querySelector(`#scanNav a[data-panel="${panelId}"]`) ||
                document.querySelector(`#scanNav a[href="#${panelId}"]`) ||
                document.querySelector(`[data-panel="${panelId}"]`) ||
                document.querySelector('#scanNav a') ||
                document.querySelector('.dot-rail-btn.is-active') ||
                null
            )
        }

        function updateNavAndPills(idx) {
            const id = `#${sections[idx].id}`

            document.querySelectorAll('#scanNav a[href]').forEach(a => {
                const on = a.getAttribute('href') === id
                a.style.background = 'transparent'
                a.style.borderRadius = '0'
                a.style.transition = 'color .06s linear, transform .65s'
                a.style.color = on ? '#ffffff' : 'rgba(255,255,255,0.55)'
                a.style.fontWeight = on ? '600' : '500'
                a.style.transform = on ? `translateY(${ACTIVE_NAV_SLIDE_PX}px)` : 'translateY(0px)'
            })

            const isFirst = idx === 0
            const isLast = idx === sections.length - 1

            if (isFirst) {
                prevPill.style.display = 'none'
            } else {
                const pm = panelMeta.find(m => m.id === sections[idx - 1].id)
                prevText.textContent = `Prev: ${pm ? pm.title : sections[idx - 1].id}`
                prevPill.style.display = 'flex'
            }

            if (isLast) {
                nextPill.style.display = 'none'
            } else {
                const nm = panelMeta.find(m => m.id === sections[idx + 1].id)
                nextText.textContent = `Next: ${nm ? nm.title : sections[idx + 1].id}`
                nextPill.style.display = 'flex'
            }

            const dots = document.querySelectorAll('.dot-rail-btn')
            dots.forEach((btn, i) => {
                btn.classList.toggle('is-active', i === idx)
                const hover = btn.querySelector('.dot-hover')
                if (!hover) return
                const cs = getComputedStyle(sections[i])
                const bgImg = cs.backgroundImage
                if (bgImg && bgImg !== 'none') { hover.style.backgroundImage = bgImg; hover.style.backgroundColor = '' }
                else { hover.style.backgroundImage = 'none'; hover.style.backgroundColor = cs.backgroundColor || '#fff' }
            })
        }

        function updateSpine(idx, opts = {}) {
            const { instant = false } = opts

            gsap.killTweensOf([spineDrop, spineHug, spineForkL, spineForkR, navLabel])

            gsap.set([spineForkL, spineForkR], { autoAlpha: 0 })
            spineForkL.style.height = '0px'
            spineForkR.style.height = '0px'

            const navBtn = findNavAnchor(sections[idx].id)
            if (!navBtn || !snapRoot) {
                gsap.set([spineDrop, spineHug, spineForkL, spineForkR], { opacity: 0 })
                gsap.set(navLabel, { autoAlpha: 0 })
                return
            }

            const vw = document.documentElement.clientWidth
            const panelId = sections[idx].id
            const theme = SPINE_THEMES[panelId] || { color: '#ffffff', glow: 'none' }
            const spineColor = theme.color
            const spineGlow = theme.glow

            const btnRect = navBtn.getBoundingClientRect()
            const snapRect = snapRoot.getBoundingClientRect()
            const navRect = (scanNav || header)?.getBoundingClientRect?.() || { top: 0 }

            const dropExtra = (idx === 0) ? SPINE_DROP_EXTRA_FIRST : SPINE_DROP_EXTRA
            const hugHeight = (idx === 0) ? SPINE_HUG_HEIGHT_FIRST : SPINE_HUG_HEIGHT

            const dropTop = Math.round(navRect.top)
            const dropLeft = Math.round(btnRect.left - SPINE_DROP_INFLATE / 2)
            const dropWidth = Math.round(btnRect.width + SPINE_DROP_INFLATE)
            const dropHeight = Math.max(0, Math.round((snapRect.top + dropExtra) - dropTop))
            const dropBottom = dropTop + dropHeight

            const availableForkLen = Math.max(0, Math.round(snapRect.bottom - dropBottom))
            const forkLenPct = (idx === 0) ? SPINE_FORK_LEN_PCT_FIRST : SPINE_FORK_LEN_PCT
            const forkMin = (idx === 0) ? SPINE_FORK_LEN_MIN_FIRST : SPINE_FORK_LEN_MIN
            const forkLen = Math.max(forkMin, Math.round(availableForkLen * forkLenPct))

            const forkLeftX = SPINE_FORK_INSET
            const forkRightInset = SPINE_FORK_INSET + SPINE_FORK_RIGHT_PUSH_IN

            const cs = getComputedStyle(navBtn)

            const applyTargetStyles = () => {
                spineDrop.style.left = `${dropLeft}px`
                spineDrop.style.background = spineColor
                spineHug.style.background = spineColor
                spineForkL.style.background = spineColor
                spineForkR.style.background = spineColor

                spineDrop.style.boxShadow = spineGlow
                spineHug.style.boxShadow = spineGlow
                spineForkL.style.boxShadow = spineGlow
                spineForkR.style.boxShadow = spineGlow

                const text = (navBtn.textContent || '').trim()
                navLabel.textContent = text
                navLabel.style.fontFamily = cs.fontFamily
                navLabel.style.fontSize = cs.fontSize
                navLabel.style.fontWeight = cs.fontWeight || '600'
                navLabel.style.letterSpacing = cs.letterSpacing
                navLabel.style.color = '#0f172a'
                navLabel.style.left = `${btnRect.left}px`
                navLabel.style.width = `${btnRect.width}px`
                navLabel.style.top = `${btnRect.top}px`
                navLabel.style.height = `${btnRect.height}px`
                navLabel.style.lineHeight = `${btnRect.height}px`
            }

            if (instant) {
                applyTargetStyles()

                Object.assign(spineDrop.style, { top: `${dropTop}px`, width: `${dropWidth}px`, height: `${dropHeight}px`, opacity: '1' })

                Object.assign(spineHug.style, {
                    top: `${dropBottom}px`,
                    height: `${hugHeight}px`,
                    opacity: '1',
                    transform: 'scaleX(1)',
                    transformOrigin: `${((dropLeft + dropWidth / 2) / vw) * 100}% 0%`
                })

                Object.assign(spineForkL.style, { left: `${forkLeftX}px`, top: `${dropBottom}px`, height: `${forkLen}px`, opacity: '1' })

                spineForkR.style.left = 'auto'
                spineForkR.style.right = `${forkRightInset}px`
                Object.assign(spineForkR.style, { top: `${dropBottom}px`, height: `${forkLen}px`, opacity: '1' })

                gsap.set(navLabel, { autoAlpha: 1 })
                navLabel.style.transform = `translateY(${ACTIVE_NAV_SLIDE_PX}px)`
                return
            }

            gsap.set(navLabel, { autoAlpha: 0 })

            gsap.to([spineDrop, spineHug, spineForkL, spineForkR], {
                opacity: 0,
                duration: 0.20,
                ease: 'power1.out',
                onComplete: () => {
                    applyTargetStyles()

                    gsap.set([spineForkL, spineForkR], { autoAlpha: 0 })
                    spineForkL.style.height = '0px'
                    spineForkR.style.height = '0px'

                    gsap.set(navLabel, { autoAlpha: 0 })
                    navLabel.style.transform = 'translateY(-3px)'
                    gsap.to(navLabel, { autoAlpha: 1, duration: ACTIVE_NAV_SLIDE_DURATION, ease: 'power2.out' })
                    navLabel.style.transform = `translateY(${ACTIVE_NAV_SLIDE_PX}px)`

                    Object.assign(spineDrop.style, { top: `${dropTop}px`, width: `${dropWidth}px`, height: '0px', opacity: '1' })

                    gsap.to(spineDrop, {
                        height: dropHeight,
                        duration: 0.28,
                        ease: 'power2.out',
                        onComplete: () => {
                            spineHug.style.top = `${dropBottom}px`
                            spineHug.style.height = `${hugHeight}px`
                            spineHug.style.transformOrigin = `${((dropLeft + dropWidth / 2) / vw) * 100}% 0%`

                            gsap.set(spineHug, { autoAlpha: 0, scaleX: 0 })

                            Object.assign(spineForkL.style, { left: `${forkLeftX}px`, top: `${dropBottom}px`, height: '0px', opacity: '0' })

                            spineForkR.style.left = 'auto'
                            spineForkR.style.right = `${forkRightInset}px`
                            Object.assign(spineForkR.style, { top: `${dropBottom}px`, height: '0px', opacity: '0' })

                            gsap.to(spineHug, {
                                delay: SPINE_HUG_START_DELAY,
                                autoAlpha: 1,
                                scaleX: 1,
                                duration: 1.5,
                                ease: 'power0.none',
                                onComplete: () => {
                                    gsap.to([spineForkL, spineForkR], {
                                        delay: SPINE_FORK_START_DELAY,
                                        height: forkLen,
                                        autoAlpha: 1,
                                        duration: 1.0,
                                        ease: 'power2.out'
                                    })
                                }
                            })
                        }
                    })
                }
            })
        }

        function goTo(idx, opts = {}) {
            const { skipUrl = false } = opts
            if (idx === current || lock) return
            lock = true

            cancelSpineNow()

            const from = current
            const to = idx
            const hOpen = openHeight()

            const fromSec = sections[from]
            const toSec = sections[to]

            const fromInner = fromSec.querySelector('.section-inner')
            const toInner = toSec.querySelector('.section-inner')
            const toHead = toSec.querySelector('.panel-head-full')

            const toKids = toInner ? Array.from(toInner.children || []) : []
            if (toKids.length) {
                gsap.killTweensOf(toKids)
                gsap.set(toKids, { autoAlpha: 0, y: 12 })
            }

            const wasOpen = fromSec.dataset.isOpen === '1'

            gsap.killTweensOf([fromInner, toInner])
            if (toInner) gsap.killTweensOf(Array.from(toInner?.children || []))

            if (wasOpen && fromInner) {
                showEl(fromInner)
                setT(fromInner, 0)
                gsap.set(fromInner, { autoAlpha: 1 })
                fromInner.style.pointerEvents = 'none'
            }

            if (toInner) {
                const children = Array.from(toInner.children || [])
                children.forEach(c => setT(c, 18))
                showEl(toInner)
                setT(toInner, 22)
                gsap.set(toInner, { autoAlpha: 0 })
                toInner.style.pointerEvents = 'none'
            }

            if (toHead) toHead.style.opacity = '1'

            const tl = gsap.timeline({
                defaults: { ease: PANEL_HEIGHT_EASE },
                onComplete: () => {
                    current = to

                    setCurrentClass(to)

                    if (sections[to]?.id === 'B' && skillsGate) {
                        if (from < to) skillsGate.toFirst()
                        else if (from > to) skillsGate.toLast()
                    }

                    updateNavAndPills(to)
                    updateSpine(to, { instant: false })

                    if (toInner) toInner.style.pointerEvents = 'auto'
                    enforceOnlyCurrentVisible(to)
                    applyPanelScrollability(to)


                    if (!skipUrl) writePanelToUrl(sections[to].id)
                    if (sections[to].id === 'A') runHeroTypewriterOnce()

                    document.dispatchEvent(new CustomEvent('panelChanged', { detail: { index: to, id: sections[to].id } }))

                    lock = false

                    if (pendingNav && pendingNav.idx !== current) {
                        const next = pendingNav
                        pendingNav = null
                        requestGoTo(next.idx, next.opts)
                    } else {
                        pendingNav = null
                    }
                }
            })

            if (wasOpen && fromInner) {
                const fromChildren = Array.from(fromInner.children || [])
                tl.add(() => { showEl(fromInner) }, 0)
                fromChildren.forEach(c => setT(c, -18))
                tl.to([fromInner, ...fromChildren], {
                    autoAlpha: 0,
                    duration: PREV_FADE_DURATION,
                    ease: 'power2.in',
                    stagger: 0
                }, 0)
                tl.add(() => { hideEl(fromInner) }, '>-0.01')
            }

            toSec.dataset.isOpen = '1'
            fromSec.dataset.isOpen = '0'

            tl.to(fromSec, {
                height: `${COLLAPSED_H}px`,
                pointerEvents: 'auto',
                paddingBlock: 0,
                duration: PANEL_HEIGHT_DUR
            }, 0)

            tl.to(toSec, {
                height: `${hOpen}px`,
                pointerEvents: 'auto',
                duration: PANEL_HEIGHT_DUR,
                onStart: () => toSec.classList.add('is-open')
            }, 0)

            sections.forEach((sec, i) => {
                if (i !== from && i !== to) {
                    const isPrev = i === to - 1
                    const isNext = i === to + 1

                    tl.to(sec, {
                        height: (isPrev || isNext) ? `${COLLAPSED_H}px` : '0px',
                        pointerEvents: (isPrev || isNext) ? 'auto' : 'none',
                        paddingBlock: 0,
                        duration: PANEL_HEIGHT_DUR
                    }, 0)

                    const inner = sec.querySelector('.section-inner')
                    const head = sec.querySelector('.panel-head-full')
                    if (inner) { hideEl(inner); setT(inner, -16); gsap.set(inner, { autoAlpha: 0 }) }
                    if (head) head.style.opacity = '0'
                }
            })

            if (toInner) {
                tl.to(toInner, {
                    autoAlpha: 1,
                    duration: INNER_FADE_IN_DUR,
                    ease: INNER_FADE_EASE,
                    onStart: () => setT(toInner, 0)
                }, `>-=0.18`)

                tl.add(() => { animateSectionIn(toSec) }, `>+=0.06`)
            }
        }

        function buildDotRail() {
            const rail = document.createElement('div')
            rail.className = 'dot-rail'
            rail.style.right = '1.75rem'

            sections.forEach((sec, i) => {
                const btn = document.createElement('button')
                btn.type = 'button'
                btn.setAttribute('aria-label', `Go to ${sec.id}`)
                btn.className = 'dot-rail-btn'

                const hover = document.createElement('div')
                hover.className = 'dot-hover'
                hover.style.border = 'none'

                const label = document.createElement('div')
                label.className = 'dot-hover-label'
                const meta = panelMeta.find(m => m.id === sec.id)
                label.textContent = meta ? meta.title : sec.id

                hover.appendChild(label)
                btn.appendChild(hover)

                hover.style.opacity = '1'
                hover.style.pointerEvents = 'auto'
                hover.style.transform = 'translate(-4px, -50%)'

                btn.addEventListener('click', () => requestGoTo(i))
                rail.appendChild(btn)
            })

            return { el: rail }
        }

        function animateSectionIn(sec) {
            const inner = sec.querySelector('.section-inner')
            if (!inner) return
            const kids = Array.from(inner.children || [])
            if (!kids.length) return

            gsap.killTweensOf(kids)
            gsap.set(kids, { autoAlpha: 0, y: 12 })
            gsap.to(kids, {
                autoAlpha: 1,
                y: 0,
                duration: 0.52,
                ease: 'power2.out',
                stagger: 0.05
            })
        }
    }

    function setupAdobeGallery() {
        const dlg = document.getElementById('lightbox')
        const img = dlg?.querySelector('#lightboxImage')
        if (!dlg || !img) return

        let shell = dlg.querySelector('.lb-shell')
        if (!shell) {
            shell = document.createElement('div')
            shell.className = 'lb-shell'
            img.parentNode?.insertBefore(shell, img)
            shell.appendChild(img)
        }

        let closeBtn =
            dlg.querySelector('[data-lb="close"]') ||
            dlg.querySelector('.lb-close')

        if (!closeBtn) {
            closeBtn = document.createElement('button')
            closeBtn.type = 'button'
            closeBtn.textContent = '×'
            shell.appendChild(closeBtn)
        }

        closeBtn.classList.add('lb-close')
        closeBtn.setAttribute('aria-label', 'Close')

        dlg.querySelectorAll('.lb-close').forEach((b) => {
            if (b !== closeBtn) b.remove()
        })

        const groups = {}
        document.querySelectorAll('[data-role="media-thumb"]').forEach((btn) => {
            const group = btn.dataset.group || 'default'
            const src = btn.dataset.src || btn.querySelector('img')?.src
            if (!src) return
            groups[group] ||= []
            groups[group].push(src)
            btn.addEventListener('click', () => open(group, groups[group].indexOf(src)))
        })

        let activeGroup = null
        let activeIndex = 0

        function setImage() {
            const arr = groups[activeGroup] || []
            if (!arr.length) return
            if (activeIndex < 0) activeIndex = arr.length - 1
            if (activeIndex >= arr.length) activeIndex = 0
            img.src = arr[activeIndex]
        }

        function open(group, index) {
            activeGroup = group
            activeIndex = index
            setImage()

            dlg.classList.remove('is-open', 'is-closing')

            if (typeof dlg.showModal === 'function') dlg.showModal()
            else dlg.setAttribute('open', '')

            requestAnimationFrame(() => {
                dlg.classList.add('is-open')
            })
        }

        function openSingle(src) {
            activeGroup = '__single__'
            groups[activeGroup] = [src]
            activeIndex = 0
            setImage()

            dlg.classList.remove('is-open', 'is-closing')

            if (typeof dlg.showModal === 'function') dlg.showModal()
            else dlg.setAttribute('open', '')

            requestAnimationFrame(() => {
                dlg.classList.add('is-open')
            })
        }

        function reallyClose() {
            dlg.classList.remove('is-open', 'is-closing')
            try { dlg.close?.() } catch { dlg.removeAttribute('open') }
        }

        function close() {
            dlg.classList.remove('is-open')
            dlg.classList.add('is-closing')
            setTimeout(reallyClose, 260)
        }

        closeBtn.addEventListener('click', (e) => { e.stopPropagation(); close() })
        dlg.addEventListener('click', (e) => { if (e.target === dlg) close() })
        dlg.addEventListener('cancel', (e) => { e.preventDefault(); close() })

        // Click-to-zoom for project drawer images
        document.addEventListener('click', (e) => {
            const imgEl = e.target.closest('.proj-drawer-img')
            if (!imgEl) return
            const src = imgEl.getAttribute('src')
            if (!src) return
            openSingle(src)
        })
    }

    function canScrollVert(el, dy) {
        let node = el
        while (node && node !== document.body) {
            if (node.nodeType !== 1) { node = node.parentElement || node.parentNode; continue }
            try {
                const s = getComputedStyle(node)
                const oy = s.overflowY
                const vertScrollable = (oy === 'auto' || oy === 'scroll') && node.scrollHeight > node.clientHeight
                if (vertScrollable) {
                    if (dy > 0 && node.scrollTop + node.clientHeight < node.scrollHeight) return true
                    if (dy < 0 && node.scrollTop > 0) return true
                }
            } catch { }
            node = node.parentElement
        }
        return false
    }

    function initContactForm() {
        const form = document.getElementById('contactForm')
        const status = document.getElementById('contactStatus')
        const btn = document.getElementById('cfSendBtn')

        if (!form) return

        const setStatus = (msg, kind = 'info') => {
            if (!status) return
            status.textContent = msg || ''
            status.dataset.kind = kind
        }

        const emailLooksOk = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

        form.addEventListener('submit', async (e) => {
            e.preventDefault()

            const name = (form.querySelector('[name="name"]')?.value || '').trim()
            const email = (form.querySelector('[name="email"]')?.value || '').trim()
            const message = (form.querySelector('[name="message"]')?.value || '').trim()

            if (!name) { setStatus('Please enter your name.', 'error'); return }
            if (!email || !emailLooksOk(email)) { setStatus('Please enter a valid email.', 'error'); return }
            if (!message) { setStatus('Please enter a message.', 'error'); return }

            if (btn) btn.disabled = true
            setStatus('Sending…', 'info')

            try {
                const res = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, message })
                })

                let payload = null
                try { payload = await res.json() } catch { }

                if (!res.ok || payload?.ok === false) {
                    const msg = payload?.message || `Send failed (${res.status}).`
                    setStatus(msg, 'error')
                    if (btn) btn.disabled = false
                    return
                }

                setStatus('Sent. Thank you! I’ll get back to you ASAP.', 'ok')
                form.reset()

                setTimeout(() => setStatus(''), 1600)
            } catch (err) {
                setStatus('Network error - please try again.', 'error')
            } finally {
                if (btn) btn.disabled = false
            }
        })
    }


    function initProjectDrawer() {
        const dlg = document.getElementById('projectDrawer')
        if (!dlg) return

        const elTitle = document.getElementById('pdTitle')
        const elTags = document.getElementById('pdTags')
        const elLive = document.getElementById('pdLive')
        const elGit = document.getElementById('pdGit')
        const elVideo = document.getElementById('pdVideo')
        const elClose = document.getElementById('pdClose')
        const elHero = document.getElementById('pdHeroImg')
        const elProof = document.getElementById('pdProofStack')
        const elStory = document.getElementById('pdStory')
        const elSnap = document.getElementById('pdSnap')

        const PROJECTS = {
            "sales-admin": {
                title: "Sales Admin Portal (Scrum Team Project)",
                tags: ["C#", "ASP.NET MVC", "EF Core", "SQL Server", "JS/HTML/CSS", "Scrum"],
                links: { live: "", github: "", video: "" },
                slides: [
                    {
                        img: "/img/PrulariaHero.png",
                        html: `
    <h3>Project overview (2-week Scrum build)</h3>
    <p>
      For a client, we built a working <b>Sales Admin Portal</b> used to manage <b>orders</b> and <b>clients</b>.
      This was a <b>team of 6</b>, built in <b>2 weeks</b>, split into <b>two sprints</b>.
    </p>

    <h3>How we worked</h3>
    <ul>
      <li>We followed <b>Scrum</b> with a Scrum Master + Product Owner.</li>
      <li>Those roles rotated every <b>2 days</b> so everyone got hands-on experience.</li>
      <li>Work was tracked and delivered in sprint chunks (not random features).</li>
    </ul>

    <h3>What I did</h3>
    <ul>
      <li>Owned most of the <b>front-end</b>: layout, styling, and keeping the UI consistent across screens.</li>
      <li>Added small hooks/integration pieces so features behaved correctly end-to-end.</li>
      <li>Actively tested edge cases and helped resolve <b>merge conflicts</b> to keep the build stable.</li>
    </ul>

    <h3>Tech</h3>
    <ul>
      <li>C#, ASP.NET MVC, EF Core, SQL Server</li>
      <li>JavaScript, HTML/CSS</li>
    </ul>
  `
                    },
                    {
                        img: "/img/PrulariaStory1.png",
                        html: `
      <h3>Login (SQL-backed)</h3>
      <p>This is the login screen. Credentials are checked against our SQL Server database so only staff can access the admin portal.</p>

      <h3>Why it matters</h3>
      <ul>
        <li>Keeps customer and order data behind authentication.</li>
        <li>Sets the tone for the rest of the app: clean, simple, no confusion.</li>
      </ul>

      <h3>My part</h3>
      <ul>
        <li>UI layout + styling so it stays consistent with the rest of the portal.</li>
      </ul>
    `
                    },
                    {
                        img: "/img/Prularia1.png",
                        html: `
              <h3>Orders overview (unfiltered)</h3>
              <p>The main “work screen”. Admins can quickly scan orders, jump into details, and move to the next task fast.</p>
        
              <h3>What I focused on here</h3>
              <ul>
                <li>Readable layout (spacing, alignment, consistent buttons).</li>
                <li>Hover states so it feels responsive and “clickable”.</li>
                <li>Keeping the page calm even when there’s a lot of data.</li>
              </ul>
            `
                    },
                    {
                        img: "/img/PrulariaOrderFilters.png",
                        html: `
              <h3>Filtering + paging</h3>
              <p>This is where the portal becomes practical. Filters narrow results, and the UI shows what’s currently active so you don’t get lost.</p>
        
              <h3>What’s shown here</h3>
              <ul>
                <li>Filters with a clear “active” state (chips).</li>
                <li>Orders-per-page dropdown + page navigation.</li>
                <li>Designed for speed: find the right order in seconds.</li>
              </ul>
        
              <h3>My contribution</h3>
              <ul>
                <li>Built the filter UI + chips + the “feel” of the interactions.</li>
              </ul>
            `
                    },
                    {
                        img: "/img/PrulariaOrderDetails.png",
                        html: `
              <h3>Order details (editable)</h3>
              <p>Clicking an order opens a full detail view. Admins can edit fields, and changes save back to the database.</p>
        
              <h3>Why this screen matters</h3>
              <ul>
                <li>Most admin time is spent here — it had to be clear and consistent.</li>
                <li>Same layout patterns as the list view, so it feels familiar.</li>
                <li>Editing is straightforward (no “where do I click?” moments).</li>
              </ul>
        
              <h3>My part</h3>
              <ul>
                <li>Layout + form styling + spacing so it stays readable.</li>
              </ul>
            `
                    },
                    {
                        img: "/img/PrulariaOrderDetailsModal.png",
                        html: `
              <h3>Modal details / quick actions</h3>
              <p>Some actions don’t need a full page change. This modal pattern keeps you in context and saves clicks.</p>
        
              <h3>What this improves</h3>
              <ul>
                <li>Fast confirmations / edits without losing your place.</li>
                <li>Cleaner flow for repetitive admin tasks.</li>
                <li>Consistent styling across the whole portal.</li>
              </ul>
        
              <h3>My part</h3>
              <ul>
                <li>Reusable modal styling + hover states + button patterns.</li>
              </ul>
            `
                    },
                    {
                        img: "/img/PrulariaClients1.png",
                        html: `
              <h3>Clients overview</h3>
              <p>Same idea as orders: quick scanning, consistent actions, and easy navigation to a client’s details.</p>
        
              <h3>What I did</h3>
              <ul>
                <li>Kept the UI consistent with orders (same patterns, same rules).</li>
                <li>Made sure tables stay readable and don’t feel “busy”.</li>
              </ul>
            `
                    },
                    {
                        img: "/img/PrulariaClientsDetail.png",
                        html: `
              <h3>Client details</h3>
              <p>Admins can view and update client info in a clean detail view, using the same layout logic as order details.</p>
        
              <h3>Why it matters</h3>
              <ul>
                <li>Staff can update records quickly and confidently.</li>
                <li>Fewer mistakes because the UI is predictable.</li>
              </ul>
            `
                    },
                    {
                        img: "/img/Scrum3.png",
                        html: `
              <h3>Scrum: user stories & scope</h3>
              <p>This shows how we broke the project down into clear user stories (what the business needs, not just “tasks”).</p>
        
              <h3>What it proves</h3>
              <ul>
                <li>We worked from requirements, not vibes.</li>
                <li>Features were planned and tracked, not random commits.</li>
                <li>Helped the team stay aligned while building in parallel.</li>
              </ul>
            `
                    },
                    {
                        img: "/img/Scrum2.png",
                        html: `
              <h3>Scrum: burndown / sprint progress</h3>
              <p>We tracked sprint progress over time. It’s a quick way to show if the sprint is on-track or slipping.</p>
        
              <h3>Why I included this</h3>
              <ul>
                <li>Shows planning + follow-through.</li>
                <li>Shows that work was measured, not guessed.</li>
                <li>Gives a clear picture of sprint pace.</li>
              </ul>
            `
                    },
                    {
                        img: "/img/Scrum1.png",
                        html: `
              <h3>Scrum: time & sprint task tracking</h3>
              <p>We logged estimated time vs actual time during the sprint. It helped us adjust quickly and be realistic.</p>
        
              <h3>What it shows</h3>
              <ul>
                <li>Real sprint planning with estimates.</li>
                <li>Actual effort tracked per task.</li>
                <li>Clear accountability across the team.</li>
              </ul>
            `
                    }
                ]
            },

            "portfolio-accordion": {
                title: "Portfolio Website — Interactive Accordion UI",
                tags: ["HTML", "CSS", "JavaScript", "Tailwind", "Vite", "UX"],
                links: { live: "/", github: "https://github.com/yourname/yourrepo", video: "" },
                slides: [
                    {
                        img: "/img/Panel1BG.png",
                        html: `
          <h3>Goal & Constraints</h3>
          <ul>
            <li><b>Goal:</b> Recruiters skim fast, click for proof, waste zero time.</li>
            <li><b>Constraint:</b> Everything lives inside an accordion layout but still feels premium.</li>
          </ul>
        `
                    },
                    {
                        img: "/img/JavaScript.png",
                        html: `
          <h3>UI System</h3>
          <ul>
            <li>Accordion navigation with smooth transitions.</li>
            <li>Navigation resumes at the last opened panel.</li>
            <li>Spine animation cancels instantly when users switch (no jank / no waiting).</li>
          </ul>
        `
                    },
                    {
                        img: "/img/CSMVC.png",
                        html: `
          <h3>Accessibility & Polish</h3>
          <ul>
            <li>Keyboard support (arrows, Enter, Escape).</li>
            <li>Respects prefers-reduced-motion.</li>
            <li>Fast initial load, snappy interactions.</li>
          </ul>
        `
                    }
                ]
            },

            "java-aggregator": {
                title: "Price Aggregator & Opportunity Scanner",
                tags: ["Java", "REST/HTTP", "JSON", "OCR (Tesseract)", "Data Processing"],
                links: { live: "", github: "", video: "" },
                slides: [
                    {
                        img: "/img/WFMPipeline.png",
                        html: `
        <h3>Overview</h3>
        <p>
          This is a solo Java app that helps you pick the best reward, in a specific game, by reading the on-screen reward choices, 
          matching them to real item names, and checking live prices from the game’s market API.
        </p>

        <h3>How it works</h3>
        <ul>
          <li>You select a small capture region where the rewards appear.</li>
          <li>The app reads all 4 reward slots (OCR) and cleans up the text.</li>
          <li>It matches the result to real item names (even if OCR is messy).</li>
          <li>It pulls the lowest online sell price for each item and sorts the results so the best choice is obvious.</li>
        </ul>

        <h3>Why I built it</h3>
        <ul>
          I noticed a real inefficiency: 
          reward choices are time-sensitive, and picking blindly can mean losing currency long-term.
I built this app to turn that decision into a quick, data-backed choice.
It also pushed me to learn new parts of Java that I hadn’t used before 
- OCR via Tess4J and integrating a live market API — in a project that has a clear purpose.
        </ul>
      `
                    },
                    {
                        img: "/img/WFMSlide4.png",
                        html: `
        <h3>Capture → OCR → Match (the hard part)</h3>
        <p>
          The app grabs a screenshot of a selected region, splits it into 4 reward slots,
          then preprocesses the image so OCR has a fighting chance.
        </p>

        <h3>How it reads the rewards</h3>
        <ul>
          <li>Split the captured rectangle into 4 vertical slices (one per reward).</li>
          <li>Preprocess: high contrast black/white + scale up.</li>
          <li>OCR each slot with Tess4J (Tesseract).</li>
          <li>Clean up OCR output (remove noise, normalize spacing, kill duplicates).</li>
        </ul>

        <h3>How it avoids bad reads</h3>
        <ul>
          <li>Fuzzy matching against a cached list of prime-part names.</li>
          <li>Confidence threshold: if it’s too messy, it won’t pretend it’s correct.</li>
          <li>Special-case handling for common weird reads (example: “Forma”).</li>
        </ul>
      `
                    },
                    {
                        img: "/img/WFMSlide1.png",
                        html: `
        <h3>Market data tab (API + sanity checks)</h3>
        <p>
          This tab pulls and ranks items so you can see what’s valuable / in-demand.
          It also caches results and respects rate limits so the API doesn’t get hammered.
        </p>

        <h3>What’s going on here</h3>
        <ul>
          <li>Fetch list of tradable items and normalize names/slugs.</li>
          <li>Cache responses so repeated checks are fast.</li>
          <li>Rate limiting built-in (no spam calls).</li>
          <li>Shows “top results” so you instantly see what’s hot.</li>
        </ul>

        <h3>Why this matters</h3>
        <ul>
          <li>Fast refresh without waiting forever.</li>
          <li>Stable results even if you check often.</li>
        </ul>
      `
                    },
                    {
                        img: "/img/WFMSlide3.png",
                        html: `
        <h3>Reward Scanner results</h3>
        <p>
          After OCR + matching, the app fetches the lowest online PC sell prices,
          sorts the 4 rewards, and highlights the best pick.
        </p>

        <h3>What it shows</h3>
        <ul>
          <li>Detected reward name + match confidence.</li>
          <li>Lowest online sell price for each slot.</li>
          <li>Auto-sorted so the best choice is obvious.</li>
          <li>Clickable / copyable slugs (depending on your UI).</li>
        </ul>

        <h3>Small but important details</h3>
        <ul>
          <li>If OCR confidence is low, it won’t “lie” — it marks it as uncertain.</li>
          <li>Results are repeatable because matching is controlled and cleaned.</li>
        </ul>
      `
                    }
                ]
            },

            "unity-pra": {
                title: "PRA Prototype — First-Person Parkour + Spellweaving (Unity)",
                tags: ["Unity", "C#", "URP", "RenderGraph", "Shaders", "Systems Design", "Performance"],
                links: { live: "", github: "", video: "" },
                slides: [
                    {
                        img: "/img/Unity.png",
                        html: `
        <h3>Project overview</h3>
        <p>A fast first-person prototype focused on <b>momentum movement</b> + <b>spell composition</b>, with custom URP visuals built to stay performant.</p>

        <h3>Core pillars</h3>
        <ul>
          <li><b>Movement first:</b> responsive traversal that feels good at speed.</li>
          <li><b>Spellweaving:</b> element + modifiers + form, resolved instantly at runtime.</li>
          <li><b>Custom visuals:</b> a dash effect that “tears reality” using URP + depth-based projection.</li>
        </ul>

        <h3>What I cared about</h3>
        <ul>
          <li>No input lag, no stutters, no “systems fighting each other”.</li>
          <li>Everything data-driven where it matters, and deterministic to debug.</li>
        </ul>
      `
                    },
                    {
                        img: "/img/PRA1.gif",
                        html: `
        <h3>Movement showcase</h3>
        <p>The traversal is built around <b>momentum control</b>, not canned animations — speed is earned and preserved.</p>

        <h3>Movement system details</h3>
        <ul>
          <li><b>State machine</b> for predictability (sprint, dash, wallrun, slide, vault, air states).</li>
          <li><b>Sliding</b> preserves momentum, then bleeds speed via friction… unless the slope is steep enough (≈ <b>45°+</b>) where gravity wins.</li>
          <li><b>Vaulting</b> uses an exit vector derived from your entry vector, so high-speed lines stay fluid.</li>
          <li><b>Wallrunning</b> is energy-capped and ramps gravity back in over time (no infinite glue).</li>
        </ul>

        <h3>Why it feels good</h3>
        <ul>
          <li>Speed doesn’t randomly disappear.</li>
          <li>Transitions are readable and controllable at high velocity.</li>
          <li>Systems are tuned to reward clean movement lines.</li>
        </ul>
      `
                    },
                    {
                        img: "/img/PRASpellWeave.gif",
                        html: `
        <h3>Spellweaving in action</h3>
        <p>You build spells on the fly: <b>Element → Modifiers → Form</b>. The system resolves it instantly without slowing movement.</p>

        <h3>How it resolves fast</h3>
        <ul>
          <li><b>Elements use a bitmask key</b> (orderless combos) so resolution is cheap.</li>
          <li>The element key hits an <b>O(1) table lookup</b> to get the base payload.</li>
          <li><b>Modifiers aren’t looked up</b> — they’re just <b>math transforms</b> applied to the payload (multi, spread, pierce, homing strength, etc.).</li>
          <li><b>Form</b> is the executor (projectile / wave / beam style behavior), keeping the pipeline clean.</li>
        </ul>

        <h3>Making skills feel unique (single-instance overrides)</h3>
        <ul>
          <li>Most spells follow the same pipeline, but <b>specific “signature” casts can override</b> values (VFX intensity, timings, curve quirks, special rules).</li>
          <li>This keeps the system reusable while still allowing <b>hand-tuned standout abilities</b>.</li>
        </ul>

        <h3>Why it matters</h3>
        <ul>
          <li>High variety without runtime cost.</li>
          <li>Easy to expand: add data + tuning, not new branching code paths.</li>
          <li>Stays responsive even while sprinting, sliding, and dashing.</li>
        </ul>
      `
                    },
                    {
                        img: "/img/DashFXSlide.png",
                        html: `
        <h3>Dash FX — depth-projected grid + masking</h3>
        <p>This dash effect uses the camera’s depth to project a grid onto real surfaces, then reveals it through vignette + block gating during the dash.</p>

        <h3>Pipeline (the 3 stages in the image)</h3>
        <ul>
          <li><b>1) Depth → world reconstruction:</b> sample depth, rebuild world position per pixel, derive surface orientation from screen-space derivatives.</li>
          <li><b>2) Vignette mask:</b> inverted mask controls where the effect is allowed to show (clean readability).</li>
          <li><b>3) Block falloff:</b> hashed block grid decides which cells reveal, so the tear feels noisy + dynamic instead of a flat overlay.</li>
        </ul>

        <h3>Why it’s built this way</h3>
        <ul>
          <li>Looks “anchored” to the scene instead of screen-space sticker noise.</li>
          <li>Cheap shaping controls (vignette + blocks) = strong art direction without heavy cost.</li>
          <li>Designed to work cleanly in URP pipelines (including RenderGraph paths).</li>
        </ul>
      `
                    },
                    {
                        img: "/img/Unity.png",
                        html: `
        <h3>Performance & pooling</h3>
        <p>This project is designed to survive stress: lots of movement, lots of effects, no garbage spikes.</p>

        <h3>What I did</h3>
        <ul>
          <li><b>Pooling</b> for projectiles, impact VFX, decals, and audio one-shots.</li>
          <li><b>Budgets</b> for spawns (deny or degrade when limits are hit instead of tanking FPS).</li>
          <li>Profiling hooks so it’s easy to see what costs what.</li>
        </ul>

        <h3>Result</h3>
        <ul>
          <li>Stable runtime behavior during fast traversal + repeated casting.</li>
          <li>No “one big dash = 40ms hitch” nonsense.</li>
        </ul>
      `
                    }
                ]
            }
        }

        let lastFocusEl = null

        // Focus trap for <dialog id="projectDrawer">
        const FOCUSABLE_SEL =
            'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

        function getFocusable() {
            return Array.from(dlg.querySelectorAll(FOCUSABLE_SEL))
                .filter(el => el.offsetParent !== null || el.getClientRects().length)
        }

        function trapFocusOn() {
            if (dlg.__trapOn) return
            dlg.__trapOn = true

            dlg.addEventListener('keydown', (dlg.__trapHandler = (e) => {
                if (e.key === 'Escape') {
                    e.preventDefault()
                    closeDrawer()
                    return
                }

                if (e.key !== 'Tab') return

                const items = getFocusable()
                if (!items.length) return

                const first = items[0]
                const last = items[items.length - 1]
                const active = document.activeElement

                if (e.shiftKey) {
                    if (active === first || !dlg.contains(active)) {
                        e.preventDefault()
                        last.focus()
                    }
                } else {
                    if (active === last) {
                        e.preventDefault()
                        first.focus()
                    }
                }
            }))
        }

        function trapFocusOff() {
            if (!dlg.__trapOn) return
            dlg.__trapOn = false
            if (dlg.__trapHandler) dlg.removeEventListener('keydown', dlg.__trapHandler)
            dlg.__trapHandler = null
        }

        function setLink(a, url) {
            if (!a) return
            if (url && url.trim().length) {
                a.hidden = false
                a.href = url
            } else {
                a.hidden = true
                a.removeAttribute('href')
            }
        }

        function renderSlides(data) {
            if (!elSnap) return

            elSnap.scrollTop = 0
            requestAnimationFrame(() => { elSnap.scrollTop = 0 })

            const slides =
                (Array.isArray(data.slides) && data.slides.length)
                    ? data.slides
                    : [{ img: data.heroImg || '', html: data.storyHtml || '' }]

            elSnap.innerHTML = slides.map((s, i) => `
        <section class="proj-drawer-step" data-step="${i}">
            <div class="proj-drawer-grid">
                <aside class="proj-drawer-proof">
                    ${s.img ? `<img class="proj-drawer-img" src="${s.img}" alt="${(data.title || 'Project') + ' — slide ' + (i + 1)}" loading="lazy">` : ``}
                </aside>

                <article class="proj-drawer-story">
                    ${s.html || ''}
                </article>
            </div>
        </section>
    `).join('')
        }

        function openDrawer(key, focusEl) {
            const data = PROJECTS[key]
            if (!data) return

            lastFocusEl = focusEl || null
            modalOpen = true

            if (elTitle) elTitle.textContent = data.title || 'Project'
            if (elTags) elTags.innerHTML = (data.tags || []).map(t => `<span class="proj-tag">${t}</span>`).join('')

            setLink(elLive, data.links?.live || '')
            setLink(elGit, data.links?.github || '')
            setLink(elVideo, data.links?.video || '')

            renderSlides(data)

            document.dispatchEvent(new Event('rotatorPause'))

            if (typeof dlg.showModal === 'function') dlg.showModal()
            else dlg.setAttribute('open', '')

            trapFocusOn()
            setTimeout(() => elClose?.focus(), 0)
        }

        function closeDrawer() {
            if (!dlg.hasAttribute('open') && typeof dlg.open === 'boolean' && !dlg.open) return

            trapFocusOff()

            try { dlg.close?.() } catch { dlg.removeAttribute('open') }

            if (elSnap) {
                elSnap.scrollTop = 0
                requestAnimationFrame(() => { elSnap.scrollTop = 0 })
            }

            modalOpen = false
            document.dispatchEvent(new Event('rotatorResume'))

            setTimeout(() => lastFocusEl?.focus?.(), 0)
        }

        dlg.addEventListener('close', () => {
            trapFocusOff()
            modalOpen = false
        })

        elClose?.addEventListener('click', (e) => {
            e.preventDefault()
            closeDrawer()
        })

        dlg.addEventListener('click', (e) => {
            if (e.target === dlg) closeDrawer()
        })

        dlg.addEventListener('cancel', (e) => {
            e.preventDefault()
            closeDrawer()
        })

        // Bind project cards → open the drawer with the right slide pack
        document.querySelectorAll('[data-project-card], [data-project]').forEach((card) => {
            card.addEventListener('click', () => {
                const key = card.getAttribute('data-project')
                if (!key) return
                openDrawer(key, card)
            })
        })

        const projectModal = document.getElementById('projectModal')

        const openProjectModal = () => {
            if (!projectModal) return
            projectModal.classList.add('is-open')
            projectModal.setAttribute('aria-hidden', 'false')
            modalOpen = true
        }

        const closeProjectModal = () => {
            if (!projectModal) return
            projectModal.classList.remove('is-open')
            projectModal.setAttribute('aria-hidden', 'true')
            modalOpen = false
        }

        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-close="projectModal"]')
            if (btn) closeProjectModal()
        })

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modalOpen) closeProjectModal()
        })
    }

    function initMediaLightbox() {
        // unchanged from your working version
    }
})
