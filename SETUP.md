# Setting up Dynt

Follow these steps when a user installs or activates the Dynt plugin.

1. The plugin registers the remote MCP server `https://api.dynt.ai/mcp` (Streamable HTTP, OAuth 2.1). No API key is needed.
2. On first use the client opens Dynt's sign-in and consent page (`https://app.dynt.ai/oauth/consent`). The user signs in, picks the organization to connect, and decides whether to grant write permission ("Attach or delete proofs and accept suggestions"). Read access is always granted; write tools return a clear permission error without it.
3. Verify the connection by calling `get_current_user` — it returns the organization, role and granted permissions. If it fails with 401, ask the user to reconnect (the grant may have been revoked under Organization → API keys in the app).
4. Suggest a first task from the skills: "Which subscriptions went up in price this year?" (`dynt-subscription-audit`) or "Which transactions this month have no receipt?" (`dynt-receipt-compliance`).

Rules that always apply: every tool is scoped to the connected organization; write tools (`attach_proof`, `attach_proof_from_email`, `delete_proof`, `flag_recurring_transactions`, `accept_all_*_suggestions`) must be confirmed with the user before calling; `delete_proof` is irreversible; Dynt never moves money.

Docs: https://app.dynt.ai/docs/mcp · Privacy: https://app.dynt.ai/privacy · Support: https://app.dynt.ai/support
