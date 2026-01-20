export function canScrollVert(el, dy) {
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
