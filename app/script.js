
const state = {
  selectedVoxel: null,
  currentMode: 'solid',
  matrixData: {}
};

function setMode(mode) {
  state.currentMode = mode;
  console.log(`Mode switched to: ${mode}`);
}


function clearMatrix() {
  state.matrixData = {};
  state.selectedVoxel = null;
  renderMatrixGrid();
  updateInspectorPanel();
  console.log("Matrix cleared.");
}


function updateInspectorPanel() {
  const coordDisplay = document.getElementById('selectedCoord');
  const colorPicker = document.getElementById('ledColorPicker');
  const applyBtn = document.getElementById('applyColorBtn');

  if (state.selectedVoxel) {
    const { x, y, z } = state.selectedVoxel;
    coordDisplay.innerText = `Coordinates: X:${x}, Y:${y}, Z:${z}`;
    colorPicker.disabled = false;
    applyBtn.disabled = false;

    const key = `${x},${y},${z}`;
    colorPicker.value = state.matrixData[key] || '#00ffcc';
  } else {
    coordDisplay.innerText = 'Coordinates: None';
    colorPicker.disabled = true;
    applyBtn.disabled = true;
  }
}

document.getElementById('applyColorBtn').addEventListener('click', () => {
  if (!state.selectedVoxel) return;

  const { x, y, z } = state.selectedVoxel;
  const color = document.getElementById('ledColorPicker').value;
  const key = `${x},${y},${z}`;

  state.matrixData[key] = color;
  const node = document.querySelector(`.led-node[data-x="${x}"][data-y="${y}"][data-z="${z}"]`);
  if (node) {
    node.style.backgroundColor = color;
    node.style.boxShadow = `0 0 8px ${color}`;
  }
  console.log(`Voxel (${x}, ${y}, ${z}) set to color: ${color}`);
});


function initApp() {
  console.log("3D Matrix Controller Initialized.");
  renderMatrixGrid();
  updateInspectorPanel();
}

window.addEventListener('DOMContentLoaded', initApp);


function renderMatrixGrid() {
  const container = document.getElementById('cubeContainer');
  container.innerHTML = '';

  const size = 4;

  for (let z = 0; z < size; z++) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const node = document.createElement('div');
        node.className = 'led-node';
        node.dataset.x = x;
        node.dataset.y = y;
        node.dataset.z = z;
        node.style.left = `${x * 28 + z * 10}px`;
        node.style.top = `${(size - 1 - y) * 28 + z * 10}px`;
        const key = `${x},${y},${z}`;
        const color = state.matrixData[key];
        if (color) {
          node.style.backgroundColor = color;
          node.style.boxShadow = `0 0 8px ${color}`;
        }



        node.addEventListener('click', () => {

          document.querySelectorAll('.led-node.selected').forEach(n => n.classList.remove('selected'));

          node.classList.add('selected');
          state.selectedVoxel = { x, y, z };
          updateInspectorPanel();
        });

        container.appendChild(node);
      }
    }
  }
  console.log(`Rendered ${size}x${size}x${size} interactive matrix grid.`);
}
