# Deposit Tokens PoC

This Proof of Concept (PoC) simulates the transfer of deposit tokens between two branches (A and B) under two models:

- **Backed Model**:  
  The Core Banking System (CBS) ledger and the Blockchain (Token) ledger are separate. A transfer involves a "burn & mint" process on the token ledger while the CBS ledger updates the account balances independently.

- **Native Model**:  
  A single unified ledger is used, where the transfer is reflected simultaneously on both CBS and Token ledgers.

## Default Settings
- **Initial Balance**:  
  - A Branch: \$1000  
  - B Branch: \$1000
- **Transfer Amount**:  
  - Default: \$100

## Features
- **Mode Selection**: Choose between "Backed Model" and "Native Model".
- **Real-time Simulation**:  
  - In the **Backed Model**, the CBS ledger and Token ledger are updated independently via a burn/mint simulation.
  - In the **Native Model**, both ledgers update simultaneously as a unified system.
- **Operation Log**: Each transfer operation is logged to show how the balances change.
- **Reset Function**: Reset the simulation to the initial state.

## Limitations
- This is a static PoC implemented entirely with client-side JavaScript (all data is held in memory).
- It does not connect to any real banking system or blockchain network.
- The simulation is for demonstration purposes only.

## Future Enhancements
- Simulation of more complex scenarios (multiple branches, multiple currencies).
- Integration with real APIs or a backend system.
- Enhanced UI/UX and responsive design improvements.
- Detailed logging and analytics.

## How to Use
1. Open the [Simulation Page](https://shuhei-yamauchi.github.io/deposit-tokens-poc/simulation.html) on GitHub Pages.  
2. Select a model (Backed or Native).  
3. Enter the transfer amount (default is \$100).  
4. Click the "Transfer" button to simulate a transfer from A Branch to B Branch.  
5. Observe the changes in the CBS Ledger and Token Ledger panels.  
6. Use the "Reset" button to reset the simulation to its initial state.  
