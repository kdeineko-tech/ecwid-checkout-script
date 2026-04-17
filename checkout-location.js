<script>
(function () {
  // -----------------------------
  // 1) CLUB LOCATION DATA
  // -----------------------------
  const clubLocations = {
    CA: ["San Francisco Club", "Los Angeles Club", "San Diego Club"],
    NY: ["Manhattan Club", "Brooklyn Club", "Albany Club"],
    TX: ["Houston Club", "Dallas Club", "Austin Club"]
  };

  const STATE_KEY = "club_state";
  const CITY_KEY = "club_city";

  const STATE_TITLE = "Club State";
  const CITY_TITLE = "Club Address";

  // More reliable than trying to force into address internals
  const DISPLAY_SECTION = "shipping_address";
  const ORDER_DETAILS_SECTION = "customer_info";

  let selectedState = "";
  let selectedCity = "";

  function initEcwidObjects() {
    window.ec = window.ec || {};
    ec.order = ec.order || {};
    ec.order.extraFields = ec.order.extraFields || {};
  }

  function getStateOptions() {
    return Object.keys(clubLocations).map(function (state) {
      return {
        title: state,
        value: state
      };
    });
  }

  function getCityOptions(state) {
    const cities = clubLocations[state] || [];

    if (!cities.length) {
      return [
        {
          title: "Select state first",
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

  function buildFields() {
    initEcwidObjects();

    ec.order.extraFields[STATE_KEY] = {
      title: STATE_TITLE,
      type: "select",
      required: true,
      value: selectedState,
      options: getStateOptions(),
      checkoutDisplaySection: DISPLAY_SECTION,
      orderDetailsDisplaySection: ORDER_DETAILS_SECTION
    };

    ec.order.extraFields[CITY_KEY] = {
      title: CITY_TITLE,
      type: "select",
      required: true,
      value: selectedCity,
      options: getCityOptions(selectedState),
      checkoutDisplaySection: DISPLAY_SECTION,
      orderDetailsDisplaySection: ORDER_DETAILS_SECTION
    };
  }

  function refreshFields() {
    buildFields();
    if (window.Ecwid && typeof Ecwid.refreshConfig === "function") {
      Ecwid.refreshConfig();
    }

    // checkout DOM gets rerendered, so rebind after redraw
    setTimeout(bindListeners, 500);
    setTimeout(bindListeners, 1200);
  }

  function findSelectByFieldKey(fieldKey) {
    const selectors = [
      'select[name="' + fieldKey + '"]',
      'select[name="extraFields.' + fieldKey + '"]',
      '[data-extra-field-key="' + fieldKey + '"] select',
      'select[id*="' + fieldKey + '"]'
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el) return el;
    }

    return null;
  }

  function bindStateListener() {
    const stateSelect = findSelectByFieldKey(STATE_KEY);
    if (!stateSelect || stateSelect.dataset.clubBound === "1") return;

    stateSelect.addEventListener("change", function (e) {
      const newState = e.target.value || "";

      if (newState !== selectedState) {
        selectedState = newState;
        selectedCity = "";
        refreshFields();
      }
    });

    stateSelect.dataset.clubBound = "1";
  }

  function bindCityListener() {
    const citySelect = findSelectByFieldKey(CITY_KEY);
    if (!citySelect || citySelect.dataset.clubBound === "1") return;

    citySelect.addEventListener("change", function (e) {
      selectedCity = e.target.value || "";
      buildFields();

      if (window.Ecwid && typeof Ecwid.refreshConfig === "function") {
        Ecwid.refreshConfig();
      }
    });

    citySelect.dataset.clubBound = "1";
  }

  function bindListeners() {
    bindStateListener();
    bindCityListener();
  }

  function run() {
    refreshFields();

    const observer = new MutationObserver(function () {
      bindListeners();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  if (window.Ecwid && Ecwid.OnPageLoaded && Ecwid.OnPageLoaded.add) {
    Ecwid.OnPageLoaded.add(function (page) {
      if (
        page.type === "CHECKOUT_ADDRESS" ||
        page.type === "CHECKOUT_DELIVERY" ||
        page.type === "CHECKOUT_PAYMENT"
      ) {
        run();
      }
    });
  } else {
    // fallback
    document.addEventListener("DOMContentLoaded", run);
  }
})();
</script>
