initSidebarCave = (viewer) => {

  //console.log(viewer);
  var pointcloud = viewer.scene.pointclouds[0];
  var material = pointcloud.material;
  console.log(pointcloud);

  // all color types
  var colorTypes = [
    'RGB',
    'RGB and Elevation',
    'Color',
    'Elevation',
    'Intensity',
    'Intensity Gradient',
    'Classification',
    'Return Number',
    'Source',
    'Index',
    'Level of Detail',
    'Composite'
  ];

  var objCave = {
        PointBudget: viewer.getPointBudget(),
        FOV: viewer.getFOV(),
        SaveSettings: function () {
          saveSettings();
        },
        PointSize: material.size,
        PointSizing: Object.keys(Potree.PointSizeType)[material.pointSizeType],
        PointShape: Object.keys(Potree.PointShape)[material.shape],
        PointColorType: colorTypes[material.pointColorType],
        EDL: viewer.getEDLEnabled(),
        EDLRadius: viewer.getEDLRadius(),
        EDLStrength: viewer.getEDLStrength()
  };

  var guiCave = new dat.gui.GUI();
  //guiCave.remember(objCave);

  // Control
  guiCave.add(objCave, 'SaveSettings');

  // Appearance
  var guiCaveAppearance = guiCave.addFolder('Appearance');
  var pointBudget = guiCaveAppearance.add(objCave, 'PointBudget').min(100 * 1000).max(10 * 1000 * 1000).step(1000);
  var FOV = guiCaveAppearance.add(objCave, 'FOV').min(20).max(100).step(1);
  //guiCaveAppearance.open();
  // Scene
  var guiCaveSettings = guiCave.addFolder('Settings');
  var pointSize = guiCaveSettings.add(objCave, 'PointSize').min(0).max(3).step(0.01);
  var pointSizing = guiCaveSettings.add(objCave, 'PointSizing', [ 'ADAPTIVE', 'FIXED' ]);
  var pointShape = guiCaveSettings.add(objCave, 'PointShape', [ 'SQUARE', 'CIRCLE' ]);
  var pointColorType = guiCaveSettings.add(objCave, 'PointColorType', [ 'RGB', 'Elevation' ]);
  var edlEnabled = guiCaveSettings.add(objCave, 'EDL');
  var edlRadius = guiCaveSettings.add(objCave, 'EDLRadius').min(1).max(4).step(0.01);
  var edlStrength = guiCaveSettings.add(objCave, 'EDLStrength').min(0).max(5).step(0.01);
  guiCaveSettings.open();

  // GUI EVENTS
  pointBudget.onChange(function(value) {
    viewer.setPointBudget(value);
  });

  FOV.onChange(function(value) {
    viewer.setFOV(value);
  });

  pointSize.onChange(function(value) {
    material.size = value;
  });

  pointSizing.onFinishChange(function(value) {
    if(value === "FIXED") {
      material.pointSizeType = Potree.PointSizeType.FIXED;
    } else if (value === "ADAPTIVE") {
      material.pointSizeType = Potree.PointSizeType.ADAPTIVE;
    }
  });

  pointShape.onFinishChange(function(value) {
    if(value === "SQUARE") {
      material.shape = Potree.PointShape.SQUARE;
    } else if (value === "CIRCLE") {
      material.shape = Potree.PointShape.CIRCLE;
    }
  });

  pointColorType.onFinishChange(function(value) {
    if (value === "Elevation") {
      material.pointColorType = 3;
    } else {
      material.pointColorType = 0;
    }
  });

  edlEnabled.onFinishChange(function(value) {
    viewer.setEDLEnabled(value);
  });

  edlRadius.onChange(function(value) {
    viewer.setEDLRadius(value);
  });

  edlStrength.onChange(function(value) {
    viewer.setEDLStrength(value);
  });

  function saveSettings() {
    objCave.camLocation = viewer.scene.getActiveCamera().position.toArray();
    objCave.camTarget = viewer.scene.view.getPivot().toArray();
    console.log(objCave);
  }

  console.log("initSidebarCave");
}; // initSidebarCave
