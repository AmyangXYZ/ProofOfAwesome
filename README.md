# Proof of Awesome

Proof of Awesome presents a novel blockchain consensus mechanism that replaces computational puzzles with real-world achievements. This system combines AI-assisted scholarly peer review with blockchain technology to create verifiable digital assets from personal accomplishments.

## Project Vision

Proof of Awesome reimagines blockchain technology by aligning it with human values and achievement:

- **Mining through meaningful accomplishment** - Replace abstract computation with personal achievements
- **Community-validated accomplishments** - Transform personal milestones into digital assets with social validation
- **Accessible blockchain experience** - Make blockchain concepts tangible through everyday activities
- **Open achievement system** - Each AwesomeCom session accepts any form of achievements
- **Tiered reward system** - AwesomeCoin rewards based on achievement review scores

The platform aims to bridge the gap between technical blockchain innovation and meaningful human experience, creating a system where blockchain validation serves to recognize and reward real-world accomplishments.

## System Architecture

### Core Components

1. **Blockchain Structure**

   - Chain of blocks containing accepted achievements and reviews
   - Each block references previous block hash
   - Blocks include achievement references and review information
   - State (balances) stored using sparse merkle trees in full nodes

2. **Storage Architecture**

   - **Blockchain DB**: Stores blocks with minimal reference data
   - **State DB**: Stores AwesomeCoin balances using sparse merkle trees
   - **Achievement DB**: Stores full achievement content
   - **Review DB**: Stores review details

3. **AwesomeConnect Server**

   - Provides message relay for peer-to-peer communication
   - Delivers network time synchronization
   - Broadcasts official AwesomeCom session announcements

### Mining with Achievements

Traditional blockchain mining systems, while technically impressive, remain abstract for most individuals. Mining through real-world achievements offers a complementary approach that brings blockchain into everyday life. Each validated achievement becomes a permanent record of human accomplishment, creating value through both network security and meaningful social recognition.

### Reward System

- **Tiered Achievement Rewards**:
  - Score 5 (Strong Accept): 3 AwesomeCoin
  - Score 4 (Accept): 2 AwesomeCoin
  - Score 3 (Weak Accept): 1 AwesomeCoin
- Rewards distributed automatically upon block creation

## Consensus Mechanism

Proof of Awesome implements a hybrid consensus approach combining peer review with blockchain validation:

### Review Process

- Anyone can submit reviews during both submission and review phases
- Each review includes:
  - Score and comments
  - Reviewer signature
  - Timestamp within review window
- Achievement acceptance requires:
  - Minimum number of valid reviews
  - Meeting score threshold (median score >= 3)
  - All reviews from valid participants

### Block Creation and Selection

- Only full nodes participate in consensus phase
- Blocks must contain:
  - All accepted achievements
  - Their corresponding reviews
  - Previous block hash
  - Timestamp within creation window
- Block selection criteria:
  - Must include all known achievements
  - Among valid blocks, choose one with earliest timestamp
- Invalid blocks are discarded if:
  - Missing known achievements
  - Contains invalid reviews
  - Has incorrect merkle roots

## AwesomeCom Session Process

Each 3-minute AwesomeCom session follows a precise timing for efficient operation, with all nodes using the same genesis time to determine phase transitions:

### 1. Submission Phase (0:00-2:00)

- Users submit achievements
- Anyone can submit reviews
- Each submission includes:
  - Description and evidence
  - Creator signature
  - Timestamp

### 2. Review Phase (2:00-2:30)

- Users continue submitting reviews
- Reviews include:
  - Score and comments
  - Reviewer signature
  - Timestamp
- After review phase:
  - All nodes maintain registry of accepted achievements

### 3. Consensus Phase (2:30-2:50)

- Full nodes:
  - Create block with accepted achievements and reviews
  - Compute merkle roots
  - Broadcast to all nodes
- All nodes:
  - Verify received blocks
  - Keep block with earliest timestamp
  - Discard invalid or incomplete blocks
- Network converges on block with:
  - All known achievements
  - Valid reviews and signatures

### 4. Announcement Phase (2:50-3:00)

- Network finalizes block acceptance
- Nodes prepare for next session
- System announcements

## Network Architecture

Peer-to-peer communication is achieved through a Socket.IO-based relay system, AwesomeConnect, connecting full nodes that maintain blockchain history with light nodes that need verified data. Full nodes serve this data through Merkle Patricia Trees and participate in consensus to reach agreement on accepted achievements, with some providing automated reviews through AI models. Light nodes focus on achievement submission and review, fetching verified chain data as needed.

AwesomeCom implements this system through periodic blockchain events, each with precisely timed phases synchronized to a hard-coded genesis time (March 14, 2025). This ensures all nodes in the network operate in the same phase of the cycle, with each phase transition occurring at exact intervals from genesis.

### Node Types

- **AwesomeConnect**

  - Socket.IO-based relay
  - Enable P2P and node discovery
  - Independent of chain state

- **Full Node**

  - Backend service nodes
  - AI-assisted reviewer
  - Complete chain history

- **Light Node**
  - Client-side applications
  - Achievement creator
  - Fetch data as needed

## Synchronization and Recovery

### New Node Synchronization

1. Connect to multiple peers
2. Download block headers to identify consensus chain
3. Get latest state from full nodes
4. Verify state against latest block's state root hash
5. Download full blocks as needed
6. Apply blocks to reach current state

### Recovery After Data Loss

1. Connect to trusted peers
2. Identify consensus chain through block headers
3. Get verified state from full nodes
4. Apply any blocks after state
5. Resume normal operation

## User Experience Flow

### New User Onboarding

1. Generate public/private key pair
2. Register with system
3. Receive initial AwesomeCoin balance
4. Synchronize with blockchain state

### Participation Loop

1. Submit achievement during submission phase
2. Review others' submissions during submission and review phases
3. Receive AwesomeCoin rewards for accepted achievements
4. Repeat in next AwesomeCom session

## Security Considerations

### Blockchain Integrity

- All achievements and reviews cryptographically signed
- Consensus rules enforced by all nodes
- State verification through merkle root hashes
- Sparse merkle trees for efficient state management

### User Authentication

- Public/private key cryptography for all actions
- Signatures required for achievements and reviews
- No centralized authentication dependencies

### Network Resilience

- Multiple full nodes ensure continuity
- Peer-to-peer communication through AwesomeConnect
- Efficient state management through sparse merkle trees

## Implementation Notes

### Achievement Verification

- Verify signature matches claimed creator
- Check format and required fields
- Verify submission is within time window
- Ensure one achievement per user per session

## Technical Implementation

Proof of Awesome combines modern web technologies with blockchain concepts:

- **Backend**: Node.js powered by Socket.IO for real-time updates
- **Database**: MongoDB for data persistence
- **Client Options**: Next.js Web interface and native iOS app
- **Connectivity**: AwesomeConnect for peer-to-peer messaging
- **Cryptography**: Standard blockchain cryptographic primitives
- **Time Synchronization**: Genesis-based phase determination (March 14, 2025)

The implementation focuses on accessibility while maintaining blockchain integrity, allowing users without technical blockchain knowledge to participate fully.
