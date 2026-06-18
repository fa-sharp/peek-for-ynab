use std::{net::SocketAddr, str::FromStr};

use peek_server::create_app;
use tracing::level_filters::LevelFilter;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Read .env file in debug mode
    #[cfg(debug_assertions)]
    dotenvy::dotenv().ok();

    // Build server
    let app = create_app().await?;
    let config = &app.state().config;

    // Configure logging output (use JSON logs in release mode)
    let level_filter = LevelFilter::from_str(&config.log_level)?;
    let env_filter = tracing_subscriber::EnvFilter::builder()
        .with_default_directive(level_filter.into())
        .from_env_lossy();
    if cfg!(debug_assertions) {
        tracing_subscriber::fmt()
            .with_env_filter(env_filter)
            .with_max_level(level_filter)
            .init();
    } else {
        tracing_subscriber::registry()
            .with(env_filter)
            .with(level_filter)
            .with(tracing_subscriber::fmt::layer().json().flatten_event(true))
            .init();
    }

    // Start listening for requests
    let addr = SocketAddr::new(config.host, config.port);
    let listener = tokio::net::TcpListener::bind(addr).await?;
    tracing::info!("Server listening on http://{}...", listener.local_addr()?);
    axum::serve(listener, app.router().into_make_service())
        .with_graceful_shutdown(shutdown_signal(app.shutdown()))
        .await?;

    Ok(())
}

/// Shutdown signal: listens for Ctrl-C, SIGINT, SIGTERM signals
async fn shutdown_signal(on_shutdown: impl Future + Send) {
    let ctrl_c = async {
        tokio::signal::ctrl_c()
            .await
            .expect("failed to register Ctrl-C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
            .expect("failed to register SIGTERM handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }
    tracing::info!("Received shutdown signal, shutting down server...");
    on_shutdown.await;
}
