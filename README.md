# Marketplace

An SRML-based Substrate node, that demonstrates loosely-coupled SRML modules.

## Runtime Structure
The runtime is composed of a few default modules, a marketplace module that allows users to post items for sale, buy those items, and leave feedback for each other. The marketplace module depends on a reputation system via the `Reputation` trait. This repository also provides two implementations of that trait known as "Simple Feedback" and "Beta Feedback". These implementations are based on [A Quantitative Comparison of Reputation Systems in the Grid](https://www-users.cs.umn.edu/~weiss039/papers/Trust-Grid2005.pdf).

## Exercise
This project may illustrate several useful aspects of Substrate runtime development, but it is intended to primarily demonstrate how to couple runtime modules through traits. To master these topics I encourage you to try these exercises.

1. Replace Simple Feedback with Beta Feedback
2. Write your own implementation of the `Feedback` trait
3. Make Marketplace depend on some notion of `Currency` to actually pay for purchases.

## Getting Started

### Build the Node

```bash
# Install Rust
curl https://sh.rustup.rs -sSf | sh

# Change to node directory
cd node

# Install required tools:
./scripts/init.sh

# Build the node binary
cargo build --release
```

### Launch a Chain

You can start a development chain with

```bash
cargo run --release -- purge-chain --dev
cargo run --release -- --dev
```

This is a Substrate-based chain, so you can learn much more about starting chains at the [Substrate Developer Hub](https://substrate.dev).

## Launch the User Interface
```bash
# Change to ui directory
cd ../ui

# Install dependencies
yarn

# Start UI
yarn start
```

Then navigate to [localhost:3000](localhost:3000) in your favorite browser.
