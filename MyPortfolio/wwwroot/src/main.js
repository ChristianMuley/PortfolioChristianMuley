// wwwroot/src/main.js
import './styles.css'
import gsap from 'gsap'

import { PANEL_META } from './config/panels.js'
import { preHideNonFirst, enforceOnlyCurrentVisible } from './accordion/visibility.js'
import { panelIndexFromHash } from './accordion/url.js'

import { markHeroTypewriterTargets, runHeroTypewriterOnce } from './intro/typewriter.js'
import { initIntroFlow } from './intro/introFlow.js'

import { initAccordion } from './accordion/accordion.js'
import { setupAdobeGallery } from './lightbox/adobeGallery.js'

import { initProjectDrawer } from './projects/projectDrawer.js'
import { initContactForm } from './contact/contactForm.js'

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

    // intro overlay (cookie skip + enter animation) -> calls initAccordion when it’s time
    initIntroFlow({
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

        enforceOnlyCurrentVisible: (idx) => enforceOnlyCurrentVisible(sections, idx, gsap),

        onStartAccordion: (startIndex) => {
            initAccordion({
                gsap,
                uiState,
                snapRoot,
                scanNav,
                header,
                footer,
                sections,
                panelMeta: PANEL_META,
                initialIndex: startIndex,
                onPanelBecameA: () => runHeroTypewriterOnce(),
            })
        }
    })
})
