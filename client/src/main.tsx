import { createRoot } from "react-dom/client";
import { Canvas } from "@react-three/fiber";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <Canvas className="canvas">
    <ambientLight intensity={0.2} />
    <pointLight position={[0, 0, 0]} decay={0} intensity={0.2} />
    <pointLight position={[0, -10, 0]} decay={0} intensity={0.2} />
    <App />
  </Canvas>
);
