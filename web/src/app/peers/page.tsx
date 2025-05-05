"use client"

import React, { useEffect, useRef, useState } from "react"
import * as BABYLON from "babylonjs"
import "babylonjs-loaders"

function createAnimatedBlock({
  scene,
  blockSize,
  gridCount,
  cubeletSize,
  totalDuration,
}: {
  scene: BABYLON.Scene
  blockSize: number
  gridCount: number
  cubeletSize: number
  totalDuration: number
}) {
  const GRID_SIZE = gridCount
  const CUBE_SIZE = blockSize
  const GRID_LENGTH = CUBE_SIZE
  const step = GRID_LENGTH / GRID_SIZE
  const NUM_CUBELETS = Math.pow(GRID_SIZE + 1, 3)
  const CUBELET_SIZE = cubeletSize

  const bufferTime = totalDuration * 0.1 // 10% buffer at the end
  const effectiveDuration = totalDuration - bufferTime

  // Animation timing fractions
  const gridFormationFraction = 0.7 // 70% for grid
  const gridFormationTime = effectiveDuration * gridFormationFraction
  const cubeletAnimTime = effectiveDuration - gridFormationTime

  // --- Glowing Grid Tubes (cell-level, instanced, smooth animation) ---
  const gridMaterial = new BABYLON.StandardMaterial("gridMat", scene)
  gridMaterial.emissiveColor = new BABYLON.Color3(0.6, 0.4, 1)

  // --- Instanced Cubes: dark, sleek, metallic ---
  const baseCube = BABYLON.MeshBuilder.CreateBox("cubelet", { size: CUBELET_SIZE }, scene)
  const cubeMat = new BABYLON.StandardMaterial("cubeMat", scene)
  cubeMat.diffuseColor = new BABYLON.Color3(0.12, 0.22, 0.32)
  cubeMat.specularColor = new BABYLON.Color3(0.5, 0.5, 0.6)
  baseCube.material = cubeMat
  baseCube.isVisible = false

  // Store per-cubelet animation state
  const startPositions: BABYLON.Vector3[] = []
  const delays: number[] = []
  const animProgress: number[] = []
  const paths: BABYLON.Vector3[][] = []
  const cubelets: BABYLON.InstancedMesh[] = []
  const cubeletData: { target: BABYLON.Vector3; arrived: boolean; travelTime: number }[] = []

  // Before the for loop, create a shuffled array of indices for random appearance order
  const shuffledAppearOrder = Array.from({ length: NUM_CUBELETS }, (_, i) => i)
  for (let i = shuffledAppearOrder.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffledAppearOrder[i], shuffledAppearOrder[j]] = [shuffledAppearOrder[j], shuffledAppearOrder[i]]
  }

  let appearOrderIdx = 0
  for (let i = 0; i <= GRID_SIZE; i++) {
    for (let j = 0; j <= GRID_SIZE; j++) {
      for (let k = 0; k <= GRID_SIZE; k++) {
        const tx = -GRID_LENGTH / 2 + i * step
        const ty = -GRID_LENGTH / 2 + j * step
        const tz = -GRID_LENGTH / 2 + k * step
        // Start at a random grid cell inside the block
        const randI = Math.floor(Math.random() * (GRID_SIZE + 1))
        const randJ = Math.floor(Math.random() * (GRID_SIZE + 1))
        const randK = Math.floor(Math.random() * (GRID_SIZE + 1))
        const sx = -GRID_LENGTH / 2 + randI * step
        const sy = -GRID_LENGTH / 2 + randJ * step
        const sz = -GRID_LENGTH / 2 + randK * step
        // Path
        const path: BABYLON.Vector3[] = []
        let ci = randI,
          cj = randJ,
          ck = randK
        path.push(new BABYLON.Vector3(sx, sy, sz))
        const moves: string[] = []
        for (let n = 0; n < Math.abs(i - randI); n++) moves.push("i")
        for (let n = 0; n < Math.abs(j - randJ); n++) moves.push("j")
        for (let n = 0; n < Math.abs(k - randK); n++) moves.push("k")
        for (let n = moves.length - 1; n > 0; n--) {
          const m = Math.floor(Math.random() * (n + 1))
          ;[moves[n], moves[m]] = [moves[m], moves[n]]
        }
        for (const move of moves) {
          if (move === "i") ci += Math.sign(i - randI)
          if (move === "j") cj += Math.sign(j - randJ)
          if (move === "k") ck += Math.sign(k - randK)
          path.push(
            new BABYLON.Vector3(
              -GRID_LENGTH / 2 + ci * step,
              -GRID_LENGTH / 2 + cj * step,
              -GRID_LENGTH / 2 + ck * step
            )
          )
        }
        paths.push(path)
        // Cubelet
        const cubelet = baseCube.createInstance(`cubelet_${i}_${j}_${k}`)
        cubelet.material = cubeMat
        cubelet.scaling.set(CUBELET_SIZE, CUBELET_SIZE, CUBELET_SIZE)
        cubelet.position.set(sx, sy, sz)
        cubelet.isVisible = false
        cubelets.push(cubelet)
        startPositions.push(new BABYLON.Vector3(sx, sy, sz))
        // Calculate timing based on total duration
        const gridTime = totalDuration * gridFormationFraction
        const remainingTime = totalDuration - gridTime
        const appearWindow = remainingTime * 0.5
        const travelWindow = remainingTime * 0.5
        const appearInterval = appearWindow / NUM_CUBELETS
        const appearIdx = shuffledAppearOrder[appearOrderIdx++]
        const delay = appearIdx * appearInterval
        const travelTime = travelWindow
        delays.push(delay)
        animProgress.push(0)
        cubeletData.push({
          target: new BABYLON.Vector3(tx, ty, tz),
          arrived: false,
          travelTime,
        })
      }
    }
  }
  // --- Glowing Grid Tubes (cell-level, instanced, smooth animation) ---
  // Create a base tube mesh (unit length, will scale/position instances)
  const baseTube = BABYLON.MeshBuilder.CreateTube(
    "baseTube",
    {
      path: [new BABYLON.Vector3(0, 0, 0), new BABYLON.Vector3(1, 0, 0)],
      radius: 0.06,
      updatable: false,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE,
    },
    scene
  )
  baseTube.material = gridMaterial
  baseTube.isVisible = false

  // Helper to get cell segment transforms
  function cellSegmentTransform(axis: number, i: number, j: number, k: number, step: number, GRID_LENGTH: number) {
    // axis: 0=X, 1=Y, 2=Z
    // i, j, k: cell indices
    const base = [-GRID_LENGTH / 2 + i * step, -GRID_LENGTH / 2 + j * step, -GRID_LENGTH / 2 + k * step]
    const pos = new BABYLON.Vector3(base[0], base[1], base[2])
    let rot = BABYLON.Quaternion.Identity()
    if (axis === 0) {
      // X edge
      rot = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Z, 0)
    } else if (axis === 1) {
      // Y edge
      rot = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Z, Math.PI / 2)
    } else {
      // Z edge
      rot = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, -Math.PI / 2)
    }
    return { pos, rot }
  }

  // Helper to get numpad-like scan order for a 2D grid
  function numpadOrder(rows: number, cols: number): [number, number][] {
    const res: [number, number][] = []
    for (let j = 0; j < cols; j++) {
      if (j % 2 === 0) {
        // Bottom to top
        for (let i = 0; i < rows; i++) {
          res.push([i, j])
        }
      } else {
        // Top to bottom
        for (let i = rows - 1; i >= 0; i--) {
          res.push([i, j])
        }
      }
    }
    return res
  }

  // --- 3D printer style: bottom-to-top, circular per-layer (fixed placement) ---
  // Generate all cell-level tube instances (including last row/column), ordered for 3D printer effect
  const cellTubeInstances: BABYLON.InstancedMesh[] = []
  const cellTubeOrder: BABYLON.InstancedMesh[] = []
  // For each Y layer, create X and Z edges in numpad order, then Y edges
  for (let y = 0; y <= GRID_SIZE; y++) {
    // X edges: build 2D array of valid (i, k)
    const xEdgeGrid: [number, number][] = []
    for (let i = 0; i <= GRID_SIZE; i++) {
      for (let k = 0; k <= GRID_SIZE; k++) {
        xEdgeGrid.push([i, k])
      }
    }
    // Numpad order for X edges
    const numpadX = numpadOrder(GRID_SIZE, GRID_SIZE + 1)
    for (const [si, sk] of numpadX) {
      // Map numpad index to valid (i, k)
      const idx = si * (GRID_SIZE + 1) + sk
      if (idx < xEdgeGrid.length) {
        const [i, k] = xEdgeGrid[idx]
        const { pos, rot } = cellSegmentTransform(0, i, y, k, step, GRID_LENGTH)
        const inst = baseTube.createInstance(`cellTube_X_${i}_${y}_${k}`)
        inst.position.copyFrom(pos)
        inst.rotationQuaternion = rot
        inst.scaling.set(step, 1, 1)
        inst.isVisible = false
        cellTubeInstances.push(inst)
        cellTubeOrder.push(inst)
      }
    }
    // Z edges: build 2D array of valid (i, k)
    const zEdgeGrid: [number, number][] = []
    for (let i = 0; i <= GRID_SIZE; i++) {
      for (let k = 0; k <= GRID_SIZE; k++) {
        zEdgeGrid.push([i, k])
      }
    }
    // Numpad order for Z edges
    const numpadZ = numpadOrder(GRID_SIZE + 1, GRID_SIZE)
    for (const [si, sk] of numpadZ) {
      const idx = si * (GRID_SIZE + 1) + sk
      if (idx < zEdgeGrid.length) {
        const [i, k] = zEdgeGrid[idx]
        const { pos, rot } = cellSegmentTransform(2, i, y, k, step, GRID_LENGTH)
        const inst = baseTube.createInstance(`cellTube_Z_${i}_${y}_${k}`)
        inst.position.copyFrom(pos)
        inst.rotationQuaternion = rot
        inst.scaling.set(step, 1, 1)
        inst.isVisible = false
        cellTubeInstances.push(inst)
        cellTubeOrder.push(inst)
      }
    }
    const yEdgeGrid: [number, number][] = []
    for (let i = 0; i <= GRID_SIZE; i++) {
      for (let k = 0; k <= GRID_SIZE; k++) {
        if (y < GRID_SIZE) {
          yEdgeGrid.push([i, k])
        }
      }
    }
    // Numpad order for Y edges
    const numpadY = numpadOrder(GRID_SIZE + 1, GRID_SIZE + 1)
    for (const [si, sk] of numpadY) {
      const idx = si * (GRID_SIZE + 1) + sk
      if (idx < yEdgeGrid.length) {
        const [i, k] = yEdgeGrid[idx]
        const { pos, rot } = cellSegmentTransform(1, i, y, k, step, GRID_LENGTH)
        const inst = baseTube.createInstance(`cellTube_Y_${i}_${y}_${k}`)
        inst.position.copyFrom(pos)
        inst.rotationQuaternion = rot
        inst.scaling.set(step, 1, 1)
        inst.isVisible = false
        cellTubeInstances.push(inst)
        cellTubeOrder.push(inst)
      }
    }
  }

  // Group cubelets by Y layer
  const cubeletsByLayer: { [y: number]: number[] } = {}
  for (let idx = 0; idx < NUM_CUBELETS; idx++) {
    const j = Math.floor((idx / (GRID_SIZE + 1)) % (GRID_SIZE + 1))
    if (!cubeletsByLayer[j]) cubeletsByLayer[j] = []
    cubeletsByLayer[j].push(idx)
  }

  // Animate
  let globalTime = 0
  let fps = 60
  scene.onBeforeRenderObservable.add(() => {
    if (scene.getEngine().getFps) {
      fps = scene.getEngine().getFps() || 60
    }
    globalTime += 1 / fps

    // --- Cell-level tube animation (instanced, smooth) ---
    const totalTubes = cellTubeOrder.length
    const tubesToShow = Math.floor(Math.min(1, globalTime / gridFormationTime) * totalTubes)
    for (let i = 0; i < totalTubes; i++) {
      cellTubeOrder[i].isVisible = i < tubesToShow
    }

    // Only start cubelet animation after grid is fully built
    if (globalTime < gridFormationTime) return
    const cubeletTime = globalTime - gridFormationTime
    for (let y = 0; y <= GRID_SIZE; y++) {
      if (cubeletsByLayer[y]) {
        for (const idx of cubeletsByLayer[y]) {
          const cubelet = cubelets[idx]
          const data = cubeletData[idx]
          if (data.arrived) {
            cubelet.position.copyFrom(data.target)
            cubelet.scaling.set(CUBELET_SIZE, CUBELET_SIZE, CUBELET_SIZE)
            cubelet.isVisible = true
            continue
          }
          // Add a small random delay per cubelet within the total cubelet animation time
          const appearOrder = delays[idx] // 0..1
          const appearTime = appearOrder * cubeletAnimTime * 0.3 // Use 30% of cubeletAnimTime for appearance
          if (cubeletTime < appearTime) {
            cubelet.position.copyFrom(startPositions[idx])
            cubelet.isVisible = false
            continue
          }
          // Animate along the path
          const path = paths[idx]
          if (path.length < 2) {
            // Path is a single point
            cubelet.position.copyFrom(data.target)
            data.arrived = true
          } else {
            const totalSegments = path.length - 1
            const t = Math.min(1, Math.max(0, (cubeletTime - appearTime) / data.travelTime))
            const segFloat = t * totalSegments
            let segIdx = Math.floor(segFloat)
            let segT = segFloat - segIdx
            // Clamp segIdx to valid range
            if (segIdx >= totalSegments) {
              segIdx = totalSegments - 1
              segT = 1
            }
            if (segIdx < 0) {
              segIdx = 0
              segT = 0
            }
            const a = path[segIdx]
            const b = path[segIdx + 1]
            cubelet.position.set(a.x + (b.x - a.x) * segT, a.y + (b.y - a.y) * segT, a.z + (b.z - a.z) * segT)
            if (t >= 1) {
              cubelet.position.copyFrom(data.target)
              data.arrived = true
            }
          }
          cubelet.isVisible = true
        }
      }
    }
  })
}

const Blocks = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [fps, setFps] = useState(0)

  useEffect(() => {
    if (!canvasRef.current) return
    const engine = new BABYLON.Engine(canvasRef.current, true, { preserveDrawingBuffer: true }, true)
    const scene = new BABYLON.Scene(engine)
    scene.clearColor = new BABYLON.Color4(0, 0, 0, 0)

    // Camera
    const camera = new BABYLON.ArcRotateCamera(
      "camera",
      -Math.PI / 2,
      Math.PI / 2.5,
      60,
      new BABYLON.Vector3(0, 0, 0),
      scene
    )
    camera.attachControl(canvasRef.current, true)

    // Lighting
    const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene)
    light.intensity = 1

    // Glow layer for grid only
    const glowLayer = new BABYLON.GlowLayer("glow", scene)
    glowLayer.intensity = 1

    // Call the helper function
    createAnimatedBlock({
      scene,
      blockSize: 24,
      gridCount: 10,
      cubeletSize: 1.2,
      totalDuration: 20, // seconds
    })

    engine.runRenderLoop(() => {
      setFps(engine.getFps() || 0)
      scene.render()
      camera.alpha += 0.0005
    })

    return () => {
      engine.stopRenderLoop()
      engine.dispose()
    }
  }, [])

  return (
    <div className="fixed inset-0 w-screen h-screen">
      <div
        style={{
          position: "absolute",
          top: 8,
          left: 8,
          color: "#0ff",
          fontFamily: "monospace",
          fontSize: 14,
          zIndex: 1,
          textShadow: "0 0 8px #0ff",
        }}
      >
        {fps.toFixed()} FPS
      </div>
      <canvas ref={canvasRef} className="w-full h-full outline-none" touch-action="none" />
    </div>
  )
}

export default Blocks
