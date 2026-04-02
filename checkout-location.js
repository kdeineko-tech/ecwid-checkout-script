Ecwid.OnAPILoaded.add(function () {
  window.ec = window.ec || {};
  ec.order = ec.order || {};
  ec.order.extraFields = ec.order.extraFields || {};

  ec.order.extraFields.wrapping_box_signature = {
    title: 'How should we sign the package?',
    textPlaceholder: 'Package sign',
    type: 'text',
    required: false,
    checkoutDisplaySection: 'shipping_address'
  };

  Ecwid.refreshConfig && Ecwid.refreshConfig();
});
