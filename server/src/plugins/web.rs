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
            ServeDir::new("../web/dist").not_found_service(ServeFile::new("../web/dist/404.html"));
        let security_headers = axum_helmet::Helmet::new()
            .add(axum_helmet::CrossOriginOpenerPolicy::same_origin())
            .add(axum_helmet::CrossOriginResourcePolicy::same_origin())
            .add(axum_helmet::ReferrerPolicy::no_referrer())
            .add(axum_helmet::StrictTransportSecurity::default())
            .add(axum_helmet::XContentTypeOptions::nosniff())
            .add(axum_helmet::XFrameOptions::same_origin())
            .into_layer()?;
        let static_router = axum::Router::new()
            .fallback_service(static_files)
            .layer(security_headers)
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
