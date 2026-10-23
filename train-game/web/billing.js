'use strict';
/*
 * Мост к Google Play Billing.
 * В Android-приложении MainActivity регистрирует window.AndroidBilling и
 * присылает события через window.__billing.*. В обычном браузере работает
 * демо-режим, чтобы игру можно было проверить без телефона.
 */
window.Billing = (function () {
  const native = window.AndroidBilling || null;
  const listeners = [];
  const state = {
    native: !!native,
    premium: false,
    products: [],   // [{planId, price, period, trial}]
    message: null,  // {text, error}
  };

  function readDemo() {
    try { return localStorage.getItem('cc_demo_premium') === '1'; } catch (e) { return false; }
  }
  function writeDemo(v) {
    try { v ? localStorage.setItem('cc_demo_premium', '1') : localStorage.removeItem('cc_demo_premium'); } catch (e) { /* no storage */ }
  }
  function emit() { listeners.forEach((fn) => fn(state)); }
  function setMessage(text, error) { state.message = text ? { text, error: !!error } : null; emit(); }

  // Колбэки из Kotlin (BillingManager.kt)
  window.__billing = {
    onState(s) {
      const was = state.premium;
      state.premium = !!s.premium;
      if (s.pending) setMessage('Платёж ожидает подтверждения. Доступ откроется сразу после оплаты.');
      else if (s.restored) setMessage(state.premium ? 'Подписка восстановлена.' : 'Активная подписка не найдена.', !state.premium);
      else emit();
      if (!was && state.premium && s.fresh) listeners.forEach((fn) => fn(state, 'purchased'));
    },
    onProducts(list) { state.products = list || []; emit(); },
    onCancel() { setMessage(null); },
    onError(msg) { setMessage(msg || 'Не удалось связаться с Google Play. Попробуйте позже.', true); },
  };

  function init() {
    if (native) {
      native.refresh();
    } else {
      state.premium = readDemo();
      state.products = [
        { planId: 'yearly', price: '1 490 ₽', period: 'P1Y', trial: 'P7D' },
        { planId: 'monthly', price: '199 ₽', period: 'P1M', trial: null },
      ];
      emit();
    }
  }

  function purchase(planId) {
    setMessage(null);
    if (native) { native.purchase(planId); return; }
    // Демо: имитируем успешную покупку
    setTimeout(() => {
      writeDemo(true);
      window.__billing.onState({ premium: true, fresh: true });
    }, 500);
  }

  function restore() {
    setMessage(null);
    if (native) { native.restore(); return; }
    window.__billing.onState({ premium: readDemo(), restored: true });
  }

  function manage() {
    if (native) native.manage();
    else window.open('https://play.google.com/store/account/subscriptions', '_blank');
  }

  function resetDemo() {
    if (native) return;
    writeDemo(false);
    state.premium = false;
    emit();
  }

  return {
    init, purchase, restore, manage, resetDemo,
    get state() { return state; },
    onChange(fn) { listeners.push(fn); },
  };
})();
