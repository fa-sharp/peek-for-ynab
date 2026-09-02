use axum::http::{HeaderValue, Method, header};
use tower_http::cors::{AllowOrigin, CorsLayer};

use crate::Plugin;

pub fn plugin() -> Plugin {
    Plugin::named("CORS").global_setup(|app, router| {
        let cors = CorsLayer::new()
            .allow_methods([Method::GET, Method::POST])
            .allow_headers([header::AUTHORIZATION, header::ACCEPT, header::CONTENT_TYPE])
            .allow_origin(match &app.config().allowed_origins {
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
