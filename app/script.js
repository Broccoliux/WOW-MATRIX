const state = {
  leds: [],
  selectedLEDs: new Set()
};


function initLEDGrid() {
  state.leds = [];
  let index = 0;

  for (let z = 0; z < 4; z++) {
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        state.leds.push({
          id: indexx++,
          x: x,
          y: y,
          z: z,
          color: '#000000'
        });
      }
    }
  }
  renderTable(state.leds);
}

function renderTable(ledArry) {
  const tbody = document.getElementById('ledTableBody');
  tbody.innerHTML = '';

  ledArry.forEach(led => {
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

function fillterLEDTable() {
  const query = document.getElementById('ledSearchInput').value.toLowerCase().trim();

  if (query === '') {
    renderTable(state.leds);
    return;
  }

  const filtered = state.leds.filter(led => {
    const coorString = `${led.x},${led.y},${led.z}`;
    return led.id.toString().includes(query) || coorString.includes(query);
    
  });
}
