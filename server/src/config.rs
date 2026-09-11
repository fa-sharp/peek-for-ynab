use std::net::{IpAddr, Ipv4Addr};

use anyhow::Context;
use reqwest::Url;
use serde::Deserialize;
use serde_with::{StringWithSeparator, formats::CommaSeparator};

#[serde_with::serde_as]
#[derive(Debug, Clone, Deserialize)]
pub struct AppConfig {
    #[serde(default = "default_host")]
    pub host: IpAddr,
    #[serde(default = "default_port")]
    pub port: u16,
    #[serde(default = "default_log_level")]
    pub log_level: String,
    #[serde(default = "default_server_url")]
    pub server_url: String,
    #[serde(default = "default_req_id_header")]
    pub request_id_header: String,

    #[serde_as(as = "serde_with::hex::Hex")]
    pub token_key: [u8; 32],
    pub ynab_client_id: String,
    pub ynab_secret: String,
    #[serde(default = "default_ynab_url")]
    pub ynab_base_url: String,

    #[serde_as(as = "Option<StringWithSeparator::<CommaSeparator, Url>>")]
    pub allowed_origins: Option<Vec<Url>>,
    #[serde_as(as = "Option<StringWithSeparator::<CommaSeparator, Url>>")]
    pub allowed_login_redirects: Option<Vec<Url>>,
}
fn default_host() -> IpAddr {
    IpAddr::V4(Ipv4Addr::LOCALHOST)
}
fn default_port() -> u16 {
    8080
}
fn default_log_level() -> String {
    "info".to_string()
}
fn default_server_url() -> String {
    "http://localhost:8080".to_string()
}
fn default_req_id_header() -> String {
    "x-request-id".to_string()
}
fn default_ynab_url() -> String {
    "https://app.ynab.com".to_string()
}

/// Extract the configuration from env variables prefixed with `PEEK_`.
pub fn extract_config(
    additional: impl IntoIterator<Item = (String, String)>,
) -> anyhow::Result<AppConfig> {
    let mut config = figment::Figment::new().merge(figment::providers::Env::prefixed("PEEK_"));
    for (k, v) in additional {
        config = config.merge((k, v));
    }

    Ok(config
        .extract::<AppConfig>()
        .context("Failed to extract valid configuration")?)
}
