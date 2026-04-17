(function () {
  const STATE_KEY = "pickup_state_selector";
  const CITY_KEY = "pickup_city_selector";

  const STATE_TITLE = "Choose State";
  const CITY_TITLE = "Choose City";

  const CITY_MAP = {
    California: ["Los Angeles", "San Diego", "San Jose", "Sacramento"],
    Texas: ["Houston", "Dallas", "Austin", "San Antonio"],
    Florida: ["Miami", "Orlando", "Tampa", "Jacksonville"],
    "New York": ["New York", "Buffalo", "Albany", "Rochester"]
  };

  const CHECKOUT_PAGES = new Set([
    "CART",
    "CHECKOUT_ADDRESS",
    "CHECKOUT_DELIVERY",
    "CHECKOUT_PAYMENT_DETAILS",
    "CHECKOUT_ADDRESS_BOOK"
  ]);

  let bindTimer = null;

  function normalize(value) {
    return (value || "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function buildStateOptions() {
    return [
      { title: "Please choose", value: "" },
      ...Object.keys(CITY_MAP).map(state => ({
        title: state,
        value: state
      }))
    ];
  }

  function buildCityOptions(selectedState) {
    const cities = CITY_MAP[selectedState] || [];
    return [
      { title: "Please choose", value: "" },
      ...cities.map(city => ({
        title: city,
        value: city
      }))
    ];
  }

  function ensureEcwidObjects() {
    window.ec = window.ec || {};
    ec.order = ec.order || {};
    ec.order.extraFields = ec.order.extraFields || {};
  }

  function applyFields(selectedState, selectedCity) {
    ensureEcwidObjects();

    const allowedCities = CITY_MAP[selectedState] || [];
    const safeCity = allowedCities.includes(selectedCity) ? selectedCity : "";

    ec.order.extraFields[STATE_KEY] = {
      title: STATE_TITLE,
      type: "select",
      options: buildStateOptions(),
      value: selectedState || "",
      required: true,
      checkoutDisplaySection: "shipping_address",
      orderDetailsDisplaySection: "shipping_info",
      showInNotifications: true
    };

    ec.order.extraFields[CITY_KEY] = {
      title: CITY_TITLE,
      type: "select",
      options: buildCityOptions(selectedState),
      value: safeCity,
      required: true,
      checkoutDisplaySection: "shipping_address",
      orderDetailsDisplaySection: "shipping_info",
      showInNotifications: true
    };

    if (window.Ecwid && typeof Ecwid.refreshConfig === "function") {
      Ecwid.refreshConfig();
    }
  }

  function findSelectByLabelText(labelText) {
    const wanted = normalize(labelText);
    const nodes = Array.from(document.querySelectorAll("label, div, span"));

    for (const node of nodes) {
      const text = normalize(node.textContent);
      if (text !== wanted && !text.includes(wanted)) continue;

      let current = node;
      for (let i = 0; i < 6 && current; i += 1) {
        const selects = Array.from(current.querySelectorAll("select")).filter(isVisible);
        if (selects.length === 1) return selects[0];
        if (selects.length > 1) return selects[0];
        current = current.parentElement;
      }
    }

    return null;
  }

  function isVisible(el) {
    if (!el || !document.contains(el)) return false;
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function bindStateChange() {
    const stateSelect = findSelectByLabelText(STATE_TITLE);
    const citySelect = findSelectByLabelText(CITY_TITLE);

    if (!stateSelect || !citySelect) return false;
    if (stateSelect.options.length < 2) return false;

    if (stateSelect.dataset.locationBound === "1") return true;

    stateSelect.dataset.locationBound = "1";

    stateSelect.addEventListener("change", function () {
      const newState = stateSelect.value || "";
      applyFields(newState, "");

      setTimeout(bindStateChange, 250);
      setTimeout(bindStateChange, 700);
    });

    return true;
  }

  function initLocationFields() {
    applyFields("", "");

    let tries = 0;
    clearInterval(bindTimer);

    bindTimer = setInterval(function () {
      tries += 1;
      const ok = bindStateChange();
      if (ok || tries >= 20) {
        clearInterval(bindTimer);
        bindTimer = null;
      }
    }, 250);

    setTimeout(bindStateChange, 200);
    setTimeout(bindStateChange, 600);
    setTimeout(bindStateChange, 1200);
  }

  function start() {
    if (!window.Ecwid || !Ecwid.OnAPILoaded || !Ecwid.OnPageLoaded) {
      return;
    }

    Ecwid.OnAPILoaded.add(function () {
      Ecwid.OnPageLoaded.add(function (page) {
        if (page && CHECKOUT_PAGES.has(page.type)) {
          initLocationFields();
        }
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
