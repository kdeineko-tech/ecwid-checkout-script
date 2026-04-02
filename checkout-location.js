(function () {
  const CONFIG = {
    locationsUrl:
      "https://cdn.jsdelivr.net/gh/kdeineko-tech/ecwid-checkout-script/locations.json",
    pickupLabel: "Pick-Up Location",
    pickupPlaceholder: "Choose pick-up location",
    stateLabelHints: ["state", "province", "region"],
    pickupLabelHints: ["pick up location", "pickup", "store"]
  };

  const appState = {
    locationsIndex: null,
    observer: null,
    stylesAdded: false
  };

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[^\p{L}\p{N}\s-]/gu, "");
  }

  function addStyles() {
    if (appState.stylesAdded) return;
    appState.stylesAdded = true;

    const style = document.createElement("style");
    style.id = "ecwid-pickup-select-style";
    style.textContent = `
      #ecwid-pickup-select-wrap {
        margin-top: 12px;
      }

      #ecwid-pickup-select-wrap label {
        display: block;
        margin: 0 0 6px;
        font-size: 14px;
        font-weight: 500;
      }

      #ecwid-pickup-select {
        width: 100%;
        min-height: 44px;
        padding: 10px 12px;
        border: 1px solid rgba(0,0,0,.18);
        border-radius: 8px;
        background: #fff;
        font: inherit;
        box-sizing: border-box;
      }

      #ecwid-pickup-select:disabled {
        background: #f6f6f6;
        cursor: not-allowed;
      }

      #ecwid-pickup-select-help {
        margin-top: 6px;
        font-size: 12px;
        color: rgba(0,0,0,.65);
      }
    `;
    document.head.appendChild(style);
  }

  async function loadLocations() {
    if (appState.locationsIndex) return appState.locationsIndex;

    const response = await fetch(CONFIG.locationsUrl, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Could not load locations.json");
    }

    const raw = await response.json();
    const index = {};

    Object.entries(raw).forEach(([code, entry]) => {
      if (!entry || typeof entry !== "object") return;

      const payload = {
        code,
        name: entry.name || code,
        locations: Array.isArray(entry.locations) ? entry.locations : []
      };

      index[normalize(code)] = payload;
      index[normalize(payload.name)] = payload;
    });

    appState.locationsIndex = index;
    return index;
  }

  function getFieldByHints(hints) {
    const labels = Array.from(document.querySelectorAll("label"));

    for (const label of labels) {
      const text = normalize(label.textContent);
      if (!text) continue;
      if (!hints.some((hint) => text.includes(hint))) continue;

      let control = null;
      const forId = label.getAttribute("for");

      if (forId) {
        control = document.getElementById(forId);
      }

      if (!control) {
        const container = label.closest("div, section, li, form");
        if (container) {
          control = container.querySelector("input, select, textarea");
        }
      }

      if (control) {
        const group =
          control.closest("div, section, li") || control.parentElement;
        return { label, control, group };
      }
    }

    const selectors = hints
      .map(
        (hint) =>
          `input[name*="${hint}"], select[name*="${hint}"], input[id*="${hint}"], select[id*="${hint}"]`
      )
      .join(",");

    const fallback = document.querySelector(selectors);
    if (!fallback) return null;

    return {
      control: fallback,
      group: fallback.closest("div, section, li") || fallback.parentElement
    };
  }

  function getSelectedStateText(control) {
    if (!control) return "";

    const value = control.value || "";

    if (control.tagName === "SELECT") {
      const option = control.options[control.selectedIndex];
      const text = option ? option.textContent : "";
      return `${value} ${text}`.trim();
    }

    return value;
  }

  function resolveState(locationsIndex, rawValue) {
    const normalized = normalize(rawValue);
    if (!normalized) return null;

    if (locationsIndex[normalized]) {
      return locationsIndex[normalized];
    }

    const matches = Object.entries(locationsIndex)
      .filter(([key]) => normalized.includes(key))
      .map(([, payload]) => payload);

    return matches.length ? matches[0] : null;
  }

  function getOrCreateCustomPickup(pickupField) {
    let wrap = document.getElementById("ecwid-pickup-select-wrap");
    if (wrap) return wrap;

    wrap = document.createElement("div");
    wrap.id = "ecwid-pickup-select-wrap";
    wrap.innerHTML = `
      <label for="ecwid-pickup-select">${CONFIG.pickupLabel}</label>
      <select id="ecwid-pickup-select">
        <option value="">${CONFIG.pickupPlaceholder}</option>
      </select>
      <div id="ecwid-pickup-select-help"></div>
    `;

    pickupField.group.parentNode.insertBefore(wrap, pickupField.group.nextSibling);
    return wrap;
  }

  function dispatchNativeEvents(element) {
    ["input", "change", "blur"].forEach((eventName) => {
      element.dispatchEvent(new Event(eventName, { bubbles: true }));
    });
  }

  function setNativePickupValue(pickupControl, value) {
    pickupControl.value = value || "";
    dispatchNativeEvents(pickupControl);
  }

  function updatePickupOptions(locationsIndex, stateField, pickupField) {
    const wrap = getOrCreateCustomPickup(pickupField);
    const select = wrap.querySelector("#ecwid-pickup-select");
    const help = wrap.querySelector("#ecwid-pickup-select-help");

    const statePayload = resolveState(
      locationsIndex,
      getSelectedStateText(stateField.control)
    );

    const locations = statePayload ? statePayload.locations : [];

    select.innerHTML = "";
    select.appendChild(new Option(CONFIG.pickupPlaceholder, ""));

    if (!locations.length) {
      wrap.style.display = "none";
      pickupField.group.style.display = "";
      return;
    }

    wrap.style.display = "";
    pickupField.group.style.display = "none";

    locations.forEach((location) => {
      select.appendChild(new Option(location, location));
    });

    const currentNativePickup = pickupField.control.value || "";

    if (locations.includes(currentNativePickup)) {
      select.value = currentNativePickup;
    } else {
      select.value = "";
      setNativePickupValue(pickupField.control, "");
    }

    help.textContent = `Available locations: ${locations.length}`;

    if (!select.dataset.bound) {
      select.addEventListener("change", function () {
        setNativePickupValue(pickupField.control, this.value);
      });
      select.dataset.bound = "1";
    }
  }

  async function bootCheckoutAddress() {
    addStyles();

    const locationsIndex = await loadLocations();
    const stateField = getFieldByHints(CONFIG.stateLabelHints);
    const pickupField = getFieldByHints(CONFIG.pickupLabelHints);

    if (!stateField || !pickupField) return;

    updatePickupOptions(locationsIndex, stateField, pickupField);

    if (!stateField.control.dataset.ecwidPickupWatcher) {
      const rerender = () =>
        updatePickupOptions(locationsIndex, stateField, pickupField);

      stateField.control.addEventListener("change", rerender);
      stateField.control.addEventListener("input", rerender);
      stateField.control.dataset.ecwidPickupWatcher = "1";
    }
  }

  function startObserver() {
    if (appState.observer) {
      appState.observer.disconnect();
    }

    const rerun = debounce(function () {
      bootCheckoutAddress().catch(() => {});
    }, 200);

    appState.observer = new MutationObserver(rerun);
    appState.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function initEcwidHooks() {
    Ecwid.OnPageLoaded.add(function (page) {
      if (page.type === "CHECKOUT_ADDRESS") {
        bootCheckoutAddress().catch(console.error);
        startObserver();
      }
    });

    Ecwid.OnPageLoad.add(function () {
      bootCheckoutAddress().catch(() => {});
    });
  }

  const waitTimer = setInterval(function () {
    if (window.Ecwid && Ecwid.OnPageLoaded && Ecwid.OnPageLoad) {
      clearInterval(waitTimer);
      initEcwidHooks();
    }
  }, 250);
})();
