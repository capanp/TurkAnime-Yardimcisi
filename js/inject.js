const storage = chrome?.storage || browser?.storage;

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

	if (aktiflikDurumu) {
		const elementt = document.querySelector('.sun');

		let divMenu = document.createElement('div');
		divMenu.style.height = "50%";
		divMenu.id = "divMenu";

		if (getComputedStyle(elementt).display.toString() == "inline") {
			divMenu.style.backgroundColor = "#9E9E9E";
			divMenu.style.background = "#eee!important";
			divMenu.style.color = "#666666";
			divMenu.style.boxShadow = "0 0 5px #222";
			divMenu.style.backgroundImage = "linear-gradient(to bottom,rgba(255,255,255,0.9) 10%,rgba(255,255,255,0.5) 100%)";
		} else {
			divMenu.style.backgroundColor = "#1e2026";
			divMenu.style.background = "#1E2026!important";
			divMenu.style.color = "#c5c8ce";
			divMenu.style.border = "1px solid #17191f";
			divMenu.style.boxShadow = "0 0 5px #22242b";
		}

		document.body.appendChild(divMenu);

		let divHeader = document.createElement('div');
		divHeader.innerHTML = "Otomatik İşlem";
		divHeader.style.height = "6%";
		divHeader.id = "divHeader";

		if (getComputedStyle(elementt).display.toString() != "inline") {
			divHeader.style.backgroundColor = "#17191f";
			divHeader.style.color = "#c5c8ce!important";
			divHeader.style.boxShadow = "0 0 5px #22242b!important";
		}

		document.getElementById("divMenu").appendChild(divHeader);

		let oldHeight = divMenu.style.height;

		divHeader.onclick = function () {
			if (divMenu.style.height == oldHeight) {
				divMenu.style.height = "3%";
				divHeader.style.height = "100%";
				divButton.style.display = "none";
			} else {
				divMenu.style.height = oldHeight;
				divHeader.style.height = "6%";
				divButton.style.display = "flex";
			}
		}

		let divMenuScroll = document.createElement('div');
		divMenuScroll.id = "divMenuScroll";

		document.getElementById("divMenu").appendChild(divMenuScroll);

		let divButton = document.createElement('Button');
		divButton.id = "divButton";
		divButton.innerHTML = "Aktif";

		divButton.onclick = function () {
			if (divButton.innerHTML == "Aktif") {
				if (getComputedStyle(elementt).display.toString() == "inline") {
					divButton.innerHTML = "Pasif";
					divButton.style.backgroundColor = "#f0f0f0";
					divButton.style.color = "#333";
					divButton.style.borderColor = "#ccc rgba(0,0,0,.19) rgba(0,0,0,.18)";
					divButton.style.backgroundImage = "linear-gradient(to bottom,rgba(255,255,255,0.9) 10%,rgba(255,255,255,0.1) 100%)";
				} else {
					divButton.innerHTML = "Pasif";
					divButton.style.backgroundColor = "#1e2026";
					divButton.style.color = "#c5c8ce";
					divButton.style.borderColor = "#17191f";
				}

				storage.local.set({ "aktiflikDurumu": 0 });
			} else {
				divButton.innerHTML = "Aktif";
				divButton.style.backgroundColor = "#b22222";
				divButton.style.color = "#fff";
				divButton.style.borderColor = "#a01f1f";
				divButton.style.removeProperty("background-image");
				
				storage.local.set({ "aktiflikDurumu": 1 });
			}
		}

		document.getElementById("divMenuScroll").appendChild(divButton);

		let divVideo = document.createElement('div');
		divVideo.id = "divVideo";
		divVideo.style.height = "120px";

		if (getComputedStyle(elementt).display.toString() !== "inline") {
			divVideo.style.backgroundColor = "#23252c";
			divVideo.style.border = "1px solid #17191f";
		}

		document.getElementById("divMenuScroll").appendChild(divVideo);

		let divVideoHeader = document.createElement('div');
		divVideoHeader.id = "divVideoHeader";
		divVideoHeader.innerHTML = "Player Sırası";

		if (getComputedStyle(elementt).display.toString() != "inline") {
			divVideoHeader.style.backgroundColor = "#17191f";
			divVideoHeader.style.backgroundImage = "-webkit-linear-gradient(#17191f,#17191f)";
			divVideoHeader.style.color = "#fff";
			divVideoHeader.style.borderBottom = "0px";
		}

		document.getElementById("divVideo").appendChild(divVideoHeader);

		let divAddVideoButton = document.createElement('Button');
		divAddVideoButton.id = "divAddVideoButton";
		divAddVideoButton.innerHTML = "+";

		if (getComputedStyle(elementt).display.toString() !== "inline") {
			divAddVideoButton.style.background = "#1e2026";
			divAddVideoButton.style.border = "1px solid #17191f";
			divAddVideoButton.style.color = "#c5c8ce";

			let addMainColor = divAddVideoButton.style.color;

			divAddVideoButton.addEventListener("mouseenter", (event) => {
				divAddVideoButton.style.color = "white";
			});

			divAddVideoButton.addEventListener("mouseleave", (event) => {
				divAddVideoButton.style.color = addMainColor;
			});
		} else {
			let addMainColor = "#2c2c2c";

			divAddVideoButton.addEventListener("mouseenter", (event) => {
				divAddVideoButton.style.color = "black";
			});

			divAddVideoButton.addEventListener("mouseleave", (event) => {
				divAddVideoButton.style.color = addMainColor;
			});
		}

		let divVideoOldHeight = 120;
		let divNum = 1;

		let divVideoInput = document.createElement('input'); // input video player
		divVideoInput.type = "text";
		divVideoInput.id = "divVideoInput" + divNum;
		divVideoInput.name = "divVideoInput";
		divVideoInput.placeholder = divNum.toString() + ". Video Player";

		divVideoInput.style.marginLeft = "auto";
		divVideoInput.style.marginRight = "auto";
		divVideoInput.style.marginTop = "15px";

		divAddVideoButton.onclick = function () {
			divNum = divNum + 1;
			divVideoOldHeight = divVideoOldHeight + 40;
			let divVideoInput = document.createElement('input'); // input video player
			divVideo.style.height = divVideoOldHeight.toString() + "px";

			divVideoInput.style.marginLeft = "auto";
			divVideoInput.style.marginRight = "auto";
			divVideoInput.style.marginTop = "15px";
			divVideoInput.type = "text";
			divVideoInput.id = "divVideoInput" + divNum.toString();
			divVideoInput.name = "divVideoInput";
			divVideoInput.placeholder = divNum.toString() + ". Video Player";

			document.getElementById("divVideo").appendChild(divVideoInput);
		}

		document.getElementById("divVideo").appendChild(divAddVideoButton);

		let divSaveVideoButton = document.createElement('Button');
		divSaveVideoButton.id = "divSaveVideoButton";
		divSaveVideoButton.innerHTML = "Kaydet";

		if (getComputedStyle(elementt).display.toString() !== "inline") {
			divSaveVideoButton.style.background = "#1e2026";
			divSaveVideoButton.style.border = "1px solid #17191f";
			divSaveVideoButton.style.color = "#c5c8ce";

			let saveMainColor = divSaveVideoButton.style.color;

			divSaveVideoButton.addEventListener("mouseenter", (event) => {
				divSaveVideoButton.style.color = "white";
			});

			divSaveVideoButton.addEventListener("mouseleave", (event) => {
				divSaveVideoButton.style.color = saveMainColor;
			});

			divSaveVideoButton.addEventListener("onclick", (event) => {
				divSaveVideoButton.style.color = "#FF0000";
			});
		} else {
			let saveMainColor = "#2c2c2c";

			divSaveVideoButton.addEventListener("mouseenter", (event) => {
				divSaveVideoButton.style.color = "black";
			});

			divSaveVideoButton.addEventListener("mouseleave", (event) => {
				divSaveVideoButton.style.color = saveMainColor;
			});
		}

		divSaveVideoButton.onclick = function () {
			localStorage.setItem("Videoplayers", "testElement");

			let videoplayerArray = [];
			let kl = 1;
			while (kl < 50) {
				if (document.getElementById("divVideoInput" + kl) == null) {
					localStorage.setItem("Videoplayers", videoplayerArray);
					break;
				} else if ((document.getElementById("divVideoInput" + kl).value.toString() == "" || document.getElementById("divVideoInput" + kl).value.toString() == " ")) {
					// do nothing
				} else {
					videoplayerArray.push(document.getElementById("divVideoInput" + kl).value.toLowerCase());
				}
				kl = kl + 1;
			}
			if (videoplayerArray == "") localStorage.setItem("Videoplayers", "sibnet");
		}

		document.getElementById("divVideo").appendChild(divSaveVideoButton);

		let divTranslator = document.createElement('div');
		divTranslator.id = "divTranslator";
		divTranslator.style.height = "120px";

		if (getComputedStyle(elementt).display.toString() !== "inline") {
			divTranslator.style.backgroundColor = "#23252c";
			divTranslator.style.border = "1px solid #17191f";
		}

		document.getElementById("divMenuScroll").appendChild(divTranslator);

		let divTranslatorHeader = document.createElement('div');
		divTranslatorHeader.id = "divTranslatorHeader";
		divTranslatorHeader.innerHTML = "Çevirmen Sırası";

		if (getComputedStyle(elementt).display.toString() != "inline") {
			divTranslatorHeader.style.backgroundColor = "#17191f";
			divTranslatorHeader.style.backgroundImage = "-webkit-linear-gradient(#17191f,#17191f)";
			divTranslatorHeader.style.color = "#fff";
			divTranslatorHeader.style.borderBottom = "0px";
		}

		document.getElementById("divTranslator").appendChild(divTranslatorHeader);

		let divAddTranslatorButton = document.createElement('Button');
		divAddTranslatorButton.id = "divAddTranslatorButton";
		divAddTranslatorButton.innerHTML = "+";

		if (getComputedStyle(elementt).display.toString() !== "inline") {
			divAddTranslatorButton.style.background = "#1e2026";
			divAddTranslatorButton.style.border = "1px solid #17191f";
			divAddTranslatorButton.style.color = "#c5c8ce";

			let addMainColor = divAddTranslatorButton.style.color;

			divAddTranslatorButton.addEventListener("mouseenter", (event) => {
				divAddTranslatorButton.style.color = "white";
			});

			divAddTranslatorButton.addEventListener("mouseleave", (event) => {
				divAddTranslatorButton.style.color = addMainColor;
			});
		} else {
			let addMainColor = "#2c2c2c";

			divAddTranslatorButton.addEventListener("mouseenter", (event) => {
				divAddTranslatorButton.style.color = "black";
			});

			divAddTranslatorButton.addEventListener("mouseleave", (event) => {
				divAddTranslatorButton.style.color = addMainColor;
			});
		}

		let divTranslatorOldHeight = 120;
		let divTranslatorNum = 1;

		let divTranslatorInput = document.createElement('input'); // input video player
		divTranslatorInput.type = "text";
		divTranslatorInput.id = "divTranslatorInput" + divTranslatorNum;
		divTranslatorInput.name = "divTranslatorInput";
		divTranslatorInput.placeholder = divTranslatorNum.toString() + ". Çevirmen";

		divTranslatorInput.style.marginLeft = "auto";
		divTranslatorInput.style.marginRight = "auto";
		divTranslatorInput.style.marginTop = "15px";

		divAddTranslatorButton.onclick = function () {
			divTranslatorNum = divTranslatorNum + 1;
			divTranslatorOldHeight = divTranslatorOldHeight + 40;
			divTranslatorInput = document.createElement('input'); // input translator
			divTranslator.style.height = divTranslatorOldHeight.toString() + "px";

			divTranslatorInput.style.marginLeft = "auto";
			divTranslatorInput.style.marginRight = "auto";
			divTranslatorInput.style.marginTop = "15px";
			divTranslatorInput.type = "text";
			divTranslatorInput.id = "divTranslatorInput" + divTranslatorNum.toString();
			divTranslatorInput.name = "divTranslatorInput";
			divTranslatorInput.placeholder = divTranslatorNum.toString() + ". Çevirmen";

			document.getElementById("divTranslator").appendChild(divTranslatorInput);
		}


		document.getElementById("divTranslator").appendChild(divAddTranslatorButton);

		let divSaveTranslatorButton = document.createElement('Button');
		divSaveTranslatorButton.id = "divSaveTranslatorButton";
		divSaveTranslatorButton.innerHTML = "Kaydet";

		if (getComputedStyle(elementt).display.toString() !== "inline") {
			divSaveTranslatorButton.style.background = "#1e2026";
			divSaveTranslatorButton.style.border = "1px solid #17191f";
			divSaveTranslatorButton.style.color = "#c5c8ce";

			let saveMainColor = divSaveTranslatorButton.style.color;

			divSaveTranslatorButton.addEventListener("mouseenter", (event) => {
				divSaveTranslatorButton.style.color = "white";
			});

			divSaveTranslatorButton.addEventListener("mouseleave", (event) => {
				divSaveTranslatorButton.style.color = saveMainColor;
			});

			divSaveTranslatorButton.addEventListener("click", (event) => {
				divSaveTranslatorButton.style.color = "#FF0000";
			});
		} else {
			let saveMainColor = "#2c2c2c";

			divSaveTranslatorButton.addEventListener("mouseenter", (event) => {
				divSaveTranslatorButton.style.color = "black";
			});

			divSaveTranslatorButton.addEventListener("mouseleave", (event) => {
				divSaveTranslatorButton.style.color = saveMainColor;
			});
		}

		divSaveTranslatorButton.onclick = function () {
			localStorage.setItem("Translators", "testElement");

			let translatorArray = [];
			let lk = 1;
			while (lk < 50) {
				let inputElement = document.getElementById("divTranslatorInput" + lk);
				if (!inputElement) {
					localStorage.setItem("Translators", JSON.stringify(translatorArray));
					break;
				}

				let value = inputElement.value.trim().toLowerCase();
				if (value) {
					translatorArray.push(value);
				}
				lk = lk + 1;
			}
			if (translatorArray == "") localStorage.setItem("Translators", "adonis");
		}

		document.getElementById("divTranslator").appendChild(divSaveTranslatorButton);

		if (localStorage.getItem("Videoplayers") == null) {
			divVideoInput.value = "sibnet";
			document.getElementById("divVideo").appendChild(divVideoInput);
		} else {
			divVideoOldHeight = divVideoOldHeight - 40;
			divNum = 0
			let il = 0;
			let vpList = localStorage.getItem("Videoplayers").split(",");

			while (il < vpList.length) {
				if (vpList[il] == undefined || vpList == null) {
					console("TraHelper: Bir Hata Oluştu Video Player Listesini Tekrar Kaydetmeyi Deneyin.");
					divVideoInput.value = "sibnet";
					document.getElementById("divVideo").appendChild(divVideoInput);
					break;
				} else if (vpList[il] == "") {
					//do nothing
				} else {
					divNum = divNum + 1;
					divVideoOldHeight = divVideoOldHeight + 40;
					divVideoInput = document.createElement('input'); // input video player
					divVideo.style.height = divVideoOldHeight.toString() + "px";

					divVideoInput.style.marginLeft = "auto";
					divVideoInput.style.marginRight = "auto";
					divVideoInput.style.marginTop = "15px";
					divVideoInput.type = "text";
					divVideoInput.id = "divVideoInput" + divNum.toString();
					divVideoInput.name = "divVideoInput";
					divVideoInput.placeholder = divNum.toString() + ". Video Player";

					divVideoInput.value = vpList[il];
					document.getElementById("divVideo").appendChild(divVideoInput);
				}

				il = il + 1;
			}
		}

		if (localStorage.getItem("Translators") == null) { //çevirmen sekmesi için ilk açılış
			divTranslatorInput.value = "adonis";
			localStorage.setItem("Translators", "adonis");
			document.getElementById("divTranslator").appendChild(divTranslatorInput);
		} else {
			divTranslatorOldHeight = divTranslatorOldHeight - 40;
			divTranslatorNum = 0;
			let li = 0;
			let tlList = JSON.parse(localStorage.getItem("Translators"));

			while (li < tlList.length) {
				if (tlList[li] == undefined || tlList == null) {
					console.log("Türk Anime Yardımcısı: Bir Hata Oluştu Çevirmen Listesini Tekrar Kaydetmeyi Deneyin.");
					divTranslatorInput.value = "adonis";
					document.getElementById("divTranslator").appendChild(divTranslatorInput);
					break;
				} else if (tlList[li] == "") {
					//do nothing
				} else {
					divTranslatorNum = divTranslatorNum + 1;
					divTranslatorOldHeight = divTranslatorOldHeight + 40;
					divTranslatorInput = document.createElement('input'); //input translator
					divTranslator.style.height = divTranslatorOldHeight.toString() + "px";

					divTranslatorInput.style.marginLeft = "auto";
					divTranslatorInput.style.marginRight = "auto";
					divTranslatorInput.style.marginTop = "15px";
					divTranslatorInput.type = "text";
					divTranslatorInput.id = "divTranslatorInput" + divTranslatorNum.toString();
					divTranslatorInput.name = "divTranslatorInput";
					divTranslatorInput.placeholder = divTranslatorNum.toString() + ". Çevirmen";

					divTranslatorInput.value = tlList[li];
					document.getElementById("divTranslator").appendChild(divTranslatorInput);
				}

				li = li + 1;
			}
		}

		let urlArrayDot = url.split(".");
		let urlArraySlash = urlArrayDot[2].split("/");

		function waitForElm(selector) {
			return new Promise(resolve => {
				if (document.querySelector(selector)) {
					return resolve(document.querySelector(selector));
				}

				const observer = new MutationObserver(mutations => {
					if (document.querySelector(selector)) {
						resolve(document.querySelector(selector));
						observer.disconnect();
					}
				});

				observer.observe(document.body, {
					childList: true,
					subtree: true
				});
			});
		}

		async function searchVPButtons(searchVariable) {
			const butonTablosu = await waitForElm('#videodetay > div > div:nth-child(4)');
			let butonlarElement = [].slice.call(butonTablosu.children);
			let butonlarArray = [];
			let canClick = 0;

			let i = 0;
			while (i < butonlarElement.length) {
				let içerik = (butonlarElement[i].innerHTML).split(" ");
				butonlarArray.push(içerik[içerik.length - 1]);

				if (içerik[içerik.length - 1].toLowerCase() == searchVariable.toLowerCase()) {
					butonlarElement[i].click();
					canClick = 1;
					break;
				}
				i = i + 1;
			}
			return canClick;
		}

		async function x() {
			let kl = 0;
			let vpList = localStorage.getItem("Videoplayers").split(",");

			while (kl < vpList.length) {
				if (await searchVPButtons(vpList[kl]) == 1) {
					var videoPlayer = vpList[kl];
					break;
				} else {
					kl = kl + 1;
				}
			}

			return videoPlayer.toString();
		}

		async function y() {
			let çeviriTablosu1 = document.querySelector('#videodetay > div > div.btn-group.pull-right > button');
			çeviriTablosu1.click();
		}

		async function searchTLButtons(searchVariable) {
			const butonTablosu = await waitForElm('#videodetay > div > div.pull-right');
			let butonlarElement = [].slice.call(butonTablosu.children);
			let butonlarArray = [];
			let canClick = 0;

			let i = 0;
			while (i < butonlarElement.length) {
				let içerik = (butonlarElement[i].innerHTML).split(" ");
				butonlarArray.push(içerik[içerik.length - 1]);

				if (içerik[içerik.length - 1].toLowerCase() == searchVariable.toLowerCase()) {
					butonlarElement[i].click();
					canClick = 1;
					break;
				}
				i = i + 1;
			}
			return canClick;
		}

		async function z() {
			let kl = 0;
			let tList = JSON.parse(localStorage.getItem("Translators"));
			let çeviriTablosu2 = document.querySelector('#videodetay > div > div.pull-right > button:nth-child(1)');

			while (kl < tList.length) {
				if (await searchTLButtons(tList[kl]) == 1) {
					break; //Tek çevirmen bulunuyor
				} else if (kl == parseInt(tList.length) - 1) {
					çeviriTablosu2.click();
					break;
				} else {
					kl = kl + 1;
				}
			}
		}

		if (urlArraySlash[1] == "video") { //izleme sayfasına girildiğinde.
			const butonCheck = document.querySelector('#videodetay > div > div:nth-child(4)');
			let çeviriTablosu1 = document.querySelector('#videodetay > div > div.btn-group.pull-right > button');
			let çeviriTablosu2 = document.querySelector('#videodetay > div > div.pull-right > button:nth-child(1)');

			if (butonCheck !== null) {
				x.call();
			} else if (çeviriTablosu1 !== null) {
				y.call();
				x.call();
			} else if (çeviriTablosu2 !== null) {
				z.call();
				x.call();
			}
		}

		document.addEventListener("keypress", async (event) => {
			if (event.code === "NumpadAdd") {
				const nextEpisode = await waitForElm('#arkaplan > div:nth-child(3) > div.col-xs-8 > div > div:nth-child(3) > div > div.panel-footer.clearfix > div:nth-child(3) > a:nth-child(2)');
				nextEpisode.click();
			} else if (event.code === "NumpadSubtract") {
				const prevEpisode = await waitForElm('#arkaplan > div:nth-child(3) > div.col-xs-8 > div > div:nth-child(3) > div > div.panel-footer.clearfix > div:nth-child(3) > a:nth-child(1)');
				prevEpisode.click();
			}
		});

	}
})();