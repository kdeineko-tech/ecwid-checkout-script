(function () {
  // ===== CONFIG =====
  const STATE_FIELD_LABEL = "Choose State";
  const CITY_FIELD_LABEL = "Choose City";

  const CITY_MAP = {
    "California": ["Los Angeles", "San Diego", "San Jose", "Sacramento"],
    "Texas": ["Houston", "Dallas", "Austin", "San Antonio"],
    "Florida": ["Miami", "Orlando", "Tampa", "Jacksonville"],
    "New York": ["New York", "Buffalo", "Albany", "Rochester"]
  };

  // ===== INIT =====
  function initEcwidFields() {
    if (!window.ec || !window.Ecwid) {
      console.warn("Ecwid not ready yet...");
      return false;
    }

    ec.order.extraFields.state = {
      title: STATE_FIELD_LABEL,
      type: "select",
      options: Object.keys(CITY_MAP),
      required: true,
      checkoutDisplaySection: "shipping_address"
    };

    ec.order.extraFields.city = {
      title: CITY_FIELD_LABEL,
      type: "select",
      options: [].concat(...Object.values(CITY_MAP)),
      required: true,
      checkoutDisplaySection: "shipping_address"
    };

    Ecwid.refreshConfig();
    waitForFieldsAndInit();

    return true;
  }

  // ===== WAIT FOR ECWID =====
  function waitForEcwid() {
    const interval = setInterval(() => {
      if (initEcwidFields()) {
        clearInterval(interval);
      }
    }, 300);
  }

  // ===== WAIT FOR DOM =====
  function waitForFieldsAndInit() {
    const interval = setInterval(() => {
      const stateSelect = document.querySelector('[name="state"]');
      const citySelect = document.querySelector('[name="city"]');

      if (stateSelect && citySelect) {
        clearInterval(interval);
        initLogic(stateSelect, citySelect);
      }
    }, 300);
  }

  // ===== MAIN LOGIC =====
  function initLogic(stateSelect, citySelect) {
    citySelect.disabled = true;

    if (stateSelect.value) {
      citySelect.disabled = false;
      filterCities(citySelect, stateSelect.value);
    }

    stateSelect.addEventListener("change", function () {
      const state = this.value;

      citySelect.value = "";
      citySelect.disabled = !state;

      filterCities(citySelect, state);
    });

    // SAFETY CHECK
    Ecwid.OnCartChanged.add(function (cart) {
      const state = cart.orderExtraFields?.state;
      const city = cart.orderExtraFields?.city;

      if (!state || !city) return;

      const validCities = CITY_MAP[state] || [];

      if (!validCities.includes(city)) {
        console.warn("Invalid city detected, resetting...");
        citySelect.value = "";
      }
    });
  }

  // ===== FILTER =====
  function filterCities(citySelect, state) {
    const validCities = CITY_MAP[state] || [];
    const options = citySelect.querySelectorAll("option");

    options.forEach(option => {
      if (!option.value) return;

      option.style.display = validCities.includes(option.value) ? "" : "none";
    });
  }

  // ===== START =====
  waitForEcwid();
})();
