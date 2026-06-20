# Peek for YNAB Backend Server

## Project Structure

```
.
├── src/
│   ├── plugins/      # Axum plugins
│   ├── routes/       # API routes
│   ├── config.rs     # Configuration management
│   ├── lib.rs        # Builds the Axum server
│   ├── main.rs       # Entry point
│   └── state.rs      # Axum state
├── Cargo.toml        # Dependencies
└── .env.example      # Example environment variables
```

## Development

```bash
# Run in development mode (loads .env file)
cargo run

# Build for production
cargo build --release
```
