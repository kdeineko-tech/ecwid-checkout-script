(function () {
  const STATE_FIELD_LABEL = "Choose State";
  const CITY_FIELD_LABEL = "Choose City";

  const CITY_MAP = {
    "California": ["Los Angeles", "San Diego", "San Jose", "Sacramento"],
    "Texas": ["Houston", "Dallas", "Austin", "San Antonio"],
    "Florida": ["Miami", "Orlando", "Tampa", "Jacksonville"],
    "New York": ["New York", "Buffalo", "Albany", "Rochester"]
  };

  function normalize(value) {
    return (value || "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function isCheckoutPage() {
    return !!document.querySelector(".ec-cart") || !!document.querySelector(".ec-checkout");
  }

  function findSelectByLabelText(labelText) {
    const wanted = normalize(labelText);
    const nodes = Array.from(document.querySelectorAll("label, div, span"));

    for (const node of nodes) {
      if (normalize(node.textContent) !== wanted) continue;

      let current = node;
      for (let i = 0; i < 5 && current; i += 1) {
        const selects = current.querySelectorAll("select");
        if (selects.length === 1) return selects[0];

        if (selects.length > 1) {
          for (const select of selects) {
            const relation = node.compareDocumentPosition(select);
            if (relation & Node.DOCUMENT_POSITION_FOLLOWING) {
              return select;
            }
          }
          return selects[0];
        }

        current = current.parentElement;
      }
    }

    return null;
  }

  function saveOriginalCityOptions(citySelect) {
    if (citySelect.dataset.originalOptionsSaved === "1") return;

    // ✅ Зберігаємо text як еталон, value використовуємо як fallback
    const options = Array.from(citySelect.options).map((option) => ({
      value: option.value,
      text: option.textContent.trim(),
      disabled: option.disabled
    }));

    citySelect.dataset.originalOptions = JSON.stringify(options);
    citySelect.dataset.originalOptionsSaved = "1";
  }

  function getOriginalCityOptions(citySelect) {
    try {
      return JSON.parse(citySelect.dataset.originalOptions || "[]");
    } catch (e) {
      return [];
    }
  }

  function rebuildCityOptions(citySelect, options) {
    citySelect.innerHTML = "";

    options.forEach(item => {
      const option = document.createElement("option");
      // ✅ Головний фікс: value = text щоб вони завжди збігались
      option.value = item.text || item.value;
      option.textContent = item.text;
      option.disabled = !!item.disabled;
      citySelect.appendChild(option);
    });

    const firstValid = Array.from(citySelect.options).find(opt => opt.value && !opt.disabled);
    citySelect.value = firstValid ? firstValid.value : "";

    citySelect.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function filterCityOptions(stateSelect, citySelect) {
    const selectedStateValue = stateSelect.value;
    const selectedStateText =
      stateSelect.options[stateSelect.selectedIndex]?.textContent || "";

    const stateKey = CITY_MAP[selectedStateValue]
      ? selectedStateValue
      : selectedStateText;

    const originalOptions = getOriginalCityOptions(citySelect);

    if (!originalOptions.length) return;

    console.log(`Filtering cities for state: ${stateKey}`);

    if (!stateKey || !CITY_MAP[stateKey]) {
      rebuildCityOptions(citySelect, originalOptions);
      return;
    }

    const allowedCities = CITY_MAP[stateKey].map(normalize);

    const placeholderOptions = originalOptions.filter((item) => {
      const text = normalize(item.text);
      return (
        !item.value ||
        text.includes("please choose") ||
        text.includes("select") ||
        text.includes("choose")
      );
    });

    // ✅ Фільтруємо виключно по text
    const filteredCityOptions = originalOptions.filter((item) => {
      return allowedCities.includes(normalize(item.text));
    });

    rebuildCityOptions(citySelect, [...placeholderOptions, ...filteredCityOptions]);
  }

  function initCityFilter() {
    if (!isCheckoutPage()) return;

    const stateSelect = findSelectByLabelText(STATE_FIELD_LABEL);
    const citySelect = findSelectByLabelText(CITY_FIELD_LABEL);

    if (!stateSelect || !citySelect) {
      console.log("State or City field not found!");
      return;
    }

    console.log("State and City fields found.");

    if (citySelect.dataset.cityFilterInitialized === "1") return;
    citySelect.dataset.cityFilterInitialized = "1";

    saveOriginalCityOptions(citySelect);

    stateSelect.addEventListener("change", function () {
      filterCityOptions(stateSelect, citySelect);
    });

    filterCityOptions(stateSelect, citySelect);

    console.log("City filter initialized");
  }

  const observer = new MutationObserver(function () {
    initCityFilter();
  });

  function start() {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    initCityFilter();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
