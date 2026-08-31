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
  autoSpin: 0
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
}

function setMode(mode) {
  if (mode === 'solid') {
    const chosenColor = document.getElementById('bulkColorPicker').value;
    state.leds.forEach(led => led.color = chosenColor);
    filterLEDTable();
    render3DMatrix();
    console.log(`Solid fill applied with color: ${chosenColor}`);
  } else if (mode === 'animations') {
    const animName = prompt("Enter animation preset name (e.g., Rain, Fire, Wave):", "Rain");
    if (animName) {
      console.log(`Animation mode active: ${animName}`);
      alert(`Animation '${animName}' command queued for hardware sync.`);
    }
  } else {
    console.log(`Mode set to: ${mode}`);
  }
}

function clearMatrix() {
  state.leds.forEach(led => led.color = '#000000');
  state.selectedLEDs.clear();
  document.getElementById('selectAll').checked = false;
  filterLEDTable();
  render3DMatrix();
}

window.addEventListener('DOMContentLoaded', () => {
  initLEDGrid();
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

    const centerOffset = (volume - 1) * spacing / 2;
    const px = (led.x - 3.5) * spacing;
    const py = (led.y - 3.5) * spacing;
    const pz = (led.z - 3.5) * spacing;

    node.style.color = led.color;
    node.style.background = led.color;
    node.style.transform = `translate3d(${px}px, ${py}px, ${pz}px)`;
    node.style.boxShadow = 'inset -2px -2px 3px rgba(0,0,0,0.3), inset 2px 2px 3px rgba(255,255,255,0.2)';

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
  });
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

viewport.addEventListener('pointerup', () => {
  state.dragging = false;
});

viewport.addEventListener('pointerleave', () => {
  state.dragging = false;
});

viewport.addEventListener('pointercancel', () => {
  state.dragging = false;
});

requestAnimationFrame(animateMatrix);
