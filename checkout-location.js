<script>
(function () {
  // ------------------------------
  // 1) DATA: state -> cities
  // Replace this with your real data
  // ------------------------------
  const locationData = {
    CA: ["San Francisco", "Los Angeles", "San Diego"],
    NY: ["Manhattan", "Brooklyn", "Albany"],
    TX: ["Houston", "Dallas", "Austin"]
  };

  // ------------------------------
  // 2) CONFIG
  // ------------------------------
  const STATE_FIELD_KEY = "delivery_state";
  const CITY_FIELD_KEY = "delivery_city";

  const STATE_FIELD_TITLE = "State";
  const CITY_FIELD_TITLE = "City";

  const CHECKOUT_SECTION = "shipping_methods"; // Delivery options section
  const ORDER_DETAILS_SECTION = "shipping_info";

  let currentState = "";
  let currentCity = "";
  let stateListenerAttached = false;
  let cityListenerAttached = false;

  // ------------------------------
  // 3) INIT EXTRA FIELDS STORAGE
  // ------------------------------
  window.ec = window.ec || {};
  ec.order = ec.order || {};
  ec.order.extraFields = ec.order.extraFields || {};

  // ------------------------------
  // 4) HELPERS
  // ------------------------------
  function getStateOptions() {
    return Object.keys(locationData).map(function (stateCode) {
      return {
        title: stateCode,
        value: stateCode
      };
    });
  }

  function getCityOptions(stateCode) {
    const cities = locationData[stateCode] || [];

    if (!cities.length) {
      return [
        {
          title: "Please select a state first",
          value: ""
        }
      ];
    }

    return cities.map(function (city) {
      return {
        title: city,
        value: city
      };
    });
  }

  function setHiddenFallbackValues() {
    // Extra safeguard so current values stay in order.extraFields
    ec.order.extraFields[STATE_FIELD_KEY] = {
      title: STATE_FIELD_TITLE,
      type: "select",
      required: true,
      options: getStateOptions(),
      value: currentState,
      checkoutDisplaySection: CHECKOUT_SECTION,
      orderDetailsDisplaySection: ORDER_DETAILS_SECTION,
      showInNotifications: true
    };

    ec.order.extraFields[CITY_FIELD_KEY] = {
      title: CITY_FIELD_TITLE,
      type: "select",
      required: true,
      options: getCityOptions(currentState),
      value: currentCity,
      checkoutDisplaySection: CHECKOUT_SECTION,
      orderDetailsDisplaySection: ORDER_DETAILS_SECTION,
      showInNotifications: true
    };
  }

  function renderFields() {
    setHiddenFallbackValues();

    if (window.Ecwid && typeof Ecwid.refreshConfig === "function") {
      Ecwid.refreshConfig();
    }

    // Ecwid re-renders checkout after refreshConfig,
    // so listeners must be attached again.
    stateListenerAttached = false;
    cityListenerAttached = false;

    setTimeout(bindListeners, 300);
    setTimeout(bindListeners, 800);
  }

  function normalizeValue(value) {
    return (value || "").trim();
  }

  function findFieldSelect(fieldKey, titleText) {
    const selectors = [
      `select[name="${fieldKey}"]`,
      `select[name="extraFields.${fieldKey}"]`,
      `[data-extra-field-key="${fieldKey}"] select`,
      `[data-field-name="${fieldKey}"] select`,
      `select[id*="${fieldKey}"]`
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el) return el;
    }

    // Fallback: find a select by nearby label text
    const labels = Array.from(document.querySelectorAll("label, div, span"));
    const matchedLabel = labels.find(function (node) {
      return normalizeValue(node.textContent) === normalizeValue(titleText);
    });

    if (matchedLabel) {
      const wrapper = matchedLabel.closest("div");
      if (wrapper) {
        const select = wrapper.querySelector("select") || wrapper.parentElement?.querySelector("select");
        if (select) return select;
      }
    }

    return null;
  }

  function bindStateChange() {
    if (stateListenerAttached) return;

    const stateSelect = findFieldSelect(STATE_FIELD_KEY, STATE_FIELD_TITLE);
    if (!stateSelect) return;

    stateSelect.addEventListener("change", function (e) {
      const newState = e.target.value || "";

      if (newState === currentState) return;

      currentState = newState;
      currentCity = ""; // reset city when state changes
      renderFields();
    });

    stateListenerAttached = true;
  }

  function bindCityChange() {
    if (cityListenerAttached) return;

    const citySelect = findFieldSelect(CITY_FIELD_KEY, CITY_FIELD_TITLE);
    if (!citySelect) return;

    citySelect.addEventListener("change", function (e) {
      currentCity = e.target.value || "";
      setHiddenFallbackValues();

      if (window.Ecwid && typeof Ecwid.refreshConfig === "function") {
        Ecwid.refreshConfig();
      }
    });

    cityListenerAttached = true;
  }

  function bindListeners() {
    bindStateChange();
    bindCityChange();
  }

  // ------------------------------
  // 5) RUN ONLY ON DELIVERY STEP
  // ------------------------------
  if (window.Ecwid && Ecwid.OnPageLoaded && Ecwid.OnPageLoaded.add) {
    Ecwid.OnPageLoaded.add(function (page) {
      if (page.type === "CHECKOUT_DELIVERY") {
        renderFields();

        // Watch for Ecwid DOM re-renders on checkout
        const observer = new MutationObserver(function () {
          bindListeners();
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
      }
    });
  }
})();
</script>
