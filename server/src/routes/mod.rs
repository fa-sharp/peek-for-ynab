use crate::Plugin;

mod health;
mod token;

/// Adds all API routes to the server
pub fn plugin() -> Plugin {
    Plugin::named("API routes").local_setup(|_app| {
        let api_routes = axum::Router::new()
            .nest("/health", health::routes())
            .nest("/token", token::routes());

        Ok(api_routes)
    })
}
