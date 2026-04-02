// Initialize extra fields
window.ec = window.ec || {};
ec.order = ec.order || {};
ec.order.extraFields = ec.order.extraFields || {};

// New optional question 'How should we sign the package?'
// visible on the shipping address page
ec.order.extraFields.wrapping_box_signature = {
    'title': 'How should we sign the package?',
    'textPlaceholder': 'Package sign',
    'type': 'text',
    'tip': 'We will put a label on a box so the recipient knows who it is from',
    'required': false,
    'checkoutDisplaySection': 'shipping_address'
};

window.Ecwid && Ecwid.refreshConfig();
