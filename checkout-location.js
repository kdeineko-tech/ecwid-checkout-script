Ecwid.OnAPILoaded.add(function () {
  window.ec = window.ec || {};
  ec.order = ec.order || {};
  ec.order.extraFields = ec.order.extraFields || {};

  ec.order.extraFields.delivery_comment = {
    title: 'Delivery comment',
    type: 'text',
    textPlaceholder: 'Enter comment',
    required: false,
    checkoutDisplaySection: 'shipping_address'
  };

  window.Ecwid && Ecwid.refreshConfig();
});
