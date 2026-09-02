use std::time::Duration;

use anyhow::Context;
use axum::Extension;
use simple_oauth::SimpleOAuthClient;

use crate::{Plugin, plugins::oauth::provider::YnabOAuthProvider};

mod provider;
mod routes;
mod service;

pub use service::OauthService;

pub fn plugin(prefix: &'static str) -> Plugin {
    Plugin::named("OAuth")
        .on_init(async move |mut app| {
            let config = app.config();

            let cookie_key = axum_extra::extract::cookie::Key::derive_from(&config.token_key);

            let ynab_provider = YnabOAuthProvider::new(&config.ynab_base_url);
            let redirect_url = format!("{}{prefix}/callback", config.server_url);
            let http_client = reqwest::ClientBuilder::new()
                .redirect(reqwest::redirect::Policy::none())
                .timeout(Duration::from_secs(10))
                .build()
                .context("reqwest client failed to build")?;
            let oauth_client = SimpleOAuthClient::builder()
                .credentials((&config.ynab_client_id, &config.ynab_secret))
                .provider(ynab_provider)
                .http_client(&http_client)
                .redirect_url(redirect_url)
                .build()?;

            app.insert(cookie_key)?;
            app.insert(service::OauthService::new(oauth_client))?;

            Ok(app)
        })
        .local_setup(move |_app| {
            let router = routes::oauth_routes().layer(Extension(RoutePrefix(prefix)));

            Ok(router)
        })
}

#[derive(Clone)]
struct RoutePrefix(&'static str);
