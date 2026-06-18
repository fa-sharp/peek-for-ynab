use axum_plugin::AdHocPlugin;

use crate::state::AppState;

pub mod token;

/// Adds all API routes to the server under `/api`
pub fn plugin() -> AdHocPlugin<AppState> {
    AdHocPlugin::named("API routes").on_setup(|router, _state| {
        let api_routes = axum::Router::new().nest("/token", token::routes());

        Ok(router.nest("/api", api_routes))
    })
}
