export const PROJECTS = {
    "sales-admin": {
        title: "Sales Admin Portal (Scrum Team Project)",
        tags: ["C#", "ASP.NET MVC", "EF Core", "SQL Server", "JS/HTML/CSS", "Scrum"],
        links: { live: "", github: "https://github.com/ChristianMuley/ScrumProject.git", video: "" },
        slides: [
            {
                img: "/img/PrulariaHero.png",
                html: `
          <h3>Project overview (2-week Scrum build)</h3>
          <p>
            For a client, we built a working <b>Sales Admin Portal</b> used to manage <b>orders</b> and <b>clients</b>.
            This was a <b>team of 6</b>, built in <b>2 weeks</b>, split into <b>two sprints</b>.
          </p>

          <h3>How we worked</h3>
          <ul>
            <li>We followed <b>Scrum</b> with a Scrum Master + Product Owner.</li>
            <li>Those roles rotated every <b>2 days</b> so everyone got hands-on experience.</li>
            <li>Work was tracked and delivered in sprint chunks (not random features).</li>
          </ul>

          <h3>What I did</h3>
          <ul>
            <li>Owned most of the <b>front-end</b>: layout, styling, and keeping the UI consistent across screens.</li>
            <li>Added small hooks/integration pieces so features behaved correctly end-to-end.</li>
            <li>Actively tested edge cases and helped resolve <b>merge conflicts</b> to keep the build stable.</li>
          </ul>

          <h3>Tech</h3>
          <ul>
            <li>C#, ASP.NET MVC, EF Core, SQL Server</li>
            <li>JavaScript, HTML/CSS</li>
          </ul>
        `
            },
            {
                img: "/img/PrulariaStory1.png",
                html: `
          <h3>Login (SQL-backed)</h3>
          <p>This is the login screen. Credentials are checked against our SQL Server database so only staff can access the admin portal.</p>

          <h3>Why it matters</h3>
          <ul>
            <li>Keeps customer and order data behind authentication.</li>
            <li>Sets the tone for the rest of the app: clean, simple, no confusion.</li>
          </ul>

          <h3>My part</h3>
          <ul>
            <li>UI layout + styling so it stays consistent with the rest of the portal.</li>
          </ul>
        `
            },
            {
                img: "/img/Prularia1.png",
                html: `
          <h3>Orders overview (unfiltered)</h3>
          <p>The main “work screen”. Admins can quickly scan orders, jump into details, and move to the next task fast.</p>

          <h3>What I focused on here</h3>
          <ul>
            <li>Readable layout (spacing, alignment, consistent buttons).</li>
            <li>Hover states so it feels responsive and “clickable”.</li>
            <li>Keeping the page calm even when there’s a lot of data.</li>
          </ul>
        `
            },
            {
                img: "/img/PrulariaOrderFilters.png",
                html: `
          <h3>Filtering + paging</h3>
          <p>This is where the portal becomes practical. Filters narrow results, and the UI shows what’s currently active so you don’t get lost.</p>

          <h3>What’s shown here</h3>
          <ul>
            <li>Filters with a clear “active” state (chips).</li>
            <li>Orders-per-page dropdown + page navigation.</li>
            <li>Designed for speed: find the right order in seconds.</li>
          </ul>

          <h3>My contribution</h3>
          <ul>
            <li>Built the filter UI + chips + the “feel” of the interactions.</li>
          </ul>
        `
            },
            {
                img: "/img/PrulariaOrderDetails.png",
                html: `
          <h3>Order details (editable)</h3>
          <p>Clicking an order opens a full detail view. Admins can edit fields, and changes save back to the database.</p>

          <h3>Why this screen matters</h3>
          <ul>
            <li>Most admin time is spent here, it had to be clear and consistent.</li>
            <li>Same layout patterns as the list view, so it feels familiar.</li>
            <li>Editing is straightforward (no “where do I click?” moments).</li>
          </ul>

          <h3>My part</h3>
          <ul>
            <li>Layout + form styling + spacing so it stays readable.</li>
          </ul>
        `
            },
            {
                img: "/img/PrulariaOrderDetailsModal.png",
                html: `
          <h3>Modal details / quick actions</h3>
          <p>Some actions don’t need a full page change. This modal pattern keeps you in context and saves clicks.</p>

          <h3>What this improves</h3>
          <ul>
            <li>Fast confirmations / edits without losing your place.</li>
            <li>Cleaner flow for repetitive admin tasks.</li>
            <li>Consistent styling across the whole portal.</li>
          </ul>

          <h3>My part</h3>
          <ul>
            <li>Reusable modal styling + hover states + button patterns.</li>
          </ul>
        `
            },
            {
                img: "/img/PrulariaClients1.png",
                html: `
          <h3>Clients overview</h3>
          <p>Same idea as orders: quick scanning, consistent actions, and easy navigation to a client’s details.</p>

          <h3>What I did</h3>
          <ul>
            <li>Kept the UI consistent with orders (same patterns, same rules).</li>
            <li>Made sure tables stay readable and don’t feel “busy”.</li>
          </ul>
        `
            },
            {
                img: "/img/PrulariaClientsDetail.png",
                html: `
          <h3>Client details</h3>
          <p>Admins can view and update client info in a clean detail view, using the same layout logic as order details.</p>

          <h3>Why it matters</h3>
          <ul>
            <li>Staff can update records quickly and confidently.</li>
            <li>Fewer mistakes because the UI is predictable.</li>
          </ul>
        `
            },
            {
                img: "/img/Scrum3.png",
                html: `
          <h3>Scrum: user stories & scope</h3>
          <p>We translated requirements into epics, then split those into user stories with clear acceptance criteria. 
          Each story had a stable ID (e.g., VE1-101) that we also used in our Git branch naming, so work stayed traceable from planning to implementation to review..</p>

          <h3>What it demonstrates</h3>
          <ul>
            <li><b>Structured planning:</b> epics → user stories → implementable slices.</li>
            <li><b>Clarity:</b> story IDs mapped directly to branches, making it easy to audit what shipped and why.</li>
            <li><b>Parallel delivery:</b> clear story boundaries reduce overlap and helped multiple people work at once without stepping on each other.</li>
            <li><b>Scope control:</b> changes were handled by updating the backlog and re-slicing stories, instead of drifting mid-sprint.</li>
          </ul>
        `
            },
            {
                img: "/img/Scrum2.png",
                html: `
          <h3>Scrum: burndown / sprint progress</h3>
          <p>We tracked sprint progress over time. It’s a quick way to show if the sprint is on-track or slipping.</p>

          <h3>Why this is included</h3>
          <ul>
            <p>I’m not only showing the final result. I’m also showing how the work was organized and delivered: planning, clarity, and team alignment. 
            This is the part that makes development predictable in real projects, especially when multiple people contribute in parallel.</p>
          </ul>
        `
            },
            {
                img: "/img/Scrum1.png",
                html: `
          <h3>Scrum: time & sprint task tracking</h3>
          <p>We logged estimated time vs actual time during the sprint. It helped us adjust quickly and be realistic.</p>

          <h3>What it shows</h3>
          <ul>
            <li>Real sprint planning with estimates.</li>
            <li>Actual effort tracked per task.</li>
            <li>Clear accountability across the team.</li>
          </ul>
        `
            }
        ]
    },

    "portfolio-accordion": {
        title: "Portfolio Website — Interactive Accordion + Proof-First Case Studies",
        tags: [
            "ASP.NET Core MVC",
            "C#",
            "Razor",
            "JavaScript (ES Modules)",
            "GSAP",
            "Tailwind CSS",
            "Vite",
            "Azure App Service"
        ],
        links: {
            live: "https://christianmuley.azurewebsites.net/",
            github: "https://github.com/ChristianMuley/PortfolioChristianMuley/tree/700337d3253a8b5e85763036c2c0b596bf202319/MyPortfolio", 
            video: ""
        },
        slides: [
            {
                img: "/img/PortfolioThumb.png",
                html: `
        <h3>What I built</h3>
        <p>
          A public portfolio that’s easy to scan: one page, simple navigation, and projects that open into a drawer with screenshots plus the “what/why” behind it.
        </p>

        <h3>Core idea</h3>
        <ul>
          <li><b>Recruiter-friendly flow:</b> you can skim fast, click for details only when needed.</li>
          <li><b>Interaction that feels good:</b> smooth transitions, clear focus, and consistent UI.</li>
          <li><b>Real functionality:</b> contact form that emails me securely (nothing sensitive exposed).</li>
        </ul>
      `
            },

            {
                img: "/img/PortfolioAccordion.webm",
                html: `
        <h3>Accordion navigation (snap panels)</h3>
        <p>
          The site uses a snap-style accordion: one panel is fully open, the next/previous ones stay collapsed, and the rest stays out of the way. 
          It keeps things focused and avoids endless scrolling.
        </p>

        <h3>How it’s implemented</h3>
        <ul>
          <li>GSAP-driven transitions (panel height + content fade) to keep it smooth.</li>
          <li>Project content is data-driven from a single JS file, so updating projects stays quick 'n easy.</li>
          <li>URL deep-linking via hashes (direct links to Skills / Projects / Contact).</li>
          <li>Scroll is intentionally gated: only the right area scrolls on small screens.</li>
        </ul>
      `
            },

            {
                img: "/img/SpineDrop.webm",
                html: `
        <h3>Spinedrop navigation (orientation + feedback)</h3>
        <p>
         The nav has a custom “spine” animation that links the active menu item to the section below. 
         Each section has its own color theme, and if you switch quickly, it cancels immediately, so it stays snappy.
        </p>

        <h3>What makes it solid</h3>
        <ul>
          <li>Anchored to the active button width for precision.</li>
          <li>Starts from the top edge (viewport) for a clean “drop” feeling.</li>
          <li>Colors + glow follow the active section.</li>
          <li>It recalculates on resize and layout changes, so it stays responsive.</li>
        </ul>
      `
            },
            {
                img: "/img/WarframeSliders.webm",
                html: `
    <h3>Interactive sliders (responsive layout)</h3>
    <p>
      I built a custom slider that feels good on desktop, and switches to a vertical layout on smaller screens. 
      Same interaction rules, just adapted so it stays readable and easy to use on mobile.
    </p>

    <h3>What’s included</h3>
    <ul>
      <li>The active item expands to prioritize the current selection.</li>
      <li>Non-active items collapse into a clean, quiet state.</li>
      <li>On small screens, the layout reflows into a vertical slider without breaking the UX.</li>
    </ul>

    <h3>Why I’m proud of it</h3>
    <ul>
      <li>It’s mostly a “feel” thing: smooth, readable, and consistent across devices.</li>
      <li>It solved a real mobile problem without adding clutter or extra navigation.</li>
    </ul>

    <p style="margin-top:.75rem; opacity:.8;">
      Inspired by the Warframe launcher - thanks DE!
    </p>
  `
            },

            {
                img: "/img/StoryDrawers.webm",
                html: `
        <h3>Project story drawer (proof-first presentation)</h3>
        <p>
          Projects open in a modal drawer built on the native <code>&lt;dialog&gt;</code> element, with focus trapping and
          scroll-snap slides. Each slide pairs an image with structured narrative content.
        </p>

        <h3>Why this matters</h3>
        <ul>
          <li><b>Consistency:</b> every project follows the same story format.</li>
          <li><b>Proof-first:</b> screenshots are always visible alongside the explanation.</li>
          <li><b>Maintainable:</b> content comes from a single JS data file.</li>
          <li><b>Accessible:</b> you can close with Escape or by clicking outside the drawer.</li>
        </ul>
      `
            },

            {
                img: "/img/Mobile.webm",
                html: `
        <h3>Mobile responsiveness (controlled scrolling)</h3>
        <p>
         Mobile was all about cramming the same experience onto a tiny screen without it turning into a mess.
         The goal stayed the same: keep it clean, readable and snappy.
        </p>

        <h3>What was done</h3>
        <ul>
          <li>The spinedrop recalculates position/sizes from the real layout, so it stays aligned on any screen.</li>
          <li>The sliders switch to a vertical layout on small screens so, content stays readable and your thumb can actually use it.</li>
          <li>The project drawer stays usable on mobile, the content scrolls inside the drawer, without the page fighting it. The layout changes to horizontal split.</li>
          <li>All in all the UI rules stay consistent; the same interactions still apply, they ust adapt layout-wise.</li>
          <li>Feel free to test it out if you're on desktop, just resize the window, and you'll see!</li>
        </ul>
      `
            },

            {
                img: "/img/ContactForm.webm",
                html: `
        <h3>Contact form</h3>
        <p>
          The contact form posts to a server endpoint that sends an email to my inbox. Credentials are not shipped to the browser.
          Secrets live in Azure App Settings (environment variables).
        </p>

        <h3>Safety and reliability</h3>
        <ul>
          <li>Server-side validation + length caps to reduce abuse.</li>
          <li>Rate limiting (per IP) to stop spam bursts.</li>
          <li>SMTP credentials stored in Azure configuration (not hardcoded in public code).</li>
          <li>Clear success/failure feedback in the UI.</li>
        </ul>
      `
            }
        ]
    },


    "java-aggregator": {
        title: "Price Aggregator & Opportunity Scanner",
        tags: ["Java", "REST/HTTP", "JSON", "OCR (Tesseract)", "Data Processing"],
        links: { live: "", github: "", video: "" },
        slides: [
            {
                img: "/img/WFMPipeline.png",
                html: `
          <h3>Overview</h3>
          <p>
            This is a solo Java app that helps you pick the best reward, in a specific game, by reading the on-screen reward choices,
            matching them to real item names, and checking live prices from the game’s market API.
          </p>

          <h3>How it works</h3>
          <ul>
            <li>You select a small capture region where the rewards appear.</li>
            <li>The app reads all 4 reward slots (OCR) and cleans up the text.</li>
            <li>It matches the result to real item names (even if OCR is messy).</li>
            <li>It pulls the lowest online sell price for each item and sorts the results so the best choice is obvious.</li>
          </ul>

          <h3>Why I built it</h3>
          <ul>
            I noticed a real inefficiency:
            reward choices are time-sensitive, and picking blindly can mean losing currency long-term.
            I built this app to turn that decision into a quick, data-backed choice.
            It also pushed me to learn new parts of Java that I hadn’t used before
            - OCR via Tess4J and integrating a live market API in a project that has a clear purpose.
          </ul>
        `
            },
            {
                img: "/img/WFMSlide4.png",
                html: `
          <h3>Capture → OCR → Match</h3>
          <p>
            The app grabs a screenshot of a selected region, splits it into 4 reward slots,
            then preprocesses the image so OCR has a fighting chance.
          </p>

          <h3>How it reads the rewards</h3>
          <ul>
            <li>Split the captured rectangle into 4 vertical slices (one per reward).</li>
            <li>Preprocess: high contrast black/white + scale up.</li>
            <li>OCR each slot with Tess4J (Tesseract).</li>
            <li>Clean up OCR output (remove noise, normalize spacing, kill duplicates).</li>
          </ul>

          <h3>How it avoids bad reads</h3>
          <ul>
            <li>Fuzzy matching against a cached list of prime-part names.</li>
            <li>Confidence threshold: if it’s too messy, it won’t pretend it’s correct.</li>
            <li>Special-case handling for common weird reads or items that cannot be sold (example: “Forma”).</li>
          </ul>

          <h3>Note</h3>
          <p>This project is private, if you're interested in seeing how it works, please let me know!</p>
        `
            },
            {
                img: "/img/WFMSlide1.png",
                html: `
          <h3>Market data tab (API + sanity checks)</h3>
          <p>
            This tab pulls and ranks items so you can see what’s valuable / in-demand.
            It also caches results and respects rate limits, so the API doesn’t get hammered.
          </p>

          <h3>What’s going on here</h3>
          <ul>
            <li>Fetch list of tradable items and normalize names/slugs.</li>
            <li>Cache responses so repeated checks are fast.</li>
            <li>Rate limiting built-in (no spam calls).</li>
            <li>Shows “top results” so you instantly see what’s hot.</li>
          </ul>

          <h3>Why this matters</h3>
          <ul>
            <li>Fast refresh without waiting forever.</li>
            <li>Stable results even if you check often.</li>
          </ul>
        `
            },
            {
                img: "/img/WFMSlide3.png",
                html: `
          <h3>Reward Scanner results</h3>
          <p>
            After OCR + matching, the app fetches the lowest online PC sell prices,
            sorts the 4 rewards, and highlights the best pick.
          </p>

          <h3>What it shows</h3>
          <ul>
            <li>Detected reward name + match confidence.</li>
            <li>Lowest online sell price for each slot.</li>
            <li>Auto-sorted so the best choice is obvious.</li>
           
          </ul>

          <h3>Small but important details</h3>
          <ul>
            <li>If OCR confidence is low, it won’t “lie” - it marks it as uncertain.</li>
            <li>Results are repeatable because matching is controlled and cleaned.</li>
          </ul>
        `
            }
        ]
    },

    "unity-pra": {
        title: "PRA Prototype — First-Person Parkour + Spellweaving (Unity)",
        tags: ["Unity", "C#", "URP", "RenderGraph", "Shaders", "Systems Design", "Performance"],
        links: { live: "", github: "", video: "" },
        slides: [
            {
                img: "/img/Unity.png",
                html: `
          <h3>Project overview</h3>
          <p>A fast first-person prototype focused on <b>momentum movement</b> + <b>spell composition</b>, with custom URP visuals built to stay performant.</p>

          <h3>Core pillars</h3>
          <ul>
            <li><b>Movement first:</b> responsive traversal that feels good at speed.</li>
            <li><b>Spellweaving:</b> element + modifiers + form, resolved instantly at runtime.</li>
            <li><b>Custom visuals:</b> a dash effect that “tears reality” using URP + depth-based projection.</li>
          </ul>

          <h3>What I cared about</h3>
          <ul>
            <li>No input lag, no stutters, no “systems fighting each other”.</li>
            <li>Everything data-driven where it matters, and deterministic to debug.</li>
          </ul>

          <h3>Note:</h3>
          <p>This project is private, if you're interested to see more, please let me know.</p>
        `
            },
            {
                img: "/img/PRA1.webm",
                html: `
          <h3>Movement showcase</h3>
          <p>The traversal is built around <b>momentum control</b>, not canned animations - speed is earned and preserved.</p>

          <h3>Movement system details</h3>
          <ul>
            <li><b>State machine</b> for predictability (sprint, dash, wallrun, slide, vault, air states).</li>
            <li><b>Sliding</b> preserves momentum, then bleeds speed via friction… unless the slope is steep enough (≈ <b>45°+</b>) where gravity wins.</li>
            <li><b>Vaulting</b> uses an exit vector derived from your entry vector, so high-speed lines stay fluid.</li>
            <li><b>Wallrunning</b> is energy-capped and ramps gravity back in over time.</li>
          </ul>

          <h3>Why it feels good</h3>
          <ul>
            <li>Speed doesn’t randomly disappear.</li>
            <li>Transitions are readable and controllable at high velocity.</li>
            <li>Systems are tuned to reward clean movement lines.</li>
          </ul>
        `
            },
            {
                img: "/img/PRASpellWeave.webm",
                html: `
          <h3>Spellweaving in action</h3>
          <p>You build spells on the fly: <b>Element → Modifiers → Form</b>. The system resolves it instantly without slowing movement.</p>

          <h3>How it resolves fast</h3>
          <ul>
            <li><b>Elements use a bitmask key</b> (orderless combos) so resolution is cheap.</li>
            <li>The element key hits an <b>O(1) table lookup</b> to get the base payload.</li>
            <li><b>Modifiers aren’t looked up</b> - they’re just <b>math transforms</b> applied to the payload (multi, spread, pierce, homing strength, etc.).</li>
            <li><b>Form</b> is the executor (projectile / wave / beam style behavior), keeping the pipeline clean.</li>
          </ul>

          <h3>Making skills feel unique (single-instance overrides)</h3>
          <ul>
            <li>Most spells follow the same pipeline, but <b>specific “signature” casts can override</b> values (VFX intensity, timings, curve quirks, special rules).</li>
            <li>This keeps the system reusable while still allowing <b>hand-tuned standout abilities</b>.</li>
          </ul>

          <h3>Why it matters</h3>
          <ul>
            <li>High variety without runtime cost.</li>
            <li>Easy to expand: add data + tuning, not new branching code paths.</li>
            <li>Stays responsive even while sprinting, sliding, and dashing.</li>
          </ul>
          <p>Note: The original scope had 8 elements, 8 modifiers and 8 forms, resulting in 73 728 different unique combinations.</p>
          <p>Needlessly to say, I cut it down to 4 of each and made Modifiers pure math/code. Tuning the endresult down to 40 unique combinations.</p>
          
        `
            },
            {
                img: "/img/DashFXSlide.png",
                html: `
          <h3>Dash FX - depth-projected grid + masking</h3>
          <p>This dash effect uses the camera’s depth to project a grid onto real surfaces, then reveals it through vignette + block gating during the dash.</p>

          <h3>Pipeline (the 3 stages in the image)</h3>
          <ul>
            <li><b>1) Depth → world reconstruction:</b> sample depth, rebuild world position per pixel, derive surface orientation from screen-space derivatives.</li>
            <li><b>2) Vignette mask:</b> inverted mask controls where the effect is allowed to show (clean readability).</li>
            <li><b>3) Block falloff:</b> hashed block grid decides which cells reveal, so the tear feels noisy + dynamic instead of a flat overlay.</li>
          </ul>

          <h3>Why it’s built this way</h3>
          <ul>
            <li>Looks “anchored” to the scene instead of screen-space sticker noise.</li>
            <li>Cheap shaping controls (vignette + blocks) = strong art direction without heavy cost.</li>
            <li>Designed to work cleanly in URP pipelines (including RenderGraph paths).</li>
          </ul>
          <p>Note: I'll need to further test the performance impact, for now it seems very performance friendly.</p>
        `
            },
            {
                img: "/img/DashFX.gif",
                html: `
          <h3>Performance & pooling</h3>
          <p>This project is designed to survive stress: lots of movement, lots of effects, no spikes.</p>

          <h3>What I did</h3>
          <ul>
            <li><b>Pooling</b> for projectiles, impact VFX, decals, and audio one-shots.</li>
            <li><b>Budgets</b> for spawns (deny or degrade when limits are hit instead of tanking FPS).</li>
            <li>Profiling hooks so it’s easy to see what costs what.</li>
          </ul>

          <h3>Result</h3>
          <ul>
            <li>Stable runtime behavior during fast traversal + repeated casting.</li>
            <li>No “one big dash = 40ms hitch” nonsense.</li>
          </ul>
        `
            }
        ]
    }
}
