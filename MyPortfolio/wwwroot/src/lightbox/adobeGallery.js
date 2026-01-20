const VIDEO_EXT_RE = /\.(webm|mp4|mov|m4v|ogg)$/i;

function isVideoSrc(src) {
    return VIDEO_EXT_RE.test(src || "");
}

function readMediaSrc(el) {
    if (!el) return "";
    if (el.tagName === "VIDEO") return el.currentSrc || el.src || el.getAttribute("src") || "";
    return el.getAttribute("src") || el.src || "";
}

export function setupAdobeGallery() {
    const dlg = document.getElementById("lightbox");
    const img = dlg?.querySelector("#lightboxImage");
    if (!dlg || !img) return;

    // Prevent double init (double listeners = broken UX)
    if (dlg.__adobeGalleryInit) return;
    dlg.__adobeGalleryInit = true;

    // Wrap into .lb-shell (your CSS expects this)
    let shell = dlg.querySelector(".lb-shell");
    if (!shell) {
        shell = document.createElement("div");
        shell.className = "lb-shell";
        img.parentNode?.insertBefore(shell, img);
        shell.appendChild(img);
    }

    // Ensure we have a video element too
    let video = dlg.querySelector("#lightboxVideo");
    if (!video) {
        video = document.createElement("video");
        video.id = "lightboxVideo";
        video.className = "lightbox-video";
        video.controls = true;
        video.autoplay = true;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.preload = "metadata";
        video.hidden = true;
        shell.appendChild(video);
    } else {
        // Make sure it's inside the shell
        if (video.parentElement !== shell) shell.appendChild(video);
    }

    // KILL the legacy close button you mentioned: class="lb close"
    dlg.querySelectorAll("button.lb.close, a.lb.close").forEach((b) => b.remove());

    let closeBtn =
        dlg.querySelector('[data-lb="close"]') ||
        dlg.querySelector(".lb-close");

    if (!closeBtn) {
        closeBtn = document.createElement("button");
        closeBtn.type = "button";
        closeBtn.textContent = "×";
        shell.appendChild(closeBtn);
    }

    closeBtn.classList.add("lb-close");
    closeBtn.setAttribute("aria-label", "Close");

    // Remove duplicate .lb-close buttons (but keep the one we use)
    dlg.querySelectorAll(".lb-close").forEach((b) => {
        if (b !== closeBtn) b.remove();
    });

    const groups = {};
    document.querySelectorAll('[data-role="media-thumb"]').forEach((btn) => {
        const group = btn.dataset.group || "default";
        const child = btn.querySelector("img,video");
        const src = btn.dataset.src || readMediaSrc(child);
        if (!src) return;
        groups[group] ||= [];
        groups[group].push(src);
        btn.addEventListener("click", () => open(group, groups[group].indexOf(src)));
    });

    let activeGroup = null;
    let activeIndex = 0;

    function stopVideo() {
        if (!video) return;
        try { video.pause(); } catch {}
        video.removeAttribute("src");
        try { video.load(); } catch {}
    }

    function setMedia() {
        const arr = groups[activeGroup] || [];
        if (!arr.length) return;

        if (activeIndex < 0) activeIndex = arr.length - 1;
        if (activeIndex >= arr.length) activeIndex = 0;

        const src = arr[activeIndex];

        if (isVideoSrc(src)) {
            img.hidden = true;
            img.removeAttribute("src");

            video.hidden = false;
            video.src = src;
            video.load();
            video.play().catch(() => {});
        } else {
            stopVideo();
            video.hidden = true;

            img.hidden = false;
            img.src = src;
        }
    }

    function open(group, index) {
        activeGroup = group;
        activeIndex = index;
        setMedia();

        dlg.classList.remove("is-open", "is-closing");

        // Don't call showModal if already open (can throw and break things)
        if (!dlg.open) {
            if (typeof dlg.showModal === "function") dlg.showModal();
            else dlg.setAttribute("open", "");
        }

        requestAnimationFrame(() => dlg.classList.add("is-open"));
    }

    function openSingle(src) {
        activeGroup = "__single__";
        groups[activeGroup] = [src];
        activeIndex = 0;
        setMedia();

        dlg.classList.remove("is-open", "is-closing");

        if (!dlg.open) {
            if (typeof dlg.showModal === "function") dlg.showModal();
            else dlg.setAttribute("open", "");
        }

        requestAnimationFrame(() => dlg.classList.add("is-open"));
    }

    function reallyClose() {
        dlg.classList.remove("is-open", "is-closing");
        stopVideo();
        try { dlg.close?.(); } catch { dlg.removeAttribute("open"); }
    }

    function close() {
        dlg.classList.remove("is-open");
        dlg.classList.add("is-closing");
        setTimeout(reallyClose, 260);
    }

    closeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        close();
    });

    // Close when clicking OUTSIDE the shell (more reliable than e.target === dlg)
    dlg.addEventListener("click", (e) => {
        if (!e.target.closest(".lb-shell")) close();
    });

    dlg.addEventListener("cancel", (e) => {
        e.preventDefault();
        close();
    });

    // Click-to-zoom for project drawer media (img OR video)
    // IMPORTANT: only trigger when media is INSIDE #projectDrawer (prevents loops)
    // This took me too long to find
    document.addEventListener("click", (e) => {
        const mediaEl = e.target.closest(".proj-drawer-img");
        if (!mediaEl) return;

        if (!mediaEl.closest("#projectDrawer")) return;

        const src = readMediaSrc(mediaEl);
        if (!src) return;

        openSingle(src);
    });
}
