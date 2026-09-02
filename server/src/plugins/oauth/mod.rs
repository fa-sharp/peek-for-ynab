use std::time::Duration;

use anyhow::Context;
use axum::Extension;
use oauth2::{ClientId, EndpointNotSet, EndpointSet, basic::BasicClient};
use oauth2_reqwest::ReqwestClient;

use crate::Plugin;

mod routes;
mod service;

pub use service::OauthService;

pub type OauthClient =
    BasicClient<EndpointSet, EndpointNotSet, EndpointNotSet, EndpointSet, EndpointSet>;

pub fn plugin(prefix: &'static str) -> Plugin {
    Plugin::named("OAuth")
        .on_init(async move |mut app| {
            let config = app.config();

            let cookie_key = axum_extra::extract::cookie::Key::derive_from(&config.token_key);

            let auth_url = format!("{}/oauth/authorize", config.ynab_base_url);
            let token_url = format!("{}/oauth/token", config.ynab_base_url);
            let revoke_url = format!("{}/oauth/revoke", config.ynab_base_url);
            let redirect_url = format!("{}{prefix}/callback", config.server_url);
            let oauth_client: OauthClient =
                BasicClient::new(ClientId::new(config.ynab_client_id.clone()))
                    .set_client_secret(oauth2::ClientSecret::new(config.ynab_secret.clone()))
                    .set_auth_uri(oauth2::AuthUrl::new(auth_url)?)
                    .set_token_uri(oauth2::TokenUrl::new(token_url)?)
                    .set_revocation_url(oauth2::RevocationUrl::new(revoke_url)?)
                    .set_redirect_uri(oauth2::RedirectUrl::new(redirect_url)?);

            let reqwest_client = reqwest::ClientBuilder::new()
                .redirect(reqwest::redirect::Policy::none())
                .timeout(Duration::from_secs(10))
                .build()
                .context("reqwest client failed to build")?;
            let http_client = ReqwestClient::from(reqwest_client);

            app.insert(cookie_key)?;
            app.insert(service::OauthService::new(oauth_client, http_client))?;

            Ok(app)
        })
        .local_setup(move |_app| {
            let router = routes::oauth_routes().layer(Extension(RoutePrefix(prefix)));

            Ok(router)
        })
}

#[derive(Clone)]
struct RoutePrefix(&'static str);
