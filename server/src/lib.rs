use axum_plugin::{App, InitializedApp};

use crate::state::AppState;

mod config;
mod guard;
mod plugins;
mod routes;
mod state;
mod types;
mod util;

pub async fn create_app() -> anyhow::Result<InitializedApp<AppState>> {
    let app = App::new()
        .register(config::plugin()) // Extract configuration and add to state
        .register(plugins::crypto::plugin()) // Encryption and decryption of tokens
        .register(plugins::oauth::plugin()) // OAuth routes
        .register(routes::plugin()) // API routes
        .register(plugins::cors::plugin()) // CORS handling
        .register(plugins::web::plugin()) // Astro static website
        .register(plugins::security::plugin()) // Request timeout, body limit, etc.
        .init()
        .await?;

    Ok(app)
}
