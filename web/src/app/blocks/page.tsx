"use client"

import { useEffect, useRef } from "react"
import * as BABYLON from "babylonjs"
import "babylonjs-loaders"

const BASE_RADIUS = 1
const PARTICLE_COUNT = 500
const PARTICLE_SIZE = 0.1
const SPIRAL_GROWTH = 0.1 // Controls how quickly the spiral grows
const SPIRAL_TURNS = 3 // Number of full turns in the spiral
const TOTAL_BLOCKS = 10

type StaticBlock = {
  instances: BABYLON.InstancedMesh[]
}

type PendingBlock = {
  sps: BABYLON.SolidParticleSystem
  particleData: {
    radius: number
    theta: number
    phi: number
    phase: number
    speed: number
  }[]
}

export default function Blocks() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const calculateSpiralPosition = (index: number) => {
    // Calculate angle based on index and total turns
    const angle = (index / TOTAL_BLOCKS) * Math.PI * 2 * SPIRAL_TURNS

    // Calculate radius using logarithmic spiral formula
    const radius = BASE_RADIUS * Math.exp(SPIRAL_GROWTH * angle)

    // Add height component that increases with angle
    const height = angle * 2 // Controls how quickly the spiral rises

    // Convert to cartesian coordinates with height
    const x = radius * Math.cos(angle)
    const y = height // This is now the height component
    const z = radius * Math.sin(angle)

    // Calculate block radius based on spiral growth to ensure touching
    // For a logarithmic spiral, the distance between points is approximately:
    // distance = sqrt((dr/dθ)² + r²) * dθ
    const dθ = (2 * Math.PI * SPIRAL_TURNS) / TOTAL_BLOCKS
    const dr = radius * SPIRAL_GROWTH * dθ
    const distance = Math.sqrt(dr * dr + radius * radius) * dθ
    const blockRadius = distance / 2 // Half the distance to ensure touching

    return {
      position: new BABYLON.Vector3(x, y, z),
      radius: blockRadius,
    }
  }

  const createStaticBlock = (
    scene: BABYLON.Scene,
    baseSphere: BABYLON.Mesh,
    position: BABYLON.Vector3,
    blockRadius: number
  ): StaticBlock => {
    // Create instances for particles
    const instances: BABYLON.InstancedMesh[] = []
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
        const particleRadius = blockRadius * 1 // Slightly smaller to ensure particles don't overlap

        // Use pre-calculated values
        const phiDeg = Math.floor((phi * 180) / Math.PI) % 360
        const thetaDeg = Math.floor((theta * 180) / Math.PI) % 360
        const x = particleRadius * sinValues[phiDeg] * cosValues[thetaDeg]
        const y = particleRadius * sinValues[phiDeg] * sinValues[thetaDeg]
        const z = particleRadius * cosValues[phiDeg]

        // Create an instance of the base sphere
        const instance = baseSphere.createInstance(`particle-${ring}-${i}`)
        // Position relative to the block's position
        instance.position = new BABYLON.Vector3(x, y, z).add(position)
        instances.push(instance)
      }
    }

    return { instances }
  }

  const createPendingBlock = (scene: BABYLON.Scene, position: BABYLON.Vector3, blockRadius: number): PendingBlock => {
    // Create SPS
    const SPS = new BABYLON.SolidParticleSystem("SPS", scene, { updatable: true })
    const particleMesh = BABYLON.MeshBuilder.CreateBox("spsParticle", { size: PARTICLE_SIZE }, scene)
    particleMesh.isVisible = true

    // Store initial spherical coordinates and phase for swirling motion
    const particleData: PendingBlock["particleData"] = []
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
        const radius = blockRadius * 1
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
    spsMesh.position = position
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

    particleMesh.dispose()

    return { sps: SPS, particleData }
  }

  useEffect(() => {
    if (!canvasRef.current) return
    const engine = new BABYLON.Engine(canvasRef.current, true, { preserveDrawingBuffer: true }, true)
    const scene = new BABYLON.Scene(engine)
    scene.clearColor = new BABYLON.Color4(0, 0, 0, 0)

    // Simple camera setup
    const camera = new BABYLON.ArcRotateCamera(
      "camera",
      -Math.PI / 2,
      Math.PI / 2.5,
      100,
      new BABYLON.Vector3(0, 0, 0),
      scene
    )
    camera.attachControl(canvasRef.current, true)
    // camera.wheelPrecision = 30
    // camera.lowerRadiusLimit = 10
    // camera.upperRadiusLimit = 200
    // camera.alpha = Math.PI / 4
    // camera.beta = Math.PI / 3

    // Basic lighting
    const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene)
    light.intensity = 1

    // Create base sphere mesh for static blocks
    const baseSphere = BABYLON.MeshBuilder.CreateSphere("baseParticle", { diameter: PARTICLE_SIZE * 2 }, scene)
    const material = new BABYLON.StandardMaterial("particleMat", scene)
    material.emissiveColor = new BABYLON.Color3(0.4, 0.7, 1)
    material.diffuseColor = new BABYLON.Color3(0.2, 0.5, 1)
    material.specularColor = new BABYLON.Color3(0.8, 0.9, 1)
    material.alpha = 1
    material.disableLighting = true
    material.useAlphaFromDiffuseTexture = false
    material.forceDepthWrite = false
    material.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND
    baseSphere.material = material
    baseSphere.setEnabled(false)

    // Create blocks
    const staticBlocks: StaticBlock[] = []
    let pendingBlock: PendingBlock | null = null

    // Create confirmed blocks
    for (let i = 0; i < TOTAL_BLOCKS - 1; i++) {
      const { position, radius } = calculateSpiralPosition(i)
      staticBlocks.push(createStaticBlock(scene, baseSphere, position, radius))
    }

    // Create pending block
    const { position, radius } = calculateSpiralPosition(TOTAL_BLOCKS - 1)
    pendingBlock = createPendingBlock(scene, position, radius)

    // Pre-calculate sin/cos values for optimization
    const sinValues: number[] = []
    const cosValues: number[] = []
    for (let i = 0; i < 360; i++) {
      const rad = (i * Math.PI) / 180
      sinValues[i] = Math.sin(rad)
      cosValues[i] = Math.cos(rad)
    }

    // Animation loop
    engine.runRenderLoop(() => {
      if (pendingBlock) {
        const t = performance.now() * 0.002
        const amplitude = radius * 0.2

        pendingBlock.sps.updateParticle = (p: BABYLON.SolidParticle) => {
          const d = pendingBlock.particleData[p.idx]

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
          const dist = p.position.length() / radius
          const colorFactor = 1 - dist
          if (p.color) {
            p.color.set(0.7 + 0.3 * colorFactor, 0.85 + 0.15 * colorFactor, 1, 0.7 + 0.3 * colorFactor)
          }
          return p
        }
        pendingBlock.sps.setParticles()
      }

      scene.render()
    })

    return () => {
      engine.stopRenderLoop()
      engine.dispose()
    }
  }, [])

  return (
    <div className="relative w-full h-screen flex items-center justify-center">
      <canvas ref={canvasRef} className="w-full outline-none" touch-action="none" />
    </div>
  )
}
