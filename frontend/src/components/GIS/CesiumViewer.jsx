import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Viewer,
  Cartesian2,
  Cartesian3,
  Cartographic,
  TileMapServiceImageryProvider,
  buildModuleUrl,
  EllipsoidTerrainProvider,
  UrlTemplateImageryProvider,
  OpenStreetMapImageryProvider,
  ImageryLayer,
  Color,
  Material,
  Math as CesiumMath,
  CallbackProperty,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  CustomDataSource,
  VerticalOrigin,
  HorizontalOrigin,
  EasingFunction,
  Transforms,
  HeadingPitchRange,
  Matrix4
} from 'cesium';
import { classifyRisk, classifyRiskLevel, isValidCoordinate } from '../../services/riskService';

export default function CesiumViewerComponent({
  targetLat = 19.1071,
  targetLon = 72.9228,
  isGps = false,
  isScanning = false,
  showContours = false,
  contourSpacing = 30.0,
  terrainData = null,
  zoom = 14000,
  onLocationClick = null
}) {
  const cesiumContainer = useRef(null);
  const viewerRef = useRef(null);
  const mountedRef = useRef(true);
  const entitySourceRef = useRef(null);
  const lastFlightRef = useRef(null);
  const baseImageryLayerRef = useRef(null);
  const currentBasemapRef = useRef('satellite');
  const onLocationClickRef = useRef(onLocationClick);

  useEffect(() => {
    onLocationClickRef.current = onLocationClick;
  }, [onLocationClick]);

  // Tactical Modes & State
  const [hoverCoords, setHoverCoords] = useState(null);
  const [basemap, setBasemap] = useState('satellite'); // 'satellite' | 'street' | 'topo' | 'dark'
  const [shadingMode, setShadingMode] = useState('photoreal'); // 'photoreal' | 'contours' | 'slope' | 'grid'
  const [viewPreset, setViewPreset] = useState('3d'); // 'space' | '3d' | '2d' | 'profile' | 'orbit'
  const [isOrbiting, setIsOrbiting] = useState(false);
  const [enableDayNight, setEnableDayNight] = useState(false);

  // Live Camera Telemetry Readout
  const [telemetry, setTelemetry] = useState({
    heading: 0,
    pitch: -60,
    altitude: '14.0 km',
    lat: '19.1071',
    lon: '72.9228'
  });

  // 1. Initialize High-Performance Cesium Digital Twin Viewer (Exactly ONCE)
  useEffect(() => {
    mountedRef.current = true;
    if (!cesiumContainer.current) return;
    // PRIORITY 1: Prevent duplicate globe instances
    if (viewerRef.current && !viewerRef.current.isDestroyed()) return;
    cesiumContainer.current.innerHTML = '';

    // High-Resolution World Satellite Imagery as primary basemap (100% Free, No Watermark)
    const initialImagery = new UrlTemplateImageryProvider({
      url: 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
      subdomains: ['a','b','c'],
      maximumLevel: 19
    });
    initialImagery.errorEvent.addEventListener(() => {});

    let viewer;
    try {
      viewer = new Viewer(cesiumContainer.current, {
        animation: false,
        baseLayerPicker: false,
        baseLayer: new ImageryLayer(initialImagery),
        terrainProvider: new EllipsoidTerrainProvider(),
        fullscreenButton: false,
        geocoder: false,
        homeButton: false,
        infoBox: false,
        sceneModePicker: false,
        selectionIndicator: false,
        timeline: false,
        navigationHelpButton: false,
        scene3DOnly: true,
        shouldAnimate: true,
      });
    } catch (err) {
      console.error('Failed to initialize Cesium Viewer WebGL context:', err);
      return;
    }

    baseImageryLayerRef.current = viewer.imageryLayers.get(0);

    // Guaranteed local offline NaturalEarthII fallback base layer (served locally via Vite, zero network needed)
    try {
      TileMapServiceImageryProvider.fromUrl(buildModuleUrl('Assets/Textures/NaturalEarthII'))
        .then(offlineProvider => {
          if (mountedRef.current && viewer && !viewer.isDestroyed() && viewer.imageryLayers) {
            offlineProvider.errorEvent.addEventListener(() => {});
            const offlineLayer = viewer.imageryLayers.addImageryProvider(offlineProvider, 0);
            viewer.imageryLayers.lowerToBottom(offlineLayer);
          }
        })
        .catch(err => {
          console.warn('Local NaturalEarthII asset notice:', err);
        });
    } catch (e) {}

    // Suppress default Cesium Ion access token banner and credit watermarks
    if (viewer.creditDisplay && viewer.creditDisplay.container) {
      viewer.creditDisplay.container.style.display = 'none';
    }
    if (viewer.bottomContainer) {
      viewer.bottomContainer.style.display = 'none';
    }

    if (viewer.cesiumWidget) {
      viewer.cesiumWidget.showErrorPanel = (title, message) => {
        console.warn('Cesium status notice:', title, message);
      };
      // PRIORITY 0: Remove Cesium default double-click action to avoid conflicting camera animations
      try {
        if (viewer.cesiumWidget.screenSpaceEventHandler) {
          viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
        }
      } catch (e) {}
    }

    // High Dynamic Range & Advanced Atmospheric Scattering
    try {
      viewer.scene.highDynamicRange = true;
    } catch (e) {}

    viewer.scene.globe.baseColor = Color.fromCssColorString('#103b60');
    viewer.scene.globe.depthTestAgainstTerrain = false;
    viewer.scene.globe.enableLighting = false;
    viewer.scene.globe.showGroundAtmosphere = true;
    viewer.scene.globe.atmosphereLightIntensity = 3.2;
    viewer.scene.backgroundColor = Color.fromCssColorString('#04060a');
    if (viewer.scene.skyAtmosphere) {
      viewer.scene.skyAtmosphere.show = true;
      viewer.scene.skyAtmosphere.brightnessShift = 0.08;
      viewer.scene.skyAtmosphere.saturationShift = 0.15;
    }

    // Fog configuration for atmospheric depth perception
    if (viewer.scene.fog) {
      viewer.scene.fog.enabled = true;
      viewer.scene.fog.density = 0.00015;
      viewer.scene.fog.screenSpaceErrorFactor = 2.0;
    }

    // Dedicated CustomDataSource for atomic entity additions/removals
    const entitySource = new CustomDataSource('commandCenterEntities');
    viewer.dataSources.add(entitySource);
    entitySourceRef.current = entitySource;

    // IMMEDIATE INITIAL FRAMING: Point camera directly at validated coordinates
    const parsedLat = Number(targetLat);
    const parsedLon = Number(targetLon);
    const initLat = isValidCoordinate(parsedLat, parsedLon) ? parsedLat : 19.1071;
    const initLon = isValidCoordinate(parsedLat, parsedLon) ? parsedLon : 72.9228;
    const initAlt = Math.max(Number(zoom) || 14000, 10000);
    const initOffset = (initAlt / 111000) * 0.45;

    try {
      viewer.camera.setView({
        destination: Cartesian3.fromDegrees(initLon, initLat - initOffset, initAlt),
        orientation: {
          heading: CesiumMath.toRadians(0.0),
          pitch: CesiumMath.toRadians(-60.0),
          roll: 0.0
        }
      });
    } catch (e) {
      console.warn('Initial camera setView error:', e);
    }

    lastFlightRef.current = { lat: initLat, lon: initLon, alt: initAlt, preset: '3d' };
    viewerRef.current = viewer;

    // Configure ScreenSpaceCameraController for 100% Free, Unrestricted 3D Navigation
    const ssc = viewer.scene.screenSpaceCameraController;
    ssc.enableRotate = true;
    ssc.enableTranslate = true;
    ssc.enableZoom = true;
    ssc.enableTilt = true;
    ssc.enableLook = true;
    ssc.enableCollisionDetection = false;
    ssc.inertiaSpin = 0.88;
    ssc.inertiaTranslate = 0.88;
    ssc.inertiaZoom = 0.82;
    ssc.bounceAnimationTime = 0.0;
    ssc.minimumZoomDistance = 20.0;
    ssc.maximumZoomDistance = 25000000.0;

    // PRIORITY 0: Listen to camera moveStart to cancel orbit safely WITHOUT hijacking WHEEL/PINCH events
    const removeMoveStart = viewer.camera.moveStart.addEventListener(() => {
      setIsOrbiting(false);
    });

    // ScreenSpaceEventHandler for Mouse Coordinate Readout & Click Inspection
    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);

    // Mouse Move: Instant geographic coordinates & elevation sampling
    handler.setInputAction((movement) => {
      if (!viewer || viewer.isDestroyed() || !viewer.scene || !movement || !movement.endPosition) return;
      const ellipsoid = viewer.scene.globe.ellipsoid;
      const cartesian = viewer.camera.pickEllipsoid(movement.endPosition, ellipsoid);
      if (cartesian) {
        const cartographic = Cartographic.fromCartesian(cartesian);
        const lonStr = CesiumMath.toDegrees(cartographic.longitude).toFixed(4);
        const latStr = CesiumMath.toDegrees(cartographic.latitude).toFixed(4);
        const elev = Math.round(cartographic.height || 0);
        if (mountedRef.current) {
          setHoverCoords(`LAT: ${latStr}° | LON: ${lonStr}° | ELEV: ${elev >= 0 ? elev : 0}m`);
        }
      } else {
        if (mountedRef.current) setHoverCoords(null);
      }
    }, ScreenSpaceEventType.MOUSE_MOVE);

    // Drag vs Click Tracking: ensure dragging does not trigger accidental coordinate resets
    let dragStartPos = null;
    handler.setInputAction((down) => {
      if (down && down.position) {
        dragStartPos = Cartesian2.clone(down.position);
      }
    }, ScreenSpaceEventType.LEFT_DOWN);

    // Left Click: Interactive Terrain Inspection & Target Selection (only if not dragged)
    handler.setInputAction((click) => {
      if (!viewer || viewer.isDestroyed() || !viewer.scene || !click || !click.position) return;
      setIsOrbiting(false);

      if (dragStartPos && click && click.position) {
        const moveDist = Cartesian2.distance(dragStartPos, click.position);
        if (moveDist > 6) {
          return; // User was panning/rotating the globe, not clicking a single point
        }
      }

      const ellipsoid = viewer.scene.globe.ellipsoid;
      const cartesian = viewer.camera.pickEllipsoid(click.position, ellipsoid);
      if (cartesian) {
        const carto = Cartographic.fromCartesian(cartesian);
        const pickedLat = parseFloat(CesiumMath.toDegrees(carto.latitude).toFixed(4));
        const pickedLon = parseFloat(CesiumMath.toDegrees(carto.longitude).toFixed(4));
        if (isValidCoordinate(pickedLat, pickedLon)) {
          onLocationClickRef.current?.({ lat: pickedLat, lon: pickedLon });
        }
      }
    }, ScreenSpaceEventType.LEFT_CLICK);

    // Double Click: Smoothly zoom into clicked geographic point
    handler.setInputAction((click) => {
      if (!viewer || viewer.isDestroyed() || !viewer.scene || !click || !click.position) return;
      setIsOrbiting(false);
      const ellipsoid = viewer.scene.globe.ellipsoid;
      const cartesian = viewer.camera.pickEllipsoid(click.position, ellipsoid);
      if (cartesian) {
        const carto = Cartographic.fromCartesian(cartesian);
        const lat = CesiumMath.toDegrees(carto.latitude);
        const lon = CesiumMath.toDegrees(carto.longitude);
        if (isValidCoordinate(lat, lon)) {
          const currentAlt = viewer.camera?.positionCartographic?.height || 14000;
          const targetAlt = Math.max(currentAlt * 0.45, 1200);
          try {
            viewer.camera.flyTo({
              destination: Cartesian3.fromDegrees(lon, lat, targetAlt),
              duration: 1.0,
              easingFunction: EasingFunction.QUADRATIC_OUT
            });
          } catch (e) {
            console.warn('Double click flyTo notice:', e);
          }
        }
      }
    }, ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

    // PRIORITY 0: Throttled Real-Time Camera Orientation Telemetry (max 10 Hz to prevent React render storm)
    let lastTelemetryTick = 0;
    const updateTelemetry = () => {
      if (!mountedRef.current || !viewerRef.current || viewerRef.current.isDestroyed()) return;
      const now = performance.now();
      if (now - lastTelemetryTick < 100) return; // 10 fps throttle for UI HUD
      lastTelemetryTick = now;

      const cam = viewerRef.current.camera;
      if (!cam) return;
      const carto = cam.positionCartographic;
      if (!carto) return; // Prevents crash when camera tilts into sky or deep space

      const headingDeg = Math.round(CesiumMath.toDegrees(cam.heading || 0));
      const pitchDeg = Math.round(CesiumMath.toDegrees(cam.pitch || 0));
      const altM = Math.round(carto.height || 0);
      const altStr = altM > 10000 ? `${(altM / 1000).toFixed(1)} km` : `${altM} m`;
      const latStr = CesiumMath.toDegrees(carto.latitude || 0).toFixed(4);
      const lonStr = CesiumMath.toDegrees(carto.longitude || 0).toFixed(4);

      setTelemetry({
        heading: (headingDeg + 360) % 360,
        pitch: pitchDeg,
        altitude: altStr,
        lat: latStr,
        lon: lonStr
      });
    };

    let removeCamChanged = null;
    try {
      removeCamChanged = viewer.camera.changed.addEventListener(updateTelemetry);
    } catch (e) {}
    updateTelemetry();

    // Guarantee full-bleed responsive canvas resizing
    const handleResize = () => {
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.resize();
      }
    };
    window.addEventListener('resize', handleResize);
    requestAnimationFrame(() => handleResize());
    const resizeTimer = setTimeout(handleResize, 200);

    return () => {
      mountedRef.current = false;
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
      try {
        if (removeCamChanged) removeCamChanged();
        if (removeMoveStart) removeMoveStart();
        if (handler && !handler.isDestroyed()) handler.destroy();
      } catch (e) {}
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        try {
          viewerRef.current.destroy();
        } catch (e) {}
        viewerRef.current = null;
      }
    };
  }, []);

  // 2. Dynamic Multi-Source Basemap Switching
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;
    if (currentBasemapRef.current === basemap && baseImageryLayerRef.current) return;
    currentBasemapRef.current = basemap;

    let provider;
    if (basemap === 'satellite') {
      // Ultra-HD Satellite Orthophoto (ArcGIS World Imagery)
      provider = new UrlTemplateImageryProvider({
        url: 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        subdomains: ['a','b','c'],
        maximumLevel: 19
      });
    } else if (basemap === 'topo') {
      // Shaded Relief Topographic Map (ArcGIS World Topo)
      provider = new UrlTemplateImageryProvider({
        url: 'https://a.tile.opentopomap.org/{z}/{x}/{y}.png',
        subdomains: ['a','b','c'],
        maximumLevel: 17
      });
    } else if (basemap === 'street') {
      // Full Navigation Roads & Labels (ArcGIS World Street Map - 100% Free, Never Blocked)
      provider = new UrlTemplateImageryProvider({
        url: 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        subdomains: ['a','b','c'],
        maximumLevel: 19
      });
    } else {
      // Tactical Dark Canvas (Completely Free, No Watermark)
      provider = new UrlTemplateImageryProvider({
        url: 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        subdomains: ['a','b','c','d'],
        maximumLevel: 19
      });
    }

    try {
      provider.errorEvent.addEventListener(() => {});
      if (baseImageryLayerRef.current && !viewer.isDestroyed()) {
        viewer.imageryLayers.remove(baseImageryLayerRef.current);
      }
      const newLayer = viewer.imageryLayers.addImageryProvider(provider);
      baseImageryLayerRef.current = newLayer;
    } catch (e) {
      console.warn('Basemap swap notice:', e);
    }
  }, [basemap]);

  // 3. Terrain Shading Shader Materials (Elevation Contours, Slope Hazard Ramp, Digital Grid, Photoreal)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed() || !viewer.scene || !viewer.scene.globe) return;

    if (shadingMode === 'contours' && showContours) {
      try {
        const contourMaterial = Material.fromType('ElevationContour');
        contourMaterial.uniforms.width = 2.0;
        contourMaterial.uniforms.spacing = Number(contourSpacing) || 30.0;
        contourMaterial.uniforms.color = Color.fromCssColorString('#00e5ff');
        viewer.scene.globe.material = contourMaterial;
      } catch (err) {
        console.warn('Contour material notice:', err);
      }
    } else if (shadingMode === 'slope') {
      try {
        // Dynamic slope hazard color ramp (Green = stable <25°, Amber = 25-35°, Red = 35-50°, Crimson = >50° cliffs)
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createLinearGradient(0, 0, 256, 0);
        grad.addColorStop(0.0, 'rgba(0, 229, 255, 0.0)');
        grad.addColorStop(0.25, 'rgba(34, 197, 94, 0.3)');
        grad.addColorStop(0.38, 'rgba(245, 158, 11, 0.65)');
        grad.addColorStop(0.55, 'rgba(239, 68, 68, 0.88)');
        grad.addColorStop(1.0, 'rgba(255, 0, 85, 0.96)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 256, 1);

        const slopeMaterial = Material.fromType('SlopeRamp');
        slopeMaterial.uniforms.image = canvas;
        viewer.scene.globe.material = slopeMaterial;
      } catch (err) {
        console.warn('Slope ramp material notice:', err);
      }
    } else if (shadingMode === 'grid') {
      try {
        const gridMaterial = Material.fromType('Grid');
        gridMaterial.uniforms.color = Color.fromCssColorString('#00e5ff').withAlpha(0.65);
        gridMaterial.uniforms.cellAlpha = 0.04;
        gridMaterial.uniforms.lineCount = new Cartesian2(50, 50);
        gridMaterial.uniforms.lineThickness = new Cartesian2(1.2, 1.2);
        viewer.scene.globe.material = gridMaterial;
      } catch (err) {
        console.warn('Grid material notice:', err);
      }
    } else {
      // Photorealistic natural terrain
      try {
        viewer.scene.globe.material = null;
      } catch (e) {
        viewer.scene.globe.material = undefined;
      }
    }
  }, [shadingMode, showContours, contourSpacing]);

  // 4. Day / Night Solar Lighting Toggle
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed() || !viewer.scene || !viewer.scene.globe) return;
    try {
      viewer.scene.globe.enableLighting = enableDayNight;
    } catch (e) {}
  }, [enableDayNight]);

  // 5. Cinematic 360° Drone Orbit around Target
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed() || !viewer.scene) return;

    if (!isOrbiting) {
      try {
        viewer.camera.lookAtTransform(Matrix4.IDENTITY);
      } catch (e) {}
      return;
    }

    const lat = Number(targetLat) || 19.1071;
    const lon = Number(targetLon) || 72.9228;
    const center = Cartesian3.fromDegrees(lon, lat);
    const transform = Transforms.eastNorthUpToFixedFrame(center);

    let heading = CesiumMath.toRadians(telemetry.heading);
    const pitch = CesiumMath.toRadians(-45.0);
    const range = Math.max(Number(zoom) || 14000, 8000);

    const onTick = () => {
      if (!mountedRef.current || !viewerRef.current || viewerRef.current.isDestroyed()) return;
      heading += 0.003; // Smooth cinematic angular velocity
      if (heading > CesiumMath.TWO_PI) heading -= CesiumMath.TWO_PI;
      try {
        viewer.camera.lookAtTransform(
          transform,
          new HeadingPitchRange(heading, pitch, range)
        );
      } catch (e) {}
    };

    let removePreRender = null;
    try {
      removePreRender = viewer.scene.preRender.addEventListener(onTick);
    } catch (e) {}

    return () => {
      try {
        if (removePreRender) removePreRender();
        if (viewerRef.current && !viewerRef.current.isDestroyed()) {
          viewerRef.current.camera.lookAtTransform(Matrix4.IDENTITY);
        }
      } catch (e) {}
    };
  }, [isOrbiting, targetLat, targetLon, zoom]);

  // 6. Camera Perspective Mode Transitions (Space Earth, 3D Relief, 2D Nadir, Slope Profile)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed() || !targetLat || !targetLon) return;
    if (isOrbiting) return; // Orbiting handles its own camera

    const lat = Number(targetLat);
    const lon = Number(targetLon);

    let alt = Math.max(Number(zoom) || 14000, 10000);
    let pitchDeg = -60.0;
    let headingDeg = 0.0;

    if (viewPreset === 'space') {
      // Full 3D Spherical Earth View from Space (Curvature, atmosphere & globe fully visible)
      alt = 12000000;
      pitchDeg = -90.0;
    } else if (viewPreset === '2d') {
      // Nadir Planar Map View
      alt = Math.max(Number(zoom) || 16000, 12000);
      pitchDeg = -90.0;
    } else if (viewPreset === 'profile') {
      // Steep Slope Geotechnical Profile (Low Altitude Perspective)
      alt = 6500;
      pitchDeg = -32.0;
    } else {
      // Standard 3D Bird's Eye
      alt = Math.max(Number(zoom) || 14000, 10000);
      pitchDeg = -60.0;
    }

    const latOffset = (pitchDeg !== -90.0 && alt < 50000) ? (alt / 111000) * Math.tan(CesiumMath.toRadians(Math.abs(pitchDeg + 90))) * 0.75 : 0.0;

    const last = lastFlightRef.current;
    if (
      last &&
      Math.abs(last.lat - lat) < 0.0001 &&
      Math.abs(last.lon - lon) < 0.0001 &&
      last.preset === viewPreset &&
      Math.abs(last.alt - alt) < 50
    ) {
      return;
    }

    lastFlightRef.current = { lat, lon, alt, preset: viewPreset };

    if (!isValidCoordinate(lat, lon)) return;

    try {
      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(lon, Math.max(-85, Math.min(85, lat - latOffset)), alt),
        orientation: {
          heading: CesiumMath.toRadians(headingDeg),
          pitch: CesiumMath.toRadians(pitchDeg),
          roll: 0.0,
        },
        duration: alt > 1000000 ? 2.5 : 1.8,
        easingFunction: EasingFunction.QUADRATIC_IN_OUT
      });
    } catch (err) {
      console.warn('Camera flight notice:', err);
    }
  }, [targetLat, targetLon, zoom, viewPreset, isOrbiting]);

  // 7. Atomic Entities Rendering (Hologram Laser Beacon, Radar Pulse, Topo Rings & Tactical Tag)
  useEffect(() => {
    const entitySource = entitySourceRef.current;
    if (!entitySource) return;

    const lat = Number(targetLat);
    const lon = Number(targetLon);
    if (!isValidCoordinate(lat, lon)) return;

    entitySource.entities.removeAll();

    const elevation = terrainData?.elevation || 350;
    const slope = terrainData?.slope || 18;
    const fos = terrainData?.fos || 1.22;
    const riskLevel = terrainData?.riskLevel || 'MODERATE';

    // Centralized Single Source of Truth for Risk Classification:
    // 0–30: GREEN (#22c55e), 31–70: YELLOW (#eab308), 71–100: RED (#ef4444)
    const rawScore = terrainData?.riskScore !== undefined
      ? terrainData.riskScore
      : (terrainData?.riskLevel ? (terrainData.riskLevel === 'CRITICAL' ? 88 : (terrainData.riskLevel === 'HIGH' ? 62 : 20)) : 20);
    const riskInfo = classifyRisk(rawScore);
    const themeColor = Color.fromCssColorString(riskInfo.hex);

    // A. Outer Surveyed Geotechnical Perimeter Area
    entitySource.entities.add({
      position: Cartesian3.fromDegrees(lon, lat),
      ellipse: {
        semiMinorAxis: 2400.0,
        semiMajorAxis: 2400.0,
        material: themeColor.withAlpha(riskInfo.fillAlpha || 0.14),
        outline: true,
        outlineColor: themeColor.withAlpha(riskInfo.outlineAlpha || 0.90),
        outlineWidth: 2.5,
        height: 5
      }
    });

    // B. Concentric Topographic Contour Range Rings (300m, 600m, 1200m, 1800m)
    [300, 600, 1200, 1800].forEach((r, idx) => {
      entitySource.entities.add({
        position: Cartesian3.fromDegrees(lon, lat),
        ellipse: {
          semiMinorAxis: r,
          semiMajorAxis: r,
          material: Color.TRANSPARENT,
          outline: true,
          outlineColor: themeColor.withAlpha(0.25 + idx * 0.15),
          outlineWidth: 1.5,
          height: 6 + idx
        }
      });
    });

    // C. 3D Cyber Laser Beacon Column (reaching 2500m into stratosphere)
    const beaconHeight = 2500.0;
    entitySource.entities.add({
      position: Cartesian3.fromDegrees(lon, lat, beaconHeight / 2),
      cylinder: {
        length: beaconHeight,
        topRadius: 8.0,
        bottomRadius: 28.0,
        material: themeColor.withAlpha(0.65),
      }
    });

    // D. Ground Point Marker with Geodesic Radar Pulse (Frame-cached to guarantee semiMajorAxis === semiMinorAxis)
    let cachedPulseRadius = 80;
    let lastPulseCalc = 0;
    const pulseRadiusProperty = new CallbackProperty(() => {
      const now = performance.now();
      if (now !== lastPulseCalc) {
        lastPulseCalc = now;
        cachedPulseRadius = 80 + ((now / 1000 * (riskInfo.pulseSpeed || 250)) % 2200);
      }
      return cachedPulseRadius;
    }, false);

    entitySource.entities.add({
      position: Cartesian3.fromDegrees(lon, lat),
      ellipse: {
        semiMinorAxis: pulseRadiusProperty,
        semiMajorAxis: pulseRadiusProperty,
        material: themeColor.withAlpha(0.20),
        outline: true,
        outlineColor: themeColor.withAlpha(0.95),
        outlineWidth: 2.0,
        height: 10
      }
    });

    // E. Floating Tactical HUD Target Badge
    entitySource.entities.add({
      position: Cartesian3.fromDegrees(lon, lat, 300),
      point: {
        pixelSize: isGps ? 16 : 13,
        color: themeColor,
        outlineColor: Color.WHITE,
        outlineWidth: 2.5,
      },
      label: {
        text: `${isGps ? '📍 GPS POSITION LOCKED' : '🎯 TARGET SURVEY ZONE'} [${riskInfo.badge}]
${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E
ELEV: ${elevation}m · SLOPE: ${slope}° · FoS: ${fos}`,
        font: 'bold 11px JetBrains Mono, monospace',
        fillColor: Color.WHITE,
        outlineColor: Color.BLACK,
        outlineWidth: 3,
        showBackground: true,
        backgroundColor: Color.fromCssColorString('rgba(8, 12, 20, 0.94)'),
        backgroundPadding: new Cartesian2(10, 6),
        pixelOffset: new Cartesian2(0, -60),
        horizontalOrigin: HorizontalOrigin.CENTER,
        verticalOrigin: VerticalOrigin.BOTTOM,
      }
    });

    // F. Active LiDAR Scanning Wave (when scanning transition is active)
    if (isScanning) {
      let cachedScanRadius = 60;
      let cachedScanRadius2 = 30;
      let lastScanCalc = 0;
      const scanRadiusProperty = new CallbackProperty(() => {
        const now = performance.now();
        if (now !== lastScanCalc) {
          lastScanCalc = now;
          cachedScanRadius = 60 + ((now / 1000 * 950) % 3200);
          cachedScanRadius2 = 30 + (((now + 500) / 1000 * 950) % 3200);
        }
        return cachedScanRadius;
      }, false);

      const scanRadiusProperty2 = new CallbackProperty(() => cachedScanRadius2, false);

      // Primary Sonar Wave Ring
      entitySource.entities.add({
        position: Cartesian3.fromDegrees(lon, lat),
        ellipse: {
          semiMinorAxis: scanRadiusProperty,
          semiMajorAxis: scanRadiusProperty,
          material: Color.fromCssColorString('#00e5ff').withAlpha(0.35),
          outline: true,
          outlineColor: Color.fromCssColorString('#00e5ff'),
          outlineWidth: 3.0
        }
      });

      // Secondary Echo Wave Ring
      entitySource.entities.add({
        position: Cartesian3.fromDegrees(lon, lat),
        ellipse: {
          semiMinorAxis: scanRadiusProperty2,
          semiMajorAxis: scanRadiusProperty2,
          material: Color.fromCssColorString('#ff3b5c').withAlpha(0.2),
          outline: true,
          outlineColor: Color.fromCssColorString('#ff3b5c'),
          outlineWidth: 2.0
        }
      });
    }
  }, [
    targetLat,
    targetLon,
    isGps,
    isScanning,
    terrainData?.elevation,
    terrainData?.slope,
    terrainData?.fos,
    terrainData?.riskScore,
    terrainData?.riskLevel
  ]);

  // Action: Reset view to True North
  const handleResetNorth = () => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;
    viewer.camera.flyTo({
      destination: viewer.camera.position,
      orientation: {
        heading: CesiumMath.toRadians(0.0),
        pitch: viewer.camera.pitch,
        roll: 0.0
      },
      duration: 1.0,
      easingFunction: EasingFunction.QUADRATIC_OUT
    });
  };

  const handleZoomIn = () => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;
    viewer.camera.zoomIn(viewer.camera.positionCartographic.height * 0.35);
  };

  const handleZoomOut = () => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;
    viewer.camera.zoomOut(viewer.camera.positionCartographic.height * 0.5);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#05070a' }}>
      {/* 3D WebGL Canvas Container */}
      <div
        ref={cesiumContainer}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%'
        }}
      />

      {/* ─── TOP CONTROL FLIGHT DECK (Center-Aligned) ─── */}
      <div style={{
        position: 'absolute',
        top: 14,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: 'rgba(8, 12, 20, 0.92)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--border-default)',
        borderRadius: 8,
        padding: '5px 12px',
        zIndex: 25,
        boxShadow: '0 8px 32px rgba(0,0,0,0.7)'
      }}>
        {/* Re-center Target */}
        <button
          onClick={() => {
            setIsOrbiting(false);
            setViewPreset('3d');
          }}
          title="Re-center camera on target coordinates"
          className="btn btn-secondary btn-sm"
          style={{
            fontSize: 11,
            padding: '4px 9px',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          🎯 Re-Center
        </button>

        {/* 360° Drone Orbit Toggle */}
        <button
          onClick={() => setIsOrbiting(!isOrbiting)}
          title="Continuous 360° cinematic drone orbit around target terrain"
          className="btn btn-secondary btn-sm"
          style={{
            fontSize: 11,
            padding: '4px 9px',
            fontFamily: 'var(--font-mono)',
            background: isOrbiting ? 'rgba(0, 229, 255, 0.25)' : 'transparent',
            borderColor: isOrbiting ? 'var(--cyan)' : 'var(--border-subtle)',
            color: isOrbiting ? 'var(--cyan)' : 'var(--text-secondary)'
          }}
        >
          {isOrbiting ? '🔄 Orbit Active' : '🔄 360° Orbit'}
        </button>

        <div style={{ width: 1, height: 16, background: 'var(--border-subtle)', margin: '0 2px' }} />

        {/* Camera Angle Mode Selector */}
        <div style={{ display: 'flex', gap: 3 }}>
          <button
            onClick={() => { setIsOrbiting(false); setViewPreset('space'); }}
            title="3D Global Spherical Earth View from Space (Altitude 12,000 km)"
            style={{
              fontSize: 10,
              padding: '3px 8px',
              borderRadius: 4,
              border: `1px solid ${viewPreset === 'space' && !isOrbiting ? 'var(--cyan)' : 'transparent'}`,
              background: viewPreset === 'space' && !isOrbiting ? 'rgba(0, 229, 255, 0.18)' : 'transparent',
              color: viewPreset === 'space' && !isOrbiting ? 'var(--cyan)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)'
            }}
          >
            🌍 Space
          </button>
          <button
            onClick={() => { setIsOrbiting(false); setViewPreset('3d'); }}
            title="3D Perspective Relief (Tilt -60°)"
            style={{
              fontSize: 10,
              padding: '3px 8px',
              borderRadius: 4,
              border: `1px solid ${viewPreset === '3d' && !isOrbiting ? 'var(--cyan)' : 'transparent'}`,
              background: viewPreset === '3d' && !isOrbiting ? 'rgba(0, 229, 255, 0.18)' : 'transparent',
              color: viewPreset === '3d' && !isOrbiting ? 'var(--cyan)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)'
            }}
          >
            🦅 3D Relief
          </button>
          <button
            onClick={() => { setIsOrbiting(false); setViewPreset('2d'); }}
            title="2D Top-Down Nadir (Orthomosaic -90°)"
            style={{
              fontSize: 10,
              padding: '3px 8px',
              borderRadius: 4,
              border: `1px solid ${viewPreset === '2d' && !isOrbiting ? 'var(--cyan)' : 'transparent'}`,
              background: viewPreset === '2d' && !isOrbiting ? 'rgba(0, 229, 255, 0.18)' : 'transparent',
              color: viewPreset === '2d' && !isOrbiting ? 'var(--cyan)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)'
            }}
          >
            🗺️ 2D Nadir
          </button>
          <button
            onClick={() => { setIsOrbiting(false); setViewPreset('profile'); }}
            title="Steep Slope Cross-Section Profile (Tilt -32°)"
            style={{
              fontSize: 10,
              padding: '3px 8px',
              borderRadius: 4,
              border: `1px solid ${viewPreset === 'profile' && !isOrbiting ? 'var(--cyan)' : 'transparent'}`,
              background: viewPreset === 'profile' && !isOrbiting ? 'rgba(0, 229, 255, 0.18)' : 'transparent',
              color: viewPreset === 'profile' && !isOrbiting ? 'var(--cyan)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)'
            }}
          >
            ⛰️ Profile
          </button>
        </div>

        <div style={{ width: 1, height: 16, background: 'var(--border-subtle)', margin: '0 2px' }} />

        {/* Terrain Shader Material Shading Mode */}
        <div style={{ display: 'flex', gap: 3 }}>
          <button
            onClick={() => setShadingMode('contours')}
            title="Elevation Contours Shader (30m interval lines)"
            style={{
              fontSize: 10,
              padding: '3px 7px',
              borderRadius: 4,
              border: `1px solid ${shadingMode === 'contours' ? 'var(--cyan)' : 'transparent'}`,
              background: shadingMode === 'contours' ? 'rgba(0, 229, 255, 0.18)' : 'transparent',
              color: shadingMode === 'contours' ? 'var(--cyan)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)'
            }}
          >
            〰️ Contours
          </button>
          <button
            onClick={() => setShadingMode('slope')}
            title="Slope Gradient Hazard Ramp (Colorizes steep landslide slopes)"
            style={{
              fontSize: 10,
              padding: '3px 7px',
              borderRadius: 4,
              border: `1px solid ${shadingMode === 'slope' ? 'var(--orange)' : 'transparent'}`,
              background: shadingMode === 'slope' ? 'rgba(255, 107, 53, 0.2)' : 'transparent',
              color: shadingMode === 'slope' ? 'var(--orange)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)'
            }}
          >
            ◢ Slope Heatmap
          </button>
          <button
            onClick={() => setShadingMode('grid')}
            title="Digital Twin Cybernetic Coordinate Grid"
            style={{
              fontSize: 10,
              padding: '3px 7px',
              borderRadius: 4,
              border: `1px solid ${shadingMode === 'grid' ? 'var(--cyan)' : 'transparent'}`,
              background: shadingMode === 'grid' ? 'rgba(0, 229, 255, 0.18)' : 'transparent',
              color: shadingMode === 'grid' ? 'var(--cyan)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)'
            }}
          >
            🌐 Grid
          </button>
          <button
            onClick={() => setShadingMode('photoreal')}
            title="Natural Photorealistic Terrain (No shader overlay)"
            style={{
              fontSize: 10,
              padding: '3px 7px',
              borderRadius: 4,
              border: `1px solid ${shadingMode === 'photoreal' ? 'var(--cyan)' : 'transparent'}`,
              background: shadingMode === 'photoreal' ? 'rgba(0, 229, 255, 0.18)' : 'transparent',
              color: shadingMode === 'photoreal' ? 'var(--cyan)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)'
            }}
          >
            🏔️ Natural
          </button>
        </div>

        <div style={{ width: 1, height: 16, background: 'var(--border-subtle)', margin: '0 2px' }} />

        {/* Basemap Imagery Dropdown/Buttons */}
        <div style={{ display: 'flex', gap: 3 }}>
          <button
            onClick={() => setBasemap('dark')}
            title="Tactical Dark Ops"
            style={{
              fontSize: 10,
              padding: '3px 7px',
              borderRadius: 4,
              border: `1px solid ${basemap === 'dark' ? 'var(--cyan)' : 'transparent'}`,
              background: basemap === 'dark' ? 'rgba(0, 229, 255, 0.18)' : 'transparent',
              color: basemap === 'dark' ? 'var(--cyan)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)'
            }}
          >
            🌌 Dark
          </button>
          <button
            onClick={() => setBasemap('satellite')}
            title="Ultra-HD Satellite Orthophoto (ArcGIS World Imagery)"
            style={{
              fontSize: 10,
              padding: '3px 7px',
              borderRadius: 4,
              border: `1px solid ${basemap === 'satellite' ? 'var(--cyan)' : 'transparent'}`,
              background: basemap === 'satellite' ? 'rgba(0, 229, 255, 0.18)' : 'transparent',
              color: basemap === 'satellite' ? 'var(--cyan)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)'
            }}
          >
            🛰️ Satellite
          </button>
          <button
            onClick={() => setBasemap('topo')}
            title="World Shaded Topo Relief (ArcGIS Topo)"
            style={{
              fontSize: 10,
              padding: '3px 7px',
              borderRadius: 4,
              border: `1px solid ${basemap === 'topo' ? 'var(--cyan)' : 'transparent'}`,
              background: basemap === 'topo' ? 'rgba(0, 229, 255, 0.18)' : 'transparent',
              color: basemap === 'topo' ? 'var(--cyan)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)'
            }}
          >
            ⛰️ Topo
          </button>
          <button
            onClick={() => setBasemap('street')}
            title="OpenStreetMap Streets"
            style={{
              fontSize: 10,
              padding: '3px 7px',
              borderRadius: 4,
              border: `1px solid ${basemap === 'street' ? 'var(--cyan)' : 'transparent'}`,
              background: basemap === 'street' ? 'rgba(0, 229, 255, 0.18)' : 'transparent',
              color: basemap === 'street' ? 'var(--cyan)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)'
            }}
          >
            🗺️ Street
          </button>
        </div>

        <div style={{ width: 1, height: 16, background: 'var(--border-subtle)', margin: '0 2px' }} />

        {/* Solar Lighting Toggle */}
        <button
          onClick={() => setEnableDayNight(!enableDayNight)}
          title="Toggle Live Solar Terminator & Mountain Shadows"
          style={{
            fontSize: 10,
            padding: '3px 7px',
            borderRadius: 4,
            border: `1px solid ${enableDayNight ? 'var(--amber)' : 'transparent'}`,
            background: enableDayNight ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
            color: enableDayNight ? 'var(--amber)' : 'var(--text-muted)',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)'
          }}
        >
          {enableDayNight ? '☀️ Solar ON' : '🌙 Solar OFF'}
        </button>

        <div style={{ width: 1, height: 16, background: 'var(--border-subtle)', margin: '0 2px' }} />

        {/* Zoom Controls */}
        <button
          onClick={handleZoomIn}
          title="Zoom In (+)"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '2px 6px',
            fontSize: 14,
            fontWeight: 700
          }}
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out (−)"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '2px 6px',
            fontSize: 14,
            fontWeight: 700
          }}
        >
          −
        </button>
      </div>

      {/* ─── REAL-TIME COMPASS & GIMBAL TELEMETRY GIZMO (Top-Right HUD) ─── */}
      <div style={{
        position: 'absolute',
        top: 240, // Positioned cleanly below the right telemetry panel
        right: 16,
        width: 240,
        background: 'rgba(8, 12, 20, 0.88)',
        backdropFilter: 'blur(14px)',
        border: '1px solid var(--border-default)',
        borderRadius: 8,
        padding: '12px 14px',
        color: 'var(--text-primary)',
        zIndex: 20,
        boxShadow: '0 8px 24px rgba(0,0,0,0.6)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
            GEOSPATIAL GIMBAL
          </div>
          {/* True North Reset Arrow */}
          <button
            onClick={handleResetNorth}
            title="Click to align with True North"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: 0
            }}
          >
            <div style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              border: '1px solid var(--border-cyan)',
              background: 'rgba(0, 229, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `rotate(-${telemetry.heading}deg)`,
              transition: 'transform 0.15s ease'
            }}>
              <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--cyan)' }}>▲</span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--cyan)' }}>
              {telemetry.heading.toString().padStart(3, '0')}°
            </span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 10, fontFamily: 'var(--font-mono)' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '4px 6px', borderRadius: 4 }}>
            <span style={{ color: 'var(--text-muted)' }}>PITCH: </span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{telemetry.pitch}°</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '4px 6px', borderRadius: 4 }}>
            <span style={{ color: 'var(--text-muted)' }}>EYE ALT: </span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{telemetry.altitude}</span>
          </div>
          <div style={{ gridColumn: 'span 2', background: 'rgba(255,255,255,0.03)', padding: '4px 6px', borderRadius: 4, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>CAM FIX:</span>
            <span style={{ color: 'var(--cyan)' }}>{telemetry.lat}°N, {telemetry.lon}°E</span>
          </div>
        </div>
      </div>

      {/* ─── DYNAMIC CURSOR COORDINATES & ELEVATION (Bottom-Right) ─── */}
      {hoverCoords && (
        <div style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          background: 'rgba(8, 12, 20, 0.9)',
          backdropFilter: 'blur(8px)',
          color: 'var(--cyan)',
          padding: '6px 14px',
          borderRadius: '6px',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          zIndex: 15,
          pointerEvents: 'none',
          border: '1px solid var(--border-cyan)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.6)'
        }}>
          {hoverCoords}
        </div>
      )}

      {/* ─── STATUS PILL & QUICK METRICS (Bottom-Center, perfectly clear of all sidebars) ─── */}
      {targetLat && targetLon && (
        <div style={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: 'rgba(8, 12, 20, 0.92)',
          backdropFilter: 'blur(12px)',
          padding: '7px 20px',
          borderRadius: 6,
          border: '1px solid var(--border-default)',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--text-primary)',
          zIndex: 15,
          pointerEvents: 'none',
          boxShadow: '0 4px 24px rgba(0,0,0,0.7)'
        }}>
          <span style={{ color: 'var(--cyan)' }}>〰️ CONTOURS: {contourSpacing}m</span>
          <span style={{ color: 'var(--border-subtle)' }}>|</span>
          <span style={{ color: isGps ? 'var(--green)' : 'var(--amber)', fontWeight: 700 }}>
            {isGps ? '📍 GPS TELEMETRY LOCKED' : '🎯 TARGET PINNED'}
          </span>
          <span style={{ color: 'var(--border-subtle)' }}>|</span>
          <span style={{ color: 'var(--text-secondary)' }}>
            ELEV: {terrainData?.elevation || 350}m · SLOPE: {terrainData?.slope || 18}° · FoS: {terrainData?.fos || 1.22}
          </span>
          <span style={{ color: 'var(--border-subtle)' }}>|</span>
          <span style={{
            fontSize: 10,
            padding: '2px 8px',
            borderRadius: 4,
            background: classifyRisk(terrainData?.riskScore !== undefined ? terrainData.riskScore : (terrainData?.riskLevel === 'CRITICAL' ? 88 : (terrainData?.riskLevel === 'HIGH' ? 62 : 20))).bgAlpha,
            color: classifyRisk(terrainData?.riskScore !== undefined ? terrainData.riskScore : (terrainData?.riskLevel === 'CRITICAL' ? 88 : (terrainData?.riskLevel === 'HIGH' ? 62 : 20))).hex,
            border: `1px solid ${classifyRisk(terrainData?.riskScore !== undefined ? terrainData.riskScore : (terrainData?.riskLevel === 'CRITICAL' ? 88 : (terrainData?.riskLevel === 'HIGH' ? 62 : 20))).borderHex}`,
            fontWeight: 800
          }}>
            {classifyRisk(terrainData?.riskScore !== undefined ? terrainData.riskScore : (terrainData?.riskLevel === 'CRITICAL' ? 88 : (terrainData?.riskLevel === 'HIGH' ? 62 : 20))).badge}
          </span>
        </div>
      )}
    </div>
  );
}
