// wwwroot/src/main.js
import './styles.css'
import gsap from 'gsap'

// --- Anti-FOUC: hide all panels & heads until we explicitly reveal ---
    ;(() => {
    const s = document.createElement('style')
    s.id = 'critical-hide'
    s.textContent = `
    #snapRoot{visibility:hidden}
    .section .section-inner{visibility:hidden;opacity:0;transform:translateY(-16px)}
    .panel-head-full{opacity:0}
  `
    document.head.appendChild(s)
})()

document.addEventListener('DOMContentLoaded', () => {
    const intro      = document.getElementById('intro')
    const introContent = document.querySelector('#intro .text-center')
    const snapRoot   = document.getElementById('snapRoot')
    const scanNav    = document.getElementById('scanNav')
    const replayLink = document.getElementById('replayIntro')
    const sections   = Array.from(document.querySelectorAll('.section'))
    const header     = document.querySelector('header')
    const footer     = document.querySelector('footer.footer')

    // helpers
    const setT   = (el, px) => { if (el) el.style.transform = `translateY(${px|0}px)` }
    const showEl = (el) => { if (el) { el.style.visibility = 'visible'; el.style.pointerEvents = 'auto' } }
    const hideEl = (el) => { if (el) { el.style.visibility = 'hidden'; el.style.pointerEvents = 'none' } }
    const revealSnapRoot = () => {
        snapRoot.style.visibility = 'visible'
        document.getElementById('critical-hide')?.remove()
    }

    if (scanNav) scanNav.classList.add('show')

    const panelMeta = [
        { id: 'A', title: 'Intro / About' },
        { id: 'B', title: 'Skills' },
        { id: 'C', title: 'C# / MVC' },
        { id: 'D', title: 'Unity' },
        { id: 'E', title: 'Adobe Suite' },
        { id: 'F', title: 'FL Studio' },
        { id: 'G', title: 'Experience' },
        { id: 'H', title: 'Hobbies' },
        { id: 'Contact', title: 'Contact' }
    ]

    // tone
    sections.forEach((sec, i) => {
        const tone = (i % 2 === 0) ? 'dark' : 'light'
        sec.dataset.panelTone = tone
        sec.classList.toggle('tone-dark', tone === 'dark')
        sec.classList.toggle('tone-light', tone === 'light')
    })

    // cookies
    const setCookie = (n, v, d) => {
        const days = typeof d === 'number' ? d : 365
        const t = new Date()
        t.setTime(t.getTime() + days * 864e5)
        document.cookie = `${n}=${encodeURIComponent(v)};expires=${t.toUTCString()};path=/;SameSite=Lax`
    }
    const delCookie = (n) => { document.cookie = `${n}=; Max-Age=0; path=/; SameSite=Lax` }
    const getCookie = (n) => {
        const hit = document.cookie.split('; ').find(r => r.startsWith(n + '='))
        return hit ? decodeURIComponent(hit.split('=')[1] || '') : null
    }

    // pre-hide all non-first safely (so when we reveal later, only first is visible)
    function preHideNonFirst () {
        sections.forEach((sec, i) => {
            const inner = sec.querySelector('.section-inner')
            const head  = sec.querySelector('.panel-head-full')
            if (!inner) return
            if (i === 0) {
                showEl(inner); setT(inner, 0); gsap.set(inner, { autoAlpha: 1 })
                if (head) head.style.opacity = '1'
            } else {
                hideEl(inner); setT(inner, -16); gsap.set(inner, { autoAlpha: 0 })
                if (head) head.style.opacity  = '0'
            }
        })
    }

    // always enforce "only current panel visible"
    function enforceOnlyCurrentVisible (idx) {
        sections.forEach((sec, i) => {
            const inner = sec.querySelector('.section-inner')
            const head  = sec.querySelector('.panel-head-full')
            if (!inner) return
            if (i === idx) {
                showEl(inner); gsap.set(inner, { autoAlpha: 1, clearProps: 'transform' })
                if (head) head.style.opacity = '1'
            } else {
                hideEl(inner); gsap.set(inner, { autoAlpha: 0, y: -16 })
                if (head) head.style.opacity = '0'
            }
        })
    }

    function radiusToCoverRect (rect, cx, cy, pad = 24) {
        const dx1 = rect.left  - cx, dy1 = rect.top    - cy
        const dx2 = rect.right - cx, dy2 = rect.top    - cy
        const dx3 = rect.right - cx, dy3 = rect.bottom - cy
        const dx4 = rect.left  - cx, dy4 = rect.bottom - cy
        const r2 = Math.max(dx1*dx1+dy1*dy1, dx2*dx2+dy2*dy2, dx3*dx3+dy3*dy3, dx4*dx4+dy4*dy4)
        return Math.sqrt(r2) + pad
    }

    // initial hide
    preHideNonFirst()
    setupAdobeGallery()

    // INTRO
    const buildIntroUI = () => {
        const uiWrap = document.createElement('div')
        uiWrap.className = 'mt-6 flex flex-col items-center gap-3'
        const enterBtn = document.createElement('button')
        enterBtn.type = 'button'
        enterBtn.textContent = 'Enter'
        enterBtn.className = 'inline-flex items-center justify-center rounded-full px-6 py-3 bg-accent text-ink/90 font-semibold tracking-wide shadow hover:shadow-md transition'
        const skipWrap = document.createElement('label')
        skipWrap.className = 'flex items-center gap-2 text-sm text-slate-600'
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

            // make sure only first is visible before we reveal root
            enforceOnlyCurrentVisible(0)

            const aSec  = sections[0]
            const aRect = aSec ? aSec.getBoundingClientRect() : snapRoot.getBoundingClientRect()
            const cx    = aRect.left + aRect.width / 2
            const cy    = aRect.top  + aRect.height / 2
            const maxR  = radiusToCoverRect(aRect, cx, cy)

            snapRoot.style.clipPath = `circle(0px at ${cx}px ${cy}px)`
            document.body.style.overflow = 'hidden'
            // reveal the app right when we start the reveal animation
            revealSnapRoot()

            gsap.timeline({ defaults: { ease: 'power2.inOut' } })
                .to({ rad: 0 }, {
                    rad: maxR, duration: 0.9,
                    onUpdate() { snapRoot.style.clipPath = `circle(${this.targets()[0].rad}px at ${cx}px ${cy}px)` }
                })
                .to('#intro .text-center', { autoAlpha: 0, duration: 0.55, ease: 'power2.out' }, '<')
                .to(intro, {
                    autoAlpha: 0, duration: 0.5, onComplete: () => {
                        intro.style.display = 'none'
                        snapRoot.style.clipPath = 'none'
                        document.body.style.overflow = 'hidden'
                        initAccordion()
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
        revealSnapRoot()
        initAccordion()
        return
    }

    snapRoot.style.clipPath = 'circle(0px at 50% 50%)'
    document.body.style.overflow = 'hidden'
    buildIntroUI()

    // ACCORDION
    function initAccordion () {
        let current = 0
        let lock = false
        const COLLAPSED_H = 20

        const TOP_PILL_OFFSET = 60
        const BOTTOM_PILL_OFFSET = 6
        const PREV_FADE_DURATION = 0.45

        const DARK_SPINE_COLORS  = ['#ef4444', '#06b6d4', '#22c55e', '#f59e0b']
        const LIGHT_SPINE_COLORS = ['#a855f7', '#000000', '#2563eb']

        const SPINE_DROP_EXTRA       = 20
        const SPINE_DROP_EXTRA_FIRST = 0
        const SPINE_HUG_HEIGHT       = 10
        const SPINE_HUG_HEIGHT_FIRST = 16
        const SPINE_DROP_INFLATE     = 8
        const SPINE_FORK_THICKNESS   = 6
        const SPINE_FORK_INSET       = 0
        const SPINE_FORK_LEN_MIN     = 10
        const SPINE_FORK_LEN_MIN_FIRST=11
        const SPINE_FORK_LEN_PCT     = 0.4
        const SPINE_FORK_LEN_PCT_FIRST=0.4

        const ACTIVE_NAV_SLIDE_PX       = 3
        const ACTIVE_NAV_SLIDE_DURATION = 0.65

        const headerH = () => header?.getBoundingClientRect?.().height || 0
        const footerH = () => footer?.getBoundingClientRect?.().height || 0
        const rootH   = () => snapRoot?.getBoundingClientRect?.().height || (window.innerHeight - headerH() - footerH())
        const openHeight = () => Math.max(0, rootH() - (COLLAPSED_H * 2))

        // spine DOM (keep references in closure for reliable updates)
        const spineDrop = document.createElement('div')
        spineDrop.id = 'navSpineDrop'
        Object.assign(spineDrop.style, { position:'fixed', top:'0', left:'0', width:'0', height:'0', background:'white', zIndex:'91', pointerEvents:'none', opacity:'0' })
        const spineHug = document.createElement('div')
        spineHug.id = 'navSpineHug'
        Object.assign(spineHug.style, { position:'fixed', left:'0', top:'0', width:'100vw', height:`${SPINE_HUG_HEIGHT}px`, background:'white', transform:'scaleX(0)', transformOrigin:'50% 0%', zIndex:'90', pointerEvents:'none', opacity:'0', willChange:'transform' })
        const spineForkL = document.createElement('div')
        spineForkL.id = 'navSpineForkL'
        Object.assign(spineForkL.style, { position:'fixed', top:'0', left:'0', width:`${SPINE_FORK_THICKNESS}px`, height:'0', background:'white', opacity:'0', pointerEvents:'none', zIndex:'88' })
        const spineForkR = document.createElement('div')
        spineForkR.id = 'navSpineForkR'
        Object.assign(spineForkR.style, { position:'fixed', top:'0', left:'0', width:`${SPINE_FORK_THICKNESS}px`, height:'0', background:'white', opacity:'0', pointerEvents:'none', zIndex:'88' })
        document.body.append(spineDrop, spineHug, spineForkL, spineForkR)

        const navLabel = document.createElement('div')
        navLabel.id = 'navSpineLabel'
        Object.assign(navLabel.style, { position:'fixed', left:'0', top:'0', width:'0', height:'0', pointerEvents:'none', opacity:'0', textAlign:'center', whiteSpace:'nowrap', willChange:'transform, opacity' })
        document.body.appendChild(navLabel)

        function setSpineZAboveNav() {
            const anchor = scanNav || header || document.documentElement
            const raw = getComputedStyle(anchor).zIndex
            const navZ = Number.isFinite(parseInt(raw)) ? parseInt(raw) : 0
            const baseZ = navZ > 0 ? navZ : 9999
            spineDrop.style.zIndex  = String(baseZ + 20)
            spineHug.style.zIndex   = String(baseZ + 19)
            spineForkL.style.zIndex = String(baseZ + 18)
            spineForkR.style.zIndex = String(baseZ + 18)
            navLabel.style.zIndex   = String(baseZ + 21)
        }
        setSpineZAboveNav()
        window.addEventListener('resize', setSpineZAboveNav)

        // pills
        const prevPill = document.createElement('button')
        Object.assign(prevPill.style, { position:'fixed', top:`calc(${headerH()}px + ${TOP_PILL_OFFSET}px)`, left:'50%', transform:'translateX(-50%)', padding:'0.4rem 1.1rem', borderRadius:'9999px', background:'rgba(17,24,39,0.45)', border:'1px solid rgba(255,255,255,0.12)', backdropFilter:'blur(8px)', display:'none', gap:'0.4rem', alignItems:'center', fontSize:'0.7rem', fontWeight:'600', color:'#fff', boxShadow:'0 8px 28px rgba(15,23,42,0.35)', zIndex:'140' })
        const prevText = document.createElement('span')
        const prevIcon = document.createElement('span'); prevIcon.textContent = '↑'; prevIcon.style.opacity = '0.6'
        prevPill.append(prevText, prevIcon); document.body.appendChild(prevPill)

        const nextPill = document.createElement('button')
        Object.assign(nextPill.style, { position:'fixed', bottom:`calc(${footerH()}px + ${BOTTOM_PILL_OFFSET}px)`, left:'50%', transform:'translateX(-50%)', padding:'0.4rem 1.1rem', borderRadius:'9999px', background:'rgba(17,24,39,0.45)', border:'1px solid rgba(255,255,255,0.12)', backdropFilter:'blur(8px)', display:'flex', gap:'0.4rem', alignItems:'center', fontSize:'0.7rem', fontWeight:'600', color:'#fff', boxShadow:'0 8px 28px rgba(15,23,42,0.35)', zIndex:'140' })
        const nextText = document.createElement('span')
        const nextIcon = document.createElement('span'); nextIcon.textContent = '↓'
        nextPill.append(nextText, nextIcon); document.body.appendChild(nextPill)

        // dot rail
        const dotRail = buildDotRail()
        document.body.appendChild(dotRail.el)

        // prep panels (heights + strict visibility)
        sections.forEach((sec, i) => {
            sec.style.overflow = 'hidden'
            const inner = sec.querySelector('.section-inner')
            const head  = sec.querySelector('.panel-head-full')
            if (i === 0) {
                sec.style.height = `${openHeight()}px`
                sec.style.pointerEvents = 'auto'
                sec.dataset.isOpen = '1'
                if (inner) { showEl(inner); setT(inner, 0); gsap.set(inner, { autoAlpha: 1 }) }
                if (head) head.style.opacity = '1'
            } else if (i === 1) {
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
        enforceOnlyCurrentVisible(0)

        updateNavAndPills(0)
        updateSpine(0, { instant: true })
        initAutoRotators()
        initMediaLightbox()

        // inputs
        let wheelSum = 0, wheelTimer = null
        window.addEventListener('wheel', (e) => {
            if (lock) return
            if (canScrollVert(e.target, e.deltaY)) return
            e.preventDefault()
            wheelSum += e.deltaY
            clearTimeout(wheelTimer)
            wheelTimer = setTimeout(() => { wheelSum = 0 }, 90)
            if (Math.abs(wheelSum) >= 120) { wheelSum > 0 ? goNext() : goPrev(); wheelSum = 0 }
        }, { passive: false })

        document.addEventListener('keydown', (e) => {
            if (lock) return
            const tag = (e.target && e.target.tagName) || ''
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return
            if (e.key === 'PageDown' || e.key === 'ArrowDown' || e.key === ' ') { e.preventDefault(); goNext() }
            else if (e.key === 'PageUp' || e.key === 'ArrowUp') { e.preventDefault(); goPrev() }
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

        document.querySelectorAll('a[href^="#"]').forEach(a => {
            a.addEventListener('click', e => {
                const id = a.getAttribute('href')
                if (!id || id === '#') return
                const targetIndex = sections.findIndex(s => `#${s.id}` === id)
                if (targetIndex === -1) return
                e.preventDefault()
                goTo(targetIndex)
            })
        })

        prevPill.addEventListener('click', () => { if (!lock) goPrev() })
        nextPill.addEventListener('click', () => { if (!lock) goNext() })

        window.addEventListener('resize', () => {
            sections.forEach((sec, i) => {
                if (i === current) sec.style.height = `${openHeight()}px`
                else if (i === current - 1 || i === current + 1) sec.style.height = `${COLLAPSED_H}px`
                else sec.style.height = '0px'
            })
            prevPill.style.top    = `calc(${headerH()}px + ${TOP_PILL_OFFSET}px)`
            nextPill.style.bottom = `calc(${footerH()}px + ${BOTTOM_PILL_OFFSET}px)`
            updateSpine(current, { instant: true })
        })

        function goNext () { goTo(Math.min(sections.length - 1, current + 1)) }
        function goPrev () { goTo(Math.max(0, current - 1)) }

        document.addEventListener('panelScrollFromLightbox', (e) => {
            const dir = e.detail?.dir || 0
            if (dir > 0) goNext()
            else if (dir < 0) goPrev()
        })

        // -------- Adobe "field cards" detection (text-based or class-based) --------
        const norm = (s) => (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
        function getAdobeCardsOrdered(inner) {
            // Prefer explicit classes if present
            let cards = Array.from(inner.querySelectorAll('.adobe-ps, .adobe-pr, .adobe-ae'))
            if (!cards.length) {
                // Fallback: guess by text from the three <article> cards
                const candidates = Array.from(inner.querySelectorAll('.grid > article, article'))
                cards = candidates.slice(0, 6) // keep it sane
            }
            const key = (el, i) => {
                const t = norm(el.textContent || '')
                if (/\bphotoshop\b|\bps\b/.test(t)) return 0
                if (/\bpremiere\b|\bpremiere pro\b|\bpr\b/.test(t)) return 1
                if (/\bafter[ -]?effects\b|\baftereffects\b|\bae\b/.test(t)) return 2
                return 100 + i
            }
            return cards
                .map((el, i) => ({ el, i, k: key(el, i) }))
                .sort((a,b)=> (a.k-b.k) || (a.i-b.i))
                .map(o=>o.el)
        }

        // animate in per-section; Adobe cards: PS → PR → AE, strictly one after another
        function animateSectionIn(secEl) {
            const inner = secEl.querySelector('.section-inner')
            if (!inner) return

            if (secEl.id === 'E') {
                const cards = getAdobeCardsOrdered(inner)
                const baseKids = Array.from(inner.children || [])
                const nonCards = baseKids.filter(k => !cards.includes(k) && !cards.some(c => c.contains(k)))
                if (nonCards.length) {
                    gsap.set(nonCards, { autoAlpha: 0, y: 12 })
                    gsap.to(nonCards, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.out', stagger: 0.04 })
                }
                if (cards.length) {
                    cards.forEach(c => { c.style.willChange = 'transform, opacity'; c.style.transformOrigin = '50% 100%' })
                    gsap.set(cards, { autoAlpha: 0, y: 64 })
                    cards.forEach((card, i) => {
                        gsap.to(card, {
                            autoAlpha: 1, y: 0,
                            duration: 0.42,
                            ease: 'power2.out',
                            delay: 0.08 + i * 0.5 // PS then PR then AE
                        })
                    })
                }
                return
            }

            // generic
            const kids = Array.from(inner.children || [])
            if (kids.length) {
                gsap.set(kids, { autoAlpha: 0, y: 12 })
                gsap.to(kids, { autoAlpha: 1, y: 0, duration: 0.34, ease: 'power2.out', stagger: 0.06, overwrite: true })
            }
        }

        // ---- NAV + SPINE ----
        function findNavAnchor (panelId) {
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

        function updateNavAndPills (idx) {
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
            const isLast  = idx === sections.length - 1

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

        function updateSpine (idx, opts = {}) {
            const { instant = false } = opts
            const navBtn  = findNavAnchor(sections[idx].id)
            if (!navBtn || !snapRoot) {
                gsap.set([spineDrop, spineHug, spineForkL, spineForkR], { opacity: 0 })
                navLabel.style.opacity = '0'
                return
            }

            const tone = sections[idx].dataset.panelTone === 'light' ? 'light' : 'dark'
            const vw = document.documentElement.clientWidth
            const palette = tone === 'dark' ? DARK_SPINE_COLORS : LIGHT_SPINE_COLORS
            const spineColor = palette[idx % palette.length]

            const btnRect  = navBtn.getBoundingClientRect()
            const snapRect = snapRoot.getBoundingClientRect()
            const navRect  = (scanNav || header)?.getBoundingClientRect?.() || { top: 0 }

            const dropExtra = (idx === 0) ? SPINE_DROP_EXTRA_FIRST : SPINE_DROP_EXTRA
            const hugHeight = (idx === 0) ? SPINE_HUG_HEIGHT_FIRST : SPINE_HUG_HEIGHT

            const dropTop    = Math.round(navRect.top)
            const dropLeft   = Math.round(btnRect.left - SPINE_DROP_INFLATE / 2)
            const dropWidth  = Math.round(btnRect.width + SPINE_DROP_INFLATE)
            const dropHeight = Math.max(0, Math.round((snapRect.top + dropExtra) - dropTop))
            const dropBottom = dropTop + dropHeight

            const availableForkLen = Math.max(0, Math.round(snapRect.bottom - dropBottom))
            const forkLenPct = (idx === 0) ? SPINE_FORK_LEN_PCT_FIRST : SPINE_FORK_LEN_PCT
            const forkMin    = (idx === 0) ? SPINE_FORK_LEN_MIN_FIRST : SPINE_FORK_LEN_MIN
            const forkLen    = Math.max(forkMin, Math.round(availableForkLen * forkLenPct))

            spineDrop.style.left        = `${dropLeft}px`
            spineDrop.style.background  = spineColor
            spineHug.style.background   = spineColor
            spineForkL.style.background = spineColor
            spineForkR.style.background = spineColor

            const cs = getComputedStyle(navBtn)
            const text = (navBtn.textContent || '').trim()
            navLabel.textContent = text
            navLabel.style.fontFamily    = cs.fontFamily
            navLabel.style.fontSize      = cs.fontSize
            navLabel.style.fontWeight    = cs.fontWeight || '600'
            navLabel.style.letterSpacing = cs.letterSpacing
            navLabel.style.color         = '#0f172a'
            navLabel.style.left          = `${btnRect.left}px`
            navLabel.style.width         = `${btnRect.width}px`
            navLabel.style.top           = `${btnRect.top}px`
            navLabel.style.height        = `${btnRect.height}px`
            navLabel.style.lineHeight    = `${btnRect.height}px`

            const forkLeftX  = SPINE_FORK_INSET
            const forkRightX = Math.max(0, vw - SPINE_FORK_THICKNESS - SPINE_FORK_INSET - 1)

            if (instant) {
                Object.assign(spineDrop.style, { top: `${dropTop}px`, width: `${dropWidth}px`, height: `${dropHeight}px`, opacity: '1' })
                Object.assign(spineHug.style, {
                    top: `${dropBottom}px`, height: `${hugHeight}px`, opacity: '1',
                    transform: 'scaleX(1)', transformOrigin: `${((dropLeft + dropWidth / 2) / vw) * 100}% 0%`
                })
                Object.assign(spineForkL.style, { left: `${forkLeftX}px`,  top: `${dropBottom}px`, height: `${forkLen}px`, opacity: '1' })
                Object.assign(spineForkR.style, { left: `${forkRightX}px`, top: `${dropBottom}px`, height: `${forkLen}px`, opacity: '1' })
                gsap.set(navLabel, { autoAlpha: 1 })
                navLabel.style.transform = `translateY(${ACTIVE_NAV_SLIDE_PX}px)`
                return
            }

            // fade-out then re-grow to the new active anchor (fixes "spine not following")
            gsap.to([spineDrop, spineHug, spineForkL, spineForkR], {
                opacity: 0, duration: 0.20, ease: 'power1.out',
                onComplete: () => {
                    Object.assign(spineDrop.style, { top: `${dropTop}px`, width: `${dropWidth}px`, height: '0px', opacity: '1' })
                    gsap.to(spineDrop, {
                        height: dropHeight, duration: 0.28, ease: 'power2.out',
                        onComplete: () => {
                            spineHug.style.top = `${dropBottom}px`
                            spineHug.style.height = `${hugHeight}px`
                            spineHug.style.opacity = '1'
                            spineHug.style.transformOrigin = `${((dropLeft + dropWidth / 2) / vw) * 100}% 0%`
                            spineHug.style.transform = 'scaleX(0)'

                            Object.assign(spineForkL.style, { left: `${forkLeftX}px`,  top: `${dropBottom}px`, height: '0px', opacity: '0' })
                            Object.assign(spineForkR.style, { left: `${forkRightX}px`, top: `${dropBottom}px`, height: '0px', opacity: '0' })

                            gsap.to(spineHug, {
                                delay: 0.03, duration: 1.2, ease: 'power0.none', scaleX: 1,
                                onComplete: () => {
                                    gsap.to([spineForkL, spineForkR], {
                                        delay: 0.06, height: forkLen, autoAlpha: 1, duration: 1.2, ease: 'power2.out'
                                    })
                                }
                            })
                        }
                    })
                }
            })

            navLabel.style.transform = 'translateY(-3px)'
            gsap.fromTo(navLabel, { autoAlpha: 0 }, { autoAlpha: 1, duration: ACTIVE_NAV_SLIDE_DURATION, ease: 'power2.out' })
            navLabel.style.transform = `translateY(${ACTIVE_NAV_SLIDE_PX}px)`
        }

        function goTo (idx) {
            if (idx === current || lock) return
            lock = true

            const from = current
            const to   = idx
            const hOpen = openHeight()

            const fromSec   = sections[from]
            const toSec     = sections[to]
            const fromInner = fromSec.querySelector('.section-inner')
            const toInner   = toSec.querySelector('.section-inner')
            const toHead    = toSec.querySelector('.panel-head-full')

            const wasOpen = fromSec.dataset.isOpen === '1'

            gsap.killTweensOf([fromInner, toInner])
            if (toInner) gsap.killTweensOf(Array.from(toInner?.children || []))

            if (wasOpen && fromInner) {
                showEl(fromInner); setT(fromInner, 0); gsap.set(fromInner, { autoAlpha: 1 }); fromInner.style.pointerEvents = 'none'
            }
            if (toInner) {
                const children = Array.from(toInner.children || []); children.forEach(c => setT(c, 18))
                showEl(toInner); setT(toInner, 22); gsap.set(toInner, { autoAlpha: 0 }); toInner.style.pointerEvents = 'none'
            }
            if (toHead) toHead.style.opacity = '1'

            // re-target spine to the new active panel smoothly
            updateSpine(to, { instant: false })

            const tl = gsap.timeline({
                defaults: { ease: 'power2.inOut', duration: 0.52 },
                onComplete: () => {
                    current = to
                    updateNavAndPills(to)
                    if (toInner) toInner.style.pointerEvents = 'auto'
                    enforceOnlyCurrentVisible(to) // <- hard rule: only current visible
                    document.dispatchEvent(new CustomEvent('panelChanged', { detail: { index: to, id: sections[to].id } }))
                    lock = false
                }
            })

            if (wasOpen && fromInner) {
                const fromChildren = Array.from(fromInner.children || [])
                tl.add(() => { showEl(fromInner) }, 0)
                fromChildren.forEach(c => setT(c, -18))
                tl.to([fromInner, ...fromChildren], { autoAlpha: 0, duration: PREV_FADE_DURATION, ease: 'power2.in', stagger: 0 }, 0)
                tl.add(() => { hideEl(fromInner) }, '>-0.01')
            }

            toSec.dataset.isOpen = '1'
            fromSec.dataset.isOpen = '0'

            tl.to(fromSec, { height: `${COLLAPSED_H}px`, pointerEvents: 'auto', paddingBlock: 0 }, 0)
            tl.to(toSec,   { height: `${hOpen}px`, pointerEvents: 'auto', onStart: () => toSec.classList.add('is-open') }, 0)

            sections.forEach((sec, i) => {
                if (i !== from && i !== to) {
                    const isPrev = i === to - 1
                    const isNext = i === to + 1
                    tl.to(sec, {
                        height: (isPrev || isNext) ? `${COLLAPSED_H}px` : '0px',
                        pointerEvents: (isPrev || isNext) ? 'auto' : 'none',
                        paddingBlock: 0
                    }, 0)
                    const inner = sec.querySelector('.section-inner')
                    const head  = sec.querySelector('.panel-head-full')
                    if (inner) { hideEl(inner); setT(inner, -16); gsap.set(inner, { autoAlpha: 0 }) }
                    if (head) head.style.opacity = '0'
                }
            })

            if (toInner) {
                tl.to(toInner, { autoAlpha: 1, duration: 0.44, ease: 'power2.out', onStart: () => setT(toInner, 0) }, '>-0.16')
                tl.add(() => { animateSectionIn(toSec) }, `>+=0.05`)
            }
        }

        function buildDotRail () {
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

                btn.addEventListener('click', () => { if (!lock) goTo(i) })
                rail.appendChild(btn)
            })
            return { el: rail }
        }
    } // end accordion

    // Simple <dialog id="lightbox"> gallery (safe no-op if not present)
    function setupAdobeGallery() {
        const dlg = document.getElementById('lightbox')
        const img = dlg?.querySelector('#lightboxImage')
        const btnPrev = dlg?.querySelector('[data-lb="prev"]')
        const btnNext = dlg?.querySelector('[data-lb="next"]')
        const btnClose = dlg?.querySelector('[data-lb="close"]')
        if (!dlg || !img) return

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

        function open(group, index) {
            activeGroup = group
            activeIndex = index
            setImage()
            if (typeof dlg.showModal === 'function') dlg.showModal()
            else dlg.setAttribute('open', '')
        }
        function close() { dlg.close?.(); dlg.removeAttribute('open') }
        function setImage() {
            const arr = groups[activeGroup] || []
            if (!arr.length) return
            if (activeIndex < 0) activeIndex = arr.length - 1
            if (activeIndex >= arr.length) activeIndex = 0
            img.src = arr[activeIndex]
        }

        btnPrev?.addEventListener('click', (e) => { e.stopPropagation(); activeIndex--; setImage() })
        btnNext?.addEventListener('click', (e) => { e.stopPropagation(); activeIndex++; setImage() })
        btnClose?.addEventListener('click', (e) => { e.stopPropagation(); close() })

        dlg.addEventListener('click', (e) => { if (e.target === dlg) close() })
        dlg.addEventListener('cancel', (e) => { e.preventDefault(); close() })
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
            } catch {}
            node = node.parentElement
        }
        return false
    }

    // ---- Auto Rotators ----
    function initAutoRotators() {
        const container = document.querySelector('#E')
        if (!container) return

        const nodes = Array.from(container.querySelectorAll('[data-rotator]'))
        const state = new WeakMap()

        nodes.forEach(node => {
            node.style.position = 'relative'
            const items = Array.from(node.querySelectorAll('[data-rotator-item]'))
            items.forEach((img, i) => {
                img.style.position = 'absolute'
                img.style.inset = '0'
                img.classList.toggle('opacity-100', i === 0)
                img.classList.toggle('opacity-0',   i !== 0)
            })
            state.set(node, { idx: 0, items, timer: null })
        })

        function start(node) {
            const s = state.get(node)
            if (!s || s.items.length <= 1 || s.timer) return
            const interval = parseInt(node.getAttribute('data-interval')) || 5000
            s.timer = setInterval(() => {
                const prev = s.idx
                s.idx = (s.idx + 1) % s.items.length
                const a = s.items[prev]
                const b = s.items[s.idx]
                a.classList.remove('opacity-100'); a.classList.add('opacity-0')
                b.classList.remove('opacity-0');   b.classList.add('opacity-100')
            }, interval)
        }
        function stop(node) { const s = state.get(node); if (s?.timer) { clearInterval(s.timer); s.timer = null } }
        const startAll = () => nodes.forEach(start)
        const stopAll  = () => nodes.forEach(stop)

        nodes.forEach(node => {
            node.addEventListener('mouseenter', () => stop(node))
            node.addEventListener('mouseleave', () => start(node))
        })

        if (document.querySelector('#E')?.dataset.isOpen === '1') startAll()
        document.addEventListener('panelChanged', (e) => {
            if (e.detail?.id === 'E') startAll()
            else stopAll()
        })

        document.addEventListener('rotatorPause', stopAll)
        document.addEventListener('rotatorResume', () => {
            if (document.querySelector('#E')?.dataset.isOpen === '1') startAll()
        })
    }

    // ---- Lightbox (centered, slide/fade) ----
    function initMediaLightbox() {
        if (window.__cm_lb_installed) return
        window.__cm_lb_installed = true

        const scope = document.querySelector('#E')
        if (!scope) return

        const overlay = document.createElement('div')
        Object.assign(overlay.style, {
            position:'fixed', inset:'0', background:'rgba(0,0,0,0.85)',
            display:'none', alignItems:'center', justifyContent:'center', zIndex:'10000'
        })

        const wrap = document.createElement('div')
        Object.assign(wrap.style, {
            width:'min(92vw, 1200px)', maxWidth:'92vw',
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'12px', textAlign:'center'
        })

        const viewport = document.createElement('div')
        Object.assign(viewport.style, { position:'relative', width:'100%', height:'70vh', maxHeight:'70vh', overflow:'hidden' })

        const mkFrame = () => {
            const f = document.createElement('div')
            Object.assign(f.style, { position:'absolute', inset:'0', display:'grid', placeItems:'center', opacity:'0', willChange:'transform, opacity' })
            return f
        }
        const frameA = mkFrame(), frameB = mkFrame()
        const mkImg = () => {
            const i = document.createElement('img')
            Object.assign(i.style, { maxWidth:'100%', maxHeight:'100%', width:'auto', height:'auto', objectFit:'contain', display:'block', borderRadius:'12px', boxShadow:'0 20px 60px rgba(0,0,0,0.5)', userSelect:'none' })
            i.alt = ''; i.decoding = 'async'; return i
        }
        const imgA = mkImg(), imgB = mkImg()
        frameA.appendChild(imgA); frameB.appendChild(imgB)
        viewport.append(frameA, frameB)

        const caption = document.createElement('div')
        Object.assign(caption.style, { color:'rgba(255,255,255,0.95)', fontSize:'1rem', lineHeight:'1.5', maxWidth:'80ch', marginTop:'6px', opacity:'0' })
        const counter = document.createElement('div')
        Object.assign(counter.style, { color:'rgba(255,255,255,0.6)', fontSize:'0.85rem' })
        const controls = document.createElement('div')
        Object.assign(controls.style, { display:'flex', gap:'10px', alignItems:'center', justifyContent:'center', marginTop:'4px' })
        const mkBtn = (label) => {
            const b = document.createElement('button'); b.type='button'; b.textContent = label
            Object.assign(b.style, { padding:'8px 14px', borderRadius:'9999px', background:'rgba(255,255,255,0.12)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)', fontSize:'14px', fontWeight:'600', cursor:'pointer' })
            return b
        }
        const prevBtn = mkBtn('‹ Prev')
        const nextBtn = mkBtn('Next ›')

        const closeBtn = document.createElement('button')
        closeBtn.type = 'button'; closeBtn.textContent = '×'
        Object.assign(closeBtn.style, { position:'fixed', top:'16px', right:'18px', width:'40px', height:'40px', borderRadius:'9999px', background:'rgba(255,255,255,0.12)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)', fontSize:'26px', lineHeight:'36px', cursor:'pointer' })

        controls.append(prevBtn, nextBtn)
        wrap.append(viewport, caption, counter, controls)
        overlay.append(wrap, closeBtn)
        document.body.appendChild(overlay)

        const state = { group:null, items:[], idx:0, layer:0, animating:false }
        const setCaption = (desc, total, i1) => { caption.textContent = desc || ''; counter.textContent = total > 1 ? `${i1} / ${total}` : '' }

        function render(nextIdx, direction = 0, animate = true) {
            if (!state.items.length || state.animating) return
            const max = state.items.length
            state.idx = (nextIdx + max) % max

            const src  = state.items[state.idx].getAttribute('src') || ''
            const desc = state.items[state.idx].getAttribute('data-desc') || state.items[state.idx].getAttribute('alt') || ''

            const currFrame = state.layer === 0 ? frameA : frameB
            const nextFrame = state.layer === 0 ? frameB : frameA
            const nextImg   = state.layer === 0 ? imgB   : imgA

            const go = () => {
                gsap.to(caption, { autoAlpha: 0, duration: 0.16 })
                if (!animate || overlay.style.display === 'none') {
                    gsap.set([frameA, frameB], { x: 0, autoAlpha: 0 })
                    gsap.set(nextFrame, { x: 0, autoAlpha: 1 })
                    setCaption(desc, max, state.idx + 1)
                    gsap.to(caption, { autoAlpha: 1, duration: 0.22, delay: 0.02 })
                    state.layer ^= 1
                    return
                }
                const outX = direction < 0 ? 110 : -110
                const inX  = direction < 0 ? -110 : 110
                state.animating = true
                gsap.set(nextFrame, { autoAlpha: 0, x: inX })
                gsap.timeline({
                    defaults: { ease: 'power2.out', duration: 0.42 },
                    onComplete: () => {
                        gsap.set(currFrame, { x: 0, autoAlpha: 0 })
                        gsap.set(nextFrame, { x: 0, autoAlpha: 1 })
                        setCaption(desc, max, state.idx + 1)
                        gsap.to(caption, { autoAlpha: 1, duration: 0.22 })
                        state.layer ^= 1
                        state.animating = false
                    }
                })
                    .to(currFrame, { x: outX, autoAlpha: 0 }, 0)
                    .to(nextFrame, { x: 0,    autoAlpha: 1 }, 0)
            }

            nextImg.src = src
            if (!nextImg.complete || nextImg.naturalWidth === 0) { nextImg.onload = () => { nextImg.onload = null; go() } } else { go() }

            const one = max <= 1
            prevBtn.style.display = one ? 'none' : ''
            nextBtn.style.display = one ? 'none' : ''
        }

        function openFrom(groupEl, startEl) {
            state.group = groupEl
            state.items = Array.from(groupEl.querySelectorAll('[data-rotator-item]'))
            let start = state.items.findIndex(el => el.classList.contains('opacity-100'))
            if (start < 0) start = state.items.indexOf(startEl)
            if (start < 0) start = 0
            overlay.style.display = 'flex'
            document.body.dataset.lbScrollLock = document.body.style.overflow
            document.body.style.overflow = 'hidden'
            document.dispatchEvent(new CustomEvent('rotatorPause'))
            render(start, 0, false)
        }

        function close() {
            overlay.style.display = 'none'
            document.body.style.overflow = document.body.dataset.lbScrollLock || ''
            document.dispatchEvent(new CustomEvent('rotatorResume'))
            state.group = null; state.items = []; state.idx = 0; state.layer = 0; state.animating = false
        }

        const goPrev = (e) => { e?.stopPropagation?.(); if (!state.animating) render(state.idx - 1, -1, true) }
        const goNext = (e) => { e?.stopPropagation?.(); if (!state.animating) render(state.idx + 1, +1, true) }
        prevBtn.addEventListener('click', goPrev)
        nextBtn.addEventListener('click', goNext)
        frameA.addEventListener('click', goNext)
        frameB.addEventListener('click', goNext)

        overlay.addEventListener('click', (e) => { if (e.target === overlay) close() })
        closeBtn.addEventListener('click', close)

        document.addEventListener('keydown', (e) => {
            if (overlay.style.display === 'none') return
            if (e.key === 'Escape') { close(); return }
            if (e.key === 'ArrowLeft') { goPrev(e); return }
            if (e.key === 'ArrowRight') { goNext(e); return }
            if (e.key === 'PageUp' || e.key === 'ArrowUp') {
                e.preventDefault(); close()
                document.dispatchEvent(new CustomEvent('panelScrollFromLightbox', { detail:{ dir:-1 } }))
            } else if (e.key === 'PageDown' || e.key === 'ArrowDown' || e.key === ' ') {
                e.preventDefault(); close()
                document.dispatchEvent(new CustomEvent('panelScrollFromLightbox', { detail:{ dir: +1 } }))
            }
        })

        const wheelToPanel = (e) => {
            if (overlay.style.display === 'none') return
            e.preventDefault()
            const dir = e.deltaY > 0 ? +1 : -1
            close()
            document.dispatchEvent(new CustomEvent('panelScrollFromLightbox', { detail:{ dir } }))
        }
        overlay.addEventListener('wheel', wheelToPanel, { passive:false })
        window.addEventListener('wheel', wheelToPanel, { passive:false })

        let startY = null
        overlay.addEventListener('touchstart', (e) => { startY = e.touches?.[0]?.clientY ?? null }, { passive:true })
        overlay.addEventListener('touchmove', (e) => {
            if (overlay.style.display === 'none' || startY == null) return
            const dy = startY - (e.touches?.[0]?.clientY ?? startY)
            if (Math.abs(dy) > 40) {
                const dir = dy > 0 ? +1 : -1
                close()
                document.dispatchEvent(new CustomEvent('panelScrollFromLightbox', { detail:{ dir } }))
                startY = null
            }
        }, { passive:true })
        overlay.addEventListener('touchend', () => { startY = null }, { passive:true })

        scope.addEventListener('click', (e) => {
            const imgEl = e.target.closest('[data-rotator-item]')
            if (!imgEl) return
            const group = imgEl.closest('[data-rotator]')
            if (!group) return
            openFrom(group, imgEl)
        })
    }

})
