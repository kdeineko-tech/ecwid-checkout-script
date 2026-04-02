(function () {
  const STATE_FIELD_LABEL = "Choose State";
  const CITY_FIELD_LABEL = "Choose City";

  const CITY_MAP = {
    California: ["Los Angeles", "San Diego", "San Jose", "Sacramento"],
    Texas: ["Houston", "Dallas", "Austin", "San Antonio"],
    Florida: ["Miami", "Orlando", "Tampa", "Jacksonville"],
    "New York": ["New York", "Buffalo", "Albany", "Rochester"]
  };

  const CUSTOM_CITY_WRAPPER_ID = "custom-city-filter-wrapper";
  const CUSTOM_CITY_SELECT_ID = "custom-city-filter-select";

  let bootInterval = null;
  let checkoutObserver = null;

  function normalize(value) {
    return (value || "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function isRelevantCheckoutPage(page) {
    if (!page || !page.type) return false;

    return [
      "CART",
      "CHECKOUT_ADDRESS",
      "CHECKOUT_ADDRESS_BOOK",
      "CHECKOUT_DELIVERY",
      "CHECKOUT_PAYMENT_DETAILS"
    ].includes(page.type);
  }

  function getSearchRoot() {
    return document.querySelector(".ec-cart, .ec-checkout") || document.body;
  }

  function findFieldContainerByLabelText(labelText) {
    const wanted = normalize(labelText);
    const root = getSearchRoot();
    const candidates = Array.from(root.querySelectorAll("label, div, span"));

    for (const node of candidates) {
      if (normalize(node.textContent) !== wanted) continue;

      let current = node;
      for (let i = 0; i < 8 && current; i += 1) {
        const select = current.querySelector("select");
        if (select) return current;
        current = current.parentElement;
      }
    }

    return null;
  }

  function findSelectByLabelText(labelText) {
    const container = findFieldContainerByLabelText(labelText);
    return container ? container.querySelector("select") : null;
  }

  function getFieldWrapper(select) {
    if (!select) return null;

    return (
      select.closest('[class*="field"]') ||
      select.closest('[class*="Field"]') ||
      select.closest('[class*="form"]') ||
      select.closest('[class*="row"]') ||
      select.parentElement
    );
  }

  function getStateKey(stateSelect) {
    if (!stateSelect) return "";

    const value = stateSelect.value || "";
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
    const wrapper = getFieldWrapper(citySelect);
    if (wrapper) {
      wrapper.style.display = "none";
    } else {
      citySelect.style.display = "none";
    }
  }

  function createCustomCitySelect(citySelect) {
    let wrapper = document.getElementById(CUSTOM_CITY_WRAPPER_ID);

    if (!wrapper) {
      wrapper = document.createElement("div");
      wrapper.id = CUSTOM_CITY_WRAPPER_ID;
      wrapper.style.marginTop = "16px";

      wrapper.innerHTML = `
        <select
          id="${CUSTOM_CITY_SELECT_ID}"
          style="width:100%; padding:12px; border:1px solid #cfd7df; border-radius:4px; background:#fff;"
        >
          <option value="">Please choose</option>
        </select>
      `;
    }

    const cityWrapper = getFieldWrapper(citySelect);

    if (cityWrapper && cityWrapper.parentElement) {
      if (wrapper.parentElement !== cityWrapper.parentElement || wrapper.previousElementSibling !== cityWrapper) {
        cityWrapper.insertAdjacentElement("afterend", wrapper);
      }
    } else if (!wrapper.parentElement && citySelect.parentElement) {
      citySelect.parentElement.appendChild(wrapper);
    }

    return document.getElementById(CUSTOM_CITY_SELECT_ID);
  }

  function fillCustomCitySelect(customCitySelect, cities, selectedValue) {
    console.log("Filling custom city select:", cities, selectedValue);

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
    console.log("Setting original city value:", value);

    const normalizedValue = normalize(value);

    const matchingOption = Array.from(citySelect.options).find((option) => {
      return (
        normalize(option.value) === normalizedValue ||
        normalize(option.textContent) === normalizedValue
      );
    });

    citySelect.value = matchingOption ? matchingOption.value : "";

    citySelect.dispatchEvent(new Event("input", { bubbles: true }));
    citySelect.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function getOriginalCityCurrentValue(citySelect) {
    const selectedText =
      citySelect.options[citySelect.selectedIndex]?.textContent?.trim() || "";

    return citySelect.value || selectedText || "";
  }

  function syncUI(stateSelect, citySelect, customCitySelect) {
    console.log("Syncing UI with selected state:", stateSelect.value);

    const cities = getCitiesForSelectedState(stateSelect);
    const currentOriginalValue = getOriginalCityCurrentValue(citySelect);

    fillCustomCitySelect(customCitySelect, cities, currentOriginalValue);

    if (!cities.includes(customCitySelect.value)) {
      customCitySelect.value = "";
      setOriginalCityValue(citySelect, "");
    }
  }

  function mountCityProxy() {
    console.log("Attempting to mount city proxy...");

    const stateSelect = findSelectByLabelText(STATE_FIELD_LABEL);
    const citySelect = findSelectByLabelText(CITY_FIELD_LABEL);

    if (!stateSelect || !citySelect) {
      console.log("State or city select not found.");
      return false;
    }

    hideOriginalCityField(citySelect);
    const customCitySelect = createCustomCitySelect(citySelect);

    if (stateSelect.dataset.cityProxyBound !== "1") {
      stateSelect.dataset.cityProxyBound = "1";

      stateSelect.addEventListener("change", function () {
        console.log("State changed, refreshing city options.");
        const freshCustomCitySelect = document.getElementById(CUSTOM_CITY_SELECT_ID);
        const freshCitySelect = findSelectByLabelText(CITY_FIELD_LABEL);

        if (!freshCustomCitySelect || !freshCitySelect) return;

        fillCustomCitySelect(freshCustomCitySelect, getCitiesForSelectedState(stateSelect), "");
        setOriginalCityValue(freshCitySelect, "");
      });
    }

    if (customCitySelect.dataset.cityProxyBound !== "1") {
      customCitySelect.dataset.cityProxyBound = "1";

      customCitySelect.addEventListener("change", function () {
        console.log("Custom city selected:", this.value);
        const freshCitySelect = findSelectByLabelText(CITY_FIELD_LABEL);
        if (!freshCitySelect) return;

        setOriginalCityValue(freshCitySelect, this.value);
      });
    }

    syncUI(stateSelect, citySelect, customCitySelect);
    return true;
  }

  function stopBootInterval() {
    if (bootInterval) {
      clearInterval(bootInterval);
      bootInterval = null;
    }
  }

  function startCheckoutObserver() {
    const root = getSearchRoot();
    if (!root) return;

    if (checkoutObserver) {
      checkoutObserver.disconnect();
    }

    checkoutObserver = new MutationObserver(function () {
      console.log("Mutation observed, retrying mount.");
      mountCityProxy();
    });

    checkoutObserver.observe(root, {
      childList: true,
      subtree: true
    });
  }

  function bootstrapCheckoutFields() {
    stopBootInterval();

    let attempts = 0;

    bootInterval = setInterval(function () {
      attempts += 1;

      const mounted = mountCityProxy();
      startCheckoutObserver();

      if (mounted || attempts >= 40) {
        stopBootInterval();
      }
    }, 250);
  }

  function registerEcwidHooks() {
    if (!window.Ecwid || !Ecwid.OnPageLoaded) return;

    Ecwid.OnPageLoaded.add(function (page) {
      if (!isRelevantCheckoutPage(page)) return;
      bootstrapCheckoutFields();
    });

    bootstrapCheckoutFields();
  }

  function waitForEcwidApi() {
    if (window.Ecwid && Ecwid.OnAPILoaded) {
      Ecwid.OnAPILoaded.add(function () {
        registerEcwidHooks();
      });
      return;
    }

    let tries = 0;
    const apiWaiter = setInterval(function () {
      tries += 1;

      if (window.Ecwid && Ecwid.OnAPILoaded) {
        clearInterval(apiWaiter);
        Ecwid.OnAPILoaded.add(function () {
          registerEcwidHooks();
        });
      }

      if (tries >= 40) {
        clearInterval(apiWaiter);
      }
    }, 250);
  }

  waitForEcwidApi();
})();
