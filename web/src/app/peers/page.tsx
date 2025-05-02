"use client"

import React, { useEffect, useRef } from "react"
import * as BABYLON from "babylonjs"
import "babylonjs-loaders"

const SPHERE_RADIUS = 20
const PARTICLE_COUNT = 10000
const PARTICLE_SIZE = 0.1

const Blocks = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const engine = new BABYLON.Engine(canvasRef.current, true, { preserveDrawingBuffer: true }, true)
    const scene = new BABYLON.Scene(engine)
    scene.clearColor = new BABYLON.Color4(0, 0, 0, 1)

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
    camera.wheelPrecision = 30

    // Lighting
    const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene)
    light.intensity = 1

    // Glow layer for particles - reduced blur kernel size
    const glowLayer = new BABYLON.GlowLayer("glow", scene, { blurKernelSize: 16 })
    glowLayer.intensity = 2

    // Use points instead of spheres for better performance
    const SPS = new BABYLON.SolidParticleSystem("SPS", scene, { updatable: true })
    const particleMesh = BABYLON.MeshBuilder.CreateBox("spsParticle", { size: PARTICLE_SIZE }, scene)
    particleMesh.isVisible = true

    // Store initial spherical coordinates and phase for swirling motion
    type ParticleDatum = { radius: number; theta: number; phi: number; phase: number; speed: number }
    const particleData: ParticleDatum[] = []
    const rings = Math.ceil(Math.sqrt(PARTICLE_COUNT / 2))
    const particlesPerRing = Math.ceil(PARTICLE_COUNT / rings)

    // Pre-calculate all possible values
    const sinValues: number[] = []
    const cosValues: number[] = []
    for (let i = 0; i < 360; i++) {
      const rad = (i * Math.PI) / 180
      sinValues[i] = Math.sin(rad)
      cosValues[i] = Math.cos(rad)
    }

    for (let ring = 0; ring < rings; ring++) {
      const phi = (ring * Math.PI) / rings
      const particlesInThisRing = Math.ceil(particlesPerRing * Math.sin(phi))

      for (let i = 0; i < particlesInThisRing; i++) {
        const theta = (i * 2 * Math.PI) / particlesInThisRing
        const radius = SPHERE_RADIUS * 0.97
        const phase = Math.random() * Math.PI * 2
        particleData.push({ radius, theta, phi, phase, speed: 0.5 + Math.random() * 0.7 })

        // Use pre-calculated values
        const phiDeg = Math.floor((phi * 180) / Math.PI) % 360
        const thetaDeg = Math.floor((theta * 180) / Math.PI) % 360
        const x = radius * sinValues[phiDeg] * cosValues[thetaDeg]
        const y = radius * sinValues[phiDeg] * sinValues[thetaDeg]
        const z = radius * cosValues[phiDeg]

        SPS.addShape(particleMesh, 1, {
          positionFunction: (p: BABYLON.SolidParticle) => {
            p.position.set(x, y, z)
          },
        })
      }
    }

    const spsMesh = SPS.buildMesh()
    spsMesh.material = (() => {
      const mat = new BABYLON.StandardMaterial("spsMat", scene)
      mat.emissiveColor = new BABYLON.Color3(0.4, 0.7, 1)
      mat.diffuseColor = new BABYLON.Color3(0.2, 0.5, 1)
      mat.specularColor = new BABYLON.Color3(0.8, 0.9, 1)
      mat.alpha = 1
      mat.disableLighting = true
      mat.useAlphaFromDiffuseTexture = false
      mat.forceDepthWrite = false
      mat.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND
      return mat
    })()
    glowLayer.addIncludedOnlyMesh(spsMesh)

    // Optimized particle update function
    const updateParticles = (t: number) => {
      const amplitude = SPHERE_RADIUS * 0.2

      SPS.updateParticle = (p: BABYLON.SolidParticle) => {
        const d = particleData[p.idx]

        // Use pre-calculated values for faster updates
        const theta = d.theta + sinValues[Math.floor(((t * d.speed + d.phase) * 180) / Math.PI) % 360] * 0.3
        const phi = d.phi + cosValues[Math.floor(((t * d.speed + d.phase) * 180) / Math.PI) % 360] * 0.2
        const radius = d.radius + amplitude * sinValues[Math.floor(((t * d.speed + d.phase) * 180) / Math.PI) % 360]

        // Convert to cartesian coordinates using pre-calculated values
        const phiDeg = Math.floor((phi * 180) / Math.PI) % 360
        const thetaDeg = Math.floor((theta * 180) / Math.PI) % 360

        p.position.set(
          radius * sinValues[phiDeg] * cosValues[thetaDeg],
          radius * sinValues[phiDeg] * sinValues[thetaDeg],
          radius * cosValues[phiDeg]
        )

        // Update color based on distance
        const dist = p.position.length() / SPHERE_RADIUS
        const colorFactor = 1 - dist
        if (p.color) {
          p.color.set(0.7 + 0.3 * colorFactor, 0.85 + 0.15 * colorFactor, 1, 0.7 + 0.3 * colorFactor)
        }
        return p
      }
    }

    // Animate particles in a swirling, fluid motion
    engine.runRenderLoop(() => {
      const t = performance.now() * 0.002
      updateParticles(t)
      SPS.setParticles()

      scene.render()
    })

    particleMesh.dispose()

    return () => {
      engine.stopRenderLoop()
      engine.dispose()
    }
  }, [])

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full outline-none" touch-action="none" />
    </div>
  )
}

export default Blocks
