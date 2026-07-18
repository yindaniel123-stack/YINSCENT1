(function () {
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  var products = window.YINSCENT_PRODUCTS || [];
  var base = window.YINSCENT_BASE || "/";
  var cartStorageKey = "yinscent-cart-v1";
  var currency = window.YINSCENT_PAYPAL_CURRENCY || "GBP";
  var flatShipping = Number(window.YINSCENT_SHIPPING_FLAT || 0);
  var freeShippingMin = Number(window.YINSCENT_FREE_SHIPPING_MIN || 0);
  var clientId = window.YINSCENT_PAYPAL_CLIENT_ID || "";

  var emptyEl = document.getElementById("checkoutEmpty");
  var formWrap = document.getElementById("checkoutFormWrap");
  var successEl = document.getElementById("checkoutSuccess");
  var itemsEl = document.getElementById("checkoutItems");
  var subtotalEl = document.getElementById("checkoutSubtotal");
  var shippingEl = document.getElementById("checkoutShipping");
  var totalEl = document.getElementById("checkoutTotal");
  var shippingNote = document.getElementById("shippingNote");
  var form = document.getElementById("checkoutForm");
  var errorEl = document.getElementById("checkoutError");
  var paypalStatus = document.getElementById("paypalStatus");
  var paypalContainer = document.getElementById("paypal-button-container");

  function findProduct(id) {
    return products.find(function (p) {
      return p.id === id;
    });
  }

  function productCategory(p) {
    return p.category || "tealights";
  }

  function productFullName(p) {
    if (p.cartName) return p.cartName;
    if (productCategory(p) === "scented-candles") return "Scented Candle — " + p.name;
    if (productCategory(p) === "reed-diffusers") return "Reed Diffuser — " + p.name;
    if (productCategory(p) === "tealight-holders") {
      return "Tealight Holder — " + p.name.replace(" — 12 Pack", "");
    }
    if (productCategory(p) === "scented-sachets") return "Scented Sachet — " + p.name;
    if (productCategory(p) === "essential-oils") return "Essential Oil — " + p.name;
    if (productCategory(p) === "smart-aroma-refills") {
      return "Smart Aroma Diffuser Refill — " + p.name;
    }
    return "Scented Tealight Candles — " + p.name;
  }

  function productThumb(p) {
    var imgs = p.images && p.images.length ? p.images : [p.slug];
    return base + "assets/products/" + imgs[0] + ".png";
  }

  function formatMoney(value) {
    return "£" + Number(value).toFixed(2);
  }

  function loadCart() {
    try {
      var saved = JSON.parse(localStorage.getItem(cartStorageKey) || "[]");
      if (!Array.isArray(saved)) return [];
      return saved
        .map(function (item) {
          var product = findProduct(item.id);
          var qty = Math.max(1, Math.min(99, parseInt(item.qty, 10) || 1));
          return product ? { id: product.id, qty: qty, product: product } : null;
        })
        .filter(Boolean);
    } catch (e) {
      return [];
    }
  }

  function clearCart() {
    try {
      localStorage.setItem(cartStorageKey, "[]");
    } catch (e) {
      /* ignore */
    }
  }

  function calcTotals(cart) {
    var subtotal = cart.reduce(function (sum, item) {
      return sum + Number(item.product.price) * item.qty;
    }, 0);
    var shipping = subtotal >= freeShippingMin || subtotal === 0 ? 0 : flatShipping;
    return {
      subtotal: subtotal,
      shipping: shipping,
      total: subtotal + shipping,
    };
  }

  function renderSummary(cart, totals) {
    itemsEl.innerHTML = "";
    cart.forEach(function (item) {
      var li = document.createElement("li");
      li.className = "checkout-summary__item";
      li.innerHTML =
        '<img src="' +
        productThumb(item.product) +
        '" alt="" width="64" height="64" />' +
        '<div class="checkout-summary__item-copy">' +
        "<p>" +
        productFullName(item.product) +
        "</p>" +
        "<span>Qty " +
        item.qty +
        " · " +
        formatMoney(item.product.price) +
        "</span>" +
        "</div>" +
        "<strong>" +
        formatMoney(Number(item.product.price) * item.qty) +
        "</strong>";
      itemsEl.appendChild(li);
    });

    subtotalEl.textContent = formatMoney(totals.subtotal);
    shippingEl.textContent = totals.shipping === 0 ? "Free" : formatMoney(totals.shipping);
    totalEl.textContent = formatMoney(totals.total);
    shippingNote.textContent =
      freeShippingMin > 0
        ? "Free shipping on orders over " + formatMoney(freeShippingMin) + "."
        : "";
  }

  function showError(message) {
    if (!errorEl) return;
    if (!message) {
      errorEl.hidden = true;
      errorEl.textContent = "";
      return;
    }
    errorEl.hidden = false;
    errorEl.textContent = message;
  }

  function validateForm() {
    if (!form) return false;
    var required = ["email", "firstName", "lastName", "address", "city", "postcode", "country"];
    for (var i = 0; i < required.length; i++) {
      var field = form.elements[required[i]];
      if (!field || !String(field.value || "").trim()) {
        showError("Please complete your contact and delivery details before paying.");
        if (field) field.focus();
        return false;
      }
    }
    var email = String(form.elements.email.value || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError("Please enter a valid email address.");
      form.elements.email.focus();
      return false;
    }
    showError("");
    return true;
  }

  function getShippingDetails() {
    return {
      email: String(form.elements.email.value || "").trim(),
      firstName: String(form.elements.firstName.value || "").trim(),
      lastName: String(form.elements.lastName.value || "").trim(),
      address: String(form.elements.address.value || "").trim(),
      city: String(form.elements.city.value || "").trim(),
      postcode: String(form.elements.postcode.value || "").trim(),
      country: String(form.elements.country.value || "GB").trim(),
    };
  }

  /* Best-effort sales reporting for the admin dashboard; never blocks checkout. */
  function recordOrder(orderId, total, cartItems) {
    try {
      fetch(base + "api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: orderId,
          total: Number(total),
          currency: currency,
          items: cartItems.map(function (item) {
            return { id: item.id, qty: item.qty, price: Number(item.product.price) };
          }),
        }),
      }).catch(function () {});
    } catch (e) {
      /* Reporting only. */
    }
  }

  function showSuccess(orderId, total) {
    if (formWrap) formWrap.hidden = true;
    if (emptyEl) emptyEl.hidden = true;
    if (successEl) successEl.hidden = false;
    var idEl = document.getElementById("successOrderId");
    var totalPaid = document.getElementById("successTotal");
    if (idEl) idEl.textContent = orderId || "—";
    if (totalPaid) totalPaid.textContent = formatMoney(total);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function loadPayPalSdk(cb) {
    if (!clientId || clientId.indexOf("REPLACE_") === 0) {
      if (paypalStatus) {
        paypalStatus.textContent =
          "PayPal is not configured. Add your Live Client ID in js/checkout-config.js.";
      }
      return;
    }
    if (window.paypal) {
      cb();
      return;
    }
    var script = document.createElement("script");
    script.src =
      "https://www.paypal.com/sdk/js?client-id=" +
      encodeURIComponent(clientId) +
      "&currency=" +
      encodeURIComponent(currency) +
      "&intent=capture&components=buttons";
    script.onload = cb;
    script.onerror = function () {
      if (paypalStatus) {
        paypalStatus.textContent = "Could not load PayPal. Please refresh and try again.";
      }
    };
    document.body.appendChild(script);
  }

  function initPayPal(cart, totals) {
    if (!paypalContainer || !window.paypal) return;

    window.paypal
      .Buttons({
        style: {
          layout: "vertical",
          color: "gold",
          shape: "rect",
          label: "paypal",
        },
        onClick: function (data, actions) {
          if (!validateForm()) return actions.reject();
          return actions.resolve();
        },
        createOrder: function (data, actions) {
          var shipping = getShippingDetails();
          var items = cart.map(function (item) {
            return {
              name: productFullName(item.product).slice(0, 127),
              unit_amount: {
                currency_code: currency,
                value: Number(item.product.price).toFixed(2),
              },
              quantity: String(item.qty),
              category: "PHYSICAL_GOODS",
            };
          });

          return actions.order.create({
            purchase_units: [
              {
                description: "YINSCENT order",
                amount: {
                  currency_code: currency,
                  value: totals.total.toFixed(2),
                  breakdown: {
                    item_total: {
                      currency_code: currency,
                      value: totals.subtotal.toFixed(2),
                    },
                    shipping: {
                      currency_code: currency,
                      value: totals.shipping.toFixed(2),
                    },
                  },
                },
                items: items,
                shipping: {
                  name: {
                    full_name: shipping.firstName + " " + shipping.lastName,
                  },
                  address: {
                    address_line_1: shipping.address,
                    admin_area_2: shipping.city,
                    postal_code: shipping.postcode,
                    country_code: shipping.country,
                  },
                },
              },
            ],
            payer: {
              email_address: shipping.email,
              name: {
                given_name: shipping.firstName,
                surname: shipping.lastName,
              },
            },
            application_context: {
              brand_name: "YINSCENT",
              shipping_preference: "SET_PROVIDED_ADDRESS",
              user_action: "PAY_NOW",
            },
          });
        },
        onApprove: function (data, actions) {
          if (paypalStatus) paypalStatus.textContent = "Confirming your payment…";
          return actions.order.capture().then(function (details) {
            clearCart();
            var paid =
              details &&
              details.purchase_units &&
              details.purchase_units[0] &&
              details.purchase_units[0].amount
                ? details.purchase_units[0].amount.value
                : totals.total;
            recordOrder(details.id || data.orderID, paid, cart);
            showSuccess(details.id || data.orderID, paid);
            if (paypalStatus) paypalStatus.textContent = "";
          });
        },
        onCancel: function () {
          if (paypalStatus) paypalStatus.textContent = "Payment cancelled. Your cart is still saved.";
        },
        onError: function () {
          if (paypalStatus) {
            paypalStatus.textContent = "Payment failed. Please try again or use another method.";
          }
        },
      })
      .render("#paypal-button-container");
  }

  var cart = loadCart();
  if (!cart.length) {
    if (emptyEl) emptyEl.hidden = false;
    if (formWrap) formWrap.hidden = true;
    return;
  }

  var totals = calcTotals(cart);
  renderSummary(cart, totals);
  loadPayPalSdk(function () {
    initPayPal(cart, totals);
  });
})();
