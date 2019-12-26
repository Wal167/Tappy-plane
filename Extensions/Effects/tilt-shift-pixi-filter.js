gdjs.PixiFiltersTools.registerFilterCreator('Tilt shift', {
  makePIXIFilter: function(layer, effectData) {
    var tiltShiftFilter = new PIXI.filters.TiltShiftFilter();

    return tiltShiftFilter;
  },
  update: function(filter, layer) {
  },
  updateDoubleParameter: function(filter, parameterName, value) {
    if (parameterName === 'blur') {
      filter.blur = value;
    }
    if (parameterName === 'gradientBlur') {
      filter.gradientBlur = value;
    }
  },
  updateStringParameter: function(filter, parameterName, value) {
  },
  updateBooleanParameter: function(filter, parameterName, value) {
  },
});
