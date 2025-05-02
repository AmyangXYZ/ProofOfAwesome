"use client"

import React, { useEffect, useRef } from "react"
import * as BABYLON from "babylonjs"
import "babylonjs-loaders"

const SPHERE_RADIUS = 4
const PARTICLE_COUNT = 500
const PARTICLE_SIZE = 0.1

const Blocks = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Helper: Convert spherical to cartesian
  function sphericalToCartesian(radius: number, theta: number, phi: number) {
    const sinPhi = Math.sin(phi)
    const x = radius * sinPhi * Math.cos(theta)
    const y = radius * sinPhi * Math.sin(theta)
    const z = radius * Math.cos(phi)
    return new BABYLON.Vector3(x, y, z)
  }

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
    // camera.lowerRadiusLimit = SPHERE_RADIUS * 1.2
    // camera.upperRadiusLimit = SPHERE_RADIUS * 10
    camera.wheelPrecision = 30

    // Lighting
    const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene)
    light.intensity = 1

    // Glow layer for particles
    const glowLayer = new BABYLON.GlowLayer("glow", scene, { blurKernelSize: 32 })
    glowLayer.intensity = 1

    // Globe shell (subtle, transparent, ethereal)
    // const shell = BABYLON.MeshBuilder.CreateSphere("shell", { diameter: SPHERE_RADIUS * 2, segments: 64 }, scene)
    // const shellMat = new BABYLON.StandardMaterial("shellMat", scene)
    // shellMat.alpha = 0.07 // more transparent
    // shellMat.diffuseColor = new BABYLON.Color3(0.1, 0.3, 0.7) // subtle blue
    // shellMat.specularColor = new BABYLON.Color3(0.2, 0.5, 1)
    // shellMat.emissiveColor = new BABYLON.Color3(0.1, 0.3, 0.7) // faint inner glow
    // // shellMat.disableLighting = false
    // shellMat.useEmissiveAsIllumination = true
    // shellMat.backFaceCulling = false
    // shell.material = shellMat
    // shell.isPickable = false

    // // Optionally, add fresnel effect for ethereal edge
    // shellMat.emissiveFresnelParameters = new BABYLON.FresnelParameters()
    // shellMat.emissiveFresnelParameters.bias = 0.2
    // shellMat.emissiveFresnelParameters.power = 2.5
    // shellMat.emissiveFresnelParameters.leftColor = new BABYLON.Color3(0.2, 0.5, 1)
    // shellMat.emissiveFresnelParameters.rightColor = new BABYLON.Color3(0.05, 0.1, 0.2)

    // SolidParticleSystem for point cloud
    const SPS = new BABYLON.SolidParticleSystem("SPS", scene, { updatable: true })
    const particleMesh = BABYLON.MeshBuilder.CreateSphere(
      "spsParticle",
      { diameter: PARTICLE_SIZE, segments: 0 },
      scene
    )
    particleMesh.isVisible = true

    // Store initial spherical coordinates and phase for swirling motion
    type ParticleDatum = { radius: number; theta: number; phi: number; phase: number; speed: number }
    const particleData: ParticleDatum[] = []
    const rings = Math.ceil(Math.sqrt(PARTICLE_COUNT / 2))
    const particlesPerRing = Math.ceil(PARTICLE_COUNT / rings)
    for (let ring = 0; ring < rings; ring++) {
      const phi = (ring * Math.PI) / rings
      const particlesInThisRing = Math.ceil(particlesPerRing * Math.sin(phi))
      for (let i = 0; i < particlesInThisRing; i++) {
        const theta = (i * 2 * Math.PI) / particlesInThisRing
        const radius = SPHERE_RADIUS * 0.97
        const phase = Math.random() * Math.PI * 2
        particleData.push({ radius, theta, phi, phase, speed: 0.5 + Math.random() * 0.7 })
        const pos = sphericalToCartesian(radius, theta, phi)
        SPS.addShape(particleMesh, 1, {
          positionFunction: (p: BABYLON.SolidParticle) => {
            p.position.copyFrom(pos)
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
      mat.disableLighting = false
      mat.useAlphaFromDiffuseTexture = false
      mat.forceDepthWrite = false
      mat.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND
      return mat
    })()
    glowLayer.addIncludedOnlyMesh(spsMesh)

    const spherePositions = []
    for (let i = 0; i < 2; i++) {
      spherePositions.push(
        new BABYLON.Vector3(Math.random() * 20 - 10, Math.random() * 20 - 10, Math.random() * 20 - 10)
      )
    }

    // Animate particles in a swirling, fluid motion
    engine.runRenderLoop(() => {
      const t = performance.now() * 0.001
      SPS.updateParticle = (p: BABYLON.SolidParticle) => {
        const i = p.idx
        const d = particleData[i]
        const theta = d.theta + Math.sin(t * d.speed + d.phase) * 0.3 + Math.cos(t * 0.7 * d.speed + d.phase) * 0.15
        const phi = d.phi + Math.cos(t * 0.9 * d.speed + d.phase) * 0.2 + Math.sin(t * 0.6 * d.speed + d.phase) * 0.1
        // Oscillate radius slightly
        const amplitude = SPHERE_RADIUS * 0.2
        const radius = d.radius + amplitude * Math.sin(t * d.speed + d.phase)
        const pos = sphericalToCartesian(radius, theta, phi)
        p.position.copyFrom(pos)
        // Color gradient: blue at edge, white at center
        const dist = p.position.length() / SPHERE_RADIUS
        p.color = new BABYLON.Color4(0.7 + 0.3 * (1 - dist), 0.85 + 0.15 * (1 - dist), 1, 0.7 + 0.3 * (1 - dist))
        return p
      }
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
