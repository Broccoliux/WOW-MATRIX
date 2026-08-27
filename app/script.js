const state = {
  selectedVoxel: null,
  currentMode: 'solid',
  matrixData: {}
};

function setMode(mode) {
  state.currentMode = mode;
  console.log('Mode switched to: ${mode}');
}

function clearMatrix() {
  state.matrixData = {};
  state.selectedVoxel = null;
  updateInspectorPanel();
  console.log("Matrix cleared.");
}


function updateInspecttorpanel() {
  const coordDisplay = document.getElementById('selectedCoord');
  const colorPicker = document.getElementById('ledColorPicker');
  const applyBtn = document.getElementById('applyColorBtn');

  if (state.selectedVoxel) {
    const { x, y, z} = state.selctedVoxel;
    coordDisplay.innerText = 'Coordinates: X:${x}, Y:${y}, Z:${z}';
    colorDisplay.disabled = false;
    applyBtn.disabled = false;

    const key = '${x},${y},${z}';
    colorPicker.value = state.matrixData[key] || '#00ffcc';
  } else {
    coordDisplay.innerText = 'Coordinates:None';
    colorPicker.disabled = true;
    applyBtn.disabled = true;
  }
}
