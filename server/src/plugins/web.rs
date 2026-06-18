use axum::{
    extract::Request,
    http::{HeaderValue, header},
};
use axum_plugin::AdHocPlugin;
use tower_http::services::{ServeDir, ServeFile};

use crate::state::AppState;

pub fn plugin() -> AdHocPlugin<AppState> {
    AdHocPlugin::named("Website").on_setup(|router, _state| {
        let static_files =
            ServeDir::new("../web/dist").fallback(ServeFile::new("../web/dist/404.html"));
        let static_router =
            axum::Router::new()
                .fallback_service(static_files)
                .layer(axum::middleware::from_fn(
                    async |req: Request, next: axum::middleware::Next| {
                        let is_immutable_asset = req.uri().path().starts_with("/_astro/");
                        let mut response = next.run(req).await;
                        if response.status().is_success() && is_immutable_asset {
                            response.headers_mut().insert(
                                header::CACHE_CONTROL,
                                HeaderValue::from_static("public, max-age=31536000, immutable"),
                            );
                        }

                        response
                    },
                ));

        Ok(router.merge(static_router))
    })
}
