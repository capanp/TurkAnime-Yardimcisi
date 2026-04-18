const storage = chrome?.storage || browser?.storage;

const btn       = document.getElementById('main-button');
const track     = btn.querySelector('.toggle-track');
const dot       = document.getElementById('statusDot');
const label     = document.getElementById('statusLabel');

function setUI(isActive) {
    if (isActive) {
        track.classList.remove('off');
        dot.classList.remove('off');
        label.textContent = 'Aktif';
    } else {
        track.classList.add('off');
        dot.classList.add('off');
        label.textContent = 'Pasif';
    }
}

// Mevcut durumu yükle
storage.local.get(['aktiflikDurumu'], result => {
    const isActive = result.aktiflikDurumu == null ? true : !!result.aktiflikDurumu;
    setUI(isActive);
});

// Tıklanınca toggle
btn.addEventListener('click', () => {
    storage.local.get(['aktiflikDurumu'], result => {
        const current = result.aktiflikDurumu == null ? 1 : result.aktiflikDurumu;
        const next = current ? 0 : 1;
        storage.local.set({ aktiflikDurumu: next });
        setUI(!!next);
    });
});