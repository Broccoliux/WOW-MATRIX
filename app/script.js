const state = {
  leds: [],
  selectedLEDs: new Set(),
  rotationX: 62,
  rotationY: -36,
  rotationZ: 0,
  dragging: false,
  dragStartX: 0,
  dragStartY: 0,
  lastX: 0,
  lastY: 0,
  lastZ: 0,
  velocityX: 0,
  velocityY: 0,
  velocityZ: 0,
  autoSpin: 0,
  activeAnimation: null,
  animationFrame: 0,
  rainDropOffsets: [],
  lightningPath: [],
  nodeElements: [],
  lightningKeys: new Set(),
  imagePixels: null,
  cubeConnected: false,
  frameSendPending: false,
  lastFrameSentAt: 0
};

function initLEDGrid() {
  state.leds = [];
  let index = 0;

  const X_SIZE = 8;
  const Y_SIZE = 8;
  const Z_SIZE = 8;

  for (let z = 0; z < Z_SIZE; z++) {
    for (let y = 0; y < Y_SIZE; y++) {
      for (let x = 0; x < X_SIZE; x++) {
        state.leds.push({
          id: index++,
          x: x,
          y: y,
          z: z,
          color: '#000000'
        });
      }
    }
  }
  renderTable(state.leds);
  render3DMatrix();
  applyMatrixRotation();
  console.log(`Initialized full matrix with ${state.leds.length} individual LEDs.`);
}

function cubeBaseUrl() {
  const configuredUrl = document.getElementById('cubeEndpoint')?.value.trim();
  if (configuredUrl) return configuredUrl.replace(/\/$/, '');
  return 'http://192.168.4.1';
}

function openCubePortal() {
  window.location.href = 'http://192.168.4.1';
}

function setConnectionStatus(connected, message) {
  const badge = document.getElementById('connectionStatus');
  if (!badge) return;
  badge.textContent = message || (connected ? 'Online' : 'Offline');
  badge.classList.toggle('offline', !connected);
}

async function connectCube() {
  setConnectionStatus(false, 'Connecting');
  try {
    const response = await fetch(`${cubeBaseUrl()}/api/status`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Status request failed');
    state.cubeConnected = true;
    setConnectionStatus(true, 'Online');
    scheduleFrameSend(true);
  } catch (error) {
    state.cubeConnected = false;
    setConnectionStatus(false, 'Offline');
    console.warn('Cube connection failed:', error.message);
  }
}

function frameAsBase64() {
  const bytes = new Uint8Array(8 * 8 * 8 * 3);
  let offset = 0;
  for (let z = 0; z < 8; z += 1) {
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        const led = state.leds[z * 64 + y * 8 + x];
        const color = hexToRgb(led?.color || '#000000');
        bytes[offset++] = color.r;
        bytes[offset++] = color.g;
        bytes[offset++] = color.b;
      }
    }
  }

  let binary = '';
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary);
}

function scheduleFrameSend(force = false) {
  if (!state.cubeConnected || state.frameSendPending) return;
  const wait = force ? 0 : Math.max(0, 33 - (performance.now() - state.lastFrameSentAt));
  state.frameSendPending = true;
  setTimeout(async () => {
    state.frameSendPending = false;
    state.lastFrameSentAt = performance.now();
    try {
      const response = await fetch(`${cubeBaseUrl()}/api/frame`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: frameAsBase64()
      });
      if (!response.ok) throw new Error('Frame request failed');
    } catch (error) {
      state.cubeConnected = false;
      setConnectionStatus(false, 'Offline');
      console.warn('Cube frame send failed:', error.message);
    }
  }, wait);
}

function renderTable(ledArray) {
  const tbody = document.getElementById('ledTableBody');
  tbody.innerHTML = '';

  ledArray.forEach(led => {
    const tr = document.createElement('tr');
    const isChecked = state.selectedLEDs.has(led.id) ? 'checked' : '';

    tr.innerHTML = `
        <td><input type="checkbox" ${isChecked} onclick="toggleSelectLED(${led.id})"></td>
        <td>#${led.id}</td>
        <td>X: ${led.x}, Y: ${led.y}, Z: ${led.z}</td>
        <td>
            <div class="color-preview" style="background-color: ${led.color};"></div>
            <span style="margin-left: 8px; font-family: monospace;">${led.color}</span>
        </td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('selectedCount').innerText = `Selected: ${state.selectedLEDs.size} LEDs`;
}

function filterLEDTable() {
  const query = document.getElementById('ledSearchInput').value.toLowerCase().trim();

  if (query === '') {
    renderTable(state.leds);
    return;
  }

  const filtered = state.leds.filter(led => {
    const coordString = `${led.x},${led.y},${led.z}`;
    return led.id.toString().includes(query) || coordString.includes(query);
  });

  renderTable(filtered);
}

function toggleSelectLED(id) {
  if (state.selectedLEDs.has(id)) {
    state.selectedLEDs.delete(id);
  } else {
    state.selectedLEDs.add(id);
  }
  document.getElementById('selectedCount').innerText = `Selected: ${state.selectedLEDs.size} LEDs`;
}

function toggleSelectAll(masterCheckbox) {
  const checkboxes = document.querySelectorAll('#ledTableBody input[type="checkbox"]');
  checkboxes.forEach(cb => {
    cb.checked = masterCheckbox.checked;
  });

  if (masterCheckbox.checked) {
    state.leds.forEach(led => state.selectedLEDs.add(led.id));
  } else {
    state.selectedLEDs.clear();
  }
  document.getElementById('selectedCount').innerText = `Selected: ${state.selectedLEDs.size} LEDs`;
}

function applyColorToSelected() {
  const chosenColor = document.getElementById('bulkColorPicker').value;

  if (state.selectedLEDs.size === 0) {
    alert('Please select at least one LED first.');
    return;
  }

  state.leds.forEach(led => {
    if (state.selectedLEDs.has(led.id)) {
      led.color = chosenColor;
    }
  });

  filterLEDTable();
  render3DMatrix();
  scheduleFrameSend();
}

function toggleAnimationMenu() {
  const select = document.getElementById('animationSelect');
  if (!select) return;
  select.hidden = !select.hidden;
  if (!select.hidden) {
    select.focus();
  }
}

function setMode(mode) {
  if (mode === 'solid') {
    state.activeAnimation = null;
    const chosenColor = document.getElementById('bulkColorPicker').value;
    state.leds.forEach(led => led.color = chosenColor);
    filterLEDTable();
    render3DMatrix();
    console.log(`Solid fill applied with color: ${chosenColor}`);
    return;
  }

  if (mode === 'rain') {
    state.activeAnimation = 'rain';
    state.animationFrame = 0;
    state.rainDropOffsets = Array.from({ length: 64 }, (_, i) => ({
      x: i % 8,
      z: Math.floor(i / 8),
      phase: Math.random() * 100,
      speed: 0.8 + Math.random() * 1.2
    }));
    console.log('Rain animation activated');
    return;
  }

  if (mode === 'pulse') {
    state.activeAnimation = 'pulse';
    state.animationFrame = 0;
    console.log('Pulse animation activated');
    return;
  }

  if (mode === 'wave') {
    state.activeAnimation = 'wave';
    state.animationFrame = 0;
    console.log('Wave animation activated');
    return;
  }

  if (mode === 'ball') {
    state.activeAnimation = 'ball';
    state.animationFrame = 0;
    console.log('Bouncing ball animation activated');
    return;
  }

  if (mode === 'lightning') {
    state.activeAnimation = 'lightning';
    state.animationFrame = 0;
    state.lightningPath = createLightningPath();
    state.lightningKeys = new Set(state.lightningPath.map(point => `${point.x},${point.y},${point.z}`));
    console.log('Lightning animation activated');
    return;
  }

  if (mode === 'none') {
    state.activeAnimation = null;
    clearMatrix();
    return;
  }

  console.log(`Mode set to: ${mode}`);
}

function getAnimationColor() {
  return document.getElementById('animationColorPicker')?.value || '#00ff88';
}

function hexToRgb(hex) {
  if (hex.startsWith('rgb')) {
    const values = hex.match(/\d+/g)?.map(Number) || [0, 0, 0];
    return { r: values[0] || 0, g: values[1] || 0, b: values[2] || 0 };
  }

  const normalized = hex.replace('#', '');
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16)
  };
}

function colorAtBrightness(baseColor, brightness) {
  return `rgb(${Math.round(baseColor.r * brightness)}, ${Math.round(baseColor.g * brightness)}, ${Math.round(baseColor.b * brightness)})`;
}

function createLightningPath() {
  const path = [];
  let x = 3;
  let y = 0;
  let z = 3;

  for (let step = 0; step < 16; step += 1) {
    path.push({ x, y, z });
    x = Math.max(0, Math.min(7, x + (step % 3 === 0 ? 1 : 0)));
    y = Math.min(7, y + 1);
    z = Math.max(0, Math.min(7, z + (step % 2 === 0 ? -1 : 1)));
  }

  return path;
}

function clearMatrix() {
  state.activeAnimation = null;
  const select = document.getElementById('animationSelect');
  if (select) select.value = 'none';
  state.leds.forEach(led => led.color = '#000000');
  state.selectedLEDs.clear();
  document.getElementById('selectAll').checked = false;
  filterLEDTable();
  render3DMatrix();
}

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const image = new Image();
  const objectUrl = URL.createObjectURL(file);

  image.onload = () => {
    const canvas = document.getElementById('imagePreview');
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const size = 8;
    const scale = Math.max(size / image.width, size / image.height);
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    const offsetX = (size - drawWidth) / 2;
    const offsetY = (size - drawHeight) / 2;

    context.clearRect(0, 0, size, size);
    context.imageSmoothingEnabled = true;
    context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
    applyImageToMatrix(context.getImageData(0, 0, size, size).data);
    URL.revokeObjectURL(objectUrl);
  };

  image.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    alert('That image could not be loaded.');
  };

  image.src = objectUrl;
}

function applyImageToMatrix(pixelData) {
  state.activeAnimation = null;
  const select = document.getElementById('animationSelect');
  if (select) select.value = 'none';
  state.imagePixels = pixelData;

  state.leds.forEach((led) => {
    led.color = '#000000';
  });

  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      const pixelIndex = (y * 8 + x) * 4;
      const red = pixelData[pixelIndex];
      const green = pixelData[pixelIndex + 1];
      const blue = pixelData[pixelIndex + 2];
      const alpha = pixelData[pixelIndex + 3];
      const brightness = red + green + blue;

      if (alpha >= 64 && brightness >= 18) {
        const depthMode = document.getElementById('imageDepthMode')?.value || 'volume';
        const depthLayers = depthMode === 'volume' ? 8 : 1;
        for (let layer = 0; layer < depthLayers; layer += 1) {
          const z = depthMode === 'volume' ? layer : 7;
          const led = state.leds.find(item => item.x === x && item.y === y && item.z === z);
          if (led) led.color = `rgb(${red}, ${green}, ${blue})`;
        }
      }
    }
  }

  filterLEDTable();
  render3DMatrix();
}

function reapplyLoadedImage() {
  if (state.imagePixels) applyImageToMatrix(state.imagePixels);
}

function clearImageMatrix() {
  const input = document.getElementById('imageUpload');
  const preview = document.getElementById('imagePreview');
  const context = preview?.getContext('2d');
  if (input) input.value = '';
  if (context) context.clearRect(0, 0, preview.width, preview.height);
  state.imagePixels = null;
  clearMatrix();
}

window.addEventListener('DOMContentLoaded', () => {
  initLEDGrid();
  if (window.location.protocol === 'http:') connectCube();
});

function render3DMatrix() {
  const space = document.getElementById('matrix3DSpace');
  space.innerHTML = '';

  const spacing = 22;
  const volume = 8;

  state.leds.forEach(led => {
    const node = document.createElement('div');
    node.className = 'node-3d';
    node.id = `node-3d-${led.id}`;

    const px = (led.x - 3.5) * spacing;
    const py = (led.y - 3.5) * spacing;
    const pz = (led.z - 3.5) * spacing;

    node.style.color = led.color;
    node.style.setProperty('--led-color', led.color);
    node.style.transform = `translate3d(${px}px, ${py}px, ${pz}px)`;
    node.classList.toggle('is-lit', led.color !== '#000000');

    if (state.selectedLEDs.has(led.id)) {
      node.classList.add('is-selected');
    }

    node.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleSelectLED(led.id);
      renderTable(state.leds);
      render3DMatrix();
    });

    space.appendChild(node);
    state.nodeElements[led.id] = node;
  });
  scheduleFrameSend();
}

function updateAnimationNodes() {
  state.leds.forEach((led) => {
    const node = state.nodeElements[led.id];
    if (!node) return;
    node.style.color = led.color;
    node.style.setProperty('--led-color', led.color);
    node.classList.toggle('is-lit', led.color !== '#000000');
  });
  scheduleFrameSend();
}

function applyMatrixRotation() {
  const space = document.getElementById('matrix3DSpace');
  if (!space) return;
  space.style.transform = `translate(-50%, -50%) rotateX(${state.rotationX}deg) rotateY(${state.rotationY}deg) rotateZ(${state.rotationZ}deg)`;
}

function rotateMatrixX(val) {
  state.rotationX = Number(val);
  applyMatrixRotation();
}

function rotateMatrixY(val) {
  state.rotationY = Number(val);
  applyMatrixRotation();
}

function tickAnimation() {
  if (!state.activeAnimation) {
    requestAnimationFrame(tickAnimation);
    return;
  }

  const time = state.animationFrame * 0.06;

  if (state.activeAnimation === 'rain') {
    const animationColor = getAnimationColor();
    state.leds.forEach((led) => {
      led.color = '#000000';
    });

    state.rainDropOffsets.forEach((drop) => {
      const head = Math.floor((time * drop.speed + drop.phase) % 14) - 3;

      for (let trail = 0; trail < 4; trail += 1) {
        const y = head - trail;
        if (y < 0 || y > 7) continue;
        const match = state.leds.find(item => item.x === drop.x && item.y === y && item.z === drop.z);
        if (match) match.color = animationColor;
      }
    });
  }

  if (state.activeAnimation === 'pulse') {
    const baseColor = hexToRgb(getAnimationColor());
    const pulse = Math.sin(time * 1.8) * 0.5 + 0.5;
    state.leds.forEach((led, index) => {
      const val = (((led.x + led.y + led.z + index) % 7) / 7) * 255;
      const intensity = 0.18 + pulse * 0.72 + (val / 255) * 0.1;
      led.color = `rgb(${Math.min(255, Math.round(baseColor.r * intensity))}, ${Math.min(255, Math.round(baseColor.g * intensity))}, ${Math.min(255, Math.round(baseColor.b * intensity))})`;
    });
  }

  if (state.activeAnimation === 'wave') {
    const baseColor = hexToRgb(getAnimationColor());
    state.leds.forEach((led) => {
      const wave = Math.sin((led.x + time) * 0.8) + Math.cos((led.y + time) * 0.8) + Math.sin((led.z + time) * 0.8);
      const intensity = (wave + 3) / 6;
      const brightness = 0.08 + intensity * 0.92;
      led.color = `rgb(${Math.round(baseColor.r * brightness)}, ${Math.round(baseColor.g * brightness)}, ${Math.round(baseColor.b * brightness)})`;
    });
  }

  if (state.activeAnimation === 'ball') {
    const baseColor = hexToRgb(getAnimationColor());
    const center = {
      x: 3.5 + Math.sin(time * 0.85) * 3.1,
      y: 3.5 + Math.abs(Math.sin(time * 1.15)) * 3.1,
      z: 3.5 + Math.cos(time * 0.7) * 3.1
    };

    state.leds.forEach((led) => {
      const distance = Math.hypot(led.x - center.x, led.y - center.y, led.z - center.z);
      const brightness = Math.max(0, 1 - distance / 2.8);
      led.color = brightness > 0 ? colorAtBrightness(baseColor, 0.42 + brightness * 0.58) : '#000000';
    });
  }

  if (state.activeAnimation === 'lightning') {
    const baseColor = hexToRgb(getAnimationColor());
    const flashFrame = state.animationFrame % 90;
    const flashOn = flashFrame < 9 || (flashFrame > 14 && flashFrame < 19);

    state.leds.forEach((led) => {
      const pathKey = `${led.x},${led.y},${led.z}`;
      led.color = flashOn && state.lightningKeys.has(pathKey) ? colorAtBrightness(baseColor, 0.85) : '#000000';
    });

    if (flashFrame === 89) {
      state.lightningPath = createLightningPath();
      state.lightningKeys = new Set(state.lightningPath.map(point => `${point.x},${point.y},${point.z}`));
    }
  }

  updateAnimationNodes();
  state.animationFrame += 1;
  requestAnimationFrame(tickAnimation);
}

const viewport = document.querySelector('.viewport-section');

viewport.addEventListener('pointerdown', (event) => {
  state.dragging = true;
  state.dragStartX = event.clientX;
  state.dragStartY = event.clientY;
  state.lastX = state.rotationY;
  state.lastY = state.rotationX;
  state.lastZ = state.rotationZ;
  state.velocityX = 0;
  state.velocityY = 0;
  state.velocityZ = 0;
  viewport.setPointerCapture(event.pointerId);
});

viewport.addEventListener('pointermove', (event) => {
  if (!state.dragging) return;

  const deltaX = event.clientX - state.dragStartX;
  const deltaY = event.clientY - state.dragStartY;

  state.velocityX = deltaX * 0.18;
  state.velocityY = deltaY * 0.18;
  state.velocityZ = (deltaX * 0.08) + (deltaY * 0.05);

  state.rotationY = state.lastX + deltaX * 0.35;
  state.rotationX = state.lastY - deltaY * 0.35;
  state.rotationZ = state.lastZ + (deltaX * 0.12 + deltaY * 0.08);
  state.rotationX = Math.max(-89, Math.min(89, state.rotationX));

  applyMatrixRotation();
});

function animateMatrix() {
  if (!state.dragging) {
    state.rotationY += state.velocityX * 0.08;
    state.rotationX += state.velocityY * 0.08;
    state.rotationZ += state.velocityZ * 0.08;
    state.rotationX = Math.max(-89, Math.min(89, state.rotationX));

    state.velocityX *= 0.92;
    state.velocityY *= 0.92;
    state.velocityZ *= 0.92;

    if (Math.abs(state.velocityX) < 0.02) state.velocityX = 0;
    if (Math.abs(state.velocityY) < 0.02) state.velocityY = 0;
    if (Math.abs(state.velocityZ) < 0.02) state.velocityZ = 0;

    applyMatrixRotation();
  }

  requestAnimationFrame(animateMatrix);
}

requestAnimationFrame(tickAnimation);
requestAnimationFrame(animateMatrix);

viewport.addEventListener('pointerup', () => {
  state.dragging = false;
});

viewport.addEventListener('pointerleave', () => {
  state.dragging = false;
});

viewport.addEventListener('pointercancel', () => {
  state.dragging = false;
});
