// i18n.js — Language toggle logic
// Default language: Chinese (html[lang="zh"])
// CSS handles visibility: html[lang="zh"] [lang="en"] hidden by default,
//   html[lang="en"] [lang="zh"] hidden, html[lang="en"] [lang="en"] visible

(function () {
  var html = document.documentElement;
  var btnZh = document.getElementById('lang-zh');
  var btnEn = document.getElementById('lang-en');

  function setLang(lang) {
    html.setAttribute('lang', lang);
    if (btnZh && btnEn) {
      btnZh.classList.toggle('active', lang === 'zh');
      btnEn.classList.toggle('active', lang === 'en');
    }
    try {
      localStorage.setItem('preferred-lang', lang);
    } catch (e) { /* localStorage unavailable */ }
  }

  if (btnZh) {
    btnZh.addEventListener('click', function () { setLang('zh'); });
  }
  if (btnEn) {
    btnEn.addEventListener('click', function () { setLang('en'); });
  }

  // Restore saved preference
  try {
    var saved = localStorage.getItem('preferred-lang');
    if (saved && (saved === 'zh' || saved === 'en')) {
      setLang(saved);
    }
  } catch (e) { /* localStorage unavailable */ }
})();
