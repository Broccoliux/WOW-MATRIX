const state = {
  leds: [],
  selectedLEDs: new Set()
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

  const spacing = 35;
  const offset = -105;

  state.leds.forEach(led => {
    const node = document.createElement('div');
    node.className = 'node-3d';
    node.id = `node-3d-${led.id}`;

    const px = led.x * spacing + offset;
    const py = led.y * spacing + offset;
    const pz = led.z * spacing + offset;

    node.style.transform = `translate3d(${px}px, ${py}px, ${pz}px)`;
    node.style.backgroundColor = led.color;

    if (led.color !== '#000000') {
      node.style.boxShadow = `0 0 8px ${led.color}`;
    }

    node.addEventListener('click', () => {
      toggleSelectLED(led.id);
      renderTable(state.leds);
    });

    space.appendChild(node);
  });
}

function rotateMatrixX(val) {
  const space = document.getElementById('matrix3DSpace');
  const currentY = space.dataset.y || -45;
  space.style.transform = `rotateX(${val}deg) rotateY(${currentY}deg)`;
  space.dataset.x = val;
}

function rotateMatrixY(val) {
  const space = document.getElementById('matrix3DSpace');
  const currentX = space.dataset.x || 45;
  space.style.transform = `rotateX(${currentX}deg) rotateY(${val}deg)`;
  space.dataset.y = val;
}
