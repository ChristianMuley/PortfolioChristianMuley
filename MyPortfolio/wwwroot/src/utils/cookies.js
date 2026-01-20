export const setCookie = (n, v, d) => {
    const days = typeof d === 'number' ? d : 365
    const t = new Date()
    t.setTime(t.getTime() + days * 864e5)
    document.cookie = `${n}=${encodeURIComponent(v)};expires=${t.toUTCString()};path=/;SameSite=Lax`
}

export const delCookie = (n) => {
    document.cookie = `${n}=; Max-Age=0; path=/;SameSite=Lax`
}

export const getCookie = (n) => {
    const hit = document.cookie.split('; ').find(r => r.startsWith(n + '='))
    return hit ? decodeURIComponent(hit.split('=')[1] || '') : null
}
