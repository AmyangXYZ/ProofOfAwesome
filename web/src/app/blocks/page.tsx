"use client"

import React, { useEffect, useRef, useState } from "react"
import * as BABYLON from "babylonjs"
import "babylonjs-loaders"
import { InstancedMesh } from "babylonjs/Meshes/instancedMesh"

const CUBE_SIZE = 24 // Size of the cube
const GRID_SIZE = 16 // Number of grid lines per axis (denser)
const GRID_LENGTH = CUBE_SIZE // Length of the cube/grid
const GRID_TUBE_RADIUS = 0.06
const CUBELET_SIZE = 1

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
      100,
      new BABYLON.Vector3(0, 0, 0),
      scene
    )
    camera.attachControl(canvasRef.current, true)

    // Lighting
    const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene)
    light.intensity = 1

    // // Glow layer for grid only
    const glowLayer = new BABYLON.GlowLayer("glow", scene)
    glowLayer.intensity = 1

    // --- Glowing Grid Tubes ---
    const gridMaterial = new BABYLON.StandardMaterial("gridMat", scene)
    gridMaterial.emissiveColor = new BABYLON.Color3(0.6, 0.4, 1)

    // Create grid tubes along X, Y, Z axes
    const gridTubes: BABYLON.Mesh[] = []
    const tubeRadius = GRID_TUBE_RADIUS
    for (let i = 0; i <= GRID_SIZE; i++) {
      const offset = -GRID_LENGTH / 2 + (i * GRID_LENGTH) / GRID_SIZE
      for (let j = 0; j <= GRID_SIZE; j++) {
        const y = -GRID_LENGTH / 2 + (j * GRID_LENGTH) / GRID_SIZE
        // Z axis tubes
        const zTube = BABYLON.MeshBuilder.CreateTube(
          `zTube_${i}_${j}`,
          {
            path: [new BABYLON.Vector3(-GRID_LENGTH / 2, y, offset), new BABYLON.Vector3(GRID_LENGTH / 2, y, offset)],
            radius: tubeRadius,
            updatable: false,
            sideOrientation: BABYLON.Mesh.DOUBLESIDE,
          },
          scene
        )
        zTube.material = gridMaterial
        gridTubes.push(zTube)
        // Y axis tubes
        const yTube = BABYLON.MeshBuilder.CreateTube(
          `yTube_${i}_${j}`,
          {
            path: [new BABYLON.Vector3(offset, -GRID_LENGTH / 2, y), new BABYLON.Vector3(offset, GRID_LENGTH / 2, y)],
            radius: tubeRadius,
            updatable: false,
            sideOrientation: BABYLON.Mesh.DOUBLESIDE,
          },
          scene
        )
        yTube.material = gridMaterial
        gridTubes.push(yTube)
        // X axis tubes
        const xTube = BABYLON.MeshBuilder.CreateTube(
          `xTube_${i}_${j}`,
          {
            path: [new BABYLON.Vector3(y, offset, -GRID_LENGTH / 2), new BABYLON.Vector3(y, offset, GRID_LENGTH / 2)],
            radius: tubeRadius,
            updatable: false,
            sideOrientation: BABYLON.Mesh.DOUBLESIDE,
          },
          scene
        )
        xTube.material = gridMaterial
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
    for (let i = 0; i <= GRID_SIZE; i++) {
      for (let j = 0; j <= GRID_SIZE; j++) {
        for (let k = 0; k <= GRID_SIZE; k++) {
          const cubelet = baseCube.createInstance(`cubelet_${i}_${j}_${k}`)
          cubelet.material = cubeMat
          // Assign a random axis to move along: 0=X, 1=Y, 2=Z
          const axis = Math.floor(Math.random() * 3)
          // Store the other two fixed grid indices
          let fixedA, fixedB
          if (axis === 0) {
            fixedA = j
            fixedB = k
          } else if (axis === 1) {
            fixedA = i
            fixedB = k
          } else {
            fixedA = i
            fixedB = j
          }
          // Random size, biased toward smaller
          const size = 0.5 + Math.pow(Math.random(), 2) * 1.5
          cubelet.scaling.set(size, size, size)
          cubelet.isVisible = true
          cubelets.push(cubelet)
          cubeletData.push({
            axis,
            fixedA,
            fixedB,
            phase: Math.random() * Math.PI * 2,
            speed: 0.7 + Math.random() * 0.5,
            size,
          })
        }
      }
    }
    // Animate cubes along their axis
    engine.runRenderLoop(() => {
      const t = performance.now() * 0.0001
      const step = GRID_LENGTH / GRID_SIZE
      for (let i = 0; i < cubelets.length; i++) {
        const { axis, fixedA, fixedB, phase, speed, size } = cubeletData[i]
        const progress = Math.sin(t * speed + phase) * 0.5 + 0.5 // oscillate between 0 and 1
        const pos = -GRID_LENGTH / 2 + progress * GRID_LENGTH
        let x = 0,
          y = 0,
          z = 0
        if (axis === 0) {
          x = pos
          y = -GRID_LENGTH / 2 + fixedA * step
          z = -GRID_LENGTH / 2 + fixedB * step
        } else if (axis === 1) {
          x = -GRID_LENGTH / 2 + fixedA * step
          y = pos
          z = -GRID_LENGTH / 2 + fixedB * step
        } else {
          x = -GRID_LENGTH / 2 + fixedA * step
          y = -GRID_LENGTH / 2 + fixedB * step
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
