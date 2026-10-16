/*
  config.js — what customers see.
  You can edit this by hand, OR change things in admin.html and click
  "Publish changes" to download a fresh copy of this file, then upload it
  to your hosting to replace this one.

  The prices below are SAMPLES. Replace them with your own.
*/
window.SHOP_CONFIG = {
  updatedAt: 0,
  shopName: "Oracle Vending",
  notice: "Orders are processed after payment is confirmed.",
  whatsapp: "233550564384", // your WhatsApp number, international format, digits only (e.g. 233241234567)
  momo: {
    number: "0550564384",
    name: "Kumi Emmanuel",
    network: "MTN MoMo"
  },
  bundles: [
    { id: "b1",  network: "MTN",     label: "1GB",  price: 6,  validity: "No expiry", active: true },
    { id: "b2",  network: "MTN",     label: "2GB",  price: 12, validity: "No expiry", active: true },
    { id: "b3",  network: "MTN",     label: "3GB",  price: 18,   validity: "No expiry", active: true },
    { id: "b4",  network: "MTN",     label: "4GB", price: 22,   validity: "No expiry", active: true },
    { id: "b5",  network: "Telecel", label: "1GB",  price: 5,    validity: "30 days",   active: true },
    { id: "b6",  network: "Telecel", label: "5GB",  price: 23,   validity: "30 days",   active: true },
    { id: "b7",  network: "Telecel", label: "10GB", price: 44,   validity: "30 days",   active: true },
    { id: "b8",  network: "AT",      label: "1GB",  price: 4.8,  validity: "No expiry", active: true },
    { id: "b9",  network: "AT",      label: "5GB",  price: 22,   validity: "No expiry", active: true },
    { id: "b10", network: "AT",      label: "10GB", price: 42,   validity: "No expiry", active: true }
  ]
};