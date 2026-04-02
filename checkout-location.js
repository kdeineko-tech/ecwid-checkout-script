(function () {
  // =========================
  // 1) НАЛАШТУВАННЯ
  // =========================

  // Унікальні ключі extra fields у Ecwid order.extraFields
  const FIELD_KEYS = {
    state: 'shipping_state_custom',
    city: 'shipping_city_custom'
  };

  // Назви полів на checkout.
  // Краще робити їх унікальними, щоб не конфліктували з нативними полями Ecwid.
  const FIELD_TITLES = {
    state: 'Shipping State',
    city: 'Shipping City'
  };

  // localStorage ключі для збереження вибору між refreshConfig / rerender
  const STORAGE_KEYS = {
    state: 'ecwid_shipping_state_custom',
    city: 'ecwid_shipping_city_custom'
  };

  // Демо-дані.
  // Замiни на свій реальний список.
  // Рекомендовано зберігати саме code + label, якщо потім захочеш синкати у native shipping address.
  const LOCATION_DATA = {
    CA: {
      label: 'California',
      cities: ['Los Angeles', 'San Diego', 'San Jose', 'Sacramento']
    },
    TX: {
      label: 'Texas',
      cities: ['Austin', 'Dallas', 'Houston', 'San Antonio']
    },
    FL: {
      label: 'Florida',
      cities: ['Miami', 'Orlando', 'Tampa', 'Jacksonville']
    }
  };

  // Якщо хочеш показувати поля лише для певної країни
  // (наприклад, лише для США), залиш true і COUNTRY_CODES = ['US'].
  const LIMIT_BY_COUNTRY = true;
  const COUNTRY_CODES = ['US'];

  // =========================
  // 2) ДОПОМІЖНІ ФУНКЦІЇ
  // =========================

  function normalize(value) {
    return String(value || '').trim();
  }

  function getSavedSelections() {
    return {
      state: normalize(localStorage.getItem(STORAGE_KEYS.state)),
      city: normalize(localStorage.getItem(STORAGE_KEYS.city))
    };
  }

  function saveState(value) {
    localStorage.setItem(STORAGE_KEYS.state, normalize(value));
  }

  function saveCity(value) {
    localStorage.setItem(STORAGE_KEYS.city, normalize(value));
  }

  function clearSavedSelections() {
    localStorage.removeItem(STORAGE_KEYS.state);
    localStorage.removeItem(STORAGE_KEYS.city);
  }

  function getStateCodes() {
    return Object.keys(LOCATION_DATA);
  }

  function getStateLabelByCode(code) {
    return LOCATION_DATA[code] ? LOCATION_DATA[code].label : '';
  }

  function getStateCodeByLabel(label) {
    const normalizedLabel = normalize(label).toLowerCase();
    return getStateCodes().find((code) => {
      return normalize(LOCATION_DATA[code].label).toLowerCase() === normalizedLabel;
    }) || '';
  }

  function getCitiesByStateLabel(stateLabel) {
    const stateCode = getStateCodeByLabel(stateLabel);
    return stateCode && LOCATION_DATA[stateCode]
      ? LOCATION_DATA[stateCode].cities
      : [];
  }

  function buildStateOptions() {
    return getStateCodes().map((code) => ({
      title: LOCATION_DATA[code].label
    }));
  }

  function buildCityOptions(stateLabel) {
    return getCitiesByStateLabel(stateLabel).map((city) => ({
      title: city
    }));
  }

  function stateExists(stateLabel) {
    return Boolean(getStateCodeByLabel(stateLabel));
  }

  function cityExistsForState(stateLabel, city) {
    return getCitiesByStateLabel(stateLabel).includes(city);
  }

  // =========================
  // 3) ПОБУДОВА EXTRA FIELDS
  // =========================

  function applyExtraFields(selectedState, selectedCity) {
    const validState = stateExists(selectedState) ? selectedState : '';
    const validCity = cityExistsForState(validState, selectedCity) ? selectedCity : '';
    const hasState = Boolean(validState);

    window.ec = window.ec || {};
    window.ec.order = window.ec.order || {};
    window.ec.order.extraFields = window.ec.order.extraFields || {};

    // Поле штату
    window.ec.order.extraFields[FIELD_KEYS.state] = {
      title: FIELD_TITLES.state,
      type: 'select',
      options: buildStateOptions(),
      required: true,
      checkoutDisplaySection: 'shipping_address',
      orderDetailsDisplaySection: 'shipping_info',
      showInNotifications: true,
      value: validState,
      showForCountry: LIMIT_BY_COUNTRY ? COUNTRY_CODES : undefined
    };

    // Поле міста
    // До вибору штату поле приховане, після вибору - показується з потрібним списком міст
    window.ec.order.extraFields[FIELD_KEYS.city] = {
      title: FIELD_TITLES.city,
      type: 'select',
      options: hasState ? buildCityOptions(validState) : [{ title: 'Select state first' }],
      available: hasState,
      required: hasState,
      checkoutDisplaySection: 'shipping_address',
      orderDetailsDisplaySection: 'shipping_info',
      showInNotifications: true,
      value: validCity,
      showForCountry: LIMIT_BY_COUNTRY ? COUNTRY_CODES : undefined
    };

    if (window.Ecwid && typeof window.Ecwid.refreshConfig === 'function') {
      window.Ecwid.refreshConfig();
    }
  }

  // =========================
  // 4) ПОШУК SELECT У DOM
  // =========================
  // Ecwid не дає окремого built-in API для "dependent select",
  // тому нижче — робочий DOM-based шар, який відслідковує вибір штату
  // і перебудовує список міст.

  function textContainsFieldTitle(text, title) {
    return normalize(text).toLowerCase().includes(normalize(title).toLowerCase());
  }

  function findSelectByFieldTitle(title) {
    const selects = Array.from(document.querySelectorAll('select'));

    for (const select of selects) {
      const container =
        select.closest('label') ||
        select.closest('[class*="field"]') ||
        select.closest('[class*="form"]') ||
        select.parentElement;

      const blob = [
        select.getAttribute('aria-label') || '',
        select.name || '',
        select.id || '',
        container ? container.textContent : '',
        select.parentElement ? select.parentElement.textContent : ''
      ].join(' ');

      if (textContainsFieldTitle(blob, title)) {
        return select;
      }
    }

    return null;
  }

  // =========================
  // 5) BIND LISTENERS
  // =========================

  let rebindTimeout = null;
  let observerStarted = false;

  function scheduleBind() {
    clearTimeout(rebindTimeout);
    rebindTimeout = setTimeout(bindListeners, 250);
  }

  function bindListeners() {
    const stateSelect = findSelectByFieldTitle(FIELD_TITLES.state);
    const citySelect = findSelectByFieldTitle(FIELD_TITLES.city);

    if (stateSelect && !stateSelect.dataset.ecwidBoundState) {
      stateSelect.dataset.ecwidBoundState = '1';

      stateSelect.addEventListener('change', function () {
        const newState = normalize(stateSelect.value);

        saveState(newState);
        saveCity('');

        // При зміні штату перебудовуємо поле міста
        applyExtraFields(newState, '');

        // Після refreshConfig Ecwid перемалює checkout
        // тому треба знову підвісити listener-и
        setTimeout(bindListeners, 400);
      });
    }

    if (citySelect && !citySelect.dataset.ecwidBoundCity) {
      citySelect.dataset.ecwidBoundCity = '1';

      citySelect.addEventListener('change', function () {
        saveCity(normalize(citySelect.value));
      });
    }
  }

  function startDomObserver() {
    if (observerStarted || !document.body) return;

    observerStarted = true;

    const observer = new MutationObserver(function () {
      scheduleBind();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // =========================
  // 6) INIT
  // =========================

  function init() {
    const saved = getSavedSelections();

    // Базово створюємо поля один раз при завантаженні storefront JS
    applyExtraFields(saved.state, saved.city);

    // Підключаємо відслідковування checkout сторінки
    startDomObserver();

    if (window.Ecwid && window.Ecwid.OnPageLoaded && window.Ecwid.OnPageLoaded.add) {
      window.Ecwid.OnPageLoaded.add(function (page) {
        if (
          page.type === 'CHECKOUT_ADDRESS' ||
          page.type === 'CHECKOUT_ADDRESS_BOOK' ||
          page.type === 'CHECKOUT_DELIVERY' ||
          page.type === 'CHECKOUT_PAYMENT_DETAILS'
        ) {
          scheduleBind();
        }
      });
    }

    if (window.Ecwid && window.Ecwid.OnOrderPlaced && window.Ecwid.OnOrderPlaced.add) {
      window.Ecwid.OnOrderPlaced.add(function () {
        clearSavedSelections();
      });
    }
  }

  if (window.Ecwid && window.Ecwid.OnAPILoaded && window.Ecwid.OnAPILoaded.add) {
    window.Ecwid.OnAPILoaded.add(init);
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
