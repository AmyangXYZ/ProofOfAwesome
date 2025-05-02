"use client"

import React, { useEffect, useRef } from "react"
import * as BABYLON from "babylonjs"
import "babylonjs-loaders"

const SPHERE_RADIUS = 10
const PARTICLE_COUNT = 10000
const PARTICLE_SIZE = 1

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
    camera.lowerRadiusLimit = SPHERE_RADIUS * 0.5
    camera.upperRadiusLimit = SPHERE_RADIUS * 5

    // Lighting
    const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene)
    light.intensity = 1

    // Glow layer for particles
    const glowLayer = new BABYLON.GlowLayer("glow", scene, { blurKernelSize: 32 })
    glowLayer.intensity = 2

    // Particle data
    type ParticleDatum = {
      position: BABYLON.Vector3
      velocity: BABYLON.Vector3
    }
    const particleData: ParticleDatum[] = []

    // PointsCloudSystem
    const PCS = new BABYLON.PointsCloudSystem("pcs", PARTICLE_SIZE, scene)

    // Add particles randomly inside the sphere
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Random point inside sphere
      const u = Math.random()
      const v = Math.random()
      const w = Math.random()
      const theta = 2 * Math.PI * u
      const phi = Math.acos(2 * v - 1)
      const r = SPHERE_RADIUS * Math.cbrt(w) // uniform distribution in volume

      const x = r * Math.sin(phi) * Math.cos(theta)
      const y = r * Math.sin(phi) * Math.sin(theta)
      const z = r * Math.cos(phi)

      const pos = new BABYLON.Vector3(x, y, z)

      // Random velocity (slower)
      const speed = 0.05 + Math.random() * 0.1
      const vtheta = 2 * Math.PI * Math.random()
      const vphi = Math.acos(2 * Math.random() - 1)
      const vx = speed * Math.sin(vphi) * Math.cos(vtheta)
      const vy = speed * Math.sin(vphi) * Math.sin(vtheta)
      const vz = speed * Math.cos(vphi)
      const vel = new BABYLON.Vector3(vx, vy, vz)

      particleData.push({ position: pos, velocity: vel })

      PCS.addPoints(1, (particle: BABYLON.CloudPoint) => {
        particle.position = pos.clone()
        particle.color = new BABYLON.Color4(0.5, 0.8, 1, 1)
      })
    }

    // Build the point cloud and set up animation
    PCS.buildMeshAsync().then((mesh) => {
      const mat = new BABYLON.StandardMaterial("pcsMat", scene)
      mat.emissiveColor = new BABYLON.Color3(0.5, 0.8, 1)
      mat.pointsCloud = true
      mat.alpha = 1
      mat.disableLighting = true
      mesh.material = mat
      glowLayer.addIncludedOnlyMesh(mesh)

      // Animate particles
      PCS.updateParticle = (particle: BABYLON.CloudPoint) => {
        const d = particleData[particle.idx]
        // Move
        d.position.addInPlace(d.velocity)
        // Bounce if outside sphere
        if (d.position.length() > SPHERE_RADIUS) {
          d.position.normalize().scaleInPlace(SPHERE_RADIUS)
          d.velocity.scaleInPlace(-1)
        }
        particle.position.copyFrom(d.position)
        return particle
      }

      engine.runRenderLoop(() => {
        PCS.setParticles()
        scene.render()
      })
    })

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
