import * as THREE from "three128";

export type WarpFieldOptions = { speed: number; streakOpacity: number; tileOpacity: number; fov: number; brightness: number; hue: number; saturation: number };
export const WARP_FIELD_DEFAULTS: WarpFieldOptions = { speed: 15, streakOpacity: 0.6, tileOpacity: 0.9, fov: 75, brightness: 1, hue: 0, saturation: 1 };

export function createWarpFieldRenderer(canvas: HTMLCanvasElement, getOptions: () => WarpFieldOptions) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x02040a);
  scene.fog = new THREE.FogExp2(0x02040a, 0.001);
  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 2000);
  camera.position.z = 0;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const objects: any[] = [];
  const group = new THREE.Group();
  scene.add(group);

  const streakGeometry = new THREE.BufferGeometry();
  const streakCount = 400;
  const streakPositions = new Float32Array(streakCount * 6);
  const streakColors = new Float32Array(streakCount * 6);
  const colorPalette = [new THREE.Color(0x10b981), new THREE.Color(0x059669), new THREE.Color(0x34d399), new THREE.Color(0xffffff)];
  for (let index = 0; index < streakCount; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 800 + 20;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const z = (Math.random() - 0.5) * 2000;
    const length = Math.random() * 150 + 50;
    streakPositions[index * 6] = x;
    streakPositions[index * 6 + 1] = y;
    streakPositions[index * 6 + 2] = z;
    streakPositions[index * 6 + 3] = x;
    streakPositions[index * 6 + 4] = y;
    streakPositions[index * 6 + 5] = z + length;
    const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    streakColors[index * 6] = color.r; streakColors[index * 6 + 1] = color.g; streakColors[index * 6 + 2] = color.b;
    streakColors[index * 6 + 3] = color.r; streakColors[index * 6 + 4] = color.g; streakColors[index * 6 + 5] = color.b;
  }
  streakGeometry.setAttribute("position", new THREE.BufferAttribute(streakPositions, 3));
  streakGeometry.setAttribute("color", new THREE.BufferAttribute(streakColors, 3));
  const streakMaterial = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending });
  const streaks = new THREE.LineSegments(streakGeometry, streakMaterial);
  group.add(streaks);

  const boxGeometry = new THREE.PlaneGeometry(8, 20);
  const boxCount = 40;
  const boxMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
  let lastTileOpacity = boxMaterial.opacity;
  for (let index = 0; index < boxCount; index += 1) {
    const material = boxMaterial.clone();
    material.color.setHex(Math.random() > 0.6 ? 0xa7f3d0 : Math.random() > 0.5 ? 0xd1fae5 : 0xffffff);
    const mesh = new THREE.Mesh(boxGeometry, material);
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 400 + 100;
    mesh.position.x = Math.cos(angle) * radius;
    mesh.position.y = Math.sin(angle) * radius;
    mesh.position.z = (Math.random() - 0.5) * 2000;
    mesh.lookAt(0, 0, mesh.position.z + 100);
    const scale = Math.random() * 1.5 + 0.5;
    mesh.scale.set(scale, scale, scale);
    group.add(mesh);
    objects.push(mesh);
  }

  return {
    resize(width: number, height: number) {
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    },
    render() {
      const options = getOptions();
      const positionAttribute = streaks.geometry.attributes.position as unknown as { array: Float32Array; needsUpdate: boolean };
      const positions = positionAttribute.array;
      if (camera.fov !== options.fov) {
        camera.fov = options.fov;
        camera.updateProjectionMatrix();
      }
      if (streakMaterial.opacity !== options.streakOpacity) streakMaterial.opacity = options.streakOpacity;
      if (lastTileOpacity !== options.tileOpacity) {
        objects.forEach((object) => { object.material.opacity = options.tileOpacity; });
        lastTileOpacity = options.tileOpacity;
      }
      for (let index = 0; index < streakCount; index += 1) {
        positions[index * 6 + 2] += options.speed;
        positions[index * 6 + 5] += options.speed;
        if (positions[index * 6 + 2] > 200) {
          const length = positions[index * 6 + 5] - positions[index * 6 + 2];
          positions[index * 6 + 2] = -1800;
          positions[index * 6 + 5] = -1800 + length;
        }
      }
      positionAttribute.needsUpdate = true;
      objects.forEach((object) => {
        object.position.z += options.speed;
        if (object.position.z > 200) object.position.z = -1800;
      });
      renderer.render(scene, camera);
    },
    dispose() {
      streakGeometry.dispose();
      streakMaterial.dispose();
      boxGeometry.dispose();
      boxMaterial.dispose();
      objects.forEach((object) => object.material.dispose());
      renderer.dispose();
    },
  };
}
