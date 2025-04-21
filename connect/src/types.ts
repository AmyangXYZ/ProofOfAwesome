export interface ServerEvents {
  "node.connect": (identity: Identity) => void
  "message.send": (message: Message) => void
  "room.join": (room: string) => void
  "room.leave": (room: string) => void
  "room.get_members": (room: string) => void
}

export interface ClientEvents {
  "node.connected": () => void
  "message.received": (message: Message) => void
  "room.members": (room: string, members: Identity[]) => void
}

export interface Identity {
  chain: string
  name: string
  address: string
  nodeType: "light" | "full"
  publicKey: string
  signature: string
}

export interface Message {
  from: string
  to: string | "*"
  room?: string
  type: string
  payload: unknown
  timestamp: number
}
