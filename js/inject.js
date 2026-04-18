const storage = chrome?.storage || browser?.storage;

// ═══════════════════════════════════════════════════════════════════
//  YARDIMCI FONKSİYONLAR
// ═══════════════════════════════════════════════════════════════════

function getPermission() {
    return new Promise(resolve => {
        storage.local.get(["aktiflikDurumu"], result => {
            if (result.aktiflikDurumu == null) {
                storage.local.set({ aktiflikDurumu: 1 });
                resolve(1);
            } else {
                resolve(result.aktiflikDurumu ? 1 : 0);
            }
        });
    });
}

function waitForElm(selector) {
    return new Promise(resolve => {
        const found = document.querySelector(selector);
        if (found) return resolve(found);
        const obs = new MutationObserver(() => {
            const el = document.querySelector(selector);
            if (el) { resolve(el); obs.disconnect(); }
        });
        obs.observe(document.body, { childList: true, subtree: true });
    });
}

// localStorage'dan güvenli şekilde array oku (JSON veya virgüllü string)
function safeJsonArray(raw, fallback) {
    if (!raw) return [...fallback];
    try {
        const p = JSON.parse(raw);
        return Array.isArray(p) ? p : raw.split(",").map(s => s.trim()).filter(Boolean);
    } catch {
        return raw.split(",").map(s => s.trim()).filter(Boolean);
    }
}

// Element oluşturma kısayolu
function make(tag, styles = {}, attrs = {}) {
    const e = document.createElement(tag);
    Object.assign(e.style, styles);
    Object.entries(attrs).forEach(([k, v]) => {
        if (k === "text") e.textContent = v;
        else e[k] = v;
    });
    return e;
}

// Elementi bekle VE DOM değişimleri quietMs boyunca duruncaya kadar bekle.
// Event listener'ların bağlanması için waitForIdle'dan çok daha güvenilir.
function waitForElmStable(selector, quietMs = 150) {
    return new Promise(resolve => {
        let timer = null;

        function onFound(el) {
            clearTimeout(timer);
            timer = setTimeout(() => { obs.disconnect(); resolve(el); }, quietMs);
        }

        const el = document.querySelector(selector);
        if (el) { onFound(el); }

        const obs = new MutationObserver(() => {
            const found = document.querySelector(selector);
            if (found) onFound(found);
        });
        obs.observe(document.body, { childList: true, subtree: true });
    });
}

// Elementi bekle, ama her zaman en az bir DOM değişimi gerçekleşene kadar bekle.
// waitForElmStable'dan farkı: eleman zaten varken çağrılsa bile, DOM mutation
// gerçekleşene dek resolve etmez. Translator click sonrası player DOM'u
// yeniden oluşana kadar beklemek için idealdir.
function waitForMutationThenStable(selector, quietMs = 400, timeoutMs = 8000) {
    return new Promise(resolve => {
        let timer = null;

        const check = () => {
            const el = document.querySelector(selector);
            if (el) {
                clearTimeout(timer);
                timer = setTimeout(() => { obs.disconnect(); resolve(el); }, quietMs);
            } else {
                clearTimeout(timer); // Element kayboldu, timer'ı sıfırla
            }
        };

        const obs = new MutationObserver(check);
        obs.observe(document.body, { childList: true, subtree: true });

        // Güvenlik timeout'u
        setTimeout(() => {
            obs.disconnect();
            resolve(document.querySelector(selector));
        }, timeoutMs);
    });
}

// Büyük/küçük harf normalizasyonu — Türkçe İ/I sorunu için.
// "MERDİVEN6".toLowerCase() → "merdi̇ven6" (i + U+0307 combining dot) olur,
// saklanan "merdiven6" ile eşleşmez. NFD + combining strip ile düzeltiyoruz.
function normalizeStr(s) {
    return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// Hover renk geçişi ekle
function addHover(elem, hoverColor, normalColor) {
    elem.addEventListener("mouseenter", () => elem.style.color = hoverColor);
    elem.addEventListener("mouseleave", () => elem.style.color = normalColor);
}

// Tıklama feedback'i — kısa bir yeşil parıltı
function addClickFlash(elem) {
    elem.addEventListener("mousedown", () => {
        const prev = elem.style.backgroundColor;
        const prevTransition = elem.style.transition;
        elem.style.transition = "background-color 0s";
        elem.style.backgroundColor = "#2a7a4b";
        setTimeout(() => {
            elem.style.transition = "background-color 0.4s ease";
            elem.style.backgroundColor = prev;
            setTimeout(() => { elem.style.transition = prevTransition; }, 450);
        }, 80);
    });
}

// İki objeyi derin birleştirir (sadece plain object'ler için).
// Siteye özel tema override'larını base tema üzerine uygulamak için kullanılır.
// Örnek: deepMerge({ a: { x: 1, y: 2 } }, { a: { y: 9 } }) → { a: { x: 1, y: 9 } }
function deepMerge(base, overrides) {
    const result = { ...base };
    for (const key of Object.keys(overrides)) {
        if (
            overrides[key] !== null &&
            typeof overrides[key] === "object" &&
            !Array.isArray(overrides[key]) &&
            typeof base[key] === "object" &&
            base[key] !== null
        ) {
            result[key] = { ...base[key], ...overrides[key] };
        } else {
            result[key] = overrides[key];
        }
    }
    return result;
}

// ═══════════════════════════════════════════════════════════════════
//  TEMA — tüm renkler tek yerde
// ═══════════════════════════════════════════════════════════════════

function buildTheme(isDark) {
    // Menünün sorunsuz uzaması ve sitelerin CSS'inden etkilenmemesi için temel kalıp
    const baseMenu = {
        position: "fixed",
        bottom: "150px",
        right: "7%",
        width: "12%",
        minWidth: "160px",
        maxWidth: "200px",
        minHeight: "430px",
        height: "fit-content", // KUTUNUN AŞAĞI UZAMASINI SAĞLAYAN ANAHTAR
        display: "flex",
        justifyContent: "start",
        flexDirection: "column", // İÇERİĞİ ALT ALTA DİZER
        zIndex: "2032",
        borderRadius: "4px",
        boxSizing: "border-box",
        fontFamily: '"Arial", Tahoma, Verdana, Helvetica, sans-serif'
    };

    if (isDark) return {
        isDark: true,
        menu: { ...baseMenu, backgroundColor: "#1e2026", border: "1px solid #17191f", boxShadow: "0 0 5px #22242b", color: "#c5c8ce" },
        header: { backgroundColor: "#17191f", color: "#c5c8ce" },
        section: { backgroundColor: "#23252c", border: "1px solid #17191f", marginTop: "6px" },
        secHdr: { backgroundColor: "#17191f", backgroundImage: "-webkit-linear-gradient(#17191f,#17191f)", color: "#fff" },
        btn: { background: "#1e2026", border: "1px solid #17191f", color: "#c5c8ce", cursor: "pointer" },
        inp: { borderColor: "rgba(23, 25, 31, 0.8)", backgroundColor: "#17191f", color: "#c5c8ce" },
        label: { color: "#c5c8ce" },
        isBtn: { margin: "6px auto", width: "40%", },
        activeBtn:  { backgroundColor: "#b22222", color: "#fff", borderColor: "#a01f1f" },
        passiveBtn: { backgroundColor: "#1e2026", color: "#c5c8ce", borderColor: "#17191f" },
        menuScroll: { position: "absolute", padding: "5px 10px 10px 10px", },
        hover: "white", normal: "#c5c8ce",
    };
    return {
        isDark: false,
        menu: { ...baseMenu, backgroundColor: "#eee", boxShadow: "0 0 5px #222", color: "#666666", backgroundImage: "linear-gradient(to bottom,rgba(255,255,255,0.9) 10%,rgba(255,255,255,0.5) 100%)" },
        header: { boxShadow: "0 5px 5px -4px rgba(0, 0, 0, 0.15) inset", color: "#fff", backgroundColor: "#2c2c2c", borderRadius: "3px 3px 0 0", backgroundImage: "-webkit-linear-gradient(top, #333, #222)" },
        section: { borderColor: "#fff", boxShadow: "0 0 5px #222", marginTop: "6px" },
        secHdr: { borderBottom: "1px solid #DDD", borderRadius: "3px 3px 0 0", backgroundImage: "-webkit-gradient(linear, 0 0, 0 100%, from(#fdfdfd), to(#ececec))", backgroundColor: "white", },
        btn: { cursor: "pointer" },
        inp: {},
        label: {},
        isBtn: { margin: "6px auto", width: "40%", },
        activeBtn:  { backgroundColor: "#b22222", color: "#fff", borderColor: "#a01f1f" },
        passiveBtn: { backgroundColor: "#1e2026", color: "#c5c8ce", borderColor: "#17191f" },
        menuScroll: { position: "absolute", padding: "5px 10px 10px 10px", },
        hover: "black", normal: "#2c2c2c",
    };
}

// ═══════════════════════════════════════════════════════════════════
//  SİTE KONFİGÜRASYONLARI
// ═══════════════════════════════════════════════════════════════════

const LOG = (...args) => console.log('[TraHelper]', ...args);
const WARN = (...args) => console.warn('[TraHelper]', ...args);

const SITES = {

    // ── Mevcut site ─────────────────────────────────────────────────
    turkanime: {
        match() {
            const path = window.location.pathname.split("/");
            const result = !window.location.hostname.includes("tranimeizle") && path[1] === "video";
            LOG(`[turkanime] match() → ${result} | hostname: ${window.location.hostname} | path[1]: ${path[1]}`);
            return result;
        },
        isDarkTheme() {
            const el = document.querySelector('.sun');
            return !el || getComputedStyle(el).display !== "block";
        },
        isWatchPage() {
            const result = window.location.pathname.split("/")[1] === "video";
            LOG(`[turkanime] isWatchPage() → ${result}`);
            return result;
        },
        async autoSelectTranslator(list) {
            LOG(`[turkanime] autoSelectTranslator() başladı | liste: ${JSON.stringify(list)}`);
            const btn1 = document.querySelector('#videodetay > div > div.btn-group.pull-right > button');
            const btn2 = document.querySelector('#videodetay > div > div.pull-right > button:nth-child(1)');
            LOG(`[turkanime] btn1: ${btn1 ? 'bulundu' : 'YOK'} | btn2: ${btn2 ? 'bulundu' : 'YOK'}`);
            if (btn1) btn1.click();
            const container = await waitForElmStable('#videodetay > div > div.pull-right');
            const buttons = [...container.children];
            LOG(`[turkanime] çevirmen butonları (${buttons.length} adet):`, buttons.map(b => b.innerHTML.trim()));
            for (const name of list) {
                const match = buttons.find(b => normalizeStr(b.innerHTML.trim()).endsWith(normalizeStr(name)));
                if (match) { LOG(`[turkanime] Çevirmen eşleşti: "${name}" → tıklanıyor`); match.click(); return; }
                WARN(`[turkanime] Çevirmen bulunamadı: "${name}"`);
            }
            LOG(`[turkanime] Hiç eşleşme yok → btn2 tıklanıyor`);
            if (btn2) btn2.click();
        },
        async autoSelectPlayer(list) {
            LOG(`[turkanime] autoSelectPlayer() başladı | liste: ${JSON.stringify(list)}`);
            const container = await waitForElmStable('#videodetay > div > div:nth-child(4)');
            const buttons = [...container.children];
            LOG(`[turkanime] player butonları (${buttons.length} adet):`, buttons.map(b => b.innerHTML.trim().split(/\s+/).pop()));
            for (const name of list) {
                const parts = (btn) => btn.innerHTML.split(" ");
                const match = buttons.find(b => normalizeStr(parts(b)[parts(b).length - 1]) === normalizeStr(name));
                if (match) { LOG(`[turkanime] Player eşleşti: "${name}" → tıklanıyor`); match.click(); return; }
                WARN(`[turkanime] Player bulunamadı: "${name}"`);
            }
            LOG(`[turkanime] Hiçbir player eşleşmedi → ilk buton tıklanıyor`); if (buttons[0]) buttons[0].click();
        },
        nextSel: '#arkaplan > div:nth-child(3) > div.col-xs-8 > div > div:nth-child(3) > div > div.panel-footer.clearfix > div:nth-child(3) > a:nth-child(2)',
        prevSel: '#arkaplan > div:nth-child(3) > div.col-xs-8 > div > div:nth-child(3) > div > div.panel-footer.clearfix > div:nth-child(3) > a:nth-child(1)',
    },

    // ── tranimeizle.io ──────────────────────────────────────────────
    tranimeizle: {
        match() {
            const result = window.location.hostname.includes("tranimeizle");
            LOG(`[tranimeizle] match() → ${result} | hostname: ${window.location.hostname}`);
            return result;
        },
        isDarkTheme() {
            const el = document.querySelector('.page_main_wrapper');
            console.log(el, "style", getComputedStyle(el).backgroundColor)
            return !el || getComputedStyle(el).backgroundColor !== "rgb(237, 239, 244)";
        },
        // İzleme sayfası tespiti: URL değil, sadece izleme sayfasında olan element
        isWatchPage() {
            const el = document.querySelector('.videoSource-items, #sourceList');
            const result = !!el;
            LOG(`[tranimeizle] isWatchPage() → ${result} | bulunan element: ${el ? el.id || el.className : 'YOK'}`);
            return result;
        },
        async autoSelectTranslator(list) {
            LOG(`[tranimeizle] autoSelectTranslator() başladı | liste: ${JSON.stringify(list)}`);
            // .playlist-title birden fazla var; direkt .fansubSelector'ı bekle
            LOG(`[tranimeizle] .fansubSelector elementi bekleniyor...`);
            await waitForElmStable('.fansubSelector');
            const buttons = [...document.querySelectorAll('.fansubSelector')];
            LOG(`[tranimeizle] fansubSelector butonları (${buttons.length} adet):`, buttons.map(b => b.textContent.trim()));
            if (buttons.length === 0) { WARN('[tranimeizle] Hiç .fansubSelector butonu bulunamadı! HTML:', container.innerHTML); return; }
            for (const name of list) {
                const match = buttons.find(b => normalizeStr(b.textContent.trim()) === normalizeStr(name));
                if (match) { LOG(`[tranimeizle] Çevirmen eşleşti: "${name}" → tıklanıyor`); match.click(); return; }
                WARN(`[tranimeizle] Çevirmen bulunamadı: "${name}" | mevcut: ${buttons.map(b => b.textContent.trim()).join(', ')}`);
            }
            LOG(`[tranimeizle] Eşleşme yok → ilk buton tıklanıyor: "${buttons[0]?.textContent.trim()}"`);
            if (buttons[0]) buttons[0].click();
        },
        async autoSelectPlayer(list) {
            LOG(`[tranimeizle] autoSelectPlayer() başladı | liste: ${JSON.stringify(list)}`);
            LOG(`[tranimeizle] .sourceBtn öğelerinin yüklenmesi bekleniyor...`);

            // DÜZELTME BURADA: Sadece boş kutuyu değil, kutunun içindeki butonun oluşmasını bekle
            await waitForElmStable('#sourceList .sourceBtn');

            const container = document.querySelector('#sourceList');
            const buttons = [...container.querySelectorAll('.sourceBtn')];

            LOG(`[tranimeizle] sourceBtn'ler (${buttons.length} adet):`, buttons.map(b => {
                const titleNode = b.querySelector('.title');
                return titleNode?.firstChild?.textContent?.trim() || '(boş)';
            }));

            if (buttons.length === 0) { WARN('[tranimeizle] Hiç .sourceBtn bulunamadı! HTML:', container.innerHTML); return; }

            for (const name of list) {
                const match = buttons.find(b => {
                    const titleNode = b.querySelector('.title');
                    const text = normalizeStr(titleNode?.firstChild?.textContent?.trim() || "");
                    return text === normalizeStr(name);
                });
                if (match) { LOG(`[tranimeizle] Player eşleşti: "${name}" → tıklanıyor`); match.click(); return; }
                WARN(`[tranimeizle] Player bulunamadı: "${name}"`);
            }
            LOG(`[tranimeizle] Hiçbir player eşleşmedi → ilk buton tıklanıyor: "${buttons[0]?.querySelector('.title')?.firstChild?.textContent?.trim()}"`);
            if (buttons[0]) buttons[0].click(); else console.log("[ERROR] ne oldu uşağım")
        },
        nextSel: "#mainBody > div.wrapper > main > div:nth-child(5) > div > div.clearfix.my-15 > a:nth-child(1)",
        prevSel: "#mainBody > div.wrapper > main > div:nth-child(5) > div > div.clearfix.my-15 > a.btn.btn-news.pull-left",
    },
    // ── anizm.net ───────────────────────────────────────────────────
    anizm: {
        match() {
            const result = window.location.hostname.includes("anizm");
            LOG(`[anizm] match() → ${result} | hostname: ${window.location.hostname}`);
            return result;
        },
        isDarkTheme: () => true, // Sadece karanlık tema istediğin için her zaman true dönüyoruz

        isWatchPage() {
            // Sadece video izleme sayfasında olan ana iframe kapsayıcısını arıyoruz
            const el = document.querySelector('.episodePlayerContent');
            const result = !!el;
            LOG(`[anizm] isWatchPage() → ${result} | bulunan element: ${el ? el.className : 'YOK'}`);
            return result;
        },

        async autoSelectTranslator(list) {
            LOG(`[anizm] autoSelectTranslator() başladı | liste: ${JSON.stringify(list)}`);
            LOG(`[anizm] .episodeTranslators içindeki butonlar bekleniyor...`);

            // Çevirmen butonlarının sayfaya yüklenmesini bekle
            await waitForElmStable('.episodeTranslators a[data-translatorclick]');
            const buttons = [...document.querySelectorAll('.episodeTranslators a[data-translatorclick]')];

            LOG(`[anizm] Çevirmen butonları (${buttons.length} adet):`, buttons.map(b => b.textContent.trim()));
            if (buttons.length === 0) { WARN('[anizm] Çevirmen butonu bulunamadı!'); return; }

            // Frameworkleri kandırmak için gerçekçi tıklama
            const gercekciTiklama = (element) => {
                element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
            };

            // Tıklandıktan sonra player DOM'unun yeniden oluşmasını bekleyen yardımcı.
            // Translator click → site AJAX ile player listesini yıkıp yeniden kurar;
            // autoSelectPlayer bu rebuild bitmeden çalışmamalı.
            const waitForPlayerRebuild = () => {
                LOG(`[anizm] Player DOM rebuild bekleniyor...`);
                return waitForMutationThenStable('.episodePlayers .videoPlayerButtons', 400, 8000);
            };

            for (const name of list) {
                const match = buttons.find(b => normalizeStr(b.textContent.trim()).includes(normalizeStr(name)));
                if (match) {
                    LOG(`[anizm] Çevirmen eşleşti: "${name}" → tıklanıyor`);
                    gercekciTiklama(match);
                    await waitForPlayerRebuild();
                    return;
                }
                WARN(`[anizm] Çevirmen bulunamadı: "${name}"`);
            }
            LOG(`[anizm] Eşleşme yok → ilk buton tıklanıyor: "${buttons[0]?.textContent.trim()}"`);
            if (buttons[0]) {
                gercekciTiklama(buttons[0]);
                await waitForPlayerRebuild();
            }
        },

        async autoSelectPlayer(list) {
            LOG(`[anizm] autoSelectPlayer() başladı | liste: ${JSON.stringify(list)}`);
            LOG(`[anizm] .videoPlayerButtons bekleniyor...`);

            // autoSelectTranslator zaten player DOM rebuild'ini bekledi ve döndü;
            // burada DOM zaten stabil olmalı. waitForElmStable güvenlik ağı olarak kalıyor.
            await waitForElmStable('.episodePlayers .videoPlayerButtons', 200);
            const buttons = [...document.querySelectorAll('.episodePlayers .videoPlayerButtons')];

            LOG(`[anizm] Player butonları (${buttons.length} adet):`, buttons.map(b => b.textContent.trim()));
            if (buttons.length === 0) { WARN('[anizm] Player butonu bulunamadı!'); return; }

            // Frameworkleri kandırmak için gerçekçi tıklama
            const gercekciTiklama = (element) => {
                element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
            };

            for (const name of list) {
                const match = buttons.find(b => normalizeStr(b.textContent.trim()).includes(normalizeStr(name)));
                if (match) {
                    LOG(`[anizm] Player eşleşti: "${name}" → tıklanıyor`);
                    gercekciTiklama(match);
                    return;
                }
                WARN(`[anizm] Player bulunamadı: "${name}"`);
            }
            LOG(`[anizm] Hiçbir player eşleşmedi → ilk buton tıklanıyor: "${buttons[0]?.textContent.trim()}"`);
            if (buttons[0]) gercekciTiklama(buttons[0]);
        },

        nextSel: "#pageContent > div.ui.container.episodeContainer > div.anizm_columns.anizm_fullWidth.mt-4.anizm_mobile.episodeInfoContainer > div.anizm_column.animeIzleInnerContainer > div.mb-3 > div:nth-child(3) > a.anizm_button.default.mini.puf_02",
        prevSel: "#pageContent > div.ui.container.episodeContainer > div.anizm_columns.anizm_fullWidth.mt-4.anizm_mobile.episodeInfoContainer > div.anizm_column.animeIzleInnerContainer > div.mb-3 > div:nth-child(3) > a:nth-child(1)",

        // Siteye özel tema override'ları — sadece değiştirmek istediğin anahtarları yaz.
        // Yazılmayan anahtarlar buildTheme(isDarkTheme()) çıktısından gelir.
        // Bu bloğu tamamen silerek ya da themeOverrides'ı kaldırarak varsayılan temaya dönebilirsin.
        themeOverrides: {
            // Örnek: anizm'in koyu arka planına uyan özel renkler
            menu: { backgroundImage: "-webkit-gradient(linear, 0 0, 0 100%, from(#2a2a2a), to(#1e1e1e))", backgroundColor: "#1e1e1e", border: "" },
            header: { backgroundColor: "#1e1e1e", color: "#e0e3ea" },
            section: { backgroundColor: "#2a2a2a", border: "" },
            secHdr: { backgroundImage: "#1e1e1e", backgroundColor: "#1e1e1e", color: "#fff" },
            inp: { borderColor: "rgba(30, 30, 30, 0.8)", backgroundColor: "rgb(30, 30, 30)", color: "#675f5f" },
            btn: { backgroundColor: "#1e1e1e", borderColor: "rgba(30, 30, 30, 0.8)" }
            // hover: "#ffffff", normal: "#b0b4be",
        },
    },

    // ── animecix.tv ─────────────────────────────────────────────────
    animecix: {
        match() {
            const result = window.location.hostname.includes("animecix");
            LOG(`[animecix] match() → ${result} | hostname: ${window.location.hostname}`);
            return result;
        },
        isDarkTheme: () => true,

        // URL /titles/.../episode/N formatındaysa izleme sayfasıdır.
        // .more-videos elementi SPA nedeniyle sonradan gelir; URL yeterli.
        isWatchPage() {
            const result = /\/titles\/.*\/episode\//.test(window.location.pathname);
            LOG(`[animecix] isWatchPage() → ${result} | path: ${window.location.pathname}`);
            return result;
        },

        // Menüyü document.body'ye değil bu selectora bağla
        mountSelector: '.more-videos',

        async autoSelectTranslator(list) {
            LOG(`[animecix] autoSelectTranslator() başladı | liste: ${JSON.stringify(list)}`);
            LOG(`[animecix] .translator-card bekleniyor...`);
            await waitForElmStable('.translator-card');
            const buttons = [...document.querySelectorAll('.translator-card')];
            LOG(`[animecix] Çevirmen butonları (${buttons.length} adet):`, buttons.map(b => b.querySelector('.translator-name')?.textContent?.trim()));
            if (buttons.length === 0) { WARN('[animecix] Çevirmen butonu bulunamadı!'); return; }

            const getName = b => normalizeStr(b.querySelector('.translator-name')?.textContent?.trim() || '');
            const click = el => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));

            for (const name of list) {
                const match = buttons.find(b => getName(b) === normalizeStr(name));
                if (match) {
                    LOG(`[animecix] Çevirmen eşleşti: "${name}" → tıklanıyor`);
                    click(match);
                    // Translator tıklanınca player listesi yeniden oluşur — bekle
                    await waitForMutationThenStable('.video-card', 300, 6000);
                    return;
                }
                WARN(`[animecix] Çevirmen bulunamadı: "${name}" | mevcut: ${buttons.map(getName).join(', ')}`);
            }
            // LOG(`[animecix] Eşleşme yok → ilk buton tıklanıyor: "${getName(buttons[0])}"`);
            // click(buttons[0]);
            await waitForMutationThenStable('.video-card', 300, 6000);
        },

        // async autoSelectPlayer(list) {
        //     LOG(`[animecix] autoSelectPlayer() başladı | liste: ${JSON.stringify(list)}`);
        //     LOG(`[animecix] .video-card bekleniyor...`);
        //     await waitForElmStable('.video-card');
        //     const buttons = [...document.querySelectorAll('.video-card')];
        //     LOG(`[animecix] Player butonları (${buttons.length} adet):`, buttons.map(b => b.querySelector('.video-name')?.textContent?.trim()));
        //     if (buttons.length === 0) { WARN('[animecix] Player butonu bulunamadı!'); return; }

        //     const getName = b => normalizeStr(b.querySelector('.video-name')?.textContent?.trim() || '');
        //     const click   = el => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));

        //     for (const name of list) {
        //         const match = buttons.find(b => getName(b) === normalizeStr(name));
        //         if (match) { LOG(`[animecix] Player eşleşti: "${name}" → tıklanıyor`); click(match); return; }
        //         WARN(`[animecix] Player bulunamadı: "${name}"`);
        //     }
        //     LOG(`[animecix] Hiçbir player eşleşmedi → ilk buton tıklanıyor: "${getName(buttons[0])}"`);
        //     click(buttons[0]);
        // },

        nextSel: '#cdk-overlay-3 > player > mat-sidenav-container > mat-sidenav-content > div.player-bottom.container > div.bottom-details > div.buttons > app-button:nth-child(5)',
        prevSel: '#cdk-overlay-3 > player > mat-sidenav-container > mat-sidenav-content > div.player-bottom.container > div.bottom-details > div.buttons > app-button:nth-child(4)',

        themeOverrides: {
            // Menü artık fixed değil; .more-videos içine inline oturuyor
            menu: {
                background: "#ffffff0d",
                backgroundColor: "unset",
                position: "relative",
                bottom: "unset", right: "unset",
                width: "100%", maxWidth: "unset",
                minHeight: "200px",
                border: "1px solid rgba(255, 255, 255, .1)",
                boxShadow: "unset",
                borderRadius: "12px",
                marginTop: "8px",
            },
            menuScroll: {
                display: "flex", justifyContent: "start", alignItems: "flex-start", position: "unset", padding: "16px 20px", gap: "15px",
            },
            isBtn: {
                width: "10%",
                margin: "0",
                marginTop: "0",
                fontFamily: "Inter, Helvetica Neue, sans-serif",
            },
            activeBtn:  { backgroundColor: "#0074e4", color: "#fff", borderColor: "#005fb8" },
            passiveBtn: { backgroundColor: "#ffffff14", color: "#aaa", borderColor: "rgba(255,255,255,0.1)" },
            section: {
                marginTop: "0",
                backgroundColor: "#ffffff0f",
                border: "1px solid rgba(255, 255, 255, .1)",
            },
            secHdr: {
                backgroundImage: "unset",
                backgroundColor: "unset",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                color: "#e5e1e6",
                fontFamily: "Inter, Helvetica Neue, sans-serif",
            },
            header: {
                padding: "20px 0",
                backgroundColor: "unset",
                borderBottom: "1px solid rgba(255, 255, 255, .08)",
                fontFamily: "Inter, Helvetica Neue, sans-serif"
            },
            inp: {
                backgroundColor: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, .1)",
                fontFamily: "Inter, Helvetica Neue, sans-serif",
            },
            btn: {
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
            }
        },
    },
};

// ═══════════════════════════════════════════════════════════════════
//  UI YARDIMCI FONKSİYONLARI
// ═══════════════════════════════════════════════════════════════════

// Başlık + içerik alanı olan panel bölümü oluştur
function createSection(theme, title) {
    const wrap = make('div', { ...theme.section, borderRadius: "3px", overflow: "hidden" });
    const hdr = make('div', {
        ...theme.secHdr,
        height: "25px", display: "flex",
        alignItems: "center", justifyContent: "center",
        fontSize: "13px", fontWeight: "bold",
    }, { text: title });
    const body = make('div', { padding: "6px 8px" });
    wrap.appendChild(hdr);
    wrap.appendChild(body);
    return { wrap, hdr, body };
}

// + / Kaydet butonlu input listesi — Player veya Çevirmen için
function createInputList(theme, storageKey, defaultVal, label) {
    const { wrap, body } = createSection(theme, label + " Sırası");
    const savedList = safeJsonArray(localStorage.getItem(storageKey), [defaultVal]);
    let inputCount = 0;

    // Buton satırı — en üstte, inputlardan önce
    const btnRow = make('div', { display: "flex", gap: "6px", justifyContent: "center", marginBottom: "4px" });

    const btnAdd = make('button', { ...theme.btn, flex: "0", borderRadius: "3px", fontFamily: "inherit" }, { text: "+" });
    addHover(btnAdd, theme.hover, theme.normal);
    addClickFlash(btnAdd);

    const btnSave = make('button', { ...theme.btn, flex: "0.5", borderRadius: "3px", fontFamily: "inherit" }, { text: "Kaydet" });
    btnSave.dataset.role = "save";
    addHover(btnSave, theme.hover, theme.normal);
    addClickFlash(btnSave);

    btnRow.appendChild(btnAdd);
    btnRow.appendChild(btnSave);
    body.appendChild(btnRow);

    // Input alanları — buton satırının altında
    const inputArea = make('div');
    body.appendChild(inputArea);

    function addInput(value = "") {
        inputCount++;
        const inp = make('input', {
            ...theme.inp, display: "block", margin: "5px auto", width: "85%"

        }, {
            type: "text",
            id: storageKey + "Input" + inputCount,
            name: storageKey + "Input",
            placeholder: inputCount + ". " + label,
            value,
        });
        inputArea.appendChild(inp);
    }

    savedList.forEach(v => addInput(v));

    btnAdd.onclick = () => addInput();

    btnSave.onclick = () => {
        const result = [];
        let i = 1;
        while (document.getElementById(storageKey + "Input" + i)) {
            const v = normalizeStr(document.getElementById(storageKey + "Input" + i).value.trim());
            if (v) result.push(v);
            i++;
        }
        localStorage.setItem(storageKey, JSON.stringify(result.length ? result : [defaultVal]));
    };

    return wrap;
}

// Ayarlar paneli — tuş atama + kısayol aktif/pasif
function createAyarlarPanel(theme) {
    const { wrap, hdr, body } = createSection(theme, "Ayarlar ▼");
    const content = make('div', { display: "none" });
    hdr.style.cursor = "pointer";
    hdr.style.userSelect = "none";
    hdr.onclick = () => {
        const open = content.style.display !== "none";
        content.style.display = open ? "none" : "block";
        hdr.textContent = open ? "Ayarlar ▼" : "Ayarlar ▲";
    };
    wrap.appendChild(content);

    const keyLabel = code => ({
        NumpadAdd: "Numpad +", NumpadSubtract: "Numpad -",
        NumpadMultiply: "Numpad *", NumpadDivide: "Numpad /",
        NumpadEnter: "Numpad Enter",
    })[code] || code;

    let savedNextKey = localStorage.getItem("NextKey") || "NumpadAdd";
    let savedPrevKey = localStorage.getItem("PrevKey") || "NumpadSubtract";
    let keyNavActive = localStorage.getItem("KeyNavActive") !== "0";
    let listeningInput = null;

    function makeKeyInput(label, getKey, setKey, storageKey) {
        const lbl = make('div', { ...theme.label, fontSize: "12px", textAlign: "center", marginBottom: "3px" }, { text: label });
        const inp = make('input', { ...theme.inp, display: "block", margin: "0 auto 10px", cursor: "pointer", width: "85%" }, {
            type: "text", readOnly: true,
            value: keyLabel(getKey()),
            title: "Değiştirmek için tıkla ve tuşa bas",
        });
        inp.addEventListener("click", () => {
            listeningInput = { inp, storageKey, setKey };
            inp.value = "Tuşa bas...";
            inp.style.outline = "2px solid #b22222";
        });
        content.appendChild(lbl);
        content.appendChild(inp);
        return inp;
    }

    makeKeyInput("Sonraki Bölüm Tuşu", () => savedNextKey, v => { savedNextKey = v; }, "NextKey");
    makeKeyInput("Önceki Bölüm Tuşu", () => savedPrevKey, v => { savedPrevKey = v; }, "PrevKey");

    // Kısayol aktif/pasif
    const row = make('div', { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 4px 8px" });
    const rowLabel = make('span', { ...theme.label, fontSize: "12px" }, { text: "Bölüm Kısayolu" });
    const btnToggle = make('button', {});

    function refreshToggle() {
        btnToggle.textContent = keyNavActive ? "Aktif" : "Pasif";
        if (keyNavActive) {
            Object.assign(btnToggle.style, { backgroundColor: "#b22222", color: "#fff", borderColor: "#a01f1f" });
        } else {
            Object.assign(btnToggle.style, theme.btn);
        }
    }
    refreshToggle();
    btnToggle.onclick = () => {
        keyNavActive = !keyNavActive;
        localStorage.setItem("KeyNavActive", keyNavActive ? "1" : "0");
        refreshToggle();
    };
    row.appendChild(rowLabel);
    row.appendChild(btnToggle);
    content.appendChild(row);

    return { wrap, getNextKey: () => savedNextKey, getPrevKey: () => savedPrevKey, isNavActive: () => keyNavActive, getListening: () => listeningInput, clearListening: () => { listeningInput = null; } };
}

// ═══════════════════════════════════════════════════════════════════
//  ANA KOD (SPA Uyumlu)
// ═══════════════════════════════════════════════════════════════════

(async () => {
    LOG('=== TraHelper başlatılıyor ===');
    const aktif = await getPermission();
    if (!aktif) return;

    let currentInjectedUrl = null; // Menünün hangi bölümde eklendiğini takip etmek için

    // Menüyü oluşturup siteye enjekte eden asıl fonksiyon
    async function injectMenuAndRun(site) {
        LOG(`[${site.match.name || 'Site'}] İzleme sayfası algılandı → menü kuruluyor...`);

        const baseTheme = buildTheme(site.isDarkTheme());
        const theme = site.themeOverrides ? deepMerge(baseTheme, site.themeOverrides) : baseTheme;

        const divMenu = make('div', { ...theme.menu, padding: "0" }, { id: "divMenu" });
        const divHeader = make('div', {
            ...theme.header, width: "100%", height: "28px", display: "flex",
            alignItems: "center", justifyContent: "center", cursor: "pointer",
            userSelect: "none", fontWeight: "bold", fontSize: "13px", flexShrink: "0",
            boxSizing: "border-box",
        }, { text: "Türk Anime Yardımcısı ▼" });

        const divScroll = make('div', {
            ...theme.menuScroll, overflowY: "auto", flex: "1",
        }, { id: "divMenuScroll" });

        // localStorage'dan önceki durumu oku (varsayılan: açık)
        let menuOpen = localStorage.getItem('TraHelper_menuOpen') !== '0';

        // ÇÖZÜM: Orijinal değerleri temanın kendisinden okuyup güvene alıyoruz
        const scrollOpenDisplay = theme.menuScroll.display || 'block';
        const originalMinHeight = theme.menu.minHeight || '430px';

        // Başlangıç durumunu uygula (sayfa yüklendiğinde kapalıysa gizle)
        if (!menuOpen) {
            divScroll.style.display = 'none';
            divMenu.style.minHeight = '0';
            divMenu.style.height = '28px';
            divHeader.textContent = 'Türk Anime Yardımcısı ▶';
        }

        divHeader.onclick = () => {
            menuOpen = !menuOpen;
            localStorage.setItem('TraHelper_menuOpen', menuOpen ? '1' : '0');
            divScroll.style.display = menuOpen ? scrollOpenDisplay : 'none';
            
            // DÜZELTME BURADA: Boşluk ('') yerine temadaki orijinal yüksekliği geri veriyoruz
            divMenu.style.minHeight = menuOpen ? originalMinHeight : '0';
            
            divMenu.style.height = menuOpen ? 'fit-content' : '28px';
            divHeader.textContent = menuOpen ? 'Türk Anime Yardımcısı ▼' : 'Türk Anime Yardımcısı ▶';
        };

        divMenu.appendChild(divHeader);
        divMenu.appendChild(divScroll);

        const btnAktif = make('button', {
            ...theme.isBtn,
            ...theme.activeBtn,
            display: "block",
        }, { id: "divButton", text: "Aktif" });

        btnAktif.onclick = () => {
            const isAktif = btnAktif.textContent === "Aktif";
            btnAktif.textContent = isAktif ? "Pasif" : "Aktif";
            Object.assign(btnAktif.style, isAktif ? theme.passiveBtn : theme.activeBtn);
            storage.local.set({ aktiflikDurumu: isAktif ? 0 : 1 });
        };
        divScroll.appendChild(btnAktif);

        divScroll.appendChild(createInputList(theme, "Videoplayers", "sibnet", "Video Player"));
        divScroll.appendChild(createInputList(theme, "Translators", "adonis", "Çevirmen"));

        const ayarlar = createAyarlarPanel(theme);
        divScroll.appendChild(ayarlar.wrap);

        // Menüyü siteye bağla
        if (site.mountSelector) {
            LOG(`Menü "${site.mountSelector}" elementine bekleniyor...`);
            const mountTarget = await waitForElmStable(site.mountSelector, 200);
            mountTarget.appendChild(divMenu);
            LOG(`Menü hedefe başarıyla bağlandı!`);
        } else {
            document.body.appendChild(divMenu);
        }

        // Klavye Olayları (Önceki event listener'ı ezmemesi için isimsiz fonk kullanmıyoruz)
        document.addEventListener("keydown", e => {
            const listening = ayarlar.getListening();
            if (listening) {
                e.preventDefault(); e.stopPropagation();
                listening.setKey(e.code);
                localStorage.setItem(listening.storageKey, e.code);
                listening.inp.value = ({ NumpadAdd: "Numpad +", NumpadSubtract: "Numpad -" })[e.code] || e.code;
                listening.inp.style.outline = "";
                ayarlar.clearListening();
                return;
            }
            if (!ayarlar.isNavActive()) return;
            if (e.code === ayarlar.getNextKey() && site.nextSel) { waitForElm(site.nextSel).then(el => el.click()); }
            else if (e.code === ayarlar.getPrevKey() && site.prevSel) { waitForElm(site.prevSel).then(el => el.click()); }
        }, true);

        // Otomatik seçim işlemleri
        const vpList = safeJsonArray(localStorage.getItem("Videoplayers"), ["sibnet"]);
        const tlList = safeJsonArray(localStorage.getItem("Translators"), ["adonis"]);
        await site.autoSelectTranslator(tlList);
        await site.autoSelectPlayer(vpList);
    }

    // ═══════════════════════════════════════════════════════════════════
    // SPA Bekçisi (Observer): Sayfa değişimlerini ve DOM'u sürekli kontrol eder
    // ═══════════════════════════════════════════════════════════════════

    let isInjecting = false; // KİLİT: Sonsuz döngüyü engeller

    async function checkState() {
        if (isInjecting) return; // Eğer şu an menü kurulum aşamasındaysa, diğer tüm bildirimleri yoksay!

        const site = Object.values(SITES).find(s => s.match());
        if (!site || !site.isWatchPage()) return; // İzleme sayfasında değilsek bir şey yapma

        const currentUrl = window.location.href;
        const existingMenu = document.getElementById('divMenu');

        // Eğer yeni bir bölüme geçildiyse VEYA site menümüzü DOM'dan sildiyse yeniden kur
        if (currentInjectedUrl !== currentUrl || !existingMenu) {
            isInjecting = true; // KİLİDİ KAPAT (Başka kurulum isteklerini engelle)

            if (existingMenu) existingMenu.remove(); // Varsa kalıntıları temizle
            currentInjectedUrl = currentUrl;

            // Site framework'ünün sayfayı oluşturmasına kısa bir süre tanı
            setTimeout(async () => {
                try {
                    // Ekstra Güvenlik: Aynı anda iki tane oluşmaması için tekrar kontrol et
                    if (!document.getElementById('divMenu')) {
                        await injectMenuAndRun(site);
                    }
                } catch (error) {
                    console.error("[TraHelper] Menü kurulumunda hata:", error);
                } finally {
                    isInjecting = false; // KİLİDİ AÇ (İşlem tamamen bitti, yeni değişiklikleri dinleyebilirsin)
                }
            }, 500);
        }
    }

    // İlk açılışta kontrol et
    checkState();

    // Site içinde dolaşırken (SPA Navigation) değişiklikleri yakalamak için Observer
    const spaObserver = new MutationObserver(() => checkState());
    spaObserver.observe(document.body, { childList: true, subtree: true });

})();