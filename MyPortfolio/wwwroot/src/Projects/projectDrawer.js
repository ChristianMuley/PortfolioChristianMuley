// wwwroot/src/projects/projectDrawer.js
import { PROJECTS } from './projectsData.js'

export function initProjectDrawer(uiState) {
    const dlg = document.getElementById('projectDrawer')
    if (!dlg) return

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
        uiState.modalOpen = true

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

        uiState.modalOpen = false
        document.dispatchEvent(new Event('rotatorResume'))

        setTimeout(() => lastFocusEl?.focus?.(), 0)
    }

    dlg.addEventListener('close', () => {
        trapFocusOff()
        uiState.modalOpen = false
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

   
}
