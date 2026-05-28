// extensions/auxx-chat/assets/boot.js
// Storefront bootstrap for the Auxx Chat app embed block.
// Reads channel + audience inline from the script tag's data-* attributes
// (populated by Liquid from shop metafields auxx.chat_channel_id /
// chat_audience). Identified-customer path mints a JWT via the Shopify
// App Proxy at /apps/auxx-chat/jwt (phase 3).

;(function () {
  var script = document.currentScript
  if (!script) return

  var shop = script.getAttribute('data-shop') || ''
  var channelId = script.getAttribute('data-channel-id') || ''
  var audience = script.getAttribute('data-audience') || 'visitors'
  var customerId = script.getAttribute('data-customer-id') || ''
  var customerEmail = script.getAttribute('data-customer-email') || ''
  if (!shop || !channelId) return

  // Hosted Auxx app. Self-hosting customers would fork the extension; not a v1 concern.
  var AUXX_APP = 'https://app.auxx.ai'
  var hasCustomer = customerId.length > 0

  // Audience gate:
  // - 'visitors' → render anonymous only; skip if logged in
  // - 'users'    → render only when logged in (JWT required)
  // - 'both'     → always render; fetch JWT if logged in
  if (audience === 'visitors' && hasCustomer) return
  if (audience === 'users' && !hasCustomer) return

  var needsJwt = hasCustomer && audience !== 'visitors'

  if (!needsJwt) {
    injectWidget(channelId, null, null)
    return
  }

  // Identified path — mint a JWT via the Shopify App Proxy, same-origin to
  // the merchant storefront. Shopify HMAC-signs the request so the Auxx
  // route can prove which shop the customer belongs to.
  fetch('/apps/auxx-chat/jwt', { credentials: 'include' })
    .then(function (res) {
      if (!res.ok) return null
      if (res.status === 204) return null
      return res.json()
    })
    .then(function (payload) {
      var userJwt = payload && payload.userJwt
      if (audience === 'users' && !userJwt) return
      injectWidget(channelId, userJwt || null, {
        shopify_customer_id: customerId,
        shopify_customer_email: customerEmail || undefined,
        shopify_shop_domain: shop,
      })
    })
    .catch(function () {
      if (audience === 'users') return
      injectWidget(channelId, null, null)
    })

  function injectWidget(channelId, userJwt, attributes) {
    if (document.querySelector('script[data-auxx-chat]')) return
    window.__AUXX_CONFIG__ = Object.assign({}, window.__AUXX_CONFIG__ || {}, {
      apiBase: AUXX_APP,
    })
    if (userJwt) window.__AUXX_CONFIG__.userJwt = userJwt
    if (attributes) {
      window.__AUXX_CONFIG__.attributes = Object.assign(
        {},
        window.__AUXX_CONFIG__.attributes || {},
        attributes
      )
    }
    var s = document.createElement('script')
    s.src = AUXX_APP + '/scripts/chat-widget.js'
    s.async = true
    s.setAttribute('data-auxx-chat', '')
    s.setAttribute('data-channel-id', channelId)
    document.head.appendChild(s)
  }
})()
