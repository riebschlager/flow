# Flow project workflow

Flow's Sites project is `appgprj_6ad2bd4c8af0819199f8a75edc190fd6`.
Its GitHub source mirror is https://github.com/riebschlager/flow.git on `main`.

For every completed source update:

1. Open the current source using the Sites skill and preserve its Git history. Run `node scripts/github-sync-install.mjs` in every new checkout before editing. This installs the tracked post-commit hook locally; it automatically pushes each new commit to GitHub. Git does not copy hook configuration when cloning, so this installation is required in each checkout.
2. Implement and validate the requested change.
3. Use the Sites source workflow to commit, push to Sites, and package the update.
4. Run `node scripts/github-sync.mjs` from the resulting checkout. It pushes the same commit to GitHub and verifies the remote head. Use the user's existing Git authentication; never write credentials into source or remote URLs.
5. Complete the normal Sites publication flow. Before reporting completion, confirm both GitHub synchronization and deployment succeeded. If either fails, report that explicitly.

The user has requested ongoing GitHub pushes as part of updates. Do not defer sync to a separate request. Never force-push or overwrite divergent GitHub history. Inspect and reconcile divergence while preserving changes before retrying. The Sites remote remains required for native publication; GitHub is an additional source destination. Keep these instructions and the sync script in the tracked Sites source so new checkouts retain the workflow.
