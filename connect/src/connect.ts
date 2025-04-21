import express from "express"
import { Server } from "socket.io"
import { createServer, Server as HttpServer } from "node:http"
import cors from "cors"
import * as ecc from "tiny-secp256k1"
import { Buffer } from "buffer"
import { sha256 } from "js-sha256"
import { ClientEvents, Identity, ServerEvents, Message } from "./types"

export class AwesomeConnect {
  private expressApp: express.Application
  private httpServer: HttpServer
  private io: Server<ServerEvents, ClientEvents>
  private addressToSocketId: Map<string, string> = new Map()

  constructor() {
    this.expressApp = express()
    this.httpServer = createServer(this.expressApp)
    this.io = new Server(this.httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    })
  }

  setupRoutes() {
    this.expressApp.use(cors())

    this.io.on("connection", (socket) => {
      socket.on("disconnect", () => {})

      socket.on("node.connect", (identity: Identity) => {
        if (this.verifyIdentity(identity)) {
          socket.data.identity = identity
          this.addressToSocketId.set(identity.address, socket.id)
          console.log(`New ${identity.nodeType} node ${identity.address} connected`)
          socket.emit("node.connected")

          socket.join(`${identity.chain}:nodes`)
          if (identity.nodeType === "full") {
            socket.join(`${identity.chain}:fullnodes`)
          }
        }
      })

      socket.on("message.send", (message: Message) => {
        if (!socket.data.identity) {
          return
        }

        if (message.to === "*" && message.room !== "") {
          this.io.to(message.room).emit("message.received", message)
          return
        }

        const socketId = this.addressToSocketId.get(message.to)
        if (!socketId) {
          return
        }
        this.io.to(socketId).emit("message.received", message)
      })

      socket.on("room.join", (room: string) => {
        if (socket.data.identity) {
          socket.join(room)
        }
      })

      socket.on("room.leave", (room: string) => {
        if (
          socket.data.identity &&
          room !== `${socket.data.identity.chain}:nodes` &&
          room !== `${socket.data.identity.chain}:fullnodes`
        ) {
          socket.leave(room)
        }
      })

      socket.on("room.get_members", async (room: string) => {
        if (socket.data.identity) {
          try {
            const sockets = await this.io.in(room).fetchSockets()
            const nodes: Identity[] = sockets.map((socket) => socket.data.identity)
            socket.emit("room.members", room, nodes)
          } catch {
            console.error(`Failed to get members of room ${room}`)
            return
          }
        }
      })
    })
  }

  verifyIdentity(identity: Identity): boolean {
    try {
      if (!/^[0-9a-f]+$/i.test(identity.publicKey) || !/^[0-9a-f]+$/i.test(identity.signature)) {
        return false
      }

      const messageHash = sha256(
        [identity.chain, identity.name, identity.address, identity.nodeType, identity.publicKey].join("_")
      )

      return ecc.verify(
        Buffer.from(messageHash, "hex"),
        Buffer.from(identity.publicKey, "hex"),
        Buffer.from(identity.signature, "hex")
      )
    } catch {
      return false
    }
  }

  async start() {
    this.setupRoutes()
    this.httpServer.listen(3000, () => {
      console.log("AwesomeConnect is running on port 3000")
    })
  }
}
