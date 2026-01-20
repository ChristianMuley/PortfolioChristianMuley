import { PROJECTS } from './projectsData.js'

const VIDEO_EXT_RE = /\.(webm|mp4|mov|m4v|ogg)$/i

function makeDrawerMediaEl(src, altText = '') {
    const isVideo = VIDEO_EXT_RE.test(src)

    if (isVideo) {
        const v = document.createElement('video')
        v.className = 'proj-drawer-img'
        v.autoplay = true
        v.muted = true
        v.loop = true
        v.playsInline = true
        v.preload = 'metadata'
        v.src = src

        // Double-click to play/pause (single click is reserved for lightbox)
        v.addEventListener('dblclick', (e) => {
            e.preventDefault()
            ;(v.paused ? v.play() : v.pause())
        })

        return v
    }

    const img = document.createElement('img')
    img.className = 'proj-drawer-img'
    img.src = src
    img.alt = altText || ''
    img.loading = 'lazy'
    return img
}

export function initProjectDrawer(uiState) {
    const dlg = document.getElementById('projectDrawer')
    if (!dlg) return

    // Prevent double init (duplicate listeners = broken UX)
    if (dlg.__projectDrawerInit) return
    dlg.__projectDrawerInit = true

    // Safe fallback if someone ever calls this without a shared state object
    uiState ||= { modalOpen: false }

    const elTitle = document.getElementById('pdTitle')
    const elTags = document.getElementById('pdTags')
    const elLive = document.getElementById('pdLive')
    const elGit = document.getElementById('pdGit')
    const elVideo = document.getElementById('pdVideo')
    const elClose = document.getElementById('pdClose')
    const elSnap = document.getElementById('pdSnap')

    let lastFocusEl = null

    // Focus trap for <dialog id="projectDrawer">
    const FOCUSABLE_SEL =
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

    function getFocusable() {
        return Array.from(dlg.querySelectorAll(FOCUSABLE_SEL)).filter(
            (el) => el.offsetParent !== null || el.getClientRects().length
        )
    }

    function trapFocusOn() {
        if (dlg.__trapOn) return
        dlg.__trapOn = true

        dlg.__trapHandler = (e) => {
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
        }

        dlg.addEventListener('keydown', dlg.__trapHandler)
    }

    function trapFocusOff() {
        if (!dlg.__trapOn) return
        dlg.__trapOn = false

        if (dlg.__trapHandler) {
            dlg.removeEventListener('keydown', dlg.__trapHandler)
            dlg.__trapHandler = null
        }
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

        // Always start at the top when opening
        elSnap.scrollTop = 0
        requestAnimationFrame(() => {
            elSnap.scrollTop = 0
        })

        const slides =
            Array.isArray(data.slides) && data.slides.length
                ? data.slides
                : [{ img: data.heroImg || '', html: data.storyHtml || '' }]

        // Build the layout (NO <img> tags here)
        elSnap.innerHTML = slides
            .map(
                (s, i) => `
<section class="proj-drawer-step" data-step="${i}">
  <div class="proj-drawer-grid">
    <aside class="proj-drawer-proof" data-media-slot="1"></aside>
    <article class="proj-drawer-story">
      ${s.html || ''}
    </article>
  </div>
</section>`
            )
            .join('')

        // After the HTML exists, inject the right element (<img> or <video>)
        const steps = elSnap.querySelectorAll('.proj-drawer-step')
        steps.forEach((stepEl, i) => {
            const s = slides[i]
            const slot = stepEl.querySelector('[data-media-slot]')
            if (!slot) return

            const src = (s?.img || '').trim()
            if (!src) return

            const alt = `${data.title || 'Project'} — slide ${i + 1}`
            const mediaEl = makeDrawerMediaEl(src, alt)
            slot.replaceChildren(mediaEl)
        })
    }

    function openDrawer(key, focusEl) {
        const data = PROJECTS[key]
        if (!data) return

        lastFocusEl = focusEl || null
        uiState.modalOpen = true

        if (elTitle) elTitle.textContent = data.title || 'Project'
        if (elTags)
            elTags.innerHTML = (data.tags || [])
                .map((t) => `<span class="proj-tag">${t}</span>`)
                .join('')

        setLink(elLive, data.links?.live || '')
        setLink(elGit, data.links?.github || '')
        setLink(elVideo, data.links?.video || '')

        renderSlides(data)

        document.dispatchEvent(new Event('rotatorPause'))

        if (typeof dlg.showModal === 'function') dlg.showModal()
        else dlg.setAttribute('open', '')

        trapFocusOn()
        setTimeout(() => elClose?.focus?.(), 0)
    }

    function closeDrawer() {
        // If already closed, bail
        if (!dlg.open && !dlg.hasAttribute('open')) return

        trapFocusOff()

        try {
            dlg.close?.()
        } catch {
            dlg.removeAttribute('open')
        }

        if (elSnap) {
            elSnap.scrollTop = 0
            requestAnimationFrame(() => {
                elSnap.scrollTop = 0
            })
        }

        uiState.modalOpen = false
        document.dispatchEvent(new Event('rotatorResume'))

        setTimeout(() => lastFocusEl?.focus?.(), 0)
    }

    // --- Events ---

    // Safety cleanup if something closes the dialog without calling closeDrawer()
    dlg.addEventListener('close', () => {
        trapFocusOff()
        uiState.modalOpen = false
    })

    elClose?.addEventListener('click', (e) => {
        e.preventDefault()
        closeDrawer()
    })

    // Click outside the shell closes (overlay click)
    dlg.addEventListener('click', (e) => {
        if (e.target === dlg) closeDrawer()
    })

    // Prevent default ESC-close so we can restore focus + state consistently
    dlg.addEventListener('cancel', (e) => {
        e.preventDefault()
        closeDrawer()
    })

    // Bind project cards → open the drawer
    document.querySelectorAll('[data-project-card], [data-project]').forEach((card) => {
        card.addEventListener('click', () => {
            const key = card.getAttribute('data-project')
            if (!key) return
            openDrawer(key, card)
        })
    })

    // (Legacy) projectModal hook kept for compatibility
    const projectModal = document.getElementById('projectModal')

    const openProjectModal = () => {
        if (!projectModal) return
        projectModal.classList.add('is-open')
        projectModal.setAttribute('aria-hidden', 'false')
        uiState.modalOpen = true
    }

    const closeProjectModal = () => {
        if (!projectModal) return
        projectModal.classList.remove('is-open')
        projectModal.setAttribute('aria-hidden', 'true')
        uiState.modalOpen = false
    }

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-close="projectModal"]')
        if (btn) closeProjectModal()
    })

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && uiState.modalOpen) closeProjectModal()
    })

    // NOTE: openProjectModal is intentionally unused now; drawer is the main UX.
    void openProjectModal
}
