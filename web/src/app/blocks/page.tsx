"use client"

import React, { useEffect, useRef, useState } from "react"
import * as BABYLON from "babylonjs"
import "babylonjs-loaders"
import { InstancedMesh } from "babylonjs/Meshes/instancedMesh"

const CUBE_SIZE = 24 // Size of the cube
const GRID_SIZE = 12 // Number of grid lines per axis (denser)
const GRID_LENGTH = CUBE_SIZE // Length of the cube/grid
const GRID_TUBE_RADIUS = 0.06
const CUBELET_SIZE = 1.3
const TOTAL_CUBELETS = 2000 // Reduced from 2500 while maintaining visual density

const Blocks = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [fps, setFps] = useState(0)

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
      100,
      new BABYLON.Vector3(0, 0, 0),
      scene
    )
    camera.attachControl(canvasRef.current, true)
    camera.lowerRadiusLimit = 20 // Prevent camera from getting too close
    camera.upperRadiusLimit = 200 // Prevent camera from getting too far

    // Lighting
    const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene)
    light.intensity = 1

    // // Glow layer for grid only
    const glowLayer = new BABYLON.GlowLayer("glow", scene)
    glowLayer.intensity = 1
    glowLayer.blurKernelSize = 32

    // --- Glowing Grid Tubes ---
    const gridMaterial = new BABYLON.StandardMaterial("gridMat", scene)
    gridMaterial.emissiveColor = new BABYLON.Color3(0.6, 0.4, 1)

    // Create base tubes for instancing (one for each axis, centered at origin)
    const baseTubeX = BABYLON.MeshBuilder.CreateTube(
      "baseTubeX",
      {
        path: [new BABYLON.Vector3(-GRID_LENGTH / 2, 0, 0), new BABYLON.Vector3(GRID_LENGTH / 2, 0, 0)],
        radius: GRID_TUBE_RADIUS,
        updatable: false,
        sideOrientation: BABYLON.Mesh.DOUBLESIDE,
        tessellation: 8,
      },
      scene
    )
    baseTubeX.material = gridMaterial
    baseTubeX.isVisible = false

    const baseTubeY = BABYLON.MeshBuilder.CreateTube(
      "baseTubeY",
      {
        path: [new BABYLON.Vector3(0, -GRID_LENGTH / 2, 0), new BABYLON.Vector3(0, GRID_LENGTH / 2, 0)],
        radius: GRID_TUBE_RADIUS,
        updatable: false,
        sideOrientation: BABYLON.Mesh.DOUBLESIDE,
        tessellation: 8,
      },
      scene
    )
    baseTubeY.material = gridMaterial
    baseTubeY.isVisible = false

    const baseTubeZ = BABYLON.MeshBuilder.CreateTube(
      "baseTubeZ",
      {
        path: [new BABYLON.Vector3(0, 0, -GRID_LENGTH / 2), new BABYLON.Vector3(0, 0, GRID_LENGTH / 2)],
        radius: GRID_TUBE_RADIUS,
        updatable: false,
        sideOrientation: BABYLON.Mesh.DOUBLESIDE,
        tessellation: 8,
      },
      scene
    )
    baseTubeZ.material = gridMaterial
    baseTubeZ.isVisible = false

    // Create grid tubes along X, Y, Z axes using instancing, matching original positions
    const gridTubes: BABYLON.InstancedMesh[] = []
    for (let i = 0; i <= GRID_SIZE; i++) {
      const offset = -GRID_LENGTH / 2 + (i * GRID_LENGTH) / GRID_SIZE
      for (let j = 0; j <= GRID_SIZE; j++) {
        const y = -GRID_LENGTH / 2 + (j * GRID_LENGTH) / GRID_SIZE
        // Z axis tubes: X = [-L/2, L/2], Y = y, Z = offset
        const zTube = baseTubeX.createInstance(`zTube_${i}_${j}`)
        zTube.position.set(0, y, offset)
        gridTubes.push(zTube)
        // Y axis tubes: X = offset, Y = [-L/2, L/2], Z = y
        const yTube = baseTubeY.createInstance(`yTube_${i}_${j}`)
        yTube.position.set(offset, 0, y)
        gridTubes.push(yTube)
        // X axis tubes: X = y, Y = offset, Z = [-L/2, L/2]
        const xTube = baseTubeZ.createInstance(`xTube_${i}_${j}`)
        xTube.position.set(y, offset, 0)
        gridTubes.push(xTube)
      }
    }

    // --- Instanced Cubes: dark, sleek, matte, no glow ---
    const baseCube = BABYLON.MeshBuilder.CreateBox("cubelet", { size: CUBELET_SIZE }, scene)
    const cubeMat = new BABYLON.StandardMaterial("cubeMat", scene)
    cubeMat.diffuseColor = new BABYLON.Color3(0.12, 0.22, 0.32)
    baseCube.material = cubeMat
    baseCube.isVisible = false

    // Store instanced cubes and their movement data
    const cubelets: InstancedMesh[] = []
    const cubeletData: {
      axis: number
      fixedA: number
      fixedB: number
      phase: number
      speed: number
      size: number
    }[] = []

    // Pre-calculate random values for better performance
    const randomPhases = new Float32Array(TOTAL_CUBELETS)
    const randomSpeeds = new Float32Array(TOTAL_CUBELETS)
    const randomSizes = new Float32Array(TOTAL_CUBELETS)
    for (let i = 0; i < TOTAL_CUBELETS; i++) {
      randomPhases[i] = Math.random() * Math.PI * 2
      randomSpeeds[i] = 0.5 + Math.random() * 0.7
      randomSizes[i] = 0.3 + Math.pow(Math.random(), 2) * 1.2
    }

    // Distribute TOTAL_CUBELETS as evenly as possible across the 6 faces using a grid per face
    let cubeletCount = 0
    const basePerFace = Math.floor(TOTAL_CUBELETS / 6)
    const remainder = TOTAL_CUBELETS % 6
    for (let face = 0; face < 6; face++) {
      // Distribute remainder: first 'remainder' faces get one extra
      const cubeletsThisFace = basePerFace + (face < remainder ? 1 : 0)
      const gridN = Math.ceil(Math.sqrt(cubeletsThisFace))
      let placedOnFace = 0
      for (let i = 0; i < gridN && placedOnFace < cubeletsThisFace; i++) {
        for (let j = 0; j < gridN && placedOnFace < cubeletsThisFace; j++) {
          const half = GRID_LENGTH / 2
          const jitter = () => (Math.random() - 0.5) * 0.15 // small jitter
          // u, v in [-half, half]
          const u = -half + (i / (gridN - 1)) * GRID_LENGTH
          const v = -half + (j / (gridN - 1)) * GRID_LENGTH
          let x = 0,
            y = 0,
            z = 0
          if (face === 0) {
            // +X face
            x = half
            y = u
            z = v
          } else if (face === 1) {
            // -X face
            x = -half
            y = u
            z = v
          } else if (face === 2) {
            // +Y face
            x = u
            y = half
            z = v
          } else if (face === 3) {
            // -Y face
            x = u
            y = -half
            z = v
          } else if (face === 4) {
            // +Z face
            x = u
            y = v
            z = half
          } else if (face === 5) {
            // -Z face
            x = u
            y = v
            z = -half
          }
          x += jitter()
          y += jitter()
          z += jitter()
          const axis = Math.floor(Math.random() * 3)
          let fixedA, fixedB
          if (axis === 0) {
            fixedA = y
            fixedB = z
          } else if (axis === 1) {
            fixedA = x
            fixedB = z
          } else {
            fixedA = x
            fixedB = y
          }
          const size = randomSizes[cubeletCount]
          const cubelet = baseCube.createInstance(`cubelet_shell_${cubeletCount}`)
          cubelet.material = cubeMat
          cubelet.scaling.set(size, size, size)
          cubelet.position.set(x, y, z)
          cubelet.isVisible = true
          cubelets.push(cubelet)
          cubeletData.push({
            axis,
            fixedA,
            fixedB,
            phase: randomPhases[cubeletCount],
            speed: randomSpeeds[cubeletCount],
            size,
          })
          cubeletCount++
          placedOnFace++
          if (cubeletCount >= TOTAL_CUBELETS) break
        }
        if (cubeletCount >= TOTAL_CUBELETS) break
      }
      if (cubeletCount >= TOTAL_CUBELETS) break
    }

    // Optimize render loop
    engine.runRenderLoop(() => {
      const currentTime = performance.now()

      for (let i = 0; i < cubelets.length; i++) {
        const { axis, fixedA, fixedB, phase, speed, size } = cubeletData[i]
        const progress = Math.sin(currentTime * 0.0001 * speed + phase) * 0.5 + 0.5 // oscillate between 0 and 1
        const pos = -GRID_LENGTH / 2 + progress * GRID_LENGTH
        let x = 0,
          y = 0,
          z = 0
        if (axis === 0) {
          x = pos
          y = fixedA
          z = fixedB
        } else if (axis === 1) {
          x = fixedA
          y = pos
          z = fixedB
        } else {
          x = fixedA
          y = fixedB
          z = pos
        }
        cubelets[i].position.set(x, y, z)
        cubelets[i].scaling.set(size, size, size)
      }
      setFps(engine.getFps())
      scene.render()
    })

    return () => {
      engine.stopRenderLoop()
      engine.dispose()
    }
  }, [])

  return (
    <div className="relative w-full h-full">
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
