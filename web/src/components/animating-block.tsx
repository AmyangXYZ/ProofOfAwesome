"use client"

import React, { useEffect, useRef } from "react"
import * as BABYLON from "babylonjs"
import "babylonjs-loaders"

function createGridTubes({
  scene,
  gridSize,
  gridLength,
  tubeRadius,
  tubeColor,
  totalDuration = 20, // Total duration in seconds for all tubes
}: {
  scene: BABYLON.Scene
  gridSize: number
  gridLength: number
  tubeRadius: number
  tubeColor: BABYLON.Color3
  totalDuration?: number
}): BABYLON.Mesh {
  // Create parent mesh
  const parentMesh = new BABYLON.Mesh("gridTubesParent", scene)
  parentMesh.isVisible = true

  const step = gridLength / gridSize
  const faceTubes: BABYLON.InstancedMesh[] = []
  const tubeAnimData: {
    mesh: BABYLON.InstancedMesh
    axis: "x" | "y" | "z"
    finalPos: BABYLON.Vector3
    facePos: BABYLON.Vector3
    finalScale: BABYLON.Vector3
    delay: number
    isEdge: boolean
  }[] = []

  // Create grid material
  const gridMaterial = new BABYLON.StandardMaterial("gridMat", scene)
  gridMaterial.emissiveColor = tubeColor

  // Create base tubes for each axis (length gridLength)
  const baseTubeX = BABYLON.MeshBuilder.CreateTube(
    "baseTubeX",
    {
      path: [new BABYLON.Vector3(-gridLength / 2, 0, 0), new BABYLON.Vector3(gridLength / 2, 0, 0)],
      radius: tubeRadius,
      updatable: false,
    },
    scene
  )
  baseTubeX.material = gridMaterial
  baseTubeX.isVisible = false
  baseTubeX.parent = parentMesh

  const baseTubeY = BABYLON.MeshBuilder.CreateTube(
    "baseTubeY",
    {
      path: [new BABYLON.Vector3(0, -gridLength / 2, 0), new BABYLON.Vector3(0, gridLength / 2, 0)],
      radius: tubeRadius,
      updatable: false,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE,
    },
    scene
  )
  baseTubeY.material = gridMaterial
  baseTubeY.isVisible = false
  baseTubeY.parent = parentMesh

  const baseTubeZ = BABYLON.MeshBuilder.CreateTube(
    "baseTubeZ",
    {
      path: [new BABYLON.Vector3(0, 0, -gridLength / 2), new BABYLON.Vector3(0, 0, gridLength / 2)],
      radius: tubeRadius,
      updatable: false,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE,
    },
    scene
  )
  baseTubeZ.material = gridMaterial
  baseTubeZ.isVisible = false
  baseTubeZ.parent = parentMesh

  // Helper to get face position (centered on face, not grid)
  function getFacePos(axis: "x" | "y" | "z", finalPos: BABYLON.Vector3) {
    if (axis === "x") {
      return new BABYLON.Vector3(finalPos.x, 0, 0)
    } else if (axis === "y") {
      return new BABYLON.Vector3(0, finalPos.y, 0)
    } else {
      return new BABYLON.Vector3(0, 0, finalPos.z)
    }
  }

  // Collect all tubes (edges first, then face grid lines in round robin)
  const allTubes: { axis: "x" | "y" | "z"; pos: BABYLON.Vector3; isEdge: boolean }[] = []
  // Edges
  for (let y = 0; y <= gridSize; y += gridSize) {
    for (let z = 0; z <= gridSize; z += gridSize) {
      allTubes.push({
        axis: "x",
        pos: new BABYLON.Vector3(0, -gridLength / 2 + y * step, -gridLength / 2 + z * step),
        isEdge: true,
      })
    }
  }
  for (let x = 0; x <= gridSize; x += gridSize) {
    for (let z = 0; z <= gridSize; z += gridSize) {
      allTubes.push({
        axis: "y",
        pos: new BABYLON.Vector3(-gridLength / 2 + x * step, 0, -gridLength / 2 + z * step),
        isEdge: true,
      })
    }
  }
  for (let x = 0; x <= gridSize; x += gridSize) {
    for (let y = 0; y <= gridSize; y += gridSize) {
      allTubes.push({
        axis: "z",
        pos: new BABYLON.Vector3(-gridLength / 2 + x * step, -gridLength / 2 + y * step, 0),
        isEdge: true,
      })
    }
  }
  // Face grid lines (round robin)
  const xFaceGrids = []
  const yFaceGrids = []
  const zFaceGrids = []
  for (let y = 0; y <= gridSize; y++) {
    for (let z = 0; z <= gridSize; z++) {
      if ((y === 0 || y === gridSize) && (z === 0 || z === gridSize)) continue
      if (y !== 0 && y !== gridSize && z !== 0 && z !== gridSize) continue
      xFaceGrids.push({ y, z })
    }
  }
  for (let x = 0; x <= gridSize; x++) {
    for (let z = 0; z <= gridSize; z++) {
      if ((x === 0 || x === gridSize) && (z === 0 || z === gridSize)) continue
      if (x !== 0 && x !== gridSize && z !== 0 && z !== gridSize) continue
      yFaceGrids.push({ x, z })
    }
  }
  for (let x = 0; x <= gridSize; x++) {
    for (let y = 0; y <= gridSize; y++) {
      if ((x === 0 || x === gridSize) && (y === 0 || y === gridSize)) continue
      if (x !== 0 && x !== gridSize && y !== 0 && y !== gridSize) continue
      zFaceGrids.push({ x, y })
    }
  }
  const maxLen = Math.max(xFaceGrids.length, yFaceGrids.length, zFaceGrids.length)
  for (let i = 0; i < maxLen; i++) {
    if (i < xFaceGrids.length) {
      const { y, z } = xFaceGrids[i]
      allTubes.push({
        axis: "x",
        pos: new BABYLON.Vector3(0, -gridLength / 2 + y * step, -gridLength / 2 + z * step),
        isEdge: false,
      })
    }
    if (i < yFaceGrids.length) {
      const { x, z } = yFaceGrids[i]
      allTubes.push({
        axis: "y",
        pos: new BABYLON.Vector3(-gridLength / 2 + x * step, 0, -gridLength / 2 + z * step),
        isEdge: false,
      })
    }
    if (i < zFaceGrids.length) {
      const { x, y } = zFaceGrids[i]
      allTubes.push({
        axis: "z",
        pos: new BABYLON.Vector3(-gridLength / 2 + x * step, -gridLength / 2 + y * step, 0),
        isEdge: false,
      })
    }
  }
  // Animation timing
  const tubeAnimDuration = totalDuration * 0.6 // each tube animates for 60% of totalDuration
  const stagger = allTubes.length > 1 ? (totalDuration - tubeAnimDuration) / (allTubes.length - 1) : 0
  // Create tubes and animation data
  allTubes.forEach((tubeData, i) => {
    let tube
    if (tubeData.axis === "x") {
      tube = baseTubeX.createInstance(`tube_x_${i}`)
    } else if (tubeData.axis === "y") {
      tube = baseTubeY.createInstance(`tube_y_${i}`)
    } else {
      tube = baseTubeZ.createInstance(`tube_z_${i}`)
    }
    tube.position.copyFrom(tubeData.pos)
    tube.parent = parentMesh
    faceTubes.push(tube)
    tubeAnimData.push({
      mesh: tube,
      axis: tubeData.axis,
      finalPos: tubeData.pos.clone(),
      facePos: getFacePos(tubeData.axis as "x" | "y" | "z", tubeData.pos),
      finalScale: new BABYLON.Vector3(1, 1, 1),
      delay: i * stagger,
      isEdge: tubeData.isEdge,
    })
  })

  let globalTime = 0
  let fps = 60
  scene.onBeforeRenderObservable.add(() => {
    if (scene.getEngine().getFps) {
      fps = scene.getEngine().getFps() || 60
    }
    globalTime += 1 / fps
    tubeAnimData.forEach(({ mesh, finalPos, delay }) => {
      const t = Math.max(0, Math.min(1, (globalTime - delay) / tubeAnimDuration))
      const ease = 0.5 - 0.5 * Math.cos(Math.PI * t)
      mesh.scaling.set(ease, ease, ease)
      mesh.position.set(finalPos.x * ease, finalPos.y * ease, finalPos.z * ease)
    })
  })

  return parentMesh
}

function createAnimatedBlock({
  scene,
  blockSize,
  gridCount,
  cubeletSize,
  totalDuration,
  delay = 0,
}: {
  scene: BABYLON.Scene
  blockSize: number
  gridCount: number
  cubeletSize: number
  totalDuration?: number
  delay?: number
}): BABYLON.Mesh {
  // Create parent mesh
  const parentMesh = new BABYLON.Mesh("animatedBlockParent", scene)
  parentMesh.isVisible = true

  const GRID_SIZE = gridCount
  const CUBE_SIZE = blockSize
  const GRID_LENGTH = CUBE_SIZE
  const step = GRID_LENGTH / GRID_SIZE
  const CUBELET_SIZE = cubeletSize
  const flyInFraction = 0.03 // Reduced from 0.15 to 0.03 (3% for fly-in, 97% for grid travel)
  const totalDurationSafe = totalDuration ?? 50

  // Create base cube
  const baseCube = BABYLON.MeshBuilder.CreateBox("cubelet", { size: CUBELET_SIZE }, scene)
  const cubeMat = new BABYLON.StandardMaterial("cubeMat", scene)
  cubeMat.diffuseColor = new BABYLON.Color3(0.12, 0.22, 0.32)
  cubeMat.specularColor = new BABYLON.Color3(0.5, 0.5, 0.6)
  baseCube.material = cubeMat
  baseCube.isVisible = false
  baseCube.parent = parentMesh

  // Store per-cubelet animation state
  const cubelets: BABYLON.InstancedMesh[] = []
  const cubeletData: {
    flyInStart: BABYLON.Vector3
    surfaceEntry: BABYLON.Vector3
    finalPos: BABYLON.Vector3
    startTime: number
    duration: number
  }[] = []

  // Generate all grid intersections on the surfaces
  const facePositions: BABYLON.Vector3[] = []
  for (let i = 0; i <= GRID_SIZE; i++) {
    for (let j = 0; j <= GRID_SIZE; j++) {
      // X faces
      facePositions.push(
        new BABYLON.Vector3(-GRID_LENGTH / 2, -GRID_LENGTH / 2 + i * step, -GRID_LENGTH / 2 + j * step)
      )
      facePositions.push(new BABYLON.Vector3(GRID_LENGTH / 2, -GRID_LENGTH / 2 + i * step, -GRID_LENGTH / 2 + j * step))
      // Y faces
      facePositions.push(
        new BABYLON.Vector3(-GRID_LENGTH / 2 + i * step, -GRID_LENGTH / 2, -GRID_LENGTH / 2 + j * step)
      )
      facePositions.push(new BABYLON.Vector3(-GRID_LENGTH / 2 + i * step, GRID_LENGTH / 2, -GRID_LENGTH / 2 + j * step))
      // Z faces
      facePositions.push(
        new BABYLON.Vector3(-GRID_LENGTH / 2 + i * step, -GRID_LENGTH / 2 + j * step, -GRID_LENGTH / 2)
      )
      facePositions.push(new BABYLON.Vector3(-GRID_LENGTH / 2 + i * step, -GRID_LENGTH / 2 + j * step, GRID_LENGTH / 2))
    }
  }

  // Remove duplicates (corners/edges shared by multiple faces)
  const posKey = (v: BABYLON.Vector3) => `${v.x.toFixed(5)},${v.y.toFixed(5)},${v.z.toFixed(5)}`
  const uniquePositions = Array.from(new Map(facePositions.map((v) => [posKey(v), v])).values())

  // Shuffle for animation variety
  for (let i = uniquePositions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[uniquePositions[i], uniquePositions[j]] = [uniquePositions[j], uniquePositions[i]]
  }

  // Helper: get a random point outside the block, but only in the direction of the face containing the final position
  function getFaceFlyInStart(final: BABYLON.Vector3) {
    const margin = GRID_LENGTH * 1.2
    if (Math.abs(final.x - GRID_LENGTH / 2) < 0.001) {
      // +X face
      return new BABYLON.Vector3(
        GRID_LENGTH / 2 + margin,
        -GRID_LENGTH / 2 + Math.random() * GRID_LENGTH,
        -GRID_LENGTH / 2 + Math.random() * GRID_LENGTH
      )
    } else if (Math.abs(final.x + GRID_LENGTH / 2) < 0.001) {
      // -X face
      return new BABYLON.Vector3(
        -GRID_LENGTH / 2 - margin,
        -GRID_LENGTH / 2 + Math.random() * GRID_LENGTH,
        -GRID_LENGTH / 2 + Math.random() * GRID_LENGTH
      )
    } else if (Math.abs(final.y - GRID_LENGTH / 2) < 0.001) {
      // +Y face
      return new BABYLON.Vector3(
        -GRID_LENGTH / 2 + Math.random() * GRID_LENGTH,
        GRID_LENGTH / 2 + margin,
        -GRID_LENGTH / 2 + Math.random() * GRID_LENGTH
      )
    } else if (Math.abs(final.y + GRID_LENGTH / 2) < 0.001) {
      // -Y face
      return new BABYLON.Vector3(
        -GRID_LENGTH / 2 + Math.random() * GRID_LENGTH,
        -GRID_LENGTH / 2 - margin,
        -GRID_LENGTH / 2 + Math.random() * GRID_LENGTH
      )
    } else if (Math.abs(final.z - GRID_LENGTH / 2) < 0.001) {
      // +Z face
      return new BABYLON.Vector3(
        -GRID_LENGTH / 2 + Math.random() * GRID_LENGTH,
        -GRID_LENGTH / 2 + Math.random() * GRID_LENGTH,
        GRID_LENGTH / 2 + margin
      )
    } else {
      // -Z face
      return new BABYLON.Vector3(
        -GRID_LENGTH / 2 + Math.random() * GRID_LENGTH,
        -GRID_LENGTH / 2 + Math.random() * GRID_LENGTH,
        -GRID_LENGTH / 2 - margin
      )
    }
  }

  // Helper: pick a random entry point on the same face as the final position (grid-aligned)
  function getRandomSurfaceEntry(final: BABYLON.Vector3) {
    if (Math.abs(final.x - GRID_LENGTH / 2) < 0.001 || Math.abs(final.x + GRID_LENGTH / 2) < 0.001) {
      return new BABYLON.Vector3(
        final.x,
        -GRID_LENGTH / 2 + Math.round(Math.random() * GRID_SIZE) * step,
        -GRID_LENGTH / 2 + Math.round(Math.random() * GRID_SIZE) * step
      )
    } else if (Math.abs(final.y - GRID_LENGTH / 2) < 0.001 || Math.abs(final.y + GRID_LENGTH / 2) < 0.001) {
      return new BABYLON.Vector3(
        -GRID_LENGTH / 2 + Math.round(Math.random() * GRID_SIZE) * step,
        final.y,
        -GRID_LENGTH / 2 + Math.round(Math.random() * GRID_SIZE) * step
      )
    } else {
      return new BABYLON.Vector3(
        -GRID_LENGTH / 2 + Math.round(Math.random() * GRID_SIZE) * step,
        -GRID_LENGTH / 2 + Math.round(Math.random() * GRID_SIZE) * step,
        final.z
      )
    }
  }

  // Animation timing logic for synchronized arrival
  const N = uniquePositions.length
  const globalEndTime = delay + totalDurationSafe
  const staggerTime = N > 1 ? totalDurationSafe / N : 0 // Increased to 95% of total duration for longer intervals

  uniquePositions.forEach((finalPos, index) => {
    const flyInStart = getFaceFlyInStart(finalPos)
    const surfaceEntry = getRandomSurfaceEntry(finalPos)
    const startTime = delay + index * staggerTime
    const duration = globalEndTime - startTime
    const cubelet = baseCube.createInstance(`cubelet_${index}`)
    cubelet.material = cubeMat
    cubelet.scaling.set(CUBELET_SIZE, CUBELET_SIZE, CUBELET_SIZE)
    cubelet.position.copyFrom(flyInStart)
    cubelet.isVisible = false
    cubelet.parent = parentMesh
    cubelets.push(cubelet)
    cubeletData.push({
      flyInStart,
      surfaceEntry,
      finalPos,
      startTime,
      duration,
    })
  })

  // Animate: fast fly-in, slow grid travel, all arrive together
  let globalTime = 0
  let fps = 60
  scene.onBeforeRenderObservable.add(() => {
    if (scene.getEngine().getFps) {
      fps = scene.getEngine().getFps() || 60
    }
    globalTime += 1 / fps
    const animTime = globalTime
    cubelets.forEach((cubelet, index) => {
      const data = cubeletData[index]
      const elapsedTime = animTime - data.startTime
      const t = Math.max(0, Math.min(1, elapsedTime / data.duration))
      if (t <= 0) {
        cubelet.isVisible = false
        return
      }
      cubelet.isVisible = true
      if (t < flyInFraction) {
        // Phase 1: fast fly in to surface entry
        const tt = t / flyInFraction
        const ease = 0.5 - 0.5 * Math.cos(Math.PI * tt)
        cubelet.position.set(
          data.flyInStart.x + (data.surfaceEntry.x - data.flyInStart.x) * ease,
          data.flyInStart.y + (data.surfaceEntry.y - data.flyInStart.y) * ease,
          data.flyInStart.z + (data.surfaceEntry.z - data.flyInStart.z) * ease
        )
      } else {
        // Phase 2: slow grid travel
        const tt = (t - flyInFraction) / (1 - flyInFraction)
        const a0 = data.surfaceEntry.clone()
        const a1 = data.surfaceEntry.clone()
        const a2 = data.finalPos.clone()
        if (Math.abs(data.finalPos.x - data.surfaceEntry.x) > 0.001) {
          a1.x = data.finalPos.x
        } else if (Math.abs(data.finalPos.y - data.surfaceEntry.y) > 0.001) {
          a1.y = data.finalPos.y
        } else {
          a1.z = data.finalPos.z
        }
        if (tt < 0.5) {
          const ease = 0.5 - 0.5 * Math.cos(Math.PI * (tt / 0.5))
          cubelet.position.set(a0.x + (a1.x - a0.x) * ease, a0.y + (a1.y - a0.y) * ease, a0.z + (a1.z - a0.z) * ease)
        } else {
          const ease = 0.5 - 0.5 * Math.cos(Math.PI * ((tt - 0.5) / 0.5))
          cubelet.position.set(a1.x + (a2.x - a1.x) * ease, a1.y + (a2.y - a1.y) * ease, a1.z + (a2.z - a1.z) * ease)
        }
      }
    })
  })

  return parentMesh
}

export default function AnimatingBlock() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const engine = new BABYLON.Engine(canvasRef.current, true, { preserveDrawingBuffer: true }, true)
    const scene = new BABYLON.Scene(engine)
    scene.clearColor = new BABYLON.Color4(9 / 255, 9 / 255, 11 / 255, 1)

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
    glowLayer.intensity = 1.2

    const cube = createGridTubes({
      scene,
      gridSize: 10,
      gridLength: 25,
      tubeRadius: 0.08,
      tubeColor: new BABYLON.Color3(0.6, 0.4, 1),
      totalDuration: 2,
    })

    // Create animated block with reduced parameters
    const cubelets = createAnimatedBlock({
      scene,
      blockSize: 25,
      gridCount: 10, // Reduced grid count
      cubeletSize: 1.5,
      totalDuration: 30,
      delay: 2,
    })

    // Example of how to manipulate the parent meshes
    // gridParent.rotation.x = -Math.PI / 4
    // blockParent.rotation.x = Math.PI / 6

    // Animation loop
    engine.runRenderLoop(() => {
      scene.render()
      cube.rotation.y += 0.0002
      cubelets.rotation.y += 0.0002
    })

    const handleResize = () => {
      engine.resize()
    }
    window.addEventListener("resize", handleResize)

    return () => {
      engine.stopRenderLoop()
      engine.dispose()
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return <canvas ref={canvasRef} className="w-full h-full outline-none" touch-action="none" />
}
