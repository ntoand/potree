import {Utils} from "../utils.js"

import {FirstPersonControls} from "../navigation/FirstPersonControls.js"
import {OrbitControls} from "../navigation/OrbitControls.js"

export class SidebarPrevis{

    constructor(viewer){
        this.viewer = viewer;
        
        //console.log(viewer);
        this.socket = io();
  
        //get tag
        this.demo = gTag.includes("000000_") ? true : false;
        let url = new URL(window.location.href);
        this.preset = url.searchParams.get("preset");
        if(this.preset === null || this.preset === undefined) this.preset = 'default';
        console.log('SidebarPrevis tag: ' + gTag + ' preset: ' + this.preset);

        // all color types
        this.colorTypes = [
            'RGB',
            'RGB and ELEVATION',
            'Color',
            'ELEVATION',
            'Intensity',
            'Intensity Gradient',
            'Classification',
            'Return Number',
            'Source',
            'Index',
            'Level of Detail',
            'Composite'
        ];
  
        this.gGui = {};
        this.hPreset = null;
        this.guiCaveAppearance = null;
        this.guiCaveSettings = null;
        this.presetList = ['default'];
        this.needUpdateList = true;
        this.navigationList = ['Orbit control', 'Fly control'];

        this.pointcloud = null;
        this.material = null; 
        this.numRetry = 1;
        
        //socket
        var scope = this;
        scope.socket.on('getsavelist', function(data) {
    
            if(data.status === 'error') {
                $('#status').text("Error! Cannot get save list");
                $("#info").show();
                setTimeout(scope.hideMessage, 3000);
            }
            else if(data.status == "done") {
                scope.presetList = data.result;
            }
            scope.loadSettings();
        });

        scope.socket.on('loadpotreesettings', function(data) {
            console.log("loadpotreesettings", data);
            var obj = scope.gGui.obj;
            
            if(data.status == "error") {
              $('#status').text("Error! Cannot load settings");
              $("#info").show();
              setTimeout(scope.hideMessage, 3000);
              return;
            }
            
            let result = data.result;
            if(result.forWebOnly !== undefined && result.forWebOnly !== null) {
              console.log(result.forWebOnly);
              obj.PointBudget = result.forWebOnly.PointBudget;
              obj.FOV = result.forWebOnly.FOV;
              obj.PointSize = result.forWebOnly.PointSize;
            }
            
            obj.PointSizing = result.sizeType.toUpperCase();
            obj.PointShape = result.quality.toUpperCase();
            obj.PointColorType = result.material.toUpperCase();
            if(result.elevationDirection == 0) {
                obj.ElevDirection = 'X';
            }
            else if (result.elevationDirection == 1) {
                obj.ElevDirection = 'Y';
            }
            else {
                obj.ElevDirection = 'Z';
            }
            obj.ElevRangeMin = result.elevationRange[0];
            obj.ElevRangeMax = result.elevationRange[1];
            obj.EDL = result.filter.toLowerCase() === 'edl';
            obj.EDLStrength = result.filterEdl[0];
            obj.EDLRadius = result.filterEdl[1];
            //console.log(obj);
            
            scope.viewer.scene.view.position.copy(new THREE.Vector3(result.cameraPosition[0], result.cameraPosition[1], result.cameraPosition[2]));
            scope.viewer.scene.view.lookAt(new THREE.Vector3(result.cameraTarget[0], result.cameraTarget[1], result.cameraTarget[2]));
            
            scope.guiCaveAppearance.updateDisplay();
            scope.guiCaveSettings.updateDisplay();
            scope.updateView();
            
            if (scope.needUpdateList === true) {
                scope.updateDatDropdown(scope.hPreset, scope.presetList);
                scope.needUpdateList = false;
            }
            
            $('#status').text("Loaded succesfully!");
            $("#info").show();
            setTimeout(scope.hideMessage, 3000);
        });
          
          
        scope.socket.on('savepotreesettings', function (data) {
            console.log(data);
            if(data.status == "error") {
                $('#status').text("Error! Cannot save settings");
                $("#info").show();
                setTimeout(scope.hideMessage, 3000);
            }
            else if(data.status == "done") {
                scope.socket.emit('getsavelist', { type: 'point', tag:  gTag, dir: gDir});
              
                $('#status').text("Saved succesfully!");
                $("#info").show();
                setTimeout(scope.hideMessage, 3000);
            }
        });
    }

    hideMessage() {
        $("#info").hide();
    }

    myInitLoop () {    
        var scope = this;       
        setTimeout(function () {    
            scope.pointcloud = scope.viewer.scene.pointclouds[0];
            if(scope.pointcloud === null || scope.pointcloud === undefined) {
                numRetry++;
                if(numRetry < 5) {
                    scope.myInitLoop();
                }
                else {
                    alert("Error: failed to find pointcloud data");
                }
            }
            else {
                console.log(scope.pointcloud);
                scope.material = scope.pointcloud.material;
                scope.viewer.setNavigationMode(OrbitControls); //default navigation mode
                scope.hideMessage();
                scope.initGui();
                scope.buildGui();
                scope.socket.emit('getsavelist', { type: 'point', tag:  gTag, dir: gDir});
            }                  
        }, 1000)
    }
    
    init(){
        this.myInitLoop();
    }

    initGui() {
        var scope = this;
        var obj = {
            Preset: scope.preset,
            Navigation: scope.navigationList[0],
            PointBudget: scope.viewer.getPointBudget(),
            FOV: scope.viewer.getFOV(),
            LoadSettings: function () {
                scope.loadSettings();
            },
            Save: function () {
                scope.saveSettings();
            },
            SaveAs: function () {
                scope.saveSettingsAs();
            },
            PointSize: scope.material.size,
            PointSizing: Object.keys(Potree.PointSizeType)[scope.material.pointSizeType],
            PointShape: Object.keys(Potree.PointShape)[scope.material.shape],
            PointColorType: scope.colorTypes[scope.material.pointColorType],
            ElevDirection: 'Z',
            ElevRangeMin: 0,
            ElevRangeMax: 1,
            EDL: scope.viewer.getEDLEnabled(),
            EDLRadius: scope.viewer.getEDLRadius(),
            EDLStrength: scope.viewer.getEDLStrength()
        };

        scope.gGui.obj = obj;
          
        var gui = new dat.GUI();
        scope.gGui.gui = gui;
    }

    buildGui() {
        console.log('buildGui');
        var scope = this;
        var obj = scope.gGui.obj;
        var gui = scope.gGui.gui;
        gui.destroy();
        gui = new dat.GUI();
        console.log(gui);
        
        // Control
        scope.hPreset = gui.add(obj, 'Preset', scope.presetList).name('Preset').listen();
        scope.hPreset.onFinishChange(function(value) {
            obj.Preset = value;
            scope.needUpdateList = false;
            // load setting and update gui
            scope.loadSettings();
        });
        
        if(!scope.demo) {
            gui.add(obj, 'Save');
            gui.add(obj, 'SaveAs').name('Save As');
        }

        // Navigation
        var navigation = gui.add(obj, 'Navigation', scope.navigationList).name('Camera Control').listen();
        navigation.onFinishChange(function(value) {
            obj.Navigation = value;
            if(value === 'Orbit control') {
                scope.viewer.setNavigationMode(OrbitControls);
            }
            else if (value === 'Fly control') {
                scope.viewer.setNavigationMode(FirstPersonControls);
                scope.viewer.fpControls.lockElevation = false;
            }
        });
        
        // Appearance
        scope.guiCaveAppearance = gui.addFolder('Appearance');
        var pointBudget = scope.guiCaveAppearance.add(obj, 'PointBudget').min(100 * 1000).max(10 * 1000 * 1000).step(1000);
        var FOV = scope.guiCaveAppearance.add(obj, 'FOV').min(20).max(100).step(1);
        //guiCaveAppearance.open();
        // Scene
        scope.guiCaveSettings = gui.addFolder('Settings');
        var pointSize = scope.guiCaveSettings.add(obj, 'PointSize').min(0).max(3).step(0.01);
        var pointSizing = scope.guiCaveSettings.add(obj, 'PointSizing', [ 'ADAPTIVE', 'FIXED' ]);
        var pointShape = scope.guiCaveSettings.add(obj, 'PointShape', [ 'SQUARE', 'CIRCLE' ]);
        var pointColorType = scope.guiCaveSettings.add(obj, 'PointColorType', [ 'RGB', 'ELEVATION' ]);
        var elevDirection = scope.guiCaveSettings.add(obj, 'ElevDirection', [ 'X', 'Y', 'Z' ]);
        var elevRangeMin = scope.guiCaveSettings.add(obj, 'ElevRangeMin').min(0).max(1).step(0.01);
        var elevRangeMax = scope.guiCaveSettings.add(obj, 'ElevRangeMax').min(0).max(1).step(0.01);
        var edlEnabled = scope.guiCaveSettings.add(obj, 'EDL');
        var edlRadius = scope.guiCaveSettings.add(obj, 'EDLRadius').min(1).max(4).step(0.01);
        var edlStrength = scope.guiCaveSettings.add(obj, 'EDLStrength').min(0).max(5).step(0.01);
        scope.guiCaveSettings.open();
        
        // GUI EVENTS
        pointBudget.onChange(function(value) {
            obj.PointBudget = value;
            scope.updateView();
        });
        
        FOV.onChange(function(value) {
            obj.FOV = value;
            scope.updateView();
        });
        
        pointSize.onChange(function(value) {
            obj.PointSize = value;
            scope.updateView();
        });
        
        pointSizing.onFinishChange(function(value) {
            obj.PointSizing = value;
            scope.updateView();
        });
        
        pointShape.onFinishChange(function(value) {
            obj.PointShape = value;
            scope.updateView();
        });
        
        pointColorType.onFinishChange(function(value) {
            obj.PointColorType = value;
            scope.updateView();
        });
        
        elevDirection.onFinishChange(function(value) {
            obj.ElevDirection = value;
            scope.updateView();
        });
        
        elevRangeMin.onChange(function(value) {
            obj.ElevRangeMin = value;
            scope.updateView();
        });
        
        elevRangeMax.onChange(function(value) {
            obj.ElevRangeMax = value;
            scope.updateView();
        });
        
        edlEnabled.onFinishChange(function(value) {
            obj.EDL = value;
            scope.updateView();
        });
    
        edlRadius.onChange(function(value) {
            obj.EDLRadius = value;
            scope.updateView();
        });
    
        edlStrength.onChange(function(value) {
            obj.EDLStrength = value;
            scope.updateView();
        });
    }

    updateView() {
        var scope = this;
        var obj = scope.gGui.obj;
    
        scope.viewer.setPointBudget(obj.PointBudget);
        scope.viewer.setFOV(obj.FOV);
        scope.material.size = obj.PointSize;
        if(obj.PointSizing === "FIXED") {
            scope.material.pointSizeType = Potree.PointSizeType.FIXED;
        }
        else {
            scope.material.pointSizeType = Potree.PointSizeType.ADAPTIVE;
        }
        if(obj.PointShape === "SQUARE") {
            scope.material.shape = Potree.PointShape.SQUARE;
        }
        else {
            scope.material.shape = Potree.PointShape.CIRCLE;
        }
        if(obj.PointColorType === "ELEVATION") {
            scope.material.pointColorType = 3;
        }
        else {
            scope.material.pointColorType = 0;
        }
        let ind = scope.getDirectionIndexFromString(obj.ElevDirection);
        scope.material.elevationDirection = ind;
        let range = scope.getRangeInfo(ind);
        scope.material.heightMin = range.min + obj.ElevRangeMin * range.length;
        scope.material.heightMax = range.min + obj.ElevRangeMax * range.length; 
        scope.viewer.setEDLEnabled(obj.EDL);
        scope.viewer.setEDLRadius(obj.EDLRadius);
        scope.viewer.setEDLStrength(obj.EDLStrength);
    }

    loadSettings() {
        var scope = this;
        console.log('loadSettings', gTag, scope.gGui.obj.Preset);
        scope.socket.emit('loadpotreesettings', {Tag: gTag, Dir: gDir, Preset: scope.gGui.obj.Preset});
    }
    
    saveSettings() {
        console.log("saveSettings");
        var scope = this;
        var obj = scope.gGui.obj;
    
        obj.CamLocation = scope.viewer.scene.getActiveCamera().position.toArray();
        obj.CamTarget = scope.viewer.scene.view.getPivot().toArray();
        
        //get tag
        obj.Tag = gTag;
        obj.Dir = gDir;
        
        console.log(obj);
        scope.socket.emit('savepotreesettings', obj);
    }

    saveSettingsAs() {
        var scope = this;
        let d = new Date();
        let tstr = d.getYear() + '' + d.getMonth() + '' + d.getDay() + '-' + d.getHours() + '' + d.getMinutes();
        var preset = prompt("Save current settings as", tstr);
        if (preset === null) return;
        if (preset === '') {
            $('#status').text("Error! Cannot save empty preset!");
            $("#info").show();
            setTimeout(scope.hideMessage, 3000);
            return;
        }
        preset = preset.replace(/ /g,"_");
        
        scope.gGui.obj.Preset = preset;
        scope.needUpdateList = true;
        scope.saveSettings();
    }

    updateDatDropdown(target, list){   
        let innerHTMLStr = "";
        if(list.constructor.name == 'Array'){
            for(var i=0; i<list.length; i++){
                var str = "<option value='" + list[i] + "'>" + list[i] + "</option>";
                innerHTMLStr += str;        
            }
        }
    
        if(list.constructor.name == 'Object'){
            for(var key in list){
                var str = "<option value='" + list[key] + "'>" + key + "</option>";
                innerHTMLStr += str;
            }
        }
        if (innerHTMLStr != "") target.domElement.children[0].innerHTML = innerHTMLStr;
    }

    getDirectionIndexFromString(direction) {
        if(direction == 'X')
            return 0;
        if(direction == 'Y')
            return 1;
        return 2;
    }

    getRangeInfo(direction) {
        var scope = this;
        let box = [scope.pointcloud.pcoGeometry.tightBoundingBox, scope.pointcloud.getBoundingBoxWorld()].find(v => v !== undefined);
        scope.pointcloud.updateMatrixWorld(true);
        box = Utils.computeTransformedBoundingBox(box, scope.pointcloud.matrixWorld);
        
        if(direction == 0)
            return {min: box.min.x, max: box.max.x, length: box.max.x - box.min.x};
    
        if(direction == 1)
            return {min: box.min.y, max: box.max.y, length: box.max.y - box.min.y};
            
        return {min: box.min.z, max: box.max.z, length: box.max.z - box.min.z};
    
        //let bMin = box.min.z - 0.2 * bWidth;
        //let bMax = box.max.z + 0.2 * bWidth;
    }


}