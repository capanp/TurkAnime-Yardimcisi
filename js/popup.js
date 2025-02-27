const storage = chrome.storage;

async function getPermission() {
    return new Promise((resolve) => {
        storage.local.get(["aktiflikDurumu"], (result) => {
            // Eğer aktiflikDurumu undefined veya null ise 1 olarak ayarla
            if (result.aktiflikDurumu === undefined || result.aktiflikDurumu === null) {
                console.log("İlk açılış: Uzantı varsayılan olarak aktif.");
                storage.local.set({ "aktiflikDurumu": 1 }); // Varsayılan olarak 1 olarak ayarla
                resolve(1); // 1 olarak döndür
            } else if (result.aktiflikDurumu) {
                console.log("Uzantı aktif");
                resolve(1); // 1 olarak döndür
            } else {
                console.log("Uzantı pasif");
                resolve(0); // 0 olarak döndür
            }
        });
    });
}

(async () => {
    let aktiflikDurumu = await getPermission();  // Burada await kullanıyoruz
    let url = window.location.href;
    let button = document.getElementById('main-button');

    if (aktiflikDurumu) {
        button.classList.remove('closebt');
        button.classList.add('openbt');
        button.innerHTML = "Aktif";
    } else {
        button.classList.remove('openbt');
        button.classList.add('closebt');
        button.innerHTML = "Pasif";
    }
})();

document.getElementById('main-button').addEventListener('click', changeStatus);
function changeStatus() {
    let button = document.getElementById('main-button');

    console.log("uie")

    if (button.classList.contains('openbt')) {
        storage.local.set({ "aktiflikDurumu": 0 });

        button.classList.remove('openbt');
        button.classList.add('closebt');
        button.innerHTML = "Pasif";
    } else if (button.classList.contains('closebt')) {
        storage.local.set({ "aktiflikDurumu": 1 });

        button.classList.remove('closebt');
        button.classList.add('openbt');
        button.innerHTML = "Aktif";
    }
}