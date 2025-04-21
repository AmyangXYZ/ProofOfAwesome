# AwesomeConnect

A lightweight message relay server enabling peer-to-peer communication for blockchain applications.

## Overview

AwesomeConnect is an efficient message relay server that facilitates communication between nodes in decentralized applications. It acts as a central hub for routing messages between peers, enabling logical peer-to-peer communication patterns while handling the complexities of modern networks.

Originally developed for the [Proof of Awesome](https://proof-of-awesome.app) blockchain ecosystem, AwesomeConnect is designed to be application-agnostic and can be used in any project requiring node-to-node communication capabilities.

## Key Features

- **Message Relay** - Forward messages between peers across NATs and firewalls
- **Two-Way Authentication** - Secure ZeroProof verification between clients and server
- **Room-Based Communication** - Join topic/chain specific rooms for targeted broadcasting
- **Stateless Design** - Can be restarted or migrated anytime without data loss
- **Lightweight** - Minimal resource requirements for high performance

## Architecture

AwesomeConnect uses a central relay architecture where all messages pass through the server which forwards them to the appropriate recipients. This approach ensures reliable message delivery across various network environments, including NATs and firewalls, without requiring direct connections between peers.

The server maintains only ephemeral connection state (active sessions and subscriptions) and is completely stateless regarding application data, allowing it to be restarted or migrated at any time. Clients automatically reconnect and reestablish their session state when the server becomes available again.

## Advanced Features

Future versions will incorporate advanced traffic shaping techniques inspired by IEEE 802.1Qcr Asynchronous Traffic Shaping, optimizing message delivery based on priority and network conditions.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
