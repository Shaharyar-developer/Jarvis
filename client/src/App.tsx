import * as THREE from "three";
import "./index.css";
import { useFBX } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

export default function App() {
  return (
    <>
      <Scene />
    </>
  );
}

function Scene() {
  const fbx = useFBX("../objects/nyx.fbx");
  let neck: THREE.Object3D | null = null;
  useFrame(() => {
    if (neck) {
      neck.castShadow = true;
    }
  });

  if (!fbx) return null;
  fbx.traverse((child) => {
    console.log(child.name);

    if (child.name === "Torso") {
      neck = child;
    }
  });

  return <primitive object={fbx} position={new THREE.Vector3(-40, -36, -40)} />;
}
