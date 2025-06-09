# Proof of Awesome

<img src="./logo.svg">

_[Proof of Awesome](https://proof-of-awesome.app)_ introduces a revolutionary blockchain consensus that transforms personal achievements into verifiable digital assets through AI-assisted scholarly peer review. As a truly distributed blockchain, it&apos;s completely free to participate - anyone can host a full node, submit achievements, or contribute as a reviewer without any barriers.

## Important Disclaimers

Proof of Awesome is a social platform using blockchain for data integrity, not a cryptocurrency application. AwesomeCoins are internal achievement points with no monetary value - they cannot be purchased, sold, or exchanged for real money.

## Project Vision

Proof of Awesome reimagines blockchain technology by aligning it with human values and achievement:

- **Achievement Blockchain** - Transform personal milestones into verifiable digital assets
- **Truly Distributed** - Anyone can host a full node and participate in consensus
- **Free to Participate** - No barriers to entry for achievement creators or reviewers
- **AI-powered Validation** - Automated achievement review with multi-criteria scoring
- **Peer Review Consensus** - Community-driven validation through scholarly review process
- **Mining through Meaning** - Replace computational puzzles with real-world accomplishments
- **Open Achievement System** - Each AwesomeCom session accepts any form of achievements
- **Accessible Blockchain** - Make blockchain concepts tangible through everyday activities

## Mining with Achievements

Traditional blockchain mining systems, while technically impressive, remain abstract for most individuals. Mining through real-world achievements offers a complementary approach that brings blockchain into everyday life. Each validated achievement becomes a permanent record of human accomplishment, creating value through both network security and meaningful social recognition.

### Example Achievements

- **Fitness King**: "First marathon done! Every mile counts, every step validated."
- **Pro Player**: "GGEZ, team too heavy. Go check the chain to see who&apos;s the real carry."
- **Home Hero**: "Now she can&apos;t say I&apos;m only gaming and left all the cleaning to her."

## Consensus Mechanism

Proof of Awesome implements a hybrid consensus approach combining peer review with blockchain validation through a Technical Program Committee (TPC):

### Review Process

- Anyone can submit reviews during both submission and review phases
- Each review includes:
  - Score and comments
    - Innovation (creativity and uniqueness)
    - Dedication (effort and persistence)
    - Significance (personal impact and benefits)
    - Presentation (clarity and documentation)
  - Reviewer signature
  - Timestamp within review window
- Achievement acceptance requires:
  - Minimum of three independent reviews
  - Median score exceeding [Weak-Accept]
  - All reviews from valid participants

### AwesomeCoin Rewards

The system incentivizes participation through AwesomeCoin rewards:

- **Achievement Creators**: Receive 5 AwesomeCoins for each accepted achievement
- **Reviewers**: Earn 1 AwesomeCoin for each review they submit that contributes to an accepted achievement

These rewards encourage active participation in both achievement creation and the peer review process, fostering a vibrant community of contributors.

## AwesomeCom Session Process

Each 3-minute AwesomeCom session follows a precise timing for efficient operation, with all nodes using the same genesis time (March 14, 2025) to determine phase transitions:

### 1. Achievement Submission (120s)

- Users submit achievements
- Anyone can submit reviews
- Each submission includes:
  - Description and evidence
  - Creator signature
  - Timestamp

### 2. Peer Review (30s)

- Users continue submitting reviews
- Reviews include:
  - Score and comments
  - Reviewer signature
  - Timestamp

### 3. TPC Meeting and Consensus (20s)

- Full nodes:
  - Create block with accepted achievements and reviews
  - Compute merkle roots
  - Broadcast to all nodes
- All nodes:
  - Verify received blocks
  - Keep block with earliest timestamp
  - Discard invalid or incomplete blocks

### 4. New Block Announcement (10s)

- Network finalizes block acceptance
- Nodes prepare for next session
- System announcements

## Network Architecture

Peer-to-peer communication is achieved through a Socket.IO-based relay system, AwesomeConnect, connecting full nodes that maintain blockchain history with light nodes that need verified data.

### Node Types

- **AwesomeConnect**

  - Socket.IO-based relay
  - Enable P2P and node discovery
  - Independent of chain state

- **Full Node**

  - Backend service with Node.js and MongoDB
  - [AI Reviewer](./node/src/reviewer_ai.ts) for instant achievement validation
  - Maintains complete blockchain history
  - Participates in consensus and block creation

- **Light Node**
  - Client-side applications
  - Achievement creator
  - Fetch data as needed

## Technical Implementation

Proof of Awesome&apos;s architecture combines blockchain technology with modern web infrastructure:

- **Blockchain Core**

  - BIP32/BIP39 for signature and verification
  - SHA-256 and SHA-3 for cryptographic hashing
  - Merkle Tree transaction, achievement and review verification
  - Sparse Merkle Tree for efficient account state management

- **AwesomeConnect**

  - Real-time P2P messaging with Socket.IO
  - RESTful API endpoints
  - Node discovery and synchronization

- **Full Node**

  - Complete blockchain state management
  - Consensus participation and block creation
  - [AI Reviewer](./node/src/reviewer_ai.ts) for instant achievement validation

- **Light Node**
  - Client-side cryptographic operations
  - Achievement submission and review interface
  - State synchronization with full nodes

The implementation focuses on accessibility while maintaining blockchain integrity, allowing users without technical blockchain knowledge to participate fully.
