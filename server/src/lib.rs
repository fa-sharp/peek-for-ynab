use axum_plugin::{App, InitializedApp};

use crate::{
    config::{AppConfig, extract_config},
    state::AppState,
};

mod config;
mod guard;
pub mod plugins;
mod routes;
mod state;
pub mod types;
pub mod util;

/// A type alias for the axum AdHoc plugin, with correct state and config types.
pub type Plugin = axum_plugin::AdHocPlugin<AppState, AppConfig>;

pub async fn create_app(
    additional_config: Option<Vec<(String, String)>>,
) -> anyhow::Result<InitializedApp<AppState, AppConfig>> {
    let app = App::load_config_with(|| extract_config(additional_config.unwrap_or_default()))?
        .register(plugins::crypto::plugin()) // Encryption and decryption of tokens
        .register_at(plugins::oauth::plugin("/api/auth/v2"), "/api/auth/v2") // OAuth routes
        .register_at(routes::plugin(), "/api") // API routes
        .register(plugins::cors::plugin()) // CORS handling
        .register(plugins::logging::plugin()) // Request logs
        .register(plugins::web::plugin()) // Astro static website
        .register(plugins::security::plugin()) // Request timeout, body limit, etc.
        .init()
        .await?;

    Ok(app)
}
