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
    commentInput: document.querySelector("#commentInput"),
    summaryIcon: document.querySelector("#summaryIcon"),
    summaryService: document.querySelector("#summaryService"),
    summaryProduct: document.querySelector("#summaryProduct"),
    summaryRegion: document.querySelector("#summaryRegion"),
    submitButton: document.querySelector("#submitButton"),
    resetButton: document.querySelector("#resetButton"),
    toast: document.querySelector("#toast")
  };

  let toastTimer;

  function initTelegram() {
    if (!tg) return;

    tg.ready();
    tg.expand();
    tg.setHeaderColor?.("#080b14");
    tg.setBackgroundColor?.("#05070d");
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => {
      elements.toast.classList.remove("is-visible");
    }, 2600);
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
    if (!elements.productInput.value.trim()) {
      elements.productInput.focus();
      showToast("Укажите игру или услугу");
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
      comment: elements.commentInput.value.trim(),
      created_at: new Date().toISOString()
    };
  }

  function submitRequest() {
    if (!validate()) {
      tg?.HapticFeedback?.notificationOccurred("error");
      return;
    }

    if (!tg || typeof tg.sendData !== "function") {
      showToast("Откройте магазин через большую кнопку в чате бота");
      return;
    }

    try {
      tg.sendData(JSON.stringify(buildPayload()));
      tg.HapticFeedback?.notificationOccurred("success");
    } catch (error) {
      console.error(error);
      showToast("Не удалось отправить заявку. Откройте магазин заново.");
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

  initTelegram();
  updateSummary();
})();
