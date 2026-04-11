const [repoArg] = process.argv.slice(2);
const token = process.env.GITHUB_TOKEN;
const repo = repoArg ?? process.env.GITHUB_REPOSITORY;

if (!token) {
  console.error('Missing GITHUB_TOKEN environment variable.');
  process.exit(1);
}

if (!repo || !repo.includes('/')) {
  console.error('Usage: node scripts/configure-branch-protection.mjs <owner/repo>');
  process.exit(1);
}

const [owner, name] = repo.split('/');
const headers = {
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${token}`,
  'X-GitHub-Api-Version': '2022-11-28'
};

async function patchRepository() {
  const response = await fetch(`https://api.github.com/repos/${owner}/${name}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      allow_auto_merge: true,
      delete_branch_on_merge: false
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to enable repo auto-merge: ${response.status} ${await response.text()}`);
  }
}

async function protectBranch(branch) {
  const response = await fetch(`https://api.github.com/repos/${owner}/${name}/branches/${branch}/protection`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      required_status_checks: null,
      enforce_admins: true,
      required_pull_request_reviews: {
        dismiss_stale_reviews: true,
        require_code_owner_reviews: false,
        required_approving_review_count: 0,
        require_last_push_approval: false
      },
      restrictions: null,
      required_linear_history: true,
      allow_force_pushes: false,
      allow_deletions: false,
      block_creations: false,
      required_conversation_resolution: true,
      lock_branch: false,
      allow_fork_syncing: true
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to protect ${branch}: ${response.status} ${await response.text()}`);
  }
}

await patchRepository();
await protectBranch('stage');
await protectBranch('main');

console.log(`Configured branch protection for ${repo} on stage and main.`);
