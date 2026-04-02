(function () {
  const STATE_FIELD_LABEL = "Choose State";
  const CITY_FIELD_LABEL = "Choose City";

  const CITY_MAP = {
    "California": ["Los Angeles", "San Diego", "San Jose", "Sacramento"],
    "Texas": ["Houston", "Dallas", "Austin", "San Antonio"],
    "Florida": ["Miami", "Orlando", "Tampa", "Jacksonville"],
    "New York": ["New York", "Buffalo", "Albany", "Rochester"]
  };

  const CUSTOM_CITY_WRAPPER_ID = "custom-city-filter-wrapper";
  const CUSTOM_CITY_SELECT_ID = "custom-city-filter-select";

  function normalize(value) {
    return (value || "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function isCheckoutPage() {
    return !!document.querySelector(".ec-cart") || !!document.querySelector(".ec-checkout");
  }

  function findFieldContainerByLabelText(labelText) {
    const wanted = normalize(labelText);
    const candidates = Array.from(document.querySelectorAll("label, div, span"));

    for (const node of candidates) {
      if (normalize(node.textContent) !== wanted) continue;

      let current = node;
      for (let i = 0; i < 6 && current; i += 1) {
        const select = current.querySelector("select");
        if (select) {
          return current;
        }
        current = current.parentElement;
      }
    }

    return null;
  }

  function findSelectByLabelText(labelText) {
    const container = findFieldContainerByLabelText(labelText);
    return container ? container.querySelector("select") : null;
  }

  function getStateKey(stateSelect) {
    if (!stateSelect) return "";
    const value = stateSelect.value;
    const text = stateSelect.options[stateSelect.selectedIndex]?.textContent || "";
    if (CITY_MAP[value]) return value;
    if (CITY_MAP[text]) return text;
    return text || value || "";
  }

  function getCitiesForSelectedState(stateSelect) {
    const stateKey = getStateKey(stateSelect);
    return CITY_MAP[stateKey] || [];
  }

  function hideOriginalCityField(citySelect) {
    const container = citySelect.closest("div");
    if (container) {
      container.style.display = "none";
    } else {
      citySelect.style.display = "none";
    }
  }

  function createCustomCitySelect(citySelect) {
    if (document.getElementById(CUSTOM_CITY_WRAPPER_ID)) {
      return document.getElementById(CUSTOM_CITY_SELECT_ID);
    }

    const wrapper = document.createElement("div");
    wrapper.id = CUSTOM_CITY_WRAPPER_ID;
    wrapper.style.marginTop = "16px";
    wrapper.style.display = "flex";
    wrapper.style.alignItems = "center";  // Align vertically
    wrapper.style.gap = "8px";  // Small gap between state and city dropdowns
    wrapper.style.width = "100%"; // Ensures it fills the width

    wrapper.innerHTML = `
      <label for="${CUSTOM_CITY_SELECT_ID}" style="font-weight:600; margin-bottom:8px;">
        Choose City
      </label>
      <select id="${CUSTOM_CITY_SELECT_ID}" class="form-control__select" style="width:100%; padding:12px; border:1px solid #cfd7df; border-radius:4px;">
        <option value="">Please choose</option>
      </select>
    `;

    const cityContainer = findFieldContainerByLabelText(CITY_FIELD_LABEL);
    if (cityContainer && cityContainer.parentElement) {
      cityContainer.parentElement.insertBefore(wrapper, cityContainer.nextSibling);
    } else {
      citySelect.parentElement?.appendChild(wrapper);
    }

    return document.getElementById(CUSTOM_CITY_SELECT_ID);
  }

  function fillCustomCitySelect(customCitySelect, cities, selectedValue) {
    const currentSelected = selectedValue || "";

    customCitySelect.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Please choose";
    customCitySelect.appendChild(placeholder);

    cities.forEach((city) => {
      const option = document.createElement("option");
      option.value = city;
      option.textContent = city;
      customCitySelect.appendChild(option);
    });

    if (cities.includes(currentSelected)) {
      customCitySelect.value = currentSelected;
    } else {
      customCitySelect.value = "";
    }
  }

  function setOriginalCityValue(citySelect, value) {
    citySelect.value = value;

    const matchingOption = Array.from(citySelect.options).find(
      (option) => normalize(option.value) === normalize(value) || normalize(option.textContent) === normalize(value)
    );

    if (matchingOption) {
      citySelect.value = matchingOption.value;
    }

    citySelect.dispatchEvent(new Event("input", { bubbles: true }));
    citySelect.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function init() {
    if (!isCheckoutPage()) return;

    const stateSelect = findSelectByLabelText("Choose State");
    const citySelect = findSelectByLabelText("Choose City");

    if (!stateSelect || !citySelect) return;
    if (stateSelect.dataset.cityProxyInitialized === "1") return;

    stateSelect.dataset.cityProxyInitialized = "1";

    hideOriginalCityField(citySelect);
    const customCitySelect = createCustomCitySelect(citySelect);

    function refreshCustomCityOptions() {
      const cities = getCitiesForSelectedState(stateSelect);
      fillCustomCitySelect(customCitySelect, cities, "");
      setOriginalCityValue(citySelect, "");
    }

    stateSelect.addEventListener("change", function () {
      refreshCustomCityOptions();
    });

    customCitySelect.addEventListener("change", function () {
      setOriginalCityValue(citySelect, this.value);
    });

    refreshCustomCityOptions();
  }

  const observer = new MutationObserver(function () {
    init();
  });

  function start() {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    init();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
