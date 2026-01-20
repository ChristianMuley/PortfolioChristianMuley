export function panelIndexFromHash(sections) {
    const raw = (location.hash || '').replace('#', '').trim()
    if (!raw) return 0
    const idx = sections.findIndex(s => s.id.toLowerCase() === raw.toLowerCase())
    return idx >= 0 ? idx : 0
}

export function writePanelToUrl(panelId, { replace = false } = {}) {
    const hash = `#${panelId}`
    try {
        const st = { panel: panelId }
        if (replace) history.replaceState(st, '', hash)
        else history.pushState(st, '', hash)
    } catch {
        location.hash = hash
    }
}
