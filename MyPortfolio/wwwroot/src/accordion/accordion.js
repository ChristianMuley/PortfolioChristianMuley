import { setT, showEl, hideEl } from '../utils/dom.js'
import { raf } from '../utils/timing.js'
import { canScrollVert } from '../utils/scroll.js'
import { panelIndexFromHash, writePanelToUrl } from './url.js'
import { initMediaLightbox } from '../lightbox/mediaLightbox.js'
import {runHeroTypewriterOnce} from "../intro/typewriter.js";

export function initAccordion({
                                  gsap,
                                  uiState,
                                  snapRoot,
                                  scanNav,
                                  header,
                                  footer,
                                  sections,
                                  panelMeta,
                                  initialIndex = 0,
                                  onPanelBecameA = () => { },
                              }) {
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

    // Edge forks thickness + right fork push-in
    const SPINE_FORK_THICKNESS = 10
    const SPINE_FORK_INSET = 0
    const SPINE_FORK_RIGHT_PUSH_IN = 0 // tweak if you want

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
    // ─────────────────────────────────────────────────────────────
    const INNER_SCROLL_PAD_BOTTOM = 110

    function applyPanelScrollability(activeIdx) {
        sections.forEach((sec, i) => {
            const inner = sec.querySelector('.section-inner')
            if (!inner) return

            if (i === activeIdx) {
                const activeId = sections[activeIdx]?.id
                
                if (activeId === 'B') {
                    inner.classList.remove('panel-scroll')
                    inner.style.overflowY = 'hidden'
                    inner.style.overflowX = 'hidden'
                    inner.style.maxHeight = ''
                    inner.style.paddingBottom = ''
                    return
                }

                inner.classList.add('panel-scroll')
                inner.style.overflowY = 'auto'
                inner.style.overflowX = 'hidden'
                inner.style.webkitOverflowScrolling = 'touch'
                inner.style.overscrollBehavior = 'contain'
                inner.style.maxHeight = `${openHeight()}px`
                inner.style.paddingBottom = `0px`
            } else {
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
        const idx = panelIndexFromHash(sections)
        if (idx === current) return
        requestGoTo(idx, { skipUrl: true })
    }

    window.addEventListener('popstate', () => { if (!uiState.modalOpen) syncFromUrl() })
    window.addEventListener('hashchange', () => { if (!uiState.modalOpen) syncFromUrl() })

    const spineDrop = document.createElement('div')
    spineDrop.id = 'navSpineDrop'
    Object.assign(spineDrop.style, {
        position: 'fixed', top: '0', left: '0', width: '0', height: '0',
        background: 'white', zIndex: '91', pointerEvents: 'none', opacity: '0'
    })

    const spineHug = document.createElement('div')
    spineHug.id = 'navSpineHug'
    Object.assign(spineHug.style, {
        position: 'fixed', left: '0', top: '0', width: '100vw',
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
        position: 'fixed', top: '0', left: '0',
        width: `${SPINE_FORK_THICKNESS}px`,
        height: '0',
        background: 'white',
        opacity: '0',
        pointerEvents: 'none',
        zIndex: '88'
    })

    const spineForkR = document.createElement('div')
    spineForkR.id = 'navSpineForkR'
    Object.assign(spineForkR.style, {
        position: 'fixed', top: '0', right: '0', left: 'auto',
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

    if (window.ResizeObserver) {
        const ro = new ResizeObserver(() => {
            if (lock || uiState.modalOpen) return
            cancelSpineNow()
            updateSpine(current, { instant: true })
        })

        if (scanNav) ro.observe(scanNav)
        else if (header) ro.observe(header)

        if (snapRoot) ro.observe(snapRoot)
    }


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

    // Ensure only the current panel is visible
    sections.forEach((sec, i) => sec.classList.toggle('is-current', i === current))

    updateNavAndPills(current)
    applyPanelScrollability(current)
    initMediaLightbox()

    // Kick typewriter immediately on boot if we start on panel A
    if (sections[current]?.id === 'A') {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                runHeroTypewriterOnce()
            })
        })
    }


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
        if (uiState.modalOpen) return

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
        if (uiState.modalOpen) return

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
    let startX = null

    window.addEventListener('touchstart', (e) => {
        startY = e.touches[0].clientY
        startX = e.touches[0].clientX
    }, { passive: true })

    window.addEventListener('touchmove', (e) => {
        if (startY == null || lock || uiState.modalOpen) return

        const y = e.touches[0].clientY
        const x = e.touches[0].clientX
        const dy = startY - y
        const dx = startX - x

        // ignore mostly-horizontal swipes (don’t fight horizontal gestures)
        if (Math.abs(dx) > Math.abs(dy)) return

        const currentId = sections[current]?.id

        // On Skills panel: swipe cycles skills cards first
        if (currentId === 'B' && skillsGate) {
            if (Math.abs(dy) > 40) {
                // allow preventDefault
                e.preventDefault()

                const consumed = skillsGate.consumeWheel(dy, e)
                if (consumed) {
                    // reset anchor so one continuous swipe can advance multiple cards
                    startY = y
                    startX = x
                    return
                }
            }
        }
        
        const innerScroll = sections[current]?.querySelector('.section-inner.panel-scroll')
        if (innerScroll) {
            const canScrollDown = innerScroll.scrollTop + innerScroll.clientHeight < innerScroll.scrollHeight - 2
            const canScrollUp = innerScroll.scrollTop > 2

            // dy > 0 means finger moved up (scrolling down)
            if (dy > 0 && canScrollDown) return
            if (dy < 0 && canScrollUp) return
        }

        if (Math.abs(dy) > 40) {
            e.preventDefault()
            dy > 0 ? goNext() : goPrev()
            startY = null
            startX = null
        }
    }, { passive: false })

    window.addEventListener('touchend', () => {
        startY = null
        startX = null
    }, { passive: true })


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
        if (lock || uiState.modalOpen) return
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

    function goNext() { requestGoTo(Math.min(sections.length - 1, current + 1)) }
    function goPrev() { requestGoTo(Math.max(0, current - 1)) }

    function findNavAnchor(panelId) {
        const candidates = [
            document.querySelector(`.panel-nav[data-panel="${panelId}"]`),
            document.querySelector(`#scanNav [data-panel="${panelId}"]`),
            document.querySelector(`#scanNav a[href="#${panelId}"]`),
            document.querySelector(`.dot-rail-btn[data-panel="${panelId}"]`),
            document.querySelector(`.dot-rail-btn[aria-controls="${panelId}"]`),
        ].filter(Boolean)

        // Prefer a visible element (responsive layouts often keep a hidden duplicate)
        const visible = candidates.find(el => el.getClientRects().length > 0)
        return visible || candidates[0] || null
    }


    function updateNavAndPills(idx) {
        const id = `#${sections[idx].id}`

        document.querySelectorAll('#scanNav a[href]').forEach(a => {
            const on = a.getAttribute('href') === id
            a.classList.toggle('is-active', on)
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

        // Top edge reference: navbar top if available, otherwise screen top
        const navShellEl = document.querySelector('.nav-shell') || scanNav || header
        const navShellRect = navShellEl?.getBoundingClientRect?.() || { top: 0 }

        const dropExtra = (idx === 0) ? SPINE_DROP_EXTRA_FIRST : SPINE_DROP_EXTRA
        const hugHeight = (idx === 0) ? SPINE_HUG_HEIGHT_FIRST : SPINE_HUG_HEIGHT
        
        const dropTop = Math.round(navShellRect.top) // or: 0 for literal screen edge
        const dropWidth = Math.round(btnRect.width + SPINE_DROP_INFLATE)
        const dropLeft = Math.round((btnRect.left + (btnRect.width / 2)) - (dropWidth / 2))

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

                sections.forEach((sec, i) => sec.classList.toggle('is-current', i === to))

                if (sections[to]?.id === 'B' && skillsGate) {
                    if (from < to) skillsGate.toFirst()
                    else if (from > to) skillsGate.toLast()
                }

                updateNavAndPills(to)
                updateSpine(to, { instant: false })

                if (toInner) toInner.style.pointerEvents = 'auto'
                applyPanelScrollability(to)

                if (!skipUrl) writePanelToUrl(sections[to].id)
                if (sections[to].id === 'A') onPanelBecameA()

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
