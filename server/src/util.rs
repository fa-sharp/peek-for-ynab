use std::time::SystemTime;

/// Current unix time in seconds
pub fn now_secs() -> u64 {
    SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .expect("invalid system time")
        .as_secs()
}
