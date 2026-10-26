/* 白鬍子 site.js
   1. 選單：只顯示大主題，點下去才展開子主題（手機＋電腦都一樣）
   2. 按鈕／卡片：點擊漣漪、滑鼠 3D 傾斜、游標高光
   3. 捲動進場動畫、頁首捲動陰影
   沒有任何外部套件。 */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var desktop = window.matchMedia('(min-width:901px)');

  /* 瀏覽器頂端顏色，跟著深淺色模式走 */
  var tc = d.querySelector('meta[name="theme-color"]');
  if (tc) tc.setAttribute('content', window.matchMedia('(prefers-color-scheme: dark)').matches ? '#151112' : '#e9e5e3');

  /* ---------- 1. 選單 ---------- */
  var burger = d.querySelector('.burger');
  var menu = d.getElementById('menu');
  var items = [].slice.call(d.querySelectorAll('#menu > ul > li'));
  var here = (location.pathname.split('/').pop() || 'index.html');

  function setOpen(li, on) {
    li.classList.toggle('open', on);
    var a = li.querySelector(':scope > a');
    if (a) a.setAttribute('aria-expanded', on ? 'true' : 'false');
  }
  function closeAll(except) {
    items.forEach(function (li) {
      if (li !== except && li.classList.contains('open')) setOpen(li, false);
    });
  }
  function setMenu(on) {
    if (!menu || !burger) return;
    menu.classList.toggle('open', on);
    burger.setAttribute('aria-expanded', on ? 'true' : 'false');
    burger.setAttribute('aria-label', on ? '關閉選單' : '開啟選單');
    d.body.classList.toggle('lock', on && !desktop.matches);
    if (!on) closeAll();
  }

  items.forEach(function (li, i) {
    var a = li.querySelector(':scope > a');
    var sub = li.querySelector(':scope > ul');
    if (!a || !sub) return;
    li.classList.add('has-sub');
    sub.id = sub.id || 'sub-' + i;
    a.setAttribute('aria-haspopup', 'true');
    a.setAttribute('aria-expanded', 'false');
    a.setAttribute('aria-controls', sub.id);

    /* 大主題本身也是一頁，所以在子選單最上面補一個「XX總覽」，頁面才進得去 */
    var href = a.getAttribute('href');
    var has = [].some.call(sub.querySelectorAll('a'), function (x) { return x.getAttribute('href') === href; });
    if (!has) {
      var ov = d.createElement('li');
      ov.className = 'ov';
      var oa = d.createElement('a');
      oa.href = href;
      oa.textContent = a.textContent.trim() + '總覽';
      ov.appendChild(oa);
      sub.insertBefore(ov, sub.firstChild);
    }

    /* 目前所在頁面的子連結亮起來 */
    [].forEach.call(sub.querySelectorAll('a'), function (x) {
      if (x.getAttribute('href') === here) x.setAttribute('aria-current', 'page');
    });

    a.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      e.preventDefault();
      var on = !li.classList.contains('open');
      closeAll(li);
      setOpen(li, on);
    });
  });

  if (burger) burger.addEventListener('click', function () {
    setMenu(burger.getAttribute('aria-expanded') !== 'true');
  });

  /* 點到子連結或「刊登廣告」就收起選單；點選單外面收起子選單 */
  d.addEventListener('click', function (e) {
    var t = e.target;
    if (!(t.closest && t.closest('.has-sub'))) closeAll();
    if (menu && menu.classList.contains('open') && t.closest) {
      var link = t.closest('#menu a');
      if (link && !link.parentNode.classList.contains('has-sub')) setMenu(false);
      else if (!t.closest('#menu') && !t.closest('.burger')) setMenu(false);
    }
  });
  d.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeAll(); setMenu(false); }
  });
  var onMq = function () { if (desktop.matches) setMenu(false); };
  if (desktop.addEventListener) desktop.addEventListener('change', onMq); else desktop.addListener(onMq);

  /* ---------- 2. 點擊漣漪 ---------- */
  if (!reduce) {
    d.addEventListener('pointerdown', function (e) {
      var t = e.target.closest && e.target.closest('.btn,.chip,.tile,.tabbar a,.burger,#menu a');
      if (!t) return;
      var r = t.getBoundingClientRect();
      var s = Math.max(r.width, r.height) * 2;
      var sp = d.createElement('span');
      sp.className = 'rip';
      sp.style.cssText = 'width:' + s + 'px;height:' + s + 'px;left:' + (e.clientX - r.left - s / 2) + 'px;top:' + (e.clientY - r.top - s / 2) + 'px';
      t.appendChild(sp);
      setTimeout(function () { if (sp.parentNode) sp.parentNode.removeChild(sp); }, 700);
    }, { passive: true });
  }

  /* ---------- 3. 滑鼠 3D 傾斜＋高光（只在有滑鼠的裝置） ---------- */
  if (!reduce && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    [].forEach.call(d.querySelectorAll('.card,.tile,.shot'), function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        var k = r.width > 520 ? 3 : 7;           /* 越大的卡片傾斜越小，避免晃得頭暈 */
        el.style.setProperty('--ry', ((x - .5) * k).toFixed(2) + 'deg');
        el.style.setProperty('--rx', ((.5 - y) * k).toFixed(2) + 'deg');
        el.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
        el.classList.add('tilt');
      });
      el.addEventListener('pointerleave', function () {
        el.classList.remove('tilt');
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ---------- 4. 捲動進場＋頁首陰影 ---------- */
  var hd = d.querySelector('header.site');
  if (hd) {
    var onScroll = function () { hd.classList.toggle('scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  if (!reduce && 'IntersectionObserver' in window) {
    var targets = d.querySelectorAll('.sec-head,.card,.tile,.steps li,.lessons li,.split > *,.cta,.adrow .ad,.sponsors .ad,.chips');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        io.unobserve(el);
        var sibs = el.parentNode ? [].slice.call(el.parentNode.children) : [];
        var idx = Math.max(0, sibs.indexOf(el));
        el.style.transitionDelay = Math.min(idx, 5) * 70 + 'ms';
        el.classList.add('in');
        setTimeout(function () { el.style.transitionDelay = ''; }, 1100);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    [].forEach.call(targets, function (el) { el.classList.add('rv'); io.observe(el); });
  }
})();
