export function initContactForm() {
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
