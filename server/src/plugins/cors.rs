use axum::http::HeaderValue;
use axum_plugin::AdHocPlugin;
use reqwest::Method;
use tower_http::cors::{AllowOrigin, CorsLayer};

use crate::state::AppState;

pub fn plugin() -> AdHocPlugin<AppState> {
    AdHocPlugin::named("CORS").on_setup(|router, state: &AppState| {
        let cors = CorsLayer::new()
            .allow_methods([Method::GET, Method::POST])
            .allow_origin(match &state.config.allowed_origins {
                None => AllowOrigin::any(),
                Some(origins) => {
                    AllowOrigin::list(origins.iter().filter_map(|o| HeaderValue::from_str(o).ok()))
                }
            });

        Ok(router.layer(cors))
    })
}
