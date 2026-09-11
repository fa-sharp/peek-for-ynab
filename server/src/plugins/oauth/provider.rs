use simple_oauth::SimpleOAuthProvider;

#[derive(Debug)]
pub struct YnabOAuthProvider {
    auth_url: String,
    token_url: String,
    revoke_url: String,
}

impl YnabOAuthProvider {
    pub fn new(base_url: &str) -> Self {
        Self {
            auth_url: format!("{base_url}/oauth/authorize"),
            token_url: format!("{base_url}/oauth/token"),
            revoke_url: format!("{base_url}/oauth/revoke"),
        }
    }
}

impl SimpleOAuthProvider for YnabOAuthProvider {
    fn authorize_url(&self) -> &str {
        &self.auth_url
    }

    fn token_url(&self) -> &str {
        &self.token_url
    }

    fn revoke_url(&self) -> Option<&str> {
        Some(&self.revoke_url)
    }

    fn default_scopes(&self) -> &'static [&'static str] {
        &["public"]
    }
}
