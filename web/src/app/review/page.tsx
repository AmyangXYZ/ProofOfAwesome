"use client"

import React, { useEffect, useRef, useState } from "react"
import * as BABYLON from "babylonjs"
import "babylonjs-loaders"

// Configuration - matching the original
const CUBE_SIZE = 24 // Size of the cube
const GRID_SIZE = 12 // Number of grid lines per axis
const GRID_LENGTH = CUBE_SIZE // Length of the cube/grid
const GRID_TUBE_RADIUS = 0.06 // Matching original radius

const SimpleGlowingTubes = () => {
  const canvasRef = useRef(null)
  const [fps, setFps] = useState(0)

  useEffect(() => {
    if (!canvasRef.current) return
    const engine = new BABYLON.Engine(canvasRef.current, true, { preserveDrawingBuffer: true }, true)
    const scene = new BABYLON.Scene(engine)
    scene.clearColor = new BABYLON.Color4(9 / 255, 9 / 255, 11 / 255, 1)

    // Camera - exact settings from original
    const camera = new BABYLON.ArcRotateCamera(
      "camera",
      -Math.PI / 2,
      Math.PI / 2.5,
      100,
      new BABYLON.Vector3(0, 0, 0),
      scene
    )
    camera.attachControl(canvasRef.current, true)

    // Lighting - exact settings from original
    const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene)
    light.intensity = 1

    // Glow layer - exact settings from original
    const glowLayer = new BABYLON.GlowLayer("glow", scene)
    glowLayer.intensity = 1

    // Glowing Grid Tubes - exactly as in original
    const gridMaterial = new BABYLON.StandardMaterial("gridMat", scene)
    gridMaterial.emissiveColor = new BABYLON.Color3(0.6, 0.4, 1.0)

    // Create base tubes for instancing (one for each axis, centered at origin)
    const baseTubeX = BABYLON.MeshBuilder.CreateTube(
      "baseTubeX",
      {
        path: [new BABYLON.Vector3(-GRID_LENGTH / 2, 0, 0), new BABYLON.Vector3(GRID_LENGTH / 2, 0, 0)],
        radius: GRID_TUBE_RADIUS,
        updatable: false,
        sideOrientation: BABYLON.Mesh.DOUBLESIDE,
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
      },
      scene
    )
    baseTubeZ.material = gridMaterial
    baseTubeZ.isVisible = false

    // Create grid tubes along X, Y, Z axes using instancing, exactly matching original positions
    const gridTubes = []
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

    // Simple render loop - no animations needed
    engine.runRenderLoop(() => {
      setFps(engine.getFps())
      scene.render()
    })

    // Clean up on unmount
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

export default SimpleGlowingTubes
