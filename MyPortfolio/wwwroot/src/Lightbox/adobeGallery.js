// wwwroot/src/lightbox/adobeGallery.js
export function setupAdobeGallery() {
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
