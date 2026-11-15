/**
 * Horizon-X: NASA Space Design Game
 * E2E Test Harness & Browser Emulation Environment
 * 
 * Standalone pure Node.js test environment:
 * - Emulates DOM, HTML5 Canvas, LocalStorage, Web Audio API, and Three.js
 * - Real DOM tree extraction from `index.html`
 * - Simulated Socket.io multiplayer relay & packet interceptor
 * - Authoritative NASA Space Apps Horizon-X Specification Oracle
 */

const fs = require('node:fs');
const path = require('node:path');

// =========================================================================
// 1. LIGHTWEIGHT DOM EMULATION
// =========================================================================

class MockClassList {
  constructor(initial = '') {
    this.classes = new Set(
      initial
        ? initial.split(/\s+/).filter(Boolean)
        : []
    );
  }
  add(...names) {
    names.forEach(n => n && this.classes.add(n));
  }
  remove(...names) {
    names.forEach(n => this.classes.delete(n));
  }
  contains(name) {
    return this.classes.has(name);
  }
  toggle(name, force) {
    if (force !== undefined) {
      if (force) this.classes.add(name);
      else this.classes.delete(name);
      return force;
    }
    if (this.classes.has(name)) {
      this.classes.delete(name);
      return false;
    } else {
      this.classes.add(name);
      return true;
    }
  }
  set(str) {
    this.classes = new Set(str.split(/\s+/).filter(Boolean));
  }
  get value() {
    return Array.from(this.classes).join(' ');
  }
  toString() {
    return this.value;
  }
}

class MockElement {
  constructor(tagName = 'div', id = '', classNames = '') {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.classList = new MockClassList(classNames);
    this.style = {};
    this.attributes = {};
    this.children = [];
    this.parentNode = null;
    this._textContent = '';
    this.value = '';
    this.disabled = false;
    this.listeners = {};
    this.dataset = {};
    this.clientWidth = 800;
    this.clientHeight = 600;
  }

  get textContent() {
    if (this.children.length === 0) return this._textContent;
    return this.children.map(c => c.textContent).join(' ');
  }

  set textContent(val) {
    this._textContent = String(val);
    this.children = [];
  }

  get innerText() {
    return this.textContent;
  }

  set innerText(val) {
    this.textContent = val;
  }

  get innerHTML() {
    if (this.children.length === 0) return this._textContent;
    return this.children.map(c => c.outerHTML).join('');
  }

  set innerHTML(htmlStr) {
    this.children = [];
    this._textContent = '';
    if (!htmlStr) return;
    parseHtmlFragment(htmlStr, this);
  }

  get outerHTML() {
    const classAttr = this.classList.value ? ` class="${this.classList.value}"` : '';
    const idAttr = this.id ? ` id="${this.id}"` : '';
    const disabledAttr = this.disabled ? ' disabled' : '';
    const attrs = Object.entries(this.attributes)
      .filter(([k]) => k !== 'id' && k !== 'class' && k !== 'disabled')
      .map(([k, v]) => ` ${k}="${v}"`)
      .join('');
    return `<${this.tagName.toLowerCase()}${idAttr}${classAttr}${disabledAttr}${attrs}>${this.innerHTML}</${this.tagName.toLowerCase()}>`;
  }

  addEventListener(event, fn) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }

  removeEventListener(event, fn) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== fn);
  }

  dispatchEvent(event) {
    const type = typeof event === 'string' ? event : event.type;
    const evt = typeof event === 'string' ? { type, target: this, preventDefault: () => {}, stopPropagation: () => {} } : event;
    evt.target = this;
    if (this.listeners[type]) {
      for (const fn of this.listeners[type]) {
        fn.call(this, evt);
      }
    }
    return true;
  }

  click() {
    if (this.disabled) return false;
    return this.dispatchEvent('click');
  }

  setAttribute(k, v) {
    this.attributes[k] = String(v);
    if (k === 'id') this.id = String(v);
    if (k === 'class') this.classList.set(String(v));
    if (k === 'disabled') this.disabled = true;
    if (k.startsWith('data-')) {
      const camel = k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      this.dataset[camel] = String(v);
    }
  }

  getAttribute(k) {
    if (k === 'id') return this.id || null;
    if (k === 'class') return this.classList.value || null;
    if (k === 'disabled') return this.disabled ? '' : null;
    if (k.startsWith('data-')) {
      const camel = k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      return this.dataset[camel] !== undefined ? this.dataset[camel] : null;
    }
    return this.attributes[k] !== undefined ? this.attributes[k] : null;
  }

  removeAttribute(k) {
    delete this.attributes[k];
    if (k === 'disabled') this.disabled = false;
    if (k === 'class') this.classList.set('');
    if (k.startsWith('data-')) {
      const camel = k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      delete this.dataset[camel];
    }
  }

  appendChild(child) {
    if (child.parentNode) child.parentNode.removeChild(child);
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parentNode = null;
    }
    return child;
  }

  getElementById(targetId) {
    if (this.id === targetId) return this;
    for (const child of this.children) {
      const found = child.getElementById(targetId);
      if (found) return found;
    }
    return null;
  }

  querySelector(selector) {
    const all = this.querySelectorAll(selector);
    return all.length > 0 ? all[0] : null;
  }

  querySelectorAll(selector) {
    const results = [];
    const match = createMatcher(selector);
    
    function traverse(node) {
      for (const child of node.children) {
        if (match(child)) {
          results.push(child);
        }
        traverse(child);
      }
    }
    traverse(this);
    return results;
  }

  getContext(type) {
    return {
      canvas: this,
      clearRect: () => {},
      fillRect: () => {},
      drawImage: () => {},
      getImageData: () => ({ data: new Uint8Array(4) })
    };
  }
}

// Selector matcher: handles #id, .class, tag, and [attr=val]
function createMatcher(selector) {
  selector = selector.trim();
  if (selector.startsWith('#')) {
    const id = selector.slice(1);
    return el => el.id === id;
  }
  if (selector.startsWith('.')) {
    const cls = selector.slice(1);
    return el => el.classList.contains(cls);
  }
  if (selector.startsWith('[') && selector.endsWith(']')) {
    const inner = selector.slice(1, -1);
    if (inner.includes('=')) {
      const [k, v] = inner.split('=').map(s => s.replace(/['"]/g, '').trim());
      return el => el.getAttribute(k) === v;
    }
    return el => el.getAttribute(inner) !== null;
  }
  // Tag match
  const upper = selector.toUpperCase();
  return el => el.tagName === upper;
}

// Parse HTML fragment into MockElement children
function parseHtmlFragment(html, parent) {
  // Regex tokenizing tags and text
  const tagRegex = /<(\/)?([a-zA-Z0-9_-]+)([^>]*?)(\/)?>|([^<]+)/g;
  let match;
  let currentParent = parent;
  const stack = [parent];

  while ((match = tagRegex.exec(html)) !== null) {
    const isClosing = match[1] === '/';
    const tagName = match[2];
    const attrs = match[3];
    const isSelfClosing = match[4] === '/' || ['IMG', 'INPUT', 'BR', 'HR'].includes(tagName?.toUpperCase());
    const text = match[5];

    if (text) {
      const trimmed = text.trim();
      if (trimmed) {
        if (currentParent.children.length === 0 && !currentParent._textContent) {
          currentParent._textContent = trimmed;
        } else {
          const textNode = new MockElement('SPAN');
          textNode._textContent = trimmed;
          currentParent.appendChild(textNode);
        }
      }
    } else if (isClosing) {
      if (stack.length > 1) {
        stack.pop();
        currentParent = stack[stack.length - 1];
      }
    } else if (tagName) {
      const el = new MockElement(tagName);
      if (attrs) {
        parseAttributes(attrs, el);
      }
      currentParent.appendChild(el);
      if (!isSelfClosing) {
        stack.push(el);
        currentParent = el;
      }
    }
  }
}

function parseAttributes(attrStr, el) {
  const attrRegex = /([a-zA-Z0-9_-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^>\s]+)))?/g;
  let match;
  while ((match = attrRegex.exec(attrStr)) !== null) {
    const key = match[1];
    const val = match[2] !== undefined ? match[2] : (match[3] !== undefined ? match[3] : (match[4] !== undefined ? match[4] : ''));
    el.setAttribute(key, val);
  }
}

// =========================================================================
// 2. MOCK THREE.JS IMPLEMENTATION
// =========================================================================

function createMockThree() {
  class Vector3 {
    constructor(x = 0, y = 0, z = 0) {
      this.x = x; this.y = y; this.z = z;
    }
    set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
    copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
    clone() { return new Vector3(this.x, this.y, this.z); }
    normalize() { return this; }
    multiplyScalar(s) { this.x *= s; this.y *= s; this.z *= s; return this; }
    sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
    length() { return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z); }
  }

  class Color {
    constructor(val = 0xffffff) {
      this.value = val;
    }
    setHex(h) { this.value = h; return this; }
    set(val) { this.value = val; return this; }
  }

  class Object3D {
    constructor() {
      this.position = new Vector3();
      this.rotation = new Vector3();
      this.scale = new Vector3(1, 1, 1);
      this.children = [];
      this.visible = true;
    }
    add(obj) { this.children.push(obj); obj.parent = this; return this; }
    remove(obj) {
      const idx = this.children.indexOf(obj);
      if (idx !== -1) {
        this.children.splice(idx, 1);
        obj.parent = null;
      }
    }
    traverse(cb) {
      cb(this);
      this.children.forEach(c => c.traverse && c.traverse(cb));
    }
  }

  class Mesh extends Object3D {
    constructor(geometry, material) {
      super();
      this.geometry = geometry || new BoxGeometry();
      this.material = material || new MeshStandardMaterial();
    }
  }

  class Scene extends Object3D {}
  class Group extends Object3D {}

  class PerspectiveCamera extends Object3D {
    constructor(fov = 50, aspect = 1, near = 0.1, far = 1000) {
      super();
      this.fov = fov;
      this.aspect = aspect;
      this.near = near;
      this.far = far;
    }
    updateProjectionMatrix() {}
    lookAt() {}
  }

  class WebGLRenderer {
    constructor(opts = {}) {
      this.domElement = opts.canvas || new MockElement('canvas');
      this.shadowMap = { enabled: false, type: 0 };
      this.toneMapping = 0;
      this.toneMappingExposure = 1;
      this.outputEncoding = 0;
    }
    setSize(w, h) {
      this.domElement.clientWidth = w;
      this.domElement.clientHeight = h;
    }
    setPixelRatio() {}
    render(scene, camera) {
      this.lastRenderedScene = scene;
      this.lastRenderedCamera = camera;
    }
    dispose() {}
  }

  class BoxGeometry {
    constructor(w = 1, h = 1, d = 1) {
      this.parameters = { width: w, height: h, depth: d };
      this.boundingBox = {
        min: new Vector3(-0.5, -0.5, -0.5),
        max: new Vector3(0.5, 0.5, 0.5),
        getSize: (t) => t.set(1, 1, 1),
        getCenter: (t) => t.set(0, 0, 0)
      };
    }
    computeBoundingBox() {}
    computeVertexNormals() {}
    center() {}
  }

  class MeshStandardMaterial {
    constructor(opts = {}) {
      this.color = new Color(opts.color || 0xffffff);
      this.roughness = opts.roughness !== undefined ? opts.roughness : 0.5;
      this.metalness = opts.metalness !== undefined ? opts.metalness : 0.5;
      this.emissive = new Color(opts.emissive || 0x000000);
      this.emissiveIntensity = opts.emissiveIntensity || 0;
      this.map = opts.map || null;
      this.wireframe = opts.wireframe || false;
    }
  }

  class AmbientLight extends Object3D {
    constructor(color = 0xffffff, intensity = 1) {
      super();
      this.color = new Color(color);
      this.intensity = intensity;
    }
  }

  class DirectionalLight extends Object3D {
    constructor(color = 0xffffff, intensity = 1) {
      super();
      this.color = new Color(color);
      this.intensity = intensity;
    }
  }

  class GridHelper extends Object3D {
    constructor(size = 10, divisions = 10, color1 = 0x444444, color2 = 0x888888) {
      super();
      this.size = size;
      this.divisions = divisions;
    }
  }

  class Box3 {
    constructor(min, max) {
      this.min = min || new Vector3(-1, -1, -1);
      this.max = max || new Vector3(1, 1, 1);
    }
    setFromObject(obj) {
      this.min.set(-1, -1, -1);
      this.max.set(1, 1, 1);
      return this;
    }
    getSize(target) {
      target.copy(this.max).sub(this.min);
      return target;
    }
    getCenter(target) {
      target.set(
        (this.min.x + this.max.x) / 2,
        (this.min.y + this.max.y) / 2,
        (this.min.z + this.max.z) / 2
      );
      return target;
    }
  }

  class CylinderGeometry {
    constructor(rt = 1, rb = 1, height = 1, radialSegments = 8) {
      this.parameters = { radiusTop: rt, radiusBottom: rb, height, radialSegments };
      this.boundingBox = {
        min: new Vector3(-1, -1, -1),
        max: new Vector3(1, 1, 1),
        getSize: (t) => t.set(2, 2, 2),
        getCenter: (t) => t.set(0, 0, 0)
      };
    }
    computeBoundingBox() {}
    computeVertexNormals() {}
    center() {}
  }

  class TorusGeometry {
    constructor(radius = 1, tube = 0.4, radialSegments = 8, tubularSegments = 6) {
      this.parameters = { radius, tube, radialSegments, tubularSegments };
      this.boundingBox = {
        min: new Vector3(-1, -1, -1),
        max: new Vector3(1, 1, 1),
        getSize: (t) => t.set(2, 2, 2),
        getCenter: (t) => t.set(0, 0, 0)
      };
    }
    computeBoundingBox() {}
    computeVertexNormals() {}
    center() {}
  }

  class DRACOLoader {
    setDecoderPath() { return this; }
    preload() { return this; }
    dispose() {}
  }

  class STLLoader {
    load(url, onLoad, onProgress, onError) {
      setTimeout(() => {
        if (onLoad) onLoad(new BoxGeometry());
      }, 0);
    }
  }

  class GLTFLoader {
    setDRACOLoader() { return this; }
    load(url, onLoad, onProgress, onError) {
      setTimeout(() => {
        const gltf = {
          scene: new Group()
        };
        if (onLoad) onLoad(gltf);
      }, 0);
    }
  }

  class TextureLoader {
    load(url, onLoad) {
      const tex = { image: { src: url }, wrapS: 1000, wrapT: 1000 };
      if (onLoad) onLoad(tex);
      return tex;
    }
  }

  return {
    Vector3,
    Color,
    Object3D,
    Mesh,
    Scene,
    Group,
    PerspectiveCamera,
    WebGLRenderer,
    BoxGeometry,
    CylinderGeometry,
    TorusGeometry,
    GridHelper,
    Box3,
    MeshStandardMaterial,
    AmbientLight,
    DirectionalLight,
    STLLoader,
    GLTFLoader,
    DRACOLoader,
    TextureLoader,
    ClampToEdgeWrapping: 1000,
    sRGBEncoding: 3001,
    ACESFilmicToneMapping: 4
  };
}

// =========================================================================
// 3. MOCK SOCKET.IO RELAY
// =========================================================================

class MockSocket {
  constructor(socketId = 'socket_test_01') {
    this.id = socketId;
    this.listeners = {};
    this.emittedPackets = [];
  }

  on(event, fn) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }

  emit(event, payload) {
    this.emittedPackets.push({ event, payload, timestamp: Date.now() });
    // Echo back locally if listener registered
    if (this.listeners[event]) {
      this.listeners[event].forEach(fn => fn(payload));
    }
  }

  // Simulate an incoming packet from a remote peer server
  receive(event, payload) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(fn => fn(payload));
    }
  }
}

// =========================================================================
// 4. MOCK ENVIRONMENT CREATOR (Loads index.html)
// =========================================================================

function createTestEnvironment(htmlPath) {
  const resolvedPath = htmlPath || path.resolve(__dirname, '../index.html');
  const htmlContent = fs.readFileSync(resolvedPath, 'utf-8');

  // Root document
  const docElement = new MockElement('HTML');
  const bodyElement = new MockElement('BODY');
  const headElement = new MockElement('HEAD');
  docElement.appendChild(headElement);
  docElement.appendChild(bodyElement);

  // Parse elements from index.html into body
  parseHtmlFragment(htmlContent, bodyElement);

  // Mock localStorage
  const storageData = {};
  const mockLocalStorage = {
    getItem: (k) => (k in storageData ? storageData[k] : null),
    setItem: (k, v) => { storageData[k] = String(v); },
    removeItem: (k) => { delete storageData[k]; },
    clear: () => { Object.keys(storageData).forEach(k => delete storageData[k]); }
  };

  // Mock AudioContext
  class MockAudioContext {
    constructor() {
      this.currentTime = 0;
      this.state = 'running';
      this.destination = {};
    }
    createOscillator() {
      return {
        type: 'sine',
        frequency: { setValueAtTime: () => {} },
        connect: () => {},
        start: () => {},
        stop: () => {}
      };
    }
    createGain() {
      return {
        gain: {
          setValueAtTime: () => {},
          exponentialRampToValueAtTime: () => {},
          linearRampToValueAtTime: () => {}
        },
        connect: () => {}
      };
    }
    resume() { return Promise.resolve(); }
  }

  const mockSocket = new MockSocket();
  const mockThree = createMockThree();

  const windowListeners = {};
  const mockWindow = {
    document: {
      getElementById: (id) => docElement.getElementById(id),
      querySelector: (sel) => docElement.querySelector(sel),
      querySelectorAll: (sel) => docElement.querySelectorAll(sel),
      createElement: (tag) => new MockElement(tag),
      addEventListener: (evt, fn) => docElement.addEventListener(evt, fn),
      removeEventListener: (evt, fn) => docElement.removeEventListener(evt, fn),
      dispatchEvent: (evt) => docElement.dispatchEvent(evt),
      body: bodyElement,
      documentElement: docElement
    },
    innerWidth: 1920,
    innerHeight: 1080,
    addEventListener: (evt, fn) => {
      if (!windowListeners[evt]) windowListeners[evt] = [];
      windowListeners[evt].push(fn);
    },
    removeEventListener: (evt, fn) => {
      if (!windowListeners[evt]) return;
      windowListeners[evt] = windowListeners[evt].filter(cb => cb !== fn);
    },
    dispatchEvent: (evt) => {
      const type = typeof evt === 'string' ? evt : evt.type;
      const eventObj = typeof evt === 'string' ? { type, target: mockWindow, preventDefault: () => {} } : evt;
      if (windowListeners[type]) {
        windowListeners[type].forEach(fn => fn(eventObj));
      }
      return true;
    },
    localStorage: mockLocalStorage,
    sessionStorage: mockLocalStorage,
    AudioContext: MockAudioContext,
    webkitAudioContext: MockAudioContext,
    THREE: mockThree,
    io: () => mockSocket,
    requestAnimationFrame: (cb) => setTimeout(cb, 16),
    cancelAnimationFrame: (id) => clearTimeout(id),
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    alert: () => {},
    showToast: (msg, icon) => {},
    showCenterCalmAlert: (title, text, icon) => {},
    location: { reload: () => {} }
  };

  mockWindow.window = mockWindow;

  return {
    window: mockWindow,
    document: mockWindow.document,
    socket: mockSocket,
    THREE: mockThree,
    localStorage: mockLocalStorage
  };
}

// =========================================================================
// 5. AUTHORITATIVE NASA HORIZON-X SPECIFICATION ORACLE
// =========================================================================

const SPEC_ORACLE = {
  // Phase 02 Logistics Tiers
  TOOL_TIERS: {
    1: { level: 1, name: 'Level 01', subtitle: 'Economy', durationSec: 300, priceMultiplier: 0.40, label: 'LVL 1 [5m]' },
    2: { level: 2, name: 'Level 02', subtitle: 'Aerospace', durationSec: 900, priceMultiplier: 0.70, label: 'LVL 2 [15m]' },
    3: { level: 3, name: 'Level 03', subtitle: 'NASA Flight', durationSec: 2100, priceMultiplier: 1.00, label: 'LVL 3 [35m]' }
  },

  // Authoritative dynamic price formula
  calculateTierPrice(basePrice, tier) {
    const mult = this.TOOL_TIERS[tier]?.priceMultiplier || 1.0;
    return Math.round(basePrice * mult);
  },

  // Authoritative Telemetry Baseline & Subsystem Deltas
  TELEMETRY: {
    BASELINE: {
      mass: 10800,       // kg
      power: 1850,       // W
      dataRate: 0.0,     // Mbps
      budgetLimit: 150000// $
    },
    TARGETS: {
      maxMass: 11600,    // kg max
      minPower: 2200,    // W nominal
      minDataRate: 1.0,  // Mbps nominal
      maxBudget: 150000  // $
    },
    STAGES: {
      mech_task1: { name: 'RSU-02 Gyro Canister Hatch', massDelta: 110, powerDelta: 0, dataDelta: 0.0, cost: 45000 },
      mech_task2: { name: 'SADM Solar Array Drive', massDelta: 150, powerDelta: 450, dataDelta: 0.0, cost: 38000 },
      elec_task1: { name: 'DF-224 Flight Computer PCB', massDelta: 25, powerDelta: 80, dataDelta: 0.0, cost: 32000 },
      elec_task2: { name: 'Fine Guidance Sensor (FGS)', massDelta: 15, powerDelta: 20, dataDelta: 0.0, cost: 45000 },
      net_task1:  { name: 'High Gain Antenna (HGA) Dish', massDelta: 8, powerDelta: 0, dataDelta: 0.5, cost: 8500 },
      net_task2:  { name: 'SI-C&DH Fiber Bus Splicer', massDelta: 2, powerDelta: 0, dataDelta: 0.5, cost: 5000 }
    },
    calculateCumulative(completedStageKeys = [], currentBudget = 150000) {
      let mass = this.BASELINE.mass;
      let power = this.BASELINE.power;
      let dataRate = this.BASELINE.dataRate;

      for (const key of completedStageKeys) {
        const stage = this.STAGES[key];
        if (stage) {
          mass += stage.massDelta;
          power += stage.powerDelta;
          dataRate += stage.dataDelta;
        }
      }

      const expenditure = Math.max(0, this.BASELINE.budgetLimit - currentBudget);

      return {
        mass,
        power,
        dataRate: Number(dataRate.toFixed(1)),
        expenditure,
        isMassNominal: mass <= this.TARGETS.maxMass,
        isPowerNominal: power >= this.TARGETS.minPower,
        isDataNominal: dataRate >= this.TARGETS.minDataRate,
        isBudgetNominal: expenditure <= this.TARGETS.maxBudget
      };
    }
  },

  // 6 Required Stages for STS-61 Launch Certification
  ALL_REQUIRED_STAGES: [
    'mech_task1', 'mech_task2',
    'elec_task1', 'elec_task2',
    'net_task1', 'net_task2'
  ],

  // Check if mission is ready for STS-61 launch
  isLaunchReady(assembledStages = {}) {
    return this.ALL_REQUIRED_STAGES.every(stage => !!assembledStages[stage]);
  }
};

function loadScript(filePath, env) {
  const code = fs.readFileSync(path.resolve(__dirname, '..', filePath), 'utf-8');
  const ctx = require('node:vm').createContext(env.window);
  require('node:vm').runInContext(code, ctx);
  return env.window;
}

module.exports = {
  MockElement,
  MockClassList,
  MockSocket,
  createMockThree,
  createTestEnvironment,
  loadScript,
  SPEC_ORACLE
};
