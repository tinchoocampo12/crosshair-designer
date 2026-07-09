import './index.css';

const defaultState = {
  length: 14,
  thickness: 3,
  gap: 6,
  opacity: 90,
  color: '#00ff66',
  dot: true,
  outline: true,
  offsetX: 0,
  offsetY: 0,
};

const STORAGE_KEY = 'crosshair:last-config';

function loadSavedState() {
  try {
    const savedConfig = localStorage.getItem(STORAGE_KEY);

    if (!savedConfig) {
      return { ...defaultState };
    }

    return {
      ...defaultState,
      ...JSON.parse(savedConfig),
    };
  } catch {
    return { ...defaultState };
  }
}

function saveState(config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

let state = loadSavedState();

const isOverlay = new URLSearchParams(window.location.search).get('overlay') === '1';

function crosshairTemplate() {
  return `
    <div class="crosshair" id="crosshair">
      <div class="line top"></div>
      <div class="line bottom"></div>
      <div class="line left"></div>
      <div class="line right"></div>
      <div class="dot"></div>
    </div>
  `;
}

function applyCrosshairConfig(crosshair, config) {
  crosshair.style.setProperty('--length', `${config.length}px`);
  crosshair.style.setProperty('--thickness', `${config.thickness}px`);
  crosshair.style.setProperty('--gap', `${config.gap}px`);
  crosshair.style.setProperty('--opacity', config.opacity / 100);
  crosshair.style.setProperty('--color', config.color);
  crosshair.style.setProperty('--offset-x', `${config.offsetX}px`);
  crosshair.style.setProperty('--offset-y', `${config.offsetY}px`);

  crosshair.classList.toggle('hide-dot', !config.dot);
  crosshair.classList.toggle('with-outline', config.outline);
}

function renderOverlay() {
  document.body.className = 'overlay-mode';

  const overlay = document.createElement('div');
  overlay.className = 'overlay-root';
  overlay.innerHTML = crosshairTemplate();

  document.body.appendChild(overlay);

  const crosshair = document.getElementById('crosshair');

  applyCrosshairConfig(crosshair, state);

  window.crosshairAPI?.onConfigUpdate((config) => {
    state = {
      ...state,
      ...config,
    };

    applyCrosshairConfig(crosshair, state);
  });
}

function renderDesigner() {
  document.body.className = 'designer-mode';

  const app = document.createElement('div');
  app.className = 'app';

  app.innerHTML = `
    <section class="panel">
      <h1>Crosshair Designer</h1>
      <p class="subtitle">Diseñá tu mira en tiempo real</p>

      <div class="control">
        <label>Largo de líneas: <span id="lengthValue">14</span>px</label>
        <input id="length" type="range" min="2" max="80" value="14">
      </div>

      <div class="control">
        <label>Grosor: <span id="thicknessValue">3</span>px</label>
        <input id="thickness" type="range" min="1" max="24" value="3">
      </div>

      <div class="control">
        <label>Espaciado centro: <span id="gapValue">6</span>px</label>
        <input id="gap" type="range" min="0" max="50" value="6">
      </div>

      <div class="control">
        <label>Opacidad: <span id="opacityValue">90</span>%</label>
        <input id="opacity" type="range" min="10" max="100" value="90">
      </div>

      <hr>

      <div class="control">
        <label>Mover horizontal: <span id="offsetXValue">0</span>px</label>
        <input id="offsetX" type="range" min="-200" max="200" value="0">
      </div>

      <div class="control">
        <label>Mover vertical: <span id="offsetYValue">0</span>px</label>
        <input id="offsetY" type="range" min="-200" max="200" value="0">
      </div>

      <hr>

      <div class="control row">
        <label>Color</label>
        <input id="color" type="color" value="#00ff66">
      </div>

      <div class="control row">
        <label for="dot">Punto central</label>
        <input id="dot" type="checkbox" checked>
      </div>

      <div class="control row">
        <label for="outline">Borde negro</label>
        <input id="outline" type="checkbox" checked>
      </div>

      <button id="reset">Reset</button>

      <p class="hint">
        La última configuración se guarda automáticamente.
      </p>
    </section>

    <section class="preview-area">
      <div class="preview-card">
        ${crosshairTemplate()}
      </div>
    </section>
  `;

  document.body.appendChild(app);

  const controls = {
    length: document.getElementById('length'),
    thickness: document.getElementById('thickness'),
    gap: document.getElementById('gap'),
    opacity: document.getElementById('opacity'),
    offsetX: document.getElementById('offsetX'),
    offsetY: document.getElementById('offsetY'),
    color: document.getElementById('color'),
    dot: document.getElementById('dot'),
    outline: document.getElementById('outline'),
  };

  const values = {
    length: document.getElementById('lengthValue'),
    thickness: document.getElementById('thicknessValue'),
    gap: document.getElementById('gapValue'),
    opacity: document.getElementById('opacityValue'),
    offsetX: document.getElementById('offsetXValue'),
    offsetY: document.getElementById('offsetYValue'),
  };

  const crosshair = document.getElementById('crosshair');
  const resetButton = document.getElementById('reset');

  function syncControls() {
    controls.length.value = state.length;
    controls.thickness.value = state.thickness;
    controls.gap.value = state.gap;
    controls.opacity.value = state.opacity;
    controls.offsetX.value = state.offsetX;
    controls.offsetY.value = state.offsetY;
    controls.color.value = state.color;
    controls.dot.checked = state.dot;
    controls.outline.checked = state.outline;
  }

  function updateCrosshair() {
    applyCrosshairConfig(crosshair, state);

    values.length.textContent = state.length;
    values.thickness.textContent = state.thickness;
    values.gap.textContent = state.gap;
    values.opacity.textContent = state.opacity;
    values.offsetX.textContent = state.offsetX;
    values.offsetY.textContent = state.offsetY;

    saveState(state);

    window.crosshairAPI?.sendConfig(state);
  }

  controls.length.addEventListener('input', (event) => {
    state.length = Number(event.target.value);
    updateCrosshair();
  });

  controls.thickness.addEventListener('input', (event) => {
    state.thickness = Number(event.target.value);
    updateCrosshair();
  });

  controls.gap.addEventListener('input', (event) => {
    state.gap = Number(event.target.value);
    updateCrosshair();
  });

  controls.opacity.addEventListener('input', (event) => {
    state.opacity = Number(event.target.value);
    updateCrosshair();
  });

  controls.offsetX.addEventListener('input', (event) => {
    state.offsetX = Number(event.target.value);
    updateCrosshair();
  });

  controls.offsetY.addEventListener('input', (event) => {
    state.offsetY = Number(event.target.value);
    updateCrosshair();
  });

  controls.color.addEventListener('input', (event) => {
    state.color = event.target.value;
    updateCrosshair();
  });

  controls.dot.addEventListener('change', (event) => {
    state.dot = event.target.checked;
    updateCrosshair();
  });

  controls.outline.addEventListener('change', (event) => {
    state.outline = event.target.checked;
    updateCrosshair();
  });

  resetButton.addEventListener('click', () => {
    state = { ...defaultState };
    syncControls();
    updateCrosshair();
  });

  syncControls();
  updateCrosshair();
}

if (isOverlay) {
  renderOverlay();
} else {
  renderDesigner();
}