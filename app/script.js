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
  state.matrixData = {
  state.selectedVoxel = null;
  
  }
}
