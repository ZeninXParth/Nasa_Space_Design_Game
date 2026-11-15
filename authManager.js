// =========================================================================
// Horizon-X | NASA Space Design Game
// Firebase Authentication & Astronaut Call-Sign Manager
// =========================================================================

class AuthManager {
  constructor() {
    this.auth = null;
    this.currentUser = null;
    this.storageKey = 'nasa_operator_name';
    this.operatorName = this.loadSavedCallSign();
    this.authListeners = [];

    // Bindings
    this.init();
  }

  loadSavedCallSign() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved && saved.trim()) return saved.trim();
    } catch (e) {}
    // Default fallback call sign
    return 'Commander_' + Math.floor(100 + Math.random() * 900);
  }

  init() {
    // Wait for DOM & Firebase
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    this.bindDomEvents();
    this.updateAllNameDisplays();
    this.connectFirebaseAuth();
  }

  connectFirebaseAuth() {
    let retries = 0;
    const checkAuth = () => {
      if (window.firebaseAuth && window.onAuthStateChanged) {
        this.auth = window.firebaseAuth;
        window.onAuthStateChanged(this.auth, (user) => {
          this.handleAuthStateChanged(user);
        });
        console.log('[AUTH MANAGER] Connected to Firebase Auth!');
      } else if (retries < 30) {
        retries++;
        setTimeout(checkAuth, 120);
      } else {
        console.warn('[AUTH MANAGER] Firebase Auth SDK not detected. Operating in local Call-Sign mode.');
      }
    };
    checkAuth();
  }

  handleAuthStateChanged(user) {
    this.currentUser = user;
    if (user) {
      console.log('[AUTH MANAGER] User authenticated:', user.email, user.displayName);
      const chosenName = user.displayName || (user.email ? user.email.split('@')[0] : this.operatorName);
      this.setPlayerName(chosenName, false);
      this.renderAuthStatusUI(true, user);
    } else {
      console.log('[AUTH MANAGER] Guest operator mode (signed out).');
      this.renderAuthStatusUI(false, null);
    }
    this.authListeners.forEach(cb => {
      try { cb(user); } catch (e) {}
    });
  }

  setPlayerName(newName, saveToStorage = true) {
    const clean = (newName || '').trim();
    if (!clean) return;

    this.operatorName = clean;
    if (saveToStorage) {
      try {
        localStorage.setItem(this.storageKey, clean);
      } catch (e) {}
    }

    // Sync with Game State
    if (window.getNasaGameState) {
      const gs = window.getNasaGameState();
      if (gs) {
        gs.operatorName = clean;
        gs.elecOperatorName = clean;
      }
    }

    // Sync with Multiplayer Relay Manager
    if (window.multiplayerManager) {
      window.multiplayerManager.localPlayerName = clean;
    }

    // Update all UI elements
    this.updateAllNameDisplays();
  }

  updateAllNameDisplays() {
    const name = this.operatorName;

    // 1. Main Menu Badge
    const elMenuName = document.getElementById('operatorNameDisplay');
    if (elMenuName) elMenuName.textContent = name;

    // 2. HUD Badges
    const elHudName = document.getElementById('hudOperatorNameDisplay');
    if (elHudName) elHudName.textContent = name;

    // 3. Multiplayer Inputs (Join & Create)
    const elJoinInput = document.getElementById('joinPlayerNameInput');
    if (elJoinInput && document.activeElement !== elJoinInput) elJoinInput.value = name;

    const elCreateInput = document.getElementById('createPlayerNameInput');
    if (elCreateInput && document.activeElement !== elCreateInput) elCreateInput.value = name;

    const elSettingsName = document.getElementById('settingPlayerName');
    if (elSettingsName && document.activeElement !== elSettingsName) elSettingsName.value = name;

    // 4. Modal Call Sign Input
    const elModalInput = document.getElementById('authCallSignInput');
    if (elModalInput && document.activeElement !== elModalInput) elModalInput.value = name;

    // 5. Desk Check-In Input Terminals (if rendered)
    const elDesk01 = document.getElementById('inputOperatorName');
    if (elDesk01) elDesk01.value = name;

    const elDesk02 = document.getElementById('inputOperatorNameElec');
    if (elDesk02) elDesk02.value = name;
  }

  renderAuthStatusUI(isLoggedIn, user) {
    const statusPill = document.getElementById('authStatusPill');
    const userCard = document.getElementById('authLoggedInCard');
    const formCard = document.getElementById('authFormsContainer');
    const avatarIcon = document.getElementById('operatorAvatarEl');
    const rankTag = document.getElementById('operatorRankTag');

    if (isLoggedIn && user) {
      if (statusPill) {
        statusPill.className = 'auth-status-pill verified';
        statusPill.innerHTML = '<span class="status-dot green"></span> VERIFIED GSFC ASTRONAUT';
      }
      if (rankTag) rankTag.textContent = 'VERIFIED OPERATOR';
      if (userCard) {
        userCard.classList.remove('hidden');
        const userEmail = document.getElementById('authUserEmail');
        const userUid = document.getElementById('authUserUid');
        if (userEmail) userEmail.textContent = user.email || 'Google Account';
        if (userUid) userUid.textContent = `GSFC-ID: ${user.uid.substring(0, 10)}...`;
      }
      if (formCard) formCard.classList.add('hidden');
      if (avatarIcon && user.photoURL) {
        avatarIcon.innerHTML = `<img src="${user.photoURL}" alt="Avatar" class="avatar-img-circle">`;
      }
    } else {
      if (statusPill) {
        statusPill.className = 'auth-status-pill guest';
        statusPill.innerHTML = '<span class="status-dot yellow"></span> GUEST OPERATOR [CALL SIGN ACTIVE]';
      }
      if (rankTag) rankTag.textContent = 'CALL SIGN ACTIVE';
      if (userCard) userCard.classList.add('hidden');
      if (formCard) formCard.classList.remove('hidden');
      if (avatarIcon) avatarIcon.innerHTML = '👨‍🚀';
    }
  }

  // --- Firebase Actions ---
  async signInWithGoogle() {
    if (!this.auth || !window.GoogleAuthProvider || !window.signInWithPopup) {
      this.showAuthError('Firebase Auth SDK is still initializing or offline. You can still set your Call Sign above!');
      return;
    }
    try {
      this.clearAuthError();
      const provider = new window.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const res = await window.signInWithPopup(this.auth, provider);
      const user = res.user;
      this.showAuthToast(`Welcome aboard, Commander ${user.displayName || user.email}!`);
      this.closeModal();
    } catch (err) {
      console.warn('[AUTH ERROR Google]:', err);
      let msg = err.message || 'Google Sign-In failed.';
      if (err.code === 'auth/popup-closed-by-user') {
        msg = 'Sign-in cancelled by user.';
      } else if (err.code === 'auth/operation-not-allowed') {
        msg = 'Google Sign-In is not enabled in Firebase Console yet. Please use Call Sign or Email sign-in!';
      }
      this.showAuthError(msg);
    }
  }

  async signInWithEmail(email, password) {
    if (!this.auth || !window.signInWithEmailAndPassword) {
      this.showAuthError('Firebase Auth is offline. Please use direct Call Sign!');
      return;
    }
    if (!email || !password) {
      this.showAuthError('Please enter both email and password.');
      return;
    }
    try {
      this.clearAuthError();
      const res = await window.signInWithEmailAndPassword(this.auth, email, password);
      this.showAuthToast(`Signed in as ${res.user.email}!`);
      this.closeModal();
    } catch (err) {
      console.warn('[AUTH ERROR Email]:', err);
      this.showAuthError(err.message || 'Failed to sign in.');
    }
  }

  async registerWithEmail(email, password, displayName) {
    if (!this.auth || !window.createUserWithEmailAndPassword) {
      this.showAuthError('Firebase Auth is offline. Please use direct Call Sign!');
      return;
    }
    if (!email || !password) {
      this.showAuthError('Please provide an email and a secure password (min 6 chars).');
      return;
    }
    try {
      this.clearAuthError();
      const res = await window.createUserWithEmailAndPassword(this.auth, email, password);
      if (displayName && window.updateProfile) {
        await window.updateProfile(res.user, { displayName });
      }
      this.showAuthToast(`Astronaut credentials created for ${email}!`);
      this.closeModal();
    } catch (err) {
      console.warn('[AUTH ERROR Register]:', err);
      this.showAuthError(err.message || 'Registration failed.');
    }
  }

  async signOut() {
    if (this.auth && window.signOut) {
      try {
        await window.signOut(this.auth);
        this.showAuthToast('Signed out of NASA operator account.');
      } catch (err) {
        console.warn('Sign out error:', err);
      }
    }
  }

  // --- Modal Helpers ---
  openModal() {
    const modal = document.getElementById('modalAuthProfile');
    if (modal) {
      modal.classList.remove('hidden');
      modal.setAttribute('aria-hidden', 'false');
      const input = document.getElementById('authCallSignInput');
      if (input) {
        input.value = this.operatorName;
        setTimeout(() => input.focus(), 100);
      }
      this.clearAuthError();
    }
  }

  closeModal() {
    const modal = document.getElementById('modalAuthProfile');
    if (modal) {
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  showAuthError(msg) {
    const errBox = document.getElementById('authErrorMessage');
    if (errBox) {
      errBox.textContent = msg;
      errBox.classList.remove('hidden');
    }
  }

  clearAuthError() {
    const errBox = document.getElementById('authErrorMessage');
    if (errBox) {
      errBox.textContent = '';
      errBox.classList.add('hidden');
    }
  }

  showAuthToast(msg) {
    if (window.showCenterCalmAlert) {
      window.showCenterCalmAlert('GSFC AUTHENTICATION', msg, '👨‍🚀');
    } else {
      alert(msg);
    }
  }

  bindDomEvents() {
    // 1. Open Modal Triggers
    const btnOpenMain = document.getElementById('btnOpenAuthModal');
    if (btnOpenMain) btnOpenMain.addEventListener('click', () => this.openModal());

    const btnOpenHud = document.getElementById('btnOpenAuthModalHud');
    if (btnOpenHud) btnOpenHud.addEventListener('click', () => this.openModal());

    const btnClose = document.getElementById('btnCloseAuthModal');
    if (btnClose) btnClose.addEventListener('click', () => this.closeModal());

    // 2. Save Call Sign Button
    const btnSaveCallSign = document.getElementById('btnSaveCallSign');
    const inputCallSign = document.getElementById('authCallSignInput');
    if (btnSaveCallSign && inputCallSign) {
      const doSave = () => {
        const val = inputCallSign.value.trim();
        if (val) {
          this.setPlayerName(val, true);
          this.showAuthToast(`Call Sign updated to "${val}"!`);
          this.closeModal();
        } else {
          this.showAuthError('Call Sign cannot be empty.');
        }
      };
      btnSaveCallSign.addEventListener('click', doSave);
      inputCallSign.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') doSave();
      });
    }

    // 3. Google Sign-In
    const btnGoogle = document.getElementById('btnGoogleSignIn');
    if (btnGoogle) {
      btnGoogle.addEventListener('click', () => this.signInWithGoogle());
    }

    // 4. Email Auth Forms
    const btnEmailLogin = document.getElementById('btnEmailSignIn');
    const btnEmailRegister = document.getElementById('btnEmailRegister');
    const emailField = document.getElementById('authEmailInput');
    const passField = document.getElementById('authPasswordInput');

    if (btnEmailLogin) {
      btnEmailLogin.addEventListener('click', () => {
        const email = emailField ? emailField.value.trim() : '';
        const pass = passField ? passField.value : '';
        this.signInWithEmail(email, pass);
      });
    }

    if (btnEmailRegister) {
      btnEmailRegister.addEventListener('click', () => {
        const email = emailField ? emailField.value.trim() : '';
        const pass = passField ? passField.value : '';
        const name = inputCallSign ? inputCallSign.value.trim() : '';
        this.registerWithEmail(email, pass, name);
      });
    }

    // 5. Sign Out
    const btnSignOut = document.getElementById('btnAuthSignOut');
    if (btnSignOut) {
      btnSignOut.addEventListener('click', () => this.signOut());
    }

    // 6. Multiplayer Room Name Inputs (Auto-sync)
    const syncMultiplayerInput = (inputEl) => {
      if (!inputEl) return;
      inputEl.value = this.operatorName;
      inputEl.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        if (val) this.setPlayerName(val, true);
      });
      inputEl.addEventListener('change', (e) => {
        const val = e.target.value.trim();
        if (val) this.setPlayerName(val, true);
      });
    };

    syncMultiplayerInput(document.getElementById('joinPlayerNameInput'));
    syncMultiplayerInput(document.getElementById('createPlayerNameInput'));
  }
}

// Global Export
window.authManager = new AuthManager();
