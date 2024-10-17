## Contribution Guidelines

### Style

- If a component is becoming quite large (more than ~200 lines), break it up into smaller components, and extract functions/hooks where possible.
- If using VSCode, make sure to have the Prettier extension installed, so that the editor auto-formats your code.

### Principles

These are some principles that guide the Peek for YNAB project. Please take a moment to read before submitting an issue or pull request.

- Functionality: The extension tries to focus on features that might be useful when a user is on a different website and wants to quickly check on YNAB and/or add a transaction. While the YNAB API enables a lot of possible functionality, we avoid adding extra features that are tangential to this use case.
- Accessibility: The extension prioritizes accessibility as much as possible: semantic HTML elements, keyboard accessible buttons and forms, proper aria roles and attributes, accessible color contrasts, etc.
- Data Privacy: The extension communicates directly with the YNAB API server (api.ynab.com) to retrieve the user's budget data. It only communicates with the Next.js API routes to retrieve OAuth tokens from YNAB (this needs to happen in a server-only context to protect the OAuth secret).
- Permissions: The extension only uses the minimum amount of [browser permissions](https://developer.chrome.com/docs/extensions/reference/permissions-list) needed to do its basic functionality ([storage](https://developer.chrome.com/docs/extensions/reference/api/storage), [identity](https://developer.chrome.com/docs/extensions/reference/api/identity), and [alarms](https://developer.chrome.com/docs/extensions/reference/api/alarms)). If the user chooses, they can enable other permissions (e.g. reading the [active tab](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab), enabling [system notifications](https://developer.chrome.com/docs/extensions/reference/api/notifications)) in the extension settings.
- API usage: YNAB has generously made their API free to use, and we aim to be respectful of that privilege. The extension tries to stay well under their [rate limit](https://api.ynab.com/#rate-limiting), by implementing some caching and limiting background requests to every 15 minutes.
- Dependencies: The extension is designed to be very lightweight (production zipped build <1 MB), so we carefully consider adding any external dependencies that will increase the extension's bundle size. We prioritize using native browser APIs where possible. When external packages are necessary, we prefer small, well-maintained libraries that perform specific tasks (e.g. React Aria's abstract components).
