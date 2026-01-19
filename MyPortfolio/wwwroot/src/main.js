// wwwroot/src/main.js
import './styles.css'
import gsap from 'gsap'

import { PANEL_META } from './config/panels.js'
import { preHideNonFirst, enforceOnlyCurrentVisible } from './accordion/visibility.js'
import { panelIndexFromHash } from './accordion/url.js'

import { markHeroTypewriterTargets, runHeroTypewriterOnce } from './intro/typewriter.js'

import { initAccordion } from './accordion/accordion.js'
import { setupAdobeGallery } from './lightbox/adobeGallery.js'

import { initProjectDrawer } from './projects/projectDrawer.js'
import { initContactForm } from './contact/contactForm.js'

document.addEventListener('DOMContentLoaded', () => {
    // Kill/remove intro overlay if it exists in markup
    document.getElementById('intro')?.remove()

    const snapRoot = document.getElementById('snapRoot')
    const scanNav = document.getElementById('scanNav')
    const sections = Array.from(document.querySelectorAll('.section'))
    const header = document.querySelector('header')
    const footer = document.querySelector('footer.footer')

    // shared UI state (modules can gate input while a modal/dialog is open)
    const uiState = { modalOpen: false }

    // Prevent flash-then-delete: mark Hero A text as typewriter targets immediately
    markHeroTypewriterTargets()

    if (scanNav) scanNav.classList.add('show')

    // If accordion root is missing, still enable the lightbox behavior (safe fallback)
    if (!snapRoot || !sections.length) {
        setupAdobeGallery()
        return
    }

    // Ensure snap root is visible (intro used to handle this)
    snapRoot.style.visibility = 'visible'
    snapRoot.style.clipPath = 'none'
    document.getElementById('critical-hide')?.remove()

    // Keep snap behavior consistent with previous flow
    document.body.style.overflow = 'hidden'

    // panel tone alternation stays as-is
    sections.forEach((sec, i) => {
        const tone = (i % 2 === 0) ? 'dark' : 'light'
        sec.dataset.panelTone = tone
        sec.classList.toggle('tone-dark', tone === 'dark')
        sec.classList.toggle('tone-light', tone === 'light')
    })

    const initialPanelIndex = panelIndexFromHash(sections)

    // startup behavior (same order as before)
    preHideNonFirst(sections, gsap)
    setupAdobeGallery()
    initProjectDrawer(uiState)
    initContactForm()

    // Make sure only the intended start panel is visible (important if you deep-link to #B/#C/etc)
    enforceOnlyCurrentVisible(sections, initialPanelIndex, gsap)

    // Start accordion immediately (no intro)
    initAccordion({
        gsap,
        uiState,
        snapRoot,
        scanNav,
        header,
        footer,
        sections,
        panelMeta: PANEL_META,
        initialIndex: initialPanelIndex,
        onPanelBecameA: () => runHeroTypewriterOnce(),
    })
})
