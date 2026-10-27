/* 白鬍子｜文章系統（這個檔案不需要修改）
   讀取 articles-data.js，自動產生：
   1. 各處的文章卡片（首頁、專欄文章、主題頁的相關文章）
   2. 系列文章目錄
   3. 單篇文章頁：article.html?id=文章代號 */
(function () {
  'use strict';
  var D = window.ARTICLES_DATA || {}, SITE = D.site || {}, SERIES = D.series || {};
  var ALL = (D.articles || []).filter(function (a) { return a && a.id && a.title && !a.draft; });
  var SHOW = SITE.showEmptySlots !== false;
  var NAME = SITE.name || '白鬍子';
  var each = function (sel, fn, root) { [].forEach.call((root || document).querySelectorAll(sel), fn); };

  /* ---------- 小工具 ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function safe(u) { u = String(u || '').trim(); return /^(javascript|data|vbscript):/i.test(u) ? '' : u; }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function find(id) { for (var i = 0; i < ALL.length; i++) if (ALL[i].id === id) return ALL[i]; return null; }
  function href(a) { return 'article.html?id=' + encodeURIComponent(a.id); }
  function latest() {
    return ALL.map(function (a, i) { return [a, i]; }).sort(function (x, y) {
      var d = String(y[0].date || '').localeCompare(String(x[0].date || ''));
      return d || x[1] - y[1];
    }).map(function (p) { return p[0]; });
  }
  function seriesOf(a) {
    for (var k in SERIES) {
      var ids = (SERIES[k].ids || []).filter(find);
      var i = ids.indexOf(a.id);
      if (i > -1) return { key: k, s: SERIES[k], ids: ids, i: i };
    }
    return null;
  }

  /* ---------- 卡片 ---------- */
  function thumb(a, ratio) {
    var c = safe(a.cover);
    return '<div class="thumb">' + (c
      ? '<img src="' + esc(c) + '" alt="' + esc(a.coverAlt || a.title) + '" loading="lazy" decoding="async">'
      : '<div class="ph img" style="aspect-ratio:' + (ratio || '3/2') + '">【文章封面】</div>') + '</div>';
  }
  function card(a) {
    return '<a class="card media" href="' + href(a) + '">' + thumb(a) + '<div class="body"><p class="meta">' +
      (a.category ? '<span class="tag">' + esc(a.category) + '</span>' : '') +
      (a.date ? '<span>' + esc(a.date) + '</span>' : '') + '</p><h3>' + esc(a.title) + '</h3>' +
      '<p class="sum">' + esc(a.summary || '') + '</p><span class="go">閱讀全文</span></div></a>';
  }
  function emptyCard(n) {
    return '<div class="card media empty" aria-hidden="true"><div class="thumb"><div class="ph img" style="aspect-ratio:3/2">【文章 ' + pad(n) + ' 封面 900×600】</div></div>' +
      '<div class="body"><p class="meta"><span class="ph t">【分類】</span><span class="ph t">【日期】</span></p><h3>【文章 ' + pad(n) + ' 標題】</h3>' +
      '<p class="ph block">【文章摘要 40～60 字】</p></div></div>';
  }
  function pager(el, page, pages, base) {
    if (!el) return;
    if (pages < 2) { el.innerHTML = ''; return; }
    var u = function (p) { return base + (p > 1 ? '?page=' + p : ''); }, h = '';
    if (page > 1) h += '<a class="btn line" href="' + u(page - 1) + '">上一頁</a>';
    for (var p = 1; p <= pages; p++) h += '<a class="chip"' + (p === page ? ' aria-current="page"' : '') + ' href="' + u(p) + '">' + p + '</a>';
    if (page < pages) h += '<a class="btn blue" href="' + u(page + 1) + '">下一頁</a>';
    el.innerHTML = h;
  }

  /* ---------- 1. 文章卡片區塊 ---------- */
  each('[data-articles]', function (box) {
    var cat = box.getAttribute('data-category'), limit = +box.getAttribute('data-limit') || 0, per = +box.getAttribute('data-per') || 0;
    var items = latest();
    if (cat) {
      var cats = cat.split('|');
      items = items.filter(function (a) { return cats.indexOf(a.category) > -1; })
        .concat(items.filter(function (a) { return cats.indexOf(a.category) < 0; }));
    }
    var total = items.length, page = 1, pages = 1, slots = limit || per, html = '';
    if (per) {
      pages = Math.max(1, Math.ceil(total / per));
      page = Math.min(pages, Math.max(1, parseInt(new URLSearchParams(location.search).get('page'), 10) || 1));
      items = items.slice((page - 1) * per, page * per);
    } else if (limit) items = items.slice(0, limit);
    items.forEach(function (a) { html += card(a); });
    if (SHOW && page === 1 && slots && items.length < slots) for (var n = items.length; n < slots; n++) html += emptyCard(n + 1);
    if (!html) {
      if (box.hasAttribute('data-hide-empty')) { var sec = box.closest('section'); if (sec) sec.hidden = true; }
      else html = '<p class="muted">文章即將上架，敬請期待。</p>';
    }
    box.innerHTML = html;
    var nx = box.nextElementSibling;
    if (nx && nx.hasAttribute('data-pager')) pager(nx, page, pages, location.pathname);
  });

  /* ---------- 2. 系列文章目錄 ---------- */
  each('[data-series]', function (ol) {
    var S = SERIES[ol.getAttribute('data-series')] || {}, slots = +ol.getAttribute('data-slots') || 10, h = '', n = 0;
    (S.ids || []).forEach(function (id) {
      var a = find(id);
      if (a) { n++; h += '<li><a href="' + href(a) + '"><div><h3>' + esc(a.title) + '</h3><p class="sum">' + esc(a.summary || '') + '</p></div></a></li>'; }
    });
    if (SHOW) for (; n < slots; n++) h += '<li class="empty"><a href="#" tabindex="-1" aria-hidden="true"><div><h3>【第 ' + (n + 1) + ' 篇標題】</h3><p class="ph block">【一句話摘要】</p></div></a></li>';
    ol.innerHTML = h || '<li class="muted">系列文章即將上架，敬請期待。</li>';
  });
  each('[data-series-title]', function (e) { var S = SERIES[e.getAttribute('data-series-title')]; if (S && S.title) e.textContent = S.title; });
  each('[data-series-desc]', function (e) { var S = SERIES[e.getAttribute('data-series-desc')]; if (S && S.desc) { e.className = ''; e.textContent = S.desc; } });
  each('[data-series-cover]', function (e) {
    var S = SERIES[e.getAttribute('data-series-cover')], c = S && safe(S.cover);
    if (c) e.outerHTML = '<img src="' + esc(c) + '" alt="' + esc(S.title || '') + '" style="width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:22px">';
  });

  /* ---------- 3. 單篇文章：內容排版（簡易 Markdown） ---------- */
  function inline(s) {
    s = esc(s).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    return s.replace(/\[([^\]]+)\]\(([^)\s|]+)(\|sponsored)?\)/g, function (m, t, u, sp) {
      u = safe(u.replace(/&amp;/g, '&'));
      if (!u) return t;
      var ext = /^https?:/i.test(u);
      return '<a href="' + esc(u) + '"' + (ext ? ' target="_blank"' : '') + ' rel="' + (sp ? 'sponsored ' : '') + 'noopener">' + t + '</a>';
    });
  }
  function block(b) {
    if (!b) return '';
    var lines = b.split('\n'), m;
    if ((m = lines[0].match(/^(#{2,3})\s+(.+)$/)))
      return '<h' + m[1].length + '>' + inline(m[2]) + '</h' + m[1].length + '>' + (lines.length > 1 ? block(lines.slice(1).join('\n').trim()) : '');
    if (/^---+$/.test(b)) return '<hr>';
    if ((m = b.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/)))
      return '<figure><img src="' + esc(safe(m[2])) + '" alt="' + esc(m[1]) + '" loading="lazy" decoding="async">' + (m[1] ? '<figcaption>' + esc(m[1]) + '</figcaption>' : '') + '</figure>';
    var all = function (re) { return lines.every(function (l) { return re.test(l); }); };
    if (all(/^[-*]\s+/)) return '<ul>' + lines.map(function (l) { return '<li>' + inline(l.replace(/^[-*]\s+/, '')) + '</li>'; }).join('') + '</ul>';
    if (all(/^\d+[.)]\s+/)) return '<ol>' + lines.map(function (l) { return '<li>' + inline(l.replace(/^\d+[.)]\s+/, '')) + '</li>'; }).join('') + '</ol>';
    if (all(/^>/)) return '<blockquote>' + lines.map(function (l) { return inline(l.replace(/^>\s?/, '')); }).join('<br>') + '</blockquote>';
    if (/^!!\s+/.test(b)) return '<div class="note">' + inline(b.replace(/^!!\s+/, '')).replace(/\n/g, '<br>') + '</div>';
    return '<p>' + lines.map(inline).join('<br>') + '</p>';
  }
  function markdown(src) {
    return String(src || '').replace(/\r/g, '').trim().split(/\n[ \t]*\n/).map(function (b) { return block(b.trim()); }).join('');
  }

  /* ---------- 4. 單篇文章頁 ---------- */
  var root = document.getElementById('article-root');
  if (root) {
    var id = new URLSearchParams(location.search).get('id'), a = find(id);
    if (!a) {
      document.title = '找不到文章｜' + NAME;
      root.innerHTML = '<section class="sec"><div class="wrap post"><h1>找不到這篇文章</h1><p>這篇文章可能已經移除，或網址有誤。</p><p><a class="btn blue" href="articles.html">回文章列表</a></p></div></section>';
    } else {
      var ser = seriesOf(a), list = ser ? ser.ids.map(find) : latest(), i = list.indexOf(a);
      var prev = list[i - 1], next = list[i + 1];
      var text = String(a.body || '').replace(/[#>*!\-\[\]\(\)`]/g, ''), mins = Math.max(1, Math.round(text.length / 450));
      var pn = function (x, label, cls) {
        return x ? '<a class="' + cls + '" href="' + href(x) + '"><small>' + label + '</small><b>' + esc(x.title) + '</b></a>' : '<span></span>';
      };
      var rel = latest().filter(function (x) { return x !== a; });
      rel = rel.filter(function (x) { return x.category === a.category; }).concat(rel.filter(function (x) { return x.category !== a.category; })).slice(0, 3);
      var c = safe(a.cover);
      root.innerHTML =
        '<article class="wrap post" style="padding:28px 20px 56px">' +
        '<p class="crumb muted"><a href="index.html">首頁</a> / <a href="articles.html">專欄文章</a> / ' + esc(a.title) + '</p>' +
        '<p class="meta">' + (a.category ? '<span class="tag">' + esc(a.category) + '</span>' : '') +
        (a.date ? '<span>' + esc(a.date) + '</span>' : '') + '<span>約 ' + mins + ' 分鐘閱讀</span></p>' +
        '<h1>' + esc(a.title) + '</h1>' +
        (a.summary ? '<p class="lead">' + esc(a.summary) + '</p>' : '') +
        (c ? '<figure class="cover"><img src="' + esc(c) + '" alt="' + esc(a.coverAlt || a.title) + '" decoding="async"></figure>' : '') +
        (ser ? '<aside class="card seriesbox"><b>' + esc(ser.s.title || '系列文章') + '</b><span>第 ' + (ser.i + 1) + ' 篇，共 ' + ser.ids.length + ' 篇</span></aside>' : '') +
        '<div class="post-body">' + markdown(a.body) + '</div>' +
        '<nav class="pn" aria-label="上下篇">' + pn(prev, ser ? '上一篇' : '較新文章', 'prevn') + pn(next, ser ? '下一篇' : '較舊文章', 'nextn') + '</nav>' +
        '<p><a class="btn line" href="' + (ser ? 'series-' + ser.key + '.html' : 'articles.html') + '">' + (ser ? '回系列目錄' : '回文章列表') + '</a></p>' +
        '</article>' +
        (rel.length ? '<section class="sec alt"><div class="wrap"><div class="sec-head"><div><h2>延伸閱讀</h2></div><a class="more" href="articles.html">更多文章</a></div><div class="grid g3">' + rel.map(card).join('') + '</div></div></section>' : '');

      /* 網頁標題、搜尋描述、分享資訊、結構化資料 */
      document.title = a.title + '｜' + NAME;
      var meta = function (sel, v) { var m = document.querySelector(sel); if (m) m.setAttribute('content', v); };
      var url = location.origin + location.pathname + '?id=' + encodeURIComponent(a.id);
      meta('meta[name="description"]', a.summary || '');
      meta('meta[property="og:title"]', a.title);
      meta('meta[property="og:description"]', a.summary || '');
      meta('meta[property="og:url"]', url);
      if (c) meta('meta[property="og:image"]', new URL(c, location.href).href);
      var cn = document.createElement('link'); cn.rel = 'canonical'; cn.href = url; document.head.appendChild(cn);
      var ld = { '@context': 'https://schema.org', '@type': 'Article', headline: a.title, description: a.summary || undefined,
        image: c ? new URL(c, location.href).href : undefined, datePublished: a.date || undefined, dateModified: a.updated || a.date || undefined,
        author: { '@type': 'Person', name: a.author || SITE.author || NAME }, publisher: { '@type': 'Organization', name: NAME }, mainEntityOfPage: url };
      var sc = document.createElement('script'); sc.type = 'application/ld+json'; sc.textContent = JSON.stringify(ld); document.head.appendChild(sc);
    }
  }
})();
