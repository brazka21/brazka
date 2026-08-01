(() => {
  const tg = window.Telegram?.WebApp;

  const state = {
    service: "Игра PlayStation",
    icon: "△",
    region: "Турция"
  };

  const elements = {
    serviceGrid: document.querySelector("#serviceGrid"),
    regionSwitch: document.querySelector("#regionSwitch"),
    productInput: document.querySelector("#productInput"),
    nameInput: document.querySelector("#nameInput"),
    contactInput: document.querySelector("#contactInput"),
    commentInput: document.querySelector("#commentInput"),
    summaryIcon: document.querySelector("#summaryIcon"),
    summaryService: document.querySelector("#summaryService"),
    summaryProduct: document.querySelector("#summaryProduct"),
    summaryRegion: document.querySelector("#summaryRegion"),
    submitButton: document.querySelector("#submitButton"),
    resetButton: document.querySelector("#resetButton"),
    toast: document.querySelector("#toast"),
    successScreen: document.querySelector("#successScreen"),
    newRequestButton: document.querySelector("#newRequestButton")
  };

  let toastTimer;

  function initTelegram() {
    if (!tg) return;

    tg.ready();
    tg.expand();
    tg.setHeaderColor?.("#080b14");
    tg.setBackgroundColor?.("#05070d");

    const user = tg.initDataUnsafe?.user;
    if (user) {
      const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ");
      elements.nameInput.value = fullName;
      if (user.username) elements.contactInput.value = `@${user.username}`;
    }
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => {
      elements.toast.classList.remove("is-visible");
    }, 3200);
  }

  function updateSummary() {
    const product = elements.productInput.value.trim();
    elements.summaryIcon.textContent = state.icon;
    elements.summaryService.textContent = state.service;
    elements.summaryRegion.textContent = state.region;
    elements.summaryProduct.textContent = product || "Название пока не указано";
  }

  function selectService(button) {
    elements.serviceGrid.querySelectorAll(".service-card").forEach((item) => {
      item.classList.toggle("is-active", item === button);
    });

    state.service = button.dataset.service;
    state.icon = button.dataset.icon;
    updateSummary();
    tg?.HapticFeedback?.selectionChanged();
  }

  function selectRegion(button) {
    elements.regionSwitch.querySelectorAll("button").forEach((item) => {
      item.classList.toggle("is-active", item === button);
    });

    state.region = button.dataset.region;
    updateSummary();
    tg?.HapticFeedback?.selectionChanged();
  }

  function resetForm() {
    const firstService = elements.serviceGrid.querySelector(".service-card");
    const firstRegion = elements.regionSwitch.querySelector("button");

    selectService(firstService);
    selectRegion(firstRegion);
    elements.productInput.value = "";
    elements.commentInput.value = "";
    updateSummary();
    showToast("Форма очищена");
  }

  function validate() {
    const product = elements.productInput.value.trim();
    const name = elements.nameInput.value.trim();
    const contact = elements.contactInput.value.trim();

    if (!product) {
      elements.productInput.focus();
      showToast("Укажите игру или услугу");
      return false;
    }

    if (!name) {
      elements.nameInput.focus();
      showToast("Укажите ваше имя");
      return false;
    }

    if (!contact) {
      elements.contactInput.focus();
      showToast("Оставьте Telegram или телефон");
      return false;
    }

    return true;
  }

  function buildPayload() {
    return {
      type: "brazka_order",
      service: state.service,
      region: state.region,
      product: elements.productInput.value.trim(),
      name: elements.nameInput.value.trim(),
      contact: elements.contactInput.value.trim(),
      comment: elements.commentInput.value.trim(),
      telegram_user_id: tg?.initDataUnsafe?.user?.id || null,
      created_at: new Date().toISOString()
    };
  }

  function restoreSubmitButton() {
    elements.submitButton.disabled = false;
    elements.submitButton.querySelector("span").textContent = "Отправить заявку";
  }

  function submitRequest() {
    if (!validate()) {
      tg?.HapticFeedback?.notificationOccurred("error");
      return;
    }

    if (!tg || tg.platform === "unknown") {
      showToast("Откройте магазин через кнопку в Telegram-боте");
      return;
    }

    // Для Keyboard Button Mini App Telegram передаёт пустой initData.
    // Именно в этом режиме доступен WebApp.sendData().
    if (tg.initData) {
      showToast("Для отправки откройте магазин через большую кнопку после /start");
      tg.HapticFeedback?.notificationOccurred("error");
      return;
    }

    const payload = buildPayload();

    try {
      elements.submitButton.disabled = true;
      elements.submitButton.querySelector("span").textContent = "Отправляем…";
      tg.HapticFeedback?.notificationOccurred("success");
      tg.sendData(JSON.stringify(payload));

      // При успешной отправке Telegram сам закрывает Mini App.
      // Если окно осталось открытым, значит данные не ушли.
      window.setTimeout(() => {
        if (document.visibilityState === "visible") {
          restoreSubmitButton();
          showToast("Telegram не подтвердил отправку. Откройте через кнопку после /start");
          tg.HapticFeedback?.notificationOccurred("error");
        }
      }, 1800);
    } catch (error) {
      console.error(error);
      restoreSubmitButton();
      showToast("Не удалось отправить. Попробуйте открыть магазин заново.");
      tg.HapticFeedback?.notificationOccurred("error");
    }
  }

  elements.serviceGrid.addEventListener("click", (event) => {
    const button = event.target.closest(".service-card");
    if (button) selectService(button);
  });

  elements.regionSwitch.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-region]");
    if (button) selectRegion(button);
  });

  elements.productInput.addEventListener("input", updateSummary);
  elements.submitButton.addEventListener("click", submitRequest);
  elements.resetButton.addEventListener("click", resetForm);
  elements.newRequestButton.addEventListener("click", () => {
    elements.successScreen.hidden = true;
    resetForm();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  initTelegram();
  updateSummary();
})();
