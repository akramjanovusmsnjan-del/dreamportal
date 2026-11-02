"use strict";

document.addEventListener("DOMContentLoaded", () => {

  const STORAGE_KEY = "dreamPortalEntries";
  const IDEA_KEY = "dreamPortalCreativeIdea";

  const $ = id => document.getElementById(id);

  const dreams = loadDreams();

  function loadDreams() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function saveDreams() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dreams));
      return true;
    } catch {
      showToast("Ma'lumotni saqlashda xatolik!");
      return false;
    }
  }

  function showToast(message) {
    const toast = $("toast");
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
      toast.classList.remove("show");
    }, 2500);
  }

  function getToday() {
    const now = new Date();
    return [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0")
    ].join("-");
  }

  function formatDate(date) {
    if (!date) return "";
    const parts = date.split("-");
    if (parts.length !== 3) return date;
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }

  function initializeDate() {
    const today = getToday();
    if ($("todayDate")) $("todayDate").textContent = formatDate(today);
    if ($("dreamDate")) {
      $("dreamDate").value = today;
      $("dreamDate").max = today;
    }
    if ($("year")) $("year").textContent = new Date().getFullYear();
  }

  function updateStats() {
    if ($("totalDreams")) $("totalDreams").textContent = dreams.length;

    const now = new Date();
    const monthly = dreams.filter(dream => {
      const date = new Date(dream.date + "T12:00:00");
      return date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();
    });

    if ($("monthDreams")) $("monthDreams").textContent = monthly.length;

    const moods = {};
    dreams.forEach(dream => {
      moods[dream.mood] = (moods[dream.mood] || 0) + 1;
    });

    const sorted = Object.entries(moods).sort((a, b) => b[1] - a[1]);
    if ($("favoriteMood")) $("favoriteMood").textContent = sorted.length ? sorted[0][0] : "—";
    if ($("dreamCount")) $("dreamCount").textContent = dreams.length + " ta";
  }

  if ($("dreamForm")) {
    $("dreamForm").addEventListener("submit", event => {
      event.preventDefault();

      const title = $("dreamTitle").value.trim();
      const date = $("dreamDate").value;
      const mood = $("dreamMood").value;
      const description = $("dreamText").value.trim();

      if (!title || !date || !mood || !description) {
        showToast("Barcha maydonlarni to'ldiring!");
        return;
      }

      if (date > getToday()) {
        showToast("Kelajak sanasini tanlash mumkin emas.");
        return;
      }

      const dream = {
        id: Date.now().toString(),
        title,
        date,
        mood,
        description
      };

      dreams.unshift(dream);

      if (!saveDreams()) {
        dreams.shift();
        return;
      }

      renderDreams();
      updateStats();

      $("dreamForm").reset();
      $("dreamDate").value = getToday();
      if ($("charCount")) $("charCount").textContent = "0 / 5000";

      showToast("Tushing muvaffaqiyatli saqlandi! ✨");
    });
  }

  function renderDreams(searchText = "") {
    const container = $("dreamList");
    if (!container) return;

    const query = searchText.toLowerCase().trim();

    const filtered = dreams.filter(dream => {
      return (
        dream.title.toLowerCase().includes(query) ||
        dream.description.toLowerCase().includes(query) ||
        dream.mood.toLowerCase().includes(query)
      );
    });

    if ($("dreamCount")) $("dreamCount").textContent = filtered.length + " ta";
    container.replaceChildren();

    if (filtered.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty";

      const icon = document.createElement("div");
      icon.textContent = "☾";

      const heading = document.createElement("h3");
      heading.textContent = query ? "Natija topilmadi" : "Hali tushlar yo'q";

      const paragraph = document.createElement("p");
      paragraph.textContent = query
        ? "Boshqa so'z bilan qidirib ko'r."
        : "Birinchi tushingni yozib, kundalikni boshlagin.";

      empty.append(icon, heading, paragraph);
      container.append(empty);
      return;
    }

    filtered.forEach(dream => {
      const card = document.createElement("div");
      card.className = "dream-card";

      const top = document.createElement("div");
      top.className = "dream-top";

      const info = document.createElement("div");

      const heading = document.createElement("h4");
      heading.textContent = dream.title;

      const date = document.createElement("div");
      date.className = "dream-meta";
      date.textContent = formatDate(dream.date);

      info.append(heading, date);

      const mood = document.createElement("span");
      mood.className = "mood";
      mood.textContent = dream.mood;

      top.append(info, mood);

      const description = document.createElement("p");
      description.className = "dream-description";
      description.textContent = dream.description;

      const actions = document.createElement("div");
      actions.className = "dream-actions";

      const copyButton = document.createElement("button");
      copyButton.type = "button";
      copyButton.className = "small-button";
      copyButton.textContent = "Nusxa olish";
      copyButton.addEventListener("click", () => copyDream(dream));

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "small-button delete-button";
      deleteButton.textContent = "O'chirish";
      deleteButton.addEventListener("click", () => deleteDream(dream.id));

      actions.append(copyButton, deleteButton);
      card.append(top, description, actions);
      container.append(card);
    });
  }

  if ($("searchDreams")) {
    $("searchDreams").addEventListener("input", event => {
      renderDreams(event.target.value);
    });
  }

  function deleteDream(id) {
    const index = dreams.findIndex(dream => dream.id === id);

    if (index === -1) return;
    if (!confirm("Bu tushni o'chirmoqchimisiz?")) return;

    const removed = dreams.splice(index, 1)[0];

    if (!saveDreams()) {
      dreams.splice(index, 0, removed);
      return;
    }

    renderDreams($("searchDreams") ? $("searchDreams").value : "");
    updateStats();
    showToast("Tush o'chirildi.");
  }

  async function copyDream(dream) {
    const text =
      "Tush: " + dream.title + "\n" +
      "Sana: " + formatDate(dream.date) + "\n" +
      "Kayfiyat: " + dream.mood + "\n\n" +
      dream.description;

    try {
      await navigator.clipboard.writeText(text);
      showToast("Tush nusxalandi!");
    } catch {
      showToast("Nusxa olish uchun brauzer ruxsatini tekshiring.");
    }
  }

  if ($("dreamText") && $("charCount")) {
    $("dreamText").addEventListener("input", event => {
      $("charCount").textContent = event.target.value.length + " / 5000";
    });
  }

  const questionSets = [
    [
      "Tushingdagi eng esda qolarli voqea qaysi?",
      "Qaysi rang yoki manzara diqqatingni tortdi?",
      "Agar bu tush hikoya bo'lsa, unga qanday nom qo'yarding?",
      "Ushbu tushdan qanday ijodiy g'oya olish mumkin?"
    ],
    [
      "Tushingdagi eng qiziqarli obraz kim yoki nima edi?",
      "Ushbu tushni rasmga aylantirsang, nimalarni chizarding?",
      "Tushingga qanday musiqa mos kelardi?",
      "Hikoyaning davomini qanday tasavvur qilasan?"
    ]
  ];

  let previousSet = -1;

  if ($("newQuestions")) {
    $("newQuestions").addEventListener("click", () => {
      let randomIndex;

      do {
        randomIndex = Math.floor(Math.random() * questionSets.length);
      } while (randomIndex === previousSet);

      previousSet = randomIndex;

      const list = $("questionList");
      if (!list) return;

      list.replaceChildren();

      questionSets[randomIndex].forEach((question, index) => {
        const item = document.createElement("div");
        item.className = "question";

        const number = document.createElement("b");
        number.textContent = String(index + 1).padStart(2, "0");

        const text = document.createElement("span");
        text.textContent = question;

        item.append(number, text);
        list.append(item);
      });

      showToast("Yangi savollar tayyor! ✨");
    });
  }

  function loadIdea() {
    try {
      const saved = localStorage.getItem(IDEA_KEY) || "";
      if ($("creativeIdea")) $("creativeIdea").value = saved;
      if ($("ideaStatus")) {
        $("ideaStatus").textContent = saved
          ? "Oxirgi g'oya saqlangan ✓"
          : "G'oya hali saqlanmagan";
      }
    } catch {
      if ($("ideaStatus")) $("ideaStatus").textContent = "Xotirani o'qib bo'lmadi";
    }
  }

  if ($("saveIdea")) {
    $("saveIdea").addEventListener("click", () => {
      const idea = $("creativeIdea") ? $("creativeIdea").value.trim() : "";

      if (!idea) {
        showToast("Avval ijodiy g'oyangni yoz!");
        return;
      }

      try {
        localStorage.setItem(IDEA_KEY, idea);
        if ($("ideaStatus")) $("ideaStatus").textContent = "Muvaffaqiyatli saqlandi ✓";
        showToast("Ijodiy g'oyang saqlandi! ✦");
      } catch {
        showToast("G'oyani saqlashda xatolik yuz berdi.");
      }
    });
  }

  if ($("creativeIdea")) {
    $("creativeIdea").addEventListener("input", () => {
      if ($("ideaStatus")) $("ideaStatus").textContent = "Saqlanmagan o'zgarishlar";
    });
  }

  initializeDate();
  renderDreams();
  updateStats();
  loadIdea();
});