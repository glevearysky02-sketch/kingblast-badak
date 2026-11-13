const pages = document.querySelectorAll(".page");
const navItems = document.querySelectorAll(".nav-item");

// NAVIGASI
function showPage(pageId) {
  pages.forEach(page => {
    page.classList.toggle("active", page.id === pageId);
  });

  navItems.forEach(item => {
    item.classList.toggle(
      "active",
      item.dataset.page === pageId
    );
  });

  if (pageId === "history") renderHistory();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// DISCLAIMER
function acceptDisclaimer() {
  document.getElementById("disclaimer").classList.add("hidden");
  localStorage.setItem("badakprem_disclaimer", "accepted");
}

if (localStorage.getItem("badakprem_disclaimer") === "accepted") {
  document.getElementById("disclaimer").classList.add("hidden");
}

// RATING
function rateSite(value) {
  localStorage.setItem("badakprem_rating", value);
  updateRating();

  alert("Terima kasih! Rating kamu: " + value + " bintang.");
}

function updateRating() {
  const savedRating = Number(
    localStorage.getItem("badakprem_rating") || 0
  );

  const stars = document.querySelectorAll("#stars button");

  stars.forEach((star, index) => {
    star.classList.toggle("selected", index < savedRating);
  });

  const result = document.getElementById("ratingResult");

  if (savedRating > 0) {
    result.textContent =
      "Rating kamu: " + savedRating + " dari 5 bintang.";
  }
}

updateRating();

// RIWAYAT
function addHistory(activity) {
  let history = JSON.parse(
    localStorage.getItem("badakprem_history") || "[]"
  );

  history.unshift({
    activity,
    date: new Date().toLocaleString("id-ID")
  });

  history = history.slice(0, 30);

  localStorage.setItem(
    "badakprem_history",
    JSON.stringify(history)
  );
}

function renderHistory() {
  const list = document.getElementById("historyList");

  const history = JSON.parse(
    localStorage.getItem("badakprem_history") || "[]"
  );

  if (history.length === 0) {
    list.innerHTML =
      '<p class="empty">Belum ada aktivitas.</p>';
    return;
  }

  list.innerHTML = history.map(item => `
    <div class="history-item">
      ${escapeHTML(item.activity)}
      <small>${escapeHTML(item.date)}</small>
    </div>
  `).join("");
}

function clearHistory() {
  if (confirm("Yakin ingin menghapus semua riwayat?")) {
    localStorage.removeItem("badakprem_history");
    renderHistory();
  }
}

// BADAKWA + LOADING ANIMATION
let waIsProcessing = false;

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function showLoading(message) {
  const overlay = document.getElementById("loadingOverlay");
  const box = overlay.querySelector(".loading-box");
  const title = document.getElementById("loadingTitle");
  const messageEl = document.getElementById("loadingMessage");
  const progress = document.getElementById("loadingProgress");
  const percent = document.getElementById("loadingPercent");

  box.classList.remove("done");
  title.textContent = "Sedang memproses";
  messageEl.textContent = message || "Mohon tunggu sebentar...";
  progress.style.width = "0%";
  percent.textContent = "0%";
  overlay.classList.add("show");
  overlay.setAttribute("aria-hidden", "false");

  // Animate progress in timed steps so it is visible even on fast devices.
  const steps = [18, 39, 63, 82, 100];
  for (const value of steps) {
    await wait(230);
    progress.style.width = value + "%";
    percent.textContent = value + "%";
  }
}

async function hideLoading(success = true, message = "Menu berhasil dijalankan.") {
  const overlay = document.getElementById("loadingOverlay");
  const box = overlay.querySelector(".loading-box");
  const title = document.getElementById("loadingTitle");
  const messageEl = document.getElementById("loadingMessage");

  if (success) {
    box.classList.add("done");
    title.textContent = "Berhasil!";
    messageEl.textContent = message;
    await wait(650);
  } else {
    title.textContent = "Tidak berhasil";
    messageEl.textContent = message;
    await wait(900);
  }

  overlay.classList.remove("show");
  overlay.setAttribute("aria-hidden", "true");
  await wait(240);
  box.classList.remove("done");
}

async function processWA() {
  if (waIsProcessing) return;

  const phoneInput = document.getElementById("phone");
  const menuInput = document.getElementById("waMenu");
  const runButton = document.querySelector(".form-card .primary-btn");
  const phone = phoneInput.value.trim();
  const menu = menuInput.value;
  const number = phone.replace(/\D/g, "");

  if (!number || number.length < 8 || number.length > 15) {
    alert("Masukkan nomor WhatsApp yang valid.");
    phoneInput.focus();
    return;
  }

  waIsProcessing = true;
  if (runButton) {
    runButton.disabled = true;
    runButton.classList.add("is-loading");
  }

  // Open a blank tab while still inside the tap event; this avoids popup blockers
  // when the selected action is opened after the loading animation.
  let reservedTab = null;
  if (menu === "chat" || menu === "web") {
    reservedTab = window.open("about:blank", "_blank");
  }

  const waLink = "https://wa.me/" + number;
  let success = true;
  let resultMessage = "Menu berhasil dijalankan.";

  try {
    const messages = {
      chat: "Menyiapkan chat WhatsApp...",
      call: "Menyiapkan panggilan telepon...",
      copy: "Menyalin nomor WhatsApp...",
      share: "Menyiapkan fitur berbagi...",
      web: "Membuka WhatsApp Web..."
    };

    await showLoading(messages[menu] || "Memproses pilihanmu...");

    switch (menu) {
      case "chat":
        addHistory("Membuka chat WhatsApp: " + number);
        if (reservedTab) {
          reservedTab.location.href = waLink;
        } else {
          window.location.href = waLink;
        }
        resultMessage = "Chat WhatsApp sedang dibuka.";
        break;

      case "call":
        addHistory("Membuka panggilan telepon: " + number);
        resultMessage = "Membuka aplikasi telepon.";
        await hideLoading(true, resultMessage);
        window.location.href = "tel:+" + number;
        return;

      case "copy":
        try {
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(number);
          } else {
            const temporaryInput = document.createElement("textarea");
            temporaryInput.value = number;
            temporaryInput.style.position = "fixed";
            temporaryInput.style.opacity = "0";
            document.body.appendChild(temporaryInput);
            temporaryInput.select();
            const copied = document.execCommand("copy");
            temporaryInput.remove();
            if (!copied) throw new Error("Copy command failed");
          }
          addHistory("Menyalin nomor: " + number);
          resultMessage = "Nomor berhasil disalin ke clipboard.";
        } catch (error) {
          success = false;
          resultMessage = "Gagal menyalin nomor. Coba izinkan akses clipboard.";
        }
        break;

      case "share":
        if (navigator.share) {
          try {
            await navigator.share({
              title: "Nomor WhatsApp",
              text: "Nomor WhatsApp: +" + number
            });
            addHistory("Membagikan nomor: " + number);
            resultMessage = "Nomor berhasil dibagikan.";
          } catch (error) {
            if (error.name === "AbortError") {
              resultMessage = "Berbagi dibatalkan.";
            } else {
              success = false;
              resultMessage = "Gagal membagikan nomor.";
            }
          }
        } else {
          success = false;
          resultMessage = "Browser tidak mendukung fitur berbagi.";
        }
        break;

      case "web":
        addHistory("Membuka WhatsApp Web: " + number);
        if (reservedTab) {
          reservedTab.location.href =
            "https://web.whatsapp.com/send?phone=" + number;
        } else {
          window.location.href =
            "https://web.whatsapp.com/send?phone=" + number;
        }
        resultMessage = "WhatsApp Web sedang dibuka.";
        break;
    }

    await hideLoading(success, resultMessage);
    if (!success && reservedTab) reservedTab.close();
  } catch (error) {
    if (reservedTab) reservedTab.close();
    await hideLoading(false, "Terjadi kesalahan. Silakan coba lagi.");
  } finally {
    waIsProcessing = false;
    if (runButton) {
      runButton.disabled = false;
      runButton.classList.remove("is-loading");
    }
  }
}


// PENGAMAN TEKS RIWAYAT
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}