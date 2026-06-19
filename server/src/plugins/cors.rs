use axum::http::{HeaderValue, Method, header};
use axum_plugin::AdHocPlugin;
use tower_http::cors::{AllowOrigin, CorsLayer};

use crate::state::AppState;

pub fn plugin() -> AdHocPlugin<AppState> {
    AdHocPlugin::named("CORS").on_setup(|router, state: &AppState| {
        let cors = CorsLayer::new()
            .allow_methods([Method::POST])
            .allow_headers([header::AUTHORIZATION, header::ACCEPT, header::CONTENT_TYPE])
            .allow_origin(match &state.config.allowed_origins {
                None => AllowOrigin::any(),
                Some(origins) => AllowOrigin::list(
                    origins
                        .iter()
                        .filter_map(|o| HeaderValue::from_str(o.as_str()).ok()),
                ),
            });

        Ok(router.layer(cors))
    })
}
