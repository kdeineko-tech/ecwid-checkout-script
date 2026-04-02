(function () {
  // =========================
  // 1) ДАНІ: ШТАТ -> МІСТА
  // Замініть на ваш повний список
  // =========================
  const STATE_CITY_MAP = {
    "California": ["Los Angeles", "San Diego", "San Jose"],
    "Texas": ["Austin", "Dallas", "Houston"],
    "Florida": ["Miami", "Orlando", "Tampa"]
  };

  // =========================
  // 2) НАЛАШТУВАННЯ ПОЛІВ
  // =========================
  const FIELD_KEYS = {
    state: "custom_shipping_state",
    city: "custom_shipping_city"
  };

  const FIELD_LABELS = {
    state: "State",
    city: "City"
  };

  const PLACEHOLDERS = {
    state: "Select state",
    city: "Select city"
  };

  let extraFieldsInitialized = false;

  function normalizeText(text) {
    return (text || "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function makeOptions(values) {
    return values.map(function (value) {
      return { title: value };
    });
  }

  function getSortedStates() {
    return Object.keys(STATE_CITY_MAP).sort(function (a, b) {
      return a.localeCompare(b);
    });
  }

  // =========================
  // 3) СТВОРЮЄМО 2 NATIVE ECWID EXTRA FIELDS
  //    Вони будуть збережені в замовленні
  // =========================
  function ensureExtraFields() {
    if (extraFieldsInitialized) return;

    window.ec = window.ec || {};
    ec.order = ec.order || {};
    ec.order.extraFields = ec.order.extraFields || {};

    ec.order.extraFields[FIELD_KEYS.state] = {
      title: FIELD_LABELS.state,
      type: "select",
      required: true,
      checkoutDisplaySection: "shipping_address",
      orderDetailsDisplaySection: "shipping_info",
      showInNotifications: true,
      showInInvoice: true,
      options: makeOptions([PLACEHOLDERS.state].concat(getSortedStates()))
    };

    ec.order.extraFields[FIELD_KEYS.city] = {
      title: FIELD_LABELS.city,
      type: "select",
      required: true,
      checkoutDisplaySection: "shipping_address",
      orderDetailsDisplaySection: "shipping_info",
      showInNotifications: true,
      showInInvoice: true,
      options: makeOptions([PLACEHOLDERS.city])
    };

    extraFieldsInitialized = true;

    if (window.Ecwid && typeof Ecwid.refreshConfig === "function") {
      Ecwid.refreshConfig();
    }
  }

  // =========================
  // 4) ПОШУК SELECT ПО ЇХ LABEL
  //    Ecwid може трохи міняти DOM, тому тут кілька fallback-варіантів
  // =========================
  function findSelectByLabel(labelText) {
    const wanted = normalizeText(labelText);

    // Варіант 1: класичний label[for]
    const labels = Array.from(document.querySelectorAll("label"));
    for (const label of labels) {
      if (!normalizeText(label.textContent).includes(wanted)) continue;

      const forId = label.getAttribute("for");
      if (forId) {
        const target = document.getElementById(forId);
        if (target && target.tagName === "SELECT") return target;
      }

      const nestedSelect = label.querySelector("select");
      if (nestedSelect) return nestedSelect;

      const parent = label.closest("div");
      if (parent) {
        const nearby = parent.querySelector("select") ||
          (parent.parentElement ? parent.parentElement.querySelector("select") : null);
        if (nearby) return nearby;
      }
    }

    // Варіант 2: пошук по будь-якому елементу з текстом label
    const candidates = Array.from(
      document.querySelectorAll("div, span, p, label")
    );

    for (const el of candidates) {
      if (!normalizeText(el.textContent).includes(wanted)) continue;

      const block = el.closest("div");
      if (!block) continue;

      const select = block.querySelector("select") ||
        (block.parentElement ? block.parentElement.querySelector("select") : null);

      if (select) return select;
    }

    return null;
  }

  // =========================
  // 5) ОНОВЛЕННЯ СПИСКУ МІСТ У НАТИВНОМУ SELECT Ecwid
  //    Поле залишається Ecwid-полем, тому значення піде в order extraFields
  // =========================
  function rebuildCitySelect(citySelect, cities, selectedValue) {
    if (!citySelect) return;

    citySelect.innerHTML = "";

    const placeholderOption = new Option(
      PLACEHOLDERS.city,
      PLACEHOLDERS.city,
      false,
      false
    );
    citySelect.add(placeholderOption);

    cities.forEach(function (city) {
      citySelect.add(new Option(city, city, false, false));
    });

    if (selectedValue && cities.includes(selectedValue)) {
      citySelect.value = selectedValue;
    } else {
      citySelect.value = PLACEHOLDERS.city;
    }

    citySelect.dispatchEvent(new Event("input", { bubbles: true }));
    citySelect.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function bindCascadeLogic() {
    const stateSelect = findSelectByLabel(FIELD_LABELS.state);
    const citySelect = findSelectByLabel(FIELD_LABELS.city);

    if (!stateSelect || !citySelect) return false;

    if (stateSelect.dataset.cascadeBound === "1") {
      // якщо вже підв'язано, просто оновимо міста при повторному рендері
      const currentState = stateSelect.value;
      const currentCity = citySelect.value;
      const cities = STATE_CITY_MAP[currentState] || [];
      rebuildCitySelect(citySelect, cities, currentCity);
      citySelect.disabled = !cities.length || currentState === PLACEHOLDERS.state;
      return true;
    }

    stateSelect.dataset.cascadeBound = "1";

    // Початковий стан при reload/back
    (function initCurrentState() {
      const currentState = stateSelect.value;
      const currentCity = citySelect.value;
      const cities = STATE_CITY_MAP[currentState] || [];

      rebuildCitySelect(citySelect, cities, currentCity);
      citySelect.disabled = !cities.length || currentState === PLACEHOLDERS.state;
    })();

    stateSelect.addEventListener("change", function () {
      const selectedState = stateSelect.value;
      const cities = STATE_CITY_MAP[selectedState] || [];

      rebuildCitySelect(citySelect, cities, "");
      citySelect.disabled = !cities.length || selectedState === PLACEHOLDERS.state;
    });

    return true;
  }

  function observeCheckoutAndBind() {
    let observerStopped = false;

    const observer = new MutationObserver(function () {
      const ok = bindCascadeLogic();
      if (ok && !observerStopped) {
        observer.disconnect();
        observerStopped = true;
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // fallback
    setTimeout(function () {
      if (!observerStopped) {
        bindCascadeLogic();
        observer.disconnect();
        observerStopped = true;
      }
    }, 10000);
  }

  // =========================
  // 6) ІНІЦІАЛІЗАЦІЯ
  // =========================
  if (window.Ecwid && Ecwid.OnAPILoaded) {
    Ecwid.OnAPILoaded.add(function () {
      ensureExtraFields();

      if (Ecwid.OnPageLoaded) {
        Ecwid.OnPageLoaded.add(function (page) {
          const checkoutPages = [
            "CHECKOUT_ADDRESS",
            "CHECKOUT_ADDRESS_BOOK",
            "CHECKOUT_PAYMENT_DETAILS"
          ];

          if (checkoutPages.includes(page.type)) {
            observeCheckoutAndBind();
          }
        });
      }
    });
  }
})();
