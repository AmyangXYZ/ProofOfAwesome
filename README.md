# Proof of Awesome

Proof of Awesome transforms blockchain mining from solving computational puzzles to validating real-world achievements. This blockchain system combines scholarly peer review with blockchain consensus mechanisms to create verifiable digital assets from personal accomplishments. The system operates in 15-minute cycles, "AwesomeCom" event, where users submit achievements, review others' work, and create blocks that record accepted achievements.

## Project Vision

Proof of Awesome reimagines blockchain technology by aligning it with human values and achievement:

- **Mining through meaningful accomplishment** - Replace abstract computation with personal achievements
- **Community-validated accomplishments** - Transform personal milestones into digital assets with social validation
- **Accessible blockchain experience** - Make blockchain concepts tangible through everyday activities
- **Themed achievement cycles** - Each AwesomeCom session focuses on a specific theme
- **Simple reward system** - AwesomeCoin rewards for contributions

The platform aims to bridge the gap between technical blockchain innovation and meaningful human experience, creating a system where blockchain validation serves to recognize and reward real-world accomplishments.

## System Architecture

### Core Components

1. **Blockchain Structure**

   - Chain of blocks containing accepted achievements and reviews
   - Each block references previous block hash
   - Blocks include achievement references and theme information
   - State (balances) stored separately but referenced in blocks

2. **Storage Architecture**

   - **Blockchain DB**: Stores blocks with minimal reference data
   - **State DB**: Stores AwesomeCoin balances
   - **Achievement DB**: Stores full achievement content
   - **Review DB**: Stores review details
   - **Checkpoint System**: Periodic state snapshots for efficient synchronization

3. **AwesomeConnect Server**

   - Provides message relay for peer-to-peer communication
   - Delivers network time synchronization
   - Broadcasts official AwesomeCom session announcements
   - Maintains theme selection for each session

### Theme System

- Each AwesomeCom session has a specific theme (gaming, fitness, houshold, art...)
- Themes are rotated deterministically based on edition number
- Achievements must align with the session's theme

### Reward System

- **Achievement Acceptance**: 50 AwesomeCoin
- **Best Achievement Creator**: 75 AwesomeCoin
- **Quality Reviews**: 10 AwesomeCoin each
- Rewards distributed automatically upon block acceptance

## Consensus Mechanism

Proof of Awesome implements a hybrid consensus approach combining peer review with blockchain validation:

### Technical Program Committee (TPC)

- **Committee Structure**:

  - Composed of full nodes and qualified light nodes
  - Light nodes can join TPC after having accepted reviews in past AwesomeCom events
  - Responsible for achievement review and validation
  - Maintains quality standards through membership requirements

- **Review Process**:
  - Reviews are only broadcast among TPC members
  - Reduces network traffic while maintaining review quality
  - Each review must be signed by eligible TPC members
  - Minimum number of reviews required for achievement acceptance

### Achievement Validation

- Achievements must be reviewed by TPC members
- Each review includes:
  - Score and comments
  - Reviewer signature
  - Timestamp within review window
- Achievement acceptance requires:
  - Minimum number of valid reviews
  - Meeting score threshold
  - All reviews from eligible TPC members

### Block Creation and Selection

- Any full node can create blocks
- Blocks must contain:
  - All accepted achievements
  - Their corresponding reviews
  - Previous block hash
  - Timestamp within creation window
- Block selection criteria:
  - Must include all known achievements
  - Among valid blocks, choose one with highest-scored achievement
  - If same score, use earliest timestamp
- Invalid blocks are discarded if:
  - Missing known achievements
  - Contains invalid reviews
  - Has incorrect merkle roots

## AwesomeCom Session Process

Each 15-minute AwesomeCom session follows an 8-4-2-1 principle for efficient operation:

### 1. Submission and TPC Formation Phase (0:00-8:00)

- Light nodes submit achievements to TPC members
- TPC formation and membership verification
- Each submission includes:
  - Description and evidence
  - Creator signature
  - Timestamp
- TPC members maintain registry of submissions

### 2. Review Phase (8:00-12:00)

- TPC members review submissions
- Reviews are only broadcast among TPC members
- Each review includes:
  - Score and comments
  - Reviewer signature
  - Timestamp
- After review phase:
  - TPC members broadcast accepted achievement reviews to all nodes
  - Rejected achievement reviews sent only to creators
  - All nodes maintain registry of accepted achievements

### 3. Block Creation Phase (12:00-14:00)

- Each full node:
  - Creates block with accepted achievements and reviews
  - Computes merkle roots
  - Broadcasts to all nodes
- All nodes:
  - Verify received blocks
  - Keep block with highest-scored achievement
  - Discard invalid or incomplete blocks
- Network converges on block with:
  - All known achievements
  - Highest-scored achievement
  - Valid reviews and signatures

### 4. Wrap-up and Break Phase (14:00-15:00)

- Network finalizes block acceptance
- Nodes prepare for next session
- System announcements and notifications
- Brief break before next AwesomeCom session

## Synchronization and Recovery

### New Node Synchronization

1. Connect to multiple peers
2. Download block headers to identify consensus chain
3. Get latest state snapshot with verification proof
4. Verify state against latest block's state root hash
5. Download full blocks as needed (or from checkpoint)
6. Apply any blocks after checkpoint to reach current state

### Recovery After Data Loss

1. Connect to trusted peers
2. Identify consensus chain through block headers
3. Get verified state snapshot
4. Apply any blocks after snapshot state
5. Resume normal operation

### Checkpoint System

- Periodic snapshots of full state
- Includes balances and token holdings
- Enables efficient synchronization
- Verified through state root hashes in blocks

## User Experience Flow

### New User Onboarding

1. Generate public/private key pair
2. Register with system
3. Receive initial AwesomeCoin balance
4. Synchronize with blockchain state

### Participation Loop

1. Check current AwesomeCom theme
2. Submit achievement during submission phase
3. Review others' submissions during review phase
4. Receive AwesomeCoin rewards for contributions
5. Repeat in next AwesomeCom session

### Chain Creation

- Users can create specialized achievement chains
- Define validation rules and criteria
- Set reward structures
- Establish liquidity reserve requirements
- Customize for specific community needs (fitness, creative projects, etc.)

## Notifications and Announcements

### Personal Notifications

- Achievement acceptance/rejection notifications
- Review received notifications
- Block acceptance confirmations
- AwesomeCoin reward notifications

### AwesomeCom Announcements

- Current session theme
- Official session results
- List of accepted achievements
- Best achievement creator recognition
- Outstanding reviewer acknowledgments
- Next session timing and theme

## Security Considerations

### Blockchain Integrity

- All achievements and reviews cryptographically signed
- Consensus rules enforced by all nodes
- State verification through merkle root hashes
- Checkpoints for additional verification points

### User Authentication

- Public/private key cryptography for all actions
- Signatures required for achievements and reviews
- No centralized authentication dependencies

### Network Resilience

- Multiple full nodes ensure continuity
- Peer-to-peer communication through AwesomeConnect
- Checkpoint system for efficient recovery

## Implementation Notes

### Achievement Verification

- Verify signature matches claimed creator
- Check format and required fields
- Verify submission is within time window
- Ensure one achievement per user per session

### Review Processing

- Verify reviewer signatures
- Ensure reviewers haven't reviewed own work
- Calculate weighted consensus score
- Determine final acceptance status

### Block Creation

- Verify creator has accepted achievement
- Ensure all accepted achievements included
- Verify timestamps and references
- Apply selection rules when multiple valid blocks

### Network Time Synchronization

- AwesomeConnect server provides authoritative time
- Regular time broadcasts to all nodes
- Time synchronization protocol accounts for network latency
- Cycle phases strictly enforced based on network time

## Technical Implementation

Proof of Awesome combines modern web technologies with blockchain concepts:

- **Backend**: Node.js powered by Socket.IO for real-time updates
- **Database**: MongoDB for data persistence
- **Client Options**: Next.js Web interface and native iOS app
- **Connectivity**: AwesomeConnect for peer-to-peer messaging
- **Cryptography**: Standard blockchain cryptographic primitives

The implementation focuses on accessibility while maintaining blockchain integrity, allowing users without technical blockchain knowledge to participate fully.

## Example AwesomeCom Session

See the example announcement and notification formats below for a complete illustration of the AwesomeCom session flow and user experience.

### User Notification Example

```
🎊 Congratulations! 🎊

Your achievement "Implementing Gradient Boosting for Predictive Maintenance" has been ACCEPTED in the current AwesomeCom session!

• You have received 50 tokens as reward for your accepted achievement
• All accepted achievements in this session have met our quality standards

📦 BLOCK CREATION OPPORTUNITY

You are now eligible to create a block for this AwesomeCom session. All members with accepted achievements can submit blocks to the network.

⏰ Block Creation Window: Opens in 5 minutes (14:55 UTC)
                         Closes at 15:00 UTC

Block Selection Process:
• The block from the highest-ranked achievement creator will be selected
• Creating the accepted block earns an additional 75 tokens
• If no eligible member creates a block, a fallback block will be generated

[ Create My Block ]   [ Skip Block Creation ]

We encourage you to participate in block creation to further contribute to the blockchain's development.
```

### AwesomeCom Announcement Example

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║  AwesomeCom Proceedings: Machine Learning Chain              ║
║  Block #347 | June 15, 2023 | 14:30 UTC                      ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

Dear esteemed community members,

As Chair of this AwesomeCom session, I am pleased to present the proceedings of our most recent academic blockchain cycle.

📊 SESSION STATISTICS
• Submissions: 17 achievements
• Reviews conducted: 53
• Acceptance rate: 41.2% (7 accepted achievements)
• Average review score: 7.4/10
• Review participation rate: 82% of eligible members

✅ ACCEPTED ACHIEVEMENTS (50 tokens each)
• "Implementing Gradient Boosting for Predictive Maintenance" by Dr. Sarah Chen
• "Transfer Learning Applications in Medical Imaging" by James Wilson
• "Optimizing CNN Architecture for Edge Devices" by Aisha Patel
• "Reinforcement Learning for Resource Allocation" by Michael Okonjo
• "Federated Learning Privacy Guarantees" by Emma Rodriguez
• "Explainable AI in Credit Scoring Models" by David Kim
• "Time Series Forecasting with Attention Mechanisms" by Priya Sharma

🧱 BLOCK CONTRIBUTION
Block #347 created by Dr. Sarah Chen
Reward: 75 tokens

👏 OUTSTANDING REVIEWERS (10 tokens each)
• Elena Vasquez (5 quality reviews)
• Raj Patel (4 quality reviews)
• Thomas Mueller (3 quality reviews)
• Liu Wei (3 quality reviews)
• + 9 other reviewers

💰 TOTAL REWARDS DISTRIBUTED: 545 tokens

The committee commends all participants for their valuable contributions to our academic blockchain. Each accepted achievement demonstrates excellent quality and advances our community's knowledge.

The next AwesomeCom session is now open for submissions. We encourage all members to participate in this ongoing scholarly discourse.

Respectfully,
The AwesomeCom Chair
Machine Learning Chain

╔══════════════════════════════════════════════════════════════╗
║ Next submission deadline: 14:50 UTC                          ║
║ Review phase begins: 14:50 UTC                               ║
╚══════════════════════════════════════════════════════════════╝
```

## Future Considerations

- Enhanced reputation systems based on contribution history
- Advanced AMM features for better liquidity
- Cross-chain achievement references
- Meta-achievements spanning multiple chains
- Delegate roles for specialized functions
- Enhanced mobile experience optimization
- Advanced analytics on achievement and review patterns
- Full transition to community-based peer review
- Enhanced governance mechanisms for community direction

## Join the Achievement Revolution

Proof of Awesome reimagines blockchain technology by aligning it with human values and achievement. By replacing abstract computation with meaningful accomplishment as the basis for consensus, we create a platform that generates authentic utility through community-validated human achievement.

---

This document serves as a comprehensive reference for the Proof of Awesome blockchain system, outlining all major components, processes, and design decisions. It is intended primarily as a technical note and reference guide.
